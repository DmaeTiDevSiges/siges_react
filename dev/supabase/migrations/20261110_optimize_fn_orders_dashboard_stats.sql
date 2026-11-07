-- ==============================================================================
-- Migration: 20261110_optimize_fn_orders_dashboard_stats.sql
-- Gestão (SS/OS): fn_orders_dashboard_stats média de 508 ms (pg_stat_statements,
-- 11 mil chamadas). Mesma assinatura e mesmo JSON de retorno; só o plano muda:
--   1. source_orders MATERIALIZED: v_orders (~27 joins) montada 1x, não 2x;
--   2. descarta status 7/8 (fechadas) na origem — SS usa status 1 e OS exclui 7/8;
--   3. filtros convertidos em bigint[] uma vez por chamada (fn_orders_dashboard_filter_ids)
--      em vez de 32 chamadas de fn_orders_dashboard_filter_id POR LINHA.
-- fn_orders_dashboard_filter_id continua existindo (não é removida).
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: reaplicar 20261041_add_dashboard_stats_rpc.sql.
-- ==============================================================================

SET lock_timeout = '5s';

-- Converte um filtro do dashboard em bigint[] UMA vez por chamada.
-- Mesma semântica de fn_orders_dashboard_filter_id:
--   ausente / null / "" / [] / só valores vazios|"null"|"undefined" → NULL (sem filtro);
--   valores não numéricos não casam com nada (array vazio se nenhum for numérico).
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

REVOKE ALL ON FUNCTION public.fn_orders_dashboard_filter_ids(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_orders_dashboard_filter_ids(jsonb, text) TO authenticated, service_role;

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
-- Filtros convertidos UMA vez em bigint[] (NULL = sem filtro).
ss_f AS MATERIALIZED (
    SELECT
        filters,
        NULLIF(filters ->> 'search', '') AS search,
        public.fn_orders_dashboard_filter_ids(filters, 'systemParentId') AS "systemParentId",
        public.fn_orders_dashboard_filter_ids(filters, 'systemId') AS "systemId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitTypeParentId') AS "unitTypeParentId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitTypeId') AS "unitTypeId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitId') AS "unitId",
        public.fn_orders_dashboard_filter_ids(filters, 'assetTagId') AS "assetTagId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderObjectId') AS "orderObjectId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTypeId') AS "orderTypeId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTypeSubId') AS "orderTypeSubId",
        public.fn_orders_dashboard_filter_ids(filters, 'contractId') AS "contractId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderPlanId') AS "orderPlanId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTeamId') AS "orderTeamId",
        public.fn_orders_dashboard_filter_ids(filters, 'responsibleTeamId') AS "responsibleTeamId",
        public.fn_orders_dashboard_filter_ids(filters, 'priorityId') AS "priorityId",
        public.fn_orders_dashboard_filter_ids(filters, 'providerCompanyId') AS "providerCompanyId",
        public.fn_orders_dashboard_filter_ids(filters, 'causeReasonId') AS "causeReasonId"
    FROM effective_ss_filters
),
os_f AS MATERIALIZED (
    SELECT
        filters,
        NULLIF(filters ->> 'search', '') AS search,
        public.fn_orders_dashboard_filter_ids(filters, 'systemParentId') AS "systemParentId",
        public.fn_orders_dashboard_filter_ids(filters, 'systemId') AS "systemId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitTypeParentId') AS "unitTypeParentId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitTypeId') AS "unitTypeId",
        public.fn_orders_dashboard_filter_ids(filters, 'unitId') AS "unitId",
        public.fn_orders_dashboard_filter_ids(filters, 'assetTagId') AS "assetTagId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderObjectId') AS "orderObjectId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTypeId') AS "orderTypeId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTypeSubId') AS "orderTypeSubId",
        public.fn_orders_dashboard_filter_ids(filters, 'contractId') AS "contractId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderPlanId') AS "orderPlanId",
        public.fn_orders_dashboard_filter_ids(filters, 'orderTeamId') AS "orderTeamId",
        public.fn_orders_dashboard_filter_ids(filters, 'responsibleTeamId') AS "responsibleTeamId",
        public.fn_orders_dashboard_filter_ids(filters, 'priorityId') AS "priorityId",
        public.fn_orders_dashboard_filter_ids(filters, 'providerCompanyId') AS "providerCompanyId",
        public.fn_orders_dashboard_filter_ids(filters, 'causeReasonId') AS "causeReasonId",
        public.fn_orders_dashboard_filter_ids(filters, 'statusId') AS "statusId"
    FROM effective_os_filters
),
-- MATERIALIZED: v_orders é montada uma vez (antes: duas, uma para SS e outra para OS).
-- status 7/8 (fechadas) descartados já aqui: nem SS (status 1) nem OS os usam.
source_orders AS MATERIALIZED (
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
      AND o.status_id NOT IN (7, 8)

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
      AND o.status_id NOT IN (7, 8)
),
ss_orders AS MATERIALIZED (
    SELECT
        o.requested_at,
        o.asset_tag_id,
        o.asset_tag_description
    FROM source_orders AS o
    CROSS JOIN ss_f AS f
    WHERE NOT p_skip_ss
      AND o.status_id = 1
      AND o.parent_id IS NULL
      AND (p_start_date IS NULL OR o.requested_at >= p_start_date::timestamp)
      AND (p_end_date IS NULL OR o.requested_at < (p_end_date + 1)::timestamp)
      AND (f."systemParentId" IS NULL OR o.system_parent_id = ANY (f."systemParentId"))
      AND (f."systemId" IS NULL OR o.system_id = ANY (f."systemId"))
      AND (f."unitTypeParentId" IS NULL OR o.unit_type_parent_id = ANY (f."unitTypeParentId"))
      AND (f."unitTypeId" IS NULL OR o.unit_type_id = ANY (f."unitTypeId"))
      AND (f."unitId" IS NULL OR o.unit_id = ANY (f."unitId"))
      AND (f."assetTagId" IS NULL OR o.asset_tag_id = ANY (f."assetTagId"))
      AND (f."orderObjectId" IS NULL OR o.object_id = ANY (f."orderObjectId"))
      AND (f."orderTypeId" IS NULL OR o.type_id = ANY (f."orderTypeId"))
      AND (f."orderTypeSubId" IS NULL OR o.type_sub_id = ANY (f."orderTypeSubId"))
      AND (f."contractId" IS NULL OR o.contract_id = ANY (f."contractId"))
      AND (f."orderPlanId" IS NULL OR o.plan_id = ANY (f."orderPlanId"))
      AND (f."orderTeamId" IS NULL OR o.requester_team_id = ANY (f."orderTeamId"))
      AND (f."responsibleTeamId" IS NULL OR o.team_id = ANY (f."responsibleTeamId"))
      AND (f."priorityId" IS NULL OR o.priority_id = ANY (f."priorityId"))
      AND (f."providerCompanyId" IS NULL OR o.provider_company_id = ANY (f."providerCompanyId"))
      AND (f."causeReasonId" IS NULL OR o.cause_reason_id = ANY (f."causeReasonId"))
      AND (
          f.search IS NULL
          OR o.order_mask ILIKE '%' || f.search || '%'
          OR o.unit_description ILIKE '%' || f.search || '%'
          OR EXISTS (
              SELECT 1 FROM public.units AS u
              WHERE u.id = o.unit_id
                AND u.description_full ILIKE '%' || f.search || '%'
          )
          OR o.type_description ILIKE '%' || f.search || '%'
          OR o.requested_services ILIKE '%' || f.search || '%'
      )
),
os_orders AS MATERIALIZED (
    SELECT
        o.status_id,
        o.asset_tag_id,
        o.asset_tag_description
    FROM source_orders AS o
    CROSS JOIN os_f AS f
    WHERE o.status_id NOT IN (7, 8)
      AND (
          (p_parent_view AND o.parent_id IS NULL AND o.status_id IN (2, 3, 4, 5, 6))
          OR (NOT p_parent_view AND o.parent_id IS NOT NULL)
      )
      AND (p_start_date IS NULL OR o.requested_at >= p_start_date::timestamp)
      AND (p_end_date IS NULL OR o.requested_at < (p_end_date + 1)::timestamp)
      AND (f."systemParentId" IS NULL OR o.system_parent_id = ANY (f."systemParentId"))
      AND (f."systemId" IS NULL OR o.system_id = ANY (f."systemId"))
      AND (f."unitTypeParentId" IS NULL OR o.unit_type_parent_id = ANY (f."unitTypeParentId"))
      AND (f."unitTypeId" IS NULL OR o.unit_type_id = ANY (f."unitTypeId"))
      AND (f."unitId" IS NULL OR o.unit_id = ANY (f."unitId"))
      AND (f."assetTagId" IS NULL OR o.asset_tag_id = ANY (f."assetTagId"))
      AND (f."orderObjectId" IS NULL OR o.object_id = ANY (f."orderObjectId"))
      AND (f."orderTypeId" IS NULL OR o.type_id = ANY (f."orderTypeId"))
      AND (f."orderTypeSubId" IS NULL OR o.type_sub_id = ANY (f."orderTypeSubId"))
      AND (f."contractId" IS NULL OR o.contract_id = ANY (f."contractId"))
      AND (f."orderPlanId" IS NULL OR o.plan_id = ANY (f."orderPlanId"))
      AND (f."orderTeamId" IS NULL OR o.requester_team_id = ANY (f."orderTeamId"))
      AND (f."responsibleTeamId" IS NULL OR o.team_id = ANY (f."responsibleTeamId"))
      AND (f."priorityId" IS NULL OR o.priority_id = ANY (f."priorityId"))
      AND (f."providerCompanyId" IS NULL OR o.provider_company_id = ANY (f."providerCompanyId"))
      AND (f."causeReasonId" IS NULL OR o.cause_reason_id = ANY (f."causeReasonId"))
      AND (
          f.search IS NULL
          OR o.order_mask ILIKE '%' || f.search || '%'
          OR o.unit_description ILIKE '%' || f.search || '%'
          OR EXISTS (
              SELECT 1 FROM public.units AS u
              WHERE u.id = o.unit_id
                AND u.description_full ILIKE '%' || f.search || '%'
          )
          OR o.type_description ILIKE '%' || f.search || '%'
          OR o.requested_services ILIKE '%' || f.search || '%'
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
        CROSS JOIN os_f AS f
        WHERE (f."statusId" IS NULL OR o.status_id = ANY (f."statusId"))
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

REVOKE ALL ON FUNCTION public.fn_orders_dashboard_stats(jsonb, jsonb, jsonb, boolean, date, date, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_orders_dashboard_stats(jsonb, jsonb, jsonb, boolean, date, date, boolean) TO authenticated, service_role;
