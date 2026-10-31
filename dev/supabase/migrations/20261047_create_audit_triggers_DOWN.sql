-- ============================================================
-- DOWN da Migration: 20261047_create_audit_triggers.sql
-- Remove os triggers de auditoria e a função fc_audit_log().
-- Os dados já gravados em audits_logs são PRESERVADOS
-- (remoção de histórico é decisão operacional, não reversão).
-- ============================================================

DO $$
DECLARE
    t text;
    audited_tables text[] := ARRAY[
        'orders','orders_followers','orders_visits','orders_visits_assets',
        'orders_visits_assets_activities','orders_visits_assets_materials',
        'orders_visits_services','orders_visits_teams','orders_visits_vehicles',
        'orders_visits_evaluations','orders_visits_extras','orders_visits_extras_teams',
        'orders_visits_extras_followers','orders_visits_maintenance_plans',
        'assets','assets_alerts','assets_available','assets_followers',
        'assets_loans','assets_loans_checklists','assets_loans_checklists_images',
        'assets_materials','assets_attributes_values',
        'materials','materials_purchases','warehouses','warehouses_materials','carts_materials',
        'users','users_tools','users_tools_movements','tools',
        'units','clients','cfg_companies','cfg_departments','cfg_teams',
        'contracts','contracts_services','contracts_managers',
        'vehicles','vehicles_monthly_expenses',
        'cfg_profiles','cfg_profiles_access','cfg_profiles_permissions',
        'cfg_users_statuses','cfg_routes',
        'cfg_systems','cfg_units_types','cfg_units_statuses','cfg_units_assets_tags',
        'cfg_orders_types','cfg_orders_types_subs','cfg_orders_types_activities',
        'cfg_orders_priorities','cfg_orders_statuses','cfg_orders_plans','cfg_orders_objects',
        'cfg_orders_cancel_reasons','cfg_orders_suspended_reasons','cfg_orders_causes_reasons',
        'cfg_assets_types','cfg_assets_statuses','cfg_assets_priorities',
        'cfg_assets_tags','cfg_assets_tags_subs','cfg_assets_attributes','cfg_assets_attributes_groups',
        'cfg_materials_types','cfg_materials_statuses',
        'cfg_services','cfg_activities','cfg_contracts_statuses','cfg_evaluation_requirements'
    ];
BEGIN
    FOREACH t IN ARRAY audited_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON public.%I', t, t);
        END IF;
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.fc_audit_log();

-- ============================================================
-- FIM DO DOWN 20261047_create_audit_triggers.sql
-- ============================================================
