-- =====================================================
-- Migration: Add audit_log route
-- Date: 2026-10-31
-- Description: Rota que controla quem vê o item "Auditoria"
--              em Ajustes e quem pode abrir a tela de consulta
--              do log de auditoria (audits_logs).
--              Negada por padrão: apenas o super admin a enxerga
--              (bypass em PermissionsContext) até que a permissão
--              seja concedida a um perfil.
-- =====================================================

-- 0. Garante que a identidade de id está à frente do maior id existente
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- 1. Rota audit_log (grupo Settings)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'audit_log') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available, is_visible_to_admin)
    VALUES (
        'audit_log',
        '/settings/audit',
        'Auditoria do Banco de Dados',
        'manage_search',
        (SELECT id FROM cfg_routes WHERE route_key = 'settings'),
        100,
        true,
        false
    );
    RAISE NOTICE 'Rota audit_log criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota audit_log já existe, ignorando';
  END IF;
END $$;

-- 2. (Opcional) Conceder a um perfil específico.
--    Descomente e ajuste o nome do perfil:
-- INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
-- SELECT p.id, r.id, true, false, false, false, false
-- FROM cfg_profiles p
-- CROSS JOIN (SELECT id FROM cfg_routes WHERE route_key = 'audit_log') r
-- WHERE p.description = 'EP Direção'
-- ON CONFLICT (profile_id, route_id) DO NOTHING;
