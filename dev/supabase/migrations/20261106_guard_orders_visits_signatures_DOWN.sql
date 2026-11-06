-- DOWN: 20261106_guard_orders_visits_signatures
BEGIN;
DROP TRIGGER IF EXISTS trg_guard_orders_visits_signatures ON public.orders_visits;
DROP FUNCTION IF EXISTS public.fn_guard_orders_visits_signatures();
COMMIT;
