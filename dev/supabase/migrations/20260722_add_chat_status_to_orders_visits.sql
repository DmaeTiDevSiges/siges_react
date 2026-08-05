-- =============================================================================
-- Migration: Add chat status columns to orders_visits
-- Description: Controls chat open/close state per visit
-- =============================================================================

-- Add columns to orders_visits table
ALTER TABLE public.orders_visits
  ADD COLUMN IF NOT EXISTS chat_status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS chat_closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chat_closed_user_id BIGINT REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS chat_created_user_id BIGINT REFERENCES public.users(id);

-- Index for fast lookups on chat status
CREATE INDEX IF NOT EXISTS idx_ov_chat_status ON public.orders_visits(chat_status);
CREATE INDEX IF NOT EXISTS idx_ov_chat_created_user ON public.orders_visits(chat_created_user_id);

-- Update v_orders_visits view to include new columns
-- NOTE: Run SELECT pg_get_viewdef('v_orders_visits'::regclass, true) to check current definition
-- Then add these columns to the view's SELECT list:
--   ov.chat_status,
--   ov.chat_closed_at,
--   ov.chat_closed_user_id,
--   ov.chat_created_user_id
-- Example:
-- CREATE OR REPLACE VIEW public.v_orders_visits AS
-- SELECT
--   ... existing columns ...,
--   ov.chat_status,
--   ov.chat_closed_at,
--   ov.chat_closed_user_id,
--   ov.chat_created_user_id
-- FROM orders_visits ov
-- JOIN ... ;
