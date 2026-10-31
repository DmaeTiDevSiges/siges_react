-- =====================================================
-- Migration: Configuração das tabelas auditadas
-- Date: 2026-10-31
-- Description: Mantém uma lista permitida de tabelas auditáveis e
--              permite que apenas o super admin altere seus triggers
--              por RPC. Desabilitar auditoria não remove o histórico.
-- Pré-requisitos: 20261047_create_audit_triggers.sql,
--                 20261049_use_user_id_in_audits_logs.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cfg_audits_tables (
    table_name text PRIMARY KEY,
    is_enabled boolean NOT NULL DEFAULT false,
    updated_at timestamp without time zone NOT NULL
        DEFAULT timezone('America/Sao_Paulo', now()),
    updated_by bigint REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT cfg_audits_tables_name_check
        CHECK (table_name ~ '^[a-z][a-z0-9_]*$')
);

COMMENT ON TABLE public.cfg_audits_tables IS
    'Allowlist e estado dos triggers de auditoria gerenciáveis pelo super admin.';

ALTER TABLE public.cfg_audits_tables ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cfg_audits_tables FROM PUBLIC, anon, authenticated;

-- A allowlist replica as tabelas gerenciadas pelos triggers da migration 20261047.
-- O estado inicial é lido dos triggers já instalados, sem alterar o comportamento.
INSERT INTO public.cfg_audits_tables (table_name, is_enabled)
SELECT t.table_name,
       EXISTS (
           SELECT 1
           FROM pg_trigger tr
           JOIN pg_class rel ON rel.oid = tr.tgrelid
           JOIN pg_namespace ns ON ns.oid = rel.relnamespace
           WHERE ns.nspname = 'public'
             AND rel.relname = t.table_name
             AND tr.tgname = 'trg_audit_' || t.table_name
             AND NOT tr.tgisinternal
       )
FROM unnest(ARRAY[
    'orders',
    'orders_followers',
    'orders_visits',
    'orders_visits_assets',
    'orders_visits_assets_activities',
    'orders_visits_assets_materials',
    'orders_visits_services',
    'orders_visits_teams',
    'orders_visits_vehicles',
    'orders_visits_evaluations',
    'orders_visits_extras',
    'orders_visits_extras_teams',
    'orders_visits_extras_followers',
    'orders_visits_maintenance_plans',
    'assets',
    'assets_alerts',
    'assets_available',
    'assets_followers',
    'assets_loans',
    'assets_loans_checklists',
    'assets_loans_checklists_images',
    'assets_materials',
    'assets_attributes_values',
    'materials',
    'materials_purchases',
    'warehouses',
    'warehouses_materials',
    'carts_materials',
    'users',
    'users_tools',
    'users_tools_movements',
    'tools',
    'units',
    'clients',
    'cfg_companies',
    'cfg_departments',
    'cfg_teams',
    'contracts',
    'contracts_services',
    'contracts_managers',
    'vehicles',
    'vehicles_monthly_expenses',
    'cfg_profiles',
    'cfg_profiles_access',
    'cfg_profiles_permissions',
    'cfg_users_statuses',
    'cfg_routes',
    'cfg_systems',
    'cfg_units_types',
    'cfg_units_statuses',
    'cfg_units_assets_tags',
    'cfg_orders_types',
    'cfg_orders_types_subs',
    'cfg_orders_types_activities',
    'cfg_orders_priorities',
    'cfg_orders_statuses',
    'cfg_orders_plans',
    'cfg_orders_objects',
    'cfg_orders_cancel_reasons',
    'cfg_orders_suspended_reasons',
    'cfg_orders_causes_reasons',
    'cfg_assets_types',
    'cfg_assets_statuses',
    'cfg_assets_priorities',
    'cfg_assets_tags',
    'cfg_assets_tags_subs',
    'cfg_assets_attributes',
    'cfg_assets_attributes_groups',
    'cfg_materials_types',
    'cfg_materials_statuses',
    'cfg_services',
    'cfg_activities',
    'cfg_contracts_statuses',
    'cfg_evaluation_requirements'
]::text[]) AS t(table_name)
ON CONFLICT (table_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_audit_table_config()
RETURNS TABLE(table_name text, is_enabled boolean, table_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.uuid = auth.uid()
          AND u.is_admin_super IS TRUE
    ) THEN
        RAISE EXCEPTION 'Apenas o super admin pode consultar a configuração de auditoria'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT c.table_name,
           EXISTS (
               SELECT 1
               FROM pg_trigger tr
               WHERE tr.tgrelid = to_regclass(format('%I.%I', 'public', c.table_name))
                 AND tr.tgname = 'trg_audit_' || c.table_name
                 AND NOT tr.tgisinternal
           ),
           to_regclass(format('%I.%I', 'public', c.table_name)) IS NOT NULL
    FROM public.cfg_audits_tables c
    ORDER BY c.table_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_audit_table_config(p_changes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id bigint;
    v_item jsonb;
    v_table_name text;
    v_enabled boolean;
    v_table_oid regclass;
    v_change_count integer;
    v_unique_count integer;
BEGIN
    SELECT u.id
      INTO v_user_id
      FROM public.users u
     WHERE u.uuid = auth.uid()
       AND u.is_admin_super IS TRUE;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Apenas o super admin pode alterar a configuração de auditoria'
            USING ERRCODE = '42501';
    END IF;

    IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'A configuração deve ser enviada como uma lista de alterações'
            USING ERRCODE = '22023';
    END IF;

    SELECT count(*), count(DISTINCT value ->> 'table_name')
      INTO v_change_count, v_unique_count
      FROM jsonb_array_elements(p_changes) AS changes(value);

    IF v_change_count <> v_unique_count THEN
        RAISE EXCEPTION 'A lista contém tabelas duplicadas'
            USING ERRCODE = '22023';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_changes) AS changes(value)
    LOOP
        IF jsonb_typeof(v_item -> 'table_name') IS DISTINCT FROM 'string'
           OR jsonb_typeof(v_item -> 'enabled') IS DISTINCT FROM 'boolean' THEN
            RAISE EXCEPTION 'Cada alteração deve informar table_name e enabled'
                USING ERRCODE = '22023';
        END IF;

        v_table_name := v_item ->> 'table_name';
        v_enabled := (v_item ->> 'enabled')::boolean;

        PERFORM 1
          FROM public.cfg_audits_tables c
         WHERE c.table_name = v_table_name
         FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Tabela não permitida para auditoria: %', v_table_name
                USING ERRCODE = '22023';
        END IF;

        v_table_oid := to_regclass(format('%I.%I', 'public', v_table_name));

        IF v_enabled AND v_table_oid IS NULL THEN
            RAISE EXCEPTION 'A tabela public.% não existe neste banco', v_table_name
                USING ERRCODE = '42P01';
        END IF;

        IF v_enabled THEN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_trigger tr
                WHERE tr.tgrelid = v_table_oid
                  AND tr.tgname = 'trg_audit_' || v_table_name
                  AND NOT tr.tgisinternal
            ) THEN
                EXECUTE format(
                    'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.fc_audit_log()',
                    'trg_audit_' || v_table_name,
                    'public',
                    v_table_name
                );
            END IF;
        ELSIF v_table_oid IS NOT NULL THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS %I ON %I.%I',
                'trg_audit_' || v_table_name,
                'public',
                v_table_name
            );
        END IF;

        UPDATE public.cfg_audits_tables
           SET is_enabled = v_enabled,
               updated_at = timezone('America/Sao_Paulo', now()),
               updated_by = v_user_id
         WHERE table_name = v_table_name;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_audit_table_config() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_audit_table_config(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_audit_table_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_audit_table_config(jsonb) TO authenticated;

COMMENT ON FUNCTION public.get_audit_table_config() IS
    'Lista tabelas de auditoria gerenciáveis; acesso exclusivo a super admins.';
COMMENT ON FUNCTION public.set_audit_table_config(jsonb) IS
    'Ativa/desativa triggers de auditoria atomicamente; acesso exclusivo a super admins.';
