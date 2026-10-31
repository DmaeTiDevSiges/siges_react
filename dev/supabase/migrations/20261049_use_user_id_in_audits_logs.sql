-- =====================================================
-- Migration: audits_logs — trocar user_uuid por user_id
--             (FK para public.users.id)
-- Date: 2026-10-31
-- Description: A autoria passa a ser referenciada APENAS por
--              audits_logs.user_id → public.users.id (FK), no lugar
--              de user_uuid. Motivos:
--                1. user_id (bigint) é a PK real de public.users —
--                   é o identificador canônico do projeto;
--                2. a FK permite join embutido no PostgREST
--                   (user:user_id(...)), que hoje falha com PGRST200
--                   por não existir relationship;
--                3. user_uuid é redundante: sempre derivável de
--                   users.uuid via users.id.
--
--              Ordem importa: a função fc_audit_log() é substituída
--              ANTES do DROP COLUMN — caso contrário todo INSERT,
--              UPDATE e DELETE nas ~75 tabelas auditadas passaria a
--              falhar (a trigger referenciaria coluna inexistente).
--
--              Pré-requisitos: 20261046 e 20261047.
-- =====================================================

-- 1. Backfill: resolve user_id a partir do user_uuid legado ---------------
-- Guardado por existência da coluna: garante re-execução idempotente
-- (na 2ª rodada user_uuid já não existe e o UPDATE falharia).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audits_logs'
          AND column_name = 'user_uuid'
    ) THEN
        UPDATE public.audits_logs a
        SET user_id = u.id
        FROM public.users u
        WHERE a.user_id IS NULL
          AND a.user_uuid IS NOT NULL
          AND a.user_uuid = u.uuid;
    END IF;
END $$;

-- 2. Foreign key: audits_logs.user_id → public.users.id -------------------
-- ON DELETE SET NULL: excluir um usuário nunca bloqueia e nunca apaga
-- linhas de auditoria — apenas zera a autoria (o registro é preservado).

DO $$
DECLARE
    v_orphan bigint;
BEGIN
    -- Diagnóstico antes da FK: um user_id órfão abortaria com o erro
    -- genérico do PG ("cannot add a table constraint due to invalid rows").
    SELECT a.user_id INTO v_orphan
      FROM public.audits_logs a
     WHERE a.user_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.user_id)
     LIMIT 1;

    IF v_orphan IS NOT NULL THEN
        RAISE EXCEPTION E'user_id órfão impede a criação da FK (user_id=%).\nRode antes:\n  SELECT user_id, count(*) FROM public.audits_logs a\n   WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.user_id)\n   GROUP BY user_id;', v_orphan;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_audits_logs_user_id'
          AND conrelid = 'public.audits_logs'::regclass
    ) THEN
        ALTER TABLE public.audits_logs
            ADD CONSTRAINT fk_audits_logs_user_id
            FOREIGN KEY (user_id)
            REFERENCES public.users (id)
            ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON CONSTRAINT fk_audits_logs_user_id ON public.audits_logs IS
'Flow: audit-log v1.1.0 — autoria do evento aponta para public.users.id.';

-- 3. Substitui a função SEM gravar user_uuid (antes do DROP) ---------------

CREATE OR REPLACE FUNCTION public.fc_audit_log() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
DECLARE
    v_user_id   bigint;
    v_old       jsonb;
    v_new       jsonb;
    v_record_id text;
    -- Colunas cujo valor nunca deve parar no log.
    v_sensitive constant text[] := ARRAY[
        'password', 'password_hash', 'token', 'access_token', 'refresh_token',
        'secret', 'api_key', 'impersonation_password_backup'
    ];
    k text;
BEGIN
    -- Autoria: usuário autenticado (app). Sem JWT (n8n, imports,
    -- jobs, SQL manual) fica NULL. v_user_id é a PK de public.users,
    -- resolvida via users.uuid = auth.uid().
    IF auth.uid() IS NOT NULL THEN
        BEGIN
            SELECT id INTO v_user_id
            FROM public.users
            WHERE uuid = auth.uid();
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

        -- Anti-ruído: updates que só "tocaam" as colunas de controle
        -- (updated_at / updated_user_id) sem mudar nada mais não
        -- geram linha de auditoria.
        v_old := v_old - 'updated_at' - 'updated_user_id';
        v_new := v_new - 'updated_at' - 'updated_user_id';

        IF v_old IS NOT DISTINCT FROM v_new THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Redação de colunas sensíveis (apenas quando presentes).
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
        user_id,
        table_name,
        operation,
        record_id,
        schema_name,
        data_old,
        data_new
    ) VALUES (
        -- Convenção do projeto: timestamp sem offset = horário de SP.
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
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
'Flow: audit-log v1.1.0 — Grava em audits_logs cada INSERT/UPDATE/DELETE real (ignora updates só de updated_at/updated_user_id) nas tabelas de negócio, com autoria via audits_logs.user_id → public.users.id (FK). SECURITY DEFINER para escrever mesmo com RLS restrito a leitura.';

-- 4. Remove a coluna user_uuid --------------------------------------------
-- (O índice idx_audits_logs_user_id, que na 20261046 apontava para
--  user_uuid por engano, cai junto com a coluna.)

ALTER TABLE public.audits_logs DROP COLUMN IF EXISTS user_uuid;

-- 4.1 Fecha a lacuna de anon: o dump legado concedia GRANT ALL a anon e a
--     20261046 só revogou o DML — o SELECT permanecia concedido (era
--     neutralizado pela RLS, mas o grant ficava exposto no catálogo).
REVOKE ALL ON TABLE public.audits_logs FROM anon;

-- 5. Índice de autoria, agora de fato em user_id ---------------------------

CREATE INDEX IF NOT EXISTS idx_audits_logs_user_id
    ON public.audits_logs (user_id, id DESC);

COMMENT ON INDEX public.idx_audits_logs_user_id IS
'Flow: audit-log v1.1.0 — filtro por autor (user_id → public.users.id).';
