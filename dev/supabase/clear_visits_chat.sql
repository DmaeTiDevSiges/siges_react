-- ==============================================================================
-- Script de manutenção: limpar o chat das visitas e reiniciar os ids
-- Rodar manualmente no SQL Editor do Supabase. NÃO é migration.
--
-- IRREVERSÍVEL: apaga TODAS as mensagens de chat de TODAS as visitas.
-- Se quiser guardar uma cópia, rode antes o bloco 0 (backup).
--
-- O que faz:
--   1. Apaga as mensagens (orders_visits_chat) e as confirmações de leitura
--      (orders_visits_chat_reads) e reinicia os ids das duas em 1.
--   2. Apaga as notificações de chat (users_notifications.type = 'visit_chat').
--   3. Volta o estado do chat das visitas para "aberto, sem responsável"
--      (o próximo a escrever passa a ser quem pode encerrar).
--   Participantes (orders_visits_chat_participants) são MANTIDOS — quem já
--   participava continua recebendo notificações. Para apagar também, use o
--   bloco 4 (opcional).
--
-- Tabelas de chat não têm gatilho de auditoria (ver 20261047), então a limpeza
-- não gera registros em audits_logs.
-- ==============================================================================

-- ── 0) Backup opcional (descomente para guardar uma cópia antes) ─────────────
-- CREATE TABLE IF NOT EXISTS backup_orders_visits_chat_20261108 AS TABLE public.orders_visits_chat;
-- CREATE TABLE IF NOT EXISTS backup_orders_visits_chat_reads_20261108 AS TABLE public.orders_visits_chat_reads;

-- Contagem antes (para conferir)
SELECT
    (SELECT count(*) FROM public.orders_visits_chat)       AS mensagens,
    (SELECT count(*) FROM public.orders_visits_chat_reads) AS leituras,
    (SELECT count(*) FROM public.users_notifications WHERE type = 'visit_chat') AS notificacoes_chat;

BEGIN;

-- ── 1) Mensagens + leituras, ids reiniciados ─────────────────────────────────
-- Sem CASCADE: se alguma outra tabela referenciar estas, o TRUNCATE falha e nada
-- é apagado (melhor que apagar em cascata algo inesperado).
TRUNCATE TABLE public.orders_visits_chat, public.orders_visits_chat_reads RESTART IDENTITY;

-- ── 2) Notificações de chat ──────────────────────────────────────────────────
DELETE FROM public.users_notifications WHERE type = 'visit_chat';

-- ── 3) Estado do chat nas visitas ────────────────────────────────────────────
-- Só as linhas que mudam (evita disparar gatilhos de orders_visits à toa).
UPDATE public.orders_visits
SET chat_status          = 'open',
    chat_created_user_id = NULL,
    chat_closed_at       = NULL,
    chat_closed_user_id  = NULL
WHERE chat_status IS DISTINCT FROM 'open'
   OR chat_created_user_id IS NOT NULL
   OR chat_closed_at IS NOT NULL
   OR chat_closed_user_id IS NOT NULL;

-- ── 4) Opcional: participantes também (descomente) ───────────────────────────
-- TRUNCATE TABLE public.orders_visits_chat_participants RESTART IDENTITY;

COMMIT;

-- ── Conferência ──────────────────────────────────────────────────────────────
-- Esperado: 0, 0, 0 e o próximo id = 1.
SELECT
    (SELECT count(*) FROM public.orders_visits_chat)       AS mensagens,
    (SELECT count(*) FROM public.orders_visits_chat_reads) AS leituras,
    (SELECT count(*) FROM public.users_notifications WHERE type = 'visit_chat') AS notificacoes_chat,
    (SELECT last_value FROM public.orders_visits_chat_id_seq) AS seq_chat_last_value,
    (SELECT is_called  FROM public.orders_visits_chat_id_seq) AS seq_chat_ja_usada;  -- false = próximo id é 1
