-- =====================================================
-- Migration: Replace is_global/unit_id/system_code with dashboards TEXT[]
-- Dashboards: 'dashboard' (Meu Painel), 'orders' (Painel Serviços), 'units' (Painel Unidades)
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- Add dashboards column with default for existing data
ALTER TABLE system_notices ADD COLUMN dashboards TEXT[] DEFAULT ARRAY['dashboard', 'orders', 'units'];

-- Migrate existing data
UPDATE system_notices
SET dashboards = ARRAY['dashboard', 'orders', 'units']
WHERE is_global = TRUE;

UPDATE system_notices
SET dashboards = ARRAY[]::TEXT[]
WHERE is_global = FALSE;

-- Drop view BEFORE columns (view depends on them)
DROP VIEW IF EXISTS v_system_notices;

-- Drop old columns
ALTER TABLE system_notices DROP COLUMN IF EXISTS is_global;
ALTER TABLE system_notices DROP COLUMN IF EXISTS unit_id;
ALTER TABLE system_notices DROP COLUMN IF EXISTS system_code;
CREATE OR REPLACE VIEW v_system_notices AS
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
FROM system_notices n
JOIN system_notice_categories c ON n.category_id = c.id
JOIN system_notice_severities s ON n.severity_id = s.id
LEFT JOIN users u ON n.created_by = u.uuid;

-- Index for dashboard array queries
CREATE INDEX idx_system_notices_dashboards ON system_notices USING GIN (dashboards);

-- Update RLS policies to use dashboards
DROP POLICY IF EXISTS "Notices: view active" ON system_notices;
CREATE POLICY "Notices: view active" ON system_notices
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
    AND end_date >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
  );

COMMENT ON COLUMN system_notices.dashboards IS 'Array de painéis onde o aviso é visível: dashboard, orders, units';
