-- ==============================================================================
-- Reverte 20261116_add_offline_client_uuid.sql
-- ATENÇÃO: só rode se nenhum APK com modo offline estiver em uso — a fila do
-- aparelho depende de client_uuid para não duplicar linhas.
-- ==============================================================================

BEGIN;

DROP INDEX IF EXISTS public.ux_orders_visits_assets_client_uuid;
DROP INDEX IF EXISTS public.ux_orders_visits_assets_activities_client_uuid;
DROP INDEX IF EXISTS public.ux_orders_visits_assets_materials_client_uuid;
DROP INDEX IF EXISTS public.ux_orders_visits_services_client_uuid;
DROP INDEX IF EXISTS public.ux_orders_visits_vehicles_client_uuid;

ALTER TABLE public.orders_visits_assets            DROP COLUMN IF EXISTS client_uuid;
ALTER TABLE public.orders_visits_assets_activities DROP COLUMN IF EXISTS client_uuid;
ALTER TABLE public.orders_visits_assets_materials  DROP COLUMN IF EXISTS client_uuid;
ALTER TABLE public.orders_visits_services          DROP COLUMN IF EXISTS client_uuid;
ALTER TABLE public.orders_visits_vehicles          DROP COLUMN IF EXISTS client_uuid;

COMMIT;

NOTIFY pgrst, 'reload schema';
