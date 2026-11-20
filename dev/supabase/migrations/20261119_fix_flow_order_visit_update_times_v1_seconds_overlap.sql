-- =============================================================================
-- RPC: flow_order_visit_update_times_v1 — CORREÇÃO da migration
--      20261119_create_flow_order_visit_update_times_v1.sql (já aplicada)
-- Correções da revisão final:
--   I1) O front reenvia o horário não alterado sem segundos (HH:mm). Se cair no
--       mesmo minuto do valor atual, mantém o valor original (com segundos):
--       evita disparar a trava de ativos e reescrever status_at/log sem mudança.
--   I2) O trecho do início usa o status_at ORIGINAL da OS e só roda se o do fim
--       não rodou (ELSIF): deslocar 09-11 para 07-09 não sobrescreve o log do fim.
-- Spec:   docs/superpowers/specs/2026-11-19-editar-horarios-visita-design.md
-- Idempotente (CREATE OR REPLACE); não muda assinatura nem permissões.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.flow_order_visit_update_times_v1(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visit_id       bigint;
    v_started_at     timestamp;
    v_ended_at       timestamp;
    v_now            timestamp;
    v_auth_user_id   bigint;
    v_is_admin       boolean;
    v_visit          record;
    v_order          record;
    v_orig_status_at timestamp;
BEGIN
    v_now := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 1. Identidade e permissão (no servidor, independe do front)
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não autenticado.');
    END IF;

    SELECT u.id, COALESCE(u.is_admin_super, false)
    INTO v_auth_user_id, v_is_admin
    FROM public.users u
    WHERE u.uuid = auth.uid();

    IF v_auth_user_id IS NULL OR v_is_admin IS DISTINCT FROM true THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Apenas o administrador super pode editar os horários da visita.');
    END IF;

    -- 2. Payload
    v_visit_id   := (payload->>'visit_id')::bigint;
    v_started_at := NULLIF(payload->>'started_at', '')::timestamp;
    v_ended_at   := NULLIF(payload->>'ended_at', '')::timestamp;

    IF v_visit_id IS NULL OR v_started_at IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Parâmetros inválidos: informe visit_id e started_at.');
    END IF;

    -- 3. Visita (trava a linha): aberta (1) ou encerrada (2), não aprovada, não arquivada
    SELECT * INTO v_visit
    FROM public.orders_visits
    WHERE id = v_visit_id
      AND COALESCE(is_deleted, false) = false
      AND COALESCE(is_canceled, false) = false
      AND ov_status_id IN (1, 2)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Visita inválida ou indisponível.');
    END IF;

    IF v_visit.ov_approved_at IS NOT NULL OR COALESCE(v_visit.ov_is_filed, false) = true THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Visita aprovada ou arquivada não pode ter os horários editados.');
    END IF;

    -- I1: horário sem mudança real (mesmo minuto) mantém o valor original com segundos
    IF v_visit.ov_started_at IS NOT NULL
       AND date_trunc('minute', v_started_at) = date_trunc('minute', v_visit.ov_started_at) THEN
        v_started_at := v_visit.ov_started_at;
    END IF;
    IF v_ended_at IS NOT NULL AND v_visit.ov_ended_at IS NOT NULL
       AND date_trunc('minute', v_ended_at) = date_trunc('minute', v_visit.ov_ended_at) THEN
        v_ended_at := v_visit.ov_ended_at;
    END IF;

    -- 4. Coerência fim x estado da visita
    IF v_visit.ov_ended_at IS NULL AND v_ended_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Visita em andamento não pode ter horário de fim.');
    END IF;

    IF v_visit.ov_ended_at IS NOT NULL AND v_ended_at IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Informe a data/hora de fim da visita encerrada.');
    END IF;

    -- 5. Datas
    IF v_ended_at IS NOT NULL AND v_ended_at < v_started_at THEN
        RETURN jsonb_build_object('success', false,
            'message', 'O fim não pode ser anterior ao início.');
    END IF;

    IF v_started_at > v_now OR (v_ended_at IS NOT NULL AND v_ended_at > v_now) THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Não é permitido informar data/hora futura.');
    END IF;

    -- 6. Trava de ativos: fim alterado + item movimentado já aprovado
    IF v_ended_at IS DISTINCT FROM v_visit.ov_ended_at AND EXISTS (
        SELECT 1 FROM public.orders_visits_assets ova
        WHERE ova.ov_id = v_visit.id
          AND COALESCE(ova.is_deleted, false) = false
          AND ova.is_moved = true
          AND ova.processing_id = 5
    ) THEN
        RETURN jsonb_build_object('success', false,
            'message', 'Há ativos movimentados já aprovados nesta visita. Volte o item para rascunho ou revisado, corrija o horário e aprove o item novamente.');
    END IF;

    -- 7. OS (trava a linha) e gravação da visita
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_visit.o_id
    FOR UPDATE;

    v_orig_status_at := v_order.status_at;

    UPDATE public.orders_visits
    SET ov_started_at = v_started_at,
        ov_ended_at = v_ended_at,
        ov_updated_user_id = v_auth_user_id,
        ov_updated_at = v_now
    WHERE id = v_visit.id;

    -- 8. status_at da OS e log: só se ainda guardam o horário antigo da visita.
    --    Compara sempre com o status_at ORIGINAL; fim e início são exclusivos (I2).
    IF v_ended_at IS NOT NULL AND v_ended_at IS DISTINCT FROM v_visit.ov_ended_at
       AND v_orig_status_at IS NOT DISTINCT FROM v_visit.ov_ended_at THEN
        UPDATE public.orders_statuses_logs
        SET order_status_at = v_ended_at
        WHERE id = (
            SELECT max(l.id) FROM public.orders_statuses_logs l
            WHERE l.order_id = v_order.id
              AND l.order_status_id = v_order.status_id
              AND l.order_status_at = v_visit.ov_ended_at
        );
        UPDATE public.orders SET status_at = v_ended_at WHERE id = v_order.id;
    ELSIF v_started_at IS DISTINCT FROM v_visit.ov_started_at
       AND v_orig_status_at IS NOT DISTINCT FROM v_visit.ov_started_at THEN
        UPDATE public.orders_statuses_logs
        SET order_status_at = v_started_at
        WHERE id = (
            SELECT max(l.id) FROM public.orders_statuses_logs l
            WHERE l.order_id = v_order.id
              AND l.order_status_id = v_order.status_id
              AND l.order_status_at = v_visit.ov_started_at
        );
        UPDATE public.orders SET status_at = v_started_at WHERE id = v_order.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Horários da visita atualizados.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false,
        'message', 'Erro ao atualizar horários da visita: ' || SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) TO authenticated;

-- =============================================================================
-- ROTEIRO DE VERIFICAÇÃO MANUAL desta correção (SQL Editor, SEMPRE com ROLLBACK)
--   -- k) visita encerrada com ov_ended_at COM segundos (ex.: 11:00:37.123) e item
--   --    is_moved + processing_id=5: enviar o fim '...T11:00:00' (mesmo minuto) e um
--   --    novo início -> success=true (não dispara a trava); ov_ended_at e
--   --    orders.status_at continuam com os segundos originais
--   -- l) visita 09:00-11:00, OS com status_at=11:00 (situação final): enviar
--   --    07:00-09:00 -> orders.status_at=09:00 e log da situação final=09:00
--   --    (o início NÃO sobrescreve o fim)
-- =============================================================================
