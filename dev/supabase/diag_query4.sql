-- Query 4: Verificar dados da tabela de junção (tipos x atributos)
SELECT 
    tta.id,
    tta.asset_type_id,
    tta.attribute_id,
    tta.is_available,
    tta.is_required,
    tta.order_index,
    tta.col_span,
    a.field_key,
    a.label
FROM cfg_assets_types_attributes tta
JOIN cfg_assets_attributes a ON tta.attribute_id = a.id
ORDER BY tta.asset_type_id, tta.order_index;
