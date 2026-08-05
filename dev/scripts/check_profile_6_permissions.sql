-- Verificar permissões do profile_id = 6 para assets
SELECT 
    p.id as profile_id,
    p.description as profile_name,
    r.route_key,
    r.description as route_description,
    pa.can_view,
    pa.can_create,
    pa.can_edit,
    pa.can_delete
FROM cfg_profiles p
LEFT JOIN cfg_profiles_access pa ON p.id = pa.profile_id
LEFT JOIN cfg_routes r ON pa.route_id = r.id
WHERE p.id = 6 AND (r.route_key = 'assets' OR r.route_key IS NULL)
ORDER BY r.route_key;
