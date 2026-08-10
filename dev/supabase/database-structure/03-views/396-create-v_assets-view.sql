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
select
  assets.company_id,
  cfg_companies.description as company_description,
  cfg_companies_owners.description as company_owner_description,
  assets.company_owner_id,
  assets.id,
  assets.code,
  assets.description,
  assets.searchable,
  assets.tag_id,
  cfg_assets_tags.description as tag_description,
  assets.tag_sub_id,
  cfg_assets_tags_subs.description as tag_sub_description,
  assets.unit_asset_tag_id,
  assets.location,
  assets.unit_id,
  units.code as unit_code,
  units.description_full as unit_description,
  assets.status_id,
  cfg_assets_statuses.description as status_description,
  cfg_assets_statuses.code as status_code,
  assets.status_at,
  assets.type_id,
  cfg_assets_types.description as type_description,
  assets.priority_id,
  cfg_assets_priorities.code as priority_code,
  cfg_assets_priorities.description as priority_description,
  assets.brand,
  assets.model,
  assets.serial,
  assets.power,
  assets.power_unit,
  assets.voltage,
  assets.voltage_unit,
  assets.amperage,
  assets.amperage_unit,
  assets.poles,
  assets.poles_unit,
  assets.rotation,
  assets.rotation_unit,
  assets.service_factor,
  assets.pressure_max,
  assets.pressure_min,
  assets.pressure_operation,
  assets.pressure_unit,
  assets.flow_rate_max,
  assets.flow_rate_min,
  assets.flow_rate_operation,
  assets.flow_rate_unit,
  assets.rotor_diameter,
  assets.rotor_diameter_unit,
  assets.weight,
  assets.weight_unit,
  assets.coupling_model_id,
  cfg_assets_couplings_models.description as coupling_model_description,
  assets.comments,
  assets.acquisition_at,
  assets.acquisition_value,
  assets.img_file_path,
  assets.img_file_name,
  assets.img_file_name_thumb,
  assets.version_mode,
  cfg_assets_statuses.color as status_color
from
  assets
  left join units on assets.unit_id = units.id
  left join cfg_companies on assets.company_id = cfg_companies.id
  left join cfg_companies as cfg_companies_owners on assets.company_owner_id = cfg_companies_owners.id
  left join cfg_assets_tags on assets.tag_id = cfg_assets_tags.id
  left join cfg_assets_tags_subs on assets.tag_sub_id = cfg_assets_tags_subs.id
  left join cfg_assets_statuses on assets.status_id = cfg_assets_statuses.id
  left join cfg_assets_types on assets.type_id = cfg_assets_types.id
  left join cfg_assets_priorities on assets.priority_id = cfg_assets_priorities.id
  left join cfg_assets_couplings_models on assets.coupling_model_id = cfg_assets_couplings_models.id
where
  assets.is_deleted = false;

