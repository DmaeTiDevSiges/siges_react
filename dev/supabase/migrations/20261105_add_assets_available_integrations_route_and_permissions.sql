-- ==============================================================================
-- Migration: 20261105_add_assets_available_integrations_route_and_permissions.sql
-- Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md (Fase 4 — administração)
-- Aplicar manualmente no SQL Editor do Supabase APÓS
-- 20261104_create_assets_available_integrations.sql.
--
-- Entrega:
--   1. Rota dashboard_assets_available_integrations (aba "Disponibilidade de
--      Ativos" em Dashboards). Segue o padrão do repo: UMA rota, e as ações são
--      controladas por can_view / can_create / can_edit / can_delete em
--      cfg_profiles_access (tela Permissões).
--        view   → lista integrações, mapeamentos e logs
--        create → cadastra integração
--        edit   → edita integração (inclui ativar/desativar) e mapeamentos
--        delete → exclui integração/mapeamento sem histórico
--   2. Troca as políticas RLS "somente super admin" da Fase 1 por
--      fc_has_route_permission(...) (super admin continua com acesso total).
--      Os logs continuam somente leitura pela aplicação: quem grava é a RPC
--      fn_add_assets_available (SECURITY DEFINER / service_role).
--
-- Idempotente: pode ser reaplicada.
-- ==============================================================================

BEGIN;

-- ── 0) Sequência ────────────────────────────────────────────────────────────
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- ── 1) Rota ─────────────────────────────────────────────────────────────────
-- Mesmo pai das demais abas de Dashboards (ex.: dashboard_units_assets_tags).
INSERT INTO public.cfg_routes (
    route_key,
    route_path,
    description,
    icon,
    parent_id,
    order_index,
    is_available
)
VALUES (
    'dashboard_assets_available_integrations',
    '/dashboard/assets-available-integrations',
    'Integrações de disponibilidade de ativos (Dashboards - aba Disponibilidade de Ativos)',
    'integration_instructions',
    COALESCE(
        (SELECT parent_id FROM public.cfg_routes WHERE route_key = 'dashboard_units_assets_tags'),
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard')
    ),
    40,
    true
)
ON CONFLICT (route_key) DO NOTHING;

-- ── 2) RLS por permissão de rota ────────────────────────────────────────────
DROP POLICY IF EXISTS "Super admins manage asset availability integrations"
    ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: view"   ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: insert" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: update" ON public.cfg_assets_available_integrations;
DROP POLICY IF EXISTS "Asset availability integrations: delete" ON public.cfg_assets_available_integrations;

CREATE POLICY "Asset availability integrations: view"
    ON public.cfg_assets_available_integrations FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'view'));
CREATE POLICY "Asset availability integrations: insert"
    ON public.cfg_assets_available_integrations FOR INSERT TO authenticated
    WITH CHECK (public.fc_has_route_permission('dashboard_assets_available_integrations', 'create'));
CREATE POLICY "Asset availability integrations: update"
    ON public.cfg_assets_available_integrations FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'edit'))
    WITH CHECK (public.fc_has_route_permission('dashboard_assets_available_integrations', 'edit'));
CREATE POLICY "Asset availability integrations: delete"
    ON public.cfg_assets_available_integrations FOR DELETE TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'delete'));

DROP POLICY IF EXISTS "Super admins manage asset availability integration mappings"
    ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: view"   ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: insert" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: update" ON public.cfg_assets_available_integrations_mappings;
DROP POLICY IF EXISTS "Asset availability mappings: delete" ON public.cfg_assets_available_integrations_mappings;

CREATE POLICY "Asset availability mappings: view"
    ON public.cfg_assets_available_integrations_mappings FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'view'));
-- Mapear IDs externos é manutenção da integração → exige can_edit.
CREATE POLICY "Asset availability mappings: insert"
    ON public.cfg_assets_available_integrations_mappings FOR INSERT TO authenticated
    WITH CHECK (public.fc_has_route_permission('dashboard_assets_available_integrations', 'edit'));
CREATE POLICY "Asset availability mappings: update"
    ON public.cfg_assets_available_integrations_mappings FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'edit'))
    WITH CHECK (public.fc_has_route_permission('dashboard_assets_available_integrations', 'edit'));
CREATE POLICY "Asset availability mappings: delete"
    ON public.cfg_assets_available_integrations_mappings FOR DELETE TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'delete'));

DROP POLICY IF EXISTS "Super admins read asset availability integration events"
    ON public.logs_assets_available_integrations_events;
DROP POLICY IF EXISTS "Asset availability events: view"
    ON public.logs_assets_available_integrations_events;

CREATE POLICY "Asset availability events: view"
    ON public.logs_assets_available_integrations_events FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('dashboard_assets_available_integrations', 'view'));

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Conferência após aplicar:
--   SELECT id, route_key, parent_id, is_available
--     FROM public.cfg_routes
--    WHERE route_key = 'dashboard_assets_available_integrations';
--   SELECT tablename, policyname, cmd
--     FROM pg_policies
--    WHERE tablename LIKE '%assets_available_integrations%'
--    ORDER BY tablename, cmd;
-- Depois conceda can_view/can_create/can_edit/can_delete aos perfis em Permissões.
