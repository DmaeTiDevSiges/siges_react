DROP FUNCTION IF EXISTS flow_order_visit_close;
DROP FUNCTION IF EXISTS flow_order_visit_close_v2;

CREATE OR REPLACE FUNCTION public.flow_order_visit_close_v2(payload JSONB)
RETURNS JSONB AS $$
DECLARE
    -- Parâmetros extraídos
    p_visit_id BIGINT;
    p_user_id BIGINT;
    p_order_status_id INTEGER;
    p_suspended_reason_id INTEGER;
    p_progress INTEGER;
    p_vehicles_check_override BOOLEAN;

    -- Variáveis locais
    v_visit RECORD;
    v_order RECORD;
    v_team_member RECORD;
    v_follower RECORD;
    v_user_name_short TEXT;
    v_notification_body TEXT;
    v_timestamp TIMESTAMP;
BEGIN
    -- Extração de parâmetros do JSONB
    p_visit_id := (payload->>'visit_id')::BIGINT;
    p_user_id := (payload->>'user_id')::BIGINT;
    p_order_status_id := (payload->>'order_status_id')::INTEGER;
    
    -- Tratamento de nulos para opcionais
    IF (payload->>'suspended_reason_id') IS NULL OR (payload->>'suspended_reason_id') = 'null' THEN
        p_suspended_reason_id := NULL;
    ELSE
        p_suspended_reason_id := (payload->>'suspended_reason_id')::INTEGER;
    END IF;

    IF (payload->>'progress') IS NULL OR (payload->>'progress') = 'null' THEN
        p_progress := NULL;
    ELSE
        p_progress := (payload->>'progress')::INTEGER;
    END IF;

    p_vehicles_check_override := COALESCE((payload->>'vehicles_check_override')::BOOLEAN, FALSE);

    v_timestamp := timezone('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 1. Validar e Buscar Dados da Visita
    SELECT * INTO v_visit FROM orders_visits WHERE id = p_visit_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Visita não encontrada.');
    END IF;

    -- Validar se a visita já não está encerrada
    IF v_visit.ov_status_id = 2 THEN
         RETURN jsonb_build_object('success', false, 'message', 'Visita já está encerrada.');
    END IF;

    -- Buscar dados da Ordem relacionada
    SELECT * INTO v_order FROM orders WHERE id = v_visit.o_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ordem de serviço não encontrada.');
    END IF;

    -- Buscar nome do usuário logado para notificação
    SELECT name_short INTO v_user_name_short FROM users WHERE id = p_user_id;

    -- 3. Atualizar Tabela orders_visits
    UPDATE orders_visits
    SET 
        ov_ended_at = v_timestamp,
        ov_status_id = 2, -- Encerrada
        -- Campos de snapshot da OS
        ov_o_status_id = p_order_status_id,
        ov_o_suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE NULL END,
        ov_o_progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END
    WHERE id = p_visit_id;

    -- 4. Atualizar Tabela orders
    UPDATE orders
    SET
        status_id = p_order_status_id,
        suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE suspended_reason_id END,
        progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END,
        status_at = v_timestamp
    WHERE id = v_visit.o_id;

    -- 5. Atualizar Tabela Users (Liberar equipe)
    UPDATE users
    SET
        is_available = TRUE,
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
        is_ov_in_progress = FALSE,
        ov_id_in_progress_mask = NULL
    WHERE id IN (
        SELECT user_id FROM orders_visits_teams WHERE ov_id = p_visit_id
    );

    -- 6. Enviar Notificação para Seguidores
    SELECT * INTO v_visit FROM v_orders_visits WHERE id = p_visit_id; 
        
    FOR v_follower IN 
        SELECT user_id FROM orders_followers WHERE o_id = v_visit.o_id
    LOOP
        v_notification_body := v_user_name_short || ' encerrou a visita:' || E'\n' ||
                               'OS ' || COALESCE(v_visit.o_mask, '') || ': ' || COALESCE(v_visit.o_status_description, '') || E'\n' ||
                               'Cliente: ' || COALESCE(v_visit.o_client_name, '') || E'\n' ||
                               'Unidade: ' || COALESCE(v_visit.o_unit_description, '') || E'\n' ||
                               'Setor/Posição: ' || COALESCE(v_visit.o_asset_tag_description, '') || '/' || COALESCE(v_visit.o_asset_tag_sub_description, '') || E'\n' ||
                               'Servicos a realizar: ' || COALESCE(v_visit.o_requested_services, '');

        INSERT INTO users_notifications (
            user_id_to,
            user_id_from,
            title,
            body,
            type,
            user_to_whatsapp,
            created_at,
            is_read
        ) VALUES (
            v_follower.user_id,
            p_user_id,
            'Visita encerrada.',
            v_notification_body,
            'Visita encerrada',
            (SELECT mobile_whatsapp FROM users WHERE id = v_follower.user_id),
            CURRENT_TIMESTAMP,
            FALSE
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Visita encerrada com sucesso.',
        'visit_id', p_visit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao encerrar visita: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION flow_order_visit_close_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION flow_order_visit_close_v2 TO service_role;

NOTIFY pgrst, 'reload schema';
