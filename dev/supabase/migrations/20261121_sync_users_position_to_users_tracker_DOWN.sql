-- Reverte 20261121_sync_users_position_to_users_tracker.sql
-- (os dados já copiados para users_tracker permanecem).
BEGIN;
DROP TRIGGER IF EXISTS trg_users_sync_position_to_tracker ON public.users;
DROP FUNCTION IF EXISTS public.fn_users_sync_position_to_tracker();
COMMENT ON COLUMN public.users.latitude IS 'OBSOLETA desde 20261111: posição atual em users_tracker.latitude.';
COMMIT;
