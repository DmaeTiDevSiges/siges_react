-- =====================================================
-- Migration: Add materials_upload route
-- Date: 2026-09-27
-- Description: Permissão para enviar arquivo na importação
--              de materiais (CSV/XLSX). O botão de upload do
--              modal usa canView('materials_upload').
-- =====================================================

-- 0. Garante que a identidade de id está à frente do maior id existente
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- 1. Rota materials_upload (grupo de Materiais quando existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'materials_upload') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'materials_upload',
        '/materials/upload',
        'Enviar arquivo na importação de materiais',
        'upload_file',
        COALESCE(
            (SELECT id FROM cfg_routes WHERE route_key = 'materials'),
            (SELECT id FROM cfg_routes WHERE route_key = 'materials_search')
        ),
        98,
        true
    );
    RAISE NOTICE 'Rota materials_upload criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota materials_upload já existe, ignorando';
  END IF;
END $$;

-- 2. Concede view para os perfis que já possuem view em
--    materials_create_edit_delete (mantém o fluxo de importação
--    funcionando para quem já podia gerenciar materiais)
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, up.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
CROSS JOIN (SELECT id FROM cfg_routes WHERE route_key = 'materials_upload') up
WHERE r.route_key = 'materials_create_edit_delete'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;
