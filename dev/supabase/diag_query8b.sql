-- Query 8b: Teste da query exata para asset_type_id = 2
-- Se esta query retornar dados, o problema NÃO é na configuração
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
WHERE tta.asset_type_id = 2 AND tta.is_available = true
ORDER BY tta.order_index;
