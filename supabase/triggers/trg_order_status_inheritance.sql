-- =============================================================================
-- TRIGGER: trg_order_status_inheritance
-- Descrição: Atualiza automaticamente a SS (Pai) com base no status e data da 
--            OS (Filha) que possuir o maior peso (priority_level).
-- =============================================================================

-- 1. Função de Manuseio
CREATE OR REPLACE FUNCTION public.fc_order_status_inheritance()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id BIGINT;
    v_target_order RECORD;
BEGIN
    -- Identificar se a ordem atualizada possui um pai (é uma OS de uma SS)
    v_parent_id := NEW.parent_id;
    
    -- Se não tiver pai (ou seja, é a SS raiz), ignoramos
    IF v_parent_id IS NULL OR v_parent_id = 0 THEN
        RETURN NEW;
    END IF;

    -- Buscar a OS "vencedora" para este pai:
    -- Regra 1: Maior priority_level (peso da situação)
    -- Regra 2: Data de situação (status_at) mais recente para desempate
    SELECT 
        o.status_id, 
        o.status_at
    INTO v_target_order
    FROM public.orders o
    JOIN public.cfg_orders_statuses s ON s.id = o.status_id
    WHERE o.parent_id = v_parent_id
      AND o.is_deleted = false
    ORDER BY s.priority_level DESC, o.status_at DESC
    LIMIT 1;

    -- Se encontrarmos a OS filha mais relevante, atualizamos a SS (Pai)
    IF v_target_order.status_id IS NOT NULL THEN
        UPDATE public.orders
        SET 
            status_id = v_target_order.status_id,
            status_at = v_target_order.status_at, -- Ajuste de DATA sincronizado
            updated_at = TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)
        WHERE id = v_parent_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger associado à nova função
DROP TRIGGER IF EXISTS trg_order_status_inheritance ON public.orders;

CREATE TRIGGER trg_order_status_inheritance
    AFTER UPDATE OF status_id, status_at ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_order_status_inheritance();

-- 3. Notificação PostgREST
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.fc_order_status_inheritance() IS 
'v1.3.0 - Sincroniza automaticamente Situação e Data da SS com base no peso (priority_level) das OSs filhas.';
