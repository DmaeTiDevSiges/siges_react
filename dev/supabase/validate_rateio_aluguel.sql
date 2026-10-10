-- ============================================================
-- Validação manual: Rateio de Aluguel Veicular
-- Data: 2026-10-08
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode primeiro a migration 20261008_create_vehicle_rental_rateio.sql
--   2. Rode ESTE arquivo inteiro (Execute).
--   3. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. custo/km = aluguel ÷ total_km (Km do mês)
--   2. rateio proporcional por visita + ociosidade
--   3. total_km = 0 => cost_per_km NULL (tudo ociosidade)
--   4. allocate idempotente (re-executar não duplica linhas)
--   5. status approved da visita preservado (sem alterar a visita)
--   6. imutabilidade pós-fechamento (período, rateio e Km)
--   7. revert restaura ov_vehicles_value da visita
--   8. resumo financeiro separa Km (odometer) x Rateio (rental)
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Os testes criam
--   veículos/visitas com prefixo "RATEIO-TESTE-".
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
    v_oid      bigint[] := '{}';
    v_one      bigint;
    i          integer;
    v_n        integer;
    v_ov       numeric;
    v_types    text;
    v_status   character varying;
    r          record;
    v_period   bigint;
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
            'public.orders_visits_vehicles'
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
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('RATEIO-TESTE-VAN', 'RTT0001', 2.50, 'Km', true, false)
    RETURNING id INTO v_v1;

    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('RATEIO-TESTE-SAVEIRO', 'RTT0002', 1.90, 'Km', true, false)
    RETURNING id INTO v_v2;

    INSERT INTO public.cfg_vehicles_rentals_contracts (vehicle_id, monthly_value, start_date, active)
    VALUES (v_v1, 6000.00, v_month - 60, true),
           (v_v2, 3000.00, v_month - 60, true);

    -- Visitas: 5 com Km no mês + 1 no mês anterior (fora da competência)
    FOR i IN 1..6 LOOP
        INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
        VALUES (
            'RATEIO-T-' || lpad(i::text, 3, '0'),
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

    RAISE NOTICE 'setup concluído: v1=% v2=%', v_v1, v_v2;

    -- ==========================================================
    -- 1) RESUMO AO VIVO (antes do cálculo)
    -- ==========================================================
    SELECT count(*) INTO v_n
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id IN (v_v1, v_v2);
    IF v_n <> 2 THEN
        RAISE EXCEPTION 'FALHA: summary deveria listar 2 veículos, listou %', v_n;
    END IF;

    SELECT total_km, cost_per_km, allocated_value, idle_value, period_status, contract_id
    INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v1;

    IF r.total_km <> 3000 THEN
        RAISE EXCEPTION 'FALHA: total_km esperado 3000, obtido %', r.total_km;
    END IF;
    IF r.cost_per_km IS DISTINCT FROM 2.0 THEN
        RAISE EXCEPTION 'FALHA: cost_per_km esperado 2.0, obtido %', r.cost_per_km;
    END IF;
    IF r.allocated_value IS DISTINCT FROM 6000.00 OR r.idle_value IS DISTINCT FROM 0.00 THEN
        RAISE EXCEPTION 'FALHA: esperado apropriado 6000 / ocioso 0, obtido % / %',
            r.allocated_value, r.idle_value;
    END IF;
    IF r.period_status <> 'OPEN' OR r.contract_id IS NULL THEN
        RAISE EXCEPTION 'FALHA: período OPEN com contrato vinculado (status=%, contract=%)',
            r.period_status, r.contract_id;
    END IF;
    RAISE NOTICE 'ok: resumo ao vivo (3000 km, R$ 2,00/km, apropriado 6000)';

    -- Veículo 2 sem Km no mês: tudo ociosidade
    SELECT total_km, cost_per_km, allocated_value, idle_value INTO r
    FROM public.fc_vehicle_rental_summary(v_month)
    WHERE vehicle_id = v_v2;
    IF r.total_km <> 0 OR r.cost_per_km IS NOT NULL
       OR r.allocated_value <> 0 OR r.idle_value <> 3000 THEN
        RAISE EXCEPTION 'FALHA: veículo sem Km deve ter cost_per_km NULL e ociosidade 3000 (km=% rate=% ocioso=%)',
            r.total_km, r.cost_per_km, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: total_km=0 => cost_per_km NULL, aluguel integralmente ocioso';

    -- ==========================================================
    -- 2) DETALHE (prévia visita a visita)
    -- ==========================================================
    SELECT count(*), COALESCE(sum(km), 0) INTO v_n, v_ov
    FROM public.fc_vehicle_rental_detail(v_v1, v_month);
    IF v_n <> 5 OR v_ov <> 3000 THEN
        RAISE EXCEPTION 'FALHA: detalhe deveria ter 5 visitas / 3000 km, obteve % visitas / % km',
            v_n, v_ov;
    END IF;
    RAISE NOTICE 'ok: detalhe com 5 visitas e 3000 km';

    -- ==========================================================
    -- 3) CALCULA a competência
    -- ==========================================================
    SELECT p.* INTO r
    FROM public.fc_vehicle_rental_calculate(v_v1, v_month, 0) p;

    IF r.status <> 'CALCULATED' OR r.total_km <> 3000
       OR r.cost_per_km IS DISTINCT FROM 2.0
       OR r.allocated_value <> 6000.00 OR r.idle_value <> 0.00 THEN
        RAISE EXCEPTION 'FALHA: calculate (status=% km=% rate=% apropriado=% ocioso=%)',
            r.status, r.total_km, r.cost_per_km, r.allocated_value, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: calculate => CALCULATED / 3000 km / R$ 2,00 / apropriado 6000';

    SELECT p.cost_per_km, p.total_km, p.idle_value INTO r
    FROM public.fc_vehicle_rental_calculate(v_v2, v_month, 0) p;
    IF r.cost_per_km IS NOT NULL OR r.total_km <> 0 OR r.idle_value <> 3000 THEN
        RAISE EXCEPTION 'FALHA: veículo sem Km (rate=% km=% ocioso=%)',
            r.cost_per_km, r.total_km, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: calculate sem Km mantém cost_per_km NULL';

    -- ==========================================================
    -- 4) ALOCA (rateio) — e re-execução idempotente
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);

    SELECT count(*) INTO v_n FROM public.vehicles_rentals_allocations a
    JOIN public.vehicles_rentals_periods p ON p.id = a.period_id
    WHERE p.vehicle_id = v_v1 AND p.reference_month = v_month;
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 allocations, obtido %', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rental';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: esperado 5 linhas rental, obtido %', v_n;
    END IF;

    -- Re-execução: não pode duplicar
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);
    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rental';
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA: allocate não é idempotente (linhas rental=%)', v_n;
    END IF;
    RAISE NOTICE 'ok: allocate criou 5 rateios e é idempotente';

    -- Visita 1: 375 (Km) + 300 (rateio) = 675
    SELECT ov_total_value, ov_costs_status INTO v_ov, v_status
    FROM public.orders_visits WHERE id = v_oid[1];
    IF v_ov <> 675.00 THEN
        RAISE EXCEPTION 'FALHA: ov_total_value esperado 675, obtido %', v_ov;
    END IF;
    IF v_status <> 'approved' THEN
        RAISE EXCEPTION 'FALHA: visita aprovada mudou de status (%)', v_status;
    END IF;

    -- Linha de rateio: Km = 150, custo/km = 2, total = 300, sem odômetro,
    -- herdando o status approved da visita
    SELECT amount, value_unit, value_total, recorder_start, ov_costs_status
    INTO r
    FROM public.orders_visits_vehicles
    WHERE ov_id = v_oid[1] AND vehicle_id = v_v1 AND cost_type = 'rental';
    IF r.amount <> 150 OR r.value_unit IS DISTINCT FROM 2.0
       OR r.value_total <> 300.00 OR r.recorder_start IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: linha rental (amount=% unit=% total=% start=%)',
            r.amount, r.value_unit, r.value_total, r.recorder_start;
    END IF;
    IF r.ov_costs_status <> 'approved' THEN
        RAISE EXCEPTION 'FALHA: linha rental não herdou status approved (%)', r.ov_costs_status;
    END IF;
    RAISE NOTICE 'ok: visita preservada (approved) e rateio de R$ 300 na linha rental';

    -- ==========================================================
    -- 5) FECHA + IMUTABILIDADE
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_close(v_v1, v_month, 0);

    -- No Supabase cada RPC roda numa transação própria (PostgREST) e a flag
    -- de sessão 'app.vehicle_rental_write' morre junto com ela. Este script
    -- roda numa transação única, então limpamos a flag aqui para reproduzir
    -- exatamente o isolamento que vale em produção.
    PERFORM set_config('app.vehicle_rental_write', 'off', true);

    -- 5.1 período fechado não aceita UPDATE direto
    BEGIN
        UPDATE public.vehicles_rentals_periods
           SET contract_value = 1
         WHERE vehicle_id = v_v1 AND reference_month = v_month;
        RAISE EXCEPTION 'FALHA: UPDATE direto em período fechado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: período fechado imutável (%)', left(SQLERRM, 60);
    END;

    -- 5.2 linha de rateio não pode ser editada
    BEGIN
        UPDATE public.orders_visits_vehicles
           SET amount = 0
         WHERE vehicle_id = v_v1 AND cost_type = 'rental';
        RAISE EXCEPTION 'FALHA: UPDATE direto em linha rental não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: linha rental imutável (%)', left(SQLERRM, 60);
    END;

    -- 5.3 Km já rateado não pode ser alterado (apenas linhas do mês)
    --     Fase 1: a linha fica 'odometer' (congelada pelas allocations).
    --     Fase 2: a linha foi convertida para 'rate' — o mesmo alvo.
    BEGIN
        UPDATE public.orders_visits_vehicles
           SET recorder_end = 999999
         WHERE vehicle_id = v_v1 AND cost_type IN ('odometer', 'rate') AND amount > 0
           AND created_at >= v_month
           AND created_at < v_month + interval '1 month';
        RAISE EXCEPTION 'FALHA: alterar Km já rateado não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: Km já rateado congelado (%)', left(SQLERRM, 60);
    END;

    -- 5.4 estorno exige reabrir antes
    BEGIN
        PERFORM public.fc_vehicle_rental_revert(v_v1, v_month, 0);
        RAISE EXCEPTION 'FALHA: revert em competência fechada não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: revert exige reabrir antes (%)', left(SQLERRM, 50);
    END;

    -- ==========================================================
    -- 6) REABRE + ESTORNA => tudo restaurado
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_reopen(v_v1, v_month, 0);
    PERFORM public.fc_vehicle_rental_revert(v_v1, v_month, 0);

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'rental';
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: revert não removeu as linhas rental (%)', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type IN ('rate', 'variable');
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA: revert deixou % linha(s) de rateio/despesa para trás', v_n;
    END IF;

    SELECT ov_vehicles_value INTO v_ov FROM public.orders_visits WHERE id = v_oid[1];
    IF v_ov <> 375.00 THEN
        RAISE EXCEPTION 'FALHA: ov_vehicles_value restaurado esperado 375, obtido %', v_ov;
    END IF;
    RAISE NOTICE 'ok: revert removeu os rateios e restaurou ov_vehicles_value (375)';

    -- ==========================================================
    -- 7) RESUMO FINANCEIRO separa Km x Rateio
    --    Fase 1: linha de Km permanece 'odometer' após alocar.
    --    Fase 2: a linha com Km vira 'rate' (a de 0 km continua
    --    'odometer' — ela também entra na visão financeira).
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);

    SELECT string_agg(DISTINCT t, ',' ORDER BY t) INTO v_types
    FROM (SELECT cost_type::text AS t
          FROM public.fc_financial_orders_visits_vehicles_sum(ARRAY[v_oid[1]::integer])) s;
    IF v_types NOT IN ('odometer,rental', 'rate,rental', 'odometer,rate,rental') THEN
        RAISE EXCEPTION 'FALHA: resumo financeiro esperado "odometer,rental" (Fase 1), "rate,rental" ou "odometer,rate,rental" (Fase 2), obteve "%"',
            COALESCE(v_types, '(null)');
    END IF;
    RAISE NOTICE 'ok: resumo financeiro separa Km (% ) x Rateio (rental)', COALESCE(v_types, '(null)');

    RAISE NOTICE 'OK: todos os testes passaram (nenhum dado persistido — a transação termina em ROLLBACK)';
END $$;

ROLLBACK;
