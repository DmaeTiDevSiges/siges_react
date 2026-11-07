-- ==============================================================================
-- Migration: 20261111_use_users_tracker_last_location.sql
-- Posição do rastreador FORA da tabela users, reaproveitando public.users_tracker.
--
-- Diagnóstico (pg_stat_statements): ~90% do tempo do banco era o Realtime
-- (realtime.list_changes, 6,4 mi chamadas / ~29,6 h). public.users está na
-- publicação supabase_realtime e o rastreador a atualizava a cada 30–60 s por
-- técnico; cada UPDATE era decodificado e checado (RLS) para CADA cliente
-- assinado em users (10 telas assinam).
--
-- public.users_tracker já existia (id, user_id, latitude, longitude,
-- createddate, device), sem uso pelo app e vazia em 07/11/2026. Passa a ser a
-- "última posição" de cada usuário (1 linha por user_id):
--   • estrutura final: user_id (PK, FK users), latitude, longitude,
--     tracker_accuracy, tracked_at, tracker_heartbeat_at (hora local
--     America/Sao_Paulo);
--   • colunas legadas id, createddate e device são REMOVIDAS;
--   • a migration ABORTA se houver user_id repetido — nenhuma linha é apagada
--     automaticamente;
--   • NÃO entra na publicação do Realtime;
--   • acesso: remove a política "Universal Access" e o GRANT ALL para anon/
--     authenticated; leitura para autenticados, escrita só pelas funções.
--   • fn_tracker_report_location (APK, por token): mesma assinatura e retornos
--     ('ok'/'paused'/'invalid'/'rejected'), agora grava em users_tracker.
--   • fn_users_tracker_report_session (web/app com sessão) substitui o UPDATE
--     direto em users feito por usersService.updateUserLocation.
--   • latitude/longitude/tracker_* de users ficam, mas param de ser atualizadas.
--
-- Requer 20261106_create_users_tracker_tokens.sql aplicada antes.
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261111_use_users_tracker_last_location_DOWN.sql
-- ==============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.users_tracker_tokens') IS NULL THEN
        RAISE EXCEPTION 'Aplique antes 20261106_create_users_tracker_tokens.sql (tabela users_tracker_tokens ausente).';
    END IF;
END $$;

-- ── 1) Tabela (cria só se não existir; no banco atual ela já existe) ────────
CREATE TABLE IF NOT EXISTS public.users_tracker (
    user_id              BIGINT NOT NULL,
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    tracker_accuracy     DOUBLE PRECISION,
    tracked_at           TIMESTAMP WITHOUT TIME ZONE,
    tracker_heartbeat_at TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE public.users_tracker ADD COLUMN IF NOT EXISTS tracker_accuracy     DOUBLE PRECISION;
ALTER TABLE public.users_tracker ADD COLUMN IF NOT EXISTS tracked_at           TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.users_tracker ADD COLUMN IF NOT EXISTS tracker_heartbeat_at TIMESTAMP WITHOUT TIME ZONE;

-- 1 linha por usuário. Sem apagar nada: se houver repetidos, para e avisa.
DO $$
DECLARE
    v_dup INT;
BEGIN
    SELECT count(*) INTO v_dup
      FROM (SELECT user_id FROM public.users_tracker GROUP BY user_id HAVING count(*) > 1) d;
    IF v_dup > 0 THEN
        RAISE EXCEPTION 'users_tracker tem % user_id repetido(s). Mantenha 1 linha por usuário antes de aplicar (ex.: DELETE das linhas mais antigas de cada user_id).', v_dup;
    END IF;
END $$;

-- Chave primária passa a ser user_id; colunas legadas removidas.
DO $$
DECLARE
    v_pk TEXT;
BEGIN
    SELECT c.conname INTO v_pk
      FROM pg_constraint c
     WHERE c.conrelid = 'public.users_tracker'::regclass AND c.contype = 'p';
    IF v_pk IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
         WHERE c.conname = v_pk AND c.conrelid = 'public.users_tracker'::regclass
           AND a.attname = 'user_id' AND array_length(c.conkey, 1) = 1
    ) THEN
        EXECUTE format('ALTER TABLE public.users_tracker DROP CONSTRAINT %I', v_pk);
        v_pk := NULL;
    END IF;
    IF v_pk IS NULL THEN
        ALTER TABLE public.users_tracker ADD CONSTRAINT users_tracker_pkey PRIMARY KEY (user_id);
    END IF;
END $$;

ALTER TABLE public.users_tracker DROP COLUMN IF EXISTS id;
ALTER TABLE public.users_tracker DROP COLUMN IF EXISTS createddate;
ALTER TABLE public.users_tracker DROP COLUMN IF EXISTS device;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'public.users_tracker'::regclass AND conname = 'users_tracker_user_id_fkey') THEN
        ALTER TABLE public.users_tracker
            ADD CONSTRAINT users_tracker_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
    END IF;
END $$;

COMMENT ON TABLE public.users_tracker IS
    'Última posição do rastreador por usuário (1 linha por user_id; fora do Realtime). tracked_at/tracker_heartbeat_at em hora local America/Sao_Paulo.';

-- Carga inicial com a última posição conhecida em users.
INSERT INTO public.users_tracker (user_id, latitude, longitude, tracker_accuracy, tracked_at, tracker_heartbeat_at)
SELECT u.id, u.latitude, u.longitude, u.tracker_accuracy, u.tracked_at, u.tracker_heartbeat_at
  FROM public.users u
 WHERE u.latitude IS NOT NULL OR u.tracker_heartbeat_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Fora do Realtime.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users_tracker') THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.users_tracker';
    END IF;
END $$;

-- ── 2) Acesso: leitura para autenticados; escrita só pelas funções ──────────
ALTER TABLE public.users_tracker ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users_tracker' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users_tracker', r.policyname);
    END LOOP;
END $$;

CREATE POLICY users_tracker_select ON public.users_tracker
    FOR SELECT TO authenticated USING (true);

REVOKE ALL ON public.users_tracker FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users_tracker TO authenticated;
GRANT ALL ON public.users_tracker TO service_role;

-- ── 3) APK: mesma função/assinatura, agora gravando em users_tracker ────────
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

-- ── 4) App/web com sessão (substitui o UPDATE direto em users) ──────────────
CREATE OR REPLACE FUNCTION public.fn_users_tracker_report_session(
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
    v_user_id BIGINT;
    v_is_available BOOLEAN;
    v_in_visit BOOLEAN;
    v_now TIMESTAMP WITHOUT TIME ZONE := timezone('America/Sao_Paulo', now());
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN 'invalid';
    END IF;

    SELECT u.id,
           COALESCE(u.is_available, false),
           COALESCE(u.is_ov_in_progress, false) OR COALESCE(u.ov_id_in_progress, 0) > 0
      INTO v_user_id, v_is_available, v_in_visit
      FROM public.users u
     WHERE u.uuid = auth.uid()
     LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN 'invalid';
    END IF;

    IF p_latitude IS NULL OR p_longitude IS NULL
       OR p_latitude NOT BETWEEN -90 AND 90
       OR p_longitude NOT BETWEEN -180 AND 180
       OR (p_latitude = 0 AND p_longitude = 0) THEN
        RETURN 'rejected';
    END IF;

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

REVOKE ALL ON FUNCTION public.fn_users_tracker_report_session(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_users_tracker_report_session(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, service_role;

COMMENT ON COLUMN public.users.latitude IS 'OBSOLETA desde 20261111: posição atual em users_tracker.latitude.';
COMMENT ON COLUMN public.users.longitude IS 'OBSOLETA desde 20261111: posição atual em users_tracker.longitude.';
COMMENT ON COLUMN public.users.tracker_heartbeat_at IS 'OBSOLETA desde 20261111: ver users_tracker.tracker_heartbeat_at.';

COMMIT;

-- Conferência:
--   SELECT count(*) FROM public.users_tracker;
--   SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';  -- sem users_tracker
--   -- Depois de alguns minutos com técnicos ativos, tracker_heartbeat_at deve avançar:
--   SELECT user_id, tracker_heartbeat_at FROM public.users_tracker ORDER BY tracker_heartbeat_at DESC LIMIT 5;
