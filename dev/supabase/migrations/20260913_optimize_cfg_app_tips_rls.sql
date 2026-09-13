-- ============================================================
-- Migration: Optimize RLS policies for cfg_app_tips tables
-- Date: 2026-09-13
-- Fix: Wrap auth.uid() with (select auth.uid()) to avoid
--       per-row re-evaluation and improve query performance
-- ============================================================

-- cfg_app_tips: drop all policies and recreate
DROP POLICY IF EXISTS "Anyone can view active tips" ON cfg_app_tips;
DROP POLICY IF EXISTS "Admins can manage tips" ON cfg_app_tips;

CREATE POLICY "Anyone can view active tips"
    ON cfg_app_tips FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage tips"
    ON cfg_app_tips FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = (select auth.uid())
            AND users.is_admin_super = true
        )
    );

-- cfg_app_tips_dismissals: enable RLS and recreate policies
ALTER TABLE cfg_app_tips_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own dismissals" ON cfg_app_tips_dismissals;
DROP POLICY IF EXISTS "Users can insert own dismissals" ON cfg_app_tips_dismissals;
DROP POLICY IF EXISTS "Admins can manage all dismissals" ON cfg_app_tips_dismissals;

CREATE POLICY "Users can view own dismissals"
    ON cfg_app_tips_dismissals FOR SELECT
    USING (
        user_id = (
            SELECT id FROM users WHERE uuid = (select auth.uid())
        )
    );

CREATE POLICY "Users can insert own dismissals"
    ON cfg_app_tips_dismissals FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM users WHERE uuid = (select auth.uid())
        )
    );

CREATE POLICY "Admins can manage all dismissals"
    ON cfg_app_tips_dismissals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.uuid = (select auth.uid())
            AND users.is_admin_super = true
        )
    );
