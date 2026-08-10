
-- =============================================================================
-- SIGES MASTER POLICIES
-- This script resets and unifies all RLS policies for the application.
-- It is designed for Development Mode where we want broad access.
-- =============================================================================

DO $$ 
DECLARE 
    t text;
    p record;
    seq text;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. TABLE POLICIES (PUBLIC SCHEMA)
    -- -------------------------------------------------------------------------
    
    -- Loop through all tables in the public schema
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        
        -- A. Enable Row Level Security
        -- (Safe to run multiple times, idempotent)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- B. Drop ALL existing policies for this table
        -- This ensures we don't have conflicting policies like "Public Access" vs "Assets Select Policy"
        FOR p IN (select policyname from pg_policies where schemaname = 'public' and tablename = t) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;

        -- C. Create a single, unified "Universal Access" policy
        -- Allows ALL operations (SELECT, INSERT, UPDATE, DELETE) for everyone (anon, authenticated)
        -- In production, this should be replaced with granular policies.
        EXECUTE format('CREATE POLICY "Universal Access" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', t);
        
        -- D. Grant specific permissions to ensure roles definitely have access
        EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres, service_role, authenticated, anon', t);
        
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 2. SEQUENCE PERMISSIONS
    -- -------------------------------------------------------------------------
    
    -- Loop through all sequences to grant USAGE
    FOR seq IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO postgres, service_role, authenticated, anon', seq);
    END LOOP;

END $$;

-- =============================================================================
-- 3. STORAGE POLICIES (Bucket: 'siges')
-- =============================================================================

-- Ensure RLS is enabled for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing storage policies for 'siges' bucket (and others if needed)
DROP POLICY IF EXISTS "Siges Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Siges Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Siges Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Siges Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Siges Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to Siges Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update to Siges Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Siges Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Universal Storage Access" ON storage.objects;

-- Create Master Storage Policy for 'siges' bucket
-- Allows everything for everyone on the 'siges' bucket
CREATE POLICY "Universal Storage Access" 
ON storage.objects FOR ALL 
TO public
USING (bucket_id = 'siges' OR bucket_id = 'contracts')
WITH CHECK (bucket_id = 'siges' OR bucket_id = 'contracts');

-- =============================================================================
-- 4. REALTIME PERMISSIONS
-- =============================================================================

-- Ensure specific tables are in the publication for Realtime
DO $$ 
BEGIN
    -- users_notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'users_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users_notifications;
    END IF;

    -- You can add other tables here if needed for Realtime subscriptions
END $$;

-- =============================================================================
-- 5. RELOAD CACHE
-- =============================================================================
NOTIFY pgrst, 'reload schema';
