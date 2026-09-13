-- =============================================================================
-- Migration: Fix mutable search_path on all functions in public schema
-- Date: 2026-09-13
-- Fix: Supabase Lint 0011 (Function Search Path Mutable)
-- Description:
--   Altera todas as funções do schema public para definir explicitamente
--   'SET search_path = public', eliminando riscos de search_path hijacking
--   e resolvendo todos os avisos de Function Search Path Mutable no Supabase.
-- =============================================================================

DO $$
DECLARE
    r RECORD;
    v_sql text;
    v_count integer := 0;
BEGIN
    FOR r IN (
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p')
          AND (
              p.proconfig IS NULL 
              OR NOT array_to_string(p.proconfig, ',') LIKE '%search_path%'
          )
        ORDER BY p.proname
    ) LOOP
        v_sql := format('ALTER FUNCTION %I.%I(%s) SET search_path = public;', 
                        r.schema_name, r.function_name, r.identity_args);
        BEGIN
            EXECUTE v_sql;
            v_count := v_count + 1;
            RAISE NOTICE '[OK] Definido search_path para: %.%(%)', 
                         r.schema_name, r.function_name, r.identity_args;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[FALHA] Não foi possível alterar %.%(%): %', 
                          r.schema_name, r.function_name, r.identity_args, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '-------------------------------------------------------';
    RAISE NOTICE 'Total de funções corrigidas com sucesso: %', v_count;
    RAISE NOTICE '-------------------------------------------------------';
END $$;
