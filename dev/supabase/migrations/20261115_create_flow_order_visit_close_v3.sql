-- ==============================================================================
-- Migration: 20261115_create_flow_order_visit_close_v3.sql
-- Encerrar visita numa ÚNICA chamada e numa única transação.
--
-- Antes: visitsService.closeOrderVisit fazia 10–15 chamadas sequenciais ao
-- servidor (3–7 s no celular) e não era atômico — uma falha no meio deixava a
-- visita encerrada com a OS/SS/equipe sem atualizar.
--
-- flow_order_visit_close_v3 reproduz EXATAMENTE a lógica do app:
--   1. valida veículos (exceto ociosidade): Km inicial/final preenchidos e
--      inicial < final;
--   2. encerramento manual (p_ended_at) só se o contrato da OS permitir
--      (contracts.is_manual_visit_start_end) e não antes do início da visita;
--   3. encerra a visita (ov_status_id = 2, situação/progresso/motivo de suspensão);
--   4. atualiza a OS (status, status_at, progress, cause_reason_id);
--   5. OS filha → recalcula a situação da SS pai (maior prioridade; empate =
--      status_at mais recente; cancelada copia motivo/comentários/autor);
--   6. libera a equipe (orders_visits_teams; se vazia, usuários presos na visita);
--   7. notifica os seguidores da SS pai.
--
-- SECURITY INVOKER: roda com as permissões de quem chama — as mesmas regras de
-- acesso (RLS) que valiam para as chamadas do app continuam valendo.
-- Erros de validação usam as mesmas mensagens exibidas hoje.
--
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: DROP FUNCTION public.flow_order_visit_close_v3(bigint, bigint, integer, text, bigint, bigint, numeric, text);
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.flow_order_visit_close_v3(
    p_visit_id            BIGINT,
    p_order_id            BIGINT,
    p_status_id           INTEGER,
    p_status_description  TEXT,
    p_suspended_reason_id BIGINT,
    p_cause_reason_id     BIGINT,
    p_progress            NUMERIC,
    p_ended_at            TEXT DEFAULT NULL   -- hora local (São Paulo), já convertida pelo app
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now        TIMESTAMP := timezone('America/Sao_Paulo', now());
    v_end        TIMESTAMP;
    v_user       RECORD;
    v_started_at TIMESTAMP;
    v_contract   BIGINT;
    v_manual_ok  BOOLEAN := false;
    v_order      RECORD;
    v_target     RECORD;
    v_team_ids   BIGINT[];
    v_client     TEXT;
    v_unit       TEXT;
    v_tag        TEXT;
    v_tag_sub    TEXT;
BEGIN
    SELECT u.id, u.name_short, u.name_full INTO v_user
      FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    -- 1. Veículos
    IF EXISTS (
        SELECT 1 FROM public.orders_visits_vehicles v
         WHERE v.ov_id = p_visit_id
           AND v.cost_type IS DISTINCT FROM 'idle'
           AND (v.recorder_start IS NULL OR v.recorder_end IS NULL
                OR v.recorder_start::numeric >= v.recorder_end::numeric)
    ) THEN
        RAISE EXCEPTION 'Existem veículos com apontamento inválido ou incompleto (Km Inicial >= Km Final).'
            USING ERRCODE = '22023';
    END IF;

    -- 2. Encerramento manual
    v_end := v_now;
    IF NULLIF(btrim(COALESCE(p_ended_at, '')), '') IS NOT NULL THEN
        SELECT ov.ov_started_at INTO v_started_at FROM public.orders_visits ov WHERE ov.id = p_visit_id;
        SELECT o.contract_id INTO v_contract FROM public.orders o WHERE o.id = p_order_id;
        IF v_contract IS NOT NULL THEN
            -- to_jsonb: não quebra se a coluna ainda não existir no banco.
            SELECT COALESCE((to_jsonb(c) ->> 'is_manual_visit_start_end')::boolean, false)
              INTO v_manual_ok
              FROM public.contracts c WHERE c.id = v_contract;
        END IF;
        IF COALESCE(v_manual_ok, false) THEN
            v_end := replace(p_ended_at, 'T', ' ')::timestamp;
            IF v_started_at IS NOT NULL AND v_end < v_started_at THEN
                RAISE EXCEPTION 'Data/hora de encerramento não pode ser anterior ao início da visita.'
                    USING ERRCODE = '22023';
            END IF;
        END IF;
    END IF;

    -- 3. Visita
    UPDATE public.orders_visits
       SET ov_ended_at    = v_end,
           ov_status_id   = 2,
           ov_o_status_id = p_status_id,
           ov_o_progress  = CASE WHEN p_status_id = 8 THEN 1 ELSE p_progress / 100 END,
           ov_o_suspended_reason_id = CASE
               WHEN p_status_id = 6 AND p_suspended_reason_id IS NOT NULL THEN p_suspended_reason_id
               ELSE ov_o_suspended_reason_id END
     WHERE id = p_visit_id;

    -- 4. OS
    UPDATE public.orders
       SET status_id = p_status_id,
           status_at = v_end,
           progress  = CASE WHEN p_status_id = 8 THEN 1 ELSE p_progress / 100 END,
           cause_reason_id = p_cause_reason_id
     WHERE id = p_order_id
    RETURNING parent_id, order_mask, requested_services, client_id, unit_id, asset_tag_id, asset_tag_sub_id
      INTO v_order;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'OS % não encontrada ou sem permissão para alterar.', p_order_id USING ERRCODE = 'P0002';
    END IF;

    -- 5. SS pai
    IF v_order.parent_id IS NOT NULL THEN
        SELECT o.status_id, o.status_at, o.cancel_reason_id, o.cancel_comments,
               o.canceled_user_id, o.canceled_team_id, o.canceled_at
          INTO v_target
          FROM public.orders o
          LEFT JOIN public.cfg_orders_statuses s ON s.id = o.status_id
         WHERE o.parent_id = v_order.parent_id
           AND o.is_deleted = false
         ORDER BY COALESCE(s.priority_level, 0) DESC, o.status_at DESC NULLS LAST
         LIMIT 1;

        IF FOUND THEN
            UPDATE public.orders
               SET status_id  = v_target.status_id,
                   status_at  = v_target.status_at,
                   updated_at = v_now,
                   cancel_reason_id = CASE WHEN v_target.status_id = 7 THEN v_target.cancel_reason_id ELSE cancel_reason_id END,
                   cancel_comments  = CASE WHEN v_target.status_id = 7 THEN v_target.cancel_comments  ELSE cancel_comments  END,
                   canceled_user_id = CASE WHEN v_target.status_id = 7 THEN v_target.canceled_user_id ELSE canceled_user_id END,
                   canceled_team_id = CASE WHEN v_target.status_id = 7 THEN v_target.canceled_team_id ELSE canceled_team_id END,
                   canceled_at      = CASE WHEN v_target.status_id = 7 THEN COALESCE(v_target.canceled_at, v_target.status_at) ELSE canceled_at END
             WHERE id = v_order.parent_id;
        END IF;
    END IF;

    -- 6. Equipe
    SELECT array_agg(DISTINCT t.user_id) INTO v_team_ids
      FROM public.orders_visits_teams t WHERE t.ov_id = p_visit_id;
    IF v_team_ids IS NULL THEN
        SELECT array_agg(u.id) INTO v_team_ids
          FROM public.users u WHERE u.ov_id_in_progress = p_visit_id;
    END IF;

    IF v_team_ids IS NOT NULL THEN
        UPDATE public.users
           SET is_available = true,
               ov_in_progress_leader_id = 0,
               o_contract_id_in_progress = 0,
               o_type_id_in_progress = 0,
               o_type_sub_id_in_progress = 0,
               o_plan_id_in_progress = 0,
               o_asset_tag_id_in_progress = 0,
               o_unit_id_in_progress = 0,
               o_system_id_in_progress = 0,
               o_system_parent_id_in_progress = 0,
               o_unit_type_id_in_progress = 0,
               o_unit_type_parent_id_in_progress = 0,
               o_object_id_in_progress = 0,
               ov_id_in_progress = 0,
               o_id_in_progress = 0,
               op_id_in_progress = 0,
               is_ov_in_progress = false,
               ov_id_in_progress_mask = NULL,
               updated_at = v_now
         WHERE id = ANY (v_team_ids);
    END IF;

    -- 7. Seguidores da SS pai
    IF v_order.parent_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.orders_followers f WHERE f.o_id = v_order.parent_id) THEN
        SELECT c.description INTO v_client FROM public.v_companies c WHERE c.id = v_order.client_id;
        SELECT u.description INTO v_unit   FROM public.units u WHERE u.id = v_order.unit_id;
        IF v_order.asset_tag_id IS NOT NULL THEN
            SELECT t.description INTO v_tag FROM public.cfg_assets_tags t WHERE t.id = v_order.asset_tag_id;
        END IF;
        IF v_order.asset_tag_sub_id IS NOT NULL THEN
            SELECT t.description INTO v_tag_sub FROM public.cfg_assets_tags_subs t WHERE t.id = v_order.asset_tag_sub_id;
        END IF;

        INSERT INTO public.users_notifications
               (user_id_to, user_id_from, title, body, type, created_at, is_read, user_to_whatsapp)
        SELECT f.user_id,
               v_user.id,
               'Visita encerrada.',
               COALESCE(NULLIF(v_user.name_short, ''), v_user.name_full) || ' encerrou a visita:' || chr(10) ||
               'OS ' || COALESCE(v_order.order_mask, '') || ': ' || COALESCE(p_status_description, '') || chr(10) ||
               'Cliente: ' || COALESCE(v_client, 'N/A') || chr(10) ||
               'Unidade: ' || COALESCE(v_unit, 'N/A') || chr(10) ||
               'Setor/Posição: ' || COALESCE(v_tag, '') ||
                   CASE WHEN NULLIF(v_tag_sub, '') IS NOT NULL THEN '/' || v_tag_sub ELSE '' END || chr(10) ||
               'Servicos a realizar: ' || COALESCE(v_order.requested_services, ''),
               'Visita encerrada',
               v_now,
               false,
               fu.mobile_whatsapp
          FROM public.orders_followers f
          LEFT JOIN public.users fu ON fu.id = f.user_id
         WHERE f.o_id = v_order.parent_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'ended_at', v_end);
END;
$$;

COMMENT ON FUNCTION public.flow_order_visit_close_v3(bigint, bigint, integer, text, bigint, bigint, numeric, text) IS
    'Encerra a visita (visita, OS, SS pai, equipe e notificações) numa única transação. SECURITY INVOKER.';

REVOKE ALL ON FUNCTION public.flow_order_visit_close_v3(bigint, bigint, integer, text, bigint, bigint, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flow_order_visit_close_v3(bigint, bigint, integer, text, bigint, bigint, numeric, text) TO authenticated, service_role;
