-- ==============================================================================
-- Migration: 20261125_rename_client_uuid_to_offline_uuid.sql
-- Modo offline — a coluna client_uuid passa a se chamar offline_uuid.
--
-- Por quê: no SIGES "client" se confunde com CLIENTE (empresa atendida,
-- client_id). A coluna guarda o UUID que o APP gera para uma linha criada SEM
-- INTERNET (id local "tmp:<uuid>"); o UNIQUE impede duplicar no reenvio da fila.
-- NULL = linha criada online.
--
-- Tabelas (6): orders_visits, orders_visits_assets, orders_visits_assets_activities, orders_visits_assets_materials, orders_visits_services, orders_visits_vehicles.
-- Índices ux_<tabela>_client_uuid → ux_<tabela>_offline_uuid.
-- flow_order_visit_create_v3 recriada com as colunas novas; o payload aceita
-- offline_uuid/vehicle_offline_uuid (APK novo) E client_uuid/vehicle_client_uuid
-- (APK anterior). Não muda: orders_visits.ov_close_client_op_id (outro campo).
--
-- ORDEM SEGURA: distribuir primeiro o APK novo (que funciona com os DOIS nomes
-- de coluna), depois aplicar esta migration. Um APK antigo depois dela ainda
-- grava (sem a proteção contra duplicata) mas não acha o id real de itens
-- criados offline — por isso atualizar os aparelhos antes.
--
-- Idempotente (renomeia só se ainda existir client_uuid).
-- Reverter: 20261125_rename_client_uuid_to_offline_uuid_DOWN.sql
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.rename_to_offline_uuid(p_table text) RETURNS void LANGUAGE plpgsql AS $r$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'client_uuid')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'offline_uuid') THEN
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN client_uuid TO offline_uuid', p_table);
    END IF;
    IF to_regclass(format('public.ux_%s_client_uuid', p_table)) IS NOT NULL
       AND to_regclass(format('public.ux_%s_offline_uuid', p_table)) IS NULL THEN
        EXECUTE format('ALTER INDEX public.%I RENAME TO %I', 'ux_' || p_table || '_client_uuid', 'ux_' || p_table || '_offline_uuid');
    END IF;
    EXECUTE format(
        'COMMENT ON COLUMN public.%I.offline_uuid IS %L', p_table,
        'UUID gerado pelo APP para a linha criada sem internet (id local "tmp:<uuid>"; UNIQUE impede duplicar no reenvio da fila). NULL = criada online. Não é o cliente/empresa.'
    );
END;
$r$;

DO $$
BEGIN
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits');
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits_assets');
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits_assets_activities');
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits_assets_materials');
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits_services');
    PERFORM pg_temp.rename_to_offline_uuid('orders_visits_vehicles');
END $$;

CREATE OR REPLACE FUNCTION public.flow_order_visit_create_v3(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id          bigint;
    v_user_id           bigint;
    v_auth_user_id      bigint;
    v_offline_uuid       uuid;
    v_vehicle_uuid      uuid;
    v_now               timestamp := timezone('America/Sao_Paulo', now());
    v_started_at        timestamp;
    v_requested_start   timestamp;
    v_client_started    timestamp;
    v_allow_manual      boolean := false;
    v_existing          record;
    v_order             record;
    v_visit_id          bigint;
    v_ov_mask           text;
    v_new_ov_counter    int;
    v_team_member       record;
    v_follower          record;
    v_order_info        record;
    v_user_info         record;
    v_team_id           bigint;
    v_vehicle_id        bigint;
    v_member_order      int := 1;
BEGIN
    -- 1. Payload
    v_order_id     := (payload->>'order_id')::bigint;
    v_user_id      := (payload->>'user_id')::bigint;
    -- offline_uuid (APK novo) ou client_uuid (APK anterior à 20261125).
    v_offline_uuid := COALESCE(NULLIF(payload->>'offline_uuid', ''), NULLIF(payload->>'client_uuid', ''))::uuid;
    v_vehicle_uuid := COALESCE(NULLIF(payload->>'vehicle_offline_uuid', ''), NULLIF(payload->>'vehicle_client_uuid', ''))::uuid;

    -- Quem chama precisa ser o líder informado.
    SELECT u.id INTO v_auth_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_auth_user_id IS NULL OR v_auth_user_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    -- 0. Idempotência: a mesma operação da fila já criou a visita?
    IF v_offline_uuid IS NOT NULL THEN
        SELECT ov.id, ov.ov_mask, ov.ov_started_at INTO v_existing
          FROM public.orders_visits ov WHERE ov.offline_uuid = v_offline_uuid;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true, 'already_applied', true, 'message', 'Visita iniciada com sucesso.',
                'visit_id', v_existing.id, 'ov_mask', v_existing.ov_mask, 'started_at', v_existing.ov_started_at
            );
        END IF;
    END IF;

    -- 2. OS (linha travada: contador de visitas sem corrida)
    SELECT o.id, o.parent_id, o.order_mask, COALESCE(o.ov_counter, 0) AS ov_counter,
           o.status_id, o.team_leader_id, COALESCE(o.is_deleted, false) AS is_deleted, o.contract_id
      INTO v_order
      FROM public.orders o
     WHERE o.id = v_order_id
       FOR UPDATE;
    IF NOT FOUND OR v_order.order_mask IS NULL THEN
        RAISE EXCEPTION 'OS não encontrada.' USING ERRCODE = 'P0002';
    END IF;

    -- Conflito (só para a fila offline): a OS mudou enquanto o técnico estava sem internet.
    IF v_offline_uuid IS NOT NULL THEN
        IF v_order.is_deleted OR v_order.status_id IN (7, 8) THEN
            RAISE EXCEPTION 'A OS foi concluída ou cancelada enquanto você estava sem internet.'
                USING ERRCODE = 'SG409';
        END IF;
        IF v_order.team_leader_id IS NOT NULL AND v_order.team_leader_id <> v_user_id THEN
            RAISE EXCEPTION 'A OS passou para outro líder enquanto você estava sem internet.'
                USING ERRCODE = 'SG409';
        END IF;
    END IF;

    -- 3. Hora de início
    SELECT COALESCE(c.is_manual_visit_start_end, false) INTO v_allow_manual
      FROM public.contracts c WHERE c.id = v_order.contract_id;
    v_allow_manual := COALESCE(v_allow_manual, false);

    v_requested_start := NULLIF(payload->>'started_at', '')::timestamp;
    v_client_started  := NULLIF(replace(COALESCE(payload->>'client_started_at', ''), 'T', ' '), '')::timestamp;

    IF v_allow_manual AND v_requested_start IS NOT NULL THEN
        IF v_requested_start > v_now THEN
            RAISE EXCEPTION 'Data/hora de início não pode ser futura.' USING ERRCODE = '22023';
        END IF;
        v_started_at := v_requested_start;
    ELSIF v_client_started IS NOT NULL THEN
        v_started_at := LEAST(v_client_started, v_now);   -- relógio adiantado → agora
    ELSE
        v_started_at := v_now;
    END IF;

    -- 4. Usuário
    SELECT u.team_id, u.vehicle_id INTO v_team_id, v_vehicle_id FROM public.users u WHERE u.id = v_user_id;

    v_new_ov_counter := v_order.ov_counter + 1;
    v_ov_mask := v_order.order_mask || '.' || LPAD(v_new_ov_counter::text, 2, '0');

    -- A. SS pai
    IF v_order.parent_id IS NOT NULL THEN
        UPDATE public.orders
           SET status_id  = 5, -- Em Andamento
               status_at  = v_started_at,
               ov_counter = ov_counter + 1
         WHERE id = v_order.parent_id;
    END IF;

    -- B. OS
    UPDATE public.orders
       SET status_id  = 5,
           status_at  = v_started_at,
           ov_counter = v_new_ov_counter
     WHERE id = v_order_id;

    -- C. Visita
    INSERT INTO public.orders_visits (
        o_id, ov_status_id, ov_processing_id, ov_started_at,
        ov_team_leader_id, ov_created_user_id, ov_created_at, ov_mask, offline_uuid
    ) VALUES (
        v_order_id, 1, 1, v_started_at,
        v_user_id, v_user_id, v_now, v_ov_mask, v_offline_uuid
    ) RETURNING id INTO v_visit_id;

    -- D. Veículo do líder
    IF v_vehicle_id IS NOT NULL AND v_vehicle_id > 0 THEN
        INSERT INTO public.orders_visits_vehicles (ov_id, vehicle_id, created_user_id, created_at, offline_uuid)
        VALUES (v_visit_id, v_vehicle_id, v_user_id, v_now, v_vehicle_uuid);
    END IF;

    -- E. Equipe: líder
    INSERT INTO public.orders_visits_teams (ov_id, user_id, is_leader, order_id)
    VALUES (v_visit_id, v_user_id, true, 0);

    -- F. Líder em visita
    UPDATE public.users
       SET ov_id_in_progress = v_visit_id,
           is_available = false,
           is_ov_in_progress = true,
           o_id_in_progress = v_order_id,
           op_id_in_progress = v_order.parent_id,
           ov_id_in_progress_mask = v_ov_mask
     WHERE id = v_user_id;

    -- G. Demais membros disponíveis da equipe (no momento do envio)
    FOR v_team_member IN
        SELECT u.id FROM public.users u
         WHERE u.team_id = v_team_id
           AND u.is_available = true
           AND u.id <> v_user_id
         ORDER BY u.name_short ASC
    LOOP
        INSERT INTO public.orders_visits_teams (ov_id, user_id, is_leader, order_id)
        VALUES (v_visit_id, v_team_member.id, false, v_member_order);

        UPDATE public.users
           SET ov_id_in_progress = v_visit_id,
               is_available = false,
               is_ov_in_progress = true,
               o_id_in_progress = v_order_id,
               op_id_in_progress = v_order.parent_id,
               ov_id_in_progress_mask = v_ov_mask
         WHERE id = v_team_member.id;

        v_member_order := v_member_order + 1;
    END LOOP;

    -- 5. Seguidores da SS
    IF v_order.parent_id IS NOT NULL THEN
        SELECT * INTO v_order_info FROM public.v_orders WHERE id = v_order_id;
        SELECT name_short INTO v_user_info FROM public.users WHERE id = v_user_id;

        FOR v_follower IN
            SELECT f.user_id, u.mobile_whatsapp
              FROM public.orders_followers f
              JOIN public.users u ON u.id = f.user_id
             WHERE f.o_id = v_order.parent_id
        LOOP
            INSERT INTO public.users_notifications (
                user_id_to, user_id_from, title, body, type, user_to_whatsapp
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
        'already_applied', false,
        'message', 'Visita iniciada com sucesso.',
        'visit_id', v_visit_id,
        'ov_mask', v_ov_mask,
        'started_at', v_started_at,
        'offline', v_offline_uuid IS NOT NULL
    );
END;
$$;

COMMENT ON FUNCTION public.flow_order_visit_create_v3(jsonb) IS
    'Inicia a visita (OS/SS, visita, veículo, equipe, notificações) numa transação; idempotente por offline_uuid para a fila offline. SECURITY DEFINER.';

REVOKE ALL ON FUNCTION public.flow_order_visit_create_v3(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flow_order_visit_create_v3(jsonb) TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (6 linhas com offline_uuid, nenhuma com client_uuid):
--   SELECT table_name, column_name FROM information_schema.columns
--    WHERE table_schema = 'public' AND column_name IN ('client_uuid', 'offline_uuid')
--    ORDER BY 1;
