-- Migration: Add decimals column to cfg_assets_attributes
ALTER TABLE public.cfg_assets_attributes ADD COLUMN IF NOT EXISTS decimals integer null default 0;

-- Update existing numeric fields to have 2 decimals by default (optional, can be adjusted)
-- UPDATE public.cfg_assets_attributes SET decimals = 2 WHERE data_type = 'number';

NOTIFY pgrst, 'reload schema';
