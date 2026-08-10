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

