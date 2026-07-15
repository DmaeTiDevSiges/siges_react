-- Migration: Limpar dados de technicals_manuals, reiniciar sequences e deletar arquivos do storage

-- 1. Limpar tabelas (filhas primeiro por causa das FKs)
TRUNCATE TABLE public.technicals_manuals_files CASCADE;
TRUNCATE TABLE public.technicals_manuals_assets CASCADE;
TRUNCATE TABLE public.technicals_manuals CASCADE;

-- 2. Reiniciar sequences
ALTER SEQUENCE IF EXISTS public.technicals_manuals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.technicals_manuals_files_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.technicals_manuals_assets_id_seq RESTART WITH 1;

-- 3. Deletar todos os arquivos do bucket 'technical-manuals' no storage
DELETE FROM storage.objects WHERE bucket_id = 'technical-manuals';
