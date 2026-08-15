-- =====================================================
-- Migration: Create hierarchical groups for select attributes
-- Date: 2026-08-11
-- Description: Tabela hierárquica para grupos de opções
--              de atributos do tipo select
-- =====================================================

-- 1. Tabela de grupos (hierárquica)
CREATE TABLE IF NOT EXISTS public.cfg_assets_attributes_groups (
    id BIGSERIAL,
    group_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    parent_id BIGINT NULL
);

-- PK (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cfg_assets_attributes_groups_pkey'
    ) THEN
        ALTER TABLE cfg_assets_attributes_groups ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Constraint de unicidade para nome do grupo (apenas itens de nível superior)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfg_assets_attributes_groups_group_name_unique
ON cfg_assets_attributes_groups (group_name)
WHERE parent_id IS NULL;

-- Índice para buscar filhos rapidamente
CREATE INDEX IF NOT EXISTS idx_cfg_assets_attributes_groups_parent_id
ON cfg_assets_attributes_groups (parent_id);

COMMENT ON TABLE cfg_assets_attributes_groups IS 'Grupos hierárquicos de opções para atributos do tipo select';

-- 2. Coluna select_options_group_id (se não existir)
ALTER TABLE cfg_assets_attributes
ADD COLUMN IF NOT EXISTS select_options_group_id BIGINT NULL;

-- FK de cfg_assets_attributes.select_options_group_id → cfg_assets_attributes_groups (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cfg_assets_attributes_select_options_group_id_fkey'
    ) THEN
        ALTER TABLE cfg_assets_attributes
        ADD CONSTRAINT cfg_assets_attributes_select_options_group_id_fkey
        FOREIGN KEY (select_options_group_id)
        REFERENCES public.cfg_assets_attributes_groups(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. RLS (Row Level Security)
ALTER TABLE cfg_assets_attributes_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissive" ON cfg_assets_attributes_groups;
CREATE POLICY "Permissive" ON cfg_assets_attributes_groups USING (true);
