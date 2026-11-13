-- ==============================================================================
-- Migration: 20261130_fix_assets_searchable_null.sql
-- Ativos sem marca, modelo ou nº de série ficavam com assets.searchable em branco:
-- o trigger concatenava com `||` e, no Postgres, qualquer NULL zera o resultado.
-- (O ativo 23082 só tinha searchable porque marca/modelo/série estavam como '' e não NULL.)
--
--   1. fc_assets_searchable_update: usa concat_ws (ignora NULL) e remove espaços das pontas.
--   2. Recalcula o searchable dos ativos que estão NULL.
--
-- O app também passou a enviar '' em vez de NULL; esta migration protege os demais caminhos
-- (importações, edição direta no banco). Idempotente. Aplicar manualmente no SQL Editor.
--
-- ANTES, para ver quantos serão corrigidos:
--   SELECT count(*) FROM public.assets WHERE searchable IS NULL;
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fc_assets_searchable_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    NEW.searchable = btrim(concat_ws(' ', NEW.code, NEW.description, NEW.brand, NEW.model, NEW.serial));
    RETURN NEW;
END;
$$;

-- Dispara o trigger (BEFORE UPDATE) nas linhas sem searchable.
UPDATE public.assets SET code = code WHERE searchable IS NULL;

COMMIT;

-- Conferência (deve voltar 0):
--   SELECT count(*) FROM public.assets WHERE searchable IS NULL;
