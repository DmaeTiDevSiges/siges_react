-- ==============================================================================
-- Migration: 20261108_create_users_account_deletion_requests.sql
-- Solicitação de exclusão de conta pelo próprio usuário (exigência da Play Store
-- para apps com login: caminho no app + página web).
--
--   • O usuário logado cria/cancela a própria solicitação (RPCs abaixo).
--   • A exclusão/anonimização é feita pela administração, que marca 'done'.
--   • Leitura: o próprio usuário vê as suas; super admin ou quem tem 'edit' na
--     rota 'users' vê todas.
--
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Reverter: 20261108_create_users_account_deletion_requests_DOWN.sql
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.users_account_deletion_requests (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'cancelled', 'done')),
    reason             TEXT,
    requested_at       TIMESTAMP NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    cancelled_at       TIMESTAMP,
    processed_at       TIMESTAMP,
    processed_user_id  BIGINT REFERENCES public.users (id),
    processed_notes    TEXT
);

COMMENT ON TABLE public.users_account_deletion_requests IS
    'Pedidos de exclusão de conta feitos pelo próprio usuário (Perfil > Excluir conta).';

-- No máximo um pedido pendente por usuário.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_account_deletion_requests_pending
    ON public.users_account_deletion_requests (user_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_users_account_deletion_requests_status
    ON public.users_account_deletion_requests (status, requested_at);

-- ------------------------------------------------------------------------------
-- RLS: leitura própria ou administrativa; gravação só pelas RPCs / administração
-- ------------------------------------------------------------------------------
ALTER TABLE public.users_account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_account_deletion_requests_select ON public.users_account_deletion_requests;
CREATE POLICY users_account_deletion_requests_select ON public.users_account_deletion_requests
    FOR SELECT TO authenticated
    USING (
        user_id = (SELECT u.id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1)
        OR public.fc_has_route_permission('users', 'edit')
    );

DROP POLICY IF EXISTS users_account_deletion_requests_admin_update ON public.users_account_deletion_requests;
CREATE POLICY users_account_deletion_requests_admin_update ON public.users_account_deletion_requests
    FOR UPDATE TO authenticated
    USING (public.fc_has_route_permission('users', 'edit'))
    WITH CHECK (public.fc_has_route_permission('users', 'edit'));

REVOKE ALL ON public.users_account_deletion_requests FROM anon;
GRANT SELECT, UPDATE ON public.users_account_deletion_requests TO authenticated;
GRANT ALL ON public.users_account_deletion_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.users_account_deletion_requests_id_seq TO service_role;

-- ------------------------------------------------------------------------------
-- RPC: solicitar (idempotente — devolve o pedido pendente se já existir)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_users_request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS public.users_account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
    v_row     public.users_account_deletion_requests;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_row
      FROM public.users_account_deletion_requests
     WHERE user_id = v_user_id AND status = 'pending'
     LIMIT 1;
    IF FOUND THEN
        RETURN v_row;
    END IF;

    INSERT INTO public.users_account_deletion_requests (user_id, reason)
    VALUES (v_user_id, NULLIF(btrim(COALESCE(p_reason, '')), ''))
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_users_request_account_deletion(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_users_request_account_deletion(TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- RPC: cancelar o próprio pedido pendente
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_users_cancel_account_deletion()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.users_account_deletion_requests
       SET status = 'cancelled',
           cancelled_at = timezone('America/Sao_Paulo', now())
     WHERE user_id = v_user_id AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_users_cancel_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_users_cancel_account_deletion() TO authenticated, service_role;

COMMIT;

-- Conferência / fila da administração:
--   SELECT r.id, u.name_full, u.email, r.reason, r.requested_at
--     FROM public.users_account_deletion_requests r
--     JOIN public.users u ON u.id = r.user_id
--    WHERE r.status = 'pending' ORDER BY r.requested_at;
