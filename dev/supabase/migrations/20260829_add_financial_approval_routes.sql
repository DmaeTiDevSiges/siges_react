-- =====================================================
-- Migration: Add financial approval routes for visits
-- Date: 2026-08-29
-- Description: Adiciona rotas para permissões de
--              aprovação financeira de visitas
-- =====================================================

-- 0. Forçar sequência do id para valor alto (tabela tem ids até ~45)
SELECT setval(pg_get_serial_sequence('cfg_routes', 'id'), 100);

-- 1. Rota para envio de custos (contratada)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'orders_visits_costs_submit') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'orders_visits_costs_submit',
        '/orders/visits/costs',
        'Enviar Custos para Aprovação',
        'receipt_long',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders_visits'),
        50,
        true
    );
    RAISE NOTICE 'Rota orders_visits_costs_submit criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota orders_visits_costs_submit já existe, ignorando';
  END IF;
END $$;

-- 2. Rota para aprovação financeira (contratante)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'orders_visits_financial_approve') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'orders_visits_financial_approve',
        '/orders/visits/financial',
        'Aprovar/Rejeitar Custos Financeiros',
        'account_balance',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders_visits'),
        51,
        true
    );
    RAISE NOTICE 'Rota orders_visits_financial_approve criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota orders_visits_financial_approve já existe, ignorando';
  END IF;
END $$;
