-- Migration: 20261026_units_clients_ids_compat.sql
-- Fase 1A — Compatibilidade aditiva (escopo por cliente)
-- Runbook: docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md §4
--
-- Impacto na web antiga: nenhum. A coluna e o trigger são aditivos;
-- v_units, fc_*, nearby_units e policies não mudam.
--
-- O bloco DDL roda em transação; o índice GIN CONCURRENTLY deve rodar
-- fora dela (execução separada no SQL Editor do Supabase).

-- 0) Evita espera indefinida por lock
SET lock_timeout = '5s';

BEGIN;

-- 1) Coluna aditiva (metadata-only no PG 11+)
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS clients_ids bigint[] NOT NULL DEFAULT '{}'::bigint[];

-- 2) Trigger de compatibilidade (modo single-client)
CREATE OR REPLACE FUNCTION public.fn_sync_units_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Web antiga pode serializar a linha inteira e mandar NULL; normaliza
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := '{}'::bigint[];
    END IF;

    -- Multi-cliente desligado nas Fases 1A/1B (remover na Fase 1D, após o Gate 4)
    IF cardinality(NEW.clients_ids) > 1 THEN
      RAISE EXCEPTION 'Multi-cliente desligado nesta fase (Fase 1A/1B)';
    END IF;

    IF NEW.client_id IS NOT NULL THEN
      -- Web antiga manda no escalar; app novo deve mandar somente o array
      NEW.clients_ids := ARRAY[NEW.client_id]::bigint[];
    ELSIF cardinality(NEW.clients_ids) > 0 THEN
      NEW.client_id := NEW.clients_ids[1];
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE
  -- Web antiga pode mandar clients_ids NULL ao serializar a linha inteira;
  -- preservar o array atual evita quebrar o fluxo legado.
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
    -- Escrita da web antiga (ou de fluxo legado que ainda usa o escalar)
    NEW.clients_ids := CASE
      WHEN NEW.client_id IS NULL THEN '{}'::bigint[]
      ELSE ARRAY[NEW.client_id]::bigint[]
    END;
  ELSIF NEW.clients_ids IS DISTINCT FROM OLD.clients_ids THEN
    -- Escrita do app novo (somente array)
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
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_units_clients_ids();

-- 3) Backfill (idempotente)
UPDATE public.units
SET clients_ids = ARRAY[client_id]::bigint[]
WHERE client_id IS NOT NULL
  AND cardinality(clients_ids) = 0;

COMMIT;

-- ---------------------------------------------------------------------------
-- Índice GIN — executar FORA da transação (se usar CONCURRENTLY).
-- No SQL Editor do Supabase, rode este bloco em execução separada.
-- ---------------------------------------------------------------------------
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_clients_ids_gin
--   ON public.units USING GIN (clients_ids);
--
-- Se falhar (transação concorrente), dropar e repetir:
-- DROP INDEX CONCURRENTLY IF EXISTS public.idx_units_clients_ids_gin;

-- ---------------------------------------------------------------------------
-- View aditiva opcional v_units_clients
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_units_clients
WITH (security_invoker='true') AS
SELECT
  u.id AS unit_id,
  u.clients_ids,
  COALESCE(
    array_agg(c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL),
    '{}'::text[]
  ) AS client_names
FROM public.units u
LEFT JOIN public.clients c ON c.id = ANY(u.clients_ids)
GROUP BY u.id, u.clients_ids;

-- Seguir o padrão de grants das views existentes. Exemplo:
GRANT SELECT ON public.v_units_clients TO anon, authenticated;

-- Se a view/coluna não aparecer na API:
-- NOTIFY pgrst, 'reload schema';
