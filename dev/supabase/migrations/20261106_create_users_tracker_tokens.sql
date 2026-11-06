-- ==============================================================================
-- Migration: 20261106_create_users_tracker_tokens.sql
-- Rastreamento de localização em segundo plano (APK) sem usar a chave anon
-- para escrever direto em public.users.
--
-- Antes: o LocationForegroundService (Java) fazia PATCH /rest/v1/users?id=eq.X
-- com a chave anon. Isso só funciona porque users tem a política
-- "Universal Access" (USING true) + GRANT ALL TO anon — ou seja, qualquer um com
-- a chave pública pode alterar QUALQUER usuário. O Java também gravava a hora em
-- UTC numa coluna "timestamp without time zone" (3h adiantada).
--
-- Agora:
--   1. Com a sessão do usuário logado, o app chama fn_tracker_issue_token()
--      e recebe um token aleatório (só o hash SHA-256 fica no banco).
--   2. O serviço nativo envia a posição para fn_tracker_report_location(token,...)
--      que só altera latitude/longitude/precisão/horários DO DONO do token.
--   3. A regra de negócio (LGPD) é aplicada no banco: só grava enquanto o
--      usuário estiver disponível ou com visita em andamento; fora disso devolve
--      'paused' e o serviço nativo se desliga.
--
-- IMPORTANTE: esta migration NÃO fecha a política "Universal Access" de users
-- (outras partes do app podem depender dela). Isso deve ser feito em migration
-- própria, depois de auditar os acessos — ver docs/ no fim deste arquivo.
-- Aplicar manualmente no SQL Editor do Supabase.
-- ==============================================================================

BEGIN;

-- ── 1) Tokens ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users_tracker_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL CHECK (length(device_id) BETWEEN 8 AND 100),
    device_info TEXT CHECK (device_info IS NULL OR length(device_info) <= 300),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    revoked_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_tracker_tokens_user_active
    ON public.users_tracker_tokens (user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.users_tracker_tokens ENABLE ROW LEVEL SECURITY;
-- Ninguém acessa a tabela diretamente; só as funções SECURITY DEFINER abaixo.
REVOKE ALL ON TABLE public.users_tracker_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.users_tracker_tokens TO service_role;

-- ── 2) Emitir token (sessão do usuário logado) ───────────────────────────────
-- Revoga tokens anteriores do mesmo aparelho e devolve o token em texto puro
-- UMA vez; o banco guarda só o hash.
CREATE OR REPLACE FUNCTION public.fn_tracker_issue_token(
    p_device_id TEXT,
    p_device_info TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
    v_token TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '28000';
    END IF;
    IF p_device_id IS NULL OR length(p_device_id) NOT BETWEEN 8 AND 100 THEN
        RAISE EXCEPTION 'device_id inválido' USING ERRCODE = '22023';
    END IF;

    SELECT u.id INTO v_user_id
      FROM public.users u
     WHERE u.uuid = auth.uid()
     LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado' USING ERRCODE = '28000';
    END IF;

    UPDATE public.users_tracker_tokens
       SET revoked_at = timezone('America/Sao_Paulo', now())
     WHERE user_id = v_user_id
       AND device_id = p_device_id
       AND revoked_at IS NULL;

    -- 256 bits aleatórios (gen_random_uuid usa o CSPRNG do Postgres).
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.users_tracker_tokens (user_id, token_hash, device_id, device_info)
    VALUES (
        v_user_id,
        encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
        p_device_id,
        left(p_device_info, 300)
    );

    RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_tracker_issue_token(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_tracker_issue_token(TEXT, TEXT) TO authenticated;

-- ── 3) Revogar tokens do aparelho (ao pausar/sair) ───────────────────────────
CREATE OR REPLACE FUNCTION public.fn_tracker_revoke_token(p_device_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE public.users_tracker_tokens t
       SET revoked_at = timezone('America/Sao_Paulo', now())
      FROM public.users u
     WHERE u.id = t.user_id
       AND u.uuid = auth.uid()
       AND t.device_id = p_device_id
       AND t.revoked_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.fn_tracker_revoke_token(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_tracker_revoke_token(TEXT) TO authenticated;

-- ── 4) Receber posição (serviço nativo, chave anon + token) ──────────────────
-- Retorno:
--   'ok'      posição gravada
--   'paused'  usuário indisponível e sem visita — o serviço deve parar
--   'invalid' token inexistente/revogado — o serviço deve parar
--   'rejected' coordenadas inválidas (o serviço continua)
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

    -- Mesma regra do app (useLocationTracker/App.tsx): visita aberta =
    -- is_ov_in_progress OU ov_id_in_progress > 0.
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

    UPDATE public.users
       SET latitude = p_latitude,
           longitude = p_longitude,
           tracker_accuracy = CASE
               WHEN p_accuracy IS NULL OR p_accuracy < 0 THEN tracker_accuracy
               ELSE p_accuracy
           END,
           tracker_heartbeat_at = v_now,
           tracked_at = v_now
     WHERE id = v_user_id;

    RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_tracker_report_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_tracker_report_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;

COMMENT ON TABLE public.users_tracker_tokens IS
    'Tokens por aparelho usados pelo LocationForegroundService para enviar a posição via fn_tracker_report_location.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Conferência:
--   SELECT t.user_id, u.name_short, t.device_info, t.created_at, t.last_used_at, t.revoked_at
--     FROM public.users_tracker_tokens t JOIN public.users u ON u.id = t.user_id
--    ORDER BY t.last_used_at DESC NULLS LAST;
--
-- PRÓXIMO PASSO (não incluído aqui): substituir a política "Universal Access"
-- de public.users e o GRANT ALL TO anon por políticas mínimas. Antes, auditar
-- todos os acessos a users (app, n8n, edge functions). Conferir o estado vivo:
--   SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'users';
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--    WHERE table_name = 'users' ORDER BY grantee;
