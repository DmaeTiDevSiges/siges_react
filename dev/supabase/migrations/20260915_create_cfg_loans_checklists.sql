-- Migration: Create cfg_loans_checklists and refactor association to N:N
-- Date: 2026-09-15
-- Idempotent: safe to re-run on partially applied state

-- ============================================================
-- 1. Create cfg_loans_checklists if not exists
-- ============================================================
CREATE TABLE IF NOT EXISTS cfg_loans_checklists (
    id BIGSERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. Migrate data only if old structure exists (item_description column)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cfg_assets_types_loans_checklists'
        AND column_name = 'item_description'
    ) THEN
        -- Preserve old data
        CREATE TEMP TABLE _old_assoc AS
        SELECT id, asset_type_id, item_description, sort_order, is_active
        FROM cfg_assets_types_loans_checklists;

        -- Insert distinct items into catalog
        INSERT INTO cfg_loans_checklists (description, sort_order, is_active)
        SELECT DISTINCT item_description, sort_order, is_active
        FROM _old_assoc
        ON CONFLICT DO NOTHING;

        -- Drop old table
        DROP TABLE IF EXISTS cfg_assets_types_loans_checklists CASCADE;

        -- Recreate as N:N join table
        CREATE TABLE cfg_assets_types_loans_checklists (
            id BIGSERIAL PRIMARY KEY,
            checklist_id BIGINT NOT NULL REFERENCES cfg_loans_checklists(id) ON DELETE CASCADE,
            asset_type_id BIGINT NOT NULL REFERENCES cfg_assets_types(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(checklist_id, asset_type_id)
        );

        -- Re-associate data
        INSERT INTO cfg_assets_types_loans_checklists (checklist_id, asset_type_id)
        SELECT cl.id, old.asset_type_id
        FROM _old_assoc old
        JOIN cfg_loans_checklists cl ON cl.description = old.item_description
        ON CONFLICT (checklist_id, asset_type_id) DO NOTHING;

        DROP TABLE IF EXISTS _old_assoc;
    END IF;
END $$;

-- ============================================================
-- 3. Ensure N:N join table exists (covers fresh install case)
-- ============================================================
CREATE TABLE IF NOT EXISTS cfg_assets_types_loans_checklists (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES cfg_loans_checklists(id) ON DELETE CASCADE,
    asset_type_id BIGINT NOT NULL REFERENCES cfg_assets_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(checklist_id, asset_type_id)
);

-- ============================================================
-- 4. Update FK on assets_loans_checklists
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assets_loans_checklists_checklist_type_id_fkey'
    ) THEN
        ALTER TABLE assets_loans_checklists
            DROP CONSTRAINT assets_loans_checklists_checklist_type_id_fkey;
    END IF;
END $$;

ALTER TABLE assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_checklist_type_id_fkey
    FOREIGN KEY (checklist_type_id) REFERENCES cfg_loans_checklists(id) ON DELETE SET NULL;

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cfg_loans_checklists_active ON cfg_loans_checklists(is_active);
CREATE INDEX IF NOT EXISTS idx_cfg_assets_types_loans_checklists_checklist ON cfg_assets_types_loans_checklists(checklist_id);
CREATE INDEX IF NOT EXISTS idx_cfg_assets_types_loans_checklists_asset_type ON cfg_assets_types_loans_checklists(asset_type_id);

-- ============================================================
-- 6. RLS
-- ============================================================
ALTER TABLE cfg_loans_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_assets_types_loans_checklists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view loans checklists' AND tablename = 'cfg_loans_checklists') THEN
        CREATE POLICY "Users can view loans checklists" ON cfg_loans_checklists FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert loans checklists' AND tablename = 'cfg_loans_checklists') THEN
        CREATE POLICY "Users can insert loans checklists" ON cfg_loans_checklists FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update loans checklists' AND tablename = 'cfg_loans_checklists') THEN
        CREATE POLICY "Users can update loans checklists" ON cfg_loans_checklists FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete loans checklists' AND tablename = 'cfg_loans_checklists') THEN
        CREATE POLICY "Users can delete loans checklists" ON cfg_loans_checklists FOR DELETE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view asset type checklist associations' AND tablename = 'cfg_assets_types_loans_checklists') THEN
        CREATE POLICY "Users can view asset type checklist associations" ON cfg_assets_types_loans_checklists FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert asset type checklist associations' AND tablename = 'cfg_assets_types_loans_checklists') THEN
        CREATE POLICY "Users can insert asset type checklist associations" ON cfg_assets_types_loans_checklists FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update asset type checklist associations' AND tablename = 'cfg_assets_types_loans_checklists') THEN
        CREATE POLICY "Users can update asset type checklist associations" ON cfg_assets_types_loans_checklists FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete asset type checklist associations' AND tablename = 'cfg_assets_types_loans_checklists') THEN
        CREATE POLICY "Users can delete asset type checklist associations" ON cfg_assets_types_loans_checklists FOR DELETE USING (true);
    END IF;
END $$;

-- ============================================================
-- 7. Recreate v_assets_loans view
-- ============================================================
CREATE OR REPLACE VIEW v_assets_loans AS
SELECT
    al.id,
    al.asset_id,
    al.borrower_name,
    al.lender_user_id,
    al.expected_return_date,
    al.actual_return_date,
    al.status,
    al.notes,
    al.is_deleted,
    al.created_at,
    al.updated_at,
    al.created_user_id,
    a.code as asset_code,
    a.description as asset_description,
    a.serial as asset_serial,
    a.brand as asset_brand,
    a.model as asset_model,
    a.img_file_path as asset_img_path,
    a.img_file_name as asset_img_name,
    at.description as asset_type_name,
    ul.name_full as lender_name,
    ul.name_short as lender_name_short,
    CASE
        WHEN al.status = 'pending' AND al.expected_return_date < CURRENT_DATE THEN 'overdue'
        ELSE al.status
    END as computed_status
FROM assets_loans al
JOIN assets a ON al.asset_id = a.id
LEFT JOIN cfg_assets_types at ON a.type_id = at.id
LEFT JOIN users ul ON al.lender_user_id = ul.id
WHERE al.is_deleted = FALSE;
