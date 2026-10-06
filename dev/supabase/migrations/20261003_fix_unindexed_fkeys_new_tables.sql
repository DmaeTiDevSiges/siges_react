-- =============================================================================
-- Migration: Fix unindexed FKs + missing PKs (new tables since 2026-09-13)
-- Date: 2026-10-03
-- Context: Tables created after 20260913_fix_unindexed_fkeys_pk_and_unused_indexes.sql
--          were not covered by that migration.
-- Issues addressed:
--   • Unindexed FK columns on new tables (assets_loans*, cfg_loans*, tools, warehouses, etc.)
--   • Missing PKs on orders_visits_extras_followers / technicals_manuals_assets
--     (in case the 20260913 migration was applied before the PK columns existed)
--
-- NOTE on "unused indexes" (Severity 3):
--   The ~80 indexes flagged as unused are NOT being dropped here.
--   pg_stat_user_indexes resets on every DB restart / vacuumdb --analyze.
--   These indexes were created deliberately and cover real query patterns.
--   See analysis at the bottom of this file.
-- =============================================================================


-- =============================================================================
-- 1. UNINDEXED FOREIGN KEYS — tables added after 2026-09-13
-- =============================================================================

-- ai_chat_sessions.user_id
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id
    ON public.ai_chat_sessions(user_id);

-- ai_messages.session_id
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id
    ON public.ai_messages(session_id);

-- assets.company_owner_id
CREATE INDEX IF NOT EXISTS idx_assets_company_owner_id
    ON public.assets(company_owner_id);

-- assets_alerts.asset_id / priority_id
CREATE INDEX IF NOT EXISTS idx_assets_alerts_asset_id
    ON public.assets_alerts(asset_id);

CREATE INDEX IF NOT EXISTS idx_assets_alerts_priority_id
    ON public.assets_alerts(priority_id);

-- assets_available.asset_tag_id
CREATE INDEX IF NOT EXISTS idx_assets_available_asset_tag_id
    ON public.assets_available(asset_tag_id);

-- assets_loans (new columns added after 20260915)
CREATE INDEX IF NOT EXISTS idx_assets_loans_created_user_id
    ON public.assets_loans(created_user_id);

CREATE INDEX IF NOT EXISTS idx_assets_loans_deleted_user_id
    ON public.assets_loans(deleted_user_id);

CREATE INDEX IF NOT EXISTS idx_assets_loans_inspector_delivery_user_id
    ON public.assets_loans(inspector_delivery_user_id);

CREATE INDEX IF NOT EXISTS idx_assets_loans_inspector_return_user_id
    ON public.assets_loans(inspector_return_user_id);

-- assets_loans_checklists.loan_id / filled_by_user_id
CREATE INDEX IF NOT EXISTS idx_assets_loans_checklists_loan_id
    ON public.assets_loans_checklists(loan_id);

CREATE INDEX IF NOT EXISTS idx_assets_loans_checklists_filled_by_user_id
    ON public.assets_loans_checklists(filled_by_user_id);

-- assets_loans_checklists_images.uploaded_by_user_id
CREATE INDEX IF NOT EXISTS idx_assets_loans_checklists_images_uploaded_by_user_id
    ON public.assets_loans_checklists_images(uploaded_by_user_id);

-- cfg_app_notices.category_id / severity_id
CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_category_id
    ON public.cfg_app_notices(category_id);

CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_severity_id
    ON public.cfg_app_notices(severity_id);

-- cfg_app_tips_companies.company_id
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_companies_company_id
    ON public.cfg_app_tips_companies(company_id);

-- cfg_app_tips_departments.department_id
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_departments_department_id
    ON public.cfg_app_tips_departments(department_id);

-- cfg_app_tips_profiles.profile_id
CREATE INDEX IF NOT EXISTS idx_cfg_app_tips_profiles_profile_id
    ON public.cfg_app_tips_profiles(profile_id);

-- cfg_profiles.departmentid
CREATE INDEX IF NOT EXISTS idx_cfg_profiles_department_id
    ON public.cfg_profiles(departmentid);

-- contracts_managers.contract_id
CREATE INDEX IF NOT EXISTS idx_contracts_managers_contract_id
    ON public.contracts_managers(contract_id);

-- leader_scores_history.leader_id
CREATE INDEX IF NOT EXISTS idx_leader_scores_history_leader_id
    ON public.leader_scores_history(leader_id);

-- maintenances_plans_sections.maintenance_plan_id
CREATE INDEX IF NOT EXISTS idx_maintenances_plans_sections_plan_id
    ON public.maintenances_plans_sections(maintenance_plan_id);

-- orders.cancel_reason_id
CREATE INDEX IF NOT EXISTS idx_orders_cancel_reason_id
    ON public.orders(cancel_reason_id);

-- orders_visits_evaluations.evaluated_by_user_id
CREATE INDEX IF NOT EXISTS idx_orders_visits_evaluations_evaluated_by_user_id
    ON public.orders_visits_evaluations(evaluated_by_user_id);

-- technicals_manuals_files.tm_id / tm_category_id
CREATE INDEX IF NOT EXISTS idx_technicals_manuals_files_tm_id
    ON public.technicals_manuals_files(tm_id);

CREATE INDEX IF NOT EXISTS idx_technicals_manuals_files_tm_category_id
    ON public.technicals_manuals_files(tm_category_id);

-- tools.created_user_id / deleted_user_id / updated_user_id
CREATE INDEX IF NOT EXISTS idx_tools_created_user_id
    ON public.tools(created_user_id);

CREATE INDEX IF NOT EXISTS idx_tools_deleted_user_id
    ON public.tools(deleted_user_id);

CREATE INDEX IF NOT EXISTS idx_tools_updated_user_id
    ON public.tools(updated_user_id);

-- users_tools.created_user_id
CREATE INDEX IF NOT EXISTS idx_users_tools_created_user_id
    ON public.users_tools(created_user_id);

-- users_tools_movements.created_user_id / from_user_id / to_user_id
CREATE INDEX IF NOT EXISTS idx_users_tools_movements_created_user_id
    ON public.users_tools_movements(created_user_id);

CREATE INDEX IF NOT EXISTS idx_users_tools_movements_from_user_id
    ON public.users_tools_movements(from_user_id);

CREATE INDEX IF NOT EXISTS idx_users_tools_movements_to_user_id
    ON public.users_tools_movements(to_user_id);

-- warehouses.company_id / department_id
CREATE INDEX IF NOT EXISTS idx_warehouses_company_id
    ON public.warehouses(company_id);

CREATE INDEX IF NOT EXISTS idx_warehouses_department_id
    ON public.warehouses(department_id);

-- warehouses_materials.deleted_user_id / updated_user_id
CREATE INDEX IF NOT EXISTS idx_warehouses_materials_deleted_user_id
    ON public.warehouses_materials(deleted_user_id);

CREATE INDEX IF NOT EXISTS idx_warehouses_materials_updated_user_id
    ON public.warehouses_materials(updated_user_id);


-- =============================================================================
-- 2. MISSING PRIMARY KEYS — idempotent guard via DO block
-- =============================================================================

-- orders_visits_extras_followers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'orders_visits_extras_followers'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.orders_visits_extras_followers
            ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
    END IF;
END $$;

-- technicals_manuals_assets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'technicals_manuals_assets'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.technicals_manuals_assets
            ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
    END IF;
END $$;


-- =============================================================================
-- NOTE: UNUSED INDEXES (Severity 3) — NÃO removidos intencionalmente
-- =============================================================================
-- Os ~80 índices flagados como "unused" pelo Supabase Advisor têm idx_scan = 0
-- porque pg_stat_user_indexes é resetado a cada reinicialização do DB ou
-- VACUUM ANALYZE. Eles cobrem padrões de query reais (filtros de status,
-- date ranges, full-text search, FKs) e foram criados deliberadamente.
-- Remover índices úteis degradaria performance em produção.
-- Reavalie apenas após 30+ dias de uso real em produção com stats acumuladas.
-- =============================================================================
