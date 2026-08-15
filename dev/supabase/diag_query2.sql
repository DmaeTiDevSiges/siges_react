-- Query 2: Verificar quais tipos de ativo têm atributos configurados
SELECT 
    t.id as type_id,
    t.code,
    t.description as type_name,
    COUNT(tta.id) as attribute_count
FROM cfg_assets_types t
LEFT JOIN cfg_assets_types_attributes tta ON t.id = tta.asset_type_id AND tta.is_available = true
GROUP BY t.id, t.code, t.description
HAVING COUNT(tta.id) > 0
ORDER BY t.code;
