-- PATCH: Fix Permissions for cfg_services
-- Run this in your Supabase SQL Editor: https://services-supabase-siges.2unk5k.easypanel.host

-- 1. Enable RLS
ALTER TABLE public.cfg_services ENABLE ROW LEVEL SECURITY;

-- 2. Create Permissive Policy (Allowing all actions for now, mirroring your other tables)
DROP POLICY IF EXISTS "Permissive" ON public.cfg_services;
CREATE POLICY "Permissive" ON public.cfg_services FOR ALL USING (true);

-- 3. Grant Permissions to API Roles
GRANT ALL ON public.cfg_services TO postgres;
GRANT ALL ON public.cfg_services TO anon;
GRANT ALL ON public.cfg_services TO authenticated;
GRANT ALL ON public.cfg_services TO service_role;

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
