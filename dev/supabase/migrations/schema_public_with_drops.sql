--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cfg_assets_couplings_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_couplings_models (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: cfg_assets_priorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_priorities (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    color character varying DEFAULT '#3b82f6'::character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_assets_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_statuses (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_assets_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_tags (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    company_id bigint
);


--
-- Name: cfg_assets_tags_subs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_tags_subs (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    company_id bigint
);


--
-- Name: cfg_assets_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_types (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    company_id bigint,
    parent_id bigint
);


--
-- Name: cfg_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_companies (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    img_file_path character varying,
    img_file_name character varying,
    is_available boolean DEFAULT true,
    email_sufix character varying,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    parent_id bigint
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id bigint NOT NULL,
    client_id bigint,
    code character varying,
    company_id bigint,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    status_id bigint,
    description character varying,
    description_full character varying,
    street_name character varying,
    street_number bigint,
    street_complement character varying,
    address_full character varying,
    latitude double precision,
    longitude double precision,
    version_mode character varying DEFAULT 'live'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_user_id bigint,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_available boolean DEFAULT true,
    provider_company_id bigint,
    code_sufix character varying,
    is_deleted boolean DEFAULT false,
    coordinates character varying,
    installation_code_power_supply character varying,
    img_file_path text,
    img_file_name text
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id bigint NOT NULL,
    company_id bigint,
    unit_id bigint,
    code character varying,
    description text,
    status_id bigint,
    tag_id bigint,
    tag_sub_id bigint,
    status_at timestamp without time zone,
    type_id bigint,
    searchable text,
    comments text,
    brand character varying,
    model character varying,
    serial character varying,
    power numeric,
    power_unit character varying,
    voltage character varying,
    amperage character varying,
    poles smallint,
    voltage_unit character varying,
    amperage_unit character varying,
    poles_unit character varying,
    rotation integer,
    rotation_unit character varying,
    service_factor numeric DEFAULT '1'::numeric,
    pressure_max numeric,
    pressure_min numeric,
    pressure_operation numeric,
    pressure_unit character varying,
    flow_rate_max numeric,
    flow_rate_min numeric,
    flow_rate_operation numeric,
    flow_rate_unit character varying,
    rotor_diameter numeric,
    rotor_diameter_unit character varying,
    priority_id smallint DEFAULT '3'::smallint,
    material_id bigint,
    material_code character varying,
    acquisition_at timestamp without time zone,
    location character varying,
    weight numeric,
    weight_unit character varying,
    created_user_id bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    coupling_model_id smallint,
    acquisition_value numeric DEFAULT '0'::numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    img_file_path character varying,
    img_file_name character varying,
    unit_asset_tag_id bigint,
    company_owner_id bigint DEFAULT '1'::bigint,
    img_file_name_thumb character varying,
    client_id bigint
);


--
-- Name: v_assets; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets AS
 SELECT assets.company_id,
    cfg_companies.description AS company_description,
    cfg_companies_owners.description AS company_owner_description,
    assets.company_owner_id,
    assets.id,
    assets.code,
    assets.description,
    assets.searchable,
    assets.tag_id,
    cfg_assets_tags.description AS tag_description,
    assets.tag_sub_id,
    cfg_assets_tags_subs.description AS tag_sub_description,
    assets.unit_asset_tag_id,
    assets.location,
    assets.unit_id,
    units.code AS unit_code,
    units.description_full AS unit_description,
    assets.status_id,
    cfg_assets_statuses.description AS status_description,
    cfg_assets_statuses.code AS status_code,
    assets.status_at,
    assets.type_id,
    cfg_assets_types.description AS type_description,
    assets.priority_id,
    cfg_assets_priorities.code AS priority_code,
    cfg_assets_priorities.description AS priority_description,
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
    cfg_assets_couplings_models.description AS coupling_model_description,
    assets.comments,
    assets.acquisition_at,
    assets.acquisition_value,
    assets.img_file_path,
    assets.img_file_name,
    assets.img_file_name_thumb,
    assets.version_mode,
    cfg_assets_statuses.color AS status_color,
    assets.client_id,
    clients.name AS client_name,
    assets.material_id,
    materials.code AS material_code,
    materials.description AS material_description,
    materials.unit AS material_unit
   FROM (((((((((((((public.assets
     LEFT JOIN public.units ON ((assets.unit_id = units.id)))
     LEFT JOIN public.clients ON ((assets.client_id = clients.id)))
     LEFT JOIN public.cfg_companies ON ((assets.company_id = cfg_companies.id)))
     LEFT JOIN public.cfg_companies cfg_companies_owners ON ((assets.company_owner_id = cfg_companies_owners.id)))
     LEFT JOIN public.cfg_assets_tags ON ((assets.tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((assets.tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses ON ((assets.status_id = cfg_assets_statuses.id)))
     LEFT JOIN public.cfg_assets_types ON ((assets.type_id = cfg_assets_types.id)))
     LEFT JOIN public.cfg_assets_priorities ON ((assets.priority_id = cfg_assets_priorities.id)))
     LEFT JOIN public.cfg_assets_couplings_models ON ((assets.coupling_model_id = cfg_assets_couplings_models.id)))
     LEFT JOIN public.materials ON ((assets.material_id = materials.id)))
   WHERE (assets.is_deleted = false);


--
-- Name: fc_assets_search_filters(integer[], integer[], integer[], integer[], integer[], text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_assets_search_filters;`n`nfc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) RETURNS SETOF public.v_assets
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


--
-- Name: fc_assets_search_type(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_assets_search_type;`n`nfc_assets_search_type(search_terms text, asset_type_id integer) RETURNS SETOF public.v_assets
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


--
-- Name: fc_assets_search_unit(text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_assets_search_unit;`n`nfc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) RETURNS SETOF public.v_assets
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


--
-- Name: fc_assets_searchable(text, text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_assets_searchable;`n`nfc_assets_searchable(search_terms text, app_version_mode text) RETURNS SETOF public.v_assets
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
        search_query := trim(trailing ' & ' from search_query);
    end if;

    for result_record in
        select *
        from public.v_assets
        where 
            (
                search_query = '' 
                or to_tsvector(
                    'simple',
                    lower(
                        regexp_replace(
                            searchable,
                            '[,/:;()\\-]',
                            ' ',
                            'g'
                        )
                    )
                ) @@ to_tsquery('simple', search_query)
            )
            and version_mode = app_version_mode
    loop
        return next result_record;
    end loop;

    return;
end;
$$;


--
-- Name: fc_assets_searchable_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_assets_searchable_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
    code TEXT;
    description TEXT;
    brand TEXT;
    model TEXT;
    serial TEXT;
BEGIN
    NEW.searchable = NEW.code || ' ' || NEW.description || ' ' || NEW.brand || ' ' || NEW.model || ' ' || NEW.serial;

    RETURN NEW;
END;
$$;


--
-- Name: fc_cfg_units_assets_tags_set_last_values_when_processing_2(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Executa apenas quando last_processing_id = 2
  IF NEW.last_processing_id = 2 THEN

    IF NEW.last_is_available = TRUE THEN
      
      -- Mant├®m a l├│gica original
      NEW.last_flow_rate := NEW.flow_rate_max;
      NEW.last_power     := NEW.power_max;
      NEW.last_pressure  := NEW.pressure_max;
      NEW.last_voltage   := NEW.voltage_max;
      NEW.last_amperage  := NEW.amperage_max;

    ELSE
      -- Quando last_is_available = FALSE, zera todos os valores
      NEW.last_flow_rate := 0;
      NEW.last_power     := 0;
      NEW.last_pressure  := 0;
      NEW.last_voltage   := 0;
      NEW.last_amperage  := 0;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: fc_check_user_permission(bigint, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_check_user_permission;`n`nfc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_has_permission boolean := false;
BEGIN
    -- Check if user is super admin (bypass permission check)
    SELECT is_admin_super INTO v_has_permission
    FROM public.users
    WHERE id = p_user_id;
    
    IF v_has_permission = true THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    SELECT 
        CASE p_action
            WHEN 'view' THEN pa.can_view
            WHEN 'create' THEN pa.can_create
            WHEN 'edit' THEN pa.can_edit
            WHEN 'delete' THEN pa.can_delete
            ELSE false
        END INTO v_has_permission
    FROM public.users u
    INNER JOIN public.cfg_profiles p ON u.profile_id = p.id
    INNER JOIN public.cfg_profiles_access pa ON p.id = pa.profile_id
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE u.id = p_user_id
      AND r.route_key = p_route_key
      AND r.is_available = true
    LIMIT 1;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$;


--
-- Name: cfg_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_services (
    id bigint NOT NULL,
    description text,
    unit character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    code character varying,
    finger_print character varying,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    company_id bigint,
    created_at timestamp without time zone,
    created_user_id bigint
);


--
-- Name: contracts_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts_services (
    id bigint NOT NULL,
    contract_id bigint,
    service_id bigint,
    value_unit numeric,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    discount numeric,
    amount numeric,
    value_total numeric,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: v_contracts_services; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_contracts_services AS
 SELECT contracts_services.id,
    contracts_services.contract_id,
    contracts_services.service_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    contracts_services.value_unit,
    contracts_services.discount,
    contracts_services.version_mode
   FROM (public.contracts_services
     JOIN public.cfg_services ON ((contracts_services.service_id = cfg_services.id)))
  WHERE (contracts_services.is_deleted = false)
  ORDER BY cfg_services.description;


--
-- Name: fc_contracts_services_search(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_contracts_services_search;`n`nfc_contracts_services_search(search_terms text, contract_id_value integer) RETURNS SETOF public.v_contracts_services
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_contracts_services;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_contracts_services
        WHERE contract_id = contract_id_value AND
        to_tsvector('portuguese', v_contracts_services.description) @@ plainto_tsquery('portuguese', search_terms)
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


--
-- Name: cfg_orders_cancel_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_cancel_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_causes_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_causes_reasons (
    id smallint NOT NULL,
    description character varying,
    is_availabe boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_objects (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_plans (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    color character varying DEFAULT '#3b82f6'::character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    department_id bigint,
    version character varying DEFAULT 'live'::character varying
);


--
-- Name: cfg_orders_priorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_priorities (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    color character varying DEFAULT '#3b82f6'::character varying NOT NULL,
    is_avavailable boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_statuses (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    code text,
    description text,
    is_available boolean DEFAULT true
);


--
-- Name: cfg_orders_suspended_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_suspended_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_types (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    department_id bigint
);


--
-- Name: cfg_orders_types_subs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_types_subs (
    id bigint NOT NULL,
    order_type_id bigint,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    department_id bigint
);


--
-- Name: cfg_systems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_systems (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    company_id bigint DEFAULT '1'::bigint
);


--
-- Name: cfg_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_teams (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying NOT NULL,
    description character varying NOT NULL,
    department_id bigint NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    img_url character varying,
    users_total bigint DEFAULT '0'::bigint NOT NULL,
    company_id bigint NOT NULL,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);


--
-- Name: cfg_units_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_units_types (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id bigint NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    email character varying,
    mobile character varying,
    address character varying,
    img_file_path character varying,
    img_file_name character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id bigint NOT NULL,
    client_company_id bigint,
    client_department_id bigint,
    provider_company_id bigint,
    provider_department_id bigint,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    code character varying,
    status_id bigint DEFAULT 1,
    created_user_id bigint,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_date timestamp without time zone,
    deleted_user_id bigint,
    deleted_date timestamp without time zone,
    is_dev boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    default_ov_asset_id bigint,
    default_activity_id bigint,
    date_start timestamp without time zone,
    date_end timestamp without time zone,
    total_value double precision,
    client_id bigint
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    plan_id bigint,
    object_id smallint,
    company_id bigint DEFAULT '1'::bigint,
    department_id bigint,
    parent_id bigint,
    type_id bigint,
    type_sub_id bigint,
    team_leader_id bigint,
    status_id bigint,
    status_at timestamp without time zone,
    unit_id bigint,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    requester_name character varying,
    requester_team_id bigint,
    requester_phone character varying,
    requested_at timestamp without time zone,
    requested_services text,
    counter_parent bigint,
    counter_child integer DEFAULT 0,
    year integer,
    order_mask character varying,
    priority_id bigint,
    team_id bigint,
    unit_latitude double precision,
    unit_longitude double precision,
    contract_id bigint,
    provider_company_id bigint,
    asset_tag_id bigint,
    materials_value numeric DEFAULT '0'::numeric,
    services_value numeric DEFAULT '0'::numeric,
    vehicles_value numeric DEFAULT '0'::numeric,
    total_value numeric DEFAULT '0'::numeric,
    cause_reason_id smallint,
    suspended_reason_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    uid character varying,
    notifications_amount bigint DEFAULT '0'::bigint,
    provider_department_id bigint,
    img_file_path character varying,
    img_file_name character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    ov_counter smallint DEFAULT '0'::smallint,
    progress numeric DEFAULT '0'::numeric,
    x_ss_id character varying,
    x_ss_mae_id character varying,
    canceled_user_id bigint,
    canceled_at timestamp without time zone,
    cancel_reason_id bigint,
    canceled_team_id bigint,
    img_files_names jsonb,
    unit_asset_tag_id bigint,
    asset_tag_sub_id bigint,
    unit_asset_tag_has_order boolean DEFAULT true,
    unit_asset_tag_no_has_order_user_id bigint,
    unit_asset_tag_no_has_order_at timestamp without time zone,
    client_id bigint,
    asset_available_id bigint
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    name_full character varying,
    name_short character varying,
    mobile character varying,
    phone character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    team_id bigint,
    is_team_leader boolean DEFAULT false,
    img_file_path character varying DEFAULT 'settings/images'::character varying,
    company_id bigint,
    department_id bigint,
    token_fcm character varying,
    uuid uuid DEFAULT auth.uid() NOT NULL,
    status_id smallint,
    is_admin boolean DEFAULT false,
    is_admin_super boolean DEFAULT false,
    code character varying,
    version_app character varying,
    img_file_name character varying DEFAULT 'noImageUser.png'::character varying,
    team_id_previous bigint,
    ov_in_progress_leader_id bigint,
    profile_id bigint,
    vehicle_id bigint,
    is_available boolean DEFAULT true,
    is_ov_in_progress boolean DEFAULT false,
    team_amount smallint DEFAULT '1'::smallint,
    version_offline_user character varying,
    version_offline_app character varying,
    o_contract_id_in_progress bigint,
    o_type_id_in_progress bigint,
    o_type_sub_id_in_progress bigint,
    o_plan_id_in_progress bigint,
    o_asset_tag_id_in_progress bigint,
    o_unit_id_in_progress bigint,
    o_system_id_in_progress bigint,
    o_system_parent_id_in_progress bigint,
    o_unit_type_id_in_progress bigint,
    o_unit_type_parent_id_in_progress bigint,
    o_object_id_in_progress bigint,
    ov_id_in_progress bigint,
    o_id_in_progress bigint,
    op_id_in_progress bigint,
    notifications_amount integer DEFAULT 0,
    mobile_full text,
    mobile_mask text,
    mobile_whatsapp text,
    migrated_at timestamp without time zone,
    latitude double precision,
    longitude double precision,
    tracked_at timestamp without time zone,
    ov_id_in_progress_mask character varying,
    tracker_interval_seconds bigint DEFAULT 300,
    shift_start time without time zone DEFAULT '08:00:00'::time without time zone,
    shift_end time without time zone DEFAULT '18:00:00'::time without time zone,
    last_online timestamp with time zone,
    tracker_heartbeat_at timestamp without time zone,
    tracker_accuracy double precision
);


--
-- Name: v_orders; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders AS
 SELECT orders.id,
    orders.uid,
    orders.parent_id,
    orders.company_id,
    cfg_companies.description AS company_description,
    cfg_companies.img_file_path AS company_img_file_path,
    cfg_companies.img_file_name AS company_img_file_name,
    orders.img_file_path,
    orders.img_file_name,
    orders.department_id,
    orders.contract_id,
    contracts.description AS contract_description,
    orders.provider_company_id,
    cfg_companies_provider.description AS provider_company_description,
    cfg_companies_provider.img_file_path AS provider_company_img_file_path,
    cfg_companies_provider.img_file_name AS provider_company_img_file_name,
    orders.provider_department_id,
    orders.order_mask,
    orders.type_id,
    cfg_orders_types.code AS type_code,
    cfg_orders_types.description AS type_description,
    orders.type_sub_id,
    cfg_orders_types_subs.code AS type_sub_code,
    cfg_orders_types_subs.description AS type_sub_description,
    orders.requested_services,
    orders.object_id,
    cfg_orders_objects.code AS object_code,
    cfg_orders_objects.description AS object_description,
    orders.system_parent_id,
    systems_parent.description AS system_parent_description,
    systems_parent.code AS system_parent_code,
    orders.system_id,
    cfg_systems.description AS system_description,
    cfg_systems.code AS system_code,
    orders.unit_type_parent_id,
    units_types_parent.description AS unit_type_parent_description,
    units_types_parent.code AS unit_type_parent_code,
    orders.unit_type_id,
    cfg_units_types.description AS unit_type_description,
    cfg_units_types.code AS unit_type_code,
    orders.unit_id,
    units.description_full AS unit_description,
    units.address_full AS unit_address,
    units.latitude AS unit_latitude,
    units.longitude AS unit_longitude,
    orders.requester_name,
    orders.requester_phone,
    orders.requester_team_id,
    requester_teams.code AS requester_team_code,
    orders.requested_at,
    orders.status_id,
    cfg_orders_statuses.code AS status_code,
    cfg_orders_statuses.description AS status_description,
    orders.status_at,
    orders.priority_id,
    cfg_orders_priorities.code AS priority_code,
    cfg_orders_priorities.description AS priority_description,
    orders.team_leader_id,
    users.name_short AS team_leader_name_short,
    users.email AS team_leader_email,
    orders.team_id,
    orders_teams.code AS team_code,
    orders_teams.description AS team_description,
    orders.asset_tag_id,
    cfg_assets_tags.description AS asset_tag_description,
    orders.year,
    orders.counter_parent,
    orders.counter_child,
    orders.cause_reason_id,
    cfg_orders_causes_reasons.description AS cause_reason_description,
    orders.suspended_reason_id,
    cfg_orders_suspended_reasons.description AS suspended_reason_description,
    orders.cancel_reason_id,
    cfg_orders_cancel_reasons.description AS cancel_reason_description,
    orders.canceled_team_id,
    canceled_teams.code AS canceled_team_code,
    canceled_users.name_short AS canceled_user_name_short,
    orders.plan_id,
    cfg_orders_plans.description AS plan_description,
    cfg_orders_plans.code AS plan_code,
    orders.services_value,
    orders.materials_value,
    orders.vehicles_value,
    orders.total_value,
    orders.version_mode,
    orders.created_user_id,
    orders.ov_counter,
    orders.progress,
    contracts.code AS contract_code,
    units.code AS unit_code,
    orders.img_files_names,
    clients.name AS client_name,
    clients.id AS client_id,
    orders.unit_asset_tag_id,
    orders.asset_tag_sub_id,
    orders.unit_asset_tag_has_order,
    orders.unit_asset_tag_no_has_order_user_id,
    orders.unit_asset_tag_no_has_order_at,
    cfg_assets_tags_subs.description AS asset_tag_sub_description
   FROM ((((((((((((((((((((((((((public.orders
     JOIN public.cfg_orders_types ON ((orders.type_id = cfg_orders_types.id)))
     LEFT JOIN public.cfg_orders_types_subs ON ((orders.type_sub_id = cfg_orders_types_subs.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
     LEFT JOIN public.cfg_companies ON ((orders.company_id = cfg_companies.id)))
     LEFT JOIN public.cfg_companies cfg_companies_provider ON ((orders.provider_company_id = cfg_companies_provider.id)))
     LEFT JOIN public.cfg_orders_plans ON ((orders.plan_id = cfg_orders_plans.id)))
     LEFT JOIN public.cfg_teams requester_teams ON ((orders.requester_team_id = requester_teams.id)))
     LEFT JOIN public.cfg_teams orders_teams ON ((orders.team_id = orders_teams.id)))
     LEFT JOIN public.cfg_teams canceled_teams ON ((orders.canceled_team_id = canceled_teams.id)))
     LEFT JOIN public.cfg_orders_objects ON ((orders.object_id = cfg_orders_objects.id)))
     JOIN public.cfg_orders_statuses ON ((orders.status_id = cfg_orders_statuses.id)))
     JOIN public.cfg_orders_priorities ON ((orders.priority_id = cfg_orders_priorities.id)))
     JOIN public.units ON ((orders.unit_id = units.id)))
     LEFT JOIN public.users ON ((orders.team_leader_id = users.id)))
     LEFT JOIN public.users canceled_users ON ((orders.canceled_user_id = canceled_users.id)))
     LEFT JOIN public.users unit_asset_tag_no_has_order_users ON ((orders.unit_asset_tag_no_has_order_user_id = unit_asset_tag_no_has_order_users.id)))
     JOIN public.cfg_systems systems_parent ON ((orders.system_parent_id = systems_parent.id)))
     JOIN public.cfg_systems ON ((orders.system_id = cfg_systems.id)))
     JOIN public.cfg_units_types units_types_parent ON ((orders.unit_type_parent_id = units_types_parent.id)))
     JOIN public.cfg_units_types ON ((orders.unit_type_id = cfg_units_types.id)))
     LEFT JOIN public.cfg_assets_tags ON ((orders.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((orders.asset_tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_orders_causes_reasons ON ((orders.cause_reason_id = cfg_orders_causes_reasons.id)))
     LEFT JOIN public.cfg_orders_suspended_reasons ON ((orders.suspended_reason_id = cfg_orders_suspended_reasons.id)))
     LEFT JOIN public.cfg_orders_cancel_reasons ON ((orders.cancel_reason_id = cfg_orders_cancel_reasons.id)))
     LEFT JOIN public.clients ON ((orders.client_id = clients.id)));


--
-- Name: v_dash_admin_orders_filters_open; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_dash_admin_orders_filters_open AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.contract_code,
    v_orders.unit_code,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.asset_tag_sub_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at,
    v_orders.asset_tag_sub_description
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));


--
-- Name: fc_dash_admin_orders_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_dash_admin_orders_filters_open;`n`nfc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) RETURNS SETOF public.v_dash_admin_orders_filters_open
    LANGUAGE plpgsql
    AS $$

BEGIN
    RETURN QUERY
    SELECT *
    FROM v_dash_admin_orders_filters_open
    WHERE

    ((system_parent_id = ANY(systems_parents_ids) OR systems_parents_ids IS NULL OR array_length(systems_parents_ids, 1) = 0)
    OR (COALESCE(array_length(systems_parents_ids, 1), 0) = 0))
    AND

    ((system_id = ANY(systems_ids) OR systems_ids IS NULL OR array_length(systems_ids, 1) = 0)
    OR (COALESCE(array_length(systems_ids, 1), 0) = 0))
    AND

    ((unit_type_parent_id = ANY(units_types_parents_ids) OR units_types_parents_ids IS NULL OR array_length(units_types_parents_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_parents_ids, 1), 0) = 0))
    AND

    ((unit_id = ANY(units_ids) OR units_ids IS NULL OR array_length(units_ids, 1) = 0)
    OR (COALESCE(array_length(units_ids, 1), 0) = 0))
    AND

    ((asset_tag_id = ANY(assets_tags_ids) OR assets_tags_ids IS NULL OR array_length(assets_tags_ids, 1) = 0)
    OR (COALESCE(array_length(assets_tags_ids, 1), 0) = 0))
    AND
   
    ((type_id = ANY(orders_types_ids) OR orders_types_ids IS NULL OR array_length(orders_types_ids, 1) = 0)
    OR (COALESCE(array_length(orders_types_ids, 1), 0) = 0))
    AND

    ((type_sub_id = ANY(orders_types_subs_ids) OR orders_types_subs_ids IS NULL OR array_length(orders_types_subs_ids, 1) = 0)
    OR (COALESCE(array_length(orders_types_subs_ids, 1), 0) = 0))
    AND

    ((contract_id = ANY(contracts_ids) OR contracts_ids IS NULL OR array_length(contracts_ids, 1) = 0)
    OR (COALESCE(array_length(contracts_ids, 1), 0) = 0))
    AND

    ((company_id = ANY(companies_ids) OR companies_ids IS NULL OR array_length(companies_ids, 1) = 0)
    OR (COALESCE(array_length(companies_ids, 1), 0) = 0))
    AND

    ((object_id = ANY(orders_objects_ids) OR orders_objects_ids IS NULL OR array_length(orders_objects_ids, 1) = 0)
    OR (COALESCE(array_length(orders_objects_ids, 1), 0) = 0))
    AND
    
    ((plan_id = ANY(orders_plans_ids) OR orders_plans_ids IS NULL OR array_length(orders_plans_ids, 1) = 0)
    OR (COALESCE(array_length(orders_plans_ids, 1), 0) = 0))
    AND

    ((team_id = ANY(teams_ids) OR teams_ids IS NULL OR array_length(teams_ids, 1) = 0)
    OR (COALESCE(array_length(teams_ids, 1), 0) = 0))
    AND

    (v_dash_admin_orders_filters_open.version_mode = app_version_mode)
  
    ;
    
END;

$$;


--
-- Name: v_dash_admin_orders_parent_filters_open; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_dash_admin_orders_parent_filters_open AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.contract_code,
    v_orders.unit_code,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.asset_tag_sub_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at,
    v_orders.asset_tag_sub_description
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id IS NULL));


--
-- Name: fc_dash_admin_orders_parent_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_dash_admin_orders_parent_filters_open;`n`nfc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) RETURNS SETOF public.v_dash_admin_orders_parent_filters_open
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM v_dash_admin_orders_parent_filters_open
    WHERE
    ((system_parent_id = ANY(systems_parents_ids) OR systems_parents_ids IS NULL OR array_length(systems_parents_ids, 1) = 0)
    OR (COALESCE(array_length(systems_parents_ids, 1), 0) = 0))
    AND

    ((system_id = ANY(systems_ids) OR systems_ids IS NULL OR array_length(systems_ids, 1) = 0)
    OR (COALESCE(array_length(systems_ids, 1), 0) = 0))
    AND

    ((unit_type_parent_id = ANY(units_types_parents_ids) OR units_types_parents_ids IS NULL OR array_length(units_types_parents_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_parents_ids, 1), 0) = 0))
    AND

    ((unit_type_id = ANY(units_types_ids) OR units_types_ids IS NULL OR array_length(units_types_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_ids, 1), 0) = 0))
    AND

    ((unit_id = ANY(units_ids) OR units_ids IS NULL OR array_length(units_ids, 1) = 0)
    OR (COALESCE(array_length(units_ids, 1), 0) = 0))
    AND

    ((asset_tag_id = ANY(assets_tags_ids) OR assets_tags_ids IS NULL OR array_length(assets_tags_ids, 1) = 0)
    OR (COALESCE(array_length(assets_tags_ids, 1), 0) = 0))
    AND

    ((type_id = ANY(orders_types_ids) OR orders_types_ids IS NULL OR array_length(orders_types_ids, 1) = 0)
    OR (COALESCE(array_length(orders_types_ids, 1), 0) = 0))
    AND 

    (v_dash_admin_orders_parent_filters_open.version_mode = app_version_mode)
    ;
END;
$$;


--
-- Name: fc_get_profile_permissions(bigint); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_get_profile_permissions;`n`nfc_get_profile_permissions(p_profile_id bigint) RETURNS TABLE(permission_id bigint, route_id bigint, route_key character varying, route_path character varying, route_description character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.id as permission_id,
        r.id as route_id,
        r.route_key,
        r.route_path,
        r.description as route_description,
        pa.can_view,
        pa.can_create,
        pa.can_edit,
        pa.can_delete
    FROM public.cfg_profiles_access pa
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE pa.profile_id = p_profile_id
      AND r.is_available = true
    ORDER BY r.order_index;
END;
$$;


--
-- Name: fc_get_user_permissions(bigint); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_get_user_permissions;`n`nfc_get_user_permissions(p_user_id bigint) RETURNS TABLE(route_id bigint, route_key character varying, route_path character varying, route_description character varying, route_icon character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as route_id,
        r.route_key,
        r.route_path,
        r.description as route_description,
        r.icon as route_icon,
        pa.can_view,
        pa.can_create,
        pa.can_edit,
        pa.can_delete
    FROM public.users u
    INNER JOIN public.cfg_profiles p ON u.profile_id = p.id
    INNER JOIN public.cfg_profiles_access pa ON p.id = pa.profile_id
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE u.id = p_user_id
      AND r.is_available = true
    ORDER BY r.order_index;
END;
$$;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description text,
    searchable text,
    company_id bigint,
    price_unit double precision,
    unit character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    provider_company_id bigint DEFAULT '1'::bigint,
    balance numeric DEFAULT '0'::numeric,
    finger_print character varying,
    is_deleted boolean DEFAULT false,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    created_user_id bigint,
    created_at timestamp without time zone
);


--
-- Name: v_materials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_materials AS
 SELECT materials.id,
    materials.code,
    materials.description,
    materials.unit,
    materials.price_unit,
    materials.searchable,
    materials.version_mode,
    materials.finger_print,
    materials.company_id,
    materials.provider_company_id
   FROM public.materials
  WHERE (materials.is_deleted = false);


--
-- Name: fc_materials_search(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_materials_search;`n`nfc_materials_search(search_terms text, provider_company_id_int integer) RETURNS SETOF public.v_materials
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_materials;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_materials AS vm  -- Use an alias for the view
        WHERE 
        to_tsvector('portuguese', vm.searchable) @@ plainto_tsquery('portuguese', search_terms) AND
        vm.provider_company_id = provider_company_id_int  -- Reference the alias here
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


--
-- Name: fc_materials_searchable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_materials_searchable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    NEW.searchable = NEW.code || ' ' || NEW.description;

    RETURN NEW;
END;
$$;


--
-- Name: fc_order_counter_increment(bigint, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_order_counter_increment;`n`nfc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_counter bigint;
    result json;
BEGIN
    -- Tenta selecionar o contador existente com base em company_id, year e is_dev
    SELECT counter INTO v_counter
    FROM public.cfg_orders_counter
    WHERE company_id = p_company_id
    AND year = p_year
    AND version = p_version
    FOR UPDATE;  -- Lock para garantir seguran├ºa em concorr├¬ncia

    IF FOUND THEN
        -- Incrementa o contador existente
        v_counter := v_counter + 1;
        UPDATE public.cfg_orders_counter
        SET counter = v_counter
        WHERE company_id = p_company_id
        AND year = p_year
        AND version = p_version;
    ELSE
        -- Insere um novo registro com contador 1
        v_counter := 1;
        INSERT INTO public.cfg_orders_counter (company_id, year, version, counter)
        VALUES (p_company_id, p_year, p_version, v_counter);
    END IF;

    -- Gera o JSON de retorno
    result := json_build_object('counter', v_counter);
    RETURN result;
END;
$$;


--
-- Name: fc_orders_replace_special_chars(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_replace_special_chars() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Etapa 1: Remover acentos usando a fun├º├úo unaccent
  new.requested_services := unaccent(new.requested_services);

  -- Etapa 2: Substituir combina├º├Áes espec├¡ficas que n├úo s├úo tratadas pelo unaccent
--  new.requested_services := regexp_replace(new.requested_services, '├▒', 'n', 'gi');
--  new.requested_services := regexp_replace(new.requested_services, '├╝', 'u', 'gi');


  RETURN NEW;
END;
$$;


--
-- Name: cfg_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_activities (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    company_id bigint,
    department_id bigint
);


--
-- Name: cfg_orders_types_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_types_activities (
    id bigint NOT NULL,
    o_type_id bigint NOT NULL,
    activity_id bigint NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: v_orders_types_activities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_types_activities AS
 SELECT cfg_orders_types_activities.id,
    cfg_orders_types_activities.o_type_id,
    cfg_orders_types_activities.activity_id,
    cfg_activities.description AS activity_description,
    cfg_orders_types_activities.is_available,
    cfg_orders_types_activities.version_mode
   FROM (public.cfg_orders_types_activities
     JOIN public.cfg_activities ON ((cfg_orders_types_activities.activity_id = cfg_activities.id)))
  ORDER BY cfg_activities.description;


--
-- Name: fc_orders_types_activities_search(text, text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_orders_types_activities_search;`n`nfc_orders_types_activities_search(srch_terms text, srch_version_mode text) RETURNS SETOF public.v_orders_types_activities
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_orders_types_activities;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_orders_types_activities
        WHERE activity_description &@~ srch_terms AND version_mode = srch_version_mode
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


--
-- Name: fc_orders_visits_assets_activities_description(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_assets_activities_description() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the activities_description field
    UPDATE public.orders_visits_assets
    SET activities_description = (
        SELECT string_agg(a.description, ', ' ORDER BY a.description)
        FROM public.orders_visits_assets_activities ovaa
        JOIN public.cfg_activities a ON ovaa.activity_id = a.id  -- Assuming you have an activities table with activity descriptions
        WHERE ovaa.ova_id = NEW.ova_id
        AND ovaa.is_deleted = false
   )
    WHERE id = NEW.ova_id;

    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_assets_materials_update_value_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_assets_materials_update_value_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calcula o value_total como amount * value_unit * discount
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    
    -- Retorna o registro modificado
    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_assets_update_materials_value(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_assets_update_materials_value() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Log the execution of the trigger
    RAISE NOTICE 'trg_orders_visits_assets_update_materials_value executed for ov_id: %, asset_id: %', NEW.ov_id, NEW.asset_id;

    -- Update the materials_value field in orders_visits_assets
    UPDATE public.orders_visits_assets
    SET materials_value = (
        SELECT COALESCE(SUM(value_total), 0)
        FROM public.orders_visits_assets_materials
        WHERE ov_id = NEW.ov_id 
        AND asset_id = NEW.asset_id 
        AND is_deleted = false
    )
    WHERE ov_id = NEW.ov_id AND asset_id = NEW.asset_id;

    -- Update the ov_materials_value in orders_visits
    UPDATE public.orders_visits
    SET ov_materials_value = (
        SELECT COALESCE(SUM(materials_value), 0)
        FROM public.orders_visits_assets
        WHERE ov_id = NEW.ov_id
    )
    WHERE id = NEW.ov_id;

    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_services_amount_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_services_amount_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calcula o value_total como amount * value_unit * discount
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    
    -- Retorna o registro modificado
    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_services_update_services_value(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_services_update_services_value() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_ov_id bigint;
BEGIN
    -- Identifica qual visita deve ser recalculada dependendo da operação
    IF TG_OP = 'DELETE' THEN
        target_ov_id := OLD.ov_id;
    ELSE
        target_ov_id := NEW.ov_id;
    END IF;

    -- Atualiza o campo ov_services_value na tabela orders_visits
    UPDATE public.orders_visits
    SET ov_services_value = (
        SELECT COALESCE(SUM(value_total), 0)
        FROM public.orders_visits_services
        WHERE ov_id = target_ov_id
        AND is_deleted = false
    )
    WHERE id = target_ov_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


--
-- Name: fc_orders_visits_services_update_value_unit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_services_update_value_unit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.value_unit = 0 OR NEW.value_unit IS NULL THEN
        SELECT value_unit INTO NEW.value_unit
        FROM public.contracts_services
        WHERE id = NEW.contract_service_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_teams_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_teams_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    team_names TEXT;
    ov_id_value BIGINT;
BEGIN
    -- Definir o valor correto de ov_id dependendo se for INSERT ou DELETE
    IF (TG_OP = 'INSERT') THEN
        ov_id_value = NEW.ov_id;
    ELSIF (TG_OP = 'DELETE') THEN
        ov_id_value = OLD.ov_id;
    END IF;

    -- Concatena os nomes dos usu├írios na ordem correta, l├¡deres primeiro
    SELECT string_agg(u.name_short, ', ' ORDER BY t.is_leader DESC, u.name_short ASC)
    INTO team_names
    FROM public.orders_visits_teams t
    JOIN public.users u ON t.user_id = u.id
    WHERE t.ov_id = ov_id_value;
    
    -- Atualiza o campo ov_team_names_short na tabela orders_visits
    UPDATE public.orders_visits
    SET ov_team_names_short = team_names
    WHERE id = ov_id_value;
    
    RETURN NULL; -- Trigger functions must return a value
END;
$$;


--
-- Name: fc_orders_visits_vehicles_amount_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_vehicles_amount_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calcula a diferen├ºa entre recorder_end e recorder_start para o campo amount
    NEW.amount := COALESCE(NEW.recorder_end, 0) - COALESCE(NEW.recorder_start, 0);
    
    -- Calcula o value_total como amount * value_unit * discount
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    
    -- Retorna o registro modificado
    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_vehicles_update_value_unit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_vehicles_update_value_unit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_price numeric;
BEGIN
    -- Get current price from vehicles table
    SELECT value_unit INTO v_price FROM public.vehicles WHERE id = NEW.vehicle_id;
    
    -- Set the value_unit on the new record
    NEW.value_unit := COALESCE(v_price, 0);
    
    RETURN NEW;
END;
$$;


--
-- Name: fc_orders_visits_vehicles_update_vehicles_value(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    target_ov_id bigint;
begin
    -- Identifica qual visita deve ser recalculada
    if TG_OP = 'DELETE' then
        target_ov_id := OLD.ov_id;
    else
        target_ov_id := NEW.ov_id;
    end if;

    -- Faz a soma e atualiza diretamente a tabela orders_visits
    update public.orders_visits
    set ov_vehicles_value = (
        select coalesce(sum(value_total), 0)
        from public.orders_visits_vehicles
        where ov_id = target_ov_id
    )
    where id = target_ov_id;

    return null; -- Gatilhos 'AFTER' podem retornar null
end;
$$;


--
-- Name: fc_team_descendants(bigint); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_team_descendants(bigint);

CREATE FUNCTION public.fc_team_descendants(team_id bigint) RETURNS TABLE(id bigint, parent_id bigint, code character varying, description character varying, department_id bigint, level integer, full_path text)
    LANGUAGE plpgsql STABLE
    SET search_path TO ''
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_descendants AS (
    SELECT
      t.id,
      t.parent_id,
      t.code,
      t.description,
      t.department_id,
      1 AS level,
      t.code::text AS full_path
    FROM public.cfg_teams t
    WHERE t.id = team_id
      AND COALESCE(t.is_deleted, false) = false
      AND t.is_available = true

    UNION ALL

    SELECT
      c.id,
      c.parent_id,
      c.code,
      c.description,
      c.department_id,
      d.level + 1,
      d.full_path || ' > ' || c.code
    FROM public.cfg_teams c
    INNER JOIN team_descendants d ON c.parent_id = d.id
    WHERE COALESCE(c.is_deleted, false) = false
      AND c.is_available = true
  )
  SELECT
    d.id,
    d.parent_id,
    d.code,
    d.description,
    d.department_id,
    d.level,
    d.full_path
  FROM team_descendants d
  --WHERE d.id != team_id --Remover para listar o team_id
  ORDER BY d.full_path;
END;
$$;


--
-- Name: fc_tgr_units_searchable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fc_tgr_units_searchable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
    unit_type_code TEXT;
BEGIN
    SELECT cfg_units_types.code AS unit_type_code
    INTO unit_type_code
    FROM cfg_units_types
    WHERE cfg_units_types.id = NEW.unit_type_id;    

    NEW.description_full = NEW.code || ' - ' || unit_type_code || ' ' || NEW.description;

    RETURN NEW;
END;
$$;


--
-- Name: technicals_manuals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technicals_manuals (
    id bigint NOT NULL,
    tm_type_id bigint,
    description text,
    doc_file_path text,
    doc_file_name text,
    company_id bigint,
    assets_amount bigint DEFAULT '0'::bigint NOT NULL,
    asset_type_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: technicals_manuals_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technicals_manuals_types (
    id bigint NOT NULL,
    description text,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id double precision,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: v_technicals_manuals; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_technicals_manuals AS
 SELECT technicals_manuals.id,
    technicals_manuals.company_id,
    technicals_manuals.tm_type_id,
    technicals_manuals_types.description AS tm_type_description,
    technicals_manuals.description AS tm_description,
    technicals_manuals.doc_file_path,
    technicals_manuals.doc_file_name,
    technicals_manuals.assets_amount,
    technicals_manuals.asset_type_id,
    cfg_assets_types.description AS asset_type_description
   FROM ((public.technicals_manuals
     JOIN public.technicals_manuals_types ON ((technicals_manuals.tm_type_id = technicals_manuals_types.id)))
     JOIN public.cfg_assets_types ON ((technicals_manuals.asset_type_id = cfg_assets_types.id)));


--
-- Name: fc_tm_assets_types_search_terms(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_tm_assets_types_search_terms;`n`nfc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) RETURNS SETOF public.v_technicals_manuals
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_technicals_manuals;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_technicals_manuals
        WHERE asset_type_id = src_asset_type_id and to_tsvector('portuguese', tm_description) @@ plainto_tsquery('portuguese', search_terms)
        ORDER BY tm_description
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


--
-- Name: cfg_units_assets_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_units_assets_tags (
    id bigint NOT NULL,
    unit_id bigint,
    asset_tag_id bigint,
    asste_tag_sub_id bigint,
    last_created_at timestamp without time zone,
    last_is_available boolean,
    last_status_id bigint,
    last_processing_id bigint,
    last_created_user_id bigint,
    last_asset_available_id bigint,
    last_file_path text,
    last_file_name text,
    last_comments text,
    last_asset_unavailable_reason_id bigint,
    last_reported_at timestamp without time zone,
    flow_rate_unit character varying,
    asset_availble_rate double precision,
    last_asset_availble_rate double precision,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone,
    created_user_id bigint,
    flow_rate_min double precision,
    flow_rate_max double precision,
    last_is_on boolean DEFAULT false,
    power_unit character varying,
    power_min double precision,
    power_max double precision,
    operation_unit character varying,
    last_operation_record double precision,
    pressure_unit character varying,
    pressure_min double precision,
    pressure_max double precision,
    last_flow_rate double precision,
    last_power double precision,
    last_pressure double precision,
    flow_rate_is_visible boolean DEFAULT false,
    power_is_visible boolean DEFAULT false,
    pressure_is_visible boolean DEFAULT false,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    asset_tag_tag_sub_description text,
    is_active boolean DEFAULT true,
    voltage_unit character varying,
    voltage_min double precision,
    voltage_max double precision,
    voltage_is_visible boolean DEFAULT false,
    last_voltage double precision,
    amperage_unit character varying,
    amperage_min double precision,
    amperage_max double precision,
    amperage_is_available boolean DEFAULT false,
    last_amperage double precision,
    last_o_id bigint,
    op_counter bigint,
    asset_tag_sub_id bigint,
    last_reported_user_id bigint,
    asset_available_rate double precision,
    last_asset_available_rate double precision
);


--
-- Name: v_units_by_assets_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_by_assets_tags AS
 SELECT cfg_units_assets_tags.unit_id,
    u.system_parent_id,
    u.system_id,
    u.unit_type_parent_id,
    u.unit_type_id,
    u.latitude,
    u.longitude,
    u.description_full,
    cfg_units_assets_tags.asset_tag_id,
    cfg_assets_tags.description AS tag_description,
    max(cfg_units_assets_tags.last_reported_at) AS last_reported_at,
    sum(cfg_units_assets_tags.last_asset_available_rate) AS total_last_asset_available_rate
   FROM ((public.cfg_units_assets_tags
     LEFT JOIN public.cfg_assets_tags ON ((cfg_units_assets_tags.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.units u ON ((cfg_units_assets_tags.unit_id = u.id)))
  WHERE (cfg_units_assets_tags.is_deleted = false)
  GROUP BY cfg_units_assets_tags.unit_id, u.system_parent_id, u.system_id, u.unit_type_parent_id, u.unit_type_id, u.latitude, u.longitude, u.description_full, cfg_units_assets_tags.asset_tag_id, cfg_assets_tags.description
  ORDER BY (sum(cfg_units_assets_tags.last_asset_available_rate));


--
-- Name: fc_units_assets_tags_available_rate_search_filters(integer, integer[], integer[], integer[], integer[], integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_units_assets_tags_available_rate_search_filters;`n`nfc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) RETURNS SETOF public.v_units_by_assets_tags
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM v_units_by_assets_tags
    WHERE

    (asset_tag_id = asset_tag_id_value)
    AND

    ((unit_id = ANY(units_ids) OR units_ids IS NULL OR array_length(units_ids, 1) = 0)
    OR (COALESCE(array_length(units_ids, 1), 0) = 0))
    AND

    (system_parent_id = system_parent_id_value)
    AND

    ((system_id = ANY(systems_ids) OR systems_ids IS NULL OR array_length(systems_ids, 1) = 0)
    OR (COALESCE(array_length(systems_ids, 1), 0) = 0))
    AND

    ((unit_type_parent_id = ANY(units_types_parent_ids) OR units_types_parent_ids IS NULL OR array_length(units_types_parent_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_parent_ids, 1), 0) = 0))
    AND

    ((unit_type_id = ANY(units_types_ids) OR units_types_ids IS NULL OR array_length(units_types_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_ids, 1), 0) = 0))
    
    ORDER BY
    total_last_asset_available_rate ASC
    OFFSET offset_value
    LIMIT limit_value;

    END;
    $$;


--
-- Name: cfg_assets_available_processing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_available_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


--
-- Name: cfg_assets_unavailable_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_unavailable_reasons (
    id bigint NOT NULL,
    code text,
    description text,
    is_available boolean DEFAULT true
);


--
-- Name: v_units_assets_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_assets_tags AS
 SELECT cuat.id,
    cuat.unit_id,
    u.system_parent_id,
    u.system_id,
    u.code AS unit_code,
    u.description_full AS unit_description,
    cuat.asset_tag_id,
    at.description AS tag_description,
    cuat.asset_tag_sub_id,
    ats.description AS tag_sub_description,
    cuat.asset_tag_tag_sub_description,
    cuat.last_status_id,
    s.description AS last_status_description,
    s.code AS last_status_code,
    cuat.last_is_available,
    cuat.last_processing_id,
    ap.description AS last_processing_description,
    cuat.last_created_at,
    cuat.last_created_user_id,
    uc.name_short AS last_created_user_name_short,
    cuat.last_asset_available_id,
    cuat.last_comments,
    cuat.last_asset_unavailable_reason_id,
    ur.description AS last_asset_unavailable_reason_description,
    cuat.last_file_path,
    cuat.last_file_name,
    cuat.last_reported_at,
    cuat.last_reported_user_id,
    urp.name_short AS last_reported_user_name_short,
    cuat.asset_available_rate,
    cuat.last_asset_available_rate,
    cuat.is_deleted,
    cuat.deleted_at,
    cuat.deleted_user_id,
    ud.name_short AS deleted_user_name_short,
    cuat.operation_unit,
    cuat.last_operation_record,
    cuat.flow_rate_unit,
    cuat.flow_rate_min,
    cuat.flow_rate_max,
    cuat.last_flow_rate,
    cuat.flow_rate_is_visible,
    cuat.power_unit,
    cuat.power_min,
    cuat.power_max,
    cuat.last_power,
    cuat.power_is_visible,
    cuat.pressure_unit,
    cuat.pressure_min,
    cuat.pressure_max,
    cuat.last_pressure,
    cuat.pressure_is_visible,
    cuat.last_is_on,
    cuat.last_o_id,
    cuat.op_counter,
    cuat.is_active
   FROM (((((((((public.cfg_units_assets_tags cuat
     LEFT JOIN public.cfg_assets_tags at ON ((cuat.asset_tag_id = at.id)))
     LEFT JOIN public.cfg_assets_tags_subs ats ON ((cuat.asset_tag_sub_id = ats.id)))
     LEFT JOIN public.cfg_assets_statuses s ON ((cuat.last_status_id = s.id)))
     LEFT JOIN public.cfg_assets_available_processing ap ON ((cuat.last_processing_id = ap.id)))
     LEFT JOIN public.users uc ON ((cuat.last_created_user_id = uc.id)))
     LEFT JOIN public.users urp ON ((cuat.last_reported_user_id = urp.id)))
     LEFT JOIN public.cfg_assets_unavailable_reasons ur ON ((cuat.last_asset_unavailable_reason_id = ur.id)))
     LEFT JOIN public.users ud ON ((cuat.deleted_user_id = ud.id)))
     LEFT JOIN public.units u ON ((cuat.unit_id = u.id)))
  WHERE (cuat.is_deleted = false)
  ORDER BY at.description, ats.description;


--
-- Name: fc_units_assets_tags_search_filters(integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_units_assets_tags_search_filters;`n`nfc_units_assets_tags_search_filters(system_parent_id_value integer) RETURNS SETOF public.v_units_assets_tags
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM v_units_assets_tags
    WHERE

    (system_parent_id = system_parent_id_value);

    END;
    $$;


--
-- Name: cfg_units_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_units_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    color character varying DEFAULT '#3b82f6'::character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: v_units; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units AS
 SELECT units.id,
    units.code,
    units.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    units.system_parent_id,
    systems_parent.code AS system_parent_code,
    systems_parent.description AS system_parent_description,
    units.system_id,
    systems_child.code AS system_child_code,
    systems_child.description AS system_child_description,
    units.unit_type_parent_id,
    units_types_parent.code AS unit_type_parent_code,
    units_types_parent.description AS unit_type_parent_description,
    units.unit_type_id,
    units_types_child.code AS unit_type_child_code,
    units_types_child.description AS unit_type_child_description,
    units.status_id,
    cfg_units_statuses.description AS status_description,
    units.description,
    units.description_full,
    units.street_name,
    units.street_number,
    units.street_complement,
    units.address_full,
    units.latitude,
    units.longitude,
    units.installation_code_power_supply,
    units.version_mode,
    units.client_id,
    clients.name AS client_name
   FROM (((((((public.units
     JOIN public.cfg_companies ON ((units.company_id = cfg_companies.id)))
     JOIN public.cfg_systems systems_child ON ((units.system_id = systems_child.id)))
     JOIN public.cfg_systems systems_parent ON ((units.system_parent_id = systems_parent.id)))
     JOIN public.cfg_units_types units_types_parent ON ((units.unit_type_parent_id = units_types_parent.id)))
     JOIN public.cfg_units_types units_types_child ON ((units.unit_type_id = units_types_child.id)))
     JOIN public.cfg_units_statuses ON ((units.status_id = cfg_units_statuses.id)))
     LEFT JOIN public.clients ON ((units.client_id = clients.id)))
  ORDER BY units.description;


--
-- Name: fc_units_search(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_units_search;`n`nfc_units_search(search_terms character varying, search_version character varying) RETURNS SETOF public.v_units
    LANGUAGE plpgsql
    AS $$
begin
    return query
    select *
    from v_units
    where to_tsvector('portuguese', description_full) @@ plainto_tsquery('portuguese', search_terms)
      and version_mode = search_version;
end;
$$;


--
-- Name: fc_units_search_filters(integer[], integer[], integer[], integer[], integer, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_units_search_filters;`n`nfc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) RETURNS SETOF public.v_units
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM v_units
    WHERE

    (status_id = unit_status_id)
    AND

    ((system_parent_id = ANY(systems_parent_ids) OR systems_parent_ids IS NULL OR array_length(systems_parent_ids, 1) = 0)
    OR (COALESCE(array_length(systems_parent_ids, 1), 0) = 0))
    AND

    ((system_id = ANY(systems_ids) OR systems_ids IS NULL OR array_length(systems_ids, 1) = 0)
    OR (COALESCE(array_length(systems_ids, 1), 0) = 0))
    AND

    ((unit_type_parent_id = ANY(units_types_parent_ids) OR units_types_parent_ids IS NULL OR array_length(units_types_parent_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_parent_ids, 1), 0) = 0))
    AND

    ((unit_type_id = ANY(units_types_ids) OR units_types_ids IS NULL OR array_length(units_types_ids, 1) = 0)
    OR (COALESCE(array_length(units_types_ids, 1), 0) = 0))
    AND

    (version_mode = app_version_mode)
    AND

    (COALESCE(search_terms, '') = '' OR description_full @@ plainto_tsquery('portuguese', search_terms))

    ORDER BY
    description_full ASC
    OFFSET offset_value
    LIMIT limit_value;

END;
$$;


--
-- Name: fc_update_profile_routes(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_update_profile_routes;`n`nfc_update_profile_routes(p_profile_id bigint, p_routes jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Delete existing permissions for this profile
    DELETE FROM public.cfg_profiles_access 
    WHERE profile_id = p_profile_id;
    
    -- Insert new permissions
    INSERT INTO public.cfg_profiles_access (
        profile_id, route_id, can_view, can_create, can_edit, can_delete
    )
    SELECT 
        p_profile_id,
        (route->>'route_id')::bigint,
        COALESCE((route->>'can_view')::boolean, false),
        COALESCE((route->>'can_create')::boolean, false),
        COALESCE((route->>'can_edit')::boolean, false),
        COALESCE((route->>'can_delete')::boolean, false)
    FROM jsonb_array_elements(p_routes) AS route
    WHERE (route->>'route_id') IS NOT NULL;
END;
$$;


--
-- Name: cfg_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_departments (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    parent_id bigint
);


--
-- Name: cfg_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_profiles (
    id bigint NOT NULL,
    description character varying,
    department_id bigint,
    version character varying DEFAULT 'live'::character varying
);


--
-- Name: cfg_users_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_users_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


--
-- Name: v_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_users AS
 SELECT users.id,
    users.uuid,
    cfg_departments.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    cfg_companies.img_file_path AS company_img_file_path,
    cfg_companies.img_file_name AS company_img_file_name,
    cfg_companies.email_sufix AS company_email_sufix,
    cfg_companies.is_available AS company_is_available,
    cfg_teams.department_id,
    cfg_departments.code AS department_code,
    cfg_departments.description AS department_description,
    users.email,
    users.name_short,
    users.name_full,
    users.team_id,
    cfg_teams.code AS team_code,
    cfg_teams.description AS team_description,
    users.team_amount,
    users.team_id_previous,
    users.status_id,
    cfg_users_statuses.code AS status_code,
    cfg_users_statuses.description AS status_description,
    users.is_team_leader,
    users.is_admin,
    users.is_admin_super,
    users.img_file_path,
    users.img_file_name,
    users.ov_id_in_progress,
    users.ov_id_in_progress_mask,
    users.o_id_in_progress,
    users.op_id_in_progress,
    users.ov_in_progress_leader_id,
    users.profile_id,
    cfg_profiles.description AS profile_description,
    users.vehicle_id,
    users.is_available,
    users.is_ov_in_progress,
    users.version_app,
    contracts.id AS o_contract_id_in_progress,
    users.o_type_id_in_progress,
    users.o_type_sub_id_in_progress,
    users.o_plan_id_in_progress,
    users.o_asset_tag_id_in_progress,
    users.o_unit_id_in_progress,
    users.o_system_id_in_progress,
    users.o_system_parent_id_in_progress,
    users.o_unit_type_id_in_progress,
    users.o_object_id_in_progress,
    users.token_fcm,
    users.notifications_amount,
    users.mobile,
    users.mobile_full,
    users.mobile_mask,
    users.mobile_whatsapp,
    users.latitude,
    users.longitude,
    users.tracker_interval_seconds
   FROM (((((((public.users
     LEFT JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
     JOIN public.cfg_departments ON ((cfg_teams.department_id = cfg_departments.id)))
     JOIN public.cfg_companies ON ((cfg_departments.company_id = cfg_companies.id)))
     JOIN public.cfg_users_statuses ON ((users.status_id = cfg_users_statuses.id)))
     LEFT JOIN public.cfg_profiles ON ((users.profile_id = cfg_profiles.id)))
     LEFT JOIN public.orders ON ((users.o_id_in_progress = orders.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
  ORDER BY users.name_short;


--
-- Name: fc_users_search(text); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_users_search;`n`nfc_users_search(search_terms text) RETURNS SETOF public.v_users
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_users;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_users
        WHERE 
        to_tsvector('portuguese', name_full) @@ plainto_tsquery('portuguese', search_terms)
        AND status_id = 2
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (uuid, email, name_full, status_id, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'name',
    2, 
    now()
  )
  ON CONFLICT (uuid) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: handle_notifications_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_notifications_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.is_read = false) THEN
      UPDATE public.users SET notifications_amount = COALESCE(notifications_amount, 0) + 1 WHERE id = NEW.user_id_to;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.is_read = false AND NEW.is_read = true) THEN
      UPDATE public.users SET notifications_amount = GREATEST(COALESCE(notifications_amount, 0) - 1, 0) WHERE id = NEW.user_id_to;
    ELSIF (OLD.is_read = true AND NEW.is_read = false) THEN
      UPDATE public.users SET notifications_amount = COALESCE(notifications_amount, 0) + 1 WHERE id = NEW.user_id_to;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.is_read = false) THEN
      UPDATE public.users SET notifications_amount = GREATEST(COALESCE(notifications_amount, 0) - 1, 0) WHERE id = OLD.user_id_to;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: handle_profile_photo_change_notification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_profile_photo_change_notification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF (OLD.img_file_name IS DISTINCT FROM NEW.img_file_name) AND (NEW.img_file_name IS NOT NULL) THEN
    INSERT INTO public.users_notifications (user_id_to, user_id_from, title, body, type)
    SELECT u.id, NEW.id, 'Foto de perfil atualizada', 'Usu├írio ' || COALESCE(NEW.name_full, 'Desconhecido') || ' atualizou a foto de perfil', 'profile_photo_change'
    FROM public.users u WHERE u.is_admin_super = true;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: handle_unit_description_full(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_unit_description_full() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    subtype_code text := '';
BEGIN
    -- Search for subtype code if unit_type_id exists
    IF NEW.unit_type_id IS NOT NULL THEN
        SELECT code INTO subtype_code 
        FROM public.cfg_units_types 
        WHERE id = NEW.unit_type_id;
    END IF;

    -- Format: "CODE - SUBTYPE_CODE DESCRIPTION"
    NEW.description_full := 
        COALESCE(NEW.code, '') || 
        CASE WHEN length(NEW.code) > 0 THEN ' - ' ELSE '' END ||
        CASE WHEN length(subtype_code) > 0 THEN subtype_code || ' ' ELSE '' END ||
        COALESCE(NEW.description, '');
        
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: assets_attributes_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_attributes_values (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    value text,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone
);


--
-- Name: assets_attributes_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assets_attributes_values ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_attributes_values_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_available; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_available (
    id bigint NOT NULL,
    unit_id bigint,
    asset_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint,
    is_available boolean DEFAULT true,
    status_id bigint,
    file_path character varying,
    file_name character varying,
    comments character varying,
    created_user_id bigint,
    asset_unavailble_reason_id bigint,
    processing_id bigint DEFAULT '1'::bigint,
    reported_at timestamp without time zone,
    reported_user_id bigint,
    operation_record double precision,
    reported_latitude double precision,
    reported_longitude double precision,
    reported_coordinates character varying,
    is_on boolean DEFAULT false,
    operation_unit character varying,
    flow_rate_unit character varying,
    flow_rate_min double precision,
    flow_rate_max double precision,
    power_unit character varying,
    power_min double precision,
    power_max double precision,
    pressure_unit character varying,
    pressure_min double precision,
    pressure_max double precision,
    "Xflow_rate_is_on" boolean,
    "Xpower_is_on" boolean,
    "Xpressure_is_on" boolean,
    "Xflow_rate_is_available" boolean,
    "Xpower_is_available" boolean,
    "Xpressure_is_available" boolean,
    voltage_unit character varying,
    voltage_min double precision,
    voltage_max double precision,
    voltage_is_on boolean,
    voltage_is_available boolean,
    unit_latitude double precision,
    unit_longitute double precision,
    unit_reported_distance_m double precision,
    is_web boolean,
    company_id bigint,
    o_id bigint,
    o_mask character varying,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone,
    asset_unavailable_reason_id bigint,
    provider_company_id bigint,
    flow_rate_is_available double precision,
    power_is_available double precision,
    pressure_is_available double precision,
    flow_rate_is_on double precision,
    power_is_on double precision,
    pressure_is_on double precision
);


--
-- Name: assets_followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_followers (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    user_id bigint,
    version_mode character varying
);


--
-- Name: assets_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assets_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_materials (
    id bigint NOT NULL,
    asset_id bigint,
    material_id bigint,
    is_original boolean DEFAULT true,
    brand_model text,
    model text,
    serial text,
    date_in timestamp without time zone,
    date_out timestamp without time zone,
    recorder_in bigint,
    recorder_out bigint,
    order_visit_asset_id bigint,
    amount numeric,
    location text,
    order_parent_id bigint,
    order_id bigint,
    order_visit_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assets_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: asseys_available_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.assets_available ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.asseys_available_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: carts_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts_materials (
    id bigint NOT NULL,
    user_id bigint,
    material_id bigint,
    amount numeric,
    created_at timestamp without time zone NOT NULL,
    cart_id bigint,
    version_mode character varying DEFAULT 'live'::character varying,
    ova_id bigint,
    created_user_id bigint,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: carts_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.carts_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.carts_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app (
    id bigint NOT NULL,
    apk_url character varying NOT NULL,
    version_app character varying NOT NULL,
    logo_url character varying,
    version_app_offline character varying DEFAULT '1'::character varying,
    n8n_available_last_at timestamp without time zone,
    version_app_mask character varying
);


--
-- Name: cfg_app_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_app ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app_offline_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_offline_updates (
    id bigint NOT NULL,
    table_name text,
    version_offline character varying DEFAULT '1'::character varying,
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);


--
-- Name: cfg_app_offline_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_app_offline_updates ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_offline_updates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_pages (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available_provider boolean DEFAULT false
);


--
-- Name: cfg_app_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_app_pages ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_assets_attributes (
    id bigint NOT NULL,
    asset_type_id bigint,
    field_key character varying NOT NULL,
    label character varying NOT NULL,
    data_type character varying DEFAULT 'text'::character varying NOT NULL,
    unit character varying,
    decimals integer DEFAULT 0,
    is_required boolean DEFAULT false NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_assets_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_attributes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_available_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_available_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_available_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_couplings_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_couplings_models ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_couplings_models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_priorities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_priorities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_tags ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_tags_subs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_tags_subs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_tags_subs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_unavailable_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_unavailable_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_unavailable_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_companies ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_contracts_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_contracts_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    color character varying DEFAULT '#3b82f6'::character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_contracts_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_contracts_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_contracts_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_departments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_cancel_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_cancel_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_cancel_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_causes_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_causes_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_causes_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_counter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_counter (
    id bigint NOT NULL,
    company_id bigint,
    year integer,
    counter bigint DEFAULT '0'::bigint,
    is_dev boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);


--
-- Name: cfg_orders_counter_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_counter ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_counter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_objects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_objects ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_objects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_plans ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_priorities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_priorities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_suspended_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_suspended_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_suspended_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_subs_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_types_subs_activities (
    id bigint NOT NULL,
    order_type_sub_id bigint NOT NULL,
    activity_id bigint NOT NULL,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: cfg_orders_types_subs_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_subs_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_subs_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_subs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_subs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_subs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_visits_extras_processing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_orders_visits_extras_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


--
-- Name: cfg_orders_visits_extras_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_visits_extras_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_extras_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_profiles_access (
    id bigint NOT NULL,
    profile_id bigint NOT NULL,
    route_id bigint NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    created_user_id bigint,
    updated_user_id bigint
);


--
-- Name: cfg_profiles_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles_access ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_profiles_permissions (
    id bigint NOT NULL,
    profile_id bigint NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    app_page_id bigint
);


--
-- Name: cfg_profiles_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_routes (
    id bigint NOT NULL,
    route_key character varying NOT NULL,
    route_path character varying NOT NULL,
    description character varying NOT NULL,
    icon character varying,
    parent_id bigint,
    order_index integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


--
-- Name: cfg_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_routes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_routes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_systems_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_systems ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_systems_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_assets_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_assets_tags ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_assets_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_users_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cfg_users_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_users_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clients ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contracts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_managers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts_managers (
    id bigint NOT NULL,
    contract_id bigint NOT NULL,
    manager_id bigint NOT NULL,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    deleted_user_id bigint,
    deleted_at timestamp without time zone
);


--
-- Name: contracts_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contracts_managers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_managers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contracts_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: jr_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jr_assets (
    id bigint NOT NULL,
    description character varying,
    tag_description character varying,
    tag_sub_description character varying,
    location character varying,
    unit_description character varying,
    status_code character varying,
    status_description character varying,
    status_at timestamp without time zone,
    type_description character varying,
    priority_code character varying,
    priority_description character varying,
    user_uuid character varying,
    code character varying,
    user_id bigint
);


--
-- Name: jr_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.jr_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.jr_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: jr_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jr_units (
    id bigint NOT NULL,
    company_id bigint DEFAULT '1'::bigint,
    unit_type_description character varying,
    code character varying,
    description text,
    street_name text,
    street_complement character varying,
    latitude double precision,
    longitude double precision,
    description_full text,
    unit_type_parent_description text,
    system_parent_description text,
    system_description text,
    address_full text,
    status_description text,
    street_number integer,
    user_uuid text,
    unit_type_code character varying
);


--
-- Name: jr_units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.jr_units ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.jr_units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audits_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audits_logs (
    id bigint NOT NULL,
    created_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    user_uuid uuid,
    table_name text,
    operation text,
    data_old jsonb,
    data_new jsonb,
    user_id bigint
);


--
-- Name: audits_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audits_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.audits_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_followers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    o_id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: orders_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits (
    id bigint NOT NULL,
    ov_mask character varying,
    visit_counter integer,
    o_id bigint,
    ov_approved_user_id bigint,
    ov_approved_at timestamp without time zone,
    ov_disapproved_user_id bigint,
    ov_disapproved_at timestamp without time zone,
    ov_started_at timestamp without time zone,
    ov_ended_at timestamp without time zone,
    ov_processing_id bigint DEFAULT '1'::bigint,
    ov_status_id bigint DEFAULT '1'::bigint,
    ov_reported_at timestamp without time zone,
    ov_reported_user_id bigint,
    ov_team_leader_id bigint,
    ov_assets_amount integer DEFAULT 0,
    ov_assets_approved_amount integer DEFAULT 0,
    ov_assets_disapproved_amount integer DEFAULT 0,
    ov_assets_reported_amount integer DEFAULT 0,
    ov_materials_value numeric DEFAULT '0'::numeric,
    ov_services_value numeric DEFAULT '0'::numeric,
    ov_vehicles_value numeric DEFAULT '0'::numeric,
    ov_created_user_id bigint,
    ov_created_at timestamp without time zone,
    ov_updated_user_id bigint,
    ov_updated_at timestamp without time zone,
    ov_deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    ov_duration_hours double precision DEFAULT '0'::double precision,
    ov_disapproved_comments text,
    ov_assets_draft_amount integer DEFAULT 0,
    is_canceled boolean DEFAULT false,
    ov_comments text,
    o_cancel_reason_id bigint,
    ov_created_latitude double precision,
    ov_created_longitude double precision,
    ov_total_value numeric DEFAULT '0'::numeric,
    ov_is_filed boolean DEFAULT false,
    ov_team_amount integer DEFAULT 1,
    ov_assets_revised_amount integer DEFAULT 0,
    ov_revised_user_id bigint,
    ov_revised_at timestamp without time zone,
    ov_team_names_short character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    ov_rpt_file_path character varying,
    ov_rpt_file_name character varying,
    ov_o_suspended_reason_id bigint,
    ov_o_status_id bigint,
    ov_o_progress numeric DEFAULT '0'::numeric,
    ov_img_file_path text,
    ov_img_file_name text,
    ov_pdf_file_path text,
    ov_pdf_file_name text,
    x_created_user_logon text,
    x_created_user_id bigint,
    x_interv_id bigint,
    is_extra boolean DEFAULT false,
    ov_approved_filed_user_id bigint,
    ov_approved_filed_at timestamp without time zone,
    ov_payment_at timestamp without time zone,
    ov_payment_invoices character varying,
    finger_print character varying,
    ov_assets_approved_filed_amount bigint,
    ov_assets_approved_no_filed_amount bigint
);


--
-- Name: orders_visits_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_assets (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    asset_id bigint NOT NULL,
    before_unit_id bigint,
    before_tag_id bigint,
    before_tag_sub_id bigint,
    before_status_id bigint,
    before_status_at timestamp without time zone,
    before_comments text,
    before_img_file_path character varying,
    before_img_file_name character varying,
    before_latitude double precision,
    before_longitude double precision,
    before_unit_latitude double precision,
    before_unit_longitude double precision,
    before_priority_id smallint,
    after_unit_id bigint,
    after_tag_id bigint,
    after_tag_sub_id bigint,
    after_status_id bigint,
    after_status_at timestamp without time zone,
    after_comments character varying,
    after_img_file_path character varying,
    after_img_file_name character varying,
    after_latitude double precision,
    after_longitude double precision,
    after_unit_latitude double precision,
    after_unit_longitude double precision,
    after_priority_id smallint,
    is_moved boolean DEFAULT false,
    moved_comments text,
    has_recorder boolean null default true,
    before_recorder bigint,
    after_recorder bigint,
    processing_id bigint,
    o_id bigint,
    op_id bigint,
    activities_searchable text,
    reported_user_id bigint,
    reported_at timestamp without time zone,
    disapproved_user_id bigint,
    disapproved_at timestamp without time zone,
    disapproved_notes character varying,
    approved_user_id bigint,
    approved_at timestamp without time zone,
    revised_user_id bigint,
    revised_at timestamp without time zone,
    created_user_id bigint,
    created_at timestamp without time zone,
    created_latitude double precision,
    created_longitude double precision,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    cart_materials_amount bigint DEFAULT '0'::bigint,
    materials_value numeric DEFAULT '0'::numeric,
    services_value numeric DEFAULT '0'::numeric,
    vehicles_value numeric DEFAULT '0'::numeric,
    total_value numeric DEFAULT '0'::numeric,
    before_img_file_name_thumb character varying,
    after_img_file_name_thumb character varying,
    before_unit_asset_tag_id bigint,
    after_unit_asset_tag_id bigint,
    is_filed boolean DEFAULT false,
    before_location character varying,
    after_location character varying,
    activities_description text,
    maintenance_plan_id bigint,
    maintenance_plan_progress integer DEFAULT 0
);


--
-- Name: orders_visits_assets_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_assets_activities (
    id bigint NOT NULL,
    activity_id bigint NOT NULL,
    ova_id bigint NOT NULL,
    amount numeric DEFAULT '1'::numeric,
    ov_id bigint,
    o_id bigint,
    op_id bigint,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: orders_visits_assets_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_assets_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_assets_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_assets_materials (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    asset_id bigint NOT NULL,
    material_id bigint NOT NULL,
    amount numeric DEFAULT '1'::numeric,
    value_unit numeric DEFAULT '1'::numeric,
    value_total numeric DEFAULT '1'::numeric,
    discount numeric DEFAULT '1'::numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    comments character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    ova_id bigint
);


--
-- Name: orders_visits_assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_assets_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_extras (
    id bigint NOT NULL,
    order_id bigint,
    order_type_id bigint,
    order_mask text,
    date_start timestamp without time zone,
    date_end timestamp without time zone,
    status_id smallint,
    unit_id bigint,
    description text,
    team_leader_id bigint,
    created_at timestamp without time zone NOT NULL,
    created_user_id bigint,
    authorized_at timestamp without time zone,
    authorized_user_id bigint,
    processing_id bigint,
    o_type_id bigint,
    o_type_sub_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint
);


--
-- Name: orders_visits_extras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_extras ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_extras_teams (
    ove_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL
);


--
-- Name: orders_visits_extras_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_extras_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_services (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    service_id bigint NOT NULL,
    value_unit numeric,
    amount numeric,
    discount numeric,
    value_total numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    comments character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


--
-- Name: orders_visits_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_teams (
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying,
    order_id smallint
);


--
-- Name: orders_visits_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_visits_vehicles (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    vehicle_id bigint NOT NULL,
    recorder_start bigint DEFAULT '0'::bigint,
    recorder_end bigint DEFAULT '0'::bigint,
    amount bigint DEFAULT '0'::bigint,
    value_unit numeric DEFAULT '0'::numeric,
    value_total numeric DEFAULT '0'::numeric,
    discount numeric DEFAULT '1'::numeric,
    created_user_id bigint,
    created_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: orders_visits_vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders_visits_vehicles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: technicals_manuals_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technicals_manuals_assets (
    id bigint NOT NULL,
    tm_id bigint,
    asset_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);


--
-- Name: technicals_manuals_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.technicals_manuals_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.technicals_manuals_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: technicals_manuals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.technicals_manuals ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.technicals_manuals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: technicals_manuals_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.technicals_manuals_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.technicals_manuals_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.units ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_notifications (
    id bigint NOT NULL,
    user_id_to bigint NOT NULL,
    user_id_from bigint,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    unit_id bigint,
    img_url text,
    o_id bigint,
    v_id bigint,
    activity_id bigint,
    company_id bigint,
    token_fcm text,
    img_file_path text,
    img_file_name text,
    user_from_name_short text,
    page_target text,
    version_mode text,
    user_to_whatsapp text
);


--
-- Name: users_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users_notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_app; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_app AS
 SELECT cfg_app.id,
    cfg_app.apk_url,
    cfg_app.version_app,
    cfg_app.version_app_mask,
    cfg_app.logo_url,
    cfg_app.version_app_offline,
    cfg_app.n8n_available_last_at
   FROM public.cfg_app;


--
-- Name: v_app_offline_updates; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_app_offline_updates AS
 SELECT cfg_app_offline_updates.id,
    cfg_app_offline_updates.table_name,
    cfg_app_offline_updates.version_offline,
    cfg_app_offline_updates.updated_at
   FROM public.cfg_app_offline_updates
  ORDER BY cfg_app_offline_updates.table_name;


--
-- Name: v_app_pages; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_app_pages AS
 SELECT cfg_app_pages.id,
    cfg_app_pages.code,
    cfg_app_pages.description,
    cfg_app_pages.is_available_provider
   FROM public.cfg_app_pages;


--
-- Name: v_assets_available; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_available AS
 SELECT assets_available.id,
    assets_available.unit_id,
    units.description_full AS unit_description,
    assets_available.asset_tag_id,
    cfg_assets_tags.description AS tag_description,
    assets_available.asset_tag_sub_id,
    cfg_assets_tags_subs.description AS tag_sub_description,
    assets_available.is_available,
    assets_available.status_id,
    cfg_assets_statuses.description AS status_description,
    cfg_assets_statuses.code AS status_code,
    assets_available.file_path,
    assets_available.file_name,
    assets_available.processing_id,
    assets_available.is_on,
    cfg_assets_available_processing.description AS processing_description,
    assets_available.comments,
    assets_available.reported_at,
    assets_available.reported_user_id,
    users_reported.name_short AS reported_user_name_short,
    assets_available.created_at,
    assets_available.created_user_id,
    users_created.name_short AS created_user_name_short,
    assets_available.asset_unavailable_reason_id,
    cfg_assets_unavailable_reasons.description AS asset_unavailable_reason_description,
    cfg_assets_unavailable_reasons.code AS asset_unavailable_reason_code,
    assets_available.operation_record,
    assets_available.operation_unit,
    assets_available.flow_rate_unit,
    assets_available.flow_rate_min,
    assets_available.flow_rate_max,
    assets_available."Xflow_rate_is_on" AS flow_rate_is_on,
    assets_available."Xflow_rate_is_available" AS flow_rate_is_available,
    assets_available.power_unit,
    assets_available.power_min,
    assets_available.power_max,
    assets_available."Xpower_is_on" AS power_is_on,
    assets_available."Xpower_is_available" AS power_is_available,
    assets_available.pressure_min,
    assets_available.pressure_max,
    assets_available."Xpressure_is_on" AS pressure_is_on,
    assets_available."Xpressure_is_available" AS pressure_is_available,
    assets_available.company_id,
    assets_available.provider_company_id,
    cfg_providers_companies.img_file_path AS provider_company_img_file_path,
    cfg_providers_companies.img_file_name AS provider_company_img_file_name,
    assets_available.o_id,
    assets_available.o_mask,
    users_created.mobile_whatsapp,
    assets_available.unit_reported_distance_m
   FROM (((((((((public.assets_available
     LEFT JOIN public.cfg_assets_tags ON ((assets_available.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs ON ((assets_available.asset_tag_sub_id = cfg_assets_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses ON ((assets_available.status_id = cfg_assets_statuses.id)))
     LEFT JOIN public.cfg_assets_available_processing ON ((assets_available.processing_id = cfg_assets_available_processing.id)))
     LEFT JOIN public.cfg_assets_unavailable_reasons ON ((assets_available.asset_unavailable_reason_id = cfg_assets_unavailable_reasons.id)))
     LEFT JOIN public.users users_created ON ((assets_available.created_user_id = users_created.id)))
     LEFT JOIN public.users users_reported ON ((assets_available.reported_user_id = users_reported.id)))
     LEFT JOIN public.cfg_companies cfg_providers_companies ON ((assets_available.provider_company_id = cfg_providers_companies.id)))
     LEFT JOIN public.units ON ((assets_available.unit_id = units.id)))
  ORDER BY cfg_assets_tags.description, cfg_assets_tags_subs.description;


--
-- Name: v_assets_couplings_models; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_couplings_models AS
 SELECT cfg_assets_couplings_models.id,
    cfg_assets_couplings_models.code,
    cfg_assets_couplings_models.description,
    cfg_assets_couplings_models.is_available,
    cfg_assets_couplings_models.is_deleted,
    cfg_assets_couplings_models.version_mode
   FROM public.cfg_assets_couplings_models
  WHERE (cfg_assets_couplings_models.is_deleted = false)
  ORDER BY cfg_assets_couplings_models.description;


--
-- Name: v_assets_followers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_followers AS
 SELECT assets_followers.id,
    assets_followers.asset_id,
    assets_followers.user_id AS follower_id
   FROM public.assets_followers;


--
-- Name: v_assets_materials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_materials AS
 SELECT assets_materials.id,
    assets_materials.asset_id,
    materials.id AS material_id,
    materials.code AS material_code,
    materials.description AS material_description,
    materials.unit AS material_unit,
    assets_materials.amount,
    assets_materials.brand_model,
    assets_materials.location,
    assets_materials.is_original,
    assets_materials.version_mode
   FROM (public.assets_materials
     JOIN public.materials ON ((assets_materials.material_id = materials.id)))
  WHERE (assets_materials.is_deleted = false)
  ORDER BY materials.description;


--
-- Name: v_assets_priorities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_priorities AS
 SELECT cfg_assets_priorities.id,
    cfg_assets_priorities.code,
    cfg_assets_priorities.description,
    cfg_assets_priorities.is_available
   FROM public.cfg_assets_priorities
  ORDER BY cfg_assets_priorities.description;


--
-- Name: v_assets_statuses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_statuses AS
 SELECT cfg_assets_statuses.id,
    cfg_assets_statuses.code,
    cfg_assets_statuses.description,
    cfg_assets_statuses.is_available
   FROM public.cfg_assets_statuses
  ORDER BY cfg_assets_statuses.description;


--
-- Name: v_assets_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_tags AS
 SELECT cfg_assets_tags.id,
    cfg_assets_tags.company_id,
    cfg_assets_tags.code,
    cfg_assets_tags.description,
    cfg_assets_tags.is_available
   FROM public.cfg_assets_tags
  WHERE (cfg_assets_tags.is_deleted = false)
  ORDER BY cfg_assets_tags.description;


--
-- Name: v_assets_tags_subs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_tags_subs AS
 SELECT cfg_assets_tags_subs.id,
    cfg_assets_tags_subs.company_id,
    cfg_assets_tags_subs.code,
    cfg_assets_tags_subs.description,
    cfg_assets_tags_subs.is_available
   FROM public.cfg_assets_tags_subs
  WHERE (cfg_assets_tags_subs.is_deleted = false)
  ORDER BY cfg_assets_tags_subs.description;


--
-- Name: v_assets_types; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_types AS
 SELECT cfg_assets_types.id,
    cfg_assets_types.company_id,
    cfg_assets_types.code,
    cfg_assets_types.description,
    cfg_assets_types.is_available
   FROM public.cfg_assets_types
  WHERE (cfg_assets_types.is_deleted = false)
  ORDER BY cfg_assets_types.description;


--
-- Name: v_assets_unavailable_reasons; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assets_unavailable_reasons AS
 SELECT cfg_assets_unavailable_reasons.id,
    cfg_assets_unavailable_reasons.code,
    cfg_assets_unavailable_reasons.description,
    cfg_assets_unavailable_reasons.is_available
   FROM public.cfg_assets_unavailable_reasons
  ORDER BY cfg_assets_unavailable_reasons.description;


--
-- Name: v_companies; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_companies AS
 SELECT cfg_companies.id,
    cfg_companies.code,
    cfg_companies.description,
    cfg_companies.img_file_path,
    cfg_companies.img_file_name,
    cfg_companies.is_available,
    cfg_companies.email_sufix
   FROM public.cfg_companies
  ORDER BY cfg_companies.code;


--
-- Name: v_contracts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_contracts AS
 SELECT contracts.id,
    contracts.client_company_id,
    client_company.description AS client_company_description,
    contracts.client_department_id,
    contracts.provider_company_id,
    provider_company.description AS provider_company_description,
    provider_company.code AS provider_company_code,
    provider_company.img_file_name AS provider_company_img_file_name,
    provider_company.img_file_path AS provider_company_img_file_path,
    contracts.provider_department_id,
    contracts.code,
    (((contracts.description || ' ('::text) || (provider_company.code)::text) || ')'::text) AS description,
    contracts.status_id,
    cfg_contracts_statuses.code AS status_code,
    cfg_contracts_statuses.description AS status_description,
    contracts.is_available,
    contracts.is_deleted,
    contracts.version,
    contracts.default_ov_asset_id,
    contracts.default_activity_id,
    contracts.client_id
   FROM (((public.contracts
     JOIN public.cfg_companies provider_company ON ((contracts.provider_company_id = provider_company.id)))
     JOIN public.cfg_companies client_company ON ((contracts.client_company_id = client_company.id)))
     JOIN public.cfg_contracts_statuses ON ((contracts.status_id = cfg_contracts_statuses.id)))
  WHERE (contracts.is_deleted = false)
  ORDER BY client_company.description, provider_company.description;


--
-- Name: v_contracts_managers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_contracts_managers AS
 SELECT contracts_managers.id,
    contracts_managers.contract_id,
    contracts_managers.manager_id,
    contracts_managers.version_mode,
    users.name_full,
    users.name_short,
    users.email,
    users.img_file_path AS manager_img_file_path,
    users.img_file_name AS manager_img_file_name,
    users.is_admin_super,
    cfg_teams.code AS team_code
   FROM ((public.contracts_managers
     JOIN public.users ON ((contracts_managers.manager_id = users.id)))
     JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
  WHERE (contracts_managers.is_deleted = false);


--
-- Name: v_dash_admin_orders_parent_status_1; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_dash_admin_orders_parent_status_1 AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.contract_code,
    v_orders.unit_code,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.asset_tag_sub_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at,
    v_orders.asset_tag_sub_description
   FROM public.v_orders
  WHERE ((v_orders.status_id = 1) AND (v_orders.parent_id IS NULL));


--
-- Name: v_departments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_departments AS
 SELECT cfg_departments.id,
    cfg_departments.company_id,
    cfg_departments.code,
    cfg_departments.description,
    cfg_departments.is_available,
    cfg_departments.created_user_id,
    cfg_departments.created_at,
    cfg_departments.updated_user_id,
    cfg_departments.updated_at,
    cfg_departments.deleted_user_id,
    cfg_departments.deleted_at,
    cfg_departments.is_deleted,
    cfg_departments.version,
    cfg_departments.parent_id
   FROM public.cfg_departments;


--
-- Name: v_orders_cancel_reasons; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_cancel_reasons AS
 SELECT cfg_orders_cancel_reasons.id,
    cfg_orders_cancel_reasons.department_id,
    cfg_orders_cancel_reasons.description,
    cfg_orders_cancel_reasons.is_available,
    cfg_orders_cancel_reasons.is_deleted
   FROM public.cfg_orders_cancel_reasons
  WHERE (cfg_orders_cancel_reasons.is_deleted = false)
  ORDER BY cfg_orders_cancel_reasons.description;


--
-- Name: v_orders_causes_reasons; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_causes_reasons AS
 SELECT cfg_orders_causes_reasons.id,
    cfg_orders_causes_reasons.description,
    cfg_orders_causes_reasons.is_availabe,
    cfg_orders_causes_reasons.is_deleted
   FROM public.cfg_orders_causes_reasons
  WHERE (cfg_orders_causes_reasons.is_deleted = false)
  ORDER BY cfg_orders_causes_reasons.description;


--
-- Name: v_orders_counter; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_counter AS
 SELECT cfg_orders_counter.id,
    cfg_orders_counter.company_id,
    cfg_orders_counter.year,
    cfg_orders_counter.counter,
    cfg_orders_counter.is_dev,
    cfg_orders_counter.version
   FROM public.cfg_orders_counter;


--
-- Name: v_orders_followers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_followers AS
 SELECT orders_followers.id,
    orders_followers.user_id,
    orders_followers.o_id,
    orders_followers.version_mode
   FROM public.orders_followers;


--
-- Name: v_orders_objects; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_objects AS
 SELECT cfg_orders_objects.id,
    cfg_orders_objects.code,
    cfg_orders_objects.description
   FROM public.cfg_orders_objects
  ORDER BY cfg_orders_objects.description;


--
-- Name: v_orders_open; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_open AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.contract_code,
    v_orders.unit_code,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.asset_tag_sub_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at,
    v_orders.asset_tag_sub_description
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));


--
-- Name: v_orders_parent; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_parent AS
 SELECT v_orders.id,
    v_orders.uid,
    v_orders.parent_id,
    v_orders.company_id,
    v_orders.company_description,
    v_orders.company_img_file_path,
    v_orders.company_img_file_name,
    v_orders.img_file_path,
    v_orders.img_file_name,
    v_orders.department_id,
    v_orders.contract_id,
    v_orders.contract_description,
    v_orders.provider_company_id,
    v_orders.provider_company_description,
    v_orders.provider_company_img_file_path,
    v_orders.provider_company_img_file_name,
    v_orders.provider_department_id,
    v_orders.order_mask,
    v_orders.type_id,
    v_orders.type_code,
    v_orders.type_description,
    v_orders.type_sub_id,
    v_orders.type_sub_code,
    v_orders.type_sub_description,
    v_orders.requested_services,
    v_orders.object_id,
    v_orders.object_code,
    v_orders.object_description,
    v_orders.system_parent_id,
    v_orders.system_parent_description,
    v_orders.system_parent_code,
    v_orders.system_id,
    v_orders.system_description,
    v_orders.system_code,
    v_orders.unit_type_parent_id,
    v_orders.unit_type_parent_description,
    v_orders.unit_type_parent_code,
    v_orders.unit_type_id,
    v_orders.unit_type_description,
    v_orders.unit_type_code,
    v_orders.unit_id,
    v_orders.unit_description,
    v_orders.unit_address,
    v_orders.unit_latitude,
    v_orders.unit_longitude,
    v_orders.requester_name,
    v_orders.requester_phone,
    v_orders.requester_team_id,
    v_orders.requester_team_code,
    v_orders.requested_at,
    v_orders.status_id,
    v_orders.status_code,
    v_orders.status_description,
    v_orders.status_at,
    v_orders.priority_id,
    v_orders.priority_code,
    v_orders.priority_description,
    v_orders.team_leader_id,
    v_orders.team_leader_name_short,
    v_orders.team_leader_email,
    v_orders.team_id,
    v_orders.team_code,
    v_orders.team_description,
    v_orders.asset_tag_id,
    v_orders.asset_tag_description,
    v_orders.year,
    v_orders.counter_parent,
    v_orders.counter_child,
    v_orders.cause_reason_id,
    v_orders.cause_reason_description,
    v_orders.suspended_reason_id,
    v_orders.suspended_reason_description,
    v_orders.cancel_reason_id,
    v_orders.cancel_reason_description,
    v_orders.canceled_team_id,
    v_orders.canceled_team_code,
    v_orders.canceled_user_name_short,
    v_orders.plan_id,
    v_orders.plan_description,
    v_orders.plan_code,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    v_orders.version_mode,
    v_orders.created_user_id,
    v_orders.ov_counter,
    v_orders.progress,
    v_orders.contract_code,
    v_orders.unit_code,
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.asset_tag_sub_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at,
    v_orders.asset_tag_sub_description
   FROM public.v_orders
  WHERE (v_orders.parent_id IS NULL);


--
-- Name: v_orders_plans; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_plans AS
 SELECT cfg_orders_plans.id,
    cfg_orders_plans.code,
    cfg_orders_plans.description,
    cfg_orders_plans.color,
    cfg_orders_plans.is_available,
    cfg_orders_plans.created_user_id,
    cfg_orders_plans.created_at,
    cfg_orders_plans.updated_user_id,
    cfg_orders_plans.updated_at,
    cfg_orders_plans.deleted_user_id,
    cfg_orders_plans.deleted_at,
    cfg_orders_plans.is_deleted,
    cfg_orders_plans.department_id,
    cfg_orders_plans.version
   FROM public.cfg_orders_plans
  ORDER BY cfg_orders_plans.description;


--
-- Name: v_orders_priorities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_priorities AS
 SELECT cfg_orders_priorities.id,
    cfg_orders_priorities.code,
    cfg_orders_priorities.description
   FROM public.cfg_orders_priorities
  ORDER BY cfg_orders_priorities.description;


--
-- Name: v_orders_suspended_reasons; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_suspended_reasons AS
 SELECT cfg_orders_suspended_reasons.id,
    cfg_orders_suspended_reasons.department_id,
    cfg_orders_suspended_reasons.description,
    cfg_orders_suspended_reasons.is_available,
    cfg_orders_suspended_reasons.is_deleted
   FROM public.cfg_orders_suspended_reasons
  WHERE (cfg_orders_suspended_reasons.is_deleted = false)
  ORDER BY cfg_orders_suspended_reasons.description;


--
-- Name: v_orders_types; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_types AS
 SELECT cfg_orders_types.id,
    cfg_orders_types.parent_id,
    cfg_orders_types.code,
    cfg_orders_types.description,
    cfg_orders_types.is_available,
    cfg_orders_types.created_user_id,
    cfg_orders_types.created_at,
    cfg_orders_types.updated_user_id,
    cfg_orders_types.updated_at,
    cfg_orders_types.deleted_user_id,
    cfg_orders_types.deleted_at,
    cfg_orders_types.is_deleted,
    cfg_orders_types.department_id
   FROM public.cfg_orders_types
  WHERE (cfg_orders_types.is_deleted = false)
  ORDER BY cfg_orders_types.description;


--
-- Name: v_orders_types_subs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_types_subs AS
 SELECT cfg_orders_types_subs.id,
    cfg_orders_types_subs.order_type_id,
    cfg_orders_types_subs.parent_id,
    cfg_orders_types_subs.code,
    cfg_orders_types_subs.description,
    cfg_orders_types_subs.is_available,
    cfg_orders_types_subs.created_user_id,
    cfg_orders_types_subs.created_at,
    cfg_orders_types_subs.updated_user_id,
    cfg_orders_types_subs.updated_at,
    cfg_orders_types_subs.deleted_user_id,
    cfg_orders_types_subs.deleted_at,
    cfg_orders_types_subs.is_deleted,
    cfg_orders_types_subs.department_id
   FROM public.cfg_orders_types_subs
  WHERE (cfg_orders_types_subs.is_deleted = false)
  ORDER BY cfg_orders_types_subs.description;


--
-- Name: v_orders_visits; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits AS
 SELECT orders_visits.id,
    orders_visits.ov_mask,
    orders_visits.visit_counter,
    orders_visits.o_id,
    orders_visits.ov_approved_user_id,
    orders_visits.ov_approved_at,
    orders_visits.ov_disapproved_user_id,
    orders_visits.ov_disapproved_at,
    orders_visits.ov_started_at,
    orders_visits.ov_ended_at,
    orders_visits.ov_processing_id,
    orders_visits.ov_status_id,
    orders_visits.ov_reported_at,
    orders_visits.ov_reported_user_id,
    orders_visits.ov_team_leader_id,
    orders_visits.ov_assets_amount,
    orders_visits.ov_assets_approved_amount,
    orders_visits.ov_assets_disapproved_amount,
    orders_visits.ov_assets_reported_amount,
    orders_visits.ov_materials_value,
    orders_visits.ov_services_value,
    orders_visits.ov_vehicles_value,
    orders_visits.ov_created_user_id,
    orders_visits.ov_created_at,
    orders_visits.ov_updated_user_id,
    orders_visits.ov_updated_at,
    orders_visits.ov_deleted_user_id,
    orders_visits.is_deleted,
    orders_visits.ov_duration_hours,
    orders_visits.ov_disapproved_comments,
    orders_visits.ov_assets_draft_amount,
    orders_visits.is_canceled,
    orders_visits.ov_comments,
    orders_visits.o_cancel_reason_id,
    orders_visits.ov_created_latitude,
    orders_visits.ov_created_longitude,
    orders_visits.ov_total_value,
    orders_visits.ov_is_filed,
    orders_visits.ov_team_amount,
    orders_visits.ov_assets_revised_amount,
    orders_visits.ov_revised_user_id,
    orders_visits.ov_revised_at,
    orders_visits.ov_team_names_short,
    orders_visits.version_mode,
    orders_visits.ov_rpt_file_path,
    orders_visits.ov_rpt_file_name,
    orders_visits.ov_o_suspended_reason_id,
    orders_visits.ov_o_status_id,
    orders_visits.ov_o_progress,
    orders_visits.ov_img_file_path,
    orders_visits.ov_img_file_name,
    orders_visits.ov_pdf_file_path,
    orders_visits.ov_pdf_file_name,
    orders_visits.x_created_user_logon,
    orders_visits.x_created_user_id,
    orders_visits.x_interv_id,
    orders_visits.is_extra
   FROM public.orders_visits;


--
-- Name: v_orders_visits_assets_activities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_assets_activities AS
 SELECT orders_visits_assets_activities.id,
    orders_visits_assets_activities.activity_id,
    cfg_activities.description,
    orders_visits_assets_activities.amount,
    orders_visits_assets_activities.o_id,
    orders_visits_assets_activities.op_id,
    orders_visits_assets_activities.ova_id,
    orders_visits_assets_activities.ov_id,
    orders_visits_assets_activities.version_mode
   FROM (public.orders_visits_assets_activities
     JOIN public.cfg_activities ON ((orders_visits_assets_activities.activity_id = cfg_activities.id)))
  WHERE (orders_visits_assets_activities.is_deleted = false)
  ORDER BY cfg_activities.description;


--
-- Name: v_orders_visits_assets_materials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_assets_materials AS
 SELECT orders_visits_assets_materials.id,
    orders_visits_assets_materials.ov_id,
    orders_visits_assets_materials.ova_id,
    orders_visits_assets_materials.asset_id,
    materials.code,
    materials.description,
    materials.unit,
    orders_visits_assets_materials.amount,
    orders_visits_assets_materials.value_unit,
    orders_visits_assets_materials.discount,
    orders_visits_assets_materials.value_total,
    orders_visits_assets_materials.version_mode
   FROM (public.orders_visits_assets_materials
     JOIN public.materials ON ((orders_visits_assets_materials.material_id = materials.id)))
  WHERE (orders_visits_assets_materials.is_deleted = false)
  ORDER BY materials.description;


--
-- Name: v_orders_visits_assets; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_assets AS
SELECT
  orders_visits_assets.id,
  orders_visits_assets.op_id,
  orders_visits_assets.o_id,
  v_orders.order_mask as o_mask,
  v_orders.company_id as o_company_id,
  v_orders.company_img_file_path as o_company_img_file_path,
  v_orders.company_img_file_name as o_company_img_file_name,
  v_orders.type_id AS o_type_id,
  orders_visits_assets.ov_id,
  v_orders_visits.ov_mask,
  v_orders_visits.ov_started_at,
  v_orders_visits.ov_ended_at,
  v_orders_visits.o_team_code,
  v_orders_visits.o_team_leader_name_short,
  v_orders_visits.o_type_code,
  v_orders_visits.o_type_sub_code,
  orders_visits_assets.asset_id,
  assets.code,
  assets.description,
  orders_visits_assets.is_moved,
  orders_visits_assets.before_unit_id,
  before_units.code AS before_unit_code,
  before_units.description_full AS before_unit_description,
  before_units.latitude AS before_unit_latitude,
  before_units.longitude AS before_unit_longitude,
  orders_visits_assets.before_unit_asset_tag_id,
  orders_visits_assets.before_tag_id,
  before_tags.description AS before_tag_description,
  orders_visits_assets.before_tag_sub_id,
  before_tags_subs.description AS before_tag_sub_description,
  orders_visits_assets.before_status_id,
  before_status.description AS before_status_description,
  before_status.code AS before_status_code,
  before_status.color AS before_status_color,
  orders_visits_assets.before_status_at,
  orders_visits_assets.before_comments,
  orders_visits_assets.before_img_file_path,
  orders_visits_assets.before_img_files_names,
  orders_visits_assets.before_img_file_name,
  orders_visits_assets.before_img_file_name_thumb,
  orders_visits_assets.before_recorder,
  orders_visits_assets.before_latitude,
  orders_visits_assets.before_longitude,
  orders_visits_assets.before_priority_id,
  before_priorities.description AS before_priority_description,
  orders_visits_assets.after_unit_id,
  after_units.code AS after_unit_code,
  after_units.description_full AS after_unit_description,
  after_units.latitude AS after_unit_latitude,
  after_units.longitude AS after_unit_longitude,
  orders_visits_assets.after_unit_asset_tag_id,
  orders_visits_assets.after_tag_id,
  after_tags.description AS after_tag_description,
  orders_visits_assets.after_tag_sub_id,
  after_tags_subs.description AS after_tag_sub_description,
  orders_visits_assets.after_status_id,
  after_status.description AS after_status_description,
  after_status.code AS after_status_code,
  after_status.color AS after_status_color,
  orders_visits_assets.after_status_at,
  orders_visits_assets.after_comments,
  orders_visits_assets.after_img_file_path,
  orders_visits_assets.after_img_files_names,
  orders_visits_assets.after_img_file_name,
  orders_visits_assets.after_img_file_name_thumb,
  orders_visits_assets.after_recorder,
  orders_visits_assets.after_latitude,
  orders_visits_assets.after_longitude,
  orders_visits_assets.after_priority_id,
  after_priorities.description AS after_priority_description,
  orders_visits_assets.processing_id,
  cfg_orders_visits_processing.description AS processing_description,
  orders_visits_assets.moved_comments,
  orders_visits_assets.reported_user_id,
  users_reported.name_short AS reported_user_name_short,
  orders_visits_assets.reported_at,
  orders_visits_assets.disapproved_user_id,
  users_disapproved.name_short AS disapproved_user_name_short,
  orders_visits_assets.disapproved_at,
  orders_visits_assets.disapproved_notes,
  orders_visits_assets.approved_user_id,
  users_approved.name_short AS approved_user_name_short,
  orders_visits_assets.approved_at,
  orders_visits_assets.activities_searchable,
  orders_visits_assets.cart_materials_amount,
  orders_visits_assets.materials_value,
  orders_visits_assets.services_value,
  orders_visits_assets.vehicles_value,
  orders_visits_assets.total_value,
  orders_visits_assets.version_mode,
  orders_visits_assets.is_filed,
  orders_visits_assets.before_client_id,
  before_clients.name as before_client_name,
  orders_visits_assets.after_client_id,
  after_clients.name as after_client_name,
  orders_visits_assets.before_location,
  orders_visits_assets.after_location,
  orders_visits_assets.activities_description,
  orders_visits_assets.maintenance_plan_id,
  orders_visits_assets.maintenance_plan_progress,
  orders_visits_assets.has_recorder
FROM
  orders_visits_assets
  LEFT JOIN v_orders_visits ON orders_visits_assets.ov_id = v_orders_visits.id
  LEFT JOIN v_orders ON orders_visits_assets.o_id = v_orders.id
  LEFT JOIN assets ON orders_visits_assets.asset_id = assets.id
  LEFT JOIN cfg_assets_tags AS before_tags ON orders_visits_assets.before_tag_id = before_tags.id
  LEFT JOIN cfg_assets_tags_subs AS before_tags_subs ON orders_visits_assets.before_tag_sub_id = before_tags_subs.id
  LEFT JOIN cfg_assets_statuses AS before_status ON orders_visits_assets.before_status_id = before_status.id
  LEFT JOIN cfg_assets_tags AS after_tags ON orders_visits_assets.after_tag_id = after_tags.id
  LEFT JOIN cfg_assets_tags_subs AS after_tags_subs ON orders_visits_assets.after_tag_sub_id = after_tags_subs.id
  LEFT JOIN cfg_assets_statuses AS after_status ON orders_visits_assets.after_status_id = after_status.id
  LEFT JOIN cfg_orders_visits_processing ON orders_visits_assets.processing_id = cfg_orders_visits_processing.id
  LEFT JOIN units AS before_units ON orders_visits_assets.before_unit_id = before_units.id
  LEFT JOIN units AS after_units ON orders_visits_assets.after_unit_id = after_units.id
  LEFT JOIN users AS users_reported ON orders_visits_assets.reported_user_id = users_reported.id
  LEFT JOIN users AS users_disapproved ON orders_visits_assets.disapproved_user_id = users_disapproved.id
  LEFT JOIN users AS users_approved ON orders_visits_assets.approved_user_id = users_approved.id
  LEFT JOIN cfg_assets_priorities AS before_priorities ON orders_visits_assets.before_priority_id = before_priorities.id
  LEFT JOIN cfg_assets_priorities AS after_priorities ON orders_visits_assets.after_priority_id = after_priorities.id
  LEFT JOIN clients AS before_clients ON orders_visits_assets.before_client_id = before_clients.id
  LEFT JOIN clients AS after_clients ON orders_visits_assets.after_client_id = after_clients.id
WHERE
  orders_visits_assets.is_deleted = false;


--
-- Name: v_orders_visits_services; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_services AS
 SELECT orders_visits_services.id,
    orders_visits_services.ov_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    orders_visits_services.amount,
    orders_visits_services.value_unit,
    orders_visits_services.discount,
    orders_visits_services.value_total,
    orders_visits_services.version_mode
   FROM (public.orders_visits_services
     JOIN public.cfg_services ON ((orders_visits_services.service_id = cfg_services.id)))
  WHERE (orders_visits_services.is_deleted = false)
  ORDER BY cfg_services.description;


--
-- Name: v_orders_visits_teams; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_teams AS
 SELECT orders_visits_teams.ov_id,
    orders_visits_teams.is_leader,
    orders_visits_teams.user_id,
    users.name_short,
    users.img_file_path,
    users.img_file_name,
    orders_visits.ov_started_at,
    orders_visits.ov_ended_at,
    users.is_available,
    users.is_ov_in_progress,
    orders_visits_teams.version_mode
   FROM ((public.orders_visits_teams
     JOIN public.users ON ((orders_visits_teams.user_id = users.id)))
     JOIN public.orders_visits ON ((orders_visits_teams.ov_id = orders_visits.id)));


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    description character varying NOT NULL,
    plates character varying,
    model character varying,
    brand character varying,
    color character varying,
    year character varying,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    department_id bigint,
    value_unit numeric,
    unit text,
    discount numeric,
    finger_print character varying,
    created_user_id bigint,
    updated_user_id bigint
);


--
-- Name: v_orders_visits_vehicles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_orders_visits_vehicles AS
 SELECT orders_visits_vehicles.id,
    orders_visits_vehicles.ov_id,
    orders_visits_vehicles.vehicle_id,
    vehicles.description AS vehicle_description,
    vehicles.plates AS vehicle_plates,
    vehicles.unit,
    orders_visits_vehicles.recorder_start,
    orders_visits_vehicles.recorder_end,
    orders_visits_vehicles.amount,
    orders_visits_vehicles.value_unit,
    orders_visits_vehicles.value_total,
    orders_visits_vehicles.discount,
    orders_visits_vehicles.version_mode
   FROM (public.orders_visits_vehicles
     JOIN public.vehicles ON ((orders_visits_vehicles.vehicle_id = vehicles.id)))
  WHERE (orders_visits_vehicles.is_deleted = false);


--
-- Name: fc_financial_orders_visits_materials_sum(integer[]); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_financial_orders_visits_materials_sum;`n`nfc_financial_orders_visits_materials_sum(ov_ids integer[]) RETURNS TABLE(code text, description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    AS $$
  select
    vovam.code,
    vovam.description,
    vovam.unit,
    vovam.value_unit,
    vovam.discount,
    sum(vovam.amount) as amount_total,
    sum(vovam.value_total) as value_total
  from v_orders_visits_assets_materials vovam
  where vovam.ov_id = any(ov_ids)              -- filtra pela lista de ov_ids
  group by
    vovam.code,
    vovam.description,
    vovam.unit,
    vovam.value_unit,
    vovam.discount
  order by
    vovam.description;
$$;


--
-- Name: fc_financial_orders_visits_services_sum(integer[]); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_financial_orders_visits_services_sum;`n`nfc_financial_orders_visits_services_sum(ov_ids integer[]) RETURNS TABLE(code text, description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    AS $$
  select
    vos.code,
    vos.description,
    vos.unit,
    vos.value_unit,
    vos.discount,
    sum(vos.amount) as amount_total,
    sum(vos.value_total) as value_total
  from v_orders_visits_services vos
  where vos.ov_id = any(ov_ids)              -- filtra pela lista de ov_ids
  group by
    vos.code,
    vos.description,
    vos.unit,
    vos.value_unit,
    vos.discount
  order by
    vos.description;
$$;


--
-- Name: fc_financial_orders_visits_vehicles_sum(integer[]); Type: FUNCTION; Schema: public; Owner: -
--

DROP FUNCTION IF EXISTS public.fc_financial_orders_visits_vehicles_sum;`n`nfc_financial_orders_visits_vehicles_sum(ov_ids integer[]) RETURNS TABLE(vehicle_description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    AS $$
  select
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount,
    sum(vos.amount) as amount_total,
    sum(vos.value_total) as value_total
  from v_orders_visits_vehicles vos
  where vos.ov_id = any(ov_ids)              -- filtra pela lista de ov_ids
  group by
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount
  order by
    vos.vehicle_description;
$$;


--
-- Name: v_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_profiles AS
 SELECT cfg_profiles.id,
    cfg_profiles.description,
    cfg_profiles.department_id,
    cfg_profiles.version
   FROM public.cfg_profiles;


--
-- Name: v_profiles_permissions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_profiles_permissions AS
 SELECT cfg_profiles_permissions.id,
    cfg_profiles_permissions.profile_id,
    cfg_profiles_permissions.app_page_id,
    cfg_app_pages.description AS app_page_description
   FROM (public.cfg_profiles_permissions
     JOIN public.cfg_app_pages ON ((cfg_profiles_permissions.app_page_id = cfg_app_pages.id)))
  ORDER BY cfg_profiles_permissions.profile_id, cfg_app_pages.description;


--
-- Name: v_services; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_services AS
 SELECT cfg_services.id,
    cfg_services.description,
    cfg_services.unit,
    cfg_services.is_available,
    cfg_services.is_deleted,
    cfg_services.version_mode,
    cfg_services.code,
    cfg_services.finger_print,
    cfg_services.updated_user_id,
    cfg_services.updated_at,
    cfg_services.company_id,
    cfg_services.created_at,
    cfg_services.created_user_id
   FROM public.cfg_services
  WHERE (cfg_services.is_deleted = false)
  ORDER BY cfg_services.description;


--
-- Name: v_systems; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_systems AS
 SELECT cfg_systems.id,
    cfg_systems.company_id,
    cfg_systems.parent_id,
    cfg_systems.code,
    cfg_systems.description,
    cfg_systems.is_available
   FROM public.cfg_systems
  WHERE ((cfg_systems.parent_id > 0) AND (cfg_systems.is_deleted = false))
  ORDER BY cfg_systems.description;


--
-- Name: v_systems_parent_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_systems_parent_assets_tags_available_rate AS
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.asset_tag_description,
    v.flow_rate_is_visible,
    (sum(v.total_flow_rate_max))::numeric AS total_flow_rate_max,
    (sum(v.total_flow_rate_last))::numeric AS total_flow_rate_last,
    v.flow_rate_unit,
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric)
        END AS pct_flow_rate_available_fraction,
    (
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_flow_rate_available_percent,
    v.power_is_visible,
    (sum(v.total_power_max))::numeric AS total_power_max,
    (sum(v.total_power_last))::numeric AS total_power_last,
    v.power_unit,
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric)
        END AS pct_power_available_fraction,
    (
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_power_available_percent,
    v.pressure_is_visible,
    (sum(v.total_pressure_max))::numeric AS total_pressure_max,
    (sum(v.total_pressure_last))::numeric AS total_pressure_last,
    v.pressure_unit,
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric)
        END AS pct_pressure_available_fraction,
    (
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_pressure_available_percent,
    ((sum(v.total_last_asset_available_rate))::numeric / (NULLIF(count(*), 0))::numeric) AS avg_last_asset_available_rate,
    count(*) AS total_units
   FROM ( SELECT uat.unit_id,
            uat.unit_code,
            uat.system_parent_id,
            uat.asset_tag_id,
            uat.tag_description AS asset_tag_description,
            uat.flow_rate_is_visible,
            COALESCE(sum(uat.flow_rate_max), (0)::double precision) AS total_flow_rate_max,
            COALESCE(sum(uat.last_flow_rate), (0)::double precision) AS total_flow_rate_last,
            uat.flow_rate_unit,
            uat.power_is_visible,
            COALESCE(sum(uat.power_max), (0)::double precision) AS total_power_max,
            COALESCE(sum(uat.last_power), (0)::double precision) AS total_power_last,
            uat.power_unit,
            uat.pressure_is_visible,
            COALESCE(sum(uat.pressure_max), (0)::double precision) AS total_pressure_max,
            COALESCE(sum(uat.last_pressure), (0)::double precision) AS total_pressure_last,
            uat.pressure_unit,
            COALESCE(sum(uat.last_asset_available_rate), (0)::double precision) AS total_last_asset_available_rate
           FROM public.v_units_assets_tags uat
          WHERE (uat.is_deleted = false)
          GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description, uat.flow_rate_is_visible, uat.flow_rate_unit, uat.power_is_visible, uat.power_unit, uat.pressure_is_visible, uat.pressure_unit) v
  GROUP BY v.system_parent_id, v.asset_tag_id, v.asset_tag_description, v.flow_rate_is_visible, v.flow_rate_unit, v.power_is_visible, v.power_unit, v.pressure_is_visible, v.pressure_unit
  ORDER BY v.system_parent_id, v.asset_tag_description;


--
-- Name: v_systems_parent_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_systems_parent_assets_tags_processing_counts AS
 SELECT ca.asset_tag_id,
    ca.last_processing_id,
    u.system_parent_id,
    count(*) AS total
   FROM (public.cfg_units_assets_tags ca
     JOIN public.units u ON ((u.id = ca.unit_id)))
  WHERE ((ca.is_deleted = false) AND (u.is_deleted = false))
  GROUP BY ca.asset_tag_id, ca.last_processing_id, u.system_parent_id;


--
-- Name: v_teams; Type: VIEW; Schema: public; Owner: -
--

DROP VIEW IF EXISTS public.v_teams;

CREATE VIEW public.v_teams AS
 SELECT cfg_teams.id,
    cfg_teams.parent_id,
    cfg_teams.code,
    cfg_teams.description,
    cfg_teams.department_id,
    cfg_teams.is_available,
    cfg_teams.sort_order,
    cfg_teams.img_url,
    cfg_teams.users_total,
    cfg_teams.company_id,
    cfg_teams.created_user_id,
    cfg_teams.created_at,
    cfg_teams.updated_user_id,
    cfg_teams.updated_at,
    cfg_teams.deleted_user_id,
    cfg_teams.deleted_at,
    cfg_teams.is_deleted,
    cfg_teams.version
   FROM public.cfg_teams
  WHERE (cfg_teams.is_deleted = false)
  ORDER BY cfg_teams.sort_order, cfg_teams.description;


--
-- Name: v_teams_leaders; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_teams_leaders AS
 SELECT v_users.id,
    v_users.uuid,
    v_users.company_id,
    v_users.company_code,
    v_users.company_description,
    v_users.company_img_file_path,
    v_users.company_img_file_name,
    v_users.company_email_sufix,
    v_users.company_is_available,
    v_users.department_id,
    v_users.department_code,
    v_users.department_description,
    v_users.email,
    v_users.name_short,
    v_users.name_full,
    v_users.team_id,
    v_users.team_code,
    v_users.team_description,
    v_users.team_amount,
    v_users.team_id_previous,
    v_users.status_id,
    v_users.status_code,
    v_users.status_description,
    v_users.is_team_leader,
    v_users.is_admin,
    v_users.is_admin_super,
    v_users.img_file_path,
    v_users.img_file_name,
    v_users.ov_id_in_progress,
    v_users.ov_id_in_progress_mask,
    v_users.o_id_in_progress,
    v_users.op_id_in_progress,
    v_users.ov_in_progress_leader_id,
    v_users.profile_id,
    v_users.profile_description,
    v_users.vehicle_id,
    v_users.is_available,
    v_users.is_ov_in_progress,
    v_users.version_app,
    v_users.o_contract_id_in_progress,
    v_users.o_type_id_in_progress,
    v_users.o_type_sub_id_in_progress,
    v_users.o_plan_id_in_progress,
    v_users.o_asset_tag_id_in_progress,
    v_users.o_unit_id_in_progress,
    v_users.o_system_id_in_progress,
    v_users.o_system_parent_id_in_progress,
    v_users.o_unit_type_id_in_progress,
    v_users.o_object_id_in_progress,
    v_users.token_fcm,
    v_users.notifications_amount,
    v_users.mobile,
    v_users.mobile_full,
    v_users.mobile_mask,
    v_users.mobile_whatsapp,
    v_users.latitude,
    v_users.longitude,
    v_users.tracker_interval_seconds
   FROM public.v_users
  WHERE ((v_users.is_team_leader = true) AND (v_users.status_id = 2));


--
-- Name: v_unit_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_unit_assets_tags_processing_counts AS
 SELECT ca.unit_id,
    ca.asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id
  ORDER BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id;


--
-- Name: v_units_asset_available_rate_avg; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_asset_available_rate_avg AS
 WITH last_dates AS (
         SELECT v_units_by_assets_tags.asset_tag_id,
            max(v_units_by_assets_tags.last_reported_at) AS last_reported_at
           FROM public.v_units_by_assets_tags
          GROUP BY v_units_by_assets_tags.asset_tag_id
        )
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.tag_description,
    avg(v.total_last_asset_available_rate) AS units_asset_available_rate_avg
   FROM (public.v_units_by_assets_tags v
     LEFT JOIN last_dates ld ON (((v.asset_tag_id = ld.asset_tag_id) AND (v.last_reported_at = ld.last_reported_at))))
  WHERE (ld.last_reported_at IS NULL)
  GROUP BY v.system_parent_id, v.asset_tag_id, v.tag_description
  ORDER BY (avg(v.total_last_asset_available_rate));


--
-- Name: v_units_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_assets_tags_available_rate AS
 SELECT uat.unit_id,
    uat.unit_code,
    uat.system_parent_id,
    uat.asset_tag_id,
    uat.tag_description AS asset_tag_description,
    sum(uat.power_max) AS total_power_max,
    uat.power_unit,
    uat.power_is_visible,
    sum(uat.flow_rate_max) AS total_flow_rate_max,
    uat.flow_rate_unit,
    uat.flow_rate_is_visible,
    sum(uat.pressure_max) AS total_pressure_max,
    uat.pressure_unit,
    uat.pressure_is_visible,
    sum(uat.last_power) AS total_last_power,
    sum(uat.last_flow_rate) AS total_last_flow_rate,
    sum(uat.last_pressure) AS total_last_pressure,
    sum(uat.last_asset_available_rate) AS total_last_asset_available_rate,
    max(uat.last_reported_at) AS last_reported_at
   FROM public.v_units_assets_tags uat
  WHERE (uat.is_deleted = false)
  GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description, uat.power_unit, uat.power_is_visible, uat.flow_rate_unit, uat.flow_rate_is_visible, uat.pressure_unit, uat.pressure_is_visible
  ORDER BY uat.tag_description;


--
-- Name: v_units_assets_tags_available_rate_latest_by_user; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_assets_tags_available_rate_latest_by_user AS
 WITH ranked_updates AS (
         SELECT v.unit_id,
            v.system_parent_id,
            v.asset_tag_id,
            v.last_reported_user_id,
            v.last_reported_at,
            v.unit_description,
            u.name_short,
            u.img_file_path,
            u.img_file_name,
            row_number() OVER (PARTITION BY v.unit_id, v.asset_tag_id ORDER BY v.last_reported_at DESC) AS rn
           FROM (public.v_units_assets_tags v
             LEFT JOIN public.users u ON ((v.last_reported_user_id = u.id)))
          WHERE (v.last_reported_at IS NOT NULL)
        )
 SELECT ranked_updates.unit_id,
    ranked_updates.system_parent_id,
    ranked_updates.asset_tag_id,
    ranked_updates.last_reported_user_id,
    ranked_updates.name_short,
    ranked_updates.img_file_path,
    ranked_updates.img_file_name,
    ranked_updates.last_reported_at,
    ranked_updates.unit_description
   FROM ranked_updates
  WHERE (ranked_updates.rn = 1);


--
-- Name: v_units_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_units_assets_tags_processing_counts AS
 SELECT ca.id AS unit_asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.id, ca.last_processing_id
  ORDER BY ca.id, ca.last_processing_id;


--
-- Name: v_vehicles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_vehicles AS
 SELECT vehicles.id,
    vehicles.company_id,
    vehicles.description,
    vehicles.plates,
    vehicles.model,
    vehicles.brand,
    vehicles.color,
    vehicles.year,
    vehicles.is_available,
    vehicles.created_at,
    vehicles.updated_at,
    vehicles.is_deleted,
    vehicles.department_id,
    vehicles.value_unit,
    vehicles.unit,
    vehicles.discount,
    vehicles.finger_print,
    vehicles.created_user_id,
    vehicles.updated_user_id
   FROM public.vehicles
  ORDER BY vehicles.plates;


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: cfg_app app_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app
    ADD CONSTRAINT app_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_pages apppages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_pages
    ADD CONSTRAINT apppages_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_attributes assets_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_attributes assets_attributes_type_field_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_type_field_key_unique UNIQUE (asset_type_id, field_key);


--
-- Name: assets_attributes_values assets_attributes_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_pkey PRIMARY KEY (id);


--
-- Name: assets_attributes_values assets_attributes_values_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_unique UNIQUE (asset_id, attribute_id);


--
-- Name: assets_followers assets_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_followers
    ADD CONSTRAINT assets_followers_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_priorities assets_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_priorities
    ADD CONSTRAINT assets_priorities_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_statuses assets_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_statuses
    ADD CONSTRAINT assets_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_tags
    ADD CONSTRAINT assets_tags_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags_subs assets_tags_subs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_tags_subs
    ADD CONSTRAINT assets_tags_subs_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types assets_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_types
    ADD CONSTRAINT assets_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_couplings_models assetscouplingsmodels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_couplings_models
    ADD CONSTRAINT assetscouplingsmodels_pkey PRIMARY KEY (id);


--
-- Name: assets_materials assetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_materials
    ADD CONSTRAINT assetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: assets_available asseys_available_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT asseys_available_pkey PRIMARY KEY (id);


--
-- Name: carts_materials cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts_materials
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_offline_updates cfg_app_offline_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_offline_updates
    ADD CONSTRAINT cfg_app_offline_tables_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_available_processing cfg_assets_available_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_available_processing
    ADD CONSTRAINT cfg_assets_available_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_unavailable_reasons cfg_assets_unavailable_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_unavailable_reasons
    ADD CONSTRAINT cfg_assets_unavailable_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_suspended_reasons cfg_orders_suspended_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_suspended_reasons
    ADD CONSTRAINT cfg_orders_suspended_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_extras_processing cfg_orders_visits_extras_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_visits_extras_processing
    ADD CONSTRAINT cfg_orders_visits_extras_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_routes cfg_routes_route_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT cfg_routes_route_key_key UNIQUE (route_key);


--
-- Name: cfg_services cfg_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_services
    ADD CONSTRAINT cfg_services_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: cfg_companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contracts_managers contracts_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_pkey PRIMARY KEY (id);


--
-- Name: contracts_managers contracts_managers_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_unique UNIQUE (contract_id, manager_id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: cfg_contracts_statuses contracts_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_contracts_statuses
    ADD CONSTRAINT contracts_statuses_pkey PRIMARY KEY (id);


--
-- Name: contracts_services contractsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts_services
    ADD CONSTRAINT contractsservices_pkey PRIMARY KEY (id);


--
-- Name: cfg_departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras_teams eap_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT eap_teams_pkey PRIMARY KEY (id);


--
-- Name: jr_assets jr_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jr_assets
    ADD CONSTRAINT jr_assets_pkey PRIMARY KEY (id);


--
-- Name: jr_units jr_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jr_units
    ADD CONSTRAINT jr_units_pkey PRIMARY KEY (id);


--
-- Name: audits_logs audits_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audits_logs
    ADD CONSTRAINT audits_logs_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_counter orders_counter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_counter
    ADD CONSTRAINT orders_counter_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_objects orders_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_objects
    ADD CONSTRAINT orders_objects_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_plans orders_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_plans
    ADD CONSTRAINT orders_plans_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_priorities orders_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_priorities
    ADD CONSTRAINT orders_priorities_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_activities orders_types_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_activities
    ADD CONSTRAINT orders_types_activities_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types orders_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types
    ADD CONSTRAINT orders_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_subs_activities orders_types_subs_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs_activities
    ADD CONSTRAINT orders_types_subs_activities_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_subs orders_types_subs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs
    ADD CONSTRAINT orders_types_subs_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras orders_visits_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_cancel_reasons orderscancelreasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_cancel_reasons
    ADD CONSTRAINT orderscancelreasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_causes_reasons orderscauses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_causes_reasons
    ADD CONSTRAINT orderscauses_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_statuses ordersstatusess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_statuses
    ADD CONSTRAINT ordersstatusess_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets_materials ordersvisitsassetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_visits_assets_materials
    ADD CONSTRAINT ordersvisitsassetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_services ordersvisitsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_visits_services
    ADD CONSTRAINT ordersvisitsservices_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_vehicles ordersvisitsvehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_visits_vehicles
    ADD CONSTRAINT ordersvisitsvehicles_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access profiles_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access profiles_access_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_unique UNIQUE (profile_id, route_id);


--
-- Name: cfg_profiles_permissions profiles_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_permissions
    ADD CONSTRAINT profiles_permissions_pkey PRIMARY KEY (id);


--
-- Name: cfg_routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: cfg_systems systems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (id);


--
-- Name: cfg_teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_statuses units_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_units_statuses
    ADD CONSTRAINT units_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_types units_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_units_types
    ADD CONSTRAINT units_types_pkey PRIMARY KEY (id);


--
-- Name: users_notifications users_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_key UNIQUE (uuid);


--
-- Name: cfg_profiles usersprofiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT usersprofiles_pkey PRIMARY KEY (id);


--
-- Name: cfg_users_statuses usersstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_users_statuses
    ADD CONSTRAINT usersstatuses_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_id_key UNIQUE (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: idx_cfg_units_assets_tags_agg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_units_assets_tags_agg ON public.cfg_units_assets_tags USING btree (asset_tag_id, last_processing_id, is_deleted);


--
-- Name: idx_cfg_units_assets_tags_unit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_units_assets_tags_unit_id ON public.cfg_units_assets_tags USING btree (unit_id);


--
-- Name: idx_profiles_access_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_access_profile_id ON public.cfg_profiles_access USING btree (profile_id);


--
-- Name: idx_routes_route_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_routes_route_key ON public.cfg_routes USING btree (route_key);


--
-- Name: idx_units_id_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_id_parent ON public.units USING btree (id, system_parent_id);


--
-- Name: idx_units_is_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_is_deleted ON public.units USING btree (is_deleted);


--
-- Name: idx_units_unit_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_unit_type_id ON public.units USING btree (unit_type_id);


--
-- Name: assets_attributes_values on_assets_attributes_values_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_assets_attributes_values_updated BEFORE UPDATE ON public.assets_attributes_values FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: assets on_assets_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_assets_updated BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_activities on_cfg_activities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_activities_updated BEFORE UPDATE ON public.cfg_activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_attributes on_cfg_assets_attributes_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_attributes_updated BEFORE UPDATE ON public.cfg_assets_attributes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_priorities on_cfg_assets_priorities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_priorities_updated BEFORE UPDATE ON public.cfg_assets_priorities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_statuses on_cfg_assets_statuses_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_statuses_updated BEFORE UPDATE ON public.cfg_assets_statuses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_tags_subs on_cfg_assets_tags_subs_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_tags_subs_updated BEFORE UPDATE ON public.cfg_assets_tags_subs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_tags on_cfg_assets_tags_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_tags_updated BEFORE UPDATE ON public.cfg_assets_tags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_assets_types on_cfg_assets_types_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_assets_types_updated BEFORE UPDATE ON public.cfg_assets_types FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_companies on_cfg_companies_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_companies_updated BEFORE UPDATE ON public.cfg_companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_contracts_statuses on_cfg_contracts_statuses_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_contracts_statuses_updated BEFORE UPDATE ON public.cfg_contracts_statuses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_departments on_cfg_departments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_departments_updated BEFORE UPDATE ON public.cfg_departments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_objects on_cfg_orders_objects_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_objects_updated BEFORE UPDATE ON public.cfg_orders_objects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_plans on_cfg_orders_plans_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_plans_updated BEFORE UPDATE ON public.cfg_orders_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_priorities on_cfg_orders_priorities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_priorities_updated BEFORE UPDATE ON public.cfg_orders_priorities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_types_activities on_cfg_orders_types_activities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_types_activities_updated BEFORE UPDATE ON public.cfg_orders_types_activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_types_subs_activities on_cfg_orders_types_subs_activities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_types_subs_activities_updated BEFORE UPDATE ON public.cfg_orders_types_subs_activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_types_subs on_cfg_orders_types_subs_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_types_subs_updated BEFORE UPDATE ON public.cfg_orders_types_subs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_orders_types on_cfg_orders_types_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_orders_types_updated BEFORE UPDATE ON public.cfg_orders_types FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_systems on_cfg_systems_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_systems_updated BEFORE UPDATE ON public.cfg_systems FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_teams on_cfg_teams_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_teams_updated BEFORE UPDATE ON public.cfg_teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_units_statuses on_cfg_units_statuses_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_units_statuses_updated BEFORE UPDATE ON public.cfg_units_statuses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cfg_units_types on_cfg_units_types_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_cfg_units_types_updated BEFORE UPDATE ON public.cfg_units_types FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: clients on_clients_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: users_notifications on_notifications_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_notifications_count AFTER INSERT OR DELETE OR UPDATE ON public.users_notifications FOR EACH ROW EXECUTE FUNCTION public.handle_notifications_count();


--
-- Name: users on_profile_photo_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_photo_change AFTER UPDATE OF img_file_name ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_profile_photo_change_notification();


--
-- Name: units on_unit_description_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_unit_description_update BEFORE INSERT OR UPDATE OF code, description, unit_type_id ON public.units FOR EACH ROW EXECUTE FUNCTION public.handle_unit_description_full();


--
-- Name: units on_units_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: users on_users_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: vehicles on_vehicles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: assets tgr_assets_searchable_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_assets_searchable_update BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.fc_assets_searchable_update();


--
-- Name: cfg_units_assets_tags tgr_cfg_units_assets_tags_set_last_values_when_processing_2; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_cfg_units_assets_tags_set_last_values_when_processing_2 BEFORE UPDATE ON public.cfg_units_assets_tags FOR EACH ROW EXECUTE FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2();


--
-- Name: materials tgr_materials_searchable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_materials_searchable BEFORE INSERT OR UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.fc_materials_searchable();


--
-- Name: orders tgr_orders_sanitize_requested_services; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_orders_sanitize_requested_services BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_replace_special_chars();


--
-- Name: orders_visits_assets_activities tgr_orders_visits_assets_activities_description; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_orders_visits_assets_activities_description AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_activities FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_activities_description();


--
-- Name: orders_visits_assets_materials tgr_orders_visits_assets_materials_update_value_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_orders_visits_assets_materials_update_value_total BEFORE INSERT OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_materials_update_value_total();


--
-- Name: orders_visits_services tgr_orders_visits_services_amount_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_orders_visits_services_amount_update BEFORE INSERT OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_amount_update();


--
-- Name: orders_visits_vehicles tgr_orders_visits_vehicles_amount_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_orders_visits_vehicles_amount_update BEFORE INSERT OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_amount_update();


--
-- Name: units tgr_units_searchable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tgr_units_searchable BEFORE INSERT OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.fc_tgr_units_searchable();


--
-- Name: orders_visits_assets_materials trg_orders_visits_assets_update_materials_value; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_assets_update_materials_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_materials_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_services_value; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_services_update_services_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_services_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_value_unit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_services_update_value_unit BEFORE INSERT ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_value_unit();


--
-- Name: orders_visits_teams trg_orders_visits_teams_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_teams_update AFTER INSERT OR DELETE ON public.orders_visits_teams FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_teams_update();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_update_value_unit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_vehicles_update_value_unit BEFORE INSERT ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_update_value_unit();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_update_vehicles_value; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_visits_vehicles_update_vehicles_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value();


--
-- Name: assets_attributes_values assets_attributes_values_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: assets_attributes_values assets_attributes_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.cfg_assets_attributes(id) ON DELETE CASCADE;


--
-- Name: assets assets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: assets assets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_company_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_owner_id_fkey FOREIGN KEY (company_owner_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: assets assets_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.cfg_assets_types(id) ON DELETE SET NULL;


--
-- Name: assets assets_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: assets assets_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;


--
-- Name: cfg_assets_attributes cfg_assets_attributes_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT cfg_assets_attributes_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.cfg_assets_types(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_tags_subs cfg_assets_tags_subs_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_assets_tags_subs
    ADD CONSTRAINT cfg_assets_tags_subs_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_assets_tags(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_activities cfg_orders_types_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_activities
    ADD CONSTRAINT cfg_orders_types_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.cfg_activities(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_activities cfg_orders_types_activities_order_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_activities
    ADD CONSTRAINT cfg_orders_types_activities_order_type_id_fkey FOREIGN KEY (o_type_id) REFERENCES public.cfg_orders_types(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_subs_activities cfg_orders_types_subs_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs_activities
    ADD CONSTRAINT cfg_orders_types_subs_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.cfg_activities(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_subs_activities cfg_orders_types_subs_activities_order_type_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs_activities
    ADD CONSTRAINT cfg_orders_types_subs_activities_order_type_sub_id_fkey FOREIGN KEY (order_type_sub_id) REFERENCES public.cfg_orders_types_subs(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_subs cfg_orders_types_subs_order_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs
    ADD CONSTRAINT cfg_orders_types_subs_order_type_id_fkey FOREIGN KEY (order_type_id) REFERENCES public.cfg_orders_types(id) ON DELETE CASCADE;


--
-- Name: cfg_orders_types_subs cfg_orders_types_subs_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types_subs
    ADD CONSTRAINT cfg_orders_types_subs_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_orders_types(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_client_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_client_company_fkey FOREIGN KEY (client_company_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_client_department_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_client_department_fkey FOREIGN KEY (client_department_id) REFERENCES public.cfg_departments(id) ON DELETE SET NULL;


--
-- Name: contracts_managers contracts_managers_contract_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_contract_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contracts_managers contracts_managers_manager_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_manager_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_provider_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_provider_company_fkey FOREIGN KEY (provider_company_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_provider_department_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_provider_department_fkey FOREIGN KEY (provider_department_id) REFERENCES public.cfg_departments(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_status_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_contracts_statuses(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_unit_client_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_unit_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: cfg_departments departments_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_departments
    ADD CONSTRAINT departments_company_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE CASCADE;


--
-- Name: cfg_departments departments_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_departments
    ADD CONSTRAINT departments_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_departments(id) ON DELETE SET NULL;


--
-- Name: cfg_orders_types orders_types_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_orders_types
    ADD CONSTRAINT orders_types_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_orders_types(id) ON DELETE SET NULL;


--
-- Name: cfg_profiles_access profiles_access_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_access profiles_access_route_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_route_fkey FOREIGN KEY (route_id) REFERENCES public.cfg_routes(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_permissions profiles_permissions_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles_permissions
    ADD CONSTRAINT profiles_permissions_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles public_usersprofiles_departmentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT public_usersprofiles_departmentid_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cfg_routes routes_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_routes(id) ON DELETE SET NULL;


--
-- Name: cfg_systems systems_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_systems
    ADD CONSTRAINT systems_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_systems(id) ON DELETE SET NULL;


--
-- Name: cfg_teams teams_department_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_teams
    ADD CONSTRAINT teams_department_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;


--
-- Name: units units_client_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: units units_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_company_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: units units_provider_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_provider_company_fkey FOREIGN KEY (provider_company_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: units units_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_status_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_units_statuses(id) ON DELETE SET NULL;


--
-- Name: units units_sub_system_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_sub_system_fkey FOREIGN KEY (system_id) REFERENCES public.cfg_systems(id) ON DELETE SET NULL;


--
-- Name: units units_sub_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_sub_type_fkey FOREIGN KEY (unit_type_id) REFERENCES public.cfg_units_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: units units_system_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_system_fkey FOREIGN KEY (system_parent_id) REFERENCES public.cfg_systems(id) ON DELETE SET NULL;


--
-- Name: units units_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_type_fkey FOREIGN KEY (unit_type_parent_id) REFERENCES public.cfg_units_types(id) ON DELETE SET NULL;


--
-- Name: cfg_units_types units_types_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_units_types
    ADD CONSTRAINT units_types_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_units_types(id) ON DELETE SET NULL;


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE SET NULL;


--
-- Name: users_notifications users_notifications_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_notifications users_notifications_user_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_to_fkey FOREIGN KEY (user_id_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE SET NULL;


--
-- Name: users users_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_users_statuses(id) ON DELETE CASCADE;


--
-- Name: users users_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.cfg_teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicles vehicles_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_company_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE CASCADE;


--
-- Name: assets Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.assets USING (true);


--
-- Name: assets_attributes_values Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.assets_attributes_values USING (true);


--
-- Name: cfg_activities Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_activities USING (true);


--
-- Name: cfg_assets_attributes Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_attributes USING (true);


--
-- Name: cfg_assets_priorities Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_priorities USING (true);


--
-- Name: cfg_assets_statuses Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_statuses USING (true);


--
-- Name: cfg_assets_tags Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_tags USING (true);


--
-- Name: cfg_assets_tags_subs Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_tags_subs USING (true);


--
-- Name: cfg_assets_types Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_assets_types USING (true);


--
-- Name: cfg_companies Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_companies USING (true);


--
-- Name: cfg_contracts_statuses Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_contracts_statuses USING (true);


--
-- Name: cfg_departments Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_departments USING (true);


--
-- Name: cfg_orders_objects Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_objects USING (true);


--
-- Name: cfg_orders_plans Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_plans USING (true);


--
-- Name: cfg_orders_priorities Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_priorities USING (true);


--
-- Name: cfg_orders_types Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_types USING (true);


--
-- Name: cfg_orders_types_activities Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_types_activities USING (true);


--
-- Name: cfg_orders_types_subs Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_types_subs USING (true);


--
-- Name: cfg_orders_types_subs_activities Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_orders_types_subs_activities USING (true);


--
-- Name: cfg_profiles Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_profiles USING (true);


--
-- Name: cfg_profiles_access Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_profiles_access USING (true);


--
-- Name: cfg_profiles_permissions Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_profiles_permissions USING (true);


--
-- Name: cfg_routes Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_routes USING (true);


--
-- Name: cfg_systems Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_systems USING (true);


--
-- Name: cfg_teams Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_teams USING (true);


--
-- Name: cfg_units_statuses Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_units_statuses USING (true);


--
-- Name: cfg_units_types Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_units_types USING (true);


--
-- Name: cfg_users_statuses Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.cfg_users_statuses USING (true);


--
-- Name: clients Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.clients USING (true);


--
-- Name: contracts Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.contracts USING (true);


--
-- Name: contracts_managers Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.contracts_managers USING (true);


--
-- Name: units Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.units USING (true);


--
-- Name: users Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.users USING (true);


--
-- Name: users_notifications Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.users_notifications USING (true);


--
-- Name: vehicles Permissive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permissive" ON public.vehicles USING (true);


--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_attributes_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets_attributes_values ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_available; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets_available ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_followers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_available_processing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_available_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_priorities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags_subs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_tags_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_unavailable_reasons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_assets_unavailable_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_contracts_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_contracts_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_departments ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_objects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_objects ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_priorities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_subs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_subs_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_orders_types_subs_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles_access ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_profiles_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_routes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_routes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_systems; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_systems ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_assets_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_units_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_users_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_users_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_managers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_materials_purchases_types (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true
);

ALTER TABLE public.cfg_materials_purchases_types OWNER TO postgres;

--
-- Name: cfg_materials_purchases_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_pkey PRIMARY KEY (id);

--
-- Name: cfg_materials_purchases_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_code_key UNIQUE (code);

--
-- Name: cfg_materials_purchases_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_materials_purchases_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated read cfg_materials_purchases_types"
    ON public.cfg_materials_purchases_types
    FOR SELECT
    TO authenticated
    USING (true);

--
-- Name: cfg_materials_purchases_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_materials_purchases_statuses (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL
);

ALTER TABLE public.cfg_materials_purchases_statuses OWNER TO postgres;

--
-- Name: cfg_materials_purchases_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_materials_purchases_statuses_pkey PRIMARY KEY (id);

--
-- Name: cfg_materials_purchases_statuses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_materials_purchases_statuses_code_key UNIQUE (code);

--
-- Name: cfg_materials_purchases_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_materials_purchases_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated read cfg_materials_purchases_statuses"
    ON public.cfg_materials_purchases_statuses
    FOR SELECT
    TO authenticated
    USING (true);

--
-- Name: materials_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials_purchases (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    material_id bigint NOT NULL,
    purchase_type_id bigint NOT NULL,
    warehouse_id bigint,
    quantity integer NOT NULL,
    unit_price numeric(15,4) DEFAULT 0 NOT NULL,
    total_price numeric(15,4) DEFAULT 0 NOT NULL,
    justification text NOT NULL,
    status_id bigint DEFAULT 1 NOT NULL,
    requester_id bigint NOT NULL,
    authorizer_id bigint,
    authorized_at timestamp with time zone,
    cancel_reason text,
    concluded_at timestamp with time zone,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_user_id bigint,
    deleted_user_id bigint,
    deleted_at timestamp with time zone,
    CONSTRAINT materials_purchases_quantity_check CHECK ((quantity > 0))
);

ALTER TABLE public.materials_purchases OWNER TO postgres;

--
-- Name: materials_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_pkey PRIMARY KEY (id);

--
-- Name: idx_mp_material_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_material_id ON public.materials_purchases(material_id);

--
-- Name: idx_mp_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_status_id ON public.materials_purchases(status_id);

--
-- Name: idx_mp_requester_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_requester_id ON public.materials_purchases(requester_id);

--
-- Name: idx_mp_purchase_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_purchase_type_id ON public.materials_purchases(purchase_type_id);

--
-- Name: idx_mp_warehouse_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_warehouse_id ON public.materials_purchases(warehouse_id);

--
-- Name: idx_mp_is_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mp_is_deleted ON public.materials_purchases(is_deleted);

--
-- Name: materials_purchases materials_purchases_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;

--
-- Name: materials_purchases materials_purchases_purchase_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_purchase_type_id_fkey FOREIGN KEY (purchase_type_id) REFERENCES public.cfg_materials_purchases_types(id);

--
-- Name: materials_purchases materials_purchases_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_materials_purchases_statuses(id);

--
-- Name: materials_purchases materials_purchases_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE SET NULL;

--
-- Name: materials_purchases materials_purchases_authorizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_authorizer_id_fkey FOREIGN KEY (authorizer_id) REFERENCES public.users(id) ON DELETE SET NULL;

--
-- Name: materials_purchases materials_purchases_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

--
-- Name: materials_purchases materials_purchases_updated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_updated_user_id_fkey FOREIGN KEY (updated_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

--
-- Name: materials_purchases materials_purchases_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT materials_purchases_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

--
-- Name: materials_purchases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.materials_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated" ON public.materials_purchases
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

--
-- Name: v_materials_purchases; Type: VIEW; Schema: public; Owner: -
--

DROP VIEW IF EXISTS public.v_materials_purchases;

CREATE OR REPLACE VIEW public.v_materials_purchases AS
SELECT
    mp.id,
    mp.material_id,
    m.code AS material_code,
    m.description AS material_description,
    m.unit AS material_unit,
    m.price_unit AS material_unit_price,
    m.type_id AS material_type_id,
    cmt.description AS material_type_description,
    mp.purchase_type_id,
    cpt.code AS purchase_type_code,
    cpt.description AS purchase_type_description,
    mp.warehouse_id,
    w.code AS warehouse_code,
    w.description AS warehouse_description,
    mp.quantity,
    mp.unit_price,
    mp.total_price,
    mp.justification,
    mp.status_id,
    cps.code AS status_code,
    cps.description AS status_description,
    mp.requester_id,
    ru.name_full AS requester_name,
    mp.authorizer_id,
    au.name_full AS authorizer_name,
    mp.authorized_at,
    mp.cancel_reason,
    mp.concluded_at,
    mp.created_at,
    mp.updated_at
FROM public.materials_purchases mp
LEFT JOIN public.materials m ON m.id = mp.material_id
LEFT JOIN public.cfg_materials_types cmt ON cmt.id = m.type_id
LEFT JOIN public.cfg_materials_purchases_types cpt ON cpt.id = mp.purchase_type_id
LEFT JOIN public.warehouses w ON w.id = mp.warehouse_id
LEFT JOIN public.cfg_materials_purchases_statuses cps ON cps.id = mp.status_id
LEFT JOIN public.users ru ON ru.id = mp.requester_id
LEFT JOIN public.users au ON au.id = mp.authorizer_id
WHERE mp.is_deleted = false;

--
-- Seed data for cfg_materials_purchases_types
--

INSERT INTO public.cfg_materials_purchases_types (code, description, is_available) VALUES
    ('standard',  'Compra Padrão', true),
    ('emergency', 'Compra Emergencial', true),
    ('service',   'Compra de Serviço', true),
    ('rental',    'Aluguel de Equipamento', true)
ON CONFLICT (code) DO NOTHING;

--
-- Seed data for cfg_materials_purchases_statuses
--

INSERT INTO public.cfg_materials_purchases_statuses (code, description) VALUES
    ('pending',    'A Autorizar'),
    ('authorized', 'Autorizada'),
    ('completed',  'Concluída'),
    ('cancelled',  'Cancelada')
ON CONFLICT (code) DO NOTHING;

--
-- Name: cfg_app_tips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_tips (
    id integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    icon text DEFAULT 'lightbulb' NOT NULL,
    screen_target text DEFAULT '*' NOT NULL,
    target_mode text DEFAULT 'all' NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.cfg_app_tips OWNER TO postgres;

--
-- Name: cfg_app_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_pkey PRIMARY KEY (id);

--
-- Name: cfg_app_tips_dismissals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_tips_dismissals (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    user_id integer NOT NULL,
    dismissed_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.cfg_app_tips_dismissals OWNER TO postgres;

--
-- Name: cfg_app_tips_dismissals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_pkey PRIMARY KEY (id);

--
-- Name: cfg_app_tips_dismissals_tip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_user_id_key UNIQUE (tip_id, user_id);

--
-- Name: cfg_app_tips_dismissals_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;

--
-- Name: cfg_app_tips_dismissals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: cfg_app_tips_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_tips_companies (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    company_id bigint NOT NULL
);

ALTER TABLE public.cfg_app_tips_companies OWNER TO postgres;

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_company_id_key UNIQUE (tip_id, company_id);

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE CASCADE;

CREATE INDEX idx_cfg_app_tips_companies_tip_id ON public.cfg_app_tips_companies USING btree (tip_id);

CREATE INDEX idx_cfg_app_tips_companies_company_id ON public.cfg_app_tips_companies USING btree (company_id);

ALTER TABLE public.cfg_app_tips_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tip companies"
    ON public.cfg_app_tips_companies
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage tip companies"
    ON public.cfg_app_tips_companies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

--
-- Name: cfg_app_tips_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_tips_departments (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    department_id bigint NOT NULL
);

ALTER TABLE public.cfg_app_tips_departments OWNER TO postgres;

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_department_id_key UNIQUE (tip_id, department_id);

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;

CREATE INDEX idx_cfg_app_tips_departments_tip_id ON public.cfg_app_tips_departments USING btree (tip_id);

CREATE INDEX idx_cfg_app_tips_departments_department_id ON public.cfg_app_tips_departments USING btree (department_id);

ALTER TABLE public.cfg_app_tips_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tip departments"
    ON public.cfg_app_tips_departments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage tip departments"
    ON public.cfg_app_tips_departments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

--
-- Name: cfg_app_tips_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cfg_app_tips_profiles (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    profile_id bigint NOT NULL
);

ALTER TABLE public.cfg_app_tips_profiles OWNER TO postgres;

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_profile_id_key UNIQUE (tip_id, profile_id);

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_cfg_app_tips_profiles_tip_id ON public.cfg_app_tips_profiles USING btree (tip_id);

CREATE INDEX idx_cfg_app_tips_profiles_profile_id ON public.cfg_app_tips_profiles USING btree (profile_id);

ALTER TABLE public.cfg_app_tips_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tip profiles"
    ON public.cfg_app_tips_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage tip profiles"
    ON public.cfg_app_tips_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

--
-- Name: cfg_app_tips_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

--
-- Name: idx_cfg_app_tips_screen_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_app_tips_screen_target ON public.cfg_app_tips USING btree (screen_target);

--
-- Name: idx_cfg_app_tips_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_app_tips_is_active ON public.cfg_app_tips USING btree (is_active);

--
-- Name: idx_cfg_app_tips_dismissals_tip_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_app_tips_dismissals_tip_id ON public.cfg_app_tips_dismissals USING btree (tip_id);

--
-- Name: idx_cfg_app_tips_dismissals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cfg_app_tips_dismissals_user_id ON public.cfg_app_tips_dismissals USING btree (user_id);

--
-- Name: cfg_app_tips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_app_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tips"
    ON public.cfg_app_tips
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage tips"
    ON public.cfg_app_tips
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

--
-- Name: cfg_app_tips_dismissals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cfg_app_tips_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
    ON public.cfg_app_tips_dismissals
    FOR SELECT
    TO authenticated
    USING (
        user_id = (
            SELECT id FROM public.users WHERE uuid = auth.uid()
        )
    );

CREATE POLICY "Users can insert own dismissals"
    ON public.cfg_app_tips_dismissals
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users WHERE uuid = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all dismissals"
    ON public.cfg_app_tips_dismissals
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.uuid = auth.uid()
            AND users.is_admin_super = true
        )
    );

--
-- Name: update_cfg_app_tips_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_cfg_app_tips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

--
-- Name: cfg_app_tips; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_cfg_app_tips_updated_at
    BEFORE UPDATE ON public.cfg_app_tips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cfg_app_tips_updated_at();

--
-- PostgreSQL database dump complete
--


