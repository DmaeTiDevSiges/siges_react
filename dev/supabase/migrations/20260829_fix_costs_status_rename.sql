-- ============================================================
-- 1. RENOMEAR CAMPOS DE CUSTOS
-- ============================================================
-- ov_costs_submitted_at -> ov_costs_waiting_at
-- ov_costs_submitted_user_id -> ov_costs_waiting_user_id

ALTER TABLE public.orders_visits
RENAME COLUMN ov_costs_submitted_at TO ov_costs_waiting_at;

ALTER TABLE public.orders_visits
RENAME COLUMN ov_costs_submitted_user_id TO ov_costs_waiting_user_id;

-- ============================================================
-- 2. EXCLUIR COLUNAS x_ LEGADAS DA TABELA orders_visits
-- ============================================================
-- 21 colunas x_ sem uso no código TypeScript.
-- NÃO são referenciadas em nenhum .ts ou .tsx.

ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_created_user_logon;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_created_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_interv_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_approval_status;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_approved_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_approved_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_disapproved_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_disapproved_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_rejected_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_rejected_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_tech_rejection_notes;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_approval_status;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_approved_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_approved_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_disapproved_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_disapproved_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_submitted_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_submitted_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_rejected_at;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_rejected_user_id;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS x_ov_cost_rejection_notes;

-- ============================================================
-- 3. RECRIAR VIEW v_orders_visits (DROP CASCADE + CREATE OR REPLACE)
-- ============================================================
-- View recriada sem as colunas x_ e com ov_costs_waiting_at / ov_costs_waiting_user_id.

DROP VIEW IF EXISTS public.v_orders_visits CASCADE;

CREATE OR REPLACE VIEW public.v_orders_visits AS
WITH ov AS (
    SELECT orders_visits_1.id,
        orders_visits_1.ov_mask,
        orders_visits_1.visit_counter,
        orders_visits_1.o_id,
        orders_visits_1.ov_approved_user_id,
        orders_visits_1.ov_approved_at,
        orders_visits_1.ov_disapproved_user_id,
        orders_visits_1.ov_disapproved_at,
        orders_visits_1.ov_started_at,
        orders_visits_1.ov_ended_at,
        orders_visits_1.ov_processing_id,
        orders_visits_1.ov_status_id,
        orders_visits_1.ov_reported_at,
        orders_visits_1.ov_reported_user_id,
        orders_visits_1.ov_team_leader_id,
        orders_visits_1.ov_assets_amount,
        orders_visits_1.ov_assets_approved_filed_amount,
        orders_visits_1.ov_assets_disapproved_amount,
        orders_visits_1.ov_assets_reported_amount,
        orders_visits_1.ov_materials_value,
        orders_visits_1.ov_services_value,
        orders_visits_1.ov_vehicles_value,
        orders_visits_1.ov_created_user_id,
        orders_visits_1.ov_created_at,
        orders_visits_1.ov_updated_user_id,
        orders_visits_1.ov_updated_at,
        orders_visits_1.ov_deleted_user_id,
        orders_visits_1.is_deleted,
        orders_visits_1.ov_duration_hours,
        orders_visits_1.ov_disapproved_comments,
        orders_visits_1.ov_assets_draft_amount,
        orders_visits_1.is_canceled,
        orders_visits_1.ov_comments,
        orders_visits_1.o_cancel_reason_id,
        orders_visits_1.ov_created_latitude,
        orders_visits_1.ov_created_longitude,
        orders_visits_1.ov_total_value,
        orders_visits_1.ov_is_filed,
        orders_visits_1.ov_team_amount,
        orders_visits_1.ov_assets_revised_amount,
        orders_visits_1.ov_revised_user_id,
        orders_visits_1.ov_revised_at,
        orders_visits_1.ov_team_names_short,
        orders_visits_1.version_mode,
        orders_visits_1.ov_rpt_file_path,
        orders_visits_1.ov_rpt_file_name,
        orders_visits_1.ov_o_suspended_reason_id,
        orders_visits_1.ov_o_status_id,
        orders_visits_1.ov_o_progress,
        orders_visits_1.ov_img_file_path,
        orders_visits_1.ov_img_file_name,
        orders_visits_1.ov_pdf_file_path,
        orders_visits_1.ov_pdf_file_name,
        orders_visits_1.is_extra,
        orders_visits_1.ov_assets_approved_no_filed_amount,
        orders_visits_1.ov_approved_filed_user_id,
        orders_visits_1.ov_approved_filed_at,
        orders_visits_1.finger_print,
        orders_visits_1.ov_payment_at,
        orders_visits_1.ov_payment_invoices,
        orders_visits_1.ov_started_year,
        orders_visits_1.ov_started_month,
        orders_visits_1.ov_invoices,
        orders_visits_1.ov_assets_approved_amount,
        orders_visits_1.created_user_id,
        orders_visits_1.created_at,
        orders_visits_1.updated_user_id,
        orders_visits_1.updated_at,
        orders_visits_1.ov_signature_leader_path,
        orders_visits_1.ov_signature_leader_name,
        orders_visits_1.ov_signature_leader_at,
        orders_visits_1.ov_signature_requester_path,
        orders_visits_1.ov_signature_requester_name,
        orders_visits_1.ov_signature_requester_at,
        orders_visits_1.chat_status,
        orders_visits_1.chat_closed_at,
        orders_visits_1.chat_closed_user_id,
        orders_visits_1.chat_created_user_id,
        orders_visits_1.ov_costs_status,
        orders_visits_1.ov_costs_waiting_at,
        orders_visits_1.ov_costs_waiting_user_id,
        orders_visits_1.ov_costs_approved_at,
        orders_visits_1.ov_costs_approved_user_id,
        orders_visits_1.ov_costs_rejected_at,
        orders_visits_1.ov_costs_rejected_user_id,
        orders_visits_1.ov_costs_rejection_reason
    FROM orders_visits orders_visits_1
    WHERE orders_visits_1.is_deleted = false
)
SELECT orders_visits.id,
    orders_visits.o_id,
    orders_visits.ov_mask,
    v_orders.order_mask AS o_mask,
    v_orders.unit_id AS o_unit_id,
    v_orders.type_id AS o_type_id,
    v_orders.type_code AS o_type_code,
    v_orders.type_description AS o_type_description,
    v_orders.type_sub_id AS o_type_sub_id,
    v_orders.type_sub_code AS o_type_sub_code,
    v_orders.type_sub_description AS o_type_sub_description,
    v_orders.unit_description AS o_unit_description,
    v_orders.unit_address AS o_unit_address,
    v_orders.unit_type_parent_id AS o_unit_type_parent_id,
    v_orders.requested_at AS o_requested_at,
    v_orders.requested_services AS o_requested_services,
    v_orders.requester_name AS o_requester_name,
    v_orders.requester_phone AS o_requester_phone,
    v_orders.requester_team_code AS o_requester_team_code,
    v_orders.status_id AS o_status_id,
    v_orders.status_description AS o_status_description,
    v_orders.parent_id AS op_id,
    v_orders.system_parent_id AS o_system_parent_id,
    v_orders.system_id AS o_system_id,
    v_orders.object_id AS o_object_id,
    v_orders.object_code AS o_object_code,
    v_orders.object_description AS o_object_description,
    v_orders.plan_id AS o_plan_id,
    v_orders.plan_code AS o_plan_code,
    v_orders.plan_description AS o_plan_description,
    v_orders.asset_tag_id AS o_asset_tag_id,
    v_orders.asset_tag_description AS o_asset_tag_description,
    v_orders.contract_id AS o_contract_id,
    v_orders.contract_description AS o_contract_description,
    v_orders.provider_company_id AS o_provider_company_id,
    v_orders.provider_company_description AS o_provider_company_description,
    v_orders.provider_company_img_file_path AS o_provider_company_img_file_path,
    v_orders.provider_company_img_file_name AS o_provider_company_img_file_name,
    v_orders.priority_id AS o_priority_id,
    v_orders.priority_code AS o_priority_code,
    v_orders.priority_description AS o_priority_description,
    v_orders.cause_reason_id AS o_cause_reason_id,
    v_orders.cause_reason_description AS o_cause_reason_description,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    orders_visits.ov_started_at,
    orders_visits.ov_ended_at,
    orders_visits.ov_duration_hours,
    orders_visits.ov_status_id,
    cfg_orders_visits_statuses.description AS ov_status_description,
    orders_visits.ov_processing_id,
    cfg_orders_visits_processing.description AS ov_processing_description,
    v_orders.team_id AS o_team_id,
    v_orders.team_leader_name_short AS o_team_leader_name_short,
    v_orders.team_code AS o_team_code,
    orders_visits.ov_team_leader_id,
    users_teams_leaders.name_short AS ov_team_leader_name_short,
    orders_visits.is_canceled,
    orders_visits.ov_comments,
    orders_visits.ov_services_value,
    orders_visits.ov_materials_value,
    orders_visits.ov_vehicles_value,
    orders_visits.ov_total_value,
    orders_visits.ov_is_filed,
    orders_visits.ov_assets_amount,
    orders_visits.ov_assets_draft_amount,
    orders_visits.ov_assets_reported_amount,
    orders_visits.ov_assets_disapproved_amount,
    orders_visits.ov_assets_approved_amount,
    orders_visits.ov_team_amount,
    orders_visits.ov_team_names_short,
    orders_visits.ov_rpt_file_path,
    orders_visits.ov_rpt_file_name,
    orders_visits.ov_img_file_path,
    orders_visits.ov_img_file_name,
    orders_visits.ov_pdf_file_path,
    orders_visits.ov_pdf_file_name,
    orders_visits.ov_o_status_id,
    cfg_orders_statuses.description AS ov_o_status_description,
    orders_visits.ov_o_suspended_reason_id,
    cfg_orders_suspended_reasons.description AS ov_o_suspended_reason_description,
    orders_visits.ov_o_progress,
    orders_visits.ov_reported_at,
    users_reported.name_short AS ov_reported_user_name_short,
    orders_visits.ov_revised_at,
    users_revised.name_short AS ov_revised_user_name_short,
    orders_visits.ov_disapproved_at,
    users_disapproved.name_short AS ov_disapproved_user_name_short,
    orders_visits.ov_approved_at,
    users_approved.name_short AS ov_approved_user_name_short,
    orders_visits.version_mode,
    orders_visits.is_extra,
    orders_visits.ov_started_month,
    orders_visits.ov_started_year,
    orders_visits.ov_invoices,
    v_orders.asset_tag_sub_id AS o_asset_tag_sub_id,
    v_orders.asset_tag_sub_description AS o_asset_tag_sub_description,
    v_orders.client_name,
    orders_visits.finger_print,
    orders_visits.ov_signature_leader_path,
    orders_visits.ov_signature_leader_name,
    orders_visits.ov_signature_leader_at,
    orders_visits.ov_signature_requester_path,
    orders_visits.ov_signature_requester_name,
    orders_visits.ov_signature_requester_at,
    v_orders.contract_object AS o_contract_object,
    ((v_orders.contract_description || ' ('::text) || v_orders.provider_company_code::text) || ')'::text AS o_contract_description_2,
    orders_visits.chat_status,
    orders_visits.chat_closed_at,
    orders_visits.chat_closed_user_id,
    orders_visits.chat_created_user_id,
    orders_visits.ov_costs_status,
    orders_visits.ov_costs_waiting_at,
    orders_visits.ov_costs_waiting_user_id,
    orders_visits.ov_costs_approved_at,
    orders_visits.ov_costs_approved_user_id,
    orders_visits.ov_costs_rejected_at,
    orders_visits.ov_costs_rejected_user_id,
    orders_visits.ov_costs_rejection_reason
FROM orders_visits
    LEFT JOIN v_orders ON orders_visits.o_id = v_orders.id
    LEFT JOIN cfg_orders_visits_statuses ON orders_visits.ov_status_id = cfg_orders_visits_statuses.id
    LEFT JOIN cfg_orders_visits_processing ON orders_visits.ov_processing_id = cfg_orders_visits_processing.id
    LEFT JOIN users users_teams_leaders ON orders_visits.ov_team_leader_id = users_teams_leaders.id
    LEFT JOIN cfg_orders_statuses ON orders_visits.ov_o_status_id = cfg_orders_statuses.id
    LEFT JOIN cfg_orders_suspended_reasons ON orders_visits.ov_o_suspended_reason_id = cfg_orders_suspended_reasons.id
    LEFT JOIN users users_reported ON orders_visits.ov_reported_user_id = users_reported.id
    LEFT JOIN users users_revised ON orders_visits.ov_revised_user_id = users_revised.id
    LEFT JOIN users users_disapproved ON orders_visits.ov_disapproved_user_id = users_disapproved.id
    LEFT JOIN users users_approved ON orders_visits.ov_approved_user_id = users_approved.id;

-- ============================================================
-- 4. RECRIAR VIEW v_orders_visits_assets
-- ============================================================
-- O DROP ... CASCADE acima destrói a v_orders_visits_assets, que
-- depende de v_orders_visits. Ela precisa ser recriada.

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
  assets.type_id AS asset_type_id,
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
  before_status.color AS before_status_color,
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
  after_status.color AS after_status_color,
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
