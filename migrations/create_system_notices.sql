-- =====================================================
-- Migration: Create system_notices table
-- Description: Avisos do Sistema (System Notices)
-- Timezone: America/Sao_Paulo (Brasília)
-- =====================================================

-- Configurar timezone da sessão
SET timezone = 'America/Sao_Paulo';

-- =====================================================
-- 1. Tabela de Categorias
-- =====================================================
CREATE TABLE system_notice_categories (
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
INSERT INTO system_notice_categories (code, label, color, icon, order_index) VALUES
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
CREATE TABLE system_notice_severities (
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
INSERT INTO system_notice_severities (code, label, color, icon, order_index) VALUES
  ('info', 'Informativo', '#3B82F6', 'info', 1),
  ('warning', 'Atenção', '#F97316', 'warning', 2),
  ('critical', 'Crítico', '#EF4444', 'error', 3);

-- =====================================================
-- 3. Tabela Principal de Avisos
-- =====================================================
CREATE TABLE system_notices (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES system_notice_categories(id) ON DELETE RESTRICT,
  severity_id INTEGER NOT NULL REFERENCES system_notice_severities(id) ON DELETE RESTRICT,
  start_date TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  end_date TIMESTAMP NOT NULL,
  is_global BOOLEAN DEFAULT TRUE,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  system_code TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT check_end_date_after_start CHECK (end_date > start_date)
);

-- =====================================================
-- 4. Índices para Performance
-- =====================================================
CREATE INDEX idx_system_notices_active ON system_notices(is_active, start_date, end_date);
CREATE INDEX idx_system_notices_unit ON system_notices(unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX idx_system_notices_category ON system_notices(category_id);
CREATE INDEX idx_system_notices_severity ON system_notices(severity_id);
CREATE INDEX idx_system_notices_created_at ON system_notices(created_at DESC);
CREATE INDEX idx_system_notices_date_range ON system_notices(start_date, end_date);

-- =====================================================
-- 5. View para Consultas Facilitadas
-- =====================================================
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
  -- Formatação de datas para Brasil (já que são TIMESTAMP sem TZ)
  TO_CHAR(n.start_date, 'DD/MM/YYYY HH24:MI') AS start_date_formatted,
  TO_CHAR(n.end_date, 'DD/MM/YYYY HH24:MI') AS end_date_formatted,
  TO_CHAR(n.created_at, 'DD/MM/YYYY HH24:MI') AS created_at_formatted
FROM system_notices n
JOIN system_notice_categories c ON n.category_id = c.id
JOIN system_notice_severities s ON n.severity_id = s.id
LEFT JOIN users u ON n.created_by = u.uuid;

-- =====================================================
-- 6. RLS (Row Level Security)
-- =====================================================
ALTER TABLE system_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notice_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notice_severities ENABLE ROW LEVEL SECURITY;

-- Políticas para system_notice_categories (todos podem ler)
CREATE POLICY "Categories: view" ON system_notice_categories
  FOR SELECT TO authenticated USING (TRUE);

-- Políticas para system_notice_severities (todos podem ler)
CREATE POLICY "Severities: view" ON system_notice_severities
  FOR SELECT TO authenticated USING (TRUE);

-- Políticas para system_notices

-- Qualquer um pode ver avisos ativos no escopo
CREATE POLICY "Notices: view active" ON system_notices
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
    AND end_date >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
  );

-- Usuários com permissão podem criar
CREATE POLICY "Notices: create" ON system_notices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'system_notices'
      AND pa.can_create = TRUE
    )
  );

-- Usuários com permissão podem editar
CREATE POLICY "Notices: update" ON system_notices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'system_notices'
      AND pa.can_edit = TRUE
    )
  );

-- Usuários com permissão podem excluir
CREATE POLICY "Notices: delete" ON system_notices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cfg_profiles_access pa
      JOIN cfg_routes r ON pa.route_id = r.id
      JOIN users u ON pa.profile_id = u.profile_id
      WHERE u.uuid = auth.uid()
      AND r.route_key = 'system_notices'
      AND pa.can_delete = TRUE
    )
  );

-- Super admins têm acesso total
CREATE POLICY "Notices: super admin" ON system_notices
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
CREATE OR REPLACE FUNCTION update_system_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_notices_updated_at
  BEFORE UPDATE ON system_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_system_notices_updated_at();

-- =====================================================
-- 9. Comentários
-- =====================================================
COMMENT ON TABLE system_notice_categories IS 'Categorias de avisos do sistema';
COMMENT ON TABLE system_notice_severities IS 'Níveis de severidade dos avisos';
COMMENT ON TABLE system_notices IS 'Avisos do Sistema - Alertas e comunicados para os usuários';
COMMENT ON COLUMN system_notices.category_id IS 'FK para system_notice_categories';
COMMENT ON COLUMN system_notices.severity_id IS 'FK para system_notice_severities';
COMMENT ON COLUMN system_notices.is_global IS 'Se TRUE, o aviso é visível em todas as unidades';
COMMENT ON COLUMN system_notices.unit_id IS 'ID da unidade (quando is_global = FALSE)';
COMMENT ON COLUMN system_notices.system_code IS 'Código do sistema (ex: esgoto_pluvial, bombeamento)';
