-- ==============================================================================
-- Reverte 20261117_add_orders_visits_assets_lock.sql
-- ==============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.ov_asset_unlock(bigint, boolean);
DROP FUNCTION IF EXISTS public.ov_asset_lock(bigint);

DROP INDEX IF EXISTS public.ix_orders_visits_assets_locked_user;

ALTER TABLE public.orders_visits_assets
    DROP COLUMN IF EXISTS lock_token,
    DROP COLUMN IF EXISTS locked_at,
    DROP COLUMN IF EXISTS locked_user_id;

COMMIT;

NOTIFY pgrst, 'reload schema';
