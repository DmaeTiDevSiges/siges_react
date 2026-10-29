-- Migration: 20261037_backfill_cfg_systems_clients_ids.sql
-- Backfill de `cfg_systems.clients_ids` a partir das unidades.
--
-- Prerequisito: migration 20261036 (cria a coluna).
--
-- Por que: o filtro SISTEMA das páginas Gestão mostra apenas sistemas com
--   `cfg_systems.clients_ids && cfg_departments.clients_ids` e trata
--   `clients_ids IS NULL` como "sem escopo" (oculta). Sem este backfill todo
--   sistema nasce NULL e o filtro fica vazio para usuários comuns.
--
-- Origem do valor: clientes das unidades do sistema
--   (`units.clients_ids`, com fallback para `units.client_id` legado).
--   Pai e filho são preenchidos separadamente — SUB-SISTEMA usa o próprio
--   `clients_ids`.
--
-- Idempotente: só preenche onde `clients_ids IS NULL` (reexecução = no-op).
-- Aplicar manualmente no SQL Editor do Supabase (ver AGENTS.md).
-- Timezone: America/Sao_Paulo (Brasília)

SET timezone = 'America/Sao_Paulo';

-- 0) Evita espera indefinida por lock
SET lock_timeout = '5s';

-- 1) Sistemas PAI (units.system_parent_id) -----------------------------------
UPDATE public.cfg_systems s
   SET clients_ids = sub.ids
  FROM (
    SELECT u.system_parent_id AS id,
           array_remove(array_agg(DISTINCT x), NULL) AS ids
      FROM public.units u
      CROSS JOIN LATERAL unnest(
        CASE
          WHEN cardinality(u.clients_ids) > 0 THEN u.clients_ids
          WHEN u.client_id IS NOT NULL THEN ARRAY[u.client_id]::bigint[]
          ELSE NULL::bigint[]
        END
      ) AS x
     WHERE u.system_parent_id IS NOT NULL
       AND u.is_deleted = false
     GROUP BY u.system_parent_id
  ) sub
 WHERE s.id = sub.id
   AND s.clients_ids IS NULL;

-- 2) Sistemas FILHOS (units.system_id) — usados pelo filtro SUB-SISTEMA -------
UPDATE public.cfg_systems s
   SET clients_ids = sub.ids
  FROM (
    SELECT u.system_id AS id,
           array_remove(array_agg(DISTINCT x), NULL) AS ids
      FROM public.units u
      CROSS JOIN LATERAL unnest(
        CASE
          WHEN cardinality(u.clients_ids) > 0 THEN u.clients_ids
          WHEN u.client_id IS NOT NULL THEN ARRAY[u.client_id]::bigint[]
          ELSE NULL::bigint[]
        END
      ) AS x
     WHERE u.system_id IS NOT NULL
       AND u.is_deleted = false
     GROUP BY u.system_id
  ) sub
 WHERE s.id = sub.id
   AND s.clients_ids IS NULL;

-- 3) Recarrega o cache de schema do PostgREST (API REST) ---------------------
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Queries de conferência (pós-aplicação)
-- ---------------------------------------------------------------------------
-- -- Sistemas ainda sem escopo (ficam ocultos no filtro SISTEMA):
-- SELECT id, parent_id, description, clients_ids
-- FROM public.cfg_systems
-- WHERE clients_ids IS NULL
-- ORDER BY parent_id NULLS FIRST, description;
--
-- -- Esperado: 0 linhas para os sistemas que têm unidades ativas.
-- SELECT s.id, s.description, s.clients_ids
-- FROM public.cfg_systems s
-- JOIN public.units u ON u.system_parent_id = s.id AND u.is_deleted = false
-- GROUP BY s.id, s.description
-- HAVING s.clients_ids IS NULL;
