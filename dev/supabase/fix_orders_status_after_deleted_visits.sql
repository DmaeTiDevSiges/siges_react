-- Correção de dados: OS que ficaram com a situação dada por visitas JÁ EXCLUÍDAS.
-- Regra (a mesma do app, services/orders/visitsService.ts → syncOrderAfterVisitDeleted):
--   * sem visita ativa → volta a Autorizada (3), status_at = último log de situação 3
--     em orders_statuses_logs, progress 0, cause_reason_id nulo; equipe/líder intactos;
--   * com visita ativa encerrada → situação, data de encerramento e progresso da mais recente;
--   * com visita ativa em andamento → não mexe;
--   * só OS em 4, 5, 6 ou 8 que tenham ao menos uma visita excluída.
-- Rodar no SQL Editor, UM PASSO POR VEZ. Passo 1 só lê; passo 2 altera (confira o passo 1 antes).
-- O trigger trg_orders_statuses_logs registra a mudança de situação no log automaticamente.
-- Colunas conforme o código do app (o schema.sql está defasado): confirme ov_o_status_id e
-- ov_o_progress em orders_visits antes de rodar.

-- ============================================================
-- PASSO 1 — PRÉVIA (somente leitura)
-- ============================================================
WITH latest AS (
    SELECT DISTINCT ON (v.o_id) v.o_id, v.ov_o_status_id, v.ov_o_progress, v.ov_ended_at
    FROM public.orders_visits v
    WHERE v.is_deleted = false AND v.ov_ended_at IS NOT NULL AND v.ov_status_id <> 1
    ORDER BY v.o_id, v.ov_ended_at DESC, v.id DESC
),
plan AS (
    SELECT o.id AS order_id, o.order_mask, o.parent_id,
           o.status_id AS status_atual, o.status_at AS status_at_atual,
           COALESCE(l.ov_o_status_id, 3) AS status_novo,
           CASE WHEN l.o_id IS NULL
                THEN COALESCE(
                       (SELECT g.order_status_at FROM public.orders_statuses_logs g
                         WHERE g.order_id = o.id AND g.order_status_id = 3
                         ORDER BY g.order_status_at DESC LIMIT 1),
                       timezone('America/Sao_Paulo', now()))
                ELSE l.ov_ended_at END AS status_at_novo,
           CASE WHEN l.o_id IS NULL THEN 0
                WHEN l.ov_o_status_id = 8 THEN 1
                ELSE COALESCE(l.ov_o_progress, 0) END AS progress_novo,
           (l.o_id IS NULL) AS limpa_causa
    FROM public.orders o
    LEFT JOIN latest l ON l.o_id = o.id
    WHERE o.is_deleted = false
      AND o.status_id IN (4, 5, 6, 8)
      AND EXISTS (SELECT 1 FROM public.orders_visits d WHERE d.o_id = o.id AND d.is_deleted = true)
      AND NOT EXISTS (SELECT 1 FROM public.orders_visits a
                       WHERE a.o_id = o.id AND a.is_deleted = false
                         AND (a.ov_status_id = 1 OR a.ov_ended_at IS NULL))
)
SELECT * FROM plan
WHERE status_novo IS DISTINCT FROM status_atual
ORDER BY order_id;

-- ============================================================
-- PASSO 2 — CORREÇÃO (transação; confira o RETURNING antes de confirmar)
-- ============================================================
BEGIN;

WITH latest AS (
    SELECT DISTINCT ON (v.o_id) v.o_id, v.ov_o_status_id, v.ov_o_progress, v.ov_ended_at
    FROM public.orders_visits v
    WHERE v.is_deleted = false AND v.ov_ended_at IS NOT NULL AND v.ov_status_id <> 1
    ORDER BY v.o_id, v.ov_ended_at DESC, v.id DESC
),
plan AS (
    SELECT o.id AS order_id,
           COALESCE(l.ov_o_status_id, 3) AS status_novo,
           CASE WHEN l.o_id IS NULL
                THEN COALESCE(
                       (SELECT g.order_status_at FROM public.orders_statuses_logs g
                         WHERE g.order_id = o.id AND g.order_status_id = 3
                         ORDER BY g.order_status_at DESC LIMIT 1),
                       timezone('America/Sao_Paulo', now()))
                ELSE l.ov_ended_at END AS status_at_novo,
           CASE WHEN l.o_id IS NULL THEN 0
                WHEN l.ov_o_status_id = 8 THEN 1
                ELSE COALESCE(l.ov_o_progress, 0) END AS progress_novo,
           (l.o_id IS NULL) AS limpa_causa
    FROM public.orders o
    LEFT JOIN latest l ON l.o_id = o.id
    WHERE o.is_deleted = false
      AND o.status_id IN (4, 5, 6, 8)
      AND EXISTS (SELECT 1 FROM public.orders_visits d WHERE d.o_id = o.id AND d.is_deleted = true)
      AND NOT EXISTS (SELECT 1 FROM public.orders_visits a
                       WHERE a.o_id = o.id AND a.is_deleted = false
                         AND (a.ov_status_id = 1 OR a.ov_ended_at IS NULL))
)
UPDATE public.orders o
SET status_id = p.status_novo,
    status_at = p.status_at_novo,
    progress = p.progress_novo,
    cause_reason_id = CASE WHEN p.limpa_causa THEN NULL ELSE o.cause_reason_id END
FROM plan p
WHERE o.id = p.order_id
  AND p.status_novo IS DISTINCT FROM o.status_id
RETURNING o.id, o.order_mask, o.parent_id, o.status_id, o.status_at, o.progress;

-- Conferiu? COMMIT;   Não gostou? ROLLBACK;
-- (deixe só um dos dois ativo)
-- COMMIT;
-- ROLLBACK;

-- ============================================================
-- PASSO 3 — SS pai (opcional)
-- ============================================================
-- A situação da SS pai é calculada pelo app (updateServiceRequestStatus: maior prioridade
-- entre as OS filhas). Para as OS corrigidas que têm parent_id (coluna parent_id do RETURNING),
-- abra a SS e use qualquer ação que recalcule, ou avise para eu gerar o SQL equivalente.
