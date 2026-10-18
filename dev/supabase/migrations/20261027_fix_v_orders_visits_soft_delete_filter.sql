-- ============================================================
-- Migration: Fix v_orders_visits — filtro de exclusão lógica efetivo
-- Date: 2026-10-27
-- Description:
--   A definição vigente de public.v_orders_visits declara um CTE `ov`
--   com `WHERE is_deleted = false`, PORÉM o SELECT externo lê
--   `FROM orders_visits` diretamente e NUNCA referencia o CTE — o
--   filtro é código morto. Visitas soft-deleted sempre apareceram em
--   todas as telas (OrdersVisitsDashboardAdmin, calendário, etc.).
--   Confirmado no banco vivo: view_total = 2399 = tabela_total
--   (41 visitas com is_deleted = true visíveis).
--
--   Correção: filtro movido para o query externo
--   (`WHERE orders_visits.is_deleted = false`) e CTE morto removido.
--   Mesma lista de 129 colunas em nome/ordem/tipo → CREATE OR REPLACE,
--   sem DROP, preservando dependentes (v_orders_visits_assets etc.)
--   — regra do AGENTS.md.
--
--   Aplicação MANUAL no SQL Editor do Supabase (regra do AGENTS.md).
--   Idempotente: reaplicar não altera o resultado.
-- ============================================================

CREATE OR REPLACE VIEW public.v_orders_visits WITH (security_invoker='true') AS
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
    users_costs_approved.name_short AS ov_costs_approved_user_name_short,
    orders_visits.ov_costs_rejected_at,
    orders_visits.ov_costs_rejected_user_id,
    users_costs_rejected.name_short AS ov_costs_rejected_user_name_short,
    orders_visits.ov_costs_rejection_reason,
    orders_visits.ov_costs_approved_total,
    orders_visits.ov_costs_approved_services,
    orders_visits.ov_costs_approved_materials,
    orders_visits.ov_costs_approved_vehicles,
    orders_visits.ov_costs_vehicle_pending,
    orders_visits.ov_costs_vehicle_estimated
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
    LEFT JOIN users users_approved ON orders_visits.ov_approved_user_id = users_approved.id
    LEFT JOIN users users_costs_approved ON orders_visits.ov_costs_approved_user_id = users_costs_approved.id
    LEFT JOIN users users_costs_rejected ON orders_visits.ov_costs_rejected_user_id = users_costs_rejected.id
WHERE orders_visits.is_deleted = false;

-- ------------------------------------------------------------
-- Grants/OWNER reafirmados (CREATE OR REPLACE preserva os grants
-- existentes; bloco mantém o padrão das demais migrations)
-- ------------------------------------------------------------
DO $$
DECLARE
    r TEXT;
BEGIN
    FOREACH r IN ARRAY ARRAY['postgres', 'anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('GRANT ALL ON public.v_orders_visits TO %I', r);
        END IF;
    END LOOP;

    -- Roles de leitura de data-warehouse (existem em alguns ambientes)
    FOREACH r IN ARRAY ARRAY['databasus-e163795d', 'databasus-93da8106', 'databasus-3a3c9dfb'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('GRANT SELECT ON public.v_orders_visits TO %I', r);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Verificação (após aplicar):
--   SELECT count(*) FROM public.v_orders_visits;          -- esperado: 2358
--   SELECT count(*) FROM public.orders_visits;            -- esperado: 2399
--   SELECT id FROM public.v_orders_visits WHERE id = 2385; -- esperado: 0 linhas
-- ------------------------------------------------------------
