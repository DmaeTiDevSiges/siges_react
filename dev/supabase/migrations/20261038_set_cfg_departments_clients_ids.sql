-- Migration: 20261038_set_cfg_departments_clients_ids.sql
-- Configuração do escopo de cliente por departamento (Fase 1D).
--
-- ⚠️  SCRIPT PREPARADO — revisar e executar MANUALMENTE no SQL Editor do
--     Supabase (ver AGENTS.md / RUNBOOK §7.2). Nada aqui roda sozinho.
--
-- Por que: o filtro SISTEMA das páginas Gestão aplica
--   `cfg_systems.clients_ids && cfg_departments.clients_ids` para TODOS os
--   perfis (inclusive super admin — decisão de 27/10/2026). Hoje TODOS os
--   departamentos estão com `clients_ids = NULL` = sem acesso = dropdown
--   SISTEMA VAZIO para qualquer usuário.
--
-- Pré-requisitos:
--   1) 20261026_cfg_departments_clients_ids.sql (coluna + trigger) — APlicada.
--   2) 20261037_backfill_cfg_systems_clients_ids.sql (sistemas) — verificar na
--      etapa 1; sem ela os sistemas continuam NULL e ficam ocultos no filtro.
--
-- Semântica (confirmada no plano §2): NULL ou '{}' = SEM ACESSO;
-- lista preenchida = restrita à lista.
-- Timezone: America/Sao_Paulo (Brasília)

SET timezone = 'America/Sao_Paulo';
SET lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) Diagnóstico atual
-- ---------------------------------------------------------------------------
-- 1a) Departamentos e o escopo atual (esperado: todos NULL hoje):
-- SELECT id, description, clients_ids
-- FROM public.cfg_departments
-- ORDER BY id;
--
-- 1b) Clientes disponíveis para montar o mapa:
-- SELECT id, code, name, is_available
-- FROM public.clients
-- WHERE is_deleted = false
-- ORDER BY id;
--
-- 1c) Sistemas ainda sem escopo (ficam OCULTOS no filtro SISTEMA):
-- SELECT id, parent_id, code, description, clients_ids
-- FROM public.cfg_systems
-- WHERE clients_ids IS NULL
-- ORDER BY parent_id NULLS FIRST, description;
--   -> se houver linhas, aplicar 20261037 (é idempotente) antes de conferir
--      o resultado no app.

-- ---------------------------------------------------------------------------
-- 2) Preenchimento — TODOS os clientes em TODOS os departamentos
--    (ponto de partida: escopo presente, sem restrição de fato; depois estreitar
--     por departamento com o item 3). Idempotente: só mexe em NULL/'{}'.
-- ---------------------------------------------------------------------------
UPDATE public.cfg_departments d
   SET clients_ids = (
         SELECT array_agg(c.id ORDER BY c.id)
         FROM public.clients c
         WHERE c.is_deleted = false
       )
 WHERE d.clients_ids IS NULL
    OR d.clients_ids = '{}';

-- ---------------------------------------------------------------------------
-- 3) Estreitamento POR DEPARTAMENTO (descomente e ajuste os ids)
--    Exemplos com os clientes reais (1=DMAE Pluvial, 2=DMAE Agua, 3=DMAE Esgoto,
--    4=BBSS, 5=Tecnogera, 6=PBS, 7=Carraro, 8=EPTC):
-- ---------------------------------------------------------------------------
-- UPDATE public.cfg_departments SET clients_ids = ARRAY[1,2,3]::bigint[] WHERE id = 10; -- Operacoes
-- UPDATE public.cfg_departments SET clients_ids = ARRAY[1,2,3]::bigint[] WHERE id = 1;  -- Dir Geral
-- UPDATE public.cfg_departments SET clients_ids = ARRAY[4]::bigint[]      WHERE id = 28; -- Manutencao (empresa 5)

-- ---------------------------------------------------------------------------
-- 4) Recarrega o cache de schema do PostgREST (API REST)
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 5) Conferência pós-aplicação
-- ---------------------------------------------------------------------------
-- 5a) Nenhum departamento sem escopo (a não ser os que você optou por manter):
-- SELECT id, description, clients_ids
-- FROM public.cfg_departments
-- WHERE clients_ids IS NULL OR clients_ids = '{}'
-- ORDER BY id;
--
-- 5b) Impacto no filtro SISTEMA (simula a query do app para um depto com escopo):
-- SELECT s.id, s.code, s.description, s.clients_ids
-- FROM public.cfg_systems s
-- WHERE s.parent_id IS NULL
--   AND s.is_deleted = false
--   AND s.is_available = true
--   AND s.clients_ids && ARRAY[1,2,3]::bigint[]   -- troque pelo escopo do depto
-- ORDER BY s.description;
--
-- Observação: o app guarda `cfg_departments.clients_ids` em cache por sessão
-- (hooks/useClientScope.ts) e `cfg_systems` por escopo com TTL de 30 min
-- (services/core/settingsService.ts) — após rodar este script, recarregue a
-- página (F5) para enxergar as opções novas.
