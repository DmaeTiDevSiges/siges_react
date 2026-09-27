-- =============================================================================
-- Migration: Realtime — tabelas assinificadas pelo app na publicação
-- Data: 2026-09-26
-- Aplicação: manual, no SQL Editor do Supabase (ver AGENTS.md)
-- =============================================================================
-- Contexto: os dashboards (ServicesRequestsDashboardAdmin e
-- OrdersRequestsDashboardAdmin), notificações e chat assinam
-- postgres_changes nessas tabelas. Se a tabela não está em
-- 'supabase_realtime', nenhum evento chega ao cliente.
-- O SETUP_NOVO_VPS.md só adicionava public.users_notifications.
--
-- Pré-requisito: o serviço Realtime precisa estar no ar.
--   Verifique: GET /realtime/v1/api/health?apikey=<anon>  (esperado 200)
--   Em 2026-09-26 esse endpoint respondia 502/503 ("name resolution failed")
--   e os canais falhavam com "transport failure" — isso é problema de
--   infraestrutura no VPS (container/gateway do realtime), não de SQL.
--
-- Idempotente: só adiciona tabelas que ainda não estão na publicação.
-- =============================================================================

-- Garante que a publicação existe (self-hosted novo pode não tê-la criado)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete');
        RAISE NOTICE 'Publicação supabase_realtime criada';
    END IF;
END $$;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'orders',
        'orders_visits',
        'users',
        'users_notifications',
        'orders_visits_chat',
        'orders_visits_chat_reads',
        'orders_visits_vehicles',
        'orders_visits_services',
        'cfg_units_assets_tags'
    ] LOOP
        IF EXISTS (
            SELECT 1
              FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public'
               AND c.relname = t
               AND c.relkind IN ('r', 'p')
        ) AND NOT EXISTS (
            SELECT 1
              FROM pg_publication_tables
             WHERE pubname = 'supabase_realtime'
               AND schemaname = 'public'
               AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
            RAISE NOTICE 'Realtime habilitado para public.%', t;
        END IF;
    END LOOP;
END $$;

-- Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verificação:
--   SELECT schemaname, tablename
--     FROM pg_publication_tables
--    WHERE pubname = 'supabase_realtime'
--    ORDER BY 1, 2;
--   -- deve listar as 9 tabelas acima
-- =============================================================================
