-- ==============================================================================
-- Migration: 20261201_fix_fn_tracker_report_location_users_tracker.sql
-- Corrige: users_tracker (tracked_at / tracker_heartbeat_at / posição) não atualizava
-- para quem envia pelo serviço nativo (APK com token).
--
-- Causa (conferida no banco ao vivo com pg_get_functiondef):
--   fn_tracker_report_location está na versão da 20261106 — faz UPDATE em public.users
--   (latitude, longitude, tracker_heartbeat_at, tracked_at). O mapa lê public.users_tracker
--   desde a 20261111, então nada do APK chegava lá (o token era "usado" — last_used_at
--   avançava —, mas a posição ia só para users). fn_users_tracker_report_session (web)
--   já estava correta, por isso só quem enviava pela web aparecia atualizado.
--   Provável: a 20261106 foi reaplicada depois da 20261111 e sobrescreveu a função.
--
-- Atenção: a 20261122 (remove latitude/longitude/tracker_* de public.users) JÁ está aplicada
--   (users.latitude não existe mais). Com a função antiga isso faz o UPDATE em users falhar
--   a cada envio do APK — a posição do serviço nativo não é gravada em lugar nenhum. Esta
--   migration é, portanto, urgente. Não há o que recarregar de users (as colunas sumiram).
--
-- O que faz:
--   Recria fn_tracker_report_location gravando em users_tracker (igual à 20261111).
--
-- NÃO reaplicar a 20261106 depois desta (ela volta a função antiga).
-- APK <= 1.1.62 (grava direto em users) não funciona mais depois da 20261122: precisa atualizar o app.
-- Requer 20261111 aplicada. Aplicar manualmente no SQL Editor. Idempotente.
-- Sem DOWN: a versão antiga referencia colunas que não existem mais (a função quebraria).
-- ==============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.users_tracker') IS NULL
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'users_tracker'
                         AND column_name = 'tracker_heartbeat_at') THEN
        RAISE EXCEPTION 'Aplique antes 20261111_use_users_tracker_last_location.sql (users_tracker ausente/incompleta).';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_tracker_report_location(
    p_token TEXT,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token_id BIGINT;
    v_user_id BIGINT;
    v_is_available BOOLEAN;
    v_in_visit BOOLEAN;
    v_now TIMESTAMP WITHOUT TIME ZONE := timezone('America/Sao_Paulo', now());
BEGIN
    IF p_token IS NULL OR length(p_token) <> 64 THEN
        RETURN 'invalid';
    END IF;

    SELECT t.id, t.user_id INTO v_token_id, v_user_id
      FROM public.users_tracker_tokens t
     WHERE t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
       AND t.revoked_at IS NULL
     LIMIT 1;
    IF v_token_id IS NULL THEN
        RETURN 'invalid';
    END IF;

    IF p_latitude IS NULL OR p_longitude IS NULL
       OR p_latitude NOT BETWEEN -90 AND 90
       OR p_longitude NOT BETWEEN -180 AND 180
       OR (p_latitude = 0 AND p_longitude = 0) THEN
        RETURN 'rejected';
    END IF;

    -- Mesma regra do app: visita aberta = is_ov_in_progress OU ov_id_in_progress > 0.
    SELECT COALESCE(u.is_available, false),
           COALESCE(u.is_ov_in_progress, false) OR COALESCE(u.ov_id_in_progress, 0) > 0
      INTO v_is_available, v_in_visit
      FROM public.users u
     WHERE u.id = v_user_id;

    UPDATE public.users_tracker_tokens SET last_used_at = v_now WHERE id = v_token_id;

    -- Regra de rastreamento (LGPD): só enquanto disponível ou em visita.
    IF NOT (v_is_available OR v_in_visit) THEN
        RETURN 'paused';
    END IF;

    INSERT INTO public.users_tracker AS t
           (user_id, latitude, longitude, tracker_accuracy, tracked_at, tracker_heartbeat_at)
    VALUES (v_user_id, p_latitude, p_longitude,
            CASE WHEN p_accuracy IS NULL OR p_accuracy < 0 THEN NULL ELSE p_accuracy END,
            v_now, v_now)
    ON CONFLICT (user_id) DO UPDATE
       SET latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           tracker_accuracy = COALESCE(EXCLUDED.tracker_accuracy, t.tracker_accuracy),
           tracked_at = EXCLUDED.tracked_at,
           tracker_heartbeat_at = EXCLUDED.tracker_heartbeat_at;

    RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_tracker_report_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_tracker_report_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;

COMMIT;

-- Conferência 1 — deve mostrar 'users_tracker' no corpo (e não 'UPDATE public.users'):
--   SELECT position('INSERT INTO public.users_tracker' IN pg_get_functiondef('public.fn_tracker_report_location(text,double precision,double precision,double precision)'::regprocedure)) > 0 AS ok;
-- Conferência 2 — o serviço nativo volta a gravar: depois de alguns minutos com líderes em campo,
--   SELECT u.name_short, t.tracker_heartbeat_at FROM public.users_tracker t JOIN public.users u ON u.id = t.user_id
--    ORDER BY t.tracker_heartbeat_at DESC LIMIT 10;
