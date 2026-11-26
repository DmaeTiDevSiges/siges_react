-- ==============================================================================
-- Reverte 20261205_rls_initplan_auth_calls.sql (volta às expressões anteriores).
-- Aplicar manualmente no SQL Editor.
-- ==============================================================================

BEGIN;

ALTER POLICY "Client events: insert" ON public.logs_app_client_events
    WITH CHECK (user_uuid IS NULL OR user_uuid = auth.uid());

ALTER POLICY "Client events: super admin read" ON public.logs_app_client_events
    USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
    ));

ALTER POLICY users_account_deletion_requests_select ON public.users_account_deletion_requests
    USING (
        user_id = (SELECT u.id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1)
        OR public.fc_has_route_permission('users', 'edit')
    );

ALTER POLICY users_insert ON public.users
    WITH CHECK (
        uuid = auth.uid()
        OR EXISTS (SELECT 1 FROM public.fn_users_caller() c WHERE c.is_admin OR c.is_admin_super)
    );

COMMIT;
