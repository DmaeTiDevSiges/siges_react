-- Migration: Add signature columns to assets_loans
-- Date: 2026-09-16

-- 1. Adicionar colunas de assinatura
ALTER TABLE assets_loans
    ADD COLUMN IF NOT EXISTS signature_delivery_path TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS signature_delivery_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS signature_delivery_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS signature_return_path TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS signature_return_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS signature_return_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL;

-- 2. Recriar view (drop primeiro para evitar conflito de colunas)
DROP VIEW IF EXISTS v_assets_loans;

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
    al.signature_delivery_path,
    al.signature_delivery_name,
    al.signature_delivery_at,
    al.signature_return_path,
    al.signature_return_name,
    al.signature_return_at,
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
