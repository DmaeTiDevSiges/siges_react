-- =====================================================
-- Migration: Create cfg_app_notices tables
-- Description: Avisos do App (App Notices)
-- Timezone: America/Sao_Paulo (Brasília)
-- =====================================================

-- Configurar timezone da sessão
SET timezone = 'America/Sao_Paulo';

-- =====================================================
-- 1. Tabela de Categorias
-- =====================================================
CREATE TABLE cfg_app_notices_categories (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);

-- Inserir categorias iniciais
INSERT INTO cfg_app_notices_categories (code, label, color, icon, order_index) VALUES
  ('weather', 'Meteorológico', '#3B82F6', 'cloud', 1),
  ('operational', 'Operacional', '#F97316', 'settings', 2),
  ('maintenance', 'Manutenção', '#EAB308', 'build', 3),
  ('security', 'Segurança', '#EF4444', 'shield', 4),
  ('environmental', 'Ambiental', '#22C55E', 'leaf', 5),
  ('energy', 'Energia', '#A855F7', 'bolt', 6),
  ('hydrological', 'Hidrológico', '#1E40AF', 'water', 7),
  ('infrastructure', 'Infraestrutura', '#92400E', 'domain', 8),
  ('quality', 'Qualidade', '#10B981', 'check_circle', 9),
  ('regulatory', 'Regulatório', '#6B7280', 'gavel', 10);

-- =====================================================
-- 2. Tabela de Severidades
-- =====================================================
CREATE TABLE cfg_app_notices_severities (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);

-- Inserir severidades iniciais
INSERT INTO cfg_app_notices_severities (code, label, color, icon, order_index) VALUES
  ('info', 'Informativo', '#3B82F6', 'info', 1),
  ('warning', 'Atenção', '#F97316', 'warning', 2),
  ('critical', 'Crítico', '#EF4444', 'error', 3);

-- =====================================================
-- 3. Tabela Principal de Avisos
-- =====================================================
CREATE TABLE cfg_app_notices (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES cfg_app_notices_categories(id) ON DELETE RESTRICT,
  severity_id INTEGER NOT NULL REFERENCES cfg_app_notices_severities(id) ON DELETE RESTRICT,
  start_date TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  end_date TIMESTAMP NOT NULL,
  dashboards TEXT[] DEFAULT ARRAY['dashboard', 'orders', 'units'],
  created_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT check_end_date_after_start CHECK (end_date > start_date)
);

-- =====================================================
-- 4. Índices para Performance
-- =====================================================
CREATE INDEX idx_cfg_app_notices_active ON cfg_app_notices(is_active, start_date, end_date);
CREATE INDEX idx_cfg_app_notices_category ON cfg_app_notices(category_id);
CREATE INDEX idx_cfg_app_notices_severity ON cfg_app_notices(severity_id);
CREATE INDEX idx_cfg_app_notices_created_at ON cfg_app_notices(created_at DESC);
CREATE INDEX idx_cfg_app_notices_date_range ON cfg_app_notices(start_date, end_date);
CREATE INDEX idx_cfg_app_notices_dashboards ON cfg_app_notices USING GIN (dashboards);

-- =====================================================
-- 5. View para Consultas Facilitadas
-- =====================================================
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

-- =====================================================
-- 6. RLS (Row Level Security)
-- =====================================================
ALTER TABLE cfg_app_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_app_notices_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_app_notices_severities ENABLE ROW LEVEL SECURITY;

-- Políticas para cfg_app_notices_categories (todos podem ler)
CREATE POLICY "Categories: view" ON cfg_app_notices_categories
  FOR SELECT TO authenticated USING (TRUE);

-- Políticas para cfg_app_notices_severities (todos podem ler)
CREATE POLICY "Severities: view" ON cfg_app_notices_severities
  FOR SELECT TO authenticated USING (TRUE);

-- Políticas para cfg_app_notices

-- Qualquer um pode ver avisos ativos no escopo
CREATE POLICY "Notices: view active" ON cfg_app_notices
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
    AND end_date >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
  );

-- Usuários com permissão podem criar
CREATE POLICY "Notices: create" ON cfg_app_notices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'app_notices'
      AND pa.can_create = TRUE
    )
  );

-- Usuários com permissão podem editar
CREATE POLICY "Notices: update" ON cfg_app_notices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'app_notices'
      AND pa.can_edit = TRUE
    )
  );

-- Usuários com permissão podem excluir
CREATE POLICY "Notices: delete" ON cfg_app_notices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'app_notices'
      AND pa.can_delete = TRUE
    )
  );

-- Super admins têm acesso total
CREATE POLICY "Notices: super admin" ON cfg_app_notices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE uuid = auth.uid()
      AND is_admin_super = TRUE
    )
  );

-- =====================================================
-- 7. Trigger para updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION update_cfg_app_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cfg_app_notices_updated_at
  BEFORE UPDATE ON cfg_app_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_cfg_app_notices_updated_at();

-- =====================================================
-- 8. Comentários
-- =====================================================
COMMENT ON TABLE cfg_app_notices_categories IS 'Categorias de avisos do app';
COMMENT ON TABLE cfg_app_notices_severities IS 'Níveis de severidade dos avisos';
COMMENT ON TABLE cfg_app_notices IS 'Avisos do App - Alertas e comunicados para os usuários';
COMMENT ON COLUMN cfg_app_notices.category_id IS 'FK para cfg_app_notices_categories';
COMMENT ON COLUMN cfg_app_notices.severity_id IS 'FK para cfg_app_notices_severities';
COMMENT ON COLUMN cfg_app_notices.dashboards IS 'Array de painéis onde o aviso é visível: dashboard, orders, units';
