-- ============================================================
-- Validação manual: Rename das tabelas do rateio veicular
-- Data: 2026-10-10
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode primeiro a migration 20261012_rename_vehicles_cost_tables.sql
--   2. Rode ESTE arquivo inteiro (Execute).
--   3. Saída esperada: NOTICE "OK: todos os testes passaram (...)".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. tabelas novas existem e as antigas não existem mais
--   2. constraints renomeadas (pkey, unique, checks, fk)
--   3. sequences de identidade renomeadas
--   4. índice parcial idx_*_vehicle renomeado
--   5. FKs nas tabelas dependentes preservadas (OID-based)
--   6. GRANTs (authenticated) e RLS preservados
--   7. seed dos tipos de custo intacto (5 códigos)
--   8. CRUD nas duas tabelas novas + FK de despesa → tipo de custo
--   9. fc_vehicle_rental_summary executa sem erro (corpo re-emitido
--      com o nome novo — era a única função viva afetada)
--  10. nenhum objeto restou com o nome antigo
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK:
--   nenhum dado de teste é persistido na base. Os registros criados
--   usam prefixo "RENAME-TESTE-".
-- ============================================================

BEGIN;

DO $$
DECLARE
    v_month    date := (date_trunc('month', now()))::date;
    v_v        bigint;
    v_ct       bigint;
    v_ct2      bigint;
    v_contract bigint;
    v_exp      bigint;
    v_n        integer;
    v_seq      text;
BEGIN
    -- ==========================================================
    -- 1) Tabelas novas existem / antigas não
    -- ==========================================================
    IF to_regclass('public.cfg_vehicles_costs_types') IS NULL THEN
        RAISE EXCEPTION 'FALHA (1): tabela cfg_vehicles_costs_types inexistente';
    END IF;
    IF to_regclass('public.cfg_vehicles_rentals_contracts') IS NULL THEN
        RAISE EXCEPTION 'FALHA (1): tabela cfg_vehicles_rentals_contracts inexistente';
    END IF;
    IF to_regclass('public.cfg_vehicle_cost_types') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA (1): tabela antiga cfg_vehicle_cost_types ainda existe';
    END IF;
    IF to_regclass('public.cfg_vehicle_rental_contracts') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA (1): tabela antiga cfg_vehicle_rental_contracts ainda existe';
    END IF;
    RAISE NOTICE 'OK (1): tabelas renomeadas e nomes antigos ausentes';

    -- ==========================================================
    -- 2) Constraints renomeadas
    -- ==========================================================
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_costs_types')
          AND conname = 'cfg_vehicles_costs_types_pkey'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_costs_types_pkey não encontrada';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_costs_types')
          AND conname = 'cfg_vehicles_costs_types_code_key'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_costs_types_code_key não encontrada';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_rentals_contracts')
          AND conname = 'cfg_vehicles_rentals_contracts_pkey'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_rentals_contracts_pkey não encontrada';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_rentals_contracts')
          AND conname = 'cfg_vehicles_rentals_contracts_value_ck'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_rentals_contracts_value_ck não encontrada';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_rentals_contracts')
          AND conname = 'cfg_vehicles_rentals_contracts_dates_ck'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_rentals_contracts_dates_ck não encontrada';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.cfg_vehicles_rentals_contracts')
          AND conname = 'cfg_vehicles_rentals_contracts_vehicle_fk'
    ) THEN
        RAISE EXCEPTION 'FALHA (2): cfg_vehicles_rentals_contracts_vehicle_fk não encontrada';
    END IF;
    RAISE NOTICE 'OK (2): constraints renomeadas';

    -- ==========================================================
    -- 3) Sequences renomeadas
    -- ==========================================================
    v_seq := pg_get_serial_sequence('public.cfg_vehicles_costs_types', 'id');
    IF v_seq IS NULL OR v_seq NOT LIKE '%cfg_vehicles_costs_types_id_seq' THEN
        RAISE EXCEPTION 'FALHA (3): sequence da tabela de tipos de custo = %', v_seq;
    END IF;
    v_seq := pg_get_serial_sequence('public.cfg_vehicles_rentals_contracts', 'id');
    IF v_seq IS NULL OR v_seq NOT LIKE '%cfg_vehicles_rentals_contracts_id_seq' THEN
        RAISE EXCEPTION 'FALHA (3): sequence da tabela de contratos = %', v_seq;
    END IF;
    RAISE NOTICE 'OK (3): sequences renomeadas';

    -- ==========================================================
    -- 4) Índice parcial renomeado
    -- ==========================================================
    IF to_regclass('public.idx_cfg_vehicles_rentals_contracts_vehicle') IS NULL THEN
        RAISE EXCEPTION 'FALHA (4): idx_cfg_vehicles_rentals_contracts_vehicle inexistente';
    END IF;
    IF to_regclass('public.idx_cfg_vehicle_rental_contracts_vehicle') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA (4): índice antigo ainda existe';
    END IF;
    RAISE NOTICE 'OK (4): índice renomeado';

    -- ==========================================================
    -- 5) FKs nas dependentes preservadas
    -- ==========================================================
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.vehicles_rentals_periods')
          AND confrelid = to_regclass('public.cfg_vehicles_rentals_contracts')
    ) THEN
        RAISE EXCEPTION 'FALHA (5): FK vehicles_rentals_periods → contratos perdida';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('public.vehicles_monthly_expenses')
          AND confrelid = to_regclass('public.cfg_vehicles_costs_types')
    ) THEN
        RAISE EXCEPTION 'FALHA (5): FK vehicles_monthly_expenses → tipos de custo perdida';
    END IF;
    RAISE NOTICE 'OK (5): FKs das dependentes preservadas';

    -- ==========================================================
    -- 6) GRANTs + RLS preservados
    -- ==========================================================
    IF NOT has_table_privilege('authenticated', 'public.cfg_vehicles_costs_types', 'SELECT') THEN
        RAISE EXCEPTION 'FALHA (6): GRANT de SELECT para authenticated perdido (tipos de custo)';
    END IF;
    IF NOT has_table_privilege('authenticated', 'public.cfg_vehicles_rentals_contracts', 'SELECT') THEN
        RAISE EXCEPTION 'FALHA (6): GRANT de SELECT para authenticated perdido (contratos)';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = to_regclass('public.cfg_vehicles_costs_types') AND relrowsecurity
    ) THEN
        RAISE EXCEPTION 'FALHA (6): RLS desativado na tabela de tipos de custo';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = to_regclass('public.cfg_vehicles_rentals_contracts') AND relrowsecurity
    ) THEN
        RAISE EXCEPTION 'FALHA (6): RLS desativado na tabela de contratos';
    END IF;
    RAISE NOTICE 'OK (6): GRANTs e RLS preservados';

    -- ==========================================================
    -- 7) Seed intacto
    -- ==========================================================
    SELECT count(*) INTO v_n
    FROM public.cfg_vehicles_costs_types
    WHERE code IN ('FUEL', 'TOLL', 'MAINTENANCE', 'INSURANCE_TAX', 'OTHER')
      AND NOT is_deleted;
    IF v_n <> 5 THEN
        RAISE EXCEPTION 'FALHA (7): seed esperava 5 tipos, encontrou %', v_n;
    END IF;
    RAISE NOTICE 'OK (7): seed de tipos de custo intacto (%)', v_n;

    -- ==========================================================
    -- 8) CRUD nas tabelas novas + FK despesa → tipo de custo
    -- ==========================================================
    INSERT INTO public.vehicles (description, plates, value_unit, unit, is_available, is_deleted)
    VALUES ('RENAME-TESTE-V', 'RNM0001', 1.00, 'Km', true, false)
    RETURNING id INTO v_v;

    INSERT INTO public.cfg_vehicles_costs_types (code, description, color, is_available)
    VALUES ('RENAME_TEST', 'Rename teste', '#123456', true)
    RETURNING id INTO v_ct;

    INSERT INTO public.cfg_vehicles_rentals_contracts (vehicle_id, monthly_value, start_date, active, description)
    VALUES (v_v, 100.00, v_month - 60, true, 'RENAME-TESTE-CONTRATO')
    RETURNING id INTO v_contract;

    -- FK da despesa aponta para a linha nova do tipo de custo
    INSERT INTO public.vehicles_monthly_expenses (vehicle_id, reference_month, cost_type_id, value, description)
    VALUES (v_v, v_month, v_ct, 10.00, 'RENAME-TESTE-DESPESA')
    RETURNING id INTO v_exp;

    -- deletar exige desfazer a despesa antes (guard de FK) — tudo em ROLLBACK
    DELETE FROM public.vehicles_monthly_expenses WHERE id = v_exp;
    DELETE FROM public.cfg_vehicles_rentals_contracts WHERE id = v_contract;
    DELETE FROM public.cfg_vehicles_costs_types WHERE id = v_ct;
    DELETE FROM public.vehicles WHERE id = v_v;

    SELECT count(*) INTO v_n FROM public.cfg_vehicles_costs_types WHERE code = 'RENAME_TEST';
    IF v_n <> 0 THEN
        RAISE EXCEPTION 'FALHA (8): limpeza do CRUD não funcionou';
    END IF;
    RAISE NOTICE 'OK (8): CRUD nas tabelas novas + FK de despesa funcionando';

    -- ==========================================================
    -- 9) fc_vehicle_rental_summary com o corpo re-emitido
    -- ==========================================================
    SELECT count(*) INTO v_n
    FROM public.fc_vehicle_rental_summary(v_month);
    RAISE NOTICE 'OK (9): fc_vehicle_rental_summary executou (% linha(s) para %)', v_n, v_month;

    -- ==========================================================
    -- 10) Nenhum objeto restou com o nome antigo (relações)
    -- ==========================================================
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('cfg_vehicle_cost_types', 'cfg_vehicle_rental_contracts',
                            'cfg_vehicle_cost_types_id_seq', 'cfg_vehicle_rental_contracts_id_seq',
                            'idx_cfg_vehicle_rental_contracts_vehicle')
    ) THEN
        RAISE EXCEPTION 'FALHA (10): ainda existem objetos com o nome antigo';
    END IF;
    RAISE NOTICE 'OK (10): nenhum objeto com o nome antigo';

    RAISE NOTICE 'OK: todos os testes passaram (rename 20261012 — 10/10 checks)';
END $$;

ROLLBACK;
