-- Migration: 20261026_client_scope.sql
-- Phase 1D — client scope via cfg_departments.clients_ids.
--
-- IMPORTANT:
--   * Prepared for controlled validation; do not apply to production until
--     staged with restricted-user tokens and the rollback has been rehearsed.
--   * This migration adds RESTRICTIVE policies. Existing permissive policies,
--     including "Universal Access", are intentionally preserved; PostgreSQL
--     combines restrictive policies with permissive policies using AND.
--   * Admin client selection remains an application responsibility. RLS grants
--     admins access to all clients; it does not read localStorage.
--   * User/team/department configuration tables are not themselves scoped here.
--   * The migration refuses to continue if any scoped table has RLS disabled;
--     enablement must be separately reviewed and included in a rollback plan.
--
-- References:
--   docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md
--   docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md

SET lock_timeout = '5s';
SET timezone = 'America/Sao_Paulo';

BEGIN;

-- Fail before changing anything if this migration is being applied to an
-- incompatible schema.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL
     OR to_regclass('public.cfg_teams') IS NULL
     OR to_regclass('public.cfg_departments') IS NULL
     OR to_regclass('public.clients') IS NULL
     OR to_regclass('public.units') IS NULL
     OR to_regclass('public.assets') IS NULL
     OR to_regclass('public.orders') IS NULL
     OR to_regclass('public.orders_visits') IS NULL
     OR to_regclass('public.contracts') IS NULL THEN
    RAISE EXCEPTION 'Fase 1D: uma ou mais tabelas base do escopo não existem';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name IN ('is_admin', 'is_admin_super')
    GROUP BY table_name
    HAVING count(*) = 2
  ) THEN
    RAISE EXCEPTION 'Fase 1D: public.users precisa das colunas is_admin e is_admin_super';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'units'
      AND column_name = 'clients_ids'
  ) THEN
    RAISE EXCEPTION 'Fase 1D: units.clients_ids não existe; aplique/verifique a Fase 1A primeiro';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY (ARRAY[
        'clients', 'units', 'assets', 'orders', 'orders_visits', 'contracts',
        'orders_followers', 'orders_statuses_logs',
        'orders_visits_assets', 'orders_visits_assets_activities',
        'orders_visits_assets_materials', 'orders_visits_chat',
        'orders_visits_chat_participants', 'orders_visits_chat_reads',
        'orders_visits_evaluations', 'orders_visits_extras',
        'orders_visits_extras_followers', 'orders_visits_extras_teams',
        'orders_visits_services', 'orders_visits_teams', 'orders_visits_vehicles',
        'orders_visits_maintenances_plans', 'import_orders_visits_contracts',
        'assets_alerts', 'assets_attributes_values', 'assets_available',
        'assets_followers', 'assets_materials', 'technicals_manuals_assets',
        'assets_loans', 'assets_loans_checklists',
        'assets_loans_checklists_images', 'contracts_services',
        'contracts_managers', 'contracts_evaluation_requirements',
        'cfg_units_assets_tags'
      ])
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Fase 1D: há tabelas do escopo sem RLS; revisar e planejar rollback antes de habilitá-lo';
  END IF;
END;
$$;

-- Departments may already have this column/trigger from the earlier
-- preparatory migration. IF NOT EXISTS keeps that installation intact.
ALTER TABLE public.cfg_departments
  ADD COLUMN IF NOT EXISTS clients_ids bigint[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.cfg_departments'::regclass
      AND conname = 'cfg_departments_clients_ids_no_null'
  ) THEN
    ALTER TABLE public.cfg_departments
      ADD CONSTRAINT cfg_departments_clients_ids_no_null
      CHECK (
        clients_ids IS NULL
        OR array_position(clients_ids, NULL) IS NULL
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_cfg_departments_clients_ids_gin
  ON public.cfg_departments USING GIN (clients_ids);

CREATE OR REPLACE FUNCTION public.fn_validate_department_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  invalid_ids bigint[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.clients_ids := COALESCE(NEW.clients_ids, '{}'::bigint[]);
  ELSIF NEW.clients_ids IS NULL THEN
    NEW.clients_ids := OLD.clients_ids;
  END IF;

  IF array_position(NEW.clients_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids não pode conter NULL dentro do array (depto %)', NEW.id;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT client_id ORDER BY client_id), '{}'::bigint[])
  INTO NEW.clients_ids
  FROM unnest(NEW.clients_ids) AS ids(client_id);

  SELECT array_agg(client_id)
  INTO invalid_ids
  FROM unnest(NEW.clients_ids) AS ids(client_id)
  LEFT JOIN public.clients c ON c.id = client_id
  WHERE c.id IS NULL;

  IF invalid_ids IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids contém ids inexistentes em clients: %', invalid_ids;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_department_clients_ids
  ON public.cfg_departments;
CREATE TRIGGER trg_validate_department_clients_ids
BEFORE INSERT OR UPDATE OF clients_ids ON public.cfg_departments
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_department_clients_ids();

-- In Phase 1D, the array is authoritative and client_id is only its legacy
-- single-client projection for remaining database consumers.
CREATE OR REPLACE FUNCTION public.fn_sync_units_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.clients_ids := COALESCE(NEW.clients_ids, '{}'::bigint[]);

  IF array_position(NEW.clients_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids não pode conter NULL dentro do array (unidade %)', NEW.id;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT client_id ORDER BY client_id), '{}'::bigint[])
  INTO NEW.clients_ids
  FROM unnest(NEW.clients_ids) AS ids(client_id);

  NEW.client_id := CASE
    WHEN cardinality(NEW.clients_ids) > 0 THEN NEW.clients_ids[1]
    ELSE NULL
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
CREATE TRIGGER trg_units_sync_clients_ids
BEFORE INSERT OR UPDATE OF client_id, clients_ids ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_units_clients_ids();

-- Scope resolution helpers. SECURITY DEFINER is limited to resolving the
-- authenticated user's own team/department and has a fixed search_path.
CREATE OR REPLACE FUNCTION public.fc_scope_department_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT team.department_id::bigint
  FROM public.users AS u
  JOIN public.cfg_teams AS team ON team.id = u.team_id
  WHERE u.uuid = (SELECT auth.uid())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.fc_scope_is_unrestricted()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT u.is_admin IS TRUE OR u.is_admin_super IS TRUE
      FROM public.users AS u
      WHERE u.uuid = (SELECT auth.uid())
      LIMIT 1
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.fc_scope_has_resolution()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT COALESCE(
    public.fc_scope_is_unrestricted()
    OR public.fc_scope_department_id() IS NOT NULL,
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.fc_scope_client_ids()
RETURNS bigint[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT department.clients_ids
      FROM public.cfg_departments AS department
      WHERE department.id = public.fc_scope_department_id()
      LIMIT 1
    ),
    '{}'::bigint[]
  )
$$;

REVOKE ALL ON FUNCTION public.fc_scope_department_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fc_scope_has_resolution() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fc_scope_client_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fc_scope_is_unrestricted() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fc_scope_department_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fc_scope_has_resolution() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fc_scope_client_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fc_scope_is_unrestricted() TO anon, authenticated;

-- Supporting indexes are created only when the corresponding legacy scalar
-- column exists. The assets scope itself is always resolved through units.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT *
    FROM (VALUES
      ('orders', 'client_id', 'idx_client_scope_1d_orders_client_id'),
      ('units', 'client_id', 'idx_client_scope_1d_units_client_id'),
      ('assets', 'client_id', 'idx_client_scope_1d_assets_client_id'),
      ('contracts', 'client_id', 'idx_client_scope_1d_contracts_client_id'),
      ('assets_alerts', 'client_id', 'idx_client_scope_1d_assets_alerts_client_id')
    ) AS indexes(table_name, column_name, index_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = item.table_name
        AND column_name = item.column_name
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        item.index_name, item.table_name, item.column_name
      );
    END IF;
  END LOOP;
END;
$$;

-- The restrictive policies compose with existing permissive policies, rather
-- than deleting/replacing the production policy snapshot.

DROP POLICY IF EXISTS client_scope_select ON public.clients;
CREATE POLICY client_scope_select ON public.clients
AS RESTRICTIVE FOR SELECT TO public
USING (
  public.fc_scope_is_unrestricted()
  OR id = ANY(public.fc_scope_client_ids())
);

DROP POLICY IF EXISTS client_scope_insert ON public.clients;
CREATE POLICY client_scope_insert ON public.clients
AS RESTRICTIVE FOR INSERT TO public
WITH CHECK (public.fc_scope_is_unrestricted());

DROP POLICY IF EXISTS client_scope_update ON public.clients;
CREATE POLICY client_scope_update ON public.clients
AS RESTRICTIVE FOR UPDATE TO public
USING (public.fc_scope_is_unrestricted())
WITH CHECK (public.fc_scope_is_unrestricted());

DROP POLICY IF EXISTS client_scope_delete ON public.clients;
CREATE POLICY client_scope_delete ON public.clients
AS RESTRICTIVE FOR DELETE TO public
USING (public.fc_scope_is_unrestricted());

DROP POLICY IF EXISTS client_scope_select ON public.units;
CREATE POLICY client_scope_select ON public.units
AS RESTRICTIVE FOR SELECT TO public
USING (
  public.fc_scope_is_unrestricted()
  OR (
    cardinality(public.fc_scope_client_ids()) > 0
    AND clients_ids && public.fc_scope_client_ids()
  )
);

DROP POLICY IF EXISTS client_scope_insert ON public.units;
CREATE POLICY client_scope_insert ON public.units
AS RESTRICTIVE FOR INSERT TO public
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR (
    cardinality(public.fc_scope_client_ids()) > 0
    AND cardinality(clients_ids) > 0
    AND clients_ids <@ public.fc_scope_client_ids()
  )
);

DROP POLICY IF EXISTS client_scope_update ON public.units;
CREATE POLICY client_scope_update ON public.units
AS RESTRICTIVE FOR UPDATE TO public
USING (
  public.fc_scope_is_unrestricted()
  OR (
    cardinality(public.fc_scope_client_ids()) > 0
    AND clients_ids && public.fc_scope_client_ids()
  )
)
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR (
    cardinality(public.fc_scope_client_ids()) > 0
    AND cardinality(clients_ids) > 0
    AND clients_ids <@ public.fc_scope_client_ids()
  )
);

DROP POLICY IF EXISTS client_scope_delete ON public.units;
CREATE POLICY client_scope_delete ON public.units
AS RESTRICTIVE FOR DELETE TO public
USING (
  public.fc_scope_is_unrestricted()
  OR (
    cardinality(public.fc_scope_client_ids()) > 0
    AND clients_ids && public.fc_scope_client_ids()
  )
);

DROP POLICY IF EXISTS client_scope_all ON public.assets;
CREATE POLICY client_scope_all ON public.assets
AS RESTRICTIVE FOR ALL TO public
USING (
  public.fc_scope_is_unrestricted()
  OR EXISTS (
    SELECT 1
    FROM public.units AS u
    WHERE u.id = assets.unit_id
      AND u.clients_ids && public.fc_scope_client_ids()
  )
)
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR EXISTS (
    SELECT 1
    FROM public.units AS u
    WHERE u.id = assets.unit_id
      AND u.clients_ids && public.fc_scope_client_ids()
  )
);

DROP POLICY IF EXISTS client_scope_all ON public.orders;
CREATE POLICY client_scope_all ON public.orders
AS RESTRICTIVE FOR ALL TO public
USING (
  public.fc_scope_is_unrestricted()
  OR client_id = ANY(public.fc_scope_client_ids())
)
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR client_id = ANY(public.fc_scope_client_ids())
);

DROP POLICY IF EXISTS client_scope_all ON public.contracts;
CREATE POLICY client_scope_all ON public.contracts
AS RESTRICTIVE FOR ALL TO public
USING (
  public.fc_scope_is_unrestricted()
  OR client_id = ANY(public.fc_scope_client_ids())
)
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR client_id = ANY(public.fc_scope_client_ids())
);

DROP POLICY IF EXISTS client_scope_all ON public.orders_visits;
CREATE POLICY client_scope_all ON public.orders_visits
AS RESTRICTIVE FOR ALL TO public
USING (
  public.fc_scope_is_unrestricted()
  OR EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = orders_visits.o_id
      AND o.client_id = ANY(public.fc_scope_client_ids())
  )
)
WITH CHECK (
  public.fc_scope_is_unrestricted()
  OR EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = orders_visits.o_id
      AND o.client_id = ANY(public.fc_scope_client_ids())
  )
);

-- Child tables inherit the restriction through a parent row that is itself
-- protected by one of the policies above or by another policy in this block.
DO $$
DECLARE
  item record;
  policy_expression text;
BEGIN
  FOR item IN
    SELECT *
    FROM (VALUES
      ('orders_followers', 'EXISTS (SELECT 1 FROM public.orders p WHERE p.id = orders_followers.o_id)'),
      ('orders_statuses_logs', 'EXISTS (SELECT 1 FROM public.orders p WHERE p.id = orders_statuses_logs.order_id OR p.id = orders_statuses_logs.order_parent_id)'),
      ('orders_visits_assets', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_assets.ov_id) AND EXISTS (SELECT 1 FROM public.assets a WHERE a.id = orders_visits_assets.asset_id)'),
      ('orders_visits_assets_activities', 'EXISTS (SELECT 1 FROM public.orders_visits_assets p WHERE p.id = orders_visits_assets_activities.ova_id)'),
      ('orders_visits_assets_materials', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_assets_materials.ov_id) AND EXISTS (SELECT 1 FROM public.assets a WHERE a.id = orders_visits_assets_materials.asset_id)'),
      ('orders_visits_chat', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_chat.ov_id)'),
      ('orders_visits_chat_participants', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_chat_participants.ov_id)'),
      ('orders_visits_chat_reads', 'EXISTS (SELECT 1 FROM public.orders_visits_chat c WHERE c.id = orders_visits_chat_reads.chat_id)'),
      ('orders_visits_evaluations', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_evaluations.ov_id)'),
      ('orders_visits_extras', 'EXISTS (SELECT 1 FROM public.orders o WHERE o.id = orders_visits_extras.o_id)'),
      ('orders_visits_extras_followers', 'EXISTS (SELECT 1 FROM public.orders_visits_extras e WHERE e.id = orders_visits_extras_followers.ove_id)'),
      ('orders_visits_extras_teams', 'EXISTS (SELECT 1 FROM public.orders_visits_extras e WHERE e.id = orders_visits_extras_teams.ove_id)'),
      ('orders_visits_services', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_services.ov_id)'),
      ('orders_visits_teams', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_teams.ov_id)'),
      ('orders_visits_vehicles', 'EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_vehicles.ov_id)'),
      ('orders_visits_maintenances_plans', 'EXISTS (SELECT 1 FROM public.orders o WHERE o.id = orders_visits_maintenances_plans.o_id) AND EXISTS (SELECT 1 FROM public.orders_visits v WHERE v.id = orders_visits_maintenances_plans.ov_id)'),
      ('import_orders_visits_contracts', 'EXISTS (SELECT 1 FROM public.contracts c WHERE c.code = import_orders_visits_contracts.contract_code AND c.client_id = ANY(public.fc_scope_client_ids())) AND EXISTS (SELECT 1 FROM public.units u WHERE u.code = import_orders_visits_contracts.unit_code AND u.clients_ids && public.fc_scope_client_ids())'),
      ('assets_alerts', '(EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_alerts.asset_id) AND (assets_alerts.o_id IS NULL OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = assets_alerts.o_id)))'),
      ('assets_attributes_values', 'EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_attributes_values.asset_id)'),
      ('assets_available', '((assets_available.unit_id IS NOT NULL OR assets_available.asset_id IS NOT NULL) AND (assets_available.unit_id IS NULL OR EXISTS (SELECT 1 FROM public.units u WHERE u.id = assets_available.unit_id)) AND (assets_available.asset_id IS NULL OR EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_available.asset_id)))'),
      ('assets_followers', 'EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_followers.asset_id)'),
      ('assets_materials', 'EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_materials.asset_id)'),
      ('technicals_manuals_assets', 'EXISTS (SELECT 1 FROM public.assets a WHERE a.id = technicals_manuals_assets.asset_id)'),
      ('assets_loans', 'EXISTS (SELECT 1 FROM public.assets a WHERE a.id = assets_loans.asset_id)'),
      ('assets_loans_checklists', 'EXISTS (SELECT 1 FROM public.assets_loans l WHERE l.id = assets_loans_checklists.loan_id)'),
      ('assets_loans_checklists_images', 'EXISTS (SELECT 1 FROM public.assets_loans_checklists c WHERE c.id = assets_loans_checklists_images.checklist_id)'),
      ('contracts_services', 'EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contracts_services.contract_id)'),
      ('contracts_managers', 'EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contracts_managers.contract_id)'),
      ('contracts_evaluation_requirements', 'EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contracts_evaluation_requirements.contract_id)'),
      ('cfg_units_assets_tags', 'EXISTS (SELECT 1 FROM public.units u WHERE u.id = cfg_units_assets_tags.unit_id)')
    ) AS scoped(table_name, expression)
  LOOP
    IF to_regclass(format('public.%I', item.table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    -- Do not silently install a policy against a stale dump with mismatched
    -- columns; fail the transaction so the live schema can be reviewed.
    policy_expression := item.expression;
    EXECUTE format('DROP POLICY IF EXISTS client_scope_all ON public.%I', item.table_name);
    EXECUTE format(
      'CREATE POLICY client_scope_all ON public.%I AS RESTRICTIVE FOR ALL TO public USING (public.fc_scope_is_unrestricted() OR (%s)) WITH CHECK (public.fc_scope_is_unrestricted() OR (%s))',
      item.table_name, policy_expression, policy_expression
    );
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Post-application validation (run with restricted and admin JWTs):
-- 1) SELECT * FROM public.fc_scope_department_id();
-- 2) SELECT public.fc_scope_client_ids(), public.fc_scope_is_unrestricted();
-- 3) Verify a restricted user sees only rows in the department's clients_ids.
-- 4) Attempt INSERT/UPDATE across an out-of-scope client; expect SQLSTATE 42501.
-- 5) Verify the admin path and the app's active-client filtering separately.
