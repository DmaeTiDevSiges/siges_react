-- Reverte 20261113_restrict_users_writes.sql (volta a política aberta "Universal Access").
BEGIN;

DROP TRIGGER IF EXISTS trg_guard_users_admin_flags ON public.users;
DROP FUNCTION IF EXISTS public.fn_guard_users_admin_flags();

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;
DROP POLICY IF EXISTS "Universal Access" ON public.users;
CREATE POLICY "Universal Access" ON public.users USING (true) WITH CHECK (true);

DROP FUNCTION IF EXISTS public.fn_users_can_write(UUID, TEXT, BIGINT, BIGINT);
DROP FUNCTION IF EXISTS public.fn_users_caller();

COMMIT;
