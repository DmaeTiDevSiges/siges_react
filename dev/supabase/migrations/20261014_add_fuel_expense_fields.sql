-- ============================================================
-- Migration: 20261014_add_fuel_expense_fields.sql
-- Tela de Despesa de Combustível (despesa variável) —
-- extensão da tabela vehicle_monthly_expenses + rota/permissão.
--
--   1) Colunas de combustível em vehicle_monthly_expenses:
--      odômetro, quantidade de combustível e as 3 imagens
--      obrigatórias (placa, odômetro, nota fiscal) em pares
--      img_path/img_name (convenção do repositório).
--   2) Rota/permissão da tela própria:
--      route_key : transport_fuel_expenses
--      tela      : views/Transport/FuelExpenseScreen.tsx
--                  (screen 'fuel-expense')
--      acesso    : perfis que já veem a rota irmã
--                  transport_rental_apportionment.
--
-- Aplicação MANUAL no SQL Editor do Supabase (regra do AGENTS.md),
-- DEPOIS de 20261009_add_vehicle_monthly_expenses.sql e
-- 20261013_add_vehicles_route.sql.
-- Idempotente: pode ser re-executada com segurança.
-- Nenhum DROP ... CASCADE nesta migration (regra do AGENTS.md).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Colunas de combustível (aditivo — não afeta lançamentos
--    genéricos já existentes; campos aceitam NULL).
-- ------------------------------------------------------------
ALTER TABLE public.vehicle_monthly_expenses
    ADD COLUMN IF NOT EXISTS odometer bigint,
    ADD COLUMN IF NOT EXISTS fuel_quantity numeric(12,3),
    ADD COLUMN IF NOT EXISTS plate_img_path text,
    ADD COLUMN IF NOT EXISTS plate_img_name text,
    ADD COLUMN IF NOT EXISTS odometer_img_path text,
    ADD COLUMN IF NOT EXISTS odometer_img_name text,
    ADD COLUMN IF NOT EXISTS invoice_img_path text,
    ADD COLUMN IF NOT EXISTS invoice_img_name text;

-- Valores coerentes quando preenchidos (lançamentos antigos ficam NULL = ok)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vehicle_monthly_expenses_odometer_ck'
  ) THEN
    ALTER TABLE public.vehicle_monthly_expenses
      ADD CONSTRAINT vehicle_monthly_expenses_odometer_ck
      CHECK (odometer IS NULL OR odometer > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vehicle_monthly_expenses_fuel_qty_ck'
  ) THEN
    ALTER TABLE public.vehicle_monthly_expenses
      ADD CONSTRAINT vehicle_monthly_expenses_fuel_qty_ck
      CHECK (fuel_quantity IS NULL OR fuel_quantity > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.vehicle_monthly_expenses.odometer IS
    'Leitura do odômetro no abastecimento (Km). Obrigatório no lançamento de combustível.';
COMMENT ON COLUMN public.vehicle_monthly_expenses.fuel_quantity IS
    'Quantidade de combustível (Litros). Obrigatória no lançamento de combustível.';
COMMENT ON COLUMN public.vehicle_monthly_expenses.plate_img_path IS
    'Caminho R2 da foto da placa (obrigatória no lançamento de combustível).';
COMMENT ON COLUMN public.vehicle_monthly_expenses.odometer_img_path IS
    'Caminho R2 da foto do odômetro (obrigatória no lançamento de combustível).';
COMMENT ON COLUMN public.vehicle_monthly_expenses.invoice_img_path IS
    'Caminho R2 da foto da nota fiscal (obrigatória no lançamento de combustível).';

-- ------------------------------------------------------------
-- 2. Rota + permissão da tela de Combustível (mesmo padrão
--    da migration 20261013_add_vehicles_route.sql).
-- ------------------------------------------------------------

-- Resincroniza a sequence de cfg_routes para evitar conflito de PK.
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'transport_fuel_expenses') THEN
    INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
    VALUES (
        'transport_fuel_expenses',
        '/transport/fuel-expense',
        'Despesa de Combustível',
        'local_gas_station',
        (SELECT id FROM cfg_routes WHERE route_key = 'orders'),
        23,
        true
    );
    RAISE NOTICE 'Rota transport_fuel_expenses criada com sucesso';
  ELSE
    RAISE NOTICE 'Rota transport_fuel_expenses já existe, ignorando';
  END IF;
END $$;

-- Concede view aos perfis que já veem a rota irmã
-- (transport_rental_apportionment) — idempotente.
INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
SELECT pa.profile_id, nova.id, true, false, false, false, false
FROM cfg_profiles_access pa
JOIN cfg_routes r ON r.id = pa.route_id
JOIN cfg_routes nova ON nova.route_key = 'transport_fuel_expenses'
WHERE r.route_key = 'transport_rental_apportionment'
  AND pa.can_view = true
ON CONFLICT (profile_id, route_id) DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION 20261014_add_fuel_expense_fields.sql
-- ============================================================
