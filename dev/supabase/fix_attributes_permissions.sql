-- =============================================================================
-- FIX: Permissions for Asset Attributes
-- =============================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.cfg_assets_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets_attributes_values ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Permissive" ON public.cfg_assets_attributes;
DROP POLICY IF EXISTS "Permissive" ON public.assets_attributes_values;

-- 3. Create permissive policies (Match project pattern)
CREATE POLICY "Permissive" ON public.cfg_assets_attributes FOR ALL USING (true);
CREATE POLICY "Permissive" ON public.assets_attributes_values FOR ALL USING (true);

-- 4. Ensure public access (GRANTs)
GRANT ALL ON public.cfg_assets_attributes TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.assets_attributes_values TO postgres, anon, authenticated, service_role;

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
