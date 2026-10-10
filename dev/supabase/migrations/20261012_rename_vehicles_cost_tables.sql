-- ============================================================
-- Migration: Renomear tabelas do rateio veicular
-- Date: 2026-10-10
-- Description:
--   Renomeia no banco vivo (todas as migrations 08–11 já aplicadas):
--     public.cfg_vehicle_cost_types       → public.cfg_vehicles_costs_types
--     public.cfg_vehicle_rental_contracts → public.cfg_vehicles_rentals_contracts
--
--   O que é renomeado junto com a tabela:
--     • constraints declaradas na 20261008 (pkey, unique, checks, fk);
--     • índice parcial idx_*_vehicle;
--     • sequences de identidade *_id_seq.
--
--   O que NÃO precisa de alteração:
--     • GRANTs e políticas RLS são ligados ao OID → sobrevivem ao rename;
--     • FKs nas tabelas dependentes (vehicle_rental_periods.contract_id,
--       vehicle_monthly_expenses.cost_type_id) também são OID-based;
--     • funções do Postgres, EXCETO fc_vehicle_rental_summary, cujo corpo
--       referencia as tabelas por nome — ela é recriada abaixo (corpo
--       idêntico ao da 20261011, só o nome da tabela muda). As outras 3
--       funções da 20261011 (detail/calculate/allocate) não referenciam
--       as tabelas renomeadas.
--
--   Pré-requisito: 20261008 … 20261011 já aplicadas.
--   Idempotente: renomeia apenas se o nome antigo existir e o novo
--   não existir — pode ser executada mais de uma vez.
--   Aplicação MANUAL no SQL Editor do Supabase.
--
--   ⚠️ Rota/rota de permissão settings_vehicle_cost_types (cfg_routes)
--   NÃO é tabela e NÃO é renomeada.
--
--   Validação: dev/supabase/validate_rename_vehicles_costs.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) cfg_vehicle_cost_types → cfg_vehicles_costs_types
-- ------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cfg_vehicle_cost_types') IS NOT NULL THEN
        IF to_regclass('public.cfg_vehicles_costs_types') IS NOT NULL THEN
            RAISE NOTICE 'AVISO: cfg_vehicles_costs_types já existe — rename pulado';
        ELSE
            ALTER TABLE public.cfg_vehicle_cost_types RENAME TO cfg_vehicles_costs_types;
            ALTER TABLE public.cfg_vehicles_costs_types
                RENAME CONSTRAINT cfg_vehicle_cost_types_pkey
                TO cfg_vehicles_costs_types_pkey;
            ALTER TABLE public.cfg_vehicles_costs_types
                RENAME CONSTRAINT cfg_vehicle_cost_types_code_key
                TO cfg_vehicles_costs_types_code_key;
            ALTER SEQUENCE IF EXISTS public.cfg_vehicle_cost_types_id_seq
                RENAME TO cfg_vehicles_costs_types_id_seq;
            RAISE NOTICE 'OK: cfg_vehicle_cost_types → cfg_vehicles_costs_types';
        END IF;
    ELSIF to_regclass('public.cfg_vehicles_costs_types') IS NOT NULL THEN
        RAISE NOTICE 'OK: cfg_vehicles_costs_types já está no nome novo';
    ELSE
        RAISE NOTICE 'AVISO: cfg_vehicle_cost_types inexistente — nada a fazer';
    END IF;
END $$;

-- ------------------------------------------------------------
-- 2) cfg_vehicle_rental_contracts → cfg_vehicles_rentals_contracts
-- ------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cfg_vehicle_rental_contracts') IS NOT NULL THEN
        IF to_regclass('public.cfg_vehicles_rentals_contracts') IS NOT NULL THEN
            RAISE NOTICE 'AVISO: cfg_vehicles_rentals_contracts já existe — rename pulado';
        ELSE
            ALTER TABLE public.cfg_vehicle_rental_contracts RENAME TO cfg_vehicles_rentals_contracts;
            ALTER TABLE public.cfg_vehicles_rentals_contracts
                RENAME CONSTRAINT cfg_vehicle_rental_contracts_pkey
                TO cfg_vehicles_rentals_contracts_pkey;
            ALTER TABLE public.cfg_vehicles_rentals_contracts
                RENAME CONSTRAINT cfg_vehicle_rental_contracts_value_ck
                TO cfg_vehicles_rentals_contracts_value_ck;
            ALTER TABLE public.cfg_vehicles_rentals_contracts
                RENAME CONSTRAINT cfg_vehicle_rental_contracts_dates_ck
                TO cfg_vehicles_rentals_contracts_dates_ck;
            ALTER TABLE public.cfg_vehicles_rentals_contracts
                RENAME CONSTRAINT cfg_vehicle_rental_contracts_vehicle_fk
                TO cfg_vehicles_rentals_contracts_vehicle_fk;
            ALTER INDEX IF EXISTS public.idx_cfg_vehicle_rental_contracts_vehicle
                RENAME TO idx_cfg_vehicles_rentals_contracts_vehicle;
            ALTER SEQUENCE IF EXISTS public.cfg_vehicle_rental_contracts_id_seq
                RENAME TO cfg_vehicles_rentals_contracts_id_seq;
            RAISE NOTICE 'OK: cfg_vehicle_rental_contracts → cfg_vehicles_rentals_contracts';
        END IF;
    ELSIF to_regclass('public.cfg_vehicles_rentals_contracts') IS NOT NULL THEN
        RAISE NOTICE 'OK: cfg_vehicles_rentals_contracts já está no nome novo';
    ELSE
        RAISE NOTICE 'AVISO: cfg_vehicle_rental_contracts inexistente — nada a fazer';
    END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Recria fc_vehicle_rental_summary — é a única função viva cujo
--    corpo referencia as tabelas renomeadas (FROM ... na CTE
--    contract_info). Corpo idêntico ao da 20261011, com o nome novo.
--    CREATE OR REPLACE preserva os grants existentes.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_summary(p_reference_month date)
RETURNS TABLE (
    period_id bigint,
    period_status character varying,
    vehicle_id bigint,
    vehicle_description text,
    vehicle_plates text,
    contract_id bigint,
    contract_value numeric,
    has_conflict boolean,
    total_km bigint,
    cost_per_km numeric,
    allocated_value numeric,
    idle_value numeric,
    utilization numeric,
    variable_value numeric,
    variable_per_km numeric,
    operational_value numeric,
    operational_per_km numeric
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_month_end date := (date_trunc('month', p_reference_month::timestamp) + interval '1 month - 1 day')::date;
    v_row record;
    v_period public.vehicle_rental_periods%ROWTYPE;
    v_km bigint;
    v_rate numeric;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_alloc numeric;
    v_alloc_rental numeric;
    v_alloc_variable numeric;
    v_value numeric;
    v_variable numeric;
    v_op numeric;
BEGIN
    FOR v_row IN
        WITH contract_info AS (
            SELECT c.vehicle_id,
                   count(*) AS n_contracts,
                   (array_agg(c.id ORDER BY c.start_date DESC, c.id DESC))[1] AS best_id,
                   (array_agg(c.monthly_value ORDER BY c.start_date DESC, c.id DESC))[1] AS best_value
            FROM public.cfg_vehicles_rentals_contracts c
            WHERE c.active AND NOT c.is_deleted
              AND c.start_date <= v_month_end
              AND (c.end_date IS NULL OR c.end_date >= v_month)
            GROUP BY c.vehicle_id
        ),
        base AS (
            SELECT u.vvehicle, u.vcid, u.vvalue, u.prio
            FROM (
                SELECT p.vehicle_id AS vvehicle, p.contract_id AS vcid,
                       p.contract_value AS vvalue, 0 AS prio
                FROM public.vehicle_rental_periods p
                WHERE p.reference_month = v_month
                UNION ALL
                SELECT ci.vehicle_id, ci.best_id, ci.best_value, 1
                FROM contract_info ci
                UNION ALL
                -- Despesas do mês: rateáveis mesmo sem contrato de
                -- aluguel (componente VARIABLE).
                SELECT e.vehicle_id, NULL::bigint, NULL::numeric, 2
                FROM public.vehicle_monthly_expenses e
                WHERE e.reference_month = v_month
                GROUP BY e.vehicle_id
                UNION ALL
                -- Contrato de R$/km vigente no mês: custo operacional
                -- por Km (aluguel/despesas continuam via legs 0/1/2).
                SELECT rc.vehicle_id, NULL::bigint, NULL::numeric, 3
                FROM public.cfg_vehicle_rate_contracts rc
                WHERE rc.active AND NOT rc.is_deleted
                  AND rc.start_date <= v_month_end
                  AND (rc.end_date IS NULL OR rc.end_date >= v_month)
                GROUP BY rc.vehicle_id
            ) u
        )
        SELECT DISTINCT ON (b.vvehicle)
               b.vvehicle, b.vcid, b.vvalue,
               COALESCE(ci.n_contracts, 0) > 1 AS vconflict,
               ve.description AS vd, ve.plates AS vp
        FROM base b
        LEFT JOIN contract_info ci ON ci.vehicle_id = b.vvehicle
        JOIN public.vehicles ve ON ve.id = b.vvehicle AND NOT ve.is_deleted
        ORDER BY b.vvehicle, b.prio, ve.description
    LOOP
        SELECT p.* INTO v_period
        FROM public.vehicle_rental_periods p
        WHERE p.vehicle_id = v_row.vvehicle
          AND p.reference_month = v_month;

        -- Km total do mês (âncora: created_at da linha, fallback da visita).
        -- Conta linhas 'odometer' E 'rate' (a mesma linha depois de rateada).
        SELECT COALESCE(sum(ovv.amount), 0)::bigint,
               COALESCE(sum(ovv.value_total), 0)
        INTO v_km, v_op
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = v_row.vvehicle
          AND NOT ovv.is_deleted
          AND ovv.cost_type IN ('odometer', 'rate')
          AND ovv.amount > 0
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

        v_value := COALESCE(v_period.contract_value, v_row.vvalue, 0);

        -- Despesas variáveis do mês (ao vivo; se o período já existe,
        -- o valor gravado no cálculo prevalece — ver IF abaixo)
        SELECT COALESCE(sum(e.value), 0)
        INTO v_variable
        FROM public.vehicle_monthly_expenses e
        WHERE e.vehicle_id = v_row.vvehicle
          AND e.reference_month = v_month;

        IF v_period.id IS NOT NULL THEN
            period_id := v_period.id;
            period_status := v_period.status;
        ELSE
            period_id := NULL;
            period_status := 'OPEN';
        END IF;

        IF v_period.id IS NOT NULL AND v_period.status IN ('ALLOCATED', 'CLOSED') THEN
            -- Competência confirmada/fechada: valores gravados são a
            -- fonte do rateio (o guard trava despesas e Km => gravado
            -- é idêntico ao ao vivo).
            total_km := v_period.total_km;
            v_rate := v_period.cost_per_km;
            v_alloc := v_period.allocated_value;
            v_variable := COALESCE(v_period.variable_value, 0);
        ELSE
            -- Prévia ao vivo: sem período, ou status CALCULATED (após
            -- estorno ou alocação interrompida). Nesse estado despesas
            -- e Km continuam editáveis, então usar o valor gravado no
            -- cálculo mostraria despesas desatualizadas no card.
            total_km := v_km;
            v_rate := CASE WHEN v_km > 0 THEN (v_value + v_variable) / v_km::numeric ELSE NULL END;
            v_rental_rate := CASE WHEN v_km > 0 THEN v_value / v_km::numeric ELSE NULL END;
            v_var_rate := CASE WHEN v_km > 0 AND v_variable > 0 THEN v_variable / v_km::numeric ELSE NULL END;

            -- Prévia: soma dos valores já arredondados por visita e por
            -- componente (mesma fórmula do fc_vehicle_rental_allocate)
            SELECT COALESCE(sum(round(ovv.amount * v_rental_rate, 2)), 0),
                   COALESCE(sum(round(ovv.amount * v_var_rate, 2)), 0)
            INTO v_alloc_rental, v_alloc_variable
            FROM public.orders_visits_vehicles ovv
            JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
            WHERE ovv.vehicle_id = v_row.vvehicle
              AND NOT ovv.is_deleted
              AND ovv.cost_type IN ('odometer', 'rate')
              AND ovv.amount > 0
              AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
              AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

            v_alloc := v_alloc_rental + v_alloc_variable;
        END IF;

        vehicle_id := v_row.vvehicle;
        vehicle_description := v_row.vd;
        vehicle_plates := v_row.vp;
        contract_id := v_row.vcid;
        contract_value := v_value;
        has_conflict := v_row.vconflict;
        cost_per_km := v_rate;
        allocated_value := v_alloc;
        idle_value := (v_value + v_variable) - v_alloc;
        utilization := CASE
            WHEN (v_value + v_variable) > 0 THEN round(v_alloc / (v_value + v_variable), 4)
            ELSE NULL
        END;
        variable_value := v_variable;
        variable_per_km := CASE
            WHEN total_km > 0 AND v_variable > 0 THEN round(v_variable / total_km::numeric, 6)
            ELSE NULL
        END;
        operational_value := v_op;
        operational_per_km := CASE
            WHEN total_km > 0 THEN round(v_op / total_km::numeric, 6)
            ELSE NULL
        END;

        RETURN NEXT;
    END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 4) Recarrega o cache de schema do PostgREST/Supabase — os embeds
--    (cfg_vehicles_costs_types!inner) e os nomes de tabela mudaram.
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FIM DA MIGRATION 20261012_rename_vehicles_cost_tables.sql
-- ============================================================
