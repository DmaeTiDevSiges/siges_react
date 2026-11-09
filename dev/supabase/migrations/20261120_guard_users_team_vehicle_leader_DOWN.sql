-- Reverte 20261120_guard_users_team_vehicle_leader.sql
BEGIN;
DROP TRIGGER IF EXISTS trg_guard_users_team_vehicle_leader ON public.users;
DROP FUNCTION IF EXISTS public.fn_guard_users_team_vehicle_leader();
COMMIT;
