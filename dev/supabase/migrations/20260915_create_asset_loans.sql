-- Migration: Create Asset Loans System
-- Date: 2026-09-15

-- 1. Empréstimos de assets
DROP TABLE IF EXISTS assets_loans_checklists_images CASCADE;
DROP TABLE IF EXISTS assets_loans_checklists CASCADE;
DROP TABLE IF EXISTS cfg_assets_types_loans_checklists CASCADE;
DROP TABLE IF EXISTS assets_loans CASCADE;
DROP VIEW IF EXISTS v_assets_loans CASCADE;

CREATE TABLE assets_loans (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL REFERENCES assets(id),
    borrower_name VARCHAR(255) NOT NULL,
    lender_user_id BIGINT NOT NULL REFERENCES users(id),
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'returned', 'overdue')),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_user_id BIGINT REFERENCES users(id),
    deleted_user_id BIGINT REFERENCES users(id)
);

-- 2. Tipos de itens de checklist (configurável por tipo de ativo)
CREATE TABLE cfg_assets_types_loans_checklists (
    id BIGSERIAL PRIMARY KEY,
    asset_type_id BIGINT NOT NULL REFERENCES cfg_assets_types(id),
    item_description VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Checklists preenchidos
CREATE TABLE assets_loans_checklists (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES assets_loans(id),
    checklist_type_id BIGINT REFERENCES cfg_assets_types_loans_checklists(id),
    phase VARCHAR(15) NOT NULL CHECK (phase IN ('before', 'after')),
    status VARCHAR(15) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'ok', 'damaged', 'missing', 'not_applicable')),
    custom_item_description VARCHAR(255),
    notes TEXT,
    filled_by_user_id BIGINT REFERENCES users(id),
    filled_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. Imagens dos checklists
CREATE TABLE assets_loans_checklists_images (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES assets_loans_checklists(id),
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'photo' 
        CHECK (image_type IN ('photo', 'document', 'damage')),
    uploaded_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_assets_loans_asset ON assets_loans(asset_id);
CREATE INDEX idx_assets_loans_lender ON assets_loans(lender_user_id);
CREATE INDEX idx_assets_loans_status ON assets_loans(status);
CREATE INDEX idx_assets_loans_expected_return ON assets_loans(expected_return_date);
CREATE INDEX idx_cfg_assets_types_loans_checklists_asset_type ON cfg_assets_types_loans_checklists(asset_type_id);
CREATE INDEX idx_assets_loans_checklists_loan ON assets_loans_checklists(loan_id);
CREATE INDEX idx_assets_loans_checklists_phase ON assets_loans_checklists(phase);
CREATE INDEX idx_assets_loans_checklists_images_checklist ON assets_loans_checklists_images(checklist_id);

-- 5. View para listagem completa de empréstimos
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

-- 6. RLS (Row Level Security)
ALTER TABLE assets_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_assets_types_loans_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets_loans_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets_loans_checklists_images ENABLE ROW LEVEL SECURITY;

-- Policies for assets_loans
CREATE POLICY "Users can view asset loans" ON assets_loans
    FOR SELECT USING (true);

CREATE POLICY "Users can insert asset loans" ON assets_loans
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update asset loans" ON assets_loans
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete asset loans" ON assets_loans
    FOR DELETE USING (true);

-- Policies for cfg_assets_types_loans_checklists
CREATE POLICY "Users can view checklist types" ON cfg_assets_types_loans_checklists
    FOR SELECT USING (true);

CREATE POLICY "Users can insert checklist types" ON cfg_assets_types_loans_checklists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update checklist types" ON cfg_assets_types_loans_checklists
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete checklist types" ON cfg_assets_types_loans_checklists
    FOR DELETE USING (true);

-- Policies for assets_loans_checklists
CREATE POLICY "Users can view loan checklists" ON assets_loans_checklists
    FOR SELECT USING (true);

CREATE POLICY "Users can insert loan checklists" ON assets_loans_checklists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update loan checklists" ON assets_loans_checklists
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete loan checklists" ON assets_loans_checklists
    FOR DELETE USING (true);

-- Policies for assets_loans_checklists_images
CREATE POLICY "Users can view checklist images" ON assets_loans_checklists_images
    FOR SELECT USING (true);

CREATE POLICY "Users can insert checklist images" ON assets_loans_checklists_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete checklist images" ON assets_loans_checklists_images
    FOR DELETE USING (true);
