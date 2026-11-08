-- ==============================================================================
-- Reverte 20261118_create_flow_order_visit_close_v4.sql
-- A v3 (20261115) não é tocada e continua funcionando.
-- ==============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.flow_order_visit_close_v4(bigint, bigint, integer, text, bigint, bigint, numeric, text, text, uuid);

DROP INDEX IF EXISTS public.ux_orders_visits_close_client_op_id;

ALTER TABLE public.orders_visits
    DROP COLUMN IF EXISTS ov_close_received_at,
    DROP COLUMN IF EXISTS ov_close_client_op_id;

COMMIT;

NOTIFY pgrst, 'reload schema';
