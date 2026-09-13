-- ============================================================
-- Migration: Move extensions from public to extensions schema
-- Date: 2026-09-13
-- Fix: Supabase advisor warnings for extensions in public schema
-- ============================================================

-- 1. Move pg_stat_statements (resets stats, safe to do)
ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;

-- 2. Move vector (pgvector for AI embeddings)
ALTER EXTENSION vector SET SCHEMA extensions;

-- 3. Move unaccent (text search accent removal)
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- 4. Update trigger function to use schema-qualified unaccent()
DROP FUNCTION IF EXISTS public.fc_orders_replace_special_chars() CASCADE;

CREATE FUNCTION public.fc_orders_replace_special_chars()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.requested_services := extensions.unaccent(new.requested_services);
  RETURN NEW;
END;
$$;

-- 5. Recreate the trigger that depends on the function
CREATE TRIGGER tgr_orders_sanitize_requested_services
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_orders_replace_special_chars();
