-- ==============================================================================
-- Migration: 20261116_add_offline_client_uuid.sql
-- Modo offline (F0) — identificador gerado no aparelho para as linhas que o
-- técnico cria sem internet.
--
-- Por quê: os IDs dessas tabelas são BIGINT sequenciais, gerados no servidor.
-- Uma linha criada offline (material, serviço, veículo, atividade, ativo na
-- visita) ainda não tem ID; o app gera um UUID, grava em client_uuid e o envia
-- junto. Se a mesma operação for reenviada (queda no meio da sincronização),
-- o índice UNIQUE impede a linha duplicada e o RPC de sincronização (F2/F4)
-- devolve a linha já existente.
--
-- NULL = linha criada online pelo fluxo atual (UNIQUE aceita vários NULL).
--
-- Somente aditiva — nenhum fluxo atual muda. Idempotente.
-- Reverter: 20261116_add_offline_client_uuid_DOWN.sql
-- ==============================================================================

BEGIN;

ALTER TABLE public.orders_visits_assets            ADD COLUMN IF NOT EXISTS client_uuid UUID;
ALTER TABLE public.orders_visits_assets_activities ADD COLUMN IF NOT EXISTS client_uuid UUID;
ALTER TABLE public.orders_visits_assets_materials  ADD COLUMN IF NOT EXISTS client_uuid UUID;
ALTER TABLE public.orders_visits_services          ADD COLUMN IF NOT EXISTS client_uuid UUID;
ALTER TABLE public.orders_visits_vehicles          ADD COLUMN IF NOT EXISTS client_uuid UUID;

CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_visits_assets_client_uuid
    ON public.orders_visits_assets (client_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_visits_assets_activities_client_uuid
    ON public.orders_visits_assets_activities (client_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_visits_assets_materials_client_uuid
    ON public.orders_visits_assets_materials (client_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_visits_services_client_uuid
    ON public.orders_visits_services (client_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_visits_vehicles_client_uuid
    ON public.orders_visits_vehicles (client_uuid);

COMMENT ON COLUMN public.orders_visits_assets.client_uuid IS
    'UUID gerado no aparelho quando a linha nasce offline (idempotência da sincronização). NULL = criada online.';
COMMENT ON COLUMN public.orders_visits_assets_activities.client_uuid IS
    'UUID gerado no aparelho quando a linha nasce offline (idempotência da sincronização). NULL = criada online.';
COMMENT ON COLUMN public.orders_visits_assets_materials.client_uuid IS
    'UUID gerado no aparelho quando a linha nasce offline (idempotência da sincronização). NULL = criada online.';
COMMENT ON COLUMN public.orders_visits_services.client_uuid IS
    'UUID gerado no aparelho quando a linha nasce offline (idempotência da sincronização). NULL = criada online.';
COMMENT ON COLUMN public.orders_visits_vehicles.client_uuid IS
    'UUID gerado no aparelho quando a linha nasce offline (idempotência da sincronização). NULL = criada online.';

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (deve listar 5 linhas):
--   SELECT table_name FROM information_schema.columns
--    WHERE table_schema = 'public' AND column_name = 'client_uuid'
--      AND table_name LIKE 'orders_visits%';
