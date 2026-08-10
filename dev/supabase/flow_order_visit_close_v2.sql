-- RPC: flow_order_visit_close_v2
-- Optimized: 2026-07-26 (Performance fix: removed full view select inside transaction & batch notification insert)

CREATE OR REPLACE FUNCTION flow_order_visit_close_v2(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    p_visit_id bigint;
    p_user_id bigint;
    p_order_status_id int;
    p_suspended_reason_id int;
    p_progress int;
    p_vehicles_check_override boolean;
    v_now timestamp;
    v_visit record;
    v_order record;
    v_user_name_short text;
    v_notification_body text;
    v_incomplete_vehicle record;
BEGIN
    -- 1. Parse payload
    p_visit_id := (payload->>'visit_id')::bigint;
    p_user_id := (payload->>'user_id')::bigint;
    p_order_status_id := (payload->>'order_status_id')::int;

    IF (payload->>'suspended_reason_id') IS NULL OR (payload->>'suspended_reason_id') = 'null' THEN
        p_suspended_reason_id := NULL;
    ELSE
        p_suspended_reason_id := (payload->>'suspended_reason_id')::int;
    END IF;

    IF (payload->>'progress') IS NULL OR (payload->>'progress') = 'null' THEN
        p_progress := NULL;
    ELSE
        p_progress := (payload->>'progress')::int;
    END IF;

    p_vehicles_check_override := COALESCE((payload->>'vehicles_check_override')::boolean, false);
    v_now := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 2. Fetch Visit Context
    SELECT id, o_id, ov_status_id, ov_started_at INTO v_visit FROM orders_visits WHERE id = p_visit_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Visita não encontrada.');
    END IF;

    IF v_visit.ov_status_id = 2 THEN
         RETURN jsonb_build_object('success', false, 'message', 'Visita já está encerrada.');
    END IF;

    -- Fetch Order details directly (lightweight)
    SELECT id, mask, client_name, unit_description, requested_services INTO v_order FROM v_orders WHERE id = v_visit.o_id;
    SELECT name_short INTO v_user_name_short FROM users WHERE id = p_user_id;

    -- 3. Vehicle Check (Business Rule)
    IF NOT p_vehicles_check_override THEN
        FOR v_incomplete_vehicle IN 
            SELECT vehicle_id, recorder_start, recorder_end 
            FROM orders_visits_vehicles 
            WHERE ov_id = p_visit_id
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
        ov_o_status_id = p_order_status_id,
        ov_o_suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE NULL END,
        ov_o_progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END,
        ov_duration_hours = EXTRACT(EPOCH FROM (v_now - ov_started_at)) / 3600.0
    WHERE id = p_visit_id;

    -- B. Update orders
    UPDATE orders
    SET 
        status_id = p_order_status_id,
        suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE suspended_reason_id END,
        progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END,
        status_at = v_now
    WHERE id = v_visit.o_id;

    -- C. Release team members
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
    WHERE id IN (
        SELECT user_id FROM orders_visits_teams WHERE ov_id = p_visit_id
    );

    -- 5. Send Notifications to Followers (Batch INSERT - no loop/no view scan)
    v_notification_body := COALESCE(v_user_name_short, 'Equipe') || ' encerrou a visita:' || chr(10) ||
                           'OS ' || COALESCE(v_order.mask, '') || chr(10) ||
                           'Cliente: ' || COALESCE(v_order.client_name, '') || chr(10) ||
                           'Unidade: ' || COALESCE(v_order.unit_description, '');

    INSERT INTO users_notifications (
        user_id_to,
        user_id_from,
        title,
        body,
        type,
        user_to_whatsapp,
        created_at,
        is_read
    )
    SELECT 
        f.user_id,
        p_user_id,
        'Visita encerrada.',
        v_notification_body,
        'Visita encerrada',
        u.mobile_whatsapp,
        v_now,
        false
    FROM orders_followers f
    JOIN users u ON u.id = f.user_id
    WHERE f.o_id = v_visit.o_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Visita encerrada com sucesso.',
        'visit_id', p_visit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'Erro ao encerrar visita: ' || SQLERRM
    );
END;
$$;

