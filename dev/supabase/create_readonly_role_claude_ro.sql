-- ==============================================================================
-- Usuário SOMENTE LEITURA para diagnóstico (Claude Code / dev/scripts/db-readonly.sh).
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
--
-- ANTES: troque TROQUE_ESTA_SENHA (2 lugares) por uma senha forte, de preferência só
-- letras e números (evita escapar caracteres na URL). Não grave a senha neste arquivo.
--
-- Depois, no .env.local do projeto (não vai para o git):
--   SUPABASE_DB_RO_URL=postgresql://claude_ro:SENHA@vps.supabase.siges-app.com.br:5432/postgres
--
-- Garantias:
--   * só SELECT nas tabelas/views de public (nenhum INSERT/UPDATE/DELETE/DDL);
--   * default_transaction_read_only = on no próprio usuário;
--   * BYPASSRLS: enxerga as linhas como o banco (sem isso a RLS esconderia quase tudo);
--   * statement_timeout de 15 s.
--
-- Remover depois:
--   REASSIGN OWNED BY claude_ro TO postgres; DROP OWNED BY claude_ro; DROP ROLE claude_ro;
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'claude_ro') THEN
        CREATE ROLE claude_ro LOGIN PASSWORD 'TROQUE_ESTA_SENHA' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT BYPASSRLS;
    ELSE
        ALTER ROLE claude_ro LOGIN PASSWORD 'TROQUE_ESTA_SENHA' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT BYPASSRLS;
    END IF;
END $$;

ALTER ROLE claude_ro SET default_transaction_read_only = on;
ALTER ROLE claude_ro SET statement_timeout = '15s';

GRANT CONNECT ON DATABASE postgres TO claude_ro;
GRANT USAGE ON SCHEMA public TO claude_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_ro;

-- Tabelas/views criadas depois (pelo postgres) também ficam legíveis.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO claude_ro;

-- Conferência: deve voltar claude_ro | t (bypassrls) | f (superuser)
SELECT rolname, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'claude_ro';
