-- =============================================================================
-- View: v_contracts
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_contracts CASCADE;

-- Inferred columns from sample data:
-- id, client_company_id, client_company_description, client_department_id, provider_company_id, provider_company_description, provider_company_code, provider_company_img_file_name, provider_company_img_file_path, provider_department_id, code, description, status_id, status_code, status_description, is_available, is_deleted, version, default_ov_asset_id, default_activity_id, client_id

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_contracts'::regclass, true);

CREATE OR REPLACE VIEW public.v_contracts AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

