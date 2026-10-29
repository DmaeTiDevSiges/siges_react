-- Migration: 20261036_add_clients_ids_to_cfg_systems.sql
-- Escopo de clientes do sistema — coluna aditiva
--
-- Conteúdo:
--   1) Coluna cfg_systems.clients_ids (bigint[]) — aditiva, NULL por padrão
--   2) NOTIFY pgrst (reload do schema da API REST)
--
-- Semântica: NULL = sistema ainda sem escopo definido; '{}' = lista vazia
--            (sem clientes vinculados). Mesmo critério de
--            cfg_departments.clients_ids (20261026_cfg_departments_clients_ids.sql).
-- Tipo: bigint[] (clients.id é bigint — mesmo critério de units.clients_ids),
--       permitindo `c.id = ANY(s.clients_ids)` sem cast.
--
-- Impacto na web antiga: nenhum. Coluna nova, nenhuma view/função/policy
-- referencia cfg_systems.clients_ids. v_systems / v_systems_parent listam
-- colunas fixas e não precisam ser recriadas; o app lê cfg_systems com
-- select('*') (services/core/settingsService.ts), então a coluna já aparece
-- após o reload do schema.
--
-- Idempotente (seguro para reexecutar). Aplicar manualmente no SQL Editor
-- do Supabase (ver AGENTS.md). Timezone: America/Sao_Paulo (Brasília)

SET timezone = 'America/Sao_Paulo';

-- 0) Evita espera indefinida por lock
SET lock_timeout = '5s';

-- 1) Coluna aditiva (metadata-only no PG 11+; NULL = não configurado)
ALTER TABLE public.cfg_systems
  ADD COLUMN IF NOT EXISTS clients_ids bigint[];

COMMENT ON COLUMN public.cfg_systems.clients_ids IS
  'Clientes (clients.id) vinculados ao sistema. NULL = sem escopo definido; {} = lista vazia (sem clientes).';

-- 2) Recarrega o cache de schema do PostgREST (API REST) ---------------------
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Queries de conferência (pós-aplicação)
-- ---------------------------------------------------------------------------
-- SELECT id, code, description, clients_ids
-- FROM public.cfg_systems
-- ORDER BY description;
--
-- -- Sistemas ainda sem escopo definido:
-- SELECT id, description FROM public.cfg_systems
-- WHERE clients_ids IS NULL;
