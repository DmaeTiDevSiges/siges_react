-- View: v_materials
-- Visualização consolidada do catálogo de materiais com informações de estoque por almoxarifado

DROP VIEW IF EXISTS public.v_materials;

CREATE VIEW public.v_materials AS
SELECT
    m.id,
    m.code,
    m.description,
    m.unit,
    m.price_unit,
    m.searchable,
    m.version_mode,
    m.finger_print,
    m.company_id,
    m.provider_company_id,
    m.balance,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    -- Status do material (ativo/inativo)
    m.status_id,
    cms.description AS status_description,
    -- Agregações de estoque
    COALESCE(ws.total_quantity, 0) AS total_stock,
    COALESCE(ws.warehouse_count, 0) AS warehouse_count,
    ws.min_stock_warehouse_id,
    ws.min_stock_warehouse_description
FROM public.materials m
LEFT JOIN public.cfg_materials_statuses cms ON cms.id = m.status_id
LEFT JOIN LATERAL (
    SELECT
        SUM(wm.quantity) AS total_quantity,
        COUNT(DISTINCT wm.warehouse_id) AS warehouse_count,
        -- Identifica o almoxarifado com estoque abaixo do mínimo
        (ARRAY_AGG(
            CASE WHEN wm.quantity <= wm.min_stock THEN wm.warehouse_id END
            ORDER BY wm.quantity ASC
        ) FILTER (WHERE wm.quantity <= wm.min_stock))[1] AS min_stock_warehouse_id,
        (ARRAY_AGG(
            CASE WHEN wm.quantity <= wm.min_stock THEN w.description END
            ORDER BY wm.quantity ASC
        ) FILTER (WHERE wm.quantity <= wm.min_stock))[1] AS min_stock_warehouse_description
    FROM public.warehouses_materials wm
    JOIN public.warehouses w ON w.id = wm.warehouse_id AND w.is_deleted = false
    WHERE wm.material_id = m.id
) ws ON true
WHERE m.is_deleted = false;

-- Comentários na view
COMMENT ON VIEW public.v_materials IS 'Catálogo de materiais ativos com status e resumo de estoque por almoxarifado';

-- Permissões
GRANT SELECT ON public.v_materials TO authenticated;
