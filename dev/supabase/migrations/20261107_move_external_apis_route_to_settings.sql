-- ==============================================================================
-- Migration: 20261107_move_external_apis_route_to_settings.sql
-- Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md (Fase 4 — administração)
-- Aplicar manualmente no SQL Editor do Supabase APÓS
-- 20261105_add_assets_available_integrations_route_and_permissions.sql.
--
-- A tela de integrações saiu de Dashboards e foi para Ajustes → card
-- "APIs Externas" → "GuaibaFlow". Esta migration:
--   1. Renomeia a rota dashboard_assets_available_integrations →
--      settings_external_apis e a move para o grupo Settings. É um UPDATE na
--      mesma linha de cfg_routes: as permissões já concedidas em
--      cfg_profiles_access (ligadas por route_id) são preservadas.
--   2. Recria as políticas RLS das 3 tabelas usando a nova route_key.
--
-- Idempotente: pode ser reaplicada.
-- ==============================================================================

BEGIN;

SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- ── 1) Rota ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
    v_settings_id BIGINT := (SELECT id FROM public.cfg_routes WHERE route_key = 'settings');
BEGIN
    IF EXISTS (SELECT 1 FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations') THEN
        IF EXISTS (SELECT 1 FROM public.cfg_routes WHERE route_key = 'settings_external_apis') THEN
            RAISE EXCEPTION
                'As rotas dashboard_assets_available_integrations e settings_external_apis existem ao mesmo tempo; unifique as permissões manualmente';
        END IF;

        UPDATE public.cfg_routes
        SET route_key   = 'settings_external_apis',
            route_path  = '/settings/external-apis',
            description = 'APIs Externas (Ajustes) — integrações de disponibilidade de ativos',
            icon        = 'api',
            parent_id   = COALESCE(v_settings_id, parent_id),
            order_index = 110
        WHERE route_key = 'dashboard_assets_available_integrations';
    ELSIF NOT EXISTS (SELECT 1 FROM public.cfg_routes WHERE route_key = 'settings_external_apis') THEN
        INSERT INTO public.cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
        VALUES (
            'settings_external_apis',
            '/settings/external-apis',
            'APIs Externas (Ajustes) — integrações de disponibilidade de ativos',
            'api',
            v_settings_id,
            110,
            true
        );
    END IF;
END
$$;

-- ── 2) RLS por permissão de rota (mesmas políticas da 20261105, nova chave) ──
DROP POLICY IF EXISTS "Asset availability integrations: view"   ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: insert" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: update" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: delete" ON public.cfg_assets_available_integrations;

CREATE POLICY "Asset availability integrations: view"
    ON public.cfg_assets_available_integrations FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'view'));
CREATE POLICY "Asset availability integrations: insert"
    ON public.cfg_assets_available_integrations FOR INSERT TO authenticated
    WITH CHECK (public.fc_has_route_permission('settings_external_apis', 'create'));
CREATE POLICY "Asset availability integrations: update"
    ON public.cfg_assets_available_integrations FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'edit'))
    WITH CHECK (public.fc_has_route_permission('settings_external_apis', 'edit'));
CREATE POLICY "Asset availability integrations: delete"
    ON public.cfg_assets_available_integrations FOR DELETE TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'delete'));

DROP POLICY IF EXISTS "Asset availability mappings: view"   ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: insert" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: update" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: delete" ON public.cfg_assets_available_integrations_mappings;

CREATE POLICY "Asset availability mappings: view"
    ON public.cfg_assets_available_integrations_mappings FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'view'));
CREATE POLICY "Asset availability mappings: insert"
    ON public.cfg_assets_available_integrations_mappings FOR INSERT TO authenticated
    WITH CHECK (public.fc_has_route_permission('settings_external_apis', 'edit'));
CREATE POLICY "Asset availability mappings: update"
    ON public.cfg_assets_available_integrations_mappings FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'edit'))
    WITH CHECK (public.fc_has_route_permission('settings_external_apis', 'edit'));
CREATE POLICY "Asset availability mappings: delete"
    ON public.cfg_assets_available_integrations_mappings FOR DELETE TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'delete'));

DROP POLICY IF EXISTS "Asset availability events: view" ON public.logs_assets_available_integrations_events;

CREATE POLICY "Asset availability events: view"
    ON public.logs_assets_available_integrations_events FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('settings_external_apis', 'view'));

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Conferência:
--   SELECT r.id, r.route_key, p.route_key AS parent, r.route_path
--     FROM public.cfg_routes r LEFT JOIN public.cfg_routes p ON p.id = r.parent_id
--    WHERE r.route_key IN ('settings_external_apis', 'dashboard_assets_available_integrations');
--   SELECT tablename, policyname, qual, with_check
--     FROM pg_policies WHERE tablename LIKE '%assets_available_integrations%';
--
-- Reverter: UPDATE cfg_routes SET route_key = 'dashboard_assets_available_integrations' ...
-- e reaplicar a seção 2 da 20261105.
