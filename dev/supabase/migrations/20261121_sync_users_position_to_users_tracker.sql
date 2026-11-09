-- ==============================================================================
-- Migration: 20261121_sync_users_position_to_users_tracker.sql
-- Compatibilidade com APKs antigos (<= 1.1.62) depois da 20261111.
--
-- Problema: desde a 20261111 o mapa (UsersTracker, líderes) lê a posição de
-- public.users_tracker. Os APKs até a 1.1.62 não usam fn_tracker_report_location:
-- o serviço nativo faz PATCH direto em public.users (latitude, longitude,
-- tracker_heartbeat_at, tracked_at). Para esses aparelhos users_tracker parou
-- na carga inicial da 20261111 → marcador com posição, distância e "há X h"
-- desatualizados, embora o aparelho continue enviando.
--
-- Solução: trigger em users que espelha essas gravações em users_tracker,
-- só quando a posição de users for MAIS NOVA que a de users_tracker (não
-- sobrescreve o que os clientes novos gravaram pelas funções). Inclui uma
-- recarga única com o que já está mais novo em users.
--
-- Pode ser removida quando não houver mais APK <= 1.1.62 em uso.
-- Requer 20261111_use_users_tracker_last_location.sql aplicada antes.
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261121_sync_users_position_to_users_tracker_DOWN.sql
-- ==============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.users_tracker') IS NULL
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'users_tracker'
                         AND column_name = 'tracker_heartbeat_at') THEN
        RAISE EXCEPTION 'Aplique antes 20261111_use_users_tracker_last_location.sql.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_users_sync_position_to_tracker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_at TIMESTAMP WITHOUT TIME ZONE := COALESCE(NEW.tracker_heartbeat_at, NEW.tracked_at);
BEGIN
    IF NEW.latitude IS NULL OR NEW.longitude IS NULL OR v_new_at IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.users_tracker AS t
           (user_id, latitude, longitude, tracker_accuracy, tracked_at, tracker_heartbeat_at)
    VALUES (NEW.id, NEW.latitude, NEW.longitude, NEW.tracker_accuracy,
            COALESCE(NEW.tracked_at, v_new_at), v_new_at)
    ON CONFLICT (user_id) DO UPDATE
       SET latitude             = EXCLUDED.latitude,
           longitude            = EXCLUDED.longitude,
           tracker_accuracy     = COALESCE(EXCLUDED.tracker_accuracy, t.tracker_accuracy),
           tracked_at           = EXCLUDED.tracked_at,
           tracker_heartbeat_at = EXCLUDED.tracker_heartbeat_at
     WHERE t.tracker_heartbeat_at IS NULL
        OR EXCLUDED.tracker_heartbeat_at > t.tracker_heartbeat_at;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_users_sync_position_to_tracker() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_users_sync_position_to_tracker ON public.users;
CREATE TRIGGER trg_users_sync_position_to_tracker
AFTER UPDATE OF latitude, longitude, tracker_heartbeat_at, tracked_at ON public.users
FOR EACH ROW
WHEN (
    NEW.latitude IS DISTINCT FROM OLD.latitude
    OR NEW.longitude IS DISTINCT FROM OLD.longitude
    OR NEW.tracker_heartbeat_at IS DISTINCT FROM OLD.tracker_heartbeat_at
    OR NEW.tracked_at IS DISTINCT FROM OLD.tracked_at
)
EXECUTE FUNCTION public.fn_users_sync_position_to_tracker();

-- Recarga única: traz para users_tracker o que já está mais novo em users.
INSERT INTO public.users_tracker AS t
       (user_id, latitude, longitude, tracker_accuracy, tracked_at, tracker_heartbeat_at)
SELECT u.id, u.latitude, u.longitude, u.tracker_accuracy,
       COALESCE(u.tracked_at, u.tracker_heartbeat_at),
       COALESCE(u.tracker_heartbeat_at, u.tracked_at)
  FROM public.users u
 WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL
   AND COALESCE(u.tracker_heartbeat_at, u.tracked_at) IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
   SET latitude             = EXCLUDED.latitude,
       longitude            = EXCLUDED.longitude,
       tracker_accuracy     = COALESCE(EXCLUDED.tracker_accuracy, t.tracker_accuracy),
       tracked_at           = EXCLUDED.tracked_at,
       tracker_heartbeat_at = EXCLUDED.tracker_heartbeat_at
 WHERE t.tracker_heartbeat_at IS NULL
    OR EXCLUDED.tracker_heartbeat_at > t.tracker_heartbeat_at;

COMMENT ON COLUMN public.users.latitude IS
    'LEGADA: só APKs <= 1.1.62 gravam aqui; trg_users_sync_position_to_tracker espelha em users_tracker (fonte da posição atual).';

COMMIT;

-- Conferência (users mais novo que users_tracker deve dar 0 linhas):
--   SELECT u.id, u.name_short, u.tracker_heartbeat_at AS users_hb, t.tracker_heartbeat_at AS tracker_hb
--     FROM public.users u JOIN public.users_tracker t ON t.user_id = u.id
--    WHERE u.tracker_heartbeat_at > t.tracker_heartbeat_at;
