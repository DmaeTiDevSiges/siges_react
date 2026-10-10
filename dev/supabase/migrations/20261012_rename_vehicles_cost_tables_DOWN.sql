-- ============================================================
-- Migration DOWN: Reverter renomeação das tabelas do rateio veicular
-- Date: 2026-10-10
-- Description:
--   Reverte a 20261012_rename_vehicles_cost_tables.sql:
--     public.cfg_vehicles_costs_types       → public.cfg_vehicle_cost_types
--     public.cfg_vehicles_rentals_contracts → public.cfg_vehicle_rental_contracts
--
--   Recria fc_vehicle_rental_summary com os nomes antigos (corpo
--   idêntico ao da 20261011 original) e recarrega o schema cache.
--
--   ⚠️ Depois do DOWN, os arquivos do repositório (services/ TS) passam
--   a divergir do banco — só faça rollback se também reverter o código.
--   Rota/rota settings_vehicle_cost_types (cfg_routes) não é afetada.
--
--   Pré-requisito: 20261012 já aplicada. Idempotente.
--   Aplicação MANUAL no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1) cfg_vehicles_costs_types → cfg_vehicle_cost_types
-- ------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cfg_vehicles_costs_types') IS NOT NULL
       AND to_regclass('public.cfg_vehicle_cost_types') IS NULL THEN
        ALTER TABLE public.cfg_vehicles_costs_types RENAME TO cfg_vehicle_cost_types;
        ALTER TABLE public.cfg_vehicle_cost_types
            RENAME CONSTRAINT cfg_vehicles_costs_types_pkey
            TO cfg_vehicle_cost_types_pkey;
        ALTER TABLE public.cfg_vehicle_cost_types
            RENAME CONSTRAINT cfg_vehicles_costs_types_code_key
            TO cfg_vehicle_cost_types_code_key;
        ALTER SEQUENCE IF EXISTS public.cfg_vehicles_costs_types_id_seq
            RENAME TO cfg_vehicle_cost_types_id_seq;
        RAISE NOTICE 'OK (DOWN): cfg_vehicles_costs_types → cfg_vehicle_cost_types';
    ELSE
        RAISE NOTICE 'AVISO (DOWN): nada a reverter para cfg_vehicle_cost_types';
    END IF;
END $$;

-- ------------------------------------------------------------
-- 2) cfg_vehicles_rentals_contracts → cfg_vehicle_rental_contracts
-- ------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cfg_vehicles_rentals_contracts') IS NOT NULL
       AND to_regclass('public.cfg_vehicle_rental_contracts') IS NULL THEN
        ALTER TABLE public.cfg_vehicles_rentals_contracts RENAME TO cfg_vehicle_rental_contracts;
        ALTER TABLE public.cfg_vehicle_rental_contracts
            RENAME CONSTRAINT cfg_vehicles_rentals_contracts_pkey
            TO cfg_vehicle_rental_contracts_pkey;
        ALTER TABLE public.cfg_vehicle_rental_contracts
            RENAME CONSTRAINT cfg_vehicles_rentals_contracts_value_ck
            TO cfg_vehicle_rental_contracts_value_ck;
        ALTER TABLE public.cfg_vehicle_rental_contracts
            RENAME CONSTRAINT cfg_vehicles_rentals_contracts_dates_ck
            TO cfg_vehicle_rental_contracts_dates_ck;
        ALTER TABLE public.cfg_vehicle_rental_contracts
            RENAME CONSTRAINT cfg_vehicles_rentals_contracts_vehicle_fk
            TO cfg_vehicle_rental_contracts_vehicle_fk;
        ALTER INDEX IF EXISTS public.idx_cfg_vehicles_rentals_contracts_vehicle
            RENAME TO idx_cfg_vehicle_rental_contracts_vehicle;
        ALTER SEQUENCE IF EXISTS public.cfg_vehicles_rentals_contracts_id_seq
            RENAME TO cfg_vehicle_rental_contracts_id_seq;
        RAISE NOTICE 'OK (DOWN): cfg_vehicles_rentals_contracts → cfg_vehicle_rental_contracts';
    ELSE
        RAISE NOTICE 'AVISO (DOWN): nada a reverter para cfg_vehicle_rental_contracts';
    END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Recria fc_vehicle_rental_summary com os NOMES ANTIGOS (corpo
--    idêntico ao da 20261011 original).
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
            FROM public.cfg_vehicle_rental_contracts c
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
-- 4) Recarrega o cache de schema do PostgREST/Supabase.
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FIM DA MIGRATION 20261012_rename_vehicles_cost_tables_DOWN.sql
-- ============================================================
