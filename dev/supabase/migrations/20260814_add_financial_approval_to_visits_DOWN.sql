-- Rollback: Remover campos de aprovação financeira de visitas
-- Data: 2026-08-14
-- Descrição: Desfaz as alterações da migration 20260814_add_financial_approval_to_visits.sql

-- ============================================================
-- 1. REMOVER TRIGGER E FUNÇÃO
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_visit_costs_status ON orders_visits;
DROP FUNCTION IF EXISTS fn_audit_visit_costs_status();

-- ============================================================
-- 2. REMOVER ÍNDICES
-- ============================================================

DROP INDEX IF EXISTS idx_orders_visits_costs_status;
DROP INDEX IF EXISTS idx_orders_visits_costs_submitted;

-- ============================================================
-- 3. REMOVER COLUNAS
-- ============================================================

ALTER TABLE orders_visits 
  DROP COLUMN IF EXISTS ov_costs_status,
  DROP COLUMN IF EXISTS ov_costs_submitted_at,
  DROP COLUMN IF EXISTS ov_costs_submitted_user_id,
  DROP COLUMN IF EXISTS ov_costs_approved_at,
  DROP COLUMN IF EXISTS ov_costs_approved_user_id,
  DROP COLUMN IF EXISTS ov_costs_rejected_at,
  DROP COLUMN IF EXISTS ov_costs_rejected_user_id,
  DROP COLUMN IF EXISTS ov_costs_rejection_reason;
