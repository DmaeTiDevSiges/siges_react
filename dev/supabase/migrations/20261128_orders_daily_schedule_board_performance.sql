-- ==============================================================================
-- Migration: 20261128_orders_daily_schedule_board_performance.sql
-- Desempenho da Programação Diária (Gestão > aba Programação).
--
--   1. v_orders_daily_schedule: visão ENXUTA só com o que o cartão da programação
--      usa. A v_orders tem ~25 junções; aqui ficam só as junções obrigatórias da
--      v_orders (para trazer exatamente as mesmas OSs) e as 4 opcionais do cartão.
--      security_invoker: respeita a RLS de quem consulta, como a v_orders.
--   2. fn_orders_daily_schedule_board(contrato, dia, só_leitura): devolve num único
--      JSON o cabeçalho do dia, a sequência das equipes, a prioridade (ou a herdada
--      do último dia registrado) e as OSs — uma ida ao banco em vez de 5 a 30+.
--      SECURITY INVOKER: mesmas permissões das consultas diretas.
--   3. Índice parcial das OSs abertas por contrato (status fora de 7/8).
--
-- O app funciona sem esta migration (cai nas consultas diretas); com ela aplicada,
-- passa a usar a RPC sozinho.
-- Depende da 20261110. Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Reverter: 20261128_orders_daily_schedule_board_performance_DOWN.sql
--
-- ANTES de aplicar, confira no banco vivo que as colunas abaixo existem em orders
-- (o schema.sql pode estar defasado):
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'orders'
--      AND column_name IN ('type_id','type_sub_id','status_id','priority_id','unit_id',
--          'system_parent_id','system_id','unit_type_parent_id','unit_type_id',
--          'object_id','asset_tag_id','asset_tag_sub_id','team_id','team_leader_id',
--          'contract_id','parent_id','order_mask','status_at','requested_at','requested_services');
--   (devem voltar as 20)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Visão enxuta das OSs para a programação
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_orders_daily_schedule WITH (security_invoker = true) AS
SELECT
    o.id,
    o.contract_id,
    o.parent_id,
    o.order_mask,
    o.status_id,
    os.code         AS status_code,
    os.description  AS status_description,
    o.status_at,
    o.team_id,
    o.team_leader_id,
    op.code         AS priority_code,
    op.description  AS priority_description,
    o.unit_id,
    u.description_full AS unit_description,
    o.asset_tag_id,
    at.description  AS asset_tag_description,
    ats.description AS asset_tag_sub_description,
    o.requested_services,
    ot.code         AS type_code,
    ots.code        AS type_sub_code,
    oo.code         AS object_code,
    o.requested_at
FROM public.orders o
     -- Junções obrigatórias (as mesmas INNER JOIN da v_orders: mesmas OSs no resultado).
     JOIN public.cfg_orders_types       ot  ON ot.id  = o.type_id
     JOIN public.cfg_orders_statuses    os  ON os.id  = o.status_id
     JOIN public.cfg_orders_priorities  op  ON op.id  = o.priority_id
     JOIN public.units                  u   ON u.id   = o.unit_id
     JOIN public.cfg_systems            sp  ON sp.id  = o.system_parent_id
     JOIN public.cfg_systems            s   ON s.id   = o.system_id
     JOIN public.cfg_units_types        utp ON utp.id = o.unit_type_parent_id
     JOIN public.cfg_units_types        ut  ON ut.id  = o.unit_type_id
     -- Opcionais usadas no cartão.
LEFT JOIN public.cfg_orders_types_subs  ots ON ots.id = o.type_sub_id
LEFT JOIN public.cfg_orders_objects     oo  ON oo.id  = o.object_id
LEFT JOIN public.cfg_assets_tags        at  ON at.id  = o.asset_tag_id
LEFT JOIN public.cfg_assets_tags_subs   ats ON ats.id = o.asset_tag_sub_id;

COMMENT ON VIEW public.v_orders_daily_schedule IS
    'OSs com só os campos do cartão da Programação Diária (versão enxuta da v_orders).';

REVOKE ALL ON public.v_orders_daily_schedule FROM anon;
GRANT SELECT ON public.v_orders_daily_schedule TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. RPC: quadro do dia num único JSON
--   {
--     "schedule":       { "id", "updated_at" } | null,
--     "items":          [{ "order_id", "team_id", "position" }],
--     "priorities":     [{ "order_id", "position" }],
--     "inherited_from": "YYYY-MM-DD" | null,   -- dia sem registro: de onde veio a prioridade
--     "orders":         [ linhas da v_orders_daily_schedule ]
--   }
--   p_read_only = true (dia passado): orders = só as registradas no dia; sem herança.
--   Senão: orders = OSs abertas do contrato (parent_id não nulo, status fora de 7/8).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_orders_daily_schedule_board(
    p_contract_id BIGINT,
    p_date        DATE,
    p_read_only   BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_schedule_id  BIGINT;
    v_updated_at   TIMESTAMP;
    v_source_id    BIGINT;   -- cabeçalho de onde vem a prioridade (o do dia ou o herdado)
    v_inherited    DATE;
    v_items        jsonb := '[]'::jsonb;
    v_priorities   jsonb := '[]'::jsonb;
    v_orders       jsonb := '[]'::jsonb;
    v_ids          BIGINT[];
BEGIN
    IF p_contract_id IS NULL OR p_date IS NULL THEN
        RAISE EXCEPTION 'Contrato e data são obrigatórios.' USING ERRCODE = '22023';
    END IF;

    SELECT s.id, s.updated_at
      INTO v_schedule_id, v_updated_at
      FROM public.orders_daily_schedules s
     WHERE s.contract_id = p_contract_id
       AND s.schedule_date = p_date;

    IF v_schedule_id IS NOT NULL THEN
        v_source_id := v_schedule_id;
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                   'order_id', i.order_id, 'team_id', i.team_id, 'position', i.position)), '[]'::jsonb)
          INTO v_items
          FROM public.orders_daily_schedules_items i
         WHERE i.schedule_id = v_schedule_id;
    ELSIF NOT p_read_only THEN
        -- Dia SEM registro nenhum: última prioridade registrada antes dele.
        -- (Dia com registro e prioridade vazia = esvaziada de propósito: não herda.)
        SELECT s.id, s.schedule_date
          INTO v_source_id, v_inherited
          FROM public.orders_daily_schedules s
         WHERE s.contract_id = p_contract_id
           AND s.schedule_date < p_date
           AND EXISTS (SELECT 1 FROM public.orders_daily_schedules_priorities p WHERE p.schedule_id = s.id)
         ORDER BY s.schedule_date DESC
         LIMIT 1;
    END IF;

    IF v_source_id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object('order_id', p.order_id, 'position', p.position)), '[]'::jsonb)
          INTO v_priorities
          FROM public.orders_daily_schedules_priorities p
         WHERE p.schedule_id = v_source_id;
    END IF;

    IF p_read_only THEN
        SELECT array_agg(DISTINCT x.order_id)
          INTO v_ids
          FROM (
                SELECT (e ->> 'order_id')::BIGINT AS order_id FROM jsonb_array_elements(v_items) e
                UNION
                SELECT (e ->> 'order_id')::BIGINT FROM jsonb_array_elements(v_priorities) e
               ) x;
        IF v_ids IS NOT NULL THEN
            SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.requested_at), '[]'::jsonb)
              INTO v_orders
              FROM public.v_orders_daily_schedule v
             WHERE v.id = ANY (v_ids);
        END IF;
    ELSE
        SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.requested_at), '[]'::jsonb)
          INTO v_orders
          FROM public.v_orders_daily_schedule v
         WHERE v.contract_id = p_contract_id
           AND v.parent_id IS NOT NULL
           AND v.status_id NOT IN (7, 8);
    END IF;

    RETURN jsonb_build_object(
        'schedule',       CASE WHEN v_schedule_id IS NULL THEN NULL
                               ELSE jsonb_build_object('id', v_schedule_id, 'updated_at', v_updated_at) END,
        'items',          v_items,
        'priorities',     v_priorities,
        'inherited_from', v_inherited,
        'orders',         v_orders
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_daily_schedule_board(BIGINT, DATE, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_daily_schedule_board(BIGINT, DATE, BOOLEAN) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Índice: OSs abertas por contrato (o filtro da faixa ABERTAS/PRIORIDADE).
--    Já existe idx_orders_contract_parent_requested (contract_id, requested_at DESC)
--    WHERE parent_id IS NOT NULL — este pula também as concluídas/canceladas (7/8),
--    que são a maioria com o tempo. Cria com lock de escrita breve em orders.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_contract_open_requested
    ON public.orders (contract_id, requested_at)
    WHERE parent_id IS NOT NULL AND status_id NOT IN (7, 8);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- Conferência (opcional), troque 123 por um contrato real:
--   SELECT jsonb_array_length(fn_orders_daily_schedule_board(123, current_date) -> 'orders');
--   EXPLAIN ANALYZE SELECT * FROM v_orders_daily_schedule
--    WHERE contract_id = 123 AND parent_id IS NOT NULL AND status_id NOT IN (7, 8);
-- ------------------------------------------------------------------------------
