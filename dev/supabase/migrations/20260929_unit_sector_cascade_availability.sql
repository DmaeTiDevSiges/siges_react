-- Migration: Cascata de disponibilidade pai → filhos (organograma de setores)
-- Data: 2026-09-29
-- Objetivo:
--   Quando um setor PAI é informado como INDISPONÍVEL, todos os setores FILHOS
--   (descendentes ativos) ficam indisponíveis também. Quando o pai VOLTA para
--   disponível, cada filho recupera o estado original capturado antes da
--   cascata — quem já estava indisponível por motivo próprio PERMANECE
--   indisponível; quem estava disponível VOLTA a ficar disponível.
-- Decisões do usuário:
--   1) cada filho afetado ganha histórico em assets_available (processing 3);
--   2) informe manual em filho sob cascata é BLOQUEADO até o pai voltar.
-- Escopo: 100% aditivo — sem DROP, sem CASCADE; RPC antigo permanece intacto.
-- Idempotente: pode ser reexecutado no SQL Editor sem efeitos colaterais.

-- ============================================================================
-- 1) Colunas de controle da cascata em cfg_units_assets_tags
-- ============================================================================
ALTER TABLE public.cfg_units_assets_tags
    ADD COLUMN IF NOT EXISTS cascade_parent_id bigint;

ALTER TABLE public.cfg_units_assets_tags
    ADD COLUMN IF NOT EXISTS pre_cascade_state jsonb;

-- FK autoreferente: aponta para o nó RAIZ da cascata (não para o pai direto),
-- permitindo cascatas aninhadas independentes.
-- Idempotente: ADD CONSTRAINT não aceita IF NOT EXISTS no Postgres.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cfg_units_assets_tags_cascade_parent_id_fkey'
          AND conrelid = 'public.cfg_units_assets_tags'::regclass
    ) THEN
        ALTER TABLE public.cfg_units_assets_tags
            ADD CONSTRAINT cfg_units_assets_tags_cascade_parent_id_fkey
            FOREIGN KEY (cascade_parent_id) REFERENCES public.cfg_units_assets_tags(id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_units_assets_tags_cascade_parent_id
    ON public.cfg_units_assets_tags (cascade_parent_id);

-- ============================================================================
-- 2) processing id 3 = "Alteração em cascata (setor pai)"
-- ============================================================================
INSERT INTO public.cfg_assets_available_processing (id, code, description)
VALUES (3, 'CASCADE', 'Alteração em cascata (setor pai)')
ON CONFLICT (id) DO UPDATE
    SET code = EXCLUDED.code,
        description = EXCLUDED.description;

-- ============================================================================
-- 3) RPC report_unit_asset_tag_availability
--    Mesma assinatura e comportamento do RPC original
--    (update_unit_asset_tag_availability) + blocos de cascata atômicos.
--    Convenção do marcador: a RAIZ da cascata tem cascade_parent_id = próprio id.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.report_unit_asset_tag_availability(
    p_unit_asset_tag_id integer,
    p_is_available boolean,
    p_reason_id integer,
    p_comments text,
    p_reported_by_id integer,
    p_file_path text,
    p_file_name text,
    p_unit_id integer,
    p_asset_tag_id integer,
    p_asset_tag_sub_id integer,
    p_operation_record numeric,
    p_created_at text,
    p_reported_at text,
    p_reported_latitude double precision,
    p_reported_longitude double precision,
    p_unit_latitude double precision,
    p_unit_longitude double precision,
    p_unit_reported_distance double precision,
    p_provider_company_id integer,
    p_is_web boolean
) RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_new_id INTEGER;
    v_rate NUMERIC;
    v_has_active_children boolean := FALSE;
    v_do_cascade_disable boolean := FALSE;
    v_do_cascade_restore boolean := FALSE;
    v_parent_name TEXT;
BEGIN
    -- ── 0) GUARDA: bloquear informe em descendente de cascata ativa ─────
    -- Sobe a árvore via parent_id; se algum ancestral é raiz de cascata
    -- (cascade_parent_id = próprio id), o estado é dirigido por ele.
    -- A raiz em si (ancestral de ninguém neste teste) permanece informável.
    IF EXISTS (
        WITH RECURSIVE anc AS (
            SELECT c.parent_id
            FROM public.cfg_units_assets_tags c
            WHERE c.id = p_unit_asset_tag_id
          UNION  -- UNION (não ALL) quebra loop em caso de ciclo legado em parent_id
            SELECT c2.parent_id
            FROM public.cfg_units_assets_tags c2
            JOIN anc a ON c2.id = a.parent_id
        )
        SELECT 1
        FROM anc
        JOIN public.cfg_units_assets_tags r ON r.id = anc.parent_id
        WHERE r.cascade_parent_id = r.id
    ) THEN
        RAISE EXCEPTION 'NODE_UNDER_CASCADE: setor sob cascata de um ancestral indisponível; informe a disponibilidade pelo setor pai.';
    END IF;

    v_parent_name := COALESCE(
        (SELECT c.asset_tag_tag_sub_description
         FROM public.cfg_units_assets_tags c
         WHERE c.id = p_unit_asset_tag_id),
        'setor pai'
    );

    SELECT EXISTS (
        SELECT 1 FROM public.cfg_units_assets_tags d
        WHERE d.parent_id = p_unit_asset_tag_id
          AND d.is_deleted = FALSE AND d.is_active = TRUE
    ) INTO v_has_active_children;

    v_do_cascade_disable := (p_is_available = FALSE) AND v_has_active_children;
    v_do_cascade_restore := (p_is_available = TRUE) AND EXISTS (
        SELECT 1 FROM public.cfg_units_assets_tags c
        WHERE c.cascade_parent_id = p_unit_asset_tag_id
          AND c.cascade_parent_id <> c.id      -- filhos marcados, não o próprio
          AND c.is_deleted = FALSE AND c.is_active = TRUE
    );

    -- ── 1) Rate do próprio nó (regra original) ──────────────────────────
    IF p_is_available THEN
        SELECT asset_available_rate INTO v_rate
        FROM public.cfg_units_assets_tags WHERE id = p_unit_asset_tag_id;
    ELSE
        v_rate := 0;
    END IF;

    -- ── 2) Histórico do nó informado (idêntico ao RPC original) ─────────
    INSERT INTO public.assets_available (
        unit_asset_tag_id, unit_id, asset_tag_id, asset_tag_sub_id,
        is_available, asset_unavailable_reason_id, comments,
        created_user_id, reported_user_id, file_path, file_name,
        operation_record, created_at, reported_at,
        reported_latitude, reported_longitude, unit_latitude, unit_longitude,
        unit_reported_distance_m, provider_company_id, is_web, processing_id
    ) VALUES (
        p_unit_asset_tag_id,
        p_unit_id, p_asset_tag_id, p_asset_tag_sub_id,
        p_is_available, COALESCE(p_reason_id, 0), p_comments,
        p_reported_by_id, p_reported_by_id, p_file_path, p_file_name,
        p_operation_record, p_created_at::TIMESTAMP, p_reported_at::TIMESTAMP,
        p_reported_latitude, p_reported_longitude, p_unit_latitude, p_unit_longitude,
        p_unit_reported_distance, p_provider_company_id, p_is_web, 2
    ) RETURNING id INTO v_new_id;

    -- ── 3) Snapshot do nó informado (idêntico ao RPC original) + marcador ─
    UPDATE public.cfg_units_assets_tags
    SET
        last_asset_available_id = v_new_id,
        last_is_available = p_is_available,
        last_asset_available_rate = v_rate,
        last_created_at = p_created_at::TIMESTAMP,
        last_reported_at = p_reported_at::TIMESTAMP,
        last_reported_user_id = p_reported_by_id,
        last_file_path = p_file_path,
        last_file_name = p_file_name,
        last_comments = p_comments,
        last_asset_unavailable_reason_id = p_reason_id,
        last_operation_record = p_operation_record,
        last_provider_company_id = p_provider_company_id,
        last_processing_id = 2,
        cascade_parent_id = CASE
            WHEN p_is_available THEN NULL                        -- raiz liberada
            WHEN v_do_cascade_disable THEN p_unit_asset_tag_id   -- vira raiz de cascata
            ELSE cascade_parent_id END,
        pre_cascade_state = CASE WHEN p_is_available THEN NULL ELSE pre_cascade_state END
    WHERE id = p_unit_asset_tag_id;

    -- ── 4) CASCATA DESCENDO: pai indisponível → forçar descendentes ─────
    -- Afeta apenas quem não está sob outra cascata e não já estava
    -- indisponível por motivo próprio (esses permanecem intactos).
    IF v_do_cascade_disable THEN

        WITH RECURSIVE subtree AS (
            SELECT s.id, 1 AS depth
            FROM public.cfg_units_assets_tags s
            WHERE s.parent_id = p_unit_asset_tag_id
              AND s.is_deleted = FALSE AND s.is_active = TRUE
          UNION ALL
            SELECT c.id, t.depth + 1
            FROM public.cfg_units_assets_tags c
            JOIN subtree t ON c.parent_id = t.id
            WHERE c.is_deleted = FALSE AND c.is_active = TRUE
              AND t.depth < 50   -- trava de segurança contra ciclos legados em parent_id
        ), affected AS (
            SELECT t2.id, to_jsonb(t2) AS full_row
            FROM subtree
            JOIN public.cfg_units_assets_tags t2 ON t2.id = subtree.id
            WHERE t2.cascade_parent_id IS NULL
              AND t2.last_is_available IS DISTINCT FROM FALSE
        ), upd AS (
            UPDATE public.cfg_units_assets_tags u
            SET cascade_parent_id = p_unit_asset_tag_id,
                pre_cascade_state = a.full_row,
                last_is_available = FALSE,
                last_asset_available_rate = 0,
                last_asset_available_id = v_new_id,
                last_created_at = p_created_at::TIMESTAMP,
                last_reported_at = p_reported_at::TIMESTAMP,
                last_reported_user_id = p_reported_by_id,
                last_comments = 'Indisponível em cascata — setor pai: ' || v_parent_name,
                last_asset_unavailable_reason_id = p_reason_id,
                last_processing_id = 3,
                last_flow_rate = 0, last_power = 0, last_pressure = 0,
                last_voltage = 0, last_amperage = 0,
                last_operation_record = NULL,
                last_file_path = NULL, last_file_name = NULL,
                last_provider_company_id = p_provider_company_id
            FROM affected a
            WHERE u.id = a.id
            RETURNING u.id, u.unit_id, u.asset_tag_id, u.asset_tag_sub_id
        )
        INSERT INTO public.assets_available (
            unit_asset_tag_id, unit_id, asset_tag_id, asset_tag_sub_id,
            is_available, asset_unavailable_reason_id, comments,
            created_user_id, reported_user_id,
            created_at, reported_at, processing_id
        )
        SELECT upd.id, upd.unit_id, upd.asset_tag_id, upd.asset_tag_sub_id,
               FALSE, COALESCE(p_reason_id, 0),
               'Indisponibilidade em cascata — setor pai: ' || v_parent_name,
               p_reported_by_id, p_reported_by_id,
               p_created_at::TIMESTAMP, p_reported_at::TIMESTAMP, 3
        FROM upd;
    END IF;

    -- ── 5) CASCATA SUBINDO: pai disponível → restaurar snapshot dos filhos ─
    -- Quem já estava indisponível antes da cascata NÃO tem snapshot
    -- (nunca foi marcado) → permanece indisponível com motivo próprio.
    IF v_do_cascade_restore THEN

        WITH marked AS (
            SELECT id, pre_cascade_state AS pre
            FROM public.cfg_units_assets_tags
            WHERE cascade_parent_id = p_unit_asset_tag_id
              AND cascade_parent_id <> id
              AND pre_cascade_state IS NOT NULL
        ), upd AS (
            UPDATE public.cfg_units_assets_tags u
            SET last_is_available        = (m.pre->>'last_is_available')::boolean,
                last_asset_available_rate = COALESCE((m.pre->>'last_asset_available_rate')::numeric, 0),
                last_asset_available_id  = COALESCE((m.pre->>'last_asset_available_id')::bigint, 0),
                last_created_at          = (m.pre->>'last_created_at')::timestamp,
                last_reported_at         = (m.pre->>'last_reported_at')::timestamp,
                last_reported_user_id    = (m.pre->>'last_reported_user_id')::bigint,
                last_file_path           = m.pre->>'last_file_path',
                last_file_name           = m.pre->>'last_file_name',
                last_comments            = NULLIF(m.pre->>'last_comments', 'Indisponível em cascata — setor pai: ' || v_parent_name),
                last_asset_unavailable_reason_id = (m.pre->>'last_asset_unavailable_reason_id')::bigint,
                last_operation_record    = (m.pre->>'last_operation_record')::numeric,
                last_provider_company_id = (m.pre->>'last_provider_company_id')::bigint,
                last_status_id           = (m.pre->>'last_status_id')::bigint,
                last_processing_id       = COALESCE((m.pre->>'last_processing_id')::bigint, 1),
                last_flow_rate           = (m.pre->>'last_flow_rate')::numeric,
                last_power               = (m.pre->>'last_power')::numeric,
                last_pressure            = (m.pre->>'last_pressure')::numeric,
                last_voltage             = (m.pre->>'last_voltage')::numeric,
                last_amperage            = (m.pre->>'last_amperage')::numeric,
                cascade_parent_id        = NULL,
                pre_cascade_state        = NULL
            FROM marked m
            WHERE u.id = m.id
            RETURNING u.id, u.unit_id, u.asset_tag_id, u.asset_tag_sub_id, u.last_is_available
        )
        INSERT INTO public.assets_available (
            unit_asset_tag_id, unit_id, asset_tag_id, asset_tag_sub_id,
            is_available, comments,
            created_user_id, reported_user_id,
            created_at, reported_at, processing_id
        )
        SELECT upd.id, upd.unit_id, upd.asset_tag_id, upd.asset_tag_sub_id,
               upd.last_is_available,
               'Disponibilidade restaurada em cascata — setor pai: ' || v_parent_name,
               p_reported_by_id, p_reported_by_id,
               p_created_at::TIMESTAMP, p_reported_at::TIMESTAMP, 3
        FROM upd;
    END IF;

    RETURN v_new_id;
END;
$$;

-- ============================================================================
-- 3b) RPC get_unit_asset_tag_cascade_info
--     Diz se um nó está sob cascata ativa (algum ancestral é raiz de cascata)
--     e o nome da raiz, para bloquear o informe manual no formulário.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unit_asset_tag_cascade_info(p_node_id bigint)
RETURNS TABLE (under_cascade boolean, cascade_root_name text)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
    v_under boolean := FALSE;
    v_root_name TEXT := NULL;
BEGIN
    WITH RECURSIVE anc AS (
        SELECT c.parent_id
        FROM public.cfg_units_assets_tags c
        WHERE c.id = p_node_id
      UNION  -- quebra loop em caso de ciclo legado em parent_id
        SELECT c2.parent_id
        FROM public.cfg_units_assets_tags c2
        JOIN anc a ON c2.id = a.parent_id
    )
    SELECT EXISTS (
        SELECT 1 FROM anc
        JOIN public.cfg_units_assets_tags r ON r.id = anc.parent_id
        WHERE r.cascade_parent_id = r.id
    ) INTO v_under;

    IF v_under THEN
        WITH RECURSIVE anc2 AS (
            SELECT c.parent_id
            FROM public.cfg_units_assets_tags c
            WHERE c.id = p_node_id
          UNION
            SELECT c2.parent_id
            FROM public.cfg_units_assets_tags c2
            JOIN anc2 a ON c2.id = a.parent_id
        )
        SELECT r.asset_tag_tag_sub_description INTO v_root_name
        FROM anc2
        JOIN public.cfg_units_assets_tags r ON r.id = anc2.parent_id
        WHERE r.cascade_parent_id = r.id
        LIMIT 1;
    END IF;

    RETURN QUERY SELECT v_under, v_root_name;
END;
$$;

GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO postgres;
GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO anon;
GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO authenticated;

-- Mesmos grants do RPC original
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO authenticated;

-- ============================================================================
-- 4) VERIFICAÇÃO (rode manualmente no SQL Editor após aplicar)
-- ============================================================================
-- A) Colunas criadas:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'cfg_units_assets_tags'
--      AND column_name IN ('cascade_parent_id','pre_cascade_state','parent_id');
--
-- B) Processing 3 criado:
--    SELECT * FROM cfg_assets_available_processing WHERE id = 3;
--
-- C) Estado atual das cascatas (nada deve estar marcado ainda):
--    SELECT id, asset_tag_tag_sub_description, parent_id, cascade_parent_id,
--           last_is_available, pre_cascade_state IS NOT NULL AS tem_snapshot
--    FROM cfg_units_assets_tags
--    WHERE cascade_parent_id IS NOT NULL;
--
-- D) Teste manual de ciclo completo (troque 30 pelo id de um setor PAI):
--    SELECT report_unit_asset_tag_availability(30, false, 1, 'teste pai',
--        100002, null, null, 1170, 33, 1003, null,
--        to_char(now(),'YYYY-MM-DD HH24:MI:SS'), to_char(now(),'YYYY-MM-DD HH24:MI:SS'),
--        null, null, null, null, null, 16, false);
--    SELECT id, last_is_available, cascade_parent_id FROM cfg_units_assets_tags
--    WHERE parent_id = 30 OR id = 30;   -- filhos devem ficar false + marcados
--    SELECT report_unit_asset_tag_availability(30, true, null, 'volta pai',
--        100002, null, null, 1170, 33, 1003, null,
--        to_char(now(),'YYYY-MM-DD HH24:MI:SS'), to_char(now(),'YYYY-MM-DD HH24:MI:SS'),
--        null, null, null, null, null, 16, false);
--    SELECT id, last_is_available, cascade_parent_id FROM cfg_units_assets_tags
--    WHERE parent_id = 30 OR id = 30;   -- filhos restaurados, marcador limpo
