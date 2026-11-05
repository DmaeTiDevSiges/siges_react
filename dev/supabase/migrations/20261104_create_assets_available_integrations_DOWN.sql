-- ============================================================================
-- DOWN: 20261104_create_assets_available_integrations
-- Desfaz a estrutura da Fase 1 (integrações/mapeamentos/logs + RPC de ingestão).
--
-- ATENÇÃO: este script APAGA as tabelas de integração e seus dados.
-- Faça backup de:
--   public.cfg_assets_available_integrations
--   public.cfg_assets_available_integrations_mappings
--   public.logs_assets_available_integrations_events
-- antes de executar. O histórico em assets_available NÃO é removido (já é
-- histórico oficial do SIGES), mas os registros ficam sem a referência de
-- qual integração os originou.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.fn_ingest_asset_availability(bigint, jsonb, integer);

DROP FUNCTION IF EXISTS public.fn_log_assets_available_integration_event(
    bigint, bigint, bigint, text, text, timestamp without time zone,
    boolean, text, text, bigint
);

DROP TABLE IF EXISTS public.logs_assets_available_integrations_events;
DROP TABLE IF EXISTS public.cfg_assets_available_integrations_mappings;
DROP TABLE IF EXISTS public.cfg_assets_available_integrations;

DROP FUNCTION IF EXISTS public.fn_validate_assets_available_integration();
DROP FUNCTION IF EXISTS public.fn_touch_assets_available_integration();
DROP FUNCTION IF EXISTS public.fn_jsonb_contains_forbidden_keys(jsonb, text[]);

NOTIFY pgrst, 'reload schema';

COMMIT;
