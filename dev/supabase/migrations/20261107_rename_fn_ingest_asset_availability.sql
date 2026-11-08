-- Renomeia fn_ingest_asset_availability → fn_add_assets_available.
--
-- Idempotente:
--   - banco com 20261104 já aplicada (nome antigo): renomeia; grants, comentário,
--     SECURITY DEFINER e search_path acompanham a função.
--   - banco novo (20261104 já cria fn_add_assets_available): não faz nada.
--
-- Depois de aplicar, publicar o Worker workers/availability-sync (ele chama o
-- nome novo via /rest/v1/rpc/fn_add_assets_available).
--
-- Reverter: ALTER FUNCTION public.fn_add_assets_available(bigint, jsonb, integer)
--           RENAME TO fn_ingest_asset_availability;

BEGIN;

DO $$
BEGIN
    IF to_regprocedure('public.fn_ingest_asset_availability(bigint,jsonb,integer)') IS NOT NULL THEN
        IF to_regprocedure('public.fn_add_assets_available(bigint,jsonb,integer)') IS NOT NULL THEN
            RAISE EXCEPTION
                'fn_ingest_asset_availability e fn_add_assets_available existem ao mesmo tempo; remova a antiga manualmente após conferir';
        END IF;

        ALTER FUNCTION public.fn_ingest_asset_availability(bigint, jsonb, integer)
            RENAME TO fn_add_assets_available;
    ELSIF to_regprocedure('public.fn_add_assets_available(bigint,jsonb,integer)') IS NULL THEN
        RAISE EXCEPTION
            'Nenhuma das funções existe; aplique 20261104_create_assets_available_integrations.sql antes';
    END IF;
END
$$;

-- Garante as permissões esperadas (só service_role executa).
REVOKE ALL ON FUNCTION public.fn_add_assets_available(bigint, jsonb, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_add_assets_available(bigint, jsonb, integer)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
