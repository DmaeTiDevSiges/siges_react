-- FIX: Aplicar migration pendente - adicionar colunas select_options
-- Isso resolve o erro silencioso do PostgREST

-- 1. Adicionar coluna select_options (JSONB)
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options JSONB DEFAULT NULL;

COMMENT ON COLUMN cfg_assets_attributes.select_options IS
'Opções para campos do tipo select (modo inline). Formato JSON: [{"value":"...","label":"..."}]';

-- 2. Adicionar coluna select_options_group_id
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options_group_id BIGINT NULL;

COMMENT ON COLUMN cfg_assets_attributes.select_options_group_id IS
'FK para cfg_assets_attributes_groups. Quando preenchido, as opções do select vêm deste grupo.';

-- 3. Verificar se colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cfg_assets_attributes' 
ORDER BY ordinal_position;
