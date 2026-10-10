-- ============================================================
-- Validação manual: Rateio de Aluguel Veicular — Fase 2
-- (despesas variáveis mensais reais)
-- Data: 2026-10-09
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode a migration 20261008_create_vehicle_rental_rateio.sql (Fase 1)
--      — se ainda não foi aplicada.
--   2. Rode a migration 20261009_add_vehicles_monthly_expenses.sql (Fase 2).
--   3. Rode ESTE arquivo inteiro (Execute).
--   4. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. despesas entram no resumo ao vivo (variable_value / variable_per_km)
--   2. custo/km total = (aluguel + despesas) ÷ total_km
--   3. calculate grava variable_value / variable_per_km
--   4. allocate gera 2 linhas por visita (rental + variable), CONVERTE a
--      linha de Km em 'rate' (mesmo id/valores) e é idempotente
--   5. visita aprovada preservada; financial sum separa rate x rental x variable
--   6. despesas bloqueadas quando ALLOCATED/CLOSED; editáveis em OPEN/CALCULATED
--   7. linhas 'variable' imutáveis fora da RPC (mesmo guard do 'rental')
--   8. revert remove as 2 linhas, DEVOLVE as linhas 'rate' ao odômetro
--      (amount/value_unit/value_total/recorder intactos) e recalcula
--   9. veículo sem Km + despesas => cost_per Km NULL, tudo ociosidade
--  10. despesas de outra competência não contaminam a competência
--  11. componente R$/km: summary/detail expõem operational_value /
--      operational_per_km (7500 / 2,50) antes, durante e depois do rateio;
--      linhas 'rate' imutáveis; DELETE/INSERT fora da RPC bloqueados;
--      competência FECHADA congela tudo
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Os testes criam
--   veículos/visitas com prefixo "F2-TESTE-".
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
    v_v1       bigint;
    v_v2       bigint;
    v_oid      integer[] := '{}';
    v_one      bigint;
    i          integer;
    v_n        integer;
    v_ov       numeric;
    v_types    text;
    v_status   character varying;
    v_exp_fuel bigint;
    v_exp_toll bigint;
    v_rent_sum numeric;
    v_var_sum  numeric;
    r          record;
    v_seq      record;
    v_seqname  text;
BEGIN
    -- ==========================================================
    -- 0) Sincroniza sequences com os dados já existentes.
    --    Em bases restauradas por dump a sequence fica atrás do
    --    MAX(id) e o INSERT falha com 23505 (duplicate key).
    -- ==========================================================
    FOR v_seq IN
        SELECT unnest(ARRAY[
            'public.vehicles',
            'public.orders_visits',
            'public.orders_visits_vehicles',
            'public.vehicles_monthly_expenses'
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
    -- SETUP: 2 veículos + contratos + 6 visitas + 8 linhas de Km
    --         + despesas de FUEL/TOLL
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F2-TESTE-VAN', 'F2T0001', 2.50, 'Km', true, false)
    RETURNING id INTO v_v1;

    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F2-TESTE-SEM-KM', 'F2T0002', 1.90, 'Km', true, false)
    RETURNING id INTO v_v2;

    INSERT INTO public.cfg_vehicles_rentals_contracts (vehicle_id, monthly_value, start_date, active)
    VALUES (v_v1, 6000.00, v_month - 60, true),
           (v_v2, 3000.00, v_month - 60, true);

    -- Visitas: 5 com Km no mês + 1 no mês anterior (fora da competência)
    FOR i IN 1..6 LOOP
        INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
        VALUES (
            'F2-TESTE-' || lpad(i::text, 3, '0'),
            CASE WHEN i = 6 THEN v_month - 5 ELSE v_month + i END,
            CASE WHEN i = 1 THEN 'approved' ELSE 'pending' END
        )
        RETURNING id INTO v_one;
        v_oid[i] := v_one;
    END LOOP;

    -- Linhas de odômetro: 150+1250+800+400+400 = 3000 km (mês vigente)
    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, recorder_start, recorder_end, created_at, ov_costs_status)
    VALUES
        (v_oid[1], v_v1, 1000, 1150, v_month + 2, 'approved'),
        (v_oid[2], v_v1, 0,    1250, v_month + 3, 'pending'),
        (v_oid[3], v_v1, 500,  1300, v_month + 4, 'pending'),
        (v_oid[4], v_v1, 0,    400,  v_month + 5, 'pending'),
        (v_oid[5], v_v1, 100,  500,  v_month + 6, 'pending'),
        (v_oid[1], v_v1, 2000, 2000, v_month + 7, 'approved'),  -- 0 km
        (v_oid[6], v_v1, 0,    700,  v_month - 5, 'pending'),   -- mês anterior
        (v_oid[6], v_v2, 0,    999,  v_month - 5, 'pending');   -- veículo 2, 0 km no mês

    -- Despesas: v1 = 900 + 150 = 1050 ; v2 = 200 (sem Km)
    INSERT INTO public.vehicles_monthly_expenses
        (vehicle_id, reference_month, cost_type_id, value, description, created_user_id)
    VALUES (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'FUEL'),
            900.00, 'abastecimento', 0),
           (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'TOLL'),
            150.00, 'pedágios', 0),
           (v_v2, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'FUEL'),
            200.00, 'abastecimento', 0);

    SELECT id INTO v_exp_fuel FROM public.vehicles_monthly_expenses
     WHERE vehicle_id = v_v1 AND description = 'abastecimento';
    SELECT id INTO v_exp_toll FROM public.vehicles_monthly_expenses
     WHERE vehicle_id = v_v1 AND description = 'pedágios';

    RAISE NOTICE 'setup concluído: v1=% v2=%', v_v1, v_v2;

    -- ==========================================================
    -- 1) RESUMO AO VIVO com despesas (antes do cálculo)
    -- ==========================================================
    SELECT variable_value, variable_per_km, cost_per_km, total_km,
           allocated_value, idle_value, utilization, period_status
    INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v1;

    IF r.total_km <> 3000 THEN
        RAISE EXCEPTION 'FALHA: total_km esperado 3000, obtido %', r.total_km;
    END IF;
    IF r.variable_value IS DISTINCT FROM 1050.00 THEN
        RAISE EXCEPTION 'FALHA: variable_value esperado 1050, obtido %', r.variable_value;
    END IF;
    IF r.variable_per_km IS DISTINCT FROM 0.35 THEN
        RAISE EXCEPTION 'FALHA: variable_per_km esperado 0.35, obtido %', r.variable_per_km;
    END IF;
    IF r.cost_per_km IS DISTINCT FROM 2.35 THEN
        RAISE EXCEPTION 'FALHA: cost_per_km esperado 2.35 ((6000+1050)/3000), obtido %', r.cost_per_km;
    END IF;
    IF r.allocated_value IS DISTINCT FROM 7050.00 OR r.idle_value IS DISTINCT FROM 0.00 THEN
        RAISE EXCEPTION 'FALHA: esperado apropriado 7050 / ocioso 0, obtido % / %',
            r.allocated_value, r.idle_value;
    END IF;
    IF r.utilization IS DISTINCT FROM 1.0 THEN
        RAISE EXCEPTION 'FALHA: utilização esperada 1.0, obtido %', r.utilization;
    END IF;
    IF r.period_status <> 'OPEN' THEN
        RAISE EXCEPTION 'FALHA: período deveria estar OPEN (obtido %)', r.period_status;
    END IF;
    RAISE NOTICE 'ok: resumo ao vivo (3000 km, despesas 1050, R$ 2,35/km, apropriado 7050)';

    -- Veículo 2: despesa sem Km => tudo ociosidade (aluguel + despesas)
    SELECT variable_value, variable_per_km, cost_per_km, total_km, idle_value INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v2;
    IF r.total_km <> 0 OR r.cost_per_km IS NOT NULL
       OR r.variable_value IS DISTINCT FROM 200.00
       OR r.variable_per_km IS NOT NULL
       OR r.idle_value IS DISTINCT FROM 3200.00 THEN
        RAISE EXCEPTION 'FALHA: sem Km deve ter rate NULL e ociosidade 3200 (km=% rate=% despesas=% ocioso=%)',
            r.total_km, r.cost_per_km, r.variable_value, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: total_km=0 => custo/km NULL, aluguel+despesas integralmente ociosos (3200)';

    -- ==========================================================
    -- 2) DETALHE (prévia visita a visita, 2 componentes)
    -- ==========================================================
    SELECT count(*), COALESCE(sum(km), 0),
           COALESCE(sum(rental_value), 0), COALESCE(sum(variable_value), 0)
    INTO v_n, v_ov, v_rent_sum, v_var_sum
    FROM public.fc_vehicle_rental_detail(v_v1, v_month);
    IF v_n <> 5 OR v_ov <> 3000 THEN
        RAISE EXCEPTION 'FALHA: detalhe deveria ter 5 visitas / 3000 km, obteve % visitas / % km',
            v_n, v_ov;
    END IF;
    IF v_rent_sum IS DISTINCT FROM 6000.00 OR v_var_sum IS DISTINCT FROM 1050.00 THEN
        RAISE EXCEPTION 'FALHA: detalhe esperado aluguel 6000 + despesas 1050, obtido % / %',
            v_rent_sum, v_var_sum;
    END IF;

    SELECT count(*) INTO v_n
    FROM public.fc_vehicle_rental_detail(v_v1, v_month)
    WHERE rental_ovv_id IS NOT NULL OR variable_ovv_id IS NOT NULL;
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: prévia não deveria ter linhas alocadas (obtidas %)', v_n;
    END IF;
    RAISE NOTICE 'ok: detalhe prévio separa aluguel 6000 x despesas 1050 (sem linhas alocadas)';

    -- ==========================================================
    -- 3) CALCULA a competência (grava despesas no período)
    -- ==========================================================
    SELECT p.* INTO r
    FROM public.fc_vehicle_rental_calculate(v_v1, v_month, 0) p;

    IF r.status <> 'CALCULATED' OR r.total_km <> 3000
       OR r.cost_per_km IS DISTINCT FROM 2.35
       OR r.variable_value IS DISTINCT FROM 1050.00
       OR r.variable_per_km IS DISTINCT FROM 0.35
       OR r.allocated_value <> 7050.00 OR r.idle_value <> 0.00 THEN
        RAISE EXCEPTION 'FALHA: calculate (status=% km=% rate=% despesas=% despesas/km=% apropriado=% ocioso=%)',
            r.status, r.total_km, r.cost_per_km, r.variable_value, r.variable_per_km,
            r.allocated_value, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: calculate => CALCULATED / 3000 km / R$ 2,35/km / despesas 1050 / apropriado 7050';

    -- Despesa ainda é editável com o período CALCULATED
    BEGIN
        UPDATE public.vehicles_monthly_expenses SET value = 950.00 WHERE id = v_exp_fuel;
        UPDATE public.vehicles_monthly_expenses SET value = 900.00 WHERE id = v_exp_fuel;
        RAISE NOTICE 'ok: despesa editável enquanto CALCULATED';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FALHA: despesa deveria ser editável em CALCULATED (%)', SQLERRM;
    END;

    -- ==========================================================
    -- 4) ALOCA: 2 linhas por visita (rental + variable) + conversão
    --    da linha de Km em 'rate' (mesmo id, mesmos valores)
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);

    SELECT count(*) INTO v_n FROM public.vehicles_rentals_allocations a
    JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
    WHERE p.vehicle_id = v_v1 AND p.reference_month = v_month;
    IF v_n <> 10 THEN
        RAISE EXCEPTION 'FALHA: esperado 10 allocations (5 RENTAL + 5 VARIABLE), obtido %', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.vehicles_rentals_allocations a
    JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
    WHERE p.vehicle_id = v_v1 AND p.reference_month = v_month
      AND a.cost_component = 'VARIABLE';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 allocations VARIABLE, obtido %', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rental';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 linhas rental, obtido %', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'variable';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 linhas variable, obtido %', v_n;
    END IF;

    -- Linha de Km da visita 1: convertida para 'rate' preservando
    -- amount/value_unit/value_total e as leituras do odômetro
    SELECT cost_type, amount, value_unit, value_total, recorder_start, recorder_end
    INTO r
    FROM public.orders_visits_vehicles
    WHERE ov_id = v_oid[1] AND vehicle_id = v_v1 AND amount > 0 AND recorder_start IS NOT NULL;
    IF r.cost_type <> 'rate' OR r.amount <> 150 OR r.value_unit IS DISTINCT FROM 2.50
       OR r.value_total <> 375.00 OR r.recorder_start <> 1000 OR r.recorder_end <> 1150 THEN
        RAISE EXCEPTION 'FALHA: linha de Km não virou rate preservando valores (tipo=% amount=% unit=% total=% start=% end=%)',
            r.cost_type, r.amount, r.value_unit, r.value_total, r.recorder_start, r.recorder_end;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rate';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 linhas convertidas para rate (as de Km > 0 no mês), obtido %', v_n;
    END IF;

    -- Re-execução: não pode duplicar nenhum dos componentes
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);
    SELECT
        count(*) FILTER (WHERE cost_type = 'rental'),
        count(*) FILTER (WHERE cost_type = 'variable')
    INTO v_n, v_ov
    FROM public.orders_visits_vehicles WHERE vehicle_id = v_v1;
    IF v_n <> 5 OR v_ov <> 5 THEN
        RAISE EXCEPTION 'FALHA: allocate não é idempotente (rental=% variable=%)', v_n, v_ov;
    END IF;
    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rate';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: re-execução alterou as linhas rate (obtido %)', v_n;
    END IF;
    RAISE NOTICE 'ok: allocate criou 5 rental + 5 variable, converteu 5 Km em rate e é idempotente';

    -- Período: apropriado = aluguel + despesas, ociosidade 0
    SELECT p.allocated_value, p.idle_value, p.status INTO r
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = v_v1 AND p.reference_month = v_month;
    IF r.allocated_value IS DISTINCT FROM 7050.00 OR r.idle_value IS DISTINCT FROM 0.00
       OR r.status <> 'ALLOCATED' THEN
        RAISE EXCEPTION 'FALHA: período alocado esperado 7050 / 0 / ALLOCATED, obtido % / % / %',
            r.allocated_value, r.idle_value, r.status;
    END IF;

    -- Visita 1: 375 (Km) + 300 (aluguel) + 52,50 (despesas) = 727,50
    SELECT ov_total_value, ov_costs_status INTO v_ov, v_status
    FROM public.orders_visits WHERE id = v_oid[1];
    IF v_ov <> 727.50 THEN
        RAISE EXCEPTION 'FALHA: ov_total_value esperado 727.50, obtido %', v_ov;
    END IF;
    IF v_status <> 'approved' THEN
        RAISE EXCEPTION 'FALHA: visita aprovada mudou de status (%)', v_status;
    END IF;

    -- Linha variable: Km = 150, custo/km despesas = 0,35, total = 52,50
    SELECT amount, value_unit, value_total, recorder_start, ov_costs_status
    INTO r
    FROM public.orders_visits_vehicles
    WHERE ov_id = v_oid[1] AND vehicle_id = v_v1 AND cost_type = 'variable';
    IF r.amount <> 150 OR r.value_unit IS DISTINCT FROM 0.35
       OR r.value_total <> 52.50 OR r.recorder_start IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: linha variable (amount=% unit=% total=% start=%)',
            r.amount, r.value_unit, r.value_total, r.recorder_start;
    END IF;
    IF r.ov_costs_status <> 'approved' THEN
        RAISE EXCEPTION 'FALHA: linha variable não herdou status approved (%)', r.ov_costs_status;
    END IF;
    RAISE NOTICE 'ok: visita 727,50 = 375 (Km) + 300 (aluguel) + 52,50 (despesas)';

    -- Detalhe pós-allocate: ponte para as 2 linhas geradas
    SELECT count(*), COALESCE(sum(value), 0) INTO v_n, v_ov
    FROM public.fc_vehicle_rental_detail(v_v1, v_month)
    WHERE rental_ovv_id IS NOT NULL AND variable_ovv_id IS NOT NULL;
    IF v_n <> 5 OR v_ov <> 7050.00 THEN
        RAISE EXCEPTION 'FALHA: detalhe pós-allocate esperado 5 linhas ligadas / 7050, obtido % / %',
            v_n, v_ov;
    END IF;

    -- ==========================================================
    -- 5) RESUMO FINANCEIRO separa os 4 cost_type
    --    'rate'   = linha de 150 km convertida pelo allocate
    --    'odometer' = linha de 0 km da mesma visita (entra na visão)
    -- ==========================================================
    SELECT string_agg(DISTINCT t, ',' ORDER BY t) INTO v_types
    FROM (SELECT cost_type::text AS t
          FROM public.fc_financial_orders_visits_vehicles_sum(ARRAY[v_oid[1]::integer])) s;
    IF v_types IS DISTINCT FROM 'odometer,rate,rental,variable' THEN
        RAISE EXCEPTION 'FALHA: resumo financeiro esperado "odometer,rate,rental,variable", obteve "%"',
            COALESCE(v_types, '(null)');
    END IF;
    RAISE NOTICE 'ok: resumo financeiro separa Km (rate) x aluguel (rental) x despesas (variable)';

    -- ==========================================================
    -- 6) DESPESAS bloqueadas com o período ALOCADO
    -- ==========================================================
    -- No Supabase cada RPC roda numa transação própria (PostgREST) e a flag
    -- de sessão 'app.vehicle_rental_write' morre junto com ela. Este script
    -- roda numa transação única, então limpamos a flag aqui para reproduzir
    -- exatamente o isolamento que vale em produção.
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    BEGIN
        INSERT INTO public.vehicles_monthly_expenses
            (vehicle_id, reference_month, cost_type_id, value, created_user_id)
        VALUES (v_v1, v_month,
                (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'OTHER'), 10.00, 0);
        RAISE EXCEPTION 'FALHA: INSERT de despesa com período alocado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: despesa bloqueada com período alocado (%)', left(SQLERRM, 70);
    END;

    BEGIN
        UPDATE public.vehicles_monthly_expenses SET value = 1 WHERE id = v_exp_fuel;
        RAISE EXCEPTION 'FALHA: UPDATE de despesa com período alocado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: despesa bloqueada (UPDATE) com período alocado (%)', left(SQLERRM, 70);
    END;

    BEGIN
        DELETE FROM public.vehicles_monthly_expenses WHERE id = v_exp_toll;
        RAISE EXCEPTION 'FALHA: DELETE de despesa com período alocado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: despesa bloqueada (DELETE) com período alocado (%)', left(SQLERRM, 70);
    END;

    -- Linha variable imutável fora da RPC
    BEGIN
        UPDATE public.orders_visits_vehicles SET amount = 1
         WHERE vehicle_id = v_v1 AND cost_type = 'variable';
        RAISE EXCEPTION 'FALHA: UPDATE direto em linha variable não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha variable imutável (%)', left(SQLERRM, 60);
    END;

    BEGIN
        INSERT INTO public.orders_visits_vehicles (ov_id, vehicle_id, amount, value_unit, cost_type)
        VALUES (v_oid[1], v_v1, 10, 1, 'variable');
        RAISE EXCEPTION 'FALHA: INSERT direto de linha variable não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha variable só nasce na apuração (%)', left(SQLERRM, 60);
    END;

    -- ==========================================================
    -- 7) FECHA + imutabilidade total
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_close(v_v1, v_month, 0);
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    BEGIN
        UPDATE public.vehicles_monthly_expenses SET value = 2 WHERE id = v_exp_fuel;
        RAISE EXCEPTION 'FALHA: despesa com período FECHADO não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: despesa bloqueada com período fechado (%)', left(SQLERRM, 70);
    END;

    BEGIN
        DELETE FROM public.orders_visits_vehicles
         WHERE id = (SELECT min(id) FROM public.orders_visits_vehicles WHERE cost_type = 'variable');
        RAISE EXCEPTION 'FALHA: DELETE de linha variable com período fechado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha variable imutável com período fechado (%)', left(SQLERRM, 60);
    END;

    -- ==========================================================
    -- 8) REABRE + ESTORNA => as 2 linhas somem; despesas voltam
    --    a ser editáveis; período recalculado com despesas
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_reopen(v_v1, v_month, 0);
    PERFORM public.fc_vehicle_rental_revert(v_v1, v_month, 0);
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type IN ('rental', 'variable');
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: revert não removeu as linhas rental/variable (%)', v_n;
    END IF;

    -- As linhas de Km convertidas voltam ao odômetro com os MESMOS valores
    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rate';
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: revert deixou % linha(s) rate para trás', v_n;
    END IF;

    SELECT cost_type, amount, value_unit, value_total, recorder_start
    INTO r
    FROM public.orders_visits_vehicles
    WHERE ov_id = v_oid[1] AND vehicle_id = v_v1 AND amount > 0 AND recorder_start IS NOT NULL;
    IF r.cost_type <> 'odometer' OR r.amount <> 150 OR r.value_unit IS DISTINCT FROM 2.50
       OR r.value_total <> 375.00 OR r.recorder_start <> 1000 THEN
        RAISE EXCEPTION 'FALHA: estorno não devolveu a linha ao odômetro intacta (tipo=% amount=% unit=% total=% start=%)',
            r.cost_type, r.amount, r.value_unit, r.value_total, r.recorder_start;
    END IF;

    SELECT ov_vehicles_value INTO v_ov FROM public.orders_visits WHERE id = v_oid[1];
    IF v_ov <> 375.00 THEN
        RAISE EXCEPTION 'FALHA: ov_vehicles_value restaurado esperado 375, obtido %', v_ov;
    END IF;

    SELECT p.status, p.variable_value, p.cost_per_km INTO r
    FROM public.vehicles_rentals_periods p
    WHERE p.vehicle_id = v_v1 AND p.reference_month = v_month;
    IF r.status <> 'CALCULATED' OR r.variable_value IS DISTINCT FROM 1050.00
       OR r.cost_per_km IS DISTINCT FROM 2.35 THEN
        RAISE EXCEPTION 'FALHA: pós-revert esperado CALCULATED / 1050 / 2.35, obtido % / % / %',
            r.status, r.variable_value, r.cost_per_km;
    END IF;
    RAISE NOTICE 'ok: revert removeu rental+variable e recalculou com as despesas (1050 / 2.35)';

    -- Despesa editável de novo (CALCULATED): +50 => recalcula tudo
    BEGIN
        INSERT INTO public.vehicles_monthly_expenses
            (vehicle_id, reference_month, cost_type_id, value, description, created_user_id)
        VALUES (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'TOLL'),
                50.00, 'pedágio extra', 0);
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FALHA: despesa não pode ser criada pós-revert (%)', SQLERRM;
    END;

    SELECT p.* INTO r FROM public.fc_vehicle_rental_calculate(v_v1, v_month, 0) p;
    IF r.variable_value IS DISTINCT FROM 1100.00
       OR r.cost_per_km IS DISTINCT FROM 2.366667
       OR r.variable_per_km IS DISTINCT FROM 0.366667
       OR r.allocated_value IS DISTINCT FROM 7100.00 THEN
        RAISE EXCEPTION 'FALHA: recálculo com 1100 esperado rate 2.366667 / apropriado 7100, obtido % / % / %',
            r.cost_per_km, r.variable_value, r.allocated_value;
    END IF;
    RAISE NOTICE 'ok: nova despesa entra no recálculo (1100 => R$ 2,366667/km, apropriado 7100)';

    -- remove a despesa extra e volta ao estado limpo
    DELETE FROM public.vehicles_monthly_expenses
     WHERE vehicle_id = v_v1 AND description = 'pedágio extra';
    PERFORM public.fc_vehicle_rental_calculate(v_v1, v_month, 0);

    -- ==========================================================
    -- 9) Despesa de OUTRA competência não contamina a atual
    -- ==========================================================
    INSERT INTO public.vehicles_monthly_expenses
        (vehicle_id, reference_month, cost_type_id, value, description, created_user_id)
    VALUES (v_v1, (date_trunc('month', v_month::timestamp) - interval '1 month')::date,
            (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'FUEL'),
            999.00, 'mês anterior', 0);

    SELECT p.variable_value, p.cost_per_km INTO r
    FROM public.fc_vehicle_rental_calculate(v_v1, v_month, 0) p;
    IF r.variable_value IS DISTINCT FROM 1050.00 OR r.cost_per_km IS DISTINCT FROM 2.35 THEN
        RAISE EXCEPTION 'FALHA: despesa de outro mês contamina a competência (despesas=% rate=%)',
            r.variable_value, r.cost_per_km;
    END IF;
    RAISE NOTICE 'ok: despesas de outra competência são ignoradas';

    -- ==========================================================
    -- 10) Guardas de dados (CHECKs da tabela de despesas)
    -- ==========================================================
    BEGIN
        INSERT INTO public.vehicles_monthly_expenses
            (vehicle_id, reference_month, cost_type_id, value, created_user_id)
        VALUES (v_v1, v_month, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'OTHER'),
                0.00, 0);
        RAISE EXCEPTION 'FALHA: value 0/negativo não foi bloqueado pelo CHECK';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: value deve ser > 0 (%)', left(SQLERRM, 50);
    END;

    BEGIN
        INSERT INTO public.vehicles_monthly_expenses
            (vehicle_id, reference_month, cost_type_id, value, created_user_id)
        VALUES (v_v1, v_month + 3, (SELECT id FROM cfg_vehicles_costs_types WHERE code = 'OTHER'),
                10.00, 0);
        RAISE EXCEPTION 'FALHA: reference_month fora do início do mês não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: reference_month precisa ser dia 1 (%)', left(SQLERRM, 50);
    END;

    -- Veículo sem Km + despesas: allocate continua bloqueado
    PERFORM public.fc_vehicle_rental_calculate(v_v2, v_month, 0);
    BEGIN
        PERFORM public.fc_vehicle_rental_allocate(v_v2, v_month, 0);
        RAISE EXCEPTION 'FALHA: allocate sem Km não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: allocate sem Km segue bloqueado (%)', left(SQLERRM, 70);
    END;

    -- ==========================================================
    -- 11) Componente R$/km ('rate'): operational_*, guards e
    --     congelamento/estorno das linhas convertidas
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_calculate(v_v1, v_month, 0);
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    -- operational_* vale para linhas 'odometer' E 'rate' (a mesma linha):
    -- 3000 km × R$ 2,50 = R$ 7.500 => R$ 2,50/km
    SELECT operational_value, operational_per_km, total_km INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v1;
    IF r.operational_value IS DISTINCT FROM 7500.00
       OR r.operational_per_km IS DISTINCT FROM 2.5
       OR r.total_km <> 3000 THEN
        RAISE EXCEPTION 'FALHA: summary operational esperado 7500 / 2,5 / 3000, obtido % / % / %',
            r.operational_value, r.operational_per_km, r.total_km;
    END IF;

    SELECT operational_value INTO v_ov
    FROM public.fc_vehicle_rental_detail(v_v1, v_month)
    WHERE ov_id = v_oid[1];
    IF v_ov IS DISTINCT FROM 375.00 THEN
        RAISE EXCEPTION 'FALHA: detail operational_value da visita 1 esperado 375, obtido %', v_ov;
    END IF;

    -- Linha 'rate' imutável fora da RPC
    BEGIN
        UPDATE public.orders_visits_vehicles SET amount = 1
         WHERE vehicle_id = v_v1 AND cost_type = 'rate';
        RAISE EXCEPTION 'FALHA: UPDATE direto em linha rate não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha rate imutável (%)', left(SQLERRM, 70);
    END;

    BEGIN
        DELETE FROM public.orders_visits_vehicles
         WHERE id = (SELECT min(id) FROM public.orders_visits_vehicles WHERE cost_type = 'rate');
        RAISE EXCEPTION 'FALHA: DELETE de linha rate não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha rate protegida pela allocation (%)', left(SQLERRM, 70);
    END;

    BEGIN
        INSERT INTO public.orders_visits_vehicles (ov_id, vehicle_id, amount, value_unit, cost_type)
        VALUES (v_oid[1], v_v1, 10, 1, 'rate');
        RAISE EXCEPTION 'FALHA: INSERT direto de linha rate não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha rate só nasce na apuração (%)', left(SQLERRM, 70);
    END;

    -- Fechada: a linha rateada continua congelada
    PERFORM public.fc_vehicle_rental_close(v_v1, v_month, 0);
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    BEGIN
        UPDATE public.orders_visits_vehicles SET amount = 1
         WHERE vehicle_id = v_v1 AND cost_type = 'rate';
        RAISE EXCEPTION 'FALHA: edição de linha rate com período FECHADO não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha rate imutável com período fechado (%)', left(SQLERRM, 70);
    END;

    -- Reabre e estorna: linhas voltam ao odômetro e operational_*
    -- continua o mesmo (7500 / 2,50) — só muda a origem da linha
    PERFORM public.fc_vehicle_rental_reopen(v_v1, v_month, 0);
    PERFORM public.fc_vehicle_rental_revert(v_v1, v_month, 0);
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rate';
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: estorno deixou % linha(s) rate para trás', v_n;
    END IF;

    SELECT operational_value, operational_per_km INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v1;
    IF r.operational_value IS DISTINCT FROM 7500.00
       OR r.operational_per_km IS DISTINCT FROM 2.5 THEN
        RAISE EXCEPTION 'FALHA: operational_* após estorno esperado 7500 / 2,5, obtido % / %',
            r.operational_value, r.operational_per_km;
    END IF;
    RAISE NOTICE 'ok: operational_* 7500 / 2,5 antes, durante e depois do rateio; estorno devolveu tudo';

    RAISE NOTICE 'OK: todos os testes passaram (nenhum dado persistido — a transação termina em ROLLBACK)';
END $$;

ROLLBACK;
