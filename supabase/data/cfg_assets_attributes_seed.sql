-- =============================================================================
-- SEED DATA: Asset Attributes (Many-to-Many Refactored)
-- =============================================================================

-- 1. BASE ATTRIBUTES DEFINITION
-- Define the attributes once in cfg_assets_attributes
INSERT INTO public.cfg_assets_attributes (field_key, label, data_type, unit, decimals)
VALUES 
    ('power_kw', 'Potência', 'number', 'kW', 2),
    ('power_kva', 'Potência', 'number', 'kVA', 2),
    ('voltage', 'Tensão', 'text', 'V', 0),
    ('voltage_primary', 'Tensão Primária', 'text', 'V', 0),
    ('voltage_secondary', 'Tensão Secundária', 'text', 'V', 0),
    ('amperage', 'Corrente', 'text', 'A', 0),
    ('poles', 'Polos', 'number', null, 0),
    ('rotation', 'Rotação', 'number', 'RPM', 0),
    ('service_factor', 'Fator de Serviço', 'number', null, 2),
    ('rotor_diameter', 'Diâmetro Rotor', 'number', 'mm', 1),
    ('flow_rate_max', 'Vazão Máx', 'number', 'm³/h', 2),
    ('pressure_max', 'Pressão Máx', 'number', 'mca', 2),
    ('flow_rate_operation', 'Vazão Operação', 'number', 'm³/h', 2),
    ('pressure_operation', 'Pressão Operação', 'number', 'mca', 2)
ON CONFLICT (field_key) DO UPDATE SET
    label = EXCLUDED.label,
    data_type = EXCLUDED.data_type,
    unit = EXCLUDED.unit,
    decimals = EXCLUDED.decimals;

-- 2. LINK ATTRIBUTES TO ASSET TYPES (Junction Table)
-- Define which attribute goes to which type with specific logic (required, order)

-- MOTOR ELÉTRICO (MO)
INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, true, 1, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'power_kw'
ON CONFLICT (asset_type_id, attribute_id) DO UPDATE SET col_span = EXCLUDED.col_span;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, true, 2, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'voltage'
ON CONFLICT (asset_type_id, attribute_id) DO UPDATE SET col_span = EXCLUDED.col_span;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 3, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'amperage'
ON CONFLICT (asset_type_id, attribute_id) DO UPDATE SET col_span = EXCLUDED.col_span;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 4, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'poles'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 5, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'rotation'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 6, 12 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'MO' AND a.field_key = 'service_factor'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

-- BOMBA CENTRÍFUGA (BC)
INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 1, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'BC' AND a.field_key = 'rotor_diameter'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 2, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'BC' AND a.field_key = 'flow_rate_max'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index, col_span)
SELECT t.id, a.id, false, 3, 6 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'BC' AND a.field_key = 'pressure_max'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

-- TRANSFORMADOR (TRAFO)
INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index)
SELECT t.id, a.id, true, 1 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'TRAFO' AND a.field_key = 'power_kva'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index)
SELECT t.id, a.id, true, 2 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'TRAFO' AND a.field_key = 'voltage_primary'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

INSERT INTO public.cfg_assets_types_attributes (asset_type_id, attribute_id, is_required, order_index)
SELECT t.id, a.id, false, 3 FROM cfg_assets_types t, cfg_assets_attributes a WHERE t.code = 'TRAFO' AND a.field_key = 'voltage_secondary'
ON CONFLICT (asset_type_id, attribute_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
