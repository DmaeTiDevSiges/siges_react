-- =============================================================================
-- View: v_departments
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_departments CASCADE;

-- Inferred columns from sample data:
-- id, code, description, parent_id, company_id, is_available, created_user_id, created_at, updated_user_id, updated_at, deleted_user_id, deleted_at, is_deleted, version

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_departments'::regclass, true);

CREATE OR REPLACE VIEW public.v_departments AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

