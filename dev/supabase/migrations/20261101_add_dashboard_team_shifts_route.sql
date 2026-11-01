-- Registra a permissão de visualização da aba Disponibilidade em Gestão.
-- Após aplicar, conceda can_view para os perfis desejados em Permissões.

SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

UPDATE public.cfg_routes
SET route_key = 'dashboard_teams_shifts'
WHERE route_key = 'dashboard_team_shifts'
  AND NOT EXISTS (
      SELECT 1
      FROM public.cfg_routes
      WHERE route_key = 'dashboard_teams_shifts'
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
VALUES (
    'dashboard_teams_shifts',
    '/dashboard/team-shifts',
    'Disponibilidade das Equipes (Gestão - aba Disponibilidade)',
    'calendar_month',
    (SELECT id FROM public.cfg_routes WHERE route_key = 'orders'),
    24,
    true
)
ON CONFLICT (route_key) DO NOTHING;
