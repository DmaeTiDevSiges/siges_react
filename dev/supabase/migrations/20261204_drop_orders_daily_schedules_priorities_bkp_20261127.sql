-- ==============================================================================
-- Migration: 20261204_drop_orders_daily_schedules_priorities_bkp_20261127.sql
-- Apaga a cópia de segurança das prioridades da Programação feita em
-- 20261127_clear_orders_daily_schedules_priorities.sql.
--
-- Por quê: a limpeza das prioridades foi confirmada e a cópia não é mais
-- necessária. Também remove o aviso do linter 0008 rls_enabled_no_policy.
--
-- Nenhuma view/função usa esta tabela. DROP sem CASCADE: se algo depender dela,
-- o banco recusa em vez de apagar junto. Idempotente (IF EXISTS).
--
-- ATENÇÃO: não tem volta. Depois disto não dá mais para desfazer a 20261127
-- (o bloco "Para VOLTAR" daquele arquivo deixa de funcionar).
-- Se quiser guardar os dados antes, exporte o resultado de:
--   SELECT * FROM public.orders_daily_schedules_priorities_bkp_20261127;
-- (no SQL Editor: rodar e baixar como CSV).
-- ==============================================================================

-- Conferência antes (opcional): quantas linhas a cópia tem.
--   SELECT count(*) FROM public.orders_daily_schedules_priorities_bkp_20261127;

DROP TABLE IF EXISTS public.orders_daily_schedules_priorities_bkp_20261127;

-- Conferência depois (deve voltar NULL):
--   SELECT to_regclass('public.orders_daily_schedules_priorities_bkp_20261127');
