-- Keep persisted leader positions aligned with the dashboard ranking:
-- rounded compliance, visit count, then fewer failed evaluations.
CREATE OR REPLACE FUNCTION public.recalculate_leader_monthly_score(
    p_leader_id bigint,
    p_year int,
    p_month int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    IF COALESCE(auth.role(), '') <> 'service_role' AND NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.uuid = auth.uid()
          AND (
              u.is_admin_super = TRUE
              OR EXISTS (
                  SELECT 1
                  FROM public.cfg_profiles_access pa
                  JOIN public.cfg_routes r ON r.id = pa.route_id
                  WHERE pa.profile_id = u.profile_id
                    AND r.route_key = 'dashboard_contracts_evaluations'
                    AND r.is_available = TRUE
                    AND pa.can_view = TRUE
              )
          )
    ) THEN
        RAISE EXCEPTION 'Permission denied to recalculate leader scores'
            USING ERRCODE = '42501';
    END IF;

    SELECT u.name_short, d.id, d.description
    INTO v_leader_name, v_dept_id, v_dept_name
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
            ROW_NUMBER() OVER (
                PARTITION BY department_id, score_year, score_month
                ORDER BY
                    ROUND(avg_compliance_score) DESC,
                    total_visits DESC,
                    failed_evaluations ASC,
                    leader_id ASC
            ) AS new_rank
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

REVOKE ALL ON FUNCTION public.recalculate_leader_monthly_score(bigint, int, int)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_leader_monthly_score(bigint, int, int)
    TO authenticated, service_role;
