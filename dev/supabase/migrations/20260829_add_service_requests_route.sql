-- =====================================================
-- Migration: Add services_requests route
-- Date: 2026-08-29
-- Description: Rota para permissão de acesso ao
--              Detalhe da Solicitação de Serviço (SS)
-- =====================================================

-- 0. Sincronizar a sequência do id
SELECT setval(pg_get_serial_sequence('cfg_routes', 'id'), (SELECT COALESCE(MAX(id), 0) + 100 FROM cfg_routes));

-- 1. Rota para detalhe de SS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'services_requests') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'services_requests',
        '/services-requests',
        'Solicitações de Serviço (SS)',
        'description',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        10,
        true
    );
    RAISE NOTICE 'Rota services_requests criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota services_requests já existe, ignorando';
  END IF;
END $$;
