-- ==============================================================================
-- Migration: 20261112_revoke_anon_access.sql
-- Fecha o acesso SEM LOGIN (papel anon = chave pública do app) ao schema public.
--
-- Problema (verificado em 06–07/11/2026 com a chave pública, sem sessão):
-- warehouses, v_materials, v_orders_visits, v_users, users e outras tabelas eram
-- legíveis — muitas têm a política "Universal Access" (USING true, para todos
-- os papéis) e GRANT ALL TO anon. Qualquer pessoa com o APK/site (a chave
-- pública fica no código) lia e alterava dados.
--
-- O que muda (só privilégios do papel anon; políticas RLS NÃO são alteradas):
--   1. REVOKE de anon em TODAS as tabelas, views e sequências de public.
--   2. Liberado para anon apenas o que o app usa ANTES do login:
--        • v_companies + colunas públicas de cfg_companies (tela de login/
--          esqueci a senha: escolha da empresa);
--        • cfg_app (verificação de versão do app).
--   3. Funções SECURITY DEFINER de public (rodam com privilégio do dono e
--      ignoram RLS) deixam de ser executáveis por anon/PUBLIC; continuam para
--      authenticated e service_role. Exceção: fn_tracker_report_location
--      (APK envia a posição com a chave pública + token próprio).
--   4. Objetos criados no futuro pelo papel que aplica esta migration não
--      darão mais acesso a anon (ALTER DEFAULT PRIVILEGES).
--
-- Não muda nada para usuários LOGADOS (authenticated) nem para service_role,
-- n8n com service key, backups (databasus-*) ou o Realtime (usa o JWT do usuário).
--
-- Atenção: APKs ANTIGOS que gravavam a posição direto em users com a chave
-- pública (antes de fn_tracker_report_location) deixam de enviar posição até
-- serem atualizados.
--
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261112_revoke_anon_access_DOWN.sql
-- ==============================================================================

BEGIN;

-- ── 1) Tabelas, views e sequências ──────────────────────────────────────────
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- ── 2) O mínimo para as telas antes do login ────────────────────────────────
-- v_companies é security_invoker: anon precisa de SELECT nas colunas de
-- cfg_companies que a view expõe (só elas — sem auditoria/created_*).
GRANT SELECT ON public.v_companies TO anon;
GRANT SELECT (id, code, description, img_file_path, img_file_name, is_available, email_sufix)
    ON public.cfg_companies TO anon;

-- cfg_app: versão, URL do APK e logo (nada sensível); o app faz select('*').
GRANT SELECT ON public.cfg_app TO anon;

-- ── 3) Funções SECURITY DEFINER ─────────────────────────────────────────────
-- Preserva exatamente quem já executava cada função: todo papel (exceto anon)
-- que JÁ tinha acesso — direto ou via PUBLIC (authenticated, service_role,
-- supabase_auth_admin de hooks, etc.) — recebe o GRANT explícito antes do
-- REVOKE de PUBLIC. Funções restritas a service_role continuam restritas.
DO $$
DECLARE
    r RECORD;
    rl RECORD;
    v_count INT := 0;
    v_whitelist TEXT[] := ARRAY['fn_tracker_report_location'];
BEGIN
    FOR r IN
        SELECT p.oid, p.oid::regprocedure AS sig
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.prosecdef
           AND p.prokind = 'f'
           AND NOT (p.proname = ANY (v_whitelist))
           AND has_function_privilege('anon', p.oid, 'EXECUTE')
           -- funções de extensão ficam como estão
           AND NOT EXISTS (SELECT 1 FROM pg_depend d
                            WHERE d.objid = p.oid AND d.deptype = 'e')
    LOOP
        FOR rl IN
            SELECT a.rolname
              FROM pg_roles a
             WHERE a.rolname <> 'anon'
               AND a.rolname NOT LIKE 'pg\_%'
               AND has_function_privilege(a.oid, r.oid, 'EXECUTE')
        LOOP
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I', r.sig, rl.rolname);
        END LOOP;
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
        v_count := v_count + 1;
    END LOOP;
    RAISE NOTICE 'Funções SECURITY DEFINER fechadas para anon: %', v_count;
END $$;

-- ── 4) Objetos futuros criados por este papel ───────────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

COMMIT;

-- ── Conferência (rodar depois) ──────────────────────────────────────────────
-- Tabelas/views que anon ainda pode ler (esperado: só v_companies, cfg_app e
-- cfg_companies por coluna):
--   SELECT table_name, privilege_type FROM information_schema.role_table_grants
--    WHERE grantee = 'anon' AND table_schema = 'public' ORDER BY 1;
--   SELECT table_name, column_name FROM information_schema.column_privileges
--    WHERE grantee = 'anon' AND table_schema = 'public' ORDER BY 1, 2;
-- Funções SECURITY DEFINER ainda executáveis por anon (esperado: só
-- fn_tracker_report_location e funções de extensão):
--   SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- Teste externo (deve dar 401/permission denied):
--   curl "$URL/rest/v1/users?select=id&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
