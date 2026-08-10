-- =============================================================================
-- View: v_users
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_users CASCADE;

-- Inferred columns from sample data:
-- id, uuid, company_id, company_code, company_description, company_img_file_path, company_img_file_name, company_email_sufix, company_is_available, department_id, department_code, department_description, email, name_short, name_full, team_id, team_code, team_description, team_amount, team_id_previous, status_id, status_code, status_description, is_team_leader, is_admin, is_admin_super, img_file_path, img_file_name, ov_id_in_progress, ov_id_in_progress_mask, o_id_in_progress, op_id_in_progress, ov_in_progress_leader_id, profile_id, profile_description, vehicle_id, is_available, is_ov_in_progress, version_app, o_contract_id_in_progress, o_type_id_in_progress, o_type_sub_id_in_progress, o_plan_id_in_progress, o_asset_tag_id_in_progress, o_unit_id_in_progress, o_system_id_in_progress, o_system_parent_id_in_progress, o_unit_type_id_in_progress, o_object_id_in_progress, token_fcm, notifications_amount, mobile, mobile_full, mobile_mask, mobile_whatsapp, latitude, longitude

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_users'::regclass, true);

CREATE OR REPLACE VIEW public.v_users AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

