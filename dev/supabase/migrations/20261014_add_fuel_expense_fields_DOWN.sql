-- ============================================================
-- DOWN: 20261014_add_fuel_expense_fields_DOWN.sql
-- Reversão da migration 20261014_add_fuel_expense_fields.sql.
--
-- ⚠ ATENÇÃO: as colunas de combustível são removidas junto com
--   qualquer dado já lançado (imagens/odômetro/litros). Execute
--   apenas se tiver certeza de que não há dados a preservar.
--   Sem DROP ... CASCADE (regra do AGENTS.md).
-- ============================================================

-- Remove rota e acessos da tela de Combustível
DELETE FROM cfg_profiles_access
WHERE route_id IN (SELECT id FROM cfg_routes WHERE route_key = 'transport_fuel_expenses');

DELETE FROM cfg_routes WHERE route_key = 'transport_fuel_expenses';

-- Remove constraints e colunas de combustível
ALTER TABLE public.vehicle_monthly_expenses
    DROP CONSTRAINT IF EXISTS vehicle_monthly_expenses_odometer_ck,
    DROP CONSTRAINT IF EXISTS vehicle_monthly_expenses_fuel_qty_ck;

ALTER TABLE public.vehicle_monthly_expenses
    DROP COLUMN IF EXISTS odometer,
    DROP COLUMN IF EXISTS fuel_quantity,
    DROP COLUMN IF EXISTS plate_img_path,
    DROP COLUMN IF EXISTS plate_img_name,
    DROP COLUMN IF EXISTS odometer_img_path,
    DROP COLUMN IF EXISTS odometer_img_name,
    DROP COLUMN IF EXISTS invoice_img_path,
    DROP COLUMN IF EXISTS invoice_img_name;

-- ============================================================
-- FIM DO DOWN 20261014_add_fuel_expense_fields_DOWN.sql
-- ============================================================
