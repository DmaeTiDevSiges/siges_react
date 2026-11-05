-- ============================================================================
-- Migration: 20261104_create_assets_available_integrations.sql
-- Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md (Fase 1)
-- Aplicar manualmente no SQL Editor do Supabase.
--
-- O que esta migration entrega:
--   1. cfg_assets_available_integrations          — fontes/instâncias conectadas
--   2. cfg_assets_available_integrations_mappings — ID externo → setor do SIGES
--   3. logs_assets_available_integrations_events   — trilha/idempotência
--   4. Validação de config (sem segredo, status_map booleano, reason_map inteiro)
--   5. RLS: apenas super admin lê/gerencia; escrita operacional só via RPC
--   6. RPC fn_ingest_asset_availability(...)          — contrato canônico v1
--
-- Decisões de escopo:
--   * Nada de coluna por fornecedor em cfg_units_assets_tags.
--   * IDs externos são text (não presumir numérico).
--   * A RPC NÃO insere direto em assets_available: chama a RPC oficial
--     report_unit_asset_tag_availability (histórico + estado + cascata).
--   * Autoria humana fica NULL; comments recebe apenas o marcador fixo.
--   * A credencial usada pelo n8n é a mesma dos demais workflows do SIGES
--     (credencial Supabase de serviço). Por isso EXECUTE é concedido apenas a
--     service_role; anon/authenticated não executam a ingestão.
-- ============================================================================

BEGIN;

-- ── 0) Pré-requisitos ──────────────────────────────────────────────────────
DO $$
BEGIN
    IF to_regclass('public.cfg_companies') IS NULL
       OR to_regclass('public.cfg_units_assets_tags') IS NULL
       OR to_regclass('public.assets_available') IS NULL
       OR to_regclass('public.units') IS NULL
       OR to_regclass('public.cfg_assets_unavailable_reasons') IS NULL
       OR to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION
            'Estrutura base ausente: aplique esta migration depois do schema de ativos/disponibilidade';
    END IF;

    IF to_regprocedure(
        'public.report_unit_asset_tag_availability(integer,boolean,integer,text,integer,text,text,integer,integer,integer,numeric,text,text,double precision,double precision,double precision,double precision,double precision,integer,boolean)'
    ) IS NULL THEN
        RAISE EXCEPTION
            'RPC report_unit_asset_tag_availability não encontrada; aplique 20261001_unit_sector_multi_parent.sql antes';
    END IF;
END
$$;

-- ── 1) Integrações ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cfg_assets_available_integrations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES public.cfg_companies(id) ON DELETE RESTRICT,
    -- Empresa/provedor interno que fornece a leitura (opcional, validado no SIGES).
    provider_company_id BIGINT REFERENCES public.cfg_companies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    provider_code TEXT NOT NULL,
    base_url TEXT,
    -- Parâmetros NÃO secretos e específicos do adaptador.
    -- Ex.: {"status_path":"status","status_map":{"ON":true,"OFF":false}}
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    created_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    updated_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT cfg_assets_available_integrations_name_not_blank
        CHECK (btrim(name) <> ''),
    CONSTRAINT cfg_assets_available_integrations_provider_code_format
        CHECK (provider_code ~ '^[a-z0-9][a-z0-9_-]*$'),
    CONSTRAINT cfg_assets_available_integrations_config_object
        CHECK (jsonb_typeof(config) = 'object'),
    CONSTRAINT cfg_assets_available_integrations_base_url_http
        CHECK (base_url IS NULL OR base_url ~* '^https?://[^[:space:]]+$'),
    CONSTRAINT uq_cfg_assets_available_integrations_company_name
        UNIQUE (company_id, name)
);

COMMENT ON TABLE public.cfg_assets_available_integrations IS
    'Fontes externas de disponibilidade conectadas ao SIGES. Credenciais NÃO ficam aqui: use Credentials do n8n/secret manager.';
COMMENT ON COLUMN public.cfg_assets_available_integrations.config IS
    'Parâmetros não secretos do adaptador. status_path + status_map traduzem valores externos para booleano; reason_map traduz motivo externo para cfg_assets_unavailable_reasons.id.';

-- ── 2) Mapeamentos ID externo → setor/unidade do SIGES ─────────────────────
CREATE TABLE IF NOT EXISTS public.cfg_assets_available_integrations_mappings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id BIGINT NOT NULL
        REFERENCES public.cfg_assets_available_integrations(id) ON DELETE RESTRICT,
    external_id TEXT NOT NULL,
    unit_asset_tag_id BIGINT NOT NULL
        REFERENCES public.cfg_units_assets_tags(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Última leitura aplicada/observada nesta integração (idempotência e ordem).
    last_source_reported_at TIMESTAMP WITHOUT TIME ZONE,
    last_is_available BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    created_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    updated_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT cfg_assets_available_integrations_mappings_external_id_not_blank
        CHECK (btrim(external_id) <> ''),
    CONSTRAINT uq_cfg_assets_available_integrations_mappings_integration_external
        UNIQUE (integration_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_assets_available_integrations_mappings_unit_asset_tag
    ON public.cfg_assets_available_integrations_mappings(unit_asset_tag_id);
CREATE INDEX IF NOT EXISTS idx_assets_available_integrations_mappings_integration_active
    ON public.cfg_assets_available_integrations_mappings(integration_id)
    WHERE is_active;

COMMENT ON TABLE public.cfg_assets_available_integrations_mappings IS
    'Relaciona o ID externo (texto, como recebido da API) a exatamente um setor/ativo interno. Duas integrações podem apontar para o mesmo setor; a precedência deve ser definida fora daqui.';

-- ── 3) Logs e idempotência ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logs_assets_available_integrations_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id BIGINT NOT NULL
        REFERENCES public.cfg_assets_available_integrations(id) ON DELETE RESTRICT,
    mapping_id BIGINT
        REFERENCES public.cfg_assets_available_integrations_mappings(id) ON DELETE SET NULL,
    unit_asset_tag_id BIGINT
        REFERENCES public.cfg_units_assets_tags(id) ON DELETE SET NULL,
    external_id TEXT,
    source_event_id TEXT,
    source_reported_at TIMESTAMP WITHOUT TIME ZONE,
    is_available BOOLEAN,
    result TEXT NOT NULL CHECK (result IN (
        'applied', 'unchanged', 'duplicate', 'pending_mapping', 'rejected', 'error'
    )),
    -- Mensagem sanitizada (sem segredo/payload). Ver fn_log_... .
    message TEXT,
    asset_available_id BIGINT REFERENCES public.assets_available(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now())
);

CREATE INDEX IF NOT EXISTS idx_assets_available_integrations_events_integration_created
    ON public.logs_assets_available_integrations_events(integration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_available_integrations_events_created
    ON public.logs_assets_available_integrations_events(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_available_integrations_events_unit_asset_tag
    ON public.logs_assets_available_integrations_events(unit_asset_tag_id);

-- Idempotência forte: um mesmo evento externo só pode ser APLICADO uma vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_available_integrations_events_applied_event
    ON public.logs_assets_available_integrations_events(integration_id, source_event_id)
    WHERE result = 'applied' AND source_event_id IS NOT NULL;

COMMENT ON TABLE public.logs_assets_available_integrations_events IS
    'Execuções e itens recebidos das integrações. Não gravar tokens/cabeçalhos/payloads sensíveis. Retenção sugerida: definir antes da ativação (ex.: 90 dias).';

-- ── 4) Helpers de validação ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_jsonb_contains_forbidden_keys(
    p_value JSONB,
    p_forbidden_keys TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $$
    WITH RECURSIVE walk(value) AS (
        SELECT p_value
        WHERE p_value IS NOT NULL
        UNION ALL
        SELECT child.value
        FROM walk w
        CROSS JOIN LATERAL (
            SELECT e.value
            FROM jsonb_each(
                CASE WHEN jsonb_typeof(w.value) = 'object' THEN w.value ELSE '{}'::jsonb END
            ) AS e(key, value)
            UNION ALL
            SELECT a.value
            FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(w.value) = 'array' THEN w.value ELSE '[]'::jsonb END
            ) AS a(value)
        ) AS child
    )
    SELECT EXISTS (
        SELECT 1
        FROM walk w
        WHERE jsonb_typeof(w.value) = 'object'
          AND EXISTS (
              SELECT 1
              FROM jsonb_object_keys(w.value) AS k(key)
              WHERE lower(k.key) = ANY (p_forbidden_keys)
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_validate_assets_available_integration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.config IS NULL THEN
        NEW.config := '{}'::jsonb;
    END IF;

    IF jsonb_typeof(NEW.config) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'config da integração deve ser um objeto JSON'
            USING ERRCODE = '22023';
    END IF;

    -- Segredo nunca na configuração: vai para Credentials do n8n/secret manager.
    IF public.fn_jsonb_contains_forbidden_keys(
        NEW.config,
        ARRAY[
            'api_key', 'apikey', 'api_secret', 'password', 'token',
            'access_token', 'refresh_token', 'secret', 'client_secret',
            'authorization', 'auth_header', 'bearer'
        ]
    ) THEN
        RAISE EXCEPTION 'config não pode conter credenciais; use as Credentials do n8n/secret manager'
            USING ERRCODE = '22023';
    END IF;

    IF NEW.config ? 'status_path' THEN
        IF jsonb_typeof(NEW.config -> 'status_path') IS DISTINCT FROM 'string'
           OR btrim(NEW.config ->> 'status_path') = '' THEN
            RAISE EXCEPTION 'status_path deve ser um caminho não vazio'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    IF NEW.config ? 'status_map' THEN
        IF jsonb_typeof(NEW.config -> 'status_map') IS DISTINCT FROM 'object' THEN
            RAISE EXCEPTION 'status_map deve ser um objeto'
                USING ERRCODE = '22023';
        END IF;

        IF NOT (NEW.config ? 'status_path') THEN
            RAISE EXCEPTION 'status_map exige status_path'
                USING ERRCODE = '22023';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM jsonb_object_keys(NEW.config -> 'status_map')
        ) THEN
            RAISE EXCEPTION 'status_map não pode ser vazio'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM jsonb_each(NEW.config -> 'status_map') AS e(key, value)
            WHERE jsonb_typeof(e.value) IS DISTINCT FROM 'boolean'
        ) THEN
            RAISE EXCEPTION 'status_map deve mapear valores externos para booleanos'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    IF NEW.config ? 'reason_map' THEN
        IF jsonb_typeof(NEW.config -> 'reason_map') IS DISTINCT FROM 'object' THEN
            RAISE EXCEPTION 'reason_map deve ser um objeto'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM jsonb_each(NEW.config -> 'reason_map') AS e(key, value)
            WHERE jsonb_typeof(e.value) IS DISTINCT FROM 'number'
               OR (e.value #>> '{}') !~ '^[0-9]{1,10}$'
               OR (e.value #>> '{}')::BIGINT > 2147483647
        ) THEN
            RAISE EXCEPTION 'reason_map deve mapear códigos externos para IDs internos inteiros'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    IF NEW.config ? 'require_reason'
       AND jsonb_typeof(NEW.config -> 'require_reason') IS DISTINCT FROM 'boolean' THEN
        RAISE EXCEPTION 'require_reason deve ser booleano'
            USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_touch_assets_available_integration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := timezone('America/Sao_Paulo', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_assets_available_integration
    ON public.cfg_assets_available_integrations;
CREATE TRIGGER trg_validate_assets_available_integration
BEFORE INSERT OR UPDATE OF config, name, provider_code
ON public.cfg_assets_available_integrations
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_assets_available_integration();

DROP TRIGGER IF EXISTS trg_touch_assets_available_integration
    ON public.cfg_assets_available_integrations;
CREATE TRIGGER trg_touch_assets_available_integration
BEFORE UPDATE ON public.cfg_assets_available_integrations
FOR EACH ROW
EXECUTE FUNCTION public.fn_touch_assets_available_integration();

DROP TRIGGER IF EXISTS trg_touch_assets_available_integration_mapping
    ON public.cfg_assets_available_integrations_mappings;
CREATE TRIGGER trg_touch_assets_available_integration_mapping
BEFORE UPDATE ON public.cfg_assets_available_integrations_mappings
FOR EACH ROW
EXECUTE FUNCTION public.fn_touch_assets_available_integration();

-- ── 5) RLS e permissões ────────────────────────────────────────────────────
ALTER TABLE public.cfg_assets_available_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfg_assets_available_integrations_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_assets_available_integrations_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.cfg_assets_available_integrations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.cfg_assets_available_integrations_mappings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.logs_assets_available_integrations_events FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.cfg_assets_available_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.cfg_assets_available_integrations_mappings TO authenticated;
GRANT SELECT
    ON public.logs_assets_available_integrations_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.cfg_assets_available_integrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.cfg_assets_available_integrations_mappings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.logs_assets_available_integrations_events TO service_role;

-- Tabelas com IDENTITY exigem USAGE na sequence para INSERT via PostgREST.
GRANT USAGE, SELECT ON SEQUENCE
    public.cfg_assets_available_integrations_id_seq TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE
    public.cfg_assets_available_integrations_mappings_id_seq TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE
    public.logs_assets_available_integrations_events_id_seq TO service_role;

-- A Fase 4 (tela administrativa) cria rota/permissões próprias. Até lá,
-- somente super admin acessa pela aplicação; a ingestão usa service_role.
DROP POLICY IF EXISTS "Super admins manage asset availability integrations"
    ON public.cfg_assets_available_integrations;
CREATE POLICY "Super admins manage asset availability integrations"
    ON public.cfg_assets_available_integrations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
        )
    );

DROP POLICY IF EXISTS "Super admins manage asset availability integration mappings"
    ON public.cfg_assets_available_integrations_mappings;
CREATE POLICY "Super admins manage asset availability integration mappings"
    ON public.cfg_assets_available_integrations_mappings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
        )
    );

DROP POLICY IF EXISTS "Super admins read asset availability integration events"
    ON public.logs_assets_available_integrations_events;
CREATE POLICY "Super admins read asset availability integration events"
    ON public.logs_assets_available_integrations_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
        )
    );

-- ── 6) Log sanitizado ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_log_assets_available_integration_event(
    p_integration_id BIGINT,
    p_mapping_id BIGINT,
    p_unit_asset_tag_id BIGINT,
    p_external_id TEXT,
    p_source_event_id TEXT,
    p_source_reported_at TIMESTAMP WITHOUT TIME ZONE,
    p_is_available BOOLEAN,
    p_result TEXT,
    p_message TEXT,
    p_asset_available_id BIGINT
)
RETURNS BIGINT
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
    INSERT INTO public.logs_assets_available_integrations_events (
        integration_id, mapping_id, unit_asset_tag_id, external_id,
        source_event_id, source_reported_at, is_available, result, message,
        asset_available_id
    ) VALUES (
        p_integration_id, p_mapping_id, p_unit_asset_tag_id, p_external_id,
        p_source_event_id, p_source_reported_at, p_is_available, p_result,
        left(regexp_replace(COALESCE(p_message, ''), '[[:cntrl:]]+', ' ', 'g'), 500),
        p_asset_available_id
    )
    RETURNING id;
$$;

REVOKE ALL ON FUNCTION public.fn_log_assets_available_integration_event(
    bigint, bigint, bigint, text, text, timestamp without time zone,
    boolean, text, text, bigint
) FROM PUBLIC, anon, authenticated;

-- ── 7) Ingestão ───────────────────────────────────────────────────────────
-- Contrato canônico v1 (um item):
--   { "external_id": "25", "status": "available",
--     "source_reported_at": "2026-11-04T18:17:51-03:00",
--     "source_event_id": null, "reason": null }
--
-- Regras aplicadas:
--   * external_id: texto/número, obrigatório, resolvido pelo mapeamento.
--   * status: available/unavailable OU valor presente em config.status_map.
--   * source_reported_at: ISO 8601 com offset; convertido para America/Sao_Paulo.
--   * reason: opcional; só vira asset_unavailable_reason_id se config.reason_map mapear.
--   * IDs internos vêm do SIGES (nunca do payload).
--   * Leitura repetida/atrasada não gera histórico; evento repetido não aplica 2x.
--   * Autoria humana NULL e comments fixo.
CREATE OR REPLACE FUNCTION public.fn_ingest_asset_availability(
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
            IF v_mapping.last_source_reported_at IS NOT NULL
               AND v_source_at <= v_mapping.last_source_reported_at THEN
                RAISE EXCEPTION 'Leitura mais antiga ou igual à última aplicada para este mapeamento'
                    USING ERRCODE = '22023';
            END IF;

            IF v_node.last_reported_at IS NOT NULL
               AND v_node.last_reported_at > v_source_at THEN
                RAISE EXCEPTION 'Leitura mais antiga que o estado atual do ativo'
                    USING ERRCODE = '22023';
            END IF;

            -- ── Sem mudança relevante: não cria histórico ──────────────
            IF v_node.last_is_available IS NOT DISTINCT FROM v_is_available
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

REVOKE ALL ON FUNCTION public.fn_ingest_asset_availability(bigint, jsonb, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_ingest_asset_availability(bigint, jsonb, integer)
    TO service_role;

COMMENT ON FUNCTION public.fn_ingest_asset_availability(bigint, jsonb, integer) IS
    'Ingestão do contrato canônico v1 de disponibilidade. Resolve mapeamento, valida escopo, deduplica e aplica via report_unit_asset_tag_availability. Executável apenas por service_role.';

NOTIFY pgrst, 'reload schema';

COMMIT;
