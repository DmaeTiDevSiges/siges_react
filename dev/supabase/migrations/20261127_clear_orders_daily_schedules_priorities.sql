-- ==============================================================================
-- Migration: 20261127_clear_orders_daily_schedules_priorities.sql
-- Limpa a faixa "OS's PRIORIDADE DE ATENDIMENTO" de TODOS os dias e contratos
-- (pedido do usuário em 10/11/2026).
--
--   • Apaga todas as linhas de orders_daily_schedules_priorities.
--   • NÃO mexe na distribuição por equipes (orders_daily_schedules_items), no
--     cabeçalho dos dias (orders_daily_schedules) nem no log das movimentações.
--   • Antes de apagar, guarda uma cópia em orders_daily_schedules_priorities_bkp_20261127
--     (para voltar, ver o fim do arquivo).
--
-- Efeito na tela: todas as OSs abertas voltam para "OS's ABERTAS". Dia com
-- cabeçalho já registrado fica com a prioridade vazia (não herda de outro dia).
--
-- Depende da 20261110. Aplicar manualmente no SQL Editor do Supabase.
-- Depois, clique em atualizar (⟳) na tela da Programação.
-- ==============================================================================

BEGIN;

-- Cópia de segurança: criada só na 1ª execução (rodar de novo NÃO apaga a cópia original).
CREATE TABLE IF NOT EXISTS public.orders_daily_schedules_priorities_bkp_20261127 AS
    SELECT * FROM public.orders_daily_schedules_priorities;

-- Cópia sem acesso pela API (só SQL Editor / service_role).
ALTER TABLE public.orders_daily_schedules_priorities_bkp_20261127 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders_daily_schedules_priorities_bkp_20261127 FROM anon, authenticated;

DELETE FROM public.orders_daily_schedules_priorities;

COMMIT;

-- Conferência: deve voltar 0 em "restantes" e o total antigo em "na_copia".
SELECT
    (SELECT count(*) FROM public.orders_daily_schedules_priorities)              AS restantes,
    (SELECT count(*) FROM public.orders_daily_schedules_priorities_bkp_20261127) AS na_copia;

-- ------------------------------------------------------------------------------
-- Para VOLTAR (desfazer), rode só o bloco abaixo:
--
-- INSERT INTO public.orders_daily_schedules_priorities (id, schedule_id, order_id, position)
-- SELECT id, schedule_id, order_id, position
--   FROM public.orders_daily_schedules_priorities_bkp_20261127
-- ON CONFLICT DO NOTHING;
--
-- Quando não precisar mais da cópia:
-- DROP TABLE public.orders_daily_schedules_priorities_bkp_20261127;
-- ------------------------------------------------------------------------------
