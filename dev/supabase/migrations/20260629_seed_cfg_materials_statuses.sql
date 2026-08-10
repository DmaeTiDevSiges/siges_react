INSERT INTO cfg_materials_statuses (code, description) VALUES
    ('active', 'Ativo'),
    ('inactive', 'Inativo')
ON CONFLICT DO NOTHING;
