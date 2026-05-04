-- =============================================================================
-- Seed Data: cfg_units_statuses
-- Exported: 2026-03-05T17:29:25.470Z
-- Records: 4
-- =============================================================================

INSERT INTO public.cfg_units_statuses (id, code, description, color)
VALUES
    (1, 'PROJ', 'Projeto', NULL),
    (2, 'OBRA', 'Obra', NULL),
    (3, 'ATIVO', 'Ativo', NULL),
    (4, 'DESAT', 'Desativada', NULL)
ON CONFLICT (id) DO NOTHING;

