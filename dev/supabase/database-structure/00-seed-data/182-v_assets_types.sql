-- =============================================================================
-- Seed Data: v_assets_types
-- Exported: 2026-03-05T17:29:26.259Z
-- Records: 34
-- =============================================================================

INSERT INTO public.v_assets_types (id, company_id, code, description, is_available)
VALUES
    (1, 1, 'MO', 'MOTOR ELETRICO', true),
    (2, 1, 'BC', 'BOMBA CENTRIFUGA', true),
    (9, 1, 'TE', 'TALHA ELETRICA', true),
    (12, 1, 'CPD', 'CH.PARTIDA DIRETA', true),
    (13, 1, 'CET', 'CH.ESTRELA-TRIANGULO', true),
    (14, 1, 'CAC', 'CH.AUTO-COMPENSADORA', true),
    (15, 1, 'QAE', 'QUADRO ACIONAMENTO ELETRICO', true),
    (16, 1, 'MG', 'MEDICAO GERAL', true),
    (17, 1, 'MI', 'MEDICAO INDIVIDUAL', true),
    (18, 1, 'CLP', 'CLP', true),
    (19, 1, 'TRAFO', 'TRANSFORMADOR', true),
    (23, 1, 'RV', 'REDUTOR VELOCIDADE', true),
    (24, 1, 'CRA', 'CH.REVERSORA AT', true),
    (25, 1, 'CMDO', 'COMANDO', true),
    (28, 1, 'MBSUB', 'MB SUBMERSIVEL', true),
    (29, 1, 'CF', 'CONV.FREQUENCIA', true),
    (45, 1, 'MEX', 'MOTOR EXPLOSAO', true),
    (54, 1, 'DMT', 'DISJUNTOR MT', true),
    (57, 1, 'GER', 'GERADOR', true),
    (62, 1, 'GDM', 'GRADE MECANIZADA', true),
    (70, 1, 'DIV', 'DIVERSOS', true),
    (76, 1, 'QGBT', 'QGBT', true),
    (84, 1, 'COM', 'COMPORTA', true),
    (198, NULL, 'TM', 'TALHA MANUAL', true),
    (200, 1, 'MBS', 'MB SUBMERSA', true),
    (203, 1, 'COMPFLAP', 'COMPORTA FLAP', true),
    (204, 1, 'CH.CONV.FREQUENCIA', 'CH.CONV.FREQUENCIA', true),
    (205, 1, 'QTA', 'QUADRO TRANSF.AUTOMATICA', true),
    (206, NULL, 'SOFT STARTER', 'SOFT STARTER', true),
    (207, 1, 'PONTE ROLANTE MANUAL', 'PONTE ROLANTE MANUAL', true),
    (208, 1, 'PONTE ROLANTE ELETRICA', 'PONTE ROLANTE ELETRICA', true),
    (209, 1, 'UC ELETRICA', 'UC ENERGIA ELETRICA', true),
    (210, 1, 'REGUA NIVEL', 'REGUA NIVEL', true),
    (211, 1, 'CH.SEC.MT', 'CH.SECCIONADORA MT', true)
ON CONFLICT (id) DO NOTHING;

