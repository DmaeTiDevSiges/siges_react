-- Reverte 20261122_drop_users_legacy_tracker_columns.sql
-- Recria as colunas (vazias) em users, copia a posição atual de users_tracker e
-- recria o espelhamento users -> users_tracker da 20261121.
BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude             DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude            DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tracker_accuracy     DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tracked_at           TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tracker_heartbeat_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE public.users u
   SET latitude             = t.latitude,
       longitude            = t.longitude,
       tracker_accuracy     = t.tracker_accuracy,
       tracked_at           = t.tracked_at,
       tracker_heartbeat_at = t.tracker_heartbeat_at
  FROM public.users_tracker t
 WHERE t.user_id = u.id;

COMMIT;

-- Para religar o espelhamento de APKs antigos, reaplique 20261121_sync_users_position_to_users_tracker.sql.
