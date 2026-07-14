-- Migration: Adicionar coluna code e tabela de arquivos para documentos técnicos

-- 1. Adicionar coluna code na tabela technicals_manuals
ALTER TABLE public.technicals_manuals ADD COLUMN IF NOT EXISTS code text;

-- 2. Criar tabela de arquivos de documentos técnicos (múltiplos arquivos por doc)
CREATE TABLE IF NOT EXISTS public.technicals_manuals_files (
    id bigint NOT NULL,
    tm_id bigint NOT NULL,
    doc_file_path text,
    doc_file_name text,
    file_type character varying DEFAULT 'pdf'::character varying,
    created_at timestamp without time zone DEFAULT now()
);

-- Sequence para a nova tabela
CREATE SEQUENCE IF NOT EXISTS public.technicals_manuals_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.technicals_manuals_files ALTER COLUMN id SET DEFAULT nextval('public.technicals_manuals_files_id_seq'::regclass);

-- Constraint de PK
ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_pkey PRIMARY KEY (id);

-- FK para technicals_manuals
ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_tm_id_fkey FOREIGN KEY (tm_id) REFERENCES public.technicals_manuals(id) ON DELETE CASCADE;

-- 3. Drop function + view (com CASCADE), depois recriar ambos
DROP FUNCTION IF EXISTS public.fc_tm_assets_types_search_terms(text, integer) CASCADE;
DROP VIEW IF EXISTS public.v_technicals_manuals;

CREATE VIEW public.v_technicals_manuals AS
 SELECT technicals_manuals.id,
    technicals_manuals.company_id,
    technicals_manuals.code,
    technicals_manuals.tm_type_id,
    technicals_manuals_types.description AS tm_type_description,
    technicals_manuals.description AS tm_description,
    technicals_manuals.doc_file_path,
    technicals_manuals.doc_file_name,
    technicals_manuals.assets_amount,
    technicals_manuals.asset_type_id,
    cfg_assets_types.description AS asset_type_description
   FROM ((public.technicals_manuals
     JOIN public.technicals_manuals_types ON ((technicals_manuals.tm_type_id = technicals_manuals_types.id)))
     JOIN public.cfg_assets_types ON ((technicals_manuals.asset_type_id = cfg_assets_types.id)));

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
