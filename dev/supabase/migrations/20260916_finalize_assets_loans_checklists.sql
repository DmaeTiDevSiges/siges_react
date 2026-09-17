-- Migration: Fix assets_loans_checklists schema
-- Date: 2026-09-16
-- Simple and direct approach

-- 1. Drop and recreate if column is wrong
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'assets_loans_checklists'
    ) THEN
        -- Check if correct column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'assets_loans_checklists'
            AND column_name = 'loan_checklist_id'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            -- Table exists but wrong column - drop and recreate
            DROP TABLE IF EXISTS assets_loans_checklists CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Create table with correct schema
CREATE TABLE IF NOT EXISTS assets_loans_checklists (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES assets_loans(id),
    loan_checklist_id BIGINT REFERENCES cfg_loans_checklists(id) ON DELETE SET NULL,
    phase VARCHAR(15) NOT NULL CHECK (phase IN ('before', 'after')),
    status VARCHAR(15) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'ok', 'damaged', 'missing', 'not_applicable')),
    custom_item_description VARCHAR(255),
    notes TEXT,
    filled_by_user_id BIGINT REFERENCES users(id),
    filled_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_assets_loans_checklists_loan_checklist 
    ON assets_loans_checklists(loan_checklist_id);
