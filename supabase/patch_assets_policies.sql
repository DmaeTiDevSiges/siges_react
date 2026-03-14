-- ==========================================
-- PATCH: ASSETS RLS POLICIES
-- ==========================================

-- 1. Enable RLS on all related tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_assets_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_assets_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_assets_priorities ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies for Assets
DROP POLICY IF EXISTS "Public read access" ON public.assets;
DROP POLICY IF EXISTS "Authenticated insert" ON public.assets;
DROP POLICY IF EXISTS "Authenticated update" ON public.assets;
DROP POLICY IF EXISTS "Authenticated delete" ON public.assets;

-- 3. Create robust policies for Assets
-- (Note: Using 'true' for select to match the previous requirement of wide visibility, 
-- but restricting writes to authenticated users)

CREATE POLICY "Assets Select Policy" 
ON public.assets 
FOR SELECT 
USING (true);

CREATE POLICY "Assets Insert Policy" 
ON public.assets 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Assets Update Policy" 
ON public.assets 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Assets Delete Policy" 
ON public.assets 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- 4. Polices for Configuration Tables
DROP POLICY IF EXISTS "Asset types viewable by everyone" ON public.cfg_assets_types;
CREATE POLICY "Asset types viewable by everyone" ON public.cfg_assets_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Asset statuses viewable by everyone" ON public.cfg_assets_statuses;
CREATE POLICY "Asset statuses viewable by everyone" ON public.cfg_assets_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Asset priorities viewable by everyone" ON public.cfg_assets_priorities;
CREATE POLICY "Asset priorities viewable by everyone" ON public.cfg_assets_priorities FOR SELECT USING (true);

-- 5. Grant Permissions
-- Ensure the API roles can actually see the tables
GRANT ALL ON TABLE public.assets TO postgres, service_role, authenticated;
GRANT SELECT ON TABLE public.assets TO anon;

GRANT ALL ON TABLE public.cfg_assets_types TO postgres, service_role, authenticated;
GRANT SELECT ON TABLE public.cfg_assets_types TO anon;

GRANT ALL ON TABLE public.cfg_assets_statuses TO postgres, service_role, authenticated;
GRANT SELECT ON TABLE public.cfg_assets_statuses TO anon;

GRANT ALL ON TABLE public.cfg_assets_priorities TO postgres, service_role, authenticated;
GRANT SELECT ON TABLE public.cfg_assets_priorities TO anon;

-- 6. Grant sequence access (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
