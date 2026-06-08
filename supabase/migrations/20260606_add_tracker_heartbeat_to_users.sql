-- =============================================================================
-- Migration: add tracker heartbeat + accuracy columns to users
-- Date:      2026-06-06
-- Purpose:   Add fields required by the background-location liveness signal:
--              * tracker_heartbeat_at — refreshed on every accepted position
--                update, even if the user is stationary. Lets the server
--                distinguish "tracker alive, user idle" from "tracker dead".
--              * tracker_accuracy      — GPS accuracy in meters of the last
--                accepted position (radius of 68% confidence).
--
-- This migration is idempotent — safe to re-run.
-- =============================================================================

BEGIN;

-- 1. New columns on public.users --------------------------------------------
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS tracker_heartbeat_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS tracker_accuracy      double precision;

COMMENT ON COLUMN public.users.tracker_heartbeat_at IS
    'Liveness signal: updated on every accepted GPS fix (even when the user is stationary and tracker_at is not refreshed). Use to detect dead trackers (NOW() - tracker_heartbeat_at > N min => tracker offline).';

COMMENT ON COLUMN public.users.tracker_accuracy IS
    'GPS horizontal accuracy in meters of the last accepted position (68% confidence radius).';

-- 2. Index on tracker_heartbeat_at -----------------------------------------
-- Supports the operational query "which users have a stale tracker?",
-- which is the basis of the "tracker offline" alert and dashboard badge.
CREATE INDEX IF NOT EXISTS idx_users_tracker_heartbeat_at
    ON public.users (tracker_heartbeat_at)
    WHERE tracker_heartbeat_at IS NOT NULL;

-- 3. (Optional) Backfill tracker_heartbeat_at from tracker_at for existing rows
--    so dashboards have something to show until the next position update.
UPDATE public.users
   SET tracker_heartbeat_at = tracker_at
 WHERE tracker_heartbeat_at IS NULL
   AND tracker_at IS NOT NULL;

COMMIT;

-- =============================================================================
-- Rollback (manual):
--
--   DROP INDEX IF EXISTS public.idx_users_tracker_heartbeat_at;
--   ALTER TABLE public.users
--       DROP COLUMN IF EXISTS tracker_accuracy,
--       DROP COLUMN IF EXISTS tracker_heartbeat_at;
-- =============================================================================
