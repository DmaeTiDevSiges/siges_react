-- Recria a view v_orders_parent com a mesma estrutura de v_orders
-- filtrando apenas SS's (parent_id IS NULL)
DROP VIEW IF EXISTS public.v_orders_parent;

CREATE VIEW public.v_orders_parent AS
 SELECT orders.id,
    orders.uid,
    orders.parent_id,
    orders.company_id,
    cfg_companies.description AS company_description,
    cfg_companies.img_file_path AS company_img_file_path,
    cfg_companies.img_file_name AS company_img_file_name,
    orders.img_file_path,
    orders.img_file_name,
    orders.department_id,
    orders.contract_id,
    contracts.description AS contract_description,
    orders.provider_company_id,
    cfg_companies_provider.description AS provider_company_description,
    cfg_companies_provider.img_file_path AS provider_company_img_file_path,
    cfg_companies_provider.img_file_name AS provider_company_img_file_name,
    orders.provider_department_id,
    orders.order_mask,
    orders.type_id,
    cfg_orders_types.code AS type_code,
    cfg_orders_types.description AS type_description,
    orders.type_sub_id,
    cfg_orders_types_subs.code AS type_sub_code,
    cfg_orders_types_subs.description AS type_sub_description,
    orders.requested_services,
    orders.object_id,
    cfg_orders_objects.code AS object_code,
    cfg_orders_objects.description AS object_description,
    orders.system_parent_id,
    systems_parent.description AS system_parent_description,
    systems_parent.code AS system_parent_code,
    orders.system_id,
    cfg_systems.description AS system_description,
    cfg_systems.code AS system_code,
    orders.unit_type_parent_id,
    units_types_parent.description AS unit_type_parent_description,
    units_types_parent.code AS unit_type_parent_code,
    orders.unit_type_id,
    cfg_units_types.description AS unit_type_description,
    cfg_units_types.code AS unit_type_code,
    orders.unit_id,
    units.description_full AS unit_description,
    units.address_full AS unit_address,
    units.latitude AS unit_latitude,
    units.longitude AS unit_longitude,
    orders.requester_name,
    orders.requester_phone,
    orders.requester_team_id,
    requester_teams.code AS requester_team_code,
    orders.requested_at,
    orders.status_id,
    cfg_orders_statuses.code AS status_code,
    cfg_orders_statuses.description AS status_description,
    orders.status_at,
    orders.priority_id,
    cfg_orders_priorities.code AS priority_code,
    cfg_orders_priorities.description AS priority_description,
    orders.team_leader_id,
    users.name_short AS team_leader_name_short,
    users.email AS team_leader_email,
    orders.team_id,
    orders_teams.code AS team_code,
    orders_teams.description AS team_description,
    orders.asset_tag_id,
    cfg_assets_tags.description AS asset_tag_description,
    orders.year,
    orders.counter_parent,
    orders.counter_child,
    orders.cause_reason_id,
    cfg_orders_causes_reasons.description AS cause_reason_description,
    orders.suspended_reason_id,
    cfg_orders_suspended_reasons.description AS suspended_reason_description,
    orders.cancel_reason_id,
    cfg_orders_cancel_reasons.description AS cancel_reason_description,
    orders.canceled_team_id,
    canceled_teams.code AS canceled_team_code,
    canceled_users.name_short AS canceled_user_name_short,
    orders.plan_id,
    cfg_orders_plans.description AS plan_description,
    cfg_orders_plans.code AS plan_code,
    orders.services_value,
    orders.materials_value,
    orders.vehicles_value,
    orders.total_value,
    orders.version_mode,
    orders.created_user_id,
    orders.ov_counter,
    orders.progress,
    contracts.code AS contract_code,
    units.code AS unit_code,
    orders.img_files_names,
    clients.name AS client_name,
    clients.id AS client_id,
    orders.unit_asset_tag_id,
    orders.asset_tag_sub_id,
    orders.unit_asset_tag_has_order,
    orders.unit_asset_tag_no_has_order_user_id,
    orders.unit_asset_tag_no_has_order_at,
    cfg_assets_tags_subs.description AS asset_tag_sub_description
   FROM ((((((((((((((((((((((((((public.orders
     JOIN public.cfg_orders_types ON ((orders.type_id = cfg_orders_types.id)))
     LEFT JOIN public.cfg_orders_types_subs ON ((orders.type_sub_id = cfg_orders_types_subs.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
     LEFT JOIN public.cfg_companies ON ((orders.company_id = cfg_companies.id)))
     LEFT JOIN public.cfg_companies cfg_companies_provider ON ((orders.provider_company_id = cfg_companies_provider.id)))
     LEFT JOIN public.cfg_orders_plans ON ((orders.plan_id = cfg_orders_plans.id)))
     LEFT JOIN public.cfg_teams requester_teams ON ((orders.requester_team_id = requester_teams.id)))
     LEFT JOIN public.cfg_teams orders_teams ON ((orders.team_id = orders_teams.id)))
     LEFT JOIN public.cfg_teams canceled_teams ON ((orders.canceled_team_id = canceled_teams.id)))
     LEFT JOIN public.cfg_orders_objects ON ((orders.object_id = cfg_orders_objects.id)))
     JOIN public.cfg_orders_statuses ON ((orders.status_id = cfg_orders_statuses.id)))
     JOIN public.cfg_orders_priorities ON ((orders.priority_id = cfg_orders_priorities.id)))
     JOIN public.units ON ((orders.unit_id = units.id)))
     LEFT JOIN public.users ON ((orders.team_leader_id = users.id)))
     LEFT JOIN public.users canceled_users ON ((orders.canceled_user_id = canceled_users.id)))
     LEFT JOIN public.users unit_asset_tag_no_has_order_users ON ((orders.unit_asset_tag_no_has_order_user_id = unit_asset_tag_no_has_order_users.id)))
     JOIN public.cfg_systems systems_parent ON ((orders.system_parent_id = systems_parent.id)))
     JOIN public.cfg_systems ON ((orders.system_id = cfg_systems.id)))
     JOIN public.cfg_units_types units_types_parent ON ((orders.unit_type_parent_id = units_types_parent.id)))
     JOIN public.cfg_units_types ON ((orders.unit_type_id = cfg_units_types.id)))
     LEFT JOIN public.cfg_assets_tags ON ((orders.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((orders.asset_tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_orders_causes_reasons ON ((orders.cause_reason_id = cfg_orders_causes_reasons.id)))
     LEFT JOIN public.cfg_orders_suspended_reasons ON ((orders.suspended_reason_id = cfg_orders_suspended_reasons.id)))
     LEFT JOIN public.cfg_orders_cancel_reasons ON ((orders.cancel_reason_id = cfg_orders_cancel_reasons.id)))
     LEFT JOIN public.clients ON ((orders.client_id = clients.id)))
  WHERE (orders.parent_id IS NULL);
