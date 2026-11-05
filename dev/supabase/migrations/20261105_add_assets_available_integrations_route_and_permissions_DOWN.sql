-- ============================================================================
-- DOWN: 20261105_add_assets_available_integrations_route_and_permissions
-- Desfaz rota e permissões administrativas de integrações de disponibilidade.
--
-- ATENÇÃO: este script remove a permissão e as rotas filhas. Nenhum dado
-- administrativo (integrações/mapeamentos/logs) é removido aqui; para
-- apagar a estrutura de Fase 1, use o DOWN correspondente.
-- ============================================================================

BEGIN;

DELETE FROM public.cfg_routes
WHERE route_key IN (
    'dashboard_assets_available_integrations_view',
    'dashboard_assets_available_integrations_create',
    'dashboard_assets_available_integrations_edit',
    'dashboard_assets_available_integrations_delete',
    'dashboard_assets_available_integrations_mappings',
    'dashboard_assets_available_integrations_logs',
    'dashboard_assets_available_integrations'
);

NOTIFY pgrst, 'reload schema';

COMMIT;
