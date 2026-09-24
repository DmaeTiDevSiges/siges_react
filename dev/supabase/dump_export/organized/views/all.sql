CREATE VIEW public.v_activities WITH (security_invoker='true') AS
 SELECT cfg_activities.id,
    cfg_activities.description,
    cfg_activities.is_available,
    cfg_activities.code
   FROM public.cfg_activities
  WHERE (cfg_activities.is_deleted = false)
  ORDER BY cfg_activities.description;

CREATE VIEW public.v_assets WITH (security_invoker='true') AS
 SELECT assets.company_id,
    cfg_companies.description AS company_description,
    cfg_companies_owners.description AS company_owner_description,
    assets.company_owner_id,
    assets.id,
    assets.code,
    assets.description,
    assets.searchable,
    assets.tag_id,
    cfg_assets_tags.description AS tag_description,
    assets.tag_sub_id,
    cfg_assets_tags_subs.description AS tag_sub_description,
    assets.unit_asset_tag_id,
    assets.location,
    assets.unit_id,
    units.code AS unit_code,
    units.description_full AS unit_description,
    assets.status_id,
    cfg_assets_statuses.description AS status_description,
    cfg_assets_statuses.code AS status_code,
    assets.status_at,
    assets.type_id,
    cfg_assets_types.description AS type_description,
    assets.priority_id,
    cfg_assets_priorities.code AS priority_code,
    cfg_assets_priorities.description AS priority_description,
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
    cfg_assets_couplings_models.description AS coupling_model_description,
    assets.comments,
    assets.acquisition_at,
    assets.acquisition_value,
    assets.img_file_path,
    assets.img_file_name,
    assets.img_file_name_thumb,
    assets.version_mode,
    cfg_assets_statuses.color AS status_color,
    assets.client_id,
    clients.name AS client_name,
    assets.material_id,
    materials.code AS material_code,
    materials.description AS material_description,
    materials.unit AS material_unit
   FROM (((((((((((public.assets
     LEFT JOIN public.units ON ((assets.unit_id = units.id)))
     LEFT JOIN public.clients ON ((assets.client_id = clients.id)))
     LEFT JOIN public.cfg_companies ON ((assets.company_id = cfg_companies.id)))
     LEFT JOIN public.cfg_companies cfg_companies_owners ON ((assets.company_owner_id = cfg_companies_owners.id)))
     LEFT JOIN public.cfg_assets_tags ON ((assets.tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((assets.tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses ON ((assets.status_id = cfg_assets_statuses.id)))
     LEFT JOIN public.cfg_assets_types ON ((assets.type_id = cfg_assets_types.id)))
     LEFT JOIN public.cfg_assets_priorities ON ((assets.priority_id = cfg_assets_priorities.id)))
     LEFT JOIN public.cfg_assets_couplings_models ON ((assets.coupling_model_id = cfg_assets_couplings_models.id)))
     LEFT JOIN public.materials ON ((assets.material_id = materials.id)))
  WHERE (assets.is_deleted = false);

CREATE VIEW public.v_contracts_services WITH (security_invoker='true') AS
 SELECT contracts_services.id,
    contracts_services.contract_id,
    contracts_services.service_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    contracts_services.value_unit,
    contracts_services.discount,
    contracts_services.amount,
    contracts_services.value_total,
    contracts_services.version_mode
   FROM (public.contracts_services
     JOIN public.cfg_services ON ((contracts_services.service_id = cfg_services.id)))
  WHERE (contracts_services.is_deleted = false)
  ORDER BY cfg_services.description;

CREATE VIEW public.v_orders_visits_extras WITH (security_invoker='true') AS
 SELECT orders_visits_extras.id,
    orders_visits_extras.o_mask,
    orders_visits_extras.unit_id,
    units.description_full AS unit_description,
    orders_visits_extras.system_parent_id,
    systems_parent.description AS system_parent_description,
    systems_parent.code AS system_parent_code,
    orders_visits_extras.system_id,
    cfg_systems.description AS system_description,
    cfg_systems.code AS system_code,
    orders_visits_extras.unit_type_parent_id,
    units_types_parent.description AS unit_type_parent_description,
    units_types_parent.code AS unit_type_parent_code,
    orders_visits_extras.unit_type_id,
    cfg_units_types.description AS unit_type_description,
    cfg_units_types.code AS unit_type_code,
    orders_visits_extras.o_type_id,
    cfg_orders_types.code AS o_type_code,
    cfg_orders_types.description AS o_type_description,
    orders_visits_extras.o_type_sub_id,
    cfg_orders_types_subs.code AS o_type_sub_code,
    cfg_orders_types_subs.description AS o_type_sub_description,
    orders_visits_extras.requested_services,
    orders_visits_extras.asset_tag_id,
    cfg_assets_tags.description AS asset_tag_description,
    orders_visits_extras.provider_company_id,
    cfg_companies_provider.description AS provider_company_description,
    cfg_companies_provider.img_file_path AS provider_company_img_file_path,
    cfg_companies_provider.img_file_name AS provider_company_img_file_name,
    orders_visits_extras.priority_id,
    cfg_orders_priorities.code AS priority_code,
    cfg_orders_priorities.description AS priority_description,
    orders_visits_extras.started_at,
    orders_visits_extras.started_at_date,
    orders_visits_extras.started_at_hour_min,
    orders_visits_extras.ended_at,
    orders_visits_extras.ended_at_date,
    orders_visits_extras.ended_at_hour_min,
    orders_visits_extras.duration_hours,
    orders_visits_extras.processing_id,
    cfg_orders_visits_extras_processing.description AS processing_description,
    orders_visits_extras.comments,
    orders_visits_extras.is_archived,
    orders_visits_extras.created_at,
    orders_visits_extras.created_user_id,
    users_created.name_short AS created_user_name_short,
    orders_visits_extras.o_cause_reason_id,
    cfg_orders_causes_reasons.description AS o_cause_reason_description,
    orders_visits_extras.reported_at,
    orders_visits_extras.reported_user_id,
    users_reported.name_short AS reported_user_name_short,
    orders_visits_extras.is_blocked,
    orders_visits_extras.unblocked_at,
    orders_visits_extras.unblocked_user_id,
    users_unblocked.name_short AS unblocked_user_name_short,
    orders_visits_extras.revised_at,
    orders_visits_extras.revised_user_id,
    users_revised.name_short AS revised_user_name_short,
    orders_visits_extras.disapproved_user_id,
    orders_visits_extras.disapproved_at,
    users_disapproved.name_short AS disapproved_user_name_short,
    orders_visits_extras.disapproved_comments,
    orders_visits_extras.approved_at,
    orders_visits_extras.approved_user_id,
    users_approved.name_short AS approved_user_name_short,
    orders_visits_extras.archived_at,
    orders_visits_extras.archived_user_id,
    users_archived.name_short AS archived_user_name_short,
    orders_visits_extras.unarchived_at,
    orders_visits_extras.unarchived_user_id,
    users_unarchived.name_short AS unarchived_user_name_short,
    orders_visits_extras.team_leader_id,
    users_teams_leaders.name_short AS team_leader_user_name_short,
    users_teams_leaders.img_file_path AS team_leader_user_img_file_path,
    users_teams_leaders.img_file_name AS team_leader_user_img_file_name,
    orders_visits_extras.team_amount,
    orders_visits_extras.team_id,
    cfg_teams.description AS team_description,
    orders_visits_extras.team_names_short
   FROM ((((((((((((((((((((((public.orders_visits_extras
     LEFT JOIN public.cfg_orders_visits_extras_processing ON ((orders_visits_extras.processing_id = cfg_orders_visits_extras_processing.id)))
     LEFT JOIN public.cfg_orders_types ON ((orders_visits_extras.o_type_id = cfg_orders_types.id)))
     LEFT JOIN public.cfg_orders_types_subs ON ((orders_visits_extras.o_type_sub_id = cfg_orders_types_subs.id)))
     LEFT JOIN public.cfg_assets_tags ON ((orders_visits_extras.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.units ON ((orders_visits_extras.unit_id = units.id)))
     LEFT JOIN public.cfg_companies cfg_companies_provider ON ((orders_visits_extras.provider_company_id = cfg_companies_provider.id)))
     LEFT JOIN public.cfg_orders_priorities ON ((orders_visits_extras.priority_id = cfg_orders_priorities.id)))
     LEFT JOIN public.users users_created ON ((orders_visits_extras.created_user_id = users_created.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits_extras.reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_unblocked ON ((orders_visits_extras.unblocked_user_id = users_unblocked.id)))
     LEFT JOIN public.users users_unarchived ON ((orders_visits_extras.unarchived_user_id = users_unarchived.id)))
     LEFT JOIN public.users users_revised ON ((orders_visits_extras.revised_user_id = users_revised.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits_extras.disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits_extras.approved_user_id = users_approved.id)))
     LEFT JOIN public.users users_archived ON ((orders_visits_extras.archived_user_id = users_archived.id)))
     LEFT JOIN public.users users_teams_leaders ON ((orders_visits_extras.team_leader_id = users_teams_leaders.id)))
     LEFT JOIN public.cfg_teams ON ((orders_visits_extras.team_id = cfg_teams.id)))
     LEFT JOIN public.cfg_systems systems_parent ON ((orders_visits_extras.system_parent_id = systems_parent.id)))
     LEFT JOIN public.cfg_systems ON ((orders_visits_extras.system_id = cfg_systems.id)))
     LEFT JOIN public.cfg_units_types units_types_parent ON ((orders_visits_extras.unit_type_parent_id = units_types_parent.id)))
     LEFT JOIN public.cfg_units_types ON ((orders_visits_extras.unit_type_id = cfg_units_types.id)))
     LEFT JOIN public.cfg_orders_causes_reasons ON ((orders_visits_extras.o_cause_reason_id = cfg_orders_causes_reasons.id)))
  WHERE (orders_visits_extras.is_deleted = false);

CREATE VIEW public.v_orders_visits_extras_no_archived WITH (security_invoker='true') AS
 SELECT vove.id,
    vove.o_mask,
    vove.unit_id,
    vove.unit_description,
    vove.system_parent_id,
    vove.system_parent_description,
    vove.system_parent_code,
    vove.system_id,
    vove.system_description,
    vove.system_code,
    vove.unit_type_parent_id,
    vove.unit_type_parent_description,
    vove.unit_type_parent_code,
    vove.unit_type_id,
    vove.unit_type_description,
    vove.unit_type_code,
    vove.o_type_id,
    vove.o_type_code,
    vove.o_type_description,
    vove.o_type_sub_id,
    vove.o_type_sub_code,
    vove.o_type_sub_description,
    vove.requested_services,
    vove.asset_tag_id,
    vove.asset_tag_description,
    vove.provider_company_id,
    vove.provider_company_description,
    vove.provider_company_img_file_path,
    vove.provider_company_img_file_name,
    vove.priority_id,
    vove.priority_code,
    vove.priority_description,
    vove.started_at,
    vove.started_at_date,
    vove.started_at_hour_min,
    vove.ended_at,
    vove.ended_at_date,
    vove.ended_at_hour_min,
    vove.duration_hours,
    vove.processing_id,
    vove.processing_description,
    vove.comments,
    vove.is_archived,
    vove.created_at,
    vove.created_user_id,
    vove.created_user_name_short,
    vove.o_cause_reason_id,
    vove.o_cause_reason_description,
    vove.reported_at,
    vove.reported_user_id,
    vove.reported_user_name_short,
    vove.is_blocked,
    vove.unblocked_at,
    vove.unblocked_user_id,
    vove.unblocked_user_name_short,
    vove.revised_at,
    vove.revised_user_id,
    vove.revised_user_name_short,
    vove.disapproved_user_id,
    vove.disapproved_at,
    vove.disapproved_user_name_short,
    vove.disapproved_comments,
    vove.approved_at,
    vove.approved_user_id,
    vove.approved_user_name_short,
    vove.archived_at,
    vove.archived_user_id,
    vove.archived_user_name_short,
    vove.unarchived_at,
    vove.unarchived_user_id,
    vove.unarchived_user_name_short,
    vove.team_leader_id,
    vove.team_leader_user_name_short,
    vove.team_leader_user_img_file_path,
    vove.team_leader_user_img_file_name,
    vove.team_amount,
    vove.team_id,
    vove.team_description,
    vove.team_names_short
   FROM public.v_orders_visits_extras vove
  WHERE (vove.is_archived = false);

CREATE VIEW public.v_orders WITH (security_invoker='true') AS
 SELECT o.id,
    o.uid,
    o.parent_id,
    o.company_id,
    c.description AS company_description,
    c.img_file_path AS company_img_file_path,
    c.img_file_name AS company_img_file_name,
    o.img_file_path,
    o.img_file_name,
    o.department_id,
    o.contract_id,
    ct.description AS contract_description,
    ct.code AS contract_code,
    o.provider_company_id,
    cp.description AS provider_company_description,
    cp.img_file_path AS provider_company_img_file_path,
    cp.img_file_name AS provider_company_img_file_name,
    o.provider_department_id,
    o.order_mask,
    o.type_id,
    ot.code AS type_code,
    ot.description AS type_description,
    o.type_sub_id,
    ots.code AS type_sub_code,
    ots.description AS type_sub_description,
    o.requested_services,
    o.object_id,
    oo.code AS object_code,
    oo.description AS object_description,
    o.system_parent_id,
    sp.description AS system_parent_description,
    sp.code AS system_parent_code,
    o.system_id,
    s.description AS system_description,
    s.code AS system_code,
    o.unit_type_parent_id,
    utp.description AS unit_type_parent_description,
    utp.code AS unit_type_parent_code,
    o.unit_type_id,
    ut.description AS unit_type_description,
    ut.code AS unit_type_code,
    o.unit_id,
    u.description_full AS unit_description,
    u.address_full AS unit_address,
    u.latitude AS unit_latitude,
    u.longitude AS unit_longitude,
    u.code AS unit_code,
    o.requester_name,
    o.requester_phone,
    o.requester_team_id,
    rt.code AS requester_team_code,
    o.requested_at,
    o.status_id,
    os.code AS status_code,
    os.description AS status_description,
    o.status_at,
    o.priority_id,
    op.code AS priority_code,
    op.description AS priority_description,
    o.team_leader_id,
    ul.name_short AS team_leader_name_short,
    ul.email AS team_leader_email,
    o.team_id,
    t.code AS team_code,
    t.description AS team_description,
    o.asset_tag_id,
    at.description AS asset_tag_description,
    o.asset_tag_sub_id,
    ats.description AS asset_tag_sub_description,
    o.year,
    o.counter_parent,
    o.counter_child,
    o.cause_reason_id,
    cr.description AS cause_reason_description,
    o.suspended_reason_id,
    sr.description AS suspended_reason_description,
    o.cancel_reason_id,
    clr.description AS cancel_reason_description,
    o.canceled_team_id,
    ct2.code AS canceled_team_code,
    cu.name_short AS canceled_user_name_short,
    o.plan_id,
    pl.description AS plan_description,
    pl.code AS plan_code,
    o.services_value,
    o.materials_value,
    o.vehicles_value,
    o.total_value,
    o.version_mode,
    o.created_user_id,
    o.ov_counter,
    o.progress,
    o.img_files_names,
    cl.name AS client_name,
    cl.id AS client_id,
    o.unit_asset_tag_id,
    o.unit_asset_tag_has_order,
    o.unit_asset_tag_no_has_order_user_id,
    o.unit_asset_tag_no_has_order_at,
    ct.object AS contract_object,
    cp.code AS provider_company_code
   FROM (((((((((((((((((((((((((public.orders o
     JOIN public.cfg_orders_types ot ON ((ot.id = o.type_id)))
     JOIN public.cfg_orders_statuses os ON ((os.id = o.status_id)))
     JOIN public.cfg_orders_priorities op ON ((op.id = o.priority_id)))
     JOIN public.units u ON ((u.id = o.unit_id)))
     JOIN public.cfg_systems sp ON ((sp.id = o.system_parent_id)))
     JOIN public.cfg_systems s ON ((s.id = o.system_id)))
     JOIN public.cfg_units_types utp ON ((utp.id = o.unit_type_parent_id)))
     JOIN public.cfg_units_types ut ON ((ut.id = o.unit_type_id)))
     LEFT JOIN public.cfg_orders_types_subs ots ON ((ots.id = o.type_sub_id)))
     LEFT JOIN public.contracts ct ON ((ct.id = o.contract_id)))
     LEFT JOIN public.cfg_companies c ON ((c.id = o.company_id)))
     LEFT JOIN public.cfg_companies cp ON ((cp.id = o.provider_company_id)))
     LEFT JOIN public.cfg_orders_plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN public.cfg_teams rt ON ((rt.id = o.requester_team_id)))
     LEFT JOIN public.cfg_teams t ON ((t.id = o.team_id)))
     LEFT JOIN public.cfg_teams ct2 ON ((ct2.id = o.canceled_team_id)))
     LEFT JOIN public.cfg_orders_objects oo ON ((oo.id = o.object_id)))
     LEFT JOIN public.users ul ON ((ul.id = o.team_leader_id)))
     LEFT JOIN public.users cu ON ((cu.id = o.canceled_user_id)))
     LEFT JOIN public.cfg_assets_tags at ON ((at.id = o.asset_tag_id)))
     LEFT JOIN public.cfg_assets_tags_subs ats ON ((ats.id = o.asset_tag_sub_id)))
     LEFT JOIN public.cfg_orders_causes_reasons cr ON ((cr.id = o.cause_reason_id)))
     LEFT JOIN public.cfg_orders_suspended_reasons sr ON ((sr.id = o.suspended_reason_id)))
     LEFT JOIN public.cfg_orders_cancel_reasons clr ON ((clr.id = o.cancel_reason_id)))
     LEFT JOIN public.clients cl ON ((cl.id = o.client_id)));

CREATE VIEW public.v_dash_admin_orders_filters_open WITH (security_invoker='true') AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.contract_code,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.unit_code,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));

CREATE VIEW public.v_dash_admin_orders_parent_filters_open WITH (security_invoker='true') AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.contract_code,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.unit_code,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id IS NULL));

CREATE VIEW public.v_orders_types_activities WITH (security_invoker='true') AS
 SELECT cfg_orders_types_activities.id,
    cfg_orders_types_activities.o_type_id,
    cfg_orders_types_activities.activity_id,
    cfg_activities.description AS activity_description,
    cfg_orders_types_activities.is_available,
    cfg_orders_types_activities.version_mode
   FROM (public.cfg_orders_types_activities
     JOIN public.cfg_activities ON ((cfg_orders_types_activities.activity_id = cfg_activities.id)))
  ORDER BY cfg_activities.description;

CREATE VIEW public.v_technicals_manuals WITH (security_invoker='true') AS
 SELECT technicals_manuals.id,
    technicals_manuals.company_id,
    technicals_manuals.code,
    technicals_manuals.description AS tm_description,
    technicals_manuals.doc_file_path,
    technicals_manuals.doc_file_name,
    technicals_manuals.assets_amount,
    technicals_manuals.asset_type_id,
    cfg_assets_types.description AS asset_type_description
   FROM (public.technicals_manuals
     JOIN public.cfg_assets_types ON ((technicals_manuals.asset_type_id = cfg_assets_types.id)));

CREATE VIEW public.v_units_by_assets_tags WITH (security_invoker='true') AS
 SELECT cfg_units_assets_tags.unit_id,
    u.system_parent_id,
    u.system_id,
    u.unit_type_parent_id,
    u.unit_type_id,
    u.latitude,
    u.longitude,
    u.description_full,
    cfg_units_assets_tags.asset_tag_id,
    cfg_assets_tags.description AS tag_description,
    max(cfg_units_assets_tags.last_reported_at) AS last_reported_at,
    sum(cfg_units_assets_tags.last_asset_available_rate) AS total_last_asset_available_rate
   FROM ((public.cfg_units_assets_tags
     LEFT JOIN public.cfg_assets_tags ON ((cfg_units_assets_tags.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.units u ON ((cfg_units_assets_tags.unit_id = u.id)))
  WHERE (cfg_units_assets_tags.is_deleted = false)
  GROUP BY cfg_units_assets_tags.unit_id, u.system_parent_id, u.system_id, u.unit_type_parent_id, u.unit_type_id, u.latitude, u.longitude, u.description_full, cfg_units_assets_tags.asset_tag_id, cfg_assets_tags.description
  ORDER BY (sum(cfg_units_assets_tags.last_asset_available_rate));

CREATE VIEW public.v_units_assets_tags WITH (security_invoker='true') AS
 SELECT cuat.id,
    cuat.unit_id,
    u.system_parent_id,
    u.system_id,
    u.code AS unit_code,
    u.description_full AS unit_description,
    cuat.asset_tag_id,
    at.description AS tag_description,
    cuat.asset_tag_sub_id,
    ats.description AS tag_sub_description,
    cuat.asset_tag_tag_sub_description,
    cuat.last_status_id,
    s.description AS last_status_description,
    s.code AS last_status_code,
    cuat.last_is_available,
    cuat.last_processing_id,
    ap.description AS last_processing_description,
    cuat.last_created_at,
    cuat.last_created_user_id,
    uc.name_short AS last_created_user_name_short,
    cuat.last_asset_available_id,
    cuat.last_comments,
    cuat.last_asset_unavailable_reason_id,
    ur.description AS last_asset_unavailable_reason_description,
    cuat.last_file_path,
    cuat.last_file_name,
    cuat.last_reported_at,
    cuat.last_reported_user_id,
    urp.name_short AS last_reported_user_name_short,
    cuat.asset_available_rate,
    cuat.last_asset_available_rate,
    cuat.is_deleted,
    cuat.deleted_at,
    cuat.deleted_user_id,
    ud.name_short AS deleted_user_name_short,
    cuat.operation_unit,
    cuat.last_operation_record,
    cuat.flow_rate_unit,
    cuat.flow_rate_min,
    cuat.flow_rate_max,
    cuat.last_flow_rate,
    cuat.flow_rate_is_visible,
    cuat.power_unit,
    cuat.power_min,
    cuat.power_max,
    cuat.last_power,
    cuat.power_is_visible,
    cuat.pressure_unit,
    cuat.pressure_min,
    cuat.pressure_max,
    cuat.last_pressure,
    cuat.pressure_is_visible,
    cuat.last_is_on,
    cuat.last_o_id,
    cuat.op_counter,
    cuat.is_active
   FROM (((((((((public.cfg_units_assets_tags cuat
     LEFT JOIN public.cfg_assets_tags at ON ((cuat.asset_tag_id = at.id)))
     LEFT JOIN public.cfg_assets_tags_subs ats ON ((cuat.asset_tag_sub_id = ats.id)))
     LEFT JOIN public.cfg_assets_statuses s ON ((cuat.last_status_id = s.id)))
     LEFT JOIN public.cfg_assets_available_processing ap ON ((cuat.last_processing_id = ap.id)))
     LEFT JOIN public.users uc ON ((cuat.last_created_user_id = uc.id)))
     LEFT JOIN public.users urp ON ((cuat.last_reported_user_id = urp.id)))
     LEFT JOIN public.cfg_assets_unavailable_reasons ur ON ((cuat.last_asset_unavailable_reason_id = ur.id)))
     LEFT JOIN public.users ud ON ((cuat.deleted_user_id = ud.id)))
     LEFT JOIN public.units u ON ((cuat.unit_id = u.id)))
  WHERE (cuat.is_deleted = false)
  ORDER BY at.description, ats.description;

CREATE VIEW public.v_units WITH (security_invoker='true') AS
 SELECT units.id,
    units.code,
    units.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    units.system_parent_id,
    systems_parent.code AS system_parent_code,
    systems_parent.description AS system_parent_description,
    units.system_id,
    systems_child.code AS system_child_code,
    systems_child.description AS system_child_description,
    units.unit_type_parent_id,
    units_types_parent.code AS unit_type_parent_code,
    units_types_parent.description AS unit_type_parent_description,
    units.unit_type_id,
    units_types_child.code AS unit_type_child_code,
    units_types_child.description AS unit_type_child_description,
    units.status_id,
    cfg_units_statuses.description AS status_description,
    units.description,
    units.description_full,
    units.street_name,
    units.street_number,
    units.street_complement,
    units.address_full,
    units.latitude,
    units.longitude,
    units.installation_code_power_supply,
    units.version_mode,
    units.client_id,
    clients.name AS client_name
   FROM (((((((public.units
     JOIN public.cfg_companies ON ((units.company_id = cfg_companies.id)))
     JOIN public.cfg_systems systems_child ON ((units.system_id = systems_child.id)))
     JOIN public.cfg_systems systems_parent ON ((units.system_parent_id = systems_parent.id)))
     JOIN public.cfg_units_types units_types_parent ON ((units.unit_type_parent_id = units_types_parent.id)))
     JOIN public.cfg_units_types units_types_child ON ((units.unit_type_id = units_types_child.id)))
     JOIN public.cfg_units_statuses ON ((units.status_id = cfg_units_statuses.id)))
     LEFT JOIN public.clients ON ((units.client_id = clients.id)))
  ORDER BY units.description;

CREATE VIEW public.v_app WITH (security_invoker='true') AS
 SELECT cfg_app.id,
    cfg_app.apk_url,
    cfg_app.version_app,
    cfg_app.version_app_mask,
    cfg_app.logo_url,
    cfg_app.version_app_offline,
    cfg_app.n8n_available_last_at
   FROM public.cfg_app;

CREATE VIEW public.v_app_notices WITH (security_invoker='true') AS
 SELECT n.id,
    n.title,
    n.message,
    n.category_id,
    n.severity_id,
    n.start_date,
    n.end_date,
    n.created_at,
    n.updated_at,
    n.is_active,
    n.dashboards,
    n.created_user_id,
    c.code AS category_code,
    c.label AS category_label,
    c.color AS category_color,
    c.icon AS category_icon,
    s.code AS severity_code,
    s.label AS severity_label,
    s.color AS severity_color,
    s.icon AS severity_icon,
    u.name_full AS creator_name,
    to_char(n.start_date, 'DD/MM/YYYY HH24:MI'::text) AS start_date_formatted,
    to_char(n.end_date, 'DD/MM/YYYY HH24:MI'::text) AS end_date_formatted,
    to_char(n.created_at, 'DD/MM/YYYY HH24:MI'::text) AS created_at_formatted
   FROM (((public.cfg_app_notices n
     JOIN public.cfg_app_notices_categories c ON ((n.category_id = c.id)))
     JOIN public.cfg_app_notices_severities s ON ((n.severity_id = s.id)))
     LEFT JOIN public.users u ON ((n.created_user_id = u.id)));

CREATE VIEW public.v_app_offline_updates WITH (security_invoker='true') AS
 SELECT cfg_app_offline_updates.id,
    cfg_app_offline_updates.table_name,
    cfg_app_offline_updates.version_offline,
    cfg_app_offline_updates.updated_at
   FROM public.cfg_app_offline_updates
  ORDER BY cfg_app_offline_updates.table_name;

CREATE VIEW public.v_app_pages WITH (security_invoker='true') AS
 SELECT cfg_app_pages.id,
    cfg_app_pages.code,
    cfg_app_pages.description,
    cfg_app_pages.is_available_provider
   FROM public.cfg_app_pages;

CREATE VIEW public.v_assets_available WITH (security_invoker='true') AS
 SELECT assets_available.id,
    assets_available.unit_id,
    units.description_full AS unit_description,
    assets_available.asset_tag_id,
    cfg_assets_tags.description AS tag_description,
    assets_available.asset_tag_sub_id,
    cfg_assets_tags_subs.description AS tag_sub_description,
    assets_available.is_available,
    assets_available.status_id,
    cfg_assets_statuses.description AS status_description,
    cfg_assets_statuses.code AS status_code,
    assets_available.file_path,
    assets_available.file_name,
    assets_available.processing_id,
    assets_available.is_on,
    cfg_assets_available_processing.description AS processing_description,
    assets_available.comments,
    assets_available.reported_at,
    assets_available.reported_user_id,
    users_reported.name_short AS reported_user_name_short,
    assets_available.created_at,
    assets_available.created_user_id,
    users_created.name_short AS created_user_name_short,
    assets_available.asset_unavailable_reason_id,
    cfg_assets_unavailable_reasons.description AS asset_unavailable_reason_description,
    cfg_assets_unavailable_reasons.code AS asset_unavailable_reason_code,
    assets_available.operation_record,
    assets_available.operation_unit,
    assets_available.flow_rate_unit,
    assets_available.flow_rate_min,
    assets_available.flow_rate_max,
    assets_available.flow_rate_is_on,
    assets_available.flow_rate_is_available,
    assets_available.power_unit,
    assets_available.power_min,
    assets_available.power_max,
    assets_available.power_is_on,
    assets_available.power_is_available,
    assets_available.pressure_min,
    assets_available.pressure_max,
    assets_available.pressure_is_on,
    assets_available.pressure_is_available,
    assets_available.company_id,
    assets_available.provider_company_id,
    cfg_providers_companies.img_file_path AS provider_company_img_file_path,
    cfg_providers_companies.img_file_name AS provider_company_img_file_name,
    assets_available.o_id,
    assets_available.o_mask,
    users_created.mobile_whatsapp,
    assets_available.unit_reported_distance_m
   FROM (((((((((public.assets_available
     LEFT JOIN public.cfg_assets_tags ON ((assets_available.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((assets_available.asset_tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses ON ((assets_available.status_id = cfg_assets_statuses.id)))
     LEFT JOIN public.cfg_assets_available_processing ON ((assets_available.processing_id = cfg_assets_available_processing.id)))
     LEFT JOIN public.cfg_assets_unavailable_reasons ON ((assets_available.asset_unavailable_reason_id = cfg_assets_unavailable_reasons.id)))
     LEFT JOIN public.users users_created ON ((assets_available.created_user_id = users_created.id)))
     LEFT JOIN public.users users_reported ON ((assets_available.reported_user_id = users_reported.id)))
     LEFT JOIN public.cfg_companies cfg_providers_companies ON ((assets_available.provider_company_id = cfg_providers_companies.id)))
     LEFT JOIN public.units ON ((assets_available.unit_id = units.id)))
  ORDER BY cfg_assets_tags.description, cfg_assets_tags_subs.description;

CREATE VIEW public.v_assets_couplings_models WITH (security_invoker='true') AS
 SELECT cfg_assets_couplings_models.id,
    cfg_assets_couplings_models.code,
    cfg_assets_couplings_models.description,
    cfg_assets_couplings_models.is_available,
    cfg_assets_couplings_models.is_deleted,
    cfg_assets_couplings_models.version_mode
   FROM public.cfg_assets_couplings_models
  WHERE (cfg_assets_couplings_models.is_deleted = false)
  ORDER BY cfg_assets_couplings_models.description;

CREATE VIEW public.v_assets_followers WITH (security_invoker='true') AS
 SELECT assets_followers.id,
    assets_followers.asset_id,
    assets_followers.user_id AS follower_id
   FROM public.assets_followers;

CREATE VIEW public.v_assets_loans AS
 SELECT al.id,
    al.asset_id,
    al.borrower_name,
    al.lender_user_id,
    al.expected_return_date,
    al.actual_return_date,
    al.status,
    al.notes,
    al.is_deleted,
    al.created_at,
    al.updated_at,
    al.created_user_id,
    al.signature_delivery_path,
    al.signature_delivery_name,
    al.signature_delivery_at,
    al.signature_delivery_signer_name,
    al.signature_return_path,
    al.signature_return_name,
    al.signature_return_at,
    al.signature_return_signer_name,
    al.inspector_delivery_user_id,
    al.inspector_return_user_id,
    al.items_checklists_divergent_count,
    a.code AS asset_code,
    a.description AS asset_description,
    a.serial AS asset_serial,
    a.brand AS asset_brand,
    a.model AS asset_model,
    a.img_file_path AS asset_img_path,
    a.img_file_name AS asset_img_name,
    at.description AS asset_type_name,
    ul.name_full AS lender_name,
    ul.name_short AS lender_name_short,
    ud.name_full AS inspector_delivery_name,
    ur.name_full AS inspector_return_name,
        CASE
            WHEN (((al.status)::text = 'pending'::text) AND (al.expected_return_date < CURRENT_DATE)) THEN 'overdue'::character varying
            ELSE al.status
        END AS computed_status
   FROM (((((public.assets_loans al
     JOIN public.assets a ON ((al.asset_id = a.id)))
     LEFT JOIN public.cfg_assets_types at ON ((a.type_id = at.id)))
     LEFT JOIN public.users ul ON ((al.lender_user_id = ul.id)))
     LEFT JOIN public.users ud ON ((al.inspector_delivery_user_id = ud.id)))
     LEFT JOIN public.users ur ON ((al.inspector_return_user_id = ur.id)))
  WHERE (al.is_deleted = false);

CREATE VIEW public.v_assets_materials WITH (security_invoker='true') AS
 SELECT assets_materials.id,
    assets_materials.asset_id,
    materials.id AS material_id,
    materials.code AS material_code,
    materials.description AS material_description,
    materials.unit AS material_unit,
    assets_materials.amount,
    assets_materials.brand_model,
    assets_materials.location,
    assets_materials.is_original,
    assets_materials.version_mode
   FROM (public.assets_materials
     JOIN public.materials ON ((assets_materials.material_id = materials.id)))
  WHERE (assets_materials.is_deleted = false)
  ORDER BY materials.description;

CREATE VIEW public.v_assets_priorities WITH (security_invoker='true') AS
 SELECT cfg_assets_priorities.id,
    cfg_assets_priorities.code,
    cfg_assets_priorities.description,
    cfg_assets_priorities.is_available
   FROM public.cfg_assets_priorities
  ORDER BY cfg_assets_priorities.description;

CREATE VIEW public.v_assets_statuses WITH (security_invoker='true') AS
 SELECT cfg_assets_statuses.id,
    cfg_assets_statuses.code,
    cfg_assets_statuses.description,
    cfg_assets_statuses.is_available
   FROM public.cfg_assets_statuses
  ORDER BY cfg_assets_statuses.description;

CREATE VIEW public.v_assets_tags WITH (security_invoker='true') AS
 SELECT cfg_assets_tags.id,
    cfg_assets_tags.company_id,
    cfg_assets_tags.code,
    cfg_assets_tags.description,
    cfg_assets_tags.is_available
   FROM public.cfg_assets_tags
  WHERE (cfg_assets_tags.is_deleted = false)
  ORDER BY cfg_assets_tags.description;

CREATE VIEW public.v_assets_tags_subs WITH (security_invoker='true') AS
 SELECT cfg_assets_tags_subs.id,
    cfg_assets_tags_subs.company_id,
    cfg_assets_tags_subs.code,
    cfg_assets_tags_subs.description,
    cfg_assets_tags_subs.is_available
   FROM public.cfg_assets_tags_subs
  WHERE (cfg_assets_tags_subs.is_deleted = false)
  ORDER BY cfg_assets_tags_subs.description;

CREATE VIEW public.v_assets_types WITH (security_invoker='true') AS
 SELECT cfg_assets_types.id,
    cfg_assets_types.company_id,
    cfg_assets_types.code,
    cfg_assets_types.description,
    cfg_assets_types.is_available
   FROM public.cfg_assets_types
  WHERE (cfg_assets_types.is_deleted = false)
  ORDER BY cfg_assets_types.description;

CREATE VIEW public.v_assets_unavailable_reasons WITH (security_invoker='true') AS
 SELECT cfg_assets_unavailable_reasons.id,
    cfg_assets_unavailable_reasons.code,
    cfg_assets_unavailable_reasons.description,
    cfg_assets_unavailable_reasons.is_available
   FROM public.cfg_assets_unavailable_reasons
  ORDER BY cfg_assets_unavailable_reasons.description;

CREATE VIEW public.v_companies WITH (security_invoker='true') AS
 SELECT cfg_companies.id,
    cfg_companies.code,
    cfg_companies.description,
    cfg_companies.img_file_path,
    cfg_companies.img_file_name,
    cfg_companies.is_available,
    cfg_companies.email_sufix
   FROM public.cfg_companies
  ORDER BY cfg_companies.code;

CREATE VIEW public.v_contracts WITH (security_invoker='true') AS
 SELECT contracts.id,
    contracts.client_company_id,
    client_company.description AS client_company_description,
    contracts.client_department_id,
    contracts.provider_company_id,
    provider_company.description AS provider_company_description,
    provider_company.code AS provider_company_code,
    provider_company.img_file_name AS provider_company_img_file_name,
    provider_company.img_file_path AS provider_company_img_file_path,
    contracts.provider_department_id,
    contracts.code,
    (((contracts.description || ' ('::text) || (provider_company.code)::text) || ')'::text) AS description,
    contracts.status_id,
    cfg_contracts_statuses.code AS status_code,
    cfg_contracts_statuses.description AS status_description,
    contracts.is_available,
    contracts.is_deleted,
    contracts.version,
    contracts.default_ov_asset_id,
    contracts.default_activity_id,
    contracts.client_id
   FROM (((public.contracts
     JOIN public.cfg_companies provider_company ON ((contracts.provider_company_id = provider_company.id)))
     JOIN public.cfg_companies client_company ON ((contracts.client_company_id = client_company.id)))
     JOIN public.cfg_contracts_statuses ON ((contracts.status_id = cfg_contracts_statuses.id)))
  WHERE (contracts.is_deleted = false)
  ORDER BY client_company.description, provider_company.description;

CREATE VIEW public.v_contracts_evaluation_requirements WITH (security_invoker='true') AS
 SELECT cer.id,
    cer.contract_id,
    cer.evaluation_id,
    cer.weight,
    cer.is_available,
    er.description AS evaluation_description,
    er.code AS evaluation_code
   FROM (public.contracts_evaluation_requirements cer
     JOIN public.cfg_evaluation_requirements er ON ((er.id = cer.evaluation_id)))
  WHERE ((cer.is_deleted = false) AND (er.is_deleted = false));

CREATE VIEW public.v_contracts_managers WITH (security_invoker='true') AS
 SELECT contracts_managers.id,
    contracts_managers.contract_id,
    contracts_managers.manager_id,
    contracts_managers.version_mode,
    users.name_full,
    users.name_short,
    users.email,
    users.img_file_path AS manager_img_file_path,
    users.img_file_name AS manager_img_file_name,
    users.is_admin_super,
    cfg_teams.code AS team_code
   FROM ((public.contracts_managers
     JOIN public.users ON ((contracts_managers.manager_id = users.id)))
     JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
  WHERE (contracts_managers.is_deleted = false);

CREATE VIEW public.v_dash_admin_orders_parent_status_1 WITH (security_invoker='true') AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.contract_code,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.unit_code,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id = 1) AND (v_orders.parent_id IS NULL));

CREATE VIEW public.v_departments WITH (security_invoker='true') AS
 SELECT cfg_departments.id,
    cfg_departments.code,
    cfg_departments.description,
    cfg_departments.parent_id,
    cfg_departments.company_id,
    cfg_departments.is_available,
    cfg_departments.created_user_id,
    cfg_departments.created_at,
    cfg_departments.updated_user_id,
    cfg_departments.updated_at,
    cfg_departments.deleted_user_id,
    cfg_departments.deleted_at,
    cfg_departments.is_deleted,
    cfg_departments.version
   FROM public.cfg_departments;

CREATE VIEW public.v_import_orders_visits_contracts WITH (security_invoker='true') AS
 SELECT import_orders_visits_contracts.id,
    import_orders_visits_contracts.user_email,
    import_orders_visits_contracts.contract_code,
    import_orders_visits_contracts.year,
    import_orders_visits_contracts.month,
    import_orders_visits_contracts.date,
    import_orders_visits_contracts.unit_code,
    import_orders_visits_contracts.asset_code,
    import_orders_visits_contracts.activity_code,
    import_orders_visits_contracts.activity_description,
    import_orders_visits_contracts.service_code,
    import_orders_visits_contracts.service_description,
    import_orders_visits_contracts.service_unit,
    import_orders_visits_contracts.value_unit,
    import_orders_visits_contracts.amount,
    import_orders_visits_contracts.discount,
    import_orders_visits_contracts.value_total,
    import_orders_visits_contracts.error_msg,
    import_orders_visits_contracts.order_mask,
    import_orders_visits_contracts.success,
    import_orders_visits_contracts.processing_id,
    import_orders_visits_contracts.created_at,
    import_orders_visits_contracts.finger_print
   FROM public.import_orders_visits_contracts;

CREATE VIEW public.v_leader_ranking WITH (security_invoker='true') AS
 SELECT lms.id,
    lms.leader_id,
    lms.leader_name,
    lms.department_id,
    lms.department_name,
    lms.score_year,
    lms.score_month,
    lms.total_visits,
    lms.total_evaluations,
    lms.failed_evaluations,
    lms.total_penalty_score,
    lms.avg_compliance_score,
    lms.best_compliance_score,
    lms.worst_compliance_score,
    lms.ranking_position,
    lms.created_at,
    lms.updated_at,
    prev.avg_compliance_score AS prev_month_compliance,
        CASE
            WHEN (prev.avg_compliance_score IS NULL) THEN 'stable'::text
            WHEN (lms.avg_compliance_score > prev.avg_compliance_score) THEN 'up'::text
            WHEN (lms.avg_compliance_score < prev.avg_compliance_score) THEN 'down'::text
            ELSE 'stable'::text
        END AS trend,
    prev.ranking_position AS prev_ranking_position,
        CASE
            WHEN ((prev.ranking_position IS NULL) OR (lms.ranking_position IS NULL)) THEN NULL::integer
            WHEN (prev.ranking_position > lms.ranking_position) THEN (prev.ranking_position - lms.ranking_position)
            WHEN (prev.ranking_position < lms.ranking_position) THEN (- (lms.ranking_position - prev.ranking_position))
            ELSE 0
        END AS position_change
   FROM (public.leader_monthly_scores lms
     LEFT JOIN public.leader_monthly_scores prev ON (((prev.leader_id = lms.leader_id) AND (prev.score_year =
        CASE
            WHEN (lms.score_month = 1) THEN (lms.score_year - 1)
            ELSE lms.score_year
        END) AND (prev.score_month =
        CASE
            WHEN (lms.score_month = 1) THEN 12
            ELSE (lms.score_month - 1)
        END))));

CREATE VIEW public.v_materials WITH (security_invoker='true') AS
 SELECT m.id,
    m.code,
    m.description,
    m.unit,
    m.price_unit,
    m.searchable,
    m.version_mode,
    m.finger_print,
    m.company_id,
    m.provider_company_id,
    m.balance,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    m.status_id,
    cms.description AS status_description,
    m.type_id,
    cmt.description AS type_description,
    COALESCE(ws.total_quantity, (0)::bigint) AS total_stock,
    COALESCE(ws.warehouse_count, (0)::bigint) AS warehouse_count,
    ws.min_stock_warehouse_id,
    ws.min_stock_warehouse_description
   FROM (((public.materials m
     LEFT JOIN public.cfg_materials_statuses cms ON ((cms.id = m.status_id)))
     LEFT JOIN public.cfg_materials_types cmt ON ((cmt.id = m.type_id)))
     LEFT JOIN LATERAL ( SELECT sum(wm.quantity) AS total_quantity,
            count(DISTINCT wm.warehouse_id) AS warehouse_count,
            (array_agg(
                CASE
                    WHEN (wm.quantity <= wm.min_stock) THEN wm.warehouse_id
                    ELSE NULL::integer
                END ORDER BY wm.quantity) FILTER (WHERE (wm.quantity <= wm.min_stock)))[1] AS min_stock_warehouse_id,
            (array_agg(
                CASE
                    WHEN (wm.quantity <= wm.min_stock) THEN w.description
                    ELSE NULL::text
                END ORDER BY wm.quantity) FILTER (WHERE (wm.quantity <= wm.min_stock)))[1] AS min_stock_warehouse_description
           FROM (public.warehouses_materials wm
             JOIN public.warehouses w ON (((w.id = wm.warehouse_id) AND (w.is_deleted = false))))
          WHERE (wm.material_id = m.id)) ws ON (true))
  WHERE (m.is_deleted = false);

CREATE VIEW public.v_materials_purchases WITH (security_invoker='true') AS
 SELECT mp.id,
    mp.code AS purchase_code,
    mp.material_id,
    m.code AS material_code,
    m.description AS material_description,
    m.unit AS material_unit,
    m.price_unit AS material_unit_price,
    m.type_id AS material_type_id,
    cmt.description AS material_type_description,
    mp.purchase_type_id,
    cpt.code AS purchase_type_code,
    cpt.description AS purchase_type_description,
    mp.warehouse_id,
    w.code AS warehouse_code,
    w.description AS warehouse_description,
    mp.quantity,
    mp.unit_price,
    mp.total_price,
    mp.justification,
    mp.status_id,
    cps.code AS status_code,
    cps.description AS status_description,
    mp.requester_user_id,
    ru.name_full AS requester_name,
    mp.authorizer_user_id,
    au.name_full AS authorizer_name,
    mp.authorized_at,
    mp.cancel_reason_id,
    cpcr.description AS cancel_reason_description,
    mp.cancel_reason,
    mp.concluded_at,
    mp.created_at,
    mp.updated_at
   FROM ((((((((public.materials_purchases mp
     LEFT JOIN public.materials m ON ((m.id = mp.material_id)))
     LEFT JOIN public.cfg_materials_types cmt ON ((cmt.id = m.type_id)))
     LEFT JOIN public.cfg_materials_purchases_types cpt ON ((cpt.id = mp.purchase_type_id)))
     LEFT JOIN public.warehouses w ON ((w.id = mp.warehouse_id)))
     LEFT JOIN public.cfg_materials_purchases_statuses cps ON ((cps.id = mp.status_id)))
     LEFT JOIN public.users ru ON ((ru.id = mp.requester_user_id)))
     LEFT JOIN public.users au ON ((au.id = mp.authorizer_user_id)))
     LEFT JOIN public.cfg_materials_purchases_cancel_reasons cpcr ON ((cpcr.id = mp.cancel_reason_id)))
  WHERE (mp.is_deleted = false);

CREATE VIEW public.v_order_visit_scores WITH (security_invoker='true') AS
 SELECT ov.id AS ov_id,
    ov.o_id AS order_id,
    ov.ov_team_leader_id AS leader_id,
    u.name_short AS leader_name,
    u.team_id AS leader_team_id,
    t.description AS team_name,
    t.department_id AS leader_department_id,
    d.description AS department_name,
    ov.ov_started_at,
    ov.ov_ended_at,
    (EXTRACT(year FROM ov.ov_ended_at))::integer AS score_year,
    (EXTRACT(month FROM ov.ov_ended_at))::integer AS score_month,
    (count(ove.id))::integer AS total_evaluations,
    (count(
        CASE
            WHEN (ove.was_applied = true) THEN 1
            ELSE NULL::integer
        END))::integer AS failed_evaluations,
    (COALESCE(sum(
        CASE
            WHEN (ove.was_applied = true) THEN cer.weight
            ELSE 0
        END), (0)::bigint))::numeric(10,2) AS penalty_score,
    (COALESCE(sum(cer.weight), (0)::bigint))::numeric(10,2) AS max_possible_score,
        CASE
            WHEN (COALESCE(sum(cer.weight), (0)::bigint) = 0) THEN 100.00
            ELSE round(((1.0 - ((COALESCE(sum(
            CASE
                WHEN (ove.was_applied = true) THEN cer.weight
                ELSE 0
            END), (0)::bigint))::numeric / (NULLIF(sum(cer.weight), 0))::numeric)) * (100)::numeric), 2)
        END AS compliance_score
   FROM (((((public.orders_visits ov
     JOIN public.users u ON ((u.id = ov.ov_team_leader_id)))
     JOIN public.cfg_teams t ON ((t.id = u.team_id)))
     JOIN public.cfg_departments d ON ((d.id = t.department_id)))
     LEFT JOIN public.orders_visits_evaluations ove ON ((ove.ov_id = ov.id)))
     LEFT JOIN public.contracts_evaluation_requirements cer ON ((cer.id = ove.contract_evaluation_id)))
  WHERE ((ov.ov_status_id = 2) AND (ov.ov_ended_at IS NOT NULL))
  GROUP BY ov.id, ov.o_id, ov.ov_team_leader_id, u.name_short, u.team_id, t.description, t.department_id, d.description, ov.ov_started_at, ov.ov_ended_at;

CREATE VIEW public.v_orders_cancel_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_cancel_reasons.id,
    cfg_orders_cancel_reasons.department_id,
    cfg_orders_cancel_reasons.description,
    cfg_orders_cancel_reasons.is_available,
    cfg_orders_cancel_reasons.is_deleted
   FROM public.cfg_orders_cancel_reasons
  WHERE (cfg_orders_cancel_reasons.is_deleted = false)
  ORDER BY cfg_orders_cancel_reasons.description;

CREATE VIEW public.v_orders_causes_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_causes_reasons.id,
    cfg_orders_causes_reasons.description,
    cfg_orders_causes_reasons.is_availabe,
    cfg_orders_causes_reasons.is_deleted
   FROM public.cfg_orders_causes_reasons
  WHERE (cfg_orders_causes_reasons.is_deleted = false)
  ORDER BY cfg_orders_causes_reasons.description;

CREATE VIEW public.v_orders_counter WITH (security_invoker='true') AS
 SELECT cfg_orders_counter.id,
    cfg_orders_counter.company_id,
    cfg_orders_counter.year,
    cfg_orders_counter.counter,
    cfg_orders_counter.is_dev,
    cfg_orders_counter.version
   FROM public.cfg_orders_counter;

CREATE VIEW public.v_orders_followers WITH (security_invoker='true') AS
 SELECT orders_followers.id,
    orders_followers.user_id,
    orders_followers.o_id,
    orders_followers.version_mode
   FROM public.orders_followers;

CREATE VIEW public.v_orders_objects WITH (security_invoker='true') AS
 SELECT cfg_orders_objects.id,
    cfg_orders_objects.code,
    cfg_orders_objects.description
   FROM public.cfg_orders_objects
  ORDER BY cfg_orders_objects.description;

CREATE VIEW public.v_orders_open WITH (security_invoker='true') AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.contract_code,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.unit_code,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));

CREATE VIEW public.v_orders_parent WITH (security_invoker='true') AS
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

CREATE VIEW public.v_orders_plans WITH (security_invoker='true') AS
 SELECT cfg_orders_plans.id,
    cfg_orders_plans.department_id,
    cfg_orders_plans.code,
    cfg_orders_plans.description,
    cfg_orders_plans.is_available,
    cfg_orders_plans.version
   FROM public.cfg_orders_plans
  ORDER BY cfg_orders_plans.description;

CREATE VIEW public.v_orders_priorities WITH (security_invoker='true') AS
 SELECT cfg_orders_priorities.id,
    cfg_orders_priorities.code,
    cfg_orders_priorities.description
   FROM public.cfg_orders_priorities
  ORDER BY cfg_orders_priorities.description;

CREATE VIEW public.v_orders_statuses WITH (security_invoker='true') AS
 SELECT cfg_orders_statuses.id,
    cfg_orders_statuses.company_id,
    cfg_orders_statuses.department_id,
    cfg_orders_statuses.code,
    cfg_orders_statuses.description,
    cfg_orders_statuses.is_available
   FROM public.cfg_orders_statuses;

CREATE VIEW public.v_orders_suspended_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_suspended_reasons.id,
    cfg_orders_suspended_reasons.department_id,
    cfg_orders_suspended_reasons.description,
    cfg_orders_suspended_reasons.is_available,
    cfg_orders_suspended_reasons.is_deleted
   FROM public.cfg_orders_suspended_reasons
  WHERE (cfg_orders_suspended_reasons.is_deleted = false)
  ORDER BY cfg_orders_suspended_reasons.description;

CREATE VIEW public.v_orders_types WITH (security_invoker='true') AS
 SELECT cfg_orders_types.id,
    cfg_orders_types.department_id,
    cfg_orders_types.code,
    cfg_orders_types.description,
    cfg_orders_types.is_deleted,
    cfg_orders_types.is_available
   FROM public.cfg_orders_types
  WHERE (cfg_orders_types.is_deleted = false)
  ORDER BY cfg_orders_types.description;

CREATE VIEW public.v_orders_types_subs WITH (security_invoker='true') AS
 SELECT cfg_orders_types_subs.id,
    cfg_orders_types_subs.department_id,
    cfg_orders_types_subs.code,
    cfg_orders_types_subs.description,
    cfg_orders_types_subs.is_available,
    cfg_orders_types_subs.is_deleted
   FROM public.cfg_orders_types_subs
  WHERE (cfg_orders_types_subs.is_deleted = false)
  ORDER BY cfg_orders_types_subs.description;

CREATE VIEW public.v_orders_visits WITH (security_invoker='true') AS
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
           FROM public.orders_visits orders_visits_1
          WHERE (orders_visits_1.is_deleted = false)
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
    (((v_orders.contract_description || ' ('::text) || (v_orders.provider_company_code)::text) || ')'::text) AS o_contract_description_2,
    orders_visits.chat_status,
    orders_visits.chat_closed_at,
    orders_visits.chat_closed_user_id,
    orders_visits.chat_created_user_id,
    orders_visits.ov_costs_status,
    orders_visits.ov_costs_waiting_at,
    orders_visits.ov_costs_waiting_user_id,
    orders_visits.ov_costs_approved_at,
    orders_visits.ov_costs_approved_user_id,
    users_costs_approved.name_short AS ov_costs_approved_user_name_short,
    orders_visits.ov_costs_rejected_at,
    orders_visits.ov_costs_rejected_user_id,
    users_costs_rejected.name_short AS ov_costs_rejected_user_name_short,
    orders_visits.ov_costs_rejection_reason
   FROM ((((((((((((public.orders_visits
     LEFT JOIN public.v_orders ON ((orders_visits.o_id = v_orders.id)))
     LEFT JOIN public.cfg_orders_visits_statuses ON ((orders_visits.ov_status_id = cfg_orders_visits_statuses.id)))
     LEFT JOIN public.cfg_orders_visits_processing ON ((orders_visits.ov_processing_id = cfg_orders_visits_processing.id)))
     LEFT JOIN public.users users_teams_leaders ON ((orders_visits.ov_team_leader_id = users_teams_leaders.id)))
     LEFT JOIN public.cfg_orders_statuses ON ((orders_visits.ov_o_status_id = cfg_orders_statuses.id)))
     LEFT JOIN public.cfg_orders_suspended_reasons ON ((orders_visits.ov_o_suspended_reason_id = cfg_orders_suspended_reasons.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits.ov_reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_revised ON ((orders_visits.ov_revised_user_id = users_revised.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits.ov_disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits.ov_approved_user_id = users_approved.id)))
     LEFT JOIN public.users users_costs_approved ON ((orders_visits.ov_costs_approved_user_id = users_costs_approved.id)))
     LEFT JOIN public.users users_costs_rejected ON ((orders_visits.ov_costs_rejected_user_id = users_costs_rejected.id)));

CREATE VIEW public.v_orders_visits_assets WITH (security_invoker='true') AS
 SELECT orders_visits_assets.id,
    orders_visits_assets.op_id,
    orders_visits_assets.o_id,
    v_orders.order_mask AS o_mask,
    v_orders.company_id AS o_company_id,
    v_orders.company_img_file_path AS o_company_img_file_path,
    v_orders.company_img_file_name AS o_company_img_file_name,
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
    before_clients.name AS before_client_name,
    orders_visits_assets.after_client_id,
    after_clients.name AS after_client_name,
    orders_visits_assets.before_location,
    orders_visits_assets.after_location,
    orders_visits_assets.activities_description,
    orders_visits_assets.maintenance_plan_id,
    orders_visits_assets.maintenance_plan_progress,
    orders_visits_assets.has_recorder
   FROM (((((((((((((((((((public.orders_visits_assets
     LEFT JOIN public.v_orders_visits ON ((orders_visits_assets.ov_id = v_orders_visits.id)))
     LEFT JOIN public.v_orders ON ((orders_visits_assets.o_id = v_orders.id)))
     LEFT JOIN public.assets ON ((orders_visits_assets.asset_id = assets.id)))
     LEFT JOIN public.cfg_assets_tags before_tags ON ((orders_visits_assets.before_tag_id = before_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs before_tags_subs ON ((orders_visits_assets.before_tag_sub_id = before_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses before_status ON ((orders_visits_assets.before_status_id = before_status.id)))
     LEFT JOIN public.cfg_assets_tags after_tags ON ((orders_visits_assets.after_tag_id = after_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs after_tags_subs ON ((orders_visits_assets.after_tag_sub_id = after_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses after_status ON ((orders_visits_assets.after_status_id = after_status.id)))
     LEFT JOIN public.cfg_orders_visits_processing ON ((orders_visits_assets.processing_id = cfg_orders_visits_processing.id)))
     LEFT JOIN public.units before_units ON ((orders_visits_assets.before_unit_id = before_units.id)))
     LEFT JOIN public.units after_units ON ((orders_visits_assets.after_unit_id = after_units.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits_assets.reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits_assets.disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits_assets.approved_user_id = users_approved.id)))
     LEFT JOIN public.cfg_assets_priorities before_priorities ON ((orders_visits_assets.before_priority_id = before_priorities.id)))
     LEFT JOIN public.cfg_assets_priorities after_priorities ON ((orders_visits_assets.after_priority_id = after_priorities.id)))
     LEFT JOIN public.clients before_clients ON ((orders_visits_assets.before_client_id = before_clients.id)))
     LEFT JOIN public.clients after_clients ON ((orders_visits_assets.after_client_id = after_clients.id)))
  WHERE (orders_visits_assets.is_deleted = false);

CREATE VIEW public.v_orders_visits_assets_activities WITH (security_invoker='true') AS
 SELECT orders_visits_assets_activities.id,
    orders_visits_assets_activities.activity_id,
    cfg_activities.description,
    orders_visits_assets_activities.amount,
    orders_visits_assets_activities.o_id,
    orders_visits_assets_activities.op_id,
    orders_visits_assets_activities.ova_id,
    orders_visits_assets_activities.ov_id,
    orders_visits_assets_activities.version_mode
   FROM (public.orders_visits_assets_activities
     JOIN public.cfg_activities ON ((orders_visits_assets_activities.activity_id = cfg_activities.id)))
  WHERE (orders_visits_assets_activities.is_deleted = false)
  ORDER BY cfg_activities.description;

CREATE VIEW public.v_orders_visits_assets_materials WITH (security_invoker='true') AS
 SELECT orders_visits_assets_materials.id,
    orders_visits_assets_materials.ov_id,
    orders_visits_assets_materials.ova_id,
    orders_visits_assets_materials.asset_id,
    materials.code,
    materials.description,
    materials.unit,
    orders_visits_assets_materials.amount,
    orders_visits_assets_materials.value_unit,
    orders_visits_assets_materials.discount,
    orders_visits_assets_materials.value_total,
    orders_visits_assets_materials.version_mode
   FROM (public.orders_visits_assets_materials
     JOIN public.materials ON ((orders_visits_assets_materials.material_id = materials.id)))
  WHERE (orders_visits_assets_materials.is_deleted = false)
  ORDER BY materials.description;

CREATE VIEW public.v_orders_visits_evaluations WITH (security_invoker='true') AS
 SELECT ove.id,
    ove.ov_id,
    ove.contract_evaluation_id,
    ove.was_applied,
    ove.notes,
    ove.evaluated_by_user_id,
    u.name_full AS evaluator_name,
    ove.evaluated_at,
    ove.created_at,
    cer.contract_id,
    cer.weight,
    er.description AS requirement_description,
    er.code AS requirement_code
   FROM (((public.orders_visits_evaluations ove
     JOIN public.contracts_evaluation_requirements cer ON ((cer.id = ove.contract_evaluation_id)))
     JOIN public.cfg_evaluation_requirements er ON ((er.id = cer.evaluation_id)))
     JOIN public.users u ON ((u.id = ove.evaluated_by_user_id)));

CREATE VIEW public.v_orders_visits_extras_followers WITH (security_invoker='true') AS
 SELECT orders_visits_extras_followers.id,
    orders_visits_extras_followers.user_id,
    orders_visits_extras_followers.ove_id,
    orders_visits_extras_followers.version_mode
   FROM public.orders_visits_extras_followers;

CREATE VIEW public.v_orders_visits_extras_teams WITH (security_invoker='true') AS
 SELECT orders_visits_extras_teams.id,
    orders_visits_extras_teams.ove_id,
    orders_visits_extras_teams.is_leader,
    orders_visits_extras_teams.user_id,
    orders_visits_extras_teams.duration_hours,
    users.name_short,
    users.img_file_path,
    users.img_file_name,
    orders_visits_extras.started_at,
    orders_visits_extras.ended_at,
    users.is_available,
    users.is_ov_in_progress,
    orders_visits_extras_teams.version_mode,
    orders_visits_extras_teams.order_by
   FROM ((public.orders_visits_extras_teams
     JOIN public.users ON ((orders_visits_extras_teams.user_id = users.id)))
     JOIN public.orders_visits_extras ON ((orders_visits_extras_teams.ove_id = orders_visits_extras.id)))
  ORDER BY orders_visits_extras_teams.order_by;

CREATE VIEW public.v_orders_visits_services WITH (security_invoker='true') AS
 SELECT orders_visits_services.id,
    orders_visits_services.ov_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    orders_visits_services.amount,
    orders_visits_services.value_unit,
    orders_visits_services.discount,
    orders_visits_services.value_total,
    orders_visits_services.version_mode
   FROM (public.orders_visits_services
     JOIN public.cfg_services ON ((orders_visits_services.service_id = cfg_services.id)))
  WHERE (orders_visits_services.is_deleted = false)
  ORDER BY cfg_services.description;

CREATE VIEW public.v_orders_visits_teams WITH (security_invoker='true') AS
 SELECT orders_visits_teams.ov_id,
    orders_visits_teams.is_leader,
    orders_visits_teams.user_id,
    users.name_short,
    users.img_file_path,
    users.img_file_name,
    orders_visits.ov_started_at,
    orders_visits.ov_ended_at,
    users.is_available,
    users.is_ov_in_progress,
    orders_visits_teams.version_mode
   FROM ((public.orders_visits_teams
     JOIN public.users ON ((orders_visits_teams.user_id = users.id)))
     JOIN public.orders_visits ON ((orders_visits_teams.ov_id = orders_visits.id)));

CREATE VIEW public.v_orders_visits_vehicles WITH (security_invoker='true') AS
 SELECT ovv.id,
    ovv.ov_id,
    ovv.vehicle_id,
    v.description AS vehicle_description,
    v.plates AS vehicle_plates,
    v.unit,
    ovv.recorder_start,
    ovv.recorder_end,
    ovv.amount,
    ovv.value_unit,
    ovv.value_total,
    ovv.discount,
    ovv.version_mode
   FROM (public.orders_visits_vehicles ovv
     JOIN public.vehicles v ON ((v.id = ovv.vehicle_id)))
  WHERE (ovv.is_deleted = false);

CREATE VIEW public.v_profiles WITH (security_invoker='true') AS
 SELECT cfg_profiles.id,
    cfg_profiles.description,
    cfg_profiles.department_id,
    cfg_profiles.version
   FROM public.cfg_profiles;

CREATE VIEW public.v_profiles_permissions WITH (security_invoker='true') AS
 SELECT cfg_profiles_permissions.id,
    cfg_profiles_permissions.profile_id,
    cfg_profiles_permissions.app_page_id,
    cfg_app_pages.description AS app_page_description
   FROM (public.cfg_profiles_permissions
     JOIN public.cfg_app_pages ON ((cfg_profiles_permissions.app_page_id = cfg_app_pages.id)))
  ORDER BY cfg_profiles_permissions.profile_id, cfg_app_pages.description;

CREATE VIEW public.v_services WITH (security_invoker='true') AS
 SELECT cfg_services.id,
    cfg_services.description,
    cfg_services.unit,
    cfg_services.is_available,
    cfg_services.is_deleted,
    cfg_services.version_mode,
    cfg_services.code,
    cfg_services.finger_print,
    cfg_services.company_id
   FROM public.cfg_services
  WHERE (cfg_services.is_deleted = false)
  ORDER BY cfg_services.description;

CREATE VIEW public.v_systems WITH (security_invoker='true') AS
 SELECT cfg_systems.id,
    cfg_systems.company_id,
    cfg_systems.parent_id,
    cfg_systems.code,
    cfg_systems.description,
    cfg_systems.is_available
   FROM public.cfg_systems
  WHERE ((cfg_systems.parent_id > 0) AND (cfg_systems.is_deleted = false))
  ORDER BY cfg_systems.description;

CREATE VIEW public.v_systems_parent WITH (security_invoker='true') AS
 SELECT cfg_systems.id,
    cfg_systems.company_id,
    cfg_systems.parent_id,
    cfg_systems.code,
    cfg_systems.description,
    cfg_systems.is_available
   FROM public.cfg_systems
  WHERE ((cfg_systems.parent_id IS NULL) AND (cfg_systems.is_deleted = false))
  ORDER BY cfg_systems.description;

CREATE VIEW public.v_systems_parent_assets_tags_available_rate WITH (security_invoker='true') AS
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.asset_tag_description,
    bool_or(v.flow_rate_is_visible) AS flow_rate_is_visible,
    (sum(v.total_flow_rate_max))::numeric AS total_flow_rate_max,
    (sum(v.total_flow_rate_last))::numeric AS total_flow_rate_last,
    max(v.flow_rate_unit) AS flow_rate_unit,
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric)
        END AS pct_flow_rate_available_fraction,
    (
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_flow_rate_available_percent,
    bool_or(v.power_is_visible) AS power_is_visible,
    (sum(v.total_power_max))::numeric AS total_power_max,
    (sum(v.total_power_last))::numeric AS total_power_last,
    max(v.power_unit) AS power_unit,
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric)
        END AS pct_power_available_fraction,
    (
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_power_available_percent,
    bool_or(v.pressure_is_visible) AS pressure_is_visible,
    (sum(v.total_pressure_max))::numeric AS total_pressure_max,
    (sum(v.total_pressure_last))::numeric AS total_pressure_last,
    max(v.pressure_unit) AS pressure_unit,
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric)
        END AS pct_pressure_available_fraction,
    (
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_pressure_available_percent,
    ((sum(v.total_last_asset_available_rate))::numeric / (NULLIF(count(*), 0))::numeric) AS avg_last_asset_available_rate,
    count(*) AS total_units
   FROM ( SELECT uat.unit_id,
            uat.unit_code,
            uat.system_parent_id,
            uat.asset_tag_id,
            uat.tag_description AS asset_tag_description,
            bool_or(uat.flow_rate_is_visible) AS flow_rate_is_visible,
            COALESCE((sum(uat.flow_rate_max))::double precision, (0)::double precision) AS total_flow_rate_max,
            COALESCE((sum(uat.last_flow_rate))::double precision, (0)::double precision) AS total_flow_rate_last,
            max((uat.flow_rate_unit)::text) AS flow_rate_unit,
            bool_or(uat.power_is_visible) AS power_is_visible,
            COALESCE((sum(uat.power_max))::double precision, (0)::double precision) AS total_power_max,
            COALESCE((sum(uat.last_power))::double precision, (0)::double precision) AS total_power_last,
            max((uat.power_unit)::text) AS power_unit,
            bool_or(uat.pressure_is_visible) AS pressure_is_visible,
            COALESCE((sum(uat.pressure_max))::double precision, (0)::double precision) AS total_pressure_max,
            COALESCE((sum(uat.last_pressure))::double precision, (0)::double precision) AS total_pressure_last,
            max((uat.pressure_unit)::text) AS pressure_unit,
            COALESCE((sum(uat.last_asset_available_rate))::double precision, (0)::double precision) AS total_last_asset_available_rate
           FROM public.v_units_assets_tags uat
          WHERE (uat.is_deleted = false)
          GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description) v
  GROUP BY v.system_parent_id, v.asset_tag_id, v.asset_tag_description
  ORDER BY v.system_parent_id, v.asset_tag_description;

CREATE VIEW public.v_systems_parent_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.asset_tag_id,
    ca.last_processing_id,
    u.system_parent_id,
    count(*) AS total
   FROM (public.cfg_units_assets_tags ca
     JOIN public.units u ON ((u.id = ca.unit_id)))
  WHERE ((ca.is_deleted = false) AND (u.is_deleted = false))
  GROUP BY ca.asset_tag_id, ca.last_processing_id, u.system_parent_id;

CREATE VIEW public.v_teams WITH (security_invoker='true') AS
 SELECT cfg_teams.id,
    cfg_teams.parent_id,
    cfg_teams.code,
    cfg_teams.description,
    cfg_teams.department_id,
    cfg_teams.is_available,
    cfg_teams.sort_order,
    cfg_teams.img_url,
    cfg_teams.users_total,
    cfg_teams.company_id,
    cfg_teams.created_user_id,
    cfg_teams.created_at,
    cfg_teams.updated_user_id,
    cfg_teams.updated_at,
    cfg_teams.deleted_user_id,
    cfg_teams.deleted_at,
    cfg_teams.is_deleted,
    cfg_teams.version,
    cfg_teams.is_evaluable
   FROM public.cfg_teams
  WHERE (cfg_teams.is_deleted = false)
  ORDER BY cfg_teams.sort_order, cfg_teams.description;

CREATE VIEW public.v_users WITH (security_invoker='true') AS
 SELECT users.id,
    users.uuid,
    cfg_departments.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    cfg_companies.img_file_path AS company_img_file_path,
    cfg_companies.img_file_name AS company_img_file_name,
    cfg_companies.email_sufix AS company_email_sufix,
    cfg_companies.is_available AS company_is_available,
    cfg_teams.department_id,
    cfg_departments.code AS department_code,
    cfg_departments.description AS department_description,
    users.email,
    users.name_short,
    users.name_full,
    users.team_id,
    cfg_teams.code AS team_code,
    cfg_teams.description AS team_description,
    users.team_amount,
    users.team_id_previous,
    users.status_id,
    cfg_users_statuses.code AS status_code,
    cfg_users_statuses.description AS status_description,
    users.is_team_leader,
    users.is_admin,
    users.is_admin_super,
    users.img_file_path,
    users.img_file_name,
    users.ov_id_in_progress,
    users.ov_id_in_progress_mask,
    users.o_id_in_progress,
    users.op_id_in_progress,
    users.ov_in_progress_leader_id,
    users.profile_id,
    cfg_profiles.description AS profile_description,
    users.vehicle_id,
    users.is_available,
    users.is_ov_in_progress,
    users.version_app,
    contracts.id AS o_contract_id_in_progress,
    users.o_type_id_in_progress,
    users.o_type_sub_id_in_progress,
    users.o_plan_id_in_progress,
    users.o_asset_tag_id_in_progress,
    users.o_unit_id_in_progress,
    users.o_system_id_in_progress,
    users.o_system_parent_id_in_progress,
    users.o_unit_type_id_in_progress,
    users.o_object_id_in_progress,
    users.token_fcm,
    users.notifications_amount,
    users.mobile,
    users.mobile_full,
    users.mobile_mask,
    users.mobile_whatsapp,
    users.latitude,
    users.longitude,
    users.tracker_interval_seconds,
    users.shift_start,
    users.shift_end,
    users.last_online
   FROM (((((((public.users
     LEFT JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
     JOIN public.cfg_departments ON ((cfg_teams.department_id = cfg_departments.id)))
     JOIN public.cfg_companies ON ((cfg_departments.company_id = cfg_companies.id)))
     JOIN public.cfg_users_statuses ON ((users.status_id = cfg_users_statuses.id)))
     LEFT JOIN public.cfg_profiles ON ((users.profile_id = cfg_profiles.id)))
     LEFT JOIN public.orders ON ((users.o_id_in_progress = orders.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
  ORDER BY users.name_short;

CREATE VIEW public.v_teams_leaders WITH (security_invoker='true') AS
 SELECT v_users.id,
    v_users.uuid,
    v_users.company_id,
    v_users.company_code,
    v_users.company_description,
    v_users.company_img_file_path,
    v_users.company_img_file_name,
    v_users.company_email_sufix,
    v_users.company_is_available,
    v_users.department_id,
    v_users.department_code,
    v_users.department_description,
    v_users.email,
    v_users.name_short,
    v_users.name_full,
    v_users.team_id,
    v_users.team_code,
    v_users.team_description,
    v_users.team_amount,
    v_users.team_id_previous,
    v_users.status_id,
    v_users.status_code,
    v_users.status_description,
    v_users.is_team_leader,
    v_users.is_admin,
    v_users.is_admin_super,
    v_users.img_file_path,
    v_users.img_file_name,
    v_users.ov_id_in_progress,
    v_users.ov_id_in_progress_mask,
    v_users.o_id_in_progress,
    v_users.op_id_in_progress,
    v_users.ov_in_progress_leader_id,
    v_users.profile_id,
    v_users.profile_description,
    v_users.vehicle_id,
    v_users.is_available,
    v_users.is_ov_in_progress,
    v_users.version_app,
    v_users.o_contract_id_in_progress,
    v_users.o_type_id_in_progress,
    v_users.o_type_sub_id_in_progress,
    v_users.o_plan_id_in_progress,
    v_users.o_asset_tag_id_in_progress,
    v_users.o_unit_id_in_progress,
    v_users.o_system_id_in_progress,
    v_users.o_system_parent_id_in_progress,
    v_users.o_unit_type_id_in_progress,
    v_users.o_object_id_in_progress,
    v_users.token_fcm,
    v_users.notifications_amount,
    v_users.mobile,
    v_users.mobile_full,
    v_users.mobile_mask,
    v_users.mobile_whatsapp
   FROM public.v_users
  WHERE ((v_users.is_team_leader = true) AND (v_users.status_id = 2));

CREATE VIEW public.v_technicals_manuals_assets WITH (security_invoker='true') AS
 SELECT technicals_manuals_assets.tm_id,
    technicals_manuals_assets.version_mode AS tma_version_mode,
    v_assets.company_id,
    v_assets.company_description,
    v_assets.company_owner_description,
    v_assets.company_owner_id,
    v_assets.id,
    v_assets.code,
    v_assets.description,
    v_assets.searchable,
    v_assets.tag_id,
    v_assets.tag_description,
    v_assets.tag_sub_id,
    v_assets.tag_sub_description,
    v_assets.unit_asset_tag_id,
    v_assets.location,
    v_assets.unit_id,
    v_assets.unit_code,
    v_assets.unit_description,
    v_assets.status_id,
    v_assets.status_description,
    v_assets.status_code,
    v_assets.status_at,
    v_assets.type_id,
    v_assets.type_description,
    v_assets.priority_id,
    v_assets.priority_code,
    v_assets.priority_description,
    v_assets.brand,
    v_assets.model,
    v_assets.serial,
    v_assets.power,
    v_assets.power_unit,
    v_assets.voltage,
    v_assets.voltage_unit,
    v_assets.amperage,
    v_assets.amperage_unit,
    v_assets.poles,
    v_assets.poles_unit,
    v_assets.rotation,
    v_assets.rotation_unit,
    v_assets.service_factor,
    v_assets.pressure_max,
    v_assets.pressure_min,
    v_assets.pressure_operation,
    v_assets.pressure_unit,
    v_assets.flow_rate_max,
    v_assets.flow_rate_min,
    v_assets.flow_rate_operation,
    v_assets.flow_rate_unit,
    v_assets.rotor_diameter,
    v_assets.rotor_diameter_unit,
    v_assets.weight,
    v_assets.weight_unit,
    v_assets.coupling_model_id,
    v_assets.coupling_model_description,
    v_assets.comments,
    v_assets.acquisition_at,
    v_assets.acquisition_value,
    v_assets.img_file_path,
    v_assets.img_file_name,
    v_assets.img_file_name_thumb,
    v_assets.version_mode
   FROM (public.technicals_manuals_assets
     JOIN public.v_assets ON ((technicals_manuals_assets.asset_id = v_assets.id)));

CREATE VIEW public.v_technicals_manuals_types WITH (security_invoker='true') AS
 SELECT cfg_technicals_manuals_categories.id,
    cfg_technicals_manuals_categories.description,
    cfg_technicals_manuals_categories.version_mode
   FROM public.cfg_technicals_manuals_categories
  WHERE (cfg_technicals_manuals_categories.is_deleted = false)
  ORDER BY cfg_technicals_manuals_categories.description;

CREATE VIEW public.v_unit_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.unit_id,
    ca.asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id
  ORDER BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id;

CREATE VIEW public.v_units_asset_available_rate_avg WITH (security_invoker='true') AS
 WITH last_dates AS (
         SELECT v_units_by_assets_tags.asset_tag_id,
            max(v_units_by_assets_tags.last_reported_at) AS last_reported_at
           FROM public.v_units_by_assets_tags
          GROUP BY v_units_by_assets_tags.asset_tag_id
        )
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.tag_description,
    avg(v.total_last_asset_available_rate) AS units_asset_available_rate_avg
   FROM (public.v_units_by_assets_tags v
     LEFT JOIN last_dates ld ON (((v.asset_tag_id = ld.asset_tag_id) AND (v.last_reported_at = ld.last_reported_at))))
  WHERE (ld.last_reported_at IS NULL)
  GROUP BY v.system_parent_id, v.asset_tag_id, v.tag_description
  ORDER BY (avg(v.total_last_asset_available_rate));

CREATE VIEW public.v_units_assets_tags_availability WITH (security_invoker='true') AS
 WITH latest_reports AS (
         SELECT DISTINCT ON (assets_available.unit_id, assets_available.asset_tag_id, assets_available.flow_rate_unit, assets_available.power_unit, assets_available.pressure_unit) assets_available.id,
            assets_available.created_at,
            assets_available.unit_id,
            assets_available.asset_id,
            assets_available.asset_tag_id,
            assets_available.asset_tag_sub_id,
            assets_available.is_available,
            assets_available.status_id,
            assets_available.file_path,
            assets_available.file_name,
            assets_available.comments,
            assets_available.created_user_id,
            assets_available.asset_unavailable_reason_id,
            assets_available.processing_id,
            assets_available.reported_at,
            assets_available.reported_user_id,
            assets_available.operation_record,
            assets_available.reported_latitude,
            assets_available.reported_longitude,
            assets_available.reported_coordinates,
            assets_available.is_on,
            assets_available.operation_unit,
            assets_available.flow_rate_unit,
            assets_available.flow_rate_min,
            assets_available.flow_rate_max,
            assets_available.power_unit,
            assets_available.power_min,
            assets_available.power_max,
            assets_available.pressure_unit,
            assets_available.pressure_min,
            assets_available.pressure_max,
            assets_available.flow_rate_is_on,
            assets_available.power_is_on,
            assets_available.pressure_is_on,
            assets_available.flow_rate_is_available,
            assets_available.power_is_available,
            assets_available.pressure_is_available,
            assets_available.voltage_unit,
            assets_available.voltage_min,
            assets_available.voltage_max,
            assets_available.voltage_is_on,
            assets_available.voltage_is_available,
            assets_available.unit_latitude,
            assets_available.unit_longitude AS unit_longitute,
            assets_available.unit_reported_distance_m,
            assets_available.is_web,
            assets_available.company_id,
            assets_available.provider_company_id
           FROM public.assets_available
          ORDER BY assets_available.unit_id, assets_available.asset_tag_id, assets_available.flow_rate_unit, assets_available.power_unit, assets_available.pressure_unit, assets_available.reported_at DESC
        )
 SELECT latest_reports.unit_id,
    latest_reports.asset_tag_id,
    latest_reports.flow_rate_unit,
    latest_reports.power_unit,
    latest_reports.pressure_unit,
    latest_reports.reported_at,
    sum(latest_reports.flow_rate_max) AS total_flow_rate_max,
    sum(latest_reports.power_max) AS total_power_max,
    sum(latest_reports.pressure_max) AS total_pressure_max,
    sum(latest_reports.flow_rate_is_available) AS total_flow_rate_available,
    sum(latest_reports.power_is_available) AS total_power_available,
    sum(latest_reports.pressure_is_available) AS total_pressure_available,
    sum(latest_reports.flow_rate_is_on) AS total_flow_rate_is_on,
    sum(latest_reports.power_is_on) AS total_power_is_on,
    sum(latest_reports.pressure_is_on) AS total_pressure_is_on,
    COALESCE((sum(latest_reports.flow_rate_is_available) / NULLIF(sum(latest_reports.flow_rate_max), (0)::numeric)), (0)::numeric) AS ratio_flow_rate_available,
    COALESCE((sum(latest_reports.power_is_available) / NULLIF(sum(latest_reports.power_max), (0)::numeric)), (0)::numeric) AS ratio_power_available,
    COALESCE((sum(latest_reports.pressure_is_available) / NULLIF(sum(latest_reports.pressure_max), (0)::numeric)), (0)::numeric) AS ratio_pressure_available
   FROM latest_reports
  GROUP BY latest_reports.unit_id, latest_reports.asset_tag_id, latest_reports.flow_rate_unit, latest_reports.power_unit, latest_reports.pressure_unit, latest_reports.reported_at;

CREATE VIEW public.v_units_assets_tags_available_rate WITH (security_invoker='true') AS
 SELECT uat.unit_id,
    uat.unit_code,
    uat.system_parent_id,
    uat.asset_tag_id,
    uat.tag_description AS asset_tag_description,
    sum(uat.power_max) AS total_power_max,
    uat.power_unit,
    uat.power_is_visible,
    sum(uat.flow_rate_max) AS total_flow_rate_max,
    uat.flow_rate_unit,
    uat.flow_rate_is_visible,
    sum(uat.pressure_max) AS total_pressure_max,
    uat.pressure_unit,
    uat.pressure_is_visible,
    sum(uat.last_power) AS total_last_power,
    sum(uat.last_flow_rate) AS total_last_flow_rate,
    sum(uat.last_pressure) AS total_last_pressure,
    sum(uat.last_asset_available_rate) AS total_last_asset_available_rate,
    max(uat.last_reported_at) AS last_reported_at
   FROM public.v_units_assets_tags uat
  WHERE (uat.is_deleted = false)
  GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description, uat.power_unit, uat.power_is_visible, uat.flow_rate_unit, uat.flow_rate_is_visible, uat.pressure_unit, uat.pressure_is_visible
  ORDER BY uat.tag_description;

CREATE VIEW public.v_units_assets_tags_available_rate_latest_by_user WITH (security_invoker='true') AS
 WITH ranked_updates AS (
         SELECT v.unit_id,
            v.system_parent_id,
            v.asset_tag_id,
            v.last_reported_user_id,
            v.last_reported_at,
            v.unit_description,
            u.name_short,
            u.img_file_path,
            u.img_file_name,
            row_number() OVER (PARTITION BY v.unit_id, v.asset_tag_id ORDER BY v.last_reported_at DESC) AS rn
           FROM (public.v_units_assets_tags v
             LEFT JOIN public.users u ON ((v.last_reported_user_id = u.id)))
          WHERE (v.last_reported_at IS NOT NULL)
        )
 SELECT ranked_updates.unit_id,
    ranked_updates.system_parent_id,
    ranked_updates.asset_tag_id,
    ranked_updates.last_reported_user_id,
    ranked_updates.name_short,
    ranked_updates.img_file_path,
    ranked_updates.img_file_name,
    ranked_updates.last_reported_at,
    ranked_updates.unit_description
   FROM ranked_updates
  WHERE (ranked_updates.rn = 1);

CREATE VIEW public.v_units_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.id AS unit_asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.id, ca.last_processing_id
  ORDER BY ca.id, ca.last_processing_id;

CREATE VIEW public.v_units_statuses WITH (security_invoker='true') AS
 SELECT cfg_units_statuses.id,
    cfg_units_statuses.code,
    cfg_units_statuses.description
   FROM public.cfg_units_statuses
  ORDER BY cfg_units_statuses.description;

CREATE VIEW public.v_units_types WITH (security_invoker='true') AS
 SELECT cfg_units_types.id,
    cfg_units_types.code,
    cfg_units_types.description,
    cfg_units_types.parent_id,
    cfg_units_types.is_available,
    cfg_units_types.is_deleted
   FROM public.cfg_units_types
  WHERE ((cfg_units_types.parent_id > 0) AND (cfg_units_types.is_available = true) AND (cfg_units_types.is_deleted = false));

CREATE VIEW public.v_units_types_parent WITH (security_invoker='true') AS
 SELECT cfg_units_types.id,
    cfg_units_types.code,
    cfg_units_types.description,
    cfg_units_types.parent_id,
    cfg_units_types.is_available,
    cfg_units_types.is_deleted
   FROM public.cfg_units_types
  WHERE ((cfg_units_types.parent_id IS NULL) AND (cfg_units_types.is_available = true) AND (cfg_units_types.is_deleted = false));

CREATE VIEW public.v_users_notifications WITH (security_invoker='true') AS
 SELECT users_notifications.id,
    users_notifications.created_at,
    users_notifications.user_id_to,
    users_notifications.user_id_from,
    users_notifications.title,
    users_notifications.body,
    users_notifications.is_read,
    users_notifications.read_at,
    users_notifications.table_id AS unit_id,
    users_notifications.img_url,
    users_notifications.type,
    users_notifications.o_id,
    users_notifications.ov_id AS v_id,
    users_notifications.activity_id,
    users_notifications.company_id,
    users_notifications.token_fcm,
    users_notifications.img_file_path,
    users_notifications.img_file_name,
    users_notifications.user_from_name_short,
    users_notifications.page_target,
    users_notifications.version_mode,
    users_notifications.user_to_whatsapp
   FROM public.users_notifications;

CREATE VIEW public.v_users_permissions WITH (security_invoker='true') AS
 SELECT u.id AS user_id,
    u.uuid AS user_uuid,
    u.email AS user_email,
    u.name_full AS user_name,
    u.profile_id,
    p.description AS profile_name,
    p.department_id,
    r.id AS route_id,
    r.route_key,
    r.route_path,
    r.description AS route_description,
    r.icon AS route_icon,
    r.order_index AS route_order,
    pa.can_view,
    pa.can_create,
    pa.can_edit,
    pa.can_delete,
    pa.created_at AS permission_created_at
   FROM (((public.users u
     JOIN public.cfg_profiles p ON ((u.profile_id = p.id)))
     JOIN public.cfg_profiles_access pa ON ((p.id = pa.profile_id)))
     JOIN public.cfg_routes r ON ((pa.route_id = r.id)))
  WHERE (r.is_available = true)
  ORDER BY u.id, r.order_index;

CREATE VIEW public.v_vehicles WITH (security_invoker='true') AS
 SELECT vehicles.id,
    vehicles.company_id,
    vehicles.department_id,
    vehicles.plates,
    vehicles.value_unit,
    vehicles.is_available,
    vehicles.unit,
    vehicles.discount,
    vehicles.description,
    vehicles.finger_print
   FROM public.vehicles
  ORDER BY vehicles.plates;
