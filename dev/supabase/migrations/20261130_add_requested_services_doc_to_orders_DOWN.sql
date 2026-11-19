-- Reverte 20261130. ATENÇÃO: para dropar a coluna é preciso antes recriar v_orders e
-- v_orders_parent sem o campo (definições de 20261042 / 20261043) e a
-- fn_orders_dashboard_stats da 20261110. Por segurança só o índice é removido aqui.
DROP INDEX IF EXISTS public.idx_orders_requested_services_doc_trgm;
-- ALTER TABLE public.orders DROP COLUMN requested_services_doc;
