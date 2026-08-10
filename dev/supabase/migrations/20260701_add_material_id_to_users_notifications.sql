-- MIGRAÇÃO: Renomear unit_id para table_id e adicionar material_id em users_notifications
-- table_id: campo genérico de referência (ex: visit_chat usa para unit_id)
-- material_id: referência direta ao material (compras)

-- 1. Renomear coluna unit_id para table_id
ALTER TABLE public.users_notifications
RENAME COLUMN unit_id TO table_id;

-- 2. Adicionar coluna material_id
ALTER TABLE public.users_notifications
ADD COLUMN IF NOT EXISTS material_id bigint;

-- 3. Criar índice para consultas por material_id
CREATE INDEX IF NOT EXISTS idx_users_notifications_material_id
ON public.users_notifications USING btree (material_id) TABLESPACE pg_default;
