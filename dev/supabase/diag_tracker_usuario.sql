-- Por que um usuário está sem sinal no mapa? Somente leitura. Trocar o nome em :nome (ILIKE).
-- Rodar no SQL Editor, uma consulta por vez. Horários de users_tracker: America/Sao_Paulo (sem offset).

-- 1) Cadastro: o rastreamento só roda para líder de equipe, com intervalo > 0.
--    Se is_team_leader = false ou tracker_interval_seconds nulo/0, o app nem tenta rastrear.
--    shift_start/shift_end: fora do expediente e sem visita aberta o serviço nativo pausa.
SELECT id, name_short, is_team_leader, tracker_interval_seconds, shift_start, shift_end,
       is_available, ov_id_in_progress, is_active
FROM public.users
WHERE name_short ILIKE '%Mario%';

-- 2) Última posição e heartbeat gravados.
SELECT u.name_short, t.latitude, t.longitude, t.tracked_at, t.tracker_heartbeat_at,
       round(extract(epoch FROM (timezone('America/Sao_Paulo', now()) - t.tracker_heartbeat_at)) / 3600) AS horas_sem_sinal
FROM public.users u
LEFT JOIN public.users_tracker t ON t.user_id = u.id
WHERE u.name_short ILIKE '%Mario%';

-- 3) Tokens do aparelho: sem token = o nativo nunca conseguiu se registrar;
--    revoked_at preenchido = token revogado; last_used_at velho = nativo não está gravando.
SELECT k.device_id, k.created_at, k.last_used_at, k.revoked_at, left(k.device_info, 100) AS aparelho
FROM public.users_tracker_tokens k
JOIN public.users u ON u.id = k.user_id
WHERE u.name_short ILIKE '%Mario%'
ORDER BY k.created_at DESC;

-- 4) Eventos/erros do rastreamento nos últimos 7 dias (stage: token, native_start, persist_location...).
SELECT l.occurred_at, l.app_version, l.message, left(l.extra::text, 300) AS extra
FROM public.logs_app_client_events l
JOIN public.users u ON u.uuid = l.user_uuid
WHERE u.name_short ILIKE '%Mario%'
  AND l.message LIKE 'Rastreamento%'
  AND l.occurred_at >= now() - interval '7 days'
ORDER BY l.occurred_at DESC
LIMIT 50;

-- 5) Última atividade dele no app (qualquer log): se também parou, o app nem foi aberto.
SELECT max(l.occurred_at) AS ultimo_evento_qualquer, max(l.app_version) AS versao
FROM public.logs_app_client_events l
JOIN public.users u ON u.uuid = l.user_uuid
WHERE u.name_short ILIKE '%Mario%';
