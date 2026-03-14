-- RPC: flow_order_visit_close_v2
-- Generated: 2026-01-22
-- Description: Closes an order visit, updates OS status, resets user progress, and sends notifications.
-- Business Logic from: flows/ordersVisits/close-order-visit.flow
-- FIX: Removed non-existent 'status_at' column from orders_visits update.

CREATE OR REPLACE FUNCTION flow_order_visit_close_v2(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visit_id bigint;
    v_user_id bigint;
    v_order_status_id int;
    v_suspended_reason_id int;
    v_progress float;
    v_override_vehicles boolean;
    v_now timestamp;
    v_order_id bigint;
    v_result jsonb;
    v_follower record;
    v_order_info record;
    v_incomplete_vehicle record;
BEGIN
    -- 1. Parse payload
    v_visit_id := (payload->>'visit_id')::bigint;
    v_user_id := (payload->>'user_id')::bigint;
    v_order_status_id := (payload->>'order_status_id')::int;
    v_suspended_reason_id := (payload->>'suspended_reason_id')::int;
    v_progress := (payload->>'progress')::float;
    v_override_vehicles := COALESCE((payload->>'vehicles_check_override')::boolean, false);
    v_now := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 2. Fetch Visit and Order Context
    SELECT o_id INTO v_order_id FROM orders_visits WHERE id = v_visit_id;
    IF v_order_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Visita não encontrada.');
    END IF;

    -- 3. Vehicle Check (Business Rule)
    -- Se existir veículos associados à visita (orders_visits_vehicles), verificar recorder_start < recorder_end
    IF NOT v_override_vehicles THEN
        FOR v_incomplete_vehicle IN 
            SELECT vehicle_id, recorder_start, recorder_end 
            FROM orders_visits_vehicles 
            WHERE ov_id = v_visit_id
        LOOP
            IF v_incomplete_vehicle.recorder_start IS NOT NULL AND (v_incomplete_vehicle.recorder_end IS NULL OR v_incomplete_vehicle.recorder_end < v_incomplete_vehicle.recorder_start) THEN
                RETURN jsonb_build_object('success', false, 'message', 'Há registros de veículos sem finalização (Km final inválido ou ausente).');
            END IF;
        END LOOP;
    END IF;

    -- 4. Execute Updates in Transaction
    -- A. Update orders_visits
    UPDATE orders_visits
    SET 
        ov_ended_at = v_now,
        ov_status_id = 2, -- Encerrada
        ov_o_status_id = v_order_status_id,
        ov_o_suspended_reason_id = CASE WHEN v_order_status_id = 6 THEN v_suspended_reason_id ELSE NULL END,
        ov_o_progress = v_progress / 100.0,
        -- status_at = v_now, -- Removed: column does not exist in orders_visits
        ov_duration_hours = EXTRACT(EPOCH FROM (v_now - ov_started_at)) / 3600.0
    WHERE id = v_visit_id;

    -- B. Update orders
    UPDATE orders
    SET 
        status_id = v_order_status_id,
        status_at = v_now,
        progress = v_progress / 100.0
    WHERE id = v_order_id;

    -- C. Tabela users (realizar um loop em orders_visits_teams e atualizar os campos para users.id = orders_visits_teams.user_id)
    UPDATE users
    SET 
        is_available = true,
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
        ov_id_in_progress_mask = null
    FROM orders_visits_teams
    WHERE users.id = orders_visits_teams.user_id 
    AND orders_visits_teams.ov_id = v_visit_id;

    -- 5. Send Notifications to Followers
    -- Buscar detalhes da visita para o corpo da notificação via view
    SELECT * INTO v_order_info FROM v_orders_visits WHERE id = v_visit_id;

    FOR v_follower IN 
        SELECT f.user_id, u.mobile_whatsapp 
        FROM orders_followers f
        JOIN users u ON u.id = f.user_id
        WHERE f.o_id = v_order_id
    LOOP
        INSERT INTO users_notifications (
            user_id_to,
            user_id_from,
            title,
            body,
            type,
            user_to_whatsapp
        ) VALUES (
            v_follower.user_id,
            v_user_id,
            'Visita encerrada.',
            COALESCE(v_order_info.ov_team_leader_name_short, 'Equipe') || ' encerrou a visita:' || chr(10) ||
            'OS ' || COALESCE(v_order_info.o_mask, '') || ': ' || COALESCE(v_order_info.o_status_description, '') || chr(10) ||
            'Cliente: ' || COALESCE(v_order_info.o_client_name, '') || chr(10) ||
            'Unidade: ' || COALESCE(v_order_info.o_unit_description, '') || chr(10) ||
            'Setor/Posição: ' || COALESCE(v_order_info.o_asset_tag_description, '') || ' / ' || COALESCE(v_order_info.o_asset_tag_sub_description, '') || chr(10) ||
            'Serviços a realizar: ' || COALESCE(v_order_info.o_requested_services, ''),
            'Visita encerrada',
            v_follower.mobile_whatsapp
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Visita encerrada com sucesso.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'Erro ao encerrar visita: ' || SQLERRM
    );
END;
$$;
