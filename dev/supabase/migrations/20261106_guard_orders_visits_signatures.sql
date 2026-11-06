-- ==============================================================================
-- Migration: 20261106_guard_orders_visits_signatures.sql
-- Regras de assinatura da visita aplicadas NO BANCO (antes só existiam na tela,
-- e o app grava com um UPDATE direto em orders_visits).
--
-- 1. Visita APROVADA (ov_processing_id = 5) ou ARQUIVADA (ov_is_filed = true):
--    nenhuma assinatura pode ser criada, trocada ou excluída.
-- 2. Assinatura do LÍDER: só o líder da visita (ov_team_leader_id) pode criar,
--    trocar ou excluir (sem exceção para administrador).
--    (A assinatura do requisitante/cliente continua liberada para quem acompanha a
--    visita — ela é coletada no aparelho do técnico.)
--
-- Chamadas sem usuário logado (auth.uid() nulo: service_role, n8n, jobs do banco)
-- não são bloqueadas, para não quebrar rotinas de servidor.
-- Só UPDATE é verificado; nenhuma função atual do banco grava estas colunas
-- (conferido: ov_signature_* só aparece em views).
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_guard_orders_visits_signatures()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_leader_changed BOOLEAN;
    v_requester_changed BOOLEAN;
    v_user_id BIGINT;
BEGIN
    v_leader_changed :=
           NEW.ov_signature_leader_path IS DISTINCT FROM OLD.ov_signature_leader_path
        OR NEW.ov_signature_leader_name IS DISTINCT FROM OLD.ov_signature_leader_name
        OR NEW.ov_signature_leader_at   IS DISTINCT FROM OLD.ov_signature_leader_at;

    v_requester_changed :=
           NEW.ov_signature_requester_path IS DISTINCT FROM OLD.ov_signature_requester_path
        OR NEW.ov_signature_requester_name IS DISTINCT FROM OLD.ov_signature_requester_name
        OR NEW.ov_signature_requester_at   IS DISTINCT FROM OLD.ov_signature_requester_at;

    IF NOT (v_leader_changed OR v_requester_changed) THEN
        RETURN NEW;
    END IF;

    -- Rotinas de servidor (service_role / sem sessão de usuário).
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Regra 1: visita aprovada ou arquivada → assinaturas congeladas.
    IF COALESCE(OLD.ov_is_filed, false) OR COALESCE(OLD.ov_processing_id, 0) = 5 THEN
        RAISE EXCEPTION 'Assinaturas não podem ser alteradas em visita aprovada ou arquivada.'
            USING ERRCODE = '42501';
    END IF;

    -- Regra 2: assinatura do líder → só o líder da visita.
    IF v_leader_changed THEN
        SELECT u.id INTO v_user_id
          FROM public.users u
         WHERE u.uuid = auth.uid()
         LIMIT 1;

        IF v_user_id IS NULL OR v_user_id IS DISTINCT FROM OLD.ov_team_leader_id THEN
            RAISE EXCEPTION 'Somente o líder da equipe desta visita pode assinar ou excluir a assinatura do líder.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_guard_orders_visits_signatures() IS
    'Bloqueia alterar assinaturas em visita aprovada/arquivada e restringe a assinatura do líder ao líder da visita.';

DROP TRIGGER IF EXISTS trg_guard_orders_visits_signatures ON public.orders_visits;
CREATE TRIGGER trg_guard_orders_visits_signatures
BEFORE UPDATE OF
    ov_signature_leader_path, ov_signature_leader_name, ov_signature_leader_at,
    ov_signature_requester_path, ov_signature_requester_name, ov_signature_requester_at
ON public.orders_visits
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_orders_visits_signatures();

COMMIT;

-- Conferência:
--   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_guard_orders_visits_signatures';
