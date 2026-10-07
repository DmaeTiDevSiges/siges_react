-- =====================================================
-- Migration: Add profile_permissions route
-- Date: 2026-10-06
-- Description: Nova rota que controla quem vê o item
--              "Permissões de Acesso" em Ajustes e quem
--              pode abrir a tela de gestão de permissões.
--              Negada por padrão: apenas o super admin
--              (bypass em PermissionsContext) enxerga até
--              que a permissão seja concedida a um perfil.
-- =====================================================

-- 0. Garante que a identidade de id está à frente do maior id existente
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- 1. Rota profile_permissions (grupo Settings quando existir)
--    is_visible_to_admin = false => apenas o super admin a gerencia
--    na matriz de permissões (getAllRoutesForCompanyAdmin filtra por ela).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'profile_permissions') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available, is_visible_to_admin)
    VALUES (
        'profile_permissions',
        '/settings/profile-permissions',
        'Permissões de Acesso',
        'verified_user',
        (SELECT id FROM cfg_routes WHERE route_key = 'settings'),
        99,
        true,
        false
    );
    RAISE NOTICE 'Rota profile_permissions criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota profile_permissions já existe, ignorando';
  END IF;
END $$;

-- 2. (Opcional) Conceder a um perfil específico.
--    Descomente e ajuste o nome do perfil:
-- INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
-- SELECT p.id, r.id, true, false, false, false, false
-- FROM cfg_profiles p
-- CROSS JOIN (SELECT id FROM cfg_routes WHERE route_key = 'profile_permissions') r
-- WHERE p.description = 'EP Direção'
-- ON CONFLICT (profile_id, route_id) DO NOTHING;
