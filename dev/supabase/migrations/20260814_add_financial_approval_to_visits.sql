-- Migration: Adicionar campos de aprovação financeira de visitas
-- Data: 2026-08-14
-- Descrição: Adiciona controle separado para aprovação financeira de visitas

-- ============================================================
-- 1. ADICIONAR CAMPOS DE APROVAÇÃO FINANCEIRA
-- ============================================================

-- Status da aprovação financeira (SEPARADO do processing)
ALTER TABLE orders_visits 
  ADD COLUMN IF NOT EXISTS ov_costs_status TEXT DEFAULT NULL 
    CHECK (ov_costs_status IS NULL OR ov_costs_status IN ('pending', 'submitted', 'approved', 'rejected'));

-- Timestamps e usuários de aprovação financeira
ALTER TABLE orders_visits 
  ADD COLUMN IF NOT EXISTS ov_costs_submitted_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS ov_costs_submitted_user_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS ov_costs_approved_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS ov_costs_approved_user_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS ov_costs_rejected_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS ov_costs_rejected_user_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS ov_costs_rejection_reason TEXT;

-- ============================================================
-- 2. COMENTÁRIOS EXPLICATIVOS
-- ============================================================

COMMENT ON COLUMN orders_visits.ov_costs_status IS 
  'Status da aprovação financeira: pending (aguardando custos), submitted (custos enviados), approved (aprovado), rejected (rejeitado)';

COMMENT ON COLUMN orders_visits.ov_costs_submitted_at IS 
  'Data/hora em que os custos foram enviados para aprovação';

COMMENT ON COLUMN orders_visits.ov_costs_submitted_user_id IS 
  'Usuário que enviou os custos para aprovação';

COMMENT ON COLUMN orders_visits.ov_costs_approved_at IS 
  'Data/hora da aprovação financeira';

COMMENT ON COLUMN orders_visits.ov_costs_approved_user_id IS 
  'Usuário que aprovou financeiramente';

COMMENT ON COLUMN orders_visits.ov_costs_rejected_at IS 
  'Data/hora da rejeição dos custos';

COMMENT ON COLUMN orders_visits.ov_costs_rejected_user_id IS 
  'Usuário que rejeitou os custos';

COMMENT ON COLUMN orders_visits.ov_costs_rejection_reason IS 
  'Motivo da rejeição dos custos financeiros';

-- ============================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índice para filtrar por status financeiro
CREATE INDEX IF NOT EXISTS idx_orders_visits_costs_status 
  ON orders_visits(ov_costs_status) 
  WHERE ov_costs_status IS NOT NULL;

-- Índice para buscar visitas aguardando aprovação financeira
CREATE INDEX IF NOT EXISTS idx_orders_visits_costs_submitted 
  ON orders_visits(ov_costs_status, ov_processing_id) 
  WHERE ov_costs_status = 'submitted';

-- ============================================================
-- 4. TRIGGER DE AUDITORIA (OPCIONAL)
-- ============================================================

-- Função para registrar mudanças no status financeiro
CREATE OR REPLACE FUNCTION fn_audit_visit_costs_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Log da mudança (pode ser expandido para tabela de auditoria)
  IF OLD.ov_costs_status IS DISTINCT FROM NEW.ov_costs_status THEN
    RAISE NOTICE 'Visit % costs status changed from % to %', 
      NEW.id, OLD.ov_costs_status, NEW.ov_costs_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditar mudanças no status financeiro
DROP TRIGGER IF EXISTS trg_audit_visit_costs_status ON orders_visits;
CREATE TRIGGER trg_audit_visit_costs_status
  AFTER UPDATE OF ov_costs_status ON orders_visits
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_visit_costs_status();

-- ============================================================
-- 5. VISÃO CONSOLIDADA (OPCIONAL)
-- ============================================================

-- Atualizar view de visitas para incluir dados financeiros
-- (verificar se já existe e adicionar campos se necessário)
