-- ============================================================
-- DOWN da Migration: 20261048_add_audit_log_route.sql
-- Remove a rota audit_log e seus grants de perfil.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Remove os grants ligados à rota
-- ------------------------------------------------------------
DELETE FROM cfg_profiles_access
WHERE route_id IN (SELECT id FROM cfg_routes WHERE route_key = 'audit_log');

-- ------------------------------------------------------------
-- 2) Remove a rota
-- ------------------------------------------------------------
DELETE FROM cfg_routes WHERE route_key = 'audit_log';

-- ============================================================
-- FIM DO DOWN 20261048_add_audit_log_route.sql
-- ============================================================
