-- =============================================================================
-- Migration: Optimize Top Queries (v_orders and users)
-- Date: 2026-09-13
-- Description: Targeted indexes to optimize the top 5 application queries
--              responsible for ~44% of total database execution time.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Query 1 & Query 5: v_orders ORDER BY requested_at DESC
-- -----------------------------------------------------------------------------
-- Query 1 (15.7% total time, 1575 calls, mean ~55ms):
--   WHERE parent_id IS NOT NULL AND status_id != ANY(...) ORDER BY requested_at DESC
-- Query 5 (4.2% total time, 2074 calls, mean ~11ms):
--   WHERE status_id != ANY(...) ORDER BY requested_at DESC LIMIT ... OFFSET ...
-- -----------------------------------------------------------------------------

-- Global index on requested_at DESC for pagination / sorting
CREATE INDEX IF NOT EXISTS idx_orders_requested_at_desc 
    ON public.orders (requested_at DESC);

-- Targeted partial index for sub-orders (parent_id IS NOT NULL) sorted by date
CREATE INDEX IF NOT EXISTS idx_orders_parent_not_null_requested_at 
    ON public.orders (requested_at DESC, status_id) 
    WHERE parent_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Query 3: v_orders filtered by contract_id
-- -----------------------------------------------------------------------------
-- Query 3 (8.2% total time, 1044 calls, mean ~43ms):
--   WHERE contract_id = ANY(...) AND parent_id IS NOT NULL AND status_id != ANY(...)
--   ORDER BY requested_at DESC
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_contract_parent_requested 
    ON public.orders (contract_id, requested_at DESC) 
    WHERE parent_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Query 7: v_orders filtered by asset_tag_id
-- -----------------------------------------------------------------------------
-- Query 7 (3.8% total time, 499 calls, mean ~42ms):
--   WHERE asset_tag_id = ANY(...) AND parent_id IS NOT NULL AND status_id != ANY(...)
--   ORDER BY requested_at DESC
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_asset_tag_parent_requested 
    ON public.orders (asset_tag_id, requested_at DESC) 
    WHERE parent_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Query 2: public.users ORDER BY name_full ASC
-- -----------------------------------------------------------------------------
-- Query 2 (11.9% total time, 3173 calls, mean ~20.6ms):
--   SELECT users.*, lateral joins ... ORDER BY name_full ASC
-- Eliminates sequential scan and in-memory sort on every user listing.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_name_full_asc 
    ON public.users (name_full ASC);
