-- ==============================================================================
-- Migration: 20261107_fn_add_assets_available_record_every_reading.sql
-- Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md
-- Aplicar manualmente no SQL Editor do Supabase APÓS
-- 20261107_fix_fn_add_assets_available_same_reading.sql.
--
-- Nova opção por integração: config.record_every_reading (boolean).
--   true  → toda leitura recebida gera linha em assets_available (via
--           report_unit_asset_tag_availability), mesmo que repetida ou sem
--           mudança de estado.
--   false/ausente → comportamento padrão: só grava quando o estado muda.
-- Continuam valendo: validação do contrato, mapeamento, escopo de empresa,
-- motivo (reason_map), rejeição de leitura MAIS ANTIGA e evento já aplicado.
--
-- Ligar para a GuaibaFlow (integração 8):
--   UPDATE cfg_assets_available_integrations
--      SET config = config || '{"record_every_reading": true}'::jsonb
--    WHERE id = 8;
-- Desligar depois: config - 'record_every_reading'.
--
-- Idempotente (CREATE OR REPLACE).
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_add_assets_available(
    p_integration_id BIGINT,
    p_items JSONB,
    p_contract_version INTEGER DEFAULT 1
)
RETURNS TABLE (
    external_id TEXT,
    result TEXT,
    message TEXT,
    asset_available_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_integration public.cfg_assets_available_integrations%ROWTYPE;
    v_mapping public.cfg_assets_available_integrations_mappings%ROWTYPE;
    v_node public.cfg_units_assets_tags%ROWTYPE;
    v_item JSONB;
    v_external_id TEXT;
    v_status TEXT;
    v_is_available BOOLEAN;
    v_source_text TEXT;
    v_source_tz TIMESTAMPTZ;
    v_source_at TIMESTAMP WITHOUT TIME ZONE;
    v_event_id TEXT;
    v_reason TEXT;
    v_reason_id INTEGER;
    v_unit_company_id BIGINT;
    v_duplicate_event BOOLEAN;
    v_new_asset_available_id INTEGER;
    v_processed_at_text TEXT;
    v_error TEXT;
    v_outcome TEXT;
    v_count INTEGER;
BEGIN
    IF p_contract_version IS DISTINCT FROM 1 THEN
        RAISE EXCEPTION 'Versão de contrato não suportada: %', p_contract_version
            USING ERRCODE = '22023';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'p_items deve ser um array JSON'
            USING ERRCODE = '22023';
    END IF;

    v_count := jsonb_array_length(p_items);
    IF v_count = 0 OR v_count > 500 THEN
        RAISE EXCEPTION 'O lote deve conter entre 1 e 500 itens'
            USING ERRCODE = '22023';
    END IF;

    SELECT i.* INTO v_integration
    FROM public.cfg_assets_available_integrations i
    WHERE i.id = p_integration_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integração % não encontrada', p_integration_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_integration.is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Integração % está inativa', p_integration_id
            USING ERRCODE = '55000';
    END IF;

    -- Serializa lotes da mesma integração: a checagem de idempotência e a
    -- aplicação do evento passam a ser atômicas também sob concorrência.
    PERFORM pg_advisory_xact_lock(
        hashtextextended('assets_available_integration:' || p_integration_id::TEXT, 0)
    );

    v_processed_at_text := to_char(
        timezone('America/Sao_Paulo', now()),
        'YYYY-MM-DD HH24:MI:SS'
    );

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) AS items(value)
    LOOP
        external_id := NULL;
        result := NULL;
        message := NULL;
        asset_available_id := NULL;

        v_external_id := NULL;
        v_status := NULL;
        v_is_available := NULL;
        v_source_text := NULL;
        v_source_tz := NULL;
        v_source_at := NULL;
        v_event_id := NULL;
        v_reason := NULL;
        v_reason_id := NULL;
        v_unit_company_id := NULL;
        v_duplicate_event := FALSE;
        v_new_asset_available_id := NULL;
        v_mapping := NULL;
        v_node := NULL;

        BEGIN
            -- ── Validação do contrato ───────────────────────────────────
            IF v_item IS NULL OR jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
                RAISE EXCEPTION 'Cada item deve ser um objeto JSON'
                    USING ERRCODE = '22023';
            END IF;

            IF jsonb_typeof(v_item -> 'external_id') IS NULL
               OR jsonb_typeof(v_item -> 'external_id') NOT IN ('string', 'number') THEN
                RAISE EXCEPTION 'external_id é obrigatório e deve ser texto ou número'
                    USING ERRCODE = '22023';
            END IF;

            v_external_id := v_item ->> 'external_id';
            IF btrim(v_external_id) = '' OR length(v_external_id) > 200 THEN
                RAISE EXCEPTION 'external_id deve ter entre 1 e 200 caracteres'
                    USING ERRCODE = '22023';
            END IF;

            IF jsonb_typeof(v_item -> 'status') IS DISTINCT FROM 'string' THEN
                RAISE EXCEPTION 'status é obrigatório e deve ser texto'
                    USING ERRCODE = '22023';
            END IF;

            v_status := btrim(v_item ->> 'status');
            IF v_status IN ('available', 'unavailable') THEN
                v_is_available := (v_status = 'available');
            ELSIF v_integration.config ? 'status_map' THEN
                IF jsonb_typeof(v_integration.config -> 'status_map' -> v_status)
                   IS DISTINCT FROM 'boolean' THEN
                    RAISE EXCEPTION 'Status externo não mapeado para esta integração: %',
                        left(v_status, 80)
                        USING ERRCODE = '22023';
                END IF;
                v_is_available := (v_integration.config -> 'status_map' ->> v_status)::BOOLEAN;
            ELSE
                RAISE EXCEPTION 'status deve ser available ou unavailable'
                    USING ERRCODE = '22023';
            END IF;

            IF jsonb_typeof(v_item -> 'source_reported_at') IS DISTINCT FROM 'string' THEN
                RAISE EXCEPTION 'source_reported_at é obrigatório e deve ser texto ISO 8601'
                    USING ERRCODE = '22023';
            END IF;

            v_source_text := btrim(v_item ->> 'source_reported_at');
            IF v_source_text !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' THEN
                RAISE EXCEPTION 'source_reported_at deve informar offset explícito (ex.: -03:00 ou Z)'
                    USING ERRCODE = '22023';
            END IF;

            BEGIN
                v_source_tz := v_source_text::TIMESTAMPTZ;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'source_reported_at inválido: %', left(v_source_text, 80)
                    USING ERRCODE = '22023';
            END;

            v_source_at := v_source_tz AT TIME ZONE 'America/Sao_Paulo';

            IF jsonb_typeof(v_item -> 'source_event_id') IS NOT NULL
               AND jsonb_typeof(v_item -> 'source_event_id') <> 'null' THEN
                IF jsonb_typeof(v_item -> 'source_event_id') NOT IN ('string', 'number') THEN
                    RAISE EXCEPTION 'source_event_id deve ser texto ou número'
                        USING ERRCODE = '22023';
                END IF;
                v_event_id := v_item ->> 'source_event_id';
                IF btrim(v_event_id) = '' OR length(v_event_id) > 200 THEN
                    RAISE EXCEPTION 'source_event_id deve ter entre 1 e 200 caracteres'
                        USING ERRCODE = '22023';
                END IF;
            END IF;

            IF jsonb_typeof(v_item -> 'reason') IS NOT NULL
               AND jsonb_typeof(v_item -> 'reason') <> 'null' THEN
                IF jsonb_typeof(v_item -> 'reason') <> 'string' THEN
                    RAISE EXCEPTION 'reason deve ser texto'
                        USING ERRCODE = '22023';
                END IF;
                v_reason := NULLIF(btrim(v_item ->> 'reason'), '');
            END IF;

            -- ── Idempotência por evento externo ────────────────────────
            IF v_event_id IS NOT NULL THEN
                SELECT EXISTS (
                    SELECT 1
                    FROM public.logs_assets_available_integrations_events l
                    WHERE l.integration_id = v_integration.id
                      AND l.source_event_id = v_event_id
                      AND l.result = 'applied'
                ) INTO v_duplicate_event;

                IF v_duplicate_event THEN
                    PERFORM public.fn_log_assets_available_integration_event(
                        p_integration_id => v_integration.id,
                        p_mapping_id => NULL,
                        p_unit_asset_tag_id => NULL,
                        p_external_id => v_external_id,
                        p_source_event_id => v_event_id,
                        p_source_reported_at => v_source_at,
                        p_is_available => v_is_available,
                        p_result => 'duplicate',
                        p_message => 'Evento externo já aplicado',
                        p_asset_available_id => NULL
                    );
                    external_id := v_external_id;
                    result := 'duplicate';
                    message := 'Evento externo já aplicado';
                    RETURN NEXT;
                    CONTINUE;
                END IF;
            END IF;

            -- ── Mapeamento ─────────────────────────────────────────────
            SELECT m.* INTO v_mapping
            FROM public.cfg_assets_available_integrations_mappings m
            WHERE m.integration_id = v_integration.id
              AND m.external_id = v_external_id;

            IF NOT FOUND THEN
                PERFORM public.fn_log_assets_available_integration_event(
                    p_integration_id => v_integration.id,
                    p_mapping_id => NULL,
                    p_unit_asset_tag_id => NULL,
                    p_external_id => v_external_id,
                    p_source_event_id => v_event_id,
                    p_source_reported_at => v_source_at,
                    p_is_available => v_is_available,
                    p_result => 'pending_mapping',
                    p_message => 'ID externo sem mapeamento',
                    p_asset_available_id => NULL
                );
                external_id := v_external_id;
                result := 'pending_mapping';
                message := 'ID externo sem mapeamento';
                RETURN NEXT;
                CONTINUE;
            END IF;

            IF v_mapping.is_active IS NOT TRUE THEN
                PERFORM public.fn_log_assets_available_integration_event(
                    p_integration_id => v_integration.id,
                    p_mapping_id => v_mapping.id,
                    p_unit_asset_tag_id => v_mapping.unit_asset_tag_id,
                    p_external_id => v_external_id,
                    p_source_event_id => v_event_id,
                    p_source_reported_at => v_source_at,
                    p_is_available => v_is_available,
                    p_result => 'pending_mapping',
                    p_message => 'Mapeamento inativo',
                    p_asset_available_id => NULL
                );
                external_id := v_external_id;
                result := 'pending_mapping';
                message := 'Mapeamento inativo';
                RETURN NEXT;
                CONTINUE;
            END IF;

            SELECT t.* INTO v_node
            FROM public.cfg_units_assets_tags t
            WHERE t.id = v_mapping.unit_asset_tag_id;

            IF NOT FOUND OR v_node.is_deleted IS TRUE OR v_node.is_active IS NOT TRUE THEN
                RAISE EXCEPTION 'Ativo mapeado não existe ou está inativo'
                    USING ERRCODE = '22023';
            END IF;

            -- Escopo de empresa: o alvo precisa pertencer à empresa da integração.
            SELECT u.company_id INTO v_unit_company_id
            FROM public.units u
            WHERE u.id = v_node.unit_id;

            IF v_unit_company_id IS NULL
               OR v_unit_company_id IS DISTINCT FROM v_integration.company_id THEN
                RAISE EXCEPTION 'Unidade do ativo fora do escopo da empresa da integração'
                    USING ERRCODE = '22023';
            END IF;

            -- ── Motivo externo → motivo interno (somente mapa explícito) ─
            IF v_reason IS NOT NULL AND v_integration.config ? 'reason_map' THEN
                IF jsonb_typeof(v_integration.config -> 'reason_map' -> v_reason)
                   IS DISTINCT FROM 'number' THEN
                    RAISE EXCEPTION 'Motivo externo não mapeado: %', left(v_reason, 80)
                        USING ERRCODE = '22023';
                END IF;

                v_reason_id := (v_integration.config -> 'reason_map' ->> v_reason)::INTEGER;

                IF NOT EXISTS (
                    SELECT 1
                    FROM public.cfg_assets_unavailable_reasons r
                    WHERE r.id = v_reason_id
                      AND r.is_available IS TRUE
                      AND r.is_deleted IS NOT TRUE
                ) THEN
                    RAISE EXCEPTION 'Motivo interno % inexistente ou inativo', v_reason_id
                        USING ERRCODE = '22023';
                END IF;
            END IF;

            IF v_integration.config ->> 'require_reason' = 'true'
               AND v_is_available IS FALSE
               AND v_reason IS NULL THEN
                RAISE EXCEPTION 'Motivo é obrigatório para indisponibilidade nesta integração'
                    USING ERRCODE = '22023';
            END IF;

            -- ── Ordem das leituras ────────────────────────────────────
            -- Mesma leitura já processada: a fonte ainda não gerou leitura nova
            -- (ex.: GuaibaFlow lê a cada ~15 min). Não é erro → 'unchanged'.
            -- config.record_every_reading = true: grava toda leitura em
            -- assets_available, mesmo repetida ou sem mudança de estado.
            IF (v_integration.config ->> 'record_every_reading') IS DISTINCT FROM 'true'
               AND v_mapping.last_source_reported_at IS NOT NULL
               AND v_source_at = v_mapping.last_source_reported_at THEN
                PERFORM public.fn_log_assets_available_integration_event(
                    p_integration_id => v_integration.id,
                    p_mapping_id => v_mapping.id,
                    p_unit_asset_tag_id => v_mapping.unit_asset_tag_id,
                    p_external_id => v_external_id,
                    p_source_event_id => v_event_id,
                    p_source_reported_at => v_source_at,
                    p_is_available => v_is_available,
                    p_result => 'unchanged',
                    p_message => 'Leitura já processada (sem leitura nova na fonte)',
                    p_asset_available_id => NULL
                );
                external_id := v_external_id;
                result := 'unchanged';
                message := 'Leitura já processada (sem leitura nova na fonte)';
                RETURN NEXT;
                CONTINUE;
            END IF;

            IF v_mapping.last_source_reported_at IS NOT NULL
               AND v_source_at < v_mapping.last_source_reported_at THEN
                RAISE EXCEPTION 'Leitura mais antiga que a última aplicada para este mapeamento'
                    USING ERRCODE = '22023';
            END IF;

            IF v_node.last_reported_at IS NOT NULL
               AND v_node.last_reported_at > v_source_at THEN
                RAISE EXCEPTION 'Leitura mais antiga que o estado atual do ativo'
                    USING ERRCODE = '22023';
            END IF;

            -- ── Sem mudança relevante: não cria histórico ──────────────
            -- (ignorado quando config.record_every_reading = true)
            IF (v_integration.config ->> 'record_every_reading') IS DISTINCT FROM 'true'
               AND v_node.last_is_available IS NOT DISTINCT FROM v_is_available
               AND (
                   v_is_available IS TRUE
                   OR COALESCE(v_node.last_asset_unavailable_reason_id, 0)
                      = COALESCE(v_reason_id, 0)
               ) THEN
                UPDATE public.cfg_assets_available_integrations_mappings m
                SET last_source_reported_at = v_source_at,
                    last_is_available = v_is_available,
                    updated_at = timezone('America/Sao_Paulo', now())
                WHERE m.id = v_mapping.id;

                PERFORM public.fn_log_assets_available_integration_event(
                    p_integration_id => v_integration.id,
                    p_mapping_id => v_mapping.id,
                    p_unit_asset_tag_id => v_mapping.unit_asset_tag_id,
                    p_external_id => v_external_id,
                    p_source_event_id => v_event_id,
                    p_source_reported_at => v_source_at,
                    p_is_available => v_is_available,
                    p_result => 'unchanged',
                    p_message => 'Estado sem mudança relevante',
                    p_asset_available_id => NULL
                );

                external_id := v_external_id;
                result := 'unchanged';
                message := 'Estado sem mudança relevante';
                RETURN NEXT;
                CONTINUE;
            END IF;

            -- ── Aplicação pelo fluxo oficial (histórico + estado + cascata) ─
            v_new_asset_available_id := public.report_unit_asset_tag_availability(
                p_unit_asset_tag_id => v_node.id::INTEGER,
                p_is_available => v_is_available,
                p_reason_id => v_reason_id,
                p_comments => 'Leitura obtida via integração de APIs.',
                p_reported_by_id => NULL,
                p_file_path => NULL,
                p_file_name => NULL,
                p_unit_id => v_node.unit_id::INTEGER,
                p_asset_tag_id => v_node.asset_tag_id::INTEGER,
                p_asset_tag_sub_id => v_node.asset_tag_sub_id::INTEGER,
                p_operation_record => NULL,
                p_created_at => v_processed_at_text,
                p_reported_at => to_char(v_source_at, 'YYYY-MM-DD HH24:MI:SS'),
                p_reported_latitude => NULL,
                p_reported_longitude => NULL,
                p_unit_latitude => NULL,
                p_unit_longitude => NULL,
                p_unit_reported_distance => NULL,
                p_provider_company_id => v_integration.provider_company_id::INTEGER,
                p_is_web => FALSE
            );

            UPDATE public.cfg_assets_available_integrations_mappings m
            SET last_source_reported_at = v_source_at,
                last_is_available = v_is_available,
                updated_at = timezone('America/Sao_Paulo', now())
            WHERE m.id = v_mapping.id;

            PERFORM public.fn_log_assets_available_integration_event(
                p_integration_id => v_integration.id,
                p_mapping_id => v_mapping.id,
                p_unit_asset_tag_id => v_mapping.unit_asset_tag_id,
                p_external_id => v_external_id,
                p_source_event_id => v_event_id,
                p_source_reported_at => v_source_at,
                p_is_available => v_is_available,
                p_result => 'applied',
                p_message => NULL,
                p_asset_available_id => v_new_asset_available_id
            );

            external_id := v_external_id;
            result := 'applied';
            message := NULL;
            asset_available_id := v_new_asset_available_id;
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            -- Cada item é atômico: falha aqui desfaz só as alterações do item.
            v_error := left(
                regexp_replace(SQLERRM, '[[:cntrl:]]+', ' ', 'g'),
                500
            );
            v_outcome := CASE WHEN SQLSTATE = '22023' THEN 'rejected' ELSE 'error' END;

            PERFORM public.fn_log_assets_available_integration_event(
                p_integration_id => v_integration.id,
                p_mapping_id => v_mapping.id,
                p_unit_asset_tag_id => v_mapping.unit_asset_tag_id,
                p_external_id => v_external_id,
                p_source_event_id => v_event_id,
                p_source_reported_at => v_source_at,
                p_is_available => v_is_available,
                p_result => v_outcome,
                p_message => v_error,
                p_asset_available_id => NULL
            );

            external_id := v_external_id;
            result := v_outcome;
            message := v_error;
            asset_available_id := NULL;
            RETURN NEXT;
        END;
    END LOOP;

    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_add_assets_available(bigint, jsonb, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_add_assets_available(bigint, jsonb, integer)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
