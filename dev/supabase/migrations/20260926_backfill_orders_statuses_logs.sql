-- Migration: Backfill de orders_statuses_logs — situação atual de TODAS as orders
-- Date: 2026-09-26
-- Pré-requisito: 20260925_create_orders_statuses_logs_trigger.sql aplicada
--                (triggers trg_orders_statuses_logs / trg_orders_statuses_logs_insert)
--
-- Objetivo:
--   Regenerar o log do zero: limpa orders_statuses_logs, reinicia o contador `id`
--   e grava UMA linha por order refletindo sua situação ATUAL (SS e OS).
--
-- Regras:
--   * TRUNCATE ... RESTART IDENTITY zera a tabela e o sequence de `id`
--     (as linhas antigas eram fragmentárias — só de 2026-09-25 em diante).
--   * Não dispara triggers de orders (o INSERT é na tabela log, não em orders)
--     nem a trigger de herança trg_order_status_inheritance.
--   * Semântica NEW: grava o estado resultante, igual à trigger.
--
-- ⚠️ Destrutivo: apaga TODO o histórico existente. Faça o backup (bloco ao final)
--    antes de executar.
--
-- Observação (guard 8 da RPC flow_order_visit_reassign_v1):
--   Order em situação 5 (EXECUCAO) passa a ter apenas a linha de status 5 —
--   sem linha anterior, a transferência de visita continua bloqueada
--   ("Sem histórico de situação anterior à visita").

BEGIN;

-- 1. Limpa o log e reinicia o contador id
TRUNCATE TABLE public.orders_statuses_logs RESTART IDENTITY;

-- 2. Grava a situação atual de todas as orders
INSERT INTO public.orders_statuses_logs (
    order_id,
    order_status_id,
    order_status_at,
    created_user_id,
    created_date,
    order_parent_id,
    company_id,
    department_id
)
SELECT
    o.id,
    o.status_id,
    COALESCE(o.status_at, o.created_at, o.updated_at, TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)),
    COALESCE(o.updated_user_id, o.created_user_id),
    COALESCE(o.status_at, o.created_at, o.updated_at, TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)),
    NULLIF(o.parent_id, 0),
    o.company_id,
    o.department_id
FROM public.orders o
WHERE o.status_id IS NOT NULL;

COMMIT;

-- ============================================================
-- Verificação
-- ============================================================
-- 1. Linhas do log (deve ser igual a orders com status_id NOT NULL):
-- SELECT (SELECT count(*) FROM public.orders_statuses_logs) AS logs,
--        (SELECT count(*) FROM public.orders WHERE status_id IS NOT NULL) AS orders;

-- 2. Orders sem histórico (deve ficar 0, salvo status_id NULL):
-- SELECT count(*) FROM public.orders o
-- WHERE o.status_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM public.orders_statuses_logs l WHERE l.order_id = o.id);

-- 3. Sequence reiniciado (deve ser igual ao total de linhas):
-- SELECT last_value FROM public.orders_statuses_logs_id_seq;

-- 4. Amostra:
-- SELECT l.id, l.order_id, o.status_id, l.order_status_id, l.order_status_at, l.created_date
-- FROM public.orders_statuses_logs l
-- JOIN public.orders o ON o.id = l.order_id
-- ORDER BY l.id
-- LIMIT 20;

-- ============================================================
-- Backup / Rollback (rode ANTES do TRUNCATE)
-- ============================================================
-- CREATE TABLE public.orders_statuses_logs_bkp_20260926 AS
--     SELECT * FROM public.orders_statuses_logs;
--
-- Depois, para desfazer:
-- BEGIN;
-- TRUNCATE TABLE public.orders_statuses_logs RESTART IDENTITY;
-- INSERT INTO public.orders_statuses_logs
--     SELECT * FROM public.orders_statuses_logs_bkp_20260926;
-- COMMIT;
-- DROP TABLE public.orders_statuses_logs_bkp_20260926;
