-- Query 8: Teste da query exata que a aplicação usa (com PostgREST join)
-- Simula: .select('..., cfg_assets_attributes(...)').eq('asset_type_id', 1).eq('is_available', true)
-- Se esta query retornar dados, a query da aplicação também deveria funcionar
SELECT 
    tta.asset_type_id,
    tta.is_required,
    tta.order_index,
    tta.is_available,
    tta.col_span,
    a.id as attr_id,
    a.field_key,
    a.label,
    a.data_type,
    a.unit,
    a.decimals
FROM cfg_assets_types_attributes tta
JOIN cfg_assets_attributes a ON tta.attribute_id = a.id
WHERE tta.asset_type_id = 1 AND tta.is_available = true
ORDER BY tta.order_index;
