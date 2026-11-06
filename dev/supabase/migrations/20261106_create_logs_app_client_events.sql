-- ==============================================================================
-- Migration: 20261106_create_logs_app_client_events.sql
-- Diagnóstico de "app reinicia sozinho" (web) e "app fecha sozinho" (APK).
-- Aplicar manualmente no SQL Editor do Supabase.
--
-- O cliente (services/core/clientDiagnosticsService.ts) grava aqui:
--   error               erro JS não tratado (window error)
--   unhandled_rejection promise rejeitada sem catch
--   boundary            erro capturado pelo ErrorBoundary (tela quebrou)
--   reload              recarga automática do app, com o motivo em message
--                       (chunk_error, update, error_boundary, ...)
--   unexpected_restart  app reabriu sem ter sido fechado/minimizado
--                       (APK: provável crash/OOM da WebView)
--   restored_after_kill app reabriu depois de ir para segundo plano
--                       (Android encerrou o processo, ex.: durante a câmera)
--   app_restored_result plugin Capacitor devolveu resultado após restaurar
--                       (ex.: foto tirada enquanto o app foi encerrado)
--
-- Inserção liberada para anon/authenticated (erros podem ocorrer antes do
-- login). Leitura somente super admin. Tamanhos limitados para evitar abuso.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.logs_app_client_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    occurred_at TIMESTAMPTZ,
    user_uuid UUID DEFAULT auth.uid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'error', 'unhandled_rejection', 'boundary', 'reload',
        'unexpected_restart', 'restored_after_kill', 'app_restored_result'
    )),
    message TEXT CHECK (message IS NULL OR length(message) <= 2000),
    stack TEXT CHECK (stack IS NULL OR length(stack) <= 8000),
    screen TEXT CHECK (screen IS NULL OR length(screen) <= 200),
    url TEXT CHECK (url IS NULL OR length(url) <= 1000),
    app_version TEXT CHECK (app_version IS NULL OR length(app_version) <= 100),
    platform TEXT CHECK (platform IS NULL OR length(platform) <= 30),
    user_agent TEXT CHECK (user_agent IS NULL OR length(user_agent) <= 500),
    session_id TEXT CHECK (session_id IS NULL OR length(session_id) <= 64),
    extra JSONB CHECK (extra IS NULL OR (jsonb_typeof(extra) = 'object' AND length(extra::text) <= 4000))
);

CREATE INDEX IF NOT EXISTS idx_logs_app_client_events_created_at
    ON public.logs_app_client_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_app_client_events_type_created
    ON public.logs_app_client_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_app_client_events_user
    ON public.logs_app_client_events (user_uuid, created_at DESC);

ALTER TABLE public.logs_app_client_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.logs_app_client_events FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.logs_app_client_events TO anon, authenticated;
GRANT SELECT ON public.logs_app_client_events TO authenticated;
GRANT ALL ON public.logs_app_client_events TO service_role;

DROP POLICY IF EXISTS "Client events: insert" ON public.logs_app_client_events;
CREATE POLICY "Client events: insert"
    ON public.logs_app_client_events FOR INSERT TO anon, authenticated
    -- Ninguém grava em nome de outro usuário.
    WITH CHECK (user_uuid IS NULL OR user_uuid = auth.uid());

DROP POLICY IF EXISTS "Client events: super admin read" ON public.logs_app_client_events;
CREATE POLICY "Client events: super admin read"
    ON public.logs_app_client_events FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.uuid = auth.uid() AND u.is_admin_super IS TRUE
    ));

COMMENT ON TABLE public.logs_app_client_events IS
    'Erros e recargas/fechamentos inesperados do app (web e APK) para diagnóstico.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Consultas úteis:
--   -- Últimos eventos, com usuário
--   SELECT e.created_at, e.event_type, e.platform, e.app_version, e.screen,
--          e.message, u.name_short
--     FROM public.logs_app_client_events e
--     LEFT JOIN public.users u ON u.uuid = e.user_uuid
--    ORDER BY e.created_at DESC
--    LIMIT 200;
--
--   -- Resumo por tipo/motivo nos últimos 7 dias
--   SELECT event_type, platform, left(message, 80) AS motivo, count(*)
--     FROM public.logs_app_client_events
--    WHERE created_at > timezone('America/Sao_Paulo', now()) - interval '7 days'
--    GROUP BY 1, 2, 3
--    ORDER BY 4 DESC;
--
-- Retenção sugerida (rodar periodicamente):
--   DELETE FROM public.logs_app_client_events
--    WHERE created_at < timezone('America/Sao_Paulo', now()) - interval '60 days';
