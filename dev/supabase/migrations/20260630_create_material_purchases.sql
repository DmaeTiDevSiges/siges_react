-- ============================================
-- MIGRAÇÃO: Sistema de Compras de Materiais
-- Data: 2026-06-30
-- ============================================

-- 1. Tabela de tipos de compra
CREATE TABLE IF NOT EXISTS public.cfg_materials_purchases_types (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true,
    CONSTRAINT cfg_materials_purchases_types_pkey PRIMARY KEY (id),
    CONSTRAINT cfg_materials_purchases_types_code_key UNIQUE (code)
) TABLESPACE pg_default;

INSERT INTO public.cfg_materials_purchases_types (id, code, description, is_available) VALUES
    (1, 'standard',  'Compra Padrão', true),
    (2, 'emergency', 'Compra Emergencial', true),
    (3, 'service',   'Compra de Serviço', true),
    (4, 'rental',    'Aluguel de Equipamento', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Tabela de status de compras
CREATE TABLE IF NOT EXISTS public.cfg_materials_purchases_statuses (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL,
    CONSTRAINT cfg_materials_purchases_statuses_pkey PRIMARY KEY (id),
    CONSTRAINT cfg_materials_purchases_statuses_code_key UNIQUE (code)
) TABLESPACE pg_default;

INSERT INTO public.cfg_materials_purchases_statuses (id, code, description) VALUES
    (1, 'pending',    'A Autorizar'),
    (2, 'authorized', 'Autorizada'),
    (3, 'completed',  'Concluída'),
    (4, 'cancelled',  'Cancelada')
ON CONFLICT (code) DO NOTHING;

-- 3. Tabela principal de compras
CREATE TABLE IF NOT EXISTS public.materials_purchases (
    id bigint NOT NULL,
    material_id bigint NOT NULL,
    purchase_type_id bigint NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    total_price numeric(12, 2) NOT NULL,
    justification text NOT NULL,
    status_id bigint NOT NULL,
    requester_id bigint NOT NULL,
    authorizer_id bigint NULL,
    authorized_at timestamp without time zone NULL,
    cancel_reason text NULL,
    concluded_at timestamp without time zone NULL,
    created_at timestamp without time zone NULL DEFAULT now(),
    updated_at timestamp without time zone NULL,
    is_deleted boolean NULL DEFAULT false,
    warehouse_id bigint NULL,
    created_user_id bigint NULL,
    CONSTRAINT materials_purchases_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_materials_purchases_material ON public.materials_purchases USING btree (material_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_materials_purchases_type ON public.materials_purchases USING btree (purchase_type_id) TABLESPACE pg_default;

-- 5. View de compras
DROP VIEW IF EXISTS public.v_materials_purchases;

CREATE OR REPLACE VIEW public.v_materials_purchases AS
SELECT
    mp.id,
    mp.material_id,
    m.code AS material_code,
    m.description AS material_description,
    m.unit AS material_unit,
    m.price_unit AS material_unit_price,
    mp.purchase_type_id,
    cpt.code AS purchase_type_code,
    cpt.description AS purchase_type_description,
    mp.warehouse_id,
    w.code AS warehouse_code,
    w.description AS warehouse_description,
    mp.quantity,
    mp.unit_price,
    mp.total_price,
    mp.justification,
    mp.status_id,
    cps.code AS status_code,
    cps.description AS status_description,
    mp.requester_id,
    ru.name_full AS requester_name,
    mp.authorizer_id,
    au.name_full AS authorizer_name,
    mp.authorized_at,
    mp.cancel_reason,
    mp.concluded_at,
    mp.created_at,
    mp.updated_at
FROM public.materials_purchases mp
LEFT JOIN public.materials m ON m.id = mp.material_id
LEFT JOIN public.cfg_materials_purchases_types cpt ON cpt.id = mp.purchase_type_id
LEFT JOIN public.warehouses w ON w.id = mp.warehouse_id
LEFT JOIN public.cfg_materials_purchases_statuses cps ON cps.id = mp.status_id
LEFT JOIN public.users ru ON ru.id = mp.requester_id
LEFT JOIN public.users au ON au.id = mp.authorizer_id
WHERE mp.is_deleted = false;
