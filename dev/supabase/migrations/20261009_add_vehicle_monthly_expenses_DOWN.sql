-- ============================================================
-- DOWN: Rateio de Aluguel Veicular — Fase 2 (despesas variáveis)
-- Date: 2026-10-09
-- Description:
--   Reverte integralmente a migration
--   20261009_add_vehicle_monthly_expenses.sql, restaurando os
--   objetos da Fase 1 exatamente como foram definidos em
--   20261008_create_vehicle_rental_rateio.sql (os corpos abaixo
--   são cópias literais dessa migration, extraídas por script).
--
--   Ordem: objetos dependentes primeiro; nenhum DROP ... CASCADE.
--   Aplicação MANUAL no SQL Editor do Supabase.
--
--   ⚠ Remove a tabela de despesas: os lançamentos lançados são
--     perdidos (a migration principal também perde — não há
--     downgrade de dados).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Remove os DADOS gerados pela Fase 2 (linhas 'variable' e
--    suas allocations) e recalcula os períodos só-com-aluguel.
--    Sem isso, o allocate da Fase 1 somaria allocations VARIABLE
--    orfãs ou usaria um cost_per_km ainda inflado pelas despesas.
--    Também devolve as linhas de Km convertidas ('rate') ao
--    odômetro — ANTES de tudo, para os recálculos desta seção e o
--    allocate da Fase 1 enxergarem o Km inteiro; a troca não muda
--    amount/value_unit/value_total (o before_save da Fase 2 trata a
--    conversão) e ov_vehicles_value permanece o mesmo.
--    A flag de sessão libera os guards durante o processo.
-- ------------------------------------------------------------
DO $$
DECLARE
    v_period record;
    v_km     bigint;
    v_rate   numeric;
    v_alloc  numeric;
BEGIN
    IF to_regclass('public.vehicles_rentals_allocations') IS NOT NULL THEN
        PERFORM set_config('app.vehicle_rental_write', '1', true);

        UPDATE public.orders_visits_vehicles
        SET cost_type = 'odometer'
        WHERE cost_type = 'rate';

        DELETE FROM public.orders_visits_vehicles
        WHERE id IN (
            SELECT a.rental_ovv_id
            FROM public.vehicles_rentals_allocations a
            WHERE a.cost_component = 'VARIABLE'
              AND a.rental_ovv_id IS NOT NULL
        );

        DELETE FROM public.vehicles_rentals_allocations a
        WHERE a.cost_component = 'VARIABLE';

        -- Recalcula cada período com a fórmula da Fase 1
        -- (custo/km = aluguel ÷ Km do mês; sem despesas)
        FOR v_period IN
            SELECT p.id, p.vehicle_id, p.reference_month, p.contract_value
            FROM public.vehicle_rental_periods p
        LOOP
            SELECT COALESCE(sum(ovv.amount), 0)::bigint
            INTO v_km
            FROM public.orders_visits_vehicles ovv
            JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
            WHERE ovv.vehicle_id = v_period.vehicle_id
              AND NOT ovv.is_deleted
              AND ovv.cost_type = 'odometer'
              AND ovv.amount > 0
              AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_period.reference_month
              AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_period.reference_month + interval '1 month';

            v_rate := CASE
                WHEN v_km > 0 THEN round(v_period.contract_value / v_km::numeric, 6)
                ELSE NULL
            END;

            SELECT COALESCE(sum(round(ovv.amount * v_rate, 2)), 0)
            INTO v_alloc
            FROM public.orders_visits_vehicles ovv
            JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
            WHERE ovv.vehicle_id = v_period.vehicle_id
              AND NOT ovv.is_deleted
              AND ovv.cost_type = 'odometer'
              AND ovv.amount > 0
              AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_period.reference_month
              AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_period.reference_month + interval '1 month';

            UPDATE public.vehicle_rental_periods p
            SET total_km = v_km,
                cost_per_km = v_rate,
                variable_value = 0,
                variable_per_km = NULL,
                allocated_value = v_alloc,
                idle_value = v_period.contract_value - v_alloc
            WHERE p.id = v_period.id;
        END LOOP;

        PERFORM set_config('app.vehicle_rental_write', 'off', true);
    END IF;
END $$;

-- ------------------------------------------------------------
-- 1. Remove os objetos novos da Fase 2 (dependente primeiro)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vehicle_monthly_expenses_guard ON public.vehicle_monthly_expenses;
DROP FUNCTION IF EXISTS public.fc_vehicle_monthly_expenses_guard();
DROP TABLE IF EXISTS public.vehicle_monthly_expenses;

-- ------------------------------------------------------------
-- 2. Guard de linhas rateadas: volta a cobrir apenas 'rental'
--    (CREATE OR REPLACE: mesma assinatura, trigger permanece)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_rateio_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_flag boolean := coalesce(current_setting('app.vehicle_rental_write', true), '') = '1';
    v_status character varying;
    v_period_id bigint;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Linhas de rateio/despesa só nascem na apuração (RPC)
        IF v_flag THEN
            RETURN NEW;
        END IF;
        IF NEW.cost_type <> 'odometer' THEN
            RAISE EXCEPTION 'Linha de rateio/despesa só pode ser criada pela apuração mensal (fc_vehicle_rental_*).';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Atualizações que não tocam em Km/valores são sempre permitidas
        -- (ex.: fc_sync_ov_costs_status espelha ov_costs_status da visita
        -- em todas as linhas filhas — incluindo linhas rental/rateadas)
        IF NEW.ov_id IS NOT DISTINCT FROM OLD.ov_id
           AND NEW.vehicle_id IS NOT DISTINCT FROM OLD.vehicle_id
           AND NEW.recorder_start IS NOT DISTINCT FROM OLD.recorder_start
           AND NEW.recorder_end IS NOT DISTINCT FROM OLD.recorder_end
           AND NEW.amount IS NOT DISTINCT FROM OLD.amount
           AND NEW.discount IS NOT DISTINCT FROM OLD.discount
           AND NEW.cost_type IS NOT DISTINCT FROM OLD.cost_type
           AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted THEN
            RETURN NEW;
        END IF;

        -- Linha de rateio: nunca editável fora da RPC
        IF NEW.cost_type = 'rental' THEN
            IF v_flag THEN
                RETURN NEW;
            END IF;
            RAISE EXCEPTION 'Linha de rateio de aluguel é gerada pela apuração mensal e não pode ser editada.';
        END IF;

        -- Linha de odômetro já rateada: congelada até o estorno
        SELECT p.status, p.id INTO v_status, v_period_id
        FROM public.vehicles_rentals_allocations a
        JOIN public.vehicle_rental_periods p ON p.id = a.period_id
        WHERE a.ovv_id = NEW.id
        LIMIT 1;

        IF v_status IS NOT NULL AND NOT v_flag THEN
            RAISE EXCEPTION 'Km já rateado na competência % — faça o estorno (fc_vehicle_rental_revert) antes de alterar a leitura do odômetro.',
                v_period_id;
        END IF;

        RETURN NEW;
    END IF;

    -- DELETE ------------------------------------------------------------------
    IF OLD.cost_type = 'rental' THEN
        IF v_flag THEN
            RETURN OLD;
        END IF;

        SELECT p.status INTO v_status
        FROM public.vehicles_rentals_allocations a
        JOIN public.vehicle_rental_periods p ON p.id = a.period_id
        WHERE a.rental_ovv_id = OLD.id
        LIMIT 1;

        IF v_status = 'CLOSED' THEN
            RAISE EXCEPTION 'Competência fechada: o rateio de aluguel é imutável (reabra a competência para alterar).';
        END IF;

        RETURN OLD;
    END IF;

    -- Linha de odômetro já rateada: bloqueia exclusão fora da RPC
    SELECT p.status INTO v_status
    FROM public.vehicles_rentals_allocations a
    JOIN public.vehicle_rental_periods p ON p.id = a.period_id
    WHERE a.ovv_id = OLD.id
    LIMIT 1;

    IF v_status IS NOT NULL AND NOT v_flag THEN
        RAISE EXCEPTION 'Km já rateado — faça o estorno (fc_vehicle_rental_revert) antes de remover a linha do veículo.';
    END IF;

    RETURN OLD;
END;
$$;

-- ------------------------------------------------------------
-- 2.1 cost_type volta a 3 valores e before_save volta ao corpo
--     da Fase 1 (sem o ramo de conversão 'odometer' <-> 'rate').
--     Só é seguro aqui porque a seção 0 já converteu de volta
--     todas as linhas 'rate' — nenhum valor 'rate' remanesce.
--     CHECK restaurada por DROP + ADD (nada depende dela; sem CASCADE).
-- ------------------------------------------------------------
ALTER TABLE public.orders_visits_vehicles
    DROP CONSTRAINT IF EXISTS orders_visits_vehicles_cost_type_ck;

ALTER TABLE public.orders_visits_vehicles
    ADD CONSTRAINT orders_visits_vehicles_cost_type_ck
    CHECK (cost_type IN ('odometer', 'rental', 'variable'));

CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
BEGIN

    -- Linhas de rateio/despesa não têm odômetro: preserva amount/value_unit
    -- informados e recalcula apenas value_total.
    IF NEW.cost_type IN ('rental', 'variable') THEN
        NEW.recorder_start := NULL;
        NEW.recorder_end   := NULL;
        NEW.value_unit     := COALESCE(NEW.value_unit, 0);
        NEW.amount         := COALESCE(NEW.amount, 0);
        NEW.value_total    := ROUND(
            NEW.amount * NEW.value_unit * COALESCE(NEW.discount, 1), 2
        );
        RETURN NEW;
    END IF;

    SELECT value_unit
    INTO v_price
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;

    NEW.value_unit := COALESCE(v_price,0);

    NEW.amount :=
        GREATEST(
            COALESCE(NEW.recorder_end,0)
            - COALESCE(NEW.recorder_start,0),
            0
        );

    NEW.value_total :=
        NEW.amount
        * NEW.value_unit
        * COALESCE(NEW.discount,1);

    RETURN NEW;

END;
$$;

-- ------------------------------------------------------------
-- 3. summary/detail: return type original da Fase 1
--    (DROP sem CASCADE antes do CREATE — a Fase 2 ampliou as colunas)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_summary(date);
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
    utilization numeric
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
    v_alloc numeric;
    v_value numeric;
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

        -- Km total do mês (âncora: created_at da linha, fallback da visita)
        SELECT COALESCE(sum(ovv.amount), 0)::bigint
        INTO v_km
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = v_row.vvehicle
          AND NOT ovv.is_deleted
          AND ovv.cost_type = 'odometer'
          AND ovv.amount > 0
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

        v_value := COALESCE(v_period.contract_value, v_row.vvalue, 0);

        IF v_period.id IS NOT NULL THEN
            period_id := v_period.id;
            period_status := v_period.status;
            total_km := v_period.total_km;
            v_rate := v_period.cost_per_km;
            v_alloc := v_period.allocated_value;
        ELSE
            period_id := NULL;
            period_status := 'OPEN';
            total_km := v_km;
            v_rate := CASE WHEN v_km > 0 THEN v_value / v_km::numeric ELSE NULL END;
            -- Prévia: soma dos valores rateados com o custo/km previsto
            SELECT COALESCE(sum(round(ovv.amount * v_rate, 2)), 0)
            INTO v_alloc
            FROM public.orders_visits_vehicles ovv
            JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
            WHERE ovv.vehicle_id = v_row.vvehicle
              AND NOT ovv.is_deleted
              AND ovv.cost_type = 'odometer'
              AND ovv.amount > 0
              AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
              AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';
        END IF;

        vehicle_id := v_row.vvehicle;
        vehicle_description := v_row.vd;
        vehicle_plates := v_row.vp;
        contract_id := v_row.vcid;
        contract_value := v_value;
        has_conflict := v_row.vconflict;
        cost_per_km := v_rate;
        allocated_value := v_alloc;
        idle_value := v_value - v_alloc;
        utilization := CASE WHEN v_value > 0 THEN round(v_alloc / v_value, 4) ELSE NULL END;

        RETURN NEXT;
    END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.fc_vehicle_rental_detail(bigint, date);
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
    rental_ovv_id bigint
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_month date := (date_trunc('month', p_reference_month::timestamp))::date;
    v_period public.vehicle_rental_periods%ROWTYPE;
    v_rate numeric;
    v_value numeric;
    v_total bigint;
BEGIN
    SELECT p.* INTO v_period
    FROM public.vehicle_rental_periods p
    WHERE p.vehicle_id = p_vehicle_id
      AND p.reference_month = v_month;

    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    v_value := COALESCE(v_period.contract_value, 0);
    IF v_period.cost_per_km IS NOT NULL THEN
        v_rate := v_period.cost_per_km;
    ELSIF v_period.id IS NULL THEN
        -- Sem cálculo: usa o contrato vigente para a prévia
        SELECT c.monthly_value INTO v_value
        FROM public.fc_vehicle_rental_contract(p_vehicle_id, v_month) c;
        v_rate := CASE WHEN v_total > 0 THEN v_value / v_total::numeric ELSE NULL END;
    ELSE
        v_rate := NULL;
    END IF;

    RETURN QUERY
    SELECT
        v_period.id,
        COALESCE(v_period.status, 'OPEN')::character varying,
        ovv.ov_id,
        ovv.id,
        ovs.ov_mask,
        ovv.amount,
        v_rate,
        round(ovv.amount * v_rate, 2),
        a.rental_ovv_id
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    LEFT JOIN public.vehicles_rentals_allocations a
           ON a.ovv_id = ovv.id
          AND a.period_id IS NOT DISTINCT FROM v_period.id
          AND a.cost_component = 'RENTAL'
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month'
    ORDER BY COALESCE(ovv.created_at, ovs.ov_created_at), ovv.id;
END;
$$;

-- ------------------------------------------------------------
-- 4. calculate/allocate/revert: fórmulas só-com-aluguel da Fase 1
--    (CREATE OR REPLACE: assinaturas idênticas)
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
    v_rate numeric;
    v_alloc numeric;
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

    -- Km total do mês (âncora: created_at da linha, fallback da visita)
    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total_km
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    -- custo/km = aluguel / total_km  (total_km = 0 => NULL, tudo ociosidade)
    v_rate := CASE
        WHEN v_total_km > 0 THEN round(v_contract_value / v_total_km::numeric, 6)
        ELSE NULL
    END;

    -- Prévia do apropriado: soma dos valores já arredondados por visita
    SELECT COALESCE(sum(round(ovv.amount * v_rate, 2)), 0)
    INTO v_alloc
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    INSERT INTO public.vehicle_rental_periods (
        vehicle_id, reference_month, contract_id, contract_value, total_km,
        cost_per_km, allocated_value, idle_value, has_conflict, status,
        created_user_id, created_at, updated_user_id, updated_at
    ) VALUES (
        p_vehicle_id, v_month, v_contract_id, v_contract_value, v_total_km,
        v_rate, v_alloc, v_contract_value - v_alloc, v_has_conflict, 'CALCULATED',
        p_user_id, now(), p_user_id, now()
    )
    ON CONFLICT (vehicle_id, reference_month) DO UPDATE SET
        contract_id = EXCLUDED.contract_id,
        contract_value = EXCLUDED.contract_value,
        total_km = EXCLUDED.total_km,
        cost_per_km = EXCLUDED.cost_per_km,
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
        RAISE EXCEPTION 'Competência % sem Km rodado: nada a alocar (o valor do aluguel fica integralmente em ociosidade).',
            v_month;
    END IF;

    FOR v_line IN
        SELECT ovv.id AS ovv_id,
               ovv.ov_id,
               ovv.amount AS km,
               ovs.ov_costs_status AS visit_status
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = p_vehicle_id
          AND NOT ovv.is_deleted
          AND ovv.cost_type = 'odometer'
          AND ovv.amount > 0
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month'
        ORDER BY ovv.id
    LOOP
        -- Idempotência de re-execução
        IF EXISTS (
            SELECT 1
            FROM public.vehicles_rentals_allocations a
            WHERE a.period_id = v_period.id
              AND a.ovv_id = v_line.ovv_id
              AND a.cost_component = 'RENTAL'
        ) THEN
            CONTINUE;
        END IF;

        v_value := round(v_line.km * v_period.cost_per_km, 2);

        -- Linha de rateio: amount = km, value_unit = custo/km do período.
        -- ov_costs_status copiado da visita => status aprovado é preservado.
        INSERT INTO public.orders_visits_vehicles (
            ov_id, vehicle_id, amount, value_unit, discount, cost_type,
            ov_costs_status, created_user_id, created_at, is_deleted
        ) VALUES (
            v_line.ov_id, p_vehicle_id, v_line.km, v_period.cost_per_km, 1,
            'rental', COALESCE(v_line.visit_status, 'pending'), p_user_id, now(), false
        )
        RETURNING id INTO v_rental_id;

        INSERT INTO public.vehicles_rentals_allocations (
            period_id, ov_id, ovv_id, rental_ovv_id, km, rate, value,
            cost_component, created_at
        ) VALUES (
            v_period.id, v_line.ov_id, v_line.ovv_id, v_rental_id,
            v_line.km, v_period.cost_per_km, v_value, 'RENTAL', now()
        )
        ON CONFLICT (period_id, ovv_id, cost_component) DO NOTHING;
    END LOOP;

    SELECT COALESCE(sum(a.value), 0)
    INTO v_alloc_total
    FROM public.vehicles_rentals_allocations a
    WHERE a.period_id = v_period.id;

    UPDATE public.vehicle_rental_periods p
    SET allocated_value = v_alloc_total,
        idle_value = p.contract_value - v_alloc_total,
        status = 'ALLOCATED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicle_rental_periods p
    WHERE p.id = v_period.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fc_vehicle_rental_revert(
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
    v_total_km bigint;
    v_rate numeric;
    v_alloc numeric;
BEGIN
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    SELECT p.* INTO v_period
    FROM public.vehicle_rental_periods p
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

    -- Recalcula com o Km vigente (mantém a competência CALCULATED)
    SELECT COALESCE(sum(ovv.amount), 0)::bigint
    INTO v_total_km
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    v_rate := CASE
        WHEN v_total_km > 0 THEN round(v_period.contract_value / v_total_km::numeric, 6)
        ELSE NULL
    END;

    SELECT COALESCE(sum(round(ovv.amount * v_rate, 2)), 0)
    INTO v_alloc
    FROM public.orders_visits_vehicles ovv
    JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
    WHERE ovv.vehicle_id = p_vehicle_id
      AND NOT ovv.is_deleted
      AND ovv.cost_type = 'odometer'
      AND ovv.amount > 0
      AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
      AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

    UPDATE public.vehicle_rental_periods p
    SET total_km = v_total_km,
        cost_per_km = v_rate,
        allocated_value = v_alloc,
        idle_value = p.contract_value - v_alloc,
        status = 'CALCULATED',
        updated_user_id = p_user_id,
        updated_at = now()
    WHERE p.id = v_period.id;

    RETURN QUERY
    SELECT p.* FROM public.vehicle_rental_periods p
    WHERE p.id = v_period.id;
END;
$$;

-- ------------------------------------------------------------
-- 5. Permissões das RPCs restauradas (DROP recria sem ACL;
--    CREATE OR REPLACE preserva, mas reemitir é inofensivo)
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_summary(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_detail(bigint, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_calculate(bigint, date, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_allocate(bigint, date, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fc_vehicle_rental_revert(bigint, date, bigint) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_summary(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_detail(bigint, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_calculate(bigint, date, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_allocate(bigint, date, bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rental_revert(bigint, date, bigint) TO authenticated, service_role;
