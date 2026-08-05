-- =============================================================================
-- View: v_orders_visits
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders_visits CASCADE;

-- Inferred columns from sample data:
-- id, o_id, ov_mask, o_mask, o_unit_id, o_type_id, o_type_code, o_type_description, o_type_sub_id, o_type_sub_code, o_type_sub_description, o_unit_description, o_unit_address, o_unit_type_parent_id, o_requested_at, o_requested_services, o_requester_name, o_requester_phone, o_requester_team_code, o_status_id, o_status_description, op_id, o_system_parent_id, o_system_id, o_object_id, o_object_code, o_object_description, o_plan_id, o_plan_code, o_plan_description, o_asset_tag_id, o_asset_tag_description, o_contract_id, o_contract_description, o_provider_company_id, o_provider_company_description, o_provider_company_img_file_path, o_provider_company_img_file_name, o_priority_id, o_priority_code, o_priority_description, o_cause_reason_id, o_cause_reason_description, services_value, materials_value, vehicles_value, total_value, ov_started_at, ov_ended_at, ov_duration_hours, ov_status_id, ov_status_description, ov_processing_id, ov_processing_description, o_team_id, o_team_leader_name_short, o_team_code, ov_team_leader_id, ov_team_leader_name_short, is_canceled, ov_comments, ov_services_value, ov_materials_value, ov_vehicles_value, ov_total_value, ov_is_filed, ov_assets_amount, ov_assets_draft_amount, ov_assets_reported_amount, ov_assets_disapproved_amount, ov_assets_approved_filed_amount, ov_team_amount, ov_team_names_short, ov_rpt_file_path, ov_rpt_file_name, ov_img_file_path, ov_img_file_name, ov_pdf_file_path, ov_pdf_file_name, ov_o_status_id, ov_o_status_description, ov_o_suspended_reason_id, ov_o_suspended_reason_description, ov_o_progress, ov_reported_at, ov_reported_user_name_short, ov_revised_at, ov_revised_user_name_short, ov_disapproved_at, ov_disapproved_user_name_short, ov_approved_at, ov_approved_user_name_short, version_mode, is_extra, ov_assets_approved_no_filed_amount, ov_approved_filed_user_id, ov_approved_filed_at, ov_approved_filed_user_name_short, o_unit_type_id, ov_is_deleted, ov_payment_at, ov_payment_invoices, o_client_id, o_client_name, o_asset_tag_sub_id, o_asset_tag_sub_description

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_orders_visits'::regclass, true);

CREATE OR REPLACE VIEW public.v_orders_visits AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

