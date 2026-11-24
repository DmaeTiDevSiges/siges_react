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

-- 6) Líderes de visitas de HOJE (os que aparecem no mapa): idade do sinal x visita aberta/encerrada.
--    Visita ABERTA com sinal velho = falha real. Visita ENCERRADA com sinal velho = esperado
--    (o nativo pausa fora do expediente e sem visita aberta).
SELECT u.name_short, u.is_team_leader, u.tracker_interval_seconds,
       (v.ov_ended_at IS NULL) AS visita_aberta,
       t.tracker_heartbeat_at,
       round(extract(epoch FROM (timezone('America/Sao_Paulo', now()) - t.tracker_heartbeat_at)) / 3600) AS horas_sem_sinal,
       (SELECT count(*) FROM public.users_tracker_tokens k
         WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS tokens_ativos
FROM public.orders_visits v
JOIN public.users u ON u.id = v.ov_team_leader_id
LEFT JOIN public.users_tracker t ON t.user_id = u.id
WHERE v.is_deleted = false
  AND v.ov_started_at >= date_trunc('day', timezone('America/Sao_Paulo', now()))
ORDER BY visita_aberta DESC, horas_sem_sinal DESC NULLS FIRST;

-- 7) Um registro por líder com visita hoje: o token do aparelho foi usado depois do heartbeat?
--    last_used_at do token > heartbeat = o nativo envia mas algo não grava em users_tracker;
--    last_used_at velho/nulo = o serviço nativo não está rodando no aparelho.
--    ultimo_log/versao = o app foi aberto recentemente e em qual versão.
SELECT u.name_short,
       t.tracker_heartbeat_at,
       (SELECT max(k.last_used_at) FROM public.users_tracker_tokens k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS token_usado_em,
       (SELECT count(*) FROM public.users_tracker_tokens k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS tokens_ativos,
       (SELECT max(l.occurred_at) FROM public.logs_app_client_events l WHERE l.user_uuid = u.uuid) AS ultimo_log,
       (SELECT l.app_version FROM public.logs_app_client_events l WHERE l.user_uuid = u.uuid ORDER BY l.occurred_at DESC LIMIT 1) AS versao,
       (SELECT count(*) FROM public.logs_app_client_events l
         WHERE l.user_uuid = u.uuid AND l.message LIKE 'Rastreamento%' AND l.occurred_at >= now() - interval '7 days') AS erros_7d
FROM public.users u
LEFT JOIN public.users_tracker t ON t.user_id = u.id
WHERE u.id IN (SELECT v.ov_team_leader_id FROM public.orders_visits v
               WHERE v.is_deleted = false
                 AND v.ov_started_at >= date_trunc('day', timezone('America/Sao_Paulo', now())))
ORDER BY t.tracker_heartbeat_at NULLS FIRST;

-- 8) Por que fn_tracker_report_location devolveria 'paused'? A função atualiza last_used_at do token
--    e só grava a posição se is_available OU visita aberta (is_ov_in_progress / ov_id_in_progress > 0).
--    is_available = false e sem visita marcada → 'paused': o token "é usado" mas o heartbeat não anda.
SELECT u.name_short, u.is_available, u.is_ov_in_progress, u.ov_id_in_progress,
       t.tracker_heartbeat_at,
       (SELECT string_agg(v.id::text || ':' || CASE WHEN v.ov_ended_at IS NULL THEN 'aberta' ELSE 'encerrada' END
                          || ' ' || to_char(v.ov_started_at, 'DD/MM HH24:MI'), ' | ' ORDER BY v.ov_started_at)
          FROM public.orders_visits v
         WHERE v.ov_team_leader_id = u.id AND v.is_deleted = false
           AND v.ov_started_at >= date_trunc('day', timezone('America/Sao_Paulo', now())) - interval '7 days') AS visitas_7d
FROM public.users u
LEFT JOIN public.users_tracker t ON t.user_id = u.id
WHERE u.name_short IN ('Souza', 'Tarcisio', 'R.Vinicius', 'Jones', 'Yuri', 'Messias', 'Mario');

-- 9) tracked_at x heartbeat em users_tracker: nas funções do repositório os dois são gravados juntos
--    (fn_tracker_report_location e fn_users_tracker_report_session usam v_now nos dois).
--    tracked_at velho com heartbeat novo = a função/trigger AO VIVO difere do repositório.
SELECT u.name_short, t.tracked_at, t.tracker_heartbeat_at,
       round(extract(epoch FROM (t.tracker_heartbeat_at - t.tracked_at)) / 60) AS dif_min
FROM public.users_tracker t
JOIN public.users u ON u.id = t.user_id
ORDER BY t.tracker_heartbeat_at DESC NULLS LAST
LIMIT 20;

-- 10) Definição AO VIVO das funções que gravam em users_tracker (comparar com as migrations 20261111/20261121).
SELECT p.proname, pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_tracker_report_location', 'fn_users_tracker_report_session', 'fn_users_sync_position_to_tracker');

-- 11) Triggers em users_tracker e em users que tocam posição (algum pode sobrescrever tracked_at).
SELECT c.relname AS tabela, t.tgname, pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
  AND c.relname IN ('users_tracker', 'users')
  AND (c.relname = 'users_tracker' OR pg_get_triggerdef(t.oid) ILIKE '%tracker%' OR pg_get_triggerdef(t.oid) ILIKE '%tracked_at%');
