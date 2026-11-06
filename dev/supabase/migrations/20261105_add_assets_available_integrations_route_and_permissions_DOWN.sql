-- ============================================================================
-- DOWN: 20261105_add_assets_available_integrations_route_and_permissions
-- Remove a rota/permissões da Fase 4 e volta às políticas "somente super admin"
-- da Fase 1. Nenhum dado de integrações/mapeamentos/logs é removido; para
-- apagar a estrutura da Fase 1, use 20261104_..._DOWN.sql.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Asset availability integrations: view"   ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: insert" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: update" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: delete" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability mappings: view"   ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: insert" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: update" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: delete" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability events: view" ON public.logs_assets_available_integrations_events;

DROP POLICY IF EXISTS "Super admins manage asset availability integrations"
    ON public.cfg_assets_available_integrations;
CREATE POLICY "Super admins manage asset availability integrations"
    ON public.cfg_assets_available_integrations FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE));

DROP POLICY IF EXISTS "Super admins manage asset availability integration mappings"
    ON public.cfg_assets_available_integrations_mappings;
CREATE POLICY "Super admins manage asset availability integration mappings"
    ON public.cfg_assets_available_integrations_mappings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE));

DROP POLICY IF EXISTS "Super admins read asset availability integration events"
    ON public.logs_assets_available_integrations_events;
CREATE POLICY "Super admins read asset availability integration events"
    ON public.logs_assets_available_integrations_events FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE));

DELETE FROM public.cfg_profiles_access
 WHERE route_id IN (
     SELECT id FROM public.cfg_routes
      WHERE route_key LIKE 'dashboard_assets_available_integrations%'
 );

DELETE FROM public.cfg_routes
 WHERE route_key LIKE 'dashboard_assets_available_integrations%';

NOTIFY pgrst, 'reload schema';

COMMIT;
