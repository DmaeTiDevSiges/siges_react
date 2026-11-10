-- ==============================================================================
-- Reverte 20261123_add_offline_enabled.sql
-- Sem a função, o app volta a considerar a chave do banco aberta (só a flag do APK).
-- Apaga os eventos 'offline_sync' antes de restaurar a restrição antiga.
-- ==============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.fn_offline_enabled();

ALTER TABLE public.users         DROP COLUMN IF EXISTS offline_enabled;
ALTER TABLE public.cfg_companies DROP COLUMN IF EXISTS offline_enabled;

DELETE FROM public.logs_app_client_events WHERE event_type = 'offline_sync';

ALTER TABLE public.logs_app_client_events DROP CONSTRAINT IF EXISTS logs_app_client_events_event_type_check;
ALTER TABLE public.logs_app_client_events
    ADD CONSTRAINT logs_app_client_events_event_type_check CHECK (event_type IN (
        'error', 'unhandled_rejection', 'boundary', 'reload',
        'unexpected_restart', 'restored_after_kill', 'app_restored_result'
    ));

COMMIT;

NOTIFY pgrst, 'reload schema';
