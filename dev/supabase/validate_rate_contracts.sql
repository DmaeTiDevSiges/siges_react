-- ============================================================
-- Validação manual: Contratos de R$/km (custo operacional por Km)
-- Data: 2026-10-10
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode as migrations 20261008 + 20261009 (se ainda não foram
--      aplicadas).
--   2. Rode a migration 20261010_add_vehicle_rate_contracts.sql.
--   3. Rode ESTE arquivo inteiro (Execute).
--   4. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. sem contrato vigente, amount > 0 ⇒ BLOQUEADO (mensagem do
--      trigger); amount = 0 (apenas adicionar o veículo) continua livre
--   2. com contrato vigente, a linha de odômetro usa o R$/km do
--      contrato (value_unit + value_total = km × R$/km)
--   3. dois contratos sobrepostos ⇒ vence o mais recente e
--      has_conflict = true
--   4. contrato encerrado (end_date < hoje) não cobre linha nova
--   5. contrato ainda não iniciado (start_date > hoje) não cobre
--   6. linha existente NÃO é reprecificada quando o contrato muda
--      (value_unit congelado); atualizar o Km re-resolve o contrato
--      da data da linha (mesmo vigente => mesmo preço)
--   7. backfill (mesma regra) é idempotente: cria 1 contrato e não
--      duplica na re-execução
--   8. branches preservadas: rental/variable mantêm valores
--      informados; conversão 'rate' não recalcula
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Os testes criam
--   veículos/visitas com prefixo "F3-TESTE-".
--
--   Única exceção (não é desfeita pelo ROLLBACK): o passo de
--   sincronização de sequences com o MAX(id) das tabelas de teste.
--   É um reparo benigno — só adianta sequence para trás do dado
--   existente, sem alterar nenhum registro.
-- ============================================================

BEGIN;

DO $$
DECLARE
    v_today     date := (now())::date;
    v_month     date := (date_trunc('month', now()))::date;
    v_v1        bigint;
    v_v2        bigint;
    v_oid       bigint;
    v_row       record;
    v_contract  bigint;
    v_n         integer;
    v_rate      numeric;
    i           integer;
    v_seq       record;
    v_seqname   text;
BEGIN
    -- ==========================================================
    -- 0) Sincroniza sequences com os dados já existentes.
    -- ==========================================================
    FOR v_seq IN
        SELECT unnest(ARRAY[
            'public.vehicles',
            'public.orders_visits',
            'public.orders_visits_vehicles',
            'public.cfg_vehicle_rate_contracts'
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
    -- SETUP: veículo SEM contrato + 1 visita
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F3-TESTE-VAN', 'F3T0001', 1.80, 'Km', true, false)
    RETURNING id INTO v_v1;

    INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
    VALUES ('F3-TESTE-001', v_month + 2, 'pending')
    RETURNING id INTO v_oid;

    -- ==========================================================
    -- 1. Sem contrato: amount > 0 BLOQUEADO; amount = 0 livre
    -- ==========================================================
    BEGIN
        INSERT INTO public.orders_visits_vehicles
            (ov_id, vehicle_id, recorder_start, recorder_end, created_at)
        VALUES (v_oid, v_v1, 1000, 1150, now());
        RAISE EXCEPTION 'FALHA: Km sem contrato de R$/km vigente deveria ter sido bloqueado';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
            IF SQLERRM NOT LIKE '%contrato de R$/km%' THEN
                RAISE EXCEPTION 'FALHA: erro inesperado no bloqueio: %', SQLERRM;
            END IF;
            RAISE NOTICE 'ok: amount > 0 sem contrato => bloqueado';
    END;

    -- Adicionar o veículo à visita (sem Km) continua livre e usa o
    -- valor padrão do cadastro (vehicles.value_unit = 1,80)
    INSERT INTO public.orders_visits_vehicles (ov_id, vehicle_id, created_at)
    VALUES (v_oid, v_v1, now())
    RETURNING id, value_unit, amount, value_total INTO v_row;
    IF v_row.amount <> 0 OR v_row.value_unit <> 1.80 OR v_row.value_total <> 0 THEN
        RAISE EXCEPTION 'FALHA: linha sem Km deveria ter amount 0, value_unit 1,80 e value_total 0 (obtido % / % / %)',
            v_row.amount, v_row.value_unit, v_row.value_total;
    END IF;
    RAISE NOTICE 'ok: amount = 0 sem contrato => liberado (value_unit padrão 1,80)';

    -- ==========================================================
    -- 2. Contrato vigente => linha de odômetro usa o R$/km
    -- ==========================================================
    INSERT INTO public.cfg_vehicle_rate_contracts (vehicle_id, value_unit, start_date, end_date, active)
    VALUES (v_v1, 2.35, v_month - 2, DATE '2026-12-31', true)
    RETURNING id INTO v_contract;

    UPDATE public.orders_visits_vehicles
    SET recorder_start = 1000, recorder_end = 1150
    WHERE vehicle_id = v_v1 AND amount = 0
    RETURNING id, value_unit, amount, value_total INTO v_row;
    IF v_row.amount <> 150 OR v_row.value_unit <> 2.35 OR v_row.value_total <> 352.50 THEN
        RAISE EXCEPTION 'FALHA: linha deveria ter 150 km × 2,35 = 352,50 (obtido % / % / %)',
            v_row.amount, v_row.value_unit, v_row.value_total;
    END IF;
    RAISE NOTICE 'ok: com contrato vigente, linha usa R$/km do contrato (150 × 2,35 = 352,50)';

    -- ==========================================================
    -- 3. Contratos sobrepostos => mais recente vence, conflito true
    -- ==========================================================
    INSERT INTO public.cfg_vehicle_rate_contracts (vehicle_id, value_unit, start_date, end_date, active)
    VALUES (v_v1, 3.10, v_month, DATE '2026-12-31', true);

    SELECT c.contract_id, c.value_unit, c.has_conflict
    INTO v_row
    FROM public.fc_vehicle_rate_contract(v_v1, v_today) c;
    IF v_row.contract_id IS NULL OR v_row.value_unit <> 3.10 OR v_row.has_conflict <> true THEN
        RAISE EXCEPTION 'FALHA: contrato mais recente (3,10) deveria vencer com conflito (obtido % / % / %)',
            v_row.contract_id, v_row.value_unit, v_row.has_conflict;
    END IF;
    RAISE NOTICE 'ok: sobreposição => vence o mais recente (3,10) e has_conflict = true';

    -- Desativa o contrato sobreposto: os próximos testes de vigência
    -- usam um veículo dedicado (v2) e o teste 6 do v1 precisa resolver
    -- apenas o contrato 2,35.
    UPDATE public.cfg_vehicle_rate_contracts
    SET active = false
    WHERE vehicle_id = v_v1 AND value_unit = 3.10;

    -- ==========================================================
    -- 4. Contrato encerrado não cobre linha nova (veículo dedicado)
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('F3-TESTE-EXPIRED', 'F3T0002', 1.50, 'Km', true, false)
    RETURNING id INTO v_v2;

    INSERT INTO public.cfg_vehicle_rate_contracts (vehicle_id, value_unit, start_date, end_date, active)
    VALUES (v_v2, 1.50, v_month - 3, v_month - 1, true);

    INSERT INTO public.orders_visits (ov_mask, ov_created_at, ov_costs_status)
    VALUES ('F3-TESTE-002', v_month + 3, 'pending')
    RETURNING id INTO v_oid;

    BEGIN
        INSERT INTO public.orders_visits_vehicles
            (ov_id, vehicle_id, recorder_start, recorder_end, created_at)
        VALUES (v_oid, v_v2, 2000, 2100, now());
        RAISE EXCEPTION 'FALHA: contrato encerrado não deveria cobrir a linha nova';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
            IF SQLERRM NOT LIKE '%contrato de R$/km%' THEN
                RAISE EXCEPTION 'FALHA: erro inesperado no bloqueio: %', SQLERRM;
            END IF;
            RAISE NOTICE 'ok: contrato encerrado (end_date no mês anterior) => linha nova bloqueada';
    END;

    -- ==========================================================
    -- 5. Contrato ainda não iniciado não cobre
    -- ==========================================================
    UPDATE public.cfg_vehicle_rate_contracts
    SET start_date = v_month + 2, end_date = NULL
    WHERE vehicle_id = v_v2;

    BEGIN
        INSERT INTO public.orders_visits_vehicles
            (ov_id, vehicle_id, recorder_start, recorder_end, created_at)
        VALUES (v_oid, v_v2, 2000, 2100, now());
        RAISE EXCEPTION 'FALHA: contrato futuro não deveria cobrir a linha nova';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE 'FALHA%' THEN RAISE; END IF;
            IF SQLERRM NOT LIKE '%contrato de R$/km%' THEN
                RAISE EXCEPTION 'FALHA: erro inesperado no bloqueio: %', SQLERRM;
            END IF;
            RAISE NOTICE 'ok: contrato futuro (start_date no futuro) => linha nova bloqueada';
    END;

    -- Controle positivo: abrindo a vigência, a MESMA linha é aceita
    -- e usa o R$/km do contrato (1,50).
    UPDATE public.cfg_vehicle_rate_contracts
    SET start_date = v_month - 2
    WHERE vehicle_id = v_v2;

    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, recorder_start, recorder_end, created_at)
    VALUES (v_oid, v_v2, 2000, 2100, now())
    RETURNING amount, value_unit, value_total INTO v_row;
    IF v_row.amount <> 100 OR v_row.value_unit <> 1.50 OR v_row.value_total <> 150.00 THEN
        RAISE EXCEPTION 'FALHA: com vigência aberta a linha deveria ser 100 × 1,50 = 150 (obtido % / % / %)',
            v_row.amount, v_row.value_unit, v_row.value_total;
    END IF;
    RAISE NOTICE 'ok: vigência aberta => linha aceita com R$/km do contrato (100 × 1,50)';

    -- ==========================================================
    -- 6. Linha existente NÃO é reprecificada; Km usa o contrato da
    --    data da linha (não o de hoje)
    -- ==========================================================
    SELECT id, value_unit, value_total INTO v_row
    FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND amount = 150
    LIMIT 1;
    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'FALHA: linha de 150 km do veículo 1 não encontrada (teste 2 deveria tê-la criado)';
    END IF;
    IF v_row.value_unit <> 2.35 OR v_row.value_total <> 352.50 THEN
        RAISE EXCEPTION 'FALHA: linha antiga deveria permanecer 2,35 / 352,50 (obtido % / %)',
            v_row.value_unit, v_row.value_total;
    END IF;

    -- Atualizar o Km da linha: re-resolve o contrato pela DATA da
    -- linha (created_at no mês corrente ⇒ contrato 2,35 ainda vigente)
    UPDATE public.orders_visits_vehicles
    SET recorder_end = 1200
    WHERE id = v_row.id
    RETURNING value_unit, amount, value_total INTO v_row;
    IF v_row.amount <> 200 OR v_row.value_unit <> 2.35 OR v_row.value_total <> 470.00 THEN
        RAISE EXCEPTION 'FALHA: Km atualizado deveria reprecificar 200 × 2,35 = 470,00 (obtido % / % / %)',
            v_row.amount, v_row.value_unit, v_row.value_total;
    END IF;
    RAISE NOTICE 'ok: linha existente congelada; atualizar Km re-resolve o contrato da data da linha';

    -- ==========================================================
    -- 7. Backfill idempotente (mesma regra da migration)
    -- ==========================================================
    -- Executa a MESMA lógica da seção 3 da migration duas vezes:
    -- a 1ª cria (veículo sem contrato => start = 1º do mês da 1ª
    -- linha), a 2ª não duplica.
    -- (Removemos os contratos do v1 — inclusive o inativo — para
    --  simular o estado de pré-backfill.)
    DELETE FROM public.cfg_vehicle_rate_contracts WHERE vehicle_id = v_v1;

    FOR i IN 1..2 LOOP
        INSERT INTO public.cfg_vehicle_rate_contracts (
            vehicle_id, value_unit, start_date, end_date, active, description, created_at
        )
        SELECT ve.id,
               COALESCE(ve.value_unit, 0),
               date_trunc('month', (
                   SELECT min(COALESCE(ovv.created_at, ovs.ov_created_at))
                   FROM public.orders_visits_vehicles ovv
                   JOIN public.orders_visits ovs ON ovs.id = ovv.ov_id
                   WHERE ovv.vehicle_id = ve.id AND NOT ovv.is_deleted
               ))::date,
               DATE '2026-12-31', true,
               'backfill-teste', now()
        FROM public.vehicles ve
        WHERE ve.id = v_v1
          AND NOT EXISTS (
              SELECT 1 FROM public.cfg_vehicle_rate_contracts rc
              WHERE rc.vehicle_id = ve.id AND NOT rc.is_deleted
          );
    END LOOP;

    SELECT count(*) INTO v_n
    FROM public.cfg_vehicle_rate_contracts
    WHERE vehicle_id = v_v1 AND NOT is_deleted;
    IF v_n <> 1 THEN
        RAISE EXCEPTION 'FALHA: backfill deveria criar exatamente 1 contrato (obtido %)', v_n;
    END IF;

    SELECT start_date, value_unit INTO v_row
    FROM public.cfg_vehicle_rate_contracts WHERE vehicle_id = v_v1;
    IF v_row.start_date <> v_month OR v_row.value_unit <> 1.80 THEN
        RAISE EXCEPTION 'FALHA: backfill deveria criar contrato em % com 1,80 (obtido % / %)',
            v_month, v_row.start_date, v_row.value_unit;
    END IF;
    RAISE NOTICE 'ok: backfill idempotente (1 contrato, início %, valor 1,80)', v_month;

    -- ==========================================================
    -- 8. Branches preservadas: rental/variable e conversão 'rate'
    -- ==========================================================
    PERFORM set_config('app.vehicle_rental_write', '1', true);

    INSERT INTO public.orders_visits_vehicles
        (ov_id, vehicle_id, amount, value_unit, cost_type, created_at)
    VALUES (v_oid, v_v1, 100, 9.99, 'rental', now())
    RETURNING id, amount, value_unit, value_total INTO v_row;
    IF v_row.value_unit <> 9.99 OR v_row.value_total <> 999.00 THEN
        RAISE EXCEPTION 'FALHA: linha rental deveria preservar 9.99 / 999.00 (obtido % / %)',
            v_row.value_unit, v_row.value_total;
    END IF;

    -- Conversão odometer <-> rate: nada recalcula
    SELECT id, value_unit, value_total INTO v_row
    FROM public.orders_visits_vehicles
    WHERE vehicle_id = v_v1 AND amount = 200 AND cost_type = 'odometer';
    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'FALHA: linha de 200 km do veículo 1 não encontrada para a conversão';
    END IF;
    UPDATE public.orders_visits_vehicles
    SET cost_type = 'rate'
    WHERE id = v_row.id;
    UPDATE public.orders_visits_vehicles
    SET cost_type = 'odometer'
    WHERE id = v_row.id
    RETURNING value_unit, value_total INTO v_row;
    IF v_row.value_unit <> 2.35 OR v_row.value_total <> 470.00 THEN
        RAISE EXCEPTION 'FALHA: conversão rate deveria preservar 2.35 / 470.00 (obtido % / %)',
            v_row.value_unit, v_row.value_total;
    END IF;
    RAISE NOTICE 'ok: branches rental e conversão rate preservadas';

    RAISE NOTICE 'OK: todos os testes passaram (contratos de R$/km)';

END $$;

ROLLBACK;

-- ============================================================
-- FIM DA VALIDAÇÃO 20261010 (nada é persistido — ROLLBACK)
-- ============================================================
