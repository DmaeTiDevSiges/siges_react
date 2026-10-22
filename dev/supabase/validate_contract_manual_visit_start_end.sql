-- Validação pós-migration 20261033_add_manual_visit_start_end
-- Rodar no SQL Editor do Supabase depois de aplicar a migration.

-- ---------------------------------------------------------------------------
-- 1. Coluna no contrato
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'contracts'
           AND column_name = 'is_manual_visit_start_end'
           AND data_type = 'boolean'
           AND is_nullable = 'NO'
    ) THEN
        RAISE EXCEPTION 'FALHA: contracts.is_manual_visit_start_end ausente ou não é boolean NOT NULL';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'contracts'
           AND column_name = 'is_manual_visit_start_end'
           AND COALESCE(column_default, '') LIKE '%false%'
    ) THEN
        RAISE EXCEPTION 'FALHA: default de contracts.is_manual_visit_start_end deveria ser false';
    END IF;

    RAISE NOTICE 'OK (1): coluna is_manual_visit_start_end existe com default false';
END $$;

-- ---------------------------------------------------------------------------
-- 2. RPC de início aceita started_at e consulta a flag
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_def text;
BEGIN
    IF to_regprocedure('public.flow_order_visit_create_v2(jsonb)') IS NULL THEN
        RAISE EXCEPTION 'FALHA: função flow_order_visit_create_v2(jsonb) não encontrada';
    END IF;

    v_def := pg_get_functiondef('public.flow_order_visit_create_v2(jsonb)'::regprocedure);

    IF v_def NOT LIKE '%is_manual_visit_start_end%' THEN
        RAISE EXCEPTION 'FALHA: RPC não consulta is_manual_visit_start_end';
    END IF;

    IF v_def NOT LIKE '%started_at%' THEN
        RAISE EXCEPTION 'FALHA: RPC não lê o campo started_at do payload';
    END IF;

    IF v_def NOT LIKE '%não pode ser futura%' THEN
        RAISE EXCEPTION 'FALHA: RPC não valida data futura';
    END IF;

    RAISE NOTICE 'OK (2): RPC aceita started_at e valida a flag do contrato';
END $$;

-- ---------------------------------------------------------------------------
-- 3. Trigger de duração bloqueia fim anterior ao início
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_def text;
BEGIN
    IF to_regprocedure('public.fc_durations_hours_decimals()') IS NULL THEN
        RAISE EXCEPTION 'FALHA: função fc_durations_hours_decimals() não encontrada';
    END IF;

    v_def := pg_get_functiondef('public.fc_durations_hours_decimals()'::regprocedure);

    IF v_def NOT LIKE '%ov_ended_at < NEW.ov_started_at%' THEN
        RAISE EXCEPTION 'FALHA: fc_durations_hours_decimals não bloqueia fim anterior ao início';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_trigger
         WHERE tgname = 'tgr_durations_hours_decimals'
           AND NOT tgisinternal
    ) THEN
        RAISE EXCEPTION 'FALHA: trigger tgr_durations_hours_decimals não existe';
    END IF;

    RAISE NOTICE 'OK (3): trigger de duração com guard de fim < início';
END $$;

-- ---------------------------------------------------------------------------
-- 4. Sanidade dos dados existentes
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_bad int;
    v_bad_ids text;
    v_manual int;
BEGIN
    SELECT COUNT(*), string_agg(id::text, ', ' ORDER BY id)
      INTO v_bad, v_bad_ids
      FROM public.orders_visits
     WHERE ov_started_at IS NOT NULL
       AND ov_ended_at IS NOT NULL
       AND ov_ended_at < ov_started_at;

    IF v_bad > 0 THEN
        RAISE EXCEPTION 'FALHA: % visita(s) com ov_ended_at anterior a ov_started_at: %. Rode 20261034_fix_visits_end_before_start.sql.',
            v_bad, v_bad_ids;
    END IF;

    SELECT COUNT(*)
      INTO v_manual
      FROM public.contracts
     WHERE is_manual_visit_start_end = true;

    RAISE NOTICE 'OK (4): nenhuma visita com fim anterior ao início. Contratos com horário manual: %', v_manual;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Contratos com a flag ligada (conferência visual)
-- ---------------------------------------------------------------------------
SELECT id, code, description, is_manual_visit_start_end
  FROM public.contracts
 WHERE is_manual_visit_start_end = true
 ORDER BY description;

-- Resultado esperado: nenhuma exceção e "OK" em todas as etapas.
