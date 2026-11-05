-- ============================================================
-- Validação manual: integrações externas de disponibilidade (Fase 1)
-- Data: 2026-11-04
--
-- COMO USAR (SQL Editor do Supabase)
--   1. Rode primeiro a migration
--      20261104_create_assets_available_integrations.sql
--   2. Rode ESTE arquivo inteiro (Execute).
--   3. Saída esperada: NOTICE "OK: todos os testes de ingestão passaram".
--      Se algum check falhar: erro "FALHA: ..." (a execução aborta).
--
-- O QUE ELE TESTA
--   1. ID externo sem mapeamento fica pendente e não altera disponibilidade.
--   2. Status externo desconhecido é rejeitado.
--   3. Timestamp sem offset é rejeitado.
--   4. Leitura válida gera histórico com comments fixo e autoria humana NULL.
--   5. Reentrega do mesmo source_event_id não aplica duas vezes.
--   6. Leitura atrasada não sobrescreve estado mais recente.
--   7. Mesmo estado sem mudança relevante não gera histórico.
--   8. Motivo externo só vira motivo interno quando há reason_map.
--   9. status_map traduz ON/OFF e rejeita valor não mapeado.
--  10. Unidade fora da empresa da integração é rejeitada.
--  11. Integração inativa rejeita o lote.
--  12. Um item inválido não derruba os demais itens do lote.
--  13. config não aceita segredo, status_map não booleano ou reason_map não inteiro.
--  14. A ingestão é executável apenas por service_role.
--
-- SEGURANÇA
--   Tudo roda DENTRO de uma transação que termina em ROLLBACK: nenhum
--   dado de teste é persistido. São criados empresa/unidade/setor com
--   prefixo "TST-/Teste". As sequences avançam (benigno), como nos demais
--   scripts validate_*.
-- ============================================================

BEGIN;

DO $$
DECLARE
    v_company_a BIGINT;
    v_company_b BIGINT;
    v_unit_a BIGINT;
    v_unit_b BIGINT;
    v_node_a BIGINT;
    v_node_b BIGINT;
    v_int_a BIGINT;
    v_int_b BIGINT;
    v_int_inactive BIGINT;
    v_result TEXT;
    v_aa BIGINT;
    v_n INTEGER;
    v_row public.assets_available%ROWTYPE;
    v_last TIMESTAMP WITHOUT TIME ZONE;
BEGIN
    INSERT INTO public.cfg_companies (code, description)
    VALUES ('TST-A', 'Teste integração A') RETURNING id INTO v_company_a;
    INSERT INTO public.cfg_companies (code, description)
    VALUES ('TST-B', 'Teste integração B') RETURNING id INTO v_company_b;

    INSERT INTO public.units (company_id) VALUES (v_company_a) RETURNING id INTO v_unit_a;
    INSERT INTO public.units (company_id) VALUES (v_company_b) RETURNING id INTO v_unit_b;

    -- asset_tag_id fica NULL para evitar dependência de um setor já cadastrado.
    INSERT INTO public.cfg_units_assets_tags (unit_id, last_created_at)
    VALUES (v_unit_a, timezone('America/Sao_Paulo', now())) RETURNING id INTO v_node_a;
    INSERT INTO public.cfg_units_assets_tags (unit_id, last_created_at)
    VALUES (v_unit_b, timezone('America/Sao_Paulo', now())) RETURNING id INTO v_node_b;

    INSERT INTO public.cfg_assets_available_integrations
        (company_id, name, provider_code, config)
    VALUES (v_company_a, 'Teste A', 'teste_a', '{}'::jsonb)
    RETURNING id INTO v_int_a;

    INSERT INTO public.cfg_assets_available_integrations
        (company_id, name, provider_code, config)
    VALUES (
        v_company_b, 'Teste B', 'teste_b',
        '{"status_path":"status","status_map":{"ON":true,"OFF":false}}'::jsonb
    ) RETURNING id INTO v_int_b;

    INSERT INTO public.cfg_assets_available_integrations
        (company_id, name, provider_code, config, is_active)
    VALUES (v_company_a, 'Teste inativa', 'teste_inativa', '{}'::jsonb, FALSE)
    RETURNING id INTO v_int_inactive;

    INSERT INTO public.cfg_assets_available_integrations_mappings
        (integration_id, external_id, unit_asset_tag_id)
    VALUES
        (v_int_a, 'EXT-1', v_node_a),
        (v_int_a, 'SCOPE-1', v_node_b),
        (v_int_b, 'EXT-1', v_node_b);

    CREATE TEMP TABLE tr (
        external_id TEXT, result TEXT, message TEXT, asset_available_id BIGINT
    ) ON COMMIT DROP;

    -- ── 1) ID sem mapeamento ─────────────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"UNMAPPED","status":"available","source_reported_at":"2026-11-04T18:00:00-03:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'pending_mapping' THEN
        RAISE EXCEPTION 'FALHA 1: esperado pending_mapping, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 1: ID sem mapeamento fica pendente';

    -- ── 2) Status externo desconhecido sem status_map ────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"ON","source_reported_at":"2026-11-04T18:00:00-03:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 2: esperado rejected, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 2: status externo desconhecido rejeitado';

    -- ── 3) Timestamp sem offset ──────────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"available","source_reported_at":"2026-11-04T18:00:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 3: esperado rejected, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 3: timestamp sem offset rejeitado';

    -- ── 4) Primeira aplicação válida ─────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"available","source_reported_at":"2026-11-04T18:17:51-03:00","source_event_id":"evt-1"}]'::jsonb
    );
    SELECT result, asset_available_id INTO v_result, v_aa FROM tr;
    IF v_result <> 'applied' THEN
        RAISE EXCEPTION 'FALHA 4: esperado applied, obtido % (%)', v_result, (SELECT message FROM tr);
    END IF;

    SELECT * INTO v_row FROM public.assets_available WHERE id = v_aa;
    IF v_row.comments IS DISTINCT FROM 'Leitura obtida via integração de APIs.' THEN
        RAISE EXCEPTION 'FALHA 4a: comments = %', v_row.comments;
    END IF;
    IF v_row.reported_user_id IS NOT NULL OR v_row.created_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'FALHA 4b: autoria humana deveria ser NULL';
    END IF;
    IF v_row.reported_at IS DISTINCT FROM '2026-11-04 18:17:51'::timestamp THEN
        RAISE EXCEPTION 'FALHA 4c: reported_at = %', v_row.reported_at;
    END IF;
    IF v_row.is_available IS NOT TRUE OR v_row.is_web IS NOT FALSE THEN
        RAISE EXCEPTION 'FALHA 4d: is_available=% is_web=%', v_row.is_available, v_row.is_web;
    END IF;
    IF v_row.unit_asset_tag_id <> v_node_a OR v_row.unit_id <> v_unit_a THEN
        RAISE EXCEPTION 'FALHA 4e: IDs internos divergentes';
    END IF;
    RAISE NOTICE 'ok 4: aplicação válida mantém histórico, marcador e autoria NULL';

    -- ── 5) Mesmo evento externo reenviado ────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"unavailable","source_reported_at":"2026-11-04T18:17:51-03:00","source_event_id":"evt-1"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'duplicate' THEN
        RAISE EXCEPTION 'FALHA 5: esperado duplicate, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 5: reentrega do mesmo evento não aplica duas vezes';

    -- ── 6) Leitura atrasada ──────────────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"unavailable","source_reported_at":"2026-11-04T18:00:00-03:00","source_event_id":"evt-2"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 6: esperado rejected, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 6: leitura atrasada rejeitada';

    -- ── 7) Mesmo estado, sem histórico novo ──────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"available","source_reported_at":"2026-11-04T19:00:00-03:00","source_event_id":"evt-3"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'unchanged' THEN
        RAISE EXCEPTION 'FALHA 7: esperado unchanged, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 7: estado repetido não cria histórico';

    -- ── 8) Indisponível sem reason_map ───────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"unavailable","source_reported_at":"2026-11-04T20:00:00-03:00","source_event_id":"evt-4","reason":"MANUT"}]'::jsonb
    );
    SELECT result, asset_available_id INTO v_result, v_aa FROM tr;
    IF v_result <> 'applied' THEN
        RAISE EXCEPTION 'FALHA 8: esperado applied, obtido %', v_result;
    END IF;
    SELECT * INTO v_row FROM public.assets_available WHERE id = v_aa;
    IF COALESCE(v_row.asset_unavailable_reason_id, 0) <> 0 THEN
        RAISE EXCEPTION 'FALHA 8a: motivo não deveria ser convertido sem reason_map';
    END IF;
    RAISE NOTICE 'ok 8: motivo externo sem mapa não é convertido';

    -- ── 9) Volta a disponível ────────────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"EXT-1","status":"available","source_reported_at":"2026-11-04T21:00:00-03:00","source_event_id":"evt-5"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'applied' THEN
        RAISE EXCEPTION 'FALHA 9: esperado applied, obtido %', v_result;
    END IF;

    -- ── 10) status_map da integração B ───────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_b,
        '[{"external_id":"EXT-1","status":"ON","source_reported_at":"2026-11-04T18:30:00-03:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'applied' THEN
        RAISE EXCEPTION 'FALHA 10: esperado applied, obtido %', v_result;
    END IF;

    -- ── 11) Status desconhecido no mapa ──────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_b,
        '[{"external_id":"EXT-1","status":"WARN","source_reported_at":"2026-11-04T18:40:00-03:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 11: esperado rejected, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 10-11: status_map traduz ON/OFF e rejeita WARN';

    -- ── 12) Empresa fora do escopo ───────────────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_a,
        '[{"external_id":"SCOPE-1","status":"available","source_reported_at":"2026-11-04T18:10:00-03:00"}]'::jsonb
    );
    SELECT result INTO v_result FROM tr;
    IF v_result <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 12: esperado rejected, obtido %', v_result;
    END IF;
    RAISE NOTICE 'ok 12: unidade fora da empresa da integração é rejeitada';

    -- ── 13) Integração inativa ───────────────────────────────────────
    BEGIN
        PERFORM public.fn_ingest_asset_availability(
            v_int_inactive,
            '[{"external_id":"EXT-1","status":"available","source_reported_at":"2026-11-04T18:00:00-03:00"}]'::jsonb
        );
        RAISE EXCEPTION 'FALHA 13: integração inativa deveria falhar';
    EXCEPTION WHEN SQLSTATE '55000' THEN
        NULL;
    END;
    RAISE NOTICE 'ok 13: integração inativa rejeita o lote';

    -- ── 14) Histórico (3 no nó A; 1 no nó B) ─────────────────────────
    SELECT count(*) INTO v_n FROM public.assets_available WHERE unit_asset_tag_id = v_node_a;
    IF v_n <> 3 THEN
        RAISE EXCEPTION 'FALHA 14: esperado 3 históricos no nó A, obtido %', v_n;
    END IF;

    SELECT count(*) INTO v_n FROM public.assets_available WHERE unit_asset_tag_id = v_node_b;
    IF v_n <> 1 THEN
        RAISE EXCEPTION 'FALHA 14a: esperado 1 histórico no nó B, obtido %', v_n;
    END IF;
    RAISE NOTICE 'ok 14: histórico sem duplicatas';

    -- ── 15) Última leitura do mapeamento ─────────────────────────────
    SELECT last_source_reported_at INTO v_last
    FROM public.cfg_assets_available_integrations_mappings
    WHERE integration_id = v_int_a AND external_id = 'EXT-1';
    IF v_last IS DISTINCT FROM '2026-11-04 21:00:00'::timestamp THEN
        RAISE EXCEPTION 'FALHA 15: last_source_reported_at = %', v_last;
    END IF;
    RAISE NOTICE 'ok 15: ordenação do mapeamento atualizada';

    -- ── 16) Item inválido não derruba o lote ─────────────────────────
    TRUNCATE tr;
    INSERT INTO tr SELECT * FROM public.fn_ingest_asset_availability(
        v_int_b,
        '[
          {"external_id":"EXT-1","status":"OFF","source_reported_at":"2026-11-04T22:00:00-03:00","source_event_id":"evt-b2"},
          {"external_id":"EXT-1","status":"WARN","source_reported_at":"2026-11-04T22:10:00-03:00"}
        ]'::jsonb
    );
    IF (SELECT count(*) FROM tr) <> 2 THEN
        RAISE EXCEPTION 'FALHA 16: esperado 2 resultados';
    END IF;
    IF (SELECT result FROM tr ORDER BY ctid LIMIT 1) <> 'applied' THEN
        RAISE EXCEPTION 'FALHA 16a: primeiro item deveria aplicar';
    END IF;
    IF (SELECT result FROM tr ORDER BY ctid OFFSET 1 LIMIT 1) <> 'rejected' THEN
        RAISE EXCEPTION 'FALHA 16b: segundo item deveria ser rejeitado';
    END IF;
    RAISE NOTICE 'ok 16: item inválido não derruba o lote';

    -- ── 17) Validação de config ──────────────────────────────────────
    BEGIN
        INSERT INTO public.cfg_assets_available_integrations
            (company_id, name, provider_code, config)
        VALUES (v_company_a, 'Config segredo', 'cfg_segredo', '{"api_key":"x"}'::jsonb);
        RAISE EXCEPTION 'FALHA 17: config com api_key deveria falhar';
    EXCEPTION WHEN SQLSTATE '22023' THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.cfg_assets_available_integrations
            (company_id, name, provider_code, config)
        VALUES (v_company_a, 'Config mapa', 'cfg_mapa',
                '{"status_path":"status","status_map":{"ON":"yes"}}'::jsonb);
        RAISE EXCEPTION 'FALHA 17a: status_map não booleano deveria falhar';
    EXCEPTION WHEN SQLSTATE '22023' THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.cfg_assets_available_integrations
            (company_id, name, provider_code, config)
        VALUES (v_company_a, 'Config motivo', 'cfg_motivo',
                '{"reason_map":{"MANUT":"7"}}'::jsonb);
        RAISE EXCEPTION 'FALHA 17b: reason_map não inteiro deveria falhar';
    EXCEPTION WHEN SQLSTATE '22023' THEN
        NULL;
    END;
    RAISE NOTICE 'ok 17: config recusa segredo/status_map/reason_map inválidos';

    -- ── 18) Permissões da ingestão ───────────────────────────────────
    IF has_function_privilege('anon',
        'public.fn_ingest_asset_availability(bigint,jsonb,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALHA 18: anon não deveria executar ingestão';
    END IF;
    IF has_function_privilege('authenticated',
        'public.fn_ingest_asset_availability(bigint,jsonb,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALHA 18a: authenticated não deveria executar ingestão';
    END IF;
    IF NOT has_function_privilege('service_role',
        'public.fn_ingest_asset_availability(bigint,jsonb,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALHA 18b: service_role deveria executar ingestão';
    END IF;
    RAISE NOTICE 'ok 18: ingestão executável apenas por service_role';

    RAISE NOTICE 'OK: todos os testes de ingestão passaram';
END $$;

ROLLBACK;
