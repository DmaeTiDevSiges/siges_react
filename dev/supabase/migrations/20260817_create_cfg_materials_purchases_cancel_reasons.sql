-- ============================================
-- MIGRAÇÃO: Motivos de Cancelamento de Compras
-- Data: 2026-08-17
-- ============================================

-- 1. Tabela de motivos de cancelamento
CREATE TABLE IF NOT EXISTS public.cfg_materials_purchases_cancel_reasons (
    id bigint NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true,
    CONSTRAINT cfg_materials_purchases_cancel_reasons_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 2. Dados iniciais
INSERT INTO public.cfg_materials_purchases_cancel_reasons (id, description, is_available) VALUES
    (1, 'Material já disponível em estoque', true),
    (2, 'Orçamento indisponível', true),
    (3, 'Fornecedor indisponível', true),
    (4, 'Duplicidade de solicitação', true),
    (5, 'Solicitação cancelada pelo solicitante', true),
    (6, 'Outro motivo', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS
ALTER TABLE public.cfg_materials_purchases_cancel_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated read" ON public.cfg_materials_purchases_cancel_reasons
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Permissões
GRANT SELECT ON public.cfg_materials_purchases_cancel_reasons TO authenticated;

-- 5. Renomear colunas de FK de usuário
ALTER TABLE public.materials_purchases RENAME COLUMN requester_id TO requester_user_id;
ALTER TABLE public.materials_purchases RENAME COLUMN authorizer_id TO authorizer_user_id;

-- 6. Adicionar coluna FK na tabela de compras
ALTER TABLE public.materials_purchases
    ADD COLUMN IF NOT EXISTS cancel_reason_id bigint NULL;

ALTER TABLE public.materials_purchases
    ADD CONSTRAINT fk_materials_purchases_cancel_reason
    FOREIGN KEY (cancel_reason_id)
    REFERENCES public.cfg_materials_purchases_cancel_reasons(id)
    ON DELETE SET NULL;

-- 7. Atualizar view para incluir motivo estruturado
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
    m.type_id AS material_type_id,
    cmt.description AS material_type_description,
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
    mp.requester_user_id,
    ru.name_full AS requester_name,
    mp.authorizer_user_id,
    au.name_full AS authorizer_name,
    mp.authorized_at,
    mp.cancel_reason_id,
    cpcr.description AS cancel_reason_description,
    mp.cancel_reason,
    mp.concluded_at,
    mp.created_at,
    mp.updated_at
FROM public.materials_purchases mp
LEFT JOIN public.materials m ON m.id = mp.material_id
LEFT JOIN public.cfg_materials_types cmt ON cmt.id = m.type_id
LEFT JOIN public.cfg_materials_purchases_types cpt ON cpt.id = mp.purchase_type_id
LEFT JOIN public.warehouses w ON w.id = mp.warehouse_id
LEFT JOIN public.cfg_materials_purchases_statuses cps ON cps.id = mp.status_id
LEFT JOIN public.users ru ON ru.id = mp.requester_user_id
LEFT JOIN public.users au ON au.id = mp.authorizer_user_id
LEFT JOIN public.cfg_materials_purchases_cancel_reasons cpcr ON cpcr.id = mp.cancel_reason_id
WHERE mp.is_deleted = false;

-- Permissões da view
GRANT SELECT ON public.v_materials_purchases TO authenticated;
