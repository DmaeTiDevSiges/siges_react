-- Validação pós-rename 20261015_rename_rental_table_names
-- Rodar no SQL Editor após aplicar a migration.

DO $$
BEGIN
    IF to_regclass('public.vehicles_monthly_expenses') IS NULL THEN
        RAISE EXCEPTION 'FALHA: tabela vehicles_monthly_expenses não existe';
    END IF;
    IF to_regclass('public.vehicles_rentals_allocations') IS NULL THEN
        RAISE EXCEPTION 'FALHA: tabela vehicles_rentals_allocations não existe';
    END IF;
    IF to_regclass('public.vehicles_rentals_periods') IS NULL THEN
        RAISE EXCEPTION 'FALHA: tabela vehicles_rentals_periods não existe';
    END IF;
    IF to_regclass('public.vehicle_monthly_expenses') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: tabela antiga vehicle_monthly_expenses ainda existe';
    END IF;
    IF to_regclass('public.vehicles_rentals_allocations') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: tabela antiga vehicles_rentals_allocations ainda existe';
    END IF;
    IF to_regclass('public.vehicle_rental_periods') IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA: tabela antiga vehicle_rental_periods ainda existe';
    END IF;
    RAISE NOTICE 'OK (1): tabelas renomeadas';
END $$;

-- Sequências
DO $$
BEGIN
    IF pg_get_serial_sequence('public.vehicles_monthly_expenses', 'id') IS NULL
       OR pg_get_serial_sequence('public.vehicles_monthly_expenses', 'id') NOT LIKE '%vehicles_monthly_expenses_id_seq%' THEN
        RAISE EXCEPTION 'FALHA: sequence de vehicles_monthly_expenses';
    END IF;
    IF pg_get_serial_sequence('public.vehicles_rentals_allocations', 'id') IS NULL
       OR pg_get_serial_sequence('public.vehicles_rentals_allocations', 'id') NOT LIKE '%vehicles_rentals_allocations_id_seq%' THEN
        RAISE EXCEPTION 'FALHA: sequence de vehicles_rentals_allocations';
    END IF;
    IF pg_get_serial_sequence('public.vehicles_rentals_periods', 'id') IS NULL
       OR pg_get_serial_sequence('public.vehicles_rentals_periods', 'id') NOT LIKE '%vehicles_rentals_periods_id_seq%' THEN
        RAISE EXCEPTION 'FALHA: sequence de vehicles_rentals_periods';
    END IF;
    RAISE NOTICE 'OK (2): sequences';
END $$;

-- RPCs devem existir e referenciar as tabelas novas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'fc_vehicle_rental_summary'
    ) THEN
        RAISE EXCEPTION 'FALHA: fc_vehicle_rental_summary ausente';
    END IF;
    RAISE NOTICE 'OK (3): RPCs presentes';
END $$;

-- Smoke: summary do mês corrente não deve dar erro de relação
SELECT count(*) AS summary_rows
FROM public.fc_vehicle_rental_summary(date_trunc('month', now())::date);

SELECT count(*) AS periods FROM public.vehicles_rentals_periods;
SELECT count(*) AS allocations FROM public.vehicles_rentals_allocations;
SELECT count(*) AS expenses FROM public.vehicles_monthly_expenses;

DO $$
BEGIN
    RAISE NOTICE 'Validação concluída com sucesso.';
END $$;
