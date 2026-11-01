-- Registra permissões específicas para fechar e reabrir a disponibilidade
-- das equipes e confirmar o salvamento do calendário.

SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

INSERT INTO public.cfg_routes (
    route_key,
    route_path,
    description,
    icon,
    parent_id,
    order_index,
    is_available
)
VALUES
    (
        'dashboard_teams_shifts_calendar_close',
        '/dashboard/team-shifts/calendar-close',
        'Fechar mês da disponibilidade das equipes',
        'lock',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_teams_shifts'),
        25,
        true
    ),
    (
        'dashboard_teams_shifts_calendar_reopen',
        '/dashboard/team-shifts/calendar-reopen',
        'Reabrir mês da disponibilidade das equipes',
        'lock_open',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_teams_shifts'),
        26,
        true
    ),
    (
        'dashboard_teams_shifts_calendar',
        '/dashboard/team-shifts/calendar',
        'Confirmar lançamento da disponibilidade das equipes',
        'calendar_month',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_teams_shifts'),
        27,
        true
    )
ON CONFLICT (route_key) DO NOTHING;
