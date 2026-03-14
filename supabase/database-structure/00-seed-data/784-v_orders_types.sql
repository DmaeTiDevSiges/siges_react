-- =============================================================================
-- Seed Data: v_orders_types
-- Exported: 2026-03-05T17:29:26.648Z
-- Records: 6
-- =============================================================================

INSERT INTO public.v_orders_types (id, department_id, code, description, is_deleted, is_available)
VALUES
    (1, 9, 'MEC', 'MECANICA', false, true),
    (2, 9, 'ELE', 'ELETRICA', false, true),
    (3, 9, 'AUT', 'AUTOMACAO', false, true),
    (4, 9, 'SOL', 'SOLDA', false, true),
    (5, 9, 'TOR', 'TORNEARIA', false, true),
    (6, 9, 'ADM', 'ADMINISTRATIVO', false, true)
ON CONFLICT (id) DO NOTHING;

