-- Migration: Add divergent_items_count to assets_loans
-- Date: 2026-09-16
-- Counts checklist items that differ between before and after phases

ALTER TABLE assets_loans
    ADD COLUMN IF NOT EXISTS items_checklists_divergent_count INTEGER DEFAULT 0;

DROP VIEW IF EXISTS v_assets_loans;

CREATE OR REPLACE VIEW v_assets_loans AS
SELECT 
    al.id, al.asset_id, al.borrower_name, al.lender_user_id,
    al.expected_return_date, al.actual_return_date, al.status, al.notes,
    al.is_deleted, al.created_at, al.updated_at, al.created_user_id,
    al.signature_delivery_path, al.signature_delivery_name,
    al.signature_delivery_at, al.signature_delivery_signer_name,
    al.signature_return_path, al.signature_return_name,
    al.signature_return_at, al.signature_return_signer_name,
    al.inspector_delivery_user_id, al.inspector_return_user_id,
    al.items_checklists_divergent_count,
    a.code as asset_code, a.description as asset_description,
    a.serial as asset_serial, a.brand as asset_brand, a.model as asset_model,
    a.img_file_path as asset_img_path, a.img_file_name as asset_img_name,
    at.description as asset_type_name,
    ul.name_full as lender_name, ul.name_short as lender_name_short,
    ud.name_full as inspector_delivery_name,
    ur.name_full as inspector_return_name,
    CASE 
        WHEN al.status = 'pending' AND al.expected_return_date < CURRENT_DATE THEN 'overdue'
        ELSE al.status
    END as computed_status
FROM assets_loans al
JOIN assets a ON al.asset_id = a.id
LEFT JOIN cfg_assets_types at ON a.type_id = at.id
LEFT JOIN users ul ON al.lender_user_id = ul.id
LEFT JOIN users ud ON al.inspector_delivery_user_id = ud.id
LEFT JOIN users ur ON al.inspector_return_user_id = ur.id
WHERE al.is_deleted = FALSE;