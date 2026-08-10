-- =============================================================================
-- Seed Data: v_units_types
-- Exported: 2026-03-05T17:29:26.956Z
-- Records: 20
-- =============================================================================

INSERT INTO public.v_units_types (id, code, description, parent_id, is_available, is_deleted)
VALUES
    (3, 'EBAB', 'Estacao Bombeamento Agua Bruta', 16, true, false),
    (4, 'EBABa', 'Estacao Bombeamento Agua Bruta Automatizada', 16, true, false),
    (5, 'EBAP', 'Estacao Bombeamento Agua Poco', 16, true, false),
    (6, 'EBAT', 'Estacao Bombeamento Agua Tratada', 16, true, false),
    (7, 'EBATa', 'Estacao Bombeamento Agua Tratada Automatizada', 16, true, false),
    (8, 'EBATb', 'Estacao Bombeamento Agua Tratada Booster', 16, true, false),
    (9, 'EBE', 'Estacao Bombeamento Esgoto Cloacal', 16, true, false),
    (10, 'EBEa', 'Estacao Bombeamento Esgoto Cloacal Automatizado', 16, true, false),
    (11, 'ETA', 'Estacao Tratamento Agua', 15, true, false),
    (12, 'ETE', 'Estacao Tratamento Esgoto', 15, true, false),
    (13, 'PMPA', 'Pref Municipal Porto Alegre', 19, true, false),
    (14, 'PS', 'Prestador Servicos', 20, true, false),
    (17, 'RD', 'Rede', 2, true, false),
    (19, 'ADM', 'Administrativo', 1, true, false),
    (22, 'MURO', 'Muro', 21, true, false),
    (23, 'DQ', 'Dique', 21, true, false),
    (42, 'RES', 'Reservatorio', 18, true, false),
    (43, 'EBAP', 'Estacao Bombeamento Agua Pluvial', 16, true, false),
    (45, 'EMGEE', 'Estação Móvel Geradora Energia Elétrica', 44, true, false),
    (46, 'EMEC', 'Estação Móvel Eletrocentro', 16, true, false)
ON CONFLICT (id) DO NOTHING;

