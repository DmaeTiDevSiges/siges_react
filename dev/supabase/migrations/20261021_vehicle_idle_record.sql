-- ============================================================================
-- Migration: 20261021_vehicle_idle_record.sql
-- Registro de ociosidade de veículo parado (contrato só-aluguel) vinculado
-- a uma visita/OS, com competência explícita (ex.: lançado em novembro com
-- competência outubro — created_at carimbado no último instante do mês).
--
-- Contexto: veículos com contrato de aluguel e SEM R$/km (value_unit = 0)
-- que ficam parados o mês inteiro (total_km = 0). Antes desta migration o
-- botão CONFIRMAR APROPRIAÇÃO falhava ("sem Km rodado") e o FECHAR travava
-- o mês como ociosidade sem dono. O contorno era lançar 1 Km fake, o que
-- corrompia odômetro, gaps, utilização e cost_per_km.
--
-- Novo tipo de linha em orders_visits_vehicles.cost_type:
--   'idle' = registro manual de ociosidade (amount = 1, value_unit =
--   monthly_value do contrato, value_total = aluguel do mês,
--   recorder_start/end = NULL). Regras:
--     1. Criado/editado/removido pelo usuário (aba Transporte da visita);
--        NUNCA pela apuração (não cria allocation nem converte cost_type).
--     2. EXCLUÍDO do rollup ov_vehicles_value e do total produtivo da
--        visita (seção "Ociosidade (fora do total)" no financeiro).
--     3. 1 registro por veículo + competência (índice único parcial).
--     4. Congelado enquanto a competência estiver ALLOCATED/CLOSED
--        (exige estorno/reabertura, mesmo padrão do Km rateado).
--     5. allocate com total_km = 0: exige o registro (senão mantém o erro,
--        com mensagem orientando); com registro, amarra o aluguel
--        (allocated = contract_value, idle = variable_value).
--     6. close com total_km = 0 e aluguel > 0: exige o registro (bloqueia
--        "fechar sem visita vinculada").
--
-- Aplicação: MANUAL pelo usuário no SQL Editor do Supabase, ANTES de usar
-- o app com o botão "Registrar ociosidade" (o CHECK atual rejeitaria
-- cost_type = 'idle'). Idempotente: pode re-executar. Sem DROP CASCADE:
-- apenas CREATE OR REPLACE + DROP/ADD de CHECK (nenhum objeto depende
-- de CHECK constraint) + CREATE INDEX IF NOT EXISTS.
-- Validação: dev/supabase/validate_vehicle_idle.sql
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. cost_type passa a aceitar 'idle'
--    DROP CONSTRAINT + ADD CONSTRAINT sem CASCADE (mesmo padrão da
--    migration 20261009 §4 — nenhum objeto depende de CHECK).
-- ------------------------------------------------------------
ALTER TABLE public.orders_visits_vehicles
    DROP CONSTRAINT IF EXISTS orders_visits_vehicles_cost_type_ck;

ALTER TABLE public.orders_visits_vehicles
    ADD CONSTRAINT orders_visits_vehicles_cost_type_ck
    CHECK (cost_type IN ('odometer', 'rental', 'variable', 'rate', 'idle'));

-- ------------------------------------------------------------
-- 2. Um registro de ociosidade por veículo + competência
--    A competência da linha é o mês de created_at (o app carimba o
--    último instante do mês escolhido, ex. 31/10 23:59).
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_ovv_idle_vehicle_month
    ON public.orders_visits_vehicles (vehicle_id, (date_trunc('month', created_at)))
    WHERE cost_type = 'idle' AND NOT is_deleted;

-- ------------------------------------------------------------
-- 3. Guard: 'idle' é linha MANUAL (como 'odometer'), nunca de apuração.
--    Base: 20261020 (mesma assinatura — o trigger existente continua
--    apontando para a função. Sem DROP.)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_rateio_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_flag boolean := coalesce(current_setting('app.vehicle_rental_write', true), '') = '1';
    v_status character varying;
    v_period_id bigint;
    v_idle_month date;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF v_flag THEN
            RETURN NEW;
        END IF;
        -- Ociosidade e odômetro nascem na visita; rateio só na apuração
        IF NEW.cost_type IN ('odometer', 'idle') THEN
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

        -- Ociosidade apropriada/fechada: congelada até estorno/reabertura
        IF NEW.cost_type = 'idle' OR OLD.cost_type = 'idle' THEN
            IF NOT v_flag THEN
                v_idle_month := (date_trunc('month', COALESCE(
                    OLD.created_at,
                    (SELECT ovs.ov_created_at FROM public.orders_visits ovs WHERE ovs.id = OLD.ov_id),
                    now()
                )))::date;
                SELECT p.status INTO v_status
                FROM public.vehicles_rentals_periods p
                WHERE p.vehicle_id = OLD.vehicle_id
                  AND p.reference_month = v_idle_month;
                IF v_status IN ('ALLOCATED', 'CLOSED') THEN
                    RAISE EXCEPTION 'Ociosidade já apropriada na competência % — faça o estorno (ou reabra) antes de alterar o registro.', v_idle_month;
                END IF;
            END IF;
            RETURN NEW;
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

    -- DELETE ------------------------------------------------------------------
    -- Ociosidade apropriada/fechada: imutável até estorno/reabertura
    IF OLD.cost_type = 'idle' THEN
        IF v_flag THEN
            RETURN OLD;
        END IF;
        v_idle_month := (date_trunc('month', COALESCE(
            OLD.created_at,
            (SELECT ovs.ov_created_at FROM public.orders_visits ovs WHERE ovs.id = OLD.ov_id),
            now()
        )))::date;
        SELECT p.status INTO v_status
        FROM public.vehicles_rentals_periods p
        WHERE p.vehicle_id = OLD.vehicle_id
          AND p.reference_month = v_idle_month;
        IF v_status IN ('ALLOCATED', 'CLOSED') THEN
            RAISE EXCEPTION 'Ociosidade já apropriada na competência % — faça o estorno (ou reabra) antes de remover o registro.', v_idle_month;
        END IF;
        RETURN OLD;
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

-- ------------------------------------------------------------
-- 4. before_save: ramo 'idle' (sem odômetro, sem buscar contrato
--    de R$/km). Base: 20261020, mesma assinatura.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
    v_on_date date;
BEGIN
    -- Registro de ociosidade: amount = 1 (mensalidade), value_unit =
    -- aluguel do mês informado no lançamento. Sem odômetro.
    IF NEW.cost_type = 'idle' THEN
        NEW.recorder_start := NULL;
        NEW.recorder_end := NULL;
        NEW.amount := COALESCE(NEW.amount, 1);
        NEW.discount := COALESCE(NEW.discount, 1);
        NEW.value_unit := COALESCE(NEW.value_unit, 0);
        NEW.value_total := ROUND(
            NEW.amount * NEW.value_unit * NEW.discount, 2
        );
        RETURN NEW;
    END IF;

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

-- ------------------------------------------------------------
-- 5. Rollup: ociosidade NÃO compõe ov_vehicles_value (extraída do
--    total produtivo da visita; exibida em seção própria).
--    IS DISTINCT FROM preserva linhas legadas com cost_type NULL.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
    target_ov_id bigint;
begin
    -- Identifica qual visita deve ser recalculada
    if TG_OP = 'DELETE' then
        target_ov_id := OLD.ov_id;
    else
        target_ov_id := NEW.ov_id;
    end if;

    -- Faz a soma (exceto ociosidade) e atualiza a visita
    update public.orders_visits
    set ov_vehicles_value = (
        select coalesce(sum(value_total), 0)
        from public.orders_visits_vehicles
        where ov_id = target_ov_id
          and cost_type IS DISTINCT FROM 'idle'
    )
    where id = target_ov_id;

    return null; -- Gatilhos 'AFTER' podem retornar null
end;
$$;

-- ------------------------------------------------------------
-- 6. allocate: competência sem Km rodado passa a aceitar o registro
--    de ociosidade (amarra o aluguel à visita vinculada).
--    Sem registro, mantém o bloqueio — com mensagem orientando.
--    Base: 20261020 (mesma assinatura e corpo; só o ramo
--    cost_per_km IS NULL muda).
-- ------------------------------------------------------------
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
    v_idle_count bigint;
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

    -- Sem Km rodado: só aloca se houver registro de ociosidade na
    -- competência (o registro absorve o aluguel; despesas variáveis
    -- sem Km permanecem em ociosidade). Sem registro, bloqueia com
    -- orientação em vez de travar o mês como ociosidade sem dono.
    IF v_period.cost_per_km IS NULL THEN
        SELECT count(*) INTO v_idle_count
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = p_vehicle_id
          AND NOT ovv.is_deleted
          AND ovv.cost_type = 'idle'
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

        IF v_period.contract_id IS NULL OR v_idle_count = 0 THEN
            RAISE EXCEPTION 'Competência % sem Km rodado e sem registro de ociosidade: registre a ociosidade do veículo em uma visita (aba Transporte) ou feche a competência para manter o valor em ociosidade.',
                v_month;
        END IF;

        -- Amarra: aluguel vai para a visita vinculada; o restante fica ocioso
        UPDATE public.vehicles_rentals_periods p
        SET allocated_value = p.contract_value,
            idle_value = COALESCE(p.variable_value, 0),
            status = 'ALLOCATED',
            updated_user_id = p_user_id,
            updated_at = now()
        WHERE p.id = v_period.id;

        RETURN QUERY
        SELECT p.* FROM public.vehicles_rentals_periods p
        WHERE p.id = v_period.id;
        RETURN;
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

-- ------------------------------------------------------------
-- 7. close: competência 100% ociosa COM aluguel só fecha com visita
--    vinculada (registro de ociosidade). Base: 20261015 (mesma
--    assinatura; só o ramo total_km = 0 muda).
-- ------------------------------------------------------------
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
    v_idle_count bigint;
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

    -- Veículo parado com aluguel: exige o registro de ociosidade
    -- vinculado a uma visita (não fecha "sem dono").
    IF v_period.total_km = 0 AND COALESCE(v_period.contract_value, 0) > 0 THEN
        SELECT count(*) INTO v_idle_count
        FROM public.orders_visits_vehicles ovv
        JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
        WHERE ovv.vehicle_id = p_vehicle_id
          AND NOT ovv.is_deleted
          AND ovv.cost_type = 'idle'
          AND COALESCE(ovv.created_at, ovs.ov_created_at) >= v_month
          AND COALESCE(ovv.created_at, ovs.ov_created_at) < v_month + interval '1 month';

        IF v_idle_count = 0 THEN
            RAISE EXCEPTION 'Não é possível fechar a competência % do veículo % sem visita vinculada: registre a ociosidade em uma OS (aba Transporte da visita) antes de fechar.', v_month, p_vehicle_id;
        END IF;
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

COMMIT;
