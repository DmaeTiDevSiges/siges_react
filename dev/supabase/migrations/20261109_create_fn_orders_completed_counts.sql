-- ==============================================================================
-- Migration: 20261109_create_fn_orders_completed_counts.sql
-- Gestão > OS's > "Concluídas": as 6 contagens por período (hoje, ontem, esta
-- semana, semana passada, este mês, mês passado) numa única consulta.
-- Antes: 6 consultas em v_orders com count exact a cada atualização da tela.
--
--   • Lê de v_orders (SECURITY INVOKER): a mesma visibilidade por usuário da view.
--   • Mesmos critérios de getCompletedOS: parent_id > 0 AND status_id = 8,
--     período por status_at.
--   • Períodos calculados em America/Sao_Paulo (status_at é hora local sem fuso).
--   • p_filters: { "<coluna de v_orders>": ["id", ...], ..., "search": "texto" }.
--     Só as colunas da lista abaixo são aceitas; as demais chaves são ignoradas.
--
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Reverter: DROP FUNCTION public.fn_orders_completed_counts(jsonb);
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_orders_completed_counts(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today        date := (timezone('America/Sao_Paulo', now()))::date;
    v_monday       date;
    v_month_start  date;
    v_prev_month   date;
    v_from         date;
    v_search       text := NULLIF(btrim(COALESCE(p_filters->>'search', '')), '');
    v_result       jsonb;
BEGIN
    v_monday      := v_today - (EXTRACT(ISODOW FROM v_today)::int - 1);
    v_month_start := date_trunc('month', v_today)::date;
    v_prev_month  := (v_month_start - INTERVAL '1 month')::date;
    v_from        := LEAST(v_monday - 7, v_prev_month);

    WITH f AS (
        SELECT o.status_at
          FROM public.v_orders o
         WHERE o.parent_id > 0
           AND o.status_id = 8
           AND o.status_at >= v_from
           AND o.status_at <  v_today + 1
           AND (NOT (p_filters ? 'system_parent_id')    OR o.system_parent_id    = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'system_parent_id')::bigint)))
           AND (NOT (p_filters ? 'system_id')           OR o.system_id           = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'system_id')::bigint)))
           AND (NOT (p_filters ? 'unit_type_parent_id') OR o.unit_type_parent_id = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'unit_type_parent_id')::bigint)))
           AND (NOT (p_filters ? 'unit_type_id')        OR o.unit_type_id        = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'unit_type_id')::bigint)))
           AND (NOT (p_filters ? 'unit_id')             OR o.unit_id             = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'unit_id')::bigint)))
           AND (NOT (p_filters ? 'asset_tag_id')        OR o.asset_tag_id        = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'asset_tag_id')::bigint)))
           AND (NOT (p_filters ? 'asset_tag_sub_id')    OR o.asset_tag_sub_id    = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'asset_tag_sub_id')::bigint)))
           AND (NOT (p_filters ? 'object_id')           OR o.object_id           = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'object_id')::bigint)))
           AND (NOT (p_filters ? 'type_id')             OR o.type_id             = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'type_id')::bigint)))
           AND (NOT (p_filters ? 'type_sub_id')         OR o.type_sub_id         = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'type_sub_id')::bigint)))
           AND (NOT (p_filters ? 'contract_id')         OR o.contract_id         = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'contract_id')::bigint)))
           AND (NOT (p_filters ? 'plan_id')             OR o.plan_id             = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'plan_id')::bigint)))
           AND (NOT (p_filters ? 'requester_team_id')   OR o.requester_team_id   = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'requester_team_id')::bigint)))
           AND (NOT (p_filters ? 'team_id')             OR o.team_id             = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'team_id')::bigint)))
           AND (NOT (p_filters ? 'priority_id')         OR o.priority_id         = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'priority_id')::bigint)))
           AND (NOT (p_filters ? 'provider_company_id') OR o.provider_company_id = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'provider_company_id')::bigint)))
           AND (NOT (p_filters ? 'cause_reason_id')     OR o.cause_reason_id     = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'cause_reason_id')::bigint)))
           AND (v_search IS NULL OR
                o.order_mask            ILIKE '%' || v_search || '%' OR
                o.unit_description      ILIKE '%' || v_search || '%' OR
                o.type_description      ILIKE '%' || v_search || '%' OR
                o.requested_services    ILIKE '%' || v_search || '%')
    )
    SELECT jsonb_build_object(
               'today',     count(*) FILTER (WHERE status_at >= v_today),
               'yesterday', count(*) FILTER (WHERE status_at >= v_today - 1 AND status_at < v_today),
               'thisWeek',  count(*) FILTER (WHERE status_at >= v_monday),
               'lastWeek',  count(*) FILTER (WHERE status_at >= v_monday - 7 AND status_at < v_monday),
               'thisMonth', count(*) FILTER (WHERE status_at >= v_month_start),
               'lastMonth', count(*) FILTER (WHERE status_at >= v_prev_month AND status_at < v_month_start)
           )
      INTO v_result
      FROM f;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_orders_completed_counts(jsonb) IS
    'Contagens de OS concluídas por período (hoje/ontem/semana/semana passada/mês/mês passado) em America/Sao_Paulo, sobre v_orders.';

REVOKE ALL ON FUNCTION public.fn_orders_completed_counts(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_completed_counts(jsonb) TO authenticated, service_role;

-- Teste rápido (logado no app / com role authenticated):
--   SELECT public.fn_orders_completed_counts('{}');
--   SELECT public.fn_orders_completed_counts('{"contract_id": ["1"], "search": "EBAP"}');
