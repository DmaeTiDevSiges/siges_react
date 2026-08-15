-- Query 3: Verificar atributos disponíveis na tabela cfg_assets_attributes
SELECT id, field_key, label, data_type, is_available 
FROM cfg_assets_attributes 
ORDER BY id;
