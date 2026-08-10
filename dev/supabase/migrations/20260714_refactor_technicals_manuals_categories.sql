-- Migration: Renomear technicals_manuals_types para cfg_technicals_manuals_categories,
-- remover tm_type_id de technicals_manuals e adicionar tm_category_id em technicals_manuals_files

-- 1. Renomear tabela technicals_manuals_types para cfg_technicals_manuals_categories
ALTER TABLE IF EXISTS public.technicals_manuals_types RENAME TO cfg_technicals_manuals_categories;

-- Renomear sequence se existir
ALTER SEQUENCE IF EXISTS public.technicals_manuals_types_id_seq RENAME TO cfg_technicals_manuals_categories_id_seq;

-- Renomear constraints
DO $$
BEGIN
    -- Renomear PK constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'technicals_manuals_types_pkey') THEN
        ALTER TABLE ONLY public.cfg_technicals_manuals_categories
            RENAME CONSTRAINT technicals_manuals_types_pkey TO cfg_technicals_manuals_categories_pkey;
    END IF;
END $$;

-- 2. Remover coluna tm_type_id de technicals_manuals
-- Primeiro remover a função e views que dependem da coluna, depois a coluna
DROP FUNCTION IF EXISTS public.fc_tm_assets_types_search_terms(text, integer);
DROP VIEW IF EXISTS public.v_assets_technicals_manuals;
DROP VIEW IF EXISTS public.v_technicals_manuals;

ALTER TABLE IF EXISTS public.technicals_manuals DROP COLUMN IF EXISTS tm_type_id;

-- 3. Adicionar coluna tm_category_id em technicals_manuals_files
ALTER TABLE IF EXISTS public.technicals_manuals_files 
    ADD COLUMN IF NOT EXISTS tm_category_id bigint;

-- Adicionar FK para cfg_technicals_manuals_categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'technicals_manuals_files_tm_category_id_fkey'
    ) THEN
        ALTER TABLE ONLY public.technicals_manuals_files
            ADD CONSTRAINT technicals_manuals_files_tm_category_id_fkey 
            FOREIGN KEY (tm_category_id) REFERENCES public.cfg_technicals_manuals_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Recriar a view v_technicals_manuals sem tm_type_id
CREATE VIEW public.v_technicals_manuals AS
 SELECT technicals_manuals.id,
    technicals_manuals.company_id,
    technicals_manuals.code,
    technicals_manuals.description AS tm_description,
    technicals_manuals.doc_file_path,
    technicals_manuals.doc_file_name,
    technicals_manuals.assets_amount,
    technicals_manuals.asset_type_id,
    cfg_assets_types.description AS asset_type_description
   FROM (public.technicals_manuals
     JOIN public.cfg_assets_types ON ((technicals_manuals.asset_type_id = cfg_assets_types.id)));

-- 5. Recriar a função de busca
CREATE OR REPLACE FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer)
RETURNS SETOF public.v_technicals_manuals
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_technicals_manuals;
BEGIN
    FOR result_record IN
        SELECT *
        FROM v_technicals_manuals
        WHERE asset_type_id = src_asset_type_id
          AND to_tsvector('portuguese', tm_description) @@ plainto_tsquery('portuguese', search_terms)
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;
