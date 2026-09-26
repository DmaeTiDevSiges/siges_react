-- Migration: Log de mudanças de situação de SS/OS em orders_statuses_logs
-- Date: 2026-09-25
-- Cobre TODAS as origens da mudança (app, RPCs, triggers de herança, n8n, SQL manual),
-- porque observa o evento no banco e não cada ponto de código.

-- ============================================================
-- 1. CORREÇÃO DE NOME: order_status_ate -> order_status_at
-- ============================================================
-- Idempotente: renomeia somente se o nome antigo existir e o novo ainda não.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name  = 'orders_statuses_logs'
          AND column_name = 'order_status_ate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name  = 'orders_statuses_logs'
          AND column_name = 'order_status_at'
    ) THEN
        ALTER TABLE public.orders_statuses_logs
            RENAME COLUMN order_status_ate TO order_status_at;
    END IF;
END $$;

-- ============================================================
-- 2. FUNÇÃO DE LOG
-- ============================================================

CREATE OR REPLACE FUNCTION public.fc_orders_statuses_logs() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    -- Guarda extra: UPDATE sem mudança real de situação não gera linha.
    -- (a cláusula WHEN do trigger já cobre, isto é defesa dupla)
    -- IF aninhado é obrigatório: em INSERT o record OLD não está atribuído
    -- e qualquer tentativa de leitura levantaria erro.
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status_id IS NOT DISTINCT FROM NEW.status_id THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Usuário autenticado (app). Sem JWT (n8n, imports, jobs) fica NULL.
    BEGIN
        SELECT id INTO v_user_id
        FROM public.users
        WHERE uuid = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    INSERT INTO public.orders_statuses_logs (
        order_id,
        order_status_id,
        order_status_at,
        created_user_id,
        created_date,
        order_parent_id,
        company_id,
        department_id
    ) VALUES (
        NEW.id,
        NEW.status_id,
        NEW.status_at,
        COALESCE(v_user_id, NEW.updated_user_id, NEW.created_user_id),
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        NULLIF(NEW.parent_id, 0),
        NEW.company_id,
        NEW.department_id
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fc_orders_statuses_logs() IS
'Flow: orders-statuses-log v1.1.0 — Registra em orders_statuses_logs a situação inicial (INSERT) e cada mudança real de status_id (UPDATE) em orders, cobrindo SS e OS.';

-- ============================================================
-- 3. TRIGGERS
-- ============================================================
-- INSERT: situação inicial da ordem (ex.: OS recém-criada com status 2,
--         SS recém-criada com status 1) também entra no histórico.
-- UPDATE: WHEN garante que só mudanças REAIS de situação geram linha —
--         updates de progress, contadores, imagens, etc. não poluem o log.

DROP TRIGGER IF EXISTS trg_orders_statuses_logs ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_statuses_logs_insert ON public.orders;

CREATE TRIGGER trg_orders_statuses_logs
    AFTER UPDATE OF status_id ON public.orders
    FOR EACH ROW
    WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
    EXECUTE FUNCTION public.fc_orders_statuses_logs();

CREATE TRIGGER trg_orders_statuses_logs_insert
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_orders_statuses_logs();

-- ============================================================
-- 4. ÍNDICE PARA CONSULTAS POR ORDEM
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_statuses_logs_order_id
    ON public.orders_statuses_logs (order_id);
