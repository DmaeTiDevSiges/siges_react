-- ==============================================================================
-- Migration: 20261113_restrict_users_writes.sql
-- Fecha a política "Universal Access" de public.users para gravação.
--
-- Problema: USING (true) WITH CHECK (true) para todos os papéis — qualquer
-- usuário LOGADO alterava qualquer usuário via API, inclusive
-- is_admin_super = true (escalada para super administrador).
-- (O acesso sem login já foi fechado em 20261112_revoke_anon_access.sql.)
--
-- Regras novas (decididas em 07/11/2026):
--   LEITURA  — inalterada: qualquer papel com GRANT (logados, backups).
--   INSERT   — o próprio usuário (uuid = auth.uid()) ou admin.
--   UPDATE   — permitido quando:
--     a) é a própria linha: uuid = auth.uid() OU e-mail = e-mail do login
--        (o login sincroniza users.uuid pelo e-mail);
--     b) quem grava é admin (is_admin ou is_admin_super);
--     c) quem grava é LÍDER de equipe ou está com VISITA em andamento, e o
--        usuário alterado é da MESMA EMPRESA (empresa da equipe; sem equipe,
--        users.company_id). Usuário sem equipe e sem empresa também pode ser
--        alterado por líder (para ser adicionado a uma equipe).
--        Cobre: adicionar/remover membro da equipe (Perfil) e adicionar/
--        remover membro / encerrar visita (campos *_in_progress dos membros).
--   DELETE   — só admin.
--   CAMPOS SENSÍVEIS (trigger) — is_admin só muda por admin; is_admin_super
--   só por super admin. Vale também no INSERT.
--
-- Chamadas sem usuário (auth.uid() nulo: SQL Editor, service_role, n8n com
-- service key) e funções SECURITY DEFINER (flow_order_visit_*, rastreador)
-- não são afetadas.
--
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261113_restrict_users_writes_DOWN.sql
-- ==============================================================================

BEGIN;

-- ── 1) Quem está gravando (SECURITY DEFINER: lê users sem recursão de RLS) ──
CREATE OR REPLACE FUNCTION public.fn_users_caller()
RETURNS TABLE (
    user_id          BIGINT,
    is_admin         BOOLEAN,
    is_admin_super   BOOLEAN,
    can_manage_peers BOOLEAN,
    company_id       BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT u.id,
           COALESCE(u.is_admin, false),
           COALESCE(u.is_admin_super, false),
           COALESCE(u.is_team_leader, false)
             OR COALESCE(u.is_ov_in_progress, false)
             OR COALESCE(u.ov_id_in_progress, 0) > 0,
           COALESCE(t.company_id, u.company_id)
      FROM public.users u
      LEFT JOIN public.cfg_teams t ON t.id = u.team_id
     WHERE u.uuid = auth.uid()
     LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fn_users_caller() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_users_caller() TO authenticated, service_role;

-- Pode o usuário logado gravar a linha (uuid, email, team_id, company_id)?
-- Usada no USING (linha atual) e no WITH CHECK (linha nova) das políticas.
CREATE OR REPLACE FUNCTION public.fn_users_can_write(
    p_uuid       UUID,
    p_email      TEXT,
    p_team_id    BIGINT,
    p_company_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller         RECORD;
    v_target_company BIGINT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    -- a) própria linha
    IF p_uuid = auth.uid()
       OR (p_email IS NOT NULL AND lower(p_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))) THEN
        RETURN true;
    END IF;

    SELECT * INTO v_caller FROM public.fn_users_caller();
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- b) admin
    IF v_caller.is_admin OR v_caller.is_admin_super THEN
        RETURN true;
    END IF;

    -- c) líder / visita em andamento, mesma empresa
    IF v_caller.can_manage_peers THEN
        SELECT COALESCE(t.company_id, p_company_id) INTO v_target_company
          FROM (SELECT 1) x
          LEFT JOIN public.cfg_teams t ON t.id = p_team_id;
        IF v_target_company IS NULL THEN
            RETURN true;  -- sem equipe e sem empresa
        END IF;
        RETURN v_caller.company_id IS NOT NULL AND v_target_company = v_caller.company_id;
    END IF;

    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_users_can_write(UUID, TEXT, BIGINT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_users_can_write(UUID, TEXT, BIGINT, BIGINT) TO authenticated, service_role;

-- ── 2) Políticas ────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Universal Access" ON public.users;
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

-- Leitura como antes (todos os papéis com GRANT: logados e backups databasus-*).
CREATE POLICY users_select ON public.users
    FOR SELECT USING (true);

CREATE POLICY users_insert ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        uuid = auth.uid()
        OR EXISTS (SELECT 1 FROM public.fn_users_caller() c WHERE c.is_admin OR c.is_admin_super)
    );

CREATE POLICY users_update ON public.users
    FOR UPDATE TO authenticated
    USING      (public.fn_users_can_write(uuid, email, team_id, company_id))
    WITH CHECK (public.fn_users_can_write(uuid, email, team_id, company_id));

CREATE POLICY users_delete ON public.users
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.fn_users_caller() c WHERE c.is_admin OR c.is_admin_super));

-- ── 3) Campos sensíveis ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_guard_users_admin_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller RECORD;
    v_admin_changed BOOLEAN;
    v_super_changed BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;  -- SQL Editor / service_role / jobs
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_admin_changed := COALESCE(NEW.is_admin, false);
        v_super_changed := COALESCE(NEW.is_admin_super, false);
    ELSE
        v_admin_changed := NEW.is_admin IS DISTINCT FROM OLD.is_admin;
        v_super_changed := NEW.is_admin_super IS DISTINCT FROM OLD.is_admin_super;
    END IF;

    IF NOT (v_admin_changed OR v_super_changed) THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_caller FROM public.fn_users_caller();

    IF v_super_changed AND NOT COALESCE(v_caller.is_admin_super, false) THEN
        RAISE EXCEPTION 'Somente super administrador pode alterar is_admin_super.' USING ERRCODE = '42501';
    END IF;
    IF v_admin_changed AND NOT (COALESCE(v_caller.is_admin, false) OR COALESCE(v_caller.is_admin_super, false)) THEN
        RAISE EXCEPTION 'Somente administrador pode alterar is_admin.' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_users_admin_flags ON public.users;
CREATE TRIGGER trg_guard_users_admin_flags
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_users_admin_flags();

COMMIT;

-- Conferência:
--   SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users' ORDER BY 1;
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.users'::regclass AND NOT tgisinternal;
