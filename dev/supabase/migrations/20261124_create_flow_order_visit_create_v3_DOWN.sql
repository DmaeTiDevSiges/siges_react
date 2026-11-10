-- ==============================================================================
-- Reverte 20261124_create_flow_order_visit_create_v3.sql
-- A v2 (20261033) não é tocada e continua funcionando.
-- ATENÇÃO: só rode sem APK com fila offline pendente de "Iniciar visita".
-- ==============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.flow_order_visit_create_v3(jsonb);
DROP INDEX IF EXISTS public.ux_orders_visits_client_uuid;
ALTER TABLE public.orders_visits DROP COLUMN IF EXISTS client_uuid;

COMMIT;

NOTIFY pgrst, 'reload schema';
