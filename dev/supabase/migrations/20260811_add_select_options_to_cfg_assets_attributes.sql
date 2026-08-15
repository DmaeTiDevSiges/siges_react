-- =====================================================
-- Migration: Add select_options + groups to cfg_assets_attributes
-- Date: 2026-08-11
-- Description: Adiciona suporte a campos select com
--              grupos hierárquicos de opções
-- =====================================================

-- 1. Coluna select_options (JSONB) para opções inline
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options JSONB DEFAULT NULL;

COMMENT ON COLUMN cfg_assets_attributes.select_options IS
'Opções para campos do tipo select (modo inline). Formato JSON: [{"value":"...","label":"..."}]';

-- 2. Coluna select_options_group_id (FK para grupos)
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options_group_id BIGINT NULL;

COMMENT ON COLUMN cfg_assets_attributes.select_options_group_id IS
'FK para cfg_assets_attributes_groups. Quando preenchido, as opções do select vêm deste grupo.';
