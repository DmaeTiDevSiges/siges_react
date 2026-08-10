-- ============================================
-- MIGRAÇÃO: Adicionar campos de soft delete em warehouses_materials
-- Data: 2026-06-30
-- ============================================

-- 1. Adicionar coluna is_deleted
ALTER TABLE public.warehouses_materials
ADD COLUMN IF NOT EXISTS is_deleted boolean NULL DEFAULT false;

-- 2. Adicionar coluna deleted_at
ALTER TABLE public.warehouses_materials
ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone NULL;

-- 3. Adicionar coluna deleted_user_id
ALTER TABLE public.warehouses_materials
ADD COLUMN IF NOT EXISTS deleted_user_id integer NULL REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Criar índice para is_deleted
CREATE INDEX IF NOT EXISTS idx_wm_is_deleted ON public.warehouses_materials(is_deleted);
