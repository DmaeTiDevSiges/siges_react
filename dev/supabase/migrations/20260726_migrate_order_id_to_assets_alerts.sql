-- Migration: Migrar vínculo OS-Alertas de orders_alerts para assets_alerts
-- Data: 2026-07-26

-- 1. Adicionar coluna o_id na tabela assets_alerts
ALTER TABLE public.assets_alerts
ADD COLUMN IF NOT EXISTS o_id bigint;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_assets_alerts_o_id ON public.assets_alerts(o_id);

-- 3. Adicionar constraint FK para orders (ON DELETE SET NULL para não deletar alertas se a OS for removida)
ALTER TABLE public.assets_alerts
ADD CONSTRAINT fk_assets_alerts_order
    FOREIGN KEY (o_id)
    REFERENCES public.orders(id)
    ON DELETE SET NULL;

-- 3.1 Remover FKs duplicadas que já existiam
ALTER TABLE public.assets_alerts DROP CONSTRAINT IF EXISTS fk_assets_alerts_order_type;
ALTER TABLE public.assets_alerts DROP CONSTRAINT IF EXISTS fk_assets_alerts_priority;

-- 4. Migrar dados existentes de orders_alerts para assets_alerts.o_id
UPDATE public.assets_alerts aa
SET o_id = oa.order_id
FROM public.orders_alerts oa
WHERE aa.id = oa.alert_id;

-- 5. Dropar tabela orders_alerts (dados já migrados)
DROP TABLE IF EXISTS public.orders_alerts;
