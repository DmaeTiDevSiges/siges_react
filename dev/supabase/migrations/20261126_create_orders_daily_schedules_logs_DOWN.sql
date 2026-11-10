-- Reverte 20261126_create_orders_daily_schedules_logs.sql (apaga o log das movimentações).
BEGIN;

DROP FUNCTION IF EXISTS public.fn_orders_daily_schedule_log(BIGINT, DATE, BIGINT, VARCHAR, BIGINT, BIGINT, INTEGER);
DROP TABLE IF EXISTS public.orders_daily_schedules_logs;

COMMIT;

NOTIFY pgrst, 'reload schema';
