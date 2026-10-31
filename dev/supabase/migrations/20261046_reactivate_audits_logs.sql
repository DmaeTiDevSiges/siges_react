-- =====================================================
-- Migration: Reativar tabela audits_logs (auditoria de banco)
-- Date: 2026-10-31
-- Description: A tabela public.audits_logs existe desde o sistema
--              legado (Databasus), vazia e órfã — nenhum trigger ou
--              código escrevia nela. Este script a prepara como
--              destino da auditoria de INSERT/UPDATE/DELETE das
--              tabelas de negócio:
--                1. novas colunas (record_id, schema_name, origin)
--                2. NOT NULL nas colunas de identificação (seguro:
--                   a tabela está vazia no banco vivo)
--                3. default de created_date em horário de São Paulo
--                   (regra de fuso do projeto: timestamp sem offset
--                   = horário local de SP — consistente com o que o
--                   fc_orders_statuses_logs já grava)
--                4. índices para as consultas da tela de auditoria
--                5. RLS endurecido: leitura para authenticated,
--                   escrita APENAS via função SECURITY DEFINER dos
--                   triggers (nega escrita direta do client anon)
-- =====================================================

-- 1. Novas colunas -----------------------------------------------------------

ALTER TABLE public.audits_logs
    ADD COLUMN IF NOT EXISTS record_id text,
    ADD COLUMN IF NOT EXISTS schema_name text DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS origin text;

COMMENT ON COLUMN public.audits_logs.record_id IS
    'PK (coluna id) do registro auditado, como texto — cada tabela alvo usa id bigint.';
COMMENT ON COLUMN public.audits_logs.origin IS
    'Reservado para origem da escrita (app/rpc/manual). Hoje sempre NULL.';

-- 2. Colunas de identificação obrigatórias -----------------------------------

-- Seguro porque a tabela está vazia; se alguma linha legada existir no banco
-- vivo e tiver NULL, este ALTER falhará de forma explícita (melhor que
-- mascarar o problema).
ALTER TABLE public.audits_logs ALTER COLUMN table_name SET NOT NULL;
ALTER TABLE public.audits_logs ALTER COLUMN operation SET NOT NULL;

-- 3. Fuso horário: default em America/Sao_Paulo ------------------------------

-- O default legado gravava UTC naive; a convenção do projeto é naive = SP.
ALTER TABLE public.audits_logs
    ALTER COLUMN created_date SET DEFAULT (TIMEZONE('America/Sao_Paulo', now()));

-- 4. Índices -----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_audits_logs_table_id
    ON public.audits_logs (table_name, id DESC);

CREATE INDEX IF NOT EXISTS idx_audits_logs_user_id
    ON public.audits_logs (user_uuid, id DESC);

CREATE INDEX IF NOT EXISTS idx_audits_logs_created_date
    ON public.audits_logs (created_date DESC);

CREATE INDEX IF NOT EXISTS idx_audits_logs_record
    ON public.audits_logs (table_name, record_id);

-- 5. RLS endurecido ----------------------------------------------------------
-- A policy "Universal Access" (USING/WITH CHECK true) permitia que qualquer
-- client (inclusive anon) escrevesse no log. Trocamos por leitura apenas:
-- a escrita acontece exclusivamente pela função de trigger SECURITY DEFINER.

DROP POLICY IF EXISTS "Universal Access" ON public.audits_logs;
DROP POLICY IF EXISTS "authenticated_read" ON public.audits_logs;

CREATE POLICY "authenticated_read" ON public.audits_logs
    FOR SELECT TO authenticated
    USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audits_logs
    FROM anon, authenticated;

GRANT SELECT ON TABLE public.audits_logs TO authenticated;
