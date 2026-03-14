-- PATCH: Update Order Plans with Version and Department
-- Run this in your Supabase SQL Editor for the environment: https://services-supabase-siges.2unk5k.easypanel.host

-- 1. Alter cfg_orders_plans
ALTER TABLE public.cfg_orders_plans ADD COLUMN IF NOT EXISTS department_id bigint;
ALTER TABLE public.cfg_orders_plans ADD COLUMN IF NOT EXISTS version text;

-- 2. Add FK for Department if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_plans_department_fkey') THEN
        ALTER TABLE public.cfg_orders_plans 
        ADD CONSTRAINT orders_plans_department_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES public.cfg_departments(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
