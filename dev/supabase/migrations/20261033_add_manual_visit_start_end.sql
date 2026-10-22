-- Migration: apontamento manual de início/fim da visita
-- Data: 2026-10-22
--
-- Adiciona a flag no contrato e permite que a RPC de início de visita aceite
-- um `started_at` informado manualmente (inclusive de outro dia).
-- O encerramento manual é feito pelo app em `orders_visits.ov_ended_at`.
-- O trigger de duração passa a bloquear fim anterior ao início.
--
-- Aplicar manualmente no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------
-- 1. Flag no contrato
-- ---------------------------------------------------------------------------
ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS is_manual_visit_start_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contracts.is_manual_visit_start_end IS
    'Exige informar data/hora de início e fim da visita (apontamento manual).';

-- ---------------------------------------------------------------------------
-- 2. RPC de início de visita com started_at opcional
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION flow_order_visit_create_v2(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id bigint;
    v_user_id bigint;
    v_now timestamp;
    v_started_at timestamp;
    v_requested_start timestamp;
    v_allow_manual boolean := false;
    v_visit_id bigint;
    v_ov_mask text;
    v_new_ov_counter int;
    v_parent_id bigint;
    v_team_member record;
    v_follower record;
    v_order_info record;
    v_user_info record;
    v_order_mask text;
    v_team_id bigint;
    v_vehicle_id bigint;
    v_member_order int := 1;
BEGIN
    -- 1. Parse payload
    v_order_id := (payload->>'order_id')::bigint;
    v_user_id := (payload->>'user_id')::bigint;
    v_now := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 1.1 A flag do contrato decide se o início informado é aceito.
    SELECT COALESCE(c.is_manual_visit_start_end, false)
      INTO v_allow_manual
      FROM orders o
      LEFT JOIN contracts c ON c.id = o.contract_id
     WHERE o.id = v_order_id;

    v_allow_manual := COALESCE(v_allow_manual, false);
    v_requested_start := NULLIF(payload->>'started_at', '')::timestamp;

    IF v_allow_manual AND v_requested_start IS NOT NULL THEN
        IF v_requested_start > v_now THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Data/hora de início não pode ser futura.'
            );
        END IF;
        v_started_at := v_requested_start;
    ELSE
        v_started_at := v_now;
    END IF;

    -- 2. Fetch User and Order Info
    SELECT team_id, vehicle_id INTO v_team_id, v_vehicle_id FROM users WHERE id = v_user_id;
    SELECT parent_id, order_mask, COALESCE(ov_counter, 0) INTO v_parent_id, v_order_mask, v_new_ov_counter FROM orders WHERE id = v_order_id;

    IF v_order_mask IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'OS não encontrada.');
    END IF;

    v_new_ov_counter := v_new_ov_counter + 1;
    v_ov_mask := v_order_mask || '.' || LPAD(v_new_ov_counter::text, 2, '0');

    -- 3. Execute Updates in Transaction
    -- A. Update Parent SS if exists
    IF v_parent_id IS NOT NULL THEN
        UPDATE orders
        SET
            status_id = 5, -- Em Andamento
            status_at = v_started_at,
            ov_counter = ov_counter + 1
        WHERE id = v_parent_id;
    END IF;

    -- B. Update Order (OS)
    UPDATE orders
    SET
        status_id = 5, -- Em Andamento
        status_at = v_started_at,
        ov_counter = v_new_ov_counter
    WHERE id = v_order_id;

    -- C. Insert orders_visits
    -- ov_started_at segue o horário informado; ov_created_at é auditoria (agora).
    INSERT INTO orders_visits (
        o_id,
        ov_status_id,
        ov_processing_id,
        ov_started_at,
        ov_team_leader_id,
        ov_created_user_id,
        ov_created_at,
        ov_mask
    ) VALUES (
        v_order_id,
        1, -- Em Andamento
        1, -- Rascunho
        v_started_at,
        v_user_id,
        v_user_id,
        v_now,
        v_ov_mask
    ) RETURNING id INTO v_visit_id;

    -- D. Handle Vehicle
    IF v_vehicle_id IS NOT NULL AND v_vehicle_id > 0 THEN
        INSERT INTO orders_visits_vehicles (
            ov_id,
            vehicle_id,
            created_user_id,
            created_at
        ) VALUES (
            v_visit_id,
            v_vehicle_id,
            v_user_id,
            v_now
        );
    END IF;

    -- E. Handle Team (Leader)
    INSERT INTO orders_visits_teams (
        ov_id,
        user_id,
        is_leader,
        order_id
    ) VALUES (
        v_visit_id,
        v_user_id,
        true,
        0
    );

    -- F. Update Leader Progress
    UPDATE users
    SET
        ov_id_in_progress = v_visit_id,
        is_available = false,
        is_ov_in_progress = true,
        o_id_in_progress = v_order_id,
        op_id_in_progress = v_parent_id,
        ov_id_in_progress_mask = v_ov_mask
    WHERE id = v_user_id;

    -- G. Handle Other Team Members
    FOR v_team_member IN
        SELECT id FROM users
        WHERE team_id = v_team_id
        AND is_available = true
        AND id != v_user_id
        ORDER BY name_short ASC
    LOOP
        INSERT INTO orders_visits_teams (
            ov_id,
            user_id,
            is_leader,
            order_id
        ) VALUES (
            v_visit_id,
            v_team_member.id,
            false,
            v_member_order
        );

        UPDATE users
        SET
            ov_id_in_progress = v_visit_id,
            is_available = false,
            is_ov_in_progress = true,
            o_id_in_progress = v_order_id,
            op_id_in_progress = v_parent_id,
            ov_id_in_progress_mask = v_ov_mask
        WHERE id = v_team_member.id;

        v_member_order := v_member_order + 1;
    END LOOP;

    -- 4. Send Notifications to Followers of Parent (SS)
    IF v_parent_id IS NOT NULL THEN
        SELECT * INTO v_order_info FROM v_orders WHERE id = v_order_id;
        SELECT name_short INTO v_user_info FROM users WHERE id = v_user_id;

        FOR v_follower IN
            SELECT f.user_id, u.mobile_whatsapp
            FROM orders_followers f
            JOIN users u ON u.id = f.user_id
            WHERE f.o_id = v_parent_id
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
                'OS em atendimento.',
                COALESCE(v_user_info.name_short, 'Técnico') || ' iniciou a visita:' || chr(10) ||
                'OS ' || COALESCE(v_order_info.order_mask, '') || ': ' || COALESCE(v_order_info.status_description, '') || chr(10) ||
                'Cliente: ' || COALESCE(v_order_info.client_name, '') || chr(10) ||
                'Unidade: ' || COALESCE(v_order_info.unit_description, '') || chr(10) ||
                'Setor/Posição: ' || COALESCE(v_order_info.asset_tag_description, '') || ' / ' || COALESCE(v_order_info.asset_tag_sub_description, '') || chr(10) ||
                'Serviços a realizar: ' || COALESCE(v_order_info.requested_services, ''),
                'OS em atendimento',
                v_follower.mobile_whatsapp
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Visita iniciada com sucesso.',
        'visit_id', v_visit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Erro ao iniciar visita: ' || SQLERRM
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Duração: bloqueia encerramento anterior ao início
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_durations_hours_decimals() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.ov_ended_at IS NOT NULL AND NEW.ov_started_at IS NOT NULL
       AND NEW.ov_ended_at < NEW.ov_started_at THEN
        RAISE EXCEPTION 'Encerramento (%) anterior ao início (%) da visita.',
            NEW.ov_ended_at, NEW.ov_started_at;
    END IF;

    IF NEW.ov_status_id = 2 AND NEW.ov_started_at IS NOT NULL AND NEW.ov_ended_at IS NOT NULL THEN
        NEW.ov_duration_hours := EXTRACT(EPOCH FROM (NEW.ov_ended_at - NEW.ov_started_at)) / 3600;
    ELSE
        NEW.ov_duration_hours := NULL;
    END IF;
    RETURN NEW;
END;
$$;
