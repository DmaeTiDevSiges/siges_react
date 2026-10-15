-- ============================================================
-- Validação manual: Registro de Ociosidade (cost_type = 'idle')
-- Data: 2026-10-21
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode primeiro a migration 20261021_vehicle_idle_record.sql
--   2. Rode ESTE arquivo inteiro (Execute).
--   3. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. CHECK aceita 'idle'; linha manual 'rental' continua bloqueada
--   2. before_save calcula value_total do idle (1 × mensalidade)
--   3. rollup EXCLUI ociosidade de ov_vehicles_value (visita = 0)
--   4. unicidade: 1 ociosidade por veículo + competência
--   5. allocate sem registro => erro orientando (não trava silencioso)
--   6. close sem visita vinculada => erro "sem visita vinculada"
--   7. com registro: allocate amarra (apropriado = contrato, ocioso = 0)
--   8. close => CLOSED; idle congelado (update/delete bloqueados)
--   9. revert => CALCULATED; registro preservado e editável de novo
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Prefixo "IDLE-TESTE-".
-- ============================================================

BEGIN;

DO $$
DECLARE
    v_month    date := (date_trunc('month', now()))::date;
    v_v1       bigint;
    v_oid      bigint;
    v_ovv      bigint;
    v_n        integer;
    v_ov       numeric;
    v_vt       numeric;
    r          record;
    v_seq      record;
    v_seqname  text;
BEGIN
    -- 0) Sincroniza sequences (bases restauradas por dump)
    FOR v_seq IN
        SELECT unnest(ARRAY[
            'public.vehicles',
            'public.orders_visits',
            'public.orders_visits_vehicles',
            'public.cfg_vehicles_rentals_contracts',
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
    -- SETUP: 1 veículo só-aluguel (value_unit = 0) + contrato +
    -- 1 visita + 1 registro de ociosidade na competência
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, unit, is_available, is_deleted)
    VALUES ('IDLE-TESTE-VAN', 'IDT0001', 'Km', true, false)
    RETURNING id INTO v_v1;

    INSERT INTO public.cfg_vehicles_rentals_contracts
        (vehicle_id, monthly_value, value_unit, start_date, active)
    VALUES (v_v1, 4500.00, 0, v_month - 60, true);

    INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
    VALUES ('IDLE-T-001', v_month + 2, 'pending')
    RETURNING id INTO v_oid;

    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, cost_type, amount, value_unit, created_at, ov_costs_status)
    VALUES (v_oid, v_v1, 'idle', 1, 4500.00, v_month + 27, 'pending')
    RETURNING id INTO v_ovv;

    -- ==========================================================
    -- 1) Linha manual 'rental' continua bloqueada
    -- ==========================================================
    BEGIN
        INSERT INTO public.orders_visits_vehicles
            (ov_id, vehicle_id, cost_type, amount, value_unit, created_at)
        VALUES (v_oid, v_v1, 'rental', 1, 4500.00, v_month + 3);
        RAISE EXCEPTION 'FALHA: linha rental manual não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: rental manual bloqueado (%)', left(SQLERRM, 60);
    END;

    -- ==========================================================
    -- 2) before_save calculou value_total = 1 × 4500
    -- ==========================================================
    SELECT value_total, recorder_start, recorder_end, amount INTO r
    FROM public.orders_visits_vehicles WHERE id = v_ovv;
    IF r.value_total IS DISTINCT FROM 4500.00 THEN
        RAISE EXCEPTION 'FALHA: value_total do idle esperado 4500, obtido %', r.value_total;
    END IF;
    IF r.recorder_start IS NOT NULL OR r.recorder_end IS NOT NULL OR r.amount <> 1 THEN
        RAISE EXCEPTION 'FALHA: idle deve ter odômetro NULL e amount 1';
    END IF;
    RAISE NOTICE 'ok: before_save do idle (1 × 4500 = 4500, sem odômetro)';

    -- ==========================================================
    -- 3) Rollup EXCLUI ociosidade (visita continua zerada)
    -- ==========================================================
    SELECT ov_vehicles_value INTO v_ov FROM public.orders_visits WHERE id = v_oid;
    IF v_ov IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'FALHA: ov_vehicles_value com só-ociosidade esperado 0, obtido %', v_ov;
    END IF;
    RAISE NOTICE 'ok: ociosidade extraída do total da visita (0)';

    -- ==========================================================
    -- 4) Unicidade: 2º registro no mesmo mês é rejeitado
    -- ==========================================================
    BEGIN
        INSERT INTO public.orders_visits_vehicles
            (ov_id, vehicle_id, cost_type, amount, value_unit, created_at)
        VALUES (v_oid, v_v1, 'idle', 1, 4500.00, v_month + 10);
        RAISE EXCEPTION 'FALHA: 2ª ociosidade no mês não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: 1 ociosidade por veículo/mês (%)', left(SQLERRM, 50);
    END;

    -- ==========================================================
    -- 5) allocate SEM registro => erro orientando
    --    (remove o registro temporariamente para o teste)
    -- ==========================================================
    DELETE FROM public.orders_visits_vehicles WHERE id = v_ovv;
    PERFORM public.fc_vehicle_rental_calculate(v_v1, v_month, 0);
    BEGIN
        PERFORM public.fc_vehicle_rental_allocate(v_v1, v_month, 0);
        RAISE EXCEPTION 'FALHA: allocate sem registro não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        IF SQLERRM NOT LIKE '%sem registro de ociosidade%' THEN
            RAISE EXCEPTION 'FALHA: mensagem esperada "sem registro de ociosidade", obtida "%"', SQLERRM;
        END IF;
        RAISE NOTICE 'ok: allocate sem registro orienta (%)', left(SQLERRM, 70);
    END;

    -- ==========================================================
    -- 6) close SEM visita vinculada => erro "sem visita vinculada"
    -- ==========================================================
    BEGIN
        PERFORM public.fc_vehicle_rental_close(v_v1, v_month, 0);
        RAISE EXCEPTION 'FALHA: close sem visita não foi bloqueado';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        IF SQLERRM NOT LIKE '%sem visita vinculada%' THEN
            RAISE EXCEPTION 'FALHA: mensagem esperada "sem visita vinculada", obtida "%"', SQLERRM;
        END IF;
        RAISE NOTICE 'ok: close sem visita bloqueado (%)', left(SQLERRM, 70);
    END;

    -- Recria o registro para os testes 7–9
    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, cost_type, amount, value_unit, created_at, ov_costs_status)
    VALUES (v_oid, v_v1, 'idle', 1, 4500.00, v_month + 27, 'pending')
    RETURNING id INTO v_ovv;

    -- ==========================================================
    -- 7) Com registro: allocate amarra (apropriado = contrato)
    -- ==========================================================
    SELECT p.status, p.allocated_value, p.idle_value INTO r
    FROM public.fc_vehicle_rental_allocate(v_v1, v_month, 0) p;
    IF r.status <> 'ALLOCATED' OR r.allocated_value IS DISTINCT FROM 4500.00
       OR r.idle_value IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'FALHA: allocate com registro (status=% apropriado=% ocioso=%)',
            r.status, r.allocated_value, r.idle_value;
    END IF;
    RAISE NOTICE 'ok: allocate com registro (apropriado 4500, ocioso 0)';

    -- Ociosidade congelada enquanto ALLOCATED
    BEGIN
        UPDATE public.orders_visits_vehicles
           SET value_unit = 9999 WHERE id = v_ovv;
        RAISE EXCEPTION 'FALHA: edição de ociosidade apropriada não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: ociosidade apropriada congelada (%)', left(SQLERRM, 60);
    END;
    BEGIN
        DELETE FROM public.orders_visits_vehicles WHERE id = v_ovv;
        RAISE EXCEPTION 'FALHA: exclusão de ociosidade apropriada não foi bloqueada';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE 'FALHA:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok: exclusão de ociosidade apropriada bloqueada';
    END;

    -- ==========================================================
    -- 8) close => CLOSED
    -- ==========================================================
    SELECT p.status INTO r FROM public.fc_vehicle_rental_close(v_v1, v_month, 0) p;
    IF r.status <> 'CLOSED' THEN
        RAISE EXCEPTION 'FALHA: close esperado CLOSED, obtido %', r.status;
    END IF;
    RAISE NOTICE 'ok: close com visita vinculada => CLOSED';

    -- ==========================================================
    -- 9) reopen + revert => CALCULATED, registro preservado e
    --    editável de novo (sem allocation, sem conversão)
    -- ==========================================================
    PERFORM public.fc_vehicle_rental_reopen(v_v1, v_month, 0);
    SELECT p.status, p.allocated_value, p.idle_value INTO r
    FROM public.fc_vehicle_rental_revert(v_v1, v_month, 0) p;
    IF r.status <> 'CALCULATED' OR r.allocated_value IS DISTINCT FROM 0
       OR r.idle_value IS DISTINCT FROM 4500.00 THEN
        RAISE EXCEPTION 'FALHA: revert (status=% apropriado=% ocioso=%)',
            r.status, r.allocated_value, r.idle_value;
    END IF;
    SELECT count(*), COALESCE(sum(value_total), 0) INTO v_n, v_vt
    FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND cost_type = 'idle' AND NOT is_deleted;
    IF v_n <> 1 OR v_vt IS DISTINCT FROM 4500.00 THEN
        RAISE EXCEPTION 'FALHA: revert deve preservar o registro idle (n=% total=%)', v_n, v_vt;
    END IF;
    UPDATE public.orders_visits_vehicles
       SET discount = 1 WHERE id = v_ovv;
    DELETE FROM public.orders_visits_vehicles WHERE id = v_ovv;
    RAISE NOTICE 'ok: revert preserva o registro e destrava edição/exclusão';

    RAISE NOTICE 'OK: todos os testes passaram (nenhum dado persistido — a transação termina em ROLLBACK)';
END $$;

ROLLBACK;
