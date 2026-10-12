-- Recria a relação OS/visita/plano usando os planos registrados nos ativos
-- de visitas aprovadas. A transação preserva os dados anteriores se o insert falhar.
BEGIN;

ALTER TABLE public.orders_visits_maintenances_plans
    ALTER COLUMN created_at SET DEFAULT timezone('America/Sao_Paulo', now());

TRUNCATE TABLE public.orders_visits_maintenances_plans RESTART IDENTITY;

INSERT INTO public.orders_visits_maintenances_plans (
    o_id,
    ov_id,
    maintenance_plan_id,
    created_at
)
SELECT DISTINCT
    ov.o_id,
    ov.id,
    ova.maintenance_plan_id,
    timezone('America/Sao_Paulo', now())
FROM public.orders_visits AS ov
JOIN public.orders_visits_assets AS ova
    ON ova.ov_id = ov.id
JOIN public.maintenances_plans AS mp
    ON mp.id = ova.maintenance_plan_id
WHERE ov.ov_processing_id = 5
  AND COALESCE(ov.is_deleted, false) = false
  AND COALESCE(ova.is_deleted, false) = false
  AND ova.processing_id IN (2, 3, 5)
  AND ova.maintenance_plan_id > 0
  AND ov.o_id IS NOT NULL
ON CONFLICT (ov_id, maintenance_plan_id) DO NOTHING
RETURNING o_id, ov_id, maintenance_plan_id;

COMMIT;
