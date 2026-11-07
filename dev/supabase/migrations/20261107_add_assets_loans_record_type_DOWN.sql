-- DOWN: 20261107_add_assets_loans_record_type
-- Recusa rodar se existirem Recebimentos/Cedências (para não perder dados em silêncio).
-- Para forçar, exclua antes esses registros (e seus checklists/imagens) manualmente.
BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'assets_loans' AND column_name = 'record_type'
    ) AND EXISTS (
        SELECT 1 FROM public.assets_loans WHERE record_type <> 'loan'
    ) THEN
        RAISE EXCEPTION 'Existem Recebimentos/Cedências em assets_loans. Remova-os antes de reverter.';
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_guard_assets_loans ON public.assets_loans;
DROP TRIGGER IF EXISTS trg_guard_assets_loans_checklists ON public.assets_loans_checklists;
DROP TRIGGER IF EXISTS trg_guard_assets_loans_checklists_images ON public.assets_loans_checklists_images;
DROP FUNCTION IF EXISTS public.fn_guard_assets_loans();
DROP FUNCTION IF EXISTS public.fn_guard_assets_loans_checklists();
DROP FUNCTION IF EXISTS public.fn_guard_assets_loans_checklists_images();
DROP FUNCTION IF EXISTS public.fn_assets_loans_conclude_inspection(BIGINT);
DROP FUNCTION IF EXISTS public.fn_assets_loans_create(BIGINT, VARCHAR, VARCHAR, DATE, TEXT);

-- Policies anteriores (abertas)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename IN ('assets_loans', 'assets_loans_checklists', 'assets_loans_checklists_images')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

CREATE POLICY "Users can view asset loans"   ON public.assets_loans FOR SELECT USING (true);
CREATE POLICY "Users can insert asset loans" ON public.assets_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update asset loans" ON public.assets_loans FOR UPDATE USING (true);
CREATE POLICY "Users can delete asset loans" ON public.assets_loans FOR DELETE USING (true);
CREATE POLICY "Users can view loan checklists"   ON public.assets_loans_checklists FOR SELECT USING (true);
CREATE POLICY "Users can insert loan checklists" ON public.assets_loans_checklists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update loan checklists" ON public.assets_loans_checklists FOR UPDATE USING (true);
CREATE POLICY "Users can delete loan checklists" ON public.assets_loans_checklists FOR DELETE USING (true);
CREATE POLICY "Users can view checklist images"   ON public.assets_loans_checklists_images FOR SELECT USING (true);
CREATE POLICY "Users can insert checklist images" ON public.assets_loans_checklists_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete checklist images" ON public.assets_loans_checklists_images FOR DELETE USING (true);

-- View sem record_type
DROP VIEW IF EXISTS public.v_assets_loans;
CREATE VIEW public.v_assets_loans
WITH (security_invoker = true)
AS
SELECT
    al.id, al.asset_id, al.borrower_name, al.lender_user_id, al.expected_return_date,
    al.actual_return_date, al.status, al.notes, al.is_deleted, al.created_at, al.updated_at,
    al.created_user_id,
    al.signature_delivery_path, al.signature_delivery_name, al.signature_delivery_at,
    al.signature_delivery_signer_name,
    al.signature_return_path, al.signature_return_name, al.signature_return_at,
    al.signature_return_signer_name,
    al.inspector_delivery_user_id, al.inspector_return_user_id, al.items_checklists_divergent_count,
    a.code AS asset_code, a.description AS asset_description, a.serial AS asset_serial,
    a.brand AS asset_brand, a.model AS asset_model,
    a.img_file_path AS asset_img_path, a.img_file_name AS asset_img_name,
    at.description AS asset_type_name,
    ul.name_full AS lender_name, ul.name_short AS lender_name_short,
    ud.name_full AS inspector_delivery_name, ur.name_full AS inspector_return_name,
    CASE
        WHEN al.status = 'pending' AND al.expected_return_date < CURRENT_DATE THEN 'overdue'
        ELSE al.status
    END AS computed_status
FROM public.assets_loans al
JOIN public.assets a              ON al.asset_id = a.id
LEFT JOIN public.cfg_assets_types at ON a.type_id = at.id
LEFT JOIN public.users ul         ON al.lender_user_id = ul.id
LEFT JOIN public.users ud         ON al.inspector_delivery_user_id = ud.id
LEFT JOIN public.users ur         ON al.inspector_return_user_id = ur.id
WHERE al.is_deleted = FALSE;

GRANT SELECT ON public.v_assets_loans TO authenticated, service_role;

ALTER TABLE public.assets_loans_checklists DROP CONSTRAINT IF EXISTS assets_loans_checklists_phase_check;
ALTER TABLE public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_phase_check CHECK (phase IN ('before', 'after'));

ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_single_status_check;
ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_expected_return_check;
ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_record_type_check;
DROP INDEX IF EXISTS public.idx_assets_loans_record_type;
ALTER TABLE public.assets_loans ALTER COLUMN expected_return_date SET NOT NULL;
ALTER TABLE public.assets_loans DROP COLUMN IF EXISTS record_type;

COMMIT;
