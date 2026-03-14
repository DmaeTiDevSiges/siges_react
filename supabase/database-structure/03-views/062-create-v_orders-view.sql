-- =============================================================================
-- View: v_orders
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders CASCADE;

-- Inferred columns from sample data:
-- id, uid, parent_id, company_id, company_description, company_img_file_path, company_img_file_name, img_file_path, img_file_name, department_id, contract_id, contract_description, provider_company_id, provider_company_description, provider_company_img_file_path, provider_company_img_file_name, provider_department_id, order_mask, type_id, type_code, type_description, type_sub_id, type_sub_code, type_sub_description, requested_services, object_id, object_code, object_description, system_parent_id, system_parent_description, system_parent_code, system_id, system_description, system_code, unit_type_parent_id, unit_type_parent_description, unit_type_parent_code, unit_type_id, unit_type_description, unit_type_code, unit_id, unit_description, unit_address, unit_latitude, unit_longitude, requester_name, requester_phone, requester_team_id, requester_team_code, requested_at, status_id, status_code, status_description, status_at, priority_id, priority_code, priority_description, team_leader_id, team_leader_name_short, team_leader_email, team_id, team_code, team_description, asset_tag_id, asset_tag_description, year, counter_parent, counter_child, cause_reason_id, cause_reason_description, suspended_reason_id, suspended_reason_description, cancel_reason_id, cancel_reason_description, canceled_team_id, canceled_team_code, canceled_user_name_short, plan_id, plan_description, plan_code, services_value, materials_value, vehicles_value, total_value, version_mode, created_user_id, ov_counter, progress, contract_code, unit_code, img_files_names, client_name, client_id, unit_asset_tag_id, asset_tag_sub_id, unit_asset_tag_has_order, unit_asset_tag_no_has_order_user_id, unit_asset_tag_no_has_order_at, asset_tag_sub_description

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_orders'::regclass, true);

CREATE OR REPLACE VIEW public.v_orders AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

