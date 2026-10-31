-- ============================================================
-- DOWN da Migration: 20261046_reactivate_audits_logs.sql
-- Reverte o preparo da tabela audits_logs para auditoria.
--
-- ATENÇÃO: remove as colunas novas (record_id, schema_name, origin)
-- e os índices. As LINHAS de auditoria já gravadas ficam na tabela
-- legada, mas perdem record_id/schema_name. Rode APÓS o DOWN
-- 20261047 (sem triggers, nada mais escreve na tabela).
-- ============================================================

-- 1) Restaura a policy "Universal Access" original
DROP POLICY IF EXISTS "authenticated_read" ON public.audits_logs;

CREATE POLICY "Universal Access" ON public.audits_logs
    USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audits_logs TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audits_logs TO authenticated;

-- 2) Restaura o default legado (UTC naive)
ALTER TABLE public.audits_logs
    ALTER COLUMN created_date SET DEFAULT (now() AT TIME ZONE 'utc');

-- 3) Remove índices criados
DROP INDEX IF EXISTS public.idx_audits_logs_record;
DROP INDEX IF EXISTS public.idx_audits_logs_created_date;
DROP INDEX IF EXISTS public.idx_audits_logs_user_id;
DROP INDEX IF EXISTS public.idx_audits_logs_table_id;

-- 4) Remove NOT NULL
ALTER TABLE public.audits_logs ALTER COLUMN table_name DROP NOT NULL;
ALTER TABLE public.audits_logs ALTER COLUMN operation DROP NOT NULL;

-- 5) Remove colunas novas
ALTER TABLE public.audits_logs
    DROP COLUMN IF EXISTS record_id,
    DROP COLUMN IF EXISTS schema_name,
    DROP COLUMN IF EXISTS origin;

-- ============================================================
-- FIM DO DOWN 20261046_reactivate_audits_logs.sql
-- ============================================================
