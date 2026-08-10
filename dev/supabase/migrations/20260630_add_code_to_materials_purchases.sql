-- ============================================
-- MIGRAÇÃO: Adicionar campo code em materials_purchases
-- Data: 2026-06-30
-- ============================================

-- 1. Adicionar coluna code na tabela materials_purchases
ALTER TABLE public.materials_purchases
ADD COLUMN IF NOT EXISTS code character varying(50) NULL;

-- 2. Criar índice para o campo code
CREATE INDEX IF NOT EXISTS idx_materials_purchases_code
ON public.materials_purchases USING btree (code) TABLESPACE pg_default;

-- 3. Atualizar a view para incluir o campo code
DROP VIEW IF EXISTS public.v_materials_purchases;

CREATE OR REPLACE VIEW public.v_materials_purchases AS
SELECT
    mp.id,
    mp.code AS purchase_code,
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
