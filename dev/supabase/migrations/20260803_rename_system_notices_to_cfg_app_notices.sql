-- =====================================================
-- Migration: Rename system_notices to cfg_app_notices
-- Date: 2026-08-03
-- =====================================================

-- 1. Renomear tabelas
ALTER TABLE IF EXISTS system_notices RENAME TO cfg_app_notices;
ALTER TABLE IF EXISTS system_notice_categories RENAME TO cfg_app_notices_categories;
ALTER TABLE IF EXISTS system_notice_severities RENAME TO cfg_app_notices_severities;

-- 2. Renomear view
DROP VIEW IF EXISTS v_system_notices;
CREATE OR REPLACE VIEW v_app_notices AS
SELECT 
  n.*,
  c.code AS category_code,
  c.label AS category_label,
  c.color AS category_color,
  c.icon AS category_icon,
  s.code AS severity_code,
  s.label AS severity_label,
  s.color AS severity_color,
  s.icon AS severity_icon,
  u.name_full AS creator_name,
  TO_CHAR(n.start_date, 'DD/MM/YYYY HH24:MI') AS start_date_formatted,
  TO_CHAR(n.end_date, 'DD/MM/YYYY HH24:MI') AS end_date_formatted,
  TO_CHAR(n.created_at, 'DD/MM/YYYY HH24:MI') AS created_at_formatted
FROM cfg_app_notices n
JOIN cfg_app_notices_categories c ON n.category_id = c.id
JOIN cfg_app_notices_severities s ON n.severity_id = s.id
LEFT JOIN users u ON n.created_user_id = u.id;

-- 3. Renomear índices (se existirem com nomes antigos)
ALTER INDEX IF EXISTS idx_system_notices_active RENAME TO idx_cfg_app_notices_active;
ALTER INDEX IF EXISTS idx_system_notices_unit RENAME TO idx_cfg_app_notices_unit;
ALTER INDEX IF EXISTS idx_system_notices_category RENAME TO idx_cfg_app_notices_category;
ALTER INDEX IF EXISTS idx_system_notices_severity RENAME TO idx_cfg_app_notices_severity;
ALTER INDEX IF EXISTS idx_system_notices_created_at RENAME TO idx_cfg_app_notices_created_at;
ALTER INDEX IF EXISTS idx_system_notices_date_range RENAME TO idx_cfg_app_notices_date_range;
ALTER INDEX IF EXISTS idx_system_notices_dashboards RENAME TO idx_cfg_app_notices_dashboards;

-- 4. Renomear trigger
DROP TRIGGER IF EXISTS trigger_update_cfg_app_notices_updated_at ON cfg_app_notices;
DROP TRIGGER IF EXISTS trigger_update_system_notices_updated_at ON cfg_app_notices;
CREATE TRIGGER trigger_update_cfg_app_notices_updated_at
  BEFORE UPDATE ON cfg_app_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_system_notices_updated_at();

-- 5. Renomear constraints (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_notices_pkey') THEN
    ALTER TABLE cfg_app_notices RENAME CONSTRAINT system_notices_pkey TO cfg_app_notices_pkey;
  END IF;
END $$;

-- 6. Atualizar route_key na tabela cfg_routes (se existir)
UPDATE cfg_routes SET route_key = 'app_notices' WHERE route_key = 'system_notices';

-- 7. Comentários
COMMENT ON TABLE cfg_app_notices IS 'Avisos do App - Alertas e comunicados para os usuários';
COMMENT ON TABLE cfg_app_notices_categories IS 'Categorias de avisos do app';
COMMENT ON TABLE cfg_app_notices_severities IS 'Níveis de severidade dos avisos';
