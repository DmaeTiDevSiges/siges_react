-- =============================================================================
-- RPC: flow_order_visit_reassign_v1
-- Descrição: Transfere uma Visita em andamento de uma OS de origem (OS1) para
--            outra OS de destino (OS2), preservando APENAS tempo, equipe e
--            veículo; o chat é desvinculado (fica com a OS1). Restaura a
--            situação da OS1 a partir de orders_statuses_logs.
-- Plano:     docs/plano-orders-statuses-logs-e-reassign-visit.md (§6.4)
-- Spec:      flows/ordersVisits/reassign-order-visit.flow
-- Parte 1:   exige 20260925_create_orders_statuses_logs_trigger.sql aplicada
--            (guard 8 lê public.orders_statuses_logs)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.flow_order_visit_reassign_v1(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visit_id        bigint;
    v_user_id         bigint;
    v_target_order_id bigint;
    v_now             timestamp;
    v_auth_user_id    bigint;
    v_visit           record;
    v_os1             record;
    v_os2             record;
    v_pre             record;
    v_anchor_id       bigint;
    v_new_counter     int;
    v_new_mask        text;
    v_restored_id     bigint;
    v_restored_at     timestamp;
    v_remaining_max   int;
    v_os1_counter     int;
BEGIN
    -- 1. Payload
    v_visit_id        := (payload->>'visit_id')::bigint;
    v_user_id         := (payload->>'user_id')::bigint;
    v_target_order_id := (payload->>'target_order_id')::bigint;
    v_now             := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    IF v_visit_id IS NULL OR v_user_id IS NULL OR v_target_order_id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Parâmetros inválidos: informe visit_id, user_id e target_order_id.');
    END IF;

    -- 2. Guard 1 — visita válida e aberta (trava a linha)
    SELECT * INTO v_visit
    FROM public.orders_visits
    WHERE id = v_visit_id
      AND is_deleted = false
      AND is_canceled = false
      AND ov_status_id = 1
      AND ov_ended_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Visita inválida ou já finalizada.');
    END IF;

    -- 3. Guard 2a — identidade (quando há JWT, impede passar outro user_id)
    IF auth.uid() IS NOT NULL THEN
        SELECT id INTO v_auth_user_id FROM public.users WHERE uuid = auth.uid();
        IF v_auth_user_id IS NOT NULL AND v_auth_user_id <> v_user_id THEN
            RETURN jsonb_build_object('success', false,
                'message', 'Usuário inválido para esta operação.');
        END IF;
    END IF;

    -- Guard 2b — apenas o líder da visita
    IF v_visit.ov_team_leader_id IS DISTINCT FROM v_user_id THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Apenas o líder da visita pode transferi-la.');
    END IF;

    -- 4. Guard 3 — sem ativos registrados na visita
    IF EXISTS (
        SELECT 1 FROM public.orders_visits_assets
        WHERE ov_id = v_visit.id AND is_deleted = false
    ) THEN
        RETURN jsonb_build_object('success', false,
            'message', 'A visita possui ativos registrados e não pode ser transferida.');
    END IF;

    -- 5. Guard 4 — sem serviços registrados na visita
    IF EXISTS (
        SELECT 1 FROM public.orders_visits_services
        WHERE ov_id = v_visit.id AND is_deleted = false
    ) THEN
        RETURN jsonb_build_object('success', false,
            'message', 'A visita possui serviços registrados e não pode ser transferida.');
    END IF;

    -- 6. Guard 5 — OS de destino válida (trava a linha)
    SELECT * INTO v_os2
    FROM public.orders
    WHERE id = v_target_order_id
    FOR UPDATE;

    IF NOT FOUND OR v_os2.is_deleted = true THEN
        RETURN jsonb_build_object('success', false,
            'message', 'OS de destino não encontrada.');
    END IF;

    IF COALESCE(v_os2.parent_id, 0) = 0 THEN
        RETURN jsonb_build_object('success', false,
            'message', 'A OS de destino deve ser uma Ordem de Serviço.');
    END IF;

    -- Guard 6 — destino diferente da origem
    IF v_os2.id = v_visit.o_id THEN
        RETURN jsonb_build_object('success', false,
            'message', 'A OS de destino não pode ser a OS da visita em andamento.');
    END IF;

    IF v_os2.status_id NOT IN (3, 4, 6) THEN   -- Autorizada / Agendada / Suspensa (D11)
        RETURN jsonb_build_object('success', false,
            'message', 'A OS de destino deve estar Autorizada, Agendada ou Suspensa.');
    END IF;

    -- 7. Guard 7 — destino sem outra visita aberta
    IF EXISTS (
        SELECT 1 FROM public.orders_visits
        WHERE o_id = v_os2.id
          AND id <> v_visit.id
          AND is_deleted = false
          AND is_canceled = false
          AND ov_status_id = 1
          AND ov_ended_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false,
            'message', 'A OS de destino já possui uma visita em andamento.');
    END IF;

    -- 8. OS de origem (trava a linha)
    SELECT * INTO v_os1
    FROM public.orders
    WHERE id = v_visit.o_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false,
            'message', 'OS de origem não encontrada.');
    END IF;

    -- 9. Guard 8 — situação anterior à visita (semântica NEW → ancora na última
    --    linha de status 5 e pega a imediatamente anterior por ordem de inserção;
    --    usa id, nunca order_status_at — scheduleOrder grava data futura / R4)
    SELECT max(l.id) INTO v_anchor_id
    FROM public.orders_statuses_logs l
    WHERE l.order_id = v_os1.id
      AND l.order_status_id = 5;

    IF v_anchor_id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Sem histórico de situação anterior à visita. Operação indisponível para visitas iniciadas antes da ativação do log.');
    END IF;

    SELECT l.order_status_id, l.order_status_at
    INTO v_pre
    FROM public.orders_statuses_logs l
    WHERE l.order_id = v_os1.id
      AND l.id < v_anchor_id
    ORDER BY l.id DESC
    LIMIT 1;

    IF NOT FOUND OR v_pre.order_status_id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Sem histórico de situação anterior à visita. Operação indisponível para visitas iniciadas antes da ativação do log.');
    END IF;

    v_restored_id := v_pre.order_status_id;
    v_restored_at := v_pre.order_status_at;

    -- 10. Máscara nova da visita na OS de destino
    v_new_counter := COALESCE(v_os2.ov_counter, 0) + 1;
    v_new_mask     := v_os2.order_mask || '.' || LPAD(v_new_counter::text, 2, '0');

    -- 11. Efeito 1 — visita passa a pertencer à OS2
    UPDATE public.orders_visits
    SET o_id = v_os2.id,
        ov_mask = v_new_mask,
        ov_updated_user_id = v_user_id,
        ov_updated_at = v_now
    WHERE id = v_visit.id;

    -- 12. Efeito 2 — OS2 entra em execução (trigger grava a situação 5 no log)
    UPDATE public.orders
    SET status_id = 5,
        status_at = v_now,
        ov_counter = v_new_counter,
        updated_user_id = v_user_id,
        updated_at = v_now
    WHERE id = v_os2.id;

    -- 13. Efeito 4 — ov_counter da OS1: decrementa somente se nenhuma visita
    --     restante usa o sufixo corrente; senão mantém o MAX dos restantes (D8)
    SELECT COALESCE(max(substring(v2.ov_mask from '([0-9]+)$')::int), -1)
    INTO v_remaining_max
    FROM public.orders_visits v2
    WHERE v2.o_id = v_os1.id
      AND v2.id <> v_visit.id
      AND v2.is_deleted = false;

    IF EXISTS (
        SELECT 1 FROM public.orders_visits v3
        WHERE v3.o_id = v_os1.id
          AND v3.id <> v_visit.id
          AND v3.is_deleted = false
          AND substring(v3.ov_mask from '([0-9]+)$')::int = COALESCE(v_os1.ov_counter, 0)
    ) THEN
        v_os1_counter := GREATEST(v_remaining_max, COALESCE(v_os1.ov_counter, 0));
    ELSE
        v_os1_counter := GREATEST(COALESCE(v_os1.ov_counter, 0) - 1, 0);
    END IF;

    -- 14. Efeito 3 — OS1 restaurada à situação anterior (trigger grava no log)
    UPDATE public.orders
    SET status_id = v_restored_id,
        status_at = v_restored_at,
        ov_counter = v_os1_counter,
        updated_user_id = v_user_id,
        updated_at = v_now
    WHERE id = v_os1.id;

    -- 15. Efeito 5 — equipe acompanha a nova OS/máscara
    UPDATE public.users
    SET o_id_in_progress = v_os2.id,
        op_id_in_progress = v_os2.parent_id,
        ov_id_in_progress_mask = v_new_mask
    WHERE id IN (
        SELECT t.user_id FROM public.orders_visits_teams t WHERE t.ov_id = v_visit.id
    );

    -- 16. Efeito 8 (D17) — chat: NÃO acompanha a visita. Congela as mensagens
    --     na OS de origem (o_id = OS1) e retira todos os participantes; a OS
    --     destino começa com um chat zerado (quem enviar recria os participantes).
    UPDATE public.orders_visits_chat
    SET o_id = v_os1.id
    WHERE ov_id = v_visit.id AND o_id IS NULL;

    DELETE FROM public.orders_visits_chat_participants
    WHERE ov_id = v_visit.id;

    -- 17. Efeito 6 — notificações aos seguidores das duas OS: automáticas via
    --     trg_followers_orders_status_changed (AFTER UPDATE OF status_id)
    -- 18. Efeito 7 — SS pai: automático via trg_order_status_inheritance
    --     (AFTER UPDATE OF status_id, status_at em cada OS atualizada)

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Visita transferida para ' || v_new_mask || '.',
        'visit_id', v_visit.id,
        'new_mask', v_new_mask,
        'source_order_id', v_os1.id,
        'restored_status_id', v_restored_id,
        'restored_status_at', v_restored_at
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false,
        'message', 'Erro ao transferir visita: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.flow_order_visit_reassign_v1(jsonb) IS
    'Flow: reassign-order-visit v1.0.0 — transplanta a visita em andamento da OS de origem para a OS de destino e restaura a situação anterior da origem via orders_statuses_logs (semântica NEW, ancorada por id).';

GRANT EXECUTE ON FUNCTION public.flow_order_visit_reassign_v1(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.flow_order_visit_reassign_v1(jsonb) TO service_role;

-- Segurança (D16): no Postgres a EXECUTE é dada a PUBLIC por padrão, então a
-- função ficaria chamável pela anon key (vazada no bundle do front). Como a
-- guarda de identidade (auth.uid()) é pulada sem JWT, o caller anon poderia
-- escolher qualquer user_id. Bloquear PUBLIC/anon — manter só authenticated/service_role.
REVOKE EXECUTE ON FUNCTION public.flow_order_visit_reassign_v1(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.flow_order_visit_reassign_v1(jsonb) FROM anon;

NOTIFY pgrst, 'reload schema';
