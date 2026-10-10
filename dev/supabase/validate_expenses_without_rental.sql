-- ============================================================
-- Validação manual: Despesas variáveis SEM contrato de aluguel
-- Data: 2026-10-11
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode as migrations 20261008 (Fase 1) e 20261009 (Fase 2).
--   2. Rode a migration 20261010 (contratos de R$/km — a leg de
--      resumo por R$/km depende dela).
--   3. Rode a migration 20261011_expenses_without_rental_contract.sql.
--   4. Rode ESTE arquivo inteiro (Execute).
--   5. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. summary lista veículo SEM contrato de aluguel que tem despesas
--      no mês (contract_id NULL / contract_value 0) — e TAMBÉM o
--      veículo que só tem contrato de R$/km vigente
--   2. summary NÃO lista veículo sem período, sem contrato de aluguel,
--      sem despesas e sem contrato de R$/km
--   3. calculate SEM contrato + com despesas => OK: contract_id NULL,
--      contract_value 0, has_conflict false, custo/km = despesas/Km
--   4. detail ao vivo sem contrato: rate = despesas/Km e rental_value
--      das visitas = 0 (componente aluguel inexistente)
--   5. allocate SEM contrato gera APENAS linhas 'variable' (nenhuma
--      'rental'), converte as linhas de Km em 'rate' e aloca tudo no
--      componente VARIABLE
--   6. close/reopen funcionam em competência sem contrato de aluguel
--   7. revert devolve as linhas ao odômetro intactas e recalcula
--   8. veículo com despesas e SEM Km: calculate OK (rate NULL, tudo
--      em ociosidade) e allocate bloqueado ("sem Km rodado")
--   9. veículo só com contrato de R$/km (sem despesas): calculate
--      bloqueado com "nada a apurar"
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Os testes criam
--   veículos/visitas com prefixo "F4-TESTE-".
--
--   Única exceção (não é desfeita pelo ROLLBACK): o passo de
--   sincronização de sequences com o MAX(id) das tabelas de teste.
--   É um reparo benigno — só adianta sequence para trás do dado
--   existente, sem alterar nenhum registro.
-- ============================================================

BEGIN;

DO $$
DECLARE
    v_month    date := (date_trunc('month', now()))::date;
    v_v1       bigint;  -- sem aluguel, com R$/km + Km + despesas
    v_v2       bigint;  -- sem aluguel, só despesas (sem Km)
    v_v3       bigint;  -- sem aluguel, só contrato de R$/km
    v_v4       bigint;  -- nada (não deve aparecer no resumo)
    v_oid      integer[] := '{}';
    v_one      bigint;
    i          integer;
    v_n        integer;
    v_ov       numeric;
    v_rent_sum numeric;
    v_var_sum  numeric;
    v_value_sum numeric;
    v_op_sum   numeric;
    v_status   character varying;
    r_sum      record;
    r_per      record;
    r_line     record;
    v_seq      record;
    v_seqname  text;
BEGIN
    -- ==========================================================
    -- 0) Sincroniza sequences com os dados já existentes.
    -- ==========================================================
    FOR v_seq IN
        SELECT unnest(ARRAY[
            'public.vehicles',
            'public.orders_visits',
            'public.orders_visits_vehicles',
            'public.vehicles_monthly_expenses',
            'public.cfg_vehicle_rate_contracts',
            'public.vehicles_rentals_periods',
            'public.vehicles_rentals_allocations'
        ]) AS tbl
    LOOP
        v_seqname := pg_get_serial_sequence(v_seq.tbl, 'id');
        IF v_seqname IS NOT NULL THEN
            EXECUTE format(
                'SELECT setval(%L, GREATEST((SELECT COALESCE(MAX(id), 1) FROM %s), 1))',
                v_seqname, v_seq.tbl
            );
        END IF;
    END LOOP;

    -- ==========================================================
    -- SETUP
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F4-TESTE-SEM-ALUGUEL', 'F4T0001', 0.90, 'Km', true, false)
    RETURNING id INTO v_v1;
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F4-TESTE-SO-DESPESA', 'F4T0002', 1.20, 'Km', true, false)
    RETURNING id INTO v_v2;
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F4-TESTE-SO-RKM', 'F4T0003', 2.10, 'Km', true, false)
    RETURNING id INTO v_v3;
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F4-TESTE-NULO', 'F4T0004', 1.00, 'Km', true, false)
    RETURNING id INTO v_v4;

    -- Contrato de R$/km (permite lançar Km no veículo 1)
    INSERT INTO public.cfg_vehicle_rate_contracts (vehicle_id, value_unit, start_date, end_date, active)
    VALUES (v_v1, 0.90, v_month - 2, NULL, true);
    -- Veículo 3: só o contrato de R$/km, sem Km e sem despesas
    INSERT INTO public.cfg_vehicle_rate_contracts (vehicle_id, value_unit, start_date, end_date, active)
    VALUES (v_v3, 2.10, v_month - 2, NULL, true);

    -- Visitas: 2 com Km no mês vigente
    FOR i IN 1..2 LOOP
        INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
        VALUES ('F4-TESTE-' || lpad(i::text, 3, '0'), v_month + i, 'pending')
        RETURNING id INTO v_one;
        v_oid[i] := v_one;
    END LOOP;

    -- Linhas de odômetro: 150 + 850 = 1000 km (R$/km 0,90 => 900,00)
    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, recorder_start, recorder_end, created_at)
    VALUES
        (v_oid[1], v_v1, 1000, 1150, v_month + 2),
        (v_oid[2], v_v1, 0,    850,  v_month + 3);

    -- Despesas: v1 = 400 + 100 = 500 ; v2 = 200 (sem Km)
    INSERT INTO public.vehicles_monthly_expenses
        (vehicle_id, reference_month, cost_type_id, value, description, created_user_id)
    VALUES (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'FUEL'),
            400.00, 'abastecimento', 0),
           (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'TOLL'),
            100.00, 'pedágios', 0),
           (v_v2, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'FUEL'),
            200.00, 'abastecimento', 0);

    RAISE NOTICE 'setup concluído: v1=% v2=% v3=% v4=%', v_v1, v_v2, v_v3, v_v4;

    -- ==========================================================
    -- 1) summary: veículo sem aluguel COM despesas aparece
    --    (contract_id NULL / contract_value 0 / custo só despesas)
    -- ==========================================================
    SELECT contract_id, contract_value, has_conflict, total_km, cost_per_km,
           variable_value, variable_per_km, allocated_value, idle_value,
           operational_value, operational_per_km, period_status
    INTO r_sum
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v1;

    IF r_sum.period_status IS NULL THEN
        RAISE EXCEPTION 'FALHA: veículo com despesas e sem contrato de aluguel não aparece no summary';
    END IF;
    IF r_sum.contract_id IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: contract_id deveria ser NULL (obtido %)', r_sum.contract_id;
    END IF;
    IF r_sum.contract_value IS DISTINCT FROM 0.00 THEN
        RAISE EXCEPTION 'FALHA: contract_value deveria ser 0 (obtido %)', r_sum.contract_value;
    END IF;
    IF r_sum.has_conflict IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'FALHA: has_conflict deveria ser false (obtido %)', r_sum.has_conflict;
    END IF;
    IF r_sum.total_km <> 1000 THEN
        RAISE EXCEPTION 'FALHA: total_km esperado 1000, obtido %', r_sum.total_km;
    END IF;
    IF r_sum.cost_per_km IS DISTINCT FROM 0.5 THEN
        RAISE EXCEPTION 'FALHA: custo/km esperado 0.5 (500/1000), obtido %', r_sum.cost_per_km;
    END IF;
    IF r_sum.variable_value IS DISTINCT FROM 500.00 THEN
        RAISE EXCEPTION 'FALHA: variable_value esperado 500, obtido %', r_sum.variable_value;
    END IF;
    IF r_sum.operational_per_km IS DISTINCT FROM 0.90 THEN
        RAISE EXCEPTION 'FALHA: operational_per_km esperado 0.90 (R$/km do contrato), obtido %',
            r_sum.operational_per_km;
    END IF;
    RAISE NOTICE 'ok: summary lista veículo sem aluguel (contract NULL, custo/km 0.50, despesas 500)';

    -- ==========================================================
    -- 2) summary: veículo SÓ com contrato de R$/km; e o que não
    --    tem nada NÃO aparece
    -- ==========================================================
    SELECT contract_id, contract_value, variable_value, total_km
    INTO r_sum
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v3;
    IF r_sum.contract_id IS NOT NULL OR r_sum.contract_value IS DISTINCT FROM 0.00
       OR r_sum.variable_value IS DISTINCT FROM 0.00 OR r_sum.total_km <> 0 THEN
        RAISE EXCEPTION 'FALHA: veículo só com R$/km deveria estar no summary com valores zerados (id=% valor=% despesas=% km=%)',
            r_sum.contract_id, r_sum.contract_value, r_sum.variable_value, r_sum.total_km;
    END IF;
    RAISE NOTICE 'ok: summary lista veículo só com contrato de R$/km';

    SELECT count(*) INTO v_n
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v4;
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: veículo sem período/contrato/despesas não deveria estar no summary';
    END IF;
    RAISE NOTICE 'ok: veículo sem nada não aparece no summary';

    -- ==========================================================
    -- 3) detail ao vivo sem contrato: rate = despesas/Km,
    --    rental_value = 0 por visita
    -- ==========================================================
    SELECT count(*), COALESCE(sum(km), 0),
           COALESCE(sum(rental_value), 0), COALESCE(sum(variable_value), 0),
           COALESCE(sum(value), 0), COALESCE(sum(operational_value), 0)
    INTO v_n, v_ov, v_rent_sum, v_var_sum, v_value_sum, v_op_sum
    FROM public.fc_vehicle_rental_detail(v_v1, v_month);

    IF v_n <> 2 OR v_ov <> 1000 THEN
        RAISE EXCEPTION 'FALHA: detalhe deveria ter 2 visitas / 1000 km, obteve % / %', v_n, v_ov;
    END IF;
    IF v_rent_sum <> 0.00 THEN
        RAISE EXCEPTION 'FALHA: soma de rental_value deveria ser 0 sem contrato (obtido %)', v_rent_sum;
    END IF;
    IF v_var_sum <> 500.00 THEN
        RAISE EXCEPTION 'FALHA: soma de variable_value esperada 500, obtido %', v_var_sum;
    END IF;
    IF v_value_sum <> 500.00 THEN
        RAISE EXCEPTION 'FALHA: soma de value esperada 500, obtido %', v_value_sum;
    END IF;
    IF v_op_sum <> 900.00 THEN
        RAISE EXCEPTION 'FALHA: soma de operational_value esperada 900, obtido %', v_op_sum;
    END IF;
    RAISE NOTICE 'ok: detail sem contrato (rental 0, despesas 500, R$/km 900)';

    -- ==========================================================
    -- 4) calculate SEM contrato + com despesas => OK
    -- ==========================================================
    SELECT p.* INTO r_per
    FROM public.fc_vehicle_rental_calculate(v_v1, v_month, 0) p;

    IF r_per.contract_id IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: period.contract_id deveria ser NULL (obtido %)', r_per.contract_id;
    END IF;
    IF r_per.contract_value IS DISTINCT FROM 0.00
       OR r_per.has_conflict IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'FALHA: period deveria ter contract_value 0 / has_conflict false (obtido % / %)',
            r_per.contract_value, r_per.has_conflict;
    END IF;
    IF r_per.total_km <> 1000 OR r_per.cost_per_km IS DISTINCT FROM 0.5
       OR r_per.variable_value IS DISTINCT FROM 500.00
       OR r_per.allocated_value IS DISTINCT FROM 500.00
       OR r_per.idle_value IS DISTINCT FROM 0.00
       OR r_per.status <> 'CALCULATED' THEN
        RAISE EXCEPTION 'FALHA: calculate esperado 1000km / 0.5 / despesas 500 / apropriado 500 / ocioso 0 / CALCULATED (obtido km=% rate=% desp=% aprop=% ocioso=% %)',
            r_per.total_km, r_per.cost_per_km, r_per.variable_value,
            r_per.allocated_value, r_per.idle_value, r_per.status;
    END IF;
    RAISE NOTICE 'ok: calculate sem contrato (contract NULL, custo/km 0.50, apropriado 500)';

    -- ==========================================================
    -- 5) allocate SEM contrato => APENAS linhas 'variable'
    -- ==========================================================
    SELECT p.* INTO r_per
    FROM public.fc_vehicle_rental_allocate(v_v1, v_month, 0) p;

    IF r_per.status <> 'ALLOCATED' THEN
        RAISE EXCEPTION 'FALHA: allocate deveria deixar ALLOCATED (obtido %)', r_per.status;
    END IF;
    IF r_per.allocated_value IS DISTINCT FROM 500.00
       OR r_per.idle_value IS DISTINCT FROM 0.00 THEN
        RAISE EXCEPTION 'FALHA: apropriado esperado 500 / ocioso 0 (obtido % / %)',
            r_per.allocated_value, r_per.idle_value;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rental' AND NOT is_deleted;
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: allocate criou % linha(s) rental sem contrato de aluguel', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'variable' AND NOT is_deleted;
    IF v_n <> 2 THEN
        RAISE EXCEPTION 'FALHA: allocate deveria criar 2 linhas variable (obtido %)', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.vehicles_rentals_allocations
    WHERE period_id = r_per.id AND cost_component = 'VARIABLE';
    IF v_n <> 2 THEN
        RAISE EXCEPTION 'FALHA: deveria haver 2 allocations VARIABLE (obtido %)', v_n;
    END IF;
    SELECT count(*) INTO v_n FROM public.vehicles_rentals_allocations
    WHERE period_id = r_per.id AND cost_component = 'RENTAL';
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: não deveria haver allocations RENTAL sem contrato (obtido %)', v_n;
    END IF;

    -- Linhas de Km convertidas em 'rate' com os valores intactos
    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rate' AND NOT is_deleted AND amount > 0;
    IF v_n <> 2 THEN
        RAISE EXCEPTION 'FALHA: as 2 linhas de Km deveriam virar rate (obtido %)', v_n;
    END IF;
    RAISE NOTICE 'ok: allocate só gerou variable (0 rental, 2 allocations VARIABLE, 2 linhas rate)';

    -- ==========================================================
    -- 6) close/reopen funcionam sem contrato de aluguel
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_close(v_v1, v_month, 0);
    SELECT status INTO v_status FROM public.vehicles_rentals_periods
     WHERE vehicle_id = v_v1 AND reference_month = v_month;
    IF v_status <> 'CLOSED' THEN
        RAISE EXCEPTION 'FALHA: close deveria deixar CLOSED (obtido %)', v_status;
    END IF;

    PERFORM public.fc_vehicle_rental_reopen(v_v1, v_month, 0);
    SELECT status INTO v_status FROM public.vehicles_rentals_periods
     WHERE vehicle_id = v_v1 AND reference_month = v_month;
    IF v_status NOT IN ('ALLOCATED', 'CALCULATED') THEN
        RAISE EXCEPTION 'FALHA: reopen deveria voltar para ALLOCATED/CALCULATED (obtido %)', v_status;
    END IF;
    -- Com allocations VARIABLE o reopen volta para ALLOCATED (requisito
    -- do revert no passo seguinte)
    IF v_status <> 'ALLOCATED' THEN
        RAISE EXCEPTION 'FALHA: reopen com allocations deveria voltar para ALLOCATED (obtido %)', v_status;
    END IF;
    RAISE NOTICE 'ok: close/reopen funcionam em competência sem contrato de aluguel';

    -- ==========================================================
    -- 7) revert devolve as 2 linhas ao odômetro intactas
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_revert(v_v1, v_month, 0);

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type IN ('rental', 'variable') AND NOT is_deleted;
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: revert deixou % linha(s) de rateio para trás', v_n;
    END IF;

    SELECT cost_type, amount, value_unit, value_total, recorder_start
    INTO r_line
    FROM public.orders_visits_vehicles
    WHERE ov_id = v_oid[1] AND vehicle_id = v_v1 AND amount > 0;
    IF r_line.cost_type <> 'odometer' OR r_line.amount <> 150
       OR r_line.value_unit IS DISTINCT FROM 0.90 OR r_line.value_total <> 135.00
       OR r_line.recorder_start <> 1000 THEN
        RAISE EXCEPTION 'FALHA: estorno não devolveu a linha intacta (tipo=% km=% unit=% total=% start=%)',
            r_line.cost_type, r_line.amount, r_line.value_unit,
            r_line.value_total, r_line.recorder_start;
    END IF;

    SELECT status, contract_value, variable_value, cost_per_km, allocated_value
    INTO r_per FROM public.vehicles_rentals_periods
    WHERE vehicle_id = v_v1 AND reference_month = v_month;
    IF r_per.status <> 'CALCULATED' OR r_per.contract_value IS DISTINCT FROM 0.00
       OR r_per.variable_value IS DISTINCT FROM 500.00
       OR r_per.cost_per_km IS DISTINCT FROM 0.5
       OR r_per.allocated_value IS DISTINCT FROM 500.00 THEN
        RAISE EXCEPTION 'FALHA: pós-revert esperado CALCULATED / 0 / 500 / 0.5 / 500 (obtido % / % / % / % / %)',
            r_per.status, r_per.contract_value, r_per.variable_value,
            r_per.cost_per_km, r_per.allocated_value;
    END IF;
    RAISE NOTICE 'ok: revert devolveu as linhas ao odômetro e recalculou (CALCULATED, despesas 500)';

    -- ==========================================================
    -- 8) despesas SEM Km: calculate OK, allocate bloqueado
    -- ==========================================================
    SELECT p.* INTO r_per
    FROM public.fc_vehicle_rental_calculate(v_v2, v_month, 0) p;
    IF r_per.contract_id IS NOT NULL
       OR r_per.contract_value IS DISTINCT FROM 0.00
       OR r_per.total_km <> 0
       OR r_per.cost_per_km IS NOT NULL
       OR r_per.variable_value IS DISTINCT FROM 200.00
       OR r_per.idle_value IS DISTINCT FROM 200.00 THEN
        RAISE EXCEPTION 'FALHA: sem Km esperado contract NULL / 0 / km 0 / rate NULL / despesas 200 / ocioso 200 (obtido % / % / % / % / % / %)',
            r_per.contract_id, r_per.contract_value, r_per.total_km,
            r_per.cost_per_km, r_per.variable_value, r_per.idle_value;
    END IF;

    BEGIN
        PERFORM public.fc_vehicle_rental_allocate(v_v2, v_month, 0);
        RAISE EXCEPTION 'FALHA: allocate sem Km deveria ter sido bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
        IF SQLERRM NOT LIKE '%sem Km rodado%' THEN
            RAISE EXCEPTION 'FALHA: erro inesperado no allocate sem Km: %', SQLERRM;
        END IF;
        RAISE NOTICE 'ok: despesas sem Km => calculate OK (rate NULL) e allocate bloqueado';
    END;

    -- ==========================================================
    -- 9) só com contrato de R$/km, sem despesas => "nada a apurar"
    -- ==========================================================
    BEGIN
        PERFORM public.fc_vehicle_rental_calculate(v_v3, v_month, 0);
        RAISE EXCEPTION 'FALHA: calculate sem contrato e sem despesas deveria ter sido bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
        IF SQLERRM NOT LIKE '%nada a apurar%' THEN
            RAISE EXCEPTION 'FALHA: erro inesperado no calculate: %', SQLERRM;
        END IF;
        RAISE NOTICE 'ok: sem contrato e sem despesas => calculate bloqueado ("nada a apurar")';
    END;

    RAISE NOTICE 'OK: todos os testes passaram (despesas sem contrato de aluguel)';

END $$;

ROLLBACK;

-- ============================================================
-- FIM DA VALIDAÇÃO 20261011 (nada é persistido — ROLLBACK)
-- ============================================================
