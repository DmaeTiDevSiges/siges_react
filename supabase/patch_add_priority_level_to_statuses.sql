ALTER TABLE public.cfg_orders_statuses 
ADD COLUMN priority_level INTEGER DEFAULT 50;

-- Atualizar valores iniciais baseados na lógica de negócio
UPDATE public.cfg_orders_statuses SET priority_level = 100 WHERE id = 5; -- EXECUÇÃO (máxima prioridade)
UPDATE public.cfg_orders_statuses SET priority_level = 80 WHERE id = 4;  -- AGENDADA
UPDATE public.cfg_orders_statuses SET priority_level = 70 WHERE id = 3;  -- AUTORIZADA
UPDATE public.cfg_orders_statuses SET priority_level = 60 WHERE id = 2;  -- AVALIAÇÃO
UPDATE public.cfg_orders_statuses SET priority_level = 50 WHERE id = 6;  -- SUSPENSA
UPDATE public.cfg_orders_statuses SET priority_level = 40 WHERE id = 8;  -- CONCLUÍDA
UPDATE public.cfg_orders_statuses SET priority_level = 30 WHERE id = 7;  -- CANCELADA
UPDATE public.cfg_orders_statuses SET priority_level = 10 WHERE id = 1;  -- NÃO PROGRAMADA (mínima prioridade)
