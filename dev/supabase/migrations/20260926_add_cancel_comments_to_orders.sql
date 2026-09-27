-- Migration: Adicionar cancel_comments na tabela orders e atualizar a view v_orders
-- Data: 2026-09-26
-- Objetivo: Permitir detalhamento textual do cancelamento de Ordens (SS e OS)

-- 1. Adicionar coluna cancel_comments na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_comments TEXT;

COMMENT ON COLUMN public.orders.cancel_comments IS 'Observações ou justificativa detalhada do cancelamento da ordem (SS ou OS)';

-- 2. Atualizar a view v_orders
-- NOTA IMPORTANTE (PostgreSQL): Novas colunas em views existentes com CREATE OR REPLACE VIEW
-- DEVEM OBRIGATORIAMENTE ser adicionadas ao FINAL da lista do SELECT, para não alterar a ordem/nome
-- das colunas pré-existentes nem quebrar views dependentes.
CREATE OR REPLACE VIEW public.v_orders WITH (security_invoker='true') AS
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
    cp.code AS provider_company_code,
    o.cancel_comments
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
