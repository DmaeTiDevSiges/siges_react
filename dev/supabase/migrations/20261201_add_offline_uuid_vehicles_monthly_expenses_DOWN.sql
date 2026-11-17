-- Reverte 20261201_add_offline_uuid_vehicles_monthly_expenses.sql
BEGIN;

DROP INDEX IF EXISTS public.ux_vehicles_monthly_expenses_offline_uuid;
ALTER TABLE public.vehicles_monthly_expenses DROP COLUMN IF EXISTS offline_uuid;

COMMIT;

NOTIFY pgrst, 'reload schema';
