-- =============================================================================
-- Rename: vehicle_monthly_expenses   -> vehicles_monthly_expenses
--         vehicles_rentals_allocations -> vehicles_rentals_allocations
--         vehicle_rental_periods     -> vehicles_rentals_periods
--
-- ATENÇÃO: aplicar APÓS todas as migrations 20261008..20261014 do rateio.
-- As RPCs plpgsql resolvem nomes de tabela em runtime — após o RENAME elas
-- quebram se não forem recriadas. Este arquivo renomeia tabelas/sequências/
-- constraints/índices/triggers e recria TODAS as funções na versão mais
-- recente, já com os nomes novos.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.vehicle_monthly_expenses
    RENAME TO vehicles_monthly_expenses;

ALTER TABLE IF EXISTS public.vehicles_rentals_allocations
    RENAME TO vehicles_rentals_allocations;

ALTER TABLE IF EXISTS public.vehicle_rental_periods
    RENAME TO vehicles_rentals_periods;

-- ---------------------------------------------------------------------------
-- 2. Sequences (serial/identity não renomeiam junto com a tabela)
-- ---------------------------------------------------------------------------
ALTER SEQUENCE IF EXISTS public.vehicle_monthly_expenses_id_seq
    RENAME TO vehicles_monthly_expenses_id_seq;

ALTER SEQUENCE IF EXISTS public.vehicles_rentals_allocations_id_seq
    RENAME TO vehicles_rentals_allocations_id_seq;

ALTER SEQUENCE IF EXISTS public.vehicle_rental_periods_id_seq
    RENAME TO vehicles_rentals_periods_id_seq;

-- ---------------------------------------------------------------------------
-- 3. Constraints (tolerante: só renomeia as que existem)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    pairs text[][] := ARRAY[
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_pkey', 'vehicles_monthly_expenses_pkey'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_month_ck', 'vehicles_monthly_expenses_month_ck'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_value_ck', 'vehicles_monthly_expenses_value_ck'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_vehicle_fk', 'vehicles_monthly_expenses_vehicle_fk'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_type_fk', 'vehicles_monthly_expenses_type_fk'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_odometer_ck', 'vehicles_monthly_expenses_odometer_ck'],
        ['vehicles_monthly_expenses', 'vehicle_monthly_expenses_fuel_qty_ck', 'vehicles_monthly_expenses_fuel_qty_ck'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_pkey', 'vehicles_rentals_allocations_pkey'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_uq', 'vehicles_rentals_allocations_uq'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_component_ck', 'vehicles_rentals_allocations_component_ck'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_period_fk', 'vehicles_rentals_allocations_period_fk'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_ov_fk', 'vehicles_rentals_allocations_ov_fk'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_ovv_fk', 'vehicles_rentals_allocations_ovv_fk'],
        ['vehicles_rentals_allocations', 'vehicles_rentals_allocations_rental_ovv_fk', 'vehicles_rentals_allocations_rental_ovv_fk'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_pkey', 'vehicles_rentals_periods_pkey'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_month_uq', 'vehicles_rentals_periods_month_uq'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_status_ck', 'vehicles_rentals_periods_status_ck'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_month_ck', 'vehicles_rentals_periods_month_ck'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_value_ck', 'vehicles_rentals_periods_value_ck'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_vehicle_fk', 'vehicles_rentals_periods_vehicle_fk'],
        ['vehicles_rentals_periods', 'vehicle_rental_periods_contract_fk', 'vehicles_rentals_periods_contract_fk']
    ];
BEGIN
    FOR i IN 1..array_length(pairs, 1) LOOP
        IF EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
              AND t.relname = pairs[i][1]
              AND c.conname = pairs[i][2]
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I',
                pairs[i][1], pairs[i][2], pairs[i][3]
            );
        ELSE
            RAISE NOTICE 'constraint % não existe em % — pulando', pairs[i][2], pairs[i][1];
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Índices
-- ---------------------------------------------------------------------------
ALTER INDEX IF EXISTS idx_vehicle_monthly_expenses_lookup
    RENAME TO idx_vehicles_monthly_expenses_lookup;

ALTER INDEX IF EXISTS idx_vehicles_rentals_allocations_period
    RENAME TO idx_vehicles_rentals_allocations_period;

ALTER INDEX IF EXISTS idx_vehicles_rentals_allocations_ov
    RENAME TO idx_vehicles_rentals_allocations_ov;

ALTER INDEX IF EXISTS idx_vehicle_rental_periods_reference_month
    RENAME TO idx_vehicles_rentals_periods_reference_month;

-- ---------------------------------------------------------------------------
-- 5. Triggers (DROP + CREATE com nome novo; o trigger antigo morre junto)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vehicle_rental_period_guard ON public.vehicles_rentals_periods;
DROP TRIGGER IF EXISTS trg_vehicle_rental_allocation_guard ON public.vehicles_rentals_allocations;
DROP TRIGGER IF EXISTS trg_vehicle_monthly_expenses_guard ON public.vehicles_monthly_expenses;

-- ---------------------------------------------------------------------------
-- 6. Recria todas as funções (versão mais recente, nomes novos)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_period_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    IF coalesce(current_setting('app.vehicle_rental_write', true), '') = '1' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('ALLOCATED', 'CLOSED') THEN
            RAISE EXCEPTION 'Competência % do veículo % não pode ser excluída: rateio já alocado/fechado. Use a apuração (fc_vehicle_rental_revert).',
                OLD.reference_month, OLD.vehicle_id;
        END IF;
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'Período de rateio de aluguel é gerenciado exclusivamente pelas RPCs de apuração (fc_vehicle_rental_*).';
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_allocation_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_status character varying;
BEGIN
    IF coalesce(current_setting('app.vehicle_rental_write', true), '') = '1' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Rateio de aluguel é gerado pela apuração mensal e não pode ser editado diretamente.';
    END IF;

    -- DELETE: permitido apenas enquanto a competência não estiver fechada
    -- (ex.: visita apagada em cascata antes do fechamento)
    SELECT p.status INTO v_status
    FROM public.vehicles_rentals_periods p
    WHERE p.id = OLD.period_id;

    IF v_status = 'CLOSED' THEN
        RAISE EXCEPTION 'Competência fechada: o rateio é imutável (reabra a competência para alterar).';
    END IF;

    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_monthly_expenses_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_status character varying;
BEGIN
    IF TG_OP <> 'DELETE' THEN
        SELECT p.status INTO v_status
        FROM public.vehicles_rentals_periods p
        WHERE p.vehicle_id = NEW.vehicle_id
          AND p.reference_month = NEW.reference_month;

        IF v_status IN ('ALLOCATED', 'CLOSED') THEN
            RAISE EXCEPTION 'Despesas da competência % (veículo %) estão bloqueadas: período % — faça o estorno (fc_vehicle_rental_revert) ou reabra antes de alterar.',
                NEW.reference_month, NEW.vehicle_id, v_status;
        END IF;
    END IF;

    IF TG_OP <> 'INSERT' THEN
        SELECT p.status INTO v_status
        FROM public.vehicles_rentals_periods p
        WHERE p.vehicle_id = OLD.vehicle_id
          AND p.reference_month = OLD.reference_month;

        IF v_status IN ('ALLOCATED', 'CLOSED') THEN
            RAISE EXCEPTION 'Despesas da competência % (veículo %) estão bloqueadas: período % — faça o estorno (fc_vehicle_rental_revert) ou reabra antes de alterar.',
                OLD.reference_month, OLD.vehicle_id, v_status;
        END IF;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_contract(
    p_vehicle_id bigint,
    p_reference_month date
) RETURNS TABLE (
    contract_id bigint,
    monthly_value numeric,
    has_conflict boolean
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_month_end date := (date_trunc('month', p_reference_month::timestamp) + interval '1 month - 1 day')::date;
BEGIN
    -- Mais de um contrato vigente no mês => o mais recente vence e o
    -- conflito é sinalizado ao usuário.
    RETURN QUERY
    SELECT c.id,
           c.monthly_value,
           (count(*) OVER ()) > 1
    FROM public.cfg_vehicles_rentals_contracts c
    WHERE c.vehicle_id = p_vehicle_id
      AND c.active
      AND NOT c.is_deleted
      AND c.start_date <= v_month_end
      AND (c.end_date IS NULL OR c.end_date >= v_month)
    ORDER BY c.start_date DESC, c.id DESC
    LIMIT 1;
END;
$$;

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
    v_period public.vehicles_rentals_periods%ROWTYPE;
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
                FROM public.vehicles_rentals_periods p
                WHERE p.reference_month = v_month
                UNION ALL
                SELECT ci.vehicle_id, ci.best_id, ci.best_value, 1
                FROM contract_info ci
                UNION ALL
                -- Despesas do mês: rateáveis mesmo sem contrato de
                -- aluguel (componente VARIABLE).
                SELECT e.vehicle_id, NULL::bigint, NULL::numeric, 2
                FROM public.vehicles_monthly_expenses e
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
        FROM public.vehicles_rentals_periods p
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
        FROM public.vehicles_monthly_expenses e
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

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_detail(
    p_vehicle_id bigint,
    p_reference_month date
) RETURNS TABLE (
    period_id bigint,
    period_status character varying,
    ov_id bigint,
    ovv_id bigint,
    visit_mask character varying,
    km bigint,
    rate numeric,
    value numeric,
    rental_value numeric,
    variable_value numeric,
    rental_ovv_id bigint,
    variable_ovv_id bigint,
    operational_value numeric
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
    v_contract numeric;
    v_variable numeric;
    v_rate numeric;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_rate_km bigint;
    v_total bigint;
BEGIN
    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month;

    -- Km total do mês (âncora: created_at da linha, fallback da visita)
    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    IF v_period.id IS NOT NULL AND v_period.status IN ('ALLOCATED', 'CLOSED') THEN
        -- Competência confirmada/fechada: rates gravados (fonte do
        -- allocate; guard trava despesas e Km => gravado = ao vivo)
        v_contract := COALESCE(v_period.contract_value, 0);
        v_variable := COALESCE(v_period.variable_value, 0);
        v_rate_km := v_period.total_km;
        v_rate := v_period.cost_per_km;
    ELSE
        -- Prévia ao vivo: contrato vigente + despesas do mês. Vale
        -- sem período (OPEN) e também em CALCULATED, onde despesas e
        -- Km ainda podem mudar depois do cálculo.
        SELECT c.monthly_value INTO v_contract
        FROM public.fc_vehicle_rental_contract(p_vehicle_id, v_month) c;

        -- Sem contrato de aluguel na competência: só as despesas
        -- compõem o custo/km (rateio apenas do componente VARIABLE).
        v_contract := COALESCE(v_contract, 0);

        SELECT COALESCE(sum(e.value), 0) INTO v_variable
        FROM public.vehicles_monthly_expenses e
        WHERE e.vehicle_id = p_vehicle_id
          AND e.reference_month = v_month;

        v_rate_km := v_total;
        v_rate := CASE
            WHEN v_total > 0 THEN (v_contract + v_variable) / v_total::numeric
            ELSE NULL
        END;
    END IF;

    -- Rates por componente: idênticos aos usados no allocate
    v_rental_rate := CASE
        WHEN v_rate_km > 0 THEN round(v_contract / v_rate_km::numeric, 6)
        ELSE NULL
    END;
    v_var_rate := CASE
        WHEN v_rate_km > 0 AND v_variable > 0 THEN round(v_variable / v_rate_km::numeric, 6)
        ELSE NULL
    END;

    RETURN QUERY
    SELECT
        v_period.id,
        COALESCE(v_period.status, 'OPEN')::character varying,
        ovv.ov_id,
        ovv.id,
        ovs.ov_mask,
        ovv.amount,
        v_rate,
        COALESCE(round(ovv.amount * v_rental_rate, 2), 0)
            + COALESCE(round(ovv.amount * v_var_rate, 2), 0),
        round(ovv.amount * v_rental_rate, 2),
        round(ovv.amount * v_var_rate, 2),
        a_rental.rental_ovv_id,
        a_var.rental_ovv_id,
        ovv.value_total
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    LEFT JOIN public.vehicles_rentals_allocations a_rental
           ON a_rental.ovv_id = ovv.id
          AND a_rental.period_id IS NOT DISTINCT FROM v_period.id
          AND a_rental.cost_component = 'RENTAL'
    LEFT JOIN public.vehicles_rentals_allocations a_var
           ON a_var.ovv_id = ovv.id
          AND a_var.period_id IS NOT DISTINCT FROM v_period.id
          AND a_var.cost_component = 'VARIABLE'
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month'
    ORDER BY COALESCE(ovv.created_at, ovs.ov_created_at), ovv.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_calculate(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicles_rentals_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
    v_contract_id bigint;
    v_contract_value numeric;
    v_has_conflict boolean;
    v_total_km bigint;
    v_expenses numeric;
    v_rate numeric;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_alloc numeric;
    v_alloc_rental numeric;
    v_alloc_variable numeric;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NOT NULL AND v_period.status IN ('ALLOCATED', 'CLOSED') THEN
        RAISE EXCEPTION 'Competência % do veículo % já alocada/fechada: faça o estorno antes de recalcular.',
            v_month, p_vehicle_id;
    END IF;

    -- Despesas variáveis lançadas no mês (lidas antes do contrato:
    -- competência com despesas pode ser calculada SEM aluguel)
    SELECT COALESCE(sum(e.value), 0)
    INTO v_expenses
    FROM public.vehicles_monthly_expenses e
    WHERE e.vehicle_id = p_vehicle_id
      AND e.reference_month = v_month;

    SELECT c.contract_id, c.monthly_value, c.has_conflict
    INTO v_contract_id, v_contract_value, v_has_conflict
    FROM public.fc_vehicle_rental_contract(p_vehicle_id, v_month) c;

    IF v_contract_id IS NULL THEN
        IF COALESCE(v_expenses, 0) > 0 THEN
            -- Sem contrato de aluguel, com despesas: rateio apenas do
            -- componente VARIABLE (contract_id NULL, valor 0).
            v_contract_value := 0;
            v_has_conflict := false;
        ELSE
            RAISE EXCEPTION 'Sem contrato de aluguel e sem despesas no mês: nada a apurar para o veículo % na competência %.',
                p_vehicle_id, v_month;
        END IF;
    END IF;

    -- Km total do mês (âncora: created_at da linha, fallback da visita).
    -- Inclui linhas 'rate' para que re-calcular uma competência já
    -- alocada não zere o Km (a linha foi CONVERTIDA, não removida).
    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total_km
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    -- custo/km = (aluguel + despesas) / total_km
    -- (sem contrato, aluguel = 0; total_km = 0 => NULL, tudo ociosidade)
    v_rate := CASE
        WHEN v_total_km > 0 THEN round((COALESCE(v_contract_value,0) + v_expenses) / v_total_km::numeric, 6)
        ELSE NULL
    END;
    v_rental_rate := CASE
        WHEN v_total_km > 0 THEN round(COALESCE(v_contract_value,0) / v_total_km::numeric, 6)
        ELSE NULL
    END;
    v_var_rate := CASE
        WHEN v_total_km > 0 AND v_expenses > 0 THEN round(v_expenses / v_total_km::numeric, 6)
        ELSE NULL
    END;

    -- Prévia do apropriado: soma dos valores já arredondados por visita
    -- e por componente (idêntica ao fc_vehicle_rental_allocate)
    SELECT COALESCE(sum(round(ovv.amount * v_rental_rate, 2)), 0),
           COALESCE(sum(round(ovv.amount * v_var_rate, 2)), 0)
    INTO v_alloc_rental, v_alloc_variable
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    v_alloc := v_alloc_rental + v_alloc_variable;

    INSERT INTO public.vehicles_rentals_periods (
        vehicle_id, reference_month, contract_id, contract_value, total_km,
        cost_per_km, variable_value, variable_per_km, allocated_value,
        idle_value, has_conflict, status,
        created_user_id, created_at, updated_user_id, updated_at
    ) VALUES (
        p_vehicle_id, v_month, v_contract_id, COALESCE(v_contract_value, 0), v_total_km,
        v_rate, v_expenses, v_var_rate, v_alloc,
        (COALESCE(v_contract_value,0) + v_expenses) - v_alloc, COALESCE(v_has_conflict, false), 'CALCULATED',
        p_user_id, now(), p_user_id, now()
    )
    ON CONFLICT (vehicle_id, reference_month) DO UPDATE SET
        contract_id = EXCLUDED.contract_id,
        contract_value = EXCLUDED.contract_value,
        total_km = EXCLUDED.total_km,
        cost_per_km = EXCLUDED.cost_per_km,
        variable_value = EXCLUDED.variable_value,
        variable_per_km = EXCLUDED.variable_per_km,
        allocated_value = EXCLUDED.allocated_value,
        idle_value = EXCLUDED.idle_value,
        has_conflict = EXCLUDED.has_conflict,
        status = 'CALCULATED',
        updated_user_id = EXCLUDED.updated_user_id,
        updated_at = now();

    RETURN QUERY
    SELECT p.* FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_allocate(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicles_rentals_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
    v_line record;
    v_rental_id bigint;
    v_var_id bigint;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_value numeric;
    v_alloc_total numeric;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NULL THEN
        RAISE EXCEPTION 'Competência % do veículo % não foi calculada: execute o cálculo antes da alocação.',
            v_month, p_vehicle_id;
    END IF;

    IF v_period.status NOT IN ('CALCULATED', 'ALLOCATED') THEN
        RAISE EXCEPTION 'Competência % está %: reabra antes de alocar.',
            v_month, v_period.status;
    END IF;

    IF v_period.cost_per_km IS NULL THEN
        RAISE EXCEPTION 'Competência % sem Km rodado: nada a alocar (aluguel e despesas ficam integralmente em ociosidade).',
            v_month;
    END IF;

    -- Rates por componentes (mesmos do cálculo): aluguel e despesas
    -- entram em linhas separadas da mesma visita. Sem contrato de
    -- aluguel (contract_id NULL) só o componente VARIABLE é gerado.
    v_rental_rate := CASE
        WHEN v_period.contract_id IS NOT NULL AND v_period.total_km > 0
            THEN round(v_period.contract_value / v_period.total_km::numeric, 6)
        ELSE NULL
    END;
    v_var_rate := CASE
        WHEN COALESCE(v_period.variable_value, 0) > 0
            THEN round(v_period.variable_value / v_period.total_km::numeric, 6)
        ELSE NULL
    END;

    FOR v_line IN
        SELECT ovv.id AS ovv_id,
               ovv.ov_id,
               ovv.amount AS km,
               ovs.ov_costs_status AS visit_status
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = p_vehicle_id
          AND NOT ovv.is_deleted
          AND ovv.cost_type IN ('odometer', 'rate')
          AND ovv.amount > 0
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month'
        ORDER BY ovv.id
    LOOP
        -- Componente RENTAL (aluguel) — somente com contrato vinculado
        IF v_period.contract_id IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM public.vehicles_rentals_allocations a
            WHERE a.period_id = v_period.id
              AND a.ovv_id = v_line.ovv_id
              AND a.cost_component = 'RENTAL'
        ) THEN
            v_value := round(v_line.km * v_rental_rate, 2);

            -- Linha de rateio: amount = km, value_unit = custo/km aluguel.
            -- ov_costs_status copiado da visita => status aprovado preservado.
            INSERT INTO public.orders_visits_vehicles (
                ov_id, vehicle_id, amount, value_unit, discount, cost_type,
                ov_costs_status, created_user_id, created_at, is_deleted
            ) VALUES (
                v_line.ov_id, p_vehicle_id, v_line.km, v_rental_rate, 1,
                'rental', COALESCE(v_line.visit_status, 'pending'), p_user_id, now(), false
            )
            RETURNING id INTO v_rental_id;

            INSERT INTO public.vehicles_rentals_allocations (
                period_id, ov_id, ovv_id, rental_ovv_id, km, rate, value,
                cost_component, created_at
            ) VALUES (
                v_period.id, v_line.ov_id, v_line.ovv_id, v_rental_id,
                v_line.km, v_rental_rate, v_value, 'RENTAL', now()
            )
            ON CONFLICT (period_id, ovv_id, cost_component) DO NOTHING;
        END IF;

        -- Componente VARIABLE (despesas do mês) --------------------------
        IF v_var_rate IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM public.vehicles_rentals_allocations a
            WHERE a.period_id = v_period.id
              AND a.ovv_id = v_line.ovv_id
              AND a.cost_component = 'VARIABLE'
        ) THEN
            v_value := round(v_line.km * v_var_rate, 2);

            INSERT INTO public.orders_visits_vehicles (
                ov_id, vehicle_id, amount, value_unit, discount, cost_type,
                ov_costs_status, created_user_id, created_at, is_deleted
            ) VALUES (
                v_line.ov_id, p_vehicle_id, v_line.km, v_var_rate, 1,
                'variable', COALESCE(v_line.visit_status, 'pending'), p_user_id, now(), false
            )
            RETURNING id INTO v_var_id;

            INSERT INTO public.vehicles_rentals_allocations (
                period_id, ov_id, ovv_id, rental_ovv_id, km, rate, value,
                cost_component, created_at
            ) VALUES (
                v_period.id, v_line.ov_id, v_line.ovv_id, v_var_id,
                v_line.km, v_var_rate, v_value, 'VARIABLE', now()
            )
            ON CONFLICT (period_id, ovv_id, cost_component) DO NOTHING;
        END IF;

        -- Componente R$/km: converte a linha de Km em 'rate' --------
        -- Depois de criadas as allocations (o guard passa a enxergar a
        -- linha via a.ovv_id) e sem tocar em amount/value_unit/value_total,
        -- logo ov_vehicles_value (rollup que soma TODAS as linhas) fica
        -- exatamente igual ao de antes da alocação.
        UPDATE public.orders_visits_vehicles ovv
        SET cost_type = 'rate'
        WHERE ovv.id = v_line.ovv_id
          AND ovv.cost_type = 'odometer';
    END LOOP;

    SELECT COALESCE(sum(a.value), 0)
    INTO v_alloc_total
    FROM public.vehicles_rentals_allocations a
    WHERE a.period_id = v_period.id;

    UPDATE public.vehicles_rentals_periods p
    SET allocated_value = v_alloc_total,
        idle_value = (p.contract_value + COALESCE(p.variable_value, 0)) - v_alloc_total,
        status = 'ALLOCATED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicles_rentals_periods p
    WHERE p.id = v_period.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_close(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicles_rentals_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NULL OR v_period.status = 'OPEN' THEN
        RAISE EXCEPTION 'Competência % do veículo % não foi calculada.', v_month, p_vehicle_id;
    END IF;

    IF v_period.status = 'CLOSED' THEN
        RAISE EXCEPTION 'Competência % do veículo % já está fechada.', v_month, p_vehicle_id;
    END IF;

    IF v_period.status = 'CALCULATED' AND v_period.total_km > 0 THEN
        RAISE EXCEPTION 'Há Km para alocar na competência %: execute a alocação antes de fechar.', v_month;
    END IF;

    UPDATE public.vehicles_rentals_periods p
    SET status = 'CLOSED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicles_rentals_periods p
    WHERE p.id = v_period.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_reopen(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicles_rentals_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NULL THEN
        RAISE EXCEPTION 'Competência % do veículo % não existe.', v_month, p_vehicle_id;
    END IF;

    IF v_period.status <> 'CLOSED' THEN
        RAISE EXCEPTION 'Somente competências fechadas podem ser reabertas (status atual: %).', v_period.status;
    END IF;

    UPDATE public.vehicles_rentals_periods p
    SET status = CASE
            WHEN EXISTS (
                SELECT 1 FROM public.vehicles_rentals_allocations a
                WHERE a.period_id = p.id
            ) THEN 'ALLOCATED'
            ELSE 'CALCULATED'
        END,
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicles_rentals_periods p
    WHERE p.id = v_period.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_revert(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicles_rentals_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
    v_total_km bigint;
    v_expenses numeric;
    v_rate numeric;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_alloc numeric;
    v_alloc_rental numeric;
    v_alloc_variable numeric;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NULL THEN
        RAISE EXCEPTION 'Competência % do veículo % não existe.', v_month, p_vehicle_id;
    END IF;

    IF v_period.status = 'CLOSED' THEN
        RAISE EXCEPTION 'Competência % está fechada: reabra antes de estornar.', v_month;
    END IF;

    IF v_period.status <> 'ALLOCATED' THEN
        RAISE EXCEPTION 'Competência % não tem rateio alocado (status: %).', v_month, v_period.status;
    END IF;

    -- Devolve as linhas de Km convertidas para 'rate' ao odômetro
    -- (ids vêm das allocations — captura ANTES de apagá-las; a troca
    --  de cost_type não muda value_total, então o rollup recalcula o
    --  mesmo ov_vehicles_value e a linha volta a ser editável)
    UPDATE public.orders_visits_vehicles ovv
    SET cost_type = 'odometer'
    WHERE ovv.cost_type = 'rate'
      AND ovv.id IN (
          SELECT a.ovv_id
          FROM public.vehicles_rentals_allocations a
          WHERE a.period_id = v_period.id
      );

    -- Remove as linhas de rateio (o rollup recalcula ov_vehicles_value)
    DELETE FROM public.orders_visits_vehicles ovv
    WHERE ovv.id IN (
        SELECT a.rental_ovv_id
        FROM public.vehicles_rentals_allocations a
        WHERE a.period_id = v_period.id
          AND a.rental_ovv_id IS NOT NULL
    );

    DELETE FROM public.vehicles_rentals_allocations a
    WHERE a.period_id = v_period.id;

    -- Recalcula com o Km e as despesas vigentes
    -- ('odometer' e 'rate' — defensivo: uma linha que por algum motivo
    --  não tenha sido devolvida acima ainda é Km real do mês)
    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total_km
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    SELECT COALESCE(sum(e.value), 0)
    INTO v_expenses
    FROM public.vehicles_monthly_expenses e
    WHERE e.vehicle_id = p_vehicle_id
      AND e.reference_month = v_month;

    v_rate := CASE
        WHEN v_total_km > 0 THEN round((v_period.contract_value + v_expenses) / v_total_km::numeric, 6)
        ELSE NULL
    END;
    v_rental_rate := CASE
        WHEN v_total_km > 0 THEN round(v_period.contract_value / v_total_km::numeric, 6)
        ELSE NULL
    END;
    v_var_rate := CASE
        WHEN v_total_km > 0 AND v_expenses > 0 THEN round(v_expenses / v_total_km::numeric, 6)
        ELSE NULL
    END;

    -- Prévia do apropriado (mesma fórmula componente a componente do
    -- fc_vehicle_rental_calculate/allocate)
    SELECT COALESCE(sum(round(ovv.amount * v_rental_rate, 2)), 0),
           COALESCE(sum(round(ovv.amount * v_var_rate, 2)), 0)
    INTO v_alloc_rental, v_alloc_variable
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type IN ('odometer', 'rate')
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    v_alloc := v_alloc_rental + v_alloc_variable;

    UPDATE public.vehicles_rentals_periods p
    SET total_km = v_total_km,
        cost_per_km = v_rate,
        variable_value = v_expenses,
        variable_per_km = v_var_rate,
        allocated_value = v_alloc,
        idle_value = (p.contract_value + v_expenses) - v_alloc,
        status = 'CALCULATED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicles_rentals_periods p
    WHERE p.id = v_period.id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Triggers (recriados com os nomes novos)
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_vehicles_rentals_period_guard
    BEFORE INSERT OR UPDATE ON public.vehicles_rentals_periods
    FOR EACH ROW EXECUTE FUNCTION public.fc_vehicle_rental_period_guard();

CREATE TRIGGER trg_vehicles_rentals_allocation_guard
    BEFORE INSERT OR UPDATE OR DELETE ON public.vehicles_rentals_allocations
    FOR EACH ROW EXECUTE FUNCTION public.fc_vehicle_rental_allocation_guard();

CREATE TRIGGER trg_vehicles_monthly_expenses_guard
    BEFORE INSERT OR UPDATE OR DELETE ON public.vehicles_monthly_expenses
    FOR EACH ROW EXECUTE FUNCTION public.fc_vehicle_monthly_expenses_guard();

-- ---------------------------------------------------------------------------
-- 8. Grants de sequências (nomes novos)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SEQUENCE public.vehicles_monthly_expenses_id_seq TO authenticated, service_role;
GRANT USAGE ON SEQUENCE public.vehicles_rentals_allocations_id_seq TO authenticated, service_role;
GRANT USAGE ON SEQUENCE public.vehicles_rentals_periods_id_seq TO authenticated, service_role;

COMMIT;
