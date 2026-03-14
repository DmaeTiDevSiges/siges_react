-- Migration: Add naming_pattern to asset types
ALTER TABLE public.cfg_assets_types 
ADD COLUMN IF NOT EXISTS naming_pattern text;

COMMENT ON COLUMN public.cfg_assets_types.naming_pattern IS 'Padrão para gerar a descrição do ativo (ex: {type} {brand} {model} {power_kw})';

-- Update existing types with a default pattern matching current logic or the user example
UPDATE public.cfg_assets_types 
SET naming_pattern = '{type} {brand} {model}'
WHERE naming_pattern IS NULL;

-- Specific pattern for Motors as requested in the example
-- Pattern: {type} {brand} {power_kw} {poles} {voltage} {model}
UPDATE public.cfg_assets_types 
SET naming_pattern = '{type} {brand} {power_kw} {poles} {voltage} {model}'
WHERE code = 'MO';

NOTIFY pgrst, 'reload schema';
