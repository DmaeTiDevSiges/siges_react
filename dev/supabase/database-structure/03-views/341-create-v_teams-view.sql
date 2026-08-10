-- =============================================================================
-- View: v_teams
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_teams CASCADE;

-- Inferred columns from sample data:
-- id, parent_id, code, description, department_id, is_available, img_url, users_total, company_id, created_user_id, created_at, updated_user_id, updated_at, deleted_user_id, deleted_at, is_deleted, version

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_teams'::regclass, true);

CREATE OR REPLACE VIEW public.v_teams AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

