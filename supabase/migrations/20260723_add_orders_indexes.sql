-- ============================================================
-- Migration: Add performance indexes to orders table
-- Date: 2026-07-23
-- Purpose: Optimize queries for OS's Concluídas/Abertas dashboards
-- ============================================================

-- 1. Composite index for "OS's Concluídas" queries
--    Covers: WHERE parent_id > 0 AND status_id = 8 AND status_at BETWEEN ...
--    Also supports: ORDER BY status_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_completed_lookup
  ON orders(status_id, parent_id, status_at DESC);

-- 2. Single-column index for status_id filtering
--    Covers: COUNT queries for filter badges (all 6 temporal periods)
--    and general status-based filters
CREATE INDEX IF NOT EXISTS idx_orders_status_id
  ON orders(status_id);

-- 3. Index for status_at ordering
--    Covers: ORDER BY status_at DESC used across multiple queries
CREATE INDEX IF NOT EXISTS idx_orders_status_at
  ON orders(status_at DESC);

-- 4. Composite index for company + status filtering
--    Covers: "OS's Abertas" queries filtered by company_id
CREATE INDEX IF NOT EXISTS idx_orders_company_status
  ON orders(company_id, status_id);

-- 5. Composite index for parent_id filtering (OS's filhas)
--    Covers: WHERE parent_id > 0 (concluídas) and parent_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_parent_id
  ON orders(parent_id) WHERE parent_id > 0;
