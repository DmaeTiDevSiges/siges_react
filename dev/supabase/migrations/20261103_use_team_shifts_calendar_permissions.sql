-- Atualiza as RPCs do calendário para respeitar as permissões por rota.
-- Aplicar manualmente após 20261102_add_team_shifts_calendar_permissions.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_team_shifts_calendar(
    p_reference_month DATE,
    p_department_id BIGINT
)
RETURNS TABLE(team_id BIGINT, shift_date DATE, shift_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
    v_is_admin_super BOOLEAN;
BEGIN
    SELECT u.id, u.is_admin_super
      INTO v_user_id, v_is_admin_super
      FROM public.users u
     WHERE u.uuid = auth.uid();

    IF v_user_id IS NULL
       OR (
           v_is_admin_super IS NOT TRUE
           AND NOT EXISTS (
               SELECT 1
                 FROM public.cfg_profiles_access pa
                 JOIN public.cfg_routes r ON r.id = pa.route_id
                 JOIN public.users u ON u.profile_id = pa.profile_id
                WHERE u.id = v_user_id
                  AND r.route_key = 'dashboard_teams_shifts_calendar'
                  AND r.is_available IS TRUE
                  AND pa.can_view IS TRUE
           )
       ) THEN
        RAISE EXCEPTION 'Você não tem permissão para consultar o calendário de turnos'
            USING ERRCODE = '42501';
    END IF;

    IF p_reference_month IS NULL
       OR p_reference_month <> date_trunc('month', p_reference_month)::date
       OR p_department_id IS NULL THEN
        RAISE EXCEPTION 'Informe o primeiro dia do mês e um departamento válido'
            USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    SELECT c.team_id, c.shift_date, c.shift_type
      FROM public.teams_shifts_calendar c
      JOIN public.cfg_teams t ON t.id = c.team_id
     WHERE t.department_id = p_department_id
       AND t.is_evaluable IS TRUE
       AND c.shift_date >= p_reference_month
       AND c.shift_date < (p_reference_month + INTERVAL '1 month')::date
     ORDER BY c.shift_date, c.team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_team_shifts_calendar(
    p_reference_month DATE,
    p_department_id BIGINT,
    p_entries JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
    v_is_admin_super BOOLEAN;
    v_item JSONB;
    v_team_id BIGINT;
    v_shift_date DATE;
    v_change_count INTEGER;
    v_unique_count INTEGER;
BEGIN
    SELECT u.id, u.is_admin_super
      INTO v_user_id, v_is_admin_super
      FROM public.users u
     WHERE u.uuid = auth.uid();

    IF v_user_id IS NULL
       OR (
           v_is_admin_super IS NOT TRUE
           AND NOT EXISTS (
               SELECT 1
                 FROM public.cfg_profiles_access pa
                 JOIN public.cfg_routes r ON r.id = pa.route_id
                 JOIN public.users u ON u.profile_id = pa.profile_id
                WHERE u.id = v_user_id
                  AND r.route_key = 'dashboard_teams_shifts_calendar'
                  AND r.is_available IS TRUE
                  AND pa.can_create IS TRUE
           )
       ) THEN
        RAISE EXCEPTION 'Você não tem permissão para alterar o calendário de turnos'
            USING ERRCODE = '42501';
    END IF;

    IF p_reference_month IS NULL
       OR p_reference_month <> date_trunc('month', p_reference_month)::date
       OR p_department_id IS NULL
       OR jsonb_typeof(p_entries) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Informe o primeiro dia do mês, o departamento e uma lista de turnos válida'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.teams_shifts_months m
         WHERE m.reference_month = p_reference_month
           AND m.department_id = p_department_id
    ) THEN
        RAISE EXCEPTION 'Este mês está fechado e não pode mais ser editado'
            USING ERRCODE = '55000';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_entries) AS entries(value)
    LOOP
        IF jsonb_typeof(v_item -> 'team_id') IS DISTINCT FROM 'number'
           OR jsonb_typeof(v_item -> 'shift_date') IS DISTINCT FROM 'string'
           OR jsonb_typeof(v_item -> 'shift_type') IS DISTINCT FROM 'string'
           OR v_item ->> 'shift_type' NOT IN ('TN', 'TE')
           OR (v_item ->> 'team_id') !~ '^[0-9]+$'
           OR (v_item ->> 'shift_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
            RAISE EXCEPTION 'Cada marcação deve informar team_id, shift_date e shift_type TN ou TE'
                USING ERRCODE = '22023';
        END IF;

        v_team_id := (v_item ->> 'team_id')::BIGINT;
        v_shift_date := (v_item ->> 'shift_date')::DATE;

        IF v_shift_date < p_reference_month
           OR v_shift_date >= (p_reference_month + INTERVAL '1 month')::date THEN
            RAISE EXCEPTION 'As marcações devem estar dentro do mês selecionado'
                USING ERRCODE = '22023';
        END IF;

        IF NOT EXISTS (
            SELECT 1
              FROM public.cfg_teams t
             WHERE t.id = v_team_id
               AND t.department_id = p_department_id
               AND t.is_evaluable IS TRUE
        ) THEN
            RAISE EXCEPTION 'Equipe não avaliável ou fora do departamento selecionado: %', v_team_id
                USING ERRCODE = '22023';
        END IF;
    END LOOP;

    SELECT count(*),
           count(DISTINCT (value ->> 'team_id') || ':' || (value ->> 'shift_date') || ':' || (value ->> 'shift_type'))
      INTO v_change_count, v_unique_count
      FROM jsonb_array_elements(p_entries) AS entries(value);

    IF v_change_count <> v_unique_count THEN
        RAISE EXCEPTION 'Há marcações duplicadas do mesmo tipo para a equipe e data'
            USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.teams_shifts_calendar c
     USING public.cfg_teams t
     WHERE c.team_id = t.id
       AND t.department_id = p_department_id
       AND t.is_evaluable IS TRUE
       AND c.shift_date >= p_reference_month
       AND c.shift_date < (p_reference_month + INTERVAL '1 month')::date;

    INSERT INTO public.teams_shifts_calendar (team_id, shift_date, shift_type, updated_by, updated_at)
    SELECT (value ->> 'team_id')::BIGINT,
           (value ->> 'shift_date')::DATE,
           value ->> 'shift_type',
           v_user_id,
           timezone('America/Sao_Paulo', now())
      FROM jsonb_array_elements(p_entries) AS entries(value);

    UPDATE public.teams_shifts_records r
       SET normal_shifts = 0,
           extra_shifts = 0,
           updated_by = v_user_id,
           updated_at = timezone('America/Sao_Paulo', now())
      FROM public.cfg_teams t
     WHERE r.team_id = t.id
       AND r.reference_month = p_reference_month
       AND t.department_id = p_department_id
       AND t.is_evaluable IS TRUE;

    INSERT INTO public.teams_shifts_records (
        team_id, reference_month, normal_shifts, extra_shifts, created_by, updated_by, updated_at
    )
    SELECT c.team_id,
           p_reference_month,
           count(*) FILTER (WHERE c.shift_type = 'TN')::INTEGER,
           count(*) FILTER (WHERE c.shift_type = 'TE')::INTEGER,
           v_user_id,
           v_user_id,
           timezone('America/Sao_Paulo', now())
      FROM public.teams_shifts_calendar c
      JOIN public.cfg_teams t ON t.id = c.team_id
     WHERE t.department_id = p_department_id
       AND t.is_evaluable IS TRUE
       AND c.shift_date >= p_reference_month
       AND c.shift_date < (p_reference_month + INTERVAL '1 month')::date
     GROUP BY c.team_id
    ON CONFLICT (team_id, reference_month) DO UPDATE
       SET normal_shifts = EXCLUDED.normal_shifts,
           extra_shifts = EXCLUDED.extra_shifts,
           updated_by = EXCLUDED.updated_by,
           updated_at = EXCLUDED.updated_at;

    DELETE FROM public.teams_shifts_records r
     USING public.cfg_teams t
     WHERE r.team_id = t.id
       AND r.reference_month = p_reference_month
       AND r.normal_shifts = 0
       AND r.extra_shifts = 0
       AND r.note IS NULL
       AND t.department_id = p_department_id
       AND t.is_evaluable IS TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_shifts_calendar(date, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_team_shifts_calendar(date, bigint, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_shifts_calendar(date, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_team_shifts_calendar(date, bigint, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
