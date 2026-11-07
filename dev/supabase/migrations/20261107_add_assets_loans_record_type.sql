-- ==============================================================================
-- Migration: 20261107_add_assets_loans_record_type.sql
-- Empréstimos, Recebimentos e Cedências de ativos na MESMA tabela assets_loans
-- (docs/PLANO_VISTORIAS_RECEBIMENTO_CEDENCIA_ATIVOS.md).
--
--   record_type:
--     'loan'     → Empréstimo: vistorias 'before' (entrega) e 'after' (devolução);
--                  fluxo analysis → pending → closed (inalterado).
--     'receipt'  → Recebimento: vistoria única 'single'; analysis → closed.
--     'cedencia' → Cedência:    vistoria única 'single'; analysis → closed.
--
--   Itens do checklist: cfg_assets_types_loans_checklists (associação tipo de
--   ativo ↔ item) + cfg_loans_checklists (descrição/ordem), para os três tipos.
--   borrower_name: Empréstimo = solicitante; Recebimento = entregue por;
--                  Cedência = cedido para.
--
--   Regras no banco:
--     1. expected_return_date obrigatória só para 'loan'.
--     2. Fase do checklist compatível com o tipo (loan: before/after; demais: single).
--     3. fn_assets_loans_create: cria o registro + itens do checklist numa
--        transação; recusa se o ativo já tiver registro não encerrado ou se o
--        tipo do ativo não tiver itens configurados.
--     4. fn_assets_loans_conclude_inspection: conclui Recebimento/Cedência
--        (todos os itens preenchidos, foto em todo item 'damaged', assinatura do
--        vistoriador). É o ÚNICO caminho para encerrar esses tipos.
--     5. Registro encerrado ('closed') não pode ser alterado nem cancelado, nem
--        seus itens de checklist e imagens.
--     6. RLS: leitura para usuários autenticados; gravação exige permissão
--        'create' na rota 'assets_loans' (a mesma que a tela já usa).
--
--   Chamadas sem usuário logado (auth.uid() nulo: service_role/jobs) não são
--   bloqueadas pelos triggers de guarda.
--   Nenhum DROP ... CASCADE. v_assets_loans não tem dependentes (DROP VIEW sem
--   CASCADE falha se houver, em vez de apagá-los).
--   Aplicar manualmente no SQL Editor do Supabase. Idempotente.
--   Reverter: 20261107_add_assets_loans_record_type_DOWN.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Discriminador de tipo + data prevista só para empréstimo
-- ------------------------------------------------------------------------------
ALTER TABLE public.assets_loans
    ADD COLUMN IF NOT EXISTS record_type VARCHAR(20) NOT NULL DEFAULT 'loan';

COMMENT ON COLUMN public.assets_loans.record_type IS
    'loan = Empréstimo (vistorias before/after); receipt = Recebimento; cedencia = Cedência (vistoria única single).';
COMMENT ON COLUMN public.assets_loans.borrower_name IS
    'Empréstimo: solicitante. Recebimento: quem entregou o ativo. Cedência: para quem o ativo foi cedido.';

ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_record_type_check;
ALTER TABLE public.assets_loans
    ADD CONSTRAINT assets_loans_record_type_check
    CHECK (record_type IN ('loan', 'receipt', 'cedencia'));

ALTER TABLE public.assets_loans ALTER COLUMN expected_return_date DROP NOT NULL;

ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_expected_return_check;
ALTER TABLE public.assets_loans
    ADD CONSTRAINT assets_loans_expected_return_check
    CHECK (record_type <> 'loan' OR expected_return_date IS NOT NULL);

-- Tipos unitários não passam por 'pending'/'overdue'.
ALTER TABLE public.assets_loans DROP CONSTRAINT IF EXISTS assets_loans_single_status_check;
ALTER TABLE public.assets_loans
    ADD CONSTRAINT assets_loans_single_status_check
    CHECK (record_type = 'loan' OR status IN ('analysis', 'closed'));

CREATE INDEX IF NOT EXISTS idx_assets_loans_record_type ON public.assets_loans (record_type);

-- ------------------------------------------------------------------------------
-- 2. Fase 'single' no checklist preenchido
-- ------------------------------------------------------------------------------
ALTER TABLE public.assets_loans_checklists DROP CONSTRAINT IF EXISTS assets_loans_checklists_phase_check;
ALTER TABLE public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_phase_check
    CHECK (phase IN ('before', 'after', 'single'));

-- ------------------------------------------------------------------------------
-- 3. View: + record_type; atraso só existe para empréstimo
--    (definição completa, com vistoriadores e contagem de divergências)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. Criação atômica (registro + itens do checklist)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_assets_loans_create(
    p_asset_id             BIGINT,
    p_record_type          VARCHAR,
    p_borrower_name        VARCHAR,
    p_expected_return_date DATE DEFAULT NULL,
    p_notes                TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id   BIGINT;
    v_type_id   BIGINT;
    v_loan_id   BIGINT;
    v_items     INT;
    v_now       TIMESTAMP := timezone('America/Sao_Paulo', now());
BEGIN
    IF NOT public.fc_has_route_permission('assets_loans', 'create') THEN
        RAISE EXCEPTION 'Sem permissão para criar registros de empréstimo/vistoria.'
            USING ERRCODE = '42501';
    END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    IF p_record_type IS NULL OR p_record_type NOT IN ('loan', 'receipt', 'cedencia') THEN
        RAISE EXCEPTION 'Tipo de registro inválido: %', p_record_type USING ERRCODE = '22023';
    END IF;

    IF NULLIF(btrim(COALESCE(p_borrower_name, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Informe o nome (solicitante / entregue por / cedido para).'
            USING ERRCODE = '22023';
    END IF;

    IF p_record_type = 'loan' AND p_expected_return_date IS NULL THEN
        RAISE EXCEPTION 'A data prevista de devolução é obrigatória para empréstimo.'
            USING ERRCODE = '22023';
    END IF;

    -- Trava o ativo para não criar dois registros em paralelo.
    SELECT a.type_id INTO v_type_id FROM public.assets a WHERE a.id = p_asset_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ativo % não encontrado.', p_asset_id USING ERRCODE = 'P0002';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.assets_loans l
         WHERE l.asset_id = p_asset_id
           AND NOT l.is_deleted
           AND l.status <> 'closed'
    ) THEN
        RAISE EXCEPTION 'Este ativo já possui um registro não encerrado. Conclua-o antes de criar outro.'
            USING ERRCODE = '23505';
    END IF;

    SELECT count(*) INTO v_items
      FROM public.cfg_assets_types_loans_checklists atc
      JOIN public.cfg_loans_checklists c ON c.id = atc.checklist_id
     WHERE atc.asset_type_id = v_type_id
       AND COALESCE(c.is_active, TRUE);

    IF v_items = 0 THEN
        RAISE EXCEPTION 'O tipo deste ativo não tem itens de checklist configurados (Ajustes > Checklists de empréstimo).'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.assets_loans (
        asset_id, record_type, borrower_name, lender_user_id,
        expected_return_date, notes, status,
        created_user_id, created_at, updated_at
    ) VALUES (
        p_asset_id, p_record_type, btrim(p_borrower_name), v_user_id,
        CASE WHEN p_record_type = 'loan' THEN p_expected_return_date ELSE NULL END,
        NULLIF(btrim(COALESCE(p_notes, '')), ''), 'analysis',
        v_user_id, v_now, v_now
    )
    RETURNING id INTO v_loan_id;

    INSERT INTO public.assets_loans_checklists (loan_id, loan_checklist_id, phase, status, created_at)
    SELECT v_loan_id, atc.checklist_id, ph.phase, 'pending', v_now
      FROM public.cfg_assets_types_loans_checklists atc
      JOIN public.cfg_loans_checklists c ON c.id = atc.checklist_id
     CROSS JOIN LATERAL (
            SELECT unnest(
                CASE WHEN p_record_type = 'loan'
                     THEN ARRAY['before', 'after']
                     ELSE ARRAY['single'] END
            ) AS phase
         ) ph
     WHERE atc.asset_type_id = v_type_id
       AND COALESCE(c.is_active, TRUE)
     ORDER BY ph.phase, COALESCE(c.sort_order, 0), c.id;

    RETURN v_loan_id;
END;
$$;

COMMENT ON FUNCTION public.fn_assets_loans_create(BIGINT, VARCHAR, VARCHAR, DATE, TEXT) IS
    'Cria Empréstimo/Recebimento/Cedência com os itens do checklist do tipo do ativo, numa transação.';

REVOKE ALL ON FUNCTION public.fn_assets_loans_create(BIGINT, VARCHAR, VARCHAR, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_assets_loans_create(BIGINT, VARCHAR, VARCHAR, DATE, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. Conclusão da vistoria única (Recebimento / Cedência)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. Guarda do registro principal
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_guard_assets_loans()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'closed' THEN
            RAISE EXCEPTION 'Registro concluído não pode ser excluído.' USING ERRCODE = '42501';
        END IF;
        RETURN OLD;
    END IF;

    -- UPDATE
    IF OLD.status = 'closed' THEN
        RAISE EXCEPTION 'Registro concluído não pode ser alterado ou cancelado.' USING ERRCODE = '42501';
    END IF;

    IF NEW.record_type IS DISTINCT FROM OLD.record_type THEN
        RAISE EXCEPTION 'O tipo do registro não pode ser alterado.' USING ERRCODE = '42501';
    END IF;

    IF NEW.record_type <> 'loan'
       AND NEW.status = 'closed'
       AND COALESCE(current_setting('siges.assets_loans_conclude', true), 'off') <> 'on' THEN
        RAISE EXCEPTION 'Recebimento/Cedência só pode ser concluído pela conclusão da vistoria.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_assets_loans ON public.assets_loans;
CREATE TRIGGER trg_guard_assets_loans
BEFORE UPDATE OR DELETE ON public.assets_loans
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_assets_loans();

-- ------------------------------------------------------------------------------
-- 7. Guarda dos itens do checklist (fase compatível; registro não encerrado)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_guard_assets_loans_checklists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_loan_id BIGINT := COALESCE(NEW.loan_id, OLD.loan_id);
    v_type    VARCHAR;
    v_status  VARCHAR;
BEGIN
    SELECT l.record_type, l.status INTO v_type, v_status
      FROM public.assets_loans l WHERE l.id = v_loan_id;

    IF TG_OP <> 'DELETE' THEN
        IF (v_type = 'loan' AND NEW.phase NOT IN ('before', 'after'))
           OR (v_type <> 'loan' AND NEW.phase <> 'single') THEN
            RAISE EXCEPTION 'Fase "%" incompatível com o tipo de registro "%".', NEW.phase, v_type
                USING ERRCODE = '22023';
        END IF;
    END IF;

    IF auth.uid() IS NOT NULL AND v_status = 'closed' THEN
        RAISE EXCEPTION 'Checklist de registro concluído não pode ser alterado.' USING ERRCODE = '42501';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_assets_loans_checklists ON public.assets_loans_checklists;
CREATE TRIGGER trg_guard_assets_loans_checklists
BEFORE INSERT OR UPDATE OR DELETE ON public.assets_loans_checklists
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_assets_loans_checklists();

-- ------------------------------------------------------------------------------
-- 8. Guarda das imagens (registro não encerrado)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_guard_assets_loans_checklists_images()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status VARCHAR;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT l.status INTO v_status
      FROM public.assets_loans_checklists c
      JOIN public.assets_loans l ON l.id = c.loan_id
     WHERE c.id = COALESCE(NEW.checklist_id, OLD.checklist_id);

    IF v_status = 'closed' THEN
        RAISE EXCEPTION 'Imagens de registro concluído não podem ser alteradas.' USING ERRCODE = '42501';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_assets_loans_checklists_images ON public.assets_loans_checklists_images;
CREATE TRIGGER trg_guard_assets_loans_checklists_images
BEFORE INSERT OR UPDATE OR DELETE ON public.assets_loans_checklists_images
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_assets_loans_checklists_images();

-- ------------------------------------------------------------------------------
-- 9. RLS: leitura autenticada; gravação com permissão 'create' em 'assets_loans'
--    (remove todas as policies atuais destas 3 tabelas, que eram USING (true))
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename IN ('assets_loans', 'assets_loans_checklists', 'assets_loans_checklists_images')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

ALTER TABLE public.assets_loans                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets_loans_checklists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets_loans_checklists_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY assets_loans_select ON public.assets_loans
    FOR SELECT TO authenticated USING (true);
CREATE POLICY assets_loans_insert ON public.assets_loans
    FOR INSERT TO authenticated WITH CHECK (public.fc_has_route_permission('assets_loans', 'create'));
CREATE POLICY assets_loans_update ON public.assets_loans
    FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('assets_loans', 'create'))
    WITH CHECK (public.fc_has_route_permission('assets_loans', 'create'));
CREATE POLICY assets_loans_delete ON public.assets_loans
    FOR DELETE TO authenticated USING (public.fc_has_route_permission('assets_loans', 'create'));

CREATE POLICY assets_loans_checklists_select ON public.assets_loans_checklists
    FOR SELECT TO authenticated USING (true);
CREATE POLICY assets_loans_checklists_insert ON public.assets_loans_checklists
    FOR INSERT TO authenticated WITH CHECK (public.fc_has_route_permission('assets_loans', 'create'));
CREATE POLICY assets_loans_checklists_update ON public.assets_loans_checklists
    FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('assets_loans', 'create'))
    WITH CHECK (public.fc_has_route_permission('assets_loans', 'create'));
CREATE POLICY assets_loans_checklists_delete ON public.assets_loans_checklists
    FOR DELETE TO authenticated USING (public.fc_has_route_permission('assets_loans', 'create'));

CREATE POLICY assets_loans_checklists_images_select ON public.assets_loans_checklists_images
    FOR SELECT TO authenticated USING (true);
CREATE POLICY assets_loans_checklists_images_insert ON public.assets_loans_checklists_images
    FOR INSERT TO authenticated WITH CHECK (public.fc_has_route_permission('assets_loans', 'create'));
CREATE POLICY assets_loans_checklists_images_delete ON public.assets_loans_checklists_images
    FOR DELETE TO authenticated USING (public.fc_has_route_permission('assets_loans', 'create'));

REVOKE ALL ON public.assets_loans, public.assets_loans_checklists, public.assets_loans_checklists_images FROM anon;

COMMIT;

-- Conferência:
--   SELECT record_type, status, count(*) FROM public.assets_loans GROUP BY 1, 2;   -- antigos = 'loan'
--   SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_guard_assets_loans%';      -- 3 triggers
--   SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE 'assets_loans%' ORDER BY 1, 2;
