-- Query 5: Verificar tipo do campo is_available (boolean ou string)
SELECT 
    DISTINCT is_available, 
    pg_typeof(is_available) as type
FROM cfg_assets_types_attributes;
