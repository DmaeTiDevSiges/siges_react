-- ==============================================================================
-- Migration: 20261205_rls_initplan_auth_calls.sql
-- Linter do Supabase 0003_auth_rls_initplan (desempenho).
--
-- Problema: auth.uid() escrito direto na política é recalculado a cada linha.
-- Correção: (SELECT auth.uid()) é calculado uma vez por consulta (InitPlan).
-- As regras de acesso NÃO mudam. ALTER POLICY mantém comando e papéis.
--
-- Políticas:
--   logs_app_client_events          "Client events: insert"
--   logs_app_client_events          "Client events: super admin read"
--   users_account_deletion_requests users_account_deletion_requests_select
--   users                           users_insert
--
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261205_rls_initplan_auth_calls_DOWN.sql
-- ==============================================================================

BEGIN;

ALTER POLICY "Client events: insert" ON public.logs_app_client_events
    WITH CHECK (user_uuid IS NULL OR user_uuid = (SELECT auth.uid()));

ALTER POLICY "Client events: super admin read" ON public.logs_app_client_events
    USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.uuid = (SELECT auth.uid()) AND u.is_admin_super IS TRUE
    ));

-- fc_has_route_permission tem argumentos fixos: também basta calcular uma vez.
ALTER POLICY users_account_deletion_requests_select ON public.users_account_deletion_requests
    USING (
        user_id = (SELECT u.id FROM public.users u WHERE u.uuid = (SELECT auth.uid()) LIMIT 1)
        OR (SELECT public.fc_has_route_permission('users', 'edit'))
    );

ALTER POLICY users_insert ON public.users
    WITH CHECK (
        uuid = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.fn_users_caller() c WHERE c.is_admin OR c.is_admin_super)
    );

COMMIT;

-- Conferência (as 4 devem mostrar "SELECT auth.uid()"):
--   SELECT tablename, policyname, cmd, roles, qual, with_check
--     FROM pg_policies
--    WHERE schemaname = 'public'
--      AND policyname IN ('Client events: insert', 'Client events: super admin read',
--                         'users_account_deletion_requests_select', 'users_insert')
--    ORDER BY 1, 2;
