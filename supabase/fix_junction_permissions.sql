-- Solo fix for permissions of the junction table and base attributes
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.cfg_assets_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_assets_types_attributes ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies (Allow all roles to Read/Write)
DROP POLICY IF EXISTS "Attributes permissive policy" ON public.cfg_assets_attributes;
CREATE POLICY "Attributes permissive policy" ON public.cfg_assets_attributes FOR ALL USING (true);

DROP POLICY IF EXISTS "Junction permissive policy" ON public.cfg_assets_types_attributes;
CREATE POLICY "Junction permissive policy" ON public.cfg_assets_types_attributes FOR ALL USING (true);

-- 3. Grant explicit permissions
GRANT ALL ON public.cfg_assets_attributes TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.cfg_assets_types_attributes TO anon, authenticated, postgres, service_role;

-- 4. Reload PostgREST
NOTIFY pgrst, 'reload schema';
