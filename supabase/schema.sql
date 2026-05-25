-- =============================================================================
-- Generated schema.sql
-- Source: supabase/database-structure (exported at 2026-05-21T12:22:09.694Z)
-- WARNING: This file is auto-generated. Do not edit manually unless you know what you are doing.
-- To regenerate: run 'node scripts/build-schema-sql.js' or 'npm run db:export'
-- =============================================================================

-- =============================================================================
-- Section: database-structure/00-seed-data
-- =============================================================================

-- Start File: 182-v_assets_types.sql
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

-- Start File: 328-v_units_types.sql
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

-- Start File: 392-cfg_assets_tags_subs.sql
-- =============================================================================
-- Seed Data: cfg_assets_tags_subs
-- Exported: 2026-03-05T17:29:23.478Z
-- Records: 793
-- =============================================================================

INSERT INTO public.cfg_assets_tags_subs (id, company_id, code, description, is_available, is_deleted)
VALUES
    (1, 1, 'POS 01', 'POS 01', false, true),
    (2, 1, 'POS 02', 'POS 02', false, true),
    (3, 1, 'POS 03', 'POS 03', true, true),
    (4, 1, 'POS 04', 'POS 04', true, true),
    (5, 1, 'POS 05', 'POS 05', true, true),
    (6, 1, 'POS 06', 'POS 06', true, true),
    (7, 1, 'POS 07', 'POS 07', true, true),
    (8, 1, 'POS 08', 'POS 08', true, true),
    (9, 1, 'POS 09', 'POS 09', true, true),
    (10, 1, 'POS 10', 'POS 10', true, true),
    (11, 1, 'POS 01 SUC', 'POS 01 SUC', true, true),
    (12, 1, 'POS 02 SUC', 'POS 02 SUC', true, true),
    (13, 1, 'POS 03 SUC', 'POS 03 SUC', true, true),
    (14, 1, 'POS 04 SUC', 'POS 04 SUC', true, true),
    (15, 1, 'POS 05 SUC', 'POS 05 SUC', true, true),
    (16, 1, 'POS 06 SUC', 'POS 06 SUC', true, true),
    (17, 1, 'POS 07 SUC', 'POS 07 SUC', true, true),
    (18, 1, 'POS 08 SUC', 'POS 08 SUC', true, true),
    (21, 1, 'POS 01 REC', 'POS 01 REC', true, true),
    (22, 1, 'POS 02 REC', 'POS 02 REC', true, true),
    (23, 1, 'POS 03 REC', 'POS 03 REC', true, true),
    (24, 1, 'POS 04 REC', 'POS 04 REC', true, true),
    (25, 1, 'POS 05 REC', 'POS 05 REC', true, true),
    (26, 1, 'POS 06 REC', 'POS 06 REC', true, true),
    (27, 1, 'POS 07 REC', 'POS 07 REC', true, true),
    (28, 1, 'POS 08 REC', 'POS 08 REC', true, true),
    (31, 1, 'F01 LAV', 'F01 LAV', true, true),
    (32, 1, 'F02 LAV', 'F02 LAV', true, true),
    (33, 1, 'F03 LAV', 'F03 LAV', true, true),
    (34, 1, 'F04 LAV', 'F04 LAV', true, true),
    (35, 1, 'F05 LAV', 'F05 LAV', true, true),
    (36, 1, 'F06 LAV', 'F06 LAV', true, true),
    (37, 1, 'F07 LAV', 'F07 LAV', true, true),
    (38, 1, 'F08 LAV', 'F08 LAV', true, true),
    (39, 1, 'F09 LAV', 'F09 LAV', true, true),
    (40, 1, 'F10 LAV', 'F10 LAV', true, true),
    (41, 1, 'F01 EXP', 'F01 EXP', true, true),
    (42, 1, 'F02 EXP', 'F02 EXP', true, true),
    (43, 1, 'F03 EXP', 'F03 EXP', true, true),
    (44, 1, 'F04 EXP', 'F04 EXP', true, true),
    (45, 1, 'F05 EXP', 'F05 EXP', true, true),
    (46, 1, 'F06 EXP', 'F06 EXP', true, true),
    (47, 1, 'F07 EXP', 'F07 EXP', true, true),
    (48, 1, 'F08 EXP', 'F08 EXP', true, true),
    (49, 1, 'F09 EXP', 'F09 EXP', true, true),
    (50, 1, 'F10 EXP', 'F10 EXP', true, true),
    (51, 1, 'F01 ENT', 'F01 ENT', true, true),
    (52, 1, 'F02 ENT', 'F02 ENT', true, true),
    (53, 1, 'F03 ENT', 'F03 ENT', true, true),
    (54, 1, 'F04 ENT', 'F04 ENT', true, true),
    (55, 1, 'F05 ENT', 'F05 ENT', true, true),
    (56, 1, 'F06 ENT', 'F06 ENT', true, true),
    (57, 1, 'F07 ENT', 'F07 ENT', true, true),
    (58, 1, 'F08 ENT', 'F08 ENT', true, true),
    (59, 1, 'F09 ENT', 'F09 ENT', true, true),
    (60, 1, 'F10 ENT', 'F10 ENT', true, true),
    (61, 1, 'F01 FILT', 'F01 FILT', true, true),
    (62, 1, 'F02 FILT', 'F02 FILT', true, true),
    (63, 1, 'F03 FILT', 'F03 FILT', true, true),
    (64, 1, 'F04 FILT', 'F04 FILT', true, true),
    (65, 1, 'F05 FILT', 'F05 FILT', true, true),
    (66, 1, 'F06 FILT', 'F06 FILT', true, true),
    (67, 1, 'F07 FILT', 'F07 FILT', true, true),
    (68, 1, 'F08 FILT', 'F08 FILT', true, true),
    (69, 1, 'F09 FILT', 'F09 FILT', true, true),
    (70, 1, 'F10 FILT', 'F10 FILT', true, true),
    (71, 1, 'CLORADOR 1', 'CLORADOR 1', true, true),
    (73, 1, 'CLORADOR 3', 'CLORADOR 3', true, true),
    (76, 1, 'GMM 01', 'GMM 01', true, true),
    (77, 1, 'GMM 02', 'GMM 02', true, true),
    (78, 1, 'MISTURADOR 0203', 'GMM 03', true, true),
    (79, 1, 'GMM 04', 'GMM 04', true, true),
    (80, 1, 'GMM 05', 'GMM 05', true, true),
    (81, 1, 'DOS.SULF.1', 'DOS.SULF.1', true, true),
    (82, 1, 'DOS.SULF.2', 'DOS.SULF.2', true, true),
    (86, 1, 'PULSATOR 1A', 'PULSATOR 1A', true, true),
    (87, 1, 'PULSATOR 1B', 'PULSATOR 1B', true, true),
    (88, 1, 'PULSATOR 2A', 'PULSATOR 2A', true, true),
    (89, 1, 'PULSATOR 2B', 'PULSATOR 2B', true, true),
    (91, 1, 'F11 LAV', 'F11 LAV', true, true),
    (92, 1, 'F12 LAV', 'F12 LAV', true, true),
    (93, 1, 'F13 LAV', 'F13 LAV', true, true),
    (94, 1, 'F14 LAV', 'F14 LAV', true, true),
    (95, 1, 'F15 LAV', 'F15 LAV', true, true),
    (96, 1, 'F16 LAV', 'F16 LAV', true, true),
    (97, 1, 'F17 LAV', 'F17 LAV', true, true),
    (98, 1, 'F18 LAV', 'F18 LAV', true, true),
    (101, 1, 'F11 EXP', 'F11 EXP', true, true),
    (102, 1, 'F12 EXP', 'F12 EXP', true, true),
    (103, 1, 'F13 EXP', 'F13 EXP', true, true),
    (104, 1, 'F14 EXP', 'F14 EXP', true, true),
    (105, 1, 'F15 EXP', 'F15 EXP', true, true),
    (106, 1, 'F16 EXP', 'F16 EXP', true, true),
    (107, 1, 'F17 EXP', 'F17 EXP', true, true),
    (108, 1, 'F18 EXP', 'F18 EXP', true, true),
    (109, 1, 'F19 EXP', 'F19 EXP', true, true),
    (111, 1, 'F11 ENT', 'F11 ENT', true, true),
    (112, 1, 'F12 ENT', 'F12 ENT', true, true),
    (113, 1, 'F13 ENT', 'F13 ENT', true, true),
    (114, 1, 'F14 ENT', 'F14 ENT', true, true),
    (115, 1, 'F15 ENT', 'F15 ENT', true, true),
    (116, 1, 'F16 ENT', 'F16 ENT', true, true),
    (117, 1, 'F17 ENT', 'F17 ENT', true, true),
    (118, 1, 'F18 ENT', 'F18 ENT', true, true),
    (121, 1, 'F11 FILT', 'F11 FILT', true, true),
    (122, 1, 'F12 FILT', 'F12 FILT', true, true),
    (123, 1, 'F13 FILT', 'F13 FILT', true, true),
    (124, 1, 'F14 FILT', 'F14 FILT', true, true),
    (125, 1, 'F15 FILT', 'F15 FILT', true, true),
    (126, 1, 'F16 FILT', 'F16 FILT', true, true),
    (127, 1, 'F17 FILT', 'F17 FILT', true, true),
    (128, 1, 'F18 FILT', 'F18 FILT', true, true),
    (131, 1, 'GRADE 01', 'GRADE 01', true, true),
    (132, 1, 'GRADE 02', 'GRADE 02', true, true),
    (133, 1, 'GRADE 03', 'GRADE 03', true, true),
    (134, 1, 'GRADE 04', 'GRADE 04', true, true),
    (136, 1, 'DOS.POLI.1', 'DOS.POLI.1', true, true),
    (137, 1, 'DOS.POLI.2', 'DOS.POLI.2', true, true),
    (138, 1, 'DOS.POLI.3', 'DOS.POLI.3', true, true),
    (141, 1, 'BARRELA 1', 'BARRELA 1', true, true),
    (142, 1, 'BARRELA 2', 'BARRELA 2', true, true),
    (145, 1, 'LAV.FILT.1', 'LAV.FILT.1', true, true),
    (146, 1, 'LAV.FILT.2', 'LAV.FILT.2', true, true),
    (148, 1, 'DOS.SUL1E2', 'DOS.SUL1E2', true, true),
    (149, 1, 'COMPRESS.1', 'COMPRESS.1', true, true),
    (150, 1, 'COMPRESS.2', 'COMPRESS.2', true, true),
    (151, 1, 'TQ.SULF.1', 'TQ.SULF.1', true, true),
    (152, 1, 'DOS.FLUOS1', 'DOS.FLUOS1', true, true),
    (153, 1, 'DOS.FLUOS2', 'DOS.FLUOS2', true, true),
    (154, 1, 'DOS.FLU1E2', 'DOS.FLU1E2', true, true),
    (158, 1, 'POS CLORO', 'POS CLORO', true, true),
    (159, 1, 'PULSATOR.AUX.1', 'PULSATOR.AUX.1', true, true),
    (160, 1, 'PULS.AUX.2', 'PULS.AUX.2', true, true),
    (162, 1, 'RESERVA', 'RESERVA', true, false),
    (163, 1, 'AERADOR 01', 'AERADOR 01', true, true),
    (164, 1, 'AERADOR 02', 'AERADOR 02', true, true),
    (165, 1, 'AERADOR 03', 'AERADOR 03', true, true),
    (167, 1, 'AERADOR 06', 'AERADOR 06', true, true),
    (169, 1, 'AERADOR 04', 'AERADOR 04', true, true),
    (172, 1, 'AERADOR 11', 'AERADOR 11', true, true),
    (178, 1, 'GRADE 1/2', 'GRADE 1/2', true, true),
    (180, 1, 'COMANDO', 'COMANDO', true, false),
    (181, 1, 'CONCESSIOANARIA', 'CONCESSIONARIA', true, false),
    (182, 1, 'SE', 'SE', true, true),
    (183, 1, 'SE 01', 'SE 01', true, true),
    (184, 1, 'SE 02', 'SE 02', true, true),
    (185, 1, 'SE 03', 'SE 03', true, true),
    (186, 1, 'SE 04', 'SE 04', true, true),
    (187, 1, 'SE 05', 'SE 05', true, true),
    (190, 1, 'REC.GER.A', 'REC.GER.A', true, true),
    (191, 1, 'REC.GER.B', 'REC.GER.B', true, true),
    (192, 1, 'MED.GERAL 1', 'MED.GERAL 1', true, true),
    (193, 1, 'MED.GERAL 2', 'MED.GERAL 2', true, true),
    (194, 1, 'MED.GERAL', 'MED.GERAL', true, true),
    (195, 1, 'BY PASS 48', 'BY PASS 48', true, true),
    (196, 1, 'BY PASSJAU', 'BY PASSJAU', true, true),
    (197, 1, 'EXPURGO', 'EXPURGO', true, true),
    (198, 1, 'EXPURGO 01', 'EXPURGO 01', true, true),
    (199, 1, 'EXPURGO 02', 'EXPURGO 02', true, true),
    (200, 1, 'MAN.JAU/48', 'MAN.JAU/48', true, true),
    (201, 1, 'MAN.REC 48', 'MAN.REC 48', true, true),
    (202, 1, 'MAN.RECJAU', 'MAN.RECJAU', true, true),
    (203, 1, 'SUC.GER.48', 'SUC.GER.48', true, true),
    (204, 1, 'SUC.GERJAU', 'SUC.GERJAU', true, true),
    (205, 1, 'REC.GER.48', 'REC.GER.48', true, true),
    (206, 1, 'REC.GERJAU', 'REC.GERJAU', true, true),
    (207, 1, 'QGBT 01', 'QGBT 01', true, false),
    (208, 1, 'REC GERAL', 'REC GERAL', true, true),
    (209, 1, 'SUC.G.DIR', 'SUC.G.DIR', true, true),
    (210, 1, 'SUC.G.ESQ', 'SUC.G.ESQ', true, true),
    (212, 1, 'POS 1/2', 'POS 1/2', true, true),
    (213, 1, 'BOMBEAMENTO', 'BOMBEAMENTO', true, false),
    (214, 1, 'GRADE PRE 03', 'GRADE PRE 03', true, false),
    (215, 1, 'SE 06', 'SE 06', true, true),
    (216, 1, 'SE 07', 'SE 07', true, true),
    (217, 1, 'SE 08', 'SE 08', true, true),
    (218, 1, 'SE 09', 'SE 09', true, true),
    (219, 1, 'SCEM 404', 'SCEM 404', true, true),
    (220, 1, 'SCEM 499', 'SCEM 499', true, true),
    (221, 1, 'DIR.411', 'DIR.411', true, true),
    (222, 1, 'STCM 412', 'STCM 412', true, true),
    (224, 1, 'STCM 401', 'STCM 401', true, true),
    (225, 1, 'SVM 409', 'SVM 409', true, true),
    (226, 1, 'SVA 408', 'SVA 408', true, true),
    (227, 1, 'ADM 403', 'ADM 403', true, true),
    (228, 1, 'CI 407', 'CI 407', true, true),
    (230, 1, 'DIR.406', 'DIR.406', true, true),
    (231, 1, 'CI 402', 'CI 402', true, true),
    (232, 1, 'TEC.413', 'TEC.413', true, true),
    (233, 1, 'AUTOM.410', 'AUTOM.410', true, true),
    (234, 1, '(SEM POSICAO)', '(SEM POSICAO)', true, true),
    (235, 1, '1', '1', false, true),
    (236, 1, '2', '2', true, true),
    (237, 1, '3', '3', true, true),
    (238, 1, '4', '4', true, true),
    (239, 1, '5', '5', true, true),
    (240, 1, '6', '6', true, true),
    (241, 1, '7', '7', true, true),
    (242, 1, '8', '8', true, true),
    (243, 1, '9', '9', true, true),
    (245, 1, '11', '11', false, true),
    (246, 1, '12', '12', false, true),
    (247, 1, '13', '13', false, true),
    (249, 1, '15', '15', true, true),
    (250, 1, '16', '16', true, true),
    (251, 1, '17', '17', true, true),
    (252, 1, '18', '18', true, true),
    (253, 1, '19', '19', true, true),
    (254, 1, '20', '20', true, true),
    (255, 1, '21', '21', true, true),
    (257, 1, '23', '23', true, true),
    (258, 1, '24', '24', true, true),
    (260, 1, '26', '26', true, true),
    (261, 1, '27', '27', true, true),
    (262, 1, '28', '28', true, true),
    (265, 1, '31', '31', true, true),
    (266, 1, '32', '32', true, true),
    (268, 1, '34', '34', true, true),
    (270, 1, '36', '36', true, true),
    (272, 1, '38', '38', true, true),
    (273, 1, '39', '39', true, true),
    (277, 1, '43', '43', true, true),
    (279, 1, '45', '45', true, true),
    (283, 1, '49', '49', true, true),
    (284, 1, '50', '50', true, true),
    (288, 1, '54', '54', true, true),
    (289, 1, '55', '55', true, true),
    (291, 1, '57', '57', true, true),
    (293, 1, '59', '59', true, true),
    (294, 1, '60', '60', true, true),
    (295, 1, '61', '61', true, true),
    (297, 1, '63', '63', true, true),
    (298, 1, '64', '64', true, true),
    (299, 1, '65', '65', true, true),
    (300, 1, '66', '66', true, true),
    (301, 1, '67', '67', true, true),
    (302, 1, '68', '68', true, true),
    (303, 1, '69', '69', true, true),
    (304, 1, '70', '70', true, true),
    (305, 1, '71', '71', true, true),
    (307, 1, '73', '73', true, true),
    (308, 1, '74', '74', true, true),
    (309, 1, '75', '75', true, true),
    (310, 1, '76', '76', true, true),
    (311, 1, '77', '77', true, true),
    (312, 1, '78', '78', true, true),
    (313, 1, '79', '79', true, true),
    (314, 1, '80', '80', true, true),
    (315, 1, '81', '81', true, true),
    (316, 1, '82', '82', true, true),
    (318, 1, '84', '84', true, true),
    (319, 1, '85', '85', true, true),
    (320, 1, '86', '86', true, true),
    (321, 1, '87', '87', true, true),
    (322, 1, '88', '88', true, true),
    (324, 1, '90', '90', true, true),
    (325, 1, '91', '91', true, true),
    (326, 1, '92', '92', true, true),
    (327, 1, '93', '93', true, true),
    (328, 1, '94', '94', true, true),
    (329, 1, '95', '95', true, true),
    (330, 1, '96', '96', true, true),
    (331, 1, '97', '97', true, true),
    (333, 1, '99', '99', true, true),
    (334, 1, '100', '100', false, true),
    (335, 1, '101', '101', false, true),
    (336, 1, '102', '102', false, true),
    (337, 1, '103', '103', false, true),
    (338, 1, '120', '120', false, true),
    (339, 1, '121', '121', false, true),
    (340, 1, '122', '122', false, true),
    (341, 1, '123', '123', false, true),
    (342, 1, '201', '201', true, true),
    (343, 1, '202', '202', true, true),
    (344, 1, '203', '203', true, true),
    (345, 1, '204', '204', true, true),
    (346, 1, '205', '205', true, true),
    (347, 1, '206', '206', true, true),
    (348, 1, '207', '207', true, true),
    (349, 1, '208', '208', true, true),
    (351, 1, '210', '210', true, true),
    (354, 1, '213', '213', true, true),
    (356, 1, '215', '215', true, true),
    (357, 1, '216', '216', true, true),
    (358, 1, '217', '217', true, true),
    (360, 1, '219', '219', true, true),
    (361, 1, '220', '220', true, true),
    (362, 1, '221', '221', true, true),
    (363, 1, '222', '222', true, true),
    (364, 1, '223', '223', true, true),
    (365, 1, '224', '224', true, true),
    (366, 1, '225', '225', true, true),
    (367, 1, '226', '226', true, true),
    (368, 1, '227', '227', true, true),
    (369, 1, '228', '228', true, true),
    (370, 1, '229', '229', true, true),
    (371, 1, '230', '230', true, true),
    (372, 1, '231', '231', true, true),
    (373, 1, '232', '232', true, true),
    (374, 1, '233', '233', true, true),
    (376, 1, '235', '235', true, true),
    (377, 1, '236', '236', true, true),
    (379, 1, '238', '238', true, true),
    (380, 1, '239', '239', true, true),
    (381, 1, '240', '240', true, true),
    (382, 1, '241', '241', true, true),
    (383, 1, '242', '242', true, true),
    (384, 1, '243', '243', true, true),
    (385, 1, '244', '244', true, true),
    (386, 1, '7A', '7A', true, true),
    (387, 1, '19A', '19A', true, true),
    (388, 1, '49A', '49A', true, true),
    (389, 1, '50A', '50A', true, true),
    (390, 1, '51A', '51A', true, true),
    (391, 1, '52A', '52A', true, true),
    (393, 1, '54A', '54A', true, true),
    (394, 1, '55A', '55A', true, true),
    (395, 1, '60A', '60A', true, true),
    (397, 1, '82A', '82A', true, true),
    (398, 1, '84A', '84A', true, true),
    (399, 1, '95A', '95A', true, true),
    (400, 1, '96A', '96A', true, true),
    (401, 1, '97A', '97A', true, true),
    (402, 1, '98A', '98A', true, true),
    (403, 1, '99A', '99A', true, true),
    (404, 1, '100A', '100A', false, true),
    (406, 1, '106A', '106A', false, true),
    (407, 1, '113A', '113A', false, true),
    (408, 1, '204A', '204A', true, true),
    (409, 1, '205A', '205A', true, true),
    (411, 1, '89A', '89A', true, true),
    (412, 1, '104', '104', false, true),
    (414, 1, '106', '106', false, true),
    (415, 1, '107', '107', false, true),
    (418, 1, '110', '110', false, true),
    (419, 1, '111', '111', false, true),
    (420, 1, '112', '112', false, true),
    (422, 1, '114', '114', false, true),
    (423, 1, '115', '115', false, true),
    (424, 1, '116', '116', false, true),
    (425, 1, '117', '117', false, true),
    (426, 1, '118', '118', false, true),
    (428, 1, '124', '124', false, true),
    (430, 1, '126', '126', false, true),
    (431, 1, '127', '127', false, true),
    (432, 1, '128', '128', false, true),
    (433, 1, '129', '129', false, true),
    (434, 1, '130', '130', false, true),
    (435, 1, '131', '131', false, true),
    (436, 1, '132', '132', false, true),
    (437, 1, '133', '133', false, true),
    (438, 1, '236A', '236A', true, true),
    (439, 1, 'POS 1/3', 'POS 1/3', true, true),
    (440, 1, 'POS 2/4', 'POS 2/4', true, true),
    (441, 1, 'DEC1 POS 01', 'DEC1 POS 01', true, true),
    (442, 1, 'DEC1 POS 02', 'DEC1 POS 02', true, true),
    (443, 1, 'DEC1 POS 03', 'DEC1 POS 03', true, true),
    (445, 1, 'DEC1 POS 05', 'DEC1 POS 05', true, true),
    (446, 1, 'DEC1 POS 06', 'DEC1 POS 06', true, true),
    (447, 1, 'DEC1 POS 07', 'DEC1 POS 07', true, true),
    (448, 1, 'DEC1 POS 08', 'DEC1 POS 08', true, true),
    (449, 1, 'DEC1 POS 09', 'DEC1 POS 09', true, true),
    (450, 1, 'DEC1 POS 10', 'DEC1 POS 10', true, true),
    (451, 1, 'DEC1 POS 11', 'DEC1 POS 11', true, true),
    (452, 1, 'DEC1 POS 12', 'DEC1 POS 12', true, true),
    (455, 1, 'DEC1 POS 15', 'DEC1 POS 15', true, true),
    (456, 1, 'DEC1 POS 16', 'DEC1 POS 16', true, true),
    (459, 1, 'DEC1 POS 19', 'DEC1 POS 19', true, true),
    (460, 1, 'DEC1 POS 20', 'DEC1 POS 20', true, true),
    (461, 1, 'DEC1 POS 21', 'DEC1 POS 21', true, true),
    (463, 1, 'DEC1 POS 23', 'DEC1 POS 23', true, true),
    (464, 1, 'EXAUSTOR 01', 'EXAUSTOR 01', true, true),
    (465, 1, 'EXAUSTOR 02', 'EXAUSTOR 02', true, true),
    (466, 1, 'EXAUSTOR 03', 'EXAUSTOR 03', true, true),
    (467, 1, 'EXAUSTOR 04', 'EXAUSTOR 04', true, true),
    (468, 1, '130A', '130A', false, true),
    (469, 1, '71A', '71A', true, true),
    (470, 1, '1A', '1A', true, true),
    (471, 1, '104A', '104A', false, true),
    (472, 1, '72A', '72A', true, true),
    (473, 1, '76A', '76A', true, true),
    (474, 1, '45A', '45A', true, true),
    (475, 1, '75A', '75A', true, true),
    (478, 1, '32A', '32A', true, true),
    (479, 1, 'TQ.POLICARB.01', 'TQ.POLICARB.01', true, true),
    (481, 1, 'TQ.SULF.02', 'TQ.SULF.02', true, true),
    (482, 1, '116A', '116A', false, true),
    (484, 1, 'TQ.SULF.1/2', 'TQ.SULF.1/2', true, true),
    (485, 1, 'EXPURGO 03', 'EXPURGO 03', true, true),
    (487, 1, 'EXPURGO 05', 'EXPURGO 05', true, true),
    (488, 1, 'EXPURGO 06', 'EXPURGO 06', true, true),
    (489, 1, 'ELEV.LODO.DIGER.', 'ELEV.LODO.DIGER.', true, true),
    (490, 1, 'ESG.BRUTO 01 PRE REC', 'ESG.BRUTO 01 PRE REC', true, true),
    (491, 1, 'ESG.BRUTO 02 PRE REC', 'ESG.BRUTO 02 PRE REC', true, true),
    (496, 1, 'ESG.BRUTO ENTRADA', 'ESG.BRUTO ENTRADA', true, true),
    (498, 1, 'ESG.TRATADO 02', 'ESG.TRATADO 02', true, true),
    (501, 1, 'ESG.TRATADO 02 REC', 'ESG.TRATADO 02 REC', true, true),
    (504, 1, 'ESG.BRUTO EXPURGO', 'ESG.BRUTO EXPURGO', true, true),
    (505, 1, 'SUC.GERAL', 'SUC.GERAL', true, true),
    (506, 1, 'BOCA VIBRATORIA A1', 'BOCA VIBRATORIA A1', true, true),
    (507, 1, 'CLORACAO PRE', 'CLORACAO PRE', true, true),
    (508, 1, 'CLORACAO POS', 'CLORACAO POS', true, true),
    (509, 1, 'CLORACAO INTER', 'CLORACAO INTER', true, true),
    (510, 1, 'POS 3/4', 'POS 3/4', true, true),
    (512, 1, 'ESG.LODO 02', 'ESG.LODO 02', true, true),
    (519, 1, 'GRADE ESCOVAO', 'GRADE ESCOVAO', true, true),
    (520, 1, 'BATERIA A', 'BATERIA A', true, true),
    (521, 1, 'BATERIA B', 'BATERIA B', true, true),
    (522, 1, 'F03 ENT/EXP', 'F03 ENT/EXP', true, true),
    (523, 1, 'F03 FILT/LAV', 'F03 FILT/LAV', true, true),
    (524, 1, 'F04 ENT/EXP', 'F04 ENT/EXP', true, true),
    (527, 1, 'F05 FILT/LAV', 'F05 FILT/LAV', true, true),
    (529, 1, '134', '134', false, true),
    (530, 1, 'PROVIS�RIO', 'PROVIS�RIO', true, true),
    (531, 1, 'ESG.BRUTO 01 PRE', 'ESG.BRUTO 01 PRE', true, true),
    (532, 1, 'ESG.BRUTO 02 PRE', 'ESG.BRUTO 02 PRE', true, true),
    (533, 1, 'ELEV.LODO ATIV.01', 'ELEV.LODO ATIV.01', true, true),
    (534, 1, 'ELEV.LODO ATIV.02', 'ELEV.LODO ATIV.02', true, true),
    (535, 1, 'ELEV.LODO ATIV.03', 'ELEV.LODO ATIV.03', true, true),
    (536, 1, 'ELEV.LODO ATIV.04', 'ELEV.LODO ATIV.04', true, true),
    (537, 1, 'DESARENADOR 01', 'DESARENADOR 01', true, true),
    (538, 1, 'DESARENADOR 02', 'DESARENADOR 02', true, true),
    (539, 1, 'DESARENADOR 03', 'DESARENADOR 03', true, true),
    (540, 1, 'ESG.LODO 01', 'ESG.LODO 01', true, true),
    (541, 1, 'CENTRIFUGA 01', 'CENTRIFUGA 01', true, true),
    (542, 1, 'CENTRIFUGA 02', 'CENTRIFUGA 02', true, true),
    (543, 1, 'CENTRIFUGA 03', 'CENTRIFUGA 03', true, true),
    (544, 1, 'REMOV.LODO SUC 1A', 'REMOV.LODO SUC 1A', true, true),
    (545, 1, 'REMOV.LODO SUC 1B', 'REMOV.LODO SUC 1B', true, true),
    (546, 1, 'REMOV.LODO SUC 2A', 'REMOV.LODO SUC 2A', true, true),
    (547, 1, 'REMOV.LODO SUC 2B', 'REMOV.LODO SUC 2B', true, true),
    (548, 1, 'BIODIGESTOR 01', 'BIODIGESTOR 01', true, true),
    (549, 1, 'BIODIGESTOR 02', 'BIODIGESTOR 02', true, true),
    (550, 1, 'LODO DIGERIDO 01', 'LODO DIGERIDO 01', true, true),
    (554, 1, 'CARRO LODO 02', 'CARRO LODO 02', true, true),
    (555, 1, 'PORTATIL', 'PORTATIL', true, true),
    (557, 1, 'SOPRADOR 01', 'SOPRADOR 01', true, true),
    (558, 1, 'SOPRADOR 02', 'SOPRADOR 02', true, true),
    (559, 1, 'SOPRADOR 03', 'SOPRADOR 03', true, true),
    (561, 1, 'GRAXA 02', 'GRAXA 02', true, true),
    (562, 1, 'BRIDGE 02', 'BRIDGE 02', true, true),
    (563, 1, 'BRIDGE 03', 'BRIDGE 03', true, true),
    (568, 1, 'ADENSAMENTO 01 PR�', 'ADENSAMENTO 01 PR�', true, true),
    (569, 1, 'ADENSAMENTO 01 P�S', 'ADENSAMENTO 01 P�S', true, true),
    (570, 1, 'ADENSAMENTO 02 PR�', 'ADENSAMENTO 02 PR�', true, true),
    (571, 1, 'ADENSAMENTO 02 P�S', 'ADENSAMENTO 02 P�S', true, true),
    (572, 1, 'ADENSAMENTO 03 PR�', 'ADENSAMENTO 03 PR�', true, true),
    (574, 1, 'DOS.CAL 01 PR�', 'DOS.CAL 01 PR�', true, true),
    (575, 1, 'DOS.CAL 02 PR�', 'DOS.CAL 02 PR�', true, true),
    (576, 1, 'DOS.CAL 03 P�S', 'DOS.CAL 03 P�S', true, true),
    (577, 1, 'DOS.CAL 04 P�S', 'DOS.CAL 04 P�S', true, true),
    (578, 1, 'BRIDGE 04', 'BRIDGE 04', true, true),
    (579, 1, 'BRIDGE 12', 'BRIDGE 12', true, true),
    (580, 1, 'BRIDGE 13', 'BRIDGE 13', true, true),
    (581, 1, 'BY PASS', 'BY PASS', true, true),
    (582, 1, 'QUEIMADOR G�S', 'QUEIMADOR G�S', true, true),
    (584, 1, 'CCM 01', 'CCM 01', true, true),
    (585, 1, 'CCM 02', 'CCM 02', true, true),
    (586, 1, 'CCM 03', 'CCM 03', true, true),
    (587, 1, 'ESG.BRUTO 03 PRE REC', 'ESG.BRUTO 03 PRE REC', true, true),
    (588, 1, 'ADENSAMENTO 01 PR� REC', 'ADENSAMENTO 01 PR� REC', true, true),
    (589, 1, 'ADENSAMENTO 02 PR� REC', 'ADENSAMENTO 02 PR� REC', true, true),
    (590, 1, 'ESG.BRUTO 04 PRE REC', 'ESG.BRUTO 04 PRE REC', true, true),
    (591, 1, 'RESERVAT�RIO ENTRADA 01', 'RESERVAT�RIO ENTRADA 01', true, true),
    (592, 1, 'RESERVAT�RIO ENTRADA 02', 'RESERVAT�RIO ENTRADA 02', true, true),
    (593, 1, 'ADENSAMENTO 01 PR� SUC', 'ADENSAMENTO 01 PR� SUC', true, true),
    (595, 1, 'ADENSAMENTO 03 PR� SUC', 'ADENSAMENTO 03 PR� SUC', true, true),
    (596, 1, 'ADENSAMENTO 01 P�S SUC', 'ADENSAMENTO 01 P�S SUC', true, true),
    (597, 1, 'ADENSAMENTO 02 P�S SUC', 'ADENSAMENTO 02 P�S SUC', true, true),
    (599, 1, 'ADENSAMENTO 03 PR� REC', 'ADENSAMENTO 03 PR� REC', true, true),
    (600, 1, 'BRIDGE 08', 'BRIDGE 08', true, true),
    (601, 1, 'AUXILIAR', 'AUXILIAR', true, true),
    (602, 1, 'BRIDGE 09', 'BRIDGE 09', true, true),
    (603, 1, 'PRESSAO �GUA', 'PRESSAO �GUA', true, true),
    (605, 1, 'CLORA��O P�S 01', 'CLORA��O P�S 01', true, true),
    (606, 1, 'CLORA��O P�S 02', 'CLORA��O P�S 02', true, true),
    (608, 1, 'CLORA��O INTER 01', 'CLORA��O INTER 01', true, true),
    (609, 1, 'CLORA��O INTER 02', 'CLORA��O INTER 02', true, true),
    (610, 1, 'CLORA��O INTER 03', 'CLORA��O INTER 03', true, true),
    (611, 1, 'INDUTORES/EXAUTORES', 'INDUTORES/EXAUTORES', true, true),
    (612, 1, 'REMOTA', 'REMOTA', true, true),
    (613, 1, 'GERAL', 'GERAL', true, false),
    (614, 1, 'SISTEMA "A"', 'SISTEMA "A"', true, true),
    (615, 1, 'SISTEMA "B"', 'SISTEMA "B"', true, true),
    (616, 1, '127A', '127A', false, true),
    (618, 1, '48A', '48A', true, true),
    (620, 1, 'GRADE PRE 02', 'GRADE PRE 02', true, false),
    (621, 1, '136', '136', false, true),
    (622, 1, 'BANHADO ARTIFICIAL', 'BANHADO ARTIFICIAL', true, true),
    (623, 1, 'FILTRO BIOL�GICO', 'FILTRO BIOL�GICO', true, true),
    (624, 1, 'LEITO DE PEDRAS', 'LEITO DE PEDRAS', true, true),
    (625, 1, 'LAGOA ALTA TAXA', 'LAGOA ALTA TAXA', true, true),
    (626, 1, 'FLOTADOR', 'FLOTADOR', true, true),
    (627, 1, 'P�S MISTURADORAS "A"', 'P�S MISTURADORAS "A"', true, true),
    (628, 1, 'P�S MISTURADORAS "B"', 'P�S MISTURADORAS "B"', true, true),
    (629, 1, 'BORBULHADOR', 'BORBULHADOR', true, true),
    (630, 1, 'LAVAGEM', 'LAVAGEM', true, true),
    (631, 1, 'LAV.FILT.1 SUC', 'LAV.FILT.1 SUC', true, true),
    (632, 1, 'LAV.FILT.1 REC', 'LAV.FILT.1 REC', true, true),
    (633, 1, 'BARRELA 1 SUC', 'BARRELA 1 SUC', true, true),
    (634, 1, 'BARRELA 1 REC', 'BARRELA 1 REC', true, true),
    (635, 1, 'BARRELA 2 SUC', 'BARRELA 2 SUC', true, true),
    (636, 1, 'BARRELA 2 REC', 'BARRELA 2 REC', true, true),
    (639, 1, 'LAVAGEM 01', 'LAVAGEM 01', true, true),
    (640, 1, 'LAVAGEM 02', 'LAVAGEM 02', true, true),
    (642, 1, 'DOS.CAL A1', 'DOS.CAL A1', true, true),
    (645, 1, 'DOS.CAL B1', 'DOS.CAL B1', true, true),
    (648, 1, 'EXTINTOR A1', 'EXTINTOR A1', true, true),
    (649, 1, 'EXTINTOR B1', 'EXTINTOR B1', true, true),
    (650, 1, 'BARRELA EXPURGO', 'BARRELA EXPURGO', true, true),
    (651, 1, 'REMOV.SOLIDOS A1', 'REMOV.SOLIDOS A1', true, true),
    (652, 1, 'REMOV.SOLIDOS B1', 'REMOV.SOLIDOS B1', true, true),
    (653, 1, 'DOS.VOLUM�TRICO A1', 'DOS.VOLUM�TRICO A1', true, true),
    (654, 1, 'DOS.VOLUM�TRICO B1', 'DOS.VOLUM�TRICO B1', true, true),
    (655, 1, 'BOCA VIBRATORIA B1', 'BOCA VIBRATORIA B1', true, true),
    (656, 1, 'CHAFARIZ', 'CHAFARIZ', true, true),
    (657, 1, '38A', '38A', true, true),
    (658, 1, 'M�SCARA CLORO', 'M�SCARA CLORO', true, true),
    (659, 1, 'PRESSAO MERCURIO 01', 'PRESSAO MERCURIO 01', true, true),
    (660, 1, 'BARRELA GERAL', 'BARRELA GERAL', true, true),
    (661, 1, 'LAV.FILT.GERAL', 'LAV.FILT.GERAL', true, true),
    (662, 1, 'LAV.FILT.2 REC', 'LAV.FILT.2 REC', true, true),
    (663, 1, 'LAV.FILT.2 SUC', 'LAV.FILT.2 SUC', true, true),
    (664, 1, 'P.MESAS 02 SUC', 'P.MESAS 02 SUC', true, true),
    (665, 1, 'P.MESAS 01 SUC', 'P.MESAS 01 SUC', true, true),
    (666, 1, 'COMPRESS.3', 'COMPRESS.3', true, true),
    (668, 1, 'MEDI��O FLOCOS', 'MEDI��O FLOCOS', true, true),
    (669, 1, 'PULSATOR', 'PULSATOR', true, true),
    (670, 1, 'CASA QUIMICA', 'CASA QUIMICA', true, true),
    (671, 1, 'DEP.CILINDRO CLORO', 'DEP.CILINDRO CLORO', true, true),
    (672, 1, 'GERAL SUCCAO', 'GERAL SUCCAO', true, true),
    (674, 1, 'EXAUSTOR 05', 'EXAUSTOR 05', true, true),
    (675, 1, 'ELEVADOR 01', 'ELEVADOR 01', true, true),
    (676, 1, 'MISTURADORES', 'MISTURADORES', true, true),
    (677, 1, 'GMM 06', 'GMM 06', true, true),
    (678, 1, 'GMM 07', 'GMM 07', true, true),
    (679, 1, 'GMM 08', 'GMM 08', true, true),
    (680, 1, 'DEC2 POS 01', 'DEC2 POS 01', true, true),
    (681, 1, 'DEC2 POS 02', 'DEC2 POS 02', true, true),
    (682, 1, 'DEC2 POS 03', 'DEC2 POS 03', true, true),
    (683, 1, 'DEC2 POS 04', 'DEC2 POS 04', true, true),
    (684, 1, 'DEC2 POS 05', 'DEC2 POS 05', true, true),
    (685, 1, 'DEC2 POS 06', 'DEC2 POS 06', true, true),
    (686, 1, 'DEC2 POS 07', 'DEC2 POS 07', true, true),
    (687, 1, 'DEC2 POS 08', 'DEC2 POS 08', true, true),
    (688, 1, 'DEC2 POS 09', 'DEC2 POS 09', true, true),
    (689, 1, 'DEC2 POS 10', 'DEC2 POS 10', true, true),
    (690, 1, 'DEC2 POS 11', 'DEC2 POS 11', true, true),
    (691, 1, 'DEC2 POS 12', 'DEC2 POS 12', true, true),
    (693, 1, 'DEC2 POS 14', 'DEC2 POS 14', true, true),
    (694, 1, 'DEC2 POS 15', 'DEC2 POS 15', true, true),
    (695, 1, 'DEC2 POS 16', 'DEC2 POS 16', true, true),
    (696, 1, 'DEC2 POS 17', 'DEC2 POS 17', true, true),
    (697, 1, 'DEC2 POS 18', 'DEC2 POS 18', true, true),
    (698, 1, 'DEC2 POS 19', 'DEC2 POS 19', true, true),
    (699, 1, 'DEC2 POS 20', 'DEC2 POS 20', true, true),
    (700, 1, 'DEC2 POS 21', 'DEC2 POS 21', true, true),
    (701, 1, 'DEC2 POS 22', 'DEC2 POS 22', true, true),
    (702, 1, 'DEC2 POS 23', 'DEC2 POS 23', true, true),
    (703, 1, 'DEC3 POS C01', 'DEC3 POS C01', true, true),
    (704, 1, 'DEC3 POS C02', 'DEC3 POS C02', true, true),
    (705, 1, 'DEC3 POS C03', 'DEC3 POS C03', true, true),
    (706, 1, 'DEC3 POS C04', 'DEC3 POS C04', true, true),
    (707, 1, 'DEC3 POS C05', 'DEC3 POS C05', true, true),
    (708, 1, 'DEC3 POS C06', 'DEC3 POS C06', true, true),
    (709, 1, 'DEC3 POS C07', 'DEC3 POS C07', true, true),
    (710, 1, 'DEC3 POS C08', 'DEC3 POS C08', true, true),
    (711, 1, 'DEC3 POS C09', 'DEC3 POS C09', true, true),
    (713, 1, 'DEC3 POS C11', 'DEC3 POS C11', true, true),
    (716, 1, 'DEC3 POS C14', 'DEC3 POS C14', true, true),
    (717, 1, 'DEC3 POS C15', 'DEC3 POS C15', true, true),
    (718, 1, 'DEC3 POS C16', 'DEC3 POS C16', true, true),
    (719, 1, 'DEC3 POS C17', 'DEC3 POS C17', true, true),
    (720, 1, 'DEC3 POS C18', 'DEC3 POS C18', true, true),
    (721, 1, 'DEC3 POS C19', 'DEC3 POS C19', true, true),
    (722, 1, 'DEC3 POS C20', 'DEC3 POS C20', true, true),
    (723, 1, 'DEC3 POS C21', 'DEC3 POS C21', true, true),
    (724, 1, 'DEC3 POS C22', 'DEC3 POS C22', true, true),
    (727, 1, 'DEC3 POS C25', 'DEC3 POS C25', true, true),
    (728, 1, 'DEC3 POS C26', 'DEC3 POS C26', true, true),
    (729, 1, 'DEC3 POS C27', 'DEC3 POS C27', true, true),
    (730, 1, 'DEC3 POS C28', 'DEC3 POS C28', true, true),
    (731, 1, 'DEC3 POS C29', 'DEC3 POS C29', true, true),
    (732, 1, 'DEC3 POS C30', 'DEC3 POS C30', true, true),
    (733, 1, 'DEC3 POS C31', 'DEC3 POS C31', true, true),
    (734, 1, 'DECANTADOR 01', 'DECANTADOR 01', true, true),
    (735, 1, 'DECANTADOR 02', 'DECANTADOR 02', true, true),
    (736, 1, 'MISTURADOR 01/04', 'MISTURADOR 01/04', true, true),
    (737, 1, 'MISTURADOR 05/08', 'MISTURADOR 05/08', true, true),
    (738, 1, 'DECANTADOR 03', 'DECANTADOR 03', true, true),
    (739, 1, 'COMPORTA 01', 'COMPORTA 01', true, true),
    (740, 1, 'COMPORTA 02', 'COMPORTA 02', true, true),
    (741, 1, 'COMPORTA 03', 'COMPORTA 03', true, true),
    (742, 1, 'COMPORTA 04', 'COMPORTA 04', true, true),
    (745, 1, 'COMPORTA GRADE FIXA', 'COMPORTA GRADE FIXA', true, true),
    (746, 1, 'COMPORTA GRADE MECANIZADA', 'COMPORTA GRADE MECANIZADA', true, true),
    (747, 1, 'PONTE RASPADORA', 'PONTE RASPADORA', true, true),
    (749, 1, 'POS 01/02/03/04', 'POS 01/02/03/04', true, true),
    (751, 1, 'SERV.AUX.01', 'SERV.AUX.01', true, true),
    (752, 1, 'F01 QUEBRA VACUO', 'F01 QUEBRA VACUO', true, true),
    (753, 1, 'F02 QUEBRA VACUO', 'F02 QUEBRA VACUO', true, true),
    (754, 1, 'F03 QUEBRA VACUO', 'F03 QUEBRA VACUO', true, true),
    (755, 1, 'F04 QUEBRA VACUO', 'F04 QUEBRA VACUO', true, true),
    (756, 1, 'F05 QUEBRA VACUO', 'F05 QUEBRA VACUO', true, true),
    (757, 1, 'F06 QUEBRA VACUO', 'F06 QUEBRA VACUO', true, true),
    (758, 1, 'F01 ENT AR', 'F01 ENT AR', true, true),
    (759, 1, 'F02 ENT AR', 'F02 ENT AR', true, true),
    (760, 1, 'F03 ENT AR', 'F03 ENT AR', true, true),
    (761, 1, 'F04 ENT AR', 'F04 ENT AR', true, true),
    (762, 1, 'F05 ENT AR', 'F05 ENT AR', true, true),
    (763, 1, 'F06 ENT AR', 'F06 ENT AR', true, true),
    (764, 1, '139', '139', false, true),
    (765, 1, '140', '140', false, true),
    (766, 1, '141', '141', true, true),
    (767, 1, '137', '137', false, true),
    (768, 1, '143', '143', true, true),
    (769, 1, '108A', '108A', false, true),
    (771, 1, '233A', '233A', true, true),
    (772, 1, '138', '138', false, true),
    (773, 1, '142', '142', true, true),
    (774, 1, '144', '144', true, true),
    (775, 1, '144A', '144A', true, true),
    (776, 1, '145', '145', true, true),
    (777, 1, '146', '146', true, true),
    (778, 1, '147', '147', true, true),
    (787, 1, 'DESCARGA 01', 'DESCARGA 01', true, false),
    (788, 1, 'DESCARGA 02', 'DESCARGA 02', true, false),
    (789, 1, 'DESCARGA 03', 'DESCARGA 03', true, false),
    (790, 1, 'CALHA 1/2', 'CALHA 1/2', true, true),
    (791, 1, 'CALHA 3/4', 'CALHA 3/4', true, true),
    (794, 1, '150', '150', true, true),
    (795, 1, '151', '151', true, true),
    (797, 1, 'POÇO 01', 'POÇO 01', true, false),
    (803, 1, 'F07 FILTR/LAV', 'F07 FILTR/LAV', true, true),
    (807, 1, 'F11 FILTR/LAV', 'F11 FILTR/LAV', true, true),
    (808, 1, 'F12 FILTR/LAV', 'F12 FILTR/LAV', true, true),
    (821, 1, '152', '152', true, true),
    (823, 1, '154', '154', true, true),
    (824, 1, '155', '155', true, true),
    (825, 1, '156', '156', true, true),
    (826, 1, '157', '157', true, true),
    (827, 1, '158', '158', true, true),
    (828, 1, '159', '159', true, true),
    (829, 1, '160', '160', true, true),
    (830, 1, '161', '161', true, true),
    (831, 1, '162', '162', true, true),
    (832, 1, '163', '163', true, true),
    (833, 1, '164', '164', true, true),
    (834, 1, '165', '165', true, true),
    (835, 1, '166', '166', true, true),
    (836, 1, '167', '167', true, true),
    (837, 1, '168', '168', true, true),
    (838, 1, '169', '169', true, true),
    (839, 1, '170', '170', true, true),
    (840, 1, '171', '171', true, true),
    (841, 1, '172', '172', true, true),
    (843, 1, '174', '174', true, true),
    (844, 1, '175', '175', true, true),
    (845, 1, '176', '176', true, true),
    (846, 1, '177', '177', true, true),
    (848, 1, '179', '179', true, true),
    (849, 1, '180', '180', true, true),
    (850, 1, '181', '181', true, true),
    (851, 1, '182', '182', true, true),
    (852, 1, '183', '183', true, true),
    (853, 1, '184', '184', true, true),
    (854, 1, '185', '185', true, true),
    (855, 1, '186', '186', true, true),
    (856, 1, '187', '187', true, true),
    (857, 1, '188', '188', true, true),
    (858, 1, '189', '189', true, true),
    (859, 1, '190', '190', true, true),
    (863, 1, '194', '194', true, true),
    (866, 1, '197', '197', true, true),
    (867, 1, '198', '198', true, true),
    (868, 1, '199', '199', true, true),
    (869, 1, '118A', '118A', false, true),
    (870, 1, '134A', '134A', false, true),
    (871, 1, '137A', '137A', false, true),
    (872, 1, '172A', '172A', true, true),
    (873, 1, '155A', '155A', true, true),
    (874, 1, '156A', '156A', true, true),
    (875, 1, 'PONTE 1', 'PONTE 1', true, true),
    (876, 1, 'PONTE 2', 'PONTE 2', true, true),
    (877, 1, 'PONTE 3', 'PONTE 3', true, true),
    (878, 1, 'PONTE 4', 'PONTE 4', true, true),
    (883, 1, '249', '249', true, true),
    (884, 1, '250', '250', true, true),
    (885, 1, '251', '251', true, true),
    (886, 1, '252', '252', true, true),
    (887, 1, '253', '253', true, true),
    (888, 1, '254', '254', true, true),
    (891, 1, '257', '257', true, true),
    (892, 1, '258', '258', true, true),
    (893, 1, '259', '259', true, true),
    (894, 1, '260', '260', true, true),
    (900, 1, 'COMPORTA 1A', 'COMPORTA 1A', true, true),
    (901, 1, 'COMPORTA 1B', 'COMPORTA 1B', true, true),
    (902, 1, 'COMPORTA 2A', 'COMPORTA 2A', true, true),
    (903, 1, 'COMPORTA 2B', 'COMPORTA 2B', true, true),
    (904, 1, 'COMPORTA 3A', 'COMPORTA 3A', true, true),
    (906, 1, '254A', '254A', true, true),
    (907, 1, 'AUTOMA��O', 'AUTOMA��O', true, true),
    (908, 1, 'DESCARGA', 'DESCARGA', true, true),
    (909, 1, 'PURATE', 'PURATE', true, true),
    (910, 1, 'AC. SULFURICO', 'AC. SULFURICO', true, true),
    (911, 1, 'SULFATO', 'SULFATO', true, true),
    (913, 1, 'REATOR', 'REATOR', true, true),
    (914, 1, 'POS A', 'POS A', true, true),
    (915, 1, 'POS B', 'POS B', true, true),
    (916, 1, 'POS C', 'POS C', true, true),
    (917, 1, 'POS D', 'POS D', true, true),
    (918, 1, 'POS E', 'POS E', true, true),
    (919, 1, 'POS F', 'POS F', true, true),
    (920, 1, 'POS G', 'POS G', true, true),
    (921, 1, 'POS H', 'POS H', true, true),
    (926, 1, 'SOPRADOR A', 'SOPRADOR A', true, true),
    (927, 1, 'SOPRADOR B', 'SOPRADOR B', true, true),
    (928, 1, 'SOPRADOR C', 'SOPRADOR C', true, true),
    (931, 1, '261', '261', true, true),
    (932, 1, '262', '262', true, true),
    (934, 1, '264', '264', true, true),
    (935, 1, '265', '265', true, true),
    (936, 1, 'POS 11', 'POS 11', true, true),
    (937, 1, 'POS 12', 'POS 12', true, true),
    (938, 1, 'POS 13', 'POS 13', true, true),
    (939, 1, 'POS 14', 'POS 14', true, true),
    (940, 1, 'POS 15', 'POS 15', true, true),
    (941, 1, 'POS 16', 'POS 16', true, true),
    (942, 1, 'POS 17', 'POS 17', true, true),
    (943, 1, 'POS 18', 'POS 18', true, true),
    (944, 1, 'POS 19', 'POS 19', true, true),
    (945, 1, 'POS 20', 'POS 20', true, true),
    (947, 1, '268A', '268A', true, true),
    (948, 1, '274', '274', true, true),
    (949, 1, '274A', '274A', true, true),
    (955, 1, 'GERAL 02', 'GERAL 02', true, true),
    (959, 1, 'DESCARGA 04', 'DESCARGA 04', true, false),
    (964, 1, 'GRAVIDADE 01', 'GRAVIDADE 01', true, false),
    (965, 1, 'OFICINA', 'OFICINA', true, false),
    (999, 1, 'COMUNICAÇÃO', 'COMUNICAÇÃO', true, false),
    (1000, 1, 'ILUMINACAO', 'ILUMINACAO', true, false),
    (1001, 1, 'GMB 01', 'GMB 01', true, false),
    (1002, 1, 'GMB 02', 'GMB 02', true, false),
    (1003, 1, 'GMB 03', 'GMB 03', true, false),
    (1004, 1, 'GMB 04', 'GMB 04', true, false),
    (1005, 1, 'GMB 05', 'GMB 05', true, false),
    (1006, 1, 'GMB 06', 'GMB 06', true, false),
    (1007, 1, 'GMB 07', 'GMB 07', true, false),
    (1008, 1, 'GMB 08', 'GMB 08', true, false),
    (1009, 1, 'GMB 09', 'GMB 09', true, false),
    (1010, 1, 'GMB 10', 'GMB 10', true, false),
    (1020, 1, 'ABERTURAS', 'ABERTURAS', true, false),
    (1021, 1, 'GMG 01', 'GMG 01', true, false),
    (1022, 1, 'GMG 02', 'GMG 02', true, false),
    (1023, 1, 'GMG 03', 'GMG 03', true, false),
    (1024, 1, 'GMG 04', 'GMG 04', true, false),
    (1025, 1, 'GMG 05', 'GMG 05', true, false),
    (1026, 1, 'GMG 06', 'GMG 06', true, false),
    (1027, 1, 'GMG 07', 'GMG 07', true, false),
    (1028, 1, 'GMG 08', 'GMG 08', true, false),
    (1029, 1, 'GMG 09', 'GMG 09', true, false),
    (1030, 1, 'GMG 10', 'GMG 10', true, false),
    (1031, 1, 'TRAFO 01', 'TRAFO 01', true, false),
    (1032, 1, 'TRAFO 02', 'TRAFO 02', true, false),
    (1033, 1, 'DISJ.MT 01', 'DISJ.MT 01', true, false),
    (1039, 1, 'CONTAINER', 'CONTAINER', true, false),
    (1040, 1, 'CAPACITORES', 'CAPACITORES', true, false),
    (1050, 1, 'HIDRAULICA', 'HIDRAULICA', true, false),
    (1051, 1, 'GRADE PRE 01', 'GRADE PRE 01', true, false),
    (1060, 1, 'DPCCDU', 'DPCCDU', true, false),
    (1061, 1, 'CGOMAP', 'CGOMAP', true, false),
    (1062, 1, 'CCOP', 'CCOP', true, false),
    (1063, 1, 'CMIP', 'CMIP', true, false),
    (1064, 1, 'GRAVIDADE 02', 'GRAVIDADE 02', true, false),
    (1072, 1, 'QGBT 02', 'QGBT 02', true, false),
    (1073, 1, 'GRADE PRE 04', 'GRADE PRE 04', true, false),
    (1074, 1, 'TELEMETRIA', 'TELEMETRIA', true, false),
    (1075, 1, 'DESCARGA 05', 'DESCARGA 05', true, false),
    (1076, 1, 'DESCARGA 06', 'DESCARGA 06', true, false),
    (1077, 1, 'DESCARGA 07', 'DESCARGA 07', true, false),
    (1078, 1, 'DESCARGA 08', 'DESCARGA 08', true, false),
    (1079, 1, 'GRAVIDADE 03', 'GRAVIDADE 03', true, false),
    (1080, 1, 'GRAVIDADE 04', 'GRAVIDADE 04', true, false),
    (1081, 1, 'GRAVIDADE 05', 'GRAVIDADE 05', true, false),
    (1082, 1, 'GRAVIDADE 06', 'GRAVIDADE 06', true, false),
    (1083, 1, 'GCINP', 'GCINP', true, false),
    (1182, 1, 'GRAVIDADE 07', 'GRAVIDADE 07', true, false),
    (1183, 1, 'GRAVIDADE 08', 'GRAVIDADE 08', true, false),
    (1184, 1, 'CAMARA', 'CAMARA', true, false),
    (1185, 1, 'REGUA NIVEL', 'REGUA NIVEL', false, false),
    (1186, 1, 'PISO', 'PISO', true, false),
    (1187, 1, 'STOPLOG', 'STOPLOG', true, false)
ON CONFLICT (id) DO NOTHING;

-- Start File: 407-cfg_systems.sql
-- =============================================================================
-- Seed Data: cfg_systems
-- Exported: 2026-03-05T17:29:25.150Z
-- Records: 25
-- =============================================================================

INSERT INTO public.cfg_systems (id, company_id, parent_id, code, description, is_available, is_deleted, created_user_id, created_date, updated_user_id, updated_date, deleted_user_id, deleted_date)
VALUES
    (1, 1, 8, 'MV', 'Moinhos Vento', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (2, 1, 8, 'SJ', 'Sao Joao', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (3, 1, 8, 'MD', 'Menino Deus', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (4, 1, 8, 'BN', 'Belem Novo', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (5, 1, 8, 'LS', 'Lomba Sabao', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (6, 1, 8, 'IP', 'Ilha Pintada', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (7, 1, 8, 'TR', 'Tristeza', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (8, 1, NULL, 'AG', 'Agua', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (9, 1, NULL, 'EC', 'Esgoto Cloacal', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (10, 1, NULL, 'EP', 'Esgoto Pluvial', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (11, 1, 16, 'AD', 'Administrativo', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (12, 1, NULL, 'PS', 'Prest Servicos', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (13, 1, 12, 'PS', 'Prest Servicos', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (14, 1, 10, 'CE', 'Centro', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (15, 1, 9, 'CA', 'Cavalhada', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (16, 1, NULL, 'AD', 'Administrativo', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (17, 1, 9, 'ZN???', 'ZN???', true, false, NULL, '2024-07-20T02:44:13.505068', NULL, NULL, NULL, NULL),
    (19, 1, 10, 'NO', 'Norte', true, false, NULL, '2024-07-22T18:46:58.858175', NULL, NULL, NULL, NULL),
    (20, 1, 10, 'LE', 'Leste', true, false, NULL, '2024-07-22T18:47:40.174662', NULL, NULL, NULL, NULL),
    (21, 1, 10, 'SU', 'Sul', true, false, NULL, '2024-07-22T18:48:31.944839', NULL, NULL, NULL, NULL),
    (23, 1, NULL, 'CI', 'Combate Inundação', true, false, NULL, '2024-07-29T11:49:10.145373', NULL, NULL, NULL, NULL),
    (24, 1, 23, 'PA', 'Porto Alegre', true, false, NULL, '2024-07-29T11:56:16.556244', NULL, NULL, NULL, NULL),
    (26, 1, 8, 'LA', 'Lami', true, false, 1, '2024-09-15T10:10:41', NULL, NULL, NULL, NULL),
    (27, 1, NULL, 'EA', 'Energias Alternativas', true, false, 1, '2024-11-19T10:19:39', NULL, NULL, NULL, NULL),
    (28, 1, 27, 'EE', 'Energia Elétrica', true, false, 1, '2024-11-19T10:21:14', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Start File: 461-cfg_units_statuses.sql
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

-- Start File: 784-v_orders_types.sql
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

-- Start File: 808-cfg_activities.sql
-- =============================================================================
-- Seed Data: cfg_activities
-- Exported: 2026-03-05T17:29:21.462Z
-- Records: 661
-- =============================================================================

INSERT INTO public.cfg_activities (id, company_id, department_id, description, is_available, is_deleted, code)
VALUES
    (1, 1, 9, '(INFORMACOES DIVERSAS)', true, false, NULL),
    (47, 1, 9, 'Ajuste de gaxetas', true, true, NULL),
    (161, 1, 9, 'Informacoes diversas', true, true, NULL),
    (206, 1, 9, 'Solicitacao de servicos', true, true, NULL),
    (317, 1, 9, 'Substituicao gaxetas', true, true, NULL),
    (318, 1, 9, 'SUBSTITUICAO ROLAMENTO', true, true, NULL),
    (319, 1, 9, 'Substituicao selo mecanico', true, true, NULL),
    (320, 1, 9, 'Substituicao rotor', true, true, NULL),
    (321, 1, 9, 'Substituicao acoplamento', true, true, NULL),
    (322, 1, 9, 'Substituicao lubrificante', false, true, NULL),
    (323, 1, 9, 'Substituicao estator', true, true, NULL),
    (324, 1, 9, 'SUBSTITUICAO EIXO', true, true, NULL),
    (325, 1, 9, 'Substituicao membrana', true, true, NULL),
    (326, 1, 9, 'Substituicao membrana', false, true, NULL),
    (327, 1, 9, 'Substituicao anel oring', false, true, NULL),
    (328, 1, 9, 'Retirado equipamento', true, true, NULL),
    (329, 1, 9, 'Transporte equipamento p/terceiros', true, true, NULL),
    (330, 1, 9, 'INSTALACAO (ANDAMENTO)', true, false, NULL),
    (331, 1, 9, 'Escorvado', true, true, NULL),
    (332, 1, 9, 'Alinhado', true, true, NULL),
    (333, 1, 9, 'LIMPEZA', true, false, NULL),
    (334, 1, 9, 'REAPERTO CONEXAO(OES)', true, false, NULL),
    (335, 1, 9, 'Ajuste de fixacao', true, true, NULL),
    (336, 1, 9, 'Limpeza do rotametro', false, true, NULL),
    (337, 1, 9, 'Regulagem modulo de desvio', true, true, NULL),
    (338, 1, 9, 'Alteracao linha produto/ponto aplicacao', true, true, NULL),
    (339, 1, 9, 'Substituicao conexao/tubulacao', true, true, NULL),
    (340, 1, 9, 'Desobstrucao linha produto', true, true, NULL),
    (341, 1, 9, 'Melhoria no equipamento', true, true, NULL),
    (342, 1, 9, 'Regulagem diversa', false, true, NULL),
    (343, 1, 9, 'Substituicao componentes diversos', true, true, NULL),
    (344, 1, 9, 'Confeccao peca especial', true, true, NULL),
    (345, 1, 9, 'SUBSTITUICAO FUSIVEL (BT)', true, false, NULL),
    (346, 1, 9, 'SUBSTITUICAO RSC', true, false, NULL),
    (347, 1, 9, 'SUBSTITUICAO RFF', true, false, NULL),
    (348, 1, 9, 'REGULAGEM RFF', true, false, NULL),
    (349, 1, 9, 'REGULAGEM RSC', true, false, NULL),
    (350, 1, 9, 'SUBSTITUICAO AMPERIMETRO', true, false, NULL),
    (351, 1, 9, 'SUBSTITUICAO VOLTIMETRO', true, false, NULL),
    (352, 1, 9, 'REMOCAO AMPERIMETRO', true, false, NULL),
    (353, 1, 9, 'REMOCAO VOLTIMETRO', true, false, NULL),
    (354, 1, 9, 'INSTALACAO AMPERIMETRO', true, false, NULL),
    (355, 1, 9, 'INSTALACAO VOLTIMETRO', true, false, NULL),
    (356, 1, 9, 'SUBSTITUICAO HOROMETRO', true, false, NULL),
    (357, 1, 9, 'REMOCAO HOROMETRO', true, false, NULL),
    (358, 1, 9, 'INSTALACAO HOROMETRO', true, false, NULL),
    (359, 1, 9, 'Retificado motor', true, true, NULL),
    (360, 1, 9, 'Completado oleo lubrificante', true, true, NULL),
    (361, 1, 9, 'Substituicao oleo lubrificante', true, true, NULL),
    (362, 1, 9, 'Substituicao filtro oleo lubrificante', true, true, NULL),
    (363, 1, 9, 'Substituicao filtro oleo hidraulico', true, true, NULL),
    (364, 1, 9, 'Substituicao oleo hidraulico', true, true, NULL),
    (365, 1, 9, 'Completado oleo hidraulico', true, true, NULL),
    (366, 1, 9, 'Substituicao filtro ar', true, true, NULL),
    (367, 1, 9, 'Substituicao bomba alimentadora', true, true, NULL),
    (368, 1, 9, 'Substituicao pastilha de freio', true, true, NULL),
    (369, 1, 9, 'Substituicao lampada', true, true, NULL),
    (370, 1, 9, 'SUBSTITUICAO FUSIVEL', false, false, NULL),
    (371, 1, 9, 'Substituicao pneu', true, true, NULL),
    (372, 1, 9, 'Conserto pneu', true, true, NULL),
    (373, 1, 9, 'Recuperacao pneu', true, true, NULL),
    (374, 1, 9, 'Calibracao pneu', true, true, NULL),
    (375, 1, 9, 'Substituicao farol', true, true, NULL),
    (376, 1, 9, 'Substituicao sinaleira', true, true, NULL),
    (377, 1, 9, 'Lavagem geral', true, true, NULL),
    (378, 1, 9, 'Substituicao espelho retrovisor', true, true, NULL),
    (379, 1, 9, 'Substituicao trinque/macaneta/manivela', true, true, NULL),
    (380, 1, 9, 'Chapeacao/pintura', true, true, NULL),
    (381, 1, 9, 'Substituicao para-choque', true, true, NULL),
    (382, 1, 9, 'Substituicao amortecedor', true, true, NULL),
    (383, 1, 9, 'Substituicao lona de freio', true, true, NULL),
    (384, 1, 9, 'Substituicao motor de partida', true, true, NULL),
    (385, 1, 9, 'Limpeza filtro de ar', true, true, NULL),
    (386, 1, 9, 'Encaminhado para orcamento', true, true, NULL),
    (387, 1, 9, 'Encaminhado para conserto', true, true, NULL),
    (388, 1, 9, 'Substituicao chave-boia', true, true, NULL),
    (389, 1, 9, 'SUBSTITUICAO RELE NIVEL', true, false, NULL),
    (390, 1, 9, 'SUBSTITUICAO CONTACTOR', true, false, NULL),
    (391, 1, 9, 'Regulagem de freios', true, true, NULL),
    (392, 1, 9, 'SUBSTITUICAO VENTOINHA', true, false, NULL),
    (393, 1, 9, 'Substituicao pino elastico', true, true, NULL),
    (394, 1, 9, 'Regulagem chave-boia', true, true, NULL),
    (395, 1, 9, 'Substituicao lente', true, true, NULL),
    (396, 1, 9, 'Plantao tecnico', true, true, NULL),
    (397, 1, 9, 'SUBSTITUICAO BATERIA', true, false, NULL),
    (398, 1, 9, 'REMOCAO BATERIA', true, false, NULL),
    (399, 1, 9, 'INSTALACAO BATERIA', true, false, NULL),
    (400, 1, 9, 'Conserto alternador', true, true, NULL),
    (401, 1, 9, 'Substituicao radio', true, true, NULL),
    (402, 1, 9, 'Substituicao antena', true, true, NULL),
    (403, 1, 9, 'Programacao radio', true, true, NULL),
    (404, 1, 9, 'Substituicao cabos (comunicacao)', true, true, NULL),
    (405, 1, 9, 'Substituicao centelhador', true, true, NULL),
    (406, 1, 9, 'Substituicao placa e/s digital', true, true, NULL),
    (407, 1, 9, 'AJUSTES CONFIGURACAO', true, true, NULL),
    (408, 1, 9, 'Substituicao placa e/s analogica', true, true, NULL),
    (409, 1, 9, 'SUBSTITUIÇÃO ELO FUSIVEL (AT)', true, false, NULL),
    (410, 1, 9, 'SUBSTITUICAO CHAVE FUSIVEL (AT)', true, false, NULL),
    (411, 1, 9, 'SUBSTITUICAO CHAVE SECCIONADORA(AT)', true, false, NULL),
    (412, 1, 9, 'INSTALACAO ATERRAMENTO (AT)', true, false, NULL),
    (413, 1, 9, 'SUBSTITUICAO PARA RAIO (AT) (at)', true, false, NULL),
    (414, 1, 9, 'Substituicao isolador at', true, true, NULL),
    (415, 1, 9, 'Substituicao poste (at)', true, true, NULL),
    (416, 1, 9, 'Substituicao cruzeta (at)', true, true, NULL),
    (417, 1, 9, 'Substituicao autotrafo', true, true, NULL),
    (418, 1, 9, 'Substituicao contatos (circ.princ)', true, true, NULL),
    (419, 1, 9, 'Substituicao contator (circ.princ)', true, true, NULL),
    (420, 1, 9, 'Instalacao antena', true, true, NULL),
    (421, 1, 9, 'Substituicao fonte (sist.comunicacao)', true, true, NULL),
    (422, 1, 9, 'Substituicao protetor surto ac/dc', true, true, NULL),
    (423, 1, 9, 'Substituicao tiristores', true, true, NULL),
    (424, 1, 9, 'Substituicao diodos', true, true, NULL),
    (425, 1, 9, 'Substituicao compressor', true, true, NULL),
    (426, 1, 9, 'Limpeza externa', true, true, NULL),
    (428, 1, 9, 'Complementado lubrificante', true, true, NULL),
    (429, 1, 9, 'Checagem dados operacionais', true, true, NULL),
    (430, 1, 9, 'Regulagem diversas', true, true, NULL),
    (431, 1, 9, 'Transporte equipamento', true, true, NULL),
    (432, 1, 9, 'Transporte material', true, true, NULL),
    (433, 1, 9, 'Montagem equipamento', true, true, NULL),
    (434, 1, 9, 'Ponte na bateria', true, true, NULL),
    (435, 1, 9, 'Limpeza filtro combustivel', true, true, NULL),
    (436, 1, 9, 'Limpeza bicos injetores', true, true, NULL),
    (437, 1, 9, 'Limpeza tanque combustivel', true, true, NULL),
    (438, 1, 9, 'LUBRIFICACAO', true, false, NULL),
    (439, 1, 9, 'Substituicao radiador', true, true, NULL),
    (440, 1, 9, 'Completado liq.arrefecimento', true, true, NULL),
    (441, 1, 9, 'Substituicao mang/conexao (sist.arref)', true, true, NULL),
    (442, 1, 9, 'Substituicao limp.para-brisa', true, true, NULL),
    (443, 1, 9, 'Regulagem limp.para-brisa', true, true, NULL),
    (444, 1, 9, 'Substituicao de eletrodos', true, true, NULL),
    (445, 1, 9, 'Rearme do disjuntor', true, true, NULL),
    (446, 1, 9, 'Retirado compressor', false, true, NULL),
    (447, 1, 9, 'Instalado compressor', true, true, NULL),
    (448, 1, 9, 'Substituicao ventilador', true, true, NULL),
    (449, 1, 9, 'Colocacao gas refrigerante', true, true, NULL),
    (450, 1, 9, 'Substituicao serpentina', true, true, NULL),
    (451, 1, 9, 'Servicos de pintura', true, true, NULL),
    (452, 1, 9, 'Regulagem termostato', true, true, NULL),
    (453, 1, 9, 'Substituicao termostato', true, true, NULL),
    (454, 1, 9, 'Substituicao vedacao espuma', true, true, NULL),
    (455, 1, 9, 'Substituicao condensador', true, true, NULL),
    (456, 1, 9, 'Substituicao filtro de ar', false, true, NULL),
    (457, 1, 9, 'Limpeza filtro evaporador', true, true, NULL),
    (458, 1, 9, 'Limpeza espirais', true, true, NULL),
    (459, 1, 9, 'Desumidificado', true, true, NULL),
    (460, 1, 9, 'Substituicao bobina contator (circ.princ)', true, true, NULL),
    (461, 1, 9, 'Substituicao resistencia', true, true, NULL),
    (462, 1, 9, 'Substituicao ch.fim-de-curso', true, true, NULL),
    (463, 1, 9, 'Substituicao base fusivel nh', true, true, NULL),
    (464, 1, 9, 'RESETADO EQUIPAMENTO', true, true, NULL),
    (500, 1, 9, 'Regulagem alternador', true, true, NULL),
    (501, 1, 9, 'Substituicao terminal/cabo bateria', true, true, NULL),
    (502, 1, 9, 'Servicos solda', false, true, NULL),
    (503, 1, 9, 'Substituicao apara-barro', true, true, NULL),
    (504, 1, 9, 'Substituicao mangueira (tq.pipa)', true, true, NULL),
    (505, 1, 9, 'Limpeza bomba alimentadora combustivel', true, true, NULL),
    (506, 1, 9, 'Completado combustivel', true, true, NULL),
    (507, 1, 9, 'Reaperto abrac/conex/mang (tq.pipa)', true, true, NULL),
    (508, 1, 9, 'Substituicao abracadeira/conexao (tq.pipa)', true, true, NULL),
    (509, 1, 9, 'Reaperto abrac/conex/mang (sist.alim)', true, true, NULL),
    (510, 1, 9, 'Substituicao abrac/conex/mang (sist.alim)', true, true, NULL),
    (511, 1, 9, 'Substituicao mang/conexao (sist.alim.)', true, true, NULL),
    (512, 1, 9, 'Identificacao pneu', true, true, NULL),
    (513, 1, 9, 'Revisao embreagem', true, true, NULL),
    (514, 1, 9, 'Substituicao liq.arrefecimento', true, true, NULL),
    (515, 1, 9, 'Completado liq.freio', true, true, NULL),
    (516, 1, 9, 'Substituicao mang/conexao (sist.freio)', true, true, NULL),
    (517, 1, 9, 'Substituicao filtro combustivel', true, true, NULL),
    (518, 1, 9, 'Substituicao cabo acelerador', true, true, NULL),
    (519, 1, 9, 'Regulagem cabo acelerador', true, true, NULL),
    (520, 1, 9, 'Substituicao disco de freio', true, true, NULL),
    (521, 1, 9, 'Substituicao cilindro freio', true, true, NULL),
    (522, 1, 9, 'Substituicao bomba dagua', true, true, NULL),
    (523, 1, 9, 'Substituicao tampa filtro ar', true, true, NULL),
    (524, 1, 9, 'Substituicao boia tq combustivel', true, true, NULL),
    (525, 1, 9, 'Regulagem trinque/macaneta/manivela', true, true, NULL),
    (526, 1, 9, 'Conserto estofamento', true, true, NULL),
    (527, 1, 9, 'Substituicao mang/conexao (sist.hidr)', true, true, NULL),
    (547, 1, 9, 'Servicos diversos de solda', true, true, NULL),
    (548, 1, 9, 'Desmontagem/montagem pneu', true, true, NULL),
    (549, 1, 9, 'Fornecimento material', true, true, NULL),
    (550, 1, 9, 'Substituicao filtro harmonica', true, true, NULL),
    (551, 1, 9, 'Instalacao filtro harmonica', true, true, NULL),
    (552, 1, 9, 'Retirado filtro harmonica (by pass)', true, true, NULL),
    (553, 1, 9, 'Retirada banco arrefcim inverter', true, true, NULL),
    (554, 1, 9, 'Instalacao banco arrefcim inverter', true, true, NULL),
    (555, 1, 9, 'Instalacao banco arrefcim diverter', false, true, NULL),
    (556, 1, 9, 'Retirada banco arrefcim diverter', false, true, NULL),
    (557, 1, 9, 'Substituicao cooler', true, true, NULL),
    (558, 1, 9, 'Comando via ch.partida', true, true, NULL),
    (559, 1, 9, 'Comando via inversor', true, true, NULL),
    (560, 1, 9, 'Rebobinagem', true, true, NULL),
    (561, 1, 9, 'Substituicao escova carvao (sist.induc)', true, true, NULL),
    (562, 1, 9, 'Rebobinagem', false, true, NULL),
    (563, 1, 9, 'Medicao pressao', true, true, NULL),
    (564, 1, 9, 'Limpeza sensor', true, true, NULL),
    (565, 1, 9, 'Limpeza contator/contatos', true, true, NULL),
    (566, 1, 9, 'Medicao capacitancia', true, true, NULL),
    (567, 1, 9, 'Medicao temperatura', true, true, NULL),
    (568, 1, 9, 'Medicao tensao', true, true, NULL),
    (569, 1, 9, 'Medicao corrente eletrica', true, true, NULL),
    (570, 1, 9, 'Reversao para circ.secundario', true, true, NULL),
    (571, 1, 9, 'Reversao para circ.principal', true, true, NULL),
    (572, 1, 9, 'Substituicao mufla', true, true, NULL),
    (573, 1, 9, 'Substituicao cabo at', true, true, NULL),
    (574, 1, 9, 'Reaperto terminal', true, true, NULL),
    (575, 1, 9, 'Substituicao rele tempo', true, true, NULL),
    (576, 1, 9, 'Regulagem rele tempo', true, true, NULL),
    (577, 1, 9, 'Substituicao indicador vazao', true, true, NULL),
    (578, 1, 9, 'Substituicao indicador corrente', true, true, NULL),
    (579, 1, 9, 'Substituicao indicador tensao', true, true, NULL),
    (580, 1, 9, 'Substituicao indicador pressao', true, true, NULL),
    (581, 1, 9, 'Substituicao indicador nivel', true, true, NULL),
    (582, 1, 9, 'Substituicao sensor nivel', true, true, NULL),
    (583, 1, 9, 'Substituicao sensor pressao', true, true, NULL),
    (584, 1, 9, 'VISTORIA TECNICA', true, false, NULL),
    (603, 1, 9, 'Substituicao vela ignicao', true, true, NULL),
    (604, 1, 9, 'Substituicao correia/tensor (alternador)', true, true, NULL),
    (605, 1, 9, 'Solicitacao documentos', true, true, NULL),
    (606, 1, 9, 'Solicitacao termo aditivo', true, true, NULL),
    (607, 1, 9, 'Solicitacao reajuste precos', true, true, NULL),
    (608, 1, 9, 'Substituicao cabo embreagem', true, true, NULL),
    (609, 1, 9, 'Substituicao garfo embreagem', true, true, NULL),
    (610, 1, 9, 'Substituicao rolamento embreagem', true, true, NULL),
    (611, 1, 9, 'Substituicao plato embreagem', true, true, NULL),
    (612, 1, 9, 'Substituicao ponta eixo', true, true, NULL),
    (613, 1, 9, 'Substituicao borboleta embreagem', true, true, NULL),
    (614, 1, 9, 'Substituicao disco embreagem', true, true, NULL),
    (615, 1, 9, 'Substituicao flexivel embreagem', true, true, NULL),
    (616, 1, 9, 'Substituicao rolamento int/ext roda', true, true, NULL),
    (617, 1, 9, 'Substituicao cubo roda', true, true, NULL),
    (618, 1, 9, 'Substituicao retentor roda', true, true, NULL),
    (619, 1, 9, 'Substituicao homocinetica', true, true, NULL),
    (621, 1, 9, 'Substituicao retentor', true, true, NULL),
    (622, 1, 9, 'Substituicao embreagem', true, true, NULL),
    (623, 1, 9, 'Substituicao selo motor', true, true, NULL),
    (624, 1, 9, 'Substituicao cilindro roda', true, true, NULL),
    (625, 1, 9, 'Substituicao liq.freio', true, true, NULL),
    (626, 1, 9, 'Equipamento danificado', true, true, NULL),
    (627, 1, 9, 'Locacao equipamento', true, true, NULL),
    (628, 1, 9, 'Manutencao geral', true, true, NULL),
    (629, 1, 9, 'Recarga bateria', true, true, NULL),
    (630, 1, 9, 'Substituicao bateria p/reserva', true, true, NULL),
    (631, 1, 9, 'Remocao componentes p/compra', true, true, NULL),
    (632, 1, 9, 'Regulagem farol', true, true, NULL),
    (633, 1, 9, 'Regulagem farolete', true, true, NULL),
    (634, 1, 9, 'Conserto alerta marcha a re', true, true, NULL),
    (635, 1, 9, 'Conserto farolete', true, true, NULL),
    (636, 1, 9, 'Conserto chave ignicao', true, true, NULL),
    (637, 1, 9, 'Reinstalacao de equipamento', true, true, NULL),
    (638, 1, 9, 'Conserto sinalizacao rotativa', true, true, NULL),
    (639, 1, 9, 'Inspecionado', true, true, NULL),
    (640, 1, 9, 'Conserto barra estabilizadora', true, true, NULL),
    (641, 1, 9, 'Substituicao bomba oleo (sist.hidr)', true, true, NULL),
    (643, 1, 9, 'Conserto maquina vidro', true, true, NULL),
    (644, 1, 9, 'Equipamento em observacao', true, true, NULL),
    (645, 1, 9, 'Substituicao registro (tq.pipa)', true, true, NULL),
    (646, 1, 9, 'Substituicao cubo roda', false, true, NULL),
    (647, 1, 9, 'Desmontagem de freios', true, true, NULL),
    (648, 1, 9, 'Ligado equipamento', true, true, NULL),
    (649, 1, 9, 'Desligado equipamento', true, true, NULL),
    (650, 1, 9, 'Substituicao alternador', true, true, NULL),
    (651, 1, 9, 'Revisao sist freios', true, true, NULL),
    (652, 1, 9, 'Revisao sist.eletrico', true, true, NULL),
    (653, 1, 9, 'Reaperto cabo/terminal bateria', true, true, NULL),
    (654, 1, 9, 'Reaperto grampo feixe molas', true, true, NULL),
    (655, 1, 9, 'Conserto pedal embreagem', true, true, NULL),
    (656, 1, 9, 'Substituicao botao', true, true, NULL),
    (657, 1, 9, 'Revisao sist.arrefecimento', true, true, NULL),
    (658, 1, 9, 'Substituicao regulador voltagem', true, true, NULL),
    (659, 1, 9, 'Substituicao buzina', true, true, NULL),
    (660, 1, 9, 'Conserto sinalizacao', true, true, NULL),
    (661, 1, 9, 'Consertos diversos (moto-amoladora)', true, true, NULL),
    (662, 1, 9, 'Consertos diversos (motor agrale)', true, true, NULL),
    (663, 1, 9, 'Reaperto descarga', true, true, NULL),
    (664, 1, 9, 'Conserto descarga', true, true, NULL),
    (665, 1, 9, 'Conserto motor de partida', true, true, NULL),
    (666, 1, 9, 'Limpeza caburador', true, true, NULL),
    (667, 1, 9, 'Conserto bomba combustivel', true, true, NULL),
    (668, 1, 9, 'Montagem equipamento (bomba lufersa)', true, true, NULL),
    (669, 1, 9, 'Compra material', true, true, NULL),
    (670, 1, 9, 'Patrimonizacao equipamento', true, true, NULL),
    (671, 1, 9, 'Conserto motor', true, true, NULL),
    (672, 1, 9, 'Conserto sist.suspensao', true, true, NULL),
    (673, 1, 9, 'Balanceamento/geometria', true, true, NULL),
    (674, 1, 9, 'Servicos diversos (chassi)', true, true, NULL),
    (675, 1, 9, 'Substituicao kit ralo', true, true, NULL),
    (676, 1, 9, 'Substituicao bico boca', true, true, NULL),
    (677, 1, 9, 'Substituicao bico copo', true, true, NULL),
    (678, 1, 9, 'Substituicao filtro', true, true, NULL),
    (679, 1, 9, 'Substituicao reservatorio', true, true, NULL),
    (680, 1, 9, 'Substituicao rele', true, true, NULL),
    (681, 1, 9, 'Consertos diversos (bomba lufersa)', true, true, NULL),
    (682, 1, 9, 'Limpeza/organizacao geral (secao)', true, true, NULL),
    (683, 1, 9, 'Substituicao surdina', true, true, NULL),
    (684, 1, 9, 'Substituicao sensor (sist.eletrico)', true, true, NULL),
    (685, 1, 9, 'Conserto para-choque', true, true, NULL),
    (686, 1, 9, 'Substituicao cabos (vela ignicao)', true, true, NULL),
    (687, 1, 9, 'Substituicao rotor (distribuidor)', true, true, NULL),
    (688, 1, 9, 'Substituicao palheta limp.para-brisa', true, true, NULL),
    (689, 1, 9, 'Substituicao pneu p/estepe', true, true, NULL),
    (690, 1, 9, 'Limpeza sist.alimentacao', true, true, NULL),
    (691, 1, 9, 'Regulagem maquina vidro', true, true, NULL),
    (692, 1, 9, 'Substituicao cabo energia', true, true, NULL),
    (693, 1, 9, 'SUBSTITUICAO CHAVE SELETORA', true, false, NULL),
    (694, 1, 9, 'Substituicao tacografo', true, true, NULL),
    (695, 1, 9, 'Conserto tacografo', true, true, NULL),
    (696, 1, 9, 'Substituicao cilindro mestre embreagem', true, true, NULL),
    (697, 1, 9, 'Substituicao sapatas/lonas de freio', true, true, NULL),
    (698, 1, 9, 'Conserto porta', true, true, NULL),
    (699, 1, 9, 'Substituicao vidro janela', true, true, NULL),
    (700, 1, 9, 'Completado oleo lubrificante (cx.mudanca)', true, true, NULL),
    (701, 1, 9, 'Substituicao oleo lubrificante (cx.mudanca)', true, true, NULL),
    (702, 1, 9, 'Conserto janela', true, true, NULL),
    (703, 1, 9, 'Regulagem porta', true, true, NULL),
    (704, 1, 9, 'Substituicao filtro dagua', true, true, NULL),
    (705, 1, 9, 'Conserto molas (sist.suspensao)', true, true, NULL),
    (706, 1, 9, 'Substituicao junta (motor)', true, true, NULL),
    (707, 1, 9, 'Substituicao mang/conexao (sist.lubrif)', true, true, NULL),
    (708, 1, 9, 'Substituicao engrenagem cmdo (motor)', true, true, NULL),
    (709, 1, 9, 'Regulagem acelerador', true, true, NULL),
    (710, 1, 9, 'Remocao componentes p/manutencao', true, true, NULL),
    (711, 1, 9, 'Revisao estofamento', true, true, NULL),
    (712, 1, 9, 'Substituicao concha/pa carregadeira', true, true, NULL),
    (713, 1, 9, 'Substituicao farolete', true, true, NULL),
    (714, 1, 9, 'Instalacao faixa refletiva', true, true, NULL),
    (715, 1, 9, 'Substituicao bomba oleo (dir.hidr)', true, true, NULL),
    (716, 1, 9, 'Substituicao faixa refletiva', true, true, NULL),
    (717, 1, 9, 'Conserto farol', true, true, NULL),
    (718, 1, 9, 'Reaperto abrac/conex/mang (sist.arref)', true, true, NULL),
    (720, 1, 9, 'Reaperto abrac/conex/mang (sist.hidr)', true, true, NULL),
    (721, 1, 9, 'Substituicao reserv.expansao (sits.arref)', true, true, NULL),
    (722, 1, 9, 'Transporte funcionario', true, true, NULL),
    (723, 1, 9, 'Completado oleo hidraulico (dir.hidr)', true, true, NULL),
    (724, 1, 9, 'Revisao banco (estofamento)', true, true, NULL),
    (725, 1, 9, 'Revisao bomba hidraulica (dir.hidr)', true, true, NULL),
    (726, 1, 9, '(nao executado: sem necessidade)', true, true, NULL),
    (727, 1, 9, 'Reforma sist.eletrico', true, true, NULL),
    (728, 1, 9, 'Equipamento desatolado', true, true, NULL),
    (729, 1, 9, 'Regulagem cabo (tomada forca)', true, true, NULL),
    (730, 1, 9, 'Conserto buzina', true, true, NULL),
    (731, 1, 9, 'Substituicao engate reboque', true, true, NULL),
    (732, 1, 9, 'Desmontagem equipamento', true, true, NULL),
    (733, 1, 9, 'Fiscalizacao servicos terceiros', true, true, NULL),
    (734, 1, 9, 'Revisao diferencial', true, true, NULL),
    (735, 1, 9, 'Substituicao graxeira', true, true, NULL),
    (736, 1, 9, 'Conserto eixo cardan', true, true, NULL),
    (737, 1, 9, 'Reaperto abrac/conexao (sist.descarga)', true, true, NULL),
    (741, 1, 9, 'Substituicao valvula ar quente', true, true, NULL),
    (742, 1, 9, 'Notificacao funcional', true, true, NULL),
    (743, 1, 9, 'Recapagem pneu', true, true, NULL),
    (744, 1, 9, 'Substituicao coxim (cx.mudanca)', true, true, NULL),
    (745, 1, 9, 'Substituicao coxim (filtro ar)', true, true, NULL),
    (746, 1, 9, 'Substituicao coxim (motor)', true, true, NULL),
    (747, 1, 9, 'Substituicao cilindro (porta)', true, true, NULL),
    (748, 1, 9, 'Substituicao coifa homocinetica (sist.direcao)', true, true, NULL),
    (749, 1, 9, 'Rodizio pneu', true, true, NULL),
    (750, 1, 9, 'Inspecao', false, true, NULL),
    (751, 1, 9, 'Teste link', true, true, NULL),
    (752, 1, 9, 'Instalacao engate reboque', true, true, NULL),
    (753, 1, 9, 'Recodificacao radio', true, true, NULL),
    (754, 1, 9, 'Substituicao valvula termostatica', true, true, NULL),
    (755, 1, 9, 'Substituicao maquina vidro', true, true, NULL),
    (756, 1, 9, 'Substituicao braco dir.auxiliar (sist.direcao)', true, true, NULL),
    (757, 1, 9, 'Substituicao braco dir.pitman (sist.direcao)', true, true, NULL),
    (758, 1, 9, 'Desmontagem/montagem pneu aro 20', true, true, NULL),
    (759, 1, 9, 'Desmontagem/montagem pneu aro 13', true, true, NULL),
    (760, 1, 9, 'Desmontagem/montagem pneu aro 16', true, true, NULL),
    (761, 1, 9, 'Desmontagem/montagem pneu aro 22,5', true, true, NULL),
    (762, 1, 9, 'Desmontagem/montagem pneu aro 12', true, true, NULL),
    (763, 1, 9, 'Conserto pneu aro 20', true, true, NULL),
    (764, 1, 9, 'Conserto pneu aro 16', true, true, NULL),
    (765, 1, 9, 'Conserto pneu aro 13', true, true, NULL),
    (766, 1, 9, 'Conserto pneu aro 08', true, true, NULL),
    (767, 1, 9, 'Conserto pneu aro 14', true, true, NULL),
    (768, 1, 9, 'Desmontagem/montagem pneu aro 14', true, true, NULL),
    (769, 1, 9, 'Conserto pneu aro 15', true, true, NULL),
    (770, 1, 9, 'Desmontagem/montagem pneu aro 15', true, true, NULL),
    (773, 1, 9, 'Substituicao bomba oleo lubrificante', true, true, NULL),
    (774, 1, 9, 'Conserto turbina ar', true, true, NULL),
    (775, 1, 9, 'Substituicao junta homocinetica', true, true, NULL),
    (776, 1, 9, 'Substituicao barra estabilizadora (sist.direcao)', true, true, NULL),
    (777, 1, 9, 'Substituicao barra (sist.direcao)', true, true, NULL),
    (778, 1, 9, 'Substituicao tampa tq combustivel', true, true, NULL),
    (779, 1, 9, 'Desmontagem/montagem pneu aro 24', true, true, NULL),
    (780, 1, 9, 'Desmontagem/montagem pneu aro 17,5', true, true, NULL),
    (781, 1, 9, 'Conserto pneu aro 24', true, true, NULL),
    (788, 1, 9, 'Conserto ar condicionado', true, true, NULL),
    (791, 1, 9, 'Substituicao sensor (sist.arrefecim)', true, true, NULL),
    (792, 1, 9, 'Substituicao camisa/cilindro/pistao', true, true, NULL),
    (793, 1, 9, 'Substituicao capo', true, true, NULL),
    (794, 1, 9, 'Substituicao para-lama', true, true, NULL),
    (795, 1, 9, 'Substituicao grade', true, true, NULL),
    (796, 1, 9, 'Substituicao braco axial', true, true, NULL),
    (797, 1, 9, 'Substituicao valvula estacionario (sist.freios)', true, true, NULL),
    (798, 1, 9, 'Regulagem bomba injetora', true, true, NULL),
    (799, 1, 9, 'Conserto carburador', true, true, NULL),
    (800, 1, 9, 'Regulagem carburador', true, true, NULL),
    (801, 1, 9, 'Conserto ponta eixo', true, true, NULL),
    (802, 1, 9, 'Conserto pneu aro 22,5', true, true, NULL),
    (803, 1, 9, 'Regulagem embreagem', true, true, NULL),
    (804, 1, 9, 'Substituicao tanque combustivel', true, true, NULL),
    (805, 1, 9, 'Conserto embreagem', true, true, NULL),
    (806, 1, 9, 'Conserto radiador', true, true, NULL),
    (807, 1, 9, 'Substituicao escapamento', true, true, NULL),
    (808, 1, 9, 'Conserto indic.nivel combustivel', true, true, NULL),
    (809, 1, 9, 'Substituicao indic.nivel combustivel', true, true, NULL),
    (810, 1, 9, 'Conserto aro (pneu)', true, true, NULL),
    (811, 1, 9, 'Substituicao aro (pneu)', true, true, NULL),
    (812, 1, 9, 'Revisao bomba injetora', true, true, NULL),
    (813, 1, 9, 'Conserto bomba injetora', true, true, NULL),
    (814, 1, 9, 'Substituicao bomba injetora', true, true, NULL),
    (815, 1, 9, 'Revisao motor partida', true, true, NULL),
    (816, 1, 9, 'Conserto freio motor', true, true, NULL),
    (817, 1, 9, 'Substituicao vela pre-aquecimento', true, true, NULL),
    (818, 1, 9, 'Revisao cx.mudancas', true, true, NULL),
    (819, 1, 9, 'Completado oleo lubrificante (diferencial)', true, true, NULL),
    (820, 1, 9, 'Instalacao alarme sonoro', true, true, NULL),
    (821, 1, 9, 'Instalacao sinalizacao rotativa', true, true, NULL),
    (822, 1, 9, 'Instalacao pistola ar', true, true, NULL),
    (823, 1, 9, 'Substituicao coxim (cabine)', true, true, NULL),
    (824, 1, 9, 'Instalacao calota (roda)', true, true, NULL),
    (825, 1, 9, 'Substituicao vedacao (sist.descarga)', true, true, NULL),
    (826, 1, 9, 'Substituicao setor direcao', true, true, NULL),
    (827, 1, 9, 'Reaperto filtro oleo hidraulico', true, true, NULL),
    (828, 1, 9, 'Substituicao volante direcao', true, true, NULL),
    (829, 1, 9, 'Conserto cx.mudancas', true, true, NULL),
    (830, 1, 9, 'Substituicao cx.mudancas', true, true, NULL),
    (831, 1, 9, 'Conserto direcao', true, true, NULL),
    (832, 1, 9, 'Conserto sist.freios', true, true, NULL),
    (833, 1, 9, 'Substituicao reserv.limp.para-brisas', true, true, NULL),
    (834, 1, 9, 'Substituicao grampo/mola (sist.susp.)', true, true, NULL),
    (835, 1, 9, 'Substituicao alavanca acion.direcao', true, true, NULL),
    (836, 1, 9, 'Desmontagem equipamento', true, true, NULL),
    (837, 1, 9, 'Substituicao valvula pedal (sist.freios)', true, true, NULL),
    (838, 1, 9, 'Revisao alinhamento 3i��.eixo', true, true, NULL),
    (839, 1, 9, 'Substituicao bomba limp.para-brisa', true, true, NULL),
    (840, 1, 9, 'Substituicao tambor (sist.freios)', true, true, NULL),
    (841, 1, 9, 'Conserto velocimetro', true, true, NULL),
    (842, 1, 9, 'Conserto odometro', true, true, NULL),
    (843, 1, 9, 'Limpeza motor externa', false, true, NULL),
    (844, 1, 9, 'Limpeza motor interna', false, true, NULL),
    (845, 1, 9, 'Conserto cabo velocimetro', true, true, NULL),
    (846, 1, 9, 'Substituicao cabo velocimetro', true, true, NULL),
    (847, 1, 9, 'Limpeza cabo/terminal bateria', true, true, NULL),
    (848, 1, 9, 'Substituicao carregador voltagem', true, true, NULL),
    (849, 1, 9, 'Conserto carregador voltagem', true, true, NULL),
    (850, 1, 9, 'Conserto pedal acelerador', true, true, NULL),
    (851, 1, 9, 'Conserto cabo acelerador', true, true, NULL),
    (852, 1, 9, 'Substituicao cabo acelerador', false, true, NULL),
    (853, 1, 9, 'Reforma estofamento', true, true, NULL),
    (854, 1, 9, 'Substituicao freio-motor', true, true, NULL),
    (855, 1, 9, 'Conserto amortecedor', true, true, NULL),
    (856, 1, 9, 'Conserto concha/pa carregadeira', true, true, NULL),
    (857, 1, 9, 'Informacoes diversas', false, true, NULL),
    (858, 1, 9, 'Substituicao estribo', true, true, NULL),
    (859, 1, 9, 'Conserto cabine', true, true, NULL),
    (860, 1, 9, 'Conserto bomba dagua', true, true, NULL),
    (861, 1, 9, 'Substituicao motor', false, true, NULL),
    (862, 1, 9, 'Substituicao cabecote motor', true, true, NULL),
    (863, 1, 9, 'Substituicao bicos injecao', true, true, NULL),
    (864, 1, 9, 'Substituicao cabo freio estacionario', true, true, NULL),
    (865, 1, 9, 'Substituicao coifa/homocinetica', true, true, NULL),
    (866, 1, 9, 'Substituicao interr luz re', true, true, NULL),
    (867, 1, 9, 'Substituicao manopla', true, true, NULL),
    (868, 1, 9, 'Desmontagem/montagem pneu aro 18', true, true, NULL),
    (869, 1, 9, 'Desmontagem/montagem pneu aro 21', true, true, NULL),
    (871, 1, 9, 'Preventiva mensal', true, true, NULL),
    (872, 1, 9, 'Preventiva semestral', true, true, NULL),
    (873, 1, 9, 'Preventiva anual', true, true, NULL),
    (874, 1, 9, 'Preventiva mensal', false, true, NULL),
    (875, 1, 9, 'Preventiva semestral', false, true, NULL),
    (876, 1, 9, 'Preventiva anual', true, true, NULL),
    (877, 1, 9, 'Confeccao componentes', true, true, NULL),
    (878, 1, 9, 'Instalacao manometro', true, true, NULL),
    (879, 1, 9, 'Instalacao registro', true, true, NULL),
    (880, 1, 9, 'Rearme reli�� sobrecorrente', true, true, NULL),
    (881, 1, 9, 'Conserto engate reboque', true, true, NULL),
    (882, 1, 9, 'Substituicao coletor surdina', true, true, NULL),
    (883, 1, 9, 'Remocao componente p/reserva', true, true, NULL),
    (884, 1, 9, 'Conserto surdina', true, true, NULL),
    (885, 1, 9, 'Sangria bicos injecao', true, true, NULL),
    (886, 1, 9, 'Desmontagem/montagem pneu aro 17', true, true, NULL),
    (887, 1, 9, 'Desmontagem/montagem pneu aro 19', true, true, NULL),
    (888, 1, 9, 'Conserto pneu aro 17', true, true, NULL),
    (889, 1, 9, 'Conserto pneu aro 19', true, true, NULL),
    (890, 1, 9, 'Conserto pneu aro 17,5', true, true, NULL),
    (891, 1, 9, 'Substituicao protetor termico', true, true, NULL),
    (892, 1, 9, 'Informacoes diversas', false, true, NULL),
    (893, 1, 9, 'Desmontagem/montagem pneu aro 08', true, true, NULL),
    (894, 1, 9, 'Substituicao gaxetas', false, true, NULL),
    (895, 1, 9, 'Substituicao rolamento', false, true, NULL),
    (896, 1, 9, 'Substituicao selo mecanico', false, true, NULL),
    (897, 1, 9, 'Substituicao rotor', false, true, NULL),
    (898, 1, 9, 'SUBSTITUICAO ACOPLAMENTO', true, false, NULL),
    (899, 1, 9, 'Substituicao lubrificante', false, true, NULL),
    (900, 1, 9, 'Substituicao estator', false, true, NULL),
    (901, 1, 9, 'Substituicao eixo', false, true, NULL),
    (902, 1, 9, 'Substituicao membrana', false, true, NULL),
    (903, 1, 9, 'Substituicao anel oring', false, true, NULL),
    (904, 1, 9, 'Substituicao componentes diversos', false, true, NULL),
    (905, 1, 9, 'Substituicao ventoinha', false, true, NULL),
    (906, 1, 9, 'Substituicao pino elastico', false, true, NULL),
    (907, 1, 9, 'Substituicao retentor', false, true, NULL),
    (908, 1, 9, 'Retirado equipamento', true, true, NULL),
    (909, 1, 9, 'Transporte equipamento p/terceiros', true, true, NULL),
    (910, 1, 9, 'INSTALACAO (CONCLUIDA)', true, false, NULL),
    (911, 1, 9, 'Transporte equipamento', false, true, NULL),
    (912, 1, 9, 'Montagem equipamento', false, true, NULL),
    (913, 1, 9, 'Inspecao', false, true, NULL),
    (914, 1, 9, 'Desmontagem equipamento', false, true, NULL),
    (916, 1, 9, 'Preventiva mensal', false, true, NULL),
    (917, 1, 9, 'Preventiva semestral', false, true, NULL),
    (918, 1, 9, 'Preventiva anual', false, true, NULL),
    (919, 1, 9, 'Confeccao componentes', false, true, NULL),
    (920, 1, 9, 'Instalacao manometro', false, true, NULL),
    (921, 1, 9, 'Instalacao registro', false, true, NULL),
    (922, 1, 9, 'Escorvado', false, true, NULL),
    (923, 1, 9, 'Alinhado', false, true, NULL),
    (924, 1, 9, 'Limpeza interna', false, true, NULL),
    (925, 1, 9, 'Reaperto conexao', false, true, NULL),
    (926, 1, 9, 'Ajuste de fixacao', false, true, NULL),
    (927, 1, 9, 'Limpeza do rotametro', false, true, NULL),
    (928, 1, 9, 'Regulagem modulo de desvio', false, true, NULL),
    (929, 1, 9, 'Alteracao linha produto/ponto aplicacao', false, true, NULL),
    (930, 1, 9, 'Substituicao conexao/tubulacao', false, true, NULL),
    (931, 1, 9, 'Desobstrucao linha produto', false, true, NULL),
    (932, 1, 9, 'Melhoria no equipamento', false, true, NULL),
    (933, 1, 9, 'Regulagens diversas', true, true, NULL),
    (934, 1, 9, 'Checagem dados operacionais', false, true, NULL),
    (935, 1, 9, 'Limpeza externa', false, true, NULL),
    (936, 1, 9, 'Ajuste de gaxetas', false, true, NULL),
    (937, 1, 9, 'Complementado lubrificante', false, true, NULL),
    (938, 1, 9, 'Conserto limp.para-brisa', true, true, NULL),
    (939, 1, 9, 'Substituicao evaporador', true, true, NULL),
    (940, 1, 9, 'Substituicao bandeija', true, true, NULL),
    (941, 1, 9, 'Conserto ventilador', true, true, NULL),
    (942, 1, 9, 'Substituicao equipamento', true, true, NULL),
    (943, 1, 9, 'Desmontagem/montagem pneu aro 10', true, true, NULL),
    (944, 1, 9, 'Desmontagem/montagem pneu aro 25', true, true, NULL),
    (945, 1, 9, 'Verificacao aquecim/mancais/ruidos', true, true, NULL),
    (946, 1, 9, 'Verificacao base/acopl/vazam', true, true, NULL),
    (947, 1, 9, 'Verificacao desg.rotor/corpo/eixo', true, true, NULL),
    (948, 1, 9, 'PINTURA', true, false, NULL),
    (949, 1, 9, 'Verificacao correia/filtro/lubrif.', true, true, NULL),
    (950, 1, 9, 'Substituicao correia/filtro/lubrif.', true, true, NULL),
    (951, 1, 9, 'Verificacao polia/pressost/purga', true, true, NULL),
    (952, 1, 9, 'Verificacao aquecim/cx.lig/rotacao', true, true, NULL),
    (953, 1, 9, 'Verificacao cabos/isolacao/protecoes', true, true, NULL),
    (954, 1, 9, 'Limpeza interna/externa', true, true, NULL),
    (955, 1, 9, 'Verificacao aquecim/conex/protecoes', true, true, NULL),
    (956, 1, 9, 'Copiar programa/parametros', true, true, NULL),
    (957, 1, 9, 'Verificacao corrente/protecoes/rotacao', true, true, NULL),
    (958, 1, 9, 'Verificacao poste/travessa/acessorios', true, true, NULL),
    (959, 1, 9, 'Verificacao nivel oleo/vazamentos', true, true, NULL),
    (960, 1, 9, 'Verificacao alinham/acoplamento', true, true, NULL),
    (961, 1, 9, 'Verificacao rolamento/elem.girantes', true, true, NULL),
    (962, 1, 9, 'Verificacao cabos/correntes/coroa', true, true, NULL),
    (963, 1, 9, 'Verificacao guias/perfis/lubrif', true, true, NULL),
    (964, 1, 9, 'Verificacao reg.vacuo/valvulas', true, true, NULL),
    (965, 1, 9, 'Verificacao filtros/mod.desvio', true, true, NULL),
    (966, 1, 9, 'Verificacao dosadores/ejetores', true, true, NULL),
    (967, 1, 9, 'Substituicao filtros/valvulas', true, true, NULL),
    (968, 1, 9, 'Verificacao ejetores/vacuo', true, true, NULL),
    (969, 1, 9, 'Verificacao mod.desvio/reg.vacuo', true, true, NULL),
    (970, 1, 9, 'Verificacao correias/mancais/lubrif.', true, true, NULL),
    (971, 1, 9, 'Limpeza tubulacao', true, true, NULL),
    (972, 1, 9, 'Verificacao acessos/avisos', true, true, NULL),
    (973, 1, 9, 'Verificacao cabos/correntes/vazamentos', true, true, NULL),
    (974, 1, 9, 'Verificacao isolacao oleo/gas', true, true, NULL),
    (975, 1, 9, 'Conserto pneu aro 12', true, true, NULL),
    (976, 1, 9, 'Verificacao mangote/vazamentos', true, true, NULL),
    (977, 1, 9, 'Identificacao poste cmdo desativado', true, true, NULL),
    (978, 1, 9, 'Processamento fichas trabalho', false, true, NULL),
    (979, 1, 9, 'Processamento fichas trabalho', true, true, NULL),
    (980, 1, 9, 'Verificacao ch.fim-de-curso', true, true, NULL),
    (981, 1, 9, 'Revisao carroceria (diversos)', true, true, NULL),
    (982, 1, 9, 'Conserto sist.eletrico (outros)', true, true, NULL),
    (983, 1, 9, 'Verificacao diagrama eletrico', true, true, NULL),
    (984, 1, 9, 'Verificacao nivel oleo/vazamentos', true, true, NULL),
    (985, 1, 9, 'Conserto coroa/paraf.sem-fim', true, true, NULL),
    (986, 1, 9, 'Confeccao coroa/paraf.sem-fim', true, true, NULL),
    (987, 1, 9, 'Vistoria tecnica', true, true, NULL),
    (988, 1, 9, 'Limpeza externa', false, true, NULL),
    (989, 1, 9, 'Substituicao oleo hidraulico', false, true, NULL),
    (990, 1, 9, 'Verificacao nivel liq.arrefecimento', true, true, NULL),
    (991, 1, 9, 'Afericao geometria', true, true, NULL),
    (992, 1, 9, 'Fornecimento material', false, true, NULL),
    (993, 1, 9, 'Fornecimento material', false, true, NULL),
    (994, 1, 9, 'Fornecimento material', false, true, NULL),
    (995, 1, 9, 'Verificacao conexoes', true, true, NULL),
    (996, 1, 9, 'Conserto pneu aro 18', true, true, NULL),
    (997, 1, 9, 'Conserto pneu aro 21', true, true, NULL),
    (998, 1, 9, 'Lubrificacao valvs/afericao manometros', true, true, NULL),
    (999, 1, 9, 'Inspecao visual int/ext', true, true, NULL),
    (1000, 1, 9, 'Verificacao esp.chapas/juntas vedacao', true, true, NULL),
    (1001, 1, 9, 'Inspecao visual interna', true, true, NULL),
    (1002, 1, 9, 'Teste hidrostatico', true, true, NULL),
    (1003, 1, 9, 'Substituicao rolamento', false, true, NULL),
    (1004, 1, 9, 'Substituicao selo mecanico', false, true, NULL),
    (1005, 1, 9, 'Substituicao retentor', false, true, NULL),
    (1006, 1, 9, 'Substituicao anel vedacao', true, true, NULL),
    (1007, 1, 9, 'Rebobinagem', false, true, NULL),
    (1008, 1, 9, 'Limpeza externa', false, true, NULL),
    (1009, 1, 9, 'Limpeza interna', false, true, NULL),
    (1011, 1, 9, 'Substituicao luva desgaste', true, true, NULL),
    (1012, 1, 9, 'Substituicao crivo/filtro', true, true, NULL),
    (1013, 1, 9, 'Informacoes diversas', false, true, NULL),
    (1014, 1, 9, 'Vistoria tecnica', false, true, NULL),
    (1015, 1, 9, 'Vistoria tecnica', true, true, NULL),
    (1016, 1, 9, 'Substituicao anel desgaste', true, true, NULL),
    (1017, 1, 9, 'Fornecimento material', false, true, NULL),
    (1018, 1, 9, 'Verificacao cabos/polias/roldanas', true, true, NULL),
    (1019, 1, 9, 'Informacoes diversas', false, true, NULL),
    (1020, 1, 9, 'Remocao equipamento', false, true, NULL),
    (1021, 1, 9, 'Rebobinagem', false, true, NULL),
    (1022, 1, 9, 'Manutencao preventiva', false, true, NULL),
    (1023, 1, 9, 'Montagem e desmontagem', true, true, NULL),
    (1024, 1, 9, 'Substituicao botao emergencia', true, true, NULL),
    (1025, 1, 9, 'Substituicao luva protetora', true, true, NULL),
    (1026, 1, 9, 'Substituicao correia', true, true, NULL),
    (1027, 1, 9, 'Manuteni��i��o preventiva', true, true, NULL),
    (1028, 1, 9, 'Usinagem', true, true, NULL),
    (1029, 1, 9, 'ALINHAMENTO', true, false, NULL),
    (1030, 1, 9, 'ATUALIZACAO PATRIMONIAL', true, false, NULL),
    (1031, 1, 9, 'SUBSTITUICAO IHM', true, false, NULL),
    (1032, 1, 9, 'DISPONIBILIDADE DE PESSOAL', true, false, NULL),
    (1033, 1, 9, 'TESTE ISOLAÇÂO (CARCAÇA): BAIXA', true, false, NULL),
    (1034, 1, 9, 'TESTE ISOLAÇÃO (FASES): BAIXA', true, false, NULL),
    (1037, 1, 9, 'DESERNERGIZADO', true, false, NULL),
    (1038, 1, 9, 'ENERGIZADO', true, false, NULL),
    (1039, 1, 9, 'TESTE ISOLAÇÃO OK', true, false, NULL),
    (1040, 1, 9, 'TESTE FUNCIONAMENTO', true, false, NULL),
    (1041, 1, 9, 'DISJUNTOR REARMADO ', true, false, NULL),
    (1042, 1, 9, 'SUBSTITUICAO DISJUNTOR', true, false, NULL),
    (1043, 1, 9, 'FORNECIMENTO ENERGIA ELETRICA', true, false, NULL),
    (1044, 1, 9, 'EXAUSTOR: SUBSTITUICAO FILTRO', true, false, NULL),
    (1045, 1, 9, 'REMOCAO EQUIPAMENTO', true, false, NULL),
    (1046, 1, 9, 'INSTALACAO (INICIO)', true, false, NULL),
    (1047, 1, 9, 'AJUSTES CHAVE SELETORA', true, false, NULL),
    (1048, 1, 9, 'PRESTAÇÃO SERVICOS CONFORME CONTRATO', true, false, '1048'),
    (1049, 1, 9, 'DESMONTAGEM EQUIPTO (INICIO)', true, false, NULL),
    (1050, 1, 9, 'DESMONTAGEM EQUIPTO (ANDAMENTO)', true, false, NULL),
    (1051, 1, 9, 'DESMONTAGEM EQUIPTO (CONCLUIDA)', true, false, NULL),
    (1052, 1, 9, 'MONTAGEM EQUIPTO (INICIO)', true, false, NULL),
    (1053, 1, 9, 'MONTAGEM EQUIPTO (ANDAMENTO)', true, false, NULL),
    (1054, 1, 9, 'MONTAGEM EQUIPTO (CONCLUIDA)', true, false, NULL),
    (1055, 1, 9, 'TESTE COMUNICACAO OK', true, false, NULL),
    (1056, 1, 9, 'TESTE COMUNICACAO (FALHA)', true, false, NULL),
    (1057, 1, 9, 'AJUSTES ESQUEMA ELETRICO', true, false, NULL),
    (1058, 1, 9, 'TRANSPORTE EQUIPAMENTO', true, false, NULL),
    (1059, 1, 9, 'USINAGEM', true, false, NULL),
    (1060, 1, 9, 'SOLDAGEM/SERRALHERIA', true, false, NULL),
    (1061, 1, 9, 'LIGAÇÃO ELÉTRICA EQUIPAMENTO', true, false, NULL),
    (1062, 1, 9, 'REMOCAO COMPONENTE', true, false, NULL),
    (1063, 1, 9, 'TRANSPORTE MATERIAIS', true, false, NULL),
    (1064, 1, 9, '(NAO REALIZADO)', true, false, NULL),
    (1065, 1, 9, 'APROPRIACAO CUSTOS MENSAIS', true, false, NULL),
    (1066, 1, 9, 'IDENTIFICACAO RISCO CHOQUE ELETRICO', true, false, NULL),
    (1067, 1, 9, 'INSTALACAO DISJUNTOR', true, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Start File: 834-cfg_departments.sql
-- =============================================================================
-- Seed Data: cfg_departments
-- Exported: 2026-03-05T17:29:24.602Z
-- Records: 53
-- =============================================================================

INSERT INTO public.cfg_departments (id, code, description, parent_id, company_id, is_available, created_user_id, created_at, updated_user_id, updated_at, deleted_user_id, deleted_at, is_deleted, version)
VALUES
    (1, 'DG', 'Dir Geral', NULL, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (2, 'D-', 'Gestao Desenvolvimento', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (3, 'PLA', 'Planejamento', 2, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (4, 'OB', 'Obras', 2, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (5, 'PR', 'Projetos', 2, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (6, 'TAE', 'Trat Agua Esgoto', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (7, 'TA', 'Trat Agua', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (8, 'TE', 'Trat Esgoto', 6, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (9, 'MAN', 'Manutencao', 6, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (10, 'OP', 'Operacoes', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (11, 'DC', 'Dist Centro', 10, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (12, 'DS', 'Dist Sul', 10, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (13, 'DL', 'Dist Leste', 10, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (14, 'DN', 'Dist Norte', 10, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (15, 'GLOG', 'Lojistica', 10, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (16, 'RC', 'Rel Cliente', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (17, 'AC', 'Atendimento Cliente', 16, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (18, 'ARREC', 'Arrecadacao', 16, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (19, 'CO', 'Consumo', 16, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (20, 'ADM', 'Administrativo', 1, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (21, 'Finan', 'Financeiro', 20, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (22, 'SC', 'Servicos Compartilhados', 20, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (23, 'LC', 'Licitacoes Contratos', 20, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (24, 'SUP', 'Suprimento', 20, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (25, 'GP', 'Gestao Pessoas', 20, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (26, 'GC', 'Distr e Conducao', 6, 1, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (27, 'DG', 'Dir.Geral', NULL, 5, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (28, 'MAN', 'Manutencao', 27, 5, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (29, 'DG', 'Dir.Geral', NULL, 6, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (30, 'MAN', 'Manutencao', 29, 6, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (31, 'DG', 'Dir.Geral', NULL, 7, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (32, 'MAN', 'Manutencao', 31, 7, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (33, 'DG', 'Dir.Geral', NULL, 7, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (34, 'MAN', 'Manutenção', 33, 7, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (35, 'DIR', 'Direção', NULL, 2, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (36, 'MAN', 'Manutencao', 35, 2, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (37, 'DIR', 'Direcao', NULL, 4, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (38, 'MAN', 'Manutencao', 37, 4, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (39, 'DIR', 'Direcao', NULL, 8, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (40, 'MAN', 'Manutencao', 39, 8, true, NULL, '2024-07-20T02:39:03.196826', NULL, NULL, NULL, NULL, false, 'live'),
    (41, 'DIR', 'Direção', NULL, 9, true, 124, '2024-12-20T18:41:08', NULL, NULL, NULL, NULL, false, 'live'),
    (42, 'MAN', 'Manutenção', 41, 9, true, 124, '2024-12-20T18:42:10', NULL, NULL, NULL, NULL, false, 'live'),
    (43, 'DIR', 'Direção', NULL, 10, true, 124, '2024-12-21T16:44:23.68478', NULL, NULL, NULL, NULL, false, 'live'),
    (44, 'MAN', 'Manutenção', NULL, 10, true, 124, '2024-12-21T13:45:11', NULL, NULL, NULL, NULL, false, 'live'),
    (45, 'MAN', 'Manutenção', NULL, 11, true, 124, '2024-12-21T14:18:00', NULL, NULL, NULL, NULL, false, 'live'),
    (46, 'MAN', 'Manutenção', NULL, 12, true, 124, '2024-12-21T14:32:40', NULL, NULL, NULL, NULL, false, 'live'),
    (47, 'MAN', 'Manutenção', NULL, 13, true, 124, '2024-12-21T14:41:31', NULL, NULL, NULL, NULL, false, 'live'),
    (48, 'MAN', 'Manutenção', NULL, 14, true, 124, '2024-12-21T15:43:29', NULL, NULL, NULL, NULL, false, 'live'),
    (49, 'MAN', 'Manutenção', NULL, 15, true, 124, '2024-12-21T15:59:15', NULL, NULL, NULL, NULL, false, 'live'),
    (50, 'ADM', 'Administrativo', NULL, 16, true, 124, '2025-07-07T14:32:53', NULL, NULL, NULL, NULL, false, 'live'),
    (51, 'SERV', 'Serviços', NULL, 19, true, NULL, '2025-08-22T14:16:25.051329', NULL, NULL, NULL, NULL, false, 'live'),
    (52, 'Distribuicao', 'Distribuicao', 51, 19, true, 124, '2025-08-22T11:16:58', NULL, NULL, NULL, NULL, false, 'live'),
    (53, 'ADM', 'ADMINISTRATIVO', NULL, 17, true, 124, '2025-10-05T12:01:25', NULL, NULL, NULL, NULL, false, 'live')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Section: database-structure/01-core-schema
-- =============================================================================

-- Start File: 076-create-materials-table.sql
-- =============================================================================
-- Table: materials
-- Exported: 2026-03-05T17:29:31.755Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.materials CASCADE;

CREATE TABLE IF NOT EXISTS public.materials (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_materials_created_at ON public.materials(created_at);
-- CREATE INDEX idx_materials_user_id ON public.materials(user_id);

-- Start File: 181-create-schema_migrations-table.sql
-- =============================================================================
-- Table: schema_migrations
-- Exported: 2026-03-05T17:29:32.034Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.schema_migrations CASCADE;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version bigint,
    inserted_at timestamp without time zone DEFAULT now()
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_schema_migrations_created_at ON public.schema_migrations(created_at);
-- CREATE INDEX idx_schema_migrations_user_id ON public.schema_migrations(user_id);

-- Start File: 214-create-cfg_app-table.sql
-- =============================================================================
-- Table: cfg_app
-- Description: Application version configuration table
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_app CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_app (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    apk_url character varying NOT NULL,
    version_app character varying NOT NULL,
    logo_url character varying,
    version_app_offline character varying DEFAULT '1'::character varying,
    n8n_available_last_at timestamp without time zone,
    version_app_mask character varying,
    PRIMARY KEY (id)
);

-- Start File: 247-create-contracts-table.sql
-- =============================================================================
-- Table: contracts
-- Exported: 2026-03-05T17:29:30.537Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.contracts CASCADE;

CREATE TABLE IF NOT EXISTS public.contracts (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    client_company_id integer,
    client_department_id integer,
    provider_company_id integer,
    provider_department_id integer,
    description character varying(255),
    is_available boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    code character varying(255),
    status_id integer,
    created_user_id integer,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id text,
    updated_date text,
    deleted_user_id text,
    deleted_date text,
    is_dev boolean DEFAULT false,
    version character varying(255),
    default_ov_asset_id integer,
    default_activity_id integer,
    date_start text,
    date_end text,
    total_value text,
    client_id integer,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_contracts_created_at ON public.contracts(created_at);
-- CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);

-- Start File: 263-create-cfg_services-table.sql
-- =============================================================================
-- Table: cfg_services
-- Exported: 2026-03-05T17:29:28.268Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_services CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_services (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_services_created_at ON public.cfg_services(created_at);
-- CREATE INDEX idx_cfg_services_user_id ON public.cfg_services(user_id);

-- Start File: 292-create-extensions-table.sql
-- =============================================================================
-- Table: extensions
-- Exported: 2026-03-05T17:29:31.444Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.extensions CASCADE;

CREATE TABLE IF NOT EXISTS public.extensions (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    type character varying(255),
    settings jsonb,
    tenant_external_id character varying(255),
    inserted_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_extensions_created_at ON public.extensions(created_at);
-- CREATE INDEX idx_extensions_user_id ON public.extensions(user_id);

-- Start File: 330-create-cfg_units_types-table.sql
-- =============================================================================
-- Table: cfg_units_types
-- Exported: 2026-03-05T17:29:29.194Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_units_types CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_units_types (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_units_types_created_at ON public.cfg_units_types(created_at);
-- CREATE INDEX idx_cfg_units_types_user_id ON public.cfg_units_types(user_id);

-- Start File: 346-create-cfg_users_statuses-table.sql
-- =============================================================================
-- Table: cfg_users_statuses
-- Exported: 2026-03-05T17:29:29.476Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_users_statuses CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_users_statuses (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_users_statuses_created_at ON public.cfg_users_statuses(created_at);
-- CREATE INDEX idx_cfg_users_statuses_user_id ON public.cfg_users_statuses(user_id);

-- Start File: 407-create-cfg_systems-table.sql
-- =============================================================================
-- Table: cfg_systems
-- Exported: 2026-03-05T17:29:28.557Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_systems CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_systems (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    company_id integer,
    parent_id integer,
    code character varying(255),
    description character varying(255),
    is_available boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_user_id text,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id text,
    updated_date text,
    deleted_user_id text,
    deleted_date text,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_systems_created_at ON public.cfg_systems(created_at);
-- CREATE INDEX idx_cfg_systems_user_id ON public.cfg_systems(user_id);

-- Start File: 431-create-cfg_contracts_statuses-table.sql
-- =============================================================================
-- Table: cfg_contracts_statuses
-- Exported: 2026-03-05T17:29:27.628Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_contracts_statuses CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_contracts_statuses (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_contracts_statuses_created_at ON public.cfg_contracts_statuses(created_at);
-- CREATE INDEX idx_cfg_contracts_statuses_user_id ON public.cfg_contracts_statuses(user_id);

-- Start File: 461-create-cfg_units_statuses-table.sql
-- =============================================================================
-- Table: cfg_units_statuses
-- Exported: 2026-03-05T17:29:28.833Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_units_statuses CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_units_statuses (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    code character varying(255),
    description character varying(255),
    color text,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_units_statuses_created_at ON public.cfg_units_statuses(created_at);
-- CREATE INDEX idx_cfg_units_statuses_user_id ON public.cfg_units_statuses(user_id);

-- Start File: 528-create-clients-table.sql
-- =============================================================================
-- Table: clients
-- Exported: 2026-03-05T17:29:29.938Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.clients CASCADE;

CREATE TABLE IF NOT EXISTS public.clients (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    name character varying(255),
    code character varying(255),
    email text,
    mobile text,
    address text,
    img_file_path text,
    img_file_name text,
    is_available boolean DEFAULT false,
    created_user_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at text,
    updated_user_id text,
    deleted_at text,
    deleted_user_id text,
    is_deleted boolean DEFAULT false,
    company_id text,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_clients_created_at ON public.clients(created_at);
-- CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Start File: 583-create-units-table.sql
-- =============================================================================
-- Table: units
-- Exported: 2026-03-05T17:29:32.473Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.units CASCADE;

CREATE TABLE IF NOT EXISTS public.units (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_units_created_at ON public.units(created_at);
-- CREATE INDEX idx_units_user_id ON public.units(user_id);

-- Start File: 632-create-users-table.sql
-- =============================================================================
-- Table: users
-- Exported: 2026-03-05T17:29:33.090Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE IF NOT EXISTS public.users (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    email character varying(255),
    name_full character varying(255),
    name_short character varying(255),
    mobile character varying(255),
    phone text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    updated_user_id text,
    team_id integer,
    is_team_leader boolean DEFAULT false,
    img_file_path character varying(255),
    company_id text,
    department_id text,
    token_fcm text,
    uuid uuid DEFAULT gen_random_uuid(),
    status_id integer,
    is_admin boolean DEFAULT false,
    is_admin_super boolean DEFAULT false,
    code text,
    version_app text,
    img_file_name character varying(255),
    team_id_previous integer,
    ov_in_progress_leader_id integer,
    profile_id integer,
    vehicle_id text,
    is_available boolean DEFAULT false,
    is_ov_in_progress boolean DEFAULT false,
    team_amount integer,
    version_offline_user text,
    version_offline_app text,
    o_contract_id_in_progress integer,
    o_type_id_in_progress integer,
    o_type_sub_id_in_progress integer,
    o_plan_id_in_progress integer,
    o_asset_tag_id_in_progress integer,
    o_unit_id_in_progress integer,
    o_system_id_in_progress integer,
    o_system_parent_id_in_progress integer,
    o_unit_type_id_in_progress integer,
    o_unit_type_parent_id_in_progress integer,
    o_object_id_in_progress integer,
    ov_id_in_progress integer,
    o_id_in_progress integer,
    op_id_in_progress integer,
    notifications_amount integer,
    mobile_full character varying(255),
    mobile_mask character varying(255),
    mobile_whatsapp character varying(255),
    migrated_at timestamp without time zone DEFAULT now(),
    latitude numeric,
    longitude numeric,
    tracker_at timestamp without time zone DEFAULT now(),
    ov_id_in_progress_mask text,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_users_created_at ON public.users(created_at);
-- CREATE INDEX idx_users_user_id ON public.users(user_id);

-- Start File: 639-create-vehicles-table.sql
-- =============================================================================
-- Table: vehicles
-- Exported: 2026-03-05T17:29:33.364Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.vehicles CASCADE;

CREATE TABLE IF NOT EXISTS public.vehicles (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at);
-- CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);

-- Start File: 808-create-cfg_activities-table.sql
-- =============================================================================
-- Table: cfg_activities
-- Exported: 2026-03-05T17:29:27.277Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_activities CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_activities (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    company_id integer,
    department_id integer,
    description character varying(255),
    is_available boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    code text,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_activities_created_at ON public.cfg_activities(created_at);
-- CREATE INDEX idx_cfg_activities_user_id ON public.cfg_activities(user_id);

-- Start File: 834-create-cfg_departments-table.sql
-- =============================================================================
-- Table: cfg_departments
-- Exported: 2026-03-05T17:29:27.901Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_departments CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_departments (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    code character varying(255),
    description character varying(255),
    parent_id text,
    company_id integer,
    is_available boolean DEFAULT false,
    created_user_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id text,
    updated_at text,
    deleted_user_id text,
    deleted_at text,
    is_deleted boolean DEFAULT false,
    version character varying(255),
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_departments_created_at ON public.cfg_departments(created_at);
-- CREATE INDEX idx_cfg_departments_user_id ON public.cfg_departments(user_id);

-- Start File: 968-create-documents-table.sql
-- =============================================================================
-- Table: documents
-- Exported: 2026-03-05T17:29:31.133Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.documents CASCADE;

CREATE TABLE IF NOT EXISTS public.documents (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_documents_created_at ON public.documents(created_at);
-- CREATE INDEX idx_documents_user_id ON public.documents(user_id);

-- Start File: 980-create-contracts_managers-table.sql
-- =============================================================================
-- Table: contracts_managers
-- Exported: 2026-03-05T17:29:30.795Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.contracts_managers CASCADE;

CREATE TABLE IF NOT EXISTS public.contracts_managers (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    contract_id integer,
    manager_id integer,
    is_deleted boolean DEFAULT false,
    version_mode character varying(255),
    created_user_id text,
    created_at text,
    deleted_user_id text,
    deleted_at text,
    role character varying(255),
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_contracts_managers_created_at ON public.contracts_managers(created_at);
-- CREATE INDEX idx_contracts_managers_user_id ON public.contracts_managers(user_id);

-- =============================================================================
-- Section: database-structure/02-business-schema
-- =============================================================================

-- Start File: 062-create-v_orders-table.sql
-- =============================================================================
-- Table: v_orders
-- Exported: 2026-03-05T17:29:37.197Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.v_orders CASCADE;

CREATE TABLE IF NOT EXISTS public.v_orders (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    uid text,
    parent_id text,
    company_id integer,
    company_description character varying(255),
    company_img_file_path character varying(255),
    company_img_file_name character varying(255),
    img_file_path character varying(255),
    img_file_name character varying(255),
    department_id integer,
    contract_id text,
    contract_description text,
    provider_company_id text,
    provider_company_description text,
    provider_company_img_file_path text,
    provider_company_img_file_name text,
    provider_department_id text,
    order_mask character varying(255),
    type_id integer,
    type_code character varying(255),
    type_description character varying(255),
    type_sub_id text,
    type_sub_code text,
    type_sub_description text,
    requested_services character varying(255),
    object_id text,
    object_code text,
    object_description text,
    system_parent_id integer,
    system_parent_description character varying(255),
    system_parent_code character varying(255),
    system_id integer,
    system_description character varying(255),
    system_code character varying(255),
    unit_type_parent_id integer,
    unit_type_parent_description character varying(255),
    unit_type_parent_code character varying(255),
    unit_type_id integer,
    unit_type_description character varying(255),
    unit_type_code character varying(255),
    unit_id integer,
    unit_description character varying(255),
    unit_address character varying(255),
    unit_latitude numeric,
    unit_longitude numeric,
    requester_name character varying(255),
    requester_phone character varying(20),
    requester_team_id integer,
    requester_team_code character varying(255),
    requested_at timestamp without time zone DEFAULT now(),
    status_id integer,
    status_code character varying(255),
    status_description character varying(255),
    status_at timestamp without time zone DEFAULT now(),
    priority_id integer,
    priority_code character varying(255),
    priority_description character varying(255),
    team_leader_id text,
    team_leader_name_short text,
    team_leader_email text,
    team_id text,
    team_code text,
    team_description text,
    asset_tag_id integer,
    asset_tag_description character varying(255),
    year integer,
    counter_parent integer,
    counter_child integer,
    cause_reason_id text,
    cause_reason_description text,
    suspended_reason_id text,
    suspended_reason_description text,
    cancel_reason_id text,
    cancel_reason_description text,
    canceled_team_id text,
    canceled_team_code text,
    canceled_user_name_short text,
    plan_id text,
    plan_description text,
    plan_code text,
    services_value integer,
    materials_value integer,
    vehicles_value integer,
    total_value integer,
    version_mode character varying(255),
    created_user_id integer,
    ov_counter integer,
    progress integer,
    contract_code text,
    unit_code character varying(255),
    img_files_names jsonb,
    client_name character varying(255),
    client_id integer,
    unit_asset_tag_id integer,
    asset_tag_sub_id integer,
    unit_asset_tag_has_order boolean DEFAULT false,
    unit_asset_tag_no_has_order_user_id text,
    unit_asset_tag_no_has_order_at text,
    asset_tag_sub_description character varying(255),
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_v_orders_created_at ON public.v_orders(created_at);
-- CREATE INDEX idx_v_orders_user_id ON public.v_orders(user_id);

-- Start File: 144-create-cfg_assets_types-table.sql
-- =============================================================================
-- Table: cfg_assets_types
-- Exported: 2026-03-05T17:29:34.912Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_assets_types CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_assets_types (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_assets_types_created_at ON public.cfg_assets_types(created_at);
-- CREATE INDEX idx_cfg_assets_types_user_id ON public.cfg_assets_types(user_id);

-- Start File: 162-create-assets_attributes_values-table.sql
-- =============================================================================
-- Table: assets_attributes_values
-- Exported: 2026-03-05T17:29:34.065Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.assets_attributes_values CASCADE;

CREATE TABLE IF NOT EXISTS public.assets_attributes_values (
    asset_id integer,
    field_key character varying(255),
    value character varying(255)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_assets_attributes_values_created_at ON public.assets_attributes_values(created_at);
-- CREATE INDEX idx_assets_attributes_values_user_id ON public.assets_attributes_values(user_id);

-- Start File: 182-create-v_assets_types-table.sql
-- =============================================================================
-- Table: v_assets_types
-- Exported: 2026-03-05T17:29:36.417Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.v_assets_types CASCADE;

CREATE TABLE IF NOT EXISTS public.v_assets_types (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    company_id integer,
    code character varying(255),
    description character varying(255),
    is_available boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_v_assets_types_created_at ON public.v_assets_types(created_at);
-- CREATE INDEX idx_v_assets_types_user_id ON public.v_assets_types(user_id);

-- Start File: 331-create-orders-table.sql
-- =============================================================================
-- Table: orders
-- Exported: 2026-03-05T17:29:35.188Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.orders CASCADE;

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_orders_created_at ON public.orders(created_at);
-- CREATE INDEX idx_orders_user_id ON public.orders(user_id);

-- Start File: 392-create-cfg_assets_tags_subs-table.sql
-- =============================================================================
-- Table: cfg_assets_tags_subs
-- Exported: 2026-03-05T17:29:34.605Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_assets_tags_subs CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_assets_tags_subs (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    company_id integer,
    code character varying(255),
    description character varying(255),
    is_available boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_assets_tags_subs_created_at ON public.cfg_assets_tags_subs(created_at);
-- CREATE INDEX idx_cfg_assets_tags_subs_user_id ON public.cfg_assets_tags_subs(user_id);

-- Start File: 396-create-v_assets-table.sql
-- =============================================================================
-- Table: v_assets
-- Exported: 2026-03-05T17:29:35.917Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.v_assets CASCADE;

CREATE TABLE IF NOT EXISTS public.v_assets (
    company_id integer,
    company_description character varying(255),
    company_owner_description character varying(255),
    company_owner_id integer,
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    code character varying(255),
    description character varying(255),
    searchable character varying(255),
    tag_id integer,
    tag_description character varying(255),
    tag_sub_id integer,
    tag_sub_description character varying(255),
    unit_asset_tag_id integer,
    location character varying(255),
    unit_id integer,
    unit_code character varying(255),
    unit_description character varying(255),
    status_id integer,
    status_description character varying(255),
    status_code character varying(255),
    status_at timestamp without time zone DEFAULT now(),
    type_id integer,
    type_description character varying(255),
    priority_id integer,
    priority_code character varying(255),
    priority_description character varying(255),
    brand character varying(255),
    model character varying(255),
    serial character varying(255),
    power integer,
    power_unit character varying(255),
    voltage character varying(255),
    voltage_unit character varying(255),
    amperage character varying(255),
    amperage_unit character varying(255),
    poles integer,
    poles_unit character varying(255),
    rotation integer,
    rotation_unit character varying(255),
    service_factor integer,
    pressure_max text,
    pressure_min text,
    pressure_operation text,
    pressure_unit text,
    flow_rate_max text,
    flow_rate_min text,
    flow_rate_operation text,
    flow_rate_unit text,
    rotor_diameter text,
    rotor_diameter_unit text,
    weight integer,
    weight_unit character varying(255),
    coupling_model_id text,
    coupling_model_description text,
    comments character varying(255),
    acquisition_at timestamp without time zone DEFAULT now(),
    acquisition_value integer,
    img_file_path text,
    img_file_name text,
    img_file_name_thumb text,
    version_mode character varying(255),
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_v_assets_created_at ON public.v_assets(created_at);
-- CREATE INDEX idx_v_assets_user_id ON public.v_assets(user_id);

-- Start File: 714-create-cfg_assets_tags-table.sql
-- =============================================================================
-- Table: cfg_assets_tags
-- Exported: 2026-03-05T17:29:34.300Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.cfg_assets_tags CASCADE;

CREATE TABLE IF NOT EXISTS public.cfg_assets_tags (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_cfg_assets_tags_created_at ON public.cfg_assets_tags(created_at);
-- CREATE INDEX idx_cfg_assets_tags_user_id ON public.cfg_assets_tags(user_id);

-- Start File: 784-create-v_orders_types-table.sql
-- =============================================================================
-- Table: v_orders_types
-- Exported: 2026-03-05T17:29:37.514Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.v_orders_types CASCADE;

CREATE TABLE IF NOT EXISTS public.v_orders_types (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    department_id integer,
    code character varying(255),
    description character varying(255),
    is_deleted boolean DEFAULT false,
    is_available boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_v_orders_types_created_at ON public.v_orders_types(created_at);
-- CREATE INDEX idx_v_orders_types_user_id ON public.v_orders_types(user_id);

-- Start File: 997-create-assets-table.sql
-- =============================================================================
-- Table: assets
-- Exported: 2026-03-05T17:29:33.745Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.assets CASCADE;

CREATE TABLE IF NOT EXISTS public.assets (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_assets_created_at ON public.assets(created_at);
-- CREATE INDEX idx_assets_user_id ON public.assets(user_id);

-- Start File: 998-create-orders_visits-table.sql
-- =============================================================================
-- Table: orders_visits
-- Exported: 2026-03-05T17:12:18.405Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.orders_visits CASCADE;

CREATE TABLE IF NOT EXISTS public.orders_visits (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp DEFAULT now()

);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_orders_visits_created_at ON public.orders_visits(created_at);
-- CREATE INDEX idx_orders_visits_user_id ON public.orders_visits(user_id);

-- Start File: 999-create-assets_alerts-table.sql
-- =============================================================================
-- Table: assets_alerts
-- =============================================================================

DROP TABLE IF EXISTS public.assets_alerts CASCADE;

CREATE TABLE IF NOT EXISTS public.assets_alerts (
    id bigint GENERATED BY DEFAULT AS IDENTITY,
    asset_id bigint,
    o_type_id bigint,
    priority_id bigint,
    description text,
    is_done boolean DEFAULT false,
    ova_id bigint,
    created_user_id bigint,
    created_at timestamp DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp
);

-- Indexes (add based on your query patterns):
CREATE INDEX IF NOT EXISTS idx_assets_alerts_asset_id ON public.assets_alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_alerts_ova_id ON public.assets_alerts(ova_id);
CREATE INDEX IF NOT EXISTS idx_assets_alerts_is_done_deleted ON public.assets_alerts(is_done, is_deleted);

-- =============================================================================
-- Section: database-structure/03-views
-- =============================================================================

-- Start File: 062-create-v_orders-view.sql
-- =============================================================================
-- View: v_orders
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders CASCADE;

-- Inferred columns from sample data:
-- id, uid, parent_id, company_id, company_description, company_img_file_path, company_img_file_name, img_file_path, img_file_name, department_id, contract_id, contract_description, provider_company_id, provider_company_description, provider_company_img_file_path, provider_company_img_file_name, provider_department_id, order_mask, type_id, type_code, type_description, type_sub_id, type_sub_code, type_sub_description, requested_services, object_id, object_code, object_description, system_parent_id, system_parent_description, system_parent_code, system_id, system_description, system_code, unit_type_parent_id, unit_type_parent_description, unit_type_parent_code, unit_type_id, unit_type_description, unit_type_code, unit_id, unit_description, unit_address, unit_latitude, unit_longitude, requester_name, requester_phone, requester_team_id, requester_team_code, requested_at, status_id, status_code, status_description, status_at, priority_id, priority_code, priority_description, team_leader_id, team_leader_name_short, team_leader_email, team_id, team_code, team_description, asset_tag_id, asset_tag_description, year, counter_parent, counter_child, cause_reason_id, cause_reason_description, suspended_reason_id, suspended_reason_description, cancel_reason_id, cancel_reason_description, canceled_team_id, canceled_team_code, canceled_user_name_short, plan_id, plan_description, plan_code, services_value, materials_value, vehicles_value, total_value, version_mode, created_user_id, ov_counter, progress, contract_code, unit_code, img_files_names, client_name, client_id, unit_asset_tag_id, asset_tag_sub_id, unit_asset_tag_has_order, unit_asset_tag_no_has_order_user_id, unit_asset_tag_no_has_order_at, asset_tag_sub_description

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_orders'::regclass, true);

CREATE OR REPLACE VIEW public.v_orders AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 158-create-v_companies-view.sql
-- =============================================================================
-- View: v_companies
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_companies CASCADE;

-- Inferred columns from sample data:
-- id, code, description, img_file_path, img_file_name, is_available, email_sufix

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_companies'::regclass, true);

CREATE OR REPLACE VIEW public.v_companies AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 176-create-v_departments-view.sql
-- =============================================================================
-- View: v_departments
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_departments CASCADE;

-- Inferred columns from sample data:
-- id, code, description, parent_id, company_id, is_available, created_user_id, created_at, updated_user_id, updated_at, deleted_user_id, deleted_at, is_deleted, version

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_departments'::regclass, true);

CREATE OR REPLACE VIEW public.v_departments AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 341-create-v_teams-view.sql
-- =============================================================================
-- View: v_teams
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_teams CASCADE;

-- Inferred columns from sample data:
-- id, parent_id, code, description, department_id, is_available, img_url, users_total, company_id, created_user_id, created_at, updated_user_id, updated_at, deleted_user_id, deleted_at, is_deleted, version

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_teams'::regclass, true);

CREATE OR REPLACE VIEW public.v_teams AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 396-create-v_assets-view.sql
-- =============================================================================
-- View: v_assets
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_assets CASCADE;

-- Inferred columns from sample data:
-- company_id, company_description, company_owner_description, company_owner_id, id, code, description, searchable, tag_id, tag_description, tag_sub_id, tag_sub_description, unit_asset_tag_id, location, unit_id, unit_code, unit_description, status_id, status_description, status_code, status_at, type_id, type_description, priority_id, priority_code, priority_description, brand, model, serial, power, power_unit, voltage, voltage_unit, amperage, amperage_unit, poles, poles_unit, rotation, rotation_unit, service_factor, pressure_max, pressure_min, pressure_operation, pressure_unit, flow_rate_max, flow_rate_min, flow_rate_operation, flow_rate_unit, rotor_diameter, rotor_diameter_unit, weight, weight_unit, coupling_model_id, coupling_model_description, comments, acquisition_at, acquisition_value, img_file_path, img_file_name, img_file_name_thumb, version_mode

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_assets'::regclass, true);

CREATE OR REPLACE VIEW public.v_assets AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 400-create-v_contracts-view.sql
-- =============================================================================
-- View: v_contracts
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_contracts CASCADE;

-- Inferred columns from sample data:
-- id, client_company_id, client_company_description, client_department_id, provider_company_id, provider_company_description, provider_company_code, provider_company_img_file_name, provider_company_img_file_path, provider_department_id, code, description, status_id, status_code, status_description, is_available, is_deleted, version, default_ov_asset_id, default_activity_id, client_id

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_contracts'::regclass, true);

CREATE OR REPLACE VIEW public.v_contracts AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 424-create-v_app-view.sql
-- =============================================================================
-- View: v_app
-- Description: Application version configuration view
-- =============================================================================

DROP VIEW IF EXISTS public.v_app CASCADE;

CREATE OR REPLACE VIEW public.v_app AS
 SELECT cfg_app.id,
    cfg_app.apk_url,
    cfg_app.version_app,
    cfg_app.version_app_mask,
    cfg_app.logo_url,
    cfg_app.version_app_offline,
    cfg_app.n8n_available_last_at
   FROM public.cfg_app;

-- Start File: 791-create-v_orders_visits-view.sql
-- =============================================================================
-- View: v_orders_visits
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders_visits CASCADE;

-- Inferred columns from sample data:
-- id, o_id, ov_mask, o_mask, o_unit_id, o_type_id, o_type_code, o_type_description, o_type_sub_id, o_type_sub_code, o_type_sub_description, o_unit_description, o_unit_address, o_unit_type_parent_id, o_requested_at, o_requested_services, o_requester_name, o_requester_phone, o_requester_team_code, o_status_id, o_status_description, op_id, o_system_parent_id, o_system_id, o_object_id, o_object_code, o_object_description, o_plan_id, o_plan_code, o_plan_description, o_asset_tag_id, o_asset_tag_description, o_contract_id, o_contract_description, o_provider_company_id, o_provider_company_description, o_provider_company_img_file_path, o_provider_company_img_file_name, o_priority_id, o_priority_code, o_priority_description, o_cause_reason_id, o_cause_reason_description, services_value, materials_value, vehicles_value, total_value, ov_started_at, ov_ended_at, ov_duration_hours, ov_status_id, ov_status_description, ov_processing_id, ov_processing_description, o_team_id, o_team_leader_name_short, o_team_code, ov_team_leader_id, ov_team_leader_name_short, is_canceled, ov_comments, ov_services_value, ov_materials_value, ov_vehicles_value, ov_total_value, ov_is_filed, ov_assets_amount, ov_assets_draft_amount, ov_assets_reported_amount, ov_assets_disapproved_amount, ov_assets_approved_filed_amount, ov_team_amount, ov_team_names_short, ov_rpt_file_path, ov_rpt_file_name, ov_img_file_path, ov_img_file_name, ov_pdf_file_path, ov_pdf_file_name, ov_o_status_id, ov_o_status_description, ov_o_suspended_reason_id, ov_o_suspended_reason_description, ov_o_progress, ov_reported_at, ov_reported_user_name_short, ov_revised_at, ov_revised_user_name_short, ov_disapproved_at, ov_disapproved_user_name_short, ov_approved_at, ov_approved_user_name_short, version_mode, is_extra, ov_assets_approved_no_filed_amount, ov_approved_filed_user_id, ov_approved_filed_at, ov_approved_filed_user_name_short, o_unit_type_id, ov_is_deleted, ov_payment_at, ov_payment_invoices, o_client_id, o_client_name, o_asset_tag_sub_id, o_asset_tag_sub_description

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_orders_visits'::regclass, true);

CREATE OR REPLACE VIEW public.v_orders_visits AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- Start File: 935-create-v_users-view.sql
-- =============================================================================
-- View: v_users
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_users CASCADE;

-- Inferred columns from sample data:
-- id, uuid, company_id, company_code, company_description, company_img_file_path, company_img_file_name, company_email_sufix, company_is_available, department_id, department_code, department_description, email, name_short, name_full, team_id, team_code, team_description, team_amount, team_id_previous, status_id, status_code, status_description, is_team_leader, is_admin, is_admin_super, img_file_path, img_file_name, ov_id_in_progress, ov_id_in_progress_mask, o_id_in_progress, op_id_in_progress, ov_in_progress_leader_id, profile_id, profile_description, vehicle_id, is_available, is_ov_in_progress, version_app, o_contract_id_in_progress, o_type_id_in_progress, o_type_sub_id_in_progress, o_plan_id_in_progress, o_asset_tag_id_in_progress, o_unit_id_in_progress, o_system_id_in_progress, o_system_parent_id_in_progress, o_unit_type_id_in_progress, o_object_id_in_progress, token_fcm, notifications_amount, mobile, mobile_full, mobile_mask, mobile_whatsapp, latitude, longitude

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_users'::regclass, true);

CREATE OR REPLACE VIEW public.v_users AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

-- =============================================================================
-- Section: database-structure/04-functions
-- =============================================================================

-- Start File: 001-functions-placeholder.sql
-- =============================================================================
-- PostgreSQL Functions
-- Note: Function definitions require direct database access
-- =============================================================================

-- Common Supabase functions (add your custom ones here):

-- Example:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- LANGUAGE plpgsql;

-- =============================================================================
-- Section: database-structure/05-triggers
-- =============================================================================

-- Start File: 001-triggers-placeholder.sql
-- =============================================================================
-- Triggers
-- Note: Trigger definitions require direct database access
-- =============================================================================

-- Common triggers (add your custom ones here):

-- Example:
-- CREATE TRIGGER update_updated_at
-- BEFORE UPDATE ON users
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Section: database-structure/06-policies
-- =============================================================================

-- Start File: 001-policies-placeholder.sql
-- =============================================================================
-- RLS Policies
-- Note: Policy definitions may be incomplete via REST API
-- =============================================================================

-- Enable RLS on tables:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Common policies (add your custom ones here):

-- Example:
-- CREATE POLICY "Users can view own data"
-- ON users FOR SELECT
-- USING (auth.uid() = id);
