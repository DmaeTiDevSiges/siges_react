-- =============================================================================
-- TRIGGER: trg_followers_orders_status_changed
-- Generated: 2026-03-01
-- Description: Notifica os seguidores de uma OS quando sua situação (status) é alterada.
-- Business Logic: flows/notifications/followers-orders-status-changed.flow
-- Version: 1.2.0
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Criar a função que será chamada pelo trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_followers_orders_status_changed()
RETURNS TRIGGER AS $$
DECLARE
    v_follower      RECORD;
    v_order         RECORD;
    v_user_name     TEXT;
    v_body          TEXT;
    v_timestamp     TEXT;
    v_status_desc   TEXT;
BEGIN
    -- Condição: só processa se o status_id mudou OU se é re-agendamento (status 4)
    IF OLD.status_id IS NOT DISTINCT FROM NEW.status_id AND NEW.status_id != 4 THEN
        RETURN NEW;
    END IF;

    -- Timestamp formatado no fuso horário de Brasília
    v_timestamp := TO_CHAR(
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        'DD/MM/YYYY HH24:MI'
    );

    -- Buscar detalhes da OS (cliente, unidade, serviços)
    SELECT
        o.o_mask,
        o.requested_services,
        c.name_full         AS client_name,
        u.description_full  AS unit_description,
        s.description       AS status_description
    INTO v_order
    FROM public.orders o
    LEFT JOIN public.clients       c ON c.id = o.client_id
    LEFT JOIN public.units         u ON u.id = o.unit_id
    LEFT JOIN public.cfg_orders_statuses s ON s.id = NEW.status_id
    WHERE o.id = NEW.id;

    -- Buscar o nome curto do usuário que realizou a alteração
    SELECT COALESCE(name_short, 'Sistema')
    INTO v_user_name
    FROM public.users
    WHERE id = NEW.updated_user_id;

    -- Iterar sobre cada seguidor da OS
    FOR v_follower IN
        SELECT
            f.user_id,
            u.mobile_whatsapp
        FROM public.orders_followers f
        JOIN public.users u ON u.id = f.user_id
        WHERE f.o_id = NEW.id
    LOOP
        -- Montar o corpo da notificação
        v_body :=
            'OS '          || COALESCE(v_order.o_mask, '')             || chr(10) ||
            'Cliente: '    || COALESCE(v_order.client_name, 'N/A')     || chr(10) ||
            'Unidade: '    || COALESCE(v_order.unit_description, 'N/A') || chr(10) ||
            'Serviços: '   || COALESCE(v_order.requested_services, 'N/A') || chr(10) ||
            'Situação: '   || COALESCE(v_order.status_description, 'N/A') || chr(10) ||
            'Data hora: '  || v_timestamp                               || chr(10) ||
            'Usuário: '    || COALESCE(v_user_name, 'N/A');

        -- Inserir notificação para o seguidor
        INSERT INTO public.users_notifications (
            user_id_to,
            user_id_from,
            title,
            body,
            type,
            user_to_whatsapp,
            o_id,
            created_at,
            is_read
        ) VALUES (
            v_follower.user_id,
            NEW.updated_user_id,
            'Atualização Situação OS ' || COALESCE(v_order.o_mask, ''),
            v_body,
            'order_status_change',
            v_follower.mobile_whatsapp,
            NEW.id,
            TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
            FALSE
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- STEP 2: Criar o trigger na tabela orders
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_followers_orders_status_changed ON public.orders;

CREATE TRIGGER trg_followers_orders_status_changed
    AFTER UPDATE OF status_id ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_followers_orders_status_changed();

-- -----------------------------------------------------------------------------
-- STEP 3: Commentários para documentação
-- -----------------------------------------------------------------------------

COMMENT ON FUNCTION public.handle_followers_orders_status_changed() IS
    'Flow: followers-orders-status-changed v1.2.0 — Notifica os seguidores de uma OS quando sua situação é alterada. Dispara após UPDATE em orders.status_id.';

-- -----------------------------------------------------------------------------
-- STEP 4: Recarregar schema do PostgREST
-- -----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
