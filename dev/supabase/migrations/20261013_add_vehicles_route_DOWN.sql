-- ============================================================
-- DOWN da Migration: 20261013_add_vehicles_route.sql
-- Remove a rota transport_vehicles e seus grants de perfil.
--
-- Apenas os grants CRIADOS por esta migration são removidos
-- (perfis copiados da rota irmã transport_rental_apportionment).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Remove os grants ligados à rota
-- ------------------------------------------------------------
DELETE FROM cfg_profiles_access
WHERE route_id IN (SELECT id FROM cfg_routes WHERE route_key = 'transport_vehicles');

-- ------------------------------------------------------------
-- 2) Remove a rota
-- ------------------------------------------------------------
DELETE FROM cfg_routes WHERE route_key = 'transport_vehicles';

-- ============================================================
-- FIM DO DOWN 20261013_add_vehicles_route.sql
-- ============================================================
