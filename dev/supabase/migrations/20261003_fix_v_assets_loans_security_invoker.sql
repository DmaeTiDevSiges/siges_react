-- Migration: Fix v_assets_loans SECURITY DEFINER → SECURITY INVOKER
-- Date: 2026-10-03
-- Reason: Views created by the postgres role in Supabase inherit SECURITY DEFINER
--         by default, which bypasses RLS for querying users. Recreating with
--         security_invoker = true ensures RLS of the querying user is enforced.

DROP VIEW IF EXISTS public.v_assets_loans;

CREATE OR REPLACE VIEW public.v_assets_loans
WITH (security_invoker = true)
AS
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
    al.signature_delivery_signer_name,
    al.signature_return_path,
    al.signature_return_name,
    al.signature_return_at,
    al.signature_return_signer_name,
    a.code                  AS asset_code,
    a.description           AS asset_description,
    a.serial                AS asset_serial,
    a.brand                 AS asset_brand,
    a.model                 AS asset_model,
    a.img_file_path         AS asset_img_path,
    a.img_file_name         AS asset_img_name,
    at.description          AS asset_type_name,
    ul.name_full            AS lender_name,
    ul.name_short           AS lender_name_short,
    CASE
        WHEN al.status = 'pending' AND al.expected_return_date < CURRENT_DATE THEN 'overdue'
        ELSE al.status
    END AS computed_status
FROM assets_loans al
JOIN assets a             ON al.asset_id = a.id
LEFT JOIN cfg_assets_types at ON a.type_id = at.id
LEFT JOIN users ul        ON al.lender_user_id = ul.id
WHERE al.is_deleted = FALSE;
