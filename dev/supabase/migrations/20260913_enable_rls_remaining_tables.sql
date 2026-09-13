-- ============================================================
-- Migration: Enable RLS on remaining tables
-- Date: 2026-09-13
-- Fix: Enable RLS on tables flagged by Security Advisor
-- ============================================================

-- goose_db_version (goose migration tracker — internal, read-only for all)
ALTER TABLE public.goose_db_version ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read goose_db_version" ON public.goose_db_version;
CREATE POLICY "Authenticated can read goose_db_version"
    ON public.goose_db_version FOR SELECT
    TO authenticated
    USING (true);

-- schema_migrations (internal migration tracker — read-only for all)
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read schema_migrations" ON public.schema_migrations;
CREATE POLICY "Authenticated can read schema_migrations"
    ON public.schema_migrations FOR SELECT
    TO authenticated
    USING (true);

-- leader_monthly_scores (gamification — read for all, write via service role)
ALTER TABLE public.leader_monthly_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read leader_monthly_scores" ON public.leader_monthly_scores;
CREATE POLICY "Authenticated can read leader_monthly_scores"
    ON public.leader_monthly_scores FOR SELECT
    TO authenticated
    USING (true);

-- leader_scores_history (gamification — read for all, write via service role)
ALTER TABLE public.leader_scores_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read leader_scores_history" ON public.leader_scores_history;
CREATE POLICY "Authenticated can read leader_scores_history"
    ON public.leader_scores_history FOR SELECT
    TO authenticated
    USING (true);

-- leader_score_badges (gamification — read for all, write via service role)
ALTER TABLE public.leader_score_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read leader_score_badges" ON public.leader_score_badges;
CREATE POLICY "Authenticated can read leader_score_badges"
    ON public.leader_score_badges FOR SELECT
    TO authenticated
    USING (true);
