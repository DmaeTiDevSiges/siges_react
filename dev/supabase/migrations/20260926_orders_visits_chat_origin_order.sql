-- =============================================================================
-- Parte 2 — regra D17: o chat da visita NÃO acompanha a transferência.
-- orders_visits_chat.o_id:
--   NULL  = mensagem vigente (pertence à ordem atual da visita)
--   <OS>  = congelada na OS dona naquele momento (a RPC de transferência grava
--           a OS de origem, para que as mensagens fiquem presas à OS1)
-- A coluna é lida pelo app (visitChatService.getVisitChatMessages) para filtrar.
-- =============================================================================

ALTER TABLE public.orders_visits_chat ADD COLUMN IF NOT EXISTS o_id bigint;

COMMENT ON COLUMN public.orders_visits_chat.o_id IS
    'Ordem dona da mensagem. NULL = vigente com a ordem atual da visita; preenchido com a OS de origem pela RPC flow_order_visit_reassign_v1 (D17).';

CREATE INDEX IF NOT EXISTS idx_orders_visits_chat_o_id ON public.orders_visits_chat (o_id);

NOTIFY pgrst, 'reload schema';
