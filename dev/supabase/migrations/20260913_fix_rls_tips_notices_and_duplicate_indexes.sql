-- =============================================================================
-- Migration: Fix RLS policies (auth_rls_initplan + multiple_permissive) and
--            drop duplicate indexes
-- Date: 2026-09-13
-- Fixes:
--   [PERF-0003] auth_rls_initplan  → cfg_app_tips_companies, _departments, _profiles,
--                                     cfg_materials_purchases_cancel_reasons,
--                                     cfg_app_notices (super admin + create/update/delete)
--   [PERF-0006] multiple_permissive_policies → cfg_app_tips (SELECT overlap com admin ALL),
--                                              cfg_app_tips_companies/departments/profiles,
--                                              cfg_app_tips_dismissals (SELECT+INSERT overlap),
--                                              cfg_app_notices (5 políticas → 2)
--   [PERF-0009] duplicate_index → leader_scores_history, orders_visits_assets
--
-- ESTRATÉGIA para eliminar multiple_permissive:
--   Nunca usar FOR ALL junto a uma política SELECT separada para a mesma tabela.
--   Admin de escrita usa FOR INSERT + FOR UPDATE + FOR DELETE separados.
--   SELECT é uma única política que cobre todos os casos (público + admin).
-- =============================================================================


-- =============================================================================
-- 1. cfg_app_tips – fix multiple_permissive (SELECT overlap: view active + admin ALL)
--    Solução: manter 1 SELECT + 3 políticas de escrita para admin
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view active tips" ON public.cfg_app_tips;
DROP POLICY IF EXISTS "Admins can manage tips"      ON public.cfg_app_tips;

-- Única política SELECT: tips ativos OU super admin vê todos
CREATE POLICY "View active tips"
    ON public.cfg_app_tips FOR SELECT
    USING (
        is_active = true
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

-- Admin: INSERT
CREATE POLICY "Admins can insert tips"
    ON public.cfg_app_tips FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

-- Admin: UPDATE
CREATE POLICY "Admins can update tips"
    ON public.cfg_app_tips FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

-- Admin: DELETE
CREATE POLICY "Admins can delete tips"
    ON public.cfg_app_tips FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );


-- =============================================================================
-- 2. cfg_app_tips_companies – fix auth_rls_initplan + multiple_permissive
--    Solução: 1 SELECT (true) + 3 políticas de escrita para admin
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view tip companies"   ON public.cfg_app_tips_companies;
DROP POLICY IF EXISTS "Admins can manage tip companies" ON public.cfg_app_tips_companies;

-- SELECT único: qualquer um pode ver
CREATE POLICY "Anyone can view tip companies"
    ON public.cfg_app_tips_companies FOR SELECT
    USING (true);

-- Admin: INSERT
CREATE POLICY "Admins can insert tip companies"
    ON public.cfg_app_tips_companies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

-- Admin: UPDATE
CREATE POLICY "Admins can update tip companies"
    ON public.cfg_app_tips_companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

-- Admin: DELETE
CREATE POLICY "Admins can delete tip companies"
    ON public.cfg_app_tips_companies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );


-- =============================================================================
-- 3. cfg_app_tips_departments – fix auth_rls_initplan + multiple_permissive
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view tip departments"   ON public.cfg_app_tips_departments;
DROP POLICY IF EXISTS "Admins can manage tip departments" ON public.cfg_app_tips_departments;

CREATE POLICY "Anyone can view tip departments"
    ON public.cfg_app_tips_departments FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert tip departments"
    ON public.cfg_app_tips_departments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Admins can update tip departments"
    ON public.cfg_app_tips_departments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Admins can delete tip departments"
    ON public.cfg_app_tips_departments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );


-- =============================================================================
-- 4. cfg_app_tips_profiles – fix auth_rls_initplan + multiple_permissive
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view tip profiles"   ON public.cfg_app_tips_profiles;
DROP POLICY IF EXISTS "Admins can manage tip profiles" ON public.cfg_app_tips_profiles;

CREATE POLICY "Anyone can view tip profiles"
    ON public.cfg_app_tips_profiles FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert tip profiles"
    ON public.cfg_app_tips_profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Admins can update tip profiles"
    ON public.cfg_app_tips_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );

CREATE POLICY "Admins can delete tip profiles"
    ON public.cfg_app_tips_profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = (SELECT auth.uid())
            AND users.is_admin_super = true
        )
    );


-- =============================================================================
-- 5. cfg_app_tips_dismissals – fix multiple_permissive (admin ALL sobrepõe SELECT+INSERT)
--    Solução: unificar SELECT (user OR admin) + unificar INSERT (user OR admin)
--             + políticas separadas para UPDATE/DELETE admin
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own dismissals"    ON public.cfg_app_tips_dismissals;
DROP POLICY IF EXISTS "Users can insert own dismissals"  ON public.cfg_app_tips_dismissals;
DROP POLICY IF EXISTS "Admins can manage all dismissals" ON public.cfg_app_tips_dismissals;

-- SELECT único: usuário vê as próprias OU admin vê todas
CREATE POLICY "View dismissals"
    ON public.cfg_app_tips_dismissals FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users WHERE uuid = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = true
        )
    );

-- INSERT único: usuário insere as próprias OU admin insere qualquer
CREATE POLICY "Insert dismissals"
    ON public.cfg_app_tips_dismissals FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users WHERE uuid = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = true
        )
    );

-- UPDATE: somente admin
CREATE POLICY "Admins can update dismissals"
    ON public.cfg_app_tips_dismissals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = true
        )
    );

-- DELETE: somente admin
CREATE POLICY "Admins can delete dismissals"
    ON public.cfg_app_tips_dismissals FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = true
        )
    );


-- =============================================================================
-- 6. cfg_materials_purchases_cancel_reasons – fix auth_rls_initplan
--    Problema: política usa auth.role() diretamente (re-avaliado por linha)
--    Solução: usar TO authenticated (role check no planejador, não por linha)
-- =============================================================================
DROP POLICY IF EXISTS "Allow all authenticated read" ON public.cfg_materials_purchases_cancel_reasons;

CREATE POLICY "Allow all authenticated read"
    ON public.cfg_materials_purchases_cancel_reasons FOR SELECT
    TO authenticated
    USING (true);


-- =============================================================================
-- 7. cfg_app_notices – fix auth_rls_initplan + multiple_permissive
--    Antigas: view active (SELECT) + super admin (ALL) + create/update/delete (admin)
--    Novas: 2 políticas sem sobreposição
-- =============================================================================
DROP POLICY IF EXISTS "Notices: view active"  ON public.cfg_app_notices;
DROP POLICY IF EXISTS "Notices: view"         ON public.cfg_app_notices;
DROP POLICY IF EXISTS "Notices: super admin"  ON public.cfg_app_notices;
DROP POLICY IF EXISTS "Notices: create"       ON public.cfg_app_notices;
DROP POLICY IF EXISTS "Notices: update"       ON public.cfg_app_notices;
DROP POLICY IF EXISTS "Notices: delete"       ON public.cfg_app_notices;

-- SELECT único: avisos ativos OU super admin vê todos
CREATE POLICY "Notices: view"
    ON public.cfg_app_notices FOR SELECT
    TO authenticated
    USING (
        (
            is_active = TRUE
            AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
            AND end_date   >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = TRUE
        )
    );

-- Admin: INSERT
CREATE POLICY "Notices: insert"
    ON public.cfg_app_notices FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = TRUE
        )
    );

-- Admin: UPDATE
CREATE POLICY "Notices: update"
    ON public.cfg_app_notices FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = TRUE
        )
    );

-- Admin: DELETE
CREATE POLICY "Notices: delete"
    ON public.cfg_app_notices FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = (SELECT auth.uid())
            AND is_admin_super = TRUE
        )
    );


-- =============================================================================
-- 8. Duplicate Indexes – remover os redundantes
-- =============================================================================

-- leader_scores_history: manter idx_leader_scores_history_leader_period
DROP INDEX IF EXISTS public.idx_leader_scores_history_dept_period;

-- orders_visits_assets: manter idx_ova_asset_id
DROP INDEX IF EXISTS public.idx_ov_assets_asset_id;
