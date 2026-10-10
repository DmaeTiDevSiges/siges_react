-- ============================================================
-- Migration: 20261013_add_vehicles_route.sql
-- Rota + permissão da tela CRUD de Veículos (frota).
--
--   route_key : transport_vehicles
--   tela      : views/Transport/VehicleList.tsx (screen 'vehicles')
--   acesso    : perfis que já veem a rota irmã
--                transport_rental_apportionment (Apuração de Aluguel).
--
-- Idempotente: pode ser executada mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Resincroniza a sequence de cfg_routes (mesmo padrão das
-- migrations 20261008/20261010) para evitar conflito de PK.
-- ------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- ------------------------------------------------------------
-- Cria a rota (se ainda não existir)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'transport_vehicles') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'transport_vehicles',
        '/transport/vehicles',
        'Veículos (Frota)',
        'local_shipping',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        22,
        true
    );
    RAISE NOTICE 'Rota transport_vehicles criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota transport_vehicles já existe, ignorando';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Concede view aos perfis que já veem a rota irmã
-- (transport_rental_apportionment) — idempotente.
-- ------------------------------------------------------------
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'transport_vehicles'
WHERE r.route_key = 'transport_rental_apportionment'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION 20261013_add_vehicles_route.sql
-- ============================================================
