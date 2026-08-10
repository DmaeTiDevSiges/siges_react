-- =============================================================================
-- View: v_orders_visits_assets
-- Description: View detalhada para ativos em visitas técnica
-- =============================================================================

DROP VIEW IF EXISTS public.v_orders_visits_assets CASCADE;

CREATE OR REPLACE VIEW public.v_orders_visits_assets AS
SELECT
  orders_visits_assets.id,
  orders_visits_assets.op_id,
  orders_visits_assets.o_id,
  v_orders.order_mask as o_mask,
  v_orders.company_id as o_company_id,
  v_orders.company_img_file_path as o_company_img_file_path,
  v_orders.company_img_file_name as o_company_img_file_name,
  v_orders.type_id AS o_type_id,
  orders_visits_assets.ov_id,
  v_orders_visits.ov_mask,
  v_orders_visits.ov_started_at,
  v_orders_visits.ov_ended_at,
  v_orders_visits.o_team_code,
  v_orders_visits.o_team_leader_name_short,
  v_orders_visits.o_type_code,
  v_orders_visits.o_type_sub_code,
  orders_visits_assets.asset_id,
  assets.code,
  assets.description,
  orders_visits_assets.is_moved,
  orders_visits_assets.before_unit_id,  
  before_units.code AS before_unit_code,
  before_units.description_full AS before_unit_description,
  before_units.latitude AS before_unit_latitude,
  before_units.longitude AS before_unit_longitude,
  orders_visits_assets.before_unit_asset_tag_id,
  orders_visits_assets.before_tag_id,
  before_tags.description AS before_tag_description,
  orders_visits_assets.before_tag_sub_id,
  before_tags_subs.description AS before_tag_sub_description,
  orders_visits_assets.before_status_id,
  before_status.description AS before_status_description,
  before_status.code AS before_status_code,
  before_status.status_color AS before_status_color,
  orders_visits_assets.before_status_at,
  orders_visits_assets.before_comments,
  orders_visits_assets.before_img_file_path,
  orders_visits_assets.before_img_files_names,
  orders_visits_assets.before_img_file_name,
  orders_visits_assets.before_img_file_name_thumb,
  orders_visits_assets.before_recorder,
  orders_visits_assets.before_latitude,
  orders_visits_assets.before_longitude,
  orders_visits_assets.before_priority_id,
  before_priorities.description AS before_priority_description,
  orders_visits_assets.after_unit_id,
  after_units.code AS after_unit_code,
  after_units.description_full AS after_unit_description,
  after_units.latitude AS after_unit_latitude,
  after_units.longitude AS after_unit_longitude,
  orders_visits_assets.after_unit_asset_tag_id,
  orders_visits_assets.after_tag_id,
  after_tags.description AS after_tag_description,
  orders_visits_assets.after_tag_sub_id,
  after_tags_subs.description AS after_tag_sub_description,
  orders_visits_assets.after_status_id,
  after_status.description AS after_status_description,
  after_status.code AS after_status_code,
  after_status.status_color AS after_status_color,
  orders_visits_assets.after_status_at,
  orders_visits_assets.after_comments,
  orders_visits_assets.after_img_file_path,
  orders_visits_assets.after_img_files_names,
  orders_visits_assets.after_img_file_name,
  orders_visits_assets.after_img_file_name_thumb,
  orders_visits_assets.after_recorder,
  orders_visits_assets.after_latitude,
  orders_visits_assets.after_longitude,
  orders_visits_assets.after_priority_id,
  after_priorities.description AS after_priority_description,
  orders_visits_assets.processing_id,
  cfg_orders_visits_processing.description AS processing_description,
  orders_visits_assets.moved_comments,
  orders_visits_assets.reported_user_id,
  users_reported.name_short AS reported_user_name_short,
  orders_visits_assets.reported_at,
  orders_visits_assets.disapproved_user_id,
  users_disapproved.name_short AS disapproved_user_name_short,
  orders_visits_assets.disapproved_at,
  orders_visits_assets.disapproved_notes,
  orders_visits_assets.approved_user_id,
  users_approved.name_short AS approved_user_name_short,
  orders_visits_assets.approved_at,
  orders_visits_assets.activities_searchable,
  orders_visits_assets.cart_materials_amount,
  orders_visits_assets.materials_value,
  orders_visits_assets.services_value,
  orders_visits_assets.vehicles_value,
  orders_visits_assets.total_value,
  orders_visits_assets.version_mode,
  orders_visits_assets.is_filed,
  orders_visits_assets.before_client_id,
  before_clients.name as before_client_name,
  orders_visits_assets.after_client_id,
  after_clients.name as after_client_name,
  orders_visits_assets.before_location,
  orders_visits_assets.after_location,
  orders_visits_assets.activities_description
FROM
  orders_visits_assets
  LEFT JOIN v_orders_visits ON orders_visits_assets.ov_id = v_orders_visits.id
  LEFT JOIN v_orders ON orders_visits_assets.o_id = v_orders.id
  LEFT JOIN assets ON orders_visits_assets.asset_id = assets.id
  LEFT JOIN cfg_assets_tags AS before_tags ON orders_visits_assets.before_tag_id = before_tags.id
  LEFT JOIN cfg_assets_tags_subs AS before_tags_subs ON orders_visits_assets.before_tag_sub_id = before_tags_subs.id
  LEFT JOIN cfg_assets_statuses AS before_status ON orders_visits_assets.before_status_id = before_status.id
  LEFT JOIN cfg_assets_tags AS after_tags ON orders_visits_assets.after_tag_id = after_tags.id
  LEFT JOIN cfg_assets_tags_subs AS after_tags_subs ON orders_visits_assets.after_tag_sub_id = after_tags_subs.id
  LEFT JOIN cfg_assets_statuses AS after_status ON orders_visits_assets.after_status_id = after_status.id  
  LEFT JOIN cfg_orders_visits_processing ON orders_visits_assets.processing_id = cfg_orders_visits_processing.id  
  LEFT JOIN units AS before_units ON orders_visits_assets.before_unit_id = before_units.id
  LEFT JOIN units AS after_units ON orders_visits_assets.after_unit_id = after_units.id  
  LEFT JOIN users AS users_reported ON orders_visits_assets.reported_user_id = users_reported.id  
  LEFT JOIN users AS users_disapproved ON orders_visits_assets.disapproved_user_id = users_disapproved.id  
  LEFT JOIN users AS users_approved ON orders_visits_assets.approved_user_id = users_approved.id
  LEFT JOIN cfg_assets_priorities AS before_priorities ON orders_visits_assets.before_priority_id = before_priorities.id
  LEFT JOIN cfg_assets_priorities AS after_priorities ON orders_visits_assets.after_priority_id = after_priorities.id
  LEFT JOIN clients AS before_clients ON orders_visits_assets.before_client_id = before_clients.id
  LEFT JOIN clients AS after_clients ON orders_visits_assets.after_client_id = after_clients.id
WHERE
  orders_visits_assets.is_deleted = false;
