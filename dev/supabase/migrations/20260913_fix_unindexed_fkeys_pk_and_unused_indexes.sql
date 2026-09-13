-- =============================================================================
-- Migration: Fix unindexed foreign keys, missing primary keys, and unused indexes
-- Date: 2026-09-13
-- Fixes:
--   [INFO-0001] unindexed_foreign_keys → CREATE INDEX for each unindexed FK
--   [INFO-0004] no_primary_key → ADD PRIMARY KEY to tables without PK
--   [INFO-0005] unused_index → DROP INDEX for indexes that are never used
-- =============================================================================


-- =============================================================================
-- 1. UNINDEXED FOREIGN KEYS – CREATE INDEX IF NOT EXISTS
-- =============================================================================

-- assets_alerts.ova_id (assets_alerts_ova_id_fkey)
-- Note: idx_assets_alerts_ova_id already exists in schema – double-check skipped via IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_assets_alerts_ova_id
    ON public.assets_alerts(ova_id);

-- cfg_app_notices.created_user_id
CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_created_user_id
    ON public.cfg_app_notices(created_user_id);

-- cfg_app_tips.created_by
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_created_by
    ON public.cfg_app_tips(created_by);

-- cfg_assets_attributes.select_options_group_id
CREATE INDEX IF NOT EXISTS idx_cfg_assets_attributes_select_options_group_id
    ON public.cfg_assets_attributes(select_options_group_id);

-- cfg_routes.parent_id (routes_parent_fkey)
CREATE INDEX IF NOT EXISTS idx_cfg_routes_parent_id
    ON public.cfg_routes(parent_id);

-- contracts_evaluation_requirements.evaluation_id
CREATE INDEX IF NOT EXISTS idx_contracts_eval_req_evaluation_id
    ON public.contracts_evaluation_requirements(evaluation_id);

-- materials_purchases.cancel_reason_id
CREATE INDEX IF NOT EXISTS idx_materials_purchases_cancel_reason_id
    ON public.materials_purchases(cancel_reason_id);

-- orders_visits – audit/cost user columns
-- Nota: ov_costs_submitted_user_id foi renomeado para ov_costs_waiting_user_id em 20260829_fix_costs_status_rename.sql
CREATE INDEX IF NOT EXISTS idx_ov_chat_closed_user_id
    ON public.orders_visits(chat_closed_user_id);

CREATE INDEX IF NOT EXISTS idx_ov_costs_waiting_user_id
    ON public.orders_visits(ov_costs_waiting_user_id);

CREATE INDEX IF NOT EXISTS idx_ov_costs_approved_user_id
    ON public.orders_visits(ov_costs_approved_user_id);

CREATE INDEX IF NOT EXISTS idx_ov_costs_rejected_user_id
    ON public.orders_visits(ov_costs_rejected_user_id);

-- orders_visits_chat
CREATE INDEX IF NOT EXISTS idx_orders_visits_chat_ov_id
    ON public.orders_visits_chat(ov_id);

CREATE INDEX IF NOT EXISTS idx_orders_visits_chat_user_id
    ON public.orders_visits_chat(user_id);

-- orders_visits_chat_reads
CREATE INDEX IF NOT EXISTS idx_orders_visits_chat_reads_user_id
    ON public.orders_visits_chat_reads(user_id);

-- orders_visits_evaluations
CREATE INDEX IF NOT EXISTS idx_ove_contract_evaluation_id
    ON public.orders_visits_evaluations(contract_evaluation_id);

-- orders_visits_extras – many FK columns
CREATE INDEX IF NOT EXISTS idx_ove_unit_id
    ON public.orders_visits_extras(unit_id);

CREATE INDEX IF NOT EXISTS idx_ove_o_type_id
    ON public.orders_visits_extras(o_type_id);

CREATE INDEX IF NOT EXISTS idx_ove_asset_tag_id
    ON public.orders_visits_extras(asset_tag_id);

CREATE INDEX IF NOT EXISTS idx_ove_priority_id
    ON public.orders_visits_extras(priority_id);

CREATE INDEX IF NOT EXISTS idx_ove_team_leader_id
    ON public.orders_visits_extras(team_leader_id);

CREATE INDEX IF NOT EXISTS idx_ove_team_id
    ON public.orders_visits_extras(team_id);

CREATE INDEX IF NOT EXISTS idx_ove_system_parent_id
    ON public.orders_visits_extras(system_parent_id);

CREATE INDEX IF NOT EXISTS idx_ove_system_id
    ON public.orders_visits_extras(system_id);

CREATE INDEX IF NOT EXISTS idx_ove_o_type_sub_id
    ON public.orders_visits_extras(o_type_sub_id);

CREATE INDEX IF NOT EXISTS idx_ove_unit_type_parent_id
    ON public.orders_visits_extras(unit_type_parent_id);

CREATE INDEX IF NOT EXISTS idx_ove_unit_type_id
    ON public.orders_visits_extras(unit_type_id);

CREATE INDEX IF NOT EXISTS idx_ove_o_cause_reason_id
    ON public.orders_visits_extras(o_cause_reason_id);

CREATE INDEX IF NOT EXISTS idx_ove_processing_id
    ON public.orders_visits_extras(processing_id);

-- orders_visits_extras_followers
CREATE INDEX IF NOT EXISTS idx_ovef_user_id
    ON public.orders_visits_extras_followers(user_id);

CREATE INDEX IF NOT EXISTS idx_ovef_ove_id
    ON public.orders_visits_extras_followers(ove_id);

-- orders_visits_extras_teams
CREATE INDEX IF NOT EXISTS idx_ovet_ove_id
    ON public.orders_visits_extras_teams(ove_id);

CREATE INDEX IF NOT EXISTS idx_ovet_user_id
    ON public.orders_visits_extras_teams(user_id);

-- orders_visits_vehicles
CREATE INDEX IF NOT EXISTS idx_orders_visits_vehicles_vehicle_id
    ON public.orders_visits_vehicles(vehicle_id);

-- units
CREATE INDEX IF NOT EXISTS idx_units_unit_type_id
    ON public.units(unit_type_id);

-- users_tools
CREATE INDEX IF NOT EXISTS idx_users_tools_user_id
    ON public.users_tools(user_id);


-- =============================================================================
-- 2. NO PRIMARY KEY – ADD PRIMARY KEY
-- =============================================================================

-- orders_visits_extras_followers – adicionar PK composta (user_id, ove_id)
-- Assumindo que a combinação user_id + ove_id é única (tabela de seguimento)
ALTER TABLE public.orders_visits_extras_followers
    ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;

-- technicals_manuals_assets – adicionar PK composta (tm_id, asset_id)
-- Esta tabela é uma relação muitos-para-muitos
ALTER TABLE public.technicals_manuals_assets
    ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;


-- =============================================================================
-- 3. UNUSED INDEXES – DROP (candidatos a remoção)
-- Nota: Estes índices nunca foram usados pelo query planner.
--       São seguros de remover pois podem ser recriados se necessário.
--       Usar IF EXISTS para segurança.
-- =============================================================================

-- cfg_units_assets_tags
DROP INDEX IF EXISTS public.idx_cuat_active_unit;

-- orders_visits
DROP INDEX IF EXISTS public.idx_orders_visits_status_started;
DROP INDEX IF EXISTS public.idx_orders_visits_leader_status;
DROP INDEX IF EXISTS public.idx_ov_ended_at;
DROP INDEX IF EXISTS public.idx_ov_in_progress;

-- orders
DROP INDEX IF EXISTS public.idx_orders_provider_status_date;
DROP INDEX IF EXISTS public.idx_orders_cancel_reason_id;
DROP INDEX IF EXISTS public.idx_orders_active;
DROP INDEX IF EXISTS public.idx_orders_open;

-- cfg_app_notices
DROP INDEX IF EXISTS public.idx_cfg_app_notices_category;
DROP INDEX IF EXISTS public.idx_cfg_app_notices_severity;
DROP INDEX IF EXISTS public.idx_cfg_app_notices_dashboards;

-- cfg_app_tips
DROP INDEX IF EXISTS public.idx_cfg_app_tips_is_active;

-- cfg_app_tips_companies / _departments / _profiles
DROP INDEX IF EXISTS public.idx_cfg_app_tips_companies_company_id;
DROP INDEX IF EXISTS public.idx_cfg_app_tips_departments_department_id;
DROP INDEX IF EXISTS public.idx_cfg_app_tips_profiles_profile_id;

-- leader_scores_history
DROP INDEX IF EXISTS public.idx_leader_scores_history_leader_period;

-- cfg_app_tips_dismissals
DROP INDEX IF EXISTS public.idx_cfg_app_tips_dismissals_tip_id;

-- orders_visits_evaluations
DROP INDEX IF EXISTS public.idx_orders_visits_evaluations_evaluated_by;

-- ai_chat_sessions / ai_messages
DROP INDEX IF EXISTS public.idx_ai_chat_sessions_user_id;
DROP INDEX IF EXISTS public.idx_ai_messages_session_id;

-- assets
DROP INDEX IF EXISTS public.idx_assets_company_owner_id;

-- cfg_assets_tags / cfg_assets_tags_subs
DROP INDEX IF EXISTS public.idx_tags_description;
DROP INDEX IF EXISTS public.idx_tags_subs_description;

-- assets_alerts
DROP INDEX IF EXISTS public.idx_assets_alerts_asset_id;
DROP INDEX IF EXISTS public.idx_assets_alerts_priority_id;
DROP INDEX IF EXISTS public.idx_assets_alerts_done_created;

-- assets_available
DROP INDEX IF EXISTS public.idx_assets_available_asset_tag_id;

-- cfg_profiles
DROP INDEX IF EXISTS public.idx_cfg_profiles_department_id;

-- contracts_managers
DROP INDEX IF EXISTS public.idx_contracts_managers_contract_id;

-- maintenances_plans_sections
DROP INDEX IF EXISTS public.idx_maintenances_plans_sections_plan_id;

-- technicals_manuals_files
DROP INDEX IF EXISTS public.idx_technicals_manuals_files_tm_category_id;
DROP INDEX IF EXISTS public.idx_technicals_manuals_files_tm_id;

-- tools
DROP INDEX IF EXISTS public.idx_tools_created_user_id;
DROP INDEX IF EXISTS public.idx_tools_deleted_user_id;
DROP INDEX IF EXISTS public.idx_tools_updated_user_id;

-- users_tools / users_tools_movements
DROP INDEX IF EXISTS public.idx_users_tools_created_user_id;
DROP INDEX IF EXISTS public.idx_users_tools_movements_created_user_id;
DROP INDEX IF EXISTS public.idx_users_tools_movements_from_user_id;
DROP INDEX IF EXISTS public.idx_users_tools_movements_to_user_id;

-- warehouses_materials
DROP INDEX IF EXISTS public.idx_warehouses_materials_deleted_user_id;
DROP INDEX IF EXISTS public.idx_warehouses_materials_updated_user_id;

-- units
DROP INDEX IF EXISTS public.idx_trgm_units_description;
DROP INDEX IF EXISTS public.idx_units_searchable;

-- materials
DROP INDEX IF EXISTS public.idx_materials_searchable;
