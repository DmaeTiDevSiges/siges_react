-- =============================================================================
-- SEED DATA: Grupos de Opções para Atributos Select
-- =============================================================================
-- Estrutura hierárquica:
--   Grupos (pai): parent_id IS NULL → aparecem no dropdown "Grupo de Opções"
--   Opções (filho): parent_id = id_do_grupo → aparecem no select do ativo
--
-- ATENÇÃO: Execute primeiro a migration 20260811_create_cfg_assets_attributes_groups.sql

-- 1. GRUPOS (pais) - Aparecem no dropdown ao cadastrar atributo
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available)
VALUES
    ('Marca', 'Fabricante / Marca do equipamento', true),
    ('Combustível', 'Tipo de combustível', true),
    ('Tensão', 'Tensão de operação', true),
    ('Cor', 'Cor do equipamento', true),
    ('Status Operacional', 'Status de operação do equipamento', true)
ON CONFLICT (group_name) WHERE parent_id IS NULL
DO UPDATE SET description = EXCLUDED.description, is_available = EXCLUDED.is_available;

-- 2. OPÇÕES (filhos) - Aparecem no select ao preencher o ativo

-- Opções de Marca
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'WEG', 'Fabricante WEG', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Siemens', 'Fabricante Siemens', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'ABB', 'Fabricante ABB', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Opções de Combustível
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Diesel', 'Diesel S-10', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Gasolina', 'Gasolina comum', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Elétrico', 'Movimento elétrico', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Opções de Tensão
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '127V', 'Tensão 127V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '220V', 'Tensão 220V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '380V', 'Tensão 380V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Opções de Cor
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Azul', 'Cor azul', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Vermelho', 'Cor vermelha', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Verde', 'Cor verde', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Opções de Status Operacional
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Operando', 'Equipamento em operação', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Parado', 'Equipamento parado', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Em Manutenção', 'Equipamento em manutenção', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
