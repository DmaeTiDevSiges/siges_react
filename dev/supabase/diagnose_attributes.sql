-- =====================================================
-- DIAGNOSTIC: Check why technical attributes don't show
-- Run this in Supabase SQL Editor to verify data state
-- =====================================================

-- 1. Check if assets have type_id set
SELECT 'Assets with type_id:' as info;
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

-- 2. Check if any asset types have attributes configured
SELECT 'Asset types with configured attributes:' as info;
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

-- 3. Check attributes available
SELECT 'Available attributes in cfg_assets_attributes:' as info;
SELECT id, field_key, label, data_type 
FROM cfg_assets_attributes 
WHERE is_available = true
ORDER BY id;

-- 4. Check junction table data
SELECT 'Junction table (cfg_assets_types_attributes) data:' as info;
SELECT 
    tta.id,
    tta.asset_type_id,
    tta.attribute_id,
    tta.is_available,
    tta.is_required,
    a.field_key,
    a.label
FROM cfg_assets_types_attributes tta
JOIN cfg_assets_attributes a ON tta.attribute_id = a.id
WHERE tta.is_available = true
ORDER BY tta.asset_type_id, tta.order_index;

-- 5. Check for string vs boolean issue in is_available
SELECT 'Check is_available values (should be boolean):' as info;
SELECT 
    DISTINCT is_available, 
    pg_typeof(is_available) as type
FROM cfg_assets_types_attributes;

-- 6. Check assets_attributes_values table structure
SELECT 'assets_attributes_values columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets_attributes_values' 
ORDER BY ordinal_position;

-- 7. Check if there are attribute values stored
SELECT 'Stored attribute values:' as info;
SELECT 
    aav.asset_id,
    aav.value,
    aav.field_key,
    aav.attribute_id
FROM assets_attributes_values aav
LIMIT 20;

-- 8. Quick test: does the Supabase join work for attributes?
SELECT 'Test: attributes for asset_type_id=1 (MO):' as info;
SELECT 
    tta.asset_type_id,
    tta.is_available,
    tta.col_span,
    a.field_key,
    a.label,
    a.data_type
FROM cfg_assets_types_attributes tta
JOIN cfg_assets_attributes a ON tta.attribute_id = a.id
WHERE tta.asset_type_id = 1 AND tta.is_available = true
ORDER BY tta.order_index;
