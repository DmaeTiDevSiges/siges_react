-- =============================================================================
-- RPC: flow_order_visit_update_times_v1 — evolução (decisões do usuário após a
--      revisão final). Substitui a versão de 20261119_fix_..._seconds_overlap.sql.
--   M2) Mudar o INÍCIO sempre corrige a linha de status 5 (em execução) do
--       histórico da OS (orders_statuses_logs), mesmo com a visita encerrada.
--       orders.status_at só acompanha se ainda for o início antigo.
--   M3) A SS pai acompanha: se o trigger de herança mudou o status_at da SS sem
--       mudar a situação, a linha de log da SS também é corrigida.
--   M7) Recusa se o novo intervalo se sobrepõe a outra visita do MESMO LÍDER
--       (encostar nas pontas é permitido; visita aberta conta como sem fim).
--   M9) Nada mudou (mesmos horários) -> sucesso sem gravar nada (não reescreve
--       ov_updated_at nem a auditoria).
-- Mantém I1 (mesmo minuto = valor original) e I2 (fim e início exclusivos em orders).
-- Spec: docs/superpowers/specs/2026-11-19-editar-horarios-visita-design.md
-- Idempotente (CREATE OR REPLACE); mesma assinatura e permissões.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.flow_order_visit_update_times_v1(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visit_id         bigint;
    v_started_at       timestamp;
    v_ended_at         timestamp;
    v_now              timestamp;
    v_auth_user_id     bigint;
    v_is_admin         boolean;
    v_visit            record;
    v_order            record;
    v_overlap          record;
    v_orig_status_at   timestamp;
    v_end_branch_ran   boolean := false;
    v_parent_id        bigint;
    v_parent_before    record;
    v_parent_after     record;
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

    -- M9: nada mudou -> não grava nada
    IF v_started_at IS NOT DISTINCT FROM v_visit.ov_started_at
       AND v_ended_at IS NOT DISTINCT FROM v_visit.ov_ended_at THEN
        RETURN jsonb_build_object('success', true, 'message', 'Nenhuma alteração nos horários.');
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

    -- M7: sobreposição com outra visita do mesmo líder (pontas encostadas são válidas;
    --     visita aberta conta como sem fim; esta visita, se aberta, vai até agora)
    IF v_visit.ov_team_leader_id IS NOT NULL THEN
        SELECT v2.id, v2.ov_mask INTO v_overlap
        FROM public.orders_visits v2
        WHERE v2.id <> v_visit.id
          AND v2.ov_team_leader_id = v_visit.ov_team_leader_id
          AND COALESCE(v2.is_deleted, false) = false
          AND COALESCE(v2.is_canceled, false) = false
          AND v2.ov_status_id IN (1, 2)
          AND v2.ov_started_at < COALESCE(v_ended_at, v_now)
          AND COALESCE(v2.ov_ended_at, 'infinity'::timestamp) > v_started_at
        ORDER BY v2.ov_started_at
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object('success', false,
                'message', 'O novo intervalo se sobrepõe a outra visita do mesmo líder (' ||
                           COALESCE(v_overlap.ov_mask, '#' || v_overlap.id::text) || ').');
        END IF;
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

    -- 7. OS (trava a linha), estado anterior da SS pai e gravação da visita
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_visit.o_id
    FOR UPDATE;

    v_orig_status_at := v_order.status_at;
    v_parent_id := NULLIF(v_order.parent_id, 0);

    IF v_parent_id IS NOT NULL THEN
        SELECT p.status_id, p.status_at INTO v_parent_before
        FROM public.orders p WHERE p.id = v_parent_id;
    END IF;

    UPDATE public.orders_visits
    SET ov_started_at = v_started_at,
        ov_ended_at = v_ended_at,
        ov_updated_user_id = v_auth_user_id,
        ov_updated_at = v_now
    WHERE id = v_visit.id;

    -- 8a. Fim: orders.status_at + log da situação atual, só se ainda iguais ao fim antigo
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
        v_end_branch_ran := true;
    END IF;

    -- 8b. Início (M2): a linha de status 5 do histórico SEMPRE acompanha o início
    IF v_started_at IS DISTINCT FROM v_visit.ov_started_at THEN
        UPDATE public.orders_statuses_logs
        SET order_status_at = v_started_at
        WHERE id = (
            SELECT max(l.id) FROM public.orders_statuses_logs l
            WHERE l.order_id = v_order.id
              AND l.order_status_id = 5
              AND l.order_status_at = v_visit.ov_started_at
        );

        -- orders.status_at só acompanha se ainda for o início antigo (OS ainda em execução)
        IF NOT v_end_branch_ran
           AND v_orig_status_at IS NOT DISTINCT FROM v_visit.ov_started_at THEN
            UPDATE public.orders SET status_at = v_started_at WHERE id = v_order.id;
        END IF;
    END IF;

    -- 8c. SS pai (M3): o trigger de herança copia o status_at da OS vencedora, mas
    --     só gera log quando a situação muda; corrige a linha de log da SS.
    IF v_parent_id IS NOT NULL AND v_parent_before.status_at IS NOT NULL THEN
        SELECT p.status_id, p.status_at INTO v_parent_after
        FROM public.orders p WHERE p.id = v_parent_id;

        IF v_parent_after.status_id IS NOT DISTINCT FROM v_parent_before.status_id
           AND v_parent_after.status_at IS DISTINCT FROM v_parent_before.status_at THEN
            UPDATE public.orders_statuses_logs
            SET order_status_at = v_parent_after.status_at
            WHERE id = (
                SELECT max(l.id) FROM public.orders_statuses_logs l
                WHERE l.order_id = v_parent_id
                  AND l.order_status_id = v_parent_before.status_id
                  AND l.order_status_at = v_parent_before.status_at
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Horários da visita atualizados.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false,
        'message', 'Erro ao atualizar horários da visita: ' || SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) TO authenticated;

COMMENT ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) IS
'Flow: update-visit-times v1.1.0 — Corrige início/fim da visita (somente is_admin_super, visita não aprovada). orders.status_at e logs (OS e SS pai) acompanham; recusa sobreposição com outra visita do mesmo líder; sem mudança não grava.';

-- =============================================================================
-- ROTEIRO DE VERIFICAÇÃO MANUAL desta versão (SQL Editor, SEMPRE com ROLLBACK)
--   -- m) M9: reenviar exatamente os horários atuais (ou só sem segundos) ->
--   --    success=true "Nenhuma alteração nos horários."; ov_updated_at inalterado
--   -- n) M2: visita ENCERRADA (OS já em situação final), mudar só o início ->
--   --    a linha status 5 de orders_statuses_logs da OS ganha o novo início;
--   --    orders.status_at NÃO muda
--   -- o) M3: OS filha de uma SS, mudar o fim com orders.status_at = fim antigo ->
--   --    status_at da SS (via trigger) e a linha de log da SS com o novo fim
--   -- p) M7: intervalo que invade outra visita do mesmo líder -> recusado com a
--   --    máscara da outra visita; encostar nas pontas (fim = início da outra) -> ok
--   -- q) M7: visita aberta de outro líder no mesmo período -> não bloqueia
--   -- e repetir k) e l) do roteiro anterior (segundos / deslocamento 09-11 -> 07-09)
-- =============================================================================
