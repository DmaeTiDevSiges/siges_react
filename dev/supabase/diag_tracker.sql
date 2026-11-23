-- Diagnóstico do rastreamento (somente leitura). Rodar no SQL Editor, uma consulta por vez.
-- Fonte: logs_app_client_events (stages gravados por hooks/useLocationTracker.ts e
-- services/users/trackerService.ts) e users_tracker (última posição por usuário).
-- Horários de users_tracker estão em America/Sao_Paulo (sem offset).

-- 1) Falhas por dia, etapa e versão: mostra se as correções reduziram o problema
--    depois do deploy (stages: token, token_attempts, native_start, persist_location, web_watch).
SELECT date_trunc('day', occurred_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
       extra->>'stage'  AS etapa,
       app_version,
       count(*)                       AS eventos,
       count(DISTINCT user_uuid)      AS usuarios
FROM public.logs_app_client_events
WHERE message LIKE 'Rastreamento%'
  AND occurred_at >= now() - interval '14 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;

-- 2) "Failed to fetch": aparelho ou servidor? Concentração por hora e nº de usuários.
--    Muitos usuários na mesma hora = servidor/Cloudflare; um usuário repetido = aparelho/rede dele.
--    (Os campos online/netType/rtt/visibility só existem nos logs gerados após esta mudança.)
SELECT date_trunc('hour', occurred_at AT TIME ZONE 'America/Sao_Paulo') AS hora,
       count(*)                  AS eventos,
       count(DISTINCT user_uuid) AS usuarios,
       count(*) FILTER (WHERE extra->>'online' = 'false')        AS offline,
       count(*) FILTER (WHERE extra->>'visibility' = 'hidden')   AS app_oculto,
       round(avg((extra->>'rtt')::numeric))                      AS rtt_medio_ms
FROM public.logs_app_client_events
WHERE message LIKE 'Rastreamento%Failed to fetch%'
  AND occurred_at >= now() - interval '14 days'
GROUP BY 1
ORDER BY 1 DESC;

-- 3) Quem mais falha (para contatar/olhar o aparelho).
SELECT u.name_short, l.user_uuid, count(*) AS falhas, max(l.occurred_at) AS ultima,
       max(l.app_version) AS versao
FROM public.logs_app_client_events l
LEFT JOIN public.users u ON u.uuid = l.user_uuid
WHERE l.message LIKE 'Rastreamento%'
  AND l.occurred_at >= now() - interval '14 days'
GROUP BY 1, 2
ORDER BY falhas DESC
LIMIT 20;

-- 4) Alerta: líderes de equipe com heartbeat velho DENTRO do expediente
--    (rastreamento parado). Limite = 3x o intervalo configurado, no mínimo 10 min.
SELECT u.id, u.name_short, u.shift_start, u.shift_end, u.tracker_interval_seconds,
       t.tracker_heartbeat_at,
       round(extract(epoch FROM (timezone('America/Sao_Paulo', now()) - t.tracker_heartbeat_at)) / 60) AS minutos_sem_sinal
FROM public.users u
LEFT JOIN public.users_tracker t ON t.user_id = u.id
WHERE u.is_team_leader = true
  AND timezone('America/Sao_Paulo', now())::time BETWEEN u.shift_start AND u.shift_end
  AND (
        t.tracker_heartbeat_at IS NULL
        OR t.tracker_heartbeat_at < timezone('America/Sao_Paulo', now())
           - make_interval(secs => greatest(coalesce(u.tracker_interval_seconds, 300) * 3, 600))
      )
ORDER BY minutos_sem_sinal DESC NULLS FIRST;

-- 5) Tokens por aparelho. revoked_at nulo + last_used_at recente = serviço nativo gravando;
--    last_used_at velho/nulo = o token foi emitido mas o nativo não está reportando.
SELECT u.name_short, k.device_id, k.created_at, k.last_used_at, k.revoked_at,
       left(k.device_info, 80) AS aparelho
FROM public.users_tracker_tokens k
JOIN public.users u ON u.id = k.user_id
ORDER BY k.created_at DESC
LIMIT 30;
