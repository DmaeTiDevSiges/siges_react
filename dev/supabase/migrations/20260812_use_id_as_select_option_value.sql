-- =====================================================
-- Migration: Use id as select option value (not group_name)
-- Date: 2026-08-12
-- Description: Converte valores existentes de group_name
--              para id em assets_attributes_values, tornando
--              o value imutável mesmo após renomear opções.
--              Regenera descrições dos ativos afetadas.
-- =====================================================

-- 1. Converter valores existentes de string (group_name) para id
--    Só converte onde o atributo é select com grupo vinculado
--    Extrai o número do group_name para bater com valores como "4", "6", "8"
UPDATE assets_attributes_values v
SET value = CAST(sub.new_id AS TEXT)
FROM (
    SELECT v2.asset_id, v2.field_key, g.id AS new_id
    FROM assets_attributes_values v2
    JOIN cfg_assets_attributes aa ON aa.field_key = v2.field_key
    JOIN cfg_assets_attributes_groups g
        ON g.parent_id = aa.select_options_group_id
        AND (
            g.group_name = v2.value                              -- match exato
            OR regexp_replace(g.group_name, '[^0-9]', '', 'g') = v2.value  -- "04P" = "4"
        )
    WHERE aa.data_type = 'select'
      AND aa.select_options_group_id IS NOT NULL
      AND g.parent_id IS NOT NULL
) sub
WHERE v.asset_id = sub.asset_id
  AND v.field_key = sub.field_key;

-- 2. Função para regenerar a descrição de um ativo
CREATE OR REPLACE FUNCTION fc_regenerate_asset_description(p_asset_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    v_pattern TEXT;
    v_result TEXT;
    v_type_desc VARCHAR;
    v_brand VARCHAR;
    v_model VARCHAR;
    v_code VARCHAR;
    v_serial VARCHAR;
    v_attr RECORD;
    v_val TEXT;
    v_label TEXT;
BEGIN
    -- Buscar padrão de nomenclatura e dados do tipo
    SELECT
        t.naming_pattern,
        t.description,
        a.brand,
        a.model,
        a.code,
        a.serial
    INTO v_pattern, v_type_desc, v_brand, v_model, v_code, v_serial
    FROM assets a
    JOIN cfg_assets_types t ON t.id = a.type_id
    WHERE a.id = p_asset_id;

    IF v_pattern IS NULL OR v_pattern = '' THEN
        RETURN NULL;
    END IF;

    v_result := v_pattern;

    -- Substituir atributos dinâmicos PRIMEIRO (inclui brand/model que são select)
    -- assets_attributes_values tem: asset_id, field_key, value
    -- cfg_assets_attributes tem: id, field_key, data_type, select_options_group_id
    FOR v_attr IN
        SELECT
            aa.field_key,
            aav.value AS raw_value,
            aa.data_type,
            aa.select_options_group_id,
            aa.unit
        FROM assets_attributes_values aav
        JOIN cfg_assets_attributes aa ON aa.field_key = aav.field_key
        WHERE aav.asset_id = p_asset_id
          AND v_pattern LIKE '%{' || aa.field_key || '}%'
    LOOP
        v_val := v_attr.raw_value;

        IF v_val IS NOT NULL AND v_val != '' THEN
            IF v_attr.data_type = 'select' AND v_attr.select_options_group_id IS NOT NULL THEN
                SELECT g.group_name INTO v_label
                FROM cfg_assets_attributes_groups g
                WHERE g.id = CAST(v_val AS BIGINT);

                IF v_label IS NOT NULL THEN
                    v_val := v_label;
                END IF;
            ELSIF v_attr.data_type = 'boolean' THEN
                v_val := CASE WHEN v_val = 'true' THEN 'SIM' ELSE 'NÃO' END;
            END IF;

            -- Adicionar unidade se existir
            IF v_attr.unit IS NOT NULL AND v_attr.unit != '' THEN
                v_val := v_val || v_attr.unit;
            END IF;

            v_result := replace(v_result, '{' || v_attr.field_key || '}', v_val);
        END IF;
    END LOOP;

    -- Substituir campos padrão APENAS se o placeholder ainda existir
    -- (para ativos que não têm atributo dinâmico correspondente)
    IF v_result LIKE '%{type}%' THEN
        v_result := replace(v_result, '{type}', COALESCE(v_type_desc, ''));
    END IF;
    IF v_result LIKE '%{brand}%' THEN
        v_result := replace(v_result, '{brand}', COALESCE(v_brand, ''));
    END IF;
    IF v_result LIKE '%{model}%' THEN
        v_result := replace(v_result, '{model}', COALESCE(v_model, ''));
    END IF;
    IF v_result LIKE '%{code}%' THEN
        v_result := replace(v_result, '{code}', COALESCE(v_code, ''));
    END IF;
    IF v_result LIKE '%{serial}%' THEN
        v_result := replace(v_result, '{serial}', COALESCE(v_serial, ''));
    END IF;

    -- Limpar espaços duplos
    v_result := regexp_replace(v_result, '\s+', ' ', 'g');
    v_result := trim(v_result);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 3. Regenerar todas as descrições de ativos que possuem naming_pattern
DO $$
DECLARE
    v_asset RECORD;
    v_new_desc TEXT;
    v_updated INTEGER := 0;
BEGIN
    FOR v_asset IN
        SELECT a.id
        FROM assets a
        JOIN cfg_assets_types t ON t.id = a.type_id
        WHERE t.naming_pattern IS NOT NULL
          AND t.naming_pattern != ''
          AND a.is_deleted = false
    LOOP
        v_new_desc := fc_regenerate_asset_description(v_asset.id);

        IF v_new_desc IS NOT NULL AND v_new_desc != '' THEN
            UPDATE assets SET description = v_new_desc WHERE id = v_asset.id;
            v_updated := v_updated + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Descrições regeneradas: % ativos atualizados.', v_updated;
END $$;
