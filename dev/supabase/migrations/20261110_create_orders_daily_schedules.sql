-- ==============================================================================
-- Migration: 20261110_create_orders_daily_schedules.sql
-- Programação Diária de Atendimento (Gestão > aba Programação).
--
--   • Um registro por contrato + dia (orders_daily_schedules) com a sequência de
--     execução das OSs de cada equipe (orders_daily_schedules_items).
--   • As tabelas guardam SÓ a ordem do dia. Status, equipe e líder continuam na
--     própria OS (orders): autorizar / trocar de equipe grava direto em orders.
--   • A gravação é feita apenas pela RPC fn_orders_daily_schedule_save, que:
--       - exige permissão 'create' na rota 'orders_daily_schedule' (canCreate);
--       - recusa dias passados (somente leitura);
--       - recusa OS de outro contrato, fora dos status 3/4/5/6 ou com equipe
--         diferente da coluna onde está (orders.team_id é a fonte da verdade).
--   • Leitura: quem tem 'view' na rota.
--   • Prioridade de atendimento do dia (orders_daily_schedules_priorities) — fim do arquivo.
--
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Depois de aplicar, conceda can_view / can_create da rota 'orders_daily_schedule'
-- aos perfis desejados em Permissões (super admin já enxerga).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- Rota / permissão
-- ------------------------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

INSERT INTO public.cfg_routes (
    route_key,
    route_path,
    description,
    icon,
    parent_id,
    order_index,
    is_available
)
VALUES (
    'orders_daily_schedule',
    '/orders_daily_schedule',
    'Programação Diária de Atendimento (Gestão - aba Programação)',
    'view_kanban',
    (SELECT id FROM public.cfg_routes WHERE route_key = 'orders'),
    25,
    true
)
ON CONFLICT (route_key) DO NOTHING;

-- Rota já criada com o caminho antigo (/dashboard/orders-daily-schedule).
UPDATE public.cfg_routes
   SET route_path = '/orders_daily_schedule'
 WHERE route_key = 'orders_daily_schedule'
   AND route_path IS DISTINCT FROM '/orders_daily_schedule';

-- ------------------------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders_daily_schedules (
    id               BIGSERIAL PRIMARY KEY,
    contract_id      BIGINT NOT NULL REFERENCES public.contracts (id),
    schedule_date    DATE   NOT NULL,
    created_user_id  BIGINT REFERENCES public.users (id),
    updated_user_id  BIGINT REFERENCES public.users (id),
    created_at       TIMESTAMP NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    updated_at       TIMESTAMP NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    CONSTRAINT uq_orders_daily_schedules_contract_date UNIQUE (contract_id, schedule_date)
);

COMMENT ON TABLE public.orders_daily_schedules IS
    'Programação diária de atendimento: um registro por contrato e dia.';

CREATE TABLE IF NOT EXISTS public.orders_daily_schedules_items (
    id           BIGSERIAL PRIMARY KEY,
    schedule_id  BIGINT  NOT NULL REFERENCES public.orders_daily_schedules (id) ON DELETE CASCADE,
    order_id     BIGINT  NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
    team_id      BIGINT  NOT NULL REFERENCES public.cfg_teams (id),
    position     INTEGER NOT NULL CHECK (position > 0),
    CONSTRAINT uq_orders_daily_schedules_items_order UNIQUE (schedule_id, order_id)
);

COMMENT ON TABLE public.orders_daily_schedules_items IS
    'Sequência de execução (position, 1..n por equipe) das OSs de um dia programado.';

CREATE INDEX IF NOT EXISTS idx_orders_daily_schedules_items_schedule
    ON public.orders_daily_schedules_items (schedule_id, team_id, position);

CREATE INDEX IF NOT EXISTS idx_orders_daily_schedules_items_order
    ON public.orders_daily_schedules_items (order_id);

-- ------------------------------------------------------------------------------
-- RLS: leitura por permissão de rota; gravação só pela RPC
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders_daily_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_daily_schedules_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_daily_schedules_select ON public.orders_daily_schedules;
CREATE POLICY orders_daily_schedules_select ON public.orders_daily_schedules
    FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('orders_daily_schedule', 'view'));

DROP POLICY IF EXISTS orders_daily_schedules_items_select ON public.orders_daily_schedules_items;
CREATE POLICY orders_daily_schedules_items_select ON public.orders_daily_schedules_items
    FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('orders_daily_schedule', 'view'));

REVOKE ALL ON public.orders_daily_schedules, public.orders_daily_schedules_items FROM anon;
GRANT SELECT ON public.orders_daily_schedules, public.orders_daily_schedules_items TO authenticated;
GRANT ALL ON public.orders_daily_schedules, public.orders_daily_schedules_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_daily_schedules_id_seq,
                                public.orders_daily_schedules_items_id_seq TO service_role;

-- ------------------------------------------------------------------------------
-- RPC: grava a programação completa do dia (substitui os itens de uma vez)
--   p_items: array ordenado [{ "order_id": 123, "team_id": 4 }, ...]
--   A posição é a ordem de cada OS dentro da própria equipe (1..n).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_orders_daily_schedule_save(
    p_contract_id BIGINT,
    p_date        DATE,
    p_items       JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id     BIGINT;
    v_schedule_id BIGINT;
    v_today       DATE := (timezone('America/Sao_Paulo', now()))::date;
    v_bad         RECORD;
BEGIN
    IF NOT public.fc_has_route_permission('orders_daily_schedule', 'create') THEN
        RAISE EXCEPTION 'Sem permissão para programar (criar) a programação diária.' USING ERRCODE = '42501';
    END IF;

    IF p_contract_id IS NULL OR p_date IS NULL THEN
        RAISE EXCEPTION 'Contrato e data são obrigatórios.' USING ERRCODE = '22023';
    END IF;

    IF p_date < v_today THEN
        RAISE EXCEPTION 'Dias passados são somente leitura.' USING ERRCODE = '22023';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'Itens inválidos.' USING ERRCODE = '22023';
    END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;

    -- Valida cada item contra a OS real.
    SELECT o.order_mask, i.order_id, o.contract_id, o.status_id, o.team_id, i.team_id AS item_team_id
      INTO v_bad
      FROM (
            SELECT (e.elem ->> 'order_id')::BIGINT AS order_id,
                   (e.elem ->> 'team_id')::BIGINT  AS team_id
              FROM jsonb_array_elements(p_items) AS e(elem)
           ) i
      LEFT JOIN public.orders o ON o.id = i.order_id
     WHERE o.id IS NULL
        OR o.contract_id IS DISTINCT FROM p_contract_id
        OR o.parent_id IS NULL
        OR o.status_id NOT IN (3, 4, 5, 6)
        OR o.team_id IS DISTINCT FROM i.team_id
     LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'OS % não pode ser programada nesta coluna (situação ou equipe mudou). Recarregue a tela.',
            COALESCE(v_bad.order_mask, v_bad.order_id::text)
            USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.orders_daily_schedules (contract_id, schedule_date, created_user_id, updated_user_id)
    VALUES (p_contract_id, p_date, v_user_id, v_user_id)
    ON CONFLICT (contract_id, schedule_date)
    DO UPDATE SET updated_user_id = EXCLUDED.updated_user_id,
                  updated_at      = timezone('America/Sao_Paulo', now())
    RETURNING id INTO v_schedule_id;

    -- Serializa gravações concorrentes do mesmo dia.
    PERFORM 1 FROM public.orders_daily_schedules WHERE id = v_schedule_id FOR UPDATE;

    DELETE FROM public.orders_daily_schedules_items WHERE schedule_id = v_schedule_id;

    INSERT INTO public.orders_daily_schedules_items (schedule_id, order_id, team_id, position)
    SELECT v_schedule_id,
           i.order_id,
           i.team_id,
           ROW_NUMBER() OVER (PARTITION BY i.team_id ORDER BY i.ord)
      FROM (
            SELECT (e.elem ->> 'order_id')::BIGINT AS order_id,
                   (e.elem ->> 'team_id')::BIGINT  AS team_id,
                   e.ord
              FROM jsonb_array_elements(p_items) WITH ORDINALITY AS e(elem, ord)
           ) i
    ON CONFLICT (schedule_id, order_id) DO NOTHING;

    RETURN v_schedule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_daily_schedule_save(BIGINT, DATE, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_daily_schedule_save(BIGINT, DATE, JSONB) TO authenticated, service_role;

-- ==============================================================================
-- Prioridade de atendimento do dia (faixa "OS's PRIORITÁRIAS")
--   Registrada por contrato + dia (no mesmo cabeçalho orders_daily_schedules).
--   Dia sem registro: o app parte da última prioridade registrada antes dele.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders_daily_schedules_priorities (
    id           BIGSERIAL PRIMARY KEY,
    schedule_id  BIGINT  NOT NULL REFERENCES public.orders_daily_schedules (id) ON DELETE CASCADE,
    order_id     BIGINT  NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
    position     INTEGER NOT NULL CHECK (position > 0),
    CONSTRAINT uq_orders_daily_schedules_priorities_order UNIQUE (schedule_id, order_id)
);

COMMENT ON TABLE public.orders_daily_schedules_priorities IS
    'Ordem de prioridade de atendimento das OSs abertas no dia programado (1 = mais prioritária).';

CREATE INDEX IF NOT EXISTS idx_orders_daily_schedules_priorities_schedule
    ON public.orders_daily_schedules_priorities (schedule_id, position);

ALTER TABLE public.orders_daily_schedules_priorities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_daily_schedules_priorities_select ON public.orders_daily_schedules_priorities;
CREATE POLICY orders_daily_schedules_priorities_select ON public.orders_daily_schedules_priorities
    FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('orders_daily_schedule', 'view'));

REVOKE ALL ON public.orders_daily_schedules_priorities FROM anon;
GRANT SELECT ON public.orders_daily_schedules_priorities TO authenticated;
GRANT ALL ON public.orders_daily_schedules_priorities TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_daily_schedules_priorities_id_seq TO service_role;

-- RPC: grava a prioridade completa do dia (p_order_ids na ordem, da mais para a menos prioritária).
-- Recusa dias passados; ignora OSs de outro contrato ou que já não estão abertas (7/8).
CREATE OR REPLACE FUNCTION public.fn_orders_daily_priorities_save(
    p_contract_id BIGINT,
    p_date        DATE,
    p_order_ids   BIGINT[]
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id     BIGINT;
    v_schedule_id BIGINT;
    v_today       DATE := (timezone('America/Sao_Paulo', now()))::date;
BEGIN
    IF NOT public.fc_has_route_permission('orders_daily_schedule', 'create') THEN
        RAISE EXCEPTION 'Sem permissão para ordenar as prioridades da programação diária.' USING ERRCODE = '42501';
    END IF;

    IF p_contract_id IS NULL OR p_date IS NULL THEN
        RAISE EXCEPTION 'Contrato e data são obrigatórios.' USING ERRCODE = '22023';
    END IF;

    IF p_date < v_today THEN
        RAISE EXCEPTION 'Dias passados são somente leitura.' USING ERRCODE = '22023';
    END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;

    INSERT INTO public.orders_daily_schedules (contract_id, schedule_date, created_user_id, updated_user_id)
    VALUES (p_contract_id, p_date, v_user_id, v_user_id)
    ON CONFLICT (contract_id, schedule_date)
    DO UPDATE SET updated_user_id = EXCLUDED.updated_user_id,
                  updated_at      = timezone('America/Sao_Paulo', now())
    RETURNING id INTO v_schedule_id;

    -- Serializa gravações concorrentes do mesmo dia.
    PERFORM 1 FROM public.orders_daily_schedules WHERE id = v_schedule_id FOR UPDATE;

    DELETE FROM public.orders_daily_schedules_priorities WHERE schedule_id = v_schedule_id;

    INSERT INTO public.orders_daily_schedules_priorities (schedule_id, order_id, position)
    SELECT v_schedule_id,
           x.order_id,
           ROW_NUMBER() OVER (ORDER BY x.ord)
      FROM (
            SELECT DISTINCT ON (u.order_id) u.order_id, u.ord
              FROM unnest(COALESCE(p_order_ids, ARRAY[]::BIGINT[])) WITH ORDINALITY AS u(order_id, ord)
             ORDER BY u.order_id, u.ord
           ) x
      JOIN public.orders o ON o.id = x.order_id
     WHERE o.contract_id = p_contract_id
       AND o.parent_id IS NOT NULL
       AND o.status_id NOT IN (7, 8);

    RETURN v_schedule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_daily_priorities_save(BIGINT, DATE, BIGINT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_daily_priorities_save(BIGINT, DATE, BIGINT[]) TO authenticated, service_role;

-- ==============================================================================
-- Meu Painel (líder): OSs programadas no dia para a equipe do usuário logado.
--   SECURITY DEFINER: o líder não precisa de permissão na rota da Programação;
--   só enxerga a sequência da PRÓPRIA equipe (users.team_id).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_orders_daily_schedule_my_day(
    p_date DATE DEFAULT NULL
)
RETURNS TABLE (
    order_id      BIGINT,
    team_id       BIGINT,
    "position"    INTEGER,  -- entre aspas: position é palavra reservada em RETURNS TABLE
    schedule_date DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT i.order_id, i.team_id, i.position, s.schedule_date
      FROM public.orders_daily_schedules s
      JOIN public.orders_daily_schedules_items i ON i.schedule_id = s.id
      JOIN public.orders o ON o.id = i.order_id
     WHERE s.schedule_date = COALESCE(p_date, (timezone('America/Sao_Paulo', now()))::date)
       AND i.team_id = (SELECT u.team_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1)
       AND o.status_id NOT IN (7, 8)
     ORDER BY i.position;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_daily_schedule_my_day(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_daily_schedule_my_day(DATE) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- Limpeza: versão anterior deste arquivo usava fila de prioridade por contrato.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_orders_contract_priorities_save(BIGINT, BIGINT[]);
DROP TABLE IF EXISTS public.orders_contracts_priorities;

COMMIT;

-- Recarrega o cache de schema da API (PostgREST) para enxergar as tabelas novas.
NOTIFY pgrst, 'reload schema';
