-- Validação pós-migração 20261020_merge_vehicle_rate_contracts_into_rentals.sql
-- Execute no SQL Editor do Supabase depois de aplicar a migration.

DO $$
DECLARE
    v_rate_relation_kind "char";
    v_allocate_definition text;
    v_before_save_definition text;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cfg_vehicles_rentals_contracts'
          AND column_name = 'value_unit'
          AND is_nullable = 'NO'
    ) THEN
        RAISE EXCEPTION 'FALHA: value_unit não existe ou aceita NULL em cfg_vehicles_rentals_contracts';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vehicles'
          AND column_name = 'value_unit'
    ) THEN
        RAISE EXCEPTION 'FALHA: vehicles.value_unit ainda existe';
    END IF;

    SELECT c.relkind
      INTO v_rate_relation_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'cfg_vehicle_rate_contracts';

    IF v_rate_relation_kind IS DISTINCT FROM 'v' THEN
        RAISE EXCEPTION 'FALHA: cfg_vehicle_rate_contracts não foi substituída pela view compatível';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.cfg_vehicles_rentals_contracts
        WHERE value_unit IS NULL OR value_unit < 0
    ) THEN
        RAISE EXCEPTION 'FALHA: contrato com value_unit nulo ou negativo';
    END IF;

    PERFORM 1
    FROM public.fc_vehicle_rate_contract(0, CURRENT_DATE);

    PERFORM 1
    FROM public.fc_vehicle_rental_summary(CURRENT_DATE)
    LIMIT 1;

    SELECT pg_get_functiondef(
        'public.fc_vehicle_rental_allocate(bigint,date,bigint)'::regprocedure
    )
    INTO v_allocate_definition;

    IF position('v_appropriate_rate' IN lower(v_allocate_definition)) = 0
       OR position('value_unit = v_appropriate_rate' IN lower(v_allocate_definition)) = 0 THEN
        RAISE EXCEPTION 'FALHA: fc_vehicle_rental_allocate não grava a tarifa apropriada em orders_visits_vehicles.value_unit';
    END IF;

    IF position('insert into public.orders_visits_vehicles' IN lower(v_allocate_definition)) > 0 THEN
        RAISE EXCEPTION 'FALHA: fc_vehicle_rental_allocate ainda insere linhas extras em orders_visits_vehicles';
    END IF;

    SELECT pg_get_functiondef(
        'public.fc_orders_visits_vehicles_before_save()'::regprocedure
    )
    INTO v_before_save_definition;

    IF position('new.value_total := round(new.amount * new.value_unit, 2)' IN lower(v_before_save_definition)) = 0
       OR NOT EXISTS (
           SELECT 1
           FROM pg_trigger trigger_info
           JOIN pg_class relation ON relation.oid = trigger_info.tgrelid
           JOIN pg_namespace schema_info ON schema_info.oid = relation.relnamespace
           WHERE schema_info.nspname = 'public'
             AND relation.relname = 'orders_visits_vehicles'
             AND trigger_info.tgname = 'trg_orders_visits_vehicles_before_save'
             AND NOT trigger_info.tgisinternal
             AND trigger_info.tgenabled <> 'D'
       ) THEN
        RAISE EXCEPTION 'FALHA: trigger before_save ausente ou não recalcula value_total = amount * value_unit';
    END IF;

    RAISE NOTICE 'OK: value_unit unificado, tarifa apropriada gravada sem linhas extras e value_total sincronizado pelo trigger';
END;
$$;

SELECT
    count(*) AS total_vehicle_contracts,
    count(*) FILTER (WHERE value_unit > 0) AS contracts_with_positive_rate,
    count(*) FILTER (WHERE value_unit = 0) AS contracts_with_zero_rate
FROM public.cfg_vehicles_rentals_contracts
WHERE NOT is_deleted;
