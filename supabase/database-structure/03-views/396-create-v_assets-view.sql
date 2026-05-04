-- =============================================================================
-- View: v_assets
-- Description: Database view
-- Exported via: REST API Enhanced
-- Sample rows: 1
-- =============================================================================

DROP VIEW IF EXISTS public.v_assets CASCADE;

-- Inferred columns from sample data:
-- company_id, company_description, company_owner_description, company_owner_id, id, code, description, searchable, tag_id, tag_description, tag_sub_id, tag_sub_description, unit_asset_tag_id, location, unit_id, unit_code, unit_description, status_id, status_description, status_code, status_at, type_id, type_description, priority_id, priority_code, priority_description, brand, model, serial, power, power_unit, voltage, voltage_unit, amperage, amperage_unit, poles, poles_unit, rotation, rotation_unit, service_factor, pressure_max, pressure_min, pressure_operation, pressure_unit, flow_rate_max, flow_rate_min, flow_rate_operation, flow_rate_unit, rotor_diameter, rotor_diameter_unit, weight, weight_unit, coupling_model_id, coupling_model_description, comments, acquisition_at, acquisition_value, img_file_path, img_file_name, img_file_name_thumb, version_mode

-- NOTE: Full CREATE VIEW definition requires direct database access.
-- To get the actual definition, run on database:
-- SELECT pg_get_viewdef('v_assets'::regclass, true);

CREATE OR REPLACE VIEW public.v_assets AS
SELECT 
    -- Add your SELECT statement here
    -- This is a placeholder - replace with actual view definition
NULL as id;

