-- ==============================================================================
-- Migration: 20261114_create_fn_orders_visits_dashboard_summary.sql
-- Gestão > Visitas: contadores, totais e gráficos calculados no banco, para a
-- tela paginar a lista de verdade (antes ela baixava TODAS as visitas do
-- período de v_orders_visits, 100 por página, e calculava tudo no navegador).
--
-- fn_orders_visits_dashboard_summary devolve, para o período/filtros/busca:
--   all            {count, total}           — card "Todos"
--   stages         {"<processing_id>": {count, total}}  (etapa 5: total só de
--                                             custos aprovados — regra da tela)
--   costsRejected  {count, total}           — etapa 5 com custos rejeitados
--   costsPending   {count, total}           — etapa 5 com custos pendentes/aguardando/nulos
--   selection      {count}                  — visitas das etapas selecionadas
--   composition    [{label, value}]         — total por plano (seleção)
--   trend          [{day, count}]           — visitas iniciadas por dia, últimos 10 dias com visita (seleção)
--   units          [{label, value}]         — total por unidade (seleção)
--   appropriationIds [id...]                — visitas usadas nas apropriações
--                                             (serviços/materiais/veículos/movimentações)
--
-- Mesmas regras de dashboardService.getOrdersVisitsView + OrdersVisitsDashboardAdmin:
--   período: ov_started_at no intervalo, ou (sem início) o_requested_at;
--   busca: ov_mask, o_unit_description, client_name, o_mask, ov_team_leader_name_short;
--   seleção: etapas marcadas OU 'costs-pending'/'costs-rejected' (só etapa 5);
--   apropriação: se a etapa 5 está marcada → só custos aprovados; senão se
--     'costs-pending' → pendentes; senão se 'costs-rejected' → rejeitados; senão todas.
-- Obs.: v_orders_visits não tem o_unit_type_id — o filtro "tipo de unidade" é ignorado.
--
-- SECURITY INVOKER: lê v_orders_visits com a visibilidade do próprio usuário.
-- Requer fn_orders_dashboard_filter_ids (recriada aqui, idêntica à de 20261110).
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: DROP FUNCTION public.fn_orders_visits_dashboard_summary(jsonb, text, text, text, text[], boolean);
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_orders_dashboard_filter_ids(p_filters jsonb, p_key text)
RETURNS bigint[]
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_filters IS NULL
          OR NOT (p_filters ? p_key)
          OR jsonb_typeof(p_filters -> p_key) = 'null'
        THEN NULL
        ELSE (
            SELECT CASE
                       WHEN count(*) = 0 THEN NULL
                       ELSE COALESCE(array_agg(v::bigint) FILTER (WHERE v ~ '^-?[0-9]+$'), '{}'::bigint[])
                   END
              FROM jsonb_array_elements_text(
                       CASE WHEN jsonb_typeof(p_filters -> p_key) = 'array'
                            THEN p_filters -> p_key
                            ELSE jsonb_build_array(p_filters ->> p_key)
                       END
                   ) AS t(v)
             WHERE lower(v) NOT IN ('', 'null', 'undefined')
        )
    END;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_dashboard_filter_ids(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_dashboard_filter_ids(jsonb, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_orders_visits_dashboard_summary(
    p_filters   jsonb   DEFAULT '{}'::jsonb,
    p_start     text    DEFAULT NULL,
    p_end       text    DEFAULT NULL,
    p_search    text    DEFAULT NULL,
    p_selection text[]  DEFAULT NULL,
    p_is_all    boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today    date := (timezone('America/Sao_Paulo', now()))::date;
    v_start    timestamp;
    v_end      timestamp;
    v_search   text := NULLIF(btrim(COALESCE(p_search, '')), '');
    v_sel      text[] := COALESCE(p_selection, '{}'::text[]);
    v_stage_ids int[];
    v_cp       boolean;
    v_cr       boolean;
    v_approved boolean;
    v_result   jsonb;
BEGIN
    -- Mesmo formato do app: 'AAAA-MM-DD' (início 00:00:00, fim 23:59:59) ou já com hora.
    v_start := CASE
        WHEN NULLIF(p_start, '') IS NULL THEN date_trunc('month', v_today)::timestamp
        WHEN p_start ~ '[T ]' THEN replace(p_start, 'T', ' ')::timestamp
        ELSE (p_start || ' 00:00:00')::timestamp END;
    v_end := CASE
        WHEN NULLIF(p_end, '') IS NULL THEN ((date_trunc('month', v_today) + INTERVAL '1 month')::date - 1 || ' 23:59:59')::timestamp
        WHEN p_end ~ '[T ]' THEN replace(p_end, 'T', ' ')::timestamp
        ELSE (p_end || ' 23:59:59')::timestamp END;

    v_stage_ids := ARRAY(SELECT s::int FROM unnest(v_sel) s WHERE s ~ '^[0-9]+$');
    v_cp := 'costs-pending'  = ANY (v_sel);
    v_cr := 'costs-rejected' = ANY (v_sel);
    v_approved := '5' = ANY (v_sel);

    WITH f AS MATERIALIZED (
        SELECT
            public.fn_orders_dashboard_filter_ids(p_filters, 'contractId')        AS contract_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'systemParentId')    AS system_parent_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'systemId')          AS system_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'unitTypeParentId')  AS unit_type_parent_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'unitId')            AS unit_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'orderObjectId')     AS object_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'orderTypeId')       AS type_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'orderTypeSubId')    AS type_sub_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'assetTagId')        AS asset_tag_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'assetTagSubId')     AS asset_tag_sub_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'causeReasonId')     AS cause_reason_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'orderPlanId')       AS plan_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'orderTeamId')       AS order_team_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'responsibleTeamId') AS responsible_team_ids,
            public.fn_orders_dashboard_filter_ids(p_filters, 'providerCompanyId') AS provider_company_ids
    ),
    base AS MATERIALIZED (
        SELECT o.id,
               o.ov_processing_id                      AS proc,
               o.ov_costs_status                       AS costs,
               COALESCE(o.ov_total_value, 0)::numeric  AS total,
               o.o_plan_description                    AS plan_label,
               o.o_unit_description                    AS unit_label,
               o.ov_started_at
          FROM public.v_orders_visits o
          CROSS JOIN f
         WHERE (o.ov_started_at >= v_start OR (o.ov_started_at IS NULL AND o.o_requested_at >= v_start))
           AND (o.ov_started_at <= v_end   OR (o.ov_started_at IS NULL AND o.o_requested_at <= v_end))
           AND (f.contract_ids         IS NULL OR o.o_contract_id         = ANY (f.contract_ids))
           AND (f.system_parent_ids    IS NULL OR o.o_system_parent_id    = ANY (f.system_parent_ids))
           AND (f.system_ids           IS NULL OR o.o_system_id           = ANY (f.system_ids))
           AND (f.unit_type_parent_ids IS NULL OR o.o_unit_type_parent_id = ANY (f.unit_type_parent_ids))
           AND (f.unit_ids             IS NULL OR o.o_unit_id             = ANY (f.unit_ids))
           AND (f.object_ids           IS NULL OR o.o_object_id           = ANY (f.object_ids))
           AND (f.type_ids             IS NULL OR o.o_type_id             = ANY (f.type_ids))
           AND (f.type_sub_ids         IS NULL OR o.o_type_sub_id         = ANY (f.type_sub_ids))
           AND (f.asset_tag_ids        IS NULL OR o.o_asset_tag_id        = ANY (f.asset_tag_ids))
           AND (f.asset_tag_sub_ids    IS NULL OR o.o_asset_tag_sub_id    = ANY (f.asset_tag_sub_ids))
           AND (f.cause_reason_ids     IS NULL OR o.o_cause_reason_id     = ANY (f.cause_reason_ids))
           AND (f.plan_ids             IS NULL OR o.o_plan_id             = ANY (f.plan_ids))
           AND (f.order_team_ids       IS NULL OR o.o_team_id             = ANY (f.order_team_ids))
           AND (f.responsible_team_ids IS NULL OR o.o_team_id             = ANY (f.responsible_team_ids))
           AND (f.provider_company_ids IS NULL OR o.o_provider_company_id = ANY (f.provider_company_ids))
           AND (v_search IS NULL
                OR o.ov_mask                   ILIKE '%' || v_search || '%'
                OR o.o_unit_description        ILIKE '%' || v_search || '%'
                OR o.client_name               ILIKE '%' || v_search || '%'
                OR o.o_mask                    ILIKE '%' || v_search || '%'
                OR o.ov_team_leader_name_short ILIKE '%' || v_search || '%')
    ),
    sel AS MATERIALIZED (
        SELECT b.*
          FROM base b
         WHERE p_is_all
            OR b.proc = ANY (v_stage_ids)
            OR (v_cp AND b.proc = 5 AND (b.costs IS NULL OR b.costs IN ('pending', 'waiting')))
            OR (v_cr AND b.proc = 5 AND b.costs = 'rejected')
    ),
    appr AS (
        SELECT s.id
          FROM sel s
         WHERE CASE
                   WHEN v_approved THEN s.costs = 'approved'
                   WHEN v_cp       THEN s.costs IS NULL OR s.costs IN ('pending', 'waiting')
                   WHEN v_cr       THEN s.costs = 'rejected'
                   ELSE true
               END
    )
    SELECT jsonb_build_object(
        'all', (SELECT jsonb_build_object('count', count(*), 'total', COALESCE(sum(total), 0)) FROM base),
        'stages', COALESCE((
            SELECT jsonb_object_agg(proc::text, jsonb_build_object(
                       'count', cnt,
                       'total', tot))
              FROM (SELECT proc,
                           count(*) AS cnt,
                           COALESCE(sum(total) FILTER (WHERE proc <> 5 OR costs = 'approved'), 0) AS tot
                      FROM base WHERE proc IS NOT NULL GROUP BY proc) st
        ), '{}'::jsonb),
        'costsRejected', (SELECT jsonb_build_object('count', count(*), 'total', COALESCE(sum(total), 0))
                            FROM base WHERE proc = 5 AND costs = 'rejected'),
        'costsPending',  (SELECT jsonb_build_object('count', count(*), 'total', COALESCE(sum(total), 0))
                            FROM base WHERE proc = 5 AND (costs IS NULL OR costs IN ('pending', 'waiting'))),
        'selection', (SELECT jsonb_build_object('count', count(*)) FROM sel),
        'composition', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY value DESC, label)
              FROM (SELECT COALESCE(NULLIF(plan_label, ''), 'Sem Plano') AS label, sum(total) AS value
                      FROM sel GROUP BY 1) c
        ), '[]'::jsonb),
        'trend', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day)
              FROM (SELECT ov_started_at::date AS day, count(*) AS cnt
                      FROM sel WHERE ov_started_at IS NOT NULL
                     GROUP BY 1 ORDER BY 1 DESC LIMIT 10) t
        ), '[]'::jsonb),
        'units', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY value DESC, label)
              FROM (SELECT COALESCE(NULLIF(unit_label, ''), 'Sem Unidade') AS label, sum(total) AS value
                      FROM sel GROUP BY 1) u
        ), '[]'::jsonb),
        'appropriationIds', COALESCE((SELECT jsonb_agg(id ORDER BY id) FROM appr), '[]'::jsonb)
    )
      INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_orders_visits_dashboard_summary(jsonb, text, text, text, text[], boolean) IS
    'Gestão > Visitas: contadores, totais, gráficos e ids de apropriação sobre v_orders_visits (período/filtros/busca/seleção de etapas).';

REVOKE ALL ON FUNCTION public.fn_orders_visits_dashboard_summary(jsonb, text, text, text, text[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_visits_dashboard_summary(jsonb, text, text, text, text[], boolean) TO authenticated, service_role;

COMMIT;

-- Teste (logado / role authenticated):
--   SELECT public.fn_orders_visits_dashboard_summary('{}', '2026-11-01', '2026-11-30', NULL, NULL, true);
--   SELECT public.fn_orders_visits_dashboard_summary('{"contractId":["1"]}', '2026-11-01', '2026-11-30', 'EBAP', ARRAY['5','costs-pending'], false);
