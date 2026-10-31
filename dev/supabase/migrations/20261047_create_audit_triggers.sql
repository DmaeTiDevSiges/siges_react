-- =====================================================
-- Migration: Triggers de auditoria (INSERT/UPDATE/DELETE)
-- Date: 2026-10-31
-- Description: Cria a função genérica fc_audit_log() e um trigger
--              AFTER por tabela de negócio que grava cada inclusão,
--              alteração e exclusão em public.audits_logs.
--
--              Por que no banco e não no client? A app não tem camada
--              central de mutação (cada serviço chama o Supabase
--              direto) e há escritas via RPCs, imports e n8n — só o
--              banco captura todas as origens.
--
--              Padrão seguido: fc_orders_statuses_logs
--              (SECURITY DEFINER + SET search_path + autoria via
--              auth.uid() → users.id, com fallback NULL para
--              origens sem JWT).
--
--              Pré-requisito: 20261046_reactivate_audits_logs.sql
-- =====================================================

-- 1. Função genérica ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fc_audit_log() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
DECLARE
    v_user_uuid uuid;
    v_user_id   bigint;
    v_old       jsonb;
    v_new       jsonb;
    v_record_id text;
    -- Colunas cujo valor nunca deve parar no log.
    v_sensitive constant text[] := ARRAY[
        'password', 'password_hash', 'token', 'access_token', 'refresh_token',
        'secret', 'api_key', 'impersonation_password_backup'
    ];
    k text;
BEGIN
    -- Autoria: usuário autenticado (app). Sem JWT (n8n, imports,
    -- jobs, SQL manual) o uuid fica NULL.
    v_user_uuid := auth.uid();
    IF v_user_uuid IS NOT NULL THEN
        BEGIN
            SELECT id INTO v_user_id
            FROM public.users
            WHERE uuid = v_user_uuid;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_record_id := v_old ->> 'id';
    ELSIF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_record_id := v_new ->> 'id';
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_record_id := v_new ->> 'id';

        -- Anti-ruído: updates que só "tocaam" as colunas de controle
        -- (updated_at / updated_user_id) sem mudar nada mais não
        -- geram linha de auditoria.
        v_old := v_old - 'updated_at' - 'updated_user_id';
        v_new := v_new - 'updated_at' - 'updated_user_id';

        IF v_old IS NOT DISTINCT FROM v_new THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Redação de colunas sensíveis (apenas quando presentes).
    FOREACH k IN ARRAY v_sensitive LOOP
        IF v_old IS NOT NULL AND v_old ? k THEN
            v_old := (v_old - k) || jsonb_build_object(k, '[REDACTED]');
        END IF;
        IF v_new IS NOT NULL AND v_new ? k THEN
            v_new := (v_new - k) || jsonb_build_object(k, '[REDACTED]');
        END IF;
    END LOOP;

    INSERT INTO public.audits_logs (
        created_date,
        user_uuid,
        user_id,
        table_name,
        operation,
        record_id,
        schema_name,
        data_old,
        data_new
    ) VALUES (
        -- Convenção do projeto: timestamp sem offset = horário de SP.
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        v_user_uuid,
        v_user_id,
        TG_TABLE_NAME,
        TG_OP,
        v_record_id,
        TG_TABLE_SCHEMA,
        v_old,
        v_new
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.fc_audit_log() IS
'Flow: audit-log v1.0.0 — Grava em audits_logs cada INSERT/UPDATE/DELETE real (ignora updates só de updated_at/updated_user_id) nas tabelas de negócio, com autoria via auth.uid(). SECURITY DEFINER para escrever mesmo com RLS restrito a leitura.';

-- 2. Tabelas auditadas -------------------------------------------------------
-- Escopo: tabelas de negócio (ordens, visitas, ativos, materiais,
-- usuários, unidades, contratos, veículos, ferramentas e cfg_*).
-- Fora do escopo (alto volume/ruído ou já são logs):
--   orders_visits_chat*, users_notifications, users_tracker, ai_*,
--   gamification (leader_*), logs_api, orders_statuses_logs,
--   audits_logs (a própria).

-- 3. Instalação idempotente dos triggers -------------------------------------
-- Um trigger AFTER multi-operação por tabela; só instala se a tabela
-- existir (algumas vêm de migrations mais recentes que o dump).

DO $$
DECLARE
    t text;
    audited_tables text[] := ARRAY[
        -- Ordens de serviço / visitas
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
        -- Ativos
        'assets',
        'assets_alerts',
        'assets_available',
        'assets_followers',
        'assets_loans',
        'assets_loans_checklists',
        'assets_loans_checklists_images',
        'assets_materials',
        'assets_attributes_values',
        -- Materiais / almoxarifado
        'materials',
        'materials_purchases',
        'warehouses',
        'warehouses_materials',
        'carts_materials',
        -- Usuários
        'users',
        'users_tools',
        'users_tools_movements',
        'tools',
        -- Unidades / clientes / empresas / contratos
        'units',
        'clients',
        'cfg_companies',
        'cfg_departments',
        'cfg_teams',
        'contracts',
        'contracts_services',
        'contracts_managers',
        -- Veículos
        'vehicles',
        'vehicles_monthly_expenses',
        -- Perfis e permissões
        'cfg_profiles',
        'cfg_profiles_access',
        'cfg_profiles_permissions',
        'cfg_users_statuses',
        'cfg_routes',
        -- Configurações de negócio (cfg)
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
    ];
BEGIN
    FOREACH t IN ARRAY audited_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS trg_audit_%s ON public.%I', t, t
            );
            EXECUTE format(
                'CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fc_audit_log()',
                t, t
            );
        ELSE
            RAISE NOTICE 'Tabela public.% não existe — trigger de auditoria ignorada', t;
        END IF;
    END LOOP;
END $$;
