-- PATCH: Update Asset Types with Parent and Company
-- Run this in your Supabase SQL Editor for the environment: https://services-supabase-siges.2unk5k.easypanel.host

-- 1. Alter cfg_assets_types
ALTER TABLE public.cfg_assets_types ADD COLUMN IF NOT EXISTS parent_id bigint;
ALTER TABLE public.cfg_assets_types ADD COLUMN IF NOT EXISTS company_id bigint;

-- 2. Add FK for Parent (Self-referencing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assets_types_parent_fkey') THEN
        ALTER TABLE public.cfg_assets_types 
        ADD CONSTRAINT assets_types_parent_fkey 
        FOREIGN KEY (parent_id) 
        REFERENCES public.cfg_assets_types(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add FK for Company
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assets_types_company_fkey') THEN
        ALTER TABLE public.cfg_assets_types 
        ADD CONSTRAINT assets_types_company_fkey 
        FOREIGN KEY (company_id) 
        REFERENCES public.cfg_companies(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
