-- ============================================================
-- DOWN: Despesas variáveis SEM contrato de aluguel
-- Date: 2026-10-11
-- Description:
--   Reverte a migration 20261011_expenses_without_rental_contract.sql
--   restaurando os 4 corpos de função EXATAMENTE como definidos em
--   20261009_add_vehicle_monthly_expenses.sql (extraídos literalmente
--   daquele arquivo):
--     • summary: volta a listar apenas períodos + contratos de aluguel
--       (as legs de despesas e de contrato de R$/km somem);
--     • detail: volta a ficar sem o COALESCE de v_contract;
--     • calculate: volta a exigir contrato de aluguel ativo (erro
--       "Nenhum contrato de aluguel ativo ...") em qualquer caso;
--     • allocate: volta a gerar o componente RENTAL sempre.
--
--   Sem mudança de assinatura/return type => CREATE OR REPLACE
--   (nenhum DROP, nenhum CASCADE — regra do AGENTS.md).
--   Alterações NÃO revertidas aqui (por serem de outras migrations):
--   a tabela cfg_vehicle_rate_contracts (20261010) e a coluna
--   contract_id nullable do período (já era nullable na Fase 1).
--
--   Aplicação MANUAL no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. summary (corpo original da Fase 2)
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
-- 2. detail (corpo original da Fase 2)
-- ------------------------------------------------------------
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
    v_period public.vehicle_rental_periods%ROWTYPE;
    v_contract numeric;
    v_variable numeric;
    v_rate numeric;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_rate_km bigint;
    v_total bigint;
BEGIN
    SELECT p.* INTO v_period
    FROM public.vehicle_rental_periods p
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

        SELECT COALESCE(sum(e.value), 0) INTO v_variable
        FROM public.vehicle_monthly_expenses e
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

-- ------------------------------------------------------------
-- 3. calculate (corpo original da Fase 2)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_calculate(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicle_rental_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicle_rental_periods%ROWTYPE;
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
    FROM public.vehicle_rental_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month
    FOR UPDATE;

    IF v_period.id IS NOT NULL AND v_period.status IN ('ALLOCATED', 'CLOSED') THEN
        RAISE EXCEPTION 'Competência % do veículo % já alocada/fechada: faça o estorno antes de recalcular.',
            v_month, p_vehicle_id;
    END IF;

    SELECT c.contract_id, c.monthly_value, c.has_conflict
    INTO v_contract_id, v_contract_value, v_has_conflict
    FROM public.fc_vehicle_rental_contract(p_vehicle_id, v_month) c;

    IF v_contract_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum contrato de aluguel ativo para o veículo % na competência %.',
            p_vehicle_id, v_month;
    END IF;

    -- Despesas variáveis lançadas no mês
    SELECT COALESCE(sum(e.value), 0)
    INTO v_expenses
    FROM public.vehicle_monthly_expenses e
    WHERE e.vehicle_id = p_vehicle_id
      AND e.reference_month = v_month;

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
    -- (total_km = 0 => NULL, tudo vira ociosidade)
    v_rate := CASE
        WHEN v_total_km > 0 THEN round((v_contract_value + v_expenses) / v_total_km::numeric, 6)
        ELSE NULL
    END;
    v_rental_rate := CASE
        WHEN v_total_km > 0 THEN round(v_contract_value / v_total_km::numeric, 6)
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

    INSERT INTO public.vehicle_rental_periods (
        vehicle_id, reference_month, contract_id, contract_value, total_km,
        cost_per_km, variable_value, variable_per_km, allocated_value,
        idle_value, has_conflict, status,
        created_user_id, created_at, updated_user_id, updated_at
    ) VALUES (
        p_vehicle_id, v_month, v_contract_id, v_contract_value, v_total_km,
        v_rate, v_expenses, v_var_rate, v_alloc,
        (v_contract_value + v_expenses) - v_alloc, v_has_conflict, 'CALCULATED',
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
    SELECT p.* FROM public.vehicle_rental_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month;
END;
$$;

-- ------------------------------------------------------------
-- 4. allocate (corpo original da Fase 2)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_allocate(
    p_vehicle_id bigint,
    p_reference_month date,
    p_user_id bigint DEFAULT NULL
) RETURNS SETOF public.vehicle_rental_periods
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicle_rental_periods%ROWTYPE;
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
    FROM public.vehicle_rental_periods p
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

    -- Rates por componente (memósmos do cálculo): aluguel e despesas
    -- entram em linhas separadas da mesma visita.
    v_rental_rate := round(v_period.contract_value / v_period.total_km::numeric, 6);
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
        -- Componente RENTAL (aluguel) ------------------------------------
        IF NOT EXISTS (
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

    UPDATE public.vehicle_rental_periods p
    SET allocated_value = v_alloc_total,
        idle_value = (p.contract_value + COALESCE(p.variable_value, 0)) - v_alloc_total,
        status = 'ALLOCATED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicle_rental_periods p
    WHERE p.id = v_period.id;
END;
$$;

-- ------------------------------------------------------------
-- 5. Permissões (redeclaração idempotente)
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_summary(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_detail(bigint, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_calculate(bigint, date, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_allocate(bigint, date, bigint) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_summary(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_detail(bigint, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_calculate(bigint, date, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_allocate(bigint, date, bigint) TO authenticated, service_role;

-- ============================================================
-- FIM DO DOWN 20261011_expenses_without_rental_contract_DOWN.sql
-- ============================================================
