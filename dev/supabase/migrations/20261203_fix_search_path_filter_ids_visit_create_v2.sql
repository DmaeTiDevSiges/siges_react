-- ==============================================================================
-- Migration: 20261203_fix_search_path_filter_ids_visit_create_v2.sql
-- Linter do Supabase: 0011 function_search_path_mutable (2 avisos).
--
-- • flow_order_visit_create_v2(jsonb): SECURITY DEFINER sem search_path fixo — quem
--   chama poderia apontar o search_path para objetos próprios e a função os usaria
--   com os privilégios do dono. Fica igual à v3: public, pg_temp.
-- • fn_orders_dashboard_filter_ids(jsonb, text): função SQL auxiliar dos dashboards.
--
-- Só ALTER FUNCTION ... SET search_path: o corpo, os GRANTs e quem depende delas
-- não mudam. Nenhuma das duas usa funções de extensão (esquema extensions).
-- Idempotente. Reverter: ALTER FUNCTION ... RESET search_path; (mesmas assinaturas).
-- ==============================================================================

ALTER FUNCTION public.flow_order_visit_create_v2(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_orders_dashboard_filter_ids(jsonb, text) SET search_path = public, pg_temp;

-- Conferência (as 2 linhas devem mostrar search_path=public, pg_temp):
--   SELECT p.proname, p.proconfig
--     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND p.proname IN ('flow_order_visit_create_v2', 'fn_orders_dashboard_filter_ids');
