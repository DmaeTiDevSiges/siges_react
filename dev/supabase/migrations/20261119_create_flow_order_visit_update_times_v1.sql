-- =============================================================================
-- RPC: flow_order_visit_update_times_v1
-- Descrição: Corrige data/hora de início e fim de uma Visita (líder esqueceu de
--            iniciar/encerrar). Somente is_admin_super, visita não aprovada e
--            não arquivada. orders.status_at e orders_statuses_logs acompanham
--            SOMENTE se ainda guardam o horário antigo da visita.
--            Não toca em assets / orders_visits_assets.
-- Spec:      docs/superpowers/specs/2026-11-19-editar-horarios-visita-design.md
-- Plano:     docs/superpowers/plans/2026-11-19-editar-horarios-visita.md
-- Payload:   { "visit_id": 1, "started_at": "2026-11-10T09:00:00",
--              "ended_at": "2026-11-10T11:00:00" | null }
-- ATENÇÃO:   nomes de colunas confirmados pelo código/migrations do repositório;
--            conferir no banco vivo antes de aplicar (ver docs/SUPABASE_MCP_LEITURA.md).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.flow_order_visit_update_times_v1(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visit_id     bigint;
    v_started_at   timestamp;
    v_ended_at     timestamp;
    v_now          timestamp;
    v_auth_user_id bigint;
    v_is_admin     boolean;
    v_visit        record;
    v_order        record;
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

    UPDATE public.orders_visits
    SET ov_started_at = v_started_at,
        ov_ended_at = v_ended_at,
        ov_updated_user_id = v_auth_user_id,
        ov_updated_at = v_now
    WHERE id = v_visit.id;

    -- 8. status_at da OS e log: só se ainda guardam o horário antigo da visita.
    --    Fim primeiro; depois início (o status_at pode ter acabado de mudar).
    IF v_ended_at IS NOT NULL AND v_ended_at IS DISTINCT FROM v_visit.ov_ended_at
       AND v_order.status_at IS NOT DISTINCT FROM v_visit.ov_ended_at THEN
        UPDATE public.orders_statuses_logs
        SET order_status_at = v_ended_at
        WHERE id = (
            SELECT max(l.id) FROM public.orders_statuses_logs l
            WHERE l.order_id = v_order.id
              AND l.order_status_id = v_order.status_id
              AND l.order_status_at = v_visit.ov_ended_at
        );
        UPDATE public.orders SET status_at = v_ended_at WHERE id = v_order.id;
        v_order.status_at := v_ended_at;
    END IF;

    IF v_started_at IS DISTINCT FROM v_visit.ov_started_at
       AND v_order.status_at IS NOT DISTINCT FROM v_visit.ov_started_at THEN
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

COMMENT ON FUNCTION public.flow_order_visit_update_times_v1(jsonb) IS
'Flow: update-visit-times v1.0.0 — Corrige início/fim da visita (somente is_admin_super, visita não aprovada). orders.status_at e orders_statuses_logs acompanham só se ainda iguais ao horário antigo.';

-- =============================================================================
-- ROTEIRO DE VERIFICAÇÃO MANUAL (executar no SQL Editor, SEMPRE com ROLLBACK)
-- Simular o usuário: SELECT set_config('request.jwt.claims', '{"sub":"<uuid do usuário>"}', true);
--   BEGIN;
--   -- a) não admin               -> success=false "Apenas o administrador super..."
--   -- b) visita aberta + ended_at -> "Visita em andamento não pode ter horário de fim."
--   -- c) visita encerrada + ended_at nulo -> "Informe a data/hora de fim..."
--   -- d) fim < início             -> "O fim não pode ser anterior ao início."
--   -- e) data futura              -> "Não é permitido informar data/hora futura."
--   -- f) visita aprovada          -> "Visita aprovada ou arquivada..."
--   -- g) item is_moved + processing_id=5: mudar fim -> recusado (mensagem da trava);
--   --    mudar só o início -> success=true; reenviar o mesmo fim -> success=true
--   -- h) OS com status_at diferente do fim antigo -> visita corrigida, OS/log intactos
--   -- i) reenviar os mesmos valores -> success=true, OS/log inalterados
--   -- j) caso feliz (visita encerrada, OS com status_at = fim antigo)
--   --    -> visita, orders.status_at e a linha de orders_statuses_logs com o novo fim
--   SELECT public.flow_order_visit_update_times_v1('{"visit_id":0,"started_at":"2026-01-01T08:00:00","ended_at":"2026-01-01T10:00:00"}'::jsonb);
--   ROLLBACK;
-- =============================================================================
