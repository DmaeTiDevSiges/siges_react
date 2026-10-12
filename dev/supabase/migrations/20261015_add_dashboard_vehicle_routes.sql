-- ============================================================
-- Migration: 20261015_add_dashboard_vehicle_routes.sql
-- Rotas + permissões do módulo Veículos na página Gestão.
--
--   Rotas novas (cfg_routes):
--     dashboard_vehicles              → aba Transportes (barra Gestão)
--     dashboard_vehicles_costs_periods→ aba Custos Mensais
--     dashboard_vehicles_rentals      → aba Contratos Aluguéis
--     dashboard_vehicles_rate         → aba Contratos R$/Km
--     dashboard_vehicles_crud         → aba Veículos
--   telas:
--     components/dashboards/DashboardTabs.tsx  (aba Transportes)
--     views/Vehicles/VehiclesDashboardAdminScreen.tsx (abas internas)
--   acesso: perfis que já veem as rotas irmãs do módulo
--           transport_* (herança de permissão).
--
-- Idempotente: pode ser executada mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Resincroniza a sequence de cfg_routes (mesmo padrão das
-- migrations 20261008/20261010/20261013) para evitar conflito de PK.
-- ------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- ------------------------------------------------------------
-- Cria as rotas (se ainda não existirem)
-- ------------------------------------------------------------
DO $$
BEGIN
  -- 1. Aba Transportes (barra Gestão)
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'dashboard_vehicles') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'dashboard_vehicles',
        '/dashboard/vehicles',
        'Veículos (Gestão - aba Transportes)',
        'local_shipping',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        23,
        true
    );
    RAISE NOTICE 'Rota dashboard_vehicles criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota dashboard_vehicles já existe, ignorando';
  END IF;

  -- 2. Aba Custos Mensais
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'dashboard_vehicles_costs_periods') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'dashboard_vehicles_costs_periods',
        '/dashboard/vehicles/costs-periods',
        'Custos Mensais (Competências)',
        'payments',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        24,
        true
    );
    RAISE NOTICE 'Rota dashboard_vehicles_costs_periods criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota dashboard_vehicles_costs_periods já existe, ignorando';
  END IF;

  -- 3. Aba Contratos Aluguéis
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'dashboard_vehicles_rentals') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'dashboard_vehicles_rentals',
        '/dashboard/vehicles/rentals',
        'Contratos de Aluguéis',
        'handshake',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        25,
        true
    );
    RAISE NOTICE 'Rota dashboard_vehicles_rentals criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota dashboard_vehicles_rentals já existe, ignorando';
  END IF;

  -- 4. Aba Contratos R$/Km
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'dashboard_vehicles_rate') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'dashboard_vehicles_rate',
        '/dashboard/vehicles/rate',
        'Contratos R$/Km',
        'speed',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        26,
        true
    );
    RAISE NOTICE 'Rota dashboard_vehicles_rate criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota dashboard_vehicles_rate já existe, ignorando';
  END IF;

  -- 5. Aba Veículos
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'dashboard_vehicles_crud') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'dashboard_vehicles_crud',
        '/dashboard/vehicles/crud',
        'Veículos (CRUD da frota)',
        'local_shipping',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        27,
        true
    );
    RAISE NOTICE 'Rota dashboard_vehicles_crud criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota dashboard_vehicles_crud já existe, ignorando';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Concede view aos perfis que já veem as rotas irmãs do módulo
-- transport_* — herança de permissão, idempotente.
-- ------------------------------------------------------------

-- 1. Aba Transportes (dashboard_vehicles):
--    herda de qualquer rota transport_* com can_view.
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT DISTINCT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
CROSS JOIN cfg_routes nova ON nova.route_key = 'dashboard_vehicles'
WHERE r.route_key IN (
        'transport_rental_apportionment',
        'transport_vehicles',
        'transport_costs',
        'transport_rental_contracts',
        'transport_rate_contracts',
        'transport_fuel_expenses'
    )
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- 2. Aba Custos Mensais
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'dashboard_vehicles_costs_periods'
WHERE r.route_key = 'transport_rental_apportionment'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- 3. Aba Contratos Aluguéis
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'dashboard_vehicles_rentals'
WHERE r.route_key = 'transport_rental_contracts'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- 4. Aba Contratos R$/Km
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'dashboard_vehicles_rate'
WHERE r.route_key = 'transport_rate_contracts'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- 5. Aba Veículos
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'dashboard_vehicles_crud'
WHERE r.route_key = 'transport_vehicles'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- ============================================================
-- Fim da migration
-- ============================================================
