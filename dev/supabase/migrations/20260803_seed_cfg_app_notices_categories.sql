-- Seed: categorias e severidades dos avisos do app
-- Rode apenas se as tabelas estiverem vazias

INSERT INTO cfg_app_notices_categories (code, label, color, icon, order_index)
SELECT * FROM (VALUES
  ('weather',       'Meteorológico', '#3B82F6', 'cloud',       1),
  ('operational',   'Operacional',   '#F97316', 'settings',    2),
  ('maintenance',   'Manutenção',    '#EAB308', 'build',       3),
  ('security',      'Segurança',     '#EF4444', 'shield',      4),
  ('environmental', 'Ambiental',     '#22C55E', 'leaf',        5),
  ('energy',        'Energia',       '#A855F7', 'bolt',        6),
  ('hydrological',  'Hidrológico',   '#1E40AF', 'water',       7),
  ('infrastructure','Infraestrutura','#92400E', 'domain',      8),
  ('quality',       'Qualidade',     '#10B981', 'check_circle',9),
  ('regulatory',    'Regulatório',   '#6B7280', 'gavel',      10)
) AS v(code, label, color, icon, order_index)
WHERE NOT EXISTS (SELECT 1 FROM cfg_app_notices_categories LIMIT 1);

INSERT INTO cfg_app_notices_severities (code, label, color, icon, order_index)
SELECT * FROM (VALUES
  ('info',     'Informativo', '#3B82F6', 'info',    1),
  ('warning',  'Atenção',     '#F97316', 'warning', 2),
  ('critical', 'Crítico',     '#EF4444', 'error',   3)
) AS v(code, label, color, icon, order_index)
WHERE NOT EXISTS (SELECT 1 FROM cfg_app_notices_severities LIMIT 1);
