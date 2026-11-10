-- ==============================================================================
-- Migration: 20261123_add_offline_enabled.sql
-- Modo offline (F5) — liberação pelo banco + telemetria da fila.
--
-- 1. Liberação (item 5.3). O modo offline só liga com DUAS chaves:
--      a) flag do APK  VITE_FEATURE_OFFLINE_MODE=true  (build)
--      b) esta chave no banco, por empresa ou por usuário:
--         users.offline_enabled          TRUE  = liga para o usuário
--                                        FALSE = desliga para o usuário
--                                        NULL  = segue a empresa (padrão)
--         cfg_companies.offline_enabled  TRUE/FALSE (padrão FALSE)
--    Empresa do usuário = a da equipe (cfg_teams.company_id), igual ao
--    getCurrentUser; se não houver equipe, users.company_id.
--    Sem esta migration aplicada, o app considera a chave do banco ABERTA
--    (comportamento anterior: só a flag do APK). Depois de aplicada, o offline
--    fica DESLIGADO para todos até ser liberado — é o que permite o piloto.
--    Desligar NÃO apaga a fila: o que estiver no aparelho continua subindo.
--
-- 2. Telemetria (item 5.4): logs_app_client_events passa a aceitar o tipo
--    'offline_sync' (resumo de cada rodada de envio da fila).
--
-- Idempotente. Reverter: 20261123_add_offline_enabled_DOWN.sql
-- ==============================================================================

BEGIN;

-- ── 1. Liberação ─────────────────────────────────────────────────────────────
ALTER TABLE public.cfg_companies ADD COLUMN IF NOT EXISTS offline_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users         ADD COLUMN IF NOT EXISTS offline_enabled BOOLEAN;

COMMENT ON COLUMN public.cfg_companies.offline_enabled IS
    'Modo offline do técnico liberado para a empresa (além da flag VITE_FEATURE_OFFLINE_MODE do APK).';
COMMENT ON COLUMN public.users.offline_enabled IS
    'Modo offline: TRUE liga, FALSE desliga para o usuário; NULL segue cfg_companies.offline_enabled.';

CREATE OR REPLACE FUNCTION public.fn_offline_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(u.offline_enabled, c.offline_enabled, false)
      FROM public.users u
      LEFT JOIN public.cfg_teams t ON t.id = u.team_id
      LEFT JOIN public.cfg_companies c ON c.id = COALESCE(t.company_id, u.company_id)
     WHERE u.uuid = auth.uid()
     LIMIT 1;
$$;

COMMENT ON FUNCTION public.fn_offline_enabled() IS
    'Modo offline liberado para o usuário logado (usuário > empresa > false). SECURITY INVOKER.';

REVOKE ALL ON FUNCTION public.fn_offline_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_offline_enabled() TO authenticated, service_role;

-- ── 2. Telemetria: novo tipo de evento ───────────────────────────────────────
DO $$
DECLARE
    v_name TEXT;
BEGIN
    FOR v_name IN
        SELECT con.conname
          FROM pg_constraint con
         WHERE con.conrelid = 'public.logs_app_client_events'::regclass
           AND con.contype = 'c'
           AND pg_get_constraintdef(con.oid) ILIKE '%event_type%'
    LOOP
        EXECUTE format('ALTER TABLE public.logs_app_client_events DROP CONSTRAINT %I', v_name);
    END LOOP;
END $$;

ALTER TABLE public.logs_app_client_events
    ADD CONSTRAINT logs_app_client_events_event_type_check CHECK (event_type IN (
        'error', 'unhandled_rejection', 'boundary', 'reload',
        'unexpected_restart', 'restored_after_kill', 'app_restored_result',
        'offline_sync'
    ));

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ── Como liberar (piloto) ────────────────────────────────────────────────────
--   -- 2 ou 3 técnicos:
--   UPDATE public.users SET offline_enabled = true WHERE id IN (123, 456);
--   -- empresa inteira:
--   UPDATE public.cfg_companies SET offline_enabled = true WHERE id = 7;
--   -- tirar um usuário da empresa liberada:
--   UPDATE public.users SET offline_enabled = false WHERE id = 789;
--
-- Conferência (logado no app como o técnico, ou via SQL com o uuid dele):
--   SELECT public.fn_offline_enabled();
--   SELECT id, name_short, offline_enabled FROM public.users WHERE offline_enabled IS NOT NULL;
--   -- Telemetria da fila:
--   SELECT created_at, user_uuid, message, extra
--     FROM public.logs_app_client_events
--    WHERE event_type = 'offline_sync' ORDER BY id DESC LIMIT 50;
