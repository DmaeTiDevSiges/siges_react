-- Renomeia o valor 'submitted' para 'waiting' no CHECK constraint de ov_costs_status
-- e atualiza todos os registros existentes

-- 1. Atualiza registros existentes
UPDATE public.orders_visits
SET ov_costs_status = 'waiting'
WHERE ov_costs_status = 'submitted';

-- 2. Remove o CHECK constraint antigo
ALTER TABLE public.orders_visits
DROP CONSTRAINT IF EXISTS orders_visits_ov_costs_status_check;

-- 3. Adiciona novo CHECK constraint com 'waiting' em vez de 'submitted'
ALTER TABLE public.orders_visits
ADD CONSTRAINT orders_visits_ov_costs_status_check
CHECK (ov_costs_status IS NULL OR ov_costs_status IN ('pending', 'waiting', 'approved', 'rejected'));
