-- ============================================================
-- Migration: Add is_logged_out_with_visit flag to users table
-- Purpose: Track users who logged out with an active visit
--          so n8n can send WhatsApp reminders every 15 min
-- Date: 2026-09-02
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_logged_out_with_visit boolean DEFAULT false;

-- Backfill: users who already have an active visit should not be flagged
-- (they are still in the app). Only new logouts will set this flag.
