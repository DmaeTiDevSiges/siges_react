-- =====================================================
-- SCRIPT COMPLETO: Grupos de Opções para Atributos Select
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar colunas na tabela de atributos
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options JSONB DEFAULT NULL;

ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options_group_id BIGINT NULL;

COMMENT ON COLUMN cfg_assets_attributes.select_options IS
'Opções inline para campos do tipo select. Formato: [{"value":"...","label":"..."}]';

COMMENT ON COLUMN cfg_assets_attributes.select_options_group_id IS
'FK para cfg_assets_attributes_groups. Quando preenchido, as opções do select vêm deste grupo.';

-- 2. Criar tabela de grupos
CREATE TABLE IF NOT EXISTS public.cfg_assets_attributes_groups (
    id BIGSERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    parent_id BIGINT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfg_assets_attributes_groups_group_name_unique
ON cfg_assets_attributes_groups (group_name)
WHERE parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_cfg_assets_attributes_groups_parent_id
ON cfg_assets_attributes_groups (parent_id);

-- 3. FK
ALTER TABLE cfg_assets_attributes
DROP CONSTRAINT IF EXISTS cfg_assets_attributes_select_options_group_id_fkey;

ALTER TABLE cfg_assets_attributes
ADD CONSTRAINT cfg_assets_attributes_select_options_group_id_fkey
FOREIGN KEY (select_options_group_id)
REFERENCES public.cfg_assets_attributes_groups(id)
ON DELETE SET NULL;

-- 4. RLS
ALTER TABLE cfg_assets_attributes_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissive" ON cfg_assets_attributes_groups;
CREATE POLICY "Permissive" ON cfg_assets_attributes_groups USING (true);

-- 5. GRUPOS (pais)
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available)
VALUES
    ('Marca', 'Fabricante / Marca do equipamento', true),
    ('Combustível', 'Tipo de combustível', true),
    ('Tensão', 'Tensão de operação', true),
    ('Cor', 'Cor do equipamento', true),
    ('Status Operacional', 'Status de operação do equipamento', true)
ON CONFLICT (group_name) WHERE parent_id IS NULL
DO UPDATE SET description = EXCLUDED.description, is_available = EXCLUDED.is_available;

-- 6. OPÇÕES (filhos) - Marca
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'WEG', 'Fabricante WEG', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Siemens', 'Fabricante Siemens', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'ABB', 'Fabricante ABB', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Marca' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 7. OPÇÕES - Combustível
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Diesel', 'Diesel S-10', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Gasolina', 'Gasolina comum', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Elétrico', 'Movimento elétrico', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Combustível' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 8. OPÇÕES - Tensão
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '127V', 'Tensão 127V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '220V', 'Tensão 220V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT '380V', 'Tensão 380V', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Tensão' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 9. OPÇÕES - Cor
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Azul', 'Cor azul', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Vermelho', 'Cor vermelha', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Verde', 'Cor verde', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Cor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 10. OPÇÕES - Status Operacional
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Operando', 'Equipamento em operação', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Parado', 'Equipamento parado', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.cfg_assets_attributes_groups (group_name, description, is_available, parent_id)
SELECT 'Em Manutenção', 'Equipamento em manutenção', true, id FROM cfg_assets_attributes_groups WHERE group_name = 'Status Operacional' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Verificar resultado
SELECT 'Grupos (pais):' as info;
SELECT id, group_name, description FROM cfg_assets_attributes_groups WHERE parent_id IS NULL ORDER BY group_name;

SELECT 'Opções (filhos):' as info;
SELECT g.id, g.group_name as option, p.group_name as grupo_pai
FROM cfg_assets_attributes_groups g
JOIN cfg_assets_attributes_groups p ON g.parent_id = p.id
WHERE g.parent_id IS NOT NULL
ORDER BY p.group_name, g.group_name;
