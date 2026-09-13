-- ============================================================
-- Migration: Fix mutable search_path on functions (batch 2)
-- Date: 2026-09-13
-- Fix: Supabase advisor warnings for functions with mutable search_path
-- ============================================================

-- Functions found in codebase: DROP + CREATE with SET search_path = public

-- 1. recalculate_leader_monthly_score (calls recalculate_department_scores indirectly)
DROP FUNCTION IF EXISTS public.recalculate_leader_monthly_score(bigint, int, int) CASCADE;

CREATE OR REPLACE FUNCTION public.recalculate_leader_monthly_score(
    p_leader_id bigint,
    p_year int,
    p_month int
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_total_visits int;
    v_total_evals int;
    v_failed_evals int;
    v_total_penalty numeric(10,2);
    v_avg_compliance numeric(5,2);
    v_best_compliance numeric(5,2);
    v_worst_compliance numeric(5,2);
    v_leader_name varchar;
    v_dept_id bigint;
    v_dept_name varchar;
BEGIN
    SELECT u.name_short, u.team_id, d.id, d.description
    INTO v_leader_name, v_dept_id, v_dept_id, v_dept_name
    FROM public.users u
    JOIN public.cfg_teams t ON t.id = u.team_id
    JOIN public.cfg_departments d ON d.id = t.department_id
    WHERE u.id = p_leader_id;

    SELECT
        COUNT(*)::int,
        COALESCE(SUM(total_evaluations), 0)::int,
        COALESCE(SUM(failed_evaluations), 0)::int,
        COALESCE(SUM(penalty_score), 0)::numeric(10,2),
        CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(AVG(compliance_score), 2) END,
        COALESCE(MAX(compliance_score), 0)::numeric(5,2),
        COALESCE(MIN(compliance_score), 0)::numeric(5,2)
    INTO v_total_visits, v_total_evals, v_failed_evals, v_total_penalty,
         v_avg_compliance, v_best_compliance, v_worst_compliance
    FROM public.v_order_visit_scores
    WHERE leader_id = p_leader_id
      AND score_year = p_year
      AND score_month = p_month;

    INSERT INTO public.leader_monthly_scores (
        leader_id, leader_name, department_id, department_name,
        score_year, score_month,
        total_visits, total_evaluations, failed_evaluations,
        total_penalty_score, avg_compliance_score,
        best_compliance_score, worst_compliance_score,
        updated_at
    ) VALUES (
        p_leader_id, v_leader_name, v_dept_id, v_dept_name,
        p_year, p_month,
        v_total_visits, v_total_evals, v_failed_evals,
        v_total_penalty, v_avg_compliance,
        v_best_compliance, v_worst_compliance,
        now()
    )
    ON CONFLICT (leader_id, score_year, score_month)
    DO UPDATE SET
        leader_name = EXCLUDED.leader_name,
        department_name = EXCLUDED.department_name,
        total_visits = EXCLUDED.total_visits,
        total_evaluations = EXCLUDED.total_evaluations,
        failed_evaluations = EXCLUDED.failed_evaluations,
        total_penalty_score = EXCLUDED.total_penalty_score,
        avg_compliance_score = EXCLUDED.avg_compliance_score,
        best_compliance_score = EXCLUDED.best_compliance_score,
        worst_compliance_score = EXCLUDED.worst_compliance_score,
        updated_at = now();

    INSERT INTO public.leader_scores_history (
        leader_id, ov_id, order_id, score_year, score_month,
        total_evaluations, failed_evaluations, penalty_score,
        max_possible_score, compliance_score, evaluated_at
    )
    SELECT
        leader_id, ov_id, order_id, score_year, score_month,
        total_evaluations, failed_evaluations, penalty_score,
        max_possible_score, compliance_score, ov_ended_at
    FROM public.v_order_visit_scores
    WHERE leader_id = p_leader_id
      AND score_year = p_year
      AND score_month = p_month
    ON CONFLICT (ov_id)
    DO UPDATE SET
        total_evaluations = EXCLUDED.total_evaluations,
        failed_evaluations = EXCLUDED.failed_evaluations,
        penalty_score = EXCLUDED.penalty_score,
        max_possible_score = EXCLUDED.max_possible_score,
        compliance_score = EXCLUDED.compliance_score;

    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY department_id, score_year, score_month ORDER BY avg_compliance_score DESC, total_penalty_score ASC) AS new_rank
        FROM public.leader_monthly_scores
        WHERE department_id = v_dept_id
          AND score_year = p_year
          AND score_month = p_month
    )
    UPDATE public.leader_monthly_scores lms
    SET ranking_position = ranked.new_rank
    FROM ranked
    WHERE lms.id = ranked.id;
END;
$$;

-- 2. recalculate_department_scores (calls recalculate_leader_monthly_score)
DROP FUNCTION IF EXISTS public.recalculate_department_scores(bigint, int, int) CASCADE;

CREATE OR REPLACE FUNCTION public.recalculate_department_scores(
    p_department_id bigint,
    p_year int,
    p_month int
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT ov.leader_id
        FROM public.v_order_visit_scores ov
        WHERE ov.leader_department_id = p_department_id
          AND ov.score_year = p_year
          AND ov.score_month = p_month
    LOOP
        PERFORM public.recalculate_leader_monthly_score(rec.leader_id, p_year, p_month);
    END LOOP;
END;
$$;

-- 3. recalculate_all_scores (calls recalculate_department_scores)
DROP FUNCTION IF EXISTS public.recalculate_all_scores(int, int) CASCADE;

CREATE OR REPLACE FUNCTION public.recalculate_all_scores(
    p_year int,
    p_month int
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT leader_department_id
        FROM public.v_order_visit_scores
        WHERE score_year = p_year
          AND score_month = p_month
    LOOP
        PERFORM public.recalculate_department_scores(rec.leader_department_id, p_year, p_month);
    END LOOP;
END;
$$;

-- 4. nearby_units
DROP FUNCTION IF EXISTS public.nearby_units(double precision, double precision, double precision, text) CASCADE;

CREATE OR REPLACE FUNCTION public.nearby_units(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000,
    status_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id BIGINT,
    client_id BIGINT,
    description TEXT,
    code TEXT,
    installation_code_power_supply TEXT,
    address_full TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    unit_type_parent_id BIGINT,
    unit_type_id BIGINT,
    system_parent_id BIGINT,
    system_id BIGINT,
    status_id BIGINT,
    is_available BOOLEAN,
    description_full TEXT,
    img_file_path TEXT,
    img_file_name TEXT,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.client_id,
        u.description,
        u.code,
        u.installation_code_power_supply,
        u.address_full,
        u.latitude,
        u.longitude,
        u.unit_type_parent_id,
        u.unit_type_id,
        u.system_parent_id,
        u.system_id,
        u.status_id,
        u.is_available,
        u.description_full,
        u.img_file_path,
        u.img_file_name,
        (
            6371000 * ACOS(
                COS(RADIANS(user_lat)) * COS(RADIANS(u.latitude)) *
                COS(RADIANS(u.longitude) - RADIANS(user_lng)) +
                SIN(RADIANS(user_lat)) * SIN(RADIANS(u.latitude))
            )
        )::DOUBLE PRECISION AS distance_meters
    FROM public.units u
    WHERE u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND u.is_deleted = 'false'
      AND u.latitude BETWEEN user_lat - (radius_meters / 111320) AND user_lat + (radius_meters / 111320)
      AND u.longitude BETWEEN user_lng - (radius_meters / (111320 * COS(RADIANS(user_lat)))) AND user_lng + (radius_meters / (111320 * COS(RADIANS(user_lat))))
      AND (
          status_filter = 'all'
          OR (status_filter = 'active' AND u.is_available = true)
          OR (status_filter = 'inactive' AND u.is_available = false)
      )
    HAVING (
        6371000 * ACOS(
            COS(RADIANS(user_lat)) * COS(RADIANS(u.latitude)) *
            COS(RADIANS(u.longitude) - RADIANS(user_lng)) +
            SIN(RADIANS(user_lat)) * SIN(RADIANS(u.latitude))
        )
    ) <= radius_meters
    ORDER BY distance_meters ASC;
END;
$$;

-- 5. fc_orders_visits_assets_materials_update_value_total
DROP FUNCTION IF EXISTS public.fc_orders_visits_assets_materials_update_value_total() CASCADE;

CREATE OR REPLACE FUNCTION public.fc_orders_visits_assets_materials_update_value_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    RETURN NEW;
END;
$$;

-- Recreate trigger that depends on it
DROP TRIGGER IF EXISTS trg_orders_visits_assets_materials_update_value_total ON public.orders_visits_assets_materials;
CREATE TRIGGER trg_orders_visits_assets_materials_update_value_total
    BEFORE INSERT OR UPDATE ON public.orders_visits_assets_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_orders_visits_assets_materials_update_value_total();

-- 6. update_cfg_app_notices_updated_at (renamed from update_system_notices_updated_at)
DROP FUNCTION IF EXISTS public.update_cfg_app_notices_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_cfg_app_notices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$;

-- Recreate trigger that depends on it
DROP TRIGGER IF EXISTS trg_cfg_app_notices_updated_at ON public.cfg_app_notices;
CREATE TRIGGER trg_cfg_app_notices_updated_at
    BEFORE UPDATE ON public.cfg_app_notices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cfg_app_notices_updated_at();

-- Functions only in live database: ALTER FUNCTION with exception handling

DO $$
BEGIN
    ALTER FUNCTION public.fc_update_op_counter() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_dash_admin_orders_extras_filters() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_units_assets_tags_update_op_counter() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_description() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_orders_visits_assets_update_services_value() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;
