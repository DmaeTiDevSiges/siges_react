-- Migração para criação do módulo de Almoxarifado e Controle de Estoque

-- 1. Tabela de Almoxarifados (warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES public.cfg_departments(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    created_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NULL,
    updated_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índices para buscas na tabela warehouses
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON public.warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_department_id ON public.warehouses(department_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_deleted ON public.warehouses(is_deleted);

-- 2. Tabela de Estoque por Almoxarifado (warehouses_materials)
CREATE TABLE IF NOT EXISTS public.warehouses_materials (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    material_id BIGINT NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0,
    cost_avg NUMERIC(15, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP NULL,
    updated_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE (warehouse_id, material_id)
);

-- Índices para otimizar queries de estoque
CREATE INDEX IF NOT EXISTS idx_wm_warehouse_id ON public.warehouses_materials(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wm_material_id ON public.warehouses_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_wm_low_stock ON public.warehouses_materials(quantity, min_stock) WHERE quantity <= min_stock;

-- Ativar RLS (Row Level Security)
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses_materials ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão ( Permitir acesso autenticado para ler e escrever - Ajuste conforme necessidade do projeto)
CREATE POLICY "Allow all authenticated users full access to warehouses" ON public.warehouses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users full access to warehouses_materials" ON public.warehouses_materials FOR ALL TO authenticated USING (true);
