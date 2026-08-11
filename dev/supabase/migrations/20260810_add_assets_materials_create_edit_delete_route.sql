-- =====================================================
-- Migration: Add assets_materials_create_edit_delete route
-- Date: 2026-08-10
-- Description: Permissão para incluir, alterar e excluir
--              componentes associados a ativos
-- =====================================================

-- Inserir a rota na tabela cfg_routes
INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
VALUES (
    'assets_materials_create_edit_delete',
    '/assets/materials',
    'Incluir/Alterar/Excluir Componentes do Ativo',
    'settings_input_component',
    (SELECT id FROM cfg_routes WHERE route_key = 'assets'),
    99,
    true
)
ON CONFLICT (route_key) DO NOTHING;
