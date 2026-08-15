-- Query 1: Verificar se os ativos têm type_id definido
SELECT 
    a.id,
    a.code,
    a.description,
    a.type_id,
    t.description as type_description
FROM assets a
LEFT JOIN cfg_assets_types t ON a.type_id = t.id
WHERE a.is_deleted = false
ORDER BY a.code
LIMIT 20;
