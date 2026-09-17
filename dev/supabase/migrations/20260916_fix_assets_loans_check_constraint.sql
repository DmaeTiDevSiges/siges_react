-- Migration: Fix assets_loans CHECK constraint for new status flow
-- Date: 2026-09-16
-- The CHECK constraint still had old values ('pending', 'active', 'returned', 'overdue')
-- but the code uses the new flow: analysis → pending → closed (overdue when pending and date passed)

-- 1. Drop old constraint FIRST (so UPDATEs can work freely)
ALTER TABLE assets_loans 
    DROP CONSTRAINT IF EXISTS assets_loans_status_check;

-- 2. Migrate old status values to new ones
-- Old flow: pending → active → returned
-- New flow: analysis → pending → closed
UPDATE assets_loans SET status = 'analysis' WHERE status = 'pending';
UPDATE assets_loans SET status = 'pending' WHERE status = 'active';
UPDATE assets_loans SET status = 'closed' WHERE status = 'returned';

-- 3. Add new CHECK constraint
ALTER TABLE assets_loans 
    ADD CONSTRAINT assets_loans_status_check 
    CHECK (status IN ('analysis', 'pending', 'closed', 'overdue'));