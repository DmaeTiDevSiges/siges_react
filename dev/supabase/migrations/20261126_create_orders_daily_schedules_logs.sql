-- ==============================================================================
-- Migration: 20261126_create_orders_daily_schedules_logs.sql
-- Log das movimentações da Programação Diária (Gestão > aba Programação).
--
--   • Uma linha por movimentação de OS entre as áreas do quadro:
--       prioritize     OS's ABERTAS → OS's PRIORIDADE DE ATENDIMENTO
--       unprioritize   OS's PRIORIDADE DE ATENDIMENTO → OS's ABERTAS
--       authorize_team OS's PRIORIDADE DE ATENDIMENTO → EQUIPE (autoriza a OS)
--       assign_team    OS's PRIORIDADE DE ATENDIMENTO → EQUIPE (OS já com essa equipe definida)
--       change_team    OS Autorizada trocada de equipe (atualiza equipe e líder na OS)
--       unassign_team  OS Autorizada retirada da equipe (volta para PRIORIDADE ou ABERTAS)
--   • Gravação só pela RPC fn_orders_daily_schedule_log, que exige a permissão
--     'create' na rota 'orders_daily_schedule' e recusa dias passados.
--   • Leitura: quem tem 'view' na rota.
--
-- Depende da 20261110_create_orders_daily_schedules.sql (rota orders_daily_schedule).
-- Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Reverter: 20261126_create_orders_daily_schedules_logs_DOWN.sql
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.orders_daily_schedules_logs (
    id             BIGSERIAL PRIMARY KEY,
    contract_id    BIGINT NOT NULL REFERENCES public.contracts (id),
    schedule_date  DATE   NOT NULL,
    order_id       BIGINT NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
    action         VARCHAR(20) NOT NULL
                   CONSTRAINT orders_daily_schedules_logs_action_check
                   CHECK (action IN ('prioritize', 'unprioritize', 'authorize_team', 'assign_team', 'change_team', 'unassign_team')),
    from_team_id   BIGINT REFERENCES public.cfg_teams (id),
    to_team_id     BIGINT REFERENCES public.cfg_teams (id),
    -- Posição de destino (1 = primeira) quando fizer sentido; NULL nos demais casos.
    to_position    INTEGER CHECK (to_position IS NULL OR to_position > 0),
    user_id        BIGINT REFERENCES public.users (id),
    created_at     TIMESTAMP NOT NULL DEFAULT timezone('America/Sao_Paulo', now())
);

-- Ações aceitas (recria o CHECK se a tabela já existia com a lista antiga).
ALTER TABLE public.orders_daily_schedules_logs DROP CONSTRAINT IF EXISTS orders_daily_schedules_logs_action_check;
ALTER TABLE public.orders_daily_schedules_logs ADD CONSTRAINT orders_daily_schedules_logs_action_check
    CHECK (action IN ('prioritize', 'unprioritize', 'authorize_team', 'assign_team', 'change_team', 'unassign_team'));

COMMENT ON TABLE public.orders_daily_schedules_logs IS
    'Log das movimentações de OS na Programação Diária (abertas → prioridade → equipes).';

CREATE INDEX IF NOT EXISTS idx_orders_daily_schedules_logs_day
    ON public.orders_daily_schedules_logs (contract_id, schedule_date, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_daily_schedules_logs_order
    ON public.orders_daily_schedules_logs (order_id);

ALTER TABLE public.orders_daily_schedules_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_daily_schedules_logs_select ON public.orders_daily_schedules_logs;
CREATE POLICY orders_daily_schedules_logs_select ON public.orders_daily_schedules_logs
    FOR SELECT TO authenticated
    USING (public.fc_has_route_permission('orders_daily_schedule', 'view'));

REVOKE ALL ON public.orders_daily_schedules_logs FROM anon;
GRANT SELECT ON public.orders_daily_schedules_logs TO authenticated;
GRANT ALL ON public.orders_daily_schedules_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_daily_schedules_logs_id_seq TO service_role;

-- ------------------------------------------------------------------------------
-- RPC: registra uma movimentação (autor = usuário logado).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_orders_daily_schedule_log(
    p_contract_id  BIGINT,
    p_date         DATE,
    p_order_id     BIGINT,
    p_action       VARCHAR,
    p_from_team_id BIGINT  DEFAULT NULL,
    p_to_team_id   BIGINT  DEFAULT NULL,
    p_to_position  INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id BIGINT;
    v_id      BIGINT;
    v_today   DATE := (timezone('America/Sao_Paulo', now()))::date;
BEGIN
    IF NOT public.fc_has_route_permission('orders_daily_schedule', 'create') THEN
        RAISE EXCEPTION 'Sem permissão para movimentar a programação diária.' USING ERRCODE = '42501';
    END IF;

    IF p_contract_id IS NULL OR p_date IS NULL OR p_order_id IS NULL OR p_action IS NULL THEN
        RAISE EXCEPTION 'Contrato, data, OS e ação são obrigatórios.' USING ERRCODE = '22023';
    END IF;

    IF p_date < v_today THEN
        RAISE EXCEPTION 'Dias passados são somente leitura.' USING ERRCODE = '22023';
    END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;

    INSERT INTO public.orders_daily_schedules_logs
        (contract_id, schedule_date, order_id, action, from_team_id, to_team_id, to_position, user_id)
    VALUES
        (p_contract_id, p_date, p_order_id, p_action, p_from_team_id, p_to_team_id,
         CASE WHEN p_to_position > 0 THEN p_to_position END, v_user_id)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_orders_daily_schedule_log(BIGINT, DATE, BIGINT, VARCHAR, BIGINT, BIGINT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_orders_daily_schedule_log(BIGINT, DATE, BIGINT, VARCHAR, BIGINT, BIGINT, INTEGER) TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
