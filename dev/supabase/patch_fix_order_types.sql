-- PATCH: Fix Order Types and Sub Types Dependencies on Departments
-- Run this in your Supabase SQL Editor for the environment: https://services-supabase-siges.2unk5k.easypanel.host

-- 1. Alter cfg_orders_types
ALTER TABLE public.cfg_orders_types ADD COLUMN IF NOT EXISTS department_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_types_department_fkey') THEN
        ALTER TABLE public.cfg_orders_types 
        ADD CONSTRAINT orders_types_department_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES public.cfg_departments(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.cfg_orders_types DROP COLUMN IF EXISTS parent_id;

-- 2. Alter cfg_orders_types_subs
ALTER TABLE public.cfg_orders_types_subs ADD COLUMN IF NOT EXISTS department_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_types_subs_department_fkey') THEN
        ALTER TABLE public.cfg_orders_types_subs 
        ADD CONSTRAINT orders_types_subs_department_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES public.cfg_departments(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
