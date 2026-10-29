-- Migration: 20261026_cfg_departments_clients_ids.sql
-- Fase 1D — Escopo por cliente via cfg_departments.clients_ids
-- Runbook: docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md §7.2
-- Plano:   docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md §4.4
--
-- ATENÇÃO: item de Fase 1D. Executar somente APÓS o Gate 4
-- (web antiga aposentada / compatibilidade validada).
--
-- Conteúdo:
--   1) Coluna cfg_departments.clients_ids (bigint[] NULL) — aditiva
--   2) CHECK bloqueando NULL dentro do array
--   3) Trigger de validação (ids devem existir em clients)
--   4) Índice GIN
--
-- Impacto na web antiga (enquanto RLS estiver desligado): nenhum.
-- A web antiga não escreve clients_ids; o trigger normaliza NULL e
-- preserva o valor atual em UPDATE, como no units.clients_ids.
--
-- Cadeia de escopo: users.team_id -> cfg_teams.department_id
--                  -> cfg_departments.clients_ids

SET lock_timeout = '5s';

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Coluna aditiva (metadata-only no PG 11+; NULL = ainda não configurado)
-- ---------------------------------------------------------------------------
ALTER TABLE public.cfg_departments
  ADD COLUMN IF NOT EXISTS clients_ids bigint[];

-- ---------------------------------------------------------------------------
-- 2) CHECK: bloquear NULL dentro do array.
--    (CHECK não aceita subquery; array_position é IMMUTABLE e permitido.
--     clients_ids IS NULL continua permitido = departamento não configurado.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.cfg_departments
  DROP CONSTRAINT IF EXISTS cfg_departments_clients_ids_no_null;
ALTER TABLE public.cfg_departments
  ADD CONSTRAINT cfg_departments_clients_ids_no_null
  CHECK (clients_ids IS NULL OR array_position(clients_ids, NULL) IS NULL);

-- ---------------------------------------------------------------------------
-- 3) Trigger de validação
--    - INSERT: NULL -> '{}' (sem acesso; não "todos")
--    - UPDATE com NULL explícito: preserva OLD (web antiga serializa linha inteira)
--    - Deduplica e ordena
--    - NULL dentro do array: exceção
--    - Ids inexistentes em clients: exceção
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_department_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  invalid_ids bigint[];
BEGIN
  -- Normalização defensiva (mesmo padrão do fn_sync_units_clients_ids)
  IF TG_OP = 'INSERT' THEN
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := '{}'::bigint[];
    END IF;
  ELSE
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := OLD.clients_ids;
    END IF;
  END IF;

  -- Bloquear NULL dentro do array (erro explícito em vez de violação genérica)
  IF array_position(NEW.clients_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids não pode conter NULL dentro do array (depto %)', NEW.id;
  END IF;

  -- Deduplicar e ordenar (mantém comparação determinística)
  SELECT array_agg(DISTINCT x ORDER BY x)
  INTO NEW.clients_ids
  FROM unnest(NEW.clients_ids) AS x;

  -- Validar existência dos ids em clients
  SELECT array_agg(x)
  INTO invalid_ids
  FROM unnest(NEW.clients_ids) AS x
  LEFT JOIN public.clients c ON c.id = x
  WHERE c.id IS NULL;

  IF invalid_ids IS NOT NULL THEN
    RAISE EXCEPTION 'clients_ids contém ids inexistentes em clients: %', invalid_ids;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_department_clients_ids ON public.cfg_departments;
CREATE TRIGGER trg_validate_department_clients_ids
BEFORE INSERT OR UPDATE OF clients_ids ON public.cfg_departments
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_department_clients_ids();

-- ---------------------------------------------------------------------------
-- 4) Índice GIN (tabela pequena: índice normal, sem CONCURRENTLY)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cfg_departments_clients_ids_gin
  ON public.cfg_departments USING GIN (clients_ids);

COMMIT;

-- ---------------------------------------------------------------------------
-- Backfill: NÃO há. cfg_departments.clients_ids nasce NULL (departamento
-- ainda sem escopo definido). O preenchimento será feito na ativação do
-- seletor de cliente (Fase 1D, após Gate 4), por exemplo:
--
--   UPDATE public.cfg_departments
--   SET clients_ids = ARRAY[<cliente_id>]::bigint[]
--   WHERE id = <departamento_id>;
--
-- Semântica: NULL ou '{}' = SEM ACESSO (não "todos os clientes").
-- ---------------------------------------------------------------------------

-- Se a coluna/nova constraint não aparecer na API:
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Queries de conferência (pós-aplicação)
-- ---------------------------------------------------------------------------
-- SELECT id, code, description, clients_ids
-- FROM public.cfg_departments
-- ORDER BY description;
--
-- -- Departamentos ainda sem escopo (NULL ou vazio):
-- SELECT id, description FROM public.cfg_departments
-- WHERE clients_ids IS NULL OR clients_ids = '{}';
