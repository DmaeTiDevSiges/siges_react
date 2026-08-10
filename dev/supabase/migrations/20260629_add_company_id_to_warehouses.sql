-- Adicionar coluna company_id na tabela warehouses
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Índice para filtrar almoxarifados por empresa
CREATE INDEX IF NOT EXISTS idx_warehouses_company_id ON public.warehouses(company_id);

-- Atualizar almoxarifados existentes com company_id = 1 (empresa padrão)
UPDATE public.warehouses SET company_id = 1 WHERE company_id IS NULL;
