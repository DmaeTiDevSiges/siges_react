-- Adicionar colunas de soft delete e auditoria na tabela tools
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS deleted_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS updated_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

-- Índice para filtrar ferramentas ativas
CREATE INDEX IF NOT EXISTS idx_tools_is_deleted ON public.tools(is_deleted);
