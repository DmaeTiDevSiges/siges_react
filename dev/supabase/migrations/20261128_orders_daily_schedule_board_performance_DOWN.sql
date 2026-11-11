-- Reverte 20261128_orders_daily_schedule_board_performance.sql.
-- O app volta sozinho para as consultas diretas (na próxima carga da tela).
BEGIN;

DROP FUNCTION IF EXISTS public.fn_orders_daily_schedule_board(BIGINT, DATE, BOOLEAN);
DROP VIEW IF EXISTS public.v_orders_daily_schedule;
DROP INDEX IF EXISTS public.idx_orders_contract_open_requested;

COMMIT;

NOTIFY pgrst, 'reload schema';
