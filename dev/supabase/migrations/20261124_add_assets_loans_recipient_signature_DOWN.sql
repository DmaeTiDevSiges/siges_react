-- Reverte 20261124_add_assets_loans_recipient_signature.sql
-- Recria a view e a função como em 20261107_add_assets_loans_record_type.sql e remove as colunas.
BEGIN;

DROP VIEW IF EXISTS public.v_assets_loans;
CREATE VIEW public.v_assets_loans
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
    al.inspector_delivery_user_id,
    al.inspector_return_user_id,
    al.items_checklists_divergent_count,
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
    ud.name_full            AS inspector_delivery_name,
    ur.name_full            AS inspector_return_name,
    CASE
        WHEN al.record_type = 'loan'
         AND al.status = 'pending'
         AND al.expected_return_date < CURRENT_DATE THEN 'overdue'
        ELSE al.status
    END                     AS computed_status,
    al.record_type
FROM public.assets_loans al
JOIN public.assets a              ON al.asset_id = a.id
LEFT JOIN public.cfg_assets_types at ON a.type_id = at.id
LEFT JOIN public.users ul         ON al.lender_user_id = ul.id
LEFT JOIN public.users ud         ON al.inspector_delivery_user_id = ud.id
LEFT JOIN public.users ur         ON al.inspector_return_user_id = ur.id
WHERE al.is_deleted = FALSE;

GRANT SELECT ON public.v_assets_loans TO authenticated, service_role;
REVOKE ALL ON public.v_assets_loans FROM anon;

CREATE OR REPLACE FUNCTION public.fn_assets_loans_conclude_inspection(p_loan_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id  BIGINT;
    v_loan     public.assets_loans%ROWTYPE;
    v_total    INT;
    v_pending  INT;
    v_no_photo INT;
BEGIN
    IF NOT public.fc_has_route_permission('assets_loans', 'create') THEN
        RAISE EXCEPTION 'Sem permissão para concluir vistorias.' USING ERRCODE = '42501';
    END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_loan FROM public.assets_loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND OR v_loan.is_deleted THEN
        RAISE EXCEPTION 'Registro % não encontrado.', p_loan_id USING ERRCODE = 'P0002';
    END IF;

    IF v_loan.record_type NOT IN ('receipt', 'cedencia') THEN
        RAISE EXCEPTION 'Empréstimos são encerrados pela devolução, não por esta função.'
            USING ERRCODE = '22023';
    END IF;

    IF v_loan.status <> 'analysis' THEN
        RAISE EXCEPTION 'A vistoria já foi concluída.' USING ERRCODE = '22023';
    END IF;

    SELECT count(*),
           count(*) FILTER (WHERE c.status = 'pending'),
           count(*) FILTER (
               WHERE c.status = 'damaged'
                 AND NOT EXISTS (
                     SELECT 1 FROM public.assets_loans_checklists_images i
                      WHERE i.checklist_id = c.id
                 )
           )
      INTO v_total, v_pending, v_no_photo
      FROM public.assets_loans_checklists c
     WHERE c.loan_id = p_loan_id
       AND c.phase = 'single';

    IF v_total = 0 THEN
        RAISE EXCEPTION 'A vistoria não tem itens de checklist.' USING ERRCODE = '22023';
    END IF;
    IF v_pending > 0 THEN
        RAISE EXCEPTION 'Preencha todos os itens do checklist (% pendente(s)).', v_pending
            USING ERRCODE = '22023';
    END IF;
    IF v_no_photo > 0 THEN
        RAISE EXCEPTION 'Todo item danificado precisa de ao menos uma foto (% sem foto).', v_no_photo
            USING ERRCODE = '22023';
    END IF;
    IF v_loan.signature_delivery_path IS NULL OR v_loan.signature_delivery_name IS NULL THEN
        RAISE EXCEPTION 'A assinatura do vistoriador é obrigatória para concluir.'
            USING ERRCODE = '22023';
    END IF;

    -- Sinaliza ao trigger de guarda que este encerramento passou pelas validações.
    PERFORM set_config('siges.assets_loans_conclude', 'on', true);

    UPDATE public.assets_loans
       SET status = 'closed',
           inspector_delivery_user_id = v_user_id,
           updated_at = timezone('America/Sao_Paulo', now())
     WHERE id = p_loan_id;

    PERFORM set_config('siges.assets_loans_conclude', 'off', true);
END;
$$;

COMMENT ON FUNCTION public.fn_assets_loans_conclude_inspection(BIGINT) IS
    'Conclui Recebimento/Cedência: itens preenchidos, foto em item danificado, assinatura do vistoriador.';

REVOKE ALL ON FUNCTION public.fn_assets_loans_conclude_inspection(BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_assets_loans_conclude_inspection(BIGINT) TO authenticated, service_role;

ALTER TABLE public.assets_loans
    DROP COLUMN IF EXISTS signature_recipient_path,
    DROP COLUMN IF EXISTS signature_recipient_name,
    DROP COLUMN IF EXISTS signature_recipient_at,
    DROP COLUMN IF EXISTS signature_recipient_signer_name,
    DROP COLUMN IF EXISTS recipient_identification;

COMMIT;
