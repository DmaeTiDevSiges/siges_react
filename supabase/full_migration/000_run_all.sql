-- =============================================================================
-- SIGES - MIGRAÇÃO (ESTRUTURA) - EXECUÇÃO EM OUTRO SERVIDOR
-- =============================================================================
-- Este arquivo é um "driver" para executar, em ordem, os scripts SQL do diretório
-- `supabase/` e assim recriar a estrutura do banco em outro servidor.
--
-- COMO EXECUTAR (recomendado: via psql)
--
--   1) A partir da raiz do repositório, rode:
--      psql "postgresql://usuario:senha@host:5432/postgres" -f supabase/full_migration/000_run_all.sql
--
-- OBSERVAÇÃO IMPORTANTE
-- - As diretivas `\ir` abaixo são comandos do `psql` (não funcionam no SQL Editor do Supabase).
-- - Se você for usar o SQL Editor do Supabase, execute manualmente os arquivos na ordem listada.
-- =============================================================================

\set ON_ERROR_STOP on

-- 1) Base do schema (lookup/config + users/clients/contracts/units/assets + permissive RLS)
\ir ../schema.sql

-- 2) Tabelas auxiliares de Ordens (cancel reasons, causes, counter)
\ir ../patch_create_orders_aux_tables.sql

-- 3) Tabela principal de Ordens
\ir ../patch_create_orders_table.sql

-- 4) Catálogo de serviços
\ir ../patch_create_cfg_services.sql

-- 5) Refactor de atributos (cria junction M2M e ajusta colunas)
\ir ../refactor_attributes_m2m.sql

-- 6) Trigger para montar searchable/description_full de units
\ir ../triggers/trg_units.sql

-- =============================================================================
-- OPCIONAIS (descomente se fizer sentido no seu ambiente)
-- =============================================================================

-- Políticas RLS específicas para assets (em vez de "Permissive"/universal)
-- \ir ../patch_assets_policies.sql

-- Reset geral de policies + storage/realtime (somente Supabase; modo "dev" permissivo)
-- \ir ../policies/policies.sql

-- Trigger de notificação para seguidores de OS (requer tabelas não versionadas no repo,
-- como cfg_orders_statuses e orders_followers)
-- \ir ../triggers/trg_followers_orders_status_changed.sql

