-- Migration: Improve v_assets view with materials join
-- This eliminates the need for manual joins in assetsService.ts

-- 1. Drop dependent functions first
DROP FUNCTION IF EXISTS public.fc_assets_searchable(text, text);
DROP FUNCTION IF EXISTS public.fc_assets_search_unit(text, integer, text);
DROP FUNCTION IF EXISTS public.fc_assets_search_type(text, integer);
DROP FUNCTION IF EXISTS public.fc_assets_search_filters(integer[], integer[], integer[], integer[], integer[], text, text, integer, integer);

-- 2. Drop existing view
DROP VIEW IF EXISTS public.v_assets;

-- 3. Recreate v_assets with materials join added at the end
CREATE OR REPLACE VIEW v_assets AS
select
  assets.company_id,
  cfg_companies.description as company_description,
  cfg_companies_owners.description as company_owner_description,
  assets.company_owner_id,
  assets.id,
  assets.code,
  assets.description,
  assets.searchable,
  assets.tag_id,
  cfg_assets_tags.description as tag_description,
  assets.tag_sub_id,
  cfg_assets_tags_subs.description as tag_sub_description,
  assets.unit_asset_tag_id,
  assets.location,
  assets.unit_id,
  units.code as unit_code,
  units.description_full as unit_description,
  assets.status_id,
  cfg_assets_statuses.description as status_description,
  cfg_assets_statuses.code as status_code,
  assets.status_at,
  assets.type_id,
  cfg_assets_types.description as type_description,
  assets.priority_id,
  cfg_assets_priorities.code as priority_code,
  cfg_assets_priorities.description as priority_description,
  assets.brand,
  assets.model,
  assets.serial,
  assets.power,
  assets.power_unit,
  assets.voltage,
  assets.voltage_unit,
  assets.amperage,
  assets.amperage_unit,
  assets.poles,
  assets.poles_unit,
  assets.rotation,
  assets.rotation_unit,
  assets.service_factor,
  assets.pressure_max,
  assets.pressure_min,
  assets.pressure_operation,
  assets.pressure_unit,
  assets.flow_rate_max,
  assets.flow_rate_min,
  assets.flow_rate_operation,
  assets.flow_rate_unit,
  assets.rotor_diameter,
  assets.rotor_diameter_unit,
  assets.weight,
  assets.weight_unit,
  assets.coupling_model_id,
  cfg_assets_couplings_models.description as coupling_model_description,
  assets.comments,
  assets.acquisition_at,
  assets.acquisition_value,
  assets.img_file_path,
  assets.img_file_name,
  assets.img_file_name_thumb,
  assets.version_mode,
  cfg_assets_statuses.color as status_color,
  assets.client_id,
  clients.name as client_name,
  assets.material_id,
  materials.code as material_code,
  materials.description as material_description,
  materials.unit as material_unit
from
  assets
  left join units on assets.unit_id = units.id
  left join clients on assets.client_id = clients.id
  left join cfg_companies on assets.company_id = cfg_companies.id
  left join cfg_companies as cfg_companies_owners on assets.company_owner_id = cfg_companies_owners.id
  left join cfg_assets_tags on assets.tag_id = cfg_assets_tags.id
  left join cfg_assets_tags_subs on assets.tag_sub_id = cfg_assets_tags_subs.id
  left join cfg_assets_statuses on assets.status_id = cfg_assets_statuses.id
  left join cfg_assets_types on assets.type_id = cfg_assets_types.id
  left join cfg_assets_priorities on assets.priority_id = cfg_assets_priorities.id
  left join cfg_assets_couplings_models on assets.coupling_model_id = cfg_assets_couplings_models.id
  left join materials on assets.material_id = materials.id
where
  assets.is_deleted = false;

-- 4. Recreate dependent functions (unchanged, they use SELECT * FROM v_assets)

CREATE FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM v_assets
    WHERE

    ((unit_id = ANY(units_ids) OR units_ids IS NULL OR array_length(units_ids, 1) = 0)
    OR (COALESCE(array_length(units_ids, 1), 0) = 0))
    AND

    ((status_id = ANY(statuses_ids) OR statuses_ids IS NULL OR array_length(statuses_ids, 1) = 0)
    OR (COALESCE(array_length(statuses_ids, 1), 0) = 0))
    AND
    
    ((tag_id = ANY(tags_ids) OR tags_ids IS NULL OR array_length(tags_ids, 1) = 0)
    OR (COALESCE(array_length(tags_ids, 1), 0) = 0))
    AND

    ((tag_sub_id = ANY(tags_subs_ids) OR tags_subs_ids IS NULL OR array_length(tags_subs_ids, 1) = 0)
    OR (COALESCE(array_length(tags_subs_ids, 1), 0) = 0))
    AND

    ((type_id = ANY(types_ids) OR types_ids IS NULL OR array_length(types_ids, 1) = 0)
    OR (COALESCE(array_length(types_ids, 1), 0) = 0))
    AND

    (version_mode = app_version_mode)
    AND

    to_tsvector('portuguese', searchable) @@ plainto_tsquery('portuguese', search_terms)

    ORDER BY
    description ASC

    LIMIT limit_value 
    OFFSET offset_value;
    
END;
$$;


CREATE FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_assets;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_assets
        WHERE type_id = asset_type_id and 
        to_tsvector('portuguese', searchable) @@ plainto_tsquery('portuguese', search_terms)
        ORDER BY description
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


CREATE FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_assets;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_assets
        WHERE unit_id = unit_id and searchable &@~ search_terms AND version_mode = app_version_mode
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


CREATE FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    AS $$
declare
    result_record public.v_assets;
    search_query text := '';
    term text;
begin    
    -- Monta a query de busca se houver termos
    if coalesce(search_terms, '') <> '' then
        for term in select unnest(string_to_array(search_terms, ' ')) 
        loop
            term := regexp_replace(term, '[^a-zA-Z0-9]', '', 'g');  -- limpa caracteres especiais
            search_query := search_query || term || ':* & ';
        end loop;
        search_query := rtrim(search_query, ' & ');
    end if;

    -- Busca por tsvector se houver query montada
    if coalesce(search_query, '') <> '' then
        RETURN QUERY
        SELECT *
        FROM v_assets
        WHERE to_tsvector('portuguese', searchable) @@ plainto_tsquery('portuguese', search_query)
        AND version_mode = app_version_mode
        ORDER BY description
        LIMIT 500;
    else
        -- Sem termos, retorna todos (limitado)
        RETURN QUERY
        SELECT *
        FROM v_assets
        WHERE version_mode = app_version_mode
        ORDER BY description
        LIMIT 500;
    end if;
end;
$$;
