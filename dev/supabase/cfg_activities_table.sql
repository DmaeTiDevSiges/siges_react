-- =============================================================================
-- AJUSTE DA TABELA CFG_ACTIVITIES
-- =============================================================================
-- Este script adiciona as colunas company_id e department_id e configura as chaves estrangeiras.

-- 1. Adicionar colunas se não existirem
ALTER TABLE public.cfg_activities 
ADD COLUMN IF NOT EXISTS company_id bigint,
ADD COLUMN IF NOT EXISTS department_id bigint;

-- 2. Adicionar Constraints de Foreign Key
DO $$
BEGIN
    -- Link com Empresas
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cfg_activities_company_id_fkey') THEN
        ALTER TABLE public.cfg_activities
        ADD CONSTRAINT cfg_activities_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.cfg_companies(id)
        ON DELETE CASCADE;
    END IF;

    -- Link com Departamentos
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cfg_activities_department_id_fkey') THEN
        ALTER TABLE public.cfg_activities
        ADD CONSTRAINT cfg_activities_department_id_fkey
        FOREIGN KEY (department_id)
        REFERENCES public.cfg_departments(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Garantir que RLS está habilitado e permissivo (para desenvolvimento)
ALTER TABLE public.cfg_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissive" ON public.cfg_activities;
CREATE POLICY "Permissive" ON public.cfg_activities FOR ALL USING (true);
