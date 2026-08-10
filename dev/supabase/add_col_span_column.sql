-- Migration: Add col_span to junction table for flexible layout
--
ALTER TABLE public.cfg_assets_types_attributes 
ADD COLUMN IF NOT EXISTS col_span integer DEFAULT 12;

COMMENT ON COLUMN public.cfg_assets_types_attributes.col_span IS 'Tamanho do campo em um grid de 12 colunas (ex: 6 = 50%, 12 = 100%)';

NOTIFY pgrst, 'reload schema';
