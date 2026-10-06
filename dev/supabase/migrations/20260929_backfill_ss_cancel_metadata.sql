-- Migration: Backfill dos metadados de cancelamento em SS herdadas de OS
-- Data: 2026-09-29
-- Objetivo: SS canceladas indiretamente (status 7 copiado da OS filha via
--           updateServiceRequestStatus) ficavam com cancel_reason_id,
--           canceled_user_id, canceled_at, canceled_team_id e cancel_comments NULL,
--           então o card/detalhe da SS não tinha nada a exibir.
--           Este script copia os dados do cancelamento da OS filha mais recente
--           para a SS pai.
-- Idempotente: só atualiza SS que ainda não têm cancel_reason_id.

UPDATE public.orders ss
SET cancel_reason_id     = os.cancel_reason_id,
    cancel_comments      = os.cancel_comments,
    canceled_user_id     = os.canceled_user_id,
    canceled_team_id     = os.canceled_team_id,
    canceled_at          = os.canceled_at,
    updated_at           = now()
FROM (
    SELECT DISTINCT ON (parent_id)
           parent_id,
           cancel_reason_id,
           cancel_comments,
           canceled_user_id,
           canceled_team_id,
           canceled_at,
           status_at
    FROM public.orders
    WHERE status_id = 7
      AND parent_id IS NOT NULL
      AND is_deleted = false
    ORDER BY parent_id, status_at DESC
) os
WHERE ss.status_id = 7
  AND ss.parent_id IS NULL
  AND ss.is_deleted = false
  AND ss.cancel_reason_id IS NULL
  AND os.parent_id = ss.id;

-- Verificação esperada (deve voltar 0 linhas depois do backfill):
-- SELECT ss.id, ss.status_at, os.cancel_reason_id, os.canceled_user_id
-- FROM public.orders ss
-- JOIN public.orders os ON os.parent_id = ss.id AND os.status_id = 7 AND os.is_deleted = false
-- WHERE ss.status_id = 7 AND ss.parent_id IS NULL AND ss.is_deleted = false
--   AND ss.cancel_reason_id IS NULL;
