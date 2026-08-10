-- ============================================================
-- Function: nearby_units
-- Description: Get units within a specified radius using Haversine formula.
-- Usage: SELECT * FROM nearby_units(lat, lng, radius_meters, status_filter);
-- ============================================================

CREATE OR REPLACE FUNCTION nearby_units(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000,
    status_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id BIGINT,
    client_id BIGINT,
    description TEXT,
    code TEXT,
    installation_code_power_supply TEXT,
    address_full TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    unit_type_parent_id BIGINT,
    unit_type_id BIGINT,
    system_parent_id BIGINT,
    system_id BIGINT,
    status_id BIGINT,
    is_available BOOLEAN,
    description_full TEXT,
    img_file_path TEXT,
    img_file_name TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.client_id,
        u.description,
        u.code,
        u.installation_code_power_supply,
        u.address_full,
        u.latitude,
        u.longitude,
        u.unit_type_parent_id,
        u.unit_type_id,
        u.system_parent_id,
        u.system_id,
        u.status_id,
        u.is_available,
        u.description_full,
        u.img_file_path,
        u.img_file_name,
        -- Haversine formula
        (
            6371000 * ACOS(
                COS(RADIANS(user_lat)) * COS(RADIANS(u.latitude)) *
                COS(RADIANS(u.longitude) - RADIANS(user_lng)) +
                SIN(RADIANS(user_lat)) * SIN(RADIANS(u.latitude))
            )
        )::DOUBLE PRECISION AS distance_meters
    FROM units u
    WHERE u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND u.is_deleted = 'false'
      -- Pre-filter by distance using bounding box (fast)
      AND u.latitude BETWEEN user_lat - (radius_meters / 111320) AND user_lat + (radius_meters / 111320)
      AND u.longitude BETWEEN user_lng - (radius_meters / (111320 * COS(RADIANS(user_lat)))) AND user_lng + (radius_meters / (111320 * COS(RADIANS(user_lat))))
      -- Status filter
      AND (
          status_filter = 'all'
          OR (status_filter = 'active' AND u.is_available = true)
          OR (status_filter = 'inactive' AND u.is_available = false)
      )
    HAVING (
        6371000 * ACOS(
            COS(RADIANS(user_lat)) * COS(RADIANS(u.latitude)) *
            COS(RADIANS(u.longitude) - RADIANS(user_lng)) +
            SIN(RADIANS(user_lat)) * SIN(RADIANS(u.latitude))
        )
    ) <= radius_meters
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM nearby_units(-23.5505, -46.6333, 5000, 'active');
-- SELECT * FROM nearby_units(-23.5505, -46.6333, 10000, 'all');
