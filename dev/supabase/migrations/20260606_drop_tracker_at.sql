-- =============================================================================
-- Migration: drop users.tracker_at
-- Date:      2026-06-06
-- Purpose:   Remove the legacy `tracker_at` column now that
--            `tracker_heartbeat_at` (added in 20260606_add_tracker_heartbeat_to_users.sql)
--            fully replaces it. tracker_heartbeat_at is updated on every accepted
--            GPS fix AND is the liveness signal, so the old column is redundant.
--
-- This migration is idempotent — safe to re-run.
-- =============================================================================

BEGIN;

-- 1. Drop the column (IF EXISTS makes this re-runnable) ----------------------
ALTER TABLE public.users
    DROP COLUMN IF EXISTS tracker_at;

-- 2. Drop the column comment if any -----------------------------------------
COMMENT ON COLUMN public.users.tracker_at IS NULL;

COMMIT;

-- =============================================================================
-- Rollback (manual):
--
--   ALTER TABLE public.users
--       ADD COLUMN tracker_at timestamp without time zone DEFAULT now();
--   -- Populate tracker_at from tracker_heartbeat_at (one-shot):
--   UPDATE public.users
--      SET tracker_at = tracker_heartbeat_at
--    WHERE tracker_heartbeat_at IS NOT NULL
--      AND tracker_at IS NULL;
-- =============================================================================
