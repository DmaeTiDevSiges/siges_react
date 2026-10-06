-- Migration: Setor filho com múltiplos pais (regra OR de disponibilidade)
-- Data: 2026-10-01
-- Objetivo: permitir que um setor tenha dois ou mais pais (DAG), com disponibilidade
-- calculada por regra OR: o nó só é forçado a indisponível quando TODOS os seus pais
-- estiverem indisponíveis. Isso suporta o caso de um GMB acionado por rede E por gerador.
--
-- ⚠️ CORREÇÃO (2026-10-01): a versão anterior desta migration continha apenas a guarda
-- de bloqueio e terminava com RAISE EXCEPTION incondicional (sem o corpo funcional),
-- fazendo TODO informe de disponibilidade retornar 400 (NODE_UNDER_CASCADE).
-- Esta versão recria as funções COMPLETAS (histórico + cascata + restore) com a
-- regra OR. Re-aplicar é seguro: toda a migration é idempotente (CREATE OR REPLACE /
-- IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ============================================================================
-- 1) Tabela de vínculos secundários de setor
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cfg_units_assets_tags_links (
    unit_asset_tag_id bigint NOT NULL,
    parent_id bigint NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT cfg_units_assets_tags_links_pkey PRIMARY KEY (unit_asset_tag_id, parent_id),
    CONSTRAINT cfg_units_assets_tags_links_child_fkey
        FOREIGN KEY (unit_asset_tag_id) REFERENCES public.cfg_units_assets_tags(id) ON DELETE CASCADE,
    CONSTRAINT cfg_units_assets_tags_links_parent_fkey
        FOREIGN KEY (parent_id) REFERENCES public.cfg_units_assets_tags(id) ON DELETE CASCADE,
    CONSTRAINT cfg_units_assets_tags_links_distinct_check
        CHECK (unit_asset_tag_id <> parent_id)
);

-- Políticas RLS (idênticas a cfg_units_assets_tags)
ALTER TABLE public.cfg_units_assets_tags_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.cfg_units_assets_tags_links;
CREATE POLICY "Public read access" ON public.cfg_units_assets_tags_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert" ON public.cfg_units_assets_tags_links;
CREATE POLICY "Authenticated insert" ON public.cfg_units_assets_tags_links FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated update" ON public.cfg_units_assets_tags_links;
CREATE POLICY "Authenticated update" ON public.cfg_units_assets_tags_links FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated delete" ON public.cfg_units_assets_tags_links;
CREATE POLICY "Authenticated delete" ON public.cfg_units_assets_tags_links FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 2) Índices para performance de caminhada no DAG
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_units_assets_tags_links_parent_id
    ON public.cfg_units_assets_tags_links (parent_id);
CREATE INDEX IF NOT EXISTS idx_units_assets_tags_links_unit_asset_tag_id
    ON public.cfg_units_assets_tags_links (unit_asset_tag_id);

-- ============================================================================
-- 3) RPC: report_unit_asset_tag_availability (histórico + cascata + regra OR)
-- ============================================================================
-- Fluxo completo:
--   0) GUARDA OR: bloqueia informe apenas se o nó forçado OU TODOS os pais
--      diretos (primário + secundário) são cascade-driven. Senão, segue.
--   1) Rate do próprio nó.
--   2) Insert do histórico do informe (assets_available).
--   3) Snapshot do nó (cascade_parent_id vira raiz ao ficar indisponível).
--   4) CASCATA DESCENDO (fixpoint OR): força apenas nós alcançáveis do nó
--      informado que estejam disponíveis E cujos TODOS os pais estejam
--      indisponíveis; repete até não houver candidatos.
--   5) CASCATA SUBINDO (loop cross-root): restaura de pre_cascade_state
--      qualquer nó forçado que tenha AO MENOS UM pai disponível agora —
--      inclusive forçados por outra raiz (filho de dois pais).
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
    v_parent_name TEXT := NULL;
    v_parent_count integer := 0;
    v_cascade_driven_parents integer := 0;
    v_block boolean := FALSE;
    v_root_name TEXT := NULL;
    v_n integer := 0;
    v_reach_ids bigint[] := NULL;
BEGIN
    -- ── 0) GUARDA OR: bloquear informe apenas quando ──────────────────
    --    (a) o próprio nó estiver forçado por cascata (cascade_parent_id setado ≠ id)
    --    OU (b) TODOS os pais diretos (primário + secundário) tenham
    --         cascade_parent_id NOT NULL (cascade-driven).
    --    Regra OR: disponível se qualquer pai estiver disponível.
    BEGIN
        SELECT count(*), count(*) FILTER (WHERE pr.cascade_parent_id IS NOT NULL)
        INTO v_parent_count, v_cascade_driven_parents
        FROM (
            SELECT n.parent_id AS pid
            FROM public.cfg_units_assets_tags n
            WHERE n.id = p_unit_asset_tag_id AND n.parent_id IS NOT NULL
            UNION
            SELECT l.parent_id
            FROM public.cfg_units_assets_tags_links l
            WHERE l.unit_asset_tag_id = p_unit_asset_tag_id
        ) par
        JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid;
    EXCEPTION WHEN undefined_object THEN
        -- Tabela de links ainda não existe (migration parcial): degrade graciosamente
        v_parent_count := 0;
        v_cascade_driven_parents := 0;
    END;

    IF p_unit_asset_tag_id IS NOT NULL THEN
        IF v_parent_count > 0 AND v_cascade_driven_parents = v_parent_count THEN
            v_block := TRUE;
        END IF;
        -- Além disso, se o próprio nó já estiver marcado como forçado:
        IF NOT v_block THEN
            SELECT COALESCE(cascade_parent_id IS NOT NULL AND cascade_parent_id <> id, FALSE)
            INTO v_block
            FROM public.cfg_units_assets_tags
            WHERE id = p_unit_asset_tag_id;
        END IF;
    END IF;

    IF v_block THEN
        -- Nome da raiz de cascata (pai cascade-driven, senão a raiz do próprio nó)
        SELECT r.asset_tag_tag_sub_description INTO v_root_name
        FROM (
            SELECT n.parent_id AS pid
            FROM public.cfg_units_assets_tags n
            WHERE n.id = p_unit_asset_tag_id AND n.parent_id IS NOT NULL
            UNION
            SELECT l.parent_id
            FROM public.cfg_units_assets_tags_links l
            WHERE l.unit_asset_tag_id = p_unit_asset_tag_id
        ) par
        JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid
        JOIN public.cfg_units_assets_tags r ON r.id = pr.cascade_parent_id
        WHERE pr.cascade_parent_id IS NOT NULL
        LIMIT 1;

        IF v_root_name IS NULL THEN
            SELECT r.asset_tag_tag_sub_description INTO v_root_name
            FROM public.cfg_units_assets_tags n
            JOIN public.cfg_units_assets_tags r ON r.id = n.cascade_parent_id
            WHERE n.id = p_unit_asset_tag_id
              AND n.cascade_parent_id IS NOT NULL AND n.cascade_parent_id <> n.id
            LIMIT 1;
        END IF;

        RAISE EXCEPTION 'NODE_UNDER_CASCADE: setor sob cascata de um ancestral indisponível; informe a disponibilidade pelo setor pai (%).',
            COALESCE(v_root_name, 'setor pai');
    END IF;
    -- ═══ fim da guarda: daqui em diante o informe é LIBERADO ═══

    v_parent_name := COALESCE(
        (SELECT c.asset_tag_tag_sub_description
         FROM public.cfg_units_assets_tags c
         WHERE c.id = p_unit_asset_tag_id),
        'setor pai'
    );

    -- Filhos ativos: primários E secundários (DAG)
    SELECT EXISTS (
        SELECT 1 FROM public.cfg_units_assets_tags d
        WHERE d.parent_id = p_unit_asset_tag_id
          AND d.is_deleted = FALSE AND d.is_active = TRUE
        UNION ALL
        SELECT 1
        FROM public.cfg_units_assets_tags_links l
        JOIN public.cfg_units_assets_tags d ON d.id = l.unit_asset_tag_id
        WHERE l.parent_id = p_unit_asset_tag_id
          AND d.is_deleted = FALSE AND d.is_active = TRUE
    ) INTO v_has_active_children;

    v_do_cascade_disable := (p_is_available = FALSE) AND v_has_active_children;

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

    -- ── 3) Snapshot do nó informado + marcador de raiz de cascata ──────
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

    -- ── 4) CASCATA DESCENDO (fixpoint com regra OR) ─────────────────────
    -- Alcançáveis do nó informado (arestas primárias + secundárias, cycle-safe
    -- via UNION). Materializado uma vez: a estrutura não muda durante o loop.
    IF v_do_cascade_disable THEN
        WITH RECURSIVE edges AS (
            SELECT d.parent_id, d.id AS child_id
            FROM public.cfg_units_assets_tags d
            WHERE d.parent_id IS NOT NULL
              AND d.is_deleted = FALSE AND d.is_active = TRUE
            UNION
            SELECT l.parent_id, l.unit_asset_tag_id
            FROM public.cfg_units_assets_tags_links l
            JOIN public.cfg_units_assets_tags d ON d.id = l.unit_asset_tag_id
            WHERE d.is_deleted = FALSE AND d.is_active = TRUE
        ),
        reach AS (
            SELECT child_id AS id FROM edges WHERE parent_id = p_unit_asset_tag_id
            UNION
            SELECT e.child_id FROM edges e JOIN reach r ON e.parent_id = r.id
        )
        SELECT array_agg(id) INTO v_reach_ids FROM reach;

        -- Itera até não haver candidato: um nó só é forçado quando TODOS os
        -- seus pais estão indisponíveis (regra OR) — a força se propaga em
        -- camadas (pais primeiro, depois netos etc.).
        LOOP
            WITH candidate AS (
                SELECT c.id, to_jsonb(c) AS full_row
                FROM public.cfg_units_assets_tags c
                WHERE c.id = ANY(v_reach_ids)
                  AND c.is_deleted = FALSE AND c.is_active = TRUE
                  AND c.cascade_parent_id IS NULL
                  AND c.last_is_available IS DISTINCT FROM FALSE
                  AND EXISTS (
                      SELECT 1
                      FROM (
                          SELECT n.parent_id AS pid
                          FROM public.cfg_units_assets_tags n
                          WHERE n.id = c.id AND n.parent_id IS NOT NULL
                          UNION
                          SELECT l.parent_id
                          FROM public.cfg_units_assets_tags_links l
                          WHERE l.unit_asset_tag_id = c.id
                      ) par
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM (
                          SELECT n.parent_id AS pid
                          FROM public.cfg_units_assets_tags n
                          WHERE n.id = c.id AND n.parent_id IS NOT NULL
                          UNION
                          SELECT l.parent_id
                          FROM public.cfg_units_assets_tags_links l
                          WHERE l.unit_asset_tag_id = c.id
                      ) par
                      JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid
                      WHERE pr.last_is_available IS DISTINCT FROM FALSE
                  )
            ),
            upd AS (
                UPDATE public.cfg_units_assets_tags u
                SET cascade_parent_id = p_unit_asset_tag_id,
                    pre_cascade_state = candidate.full_row,
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
                FROM candidate
                WHERE u.id = candidate.id
                RETURNING u.id, u.unit_id, u.asset_tag_id, u.asset_tag_sub_id
            )
            -- Geo/origem herdados do pai (p_* = valores do informe do setor pai)
            INSERT INTO public.assets_available (
                unit_asset_tag_id, unit_id, asset_tag_id, asset_tag_sub_id,
                is_available, asset_unavailable_reason_id, comments,
                created_user_id, reported_user_id,
                reported_latitude, reported_longitude,
                unit_latitude, unit_longitude,
                unit_reported_distance_m, is_web,
                created_at, reported_at, processing_id
            )
            SELECT upd.id, upd.unit_id, upd.asset_tag_id, upd.asset_tag_sub_id,
                   FALSE, COALESCE(p_reason_id, 0),
                   'Indisponibilidade em cascata — setor pai: ' || v_parent_name,
                   p_reported_by_id, p_reported_by_id,
                   p_reported_latitude, p_reported_longitude,
                   p_unit_latitude, p_unit_longitude,
                   p_unit_reported_distance, p_is_web,
                   p_created_at::TIMESTAMP, p_reported_at::TIMESTAMP, 3
            FROM upd;

            GET DIAGNOSTICS v_n = ROW_COUNT;
            EXIT WHEN v_n = 0;
        END LOOP;
    END IF;

    -- ── 5) CASCATA SUBINDO (loop cross-root com regra OR) ───────────────
    -- Restaura de pre_cascade_state QUALQUER nó forçado que tenha ao menos
    -- UM pai disponível agora — inclusive nós forçados por outra raiz
    -- (filho de dois pais: um pai voltou → filho liberado). Repete até não
    -- houver restauração (propaga para netos etc.).
    -- Quem já estava indisponível antes da cascata NÃO tinha snapshot
    -- (nunca foi marcado) → permanece indisponível com motivo próprio.
    IF p_is_available THEN
        LOOP
            WITH marked AS (
                SELECT c.id, c.pre_cascade_state AS pre
                FROM public.cfg_units_assets_tags c
                WHERE c.cascade_parent_id IS NOT NULL
                  AND c.cascade_parent_id <> c.id
                  AND c.pre_cascade_state IS NOT NULL
                  AND EXISTS (
                      SELECT 1
                      FROM (
                          SELECT n.parent_id AS pid
                          FROM public.cfg_units_assets_tags n
                          WHERE n.id = c.id AND n.parent_id IS NOT NULL
                          UNION
                          SELECT l.parent_id
                          FROM public.cfg_units_assets_tags_links l
                          WHERE l.unit_asset_tag_id = c.id
                      ) par
                      JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid
                      WHERE pr.last_is_available IS DISTINCT FROM FALSE
                  )
            ),
            upd AS (
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
            -- Geo/origem também herdados do pai (mesmo evento de informe)
            INSERT INTO public.assets_available (
                unit_asset_tag_id, unit_id, asset_tag_id, asset_tag_sub_id,
                is_available, comments,
                created_user_id, reported_user_id,
                reported_latitude, reported_longitude,
                unit_latitude, unit_longitude,
                unit_reported_distance_m, is_web,
                created_at, reported_at, processing_id
            )
            SELECT upd.id, upd.unit_id, upd.asset_tag_id, upd.asset_tag_sub_id,
                   upd.last_is_available,
                   'Disponibilidade restaurada em cascata — setor pai: ' || v_parent_name,
                   p_reported_by_id, p_reported_by_id,
                   p_reported_latitude, p_reported_longitude,
                   p_unit_latitude, p_unit_longitude,
                   p_unit_reported_distance, p_is_web,
                   p_created_at::TIMESTAMP, p_reported_at::TIMESTAMP, 3
            FROM upd;

            GET DIAGNOSTICS v_n = ROW_COUNT;
            EXIT WHEN v_n = 0;
        END LOOP;
    END IF;

    RETURN v_new_id;
END;
$$;

-- Grants iguais ao RPC original
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.report_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean) TO authenticated;

-- ============================================================================
-- 4) RPC: get_unit_asset_tag_cascade_info (alinhada com a guarda OR)
-- ============================================================================
-- Retorna se o formulário deve bloquear o informe: sob cascata se
-- (a) TODOS os pais diretos são cascade-driven, OU
-- (b) o próprio nó está forçado (cascade_parent_id ≠ id).
CREATE OR REPLACE FUNCTION public.get_unit_asset_tag_cascade_info(p_node_id bigint)
RETURNS TABLE (under_cascade boolean, cascade_root_name text)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
    v_under boolean := FALSE;
    v_root_name text := NULL;
    v_parent_count integer := 0;
    v_cascade_driven_count integer := 0;
BEGIN
    BEGIN
        SELECT count(*), count(*) FILTER (WHERE pr.cascade_parent_id IS NOT NULL)
        INTO v_parent_count, v_cascade_driven_count
        FROM (
            SELECT n.parent_id AS pid
            FROM public.cfg_units_assets_tags n
            WHERE n.id = p_node_id AND n.parent_id IS NOT NULL
            UNION
            SELECT l.parent_id
            FROM public.cfg_units_assets_tags_links l
            WHERE l.unit_asset_tag_id = p_node_id
        ) par
        JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid;
    EXCEPTION WHEN undefined_object THEN
        v_parent_count := 0;
        v_cascade_driven_count := 0;
    END;

    -- (a) Todos os pais cascade-driven
    v_under := (v_parent_count > 0 AND v_cascade_driven_count = v_parent_count);

    -- (b) O próprio nó está forçado
    IF NOT v_under THEN
        SELECT COALESCE(n.cascade_parent_id IS NOT NULL AND n.cascade_parent_id <> n.id, FALSE)
        INTO v_under
        FROM public.cfg_units_assets_tags n
        WHERE n.id = p_node_id;
        v_under := COALESCE(v_under, FALSE);
    END IF;

    IF v_under THEN
        -- Raiz preferencial: o nó forçado aponta para a raiz de sua cascata
        SELECT r.asset_tag_tag_sub_description INTO v_root_name
        FROM public.cfg_units_assets_tags n
        JOIN public.cfg_units_assets_tags r ON r.id = n.cascade_parent_id
        WHERE n.id = p_node_id
          AND n.cascade_parent_id IS NOT NULL AND n.cascade_parent_id <> n.id
        LIMIT 1;

        -- Fallback: raiz via pai cascade-driven
        IF v_root_name IS NULL THEN
            SELECT r.asset_tag_tag_sub_description INTO v_root_name
            FROM (
                SELECT n.parent_id AS pid
                FROM public.cfg_units_assets_tags n
                WHERE n.id = p_node_id AND n.parent_id IS NOT NULL
                UNION
                SELECT l.parent_id
                FROM public.cfg_units_assets_tags_links l
                WHERE l.unit_asset_tag_id = p_node_id
            ) par
            JOIN public.cfg_units_assets_tags pr ON pr.id = par.pid
            JOIN public.cfg_units_assets_tags r ON r.id = pr.cascade_parent_id
            WHERE pr.cascade_parent_id IS NOT NULL
            LIMIT 1;
        END IF;
    END IF;

    RETURN QUERY SELECT v_under, v_root_name;
END;
$$;

-- Grants iguais ao RPC original
GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO postgres;
GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO anon;
GRANT ALL ON FUNCTION public.get_unit_asset_tag_cascade_info(bigint) TO authenticated;

-- ============================================================================
-- 5) VERIFICAÇÃO manual (após aplicar migration)
-- ============================================================================
-- A) Função recriada (checar que tem o corpo — não termina em RAISE vazio):
--    SELECT pg_get_functiondef('report_unit_asset_tag_availability'::regprocedure);
--
-- B) Teste básico: informe de um setor SEM pai (raiz) deve funcionar:
--    (usar o formulário da UI ou a chamada de teste da migration 20260929)
--
-- C) Estado atual das cascatas:
--    SELECT id, asset_tag_tag_sub_description, parent_id, cascade_parent_id,
--           last_is_available, pre_cascade_state IS NOT NULL AS tem_snapshot
--    FROM public.cfg_units_assets_tags
--    WHERE cascade_parent_id IS NOT NULL;
--
-- D) Teste da regra OR (dois pais, derrubar um → filho permanece informável):
--    1. Com GMB com pais [rede, gerador] e ambos disponíveis:
--       informar gerador=false → GMB NÃO deve ser forçado (rede disponível).
--    2. Informar rede=false → GMB é forçado (todos indisponíveis).
--    3. Informar rede=true → GMB restaurado (pai disponível de volta).
--
-- E) Teste de vínculo secundário:
--    INSERT INTO cfg_units_assets_tags_links (unit_asset_tag_id, parent_id, sort_order)
--    VALUES (<filho>, <segundo_pai>, 0);
--    e conferir no organograma que o filho aparece como referência sob os dois pais.

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
