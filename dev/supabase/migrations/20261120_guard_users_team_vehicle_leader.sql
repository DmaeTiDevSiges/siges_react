-- ==============================================================================
-- Migration: 20261120_guard_users_team_vehicle_leader.sql
-- Equipe, veículo e liderança em public.users protegidos NO BANCO (nov/2026).
--
-- Regras (decididas em 09/11/2026):
--   team_id / vehicle_id  — só ADMIN (is_admin/is_admin_super) ou LÍDER de equipe
--                           (is_team_leader do usuário logado) altera. Vale para a
--                           própria linha e para a de colegas (adicionar/remover
--                           membro no Perfil). Usuário comum não troca nem a própria.
--   is_team_leader        — só ADMIN altera. Sem isso, um usuário comum se
--                           autopromoveria a líder pela API e passaria pela regra acima.
--                           No INSERT feito por não admin, is_team_leader é forçado a false.
--   TODO USUÁRIO TEM EQUIPE — NINGUÉM logado (nem admin) deixa team_id vazio. Remover
--                           membro só DEVOLVE à equipe de casa (team_id_previous, um
--                           nível: sempre a equipe de casa); admin transfere de equipe
--                           para equipe. (Cadastro: a linha nasce em handle_new_user,
--                           sem usuário logado, e o app grava a equipe logo em seguida.)
--   VISITA EM ANDAMENTO   — não admin não muda a equipe de quem está em visita
--                           (is_ov_in_progress / ov_id_in_progress).
--
-- Complementa 20261113_restrict_users_writes.sql (RLS: quem pode gravar QUAL linha)
-- e trg_guard_users_admin_flags (is_admin / is_admin_super). Esta trava diz QUAIS
-- CAMPOS cada um pode mudar. Comparação com IS DISTINCT FROM: salvar o perfil sem
-- mudar esses campos (o app reenvia team_id/is_team_leader) continua funcionando.
--
-- Não afetados: chamadas sem usuário (auth.uid() nulo — SQL Editor, service_role,
-- n8n) e as rotinas de visita, que não alteram estes campos (conferido em
-- 20261033_add_manual_visit_start_end e flow_order_visit_close_v3/v4).
--
-- Tela correspondente: views/Users/ProfileScreen.tsx (canEditTeamAndVehicle).
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261120_guard_users_team_vehicle_leader_DOWN.sql
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_guard_users_team_vehicle_leader()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin  BOOLEAN;
    v_is_leader BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;  -- SQL Editor / service_role / jobs
    END IF;

    SELECT COALESCE(u.is_admin, false) OR COALESCE(u.is_admin_super, false),
           COALESCE(u.is_team_leader, false)
      INTO v_is_admin, v_is_leader
      FROM public.users u
     WHERE u.uuid = auth.uid()
     LIMIT 1;

    -- Vale para TODOS os usuários logados, inclusive admin.
    IF TG_OP = 'UPDATE' AND NEW.team_id IS NULL AND OLD.team_id IS NOT NULL THEN
        RAISE EXCEPTION 'Todo usuário precisa estar em uma equipe. Transfira-o para outra equipe em vez de removê-lo.'
            USING ERRCODE = '23514';
    END IF;

    IF COALESCE(v_is_admin, false) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Cadastro feito por não admin nunca nasce líder.
        NEW.is_team_leader := false;
        RETURN NEW;
    END IF;

    IF NEW.is_team_leader IS DISTINCT FROM OLD.is_team_leader THEN
        RAISE EXCEPTION 'Somente administrador pode definir líder de equipe.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.team_id IS DISTINCT FROM OLD.team_id
        OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id)
       AND NOT COALESCE(v_is_leader, false) THEN
        RAISE EXCEPTION 'Somente líder de equipe ou administrador pode alterar equipe ou veículo.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
        IF COALESCE(OLD.is_ov_in_progress, false) OR COALESCE(OLD.ov_id_in_progress, 0) > 0 THEN
            RAISE EXCEPTION 'Não é possível mudar a equipe de quem está com uma visita em andamento.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_guard_users_team_vehicle_leader() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_guard_users_team_vehicle_leader ON public.users;
CREATE TRIGGER trg_guard_users_team_vehicle_leader
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_users_team_vehicle_leader();

COMMIT;

-- Conferência (como um usuário comum, pelo app ou API, deve falhar com 42501):
--   UPDATE public.users SET vehicle_id = <outro> WHERE uuid = auth.uid();
-- Usuários SEM EQUIPE hoje (corrigir antes/depois de aplicar):
--   SELECT u.id, u.name_short, u.email, u.is_available, u.company_id
--     FROM public.users u
--    WHERE u.team_id IS NULL
--    ORDER BY u.is_available DESC, u.name_short;
-- Listar a trava:
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.users'::regclass AND NOT tgisinternal;
