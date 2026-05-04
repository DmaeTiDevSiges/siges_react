-- =============================================================================
-- View: v_companies
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_companies CASCADE;

-- Inferred columns from sample data:
-- id, code, description, img_file_path, img_file_name, is_available, email_sufix

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_companies'::regclass, true);

CREATE OR REPLACE VIEW public.v_companies AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

