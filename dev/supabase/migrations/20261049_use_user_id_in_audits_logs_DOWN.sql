-- =====================================================
-- Migration DOWN: 20261049_use_user_id_in_audits_logs
-- Description: Reverte a troca de user_uuid por user_id.
--              Restaura a coluna user_uuid, o índice antigo,
--              a função fc_audit_log() que gravava o uuid e
--              remove a FK para public.users.id.
--
--              Ordem importa (espelho da UP): restaura a coluna
--              ANTES de devolver a função que a referencia.
-- =====================================================

-- 1. Remove a FK -----------------------------------------------------------

ALTER TABLE public.audits_logs
    DROP CONSTRAINT IF EXISTS fk_audits_logs_user_id;

-- 2. Recria a coluna user_uuid --------------------------------------------
-- (Nullable: linhas novas ficam com NULL até a função ser restaurada.)

ALTER TABLE public.audits_logs
    ADD COLUMN IF NOT EXISTS user_uuid uuid;

COMMENT ON COLUMN public.audits_logs.user_uuid IS
'Revertido pelo DOWN de 20261049 — UUID do autor (auth.uid()), redundante com user_id.';

-- 3. Índice de autoria volta a apontar para user_uuid ----------------------
-- (Mesma definição da 20261046.)

DROP INDEX IF EXISTS public.idx_audits_logs_user_id;

CREATE INDEX IF NOT EXISTS idx_audits_logs_user_id
    ON public.audits_logs (user_uuid, id DESC);

-- 4. Backfill: repõe user_uuid a partir de user_id -------------------------

UPDATE public.audits_logs a
SET user_uuid = u.uuid
FROM public.users u
WHERE a.user_uuid IS NULL
  AND a.user_id IS NOT NULL
  AND a.user_id = u.id;

-- 5. Restaura a função que grava user_uuid ---------------------------------

CREATE OR REPLACE FUNCTION public.fc_audit_log() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
DECLARE
    v_user_uuid uuid;
    v_user_id   bigint;
    v_old       jsonb;
    v_new       jsonb;
    v_record_id text;
    v_sensitive constant text[] := ARRAY[
        'password', 'password_hash', 'token', 'access_token', 'refresh_token',
        'secret', 'api_key', 'impersonation_password_backup'
    ];
    k text;
BEGIN
    v_user_uuid := auth.uid();
    IF v_user_uuid IS NOT NULL THEN
        BEGIN
            SELECT id INTO v_user_id
            FROM public.users
            WHERE uuid = v_user_uuid;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_record_id := v_old ->> 'id';
    ELSIF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_record_id := v_new ->> 'id';
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_record_id := v_new ->> 'id';

        v_old := v_old - 'updated_at' - 'updated_user_id';
        v_new := v_new - 'updated_at' - 'updated_user_id';

        IF v_old IS NOT DISTINCT FROM v_new THEN
            RETURN NULL;
        END IF;
    END IF;

    FOREACH k IN ARRAY v_sensitive LOOP
        IF v_old IS NOT NULL AND v_old ? k THEN
            v_old := (v_old - k) || jsonb_build_object(k, '[REDACTED]');
        END IF;
        IF v_new IS NOT NULL AND v_new ? k THEN
            v_new := (v_new - k) || jsonb_build_object(k, '[REDACTED]');
        END IF;
    END LOOP;

    INSERT INTO public.audits_logs (
        created_date,
        user_uuid,
        user_id,
        table_name,
        operation,
        record_id,
        schema_name,
        data_old,
        data_new
    ) VALUES (
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        v_user_uuid,
        v_user_id,
        TG_TABLE_NAME,
        TG_OP,
        v_record_id,
        TG_TABLE_SCHEMA,
        v_old,
        v_new
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.fc_audit_log() IS
'Flow: audit-log v1.0.0 (restaurado pelo DOWN de 20261049) — Grava em audits_logs com autoria via auth.uid() → user_uuid e users.id → user_id. SECURITY DEFINER para escrever mesmo com RLS restrito a leitura.';
