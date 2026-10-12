-- ============================================================
-- Migration: unifica R$/km no contrato de aluguel
-- Date: 2026-10-20
-- Description:
--   Transfere o R$/km de cfg_vehicle_rate_contracts e de
--   vehicles.value_unit para cfg_vehicles_rentals_contracts.value_unit.
--   Depois da cópia, remove o campo legado de vehicles e a tabela antiga.
--   Uma view somente-leitura com o nome antigo mantém a função de resumo
--   criada em 20261015 compatível até que ela seja substituída.
-- ============================================================

BEGIN;

ALTER TABLE public.cfg_vehicles_rentals_contracts
    ADD COLUMN IF NOT EXISTS value_unit numeric(14,6);

ALTER TABLE public.cfg_vehicles_rentals_contracts
    DROP CONSTRAINT IF EXISTS cfg_vehicles_rentals_contracts_value_unit_ck;

ALTER TABLE public.cfg_vehicles_rentals_contracts
    ADD CONSTRAINT cfg_vehicles_rentals_contracts_value_unit_ck
    CHECK (value_unit IS NULL OR value_unit >= 0);

-- Copia cada tarifa versionada para um contrato de aluguel com a mesma
-- vigência. Quando não há correspondência exata, cria um contrato de
-- veículo com aluguel zero para preservar a vigência histórica do R$/km.
DO $$
DECLARE
    v_old_relation_kind "char";
BEGIN
    SELECT c.relkind
      INTO v_old_relation_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'cfg_vehicle_rate_contracts';

    IF v_old_relation_kind IN ('r', 'p') THEN
        WITH source_rates AS (
            SELECT DISTINCT ON (
                       r.vehicle_id, r.start_date, r.end_date, r.active, r.is_deleted
                   )
                   r.vehicle_id, r.value_unit, r.start_date, r.end_date,
                   r.active, r.description, r.is_deleted, r.created_user_id,
                   r.created_at, r.updated_user_id, r.updated_at
            FROM public.cfg_vehicle_rate_contracts r
            ORDER BY r.vehicle_id, r.start_date, r.end_date,
                     r.active, r.is_deleted, r.id DESC
        )
        UPDATE public.cfg_vehicles_rentals_contracts rental
        SET value_unit = rate.value_unit
        FROM source_rates rate
        WHERE rental.vehicle_id = rate.vehicle_id
          AND rental.start_date = rate.start_date
          AND rental.end_date IS NOT DISTINCT FROM rate.end_date
          AND rental.active = rate.active
          AND rental.is_deleted = rate.is_deleted;

        WITH source_rates AS (
            SELECT DISTINCT ON (
                       r.vehicle_id, r.start_date, r.end_date, r.active, r.is_deleted
                   )
                   r.vehicle_id, r.value_unit, r.start_date, r.end_date,
                   r.active, r.description, r.is_deleted, r.created_user_id,
                   r.created_at, r.updated_user_id, r.updated_at
            FROM public.cfg_vehicle_rate_contracts r
            ORDER BY r.vehicle_id, r.start_date, r.end_date,
                     r.active, r.is_deleted, r.id DESC
        )
        INSERT INTO public.cfg_vehicles_rentals_contracts (
            vehicle_id, monthly_value, value_unit, start_date, end_date,
            active, description, is_deleted, created_user_id, created_at,
            updated_user_id, updated_at
        )
        SELECT rate.vehicle_id, 0, rate.value_unit, rate.start_date,
               rate.end_date, rate.active,
               COALESCE(rate.description, 'Contrato R$/km migrado'),
               rate.is_deleted, rate.created_user_id, rate.created_at,
               rate.updated_user_id, rate.updated_at
        FROM source_rates rate
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.cfg_vehicles_rentals_contracts rental
            WHERE rental.vehicle_id = rate.vehicle_id
              AND rental.start_date = rate.start_date
              AND rental.end_date IS NOT DISTINCT FROM rate.end_date
              AND rental.active = rate.active
              AND rental.is_deleted = rate.is_deleted
        );

        DROP TABLE public.cfg_vehicle_rate_contracts;
    END IF;
END;
$$;

-- Migra o valor estático legado somente como fallback para veículos sem
-- nenhuma tarifa contratual migrada. Prefere o contrato vigente mais
-- recente; veículos sem contrato recebem um contrato R$/km ativo a partir
-- do mês corrente. A coluna de origem só é removida depois desta cópia.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vehicles'
          AND column_name = 'value_unit'
    ) THEN
        WITH legacy_values AS (
            SELECT id AS vehicle_id, value_unit
            FROM public.vehicles
            WHERE value_unit IS NOT NULL
        ),
        contract_candidates AS (
            SELECT rental.id,
                   legacy.value_unit,
                   row_number() OVER (
                       PARTITION BY rental.vehicle_id
                       ORDER BY
                           (rental.start_date <= CURRENT_DATE
                            AND (rental.end_date IS NULL OR rental.end_date >= CURRENT_DATE)) DESC,
                           rental.start_date DESC,
                           rental.id DESC
                   ) AS position
            FROM public.cfg_vehicles_rentals_contracts rental
            JOIN legacy_values legacy ON legacy.vehicle_id = rental.vehicle_id
            WHERE rental.active
              AND NOT rental.is_deleted
              AND rental.value_unit IS NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM public.cfg_vehicles_rentals_contracts populated
                  WHERE populated.vehicle_id = rental.vehicle_id
                    AND populated.value_unit IS NOT NULL
              )
        )
        UPDATE public.cfg_vehicles_rentals_contracts rental
        SET value_unit = candidate.value_unit
        FROM contract_candidates candidate
        WHERE candidate.id = rental.id
          AND candidate.position = 1;

        INSERT INTO public.cfg_vehicles_rentals_contracts (
            vehicle_id, monthly_value, value_unit, start_date, end_date, active,
            description, created_at
        )
        SELECT legacy.id,
               0,
               legacy.value_unit,
               date_trunc('month', CURRENT_DATE)::date,
               NULL,
               true,
               'Contrato R$/km migrado de vehicles.value_unit',
               now()
        FROM public.vehicles legacy
        WHERE legacy.value_unit IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM public.cfg_vehicles_rentals_contracts rental
              WHERE rental.vehicle_id = legacy.id
                AND rental.value_unit IS NOT NULL
          );
    END IF;
END;
$$;

-- Contratos antigos sem tarifa recebem zero, que mantém a regra de exigir
-- contrato vigente no lançamento de Km sem inventar um valor positivo.
UPDATE public.cfg_vehicles_rentals_contracts
SET value_unit = 0
WHERE value_unit IS NULL;

ALTER TABLE public.cfg_vehicles_rentals_contracts
    ALTER COLUMN value_unit SET DEFAULT 0,
    ALTER COLUMN value_unit SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cfg_vehicles_rentals_contracts_vigency
    ON public.cfg_vehicles_rentals_contracts (vehicle_id, start_date, end_date)
    WHERE active AND NOT is_deleted;

-- A RPC usada pelo trigger de odômetro passa a resolver a vigência na
-- tabela unificada.
CREATE OR REPLACE FUNCTION public.fc_vehicle_rate_contract(
    p_vehicle_id bigint,
    p_on_date date
) RETURNS TABLE (
    contract_id bigint,
    value_unit numeric,
    has_conflict boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT rental.id,
           rental.value_unit,
           (count(*) OVER ()) > 1
    FROM public.cfg_vehicles_rentals_contracts rental
    WHERE rental.vehicle_id = p_vehicle_id
      AND rental.active
      AND NOT rental.is_deleted
      AND rental.start_date <= p_on_date
      AND (rental.end_date IS NULL OR rental.end_date >= p_on_date)
    ORDER BY rental.start_date DESC, rental.id DESC
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.fc_vehicle_rate_contract(bigint, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fc_vehicle_rate_contract(bigint, date) TO authenticated, service_role;

COMMENT ON COLUMN public.cfg_vehicles_rentals_contracts.value_unit IS
    'Valor fixo por Km (R$/km) integrado ao mesmo contrato e vigência do aluguel.';

-- Recria v_vehicles sem o campo legado antes de removê-lo da tabela base.
-- Não usa CASCADE; dependências inesperadas devem interromper a migração.
DROP VIEW IF EXISTS public.v_vehicles;

CREATE VIEW public.v_vehicles WITH (security_invoker = true) AS
SELECT id, company_id, department_id, plates, is_available, unit, discount,
       description, finger_print
FROM public.vehicles
ORDER BY plates;

GRANT ALL ON public.v_vehicles TO postgres, anon, authenticated, service_role;

DO $$
DECLARE
    v_role text;
BEGIN
    FOREACH v_role IN ARRAY ARRAY[
        'databasus-e163795d',
        'databasus-93da8106',
        'databasus-3a3c9dfb'
    ] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role) THEN
            EXECUTE format('GRANT SELECT ON public.v_vehicles TO %I', v_role);
        END IF;
    END LOOP;
END;
$$;

ALTER TABLE public.vehicles
    DROP COLUMN IF EXISTS value_unit;

-- 20261015_fc_vehicle_rental_summary ainda consulta o nome legado para
-- incluir veículos com custo operacional sem aluguel. Deixa de existir uma
-- tabela separada: esta view é somente-leitura e projeta os contratos novos.
CREATE OR REPLACE VIEW public.cfg_vehicle_rate_contracts AS
SELECT id, vehicle_id, value_unit, start_date, end_date, active,
       description, is_deleted, created_user_id, created_at,
       updated_user_id, updated_at
FROM public.cfg_vehicles_rentals_contracts;

REVOKE ALL ON public.cfg_vehicle_rate_contracts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.cfg_vehicle_rate_contracts TO authenticated, service_role;

-- Guarda na linha de odômetro a tarifa apropriada completa por Km.
-- Aluguel e despesas ficam registrados no histórico de alocações, sem
-- inserir linhas extras em orders_visits_vehicles.
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
        IF v_flag THEN
            RETURN NEW;
        END IF;
        IF NEW.cost_type <> 'odometer' THEN
            RAISE EXCEPTION 'Linha de rateio (aluguel/despesa/R$/km) só pode ser criada pela apuração mensal (fc_vehicle_rental_*).';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.ov_id IS NOT DISTINCT FROM OLD.ov_id
           AND NEW.vehicle_id IS NOT DISTINCT FROM OLD.vehicle_id
           AND NEW.recorder_start IS NOT DISTINCT FROM OLD.recorder_start
           AND NEW.recorder_end IS NOT DISTINCT FROM OLD.recorder_end
           AND NEW.amount IS NOT DISTINCT FROM OLD.amount
           AND NEW.discount IS NOT DISTINCT FROM OLD.discount
           AND NEW.cost_type IS NOT DISTINCT FROM OLD.cost_type
           AND NEW.value_unit IS NOT DISTINCT FROM OLD.value_unit
           AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted THEN
            RETURN NEW;
        END IF;

        IF NEW.cost_type = 'rate' THEN
            IF NOT v_flag THEN
                RAISE EXCEPTION 'Linha de Km apropriada é gerada pela apuração mensal e não pode ser editada.';
            END IF;
            RETURN NEW;
        END IF;

        IF NEW.cost_type IN ('rental', 'variable') THEN
            IF v_flag THEN
                RETURN NEW;
            END IF;
            RAISE EXCEPTION 'Linha de rateio (aluguel/despesa/R$/km) é gerada pela apuração mensal e não pode ser editada.';
        END IF;

        SELECT p.status, p.id INTO v_status, v_period_id
        FROM public.vehicles_rentals_allocations a
        JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
        WHERE a.ovv_id = NEW.id
        LIMIT 1;

        IF v_status IS NOT NULL AND NOT v_flag THEN
            RAISE EXCEPTION 'Km já rateado na competência % — faça o estorno (fc_vehicle_rental_revert) antes de alterar a leitura do odômetro.',
                v_period_id;
        END IF;

        RETURN NEW;
    END IF;

    IF OLD.cost_type IN ('rental', 'variable') THEN
        IF v_flag THEN
            RETURN OLD;
        END IF;

        SELECT p.status INTO v_status
        FROM public.vehicles_rentals_allocations a
        JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
        WHERE a.rental_ovv_id = OLD.id
        LIMIT 1;

        IF v_status = 'CLOSED' THEN
            RAISE EXCEPTION 'Competência fechada: o rateio (aluguel/despesa) é imutável (reabra a competência para alterar).';
        END IF;

        RETURN OLD;
    END IF;

    SELECT p.status INTO v_status
    FROM public.vehicles_rentals_allocations a
    JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
    WHERE a.ovv_id = OLD.id
    LIMIT 1;

    IF v_status IS NOT NULL AND NOT v_flag THEN
        RAISE EXCEPTION 'Km já rateado — faça o estorno (fc_vehicle_rental_revert) antes de remover a linha do veículo.';
    END IF;

    RETURN OLD;
END;
$$;

-- Mantém value_total sincronizado quando a apropriação atualiza amount ou
-- value_unit na linha existente da visita. Na transição rate -> odometer,
-- restaura a tarifa contratual original da linha e seu total operacional.
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
    v_on_date date;
BEGIN
    IF NEW.cost_type IN ('rental', 'variable') THEN
        NEW.recorder_start := NULL;
        NEW.recorder_end := NULL;
        NEW.value_unit := COALESCE(NEW.value_unit, 0);
        NEW.amount := COALESCE(NEW.amount, 0);
        NEW.value_total := ROUND(
            NEW.amount * NEW.value_unit * COALESCE(NEW.discount, 1), 2
        );
        RETURN NEW;
    END IF;

    IF NEW.cost_type = 'rate' THEN
        NEW.amount := COALESCE(NEW.amount, 0);
        NEW.value_unit := COALESCE(NEW.value_unit, 0);
        NEW.value_total := ROUND(NEW.amount * NEW.value_unit, 2);
        RETURN NEW;
    END IF;

    v_on_date := COALESCE(
        NEW.created_at::date,
        (
            SELECT ovs.ov_created_at::date
            FROM public.orders_visits ovs
            WHERE ovs.id = NEW.ov_id
        ),
        now()::date
    );

    NEW.amount := GREATEST(
        COALESCE(NEW.recorder_end, 0) - COALESCE(NEW.recorder_start, 0),
        0
    );

    SELECT contract.value_unit
      INTO v_price
    FROM public.fc_vehicle_rate_contract(NEW.vehicle_id, v_on_date) contract;

    IF v_price IS NULL THEN
        IF NEW.amount > 0 THEN
            RAISE EXCEPTION 'Veículo (%) sem contrato de R$/km vigente em % — cadastre um contrato antes de informar o Km.',
                COALESCE(
                    (SELECT vehicle.description FROM public.vehicles vehicle WHERE vehicle.id = NEW.vehicle_id),
                    NEW.vehicle_id::text
                ),
                to_char(v_on_date, 'DD/MM/YYYY');
        END IF;
        v_price := 0;
    END IF;

    NEW.value_unit := COALESCE(v_price, 0);
    NEW.value_total := NEW.amount * NEW.value_unit * COALESCE(NEW.discount, 1);
    RETURN NEW;
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
    v_month_end date := (date_trunc('month', p_reference_month::timestamp) + interval '1 month - 1 day')::date;
    v_period public.vehicles_rentals_periods%ROWTYPE;
    v_line record;
    v_rental_rate numeric;
    v_var_rate numeric;
    v_fixed_rate numeric;
    v_appropriate_rate numeric;
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

    v_rental_rate := CASE
        WHEN v_period.contract_id IS NOT NULL AND v_period.total_km > 0
            THEN round(v_period.contract_value / v_period.total_km::numeric, 6)
        ELSE NULL
    END;
    v_var_rate := CASE
        WHEN COALESCE(v_period.variable_value, 0) > 0 AND v_period.total_km > 0
            THEN round(v_period.variable_value / v_period.total_km::numeric, 6)
        ELSE NULL
    END;

    SELECT contract.value_unit
      INTO v_fixed_rate
    FROM public.fc_vehicle_rate_contract(p_vehicle_id, v_month) contract;

    IF v_fixed_rate IS NULL THEN
        SELECT contract.value_unit
          INTO v_fixed_rate
        FROM public.fc_vehicle_rate_contract(p_vehicle_id, v_month_end) contract;
    END IF;

    v_appropriate_rate :=
        COALESCE(v_rental_rate, 0)
        + COALESCE(v_var_rate, 0)
        + COALESCE(v_fixed_rate, 0);

    FOR v_line IN
        SELECT ovv.id AS ovv_id,
               ovv.ov_id,
               ovv.amount AS km
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
        IF v_period.contract_id IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM public.vehicles_rentals_allocations a
            WHERE a.period_id = v_period.id
              AND a.ovv_id = v_line.ovv_id
              AND a.cost_component = 'RENTAL'
        ) THEN
            INSERT INTO public.vehicles_rentals_allocations (
                period_id, ov_id, ovv_id, rental_ovv_id, km, rate, value,
                cost_component, created_at
            ) VALUES (
                v_period.id, v_line.ov_id, v_line.ovv_id, NULL,
                v_line.km, v_rental_rate, round(v_line.km * v_rental_rate, 2), 'RENTAL', now()
            )
            ON CONFLICT (period_id, ovv_id, cost_component) DO NOTHING;
        END IF;

        IF v_var_rate IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM public.vehicles_rentals_allocations a
            WHERE a.period_id = v_period.id
              AND a.ovv_id = v_line.ovv_id
              AND a.cost_component = 'VARIABLE'
        ) THEN
            INSERT INTO public.vehicles_rentals_allocations (
                period_id, ov_id, ovv_id, rental_ovv_id, km, rate, value,
                cost_component, created_at
            ) VALUES (
                v_period.id, v_line.ov_id, v_line.ovv_id, NULL,
                v_line.km, v_var_rate, round(v_line.km * v_var_rate, 2), 'VARIABLE', now()
            )
            ON CONFLICT (period_id, ovv_id, cost_component) DO NOTHING;
        END IF;

        UPDATE public.orders_visits_vehicles ovv
        SET cost_type = 'rate',
            value_unit = v_appropriate_rate
        WHERE ovv.id = v_line.ovv_id
          AND ovv.cost_type IN ('odometer', 'rate');
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

COMMIT;
