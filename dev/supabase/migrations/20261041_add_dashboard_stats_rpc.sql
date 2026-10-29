-- Agrega os dados dos cards e indicadores no banco, evitando trazer todas as
-- SS/OS para o navegador para calcular contagens e agrupamentos.
-- Requer cfg_departments.clients_ids e o escopo em public.v_orders.
-- Aplicar apos 20261039_scope_v_orders_parent_by_user_clients.sql e
-- 20261040_scope_v_orders_by_user_clients.sql.
--
-- Aplicar manualmente no SQL Editor do Supabase antes de publicar o app que
-- chama fn_orders_dashboard_stats.

SET lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.fn_orders_dashboard_filter_id(
    p_filters jsonb,
    p_key text,
    p_value bigint
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
    SELECT CASE
        WHEN p_filters IS NULL
          OR NOT (p_filters ? p_key)
          OR p_filters -> p_key = 'null'::jsonb
          OR p_filters -> p_key = '""'::jsonb
          OR p_filters -> p_key = '[]'::jsonb
          OR lower(p_filters ->> p_key) IN ('null', 'undefined')
        THEN true
        WHEN jsonb_typeof(p_filters -> p_key) = 'array'
        THEN NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(p_filters -> p_key) AS items(value)
            WHERE lower(value) NOT IN ('', 'null', 'undefined')
        ) OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(p_filters -> p_key) AS items(value)
            WHERE lower(value) NOT IN ('', 'null', 'undefined')
              AND value = p_value::text
        )
        ELSE p_filters ->> p_key = p_value::text
    END;
$$;

CREATE OR REPLACE FUNCTION public.fn_orders_dashboard_stats(
    p_filters jsonb DEFAULT '{}'::jsonb,
    p_ss_filters jsonb DEFAULT NULL,
    p_os_filters jsonb DEFAULT NULL,
    p_parent_view boolean DEFAULT false,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_skip_ss boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
WITH
clock AS (
    SELECT timezone('America/Sao_Paulo', now())::date AS today
),
effective_ss_filters AS (
    SELECT COALESCE(p_ss_filters, p_filters, '{}'::jsonb) AS filters
),
effective_os_filters AS (
    SELECT COALESCE(p_os_filters, p_filters, '{}'::jsonb) AS filters
),
source_orders AS NOT MATERIALIZED (
    SELECT
        o.requested_at,
        o.status_id,
        o.parent_id,
        o.asset_tag_id,
        o.asset_tag_description,
        o.system_parent_id,
        o.system_id,
        o.unit_type_parent_id,
        o.unit_type_id,
        o.unit_id,
        o.object_id,
        o.type_id,
        o.type_sub_id,
        o.contract_id,
        o.plan_id,
        o.requester_team_id,
        o.team_id,
        o.priority_id,
        o.provider_company_id,
        o.cause_reason_id,
        o.order_mask,
        o.unit_description,
        o.type_description,
        o.requested_services
    FROM public.v_orders AS o
    WHERE NOT p_parent_view

    UNION ALL

    SELECT
        o.requested_at,
        o.status_id,
        o.parent_id,
        o.asset_tag_id,
        o.asset_tag_description,
        o.system_parent_id,
        o.system_id,
        o.unit_type_parent_id,
        o.unit_type_id,
        o.unit_id,
        o.object_id,
        o.type_id,
        o.type_sub_id,
        o.contract_id,
        o.plan_id,
        o.requester_team_id,
        o.team_id,
        o.priority_id,
        o.provider_company_id,
        o.cause_reason_id,
        o.order_mask,
        o.unit_description,
        o.type_description,
        o.requested_services
    FROM public.v_orders_parent AS o
    WHERE p_parent_view
),
ss_orders AS MATERIALIZED (
    SELECT
        o.requested_at,
        o.asset_tag_id,
        o.asset_tag_description
    FROM source_orders AS o
    CROSS JOIN effective_ss_filters AS f
    WHERE NOT p_skip_ss
      AND o.status_id = 1
      AND o.parent_id IS NULL
      AND (p_start_date IS NULL OR o.requested_at >= p_start_date::timestamp)
      AND (p_end_date IS NULL OR o.requested_at < (p_end_date + 1)::timestamp)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'systemParentId', o.system_parent_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'systemId', o.system_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitTypeParentId', o.unit_type_parent_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitTypeId', o.unit_type_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitId', o.unit_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'assetTagId', o.asset_tag_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderObjectId', o.object_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTypeId', o.type_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTypeSubId', o.type_sub_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'contractId', o.contract_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderPlanId', o.plan_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTeamId', o.requester_team_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'responsibleTeamId', o.team_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'priorityId', o.priority_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'providerCompanyId', o.provider_company_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'causeReasonId', o.cause_reason_id)
      AND (
          NULLIF(f.filters ->> 'search', '') IS NULL
          OR o.order_mask ILIKE '%' || (f.filters ->> 'search') || '%'
          OR o.unit_description ILIKE '%' || (f.filters ->> 'search') || '%'
          OR EXISTS (
              SELECT 1 FROM public.units AS u
              WHERE u.id = o.unit_id
                AND u.description_full ILIKE '%' || (f.filters ->> 'search') || '%'
          )
          OR o.type_description ILIKE '%' || (f.filters ->> 'search') || '%'
          OR o.requested_services ILIKE '%' || (f.filters ->> 'search') || '%'
      )
),
os_orders AS MATERIALIZED (
    SELECT
        o.status_id,
        o.asset_tag_id,
        o.asset_tag_description
    FROM source_orders AS o
    CROSS JOIN effective_os_filters AS f
    WHERE o.status_id NOT IN (7, 8)
      AND (
          (p_parent_view AND o.parent_id IS NULL AND o.status_id IN (2, 3, 4, 5, 6))
          OR (NOT p_parent_view AND o.parent_id IS NOT NULL)
      )
      AND (p_start_date IS NULL OR o.requested_at >= p_start_date::timestamp)
      AND (p_end_date IS NULL OR o.requested_at < (p_end_date + 1)::timestamp)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'systemParentId', o.system_parent_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'systemId', o.system_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitTypeParentId', o.unit_type_parent_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitTypeId', o.unit_type_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'unitId', o.unit_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'assetTagId', o.asset_tag_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderObjectId', o.object_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTypeId', o.type_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTypeSubId', o.type_sub_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'contractId', o.contract_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderPlanId', o.plan_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'orderTeamId', o.requester_team_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'responsibleTeamId', o.team_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'priorityId', o.priority_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'providerCompanyId', o.provider_company_id)
      AND public.fn_orders_dashboard_filter_id(f.filters, 'causeReasonId', o.cause_reason_id)
      AND (
          NULLIF(f.filters ->> 'search', '') IS NULL
          OR o.order_mask ILIKE '%' || (f.filters ->> 'search') || '%'
          OR o.unit_description ILIKE '%' || (f.filters ->> 'search') || '%'
          OR EXISTS (
              SELECT 1 FROM public.units AS u
              WHERE u.id = o.unit_id
                AND u.description_full ILIKE '%' || (f.filters ->> 'search') || '%'
          )
          OR o.type_description ILIKE '%' || (f.filters ->> 'search') || '%'
          OR o.requested_services ILIKE '%' || (f.filters ->> 'search') || '%'
      )
),
ss_counts AS (
    SELECT
        count(*) FILTER (WHERE requested_at >= c.today::timestamp) AS today,
        count(*) FILTER (WHERE requested_at >= (c.today - 1)::timestamp AND requested_at < c.today::timestamp) AS yesterday,
        count(*) FILTER (WHERE requested_at >= (c.today - 7)::timestamp AND requested_at < (c.today - 1)::timestamp) AS "sevenDays",
        count(*) FILTER (WHERE requested_at >= (c.today - 15)::timestamp AND requested_at < (c.today - 7)::timestamp) AS fifteenDays,
        count(*) FILTER (WHERE requested_at >= (c.today - 30)::timestamp AND requested_at < (c.today - 15)::timestamp) AS "between16And30",
        count(*) FILTER (WHERE requested_at < (c.today - 30)::timestamp) AS "moreThan30"
    FROM ss_orders
    CROSS JOIN clock AS c
),
ss_sectors AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sector_id,
                'label', label,
                'count', count
            ) ORDER BY label
        ),
        '[]'::jsonb
    ) AS data
    FROM (
        SELECT
            COALESCE(asset_tag_id::text, 'null') AS sector_id,
            COALESCE(asset_tag_description, 'Sem Setor') AS label,
            count(*) AS count
        FROM ss_orders
        CROSS JOIN clock AS c
        CROSS JOIN effective_ss_filters AS f
        WHERE CASE f.filters ->> 'period'
            WHEN 'Hoje' THEN requested_at >= c.today::timestamp
            WHEN 'Ontem' THEN requested_at >= (c.today - 1)::timestamp AND requested_at < c.today::timestamp
            WHEN '2-7 dias' THEN requested_at >= (c.today - 7)::timestamp AND requested_at < (c.today - 1)::timestamp
            WHEN '8-15 dias' THEN requested_at >= (c.today - 15)::timestamp AND requested_at < (c.today - 7)::timestamp
            WHEN '16-30 dias' THEN requested_at >= (c.today - 30)::timestamp AND requested_at < (c.today - 15)::timestamp
            WHEN '> 30 dias' THEN requested_at < (c.today - 30)::timestamp
            ELSE true
        END
        GROUP BY sector_id, label
    ) AS sectors
),
os_counts AS (
    SELECT COALESCE(jsonb_object_agg(status_id::text, count), '{}'::jsonb) AS data
    FROM (
        SELECT status_id, count(*) AS count
        FROM os_orders
        GROUP BY status_id
    ) AS counts
),
os_sectors AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sector_id,
                'label', label,
                'count', count
            ) ORDER BY count DESC
        ),
        '[]'::jsonb
    ) AS data
    FROM (
        SELECT
            COALESCE(o.asset_tag_id::text, 'null') AS sector_id,
            COALESCE(o.asset_tag_description, 'Sem Setor') AS label,
            count(*) AS count
        FROM os_orders AS o
        CROSS JOIN effective_os_filters AS f
        WHERE public.fn_orders_dashboard_filter_id(f.filters, 'statusId', o.status_id)
        GROUP BY sector_id, label
    ) AS sectors
)
SELECT jsonb_build_object(
    'ssCounts', (SELECT to_jsonb(ss_counts) FROM ss_counts),
    'osCounts', (SELECT data FROM os_counts),
    'ssSectorCounts', (SELECT data FROM ss_sectors),
    'osSectorCounts', (SELECT data FROM os_sectors)
);
$$;

REVOKE ALL ON FUNCTION public.fn_orders_dashboard_filter_id(jsonb, text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_orders_dashboard_filter_id(jsonb, text, bigint) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.fn_orders_dashboard_stats(jsonb, jsonb, jsonb, boolean, date, date, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_orders_dashboard_stats(jsonb, jsonb, jsonb, boolean, date, date, boolean) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
