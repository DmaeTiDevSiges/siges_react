-- Rollback: 20261026_client_scope.sql
-- Removes only the client_scope policies/functions/indexes introduced by
-- Phase 1D and restores the single-client units synchronization from Phase 1A.
--
-- Does not remove cfg_departments.clients_ids, its validation trigger/index,
-- units.clients_ids, or the Phase 1A GIN index; those predate this migration
-- in this repository. Do not run until the application has been rolled back.
--
-- Restore the pre-migration policy/view/index snapshots separately when the
-- rollout has changed any objects outside the scope of this DOWN migration.

SET lock_timeout = '5s';
SET timezone = 'America/Sao_Paulo';

BEGIN;

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'client\_scope\_%' ESCAPE '\'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      item.policyname, item.schemaname, item.tablename
    );
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.fc_scope_client_ids();
DROP FUNCTION IF EXISTS public.fc_scope_has_resolution();
DROP FUNCTION IF EXISTS public.fc_scope_is_unrestricted();
DROP FUNCTION IF EXISTS public.fc_scope_department_id();

DROP INDEX IF EXISTS public.idx_client_scope_1d_orders_client_id;
DROP INDEX IF EXISTS public.idx_client_scope_1d_units_client_id;
DROP INDEX IF EXISTS public.idx_client_scope_1d_assets_client_id;
DROP INDEX IF EXISTS public.idx_client_scope_1d_contracts_client_id;
DROP INDEX IF EXISTS public.idx_client_scope_1d_assets_alerts_client_id;

-- Restore the department trigger function supplied by
-- 20261026_cfg_departments_clients_ids.sql.
CREATE OR REPLACE FUNCTION public.fn_validate_department_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  invalid_ids bigint[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := '{}'::bigint[];
    END IF;
  ELSE
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := OLD.clients_ids;
    END IF;
  END IF;

  IF array_position(NEW.clients_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids não pode conter NULL dentro do array (depto %)', NEW.id;
  END IF;

  SELECT array_agg(DISTINCT client_id ORDER BY client_id)
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

-- Restore the exact single-client behavior used in Phase 1A.
CREATE OR REPLACE FUNCTION public.fn_sync_units_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := '{}'::bigint[];
    END IF;

    IF cardinality(NEW.clients_ids) > 1 THEN
      RAISE EXCEPTION 'Multi-cliente desligado nesta fase (Fase 1A/1B)';
    END IF;

    IF NEW.client_id IS NOT NULL THEN
      NEW.clients_ids := ARRAY[NEW.client_id]::bigint[];
    ELSIF cardinality(NEW.clients_ids) > 0 THEN
      NEW.client_id := NEW.clients_ids[1];
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.clients_ids IS NULL THEN
    NEW.clients_ids := OLD.clients_ids;
  END IF;

  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     AND cardinality(OLD.clients_ids) > 1
     AND NEW.clients_ids IS NOT DISTINCT FROM OLD.clients_ids THEN
    RAISE EXCEPTION 'Unidade % tem múltiplos clientes; edite na versão nova', OLD.id;
  END IF;

  IF cardinality(NEW.clients_ids) > 1 THEN
    RAISE EXCEPTION 'Multi-cliente desligado nesta fase (Fase 1A/1B)';
  END IF;

  IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    NEW.clients_ids := CASE
      WHEN NEW.client_id IS NULL THEN '{}'::bigint[]
      ELSE ARRAY[NEW.client_id]::bigint[]
    END;
  ELSIF NEW.clients_ids IS DISTINCT FROM OLD.clients_ids THEN
    NEW.client_id := CASE
      WHEN cardinality(NEW.clients_ids) > 0 THEN NEW.clients_ids[1]
      ELSE NULL
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
CREATE TRIGGER trg_units_sync_clients_ids
BEFORE INSERT OR UPDATE OF client_id, clients_ids ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_units_clients_ids();

NOTIFY pgrst, 'reload schema';

COMMIT;

-- This rollback intentionally keeps RLS enabled and restores the existing
-- permissive policies. Re-check the saved policy snapshot before relying on
-- that behavior; restore it if any policies were changed outside this phase.
