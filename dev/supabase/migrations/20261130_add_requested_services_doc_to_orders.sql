-- ==============================================================================
-- Migration: 20261130_add_requested_services_doc_to_orders.sql
-- SS: campo "Documento" (orders.requested_services_doc, text) = referência de documento
-- externo / processo administrativo que originou a demanda. Opcional, sem máscara,
-- NÃO passa pelo trigger de sanitização (preserva pontos, barras e hífens).
--   1. coluna + índice trigram (busca parcial ILIKE);
--   2. v_orders e v_orders_parent: nova coluna requested_services_doc no FIM da lista.
--      As OS filhas herdam o valor da SS pai (COALESCE(NULLIF(parent_id,0), id)).
--      A definição ATUAL de cada view é lida do banco (pg_get_viewdef) e embrulhada,
--      então qualquer alteração recente das views é preservada;
--   3. fn_orders_dashboard_stats: busca livre inclui o documento + filtro
--      "requestedServicesDoc" (mesma base da 20261110).
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261130_add_requested_services_doc_to_orders_DOWN.sql
-- ==============================================================================

SET lock_timeout = '5s';

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS requested_services_doc text;
COMMENT ON COLUMN public.orders.requested_services_doc IS
    'SS: referência de documento externo/processo administrativo que originou a demanda (texto livre).';

CREATE INDEX IF NOT EXISTS idx_orders_requested_services_doc_trgm
    ON public.orders USING gin (requested_services_doc extensions.gin_trgm_ops)
    WHERE requested_services_doc IS NOT NULL;

DO $$
DECLARE
    v_name text;
    v_def  text;
BEGIN
    FOREACH v_name IN ARRAY ARRAY['v_orders', 'v_orders_parent'] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = v_name
              AND column_name = 'requested_services_doc'
        ) THEN
            CONTINUE;  -- já aplicada
        END IF;

        v_def := rtrim(pg_get_viewdef(('public.' || v_name)::regclass, true), E'; \n');

        EXECUTE format(
            'CREATE OR REPLACE VIEW public.%I WITH (security_invoker = ''true'') AS '
            'SELECT base.*, doc_src.requested_services_doc '
            'FROM (%s) AS base '
            'LEFT JOIN public.orders AS doc_src '
            '  ON doc_src.id = COALESCE(NULLIF(base.parent_id, 0), base.id)',
            v_name, v_def
        );
    END LOOP;
END $$;

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
        NULLIF(btrim(filters ->> 'requestedServicesDoc'), '') AS "requestedServicesDoc",
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
        NULLIF(btrim(filters ->> 'requestedServicesDoc'), '') AS "requestedServicesDoc",
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
        o.requested_services,
        o.requested_services_doc
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
        o.requested_services,
        o.requested_services_doc
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
      AND (f."requestedServicesDoc" IS NULL OR o.requested_services_doc ILIKE '%' || f."requestedServicesDoc" || '%')
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
          OR o.requested_services_doc ILIKE '%' || f.search || '%'
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
      AND (f."requestedServicesDoc" IS NULL OR o.requested_services_doc ILIKE '%' || f."requestedServicesDoc" || '%')
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
          OR o.requested_services_doc ILIKE '%' || f.search || '%'
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
