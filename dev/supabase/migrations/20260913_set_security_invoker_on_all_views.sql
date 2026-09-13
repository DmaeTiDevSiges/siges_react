-- =============================================================================
-- Migration: Set security_invoker = true on all views
-- Date: 2026-09-13
-- Fix: Supabase Lint 0010 (Security Definer View)
-- Description:
--   No PostgreSQL 15+, views criadas sem 'WITH (security_invoker = true)' operam
--   por padrão como SECURITY DEFINER (security_invoker = false).
--   Isso faz com que o Supabase acuse risco de segurança de nível ERROR porque
--   as consultas à view executam com as permissões do criador da view em vez
--   do usuário que fez a requisição (ignorando RLS).
--
--   Este script aplica 'security_invoker = true' em todas as 85 views reportadas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Abordagem 1: Bloco Dinâmico (Altera todas as views existentes em 'public')
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
    v_count integer := 0;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
    ) LOOP
        BEGIN
            EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true);', r.table_schema, r.table_name);
            v_count := v_count + 1;
            RAISE NOTICE '[OK] security_invoker ativado em: %.%', r.table_schema, r.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[ERRO] Falha ao alterar %.%: %', r.table_schema, r.table_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '---------------------------------------------------------';
    RAISE NOTICE 'Total de views atualizadas para security_invoker: %', v_count;
    RAISE NOTICE '---------------------------------------------------------';
END $$;

-- -----------------------------------------------------------------------------
-- Abordagem 2: Comandos Explícitos para as 85 Views do Relatório Supabase
-- (Garante idempotência e registro exato das views afetadas)
-- -----------------------------------------------------------------------------
ALTER VIEW public.v_activities SET (security_invoker = true);
ALTER VIEW public.v_app SET (security_invoker = true);
ALTER VIEW public.v_app_notices SET (security_invoker = true);
ALTER VIEW public.v_app_offline_updates SET (security_invoker = true);
ALTER VIEW public.v_app_pages SET (security_invoker = true);
ALTER VIEW public.v_assets SET (security_invoker = true);
ALTER VIEW public.v_assets_available SET (security_invoker = true);
ALTER VIEW public.v_assets_couplings_models SET (security_invoker = true);
ALTER VIEW public.v_assets_followers SET (security_invoker = true);
ALTER VIEW public.v_assets_materials SET (security_invoker = true);
ALTER VIEW public.v_assets_priorities SET (security_invoker = true);
ALTER VIEW public.v_assets_statuses SET (security_invoker = true);
ALTER VIEW public.v_assets_tags SET (security_invoker = true);
ALTER VIEW public.v_assets_tags_subs SET (security_invoker = true);
ALTER VIEW public.v_assets_types SET (security_invoker = true);
ALTER VIEW public.v_assets_unavailable_reasons SET (security_invoker = true);
ALTER VIEW public.v_companies SET (security_invoker = true);
ALTER VIEW public.v_contracts SET (security_invoker = true);
ALTER VIEW public.v_contracts_evaluation_requirements SET (security_invoker = true);
ALTER VIEW public.v_contracts_managers SET (security_invoker = true);
ALTER VIEW public.v_contracts_services SET (security_invoker = true);
ALTER VIEW public.v_dash_admin_orders_filters_open SET (security_invoker = true);
ALTER VIEW public.v_dash_admin_orders_parent_filters_open SET (security_invoker = true);
ALTER VIEW public.v_dash_admin_orders_parent_status_1 SET (security_invoker = true);
ALTER VIEW public.v_departments SET (security_invoker = true);
ALTER VIEW public.v_import_orders_visits_contracts SET (security_invoker = true);
ALTER VIEW public.v_leader_ranking SET (security_invoker = true);
ALTER VIEW public.v_materials SET (security_invoker = true);
ALTER VIEW public.v_materials_purchases SET (security_invoker = true);
ALTER VIEW public.v_order_visit_scores SET (security_invoker = true);
ALTER VIEW public.v_orders SET (security_invoker = true);
ALTER VIEW public.v_orders_cancel_reasons SET (security_invoker = true);
ALTER VIEW public.v_orders_causes_reasons SET (security_invoker = true);
ALTER VIEW public.v_orders_counter SET (security_invoker = true);
ALTER VIEW public.v_orders_followers SET (security_invoker = true);
ALTER VIEW public.v_orders_objects SET (security_invoker = true);
ALTER VIEW public.v_orders_open SET (security_invoker = true);
ALTER VIEW public.v_orders_parent SET (security_invoker = true);
ALTER VIEW public.v_orders_plans SET (security_invoker = true);
ALTER VIEW public.v_orders_priorities SET (security_invoker = true);
ALTER VIEW public.v_orders_statuses SET (security_invoker = true);
ALTER VIEW public.v_orders_suspended_reasons SET (security_invoker = true);
ALTER VIEW public.v_orders_types SET (security_invoker = true);
ALTER VIEW public.v_orders_types_activities SET (security_invoker = true);
ALTER VIEW public.v_orders_types_subs SET (security_invoker = true);
ALTER VIEW public.v_orders_visits SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_assets SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_assets_activities SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_assets_materials SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_evaluations SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_extras SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_extras_followers SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_extras_no_archived SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_extras_teams SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_services SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_teams SET (security_invoker = true);
ALTER VIEW public.v_orders_visits_vehicles SET (security_invoker = true);
ALTER VIEW public.v_profiles SET (security_invoker = true);
ALTER VIEW public.v_profiles_permissions SET (security_invoker = true);
ALTER VIEW public.v_services SET (security_invoker = true);
ALTER VIEW public.v_systems SET (security_invoker = true);
ALTER VIEW public.v_systems_parent SET (security_invoker = true);
ALTER VIEW public.v_systems_parent_assets_tags_available_rate SET (security_invoker = true);
ALTER VIEW public.v_systems_parent_assets_tags_processing_counts SET (security_invoker = true);
ALTER VIEW public.v_teams SET (security_invoker = true);
ALTER VIEW public.v_teams_leaders SET (security_invoker = true);
ALTER VIEW public.v_technicals_manuals SET (security_invoker = true);
ALTER VIEW public.v_technicals_manuals_assets SET (security_invoker = true);
ALTER VIEW public.v_technicals_manuals_types SET (security_invoker = true);
ALTER VIEW public.v_unit_assets_tags_processing_counts SET (security_invoker = true);
ALTER VIEW public.v_units SET (security_invoker = true);
ALTER VIEW public.v_units_asset_available_rate_avg SET (security_invoker = true);
ALTER VIEW public.v_units_assets_tags SET (security_invoker = true);
ALTER VIEW public.v_units_assets_tags_availability SET (security_invoker = true);
ALTER VIEW public.v_units_assets_tags_available_rate SET (security_invoker = true);
ALTER VIEW public.v_units_assets_tags_available_rate_latest_by_user SET (security_invoker = true);
ALTER VIEW public.v_units_assets_tags_processing_counts SET (security_invoker = true);
ALTER VIEW public.v_units_by_assets_tags SET (security_invoker = true);
ALTER VIEW public.v_units_statuses SET (security_invoker = true);
ALTER VIEW public.v_units_types SET (security_invoker = true);
ALTER VIEW public.v_units_types_parent SET (security_invoker = true);
ALTER VIEW public.v_users SET (security_invoker = true);
ALTER VIEW public.v_users_notifications SET (security_invoker = true);
ALTER VIEW public.v_users_permissions SET (security_invoker = true);
ALTER VIEW public.v_vehicles SET (security_invoker = true);
