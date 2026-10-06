-- Migration: Enable RLS on assets_loans_checklists
-- Date: 2026-10-03
-- Reason: Table was recreated in 20260916_finalize_assets_loans_checklists.sql
--         using CREATE TABLE IF NOT EXISTS, which does not preserve RLS settings.
--         Original RLS + policies defined in 20260915_create_asset_loans.sql were lost.

-- 1. Enable Row Level Security
ALTER TABLE public.assets_loans_checklists ENABLE ROW LEVEL SECURITY;

-- 2. Recreate policies (idempotent — drops first if they exist)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view loan checklists"   ON public.assets_loans_checklists;
    DROP POLICY IF EXISTS "Users can insert loan checklists" ON public.assets_loans_checklists;
    DROP POLICY IF EXISTS "Users can update loan checklists" ON public.assets_loans_checklists;
    DROP POLICY IF EXISTS "Users can delete loan checklists" ON public.assets_loans_checklists;
END $$;

CREATE POLICY "Users can view loan checklists"
    ON public.assets_loans_checklists FOR SELECT USING (true);

CREATE POLICY "Users can insert loan checklists"
    ON public.assets_loans_checklists FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update loan checklists"
    ON public.assets_loans_checklists FOR UPDATE USING (true);

CREATE POLICY "Users can delete loan checklists"
    ON public.assets_loans_checklists FOR DELETE USING (true);
