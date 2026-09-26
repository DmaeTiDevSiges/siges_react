-- =============================================================================
-- schema.sql (PRINCIPAL)
-- Fonte: dump Contabo SigesSupabaseContabo_backup_2026-09-23_02-45-06.dump
-- Extraído: pg_restore --schema-only (PG 15.8 / pg_dump 15.15)
-- Atualizado em: 2026-09-23T16:41:31Z
-- Escopo: schemas auth + public + storage (DDL completo, sem dados)
-- Observação: \restrict/\unrestrict do pg_dump removidos para uso com psql
-- Análise relacionada: dev/supabase/dump_export/ANALISE.md
-- =============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: change_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.change_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
  BEGIN
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      NEW.updated_at = now(); 
      RETURN NEW;
    ELSE
      RETURN OLD;
    END IF;
  END;
$$;


ALTER FUNCTION public.change_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cfg_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_activities (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    code character varying
);


ALTER TABLE public.cfg_activities OWNER TO supabase_admin;

--
-- Name: v_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_activities WITH (security_invoker='true') AS
 SELECT cfg_activities.id,
    cfg_activities.description,
    cfg_activities.is_available,
    cfg_activities.code
   FROM public.cfg_activities
  WHERE (cfg_activities.is_deleted = false)
  ORDER BY cfg_activities.description;


ALTER VIEW public.v_activities OWNER TO supabase_admin;

--
-- Name: fc_activities_search(text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_activities_search(srch_terms text) RETURNS SETOF public.v_activities
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
    result_record v_activities;
begin    
    for result_record in
        select *
        from v_activities
        where 
             (
                coalesce(srch_terms, '') = '' 
                or to_tsvector('portuguese', description) @@ plainto_tsquery('portuguese', srch_terms)
            )
    loop
        return next result_record;
    end loop;
    return;
end;
$$;


ALTER FUNCTION public.fc_activities_search(srch_terms text) OWNER TO supabase_admin;

--
-- Name: fc_api_key_validate(text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_api_key_validate(p_api_key text) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select exists(
    select 1
    from api_keys
    where api_key = p_api_key
    and is_active = true
  );
$$;


ALTER FUNCTION public.fc_api_key_validate(p_api_key text) OWNER TO supabase_admin;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: supabase_admin
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


ALTER TABLE public.assets OWNER TO supabase_admin;

--
-- Name: cfg_assets_couplings_models; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_couplings_models (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.cfg_assets_couplings_models OWNER TO supabase_admin;

--
-- Name: cfg_assets_priorities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_priorities (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying,
    is_available boolean
);


ALTER TABLE public.cfg_assets_priorities OWNER TO supabase_admin;

--
-- Name: cfg_assets_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_statuses (
    id bigint NOT NULL,
    code character varying,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    color text
);


ALTER TABLE public.cfg_assets_statuses OWNER TO supabase_admin;

--
-- Name: cfg_assets_tags; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_tags (
    id bigint NOT NULL,
    company_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_assets_tags OWNER TO supabase_admin;

--
-- Name: cfg_assets_tags_subs; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_tags_subs (
    id bigint NOT NULL,
    company_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_assets_tags_subs OWNER TO supabase_admin;

--
-- Name: cfg_assets_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_types (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    company_id bigint,
    is_deleted boolean DEFAULT true,
    naming_pattern text
);


ALTER TABLE public.cfg_assets_types OWNER TO supabase_admin;

--
-- Name: cfg_companies; Type: TABLE; Schema: public; Owner: supabase_admin
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


ALTER TABLE public.cfg_companies OWNER TO supabase_admin;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: supabase_admin
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
    is_deleted boolean DEFAULT false,
    company_id bigint
);


ALTER TABLE public.clients OWNER TO supabase_admin;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.materials (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description text,
    searchable text,
    company_id bigint,
    price_unit numeric,
    unit character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    provider_company_id bigint DEFAULT '1'::bigint,
    balance numeric DEFAULT '0'::numeric,
    finger_print character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    status_id bigint DEFAULT '1'::bigint,
    type_id bigint DEFAULT '1'::bigint
);


ALTER TABLE public.materials OWNER TO supabase_admin;

--
-- Name: units; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.units (
    id bigint NOT NULL,
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
    img_file_name text,
    client_id bigint,
    id_external uuid DEFAULT gen_random_uuid()
);


ALTER TABLE public.units OWNER TO supabase_admin;

--
-- Name: v_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets WITH (security_invoker='true') AS
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
   FROM (((((((((((public.assets
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


ALTER VIEW public.v_assets OWNER TO supabase_admin;

--
-- Name: fc_assets_search_filters(integer[], integer[], integer[], integer[], integer[], text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) OWNER TO supabase_admin;

--
-- Name: fc_assets_search_type(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) OWNER TO supabase_admin;

--
-- Name: fc_assets_search_unit(text, integer, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_assets_searchable(text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) RETURNS SETOF public.v_assets
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_assets_searchable_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
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


ALTER FUNCTION public.fc_assets_searchable_update() OWNER TO supabase_admin;

--
-- Name: fc_cfg_units_assets_tags_set_last_values_when_processing_2(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Executa apenas quando last_processing_id = 2
  IF NEW.last_processing_id = 2 THEN

    IF NEW.last_is_available = TRUE THEN
      
      -- Mantém a lógica original
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


ALTER FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() OWNER TO supabase_admin;

--
-- Name: fc_check_user_permission(bigint, character varying, character varying); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_has_permission boolean := false;
BEGIN
    SELECT is_admin_super INTO v_has_permission
    FROM public.users
    WHERE id = p_user_id;

    IF v_has_permission = true THEN
        RETURN true;
    END IF;

    SELECT
        CASE p_action
            WHEN 'view' THEN pa.can_view
            WHEN 'create' THEN pa.can_create
            WHEN 'edit' THEN pa.can_edit
            WHEN 'delete' THEN pa.can_delete
            WHEN 'search' THEN pa.can_search
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


ALTER FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) OWNER TO supabase_admin;

--
-- Name: cfg_services; Type: TABLE; Schema: public; Owner: supabase_admin
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
    company_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cfg_services OWNER TO supabase_admin;

--
-- Name: contracts_services; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.contracts_services (
    id bigint NOT NULL,
    contract_id bigint,
    service_id bigint,
    value_unit numeric DEFAULT '1'::numeric,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    discount numeric DEFAULT '1'::numeric,
    amount numeric DEFAULT '1'::numeric,
    value_total numeric DEFAULT '1'::numeric,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.contracts_services OWNER TO supabase_admin;

--
-- Name: v_contracts_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_contracts_services WITH (security_invoker='true') AS
 SELECT contracts_services.id,
    contracts_services.contract_id,
    contracts_services.service_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    contracts_services.value_unit,
    contracts_services.discount,
    contracts_services.amount,
    contracts_services.value_total,
    contracts_services.version_mode
   FROM (public.contracts_services
     JOIN public.cfg_services ON ((contracts_services.service_id = cfg_services.id)))
  WHERE (contracts_services.is_deleted = false)
  ORDER BY cfg_services.description;


ALTER VIEW public.v_contracts_services OWNER TO supabase_admin;

--
-- Name: fc_contracts_services_search(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) RETURNS SETOF public.v_contracts_services
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) OWNER TO supabase_admin;

--
-- Name: cfg_orders_causes_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_causes_reasons (
    id smallint NOT NULL,
    description character varying,
    is_availabe boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_orders_causes_reasons OWNER TO supabase_admin;

--
-- Name: cfg_orders_priorities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_priorities (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    color character varying
);


ALTER TABLE public.cfg_orders_priorities OWNER TO supabase_admin;

--
-- Name: cfg_orders_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_types (
    id bigint NOT NULL,
    department_id bigint NOT NULL,
    code character varying,
    description character varying,
    is_deleted boolean DEFAULT false,
    is_available boolean DEFAULT true
);


ALTER TABLE public.cfg_orders_types OWNER TO supabase_admin;

--
-- Name: cfg_orders_types_subs; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_types_subs (
    id bigint NOT NULL,
    department_id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_orders_types_subs OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_extras_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_visits_extras_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_orders_visits_extras_processing OWNER TO supabase_admin;

--
-- Name: cfg_systems; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_systems (
    id bigint NOT NULL,
    company_id bigint,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_date timestamp without time zone,
    deleted_user_id bigint,
    deleted_date timestamp without time zone
);


ALTER TABLE public.cfg_systems OWNER TO supabase_admin;

--
-- Name: cfg_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_teams (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying NOT NULL,
    description character varying NOT NULL,
    department_id bigint NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    img_url character varying,
    users_total bigint NOT NULL,
    company_id bigint NOT NULL,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    sort_order integer DEFAULT 0,
    is_evaluable boolean DEFAULT true
);


ALTER TABLE public.cfg_teams OWNER TO supabase_admin;

--
-- Name: cfg_units_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_units_types (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    company_id bigint,
    parent_id bigint,
    is_available boolean DEFAULT true,
    deleted_user_id bigint,
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_units_types OWNER TO supabase_admin;

--
-- Name: orders_visits_extras; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_extras (
    id bigint NOT NULL,
    o_mask character varying,
    o_id bigint,
    approved_user_id bigint,
    approved_at timestamp without time zone,
    disapproved_user_id bigint,
    disapproved_at timestamp without time zone,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    processing_id bigint DEFAULT '1'::bigint,
    reported_at timestamp without time zone,
    reported_user_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    duration_hours double precision DEFAULT '0'::double precision,
    disapproved_comments text,
    comments text,
    is_archived boolean DEFAULT false,
    team_names_short character varying,
    unit_id bigint,
    o_type_id bigint,
    company_id bigint,
    department_id bigint,
    revised_user_id bigint,
    revised_at timestamp without time zone,
    requested_services text,
    asset_tag_id bigint,
    provider_company_id bigint,
    provider_department_id bigint,
    priority_id bigint,
    team_leader_id bigint,
    team_amount bigint DEFAULT '1'::bigint,
    team_id bigint,
    archived_user_id bigint,
    archived_at timestamp without time zone,
    deleted_at timestamp without time zone,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    o_type_sub_id bigint,
    o_cause_reason_id smallint,
    started_at_date date,
    started_at_hour_min time without time zone,
    ended_at_date date,
    ended_at_hour_min time without time zone,
    is_blocked boolean DEFAULT false,
    unblocked_user_id bigint,
    unblocked_at timestamp without time zone,
    unarchived_user_id bigint,
    unarchived_at timestamp without time zone
);


ALTER TABLE public.orders_visits_extras OWNER TO supabase_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    name_full character varying,
    name_short character varying,
    mobile character varying,
    phone character varying,
    created_at timestamp without time zone NOT NULL,
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
    ov_id_in_progress_mask character varying,
    tracker_interval_seconds bigint DEFAULT '300'::bigint,
    shift_start time without time zone DEFAULT '08:00:00'::time without time zone,
    shift_end time without time zone DEFAULT '18:00:00'::time without time zone,
    last_online timestamp with time zone,
    tracker_heartbeat_at timestamp without time zone,
    tracker_accuracy double precision,
    tracked_at timestamp without time zone,
    signature_image_path text,
    signature_image_name character varying,
    is_logged_out_with_visit boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO supabase_admin;

--
-- Name: COLUMN users.shift_start; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.shift_start IS 'Horário de início do turno do usuário';


--
-- Name: COLUMN users.shift_end; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.shift_end IS 'Horário de término do turno do usuário';


--
-- Name: COLUMN users.tracker_heartbeat_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.tracker_heartbeat_at IS 'Liveness signal: updated on every accepted GPS fix (even when the user is stationary and tracker_at is not refreshed). Use to detect dead trackers (NOW() - tracker_heartbeat_at > N min => tracker offline).';


--
-- Name: COLUMN users.tracker_accuracy; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.tracker_accuracy IS 'GPS horizontal accuracy in meters of the last accepted position (68% confidence radius).';


--
-- Name: v_orders_visits_extras; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_extras WITH (security_invoker='true') AS
 SELECT orders_visits_extras.id,
    orders_visits_extras.o_mask,
    orders_visits_extras.unit_id,
    units.description_full AS unit_description,
    orders_visits_extras.system_parent_id,
    systems_parent.description AS system_parent_description,
    systems_parent.code AS system_parent_code,
    orders_visits_extras.system_id,
    cfg_systems.description AS system_description,
    cfg_systems.code AS system_code,
    orders_visits_extras.unit_type_parent_id,
    units_types_parent.description AS unit_type_parent_description,
    units_types_parent.code AS unit_type_parent_code,
    orders_visits_extras.unit_type_id,
    cfg_units_types.description AS unit_type_description,
    cfg_units_types.code AS unit_type_code,
    orders_visits_extras.o_type_id,
    cfg_orders_types.code AS o_type_code,
    cfg_orders_types.description AS o_type_description,
    orders_visits_extras.o_type_sub_id,
    cfg_orders_types_subs.code AS o_type_sub_code,
    cfg_orders_types_subs.description AS o_type_sub_description,
    orders_visits_extras.requested_services,
    orders_visits_extras.asset_tag_id,
    cfg_assets_tags.description AS asset_tag_description,
    orders_visits_extras.provider_company_id,
    cfg_companies_provider.description AS provider_company_description,
    cfg_companies_provider.img_file_path AS provider_company_img_file_path,
    cfg_companies_provider.img_file_name AS provider_company_img_file_name,
    orders_visits_extras.priority_id,
    cfg_orders_priorities.code AS priority_code,
    cfg_orders_priorities.description AS priority_description,
    orders_visits_extras.started_at,
    orders_visits_extras.started_at_date,
    orders_visits_extras.started_at_hour_min,
    orders_visits_extras.ended_at,
    orders_visits_extras.ended_at_date,
    orders_visits_extras.ended_at_hour_min,
    orders_visits_extras.duration_hours,
    orders_visits_extras.processing_id,
    cfg_orders_visits_extras_processing.description AS processing_description,
    orders_visits_extras.comments,
    orders_visits_extras.is_archived,
    orders_visits_extras.created_at,
    orders_visits_extras.created_user_id,
    users_created.name_short AS created_user_name_short,
    orders_visits_extras.o_cause_reason_id,
    cfg_orders_causes_reasons.description AS o_cause_reason_description,
    orders_visits_extras.reported_at,
    orders_visits_extras.reported_user_id,
    users_reported.name_short AS reported_user_name_short,
    orders_visits_extras.is_blocked,
    orders_visits_extras.unblocked_at,
    orders_visits_extras.unblocked_user_id,
    users_unblocked.name_short AS unblocked_user_name_short,
    orders_visits_extras.revised_at,
    orders_visits_extras.revised_user_id,
    users_revised.name_short AS revised_user_name_short,
    orders_visits_extras.disapproved_user_id,
    orders_visits_extras.disapproved_at,
    users_disapproved.name_short AS disapproved_user_name_short,
    orders_visits_extras.disapproved_comments,
    orders_visits_extras.approved_at,
    orders_visits_extras.approved_user_id,
    users_approved.name_short AS approved_user_name_short,
    orders_visits_extras.archived_at,
    orders_visits_extras.archived_user_id,
    users_archived.name_short AS archived_user_name_short,
    orders_visits_extras.unarchived_at,
    orders_visits_extras.unarchived_user_id,
    users_unarchived.name_short AS unarchived_user_name_short,
    orders_visits_extras.team_leader_id,
    users_teams_leaders.name_short AS team_leader_user_name_short,
    users_teams_leaders.img_file_path AS team_leader_user_img_file_path,
    users_teams_leaders.img_file_name AS team_leader_user_img_file_name,
    orders_visits_extras.team_amount,
    orders_visits_extras.team_id,
    cfg_teams.description AS team_description,
    orders_visits_extras.team_names_short
   FROM ((((((((((((((((((((((public.orders_visits_extras
     LEFT JOIN public.cfg_orders_visits_extras_processing ON ((orders_visits_extras.processing_id = cfg_orders_visits_extras_processing.id)))
     LEFT JOIN public.cfg_orders_types ON ((orders_visits_extras.o_type_id = cfg_orders_types.id)))
     LEFT JOIN public.cfg_orders_types_subs ON ((orders_visits_extras.o_type_sub_id = cfg_orders_types_subs.id)))
     LEFT JOIN public.cfg_assets_tags ON ((orders_visits_extras.asset_tag_id = cfg_assets_tags.id)))
     LEFT JOIN public.units ON ((orders_visits_extras.unit_id = units.id)))
     LEFT JOIN public.cfg_companies cfg_companies_provider ON ((orders_visits_extras.provider_company_id = cfg_companies_provider.id)))
     LEFT JOIN public.cfg_orders_priorities ON ((orders_visits_extras.priority_id = cfg_orders_priorities.id)))
     LEFT JOIN public.users users_created ON ((orders_visits_extras.created_user_id = users_created.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits_extras.reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_unblocked ON ((orders_visits_extras.unblocked_user_id = users_unblocked.id)))
     LEFT JOIN public.users users_unarchived ON ((orders_visits_extras.unarchived_user_id = users_unarchived.id)))
     LEFT JOIN public.users users_revised ON ((orders_visits_extras.revised_user_id = users_revised.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits_extras.disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits_extras.approved_user_id = users_approved.id)))
     LEFT JOIN public.users users_archived ON ((orders_visits_extras.archived_user_id = users_archived.id)))
     LEFT JOIN public.users users_teams_leaders ON ((orders_visits_extras.team_leader_id = users_teams_leaders.id)))
     LEFT JOIN public.cfg_teams ON ((orders_visits_extras.team_id = cfg_teams.id)))
     LEFT JOIN public.cfg_systems systems_parent ON ((orders_visits_extras.system_parent_id = systems_parent.id)))
     LEFT JOIN public.cfg_systems ON ((orders_visits_extras.system_id = cfg_systems.id)))
     LEFT JOIN public.cfg_units_types units_types_parent ON ((orders_visits_extras.unit_type_parent_id = units_types_parent.id)))
     LEFT JOIN public.cfg_units_types ON ((orders_visits_extras.unit_type_id = cfg_units_types.id)))
     LEFT JOIN public.cfg_orders_causes_reasons ON ((orders_visits_extras.o_cause_reason_id = cfg_orders_causes_reasons.id)))
  WHERE (orders_visits_extras.is_deleted = false);


ALTER VIEW public.v_orders_visits_extras OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_extras_filters(timestamp without time zone, timestamp without time zone, integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) RETURNS SETOF public.v_orders_visits_extras
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

BEGIN
    RETURN QUERY
    SELECT *
    FROM v_orders_visits_extras
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
   
    ((o_type_id = ANY(o_types_ids) OR o_types_ids IS NULL OR array_length(o_types_ids, 1) = 0)
    OR (COALESCE(array_length(o_types_ids, 1), 0) = 0))
    AND

    ((o_type_sub_id = ANY(o_types_subs_ids) OR o_types_subs_ids IS NULL OR array_length(o_types_subs_ids, 1) = 0)
    OR (COALESCE(array_length(o_types_subs_ids, 1), 0) = 0))
    AND

    ((o_cause_reason_id = ANY(o_causes_reasons_ids) OR o_causes_reasons_ids IS NULL OR array_length(o_causes_reasons_ids, 1) = 0)
    OR (COALESCE(array_length(o_causes_reasons_ids, 1), 0) = 0))
    AND

    ((team_id = ANY(teams_ids) OR teams_ids IS NULL OR array_length(teams_ids, 1) = 0)
    OR (COALESCE(array_length(teams_ids, 1), 0) = 0))
    AND

    (started_at BETWEEN date_start AND date_end)
    
    order by
    v_orders_visits_extras.started_at ASC;
    
END;

$$;


ALTER FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_no_archived; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_extras_no_archived WITH (security_invoker='true') AS
 SELECT vove.id,
    vove.o_mask,
    vove.unit_id,
    vove.unit_description,
    vove.system_parent_id,
    vove.system_parent_description,
    vove.system_parent_code,
    vove.system_id,
    vove.system_description,
    vove.system_code,
    vove.unit_type_parent_id,
    vove.unit_type_parent_description,
    vove.unit_type_parent_code,
    vove.unit_type_id,
    vove.unit_type_description,
    vove.unit_type_code,
    vove.o_type_id,
    vove.o_type_code,
    vove.o_type_description,
    vove.o_type_sub_id,
    vove.o_type_sub_code,
    vove.o_type_sub_description,
    vove.requested_services,
    vove.asset_tag_id,
    vove.asset_tag_description,
    vove.provider_company_id,
    vove.provider_company_description,
    vove.provider_company_img_file_path,
    vove.provider_company_img_file_name,
    vove.priority_id,
    vove.priority_code,
    vove.priority_description,
    vove.started_at,
    vove.started_at_date,
    vove.started_at_hour_min,
    vove.ended_at,
    vove.ended_at_date,
    vove.ended_at_hour_min,
    vove.duration_hours,
    vove.processing_id,
    vove.processing_description,
    vove.comments,
    vove.is_archived,
    vove.created_at,
    vove.created_user_id,
    vove.created_user_name_short,
    vove.o_cause_reason_id,
    vove.o_cause_reason_description,
    vove.reported_at,
    vove.reported_user_id,
    vove.reported_user_name_short,
    vove.is_blocked,
    vove.unblocked_at,
    vove.unblocked_user_id,
    vove.unblocked_user_name_short,
    vove.revised_at,
    vove.revised_user_id,
    vove.revised_user_name_short,
    vove.disapproved_user_id,
    vove.disapproved_at,
    vove.disapproved_user_name_short,
    vove.disapproved_comments,
    vove.approved_at,
    vove.approved_user_id,
    vove.approved_user_name_short,
    vove.archived_at,
    vove.archived_user_id,
    vove.archived_user_name_short,
    vove.unarchived_at,
    vove.unarchived_user_id,
    vove.unarchived_user_name_short,
    vove.team_leader_id,
    vove.team_leader_user_name_short,
    vove.team_leader_user_img_file_path,
    vove.team_leader_user_img_file_name,
    vove.team_amount,
    vove.team_id,
    vove.team_description,
    vove.team_names_short
   FROM public.v_orders_visits_extras vove
  WHERE (vove.is_archived = false);


ALTER VIEW public.v_orders_visits_extras_no_archived OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_extras_no_archived_filters(integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) RETURNS SETOF public.v_orders_visits_extras_no_archived
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

BEGIN
    RETURN QUERY
    SELECT *
    FROM v_orders_visits_extras_no_archived
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
   
    ((o_type_id = ANY(o_types_ids) OR o_types_ids IS NULL OR array_length(o_types_ids, 1) = 0)
    OR (COALESCE(array_length(o_types_ids, 1), 0) = 0))
    AND

    ((o_type_sub_id = ANY(o_types_subs_ids) OR o_types_subs_ids IS NULL OR array_length(o_types_subs_ids, 1) = 0)
    OR (COALESCE(array_length(o_types_subs_ids, 1), 0) = 0))
    AND

    ((o_cause_reason_id = ANY(o_causes_reasons_ids) OR o_causes_reasons_ids IS NULL OR array_length(o_causes_reasons_ids, 1) = 0)
    OR (COALESCE(array_length(o_causes_reasons_ids, 1), 0) = 0))
    AND

    ((team_id = ANY(teams_ids) OR teams_ids IS NULL OR array_length(teams_ids, 1) = 0)
    OR (COALESCE(array_length(teams_ids, 1), 0) = 0))
    
    order by
    v_orders_visits_extras_no_archived.started_at DESC;
    
END;

$$;


ALTER FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) OWNER TO supabase_admin;

--
-- Name: cfg_orders_cancel_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_cancel_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_orders_cancel_reasons OWNER TO supabase_admin;

--
-- Name: cfg_orders_objects; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_objects (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true
);


ALTER TABLE public.cfg_orders_objects OWNER TO supabase_admin;

--
-- Name: cfg_orders_plans; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_plans (
    id bigint NOT NULL,
    department_id bigint,
    code character varying,
    description text,
    is_available boolean DEFAULT true,
    version character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.cfg_orders_plans OWNER TO supabase_admin;

--
-- Name: cfg_orders_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_statuses (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    code text,
    description text,
    is_available boolean DEFAULT true,
    icon text,
    icon_color text,
    background_color text,
    priority_level integer
);


ALTER TABLE public.cfg_orders_statuses OWNER TO supabase_admin;

--
-- Name: cfg_orders_suspended_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_suspended_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_orders_suspended_reasons OWNER TO supabase_admin;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: supabase_admin
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
    status_id smallint DEFAULT '1'::smallint,
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
    client_id bigint,
    object text,
    is_use_manus boolean DEFAULT false
);


ALTER TABLE public.contracts OWNER TO supabase_admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: supabase_admin
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
    status_id bigint DEFAULT '1'::bigint,
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
    asset_tag_sub_id bigint,
    asset_available_id bigint,
    client_id bigint DEFAULT '1'::bigint,
    img_files_names jsonb,
    unit_asset_tag_id bigint,
    unit_asset_tag_has_order boolean DEFAULT true,
    unit_asset_tag_no_has_order_user_id bigint,
    unit_asset_tag_no_has_order_at timestamp without time zone,
    rating smallint DEFAULT '0'::smallint
);


ALTER TABLE public.orders OWNER TO supabase_admin;

--
-- Name: v_orders; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders WITH (security_invoker='true') AS
 SELECT o.id,
    o.uid,
    o.parent_id,
    o.company_id,
    c.description AS company_description,
    c.img_file_path AS company_img_file_path,
    c.img_file_name AS company_img_file_name,
    o.img_file_path,
    o.img_file_name,
    o.department_id,
    o.contract_id,
    ct.description AS contract_description,
    ct.code AS contract_code,
    o.provider_company_id,
    cp.description AS provider_company_description,
    cp.img_file_path AS provider_company_img_file_path,
    cp.img_file_name AS provider_company_img_file_name,
    o.provider_department_id,
    o.order_mask,
    o.type_id,
    ot.code AS type_code,
    ot.description AS type_description,
    o.type_sub_id,
    ots.code AS type_sub_code,
    ots.description AS type_sub_description,
    o.requested_services,
    o.object_id,
    oo.code AS object_code,
    oo.description AS object_description,
    o.system_parent_id,
    sp.description AS system_parent_description,
    sp.code AS system_parent_code,
    o.system_id,
    s.description AS system_description,
    s.code AS system_code,
    o.unit_type_parent_id,
    utp.description AS unit_type_parent_description,
    utp.code AS unit_type_parent_code,
    o.unit_type_id,
    ut.description AS unit_type_description,
    ut.code AS unit_type_code,
    o.unit_id,
    u.description_full AS unit_description,
    u.address_full AS unit_address,
    u.latitude AS unit_latitude,
    u.longitude AS unit_longitude,
    u.code AS unit_code,
    o.requester_name,
    o.requester_phone,
    o.requester_team_id,
    rt.code AS requester_team_code,
    o.requested_at,
    o.status_id,
    os.code AS status_code,
    os.description AS status_description,
    o.status_at,
    o.priority_id,
    op.code AS priority_code,
    op.description AS priority_description,
    o.team_leader_id,
    ul.name_short AS team_leader_name_short,
    ul.email AS team_leader_email,
    o.team_id,
    t.code AS team_code,
    t.description AS team_description,
    o.asset_tag_id,
    at.description AS asset_tag_description,
    o.asset_tag_sub_id,
    ats.description AS asset_tag_sub_description,
    o.year,
    o.counter_parent,
    o.counter_child,
    o.cause_reason_id,
    cr.description AS cause_reason_description,
    o.suspended_reason_id,
    sr.description AS suspended_reason_description,
    o.cancel_reason_id,
    clr.description AS cancel_reason_description,
    o.canceled_team_id,
    ct2.code AS canceled_team_code,
    cu.name_short AS canceled_user_name_short,
    o.plan_id,
    pl.description AS plan_description,
    pl.code AS plan_code,
    o.services_value,
    o.materials_value,
    o.vehicles_value,
    o.total_value,
    o.version_mode,
    o.created_user_id,
    o.ov_counter,
    o.progress,
    o.img_files_names,
    cl.name AS client_name,
    cl.id AS client_id,
    o.unit_asset_tag_id,
    o.unit_asset_tag_has_order,
    o.unit_asset_tag_no_has_order_user_id,
    o.unit_asset_tag_no_has_order_at,
    ct.object AS contract_object,
    cp.code AS provider_company_code
   FROM (((((((((((((((((((((((((public.orders o
     JOIN public.cfg_orders_types ot ON ((ot.id = o.type_id)))
     JOIN public.cfg_orders_statuses os ON ((os.id = o.status_id)))
     JOIN public.cfg_orders_priorities op ON ((op.id = o.priority_id)))
     JOIN public.units u ON ((u.id = o.unit_id)))
     JOIN public.cfg_systems sp ON ((sp.id = o.system_parent_id)))
     JOIN public.cfg_systems s ON ((s.id = o.system_id)))
     JOIN public.cfg_units_types utp ON ((utp.id = o.unit_type_parent_id)))
     JOIN public.cfg_units_types ut ON ((ut.id = o.unit_type_id)))
     LEFT JOIN public.cfg_orders_types_subs ots ON ((ots.id = o.type_sub_id)))
     LEFT JOIN public.contracts ct ON ((ct.id = o.contract_id)))
     LEFT JOIN public.cfg_companies c ON ((c.id = o.company_id)))
     LEFT JOIN public.cfg_companies cp ON ((cp.id = o.provider_company_id)))
     LEFT JOIN public.cfg_orders_plans pl ON ((pl.id = o.plan_id)))
     LEFT JOIN public.cfg_teams rt ON ((rt.id = o.requester_team_id)))
     LEFT JOIN public.cfg_teams t ON ((t.id = o.team_id)))
     LEFT JOIN public.cfg_teams ct2 ON ((ct2.id = o.canceled_team_id)))
     LEFT JOIN public.cfg_orders_objects oo ON ((oo.id = o.object_id)))
     LEFT JOIN public.users ul ON ((ul.id = o.team_leader_id)))
     LEFT JOIN public.users cu ON ((cu.id = o.canceled_user_id)))
     LEFT JOIN public.cfg_assets_tags at ON ((at.id = o.asset_tag_id)))
     LEFT JOIN public.cfg_assets_tags_subs ats ON ((ats.id = o.asset_tag_sub_id)))
     LEFT JOIN public.cfg_orders_causes_reasons cr ON ((cr.id = o.cause_reason_id)))
     LEFT JOIN public.cfg_orders_suspended_reasons sr ON ((sr.id = o.suspended_reason_id)))
     LEFT JOIN public.cfg_orders_cancel_reasons clr ON ((clr.id = o.cancel_reason_id)))
     LEFT JOIN public.clients cl ON ((cl.id = o.client_id)));


ALTER VIEW public.v_orders OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_filters_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_dash_admin_orders_filters_open WITH (security_invoker='true') AS
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
    v_orders.contract_code,
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
    v_orders.unit_code,
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
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
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
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));


ALTER VIEW public.v_dash_admin_orders_filters_open OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) RETURNS SETOF public.v_dash_admin_orders_filters_open
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_parent_filters_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_dash_admin_orders_parent_filters_open WITH (security_invoker='true') AS
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
    v_orders.contract_code,
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
    v_orders.unit_code,
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
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
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
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id IS NULL));


ALTER VIEW public.v_dash_admin_orders_parent_filters_open OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_parent_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) RETURNS SETOF public.v_dash_admin_orders_parent_filters_open
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_dashboard_stats(bigint, bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_dashboard_stats(p_company_id bigint DEFAULT NULL::bigint, p_team_id bigint DEFAULT NULL::bigint) RETURNS json
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
SELECT json_build_object(
  'orders_by_period', (
    SELECT json_build_object(
      'today', COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE),
      'yesterday', COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE - INTERVAL '1 day' AND requested_at < CURRENT_DATE),
      'week', COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE - INTERVAL '7 days'),
      'month', COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE - INTERVAL '30 days'),
      'overdue', COUNT(*) FILTER (WHERE requested_at < CURRENT_DATE - INTERVAL '30 days')
    )
    FROM orders
    WHERE is_deleted = false
      AND (p_company_id IS NULL OR company_id = p_company_id)
      AND (p_team_id IS NULL OR team_id = p_team_id)
  ),
  'visits_by_status', (
    SELECT COALESCE(json_object_agg(status_description, count), '{}'::json)
    FROM (
      SELECT os.description as status_description, COUNT(*) as count
      FROM orders_visits ov
      JOIN cfg_orders_statuses os ON ov.ov_status_id = os.id
      WHERE ov.is_deleted = false
      GROUP BY os.description
    ) sub
  ),
  'visits_by_period', (
    SELECT json_build_object(
      'today', COUNT(*) FILTER (WHERE ov_started_at >= CURRENT_DATE),
      'yesterday', COUNT(*) FILTER (WHERE ov_started_at >= CURRENT_DATE - INTERVAL '1 day' AND ov_started_at < CURRENT_DATE),
      'week', COUNT(*) FILTER (WHERE ov_started_at >= CURRENT_DATE - INTERVAL '7 days'),
      'month', COUNT(*) FILTER (WHERE ov_started_at >= CURRENT_DATE - INTERVAL '30 days')
    )
    FROM orders_visits
    WHERE is_deleted = false
      AND (p_company_id IS NULL OR EXISTS (
        SELECT 1 FROM orders o WHERE o.id = orders_visits.o_id AND o.company_id = p_company_id
      ))
  )
);
$$;


ALTER FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_durations_hours_decimals(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_durations_hours_decimals() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.ov_status_id = 2 AND NEW.ov_started_at IS NOT NULL AND NEW.ov_ended_at IS NOT NULL THEN
        NEW.ov_duration_hours := EXTRACT(EPOCH FROM (NEW.ov_ended_at - NEW.ov_started_at)) / 3600;
    ELSE
        NEW.ov_duration_hours := NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_durations_hours_decimals() OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_materials_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) RETURNS TABLE(code text, description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_services_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) RETURNS TABLE(code text, description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  select
    vos.code, vos.description, vos.unit, vos.value_unit, vos.discount,
    sum(vos.amount) as amount_total,
    sum(vos.value_total) as value_total
  from v_orders_visits_services vos
  where vos.ov_id = any(ov_ids)
  group by vos.code, vos.description, vos.unit, vos.value_unit, vos.discount
  order by vos.description;
$$;


ALTER FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_vehicles_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) RETURNS TABLE(vehicle_description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  SELECT
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount,
    SUM(vos.amount) AS amount_total,
    SUM(vos.value_total) AS value_total
  FROM public.v_orders_visits_vehicles vos
  WHERE vos.ov_id = ANY(ov_ids)
  GROUP BY
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount
  ORDER BY
    vos.vehicle_description;
$$;


ALTER FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_get_profile_permissions(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) RETURNS TABLE(permission_id bigint, route_id bigint, route_key character varying, route_path character varying, route_description character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean, can_search boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
        pa.can_delete,
        pa.can_search
    FROM public.cfg_profiles_access pa
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE pa.profile_id = p_profile_id
      AND r.is_available = true
    ORDER BY r.order_index;
END;
$$;


ALTER FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_get_user_permissions(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_get_user_permissions(p_user_id bigint) RETURNS TABLE(route_id bigint, route_key character varying, route_path character varying, route_description character varying, route_icon character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean, can_search boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
        pa.can_delete,
        pa.can_search
    FROM public.users u
    INNER JOIN public.cfg_profiles p ON u.profile_id = p.id
    INNER JOIN public.cfg_profiles_access pa ON p.id = pa.profile_id
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE u.id = p_user_id
      AND r.is_available = true
    ORDER BY r.order_index;
END;
$$;


ALTER FUNCTION public.fc_get_user_permissions(p_user_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_imgproxy_sign_url(text, text, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  key_bytes bytea;
  salt_bytes bytea;
  path text;
  data_to_sign bytea;
  signature bytea;
  signature_b64 text;
  final_format text;
begin
  -- A correção essencial:
  set local search_path = public, extensions;

  -- Formato final
  if is_web then
    final_format := 'webp';
  else
    final_format := null;
  end if;

  -- Converte hex → bytea
  key_bytes := decode(key_hex, 'hex');
  salt_bytes := decode(salt_hex, 'hex');

  -- Injeta formato no transform
  if final_format is not null then
    transforms := transforms || '/format:' || final_format;
  end if;

  -- Caminho do imgproxy
  path := '/' || transforms || '/plain/' || img_url;

  -- Monta bytes: salt + path
  data_to_sign := salt_bytes || convert_to(path, 'UTF8');

  -- Chamada hmac fica VÁLIDA pois agora está visível no search_path
  signature := hmac(
    data_to_sign,     -- bytea
    key_bytes,        -- bytea
    'sha256'::text
  );

  -- base64url
  signature_b64 :=
    replace(
      replace(
        rtrim(encode(signature, 'base64'), '='),
      '+', '-'),
    '/', '_');

  return imgproxy_url || '/' || signature_b64 || path;
end;
$$;


ALTER FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) OWNER TO supabase_admin;

--
-- Name: fc_import_orders_visits_contracts_update_finger_print(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.finger_print := md5(
    coalesce(NEW.user_email, '') ||
    coalesce(NEW.contract_code, '') ||
    coalesce(NEW.date::text, '') ||
    coalesce(NEW.unit_code, '') ||
    coalesce(NEW.asset_code, '') ||
    coalesce(NEW.activity_code, '') ||
    coalesce(NEW.service_code, '') ||
    coalesce(NEW.value_unit::text, '') ||
    coalesce(NEW.amount::text, '') ||
    coalesce(NEW.discount::text, '') ||
    coalesce(NEW.value_total::text, '') ||
    coalesce(NEW.order_mask, '') 
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() OWNER TO supabase_admin;

--
-- Name: fc_leader_tracker_interval(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_leader_tracker_interval() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Só aplica para líderes de equipe
    IF NEW.is_team_leader = true THEN
        IF NEW.is_ov_in_progress = true THEN
            NEW.tracker_interval_seconds := 30;
        ELSE
            NEW.tracker_interval_seconds := 180;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_leader_tracker_interval() OWNER TO supabase_admin;

--
-- Name: FUNCTION fc_leader_tracker_interval(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.fc_leader_tracker_interval() IS 'v1.0.0 - Ajusta tracker_interval_seconds automaticamente para líderes: 30s quando ocupado, 180s quando livre.';


--
-- Name: fc_materials_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
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


ALTER FUNCTION public.fc_materials_searchable() OWNER TO supabase_admin;

--
-- Name: fc_order_counter_increment(bigint, integer, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) RETURNS json
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_counter bigint;
    result json;
BEGIN
    SELECT counter INTO v_counter
    FROM public.cfg_orders_counter
    WHERE company_id = p_company_id
    AND year = p_year
    AND version = p_version
    FOR UPDATE;

    IF FOUND THEN
        v_counter := v_counter + 1;
        UPDATE public.cfg_orders_counter
        SET counter = v_counter
        WHERE company_id = p_company_id
        AND year = p_year
        AND version = p_version;
    ELSE
        v_counter := 1;
        INSERT INTO public.cfg_orders_counter (company_id, year, version, counter)
        VALUES (p_company_id, p_year, p_version, v_counter);
    END IF;

    result := json_build_object('counter', v_counter);
    RETURN result;
END;
$$;


ALTER FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) OWNER TO supabase_admin;

--
-- Name: fc_order_status_inheritance(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_order_status_inheritance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_parent_id BIGINT;
    v_target_order RECORD;
BEGIN
    -- Identificar se a ordem atualizada possui um pai (é uma OS de uma SS)
    v_parent_id := NEW.parent_id;
    
    -- Se não tiver pai (ou seja, é a SS raiz), ignoramos
    IF v_parent_id IS NULL OR v_parent_id = 0 THEN
        RETURN NEW;
    END IF;

    -- Buscar a OS "vencedora" para este pai:
    -- Regra 1: Maior priority_level (peso da situação)
    -- Regra 2: Data de situação (status_at) mais recente para desempate
    SELECT 
        o.status_id, 
        o.status_at
    INTO v_target_order
    FROM public.orders o
    JOIN public.cfg_orders_statuses s ON s.id = o.status_id
    WHERE o.parent_id = v_parent_id
      AND o.is_deleted = false
    ORDER BY s.priority_level DESC, o.status_at DESC
    LIMIT 1;

    -- Se encontrarmos a OS filha mais relevante, atualizamos a SS (Pai)
    IF v_target_order.status_id IS NOT NULL THEN
        UPDATE public.orders
        SET 
            status_id = v_target_order.status_id,
            status_at = v_target_order.status_at, -- Ajuste de DATA sincronizado
            updated_at = TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)
        WHERE id = v_parent_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_order_status_inheritance() OWNER TO supabase_admin;

--
-- Name: FUNCTION fc_order_status_inheritance(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.fc_order_status_inheritance() IS 'v1.3.0 - Sincroniza automaticamente Situação e Data da SS com base no peso (priority_level) das OSs filhas.';


--
-- Name: fc_orders_op_counter_trigger(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_op_counter_trigger() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_asset_tag_id bigint;
BEGIN
    -- Determine which unit_asset_tag_id to update
    IF TG_OP = 'DELETE' THEN
        v_asset_tag_id := OLD.unit_asset_tag_id;
    ELSE
        v_asset_tag_id := NEW.unit_asset_tag_id;
    END IF;

    -- Only update if the asset tag ID is set
    IF v_asset_tag_id IS NOT NULL AND v_asset_tag_id > 0 THEN
        PERFORM public.fc_update_op_counter(v_asset_tag_id);
    END IF;

    -- On UPDATE, if unit_asset_tag_id changed, also update the old one
    IF TG_OP = 'UPDATE' AND OLD.unit_asset_tag_id IS NOT NULL
       AND OLD.unit_asset_tag_id <> COALESCE(NEW.unit_asset_tag_id, 0) THEN
        PERFORM public.fc_update_op_counter(OLD.unit_asset_tag_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.fc_orders_op_counter_trigger() OWNER TO supabase_admin;

--
-- Name: fc_orders_statuses_logs(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_statuses_logs() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    -- Guarda extra: UPDATE sem mudança real de situação não gera linha.
    -- (a cláusula WHEN do trigger já cobre, isto é defesa dupla)
    -- IF aninhado é obrigatório: em INSERT o record OLD não está atribuído
    -- e qualquer tentativa de leitura levantaria erro.
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status_id IS NOT DISTINCT FROM NEW.status_id THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Usuário autenticado (app). Sem JWT (n8n, imports, jobs) fica NULL.
    BEGIN
        SELECT id INTO v_user_id
        FROM public.users
        WHERE uuid = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    INSERT INTO public.orders_statuses_logs (
        order_id,
        order_status_id,
        order_status_at,
        created_user_id,
        created_date,
        order_parent_id,
        company_id,
        department_id
    ) VALUES (
        NEW.id,
        NEW.status_id,
        NEW.status_at,
        COALESCE(v_user_id, NEW.updated_user_id, NEW.created_user_id),
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        NULLIF(NEW.parent_id, 0),
        NEW.company_id,
        NEW.department_id
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_statuses_logs() OWNER TO supabase_admin;

--
-- Name: FUNCTION fc_orders_statuses_logs(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.fc_orders_statuses_logs() IS 'Flow: orders-statuses-log v1.1.0 — Registra em orders_statuses_logs a situação inicial (INSERT) e cada mudança real de status_id (UPDATE) em orders, cobrindo SS e OS.';


--
-- Name: fc_orders_replace_special_chars(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_replace_special_chars() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  new.requested_services := extensions.unaccent(new.requested_services);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_replace_special_chars() OWNER TO supabase_admin;

--
-- Name: cfg_orders_types_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_types_activities (
    id bigint NOT NULL,
    o_type_id bigint,
    activity_id bigint,
    is_available boolean DEFAULT true,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.cfg_orders_types_activities OWNER TO supabase_admin;

--
-- Name: v_orders_types_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_types_activities WITH (security_invoker='true') AS
 SELECT cfg_orders_types_activities.id,
    cfg_orders_types_activities.o_type_id,
    cfg_orders_types_activities.activity_id,
    cfg_activities.description AS activity_description,
    cfg_orders_types_activities.is_available,
    cfg_orders_types_activities.version_mode
   FROM (public.cfg_orders_types_activities
     JOIN public.cfg_activities ON ((cfg_orders_types_activities.activity_id = cfg_activities.id)))
  ORDER BY cfg_activities.description;


ALTER VIEW public.v_orders_types_activities OWNER TO supabase_admin;

--
-- Name: fc_orders_types_activities_search(text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) RETURNS SETOF public.v_orders_types_activities
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_activities_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_activities_description() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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
        AND ovaa.maintenance_plan_id isnull
   )
    WHERE id = NEW.ova_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_assets_activities_description() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_materials_update_value_total(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_materials_update_value_total() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_assets_materials_update_value_total() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_activities_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_update_activities_searchable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    activity_searchable text;
BEGIN
    -- Check for valid activity_id and concatenate accordingly
    SELECT 
        CASE 
            WHEN COUNT(ovaa.activity_id) > 0 THEN 
                string_agg(a.description, ', ' ORDER BY a.description) || 
                CASE 
                    WHEN NEW.before_comments IS NOT NULL THEN ' ' || NEW.before_comments 
                    ELSE '' 
                END || 
                CASE 
                    WHEN NEW.after_comments IS NOT NULL THEN ' ' || NEW.after_comments 
                    ELSE '' 
                END
            ELSE 
                CASE 
                    WHEN NEW.before_comments IS NOT NULL THEN NEW.before_comments 
                    ELSE '' 
                END || 
                CASE 
                    WHEN NEW.after_comments IS NOT NULL THEN ' ' || NEW.after_comments 
                    ELSE '' 
                END
        END INTO activity_searchable
    FROM public.orders_visits_assets_activities ovaa
    JOIN public.cfg_activities a ON ovaa.activity_id = a.id  -- Assuming you have an activities table with activity descriptions
    WHERE ovaa.ova_id = OLD.id  -- Use OLD.id to reference the id of the row being updated
    AND ovaa.is_deleted = false;

    -- Only update if the new value is different from the old value
    IF activity_searchable IS DISTINCT FROM OLD.activities_searchable THEN
        UPDATE public.orders_visits_assets
        SET activities_searchable = activity_searchable
        WHERE id = OLD.id;  -- Update the row being modified
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_assets_update_activities_searchable() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_materials_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_update_materials_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_orders_visits_assets_update_materials_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_services_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_update_services_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    total_assets INTEGER;
    service_value_per_asset NUMERIC;
BEGIN
    -- Conta a quantidade de registros em orders_visits_assets com o mesmo ov_id e is_deleted = false
    SELECT COUNT(*)
    INTO total_assets
    FROM public.orders_visits_assets
    WHERE ov_id = NEW.id
    AND is_deleted = false;
    
    -- Calcula o valor de rateio por registro
    IF total_assets > 0 THEN
        service_value_per_asset = NEW.ov_services_value / total_assets;
        
        -- Atualiza o campo services_value para cada registro correspondente
        UPDATE public.orders_visits_assets
        SET services_value = service_value_per_asset
        WHERE ov_id = NEW.id
        AND is_deleted = false;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_assets_update_services_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_vehicles_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_assets_update_vehicles_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    total_assets INTEGER;
    service_value_per_asset NUMERIC;
BEGIN
    -- Conta a quantidade de registros em orders_visits_assets com o mesmo ov_id e is_deleted = false
    SELECT COUNT(*)
    INTO total_assets
    FROM public.orders_visits_assets
    WHERE ov_id = NEW.id
    AND is_deleted = false;
    
    -- Calcula o valor de rateio por registro
    IF total_assets > 0 THEN
        service_value_per_asset = NEW.ov_vehicles_value / total_assets;
        
        -- Atualiza o campo vehicles_value para cada registro correspondente
        UPDATE public.orders_visits_assets
        SET vehicles_value = service_value_per_asset
        WHERE ov_id = NEW.id
        AND is_deleted = false;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_assets_update_vehicles_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_extras_teams_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_extras_teams_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    team_names TEXT;
    ove_id_value BIGINT;
BEGIN
    -- Definir o valor correto de ove_id dependendo se for INSERT ou DELETE
    IF (TG_OP = 'INSERT') THEN
        ove_id_value = NEW.ove_id;
    ELSIF (TG_OP = 'DELETE') THEN
        ove_id_value = OLD.ove_id;
    END IF;

    -- Concatena os nomes dos usuários na ordem correta, líderes primeiro
    SELECT string_agg(u.name_short, ', ' ORDER BY t.is_leader DESC, u.name_short ASC)
    INTO team_names
    FROM public.orders_visits_extras_teams t
    JOIN public.users u ON t.user_id = u.id
    WHERE t.ove_id = ove_id_value;
    
    -- Atualiza o campo ov_team_names_short na tabela orders_visits_extras
    UPDATE public.orders_visits_extras
    SET team_names_short = team_names
    WHERE id = ove_id_value;
    
    RETURN NULL; -- Trigger functions must return a value
END;
$$;


ALTER FUNCTION public.fc_orders_visits_extras_teams_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_amount_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_services_amount_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Calcula o value_total como amount * value_unit * discount
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    
    -- Retorna o registro modificado
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_services_amount_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_update_services_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_services_update_services_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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

    -- Retornos adequados para triggers AFTER
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_services_update_services_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_update_value_unit(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_services_update_value_unit() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_orders_visits_services_update_value_unit() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_teams_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_teams_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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

    -- Concatena os nomes dos usuários na ordem correta, líderes primeiro
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


ALTER FUNCTION public.fc_orders_visits_teams_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_update_total_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_update_total_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Atualiza o campo ov_total_value somando os valores dos outros campos
    UPDATE public.orders_visits
    SET ov_total_value = COALESCE(ov_materials_value, 0) 
                       + COALESCE(ov_services_value, 0) 
                       + COALESCE(ov_vehicles_value, 0)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_orders_visits_update_total_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_vehicles_before_save(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
BEGIN

    SELECT value_unit
    INTO v_price
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;

    NEW.value_unit := COALESCE(v_price,0);

    NEW.amount :=
        GREATEST(
            COALESCE(NEW.recorder_end,0)
            - COALESCE(NEW.recorder_start,0),
            0
        );

    NEW.value_total :=
        NEW.amount
        * NEW.value_unit
        * COALESCE(NEW.discount,1);

    RETURN NEW;

END;
$$;


ALTER FUNCTION public.fc_orders_visits_vehicles_before_save() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_vehicles_update_vehicles_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() OWNER TO supabase_admin;

--
-- Name: fc_regenerate_asset_description(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_set_ov_started_date_parts(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_set_ov_started_date_parts() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  -- Only update if ov_started_at is not null
  if new.ov_started_at is not null then
    new.ov_started_month := extract(month from new.ov_started_at);
    new.ov_started_year  := extract(year from new.ov_started_at);
  else
    -- If the date is removed, clear derived fields
    new.ov_started_month := null;
    new.ov_started_year  := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.fc_set_ov_started_date_parts() OWNER TO supabase_admin;

--
-- Name: fc_sync_ov_costs_status(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_sync_ov_costs_status() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF OLD.ov_costs_status IS DISTINCT FROM NEW.ov_costs_status THEN
        UPDATE public.orders_visits_services
        SET ov_costs_status = NEW.ov_costs_status
        WHERE ov_id = NEW.id;

        UPDATE public.orders_visits_vehicles
        SET ov_costs_status = NEW.ov_costs_status
        WHERE ov_id = NEW.id;

        UPDATE public.orders_visits_assets_materials
        SET ov_costs_status = NEW.ov_costs_status
        WHERE ov_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_sync_ov_costs_status() OWNER TO supabase_admin;

--
-- Name: fc_system_parent_id_10_at_id_33_46_uata_rate(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$DECLARE
  result jsonb;
  v_api_key text;
  req_count integer;
BEGIN

  -- pega API key do header
  v_api_key :=
    (current_setting('request.headers', true)::json ->> 'x-api-key');

  IF v_api_key IS NULL THEN
    RAISE EXCEPTION 'API key missing';
  END IF;

  -- valida API key
  IF NOT public.fc_api_key_validate(v_api_key) THEN
    RAISE EXCEPTION 'Invalid API key';
  END IF;

  -- rate limit
  SELECT count(*)
  INTO req_count
  FROM public.logs_api
  WHERE logs_api.api_key = v_api_key
  AND created_at > now() - interval '5 minutes';

  IF req_count >= 1 THEN
    RAISE EXCEPTION 'Rate limit exceeded: only one request every 5 minutes';
  END IF;

  -- log
  INSERT INTO public.logs_api(api_key, endpoint)
  VALUES (v_api_key, 'fc_system_parent_id_10_at_id_33_46_uata_rate');

  -- consulta
  RETURN (
    WITH dados AS (
    SELECT
        cs.description AS system_parent_description,
        vuatar.asset_tag_description,
        TRIM(vuatar.unit_description) AS unit_description,
        ROUND(vuatar.total_last_asset_available_rate * 100) AS disponibilidade,
        -- Substitua "vuatar.updated_at" pelo nome correto da sua coluna de data
        TO_CHAR(vuatar.last_reported_at, 'YYYY-MM-DD HH24:MI:SS') AS ultima_atualizacao
    FROM public.v_units_assets_tags_available_rate AS vuatar
    LEFT JOIN public.cfg_systems AS cs
        ON vuatar.system_parent_id = cs.id
    WHERE
        vuatar.system_parent_id = 10
        AND vuatar.asset_tag_id IN (33, 46)
        AND vuatar.asset_tag_description IS NOT NULL
        AND TRIM(vuatar.unit_description) <> ''
)
SELECT COALESCE(
    jsonb_object_agg(
        sistema,
        setores
        ORDER BY sistema
    ),
    '{}'::jsonb
)
FROM (
    SELECT
        system_parent_description AS sistema,
        jsonb_object_agg(
            setor,
            unidades
            ORDER BY setor
        ) AS setores
    FROM (
        SELECT
            system_parent_description,
            asset_tag_description AS setor,
            jsonb_object_agg(
                unit_description,
                jsonb_build_object(
                    'disponibilidade', disponibilidade,
                    'data_ultima atualizacao', ultima_atualizacao
                )
                ORDER BY unit_description
            ) AS unidades
        FROM dados
        GROUP BY
            system_parent_description,
            asset_tag_description
    ) s
    GROUP BY
        system_parent_description
) t

  );

END;$$;


ALTER FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() OWNER TO supabase_admin;

--
-- Name: fc_team_descendants(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

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


ALTER FUNCTION public.fc_team_descendants(team_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_tgr_units_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_tgr_units_searchable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
    unit_type_code text;
BEGIN
    SELECT c.code
    INTO unit_type_code
    FROM public.cfg_units_types c
    WHERE c.id = NEW.unit_type_id;

    NEW.description_full :=
        COALESCE(unit_type_code, '') || ' ' || COALESCE(NEW.code, '') || ' ' || COALESCE(NEW.description, '');

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_tgr_units_searchable() OWNER TO supabase_admin;

--
-- Name: technicals_manuals; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.technicals_manuals (
    id bigint NOT NULL,
    description text,
    doc_file_path text,
    doc_file_name text,
    company_id bigint,
    assets_amount bigint DEFAULT '0'::bigint NOT NULL,
    asset_type_id bigint,
    code text
);


ALTER TABLE public.technicals_manuals OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_technicals_manuals WITH (security_invoker='true') AS
 SELECT technicals_manuals.id,
    technicals_manuals.company_id,
    technicals_manuals.code,
    technicals_manuals.description AS tm_description,
    technicals_manuals.doc_file_path,
    technicals_manuals.doc_file_name,
    technicals_manuals.assets_amount,
    technicals_manuals.asset_type_id,
    cfg_assets_types.description AS asset_type_description
   FROM (public.technicals_manuals
     JOIN public.cfg_assets_types ON ((technicals_manuals.asset_type_id = cfg_assets_types.id)));


ALTER VIEW public.v_technicals_manuals OWNER TO supabase_admin;

--
-- Name: fc_tm_assets_types_search_terms(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) RETURNS SETOF public.v_technicals_manuals
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    result_record v_technicals_manuals;
BEGIN
    FOR result_record IN
        SELECT *
        FROM v_technicals_manuals
        WHERE asset_type_id = src_asset_type_id
          AND to_tsvector('portuguese', tm_description) @@ plainto_tsquery('portuguese', search_terms)
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;


ALTER FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) OWNER TO supabase_admin;

--
-- Name: fc_total_value_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_total_value_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Atualiza o campo total_value com a soma de services_value, materials_value e vehicles_value
  NEW.total_value := COALESCE(NEW.services_value, 0) +
                     COALESCE(NEW.materials_value, 0) +
                     COALESCE(NEW.vehicles_value, 0);

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_total_value_update() OWNER TO supabase_admin;

--
-- Name: fc_unit_05_assets_tags_available_rate(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_unit_05_assets_tags_available_rate() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result jsonb;
  v_api_key text;
  req_count integer;
BEGIN

  -- pega API key do header
  v_api_key :=
    (current_setting('request.headers', true)::json ->> 'x-api-key');

  IF v_api_key IS NULL THEN
    RAISE EXCEPTION 'API key missing';
  END IF;

  -- valida API key
  IF NOT public.fc_api_key_validate(v_api_key) THEN
    RAISE EXCEPTION 'Invalid API key';
  END IF;

  -- rate limit
SELECT count(*)
INTO req_count
FROM public.logs_api
WHERE logs_api.api_key = v_api_key
AND created_at > now() - interval '12 hours';

IF req_count >= 1 THEN
  RAISE EXCEPTION 'Rate limit exceeded: only one request every 12 hours';
END IF;

  -- log
  INSERT INTO public.logs_api(api_key, endpoint)
  VALUES (v_api_key, 'fc_unit_05_assets_tags_available_rate');

  -- consulta
  RETURN (
    SELECT COALESCE(
      jsonb_agg(to_jsonb(t)),
      '[]'::jsonb
    )
    FROM (
      SELECT
        unit_description AS unidade_descricao,
        asset_tag_description AS setor,
        total_flow_rate_max AS vazao,
        flow_rate_unit AS vazao_unidade,
        total_last_asset_available_rate AS disponibilidade,
        last_reported_at AS ultima_atualizacao
      FROM public.v_units_assets_tags_available_rate
      WHERE unit_id = 1170
      AND asset_tag_id = 33
    ) t
  );

END;
$$;


ALTER FUNCTION public.fc_unit_05_assets_tags_available_rate() OWNER TO supabase_admin;

--
-- Name: cfg_units_assets_tags; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_units_assets_tags (
    id bigint NOT NULL,
    unit_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint,
    last_created_at timestamp without time zone NOT NULL,
    last_is_available boolean,
    last_status_id bigint,
    last_processing_id bigint DEFAULT '1'::bigint,
    last_created_user_id bigint,
    last_asset_available_id bigint DEFAULT '0'::bigint,
    last_file_path character varying,
    last_file_name character varying,
    last_comments character varying,
    last_asset_unavailable_reason_id bigint,
    last_reported_at timestamp without time zone,
    last_reported_user_id bigint,
    flow_rate_unit character varying,
    asset_available_rate numeric,
    last_asset_available_rate numeric,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone,
    created_user_id bigint,
    flow_rate_min numeric,
    flow_rate_max numeric,
    last_is_on boolean,
    power_unit character varying,
    power_min numeric,
    power_max numeric,
    operation_unit character varying,
    last_operation_record numeric,
    pressure_unit character varying,
    pressure_min numeric,
    pressure_max numeric,
    last_flow_rate numeric,
    last_power numeric,
    last_pressure numeric,
    flow_rate_is_visible boolean,
    power_is_visible boolean,
    pressure_is_visible boolean,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    asset_tag_tag_sub_description character varying,
    is_active boolean DEFAULT true,
    voltage_unit character varying,
    voltage_min numeric,
    voltage_max numeric,
    voltage_is_visible boolean DEFAULT true,
    last_voltage numeric,
    amperage_unit character varying,
    amperage_min numeric,
    amperage_max numeric,
    amperage_is_visible boolean DEFAULT true,
    last_amperage numeric,
    last_o_id bigint DEFAULT '0'::bigint,
    op_counter bigint DEFAULT '0'::bigint,
    last_provider_company_id bigint
);


ALTER TABLE public.cfg_units_assets_tags OWNER TO supabase_admin;

--
-- Name: v_units_by_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_by_assets_tags WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units_by_assets_tags OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_available_rate_search_filters(integer, integer[], integer[], integer[], integer[], integer, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) RETURNS SETOF public.v_units_by_assets_tags
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM v_units_by_assets_tags
    WHERE (asset_tag_id = asset_tag_id_value)
      AND ((unit_id = ANY(units_ids) OR units_ids IS NULL OR array_length(units_ids, 1) = 0)
           OR (COALESCE(array_length(units_ids, 1), 0) = 0))
      AND (system_parent_id = system_parent_id_value)
      AND ((system_id = ANY(systems_ids) OR systems_ids IS NULL OR array_length(systems_ids, 1) = 0)
           OR (COALESCE(array_length(systems_ids, 1), 0) = 0))
      AND ((unit_type_parent_id = ANY(units_types_parent_ids) OR units_types_parent_ids IS NULL
            OR array_length(units_types_parent_ids, 1) = 0)
           OR (COALESCE(array_length(units_types_parent_ids, 1), 0) = 0))
      AND ((unit_type_id = ANY(units_types_ids) OR units_types_ids IS NULL
            OR array_length(units_types_ids, 1) = 0)
           OR (COALESCE(array_length(units_types_ids, 1), 0) = 0))
    ORDER BY total_last_asset_available_rate ASC
    OFFSET offset_value LIMIT limit_value;
END;
$$;


ALTER FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) OWNER TO supabase_admin;

--
-- Name: cfg_assets_available_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_available_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_assets_available_processing OWNER TO supabase_admin;

--
-- Name: cfg_assets_unavailable_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_unavailable_reasons (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.cfg_assets_unavailable_reasons OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_assets_tags WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units_assets_tags OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_search_filters(integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) RETURNS SETOF public.v_units_assets_tags
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM v_units_assets_tags
    WHERE (system_parent_id = system_parent_id_value);
END;
$$;


ALTER FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_asset_tag_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_assets_tags_update_asset_tag_description() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Só executa o UPDATE se a descrição realmente mudou
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        UPDATE public.cfg_units_assets_tags cuat
        SET asset_tag_tag_sub_description = NEW.description || ' > ' || cats.description
        FROM public.cfg_assets_tags_subs cats
        WHERE cuat.asset_tag_sub_id = cats.id
          AND cuat.asset_tag_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_description() OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_asset_tag_sub_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        UPDATE public.cfg_units_assets_tags cuat
        SET asset_tag_tag_sub_description = cat.description || ' > ' || NEW.description
        FROM public.cfg_assets_tags cat
        WHERE cuat.asset_tag_id = cat.id
          AND cuat.asset_tag_sub_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_op_counter(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_assets_tags_update_op_counter() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Atualiza o op_counter para refletir apenas solicitações EM ABERTO (1-6)
    UPDATE public.cfg_units_assets_tags
    SET op_counter = (
        SELECT COUNT(*)
        FROM public.orders
        WHERE parent_id IS NULL             -- Apenas SS (Solicitações Pai)
          AND unit_asset_tag_has_order = true 
          AND unit_id = COALESCE(NEW.unit_id, OLD.unit_id)
          AND asset_tag_id = COALESCE(NEW.asset_tag_id, OLD.asset_tag_id)
          AND asset_tag_sub_id = COALESCE(NEW.asset_tag_sub_id, OLD.asset_tag_sub_id)
          AND status_id NOT IN (7, 8)       -- Exclui Canceladas (7) e Concluídas (8)
    )
    WHERE unit_id = COALESCE(NEW.unit_id, OLD.unit_id)
      AND asset_tag_id = COALESCE(NEW.asset_tag_id, OLD.asset_tag_id)
      AND asset_tag_sub_id = COALESCE(NEW.asset_tag_sub_id, OLD.asset_tag_sub_id);

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_units_assets_tags_update_op_counter() OWNER TO supabase_admin;

--
-- Name: cfg_units_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_units_statuses (
    id smallint NOT NULL,
    code text,
    description text,
    color text
);


ALTER TABLE public.cfg_units_statuses OWNER TO supabase_admin;

--
-- Name: v_units; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units OWNER TO supabase_admin;

--
-- Name: fc_units_search(character varying, character varying); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) RETURNS SETOF public.v_units
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
    return query
    select *
    from v_units
    where to_tsvector('portuguese', description_full) @@ plainto_tsquery('portuguese', search_terms)
      and version_mode = search_version;
end;
$$;


ALTER FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) OWNER TO supabase_admin;

--
-- Name: fc_units_search_filters(integer[], integer[], integer[], integer[], integer, text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) RETURNS SETOF public.v_units
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
SELECT *
FROM v_units
WHERE
    status_id = unit_status_id
    AND version_mode = app_version_mode

    AND (
        COALESCE(array_length(systems_parent_ids,1),0) = 0
        OR system_parent_id = ANY(systems_parent_ids)
    )

    AND (
        COALESCE(array_length(systems_ids,1),0) = 0
        OR system_id = ANY(systems_ids)
    )

    AND (
        COALESCE(array_length(units_types_parent_ids,1),0) = 0
        OR unit_type_parent_id = ANY(units_types_parent_ids)
    )

    AND (
        COALESCE(array_length(units_types_ids,1),0) = 0
        OR unit_type_id = ANY(units_types_ids)
    )

    AND (
        search_terms IS NULL
        OR search_terms = ''
        OR description_full @@ plainto_tsquery('portuguese', search_terms)
    )

ORDER BY description_full ASC;
$$;


ALTER FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_units_search_filters(integer[], integer[], integer[], integer[], integer, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) RETURNS SETOF public.v_units
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


ALTER FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) OWNER TO supabase_admin;

--
-- Name: fc_update_after_img_file_name(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_after_img_file_name() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.after_img_files_names IS DISTINCT FROM OLD.after_img_files_names THEN
        NEW.after_img_file_name := NEW.after_img_files_names->>0;  -- Atribui o primeiro item do array
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_update_after_img_file_name() OWNER TO supabase_admin;

--
-- Name: fc_update_after_img_files_names(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_after_img_files_names() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.after_img_file_name IS DISTINCT FROM OLD.after_img_file_name THEN
        NEW.after_img_files_names := jsonb_build_array(NEW.after_img_file_name);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_update_after_img_files_names() OWNER TO supabase_admin;

--
-- Name: fc_update_before_img_file_name(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_before_img_file_name() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.before_img_files_names IS DISTINCT FROM OLD.before_img_files_names THEN
        NEW.before_img_file_name := NEW.before_img_files_names->>0;  -- Atribui o primeiro item do array
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_update_before_img_file_name() OWNER TO supabase_admin;

--
-- Name: fc_update_before_img_files_names(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_before_img_files_names() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NEW.before_img_file_name IS DISTINCT FROM OLD.before_img_file_name THEN
        NEW.before_img_files_names := jsonb_build_array(NEW.before_img_file_name);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fc_update_before_img_files_names() OWNER TO supabase_admin;

--
-- Name: fc_update_op_counter(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE cfg_units_assets_tags
    SET op_counter = (
        SELECT COUNT(*)::bigint
        FROM orders
        WHERE orders.unit_asset_tag_id = p_unit_asset_tag_id
          AND orders.unit_asset_tag_has_order = true
          AND (orders.parent_id = 0 OR orders.parent_id IS NULL)
          AND orders.status_id NOT IN (7, 8)
    )
    WHERE cfg_units_assets_tags.id = p_unit_asset_tag_id;
END;
$$;


ALTER FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_update_profile_routes(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    DELETE FROM public.cfg_profiles_access
    WHERE profile_id = p_profile_id;

    INSERT INTO public.cfg_profiles_access (
        profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search
    )
    SELECT
        p_profile_id,
        (route->>'route_id')::bigint,
        COALESCE((route->>'can_view')::boolean, false),
        COALESCE((route->>'can_create')::boolean, false),
        COALESCE((route->>'can_edit')::boolean, false),
        COALESCE((route->>'can_delete')::boolean, false),
        COALESCE((route->>'can_search')::boolean, false)
    FROM jsonb_array_elements(p_routes) AS route
    WHERE (route->>'route_id') IS NOT NULL;
END;
$$;


ALTER FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) OWNER TO supabase_admin;

--
-- Name: flow_order_visit_close_v2(jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.flow_order_visit_close_v2(payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    p_visit_id BIGINT;
    p_user_id BIGINT;
    p_order_status_id INTEGER;
    p_suspended_reason_id INTEGER;
    p_progress INTEGER;
    p_vehicles_check_override BOOLEAN;

    v_visit RECORD;
    v_order RECORD;
    v_user_name_short TEXT;
    v_notification_body TEXT;
    v_timestamp TIMESTAMP;
BEGIN
    -- 1. Extração de parâmetros
    p_visit_id := (payload->>'visit_id')::BIGINT;
    p_user_id := (payload->>'user_id')::BIGINT;
    p_order_status_id := (payload->>'order_status_id')::INTEGER;
    
    IF (payload->>'suspended_reason_id') IS NULL OR (payload->>'suspended_reason_id') = 'null' THEN
        p_suspended_reason_id := NULL;
    ELSE
        p_suspended_reason_id := (payload->>'suspended_reason_id')::INTEGER;
    END IF;

    IF (payload->>'progress') IS NULL OR (payload->>'progress') = 'null' THEN
        p_progress := NULL;
    ELSE
        p_progress := (payload->>'progress')::INTEGER;
    END IF;

    p_vehicles_check_override := COALESCE((payload->>'vehicles_check_override')::BOOLEAN, FALSE);
    v_timestamp := timezone('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 2. Validar Visita e OS
    SELECT id, o_id, ov_status_id INTO v_visit FROM orders_visits WHERE id = p_visit_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Visita não encontrada.');
    END IF;

    IF v_visit.ov_status_id = 2 THEN
         RETURN jsonb_build_object('success', false, 'message', 'Visita já está encerrada.');
    END IF;

    SELECT id, mask, client_name, unit_description, requested_services INTO v_order FROM v_orders WHERE id = v_visit.o_id;

    SELECT name_short INTO v_user_name_short FROM users WHERE id = p_user_id;

    -- 3. Atualizar orders_visits
    UPDATE orders_visits
    SET 
        ov_ended_at = v_timestamp,
        ov_status_id = 2, -- Encerrada
        ov_o_status_id = p_order_status_id,
        ov_o_suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE NULL END,
        ov_o_progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END
    WHERE id = p_visit_id;

    -- 4. Atualizar orders
    UPDATE orders
    SET
        status_id = p_order_status_id,
        suspended_reason_id = CASE WHEN p_order_status_id = 6 THEN p_suspended_reason_id ELSE suspended_reason_id END,
        progress = CASE WHEN p_order_status_id = 8 THEN 1 ELSE p_progress / 100.0 END,
        status_at = v_timestamp
    WHERE id = v_visit.o_id;

    -- 5. Liberar equipe em batch
    UPDATE users
    SET
        is_available = TRUE,
        ov_in_progress_leader_id = 0,
        o_contract_id_in_progress = 0,
        o_type_id_in_progress = 0,
        o_type_sub_id_in_progress = 0,
        o_plan_id_in_progress = 0,
        o_asset_tag_id_in_progress = 0,
        o_unit_id_in_progress = 0,
        o_system_id_in_progress = 0,
        o_system_parent_id_in_progress = 0,
        o_unit_type_id_in_progress = 0,
        o_unit_type_parent_id_in_progress = 0,
        o_object_id_in_progress = 0,
        ov_id_in_progress = 0,
        o_id_in_progress = 0,
        op_id_in_progress = 0,
        is_ov_in_progress = FALSE,
        ov_id_in_progress_mask = NULL
    WHERE id IN (
        SELECT user_id FROM orders_visits_teams WHERE ov_id = p_visit_id
    );

    -- 6. Enviar Notificações em LOTE (INSERT ... SELECT direto em 1 comando, SEM LOOP!)
    v_notification_body := COALESCE(v_user_name_short, 'Equipe') || ' encerrou a visita:' || E'\n' ||
                           'OS ' || COALESCE(v_order.mask, '') || E'\n' ||
                           'Cliente: ' || COALESCE(v_order.client_name, '') || E'\n' ||
                           'Unidade: ' || COALESCE(v_order.unit_description, '');

    INSERT INTO users_notifications (
        user_id_to,
        user_id_from,
        title,
        body,
        type,
        user_to_whatsapp,
        created_at,
        is_read
    )
    SELECT 
        f.user_id,
        p_user_id,
        'Visita encerrada.',
        v_notification_body,
        'Visita encerrada',
        u.mobile_whatsapp,
        v_timestamp,
        FALSE
    FROM orders_followers f
    JOIN users u ON u.id = f.user_id
    WHERE f.o_id = v_visit.o_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Visita encerrada com sucesso.',
        'visit_id', p_visit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao encerrar visita: ' || SQLERRM);
END;
$$;


ALTER FUNCTION public.flow_order_visit_close_v2(payload jsonb) OWNER TO supabase_admin;

--
-- Name: flow_order_visit_create_v2(jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.flow_order_visit_create_v2(payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_order_id bigint;
    v_user_id bigint;
    v_now timestamp;
    v_visit_id bigint;
    v_ov_mask text;
    v_new_ov_counter int;
    v_parent_id bigint;
    v_team_member record;
    v_follower record;
    v_order_info record;
    v_user_info record;
    v_order_mask text;
    v_team_id bigint;
    v_vehicle_id bigint;
    v_member_order int := 1;
BEGIN
    -- 1. Parse payload
    v_order_id := (payload->>'order_id')::bigint;
    v_user_id := (payload->>'user_id')::bigint;
    v_now := TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP);

    -- 2. Fetch User and Order Info
    SELECT team_id, vehicle_id INTO v_team_id, v_vehicle_id FROM users WHERE id = v_user_id;
    SELECT parent_id, order_mask, COALESCE(ov_counter, 0) INTO v_parent_id, v_order_mask, v_new_ov_counter FROM orders WHERE id = v_order_id;
    
    IF v_order_mask IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'OS não encontrada.');
    END IF;

    v_new_ov_counter := v_new_ov_counter + 1;
    v_ov_mask := v_order_mask || '.' || LPAD(v_new_ov_counter::text, 2, '0');

    -- 3. Execute Updates in Transaction
    -- A. Update Parent SS if exists
    IF v_parent_id IS NOT NULL THEN
        UPDATE orders
        SET 
            status_id = 5, -- Em Andamento
            status_at = v_now,
            ov_counter = ov_counter + 1 -- According to flow, parent also increments counter? Flow says "SS referente ao parent_id da OS ... ov_counter = ov_counter + 1"
        WHERE id = v_parent_id;
    END IF;

    -- B. Update Order (OS)
    UPDATE orders
    SET 
        status_id = 5, -- Em Andamento
        status_at = v_now,
        ov_counter = v_new_ov_counter
    WHERE id = v_order_id;

    -- C. Insert orders_visits
    INSERT INTO orders_visits (
        o_id,
        ov_status_id,
        ov_processing_id,
        ov_started_at,
        ov_team_leader_id,
        ov_created_user_id,
        ov_created_at,
        ov_mask
    ) VALUES (
        v_order_id,
        1, -- Em Andamento
        1, -- Rascunho
        v_now,
        v_user_id,
        v_user_id,
        v_now,
        v_ov_mask
    ) RETURNING id INTO v_visit_id;

    -- D. Handle Vehicle
    IF v_vehicle_id IS NOT NULL AND v_vehicle_id > 0 THEN
        INSERT INTO orders_visits_vehicles (
            ov_id,
            vehicle_id,
            created_user_id,
            created_at
        ) VALUES (
            v_visit_id,
            v_vehicle_id,
            v_user_id,
            v_now
        );
    END IF;

    -- E. Handle Team (Leader)
    INSERT INTO orders_visits_teams (
        ov_id,
        user_id,
        is_leader,
        order_id
    ) VALUES (
        v_visit_id,
        v_user_id,
        true,
        0
    );

    -- F. Update Leader Progress
    UPDATE users
    SET 
        ov_id_in_progress = v_visit_id,
        is_available = false,
        is_ov_in_progress = true,
        o_id_in_progress = v_order_id,
        op_id_in_progress = v_parent_id,
        ov_id_in_progress_mask = v_ov_mask
    WHERE id = v_user_id;

    -- G. Handle Other Team Members
    FOR v_team_member IN 
        SELECT id FROM users 
        WHERE team_id = v_team_id 
        AND is_available = true 
        AND id != v_user_id
        ORDER BY name_short ASC
    LOOP
        INSERT INTO orders_visits_teams (
            ov_id,
            user_id,
            is_leader,
            order_id
        ) VALUES (
            v_visit_id,
            v_team_member.id,
            false,
            v_member_order
        );

        UPDATE users
        SET 
            ov_id_in_progress = v_visit_id,
            is_available = false,
            is_ov_in_progress = true,
            o_id_in_progress = v_order_id,
            op_id_in_progress = v_parent_id,
            ov_id_in_progress_mask = v_ov_mask
        WHERE id = v_team_member.id;

        v_member_order := v_member_order + 1;
    END LOOP;

    -- 4. Send Notifications to Followers of Parent (SS)
    IF v_parent_id IS NOT NULL THEN
        SELECT * INTO v_order_info FROM v_orders WHERE id = v_order_id;
        SELECT name_short INTO v_user_info FROM users WHERE id = v_user_id;

        FOR v_follower IN 
            SELECT f.user_id, u.mobile_whatsapp 
            FROM orders_followers f
            JOIN users u ON u.id = f.user_id
            WHERE f.o_id = v_parent_id
        LOOP
            INSERT INTO users_notifications (
                user_id_to,
                user_id_from,
                title,
                body,
                type,
                user_to_whatsapp
            ) VALUES (
                v_follower.user_id,
                v_user_id,
                'OS em atendimento.',
                COALESCE(v_user_info.name_short, 'Técnico') || ' iniciou a visita:' || chr(10) ||
                'OS ' || COALESCE(v_order_info.order_mask, '') || ': ' || COALESCE(v_order_info.status_description, '') || chr(10) ||
                'Cliente: ' || COALESCE(v_order_info.client_name, '') || chr(10) ||
                'Unidade: ' || COALESCE(v_order_info.unit_description, '') || chr(10) ||
                'Setor/Posição: ' || COALESCE(v_order_info.asset_tag_description, '') || ' / ' || COALESCE(v_order_info.asset_tag_sub_description, '') || chr(10) ||
                'Serviços a realizar: ' || COALESCE(v_order_info.requested_services, ''),
                'OS em atendimento',
                v_follower.mobile_whatsapp
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Visita iniciada com sucesso.',
        'visit_id', v_visit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'Erro ao iniciar visita: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION public.flow_order_visit_create_v2(payload jsonb) OWNER TO supabase_admin;

--
-- Name: fn_audit_visit_costs_status(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.fn_audit_visit_costs_status() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log da mudança (pode ser expandido para tabela de auditoria)
  IF OLD.ov_costs_status IS DISTINCT FROM NEW.ov_costs_status THEN
    RAISE NOTICE 'Visit % costs status changed from % to %', 
      NEW.id, OLD.ov_costs_status, NEW.ov_costs_status;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_audit_visit_costs_status() OWNER TO supabase_admin;

--
-- Name: generate_impersonation_link(bigint, text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text DEFAULT NULL::text, p_service_role_key text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_uuid UUID;
    v_email TEXT;
    v_temp_password TEXT;
    v_original_password TEXT;
BEGIN
    -- Get user info from public.users
    SELECT u.uuid, u.email INTO v_uuid, v_email
    FROM public.users u
    WHERE u.id = p_target_user_id;

    IF v_uuid IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    IF v_email IS NULL THEN
        RETURN json_build_object('error', 'User has no email');
    END IF;

    -- Save original password hash before overwriting
    SELECT encrypted_password INTO v_original_password
    FROM auth.users
    WHERE id = v_uuid;

    IF v_original_password IS NOT NULL THEN
        -- Upsert: only save if no pending restore (restored_at IS NULL)
        INSERT INTO public.impersonation_password_backup
            (user_uuid, user_email, original_encrypted_password)
        VALUES
            (v_uuid, v_email, v_original_password)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Generate a random temp password (24 chars)
    v_temp_password := encode(gen_random_bytes(18), 'hex');

    -- Update the user's password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(v_temp_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_uuid;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'User not found in auth.users');
    END IF;

    -- Return email and temp password for frontend login
    RETURN json_build_object(
        'email', v_email,
        'password', v_temp_password,
        'uuid', v_uuid
    );
END;
$$;


ALTER FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) OWNER TO supabase_admin;

--
-- Name: get_users_within_distance(double precision, double precision, double precision, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) RETURNS SETOF public.users
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(user_lon)) +
      sin(radians(user_lat)) * sin(radians(latitude))
    )) <= max_dist_km
    AND age >= min_age
    AND age <= max_age;
END;
$$;


ALTER FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) OWNER TO supabase_admin;

--
-- Name: handle_followers_orders_status_changed(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.handle_followers_orders_status_changed() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_follower      RECORD;
    v_order         RECORD;
    v_user_name     TEXT;
    v_body          TEXT;
    v_timestamp     TEXT;
BEGIN
    -- Condição: só processa se o status_id mudou OU se é re-agendamento (status 4)
    IF OLD.status_id IS NOT DISTINCT FROM NEW.status_id AND NEW.status_id != 4 THEN
        RETURN NEW;
    END IF;

    -- Timestamp formatado no fuso horário de Brasília
    v_timestamp := TO_CHAR(
        TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
        'DD/MM/YYYY HH24:MI'
    );

    -- Buscar detalhes da OS (cliente, unidade, serviços)
    SELECT
        o.order_mask,
        o.requested_services,
        c.name              AS client_name,
        u.description_full  AS unit_description,
        s.description       AS status_description
    INTO v_order
    FROM public.orders o
    LEFT JOIN public.clients       c ON c.id = o.client_id
    LEFT JOIN public.units         u ON u.id = o.unit_id
    LEFT JOIN public.cfg_orders_statuses s ON s.id = NEW.status_id
    WHERE o.id = NEW.id;

    -- Buscar o nome curto do líder da equipe (com tratamento de erro)
    v_user_name := 'N/A';
    BEGIN
        SELECT name_short
        INTO v_user_name
        FROM public.users
        WHERE id = NEW.team_leader_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_name := 'N/A';
    END;

    IF v_user_name IS NULL OR v_user_name = '' THEN
        v_user_name := 'N/A';
    END IF;

    -- Iterar sobre cada seguidor da OS
    FOR v_follower IN
        SELECT
            f.user_id,
            u.mobile_whatsapp
        FROM public.orders_followers f
        JOIN public.users u ON u.id = f.user_id
        WHERE f.o_id = NEW.id
    LOOP
        -- Montar o corpo da notificação
        v_body :=
            'Atualização Situação OS ' || COALESCE(v_order.order_mask, '') || chr(10) ||
            'Cliente: '    || COALESCE(v_order.client_name, 'N/A')     || chr(10) ||
            'Unidade: '    || COALESCE(v_order.unit_description, 'N/A') || chr(10) ||
            'Serviços: '   || COALESCE(v_order.requested_services, 'N/A') || chr(10) ||
            'Situação: '   || COALESCE(v_order.status_description, 'N/A') || chr(10) ||
            'Data hora: '  || v_timestamp                               || chr(10) ||
            'Líder: '      || v_user_name;

        -- Inserir notificação para o seguidor (evitar duplicidade)
        IF NOT EXISTS (
            SELECT 1 FROM public.users_notifications
            WHERE user_id_to = v_follower.user_id
            AND o_id = NEW.id
            AND type = 'order_status_change'
            AND created_at >= TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP) - INTERVAL '10 seconds'
        ) THEN
            INSERT INTO public.users_notifications (
                user_id_to,
                user_id_from,
                title,
                body,
                type,
                user_to_whatsapp,
                o_id,
                created_at,
                is_read
            ) VALUES (
                v_follower.user_id,
                NEW.updated_user_id,
                'Atualização Situação OS ' || COALESCE(v_order.order_mask, ''),
                v_body,
                'order_status_change',
                v_follower.mobile_whatsapp,
                NEW.id,
                TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
                FALSE
            );
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_followers_orders_status_changed() OWNER TO supabase_admin;

--
-- Name: FUNCTION handle_followers_orders_status_changed(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.handle_followers_orders_status_changed() IS 'Flow: followers-orders-status-changed v1.4.0 — Notifica os seguidores de uma OS quando sua situação é alterada. Dispara após UPDATE em orders.status_id.';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (uuid, email, name_full, status_id, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'name',
    2, -- Default to Ativo
    now()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO supabase_admin;

--
-- Name: handle_notifications_count(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.handle_notifications_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.handle_notifications_count() OWNER TO supabase_admin;

--
-- Name: handle_profile_photo_change_notification(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.handle_profile_photo_change_notification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_super_admin_count int;
    v_inserted_count int;
BEGIN
    -- Log 1: Verificar se a condição do IF é verdadeira
    RAISE NOTICE 'Trigger executado. OLD.img_file_name: %, NEW.img_file_name: %', OLD.img_file_name, NEW.img_file_name;
    
    IF (OLD.img_file_name IS DISTINCT FROM NEW.img_file_name) AND (NEW.img_file_name IS NOT NULL) THEN
        RAISE NOTICE 'Condição atendida. Buscando super admins...';
        
        -- Log 2: Contar quantos super admins existem
        SELECT COUNT(*) INTO v_super_admin_count
        FROM public.users u 
        WHERE u.is_admin_super = true;
        
        RAISE NOTICE 'Super admins encontrados: %', v_super_admin_count;
        
        -- Tentar inserir
        INSERT INTO public.users_notifications (user_id_to, user_id_from, title, body, type)
        SELECT u.id, NEW.id, 'Foto de perfil atualizada', 
               'Usuário ' || COALESCE(NEW.name_full, 'Desconhecido') || ' atualizou a foto de perfil', 
               'profile_photo_change'
        FROM public.users u 
        WHERE u.is_admin_super = true;
        
        GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
        RAISE NOTICE 'Notificações inseridas: %', v_inserted_count;
    ELSE
        RAISE NOTICE 'Condição NÃO atendida. Trigger não executará INSERT.';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_profile_photo_change_notification() OWNER TO supabase_admin;

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_updated_at() OWNER TO supabase_admin;

--
-- Name: match_documents(extensions.vector, integer, jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) OWNER TO supabase_admin;

--
-- Name: match_knowledge(extensions.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.content,
    k.metadata,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM ai_knowledge k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;


ALTER FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) OWNER TO supabase_admin;

--
-- Name: nearby_units(double precision, double precision, double precision, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision DEFAULT 5000, status_filter text DEFAULT 'all'::text) RETURNS TABLE(id bigint, client_id bigint, description text, code text, installation_code_power_supply text, address_full text, latitude double precision, longitude double precision, unit_type_parent_id bigint, unit_type_id bigint, system_parent_id bigint, system_id bigint, status_id bigint, is_available boolean, description_full text, img_file_path text, img_file_name text, distance_meters double precision)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
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
        (
            6371000 * ACOS(
                COS(RADIANS(user_lat)) * COS(RADIANS(u.latitude)) *
                COS(RADIANS(u.longitude) - RADIANS(user_lng)) +
                SIN(RADIANS(user_lat)) * SIN(RADIANS(u.latitude))
            )
        )::DOUBLE PRECISION AS distance_meters
    FROM public.units u
    WHERE u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND u.is_deleted = 'false'
      AND u.latitude BETWEEN user_lat - (radius_meters / 111320) AND user_lat + (radius_meters / 111320)
      AND u.longitude BETWEEN user_lng - (radius_meters / (111320 * COS(RADIANS(user_lat)))) AND user_lng + (radius_meters / (111320 * COS(RADIANS(user_lat))))
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
$$;


ALTER FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) OWNER TO supabase_admin;

--
-- Name: recalculate_all_scores(integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT leader_department_id
        FROM public.v_order_visit_scores
        WHERE score_year = p_year
          AND score_month = p_month
    LOOP
        PERFORM public.recalculate_department_scores(rec.leader_department_id, p_year, p_month);
    END LOOP;
END;
$$;


ALTER FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: recalculate_department_scores(bigint, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT ov.leader_id
        FROM public.v_order_visit_scores ov
        WHERE ov.leader_department_id = p_department_id
          AND ov.score_year = p_year
          AND ov.score_month = p_month
    LOOP
        PERFORM public.recalculate_leader_monthly_score(rec.leader_id, p_year, p_month);
    END LOOP;
END;
$$;


ALTER FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: recalculate_leader_monthly_score(bigint, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_total_visits int;
    v_total_evals int;
    v_failed_evals int;
    v_total_penalty numeric(10,2);
    v_avg_compliance numeric(5,2);
    v_best_compliance numeric(5,2);
    v_worst_compliance numeric(5,2);
    v_leader_name varchar;
    v_dept_id bigint;
    v_dept_name varchar;
BEGIN
    SELECT u.name_short, u.team_id, d.id, d.description
    INTO v_leader_name, v_dept_id, v_dept_id, v_dept_name
    FROM public.users u
    JOIN public.cfg_teams t ON t.id = u.team_id
    JOIN public.cfg_departments d ON d.id = t.department_id
    WHERE u.id = p_leader_id;

    SELECT
        COUNT(*)::int,
        COALESCE(SUM(total_evaluations), 0)::int,
        COALESCE(SUM(failed_evaluations), 0)::int,
        COALESCE(SUM(penalty_score), 0)::numeric(10,2),
        CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(AVG(compliance_score), 2) END,
        COALESCE(MAX(compliance_score), 0)::numeric(5,2),
        COALESCE(MIN(compliance_score), 0)::numeric(5,2)
    INTO v_total_visits, v_total_evals, v_failed_evals, v_total_penalty,
         v_avg_compliance, v_best_compliance, v_worst_compliance
    FROM public.v_order_visit_scores
    WHERE leader_id = p_leader_id
      AND score_year = p_year
      AND score_month = p_month;

    INSERT INTO public.leader_monthly_scores (
        leader_id, leader_name, department_id, department_name,
        score_year, score_month,
        total_visits, total_evaluations, failed_evaluations,
        total_penalty_score, avg_compliance_score,
        best_compliance_score, worst_compliance_score,
        updated_at
    ) VALUES (
        p_leader_id, v_leader_name, v_dept_id, v_dept_name,
        p_year, p_month,
        v_total_visits, v_total_evals, v_failed_evals,
        v_total_penalty, v_avg_compliance,
        v_best_compliance, v_worst_compliance,
        now()
    )
    ON CONFLICT (leader_id, score_year, score_month)
    DO UPDATE SET
        leader_name = EXCLUDED.leader_name,
        department_name = EXCLUDED.department_name,
        total_visits = EXCLUDED.total_visits,
        total_evaluations = EXCLUDED.total_evaluations,
        failed_evaluations = EXCLUDED.failed_evaluations,
        total_penalty_score = EXCLUDED.total_penalty_score,
        avg_compliance_score = EXCLUDED.avg_compliance_score,
        best_compliance_score = EXCLUDED.best_compliance_score,
        worst_compliance_score = EXCLUDED.worst_compliance_score,
        updated_at = now();

    INSERT INTO public.leader_scores_history (
        leader_id, ov_id, order_id, score_year, score_month,
        total_evaluations, failed_evaluations, penalty_score,
        max_possible_score, compliance_score, evaluated_at
    )
    SELECT
        leader_id, ov_id, order_id, score_year, score_month,
        total_evaluations, failed_evaluations, penalty_score,
        max_possible_score, compliance_score, ov_ended_at
    FROM public.v_order_visit_scores
    WHERE leader_id = p_leader_id
      AND score_year = p_year
      AND score_month = p_month
    ON CONFLICT (ov_id)
    DO UPDATE SET
        total_evaluations = EXCLUDED.total_evaluations,
        failed_evaluations = EXCLUDED.failed_evaluations,
        penalty_score = EXCLUDED.penalty_score,
        max_possible_score = EXCLUDED.max_possible_score,
        compliance_score = EXCLUDED.compliance_score;

    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY department_id, score_year, score_month ORDER BY avg_compliance_score DESC, total_penalty_score ASC) AS new_rank
        FROM public.leader_monthly_scores
        WHERE department_id = v_dept_id
          AND score_year = p_year
          AND score_month = p_month
    )
    UPDATE public.leader_monthly_scores lms
    SET ranking_position = ranked.new_rank
    FROM ranked
    WHERE lms.id = ranked.id;
END;
$$;


ALTER FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: restore_original_password(uuid); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.restore_original_password(p_user_uuid uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_original_password TEXT;
BEGIN
    -- Get the most recent unrestored backup
    SELECT original_encrypted_password INTO v_original_password
    FROM public.impersonation_password_backup
    WHERE user_uuid = p_user_uuid
      AND restored_at IS NULL
    ORDER BY backed_up_at DESC
    LIMIT 1;

    IF v_original_password IS NULL THEN
        RETURN json_build_object('error', 'No backup found for this user');
    END IF;

    -- Restore the original password
    UPDATE auth.users
    SET encrypted_password = v_original_password,
        updated_at = now()
    WHERE id = p_user_uuid;

    -- Mark as restored
    UPDATE public.impersonation_password_backup
    SET restored_at = now()
    WHERE user_uuid = p_user_uuid
      AND restored_at IS NULL;

    RETURN json_build_object('success', true, 'uuid', p_user_uuid);
END;
$$;


ALTER FUNCTION public.restore_original_password(p_user_uuid uuid) OWNER TO supabase_admin;

--
-- Name: update_cfg_app_notices_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.update_cfg_app_notices_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_cfg_app_notices_updated_at() OWNER TO supabase_admin;

--
-- Name: update_cfg_app_tips_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.update_cfg_app_tips_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_cfg_app_tips_updated_at() OWNER TO supabase_admin;

--
-- Name: update_system_notices_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.update_system_notices_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_system_notices_updated_at() OWNER TO supabase_admin;

--
-- Name: update_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_new_id INTEGER;
    v_rate NUMERIC;
BEGIN
    -- Busca o rate configurado para este setor
    IF p_is_available THEN
        SELECT asset_available_rate INTO v_rate FROM cfg_units_assets_tags WHERE id = p_unit_asset_tag_id;
    ELSE
        v_rate := 0;
    END IF;

    -- 1. Inserir em assets_available usando os nomes de coluna confirmados
    INSERT INTO public.assets_available (
        unit_asset_tag_id,
        unit_id,
        asset_tag_id,
        asset_tag_sub_id,
        is_available,
        asset_unavailable_reason_id,
        comments,
        created_user_id,   -- Mapeado de p_reported_by_id
        reported_user_id,  -- Mapeado de p_reported_by_id
        file_path,
        file_name,
        operation_record,
        created_at,
        reported_at,
        reported_latitude,
        reported_longitude,
        unit_latitude,
        unit_longitude,
        unit_reported_distance_m, -- Nome exato da sua tabela
        provider_company_id,
        is_web,
        processing_id
    ) VALUES (
        p_unit_asset_tag_id,
        p_unit_id,
        p_asset_tag_id,
        p_asset_tag_sub_id,
        p_is_available,
        COALESCE(p_reason_id, 0),
        p_comments,
        p_reported_by_id,
        p_reported_by_id,
        p_file_path,
        p_file_name,
        p_operation_record,
        p_created_at::TIMESTAMP, -- Convertendo para sem timezone conforme sua tabela
        p_reported_at::TIMESTAMP,
        p_reported_latitude,
        p_reported_longitude,
        p_unit_latitude,
        p_unit_longitude,
        p_unit_reported_distance,
        p_provider_company_id,
        p_is_web,
        2 -- Processing ID padrão para reportes manuais
    ) RETURNING id INTO v_new_id;

    -- 2. Atualizar a tabela de cadastro (Snapshot do último status)
    UPDATE public.cfg_units_assets_tags
    SET 
        last_asset_available_id = v_new_id,
        last_is_available = p_is_available,
        last_asset_available_rate = v_rate,
        last_created_at = p_created_at::TIMESTAMP,
        last_reported_at = p_reported_at::TIMESTAMP,
        last_reported_user_id = p_reported_by_id,
        last_file_path = p_file_path,
        last_file_name = p_file_name,
        last_comments = p_comments,
        last_asset_unavailable_reason_id = p_reason_id,
        last_operation_record = p_operation_record,
        last_provider_company_id = p_provider_company_id,
        last_processing_id = 2
    WHERE id = p_unit_asset_tag_id;

    RETURN v_new_id;
END;
$$;


ALTER FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) OWNER TO supabase_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: ai_chat_histories; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.ai_chat_histories (
    id bigint NOT NULL,
    session_id text NOT NULL,
    user_id uuid,
    agent text,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_chat_histories OWNER TO supabase_admin;

--
-- Name: ai_chat_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.ai_chat_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_chat_histories_id_seq OWNER TO supabase_admin;

--
-- Name: ai_chat_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.ai_chat_histories_id_seq OWNED BY public.ai_chat_histories.id;


--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.ai_chat_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_chat_sessions OWNER TO supabase_admin;

--
-- Name: ai_knowledge; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.ai_knowledge (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding extensions.vector(768),
    created_at timestamp with time zone DEFAULT now(),
    source_type text
);


ALTER TABLE public.ai_knowledge OWNER TO supabase_admin;

--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    session_id uuid,
    role text,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


ALTER TABLE public.ai_messages OWNER TO supabase_admin;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.api_keys (
    id bigint NOT NULL,
    company_name text,
    api_key text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_keys OWNER TO supabase_admin;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.api_keys ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_alerts; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_alerts (
    id bigint NOT NULL,
    asset_id bigint,
    o_type_id bigint,
    priority_id bigint,
    description text,
    is_done boolean DEFAULT false,
    ova_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    o_id bigint
);


ALTER TABLE public.assets_alerts OWNER TO supabase_admin;

--
-- Name: assets_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_alerts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_attributes_values; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_attributes_values (
    asset_id bigint NOT NULL,
    field_key text NOT NULL,
    value text
);


ALTER TABLE public.assets_attributes_values OWNER TO supabase_admin;

--
-- Name: assets_available; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_available (
    id bigint NOT NULL,
    created_at timestamp without time zone NOT NULL,
    unit_id bigint,
    asset_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint,
    is_available boolean,
    status_id bigint,
    file_path text,
    file_name text,
    comments character varying,
    created_user_id bigint,
    asset_unavailable_reason_id bigint DEFAULT '0'::bigint,
    processing_id smallint DEFAULT '1'::smallint,
    reported_at timestamp without time zone,
    reported_user_id bigint,
    operation_record numeric,
    reported_latitude double precision,
    reported_longitude double precision,
    reported_coordinates character varying,
    is_on boolean,
    operation_unit character varying,
    flow_rate_unit character varying,
    flow_rate_min numeric DEFAULT '0'::numeric,
    flow_rate_max numeric DEFAULT '0'::numeric,
    power_unit character varying,
    power_min numeric DEFAULT '0'::numeric,
    power_max numeric DEFAULT '0'::numeric,
    pressure_unit character varying,
    pressure_min numeric DEFAULT '0'::numeric,
    pressure_max numeric DEFAULT '0'::numeric,
    flow_rate_is_on numeric DEFAULT '0'::numeric,
    power_is_on numeric DEFAULT '0'::numeric,
    pressure_is_on numeric DEFAULT '0'::numeric,
    flow_rate_is_available numeric DEFAULT '0'::numeric,
    power_is_available numeric DEFAULT '0'::numeric,
    pressure_is_available numeric DEFAULT '0'::numeric,
    voltage_unit character varying,
    voltage_min numeric DEFAULT '0'::numeric,
    voltage_max numeric DEFAULT '0'::numeric,
    voltage_is_on boolean DEFAULT true,
    voltage_is_available boolean DEFAULT true,
    unit_latitude double precision,
    unit_longitude double precision,
    unit_reported_distance_m double precision,
    is_web boolean DEFAULT false,
    company_id bigint DEFAULT '1'::bigint,
    provider_company_id bigint,
    o_id bigint,
    o_mask character varying,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    unit_asset_tag_id bigint
);


ALTER TABLE public.assets_available OWNER TO supabase_admin;

--
-- Name: assets_available_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_available ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_available_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_followers (
    id bigint NOT NULL,
    user_id bigint,
    asset_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.assets_followers OWNER TO supabase_admin;

--
-- Name: assets_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: assets_loans; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_loans (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    borrower_name character varying(255) NOT NULL,
    lender_user_id bigint NOT NULL,
    expected_return_date date NOT NULL,
    actual_return_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_user_id bigint,
    deleted_user_id bigint,
    signature_delivery_path text,
    signature_delivery_name character varying(255) DEFAULT NULL::character varying,
    signature_delivery_at timestamp without time zone,
    signature_return_path text,
    signature_return_name character varying(255) DEFAULT NULL::character varying,
    signature_return_at timestamp without time zone,
    signature_delivery_signer_name character varying(255) DEFAULT NULL::character varying,
    signature_return_signer_name character varying(255) DEFAULT NULL::character varying,
    inspector_delivery_user_id bigint,
    inspector_return_user_id bigint,
    items_checklists_divergent_count integer DEFAULT 0,
    CONSTRAINT assets_loans_status_check CHECK (((status)::text = ANY ((ARRAY['analysis'::character varying, 'pending'::character varying, 'closed'::character varying, 'overdue'::character varying])::text[])))
);


ALTER TABLE public.assets_loans OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_loans_checklists (
    id bigint NOT NULL,
    loan_id bigint NOT NULL,
    loan_checklist_id bigint,
    phase character varying(15) NOT NULL,
    status character varying(15) DEFAULT 'pending'::character varying,
    custom_item_description character varying(255),
    notes text,
    filled_by_user_id bigint,
    filled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    is_divergent boolean DEFAULT false,
    CONSTRAINT assets_loans_checklists_phase_check CHECK (((phase)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[]))),
    CONSTRAINT assets_loans_checklists_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'ok'::character varying, 'damaged'::character varying, 'missing'::character varying, 'not_applicable'::character varying])::text[])))
);


ALTER TABLE public.assets_loans_checklists OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.assets_loans_checklists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_id_seq OWNED BY public.assets_loans_checklists.id;


--
-- Name: assets_loans_checklists_images; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.assets_loans_checklists_images (
    id bigint NOT NULL,
    checklist_id bigint NOT NULL,
    image_url text NOT NULL,
    image_type character varying(20) DEFAULT 'photo'::character varying,
    uploaded_by_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT assets_loans_checklists_images_image_type_check CHECK (((image_type)::text = ANY ((ARRAY['photo'::character varying, 'document'::character varying, 'damage'::character varying])::text[])))
);


ALTER TABLE public.assets_loans_checklists_images OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_images_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.assets_loans_checklists_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_loans_checklists_images_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_images_id_seq OWNED BY public.assets_loans_checklists_images.id;


--
-- Name: assets_loans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.assets_loans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_loans_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_id_seq OWNED BY public.assets_loans.id;


--
-- Name: assets_materials; Type: TABLE; Schema: public; Owner: supabase_admin
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


ALTER TABLE public.assets_materials OWNER TO supabase_admin;

--
-- Name: assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: audits_logs; Type: TABLE; Schema: public; Owner: supabase_admin
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


ALTER TABLE public.audits_logs OWNER TO supabase_admin;

--
-- Name: carts_materials; Type: TABLE; Schema: public; Owner: supabase_admin
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


ALTER TABLE public.carts_materials OWNER TO supabase_admin;

--
-- Name: carts_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_app; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app (
    id bigint NOT NULL,
    apk_url character varying NOT NULL,
    version_app character varying NOT NULL,
    logo_url character varying,
    version_app_offline character varying DEFAULT '1'::character varying,
    n8n_available_last_at timestamp without time zone,
    version_app_mask text
);


ALTER TABLE public.cfg_app OWNER TO supabase_admin;

--
-- Name: cfg_app_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_app_notices; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_notices (
    id bigint NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    category_id integer NOT NULL,
    severity_id integer NOT NULL,
    start_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text) NOT NULL,
    end_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text),
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text),
    is_active boolean DEFAULT true,
    dashboards text[] DEFAULT ARRAY['dashboard'::text, 'orders'::text, 'units'::text],
    created_user_id integer NOT NULL,
    CONSTRAINT check_end_date_after_start CHECK ((end_date > start_date))
);


ALTER TABLE public.cfg_app_notices OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices IS 'Avisos do App - Alertas e comunicados para os usuários';


--
-- Name: COLUMN cfg_app_notices.category_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.category_id IS 'FK para system_notice_categories';


--
-- Name: COLUMN cfg_app_notices.severity_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.severity_id IS 'FK para system_notice_severities';


--
-- Name: COLUMN cfg_app_notices.dashboards; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.dashboards IS 'Array de painéis onde o aviso é visível: dashboard, orders, units';


--
-- Name: cfg_app_notices_categories; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_notices_categories (
    id integer NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    icon text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text)
);


ALTER TABLE public.cfg_app_notices_categories OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices_categories; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices_categories IS 'Categorias de avisos do app';


--
-- Name: cfg_app_notices_severities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_notices_severities (
    id integer NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    icon text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text)
);


ALTER TABLE public.cfg_app_notices_severities OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices_severities; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices_severities IS 'Níveis de severidade dos avisos';


--
-- Name: cfg_app_offline_updates; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_offline_updates (
    id bigint NOT NULL,
    table_name text,
    version_offline character varying DEFAULT '1'::character varying,
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);


ALTER TABLE public.cfg_app_offline_updates OWNER TO supabase_admin;

--
-- Name: cfg_app_offline_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_app_pages; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_pages (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available_provider boolean DEFAULT false
);


ALTER TABLE public.cfg_app_pages OWNER TO supabase_admin;

--
-- Name: cfg_app_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_app_tips; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_tips (
    title text NOT NULL,
    body text NOT NULL,
    icon text DEFAULT 'lightbulb'::text NOT NULL,
    screen_target text DEFAULT '*'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    id integer NOT NULL,
    target_mode text DEFAULT 'all'::text NOT NULL
);


ALTER TABLE public.cfg_app_tips OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_app_tips.target_mode; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_tips.target_mode IS 'all = all users, filtered = targeted to specific companies/departments/profiles';


--
-- Name: cfg_app_tips_companies; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_tips_companies (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    company_id bigint NOT NULL
);


ALTER TABLE public.cfg_app_tips_companies OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_app_tips_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_app_tips_companies_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_companies_id_seq OWNED BY public.cfg_app_tips_companies.id;


--
-- Name: cfg_app_tips_departments; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_tips_departments (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    department_id bigint NOT NULL
);


ALTER TABLE public.cfg_app_tips_departments OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_app_tips_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_app_tips_departments_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_departments_id_seq OWNED BY public.cfg_app_tips_departments.id;


--
-- Name: cfg_app_tips_dismissals; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_tips_dismissals (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    user_id integer NOT NULL,
    dismissed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cfg_app_tips_dismissals OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_dismissals_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_app_tips_dismissals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_app_tips_dismissals_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_dismissals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_dismissals_id_seq OWNED BY public.cfg_app_tips_dismissals.id;


--
-- Name: cfg_app_tips_new_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_app_tips_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_app_tips_new_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_new_id_seq OWNED BY public.cfg_app_tips.id;


--
-- Name: cfg_app_tips_profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_tips_profiles (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    profile_id bigint NOT NULL
);


ALTER TABLE public.cfg_app_tips_profiles OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_app_tips_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_app_tips_profiles_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_profiles_id_seq OWNED BY public.cfg_app_tips_profiles.id;


--
-- Name: cfg_app_versions_update; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_app_versions_update (
    id bigint NOT NULL,
    app_version character varying,
    updates text
);


ALTER TABLE public.cfg_app_versions_update OWNER TO supabase_admin;

--
-- Name: cfg_app_versions_update_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_versions_update ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_versions_update_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_attributes; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_attributes (
    id bigint NOT NULL,
    field_key character varying NOT NULL,
    label character varying NOT NULL,
    data_type character varying DEFAULT 'text'::character varying NOT NULL,
    unit character varying,
    decimals integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    select_options jsonb,
    select_options_group_id bigint
);


ALTER TABLE public.cfg_assets_attributes OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_assets_attributes.select_options; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_assets_attributes.select_options IS 'Opções para campos do tipo select (modo inline). Formato JSON: [{"value":"...","label":"..."}]';


--
-- Name: COLUMN cfg_assets_attributes.select_options_group_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_assets_attributes.select_options_group_id IS 'FK para cfg_assets_attributes_groups. Quando preenchido, as opções do select vêm deste grupo.';


--
-- Name: cfg_assets_attributes_groups; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_attributes_groups (
    id bigint NOT NULL,
    group_name character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    parent_id bigint
);


ALTER TABLE public.cfg_assets_attributes_groups OWNER TO supabase_admin;

--
-- Name: cfg_assets_attributes_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_assets_attributes_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_assets_attributes_groups_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_assets_attributes_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_attributes_groups_id_seq OWNED BY public.cfg_assets_attributes_groups.id;


--
-- Name: cfg_assets_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_assets_available_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_assets_couplings_models_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_assets_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_assets_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_assets_types_attributes; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_types_attributes (
    id bigint NOT NULL,
    asset_type_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    col_span smallint DEFAULT 12
);


ALTER TABLE public.cfg_assets_types_attributes OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_attributes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_types_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_types_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_assets_types_loans_checklists (
    id bigint NOT NULL,
    checklist_id bigint NOT NULL,
    asset_type_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cfg_assets_types_loans_checklists OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_assets_types_loans_checklists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_assets_types_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_types_loans_checklists_id_seq OWNED BY public.cfg_assets_types_loans_checklists.id;


--
-- Name: cfg_assets_unavailable_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_contracts_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_contracts_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_contracts_statuses OWNER TO supabase_admin;

--
-- Name: cfg_contracts_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_departments; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_departments (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    parent_id bigint,
    company_id bigint,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.cfg_departments OWNER TO supabase_admin;

--
-- Name: cfg_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_evaluation_requirements; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_evaluation_requirements (
    id bigint NOT NULL,
    description character varying(255) NOT NULL,
    code character varying(50),
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cfg_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: cfg_evaluation_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_evaluation_requirements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_evaluation_requirements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_loans_checklists (
    id bigint NOT NULL,
    description character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cfg_loans_checklists OWNER TO supabase_admin;

--
-- Name: cfg_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_loans_checklists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_loans_checklists_id_seq OWNED BY public.cfg_loans_checklists.id;


--
-- Name: cfg_materials_purchases_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_materials_purchases_statuses (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL
);


ALTER TABLE public.cfg_materials_purchases_statuses OWNER TO supabase_admin;

--
-- Name: cfg_material_purchases_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_material_purchases_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_material_purchases_statuses_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_material_purchases_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_material_purchases_statuses_id_seq OWNED BY public.cfg_materials_purchases_statuses.id;


--
-- Name: cfg_materials_purchases_cancel_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_materials_purchases_cancel_reasons (
    id bigint NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.cfg_materials_purchases_cancel_reasons OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_materials_purchases_types (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.cfg_materials_purchases_types OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.cfg_materials_purchases_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cfg_materials_purchases_types_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_materials_purchases_types_id_seq OWNED BY public.cfg_materials_purchases_types.id;


--
-- Name: cfg_materials_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_materials_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_materials_statuses OWNER TO supabase_admin;

--
-- Name: cfg_materials_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_materials_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_materials_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_materials_types (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_materials_types OWNER TO supabase_admin;

--
-- Name: cfg_materials_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_materials_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_cancel_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_causes_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_counter; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_counter (
    id bigint NOT NULL,
    company_id bigint,
    year integer,
    counter bigint DEFAULT '0'::bigint,
    is_dev boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.cfg_orders_counter OWNER TO supabase_admin;

--
-- Name: cfg_orders_counter_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_objects_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_suspended_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_types_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_types_subs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_visits_extras_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_orders_visits_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_visits_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    icon text DEFAULT 'engineering'::text,
    icon_color text DEFAULT 'text-white'::text,
    bg_color text DEFAULT 'bg-slate-500'::text
);


ALTER TABLE public.cfg_orders_visits_processing OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_visits_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_orders_visits_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_orders_visits_statuses OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_profiles (
    id bigint NOT NULL,
    description character varying,
    department_id bigint,
    version character varying DEFAULT 'live'::character varying,
    company_id bigint DEFAULT '1'::bigint
);


ALTER TABLE public.cfg_profiles OWNER TO supabase_admin;

--
-- Name: cfg_profiles_access; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_profiles_access (
    id bigint NOT NULL,
    profile_id bigint NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    route_id bigint NOT NULL,
    can_search boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cfg_profiles_access OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_profiles_access.route_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_profiles_access.route_id IS 'Foreign key to cfg_routes - defines which route this permission applies to';


--
-- Name: cfg_profiles_access_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_profiles_permissions; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_profiles_permissions (
    id bigint NOT NULL,
    profile_id bigint,
    app_page_id bigint
);


ALTER TABLE public.cfg_profiles_permissions OWNER TO supabase_admin;

--
-- Name: cfg_profiles_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_routes; Type: TABLE; Schema: public; Owner: supabase_admin
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
    updated_at timestamp without time zone,
    is_visible_to_admin boolean DEFAULT true
);


ALTER TABLE public.cfg_routes OWNER TO supabase_admin;

--
-- Name: TABLE cfg_routes; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_routes IS 'Registry of all available routes/pages in the system for permission management - Updated 2026-01-25';


--
-- Name: cfg_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_systems_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_technicals_manuals_categories; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_technicals_manuals_categories (
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


ALTER TABLE public.cfg_technicals_manuals_categories OWNER TO supabase_admin;

--
-- Name: cfg_technicals_manuals_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_technicals_manuals_categories ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_technicals_manuals_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_assets_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_units_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_units_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: cfg_users_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.cfg_users_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);


ALTER TABLE public.cfg_users_statuses OWNER TO supabase_admin;

--
-- Name: cfg_users_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: chat_agent_ai; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.chat_agent_ai (
    id bigint NOT NULL,
    user_id bigint,
    "from" character varying,
    msg text,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.chat_agent_ai OWNER TO supabase_admin;

--
-- Name: chat_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.chat_agent_ai ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.chat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: contracts_evaluation_requirements; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.contracts_evaluation_requirements (
    id bigint NOT NULL,
    contract_id bigint NOT NULL,
    evaluation_id bigint NOT NULL,
    weight integer NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contracts_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: contracts_evaluation_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_evaluation_requirements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_evaluation_requirements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: contracts_managers; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.contracts_managers (
    id bigint NOT NULL,
    contract_id bigint,
    manager_id bigint,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    role character varying DEFAULT 'viewer'::character varying
);


ALTER TABLE public.contracts_managers OWNER TO supabase_admin;

--
-- Name: contracts_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: contracts_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: documents; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    content text,
    metadata jsonb,
    embedding extensions.vector(1536)
);


ALTER TABLE public.documents OWNER TO supabase_admin;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO supabase_admin;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: extensions; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.extensions OWNER TO supabase_admin;

--
-- Name: goose_db_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goose_db_version (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goose_db_version OWNER TO postgres;

--
-- Name: goose_db_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.goose_db_version ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.goose_db_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: impersonation_password_backup; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.impersonation_password_backup (
    id bigint NOT NULL,
    user_uuid uuid NOT NULL,
    user_email text NOT NULL,
    original_encrypted_password text NOT NULL,
    backed_up_at timestamp with time zone DEFAULT now(),
    restored_at timestamp with time zone
);


ALTER TABLE public.impersonation_password_backup OWNER TO supabase_admin;

--
-- Name: impersonation_password_backup_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.impersonation_password_backup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.impersonation_password_backup_id_seq OWNER TO supabase_admin;

--
-- Name: impersonation_password_backup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.impersonation_password_backup_id_seq OWNED BY public.impersonation_password_backup.id;


--
-- Name: import_orders_visits_contracts; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.import_orders_visits_contracts (
    id bigint NOT NULL,
    user_email character varying,
    contract_code character varying,
    year integer,
    month smallint,
    date timestamp without time zone,
    unit_code character varying,
    asset_code character varying,
    activity_code character varying,
    activity_description character varying,
    service_code character varying,
    service_description character varying,
    service_unit character varying,
    value_unit double precision,
    amount double precision,
    discount double precision,
    value_total double precision,
    success boolean DEFAULT true,
    error_msg character varying,
    order_mask character varying,
    processing_id smallint DEFAULT '1'::smallint,
    created_at timestamp without time zone DEFAULT now(),
    finger_print character varying
);


ALTER TABLE public.import_orders_visits_contracts OWNER TO supabase_admin;

--
-- Name: leader_monthly_scores; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.leader_monthly_scores (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    leader_name character varying,
    department_id bigint NOT NULL,
    department_name character varying,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    total_visits integer DEFAULT 0 NOT NULL,
    total_evaluations integer DEFAULT 0 NOT NULL,
    failed_evaluations integer DEFAULT 0 NOT NULL,
    total_penalty_score numeric(10,2) DEFAULT 0 NOT NULL,
    avg_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    best_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    worst_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    ranking_position integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leader_monthly_scores OWNER TO supabase_admin;

--
-- Name: leader_monthly_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_monthly_scores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_monthly_scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: leader_score_badges; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.leader_score_badges (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    badge_code character varying(50) NOT NULL,
    badge_name character varying(100) NOT NULL,
    badge_description text,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    earned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leader_score_badges OWNER TO supabase_admin;

--
-- Name: leader_score_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_score_badges ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_score_badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: leader_scores_history; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.leader_scores_history (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    ov_id bigint NOT NULL,
    order_id bigint,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    total_evaluations integer DEFAULT 0 NOT NULL,
    failed_evaluations integer DEFAULT 0 NOT NULL,
    penalty_score numeric(10,2) DEFAULT 0 NOT NULL,
    max_possible_score numeric(10,2) DEFAULT 0 NOT NULL,
    compliance_score numeric(5,2) DEFAULT 100 NOT NULL,
    evaluated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leader_scores_history OWNER TO supabase_admin;

--
-- Name: leader_scores_history_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_scores_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_scores_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: logs_api; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.logs_api (
    id bigint NOT NULL,
    api_key text,
    endpoint text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.logs_api OWNER TO supabase_admin;

--
-- Name: logs_api_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.logs_api ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.logs_api_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.audits_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: maintenances_plans; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.maintenances_plans (
    id bigint NOT NULL,
    code character varying,
    description text NOT NULL,
    asset_type_id bigint,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone
);


ALTER TABLE public.maintenances_plans OWNER TO supabase_admin;

--
-- Name: maintenances_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.maintenances_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenances_plans_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_id_seq OWNED BY public.maintenances_plans.id;


--
-- Name: maintenances_plans_sections; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.maintenances_plans_sections (
    id bigint NOT NULL,
    maintenance_plan_id bigint,
    description text NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    order_index bigint DEFAULT '0'::bigint
);


ALTER TABLE public.maintenances_plans_sections OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.maintenances_plans_sections_activities (
    id bigint NOT NULL,
    maintenance_plan_section_id bigint,
    activity_id bigint,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    order_index bigint DEFAULT '0'::bigint,
    description text,
    comments_default text
);


ALTER TABLE public.maintenances_plans_sections_activities OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.maintenances_plans_sections_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenances_plans_sections_activities_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_activities_id_seq OWNED BY public.maintenances_plans_sections_activities.id;


--
-- Name: maintenances_plans_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.maintenances_plans_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenances_plans_sections_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_id_seq OWNED BY public.maintenances_plans_sections.id;


--
-- Name: materials_purchases; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.materials_purchases (
    id bigint NOT NULL,
    material_id bigint NOT NULL,
    purchase_type_id bigint NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    justification text NOT NULL,
    status_id bigint NOT NULL,
    requester_user_id bigint NOT NULL,
    authorizer_user_id bigint,
    authorized_at timestamp without time zone,
    cancel_reason text,
    concluded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    warehouse_id bigint,
    created_user_id bigint,
    code character varying(50),
    cancel_reason_id bigint
);


ALTER TABLE public.materials_purchases OWNER TO supabase_admin;

--
-- Name: material_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.material_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_purchases_id_seq OWNER TO supabase_admin;

--
-- Name: material_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.material_purchases_id_seq OWNED BY public.materials_purchases.id;


--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: materials_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials_purchases ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.materials_purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: n8n_chat_histories; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.n8n_chat_histories (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    message jsonb NOT NULL
);


ALTER TABLE public.n8n_chat_histories OWNER TO supabase_admin;

--
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.n8n_chat_histories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNER TO supabase_admin;

--
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNED BY public.n8n_chat_histories.id;


--
-- Name: orders_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_followers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    o_id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.orders_followers OWNER TO supabase_admin;

--
-- Name: orders_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_statuses_logs; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_statuses_logs (
    id bigint NOT NULL,
    order_id bigint,
    order_status_id bigint,
    order_status_at timestamp without time zone,
    created_user_id bigint,
    created_date timestamp without time zone,
    order_parent_id bigint,
    company_id bigint,
    department_id bigint
);


ALTER TABLE public.orders_statuses_logs OWNER TO supabase_admin;

--
-- Name: orders_statuses_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_statuses_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_statuses_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits; Type: TABLE; Schema: public; Owner: supabase_admin
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
    ov_assets_approved_filed_amount integer DEFAULT 0,
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
    ov_o_status_id bigint DEFAULT '5'::bigint,
    ov_o_progress numeric DEFAULT '0'::numeric,
    ov_img_file_path text,
    ov_img_file_name text,
    ov_pdf_file_path text,
    ov_pdf_file_name text,
    is_extra boolean DEFAULT false,
    ov_assets_approved_no_filed_amount integer DEFAULT 0,
    ov_approved_filed_user_id bigint,
    ov_approved_filed_at timestamp without time zone,
    finger_print character varying,
    ov_payment_at timestamp without time zone,
    ov_payment_invoices text,
    ov_started_year smallint,
    ov_started_month smallint,
    ov_invoices character varying,
    ov_assets_approved_amount bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    ov_signature_leader_path text,
    ov_signature_leader_name character varying,
    ov_signature_leader_at timestamp without time zone,
    ov_signature_requester_path text,
    ov_signature_requester_name character varying,
    ov_signature_requester_at timestamp without time zone,
    chat_status text DEFAULT 'open'::text NOT NULL,
    chat_closed_at timestamp with time zone,
    chat_closed_user_id bigint,
    chat_created_user_id bigint,
    ov_costs_status text,
    ov_costs_waiting_at timestamp without time zone,
    ov_costs_waiting_user_id bigint,
    ov_costs_approved_at timestamp without time zone,
    ov_costs_approved_user_id bigint,
    ov_costs_rejected_at timestamp without time zone,
    ov_costs_rejected_user_id bigint,
    ov_costs_rejection_reason text,
    CONSTRAINT orders_visits_ov_costs_status_check CHECK (((ov_costs_status IS NULL) OR (ov_costs_status = ANY (ARRAY['pending'::text, 'waiting'::text, 'approved'::text, 'rejected'::text]))))
);


ALTER TABLE public.orders_visits OWNER TO supabase_admin;

--
-- Name: COLUMN orders_visits.ov_costs_status; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_status IS 'Status da aprovação financeira: pending (aguardando custos), submitted (custos enviados), approved (aprovado), rejected (rejeitado)';


--
-- Name: COLUMN orders_visits.ov_costs_waiting_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_waiting_at IS 'Data/hora em que os custos foram enviados para aprovação';


--
-- Name: COLUMN orders_visits.ov_costs_waiting_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_waiting_user_id IS 'Usuário que enviou os custos para aprovação';


--
-- Name: COLUMN orders_visits.ov_costs_approved_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_approved_at IS 'Data/hora da aprovação financeira';


--
-- Name: COLUMN orders_visits.ov_costs_approved_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_approved_user_id IS 'Usuário que aprovou financeiramente';


--
-- Name: COLUMN orders_visits.ov_costs_rejected_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejected_at IS 'Data/hora da rejeição dos custos';


--
-- Name: COLUMN orders_visits.ov_costs_rejected_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejected_user_id IS 'Usuário que rejeitou os custos';


--
-- Name: COLUMN orders_visits.ov_costs_rejection_reason; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejection_reason IS 'Motivo da rejeição dos custos financeiros';


--
-- Name: orders_visits_assets; Type: TABLE; Schema: public; Owner: supabase_admin
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
    has_recorder boolean DEFAULT true,
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
    before_unit_asset_tag_id bigint DEFAULT '0'::bigint,
    after_unit_asset_tag_id bigint DEFAULT '0'::bigint,
    before_img_file_name_thumb character varying,
    after_img_file_name_thumb character varying,
    is_filed boolean DEFAULT false,
    before_img_files_names jsonb,
    after_img_files_names jsonb,
    before_client_id bigint,
    after_client_id bigint,
    before_location text,
    after_location text,
    activities_description text,
    maintenance_plan_id bigint,
    maintenance_plan_progress numeric DEFAULT '0'::numeric
);


ALTER TABLE public.orders_visits_assets OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_activities; Type: TABLE; Schema: public; Owner: supabase_admin
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
    is_deleted boolean DEFAULT false,
    maintenance_plan_id bigint,
    img_file_path character varying,
    img_files_names jsonb,
    comments text,
    status character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.orders_visits_assets_activities OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_assets_materials; Type: TABLE; Schema: public; Owner: supabase_admin
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
    ova_id bigint,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.orders_visits_assets_materials OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_chat; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_chat (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    message text NOT NULL,
    is_action_item boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    info_requested boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders_visits_chat OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.orders_visits_chat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_visits_chat_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_id_seq OWNED BY public.orders_visits_chat.id;


--
-- Name: orders_visits_chat_participants; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_chat_participants (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders_visits_chat_participants OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.orders_visits_chat_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_visits_chat_participants_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_participants_id_seq OWNED BY public.orders_visits_chat_participants.id;


--
-- Name: orders_visits_chat_reads; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_chat_reads (
    id bigint NOT NULL,
    chat_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders_visits_chat_reads OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.orders_visits_chat_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_visits_chat_reads_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_reads_id_seq OWNED BY public.orders_visits_chat_reads.id;


--
-- Name: orders_visits_evaluations; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_evaluations (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    contract_evaluation_id bigint NOT NULL,
    was_applied boolean DEFAULT false NOT NULL,
    notes text,
    evaluated_by_user_id bigint NOT NULL,
    evaluated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orders_visits_evaluations OWNER TO supabase_admin;

--
-- Name: orders_visits_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_evaluations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_evaluations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_extras_followers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    ove_id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.orders_visits_extras_followers OWNER TO supabase_admin;

--
-- Name: orders_visits_extras_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_extras_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_extras_teams (
    ove_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying,
    order_by bigint DEFAULT '0'::bigint,
    duration_hours double precision DEFAULT '0'::double precision,
    started_at_date date,
    started_at_hour_min time without time zone,
    ended_at_date date,
    ended_at_hour_min time without time zone
);


ALTER TABLE public.orders_visits_extras_teams OWNER TO supabase_admin;

--
-- Name: orders_visits_extras_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_services; Type: TABLE; Schema: public; Owner: supabase_admin
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
    is_deleted boolean DEFAULT false,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.orders_visits_services OWNER TO supabase_admin;

--
-- Name: orders_visits_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.orders_visits_teams (
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying,
    order_id smallint
);


ALTER TABLE public.orders_visits_teams OWNER TO supabase_admin;

--
-- Name: orders_visits_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: orders_visits_vehicles; Type: TABLE; Schema: public; Owner: supabase_admin
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
    version_mode character varying DEFAULT 'live'::character varying,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.orders_visits_vehicles OWNER TO supabase_admin;

--
-- Name: orders_visits_vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE public.schema_migrations OWNER TO supabase_admin;

--
-- Name: system_notice_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.system_notice_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_notice_categories_id_seq OWNER TO supabase_admin;

--
-- Name: system_notice_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_categories_id_seq OWNED BY public.cfg_app_notices_categories.id;


--
-- Name: system_notice_severities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.system_notice_severities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_notice_severities_id_seq OWNER TO supabase_admin;

--
-- Name: system_notice_severities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_severities_id_seq OWNED BY public.cfg_app_notices_severities.id;


--
-- Name: system_notices_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.system_notices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_notices_id_seq OWNER TO supabase_admin;

--
-- Name: system_notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notices_id_seq OWNED BY public.cfg_app_notices.id;


--
-- Name: technicals_manuals_assets; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.technicals_manuals_assets (
    id bigint NOT NULL,
    tm_id bigint,
    asset_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);


ALTER TABLE public.technicals_manuals_assets OWNER TO supabase_admin;

--
-- Name: technicals_manuals_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: technicals_manuals_files_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.technicals_manuals_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.technicals_manuals_files_id_seq OWNER TO supabase_admin;

--
-- Name: technicals_manuals_files; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.technicals_manuals_files (
    id bigint DEFAULT nextval('public.technicals_manuals_files_id_seq'::regclass) NOT NULL,
    tm_id bigint NOT NULL,
    doc_file_path text,
    doc_file_name text,
    file_type character varying DEFAULT 'pdf'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    tm_category_id bigint
);


ALTER TABLE public.technicals_manuals_files OWNER TO supabase_admin;

--
-- Name: technicals_manuals_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: tenants; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'gen_rpc'::character varying,
    max_presence_events_per_second integer DEFAULT 1000,
    max_payload_size_in_kb integer DEFAULT 3000
);


ALTER TABLE public.tenants OWNER TO supabase_admin;

--
-- Name: tmp_contracts_import_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.import_orders_visits_contracts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tmp_contracts_import_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tools; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.tools (
    id integer NOT NULL,
    brand character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    serial_number character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'DISPONIVEL'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    material_id bigint,
    code character varying(100) DEFAULT ''::character varying NOT NULL,
    deleted_at timestamp without time zone,
    deleted_user_id integer,
    is_deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id integer,
    CONSTRAINT tools_status_check CHECK (((status)::text = ANY ((ARRAY['DISPONIVEL'::character varying, 'EM_USO'::character varying, 'MANUTENCAO'::character varying, 'BAIXADA'::character varying])::text[])))
);


ALTER TABLE public.tools OWNER TO supabase_admin;

--
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tools_id_seq OWNER TO supabase_admin;

--
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: users_notifications; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.users_notifications (
    id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id_to bigint,
    user_id_from bigint,
    title character varying,
    body character varying,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    table_id bigint,
    img_url character varying,
    type character varying,
    o_id bigint,
    ov_id bigint,
    activity_id bigint,
    company_id bigint,
    token_fcm character varying,
    img_file_path character varying,
    img_file_name character varying,
    user_from_name_short character varying,
    page_target character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    user_to_whatsapp text,
    material_id bigint
);


ALTER TABLE public.users_notifications OWNER TO supabase_admin;

--
-- Name: users_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_notifications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_tools; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.users_tools (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tool_id integer NOT NULL,
    amount integer DEFAULT 1,
    date_start timestamp without time zone DEFAULT now(),
    date_end timestamp without time zone,
    status character varying(50) DEFAULT 'USO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    CONSTRAINT users_tools_status_check CHECK (((status)::text = ANY ((ARRAY['USO'::character varying, 'BAIXADO'::character varying, 'TRANSFERIDO'::character varying])::text[])))
);


ALTER TABLE public.users_tools OWNER TO supabase_admin;

--
-- Name: users_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.users_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_tools_id_seq OWNER TO supabase_admin;

--
-- Name: users_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_id_seq OWNED BY public.users_tools.id;


--
-- Name: users_tools_movements; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.users_tools_movements (
    id integer NOT NULL,
    tool_id integer NOT NULL,
    from_user_id integer,
    to_user_id integer,
    movement_type character varying(50) NOT NULL,
    amount integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    CONSTRAINT users_tools_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['INCLUSAO'::character varying, 'TRANSFERENCIA'::character varying, 'BAIXA'::character varying])::text[])))
);


ALTER TABLE public.users_tools_movements OWNER TO supabase_admin;

--
-- Name: users_tools_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.users_tools_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_tools_movements_id_seq OWNER TO supabase_admin;

--
-- Name: users_tools_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_movements_id_seq OWNED BY public.users_tools_movements.id;


--
-- Name: users_tracker; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.users_tracker (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    latitude double precision,
    longitude double precision,
    createddate timestamp with time zone,
    device character varying
);


ALTER TABLE public.users_tracker OWNER TO supabase_admin;

--
-- Name: users_tracker_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tracker ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_tracker_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_app; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_app WITH (security_invoker='true') AS
 SELECT cfg_app.id,
    cfg_app.apk_url,
    cfg_app.version_app,
    cfg_app.version_app_mask,
    cfg_app.logo_url,
    cfg_app.version_app_offline,
    cfg_app.n8n_available_last_at
   FROM public.cfg_app;


ALTER VIEW public.v_app OWNER TO supabase_admin;

--
-- Name: v_app_notices; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_app_notices WITH (security_invoker='true') AS
 SELECT n.id,
    n.title,
    n.message,
    n.category_id,
    n.severity_id,
    n.start_date,
    n.end_date,
    n.created_at,
    n.updated_at,
    n.is_active,
    n.dashboards,
    n.created_user_id,
    c.code AS category_code,
    c.label AS category_label,
    c.color AS category_color,
    c.icon AS category_icon,
    s.code AS severity_code,
    s.label AS severity_label,
    s.color AS severity_color,
    s.icon AS severity_icon,
    u.name_full AS creator_name,
    to_char(n.start_date, 'DD/MM/YYYY HH24:MI'::text) AS start_date_formatted,
    to_char(n.end_date, 'DD/MM/YYYY HH24:MI'::text) AS end_date_formatted,
    to_char(n.created_at, 'DD/MM/YYYY HH24:MI'::text) AS created_at_formatted
   FROM (((public.cfg_app_notices n
     JOIN public.cfg_app_notices_categories c ON ((n.category_id = c.id)))
     JOIN public.cfg_app_notices_severities s ON ((n.severity_id = s.id)))
     LEFT JOIN public.users u ON ((n.created_user_id = u.id)));


ALTER VIEW public.v_app_notices OWNER TO supabase_admin;

--
-- Name: v_app_offline_updates; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_app_offline_updates WITH (security_invoker='true') AS
 SELECT cfg_app_offline_updates.id,
    cfg_app_offline_updates.table_name,
    cfg_app_offline_updates.version_offline,
    cfg_app_offline_updates.updated_at
   FROM public.cfg_app_offline_updates
  ORDER BY cfg_app_offline_updates.table_name;


ALTER VIEW public.v_app_offline_updates OWNER TO supabase_admin;

--
-- Name: v_app_pages; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_app_pages WITH (security_invoker='true') AS
 SELECT cfg_app_pages.id,
    cfg_app_pages.code,
    cfg_app_pages.description,
    cfg_app_pages.is_available_provider
   FROM public.cfg_app_pages;


ALTER VIEW public.v_app_pages OWNER TO supabase_admin;

--
-- Name: v_assets_available; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_available WITH (security_invoker='true') AS
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
    assets_available.flow_rate_is_on,
    assets_available.flow_rate_is_available,
    assets_available.power_unit,
    assets_available.power_min,
    assets_available.power_max,
    assets_available.power_is_on,
    assets_available.power_is_available,
    assets_available.pressure_min,
    assets_available.pressure_max,
    assets_available.pressure_is_on,
    assets_available.pressure_is_available,
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


ALTER VIEW public.v_assets_available OWNER TO supabase_admin;

--
-- Name: v_assets_couplings_models; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_couplings_models WITH (security_invoker='true') AS
 SELECT cfg_assets_couplings_models.id,
    cfg_assets_couplings_models.code,
    cfg_assets_couplings_models.description,
    cfg_assets_couplings_models.is_available,
    cfg_assets_couplings_models.is_deleted,
    cfg_assets_couplings_models.version_mode
   FROM public.cfg_assets_couplings_models
  WHERE (cfg_assets_couplings_models.is_deleted = false)
  ORDER BY cfg_assets_couplings_models.description;


ALTER VIEW public.v_assets_couplings_models OWNER TO supabase_admin;

--
-- Name: v_assets_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_followers WITH (security_invoker='true') AS
 SELECT assets_followers.id,
    assets_followers.asset_id,
    assets_followers.user_id AS follower_id
   FROM public.assets_followers;


ALTER VIEW public.v_assets_followers OWNER TO supabase_admin;

--
-- Name: v_assets_loans; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_loans AS
 SELECT al.id,
    al.asset_id,
    al.borrower_name,
    al.lender_user_id,
    al.expected_return_date,
    al.actual_return_date,
    al.status,
    al.notes,
    al.is_deleted,
    al.created_at,
    al.updated_at,
    al.created_user_id,
    al.signature_delivery_path,
    al.signature_delivery_name,
    al.signature_delivery_at,
    al.signature_delivery_signer_name,
    al.signature_return_path,
    al.signature_return_name,
    al.signature_return_at,
    al.signature_return_signer_name,
    al.inspector_delivery_user_id,
    al.inspector_return_user_id,
    al.items_checklists_divergent_count,
    a.code AS asset_code,
    a.description AS asset_description,
    a.serial AS asset_serial,
    a.brand AS asset_brand,
    a.model AS asset_model,
    a.img_file_path AS asset_img_path,
    a.img_file_name AS asset_img_name,
    at.description AS asset_type_name,
    ul.name_full AS lender_name,
    ul.name_short AS lender_name_short,
    ud.name_full AS inspector_delivery_name,
    ur.name_full AS inspector_return_name,
        CASE
            WHEN (((al.status)::text = 'pending'::text) AND (al.expected_return_date < CURRENT_DATE)) THEN 'overdue'::character varying
            ELSE al.status
        END AS computed_status
   FROM (((((public.assets_loans al
     JOIN public.assets a ON ((al.asset_id = a.id)))
     LEFT JOIN public.cfg_assets_types at ON ((a.type_id = at.id)))
     LEFT JOIN public.users ul ON ((al.lender_user_id = ul.id)))
     LEFT JOIN public.users ud ON ((al.inspector_delivery_user_id = ud.id)))
     LEFT JOIN public.users ur ON ((al.inspector_return_user_id = ur.id)))
  WHERE (al.is_deleted = false);


ALTER VIEW public.v_assets_loans OWNER TO supabase_admin;

--
-- Name: v_assets_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_materials WITH (security_invoker='true') AS
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


ALTER VIEW public.v_assets_materials OWNER TO supabase_admin;

--
-- Name: v_assets_priorities; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_priorities WITH (security_invoker='true') AS
 SELECT cfg_assets_priorities.id,
    cfg_assets_priorities.code,
    cfg_assets_priorities.description,
    cfg_assets_priorities.is_available
   FROM public.cfg_assets_priorities
  ORDER BY cfg_assets_priorities.description;


ALTER VIEW public.v_assets_priorities OWNER TO supabase_admin;

--
-- Name: v_assets_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_statuses WITH (security_invoker='true') AS
 SELECT cfg_assets_statuses.id,
    cfg_assets_statuses.code,
    cfg_assets_statuses.description,
    cfg_assets_statuses.is_available
   FROM public.cfg_assets_statuses
  ORDER BY cfg_assets_statuses.description;


ALTER VIEW public.v_assets_statuses OWNER TO supabase_admin;

--
-- Name: v_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_tags WITH (security_invoker='true') AS
 SELECT cfg_assets_tags.id,
    cfg_assets_tags.company_id,
    cfg_assets_tags.code,
    cfg_assets_tags.description,
    cfg_assets_tags.is_available
   FROM public.cfg_assets_tags
  WHERE (cfg_assets_tags.is_deleted = false)
  ORDER BY cfg_assets_tags.description;


ALTER VIEW public.v_assets_tags OWNER TO supabase_admin;

--
-- Name: v_assets_tags_subs; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_tags_subs WITH (security_invoker='true') AS
 SELECT cfg_assets_tags_subs.id,
    cfg_assets_tags_subs.company_id,
    cfg_assets_tags_subs.code,
    cfg_assets_tags_subs.description,
    cfg_assets_tags_subs.is_available
   FROM public.cfg_assets_tags_subs
  WHERE (cfg_assets_tags_subs.is_deleted = false)
  ORDER BY cfg_assets_tags_subs.description;


ALTER VIEW public.v_assets_tags_subs OWNER TO supabase_admin;

--
-- Name: v_assets_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_types WITH (security_invoker='true') AS
 SELECT cfg_assets_types.id,
    cfg_assets_types.company_id,
    cfg_assets_types.code,
    cfg_assets_types.description,
    cfg_assets_types.is_available
   FROM public.cfg_assets_types
  WHERE (cfg_assets_types.is_deleted = false)
  ORDER BY cfg_assets_types.description;


ALTER VIEW public.v_assets_types OWNER TO supabase_admin;

--
-- Name: v_assets_unavailable_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_assets_unavailable_reasons WITH (security_invoker='true') AS
 SELECT cfg_assets_unavailable_reasons.id,
    cfg_assets_unavailable_reasons.code,
    cfg_assets_unavailable_reasons.description,
    cfg_assets_unavailable_reasons.is_available
   FROM public.cfg_assets_unavailable_reasons
  ORDER BY cfg_assets_unavailable_reasons.description;


ALTER VIEW public.v_assets_unavailable_reasons OWNER TO supabase_admin;

--
-- Name: v_companies; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_companies WITH (security_invoker='true') AS
 SELECT cfg_companies.id,
    cfg_companies.code,
    cfg_companies.description,
    cfg_companies.img_file_path,
    cfg_companies.img_file_name,
    cfg_companies.is_available,
    cfg_companies.email_sufix
   FROM public.cfg_companies
  ORDER BY cfg_companies.code;


ALTER VIEW public.v_companies OWNER TO supabase_admin;

--
-- Name: v_contracts; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_contracts WITH (security_invoker='true') AS
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


ALTER VIEW public.v_contracts OWNER TO supabase_admin;

--
-- Name: v_contracts_evaluation_requirements; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_contracts_evaluation_requirements WITH (security_invoker='true') AS
 SELECT cer.id,
    cer.contract_id,
    cer.evaluation_id,
    cer.weight,
    cer.is_available,
    er.description AS evaluation_description,
    er.code AS evaluation_code
   FROM (public.contracts_evaluation_requirements cer
     JOIN public.cfg_evaluation_requirements er ON ((er.id = cer.evaluation_id)))
  WHERE ((cer.is_deleted = false) AND (er.is_deleted = false));


ALTER VIEW public.v_contracts_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: v_contracts_managers; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_contracts_managers WITH (security_invoker='true') AS
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


ALTER VIEW public.v_contracts_managers OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_parent_status_1; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_dash_admin_orders_parent_status_1 WITH (security_invoker='true') AS
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
    v_orders.contract_code,
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
    v_orders.unit_code,
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
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
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
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id = 1) AND (v_orders.parent_id IS NULL));


ALTER VIEW public.v_dash_admin_orders_parent_status_1 OWNER TO supabase_admin;

--
-- Name: v_departments; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_departments WITH (security_invoker='true') AS
 SELECT cfg_departments.id,
    cfg_departments.code,
    cfg_departments.description,
    cfg_departments.parent_id,
    cfg_departments.company_id,
    cfg_departments.is_available,
    cfg_departments.created_user_id,
    cfg_departments.created_at,
    cfg_departments.updated_user_id,
    cfg_departments.updated_at,
    cfg_departments.deleted_user_id,
    cfg_departments.deleted_at,
    cfg_departments.is_deleted,
    cfg_departments.version
   FROM public.cfg_departments;


ALTER VIEW public.v_departments OWNER TO supabase_admin;

--
-- Name: v_import_orders_visits_contracts; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_import_orders_visits_contracts WITH (security_invoker='true') AS
 SELECT import_orders_visits_contracts.id,
    import_orders_visits_contracts.user_email,
    import_orders_visits_contracts.contract_code,
    import_orders_visits_contracts.year,
    import_orders_visits_contracts.month,
    import_orders_visits_contracts.date,
    import_orders_visits_contracts.unit_code,
    import_orders_visits_contracts.asset_code,
    import_orders_visits_contracts.activity_code,
    import_orders_visits_contracts.activity_description,
    import_orders_visits_contracts.service_code,
    import_orders_visits_contracts.service_description,
    import_orders_visits_contracts.service_unit,
    import_orders_visits_contracts.value_unit,
    import_orders_visits_contracts.amount,
    import_orders_visits_contracts.discount,
    import_orders_visits_contracts.value_total,
    import_orders_visits_contracts.error_msg,
    import_orders_visits_contracts.order_mask,
    import_orders_visits_contracts.success,
    import_orders_visits_contracts.processing_id,
    import_orders_visits_contracts.created_at,
    import_orders_visits_contracts.finger_print
   FROM public.import_orders_visits_contracts;


ALTER VIEW public.v_import_orders_visits_contracts OWNER TO supabase_admin;

--
-- Name: v_leader_ranking; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_leader_ranking WITH (security_invoker='true') AS
 SELECT lms.id,
    lms.leader_id,
    lms.leader_name,
    lms.department_id,
    lms.department_name,
    lms.score_year,
    lms.score_month,
    lms.total_visits,
    lms.total_evaluations,
    lms.failed_evaluations,
    lms.total_penalty_score,
    lms.avg_compliance_score,
    lms.best_compliance_score,
    lms.worst_compliance_score,
    lms.ranking_position,
    lms.created_at,
    lms.updated_at,
    prev.avg_compliance_score AS prev_month_compliance,
        CASE
            WHEN (prev.avg_compliance_score IS NULL) THEN 'stable'::text
            WHEN (lms.avg_compliance_score > prev.avg_compliance_score) THEN 'up'::text
            WHEN (lms.avg_compliance_score < prev.avg_compliance_score) THEN 'down'::text
            ELSE 'stable'::text
        END AS trend,
    prev.ranking_position AS prev_ranking_position,
        CASE
            WHEN ((prev.ranking_position IS NULL) OR (lms.ranking_position IS NULL)) THEN NULL::integer
            WHEN (prev.ranking_position > lms.ranking_position) THEN (prev.ranking_position - lms.ranking_position)
            WHEN (prev.ranking_position < lms.ranking_position) THEN (- (lms.ranking_position - prev.ranking_position))
            ELSE 0
        END AS position_change
   FROM (public.leader_monthly_scores lms
     LEFT JOIN public.leader_monthly_scores prev ON (((prev.leader_id = lms.leader_id) AND (prev.score_year =
        CASE
            WHEN (lms.score_month = 1) THEN (lms.score_year - 1)
            ELSE lms.score_year
        END) AND (prev.score_month =
        CASE
            WHEN (lms.score_month = 1) THEN 12
            ELSE (lms.score_month - 1)
        END))));


ALTER VIEW public.v_leader_ranking OWNER TO supabase_admin;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.warehouses (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    code text,
    description text,
    address text,
    latidude double precision,
    longitude double precision,
    is_available boolean,
    created_at timestamp without time zone,
    created_user_id bigint,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    deleted_user_id bigint
);


ALTER TABLE public.warehouses OWNER TO supabase_admin;

--
-- Name: warehouses_materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.warehouses_materials (
    id integer NOT NULL,
    warehouse_id integer NOT NULL,
    material_id bigint NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    cost_avg numeric(15,4) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    updated_user_id integer,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    deleted_user_id integer,
    CONSTRAINT warehouses_materials_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.warehouses_materials OWNER TO supabase_admin;

--
-- Name: v_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_materials WITH (security_invoker='true') AS
 SELECT m.id,
    m.code,
    m.description,
    m.unit,
    m.price_unit,
    m.searchable,
    m.version_mode,
    m.finger_print,
    m.company_id,
    m.provider_company_id,
    m.balance,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    m.status_id,
    cms.description AS status_description,
    m.type_id,
    cmt.description AS type_description,
    COALESCE(ws.total_quantity, (0)::bigint) AS total_stock,
    COALESCE(ws.warehouse_count, (0)::bigint) AS warehouse_count,
    ws.min_stock_warehouse_id,
    ws.min_stock_warehouse_description
   FROM (((public.materials m
     LEFT JOIN public.cfg_materials_statuses cms ON ((cms.id = m.status_id)))
     LEFT JOIN public.cfg_materials_types cmt ON ((cmt.id = m.type_id)))
     LEFT JOIN LATERAL ( SELECT sum(wm.quantity) AS total_quantity,
            count(DISTINCT wm.warehouse_id) AS warehouse_count,
            (array_agg(
                CASE
                    WHEN (wm.quantity <= wm.min_stock) THEN wm.warehouse_id
                    ELSE NULL::integer
                END ORDER BY wm.quantity) FILTER (WHERE (wm.quantity <= wm.min_stock)))[1] AS min_stock_warehouse_id,
            (array_agg(
                CASE
                    WHEN (wm.quantity <= wm.min_stock) THEN w.description
                    ELSE NULL::text
                END ORDER BY wm.quantity) FILTER (WHERE (wm.quantity <= wm.min_stock)))[1] AS min_stock_warehouse_description
           FROM (public.warehouses_materials wm
             JOIN public.warehouses w ON (((w.id = wm.warehouse_id) AND (w.is_deleted = false))))
          WHERE (wm.material_id = m.id)) ws ON (true))
  WHERE (m.is_deleted = false);


ALTER VIEW public.v_materials OWNER TO supabase_admin;

--
-- Name: VIEW v_materials; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON VIEW public.v_materials IS 'Catálogo de materiais ativos com status, tipo e resumo de estoque por almoxarifado';


--
-- Name: v_materials_purchases; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_materials_purchases WITH (security_invoker='true') AS
 SELECT mp.id,
    mp.code AS purchase_code,
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
    mp.requester_user_id,
    ru.name_full AS requester_name,
    mp.authorizer_user_id,
    au.name_full AS authorizer_name,
    mp.authorized_at,
    mp.cancel_reason_id,
    cpcr.description AS cancel_reason_description,
    mp.cancel_reason,
    mp.concluded_at,
    mp.created_at,
    mp.updated_at
   FROM ((((((((public.materials_purchases mp
     LEFT JOIN public.materials m ON ((m.id = mp.material_id)))
     LEFT JOIN public.cfg_materials_types cmt ON ((cmt.id = m.type_id)))
     LEFT JOIN public.cfg_materials_purchases_types cpt ON ((cpt.id = mp.purchase_type_id)))
     LEFT JOIN public.warehouses w ON ((w.id = mp.warehouse_id)))
     LEFT JOIN public.cfg_materials_purchases_statuses cps ON ((cps.id = mp.status_id)))
     LEFT JOIN public.users ru ON ((ru.id = mp.requester_user_id)))
     LEFT JOIN public.users au ON ((au.id = mp.authorizer_user_id)))
     LEFT JOIN public.cfg_materials_purchases_cancel_reasons cpcr ON ((cpcr.id = mp.cancel_reason_id)))
  WHERE (mp.is_deleted = false);


ALTER VIEW public.v_materials_purchases OWNER TO supabase_admin;

--
-- Name: v_order_visit_scores; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_order_visit_scores WITH (security_invoker='true') AS
 SELECT ov.id AS ov_id,
    ov.o_id AS order_id,
    ov.ov_team_leader_id AS leader_id,
    u.name_short AS leader_name,
    u.team_id AS leader_team_id,
    t.description AS team_name,
    t.department_id AS leader_department_id,
    d.description AS department_name,
    ov.ov_started_at,
    ov.ov_ended_at,
    (EXTRACT(year FROM ov.ov_ended_at))::integer AS score_year,
    (EXTRACT(month FROM ov.ov_ended_at))::integer AS score_month,
    (count(ove.id))::integer AS total_evaluations,
    (count(
        CASE
            WHEN (ove.was_applied = true) THEN 1
            ELSE NULL::integer
        END))::integer AS failed_evaluations,
    (COALESCE(sum(
        CASE
            WHEN (ove.was_applied = true) THEN cer.weight
            ELSE 0
        END), (0)::bigint))::numeric(10,2) AS penalty_score,
    (COALESCE(sum(cer.weight), (0)::bigint))::numeric(10,2) AS max_possible_score,
        CASE
            WHEN (COALESCE(sum(cer.weight), (0)::bigint) = 0) THEN 100.00
            ELSE round(((1.0 - ((COALESCE(sum(
            CASE
                WHEN (ove.was_applied = true) THEN cer.weight
                ELSE 0
            END), (0)::bigint))::numeric / (NULLIF(sum(cer.weight), 0))::numeric)) * (100)::numeric), 2)
        END AS compliance_score
   FROM (((((public.orders_visits ov
     JOIN public.users u ON ((u.id = ov.ov_team_leader_id)))
     JOIN public.cfg_teams t ON ((t.id = u.team_id)))
     JOIN public.cfg_departments d ON ((d.id = t.department_id)))
     LEFT JOIN public.orders_visits_evaluations ove ON ((ove.ov_id = ov.id)))
     LEFT JOIN public.contracts_evaluation_requirements cer ON ((cer.id = ove.contract_evaluation_id)))
  WHERE ((ov.ov_status_id = 2) AND (ov.ov_ended_at IS NOT NULL))
  GROUP BY ov.id, ov.o_id, ov.ov_team_leader_id, u.name_short, u.team_id, t.description, t.department_id, d.description, ov.ov_started_at, ov.ov_ended_at;


ALTER VIEW public.v_order_visit_scores OWNER TO supabase_admin;

--
-- Name: v_orders_cancel_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_cancel_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_cancel_reasons.id,
    cfg_orders_cancel_reasons.department_id,
    cfg_orders_cancel_reasons.description,
    cfg_orders_cancel_reasons.is_available,
    cfg_orders_cancel_reasons.is_deleted
   FROM public.cfg_orders_cancel_reasons
  WHERE (cfg_orders_cancel_reasons.is_deleted = false)
  ORDER BY cfg_orders_cancel_reasons.description;


ALTER VIEW public.v_orders_cancel_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_causes_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_causes_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_causes_reasons.id,
    cfg_orders_causes_reasons.description,
    cfg_orders_causes_reasons.is_availabe,
    cfg_orders_causes_reasons.is_deleted
   FROM public.cfg_orders_causes_reasons
  WHERE (cfg_orders_causes_reasons.is_deleted = false)
  ORDER BY cfg_orders_causes_reasons.description;


ALTER VIEW public.v_orders_causes_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_counter; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_counter WITH (security_invoker='true') AS
 SELECT cfg_orders_counter.id,
    cfg_orders_counter.company_id,
    cfg_orders_counter.year,
    cfg_orders_counter.counter,
    cfg_orders_counter.is_dev,
    cfg_orders_counter.version
   FROM public.cfg_orders_counter;


ALTER VIEW public.v_orders_counter OWNER TO supabase_admin;

--
-- Name: v_orders_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_followers WITH (security_invoker='true') AS
 SELECT orders_followers.id,
    orders_followers.user_id,
    orders_followers.o_id,
    orders_followers.version_mode
   FROM public.orders_followers;


ALTER VIEW public.v_orders_followers OWNER TO supabase_admin;

--
-- Name: v_orders_objects; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_objects WITH (security_invoker='true') AS
 SELECT cfg_orders_objects.id,
    cfg_orders_objects.code,
    cfg_orders_objects.description
   FROM public.cfg_orders_objects
  ORDER BY cfg_orders_objects.description;


ALTER VIEW public.v_orders_objects OWNER TO supabase_admin;

--
-- Name: v_orders_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_open WITH (security_invoker='true') AS
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
    v_orders.contract_code,
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
    v_orders.unit_code,
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
    v_orders.asset_tag_sub_id,
    v_orders.asset_tag_sub_description,
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
    v_orders.img_files_names,
    v_orders.client_name,
    v_orders.client_id,
    v_orders.unit_asset_tag_id,
    v_orders.unit_asset_tag_has_order,
    v_orders.unit_asset_tag_no_has_order_user_id,
    v_orders.unit_asset_tag_no_has_order_at
   FROM public.v_orders
  WHERE ((v_orders.status_id <= 6) AND (v_orders.parent_id > 0));


ALTER VIEW public.v_orders_open OWNER TO supabase_admin;

--
-- Name: v_orders_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_parent WITH (security_invoker='true') AS
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
     LEFT JOIN public.clients ON ((orders.client_id = clients.id)))
  WHERE (orders.parent_id IS NULL);


ALTER VIEW public.v_orders_parent OWNER TO supabase_admin;

--
-- Name: v_orders_plans; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_plans WITH (security_invoker='true') AS
 SELECT cfg_orders_plans.id,
    cfg_orders_plans.department_id,
    cfg_orders_plans.code,
    cfg_orders_plans.description,
    cfg_orders_plans.is_available,
    cfg_orders_plans.version
   FROM public.cfg_orders_plans
  ORDER BY cfg_orders_plans.description;


ALTER VIEW public.v_orders_plans OWNER TO supabase_admin;

--
-- Name: v_orders_priorities; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_priorities WITH (security_invoker='true') AS
 SELECT cfg_orders_priorities.id,
    cfg_orders_priorities.code,
    cfg_orders_priorities.description
   FROM public.cfg_orders_priorities
  ORDER BY cfg_orders_priorities.description;


ALTER VIEW public.v_orders_priorities OWNER TO supabase_admin;

--
-- Name: v_orders_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_statuses WITH (security_invoker='true') AS
 SELECT cfg_orders_statuses.id,
    cfg_orders_statuses.company_id,
    cfg_orders_statuses.department_id,
    cfg_orders_statuses.code,
    cfg_orders_statuses.description,
    cfg_orders_statuses.is_available
   FROM public.cfg_orders_statuses;


ALTER VIEW public.v_orders_statuses OWNER TO supabase_admin;

--
-- Name: v_orders_suspended_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_suspended_reasons WITH (security_invoker='true') AS
 SELECT cfg_orders_suspended_reasons.id,
    cfg_orders_suspended_reasons.department_id,
    cfg_orders_suspended_reasons.description,
    cfg_orders_suspended_reasons.is_available,
    cfg_orders_suspended_reasons.is_deleted
   FROM public.cfg_orders_suspended_reasons
  WHERE (cfg_orders_suspended_reasons.is_deleted = false)
  ORDER BY cfg_orders_suspended_reasons.description;


ALTER VIEW public.v_orders_suspended_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_types WITH (security_invoker='true') AS
 SELECT cfg_orders_types.id,
    cfg_orders_types.department_id,
    cfg_orders_types.code,
    cfg_orders_types.description,
    cfg_orders_types.is_deleted,
    cfg_orders_types.is_available
   FROM public.cfg_orders_types
  WHERE (cfg_orders_types.is_deleted = false)
  ORDER BY cfg_orders_types.description;


ALTER VIEW public.v_orders_types OWNER TO supabase_admin;

--
-- Name: v_orders_types_subs; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_types_subs WITH (security_invoker='true') AS
 SELECT cfg_orders_types_subs.id,
    cfg_orders_types_subs.department_id,
    cfg_orders_types_subs.code,
    cfg_orders_types_subs.description,
    cfg_orders_types_subs.is_available,
    cfg_orders_types_subs.is_deleted
   FROM public.cfg_orders_types_subs
  WHERE (cfg_orders_types_subs.is_deleted = false)
  ORDER BY cfg_orders_types_subs.description;


ALTER VIEW public.v_orders_types_subs OWNER TO supabase_admin;

--
-- Name: v_orders_visits; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits WITH (security_invoker='true') AS
 WITH ov AS (
         SELECT orders_visits_1.id,
            orders_visits_1.ov_mask,
            orders_visits_1.visit_counter,
            orders_visits_1.o_id,
            orders_visits_1.ov_approved_user_id,
            orders_visits_1.ov_approved_at,
            orders_visits_1.ov_disapproved_user_id,
            orders_visits_1.ov_disapproved_at,
            orders_visits_1.ov_started_at,
            orders_visits_1.ov_ended_at,
            orders_visits_1.ov_processing_id,
            orders_visits_1.ov_status_id,
            orders_visits_1.ov_reported_at,
            orders_visits_1.ov_reported_user_id,
            orders_visits_1.ov_team_leader_id,
            orders_visits_1.ov_assets_amount,
            orders_visits_1.ov_assets_approved_filed_amount,
            orders_visits_1.ov_assets_disapproved_amount,
            orders_visits_1.ov_assets_reported_amount,
            orders_visits_1.ov_materials_value,
            orders_visits_1.ov_services_value,
            orders_visits_1.ov_vehicles_value,
            orders_visits_1.ov_created_user_id,
            orders_visits_1.ov_created_at,
            orders_visits_1.ov_updated_user_id,
            orders_visits_1.ov_updated_at,
            orders_visits_1.ov_deleted_user_id,
            orders_visits_1.is_deleted,
            orders_visits_1.ov_duration_hours,
            orders_visits_1.ov_disapproved_comments,
            orders_visits_1.ov_assets_draft_amount,
            orders_visits_1.is_canceled,
            orders_visits_1.ov_comments,
            orders_visits_1.o_cancel_reason_id,
            orders_visits_1.ov_created_latitude,
            orders_visits_1.ov_created_longitude,
            orders_visits_1.ov_total_value,
            orders_visits_1.ov_is_filed,
            orders_visits_1.ov_team_amount,
            orders_visits_1.ov_assets_revised_amount,
            orders_visits_1.ov_revised_user_id,
            orders_visits_1.ov_revised_at,
            orders_visits_1.ov_team_names_short,
            orders_visits_1.version_mode,
            orders_visits_1.ov_rpt_file_path,
            orders_visits_1.ov_rpt_file_name,
            orders_visits_1.ov_o_suspended_reason_id,
            orders_visits_1.ov_o_status_id,
            orders_visits_1.ov_o_progress,
            orders_visits_1.ov_img_file_path,
            orders_visits_1.ov_img_file_name,
            orders_visits_1.ov_pdf_file_path,
            orders_visits_1.ov_pdf_file_name,
            orders_visits_1.is_extra,
            orders_visits_1.ov_assets_approved_no_filed_amount,
            orders_visits_1.ov_approved_filed_user_id,
            orders_visits_1.ov_approved_filed_at,
            orders_visits_1.finger_print,
            orders_visits_1.ov_payment_at,
            orders_visits_1.ov_payment_invoices,
            orders_visits_1.ov_started_year,
            orders_visits_1.ov_started_month,
            orders_visits_1.ov_invoices,
            orders_visits_1.ov_assets_approved_amount,
            orders_visits_1.created_user_id,
            orders_visits_1.created_at,
            orders_visits_1.updated_user_id,
            orders_visits_1.updated_at,
            orders_visits_1.ov_signature_leader_path,
            orders_visits_1.ov_signature_leader_name,
            orders_visits_1.ov_signature_leader_at,
            orders_visits_1.ov_signature_requester_path,
            orders_visits_1.ov_signature_requester_name,
            orders_visits_1.ov_signature_requester_at,
            orders_visits_1.chat_status,
            orders_visits_1.chat_closed_at,
            orders_visits_1.chat_closed_user_id,
            orders_visits_1.chat_created_user_id,
            orders_visits_1.ov_costs_status,
            orders_visits_1.ov_costs_waiting_at,
            orders_visits_1.ov_costs_waiting_user_id,
            orders_visits_1.ov_costs_approved_at,
            orders_visits_1.ov_costs_approved_user_id,
            orders_visits_1.ov_costs_rejected_at,
            orders_visits_1.ov_costs_rejected_user_id,
            orders_visits_1.ov_costs_rejection_reason
           FROM public.orders_visits orders_visits_1
          WHERE (orders_visits_1.is_deleted = false)
        )
 SELECT orders_visits.id,
    orders_visits.o_id,
    orders_visits.ov_mask,
    v_orders.order_mask AS o_mask,
    v_orders.unit_id AS o_unit_id,
    v_orders.type_id AS o_type_id,
    v_orders.type_code AS o_type_code,
    v_orders.type_description AS o_type_description,
    v_orders.type_sub_id AS o_type_sub_id,
    v_orders.type_sub_code AS o_type_sub_code,
    v_orders.type_sub_description AS o_type_sub_description,
    v_orders.unit_description AS o_unit_description,
    v_orders.unit_address AS o_unit_address,
    v_orders.unit_type_parent_id AS o_unit_type_parent_id,
    v_orders.requested_at AS o_requested_at,
    v_orders.requested_services AS o_requested_services,
    v_orders.requester_name AS o_requester_name,
    v_orders.requester_phone AS o_requester_phone,
    v_orders.requester_team_code AS o_requester_team_code,
    v_orders.status_id AS o_status_id,
    v_orders.status_description AS o_status_description,
    v_orders.parent_id AS op_id,
    v_orders.system_parent_id AS o_system_parent_id,
    v_orders.system_id AS o_system_id,
    v_orders.object_id AS o_object_id,
    v_orders.object_code AS o_object_code,
    v_orders.object_description AS o_object_description,
    v_orders.plan_id AS o_plan_id,
    v_orders.plan_code AS o_plan_code,
    v_orders.plan_description AS o_plan_description,
    v_orders.asset_tag_id AS o_asset_tag_id,
    v_orders.asset_tag_description AS o_asset_tag_description,
    v_orders.contract_id AS o_contract_id,
    v_orders.contract_description AS o_contract_description,
    v_orders.provider_company_id AS o_provider_company_id,
    v_orders.provider_company_description AS o_provider_company_description,
    v_orders.provider_company_img_file_path AS o_provider_company_img_file_path,
    v_orders.provider_company_img_file_name AS o_provider_company_img_file_name,
    v_orders.priority_id AS o_priority_id,
    v_orders.priority_code AS o_priority_code,
    v_orders.priority_description AS o_priority_description,
    v_orders.cause_reason_id AS o_cause_reason_id,
    v_orders.cause_reason_description AS o_cause_reason_description,
    v_orders.services_value,
    v_orders.materials_value,
    v_orders.vehicles_value,
    v_orders.total_value,
    orders_visits.ov_started_at,
    orders_visits.ov_ended_at,
    orders_visits.ov_duration_hours,
    orders_visits.ov_status_id,
    cfg_orders_visits_statuses.description AS ov_status_description,
    orders_visits.ov_processing_id,
    cfg_orders_visits_processing.description AS ov_processing_description,
    v_orders.team_id AS o_team_id,
    v_orders.team_leader_name_short AS o_team_leader_name_short,
    v_orders.team_code AS o_team_code,
    orders_visits.ov_team_leader_id,
    users_teams_leaders.name_short AS ov_team_leader_name_short,
    orders_visits.is_canceled,
    orders_visits.ov_comments,
    orders_visits.ov_services_value,
    orders_visits.ov_materials_value,
    orders_visits.ov_vehicles_value,
    orders_visits.ov_total_value,
    orders_visits.ov_is_filed,
    orders_visits.ov_assets_amount,
    orders_visits.ov_assets_draft_amount,
    orders_visits.ov_assets_reported_amount,
    orders_visits.ov_assets_disapproved_amount,
    orders_visits.ov_assets_approved_amount,
    orders_visits.ov_team_amount,
    orders_visits.ov_team_names_short,
    orders_visits.ov_rpt_file_path,
    orders_visits.ov_rpt_file_name,
    orders_visits.ov_img_file_path,
    orders_visits.ov_img_file_name,
    orders_visits.ov_pdf_file_path,
    orders_visits.ov_pdf_file_name,
    orders_visits.ov_o_status_id,
    cfg_orders_statuses.description AS ov_o_status_description,
    orders_visits.ov_o_suspended_reason_id,
    cfg_orders_suspended_reasons.description AS ov_o_suspended_reason_description,
    orders_visits.ov_o_progress,
    orders_visits.ov_reported_at,
    users_reported.name_short AS ov_reported_user_name_short,
    orders_visits.ov_revised_at,
    users_revised.name_short AS ov_revised_user_name_short,
    orders_visits.ov_disapproved_at,
    users_disapproved.name_short AS ov_disapproved_user_name_short,
    orders_visits.ov_approved_at,
    users_approved.name_short AS ov_approved_user_name_short,
    orders_visits.version_mode,
    orders_visits.is_extra,
    orders_visits.ov_started_month,
    orders_visits.ov_started_year,
    orders_visits.ov_invoices,
    v_orders.asset_tag_sub_id AS o_asset_tag_sub_id,
    v_orders.asset_tag_sub_description AS o_asset_tag_sub_description,
    v_orders.client_name,
    orders_visits.finger_print,
    orders_visits.ov_signature_leader_path,
    orders_visits.ov_signature_leader_name,
    orders_visits.ov_signature_leader_at,
    orders_visits.ov_signature_requester_path,
    orders_visits.ov_signature_requester_name,
    orders_visits.ov_signature_requester_at,
    v_orders.contract_object AS o_contract_object,
    (((v_orders.contract_description || ' ('::text) || (v_orders.provider_company_code)::text) || ')'::text) AS o_contract_description_2,
    orders_visits.chat_status,
    orders_visits.chat_closed_at,
    orders_visits.chat_closed_user_id,
    orders_visits.chat_created_user_id,
    orders_visits.ov_costs_status,
    orders_visits.ov_costs_waiting_at,
    orders_visits.ov_costs_waiting_user_id,
    orders_visits.ov_costs_approved_at,
    orders_visits.ov_costs_approved_user_id,
    users_costs_approved.name_short AS ov_costs_approved_user_name_short,
    orders_visits.ov_costs_rejected_at,
    orders_visits.ov_costs_rejected_user_id,
    users_costs_rejected.name_short AS ov_costs_rejected_user_name_short,
    orders_visits.ov_costs_rejection_reason
   FROM ((((((((((((public.orders_visits
     LEFT JOIN public.v_orders ON ((orders_visits.o_id = v_orders.id)))
     LEFT JOIN public.cfg_orders_visits_statuses ON ((orders_visits.ov_status_id = cfg_orders_visits_statuses.id)))
     LEFT JOIN public.cfg_orders_visits_processing ON ((orders_visits.ov_processing_id = cfg_orders_visits_processing.id)))
     LEFT JOIN public.users users_teams_leaders ON ((orders_visits.ov_team_leader_id = users_teams_leaders.id)))
     LEFT JOIN public.cfg_orders_statuses ON ((orders_visits.ov_o_status_id = cfg_orders_statuses.id)))
     LEFT JOIN public.cfg_orders_suspended_reasons ON ((orders_visits.ov_o_suspended_reason_id = cfg_orders_suspended_reasons.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits.ov_reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_revised ON ((orders_visits.ov_revised_user_id = users_revised.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits.ov_disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits.ov_approved_user_id = users_approved.id)))
     LEFT JOIN public.users users_costs_approved ON ((orders_visits.ov_costs_approved_user_id = users_costs_approved.id)))
     LEFT JOIN public.users users_costs_rejected ON ((orders_visits.ov_costs_rejected_user_id = users_costs_rejected.id)));


ALTER VIEW public.v_orders_visits OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_assets WITH (security_invoker='true') AS
 SELECT orders_visits_assets.id,
    orders_visits_assets.op_id,
    orders_visits_assets.o_id,
    v_orders.order_mask AS o_mask,
    v_orders.company_id AS o_company_id,
    v_orders.company_img_file_path AS o_company_img_file_path,
    v_orders.company_img_file_name AS o_company_img_file_name,
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
    assets.type_id AS asset_type_id,
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
    before_clients.name AS before_client_name,
    orders_visits_assets.after_client_id,
    after_clients.name AS after_client_name,
    orders_visits_assets.before_location,
    orders_visits_assets.after_location,
    orders_visits_assets.activities_description,
    orders_visits_assets.maintenance_plan_id,
    orders_visits_assets.maintenance_plan_progress,
    orders_visits_assets.has_recorder
   FROM (((((((((((((((((((public.orders_visits_assets
     LEFT JOIN public.v_orders_visits ON ((orders_visits_assets.ov_id = v_orders_visits.id)))
     LEFT JOIN public.v_orders ON ((orders_visits_assets.o_id = v_orders.id)))
     LEFT JOIN public.assets ON ((orders_visits_assets.asset_id = assets.id)))
     LEFT JOIN public.cfg_assets_tags before_tags ON ((orders_visits_assets.before_tag_id = before_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs before_tags_subs ON ((orders_visits_assets.before_tag_sub_id = before_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses before_status ON ((orders_visits_assets.before_status_id = before_status.id)))
     LEFT JOIN public.cfg_assets_tags after_tags ON ((orders_visits_assets.after_tag_id = after_tags.id)))
     LEFT JOIN public.cfg_assets_tags_subs after_tags_subs ON ((orders_visits_assets.after_tag_sub_id = after_tags_subs.id)))
     LEFT JOIN public.cfg_assets_statuses after_status ON ((orders_visits_assets.after_status_id = after_status.id)))
     LEFT JOIN public.cfg_orders_visits_processing ON ((orders_visits_assets.processing_id = cfg_orders_visits_processing.id)))
     LEFT JOIN public.units before_units ON ((orders_visits_assets.before_unit_id = before_units.id)))
     LEFT JOIN public.units after_units ON ((orders_visits_assets.after_unit_id = after_units.id)))
     LEFT JOIN public.users users_reported ON ((orders_visits_assets.reported_user_id = users_reported.id)))
     LEFT JOIN public.users users_disapproved ON ((orders_visits_assets.disapproved_user_id = users_disapproved.id)))
     LEFT JOIN public.users users_approved ON ((orders_visits_assets.approved_user_id = users_approved.id)))
     LEFT JOIN public.cfg_assets_priorities before_priorities ON ((orders_visits_assets.before_priority_id = before_priorities.id)))
     LEFT JOIN public.cfg_assets_priorities after_priorities ON ((orders_visits_assets.after_priority_id = after_priorities.id)))
     LEFT JOIN public.clients before_clients ON ((orders_visits_assets.before_client_id = before_clients.id)))
     LEFT JOIN public.clients after_clients ON ((orders_visits_assets.after_client_id = after_clients.id)))
  WHERE (orders_visits_assets.is_deleted = false);


ALTER VIEW public.v_orders_visits_assets OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_assets_activities WITH (security_invoker='true') AS
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


ALTER VIEW public.v_orders_visits_assets_activities OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_assets_materials WITH (security_invoker='true') AS
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


ALTER VIEW public.v_orders_visits_assets_materials OWNER TO supabase_admin;

--
-- Name: v_orders_visits_evaluations; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_evaluations WITH (security_invoker='true') AS
 SELECT ove.id,
    ove.ov_id,
    ove.contract_evaluation_id,
    ove.was_applied,
    ove.notes,
    ove.evaluated_by_user_id,
    u.name_full AS evaluator_name,
    ove.evaluated_at,
    ove.created_at,
    cer.contract_id,
    cer.weight,
    er.description AS requirement_description,
    er.code AS requirement_code
   FROM (((public.orders_visits_evaluations ove
     JOIN public.contracts_evaluation_requirements cer ON ((cer.id = ove.contract_evaluation_id)))
     JOIN public.cfg_evaluation_requirements er ON ((er.id = cer.evaluation_id)))
     JOIN public.users u ON ((u.id = ove.evaluated_by_user_id)));


ALTER VIEW public.v_orders_visits_evaluations OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_extras_followers WITH (security_invoker='true') AS
 SELECT orders_visits_extras_followers.id,
    orders_visits_extras_followers.user_id,
    orders_visits_extras_followers.ove_id,
    orders_visits_extras_followers.version_mode
   FROM public.orders_visits_extras_followers;


ALTER VIEW public.v_orders_visits_extras_followers OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_extras_teams WITH (security_invoker='true') AS
 SELECT orders_visits_extras_teams.id,
    orders_visits_extras_teams.ove_id,
    orders_visits_extras_teams.is_leader,
    orders_visits_extras_teams.user_id,
    orders_visits_extras_teams.duration_hours,
    users.name_short,
    users.img_file_path,
    users.img_file_name,
    orders_visits_extras.started_at,
    orders_visits_extras.ended_at,
    users.is_available,
    users.is_ov_in_progress,
    orders_visits_extras_teams.version_mode,
    orders_visits_extras_teams.order_by
   FROM ((public.orders_visits_extras_teams
     JOIN public.users ON ((orders_visits_extras_teams.user_id = users.id)))
     JOIN public.orders_visits_extras ON ((orders_visits_extras_teams.ove_id = orders_visits_extras.id)))
  ORDER BY orders_visits_extras_teams.order_by;


ALTER VIEW public.v_orders_visits_extras_teams OWNER TO supabase_admin;

--
-- Name: v_orders_visits_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_services WITH (security_invoker='true') AS
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


ALTER VIEW public.v_orders_visits_services OWNER TO supabase_admin;

--
-- Name: v_orders_visits_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_teams WITH (security_invoker='true') AS
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


ALTER VIEW public.v_orders_visits_teams OWNER TO supabase_admin;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.vehicles (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    plates text,
    value_unit numeric DEFAULT '0'::numeric,
    is_available boolean DEFAULT true NOT NULL,
    unit text DEFAULT 'Km'::text,
    discount numeric DEFAULT '1'::numeric,
    description text,
    finger_print text,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.vehicles OWNER TO supabase_admin;

--
-- Name: v_orders_visits_vehicles; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_orders_visits_vehicles WITH (security_invoker='true') AS
 SELECT ovv.id,
    ovv.ov_id,
    ovv.vehicle_id,
    v.description AS vehicle_description,
    v.plates AS vehicle_plates,
    v.unit,
    ovv.recorder_start,
    ovv.recorder_end,
    ovv.amount,
    ovv.value_unit,
    ovv.value_total,
    ovv.discount,
    ovv.version_mode
   FROM (public.orders_visits_vehicles ovv
     JOIN public.vehicles v ON ((v.id = ovv.vehicle_id)))
  WHERE (ovv.is_deleted = false);


ALTER VIEW public.v_orders_visits_vehicles OWNER TO supabase_admin;

--
-- Name: v_profiles; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_profiles WITH (security_invoker='true') AS
 SELECT cfg_profiles.id,
    cfg_profiles.description,
    cfg_profiles.department_id,
    cfg_profiles.version
   FROM public.cfg_profiles;


ALTER VIEW public.v_profiles OWNER TO supabase_admin;

--
-- Name: v_profiles_permissions; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_profiles_permissions WITH (security_invoker='true') AS
 SELECT cfg_profiles_permissions.id,
    cfg_profiles_permissions.profile_id,
    cfg_profiles_permissions.app_page_id,
    cfg_app_pages.description AS app_page_description
   FROM (public.cfg_profiles_permissions
     JOIN public.cfg_app_pages ON ((cfg_profiles_permissions.app_page_id = cfg_app_pages.id)))
  ORDER BY cfg_profiles_permissions.profile_id, cfg_app_pages.description;


ALTER VIEW public.v_profiles_permissions OWNER TO supabase_admin;

--
-- Name: v_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_services WITH (security_invoker='true') AS
 SELECT cfg_services.id,
    cfg_services.description,
    cfg_services.unit,
    cfg_services.is_available,
    cfg_services.is_deleted,
    cfg_services.version_mode,
    cfg_services.code,
    cfg_services.finger_print,
    cfg_services.company_id
   FROM public.cfg_services
  WHERE (cfg_services.is_deleted = false)
  ORDER BY cfg_services.description;


ALTER VIEW public.v_services OWNER TO supabase_admin;

--
-- Name: v_systems; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_systems WITH (security_invoker='true') AS
 SELECT cfg_systems.id,
    cfg_systems.company_id,
    cfg_systems.parent_id,
    cfg_systems.code,
    cfg_systems.description,
    cfg_systems.is_available
   FROM public.cfg_systems
  WHERE ((cfg_systems.parent_id > 0) AND (cfg_systems.is_deleted = false))
  ORDER BY cfg_systems.description;


ALTER VIEW public.v_systems OWNER TO supabase_admin;

--
-- Name: v_systems_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_systems_parent WITH (security_invoker='true') AS
 SELECT cfg_systems.id,
    cfg_systems.company_id,
    cfg_systems.parent_id,
    cfg_systems.code,
    cfg_systems.description,
    cfg_systems.is_available
   FROM public.cfg_systems
  WHERE ((cfg_systems.parent_id IS NULL) AND (cfg_systems.is_deleted = false))
  ORDER BY cfg_systems.description;


ALTER VIEW public.v_systems_parent OWNER TO supabase_admin;

--
-- Name: v_systems_parent_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_systems_parent_assets_tags_available_rate WITH (security_invoker='true') AS
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.asset_tag_description,
    bool_or(v.flow_rate_is_visible) AS flow_rate_is_visible,
    (sum(v.total_flow_rate_max))::numeric AS total_flow_rate_max,
    (sum(v.total_flow_rate_last))::numeric AS total_flow_rate_last,
    max(v.flow_rate_unit) AS flow_rate_unit,
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric)
        END AS pct_flow_rate_available_fraction,
    (
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_flow_rate_available_percent,
    bool_or(v.power_is_visible) AS power_is_visible,
    (sum(v.total_power_max))::numeric AS total_power_max,
    (sum(v.total_power_last))::numeric AS total_power_last,
    max(v.power_unit) AS power_unit,
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric)
        END AS pct_power_available_fraction,
    (
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_power_available_percent,
    bool_or(v.pressure_is_visible) AS pressure_is_visible,
    (sum(v.total_pressure_max))::numeric AS total_pressure_max,
    (sum(v.total_pressure_last))::numeric AS total_pressure_last,
    max(v.pressure_unit) AS pressure_unit,
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
            bool_or(uat.flow_rate_is_visible) AS flow_rate_is_visible,
            COALESCE((sum(uat.flow_rate_max))::double precision, (0)::double precision) AS total_flow_rate_max,
            COALESCE((sum(uat.last_flow_rate))::double precision, (0)::double precision) AS total_flow_rate_last,
            max((uat.flow_rate_unit)::text) AS flow_rate_unit,
            bool_or(uat.power_is_visible) AS power_is_visible,
            COALESCE((sum(uat.power_max))::double precision, (0)::double precision) AS total_power_max,
            COALESCE((sum(uat.last_power))::double precision, (0)::double precision) AS total_power_last,
            max((uat.power_unit)::text) AS power_unit,
            bool_or(uat.pressure_is_visible) AS pressure_is_visible,
            COALESCE((sum(uat.pressure_max))::double precision, (0)::double precision) AS total_pressure_max,
            COALESCE((sum(uat.last_pressure))::double precision, (0)::double precision) AS total_pressure_last,
            max((uat.pressure_unit)::text) AS pressure_unit,
            COALESCE((sum(uat.last_asset_available_rate))::double precision, (0)::double precision) AS total_last_asset_available_rate
           FROM public.v_units_assets_tags uat
          WHERE (uat.is_deleted = false)
          GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description) v
  GROUP BY v.system_parent_id, v.asset_tag_id, v.asset_tag_description
  ORDER BY v.system_parent_id, v.asset_tag_description;


ALTER VIEW public.v_systems_parent_assets_tags_available_rate OWNER TO supabase_admin;

--
-- Name: v_systems_parent_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_systems_parent_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.asset_tag_id,
    ca.last_processing_id,
    u.system_parent_id,
    count(*) AS total
   FROM (public.cfg_units_assets_tags ca
     JOIN public.units u ON ((u.id = ca.unit_id)))
  WHERE ((ca.is_deleted = false) AND (u.is_deleted = false))
  GROUP BY ca.asset_tag_id, ca.last_processing_id, u.system_parent_id;


ALTER VIEW public.v_systems_parent_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_teams WITH (security_invoker='true') AS
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
    cfg_teams.version,
    cfg_teams.is_evaluable
   FROM public.cfg_teams
  WHERE (cfg_teams.is_deleted = false)
  ORDER BY cfg_teams.sort_order, cfg_teams.description;


ALTER VIEW public.v_teams OWNER TO supabase_admin;

--
-- Name: v_users; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_users WITH (security_invoker='true') AS
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
    users.tracker_interval_seconds,
    users.shift_start,
    users.shift_end,
    users.last_online
   FROM (((((((public.users
     LEFT JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
     JOIN public.cfg_departments ON ((cfg_teams.department_id = cfg_departments.id)))
     JOIN public.cfg_companies ON ((cfg_departments.company_id = cfg_companies.id)))
     JOIN public.cfg_users_statuses ON ((users.status_id = cfg_users_statuses.id)))
     LEFT JOIN public.cfg_profiles ON ((users.profile_id = cfg_profiles.id)))
     LEFT JOIN public.orders ON ((users.o_id_in_progress = orders.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
  ORDER BY users.name_short;


ALTER VIEW public.v_users OWNER TO supabase_admin;

--
-- Name: v_teams_leaders; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_teams_leaders WITH (security_invoker='true') AS
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
    v_users.mobile_whatsapp
   FROM public.v_users
  WHERE ((v_users.is_team_leader = true) AND (v_users.status_id = 2));


ALTER VIEW public.v_teams_leaders OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_technicals_manuals_assets WITH (security_invoker='true') AS
 SELECT technicals_manuals_assets.tm_id,
    technicals_manuals_assets.version_mode AS tma_version_mode,
    v_assets.company_id,
    v_assets.company_description,
    v_assets.company_owner_description,
    v_assets.company_owner_id,
    v_assets.id,
    v_assets.code,
    v_assets.description,
    v_assets.searchable,
    v_assets.tag_id,
    v_assets.tag_description,
    v_assets.tag_sub_id,
    v_assets.tag_sub_description,
    v_assets.unit_asset_tag_id,
    v_assets.location,
    v_assets.unit_id,
    v_assets.unit_code,
    v_assets.unit_description,
    v_assets.status_id,
    v_assets.status_description,
    v_assets.status_code,
    v_assets.status_at,
    v_assets.type_id,
    v_assets.type_description,
    v_assets.priority_id,
    v_assets.priority_code,
    v_assets.priority_description,
    v_assets.brand,
    v_assets.model,
    v_assets.serial,
    v_assets.power,
    v_assets.power_unit,
    v_assets.voltage,
    v_assets.voltage_unit,
    v_assets.amperage,
    v_assets.amperage_unit,
    v_assets.poles,
    v_assets.poles_unit,
    v_assets.rotation,
    v_assets.rotation_unit,
    v_assets.service_factor,
    v_assets.pressure_max,
    v_assets.pressure_min,
    v_assets.pressure_operation,
    v_assets.pressure_unit,
    v_assets.flow_rate_max,
    v_assets.flow_rate_min,
    v_assets.flow_rate_operation,
    v_assets.flow_rate_unit,
    v_assets.rotor_diameter,
    v_assets.rotor_diameter_unit,
    v_assets.weight,
    v_assets.weight_unit,
    v_assets.coupling_model_id,
    v_assets.coupling_model_description,
    v_assets.comments,
    v_assets.acquisition_at,
    v_assets.acquisition_value,
    v_assets.img_file_path,
    v_assets.img_file_name,
    v_assets.img_file_name_thumb,
    v_assets.version_mode
   FROM (public.technicals_manuals_assets
     JOIN public.v_assets ON ((technicals_manuals_assets.asset_id = v_assets.id)));


ALTER VIEW public.v_technicals_manuals_assets OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_technicals_manuals_types WITH (security_invoker='true') AS
 SELECT cfg_technicals_manuals_categories.id,
    cfg_technicals_manuals_categories.description,
    cfg_technicals_manuals_categories.version_mode
   FROM public.cfg_technicals_manuals_categories
  WHERE (cfg_technicals_manuals_categories.is_deleted = false)
  ORDER BY cfg_technicals_manuals_categories.description;


ALTER VIEW public.v_technicals_manuals_types OWNER TO supabase_admin;

--
-- Name: v_unit_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_unit_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.unit_id,
    ca.asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id
  ORDER BY ca.unit_id, ca.asset_tag_id, ca.last_processing_id;


ALTER VIEW public.v_unit_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_units_asset_available_rate_avg; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_asset_available_rate_avg WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units_asset_available_rate_avg OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_availability; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_assets_tags_availability WITH (security_invoker='true') AS
 WITH latest_reports AS (
         SELECT DISTINCT ON (assets_available.unit_id, assets_available.asset_tag_id, assets_available.flow_rate_unit, assets_available.power_unit, assets_available.pressure_unit) assets_available.id,
            assets_available.created_at,
            assets_available.unit_id,
            assets_available.asset_id,
            assets_available.asset_tag_id,
            assets_available.asset_tag_sub_id,
            assets_available.is_available,
            assets_available.status_id,
            assets_available.file_path,
            assets_available.file_name,
            assets_available.comments,
            assets_available.created_user_id,
            assets_available.asset_unavailable_reason_id,
            assets_available.processing_id,
            assets_available.reported_at,
            assets_available.reported_user_id,
            assets_available.operation_record,
            assets_available.reported_latitude,
            assets_available.reported_longitude,
            assets_available.reported_coordinates,
            assets_available.is_on,
            assets_available.operation_unit,
            assets_available.flow_rate_unit,
            assets_available.flow_rate_min,
            assets_available.flow_rate_max,
            assets_available.power_unit,
            assets_available.power_min,
            assets_available.power_max,
            assets_available.pressure_unit,
            assets_available.pressure_min,
            assets_available.pressure_max,
            assets_available.flow_rate_is_on,
            assets_available.power_is_on,
            assets_available.pressure_is_on,
            assets_available.flow_rate_is_available,
            assets_available.power_is_available,
            assets_available.pressure_is_available,
            assets_available.voltage_unit,
            assets_available.voltage_min,
            assets_available.voltage_max,
            assets_available.voltage_is_on,
            assets_available.voltage_is_available,
            assets_available.unit_latitude,
            assets_available.unit_longitude AS unit_longitute,
            assets_available.unit_reported_distance_m,
            assets_available.is_web,
            assets_available.company_id,
            assets_available.provider_company_id
           FROM public.assets_available
          ORDER BY assets_available.unit_id, assets_available.asset_tag_id, assets_available.flow_rate_unit, assets_available.power_unit, assets_available.pressure_unit, assets_available.reported_at DESC
        )
 SELECT latest_reports.unit_id,
    latest_reports.asset_tag_id,
    latest_reports.flow_rate_unit,
    latest_reports.power_unit,
    latest_reports.pressure_unit,
    latest_reports.reported_at,
    sum(latest_reports.flow_rate_max) AS total_flow_rate_max,
    sum(latest_reports.power_max) AS total_power_max,
    sum(latest_reports.pressure_max) AS total_pressure_max,
    sum(latest_reports.flow_rate_is_available) AS total_flow_rate_available,
    sum(latest_reports.power_is_available) AS total_power_available,
    sum(latest_reports.pressure_is_available) AS total_pressure_available,
    sum(latest_reports.flow_rate_is_on) AS total_flow_rate_is_on,
    sum(latest_reports.power_is_on) AS total_power_is_on,
    sum(latest_reports.pressure_is_on) AS total_pressure_is_on,
    COALESCE((sum(latest_reports.flow_rate_is_available) / NULLIF(sum(latest_reports.flow_rate_max), (0)::numeric)), (0)::numeric) AS ratio_flow_rate_available,
    COALESCE((sum(latest_reports.power_is_available) / NULLIF(sum(latest_reports.power_max), (0)::numeric)), (0)::numeric) AS ratio_power_available,
    COALESCE((sum(latest_reports.pressure_is_available) / NULLIF(sum(latest_reports.pressure_max), (0)::numeric)), (0)::numeric) AS ratio_pressure_available
   FROM latest_reports
  GROUP BY latest_reports.unit_id, latest_reports.asset_tag_id, latest_reports.flow_rate_unit, latest_reports.power_unit, latest_reports.pressure_unit, latest_reports.reported_at;


ALTER VIEW public.v_units_assets_tags_availability OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_assets_tags_available_rate WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units_assets_tags_available_rate OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_available_rate_latest_by_user; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_assets_tags_available_rate_latest_by_user WITH (security_invoker='true') AS
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


ALTER VIEW public.v_units_assets_tags_available_rate_latest_by_user OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_assets_tags_processing_counts WITH (security_invoker='true') AS
 SELECT ca.id AS unit_asset_tag_id,
    ca.last_processing_id,
    count(*) AS total
   FROM public.cfg_units_assets_tags ca
  WHERE (ca.is_deleted = false)
  GROUP BY ca.id, ca.last_processing_id
  ORDER BY ca.id, ca.last_processing_id;


ALTER VIEW public.v_units_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_units_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_statuses WITH (security_invoker='true') AS
 SELECT cfg_units_statuses.id,
    cfg_units_statuses.code,
    cfg_units_statuses.description
   FROM public.cfg_units_statuses
  ORDER BY cfg_units_statuses.description;


ALTER VIEW public.v_units_statuses OWNER TO supabase_admin;

--
-- Name: v_units_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_types WITH (security_invoker='true') AS
 SELECT cfg_units_types.id,
    cfg_units_types.code,
    cfg_units_types.description,
    cfg_units_types.parent_id,
    cfg_units_types.is_available,
    cfg_units_types.is_deleted
   FROM public.cfg_units_types
  WHERE ((cfg_units_types.parent_id > 0) AND (cfg_units_types.is_available = true) AND (cfg_units_types.is_deleted = false));


ALTER VIEW public.v_units_types OWNER TO supabase_admin;

--
-- Name: v_units_types_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_units_types_parent WITH (security_invoker='true') AS
 SELECT cfg_units_types.id,
    cfg_units_types.code,
    cfg_units_types.description,
    cfg_units_types.parent_id,
    cfg_units_types.is_available,
    cfg_units_types.is_deleted
   FROM public.cfg_units_types
  WHERE ((cfg_units_types.parent_id IS NULL) AND (cfg_units_types.is_available = true) AND (cfg_units_types.is_deleted = false));


ALTER VIEW public.v_units_types_parent OWNER TO supabase_admin;

--
-- Name: v_users_notifications; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_users_notifications WITH (security_invoker='true') AS
 SELECT users_notifications.id,
    users_notifications.created_at,
    users_notifications.user_id_to,
    users_notifications.user_id_from,
    users_notifications.title,
    users_notifications.body,
    users_notifications.is_read,
    users_notifications.read_at,
    users_notifications.table_id AS unit_id,
    users_notifications.img_url,
    users_notifications.type,
    users_notifications.o_id,
    users_notifications.ov_id AS v_id,
    users_notifications.activity_id,
    users_notifications.company_id,
    users_notifications.token_fcm,
    users_notifications.img_file_path,
    users_notifications.img_file_name,
    users_notifications.user_from_name_short,
    users_notifications.page_target,
    users_notifications.version_mode,
    users_notifications.user_to_whatsapp
   FROM public.users_notifications;


ALTER VIEW public.v_users_notifications OWNER TO supabase_admin;

--
-- Name: v_users_permissions; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_users_permissions WITH (security_invoker='true') AS
 SELECT u.id AS user_id,
    u.uuid AS user_uuid,
    u.email AS user_email,
    u.name_full AS user_name,
    u.profile_id,
    p.description AS profile_name,
    p.department_id,
    r.id AS route_id,
    r.route_key,
    r.route_path,
    r.description AS route_description,
    r.icon AS route_icon,
    r.order_index AS route_order,
    pa.can_view,
    pa.can_create,
    pa.can_edit,
    pa.can_delete,
    pa.created_at AS permission_created_at
   FROM (((public.users u
     JOIN public.cfg_profiles p ON ((u.profile_id = p.id)))
     JOIN public.cfg_profiles_access pa ON ((p.id = pa.profile_id)))
     JOIN public.cfg_routes r ON ((pa.route_id = r.id)))
  WHERE (r.is_available = true)
  ORDER BY u.id, r.order_index;


ALTER VIEW public.v_users_permissions OWNER TO supabase_admin;

--
-- Name: VIEW v_users_permissions; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON VIEW public.v_users_permissions IS 'Consolidated view of user permissions based on their profile and assigned routes';


--
-- Name: v_vehicles; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW public.v_vehicles WITH (security_invoker='true') AS
 SELECT vehicles.id,
    vehicles.company_id,
    vehicles.department_id,
    vehicles.plates,
    vehicles.value_unit,
    vehicles.is_available,
    vehicles.unit,
    vehicles.discount,
    vehicles.description,
    vehicles.finger_print
   FROM public.vehicles
  ORDER BY vehicles.plates;


ALTER VIEW public.v_vehicles OWNER TO supabase_admin;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
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
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.warehouses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: warehouses_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

CREATE SEQUENCE public.warehouses_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_materials_id_seq OWNER TO supabase_admin;

--
-- Name: warehouses_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.warehouses_materials_id_seq OWNED BY public.warehouses_materials.id;


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.iceberg_namespaces OWNER TO supabase_storage_admin;

--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.iceberg_tables OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: ai_chat_histories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_histories ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_histories_id_seq'::regclass);


--
-- Name: assets_loans id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_id_seq'::regclass);


--
-- Name: assets_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_checklists_id_seq'::regclass);


--
-- Name: assets_loans_checklists_images id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_checklists_images_id_seq'::regclass);


--
-- Name: cfg_app_notices id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices ALTER COLUMN id SET DEFAULT nextval('public.system_notices_id_seq'::regclass);


--
-- Name: cfg_app_notices_categories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories ALTER COLUMN id SET DEFAULT nextval('public.system_notice_categories_id_seq'::regclass);


--
-- Name: cfg_app_notices_severities id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities ALTER COLUMN id SET DEFAULT nextval('public.system_notice_severities_id_seq'::regclass);


--
-- Name: cfg_app_tips id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_new_id_seq'::regclass);


--
-- Name: cfg_app_tips_companies id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_companies_id_seq'::regclass);


--
-- Name: cfg_app_tips_departments id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_departments_id_seq'::regclass);


--
-- Name: cfg_app_tips_dismissals id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_dismissals_id_seq'::regclass);


--
-- Name: cfg_app_tips_profiles id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_profiles_id_seq'::regclass);


--
-- Name: cfg_assets_attributes_groups id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes_groups ALTER COLUMN id SET DEFAULT nextval('public.cfg_assets_attributes_groups_id_seq'::regclass);


--
-- Name: cfg_assets_types_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.cfg_assets_types_loans_checklists_id_seq'::regclass);


--
-- Name: cfg_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.cfg_loans_checklists_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: impersonation_password_backup id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.impersonation_password_backup ALTER COLUMN id SET DEFAULT nextval('public.impersonation_password_backup_id_seq'::regclass);


--
-- Name: maintenances_plans id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_id_seq'::regclass);


--
-- Name: maintenances_plans_sections id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_sections_id_seq'::regclass);


--
-- Name: maintenances_plans_sections_activities id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_sections_activities_id_seq'::regclass);


--
-- Name: n8n_chat_histories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.n8n_chat_histories ALTER COLUMN id SET DEFAULT nextval('public.n8n_chat_histories_id_seq'::regclass);


--
-- Name: orders_visits_chat id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_id_seq'::regclass);


--
-- Name: orders_visits_chat_participants id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_participants_id_seq'::regclass);


--
-- Name: orders_visits_chat_reads id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_reads_id_seq'::regclass);


--
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);


--
-- Name: users_tools id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools ALTER COLUMN id SET DEFAULT nextval('public.users_tools_id_seq'::regclass);


--
-- Name: users_tools_movements id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements ALTER COLUMN id SET DEFAULT nextval('public.users_tools_movements_id_seq'::regclass);


--
-- Name: warehouses_materials id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials ALTER COLUMN id SET DEFAULT nextval('public.warehouses_materials_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_histories ai_chat_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_histories
    ADD CONSTRAINT ai_chat_histories_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge ai_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_knowledge
    ADD CONSTRAINT ai_knowledge_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: cfg_app app_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app
    ADD CONSTRAINT app_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_pages apppages_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_pages
    ADD CONSTRAINT apppages_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_versions_update appversionsupdate_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_versions_update
    ADD CONSTRAINT appversionsupdate_pkey PRIMARY KEY (id);


--
-- Name: assets_alerts assets_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_attributes assets_attributes_field_key_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_field_key_unique UNIQUE (field_key);


--
-- Name: cfg_assets_attributes assets_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_pkey PRIMARY KEY (id);


--
-- Name: assets_attributes_values assets_attributes_values_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_pkey PRIMARY KEY (asset_id, field_key);


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_pkey PRIMARY KEY (id);


--
-- Name: assets_loans_checklists assets_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: assets_loans assets_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_tags
    ADD CONSTRAINT assets_tags_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_attributes assets_types_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT assets_types_attributes_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_attributes assets_types_attributes_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT assets_types_attributes_unique UNIQUE (asset_type_id, attribute_id);


--
-- Name: cfg_assets_types assets_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types
    ADD CONSTRAINT assets_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_couplings_models assetscouplingsmodels_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_couplings_models
    ADD CONSTRAINT assetscouplingsmodels_pkey PRIMARY KEY (id);


--
-- Name: assets_followers assetsfollowers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_followers
    ADD CONSTRAINT assetsfollowers_pkey PRIMARY KEY (id);


--
-- Name: assets_materials assetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_materials
    ADD CONSTRAINT assetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_priorities assetspriorities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_priorities
    ADD CONSTRAINT assetspriorities_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_statuses assetsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_statuses
    ADD CONSTRAINT assetsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags_subs assetstagssubs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_tags_subs
    ADD CONSTRAINT assetstagssubs_pkey PRIMARY KEY (id);


--
-- Name: carts_materials cart_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.carts_materials
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cfg_activities cfg_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_activities
    ADD CONSTRAINT cfg_activities_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_notices cfg_app_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT cfg_app_notices_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_offline_updates cfg_app_offline_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_offline_updates
    ADD CONSTRAINT cfg_app_offline_tables_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_tip_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_company_id_key UNIQUE (tip_id, company_id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_tip_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_department_id_key UNIQUE (tip_id, department_id);


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_tip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_user_id_key UNIQUE (tip_id, user_id);


--
-- Name: cfg_app_tips cfg_app_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_tip_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_profile_id_key UNIQUE (tip_id, profile_id);


--
-- Name: cfg_assets_attributes_groups cfg_assets_attributes_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes_groups
    ADD CONSTRAINT cfg_assets_attributes_groups_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_available_processing cfg_assets_available_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_available_processing
    ADD CONSTRAINT cfg_assets_available_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklist_checklist_id_asset_type_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklist_checklist_id_asset_type_id_key UNIQUE (checklist_id, asset_type_id);


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_unavailable_reasons cfg_assets_unavailable_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_unavailable_reasons
    ADD CONSTRAINT cfg_assets_unavailable_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_extras_processing cfg_eap_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_extras_processing
    ADD CONSTRAINT cfg_eap_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_evaluation_requirements cfg_evaluation_requirements_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_evaluation_requirements
    ADD CONSTRAINT cfg_evaluation_requirements_code_key UNIQUE (code);


--
-- Name: cfg_evaluation_requirements cfg_evaluation_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_evaluation_requirements
    ADD CONSTRAINT cfg_evaluation_requirements_pkey PRIMARY KEY (id);


--
-- Name: cfg_loans_checklists cfg_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_loans_checklists
    ADD CONSTRAINT cfg_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_statuses cfg_material_purchases_statuses_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_material_purchases_statuses_code_key UNIQUE (code);


--
-- Name: cfg_materials_purchases_statuses cfg_material_purchases_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_material_purchases_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_cancel_reasons cfg_materials_purchases_cancel_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_cancel_reasons
    ADD CONSTRAINT cfg_materials_purchases_cancel_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_types cfg_materials_purchases_types_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_code_key UNIQUE (code);


--
-- Name: cfg_materials_purchases_types cfg_materials_purchases_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_statuses cfg_materials_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_statuses
    ADD CONSTRAINT cfg_materials_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_types cfg_materials_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_types
    ADD CONSTRAINT cfg_materials_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_suspended_reasons cfg_orders_suspended_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_suspended_reasons
    ADD CONSTRAINT cfg_orders_suspended_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access cfg_profiles_access_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT cfg_profiles_access_pkey PRIMARY KEY (id);


--
-- Name: cfg_routes cfg_routes_route_key_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT cfg_routes_route_key_key UNIQUE (route_key);


--
-- Name: cfg_services cfg_services_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_services
    ADD CONSTRAINT cfg_services_pkey PRIMARY KEY (id);


--
-- Name: cfg_technicals_manuals_categories cfg_technicals_manuals_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_technicals_manuals_categories
    ADD CONSTRAINT cfg_technicals_manuals_categories_pkey PRIMARY KEY (id);


--
-- Name: chat_agent_ai chat_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.chat_agent_ai
    ADD CONSTRAINT chat_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: cfg_companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_contract_evaluation_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_contract_evaluation_unique UNIQUE (contract_id, evaluation_id);


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: contracts_managers contractsmanagers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contractsmanagers_pkey PRIMARY KEY (id);


--
-- Name: contracts_services contractsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_services
    ADD CONSTRAINT contractsservices_pkey PRIMARY KEY (id);


--
-- Name: cfg_contracts_statuses contractsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_contracts_statuses
    ADD CONSTRAINT contractsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_departments department_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_departments
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: goose_db_version goose_db_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goose_db_version
    ADD CONSTRAINT goose_db_version_pkey PRIMARY KEY (id);


--
-- Name: impersonation_password_backup impersonation_password_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.impersonation_password_backup
    ADD CONSTRAINT impersonation_password_backup_pkey PRIMARY KEY (id);


--
-- Name: leader_monthly_scores leader_monthly_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_pkey PRIMARY KEY (id);


--
-- Name: leader_monthly_scores leader_monthly_scores_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_unique UNIQUE (leader_id, score_year, score_month);


--
-- Name: leader_score_badges leader_score_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_score_badges
    ADD CONSTRAINT leader_score_badges_pkey PRIMARY KEY (id);


--
-- Name: leader_scores_history leader_scores_history_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_pkey PRIMARY KEY (id);


--
-- Name: leader_scores_history leader_scores_history_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_unique UNIQUE (ov_id);


--
-- Name: logs_api logs_api_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.logs_api
    ADD CONSTRAINT logs_api_pkey PRIMARY KEY (id);


--
-- Name: audits_logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.audits_logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans maintenances_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans
    ADD CONSTRAINT maintenances_plans_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_a_maintenance_plan_section_id_a_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_a_maintenance_plan_section_id_a_key UNIQUE (maintenance_plan_section_id, activity_id);


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_activities_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans_sections maintenances_plans_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections
    ADD CONSTRAINT maintenances_plans_sections_pkey PRIMARY KEY (id);


--
-- Name: materials_purchases material_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT material_purchases_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: n8n_chat_histories n8n_chat_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.n8n_chat_histories
    ADD CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_counter orders_counter_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_counter
    ADD CONSTRAINT orders_counter_pkey PRIMARY KEY (id);


--
-- Name: orders_followers orders_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_followers
    ADD CONSTRAINT orders_followers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_statuses orders_visitis_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_statuses
    ADD CONSTRAINT orders_visitis_statuses_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets_activities orders_visits_assets_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_activities
    ADD CONSTRAINT orders_visits_assets_activities_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets orders_visits_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_ov_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_ov_id_user_id_key UNIQUE (ov_id, user_id);


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat orders_visits_chat_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_chat_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_chat_id_user_id_key UNIQUE (chat_id, user_id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_evaluations orders_visits_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras orders_visits_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_pkey PRIMARY KEY (id);


--
-- Name: orders_visits orders_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_processing orders_visits_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_processing
    ADD CONSTRAINT orders_visits_processing_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_teams orders_visits_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_teams
    ADD CONSTRAINT orders_visits_teams_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_cancel_reasons orderscancelreasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_cancel_reasons
    ADD CONSTRAINT orderscancelreasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_causes_reasons orderscauses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_causes_reasons
    ADD CONSTRAINT orderscauses_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_objects ordersobjects_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_objects
    ADD CONSTRAINT ordersobjects_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_plans ordersplans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_plans
    ADD CONSTRAINT ordersplans_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_priorities orderspriorities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_priorities
    ADD CONSTRAINT orderspriorities_pkey PRIMARY KEY (id);


--
-- Name: orders_statuses_logs ordersstatuseslogs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_statuses_logs
    ADD CONSTRAINT ordersstatuseslogs_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_statuses ordersstatusess_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_statuses
    ADD CONSTRAINT ordersstatusess_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types orderstypes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types
    ADD CONSTRAINT orderstypes_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_activities orderstypesactivities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types_activities
    ADD CONSTRAINT orderstypesactivities_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_subs orderstypessubs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types_subs
    ADD CONSTRAINT orderstypessubs_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets_materials ordersvisitsassetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_materials
    ADD CONSTRAINT ordersvisitsassetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_services ordersvisitsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_services
    ADD CONSTRAINT ordersvisitsservices_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_vehicles ordersvisitsvehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_vehicles
    ADD CONSTRAINT ordersvisitsvehicles_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access profiles_access_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_unique UNIQUE (profile_id, route_id);


--
-- Name: cfg_routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: cfg_app_notices_categories system_notice_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories
    ADD CONSTRAINT system_notice_categories_code_key UNIQUE (code);


--
-- Name: cfg_app_notices_categories system_notice_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories
    ADD CONSTRAINT system_notice_categories_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_notices_severities system_notice_severities_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities
    ADD CONSTRAINT system_notice_severities_code_key UNIQUE (code);


--
-- Name: cfg_app_notices_severities system_notice_severities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities
    ADD CONSTRAINT system_notice_severities_pkey PRIMARY KEY (id);


--
-- Name: cfg_systems systems_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (id);


--
-- Name: cfg_teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: technicals_manuals_files technicals_manuals_files_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_pkey PRIMARY KEY (id);


--
-- Name: technicals_manuals technicals_manuals_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals
    ADD CONSTRAINT technicals_manuals_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: import_orders_visits_contracts tmp_contracts_import_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.import_orders_visits_contracts
    ADD CONSTRAINT tmp_contracts_import_pkey PRIMARY KEY (id);


--
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets unique_ov_asset; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT unique_ov_asset UNIQUE (ov_id, asset_id);


--
-- Name: assets_available units_assets_available_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT units_assets_available_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_assets_tags units_assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT units_assets_tags_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_statuses unitsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_statuses
    ADD CONSTRAINT unitsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_types unitstypes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_types
    ADD CONSTRAINT unitstypes_pkey PRIMARY KEY (id);


--
-- Name: users_notifications users_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_tools_movements users_tools_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_pkey PRIMARY KEY (id);


--
-- Name: users_tools users_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles usersprofiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT usersprofiles_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_permissions usersprofilespermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_permissions
    ADD CONSTRAINT usersprofilespermissions_pkey PRIMARY KEY (id);


--
-- Name: cfg_users_statuses usersstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_users_statuses
    ADD CONSTRAINT usersstatuses_pkey PRIMARY KEY (id);


--
-- Name: users_tracker userstracks_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tracker
    ADD CONSTRAINT userstracks_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: warehouses_materials warehouses_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_pkey PRIMARY KEY (id);


--
-- Name: warehouses_materials warehouses_materials_warehouse_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_warehouse_id_material_id_key UNIQUE (warehouse_id, material_id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: cfg_units_assets_tags_asset_tag_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_asset_tag_id_idx ON public.cfg_units_assets_tags USING btree (asset_tag_id);


--
-- Name: cfg_units_assets_tags_last_processing_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_last_processing_id_idx ON public.cfg_units_assets_tags USING btree (last_processing_id);


--
-- Name: cfg_units_assets_tags_unit_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_unit_id_idx ON public.cfg_units_assets_tags USING btree (unit_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON public.extensions USING btree (tenant_external_id, type);


--
-- Name: idx_assets_alerts_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_o_id ON public.assets_alerts USING btree (o_id);


--
-- Name: idx_assets_alerts_o_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_o_type_id ON public.assets_alerts USING btree (o_type_id);


--
-- Name: idx_assets_alerts_ova_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_ova_id ON public.assets_alerts USING btree (ova_id);


--
-- Name: idx_assets_available_asset_tag_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_available_asset_tag_sub_id ON public.assets_available USING btree (asset_tag_sub_id);


--
-- Name: idx_assets_available_latest; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_available_latest ON public.assets_available USING btree (unit_id, asset_tag_id, flow_rate_unit, power_unit, pressure_unit, reported_at DESC);


--
-- Name: idx_assets_code_trgm; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_code_trgm ON public.assets USING gin (code extensions.gin_trgm_ops);


--
-- Name: idx_assets_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_company_id ON public.assets USING btree (company_id);


--
-- Name: idx_assets_description; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_description ON public.assets USING btree (description);


--
-- Name: idx_assets_loans_asset; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_asset ON public.assets_loans USING btree (asset_id);


--
-- Name: idx_assets_loans_checklists_images_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_checklists_images_checklist ON public.assets_loans_checklists_images USING btree (checklist_id);


--
-- Name: idx_assets_loans_checklists_loan_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_checklists_loan_checklist ON public.assets_loans_checklists USING btree (loan_checklist_id);


--
-- Name: idx_assets_loans_expected_return; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_expected_return ON public.assets_loans USING btree (expected_return_date);


--
-- Name: idx_assets_loans_lender; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_lender ON public.assets_loans USING btree (lender_user_id);


--
-- Name: idx_assets_loans_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_status ON public.assets_loans USING btree (status);


--
-- Name: idx_assets_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_material_id ON public.assets USING btree (material_id);


--
-- Name: idx_assets_searchable; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_searchable ON public.assets USING gin (to_tsvector('portuguese'::regconfig, searchable));


--
-- Name: idx_assets_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_type_id ON public.assets USING btree (type_id);


--
-- Name: idx_assets_unit_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_unit_asset_tag_id ON public.assets USING btree (unit_asset_tag_id);


--
-- Name: idx_assets_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_unit_id ON public.assets USING btree (unit_id);


--
-- Name: idx_cfg_app_notices_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_active ON public.cfg_app_notices USING btree (is_active, start_date, end_date);


--
-- Name: idx_cfg_app_notices_created_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_created_at ON public.cfg_app_notices USING btree (created_at DESC);


--
-- Name: idx_cfg_app_notices_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_created_user_id ON public.cfg_app_notices USING btree (created_user_id);


--
-- Name: idx_cfg_app_notices_date_range; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_date_range ON public.cfg_app_notices USING btree (start_date, end_date);


--
-- Name: idx_cfg_app_tips_companies_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_companies_tip_id ON public.cfg_app_tips_companies USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_created_by; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_created_by ON public.cfg_app_tips USING btree (created_by);


--
-- Name: idx_cfg_app_tips_departments_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_departments_tip_id ON public.cfg_app_tips_departments USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_dismissals_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_dismissals_user_id ON public.cfg_app_tips_dismissals USING btree (user_id);


--
-- Name: idx_cfg_app_tips_profiles_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_profiles_tip_id ON public.cfg_app_tips_profiles USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_screen_target; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_screen_target ON public.cfg_app_tips USING btree (screen_target);


--
-- Name: idx_cfg_assets_attributes_groups_group_name_unique; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX idx_cfg_assets_attributes_groups_group_name_unique ON public.cfg_assets_attributes_groups USING btree (group_name) WHERE (parent_id IS NULL);


--
-- Name: idx_cfg_assets_attributes_groups_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_attributes_groups_parent_id ON public.cfg_assets_attributes_groups USING btree (parent_id);


--
-- Name: idx_cfg_assets_attributes_select_options_group_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_attributes_select_options_group_id ON public.cfg_assets_attributes USING btree (select_options_group_id);


--
-- Name: idx_cfg_assets_tags_description; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_tags_description ON public.cfg_assets_tags USING btree (id, description);


--
-- Name: idx_cfg_assets_types_attributes_attribute_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_attributes_attribute_id ON public.cfg_assets_types_attributes USING btree (attribute_id);


--
-- Name: idx_cfg_assets_types_loans_checklists_asset_type; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_loans_checklists_asset_type ON public.cfg_assets_types_loans_checklists USING btree (asset_type_id);


--
-- Name: idx_cfg_assets_types_loans_checklists_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_loans_checklists_checklist ON public.cfg_assets_types_loans_checklists USING btree (checklist_id);


--
-- Name: idx_cfg_loans_checklists_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_loans_checklists_active ON public.cfg_loans_checklists USING btree (is_active);


--
-- Name: idx_cfg_routes_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_routes_parent_id ON public.cfg_routes USING btree (parent_id);


--
-- Name: idx_cfg_units_assets_tags_agg; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_agg ON public.cfg_units_assets_tags USING btree (asset_tag_id, last_processing_id, is_deleted);


--
-- Name: idx_cfg_units_assets_tags_asset_tag_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_asset_tag_sub_id ON public.cfg_units_assets_tags USING btree (asset_tag_sub_id);


--
-- Name: idx_cfg_units_assets_tags_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_created_user_id ON public.cfg_units_assets_tags USING btree (created_user_id);


--
-- Name: idx_cfg_units_assets_tags_deleted_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_deleted_user_id ON public.cfg_units_assets_tags USING btree (deleted_user_id);


--
-- Name: idx_cfg_units_assets_tags_last_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_last_created_user_id ON public.cfg_units_assets_tags USING btree (last_created_user_id);


--
-- Name: idx_cfg_units_assets_tags_last_reported_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_last_reported_user_id ON public.cfg_units_assets_tags USING btree (last_reported_user_id);


--
-- Name: idx_contracts_eval_req_evaluation_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_contracts_eval_req_evaluation_id ON public.contracts_evaluation_requirements USING btree (evaluation_id);


--
-- Name: idx_contracts_evaluation_requirements_contract; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_contracts_evaluation_requirements_contract ON public.contracts_evaluation_requirements USING btree (contract_id);


--
-- Name: idx_cuat_active_reporting; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cuat_active_reporting ON public.cfg_units_assets_tags USING btree (unit_id, asset_tag_id, last_reported_at) INCLUDE (is_deleted, last_asset_available_rate, last_flow_rate, last_power, last_pressure, flow_rate_max, power_max, pressure_max, last_processing_id) WHERE (is_deleted = false);


--
-- Name: idx_leader_monthly_scores_dept_period; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_monthly_scores_dept_period ON public.leader_monthly_scores USING btree (department_id, score_year, score_month);


--
-- Name: idx_leader_monthly_scores_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_monthly_scores_leader ON public.leader_monthly_scores USING btree (leader_id);


--
-- Name: idx_leader_score_badges_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_score_badges_leader ON public.leader_score_badges USING btree (leader_id);


--
-- Name: idx_leader_score_badges_period; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_score_badges_period ON public.leader_score_badges USING btree (score_year, score_month);


--
-- Name: idx_logs_api_key_created; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_logs_api_key_created ON public.logs_api USING btree (api_key, created_at DESC);


--
-- Name: idx_maintenances_plans_sections_activities_activity_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_maintenances_plans_sections_activities_activity_id ON public.maintenances_plans_sections_activities USING btree (activity_id);


--
-- Name: idx_material_purchases_material; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_material_purchases_material ON public.materials_purchases USING btree (material_id);


--
-- Name: idx_materials_id_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_materials_id_active ON public.materials USING btree (id) WHERE (is_deleted = false);


--
-- Name: idx_materials_purchases_cancel_reason_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_materials_purchases_cancel_reason_id ON public.materials_purchases USING btree (cancel_reason_id);


--
-- Name: idx_orders_asset_tag_parent_requested; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_asset_tag_parent_requested ON public.orders USING btree (asset_tag_id, requested_at DESC) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_company_id ON public.orders USING btree (company_id);


--
-- Name: idx_orders_company_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_company_status ON public.orders USING btree (company_id, status_id);


--
-- Name: idx_orders_completed_lookup; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_completed_lookup ON public.orders USING btree (status_id, parent_id, status_at DESC);


--
-- Name: idx_orders_contract_parent_requested; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_contract_parent_requested ON public.orders USING btree (contract_id, requested_at DESC) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_followers_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_followers_o_id ON public.orders_followers USING btree (o_id);


--
-- Name: idx_orders_is_deleted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_is_deleted ON public.orders USING btree (is_deleted);


--
-- Name: idx_orders_object_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_object_id ON public.orders USING btree (object_id);


--
-- Name: idx_orders_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_parent_id ON public.orders USING btree (parent_id);


--
-- Name: idx_orders_parent_not_null_requested_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_parent_not_null_requested_at ON public.orders USING btree (requested_at DESC, status_id) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_requested_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_requested_at ON public.orders USING btree (requested_at);


--
-- Name: idx_orders_requested_at_desc; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_requested_at_desc ON public.orders USING btree (requested_at DESC);


--
-- Name: idx_orders_status_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_status_at ON public.orders USING btree (status_at DESC);


--
-- Name: idx_orders_status_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_status_id ON public.orders USING btree (status_id);


--
-- Name: idx_orders_statuses_logs_order_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_statuses_logs_order_id ON public.orders_statuses_logs USING btree (order_id);


--
-- Name: idx_orders_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_type_id ON public.orders USING btree (type_id);


--
-- Name: idx_orders_type_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_type_sub_id ON public.orders USING btree (type_sub_id);


--
-- Name: idx_orders_unit_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_asset_tag_id ON public.orders USING btree (unit_asset_tag_id);


--
-- Name: idx_orders_unit_contract; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_contract ON public.orders USING btree (unit_id, contract_id);


--
-- Name: idx_orders_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_id ON public.orders USING btree (unit_id);


--
-- Name: idx_orders_visits_assets_activities_plan_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_activities_plan_id ON public.orders_visits_assets_activities USING btree (maintenance_plan_id);


--
-- Name: idx_orders_visits_assets_after_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_after_unit_id ON public.orders_visits_assets USING btree (after_unit_id);


--
-- Name: idx_orders_visits_assets_before_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_before_unit_id ON public.orders_visits_assets USING btree (before_unit_id);


--
-- Name: idx_orders_visits_chat_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_ov_id ON public.orders_visits_chat USING btree (ov_id);


--
-- Name: idx_orders_visits_chat_participants_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_participants_user_id ON public.orders_visits_chat_participants USING btree (user_id);


--
-- Name: idx_orders_visits_chat_reads_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_reads_user_id ON public.orders_visits_chat_reads USING btree (user_id);


--
-- Name: idx_orders_visits_chat_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_user_id ON public.orders_visits_chat USING btree (user_id);


--
-- Name: idx_orders_visits_costs_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_costs_status ON public.orders_visits USING btree (ov_costs_status) WHERE (ov_costs_status IS NOT NULL);


--
-- Name: idx_orders_visits_costs_submitted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_costs_submitted ON public.orders_visits USING btree (ov_costs_status, ov_processing_id) WHERE (ov_costs_status = 'submitted'::text);


--
-- Name: idx_orders_visits_evaluations_ov; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_evaluations_ov ON public.orders_visits_evaluations USING btree (ov_id);


--
-- Name: idx_orders_visits_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_o_id ON public.orders_visits USING btree (o_id);


--
-- Name: idx_orders_visits_processing; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_processing ON public.orders_visits USING btree (ov_processing_id, ov_status_id);


--
-- Name: idx_orders_visits_services_aggregation; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_services_aggregation ON public.orders_visits_services USING btree (ov_id, service_id, value_unit, discount) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_services_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_services_ov_id ON public.orders_visits_services USING btree (ov_id) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_started_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_started_at ON public.orders_visits USING btree (ov_started_at DESC);


--
-- Name: idx_orders_visits_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_status ON public.orders_visits USING btree (ov_status_id);


--
-- Name: idx_orders_visits_teams_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_leader ON public.orders_visits_teams USING btree (ov_id, is_leader, order_id);


--
-- Name: idx_orders_visits_teams_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_ov_id ON public.orders_visits_teams USING btree (ov_id);


--
-- Name: idx_orders_visits_teams_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_user_id ON public.orders_visits_teams USING btree (user_id);


--
-- Name: idx_orders_visits_vehicles_aggregation; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_aggregation ON public.orders_visits_vehicles USING btree (ov_id, vehicle_id, value_unit, discount) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_vehicles_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_ov_id ON public.orders_visits_vehicles USING btree (ov_id) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_vehicles_vehicle_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_vehicle_id ON public.orders_visits_vehicles USING btree (vehicle_id);


--
-- Name: idx_orders_year; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_year ON public.orders USING btree (year);


--
-- Name: idx_ov_assets_ov_processing; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_assets_ov_processing ON public.orders_visits_assets USING btree (ov_id, processing_id);


--
-- Name: idx_ov_chat_closed_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_closed_user_id ON public.orders_visits USING btree (chat_closed_user_id);


--
-- Name: idx_ov_chat_created_user; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_created_user ON public.orders_visits USING btree (chat_created_user_id);


--
-- Name: idx_ov_chat_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_status ON public.orders_visits USING btree (chat_status);


--
-- Name: idx_ov_costs_approved_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_approved_user_id ON public.orders_visits USING btree (ov_costs_approved_user_id);


--
-- Name: idx_ov_costs_rejected_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_rejected_user_id ON public.orders_visits USING btree (ov_costs_rejected_user_id);


--
-- Name: idx_ov_costs_waiting_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_waiting_user_id ON public.orders_visits USING btree (ov_costs_waiting_user_id);


--
-- Name: idx_ov_started_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_started_at ON public.orders_visits USING btree (ov_started_at);


--
-- Name: idx_ov_team_leader_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_team_leader_id ON public.orders_visits USING btree (ov_team_leader_id);


--
-- Name: idx_ova_asset_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_asset_id ON public.orders_visits_assets USING btree (asset_id);


--
-- Name: idx_ova_is_deleted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_is_deleted ON public.orders_visits_assets USING btree (is_deleted);


--
-- Name: idx_ova_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_o_id ON public.orders_visits_assets USING btree (o_id);


--
-- Name: idx_ova_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_ov_id ON public.orders_visits_assets USING btree (ov_id);


--
-- Name: idx_ovaa_ova_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovaa_ova_id ON public.orders_visits_assets_activities USING btree (ova_id);


--
-- Name: idx_ovcp_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovcp_ov_id ON public.orders_visits_chat_participants USING btree (ov_id);


--
-- Name: idx_ove_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_asset_tag_id ON public.orders_visits_extras USING btree (asset_tag_id);


--
-- Name: idx_ove_contract_evaluation_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_contract_evaluation_id ON public.orders_visits_evaluations USING btree (contract_evaluation_id);


--
-- Name: idx_ove_o_cause_reason_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_cause_reason_id ON public.orders_visits_extras USING btree (o_cause_reason_id);


--
-- Name: idx_ove_o_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_type_id ON public.orders_visits_extras USING btree (o_type_id);


--
-- Name: idx_ove_o_type_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_type_sub_id ON public.orders_visits_extras USING btree (o_type_sub_id);


--
-- Name: idx_ove_priority_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_priority_id ON public.orders_visits_extras USING btree (priority_id);


--
-- Name: idx_ove_processing_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_processing_id ON public.orders_visits_extras USING btree (processing_id);


--
-- Name: idx_ove_system_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_system_id ON public.orders_visits_extras USING btree (system_id);


--
-- Name: idx_ove_system_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_system_parent_id ON public.orders_visits_extras USING btree (system_parent_id);


--
-- Name: idx_ove_team_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_team_id ON public.orders_visits_extras USING btree (team_id);


--
-- Name: idx_ove_team_leader_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_team_leader_id ON public.orders_visits_extras USING btree (team_leader_id);


--
-- Name: idx_ove_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_id ON public.orders_visits_extras USING btree (unit_id);


--
-- Name: idx_ove_unit_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_type_id ON public.orders_visits_extras USING btree (unit_type_id);


--
-- Name: idx_ove_unit_type_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_type_parent_id ON public.orders_visits_extras USING btree (unit_type_parent_id);


--
-- Name: idx_ovef_ove_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovef_ove_id ON public.orders_visits_extras_followers USING btree (ove_id);


--
-- Name: idx_ovef_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovef_user_id ON public.orders_visits_extras_followers USING btree (user_id);


--
-- Name: idx_ovet_ove_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovet_ove_id ON public.orders_visits_extras_teams USING btree (ove_id);


--
-- Name: idx_ovet_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovet_user_id ON public.orders_visits_extras_teams USING btree (user_id);


--
-- Name: idx_profiles_access_profile_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_profiles_access_profile_id ON public.cfg_profiles_access USING btree (profile_id);


--
-- Name: idx_profiles_access_route_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_profiles_access_route_id ON public.cfg_profiles_access USING btree (route_id);


--
-- Name: idx_tools_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_tools_material_id ON public.tools USING btree (material_id);


--
-- Name: idx_trgm_orders_visits_ov_mask; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_trgm_orders_visits_ov_mask ON public.orders_visits USING gin (ov_mask extensions.gin_trgm_ops);


--
-- Name: idx_units_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_active ON public.units USING btree (status_id, version_mode) WHERE (is_deleted = false);


--
-- Name: idx_units_id_parent; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_id_parent ON public.units USING btree (id, system_parent_id);


--
-- Name: idx_units_status_version; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_status_version ON public.units USING btree (status_id, version_mode);


--
-- Name: idx_units_system_parent; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_system_parent ON public.units USING btree (system_parent_id);


--
-- Name: idx_units_unit_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_unit_type_id ON public.units USING btree (unit_type_id);


--
-- Name: idx_users_availability; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_availability ON public.users USING btree (id, is_available, name_short);


--
-- Name: idx_users_available; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_available ON public.users USING btree (team_id, company_id) WHERE (is_available = true);


--
-- Name: idx_users_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);


--
-- Name: idx_users_is_available; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_is_available ON public.users USING btree (is_available);


--
-- Name: idx_users_name_full_asc; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_name_full_asc ON public.users USING btree (name_full);


--
-- Name: idx_users_notifications_user_id_from; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_notifications_user_id_from ON public.users_notifications USING btree (user_id_from);


--
-- Name: idx_users_notifications_user_id_to; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_notifications_user_id_to ON public.users_notifications USING btree (user_id_to);


--
-- Name: idx_users_profile_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_profile_id ON public.users USING btree (profile_id);


--
-- Name: idx_users_status_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_status_id ON public.users USING btree (status_id);


--
-- Name: idx_users_team_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_team_id ON public.users USING btree (team_id);


--
-- Name: idx_users_tools_mov_tool_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_mov_tool_id ON public.users_tools_movements USING btree (tool_id);


--
-- Name: idx_users_tools_tool_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_tool_id ON public.users_tools USING btree (tool_id);


--
-- Name: idx_users_tools_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_user_id ON public.users_tools USING btree (user_id);


--
-- Name: idx_users_uuid; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_uuid ON public.users USING btree (uuid);


--
-- Name: idx_vehicles_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_vehicles_id ON public.vehicles USING btree (id);


--
-- Name: idx_wm_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_wm_material_id ON public.warehouses_materials USING btree (material_id);


--
-- Name: materials_code_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX materials_code_idx ON public.materials USING btree (code);


--
-- Name: materials_finger_print_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX materials_finger_print_idx ON public.materials USING btree (finger_print);


--
-- Name: orders_contract_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_contract_id_idx ON public.orders USING btree (contract_id);


--
-- Name: orders_followers_user_id_o_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_followers_user_id_o_id_idx ON public.orders_followers USING btree (user_id, o_id);


--
-- Name: orders_visits_finger_print_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_visits_finger_print_idx ON public.orders_visits USING btree (finger_print);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX tenants_external_id_index ON public.tenants USING btree (external_id);


--
-- Name: users_notifications_created_at_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX users_notifications_created_at_idx ON public.users_notifications USING btree (created_at);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: users_notifications n8n_whatsappUserNotification; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER "n8n_whatsappUserNotification" AFTER INSERT ON public.users_notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://services-n8n-webhook.2unk5k.easypanel.host/webhook/whatsappUserNotification', 'POST', '{"Content-type":"application/json"}', '{}', '5000');


--
-- Name: users on_profile_photo_change; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER on_profile_photo_change AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_profile_photo_change_notification();


--
-- Name: users on_user_updated; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER on_user_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: orders_visits_assets tgr_after_img_file_name_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_after_img_file_name_update BEFORE INSERT OR UPDATE OF after_img_files_names ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_after_img_file_name();


--
-- Name: orders_visits_assets tgr_after_img_files_names_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_after_img_files_names_update BEFORE INSERT OR UPDATE OF after_img_file_name ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_after_img_files_names();


--
-- Name: assets tgr_assets_searchable_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_assets_searchable_update BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.fc_assets_searchable_update();


--
-- Name: orders_visits_assets tgr_before_img_file_name_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_before_img_file_name_update BEFORE INSERT OR UPDATE OF before_img_files_names ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_before_img_file_name();


--
-- Name: orders_visits_assets tgr_before_img_files_names_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_before_img_files_names_update BEFORE INSERT OR UPDATE OF before_img_file_name ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_before_img_files_names();


--
-- Name: cfg_units_assets_tags tgr_cfg_units_assets_tags_set_last_values_when_processing_2; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_cfg_units_assets_tags_set_last_values_when_processing_2 BEFORE UPDATE ON public.cfg_units_assets_tags FOR EACH ROW EXECUTE FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2();


--
-- Name: orders_visits tgr_durations_hours_decimals; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_durations_hours_decimals BEFORE INSERT OR UPDATE ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_durations_hours_decimals();


--
-- Name: materials tgr_materials_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_materials_searchable BEFORE INSERT OR UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.fc_materials_searchable();


--
-- Name: orders tgr_orders_sanitize_requested_services; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_sanitize_requested_services BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_replace_special_chars();


--
-- Name: orders_visits_assets_activities tgr_orders_visits_assets_activities_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_assets_activities_description AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_activities FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_activities_description();


--
-- Name: orders_visits_assets tgr_orders_visits_assets_update_activities_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_assets_update_activities_searchable AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_activities_searchable();


--
-- Name: orders_visits_services tgr_orders_visits_services_amount_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_services_amount_update BEFORE INSERT OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_amount_update();


--
-- Name: units tgr_units_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_units_searchable BEFORE INSERT OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.fc_tgr_units_searchable();


--
-- Name: orders_visits trg_audit_visit_costs_status; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_audit_visit_costs_status AFTER UPDATE OF ov_costs_status ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fn_audit_visit_costs_status();


--
-- Name: cfg_app_notices trg_cfg_app_notices_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_cfg_app_notices_updated_at BEFORE UPDATE ON public.cfg_app_notices FOR EACH ROW EXECUTE FUNCTION public.update_cfg_app_notices_updated_at();


--
-- Name: orders trg_followers_orders_status_changed; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_followers_orders_status_changed AFTER UPDATE OF status_id ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_followers_orders_status_changed();


--
-- Name: import_orders_visits_contracts trg_import_orders_visits_contracts_update_finger_print; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_import_orders_visits_contracts_update_finger_print BEFORE INSERT OR UPDATE ON public.import_orders_visits_contracts FOR EACH ROW EXECUTE FUNCTION public.fc_import_orders_visits_contracts_update_finger_print();


--
-- Name: users trg_leader_tracker_interval; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_leader_tracker_interval BEFORE UPDATE OF is_ov_in_progress, is_team_leader ON public.users FOR EACH ROW EXECUTE FUNCTION public.fc_leader_tracker_interval();


--
-- Name: orders trg_order_status_inheritance; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_order_status_inheritance AFTER UPDATE OF status_id, status_at ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_order_status_inheritance();


--
-- Name: orders trg_orders_op_counter; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_op_counter AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_op_counter_trigger();


--
-- Name: orders trg_orders_statuses_logs; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_statuses_logs AFTER UPDATE OF status_id ON public.orders FOR EACH ROW WHEN ((old.status_id IS DISTINCT FROM new.status_id)) EXECUTE FUNCTION public.fc_orders_statuses_logs();


--
-- Name: orders trg_orders_statuses_logs_insert; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_statuses_logs_insert AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_statuses_logs();


--
-- Name: orders_visits_assets_materials trg_orders_visits_assets_materials_update_value_total; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_materials_update_value_total BEFORE INSERT OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_materials_update_value_total();


--
-- Name: orders_visits_assets_materials trg_orders_visits_assets_update_materials_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_materials_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_materials_value();


--
-- Name: orders_visits trg_orders_visits_assets_update_services_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_services_value AFTER UPDATE OF ov_services_value, ov_assets_amount ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_services_value();


--
-- Name: orders_visits trg_orders_visits_assets_update_vehicles_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_vehicles_value AFTER UPDATE OF ov_vehicles_value, ov_assets_amount ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_vehicles_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_services_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_services_update_services_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_services_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_value_unit; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_services_update_value_unit BEFORE INSERT ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_value_unit();


--
-- Name: orders_visits_teams trg_orders_visits_teams_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_teams_update AFTER INSERT OR DELETE ON public.orders_visits_teams FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_teams_update();


--
-- Name: orders_visits trg_orders_visits_update_total_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_update_total_value AFTER UPDATE OF ov_materials_value, ov_services_value, ov_vehicles_value ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_update_total_value();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_before_save; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_vehicles_before_save BEFORE INSERT OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_before_save();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_update_vehicles_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_vehicles_update_vehicles_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value();


--
-- Name: orders_visits trg_set_ov_started_date_parts; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_set_ov_started_date_parts BEFORE INSERT OR UPDATE OF ov_started_at ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_set_ov_started_date_parts();


--
-- Name: orders_visits trg_sync_ov_costs_status; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_sync_ov_costs_status AFTER UPDATE OF ov_costs_status ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_sync_ov_costs_status();


--
-- Name: orders_visits_assets trg_total_value_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_total_value_update BEFORE INSERT OR UPDATE ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_total_value_update();


--
-- Name: cfg_assets_tags trg_units_assets_tags_update_asset_tag_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_asset_tag_description AFTER UPDATE OF description ON public.cfg_assets_tags FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_asset_tag_description();


--
-- Name: cfg_assets_tags_subs trg_units_assets_tags_update_asset_tag_sub_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_asset_tag_sub_description AFTER UPDATE OF description ON public.cfg_assets_tags_subs FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description();


--
-- Name: orders trg_units_assets_tags_update_op_counter; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_op_counter AFTER INSERT OR UPDATE OF unit_asset_tag_has_order ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_op_counter();


--
-- Name: cfg_app_notices trigger_update_cfg_app_notices_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trigger_update_cfg_app_notices_updated_at BEFORE UPDATE ON public.cfg_app_notices FOR EACH ROW EXECUTE FUNCTION public.update_system_notices_updated_at();


--
-- Name: cfg_app_tips trigger_update_cfg_app_tips_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trigger_update_cfg_app_tips_updated_at BEFORE UPDATE ON public.cfg_app_tips FOR EACH ROW EXECUTE FUNCTION public.update_cfg_app_tips_updated_at();


--
-- Name: users users_change_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER users_change_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.change_updated_at();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- Name: assets_alerts assets_alerts_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: assets_alerts assets_alerts_o_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_o_type_id_fkey FOREIGN KEY (o_type_id) REFERENCES public.cfg_orders_types(id) ON DELETE SET NULL;


--
-- Name: assets_alerts assets_alerts_ova_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_ova_id_fkey FOREIGN KEY (ova_id) REFERENCES public.orders_visits_assets(id);


--
-- Name: assets_alerts assets_alerts_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.cfg_orders_priorities(id) ON DELETE SET NULL;


--
-- Name: assets_available assets_available_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id);


--
-- Name: assets_available assets_available_asset_tag_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_asset_tag_sub_id_fkey FOREIGN KEY (asset_tag_sub_id) REFERENCES public.cfg_assets_tags_subs(id);


--
-- Name: assets_available assets_available_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: assets assets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON UPDATE CASCADE;


--
-- Name: assets assets_company_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_owner_id_fkey FOREIGN KEY (company_owner_id) REFERENCES public.cfg_companies(id);


--
-- Name: assets_loans assets_loans_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets_loans_checklists assets_loans_checklists_filled_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_filled_by_user_id_fkey FOREIGN KEY (filled_by_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.assets_loans_checklists(id) ON DELETE CASCADE;


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans_checklists assets_loans_checklists_loan_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_loan_checklist_id_fkey FOREIGN KEY (loan_checklist_id) REFERENCES public.cfg_loans_checklists(id) ON DELETE SET NULL;


--
-- Name: assets_loans_checklists assets_loans_checklists_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.assets_loans(id) ON DELETE CASCADE;


--
-- Name: assets_loans assets_loans_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_inspector_delivery_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_inspector_delivery_user_id_fkey FOREIGN KEY (inspector_delivery_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_inspector_return_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_inspector_return_user_id_fkey FOREIGN KEY (inspector_return_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_lender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_lender_user_id_fkey FOREIGN KEY (lender_user_id) REFERENCES public.users(id);


--
-- Name: assets assets_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: assets assets_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.cfg_assets_types(id);


--
-- Name: assets assets_unit_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_unit_asset_tag_id_fkey FOREIGN KEY (unit_asset_tag_id) REFERENCES public.cfg_units_assets_tags(id);


--
-- Name: assets assets_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: cfg_app_notices cfg_app_notices_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT cfg_app_notices_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips cfg_app_tips_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_attributes cfg_assets_attributes_select_options_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT cfg_assets_attributes_select_options_group_id_fkey FOREIGN KEY (select_options_group_id) REFERENCES public.cfg_assets_attributes_groups(id) ON DELETE SET NULL;


--
-- Name: cfg_assets_types_attributes cfg_assets_types_attributes_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT cfg_assets_types_attributes_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.cfg_assets_types(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_attributes cfg_assets_types_attributes_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT cfg_assets_types_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.cfg_assets_attributes(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.cfg_assets_types(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.cfg_loans_checklists(id) ON DELETE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_asset_tag_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_asset_tag_sub_id_fkey FOREIGN KEY (asset_tag_sub_id) REFERENCES public.cfg_assets_tags_subs(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_created_user_id_fkey FOREIGN KEY (last_created_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_processing_id_fkey FOREIGN KEY (last_processing_id) REFERENCES public.cfg_assets_available_processing(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_reported_user_id_fkey FOREIGN KEY (last_reported_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_reported_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_reported_user_id_fkey1 FOREIGN KEY (last_reported_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON UPDATE CASCADE;


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.cfg_evaluation_requirements(id) ON DELETE CASCADE;


--
-- Name: contracts_managers contracts_managers_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES public.tenants(external_id) ON DELETE CASCADE;


--
-- Name: assets_alerts fk_assets_alerts_order; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT fk_assets_alerts_order FOREIGN KEY (o_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: materials_purchases fk_materials_purchases_cancel_reason; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT fk_materials_purchases_cancel_reason FOREIGN KEY (cancel_reason_id) REFERENCES public.cfg_materials_purchases_cancel_reasons(id) ON DELETE SET NULL;


--
-- Name: leader_monthly_scores leader_monthly_scores_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;


--
-- Name: leader_monthly_scores leader_monthly_scores_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_score_badges leader_score_badges_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_score_badges
    ADD CONSTRAINT leader_score_badges_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_scores_history leader_scores_history_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_scores_history leader_scores_history_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_ac_maintenance_plan_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_ac_maintenance_plan_section_id_fkey FOREIGN KEY (maintenance_plan_section_id) REFERENCES public.maintenances_plans_sections(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.cfg_activities(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections maintenances_plans_sections_maintenance_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections
    ADD CONSTRAINT maintenances_plans_sections_maintenance_plan_id_fkey FOREIGN KEY (maintenance_plan_id) REFERENCES public.maintenances_plans(id) ON DELETE CASCADE;


--
-- Name: orders orders_cancel_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cancel_reason_id_fkey FOREIGN KEY (cancel_reason_id) REFERENCES public.cfg_orders_cancel_reasons(id) ON UPDATE CASCADE;


--
-- Name: orders orders_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.cfg_orders_objects(id);


--
-- Name: orders orders_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.cfg_orders_types(id) ON UPDATE CASCADE;


--
-- Name: orders orders_type_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_type_sub_id_fkey FOREIGN KEY (type_sub_id) REFERENCES public.cfg_orders_types_subs(id) ON UPDATE CASCADE;


--
-- Name: orders_visits_assets_activities orders_visits_assets_activities_maintenance_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_activities
    ADD CONSTRAINT orders_visits_assets_activities_maintenance_plan_id_fkey FOREIGN KEY (maintenance_plan_id) REFERENCES public.maintenances_plans(id);


--
-- Name: orders_visits_assets orders_visits_assets_after_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_after_unit_id_fkey FOREIGN KEY (after_unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_assets orders_visits_assets_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: orders_visits_assets orders_visits_assets_before_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_before_unit_id_fkey FOREIGN KEY (before_unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_assets orders_visits_assets_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id);


--
-- Name: orders_visits_assets orders_visits_assets_ov_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_ov_id_fkey1 FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id);


--
-- Name: orders_visits orders_visits_chat_closed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_chat_closed_user_id_fkey FOREIGN KEY (chat_closed_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_chat_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_chat_created_user_id_fkey FOREIGN KEY (chat_created_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat orders_visits_chat_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.orders_visits_chat(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat orders_visits_chat_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_evaluations orders_visits_evaluations_contract_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_contract_evaluation_id_fkey FOREIGN KEY (contract_evaluation_id) REFERENCES public.contracts_evaluation_requirements(id) ON DELETE CASCADE;


--
-- Name: orders_visits_evaluations orders_visits_evaluations_evaluated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_evaluated_by_user_id_fkey FOREIGN KEY (evaluated_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: orders_visits_evaluations orders_visits_evaluations_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_extras orders_visits_extras_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id);


--
-- Name: orders_visits_extras_followers orders_visits_extras_followers_ove_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_followers
    ADD CONSTRAINT orders_visits_extras_followers_ove_id_fkey FOREIGN KEY (ove_id) REFERENCES public.orders_visits_extras(id);


--
-- Name: orders_visits_extras_followers orders_visits_extras_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_followers
    ADD CONSTRAINT orders_visits_extras_followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_cause_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_cause_reason_id_fkey FOREIGN KEY (o_cause_reason_id) REFERENCES public.cfg_orders_causes_reasons(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_type_id_fkey FOREIGN KEY (o_type_id) REFERENCES public.cfg_orders_types(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_type_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_type_sub_id_fkey FOREIGN KEY (o_type_sub_id) REFERENCES public.cfg_orders_types_subs(id);


--
-- Name: orders_visits_extras orders_visits_extras_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.cfg_orders_priorities(id);


--
-- Name: orders_visits_extras orders_visits_extras_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_processing_id_fkey FOREIGN KEY (processing_id) REFERENCES public.cfg_orders_visits_extras_processing(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_id_fkey1 FOREIGN KEY (system_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_parent_id_fkey FOREIGN KEY (system_parent_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_parent_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_parent_id_fkey1 FOREIGN KEY (system_parent_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.cfg_teams(id);


--
-- Name: orders_visits_extras orders_visits_extras_team_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_team_leader_id_fkey FOREIGN KEY (team_leader_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_ove_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_ove_id_fkey FOREIGN KEY (ove_id) REFERENCES public.orders_visits_extras(id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.cfg_units_types(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_type_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_type_parent_id_fkey FOREIGN KEY (unit_type_parent_id) REFERENCES public.cfg_units_types(id);


--
-- Name: orders_visits orders_visits_ov_costs_approved_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_approved_user_id_fkey FOREIGN KEY (ov_costs_approved_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_ov_costs_rejected_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_rejected_user_id_fkey FOREIGN KEY (ov_costs_rejected_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_ov_costs_submitted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_submitted_user_id_fkey FOREIGN KEY (ov_costs_waiting_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_vehicles orders_visits_vehicles_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_vehicles
    ADD CONSTRAINT orders_visits_vehicles_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_access profiles_access_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_access profiles_access_route_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_route_fkey FOREIGN KEY (route_id) REFERENCES public.cfg_routes(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles public_usersprofiles_departmentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT public_usersprofiles_departmentid_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cfg_routes routes_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_routes(id) ON DELETE SET NULL;


--
-- Name: cfg_app_notices system_notices_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT system_notices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.cfg_app_notices_categories(id) ON DELETE RESTRICT;


--
-- Name: cfg_app_notices system_notices_severity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT system_notices_severity_id_fkey FOREIGN KEY (severity_id) REFERENCES public.cfg_app_notices_severities(id) ON DELETE RESTRICT;


--
-- Name: technicals_manuals_files technicals_manuals_files_tm_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_tm_category_id_fkey FOREIGN KEY (tm_category_id) REFERENCES public.cfg_technicals_manuals_categories(id) ON DELETE SET NULL;


--
-- Name: technicals_manuals_files technicals_manuals_files_tm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_tm_id_fkey FOREIGN KEY (tm_id) REFERENCES public.technicals_manuals(id) ON DELETE CASCADE;


--
-- Name: tools tools_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tools tools_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tools tools_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;


--
-- Name: tools tools_updated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_updated_user_id_fkey FOREIGN KEY (updated_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: units units_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.cfg_units_types(id) ON DELETE CASCADE;


--
-- Name: users_notifications users_notifications_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_notifications users_notifications_user_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_to_fkey FOREIGN KEY (user_id_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE SET NULL;


--
-- Name: users users_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_users_statuses(id) ON DELETE CASCADE;


--
-- Name: users users_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.cfg_teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_tools users_tools_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: users_tools users_tools_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: users_tools users_tools_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: warehouses_materials warehouses_materials_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: warehouses_materials warehouses_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: warehouses_materials warehouses_materials_updated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_updated_user_id_fkey FOREIGN KEY (updated_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: warehouses_materials warehouses_materials_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: iceberg_namespaces iceberg_namespaces_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_dismissals Admins can delete dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete dismissals" ON public.cfg_app_tips_dismissals FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can delete tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip companies" ON public.cfg_app_tips_companies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can delete tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip departments" ON public.cfg_app_tips_departments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can delete tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip profiles" ON public.cfg_app_tips_profiles FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can delete tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tips" ON public.cfg_app_tips FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can insert tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip companies" ON public.cfg_app_tips_companies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can insert tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip departments" ON public.cfg_app_tips_departments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can insert tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip profiles" ON public.cfg_app_tips_profiles FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can insert tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tips" ON public.cfg_app_tips FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_dismissals Admins can update dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update dismissals" ON public.cfg_app_tips_dismissals FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can update tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip companies" ON public.cfg_app_tips_companies FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can update tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip departments" ON public.cfg_app_tips_departments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can update tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip profiles" ON public.cfg_app_tips_profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can update tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tips" ON public.cfg_app_tips FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_evaluation_requirements Allow all authenticated delete cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR DELETE TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated delete contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR DELETE TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated delete orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete orders_visits_evaluations" ON public.orders_visits_evaluations FOR DELETE TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated insert cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated insert contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: orders_visits_evaluations Allow all authenticated insert orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert orders_visits_evaluations" ON public.orders_visits_evaluations FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cfg_materials_purchases_cancel_reasons Allow all authenticated read; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read" ON public.cfg_materials_purchases_cancel_reasons FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated read cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR SELECT TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated read contracts_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read contracts_evaluation_requirements" ON public.contracts_evaluation_requirements FOR SELECT TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated read orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read orders_visits_evaluations" ON public.orders_visits_evaluations FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated update cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR UPDATE TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated update contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR UPDATE TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated update orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update orders_visits_evaluations" ON public.orders_visits_evaluations FOR UPDATE TO authenticated USING (true);


--
-- Name: cfg_app_tips_companies Anyone can view tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip companies" ON public.cfg_app_tips_companies FOR SELECT USING (true);


--
-- Name: cfg_app_tips_departments Anyone can view tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip departments" ON public.cfg_app_tips_departments FOR SELECT USING (true);


--
-- Name: cfg_app_tips_profiles Anyone can view tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip profiles" ON public.cfg_app_tips_profiles FOR SELECT USING (true);


--
-- Name: goose_db_version Authenticated can read goose_db_version; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can read goose_db_version" ON public.goose_db_version FOR SELECT TO authenticated USING (true);


--
-- Name: leader_monthly_scores Authenticated can read leader_monthly_scores; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_monthly_scores" ON public.leader_monthly_scores FOR SELECT TO authenticated USING (true);


--
-- Name: leader_score_badges Authenticated can read leader_score_badges; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_score_badges" ON public.leader_score_badges FOR SELECT TO authenticated USING (true);


--
-- Name: leader_scores_history Authenticated can read leader_scores_history; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_scores_history" ON public.leader_scores_history FOR SELECT TO authenticated USING (true);


--
-- Name: schema_migrations Authenticated can read schema_migrations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read schema_migrations" ON public.schema_migrations FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_app_notices_categories Categories: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Categories: view" ON public.cfg_app_notices_categories FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_app_tips_dismissals Insert dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Insert dismissals" ON public.cfg_app_tips_dismissals FOR INSERT WITH CHECK (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.uuid = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_app_notices Notices: delete; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: delete" ON public.cfg_app_notices FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: insert; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: insert" ON public.cfg_app_notices FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: update; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: update" ON public.cfg_app_notices FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: view" ON public.cfg_app_notices FOR SELECT TO authenticated USING ((((is_active = true) AND (start_date <= (now() AT TIME ZONE 'America/Sao_Paulo'::text)) AND (end_date >= (now() AT TIME ZONE 'America/Sao_Paulo'::text))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_assets_attributes_groups Permissive; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Permissive" ON public.cfg_assets_attributes_groups USING (true);


--
-- Name: cfg_app_notices_severities Severities: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Severities: view" ON public.cfg_app_notices_severities FOR SELECT TO authenticated USING (true);


--
-- Name: ai_chat_histories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_chat_histories USING (true) WITH CHECK (true);


--
-- Name: ai_chat_sessions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_chat_sessions USING (true) WITH CHECK (true);


--
-- Name: ai_knowledge Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_knowledge USING (true) WITH CHECK (true);


--
-- Name: ai_messages Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_messages USING (true) WITH CHECK (true);


--
-- Name: api_keys Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.api_keys USING (true) WITH CHECK (true);


--
-- Name: assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets USING (true) WITH CHECK (true);


--
-- Name: assets_alerts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_alerts USING (true) WITH CHECK (true);


--
-- Name: assets_attributes_values Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_attributes_values USING (true) WITH CHECK (true);


--
-- Name: assets_available Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_available USING (true) WITH CHECK (true);


--
-- Name: assets_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_followers USING (true) WITH CHECK (true);


--
-- Name: assets_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_materials USING (true) WITH CHECK (true);


--
-- Name: audits_logs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.audits_logs USING (true) WITH CHECK (true);


--
-- Name: carts_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.carts_materials USING (true) WITH CHECK (true);


--
-- Name: cfg_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_activities USING (true) WITH CHECK (true);


--
-- Name: cfg_app Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app USING (true) WITH CHECK (true);


--
-- Name: cfg_app_offline_updates Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_offline_updates USING (true) WITH CHECK (true);


--
-- Name: cfg_app_pages Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_pages USING (true) WITH CHECK (true);


--
-- Name: cfg_app_versions_update Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_versions_update USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_attributes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_attributes USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_available_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_available_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_couplings_models Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_couplings_models USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_priorities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_priorities USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_tags Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_tags USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_tags_subs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_tags_subs USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_types USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_types_attributes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_types_attributes USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_unavailable_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_unavailable_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_companies Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_companies USING (true) WITH CHECK (true);


--
-- Name: cfg_contracts_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_contracts_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_departments Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_departments USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_purchases_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_purchases_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_purchases_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_purchases_types USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_types USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_cancel_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_cancel_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_causes_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_causes_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_counter Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_counter USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_objects Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_objects USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_plans Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_plans USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_priorities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_priorities USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_suspended_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_suspended_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types_activities USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types_subs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types_subs USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_extras_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_extras_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles_access Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles_access USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles_permissions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles_permissions USING (true) WITH CHECK (true);


--
-- Name: cfg_routes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_routes USING (true) WITH CHECK (true);


--
-- Name: cfg_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_services USING (true) WITH CHECK (true);


--
-- Name: cfg_systems Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_systems USING (true) WITH CHECK (true);


--
-- Name: cfg_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_teams USING (true) WITH CHECK (true);


--
-- Name: cfg_technicals_manuals_categories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_technicals_manuals_categories USING (true) WITH CHECK (true);


--
-- Name: cfg_units_assets_tags Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_assets_tags USING (true) WITH CHECK (true);


--
-- Name: cfg_units_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_units_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_types USING (true) WITH CHECK (true);


--
-- Name: cfg_users_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_users_statuses USING (true) WITH CHECK (true);


--
-- Name: chat_agent_ai Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.chat_agent_ai USING (true) WITH CHECK (true);


--
-- Name: clients Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.clients USING (true) WITH CHECK (true);


--
-- Name: contracts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts USING (true) WITH CHECK (true);


--
-- Name: contracts_managers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts_managers USING (true) WITH CHECK (true);


--
-- Name: contracts_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts_services USING (true) WITH CHECK (true);


--
-- Name: documents Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.documents USING (true) WITH CHECK (true);


--
-- Name: extensions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.extensions USING (true) WITH CHECK (true);


--
-- Name: impersonation_password_backup Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.impersonation_password_backup USING (true) WITH CHECK (true);


--
-- Name: import_orders_visits_contracts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.import_orders_visits_contracts USING (true) WITH CHECK (true);


--
-- Name: logs_api Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.logs_api USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans_sections Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans_sections USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans_sections_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans_sections_activities USING (true) WITH CHECK (true);


--
-- Name: materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.materials USING (true) WITH CHECK (true);


--
-- Name: materials_purchases Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.materials_purchases USING (true) WITH CHECK (true);


--
-- Name: n8n_chat_histories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.n8n_chat_histories USING (true) WITH CHECK (true);


--
-- Name: orders Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders USING (true) WITH CHECK (true);


--
-- Name: orders_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_followers USING (true) WITH CHECK (true);


--
-- Name: orders_statuses_logs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_statuses_logs USING (true) WITH CHECK (true);


--
-- Name: orders_visits Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets_activities USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets_materials USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat_participants Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat_participants USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat_reads Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat_reads USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras_followers USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras_teams USING (true) WITH CHECK (true);


--
-- Name: orders_visits_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_services USING (true) WITH CHECK (true);


--
-- Name: orders_visits_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_teams USING (true) WITH CHECK (true);


--
-- Name: orders_visits_vehicles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_vehicles USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals_assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals_assets USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals_files Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals_files USING (true) WITH CHECK (true);


--
-- Name: tenants Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.tenants USING (true) WITH CHECK (true);


--
-- Name: tools Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.tools USING (true) WITH CHECK (true);


--
-- Name: units Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.units USING (true) WITH CHECK (true);


--
-- Name: users Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users USING (true) WITH CHECK (true);


--
-- Name: users_notifications Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_notifications USING (true) WITH CHECK (true);


--
-- Name: users_tools Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tools USING (true) WITH CHECK (true);


--
-- Name: users_tools_movements Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tools_movements USING (true) WITH CHECK (true);


--
-- Name: users_tracker Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tracker USING (true) WITH CHECK (true);


--
-- Name: vehicles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.vehicles USING (true) WITH CHECK (true);


--
-- Name: warehouses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.warehouses USING (true) WITH CHECK (true);


--
-- Name: warehouses_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.warehouses_materials USING (true) WITH CHECK (true);


--
-- Name: assets_loans Users can delete asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete asset loans" ON public.assets_loans FOR DELETE USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can delete asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR DELETE USING (true);


--
-- Name: assets_loans_checklists_images Users can delete checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete checklist images" ON public.assets_loans_checklists_images FOR DELETE USING (true);


--
-- Name: cfg_loans_checklists Users can delete loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete loans checklists" ON public.cfg_loans_checklists FOR DELETE USING (true);


--
-- Name: assets_loans Users can insert asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert asset loans" ON public.assets_loans FOR INSERT WITH CHECK (true);


--
-- Name: cfg_assets_types_loans_checklists Users can insert asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR INSERT WITH CHECK (true);


--
-- Name: assets_loans_checklists_images Users can insert checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert checklist images" ON public.assets_loans_checklists_images FOR INSERT WITH CHECK (true);


--
-- Name: cfg_loans_checklists Users can insert loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert loans checklists" ON public.cfg_loans_checklists FOR INSERT WITH CHECK (true);


--
-- Name: assets_loans Users can update asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update asset loans" ON public.assets_loans FOR UPDATE USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can update asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR UPDATE USING (true);


--
-- Name: cfg_loans_checklists Users can update loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update loans checklists" ON public.cfg_loans_checklists FOR UPDATE USING (true);


--
-- Name: assets_loans Users can view asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view asset loans" ON public.assets_loans FOR SELECT USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can view asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR SELECT USING (true);


--
-- Name: assets_loans_checklists_images Users can view checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view checklist images" ON public.assets_loans_checklists_images FOR SELECT USING (true);


--
-- Name: cfg_loans_checklists Users can view loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view loans checklists" ON public.cfg_loans_checklists FOR SELECT USING (true);


--
-- Name: cfg_app_tips View active tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "View active tips" ON public.cfg_app_tips FOR SELECT USING (((is_active = true) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_app_tips_dismissals View dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "View dismissals" ON public.cfg_app_tips_dismissals FOR SELECT USING (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.uuid = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: ai_chat_histories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_chat_histories ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_chat_sessions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_knowledge; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_alerts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_attributes_values; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_attributes_values ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_available; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_available ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_loans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_loans_checklists_images; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans_checklists_images ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: audits_logs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.audits_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: carts_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.carts_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices_categories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices_severities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_severities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_offline_updates; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_offline_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_pages; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_companies; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_departments; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_departments ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_dismissals; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_dismissals ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_versions_update; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_versions_update ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_attributes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_attributes_groups; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_available_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_available_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_couplings_models; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_couplings_models ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_priorities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags_subs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types_attributes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types_loans_checklists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_loans_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_unavailable_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_unavailable_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_companies; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_contracts_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_contracts_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_departments; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_departments ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_evaluation_requirements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_evaluation_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_loans_checklists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_loans_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_cancel_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_cancel_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_cancel_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_cancel_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_causes_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_causes_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_counter; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_counter ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_objects; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_objects ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_plans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_priorities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_suspended_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_suspended_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_subs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_extras_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_extras_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_access; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_access ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_permissions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_routes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_routes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_services ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_systems; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_systems ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_technicals_manuals_categories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_technicals_manuals_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_assets_tags; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_users_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_users_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_agent_ai; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.chat_agent_ai ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_evaluation_requirements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_evaluation_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_managers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_services ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: extensions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

--
-- Name: goose_db_version; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.goose_db_version ENABLE ROW LEVEL SECURITY;

--
-- Name: impersonation_password_backup; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.impersonation_password_backup ENABLE ROW LEVEL SECURITY;

--
-- Name: import_orders_visits_contracts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.import_orders_visits_contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_monthly_scores; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_monthly_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_score_badges; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_score_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_scores_history; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_scores_history ENABLE ROW LEVEL SECURITY;

--
-- Name: logs_api; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.logs_api ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans_sections; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans_sections_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

--
-- Name: materials_purchases; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials_purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: n8n_chat_histories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_statuses_logs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_statuses_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat_participants; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat_reads; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_evaluations; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_services ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_vehicles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals_assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals_files; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_files ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: tools; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users_notifications; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tools; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tools_movements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tracker; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tracker ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Grant All Authenticated 1t5kqn_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_0" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_1" ON storage.objects FOR SELECT TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_2; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_2" ON storage.objects FOR UPDATE TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_3; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_3" ON storage.objects FOR DELETE TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Universal Storage Access; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Universal Storage Access" ON storage.objects USING (((bucket_id = 'siges'::text) OR (bucket_id = 'contracts'::text))) WITH CHECK (((bucket_id = 'siges'::text) OR (bucket_id = 'contracts'::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO "databasus-e163795d";
GRANT USAGE ON SCHEMA public TO "databasus-93da8106";
GRANT USAGE ON SCHEMA public TO "databasus-3a3c9dfb";


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION change_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.change_updated_at() TO anon;
GRANT ALL ON FUNCTION public.change_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.change_updated_at() TO service_role;


--
-- Name: TABLE cfg_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_activities TO postgres;
GRANT ALL ON TABLE public.cfg_activities TO anon;
GRANT ALL ON TABLE public.cfg_activities TO authenticated;
GRANT ALL ON TABLE public.cfg_activities TO service_role;
GRANT SELECT ON TABLE public.cfg_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_activities TO postgres;
GRANT ALL ON TABLE public.v_activities TO anon;
GRANT ALL ON TABLE public.v_activities TO authenticated;
GRANT ALL ON TABLE public.v_activities TO service_role;
GRANT SELECT ON TABLE public.v_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_activities TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_activities_search(srch_terms text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO postgres;
GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO anon;
GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO service_role;


--
-- Name: FUNCTION fc_api_key_validate(p_api_key text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO postgres;
GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO anon;
GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO service_role;


--
-- Name: TABLE assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets TO postgres;
GRANT ALL ON TABLE public.assets TO anon;
GRANT ALL ON TABLE public.assets TO authenticated;
GRANT ALL ON TABLE public.assets TO service_role;
GRANT SELECT ON TABLE public.assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_couplings_models; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_couplings_models TO postgres;
GRANT ALL ON TABLE public.cfg_assets_couplings_models TO anon;
GRANT ALL ON TABLE public.cfg_assets_couplings_models TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_couplings_models TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_priorities TO postgres;
GRANT ALL ON TABLE public.cfg_assets_priorities TO anon;
GRANT ALL ON TABLE public.cfg_assets_priorities TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_priorities TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_assets_statuses TO anon;
GRANT ALL ON TABLE public.cfg_assets_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_tags TO postgres;
GRANT ALL ON TABLE public.cfg_assets_tags TO anon;
GRANT ALL ON TABLE public.cfg_assets_tags TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_tags TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_tags_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_tags_subs TO postgres;
GRANT ALL ON TABLE public.cfg_assets_tags_subs TO anon;
GRANT ALL ON TABLE public.cfg_assets_tags_subs TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_tags_subs TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types TO postgres;
GRANT ALL ON TABLE public.cfg_assets_types TO anon;
GRANT ALL ON TABLE public.cfg_assets_types TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_types TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_companies TO postgres;
GRANT ALL ON TABLE public.cfg_companies TO anon;
GRANT ALL ON TABLE public.cfg_companies TO authenticated;
GRANT ALL ON TABLE public.cfg_companies TO service_role;
GRANT SELECT ON TABLE public.cfg_companies TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_companies TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_companies TO "databasus-3a3c9dfb";


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.clients TO postgres;
GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;
GRANT SELECT ON TABLE public.clients TO "databasus-e163795d";
GRANT SELECT ON TABLE public.clients TO "databasus-93da8106";
GRANT SELECT ON TABLE public.clients TO "databasus-3a3c9dfb";


--
-- Name: TABLE materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.materials TO postgres;
GRANT ALL ON TABLE public.materials TO anon;
GRANT ALL ON TABLE public.materials TO authenticated;
GRANT ALL ON TABLE public.materials TO service_role;
GRANT SELECT ON TABLE public.materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE units; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.units TO postgres;
GRANT ALL ON TABLE public.units TO anon;
GRANT ALL ON TABLE public.units TO authenticated;
GRANT ALL ON TABLE public.units TO service_role;
GRANT SELECT ON TABLE public.units TO "databasus-e163795d";
GRANT SELECT ON TABLE public.units TO "databasus-93da8106";
GRANT SELECT ON TABLE public.units TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets TO postgres;
GRANT ALL ON TABLE public.v_assets TO anon;
GRANT ALL ON TABLE public.v_assets TO authenticated;
GRANT ALL ON TABLE public.v_assets TO service_role;
GRANT SELECT ON TABLE public.v_assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO anon;
GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO service_role;


--
-- Name: FUNCTION fc_assets_search_type(search_terms text, asset_type_id integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO anon;
GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO service_role;


--
-- Name: FUNCTION fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_assets_searchable(search_terms text, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_assets_searchable_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO postgres;
GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO anon;
GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO authenticated;
GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO service_role;


--
-- Name: FUNCTION fc_cfg_units_assets_tags_set_last_values_when_processing_2(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO postgres;
GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO anon;
GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO authenticated;
GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO service_role;


--
-- Name: FUNCTION fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO postgres;
GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO anon;
GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO authenticated;
GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO service_role;


--
-- Name: TABLE cfg_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_services TO postgres;
GRANT ALL ON TABLE public.cfg_services TO anon;
GRANT ALL ON TABLE public.cfg_services TO authenticated;
GRANT ALL ON TABLE public.cfg_services TO service_role;
GRANT SELECT ON TABLE public.cfg_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_services TO postgres;
GRANT ALL ON TABLE public.contracts_services TO anon;
GRANT ALL ON TABLE public.contracts_services TO authenticated;
GRANT ALL ON TABLE public.contracts_services TO service_role;
GRANT SELECT ON TABLE public.contracts_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.contracts_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.contracts_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_services TO postgres;
GRANT ALL ON TABLE public.v_contracts_services TO anon;
GRANT ALL ON TABLE public.v_contracts_services TO authenticated;
GRANT ALL ON TABLE public.v_contracts_services TO service_role;
GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_contracts_services_search(search_terms text, contract_id_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO anon;
GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO service_role;


--
-- Name: TABLE cfg_orders_causes_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO postgres;
GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO anon;
GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_priorities TO postgres;
GRANT ALL ON TABLE public.cfg_orders_priorities TO anon;
GRANT ALL ON TABLE public.cfg_orders_priorities TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_priorities TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types TO postgres;
GRANT ALL ON TABLE public.cfg_orders_types TO anon;
GRANT ALL ON TABLE public.cfg_orders_types TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_types TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_types_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types_subs TO postgres;
GRANT ALL ON TABLE public.cfg_orders_types_subs TO anon;
GRANT ALL ON TABLE public.cfg_orders_types_subs TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_types_subs TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_extras_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO postgres;
GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO anon;
GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_systems; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_systems TO postgres;
GRANT ALL ON TABLE public.cfg_systems TO anon;
GRANT ALL ON TABLE public.cfg_systems TO authenticated;
GRANT ALL ON TABLE public.cfg_systems TO service_role;
GRANT SELECT ON TABLE public.cfg_systems TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_systems TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_systems TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_teams TO postgres;
GRANT ALL ON TABLE public.cfg_teams TO anon;
GRANT ALL ON TABLE public.cfg_teams TO authenticated;
GRANT ALL ON TABLE public.cfg_teams TO service_role;
GRANT SELECT ON TABLE public.cfg_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_units_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_types TO postgres;
GRANT ALL ON TABLE public.cfg_units_types TO anon;
GRANT ALL ON TABLE public.cfg_units_types TO authenticated;
GRANT ALL ON TABLE public.cfg_units_types TO service_role;
GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras TO postgres;
GRANT ALL ON TABLE public.orders_visits_extras TO anon;
GRANT ALL ON TABLE public.orders_visits_extras TO authenticated;
GRANT ALL ON TABLE public.orders_visits_extras TO service_role;
GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-3a3c9dfb";


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT ON TABLE public.users TO "databasus-e163795d";
GRANT SELECT ON TABLE public.users TO "databasus-93da8106";
GRANT SELECT ON TABLE public.users TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_extras TO anon;
GRANT ALL ON TABLE public.v_orders_visits_extras TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_extras TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO service_role;


--
-- Name: TABLE v_orders_visits_extras_no_archived; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO anon;
GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO service_role;


--
-- Name: TABLE cfg_orders_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO postgres;
GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO anon;
GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_objects; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_objects TO postgres;
GRANT ALL ON TABLE public.cfg_orders_objects TO anon;
GRANT ALL ON TABLE public.cfg_orders_objects TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_objects TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_plans TO postgres;
GRANT ALL ON TABLE public.cfg_orders_plans TO anon;
GRANT ALL ON TABLE public.cfg_orders_plans TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_plans TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_orders_statuses TO anon;
GRANT ALL ON TABLE public.cfg_orders_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_suspended_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO postgres;
GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO anon;
GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts TO postgres;
GRANT ALL ON TABLE public.contracts TO anon;
GRANT ALL ON TABLE public.contracts TO authenticated;
GRANT ALL ON TABLE public.contracts TO service_role;
GRANT SELECT ON TABLE public.contracts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.contracts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders TO postgres;
GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT SELECT ON TABLE public.orders TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders TO postgres;
GRANT ALL ON TABLE public.v_orders TO anon;
GRANT ALL ON TABLE public.v_orders TO authenticated;
GRANT ALL ON TABLE public.v_orders TO service_role;
GRANT SELECT ON TABLE public.v_orders TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_dash_admin_orders_filters_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO postgres;
GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO anon;
GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO authenticated;
GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO service_role;
GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO service_role;


--
-- Name: TABLE v_dash_admin_orders_parent_filters_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO postgres;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO anon;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO authenticated;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO service_role;
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_dashboard_stats(p_company_id bigint, p_team_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO service_role;


--
-- Name: FUNCTION fc_durations_hours_decimals(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO postgres;
GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO anon;
GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO authenticated;
GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_materials_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_services_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_vehicles_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_get_profile_permissions(p_profile_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO service_role;


--
-- Name: FUNCTION fc_get_user_permissions(p_user_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO service_role;


--
-- Name: FUNCTION fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO postgres;
GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO anon;
GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO authenticated;
GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO service_role;


--
-- Name: FUNCTION fc_import_orders_visits_contracts_update_finger_print(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO postgres;
GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO anon;
GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO authenticated;
GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO service_role;


--
-- Name: FUNCTION fc_leader_tracker_interval(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO postgres;
GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO anon;
GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO authenticated;
GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO service_role;


--
-- Name: FUNCTION fc_materials_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_materials_searchable() TO postgres;
GRANT ALL ON FUNCTION public.fc_materials_searchable() TO anon;
GRANT ALL ON FUNCTION public.fc_materials_searchable() TO authenticated;
GRANT ALL ON FUNCTION public.fc_materials_searchable() TO service_role;


--
-- Name: FUNCTION fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO postgres;
GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO anon;
GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO service_role;


--
-- Name: FUNCTION fc_order_status_inheritance(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO postgres;
GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO anon;
GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO authenticated;
GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO service_role;


--
-- Name: FUNCTION fc_orders_op_counter_trigger(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO service_role;


--
-- Name: FUNCTION fc_orders_statuses_logs(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_statuses_logs() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_statuses_logs() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_statuses_logs() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_statuses_logs() TO service_role;


--
-- Name: FUNCTION fc_orders_replace_special_chars(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO service_role;


--
-- Name: TABLE cfg_orders_types_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types_activities TO postgres;
GRANT ALL ON TABLE public.cfg_orders_types_activities TO anon;
GRANT ALL ON TABLE public.cfg_orders_types_activities TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_types_activities TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types_activities TO postgres;
GRANT ALL ON TABLE public.v_orders_types_activities TO anon;
GRANT ALL ON TABLE public.v_orders_types_activities TO authenticated;
GRANT ALL ON TABLE public.v_orders_types_activities TO service_role;
GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_orders_types_activities_search(srch_terms text, srch_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_activities_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_materials_update_value_total(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_activities_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_materials_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_services_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_vehicles_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_extras_teams_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_amount_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_update_services_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_update_value_unit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_teams_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_update_total_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_vehicles_before_save(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_vehicles_update_vehicles_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO postgres;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO anon;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO authenticated;
GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO service_role;


--
-- Name: FUNCTION fc_regenerate_asset_description(p_asset_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO service_role;


--
-- Name: FUNCTION fc_set_ov_started_date_parts(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO postgres;
GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO anon;
GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO authenticated;
GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO service_role;


--
-- Name: FUNCTION fc_sync_ov_costs_status(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO postgres;
GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO anon;
GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO authenticated;
GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO service_role;


--
-- Name: FUNCTION fc_system_parent_id_10_at_id_33_46_uata_rate(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO postgres;
GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO anon;
GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO authenticated;
GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO service_role;


--
-- Name: FUNCTION fc_team_descendants(team_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO service_role;


--
-- Name: FUNCTION fc_tgr_units_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO postgres;
GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO anon;
GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO authenticated;
GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO service_role;


--
-- Name: TABLE technicals_manuals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals TO postgres;
GRANT ALL ON TABLE public.technicals_manuals TO anon;
GRANT ALL ON TABLE public.technicals_manuals TO authenticated;
GRANT ALL ON TABLE public.technicals_manuals TO service_role;
GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-e163795d";
GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-93da8106";
GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals TO postgres;
GRANT ALL ON TABLE public.v_technicals_manuals TO anon;
GRANT ALL ON TABLE public.v_technicals_manuals TO authenticated;
GRANT ALL ON TABLE public.v_technicals_manuals TO service_role;
GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO anon;
GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO service_role;


--
-- Name: FUNCTION fc_total_value_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_total_value_update() TO postgres;
GRANT ALL ON FUNCTION public.fc_total_value_update() TO anon;
GRANT ALL ON FUNCTION public.fc_total_value_update() TO authenticated;
GRANT ALL ON FUNCTION public.fc_total_value_update() TO service_role;


--
-- Name: FUNCTION fc_unit_05_assets_tags_available_rate(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO postgres;
GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO anon;
GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO authenticated;
GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO service_role;


--
-- Name: TABLE cfg_units_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_assets_tags TO postgres;
GRANT ALL ON TABLE public.cfg_units_assets_tags TO anon;
GRANT ALL ON TABLE public.cfg_units_assets_tags TO authenticated;
GRANT ALL ON TABLE public.cfg_units_assets_tags TO service_role;
GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_by_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_by_assets_tags TO postgres;
GRANT ALL ON TABLE public.v_units_by_assets_tags TO anon;
GRANT ALL ON TABLE public.v_units_by_assets_tags TO authenticated;
GRANT ALL ON TABLE public.v_units_by_assets_tags TO service_role;
GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO anon;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO service_role;


--
-- Name: TABLE cfg_assets_available_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_available_processing TO postgres;
GRANT ALL ON TABLE public.cfg_assets_available_processing TO anon;
GRANT ALL ON TABLE public.cfg_assets_available_processing TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_available_processing TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_unavailable_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO postgres;
GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO anon;
GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags TO postgres;
GRANT ALL ON TABLE public.v_units_assets_tags TO anon;
GRANT ALL ON TABLE public.v_units_assets_tags TO authenticated;
GRANT ALL ON TABLE public.v_units_assets_tags TO service_role;
GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_assets_tags_search_filters(system_parent_id_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO anon;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_asset_tag_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO postgres;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO anon;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_asset_tag_sub_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO postgres;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO anon;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_op_counter(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO postgres;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO anon;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO service_role;


--
-- Name: TABLE cfg_units_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_units_statuses TO anon;
GRANT ALL ON TABLE public.cfg_units_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_units_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units TO postgres;
GRANT ALL ON TABLE public.v_units TO anon;
GRANT ALL ON TABLE public.v_units TO authenticated;
GRANT ALL ON TABLE public.v_units TO service_role;
GRANT SELECT ON TABLE public.v_units TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_search(search_terms character varying, search_version character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO postgres;
GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO anon;
GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO service_role;


--
-- Name: FUNCTION fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO postgres;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO anon;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO postgres;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO anon;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO service_role;


--
-- Name: FUNCTION fc_update_after_img_file_name(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO postgres;
GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO anon;
GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO service_role;


--
-- Name: FUNCTION fc_update_after_img_files_names(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO postgres;
GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO anon;
GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO service_role;


--
-- Name: FUNCTION fc_update_before_img_file_name(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO postgres;
GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO anon;
GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO service_role;


--
-- Name: FUNCTION fc_update_before_img_files_names(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO postgres;
GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO anon;
GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO service_role;


--
-- Name: FUNCTION fc_update_op_counter(p_unit_asset_tag_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO postgres;
GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO anon;
GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO service_role;


--
-- Name: FUNCTION fc_update_profile_routes(p_profile_id bigint, p_routes jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO postgres;
GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO anon;
GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO service_role;


--
-- Name: FUNCTION flow_order_visit_close_v2(payload jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO postgres;
GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO anon;
GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO service_role;


--
-- Name: FUNCTION flow_order_visit_create_v2(payload jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO postgres;
GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO anon;
GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO service_role;


--
-- Name: FUNCTION fn_audit_visit_costs_status(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO postgres;
GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO anon;
GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO authenticated;
GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO service_role;


--
-- Name: FUNCTION generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO postgres;
GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO anon;
GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO authenticated;
GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO service_role;


--
-- Name: FUNCTION get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO postgres;
GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO anon;
GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO service_role;


--
-- Name: FUNCTION handle_followers_orders_status_changed(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO postgres;
GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO anon;
GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO authenticated;
GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_new_user() TO postgres;
GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_notifications_count(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_notifications_count() TO postgres;
GRANT ALL ON FUNCTION public.handle_notifications_count() TO anon;
GRANT ALL ON FUNCTION public.handle_notifications_count() TO authenticated;
GRANT ALL ON FUNCTION public.handle_notifications_count() TO service_role;


--
-- Name: FUNCTION handle_profile_photo_change_notification(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO postgres;
GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO anon;
GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO authenticated;
GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO service_role;


--
-- Name: FUNCTION handle_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_updated_at() TO postgres;
GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;


--
-- Name: FUNCTION match_documents(query_embedding extensions.vector, match_count integer, filter jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO postgres;
GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO anon;
GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO service_role;


--
-- Name: FUNCTION match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO postgres;
GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO anon;
GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO service_role;


--
-- Name: FUNCTION nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO postgres;
GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO anon;
GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO authenticated;
GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO service_role;


--
-- Name: FUNCTION recalculate_all_scores(p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO postgres;
GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO anon;
GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO authenticated;
GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO postgres;
GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO anon;
GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO authenticated;
GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO postgres;
GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO anon;
GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO authenticated;
GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION restore_original_password(p_user_uuid uuid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO postgres;
GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO service_role;


--
-- Name: FUNCTION update_cfg_app_notices_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO postgres;
GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO service_role;


--
-- Name: FUNCTION update_cfg_app_tips_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO postgres;
GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO service_role;


--
-- Name: FUNCTION update_system_notices_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO postgres;
GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO service_role;


--
-- Name: FUNCTION update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO postgres;
GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO anon;
GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO authenticated;
GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.schema_migrations TO postgres;
GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE ai_chat_histories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_chat_histories TO postgres;
GRANT ALL ON TABLE public.ai_chat_histories TO anon;
GRANT ALL ON TABLE public.ai_chat_histories TO authenticated;
GRANT ALL ON TABLE public.ai_chat_histories TO service_role;
GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-e163795d";
GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-93da8106";
GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE ai_chat_histories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_chat_sessions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_chat_sessions TO postgres;
GRANT ALL ON TABLE public.ai_chat_sessions TO anon;
GRANT ALL ON TABLE public.ai_chat_sessions TO authenticated;
GRANT ALL ON TABLE public.ai_chat_sessions TO service_role;
GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-e163795d";
GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-93da8106";
GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_knowledge; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_knowledge TO postgres;
GRANT ALL ON TABLE public.ai_knowledge TO anon;
GRANT ALL ON TABLE public.ai_knowledge TO authenticated;
GRANT ALL ON TABLE public.ai_knowledge TO service_role;
GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-e163795d";
GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-93da8106";
GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_messages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_messages TO postgres;
GRANT ALL ON TABLE public.ai_messages TO anon;
GRANT ALL ON TABLE public.ai_messages TO authenticated;
GRANT ALL ON TABLE public.ai_messages TO service_role;
GRANT SELECT ON TABLE public.ai_messages TO "databasus-e163795d";
GRANT SELECT ON TABLE public.ai_messages TO "databasus-93da8106";
GRANT SELECT ON TABLE public.ai_messages TO "databasus-3a3c9dfb";


--
-- Name: TABLE api_keys; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.api_keys TO postgres;
GRANT ALL ON TABLE public.api_keys TO anon;
GRANT ALL ON TABLE public.api_keys TO authenticated;
GRANT ALL ON TABLE public.api_keys TO service_role;
GRANT SELECT ON TABLE public.api_keys TO "databasus-e163795d";
GRANT SELECT ON TABLE public.api_keys TO "databasus-93da8106";
GRANT SELECT ON TABLE public.api_keys TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE api_keys_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.api_keys_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.api_keys_id_seq TO anon;
GRANT ALL ON SEQUENCE public.api_keys_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.api_keys_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_alerts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_alerts TO postgres;
GRANT ALL ON TABLE public.assets_alerts TO anon;
GRANT ALL ON TABLE public.assets_alerts TO authenticated;
GRANT ALL ON TABLE public.assets_alerts TO service_role;
GRANT SELECT ON TABLE public.assets_alerts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_alerts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_alerts TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_alerts_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_attributes_values; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_attributes_values TO postgres;
GRANT ALL ON TABLE public.assets_attributes_values TO anon;
GRANT ALL ON TABLE public.assets_attributes_values TO authenticated;
GRANT ALL ON TABLE public.assets_attributes_values TO service_role;
GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_available; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_available TO postgres;
GRANT ALL ON TABLE public.assets_available TO anon;
GRANT ALL ON TABLE public.assets_available TO authenticated;
GRANT ALL ON TABLE public.assets_available TO service_role;
GRANT SELECT ON TABLE public.assets_available TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_available TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_available TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_available_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_available_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_available_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_available_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_available_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_followers TO postgres;
GRANT ALL ON TABLE public.assets_followers TO anon;
GRANT ALL ON TABLE public.assets_followers TO authenticated;
GRANT ALL ON TABLE public.assets_followers TO service_role;
GRANT SELECT ON TABLE public.assets_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans TO postgres;
GRANT ALL ON TABLE public.assets_loans TO anon;
GRANT ALL ON TABLE public.assets_loans TO authenticated;
GRANT ALL ON TABLE public.assets_loans TO service_role;
GRANT SELECT ON TABLE public.assets_loans TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_loans TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_loans TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans_checklists TO postgres;
GRANT ALL ON TABLE public.assets_loans_checklists TO anon;
GRANT ALL ON TABLE public.assets_loans_checklists TO authenticated;
GRANT ALL ON TABLE public.assets_loans_checklists TO service_role;
GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans_checklists_images; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans_checklists_images TO postgres;
GRANT ALL ON TABLE public.assets_loans_checklists_images TO anon;
GRANT ALL ON TABLE public.assets_loans_checklists_images TO authenticated;
GRANT ALL ON TABLE public.assets_loans_checklists_images TO service_role;
GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_checklists_images_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_materials TO postgres;
GRANT ALL ON TABLE public.assets_materials TO anon;
GRANT ALL ON TABLE public.assets_materials TO authenticated;
GRANT ALL ON TABLE public.assets_materials TO service_role;
GRANT SELECT ON TABLE public.assets_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.assets_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.assets_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE audits_logs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.audits_logs TO postgres;
GRANT ALL ON TABLE public.audits_logs TO anon;
GRANT ALL ON TABLE public.audits_logs TO authenticated;
GRANT ALL ON TABLE public.audits_logs TO service_role;
GRANT SELECT ON TABLE public.audits_logs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.audits_logs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.audits_logs TO "databasus-3a3c9dfb";


--
-- Name: TABLE carts_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.carts_materials TO postgres;
GRANT ALL ON TABLE public.carts_materials TO anon;
GRANT ALL ON TABLE public.carts_materials TO authenticated;
GRANT ALL ON TABLE public.carts_materials TO service_role;
GRANT SELECT ON TABLE public.carts_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.carts_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.carts_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE carts_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app TO postgres;
GRANT ALL ON TABLE public.cfg_app TO anon;
GRANT ALL ON TABLE public.cfg_app TO authenticated;
GRANT ALL ON TABLE public.cfg_app TO service_role;
GRANT SELECT ON TABLE public.cfg_app TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices TO postgres;
GRANT ALL ON TABLE public.cfg_app_notices TO anon;
GRANT ALL ON TABLE public.cfg_app_notices TO authenticated;
GRANT ALL ON TABLE public.cfg_app_notices TO service_role;
GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices_categories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices_categories TO postgres;
GRANT ALL ON TABLE public.cfg_app_notices_categories TO anon;
GRANT ALL ON TABLE public.cfg_app_notices_categories TO authenticated;
GRANT ALL ON TABLE public.cfg_app_notices_categories TO service_role;
GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices_severities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices_severities TO postgres;
GRANT ALL ON TABLE public.cfg_app_notices_severities TO anon;
GRANT ALL ON TABLE public.cfg_app_notices_severities TO authenticated;
GRANT ALL ON TABLE public.cfg_app_notices_severities TO service_role;
GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_offline_updates; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_offline_updates TO postgres;
GRANT ALL ON TABLE public.cfg_app_offline_updates TO anon;
GRANT ALL ON TABLE public.cfg_app_offline_updates TO authenticated;
GRANT ALL ON TABLE public.cfg_app_offline_updates TO service_role;
GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_offline_updates_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_pages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_pages TO postgres;
GRANT ALL ON TABLE public.cfg_app_pages TO anon;
GRANT ALL ON TABLE public.cfg_app_pages TO authenticated;
GRANT ALL ON TABLE public.cfg_app_pages TO service_role;
GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_pages_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips TO postgres;
GRANT ALL ON TABLE public.cfg_app_tips TO anon;
GRANT ALL ON TABLE public.cfg_app_tips TO authenticated;
GRANT ALL ON TABLE public.cfg_app_tips TO service_role;
GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_companies TO postgres;
GRANT ALL ON TABLE public.cfg_app_tips_companies TO anon;
GRANT ALL ON TABLE public.cfg_app_tips_companies TO authenticated;
GRANT ALL ON TABLE public.cfg_app_tips_companies TO service_role;
GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_companies_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_departments TO postgres;
GRANT ALL ON TABLE public.cfg_app_tips_departments TO anon;
GRANT ALL ON TABLE public.cfg_app_tips_departments TO authenticated;
GRANT ALL ON TABLE public.cfg_app_tips_departments TO service_role;
GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_departments_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_dismissals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO postgres;
GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO anon;
GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO authenticated;
GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO service_role;
GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_dismissals_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_new_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_profiles TO postgres;
GRANT ALL ON TABLE public.cfg_app_tips_profiles TO anon;
GRANT ALL ON TABLE public.cfg_app_tips_profiles TO authenticated;
GRANT ALL ON TABLE public.cfg_app_tips_profiles TO service_role;
GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_profiles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_versions_update; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_versions_update TO postgres;
GRANT ALL ON TABLE public.cfg_app_versions_update TO anon;
GRANT ALL ON TABLE public.cfg_app_versions_update TO authenticated;
GRANT ALL ON TABLE public.cfg_app_versions_update TO service_role;
GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_versions_update_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_attributes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_attributes TO postgres;
GRANT ALL ON TABLE public.cfg_assets_attributes TO anon;
GRANT ALL ON TABLE public.cfg_assets_attributes TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_attributes TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_attributes_groups; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO postgres;
GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO anon;
GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_attributes_groups_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_attributes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_available_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_couplings_models_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_priorities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types_attributes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types_attributes TO postgres;
GRANT ALL ON TABLE public.cfg_assets_types_attributes TO anon;
GRANT ALL ON TABLE public.cfg_assets_types_attributes TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_types_attributes TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_types_attributes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO postgres;
GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO anon;
GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO authenticated;
GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO service_role;
GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_types_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_unavailable_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_companies_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_contracts_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_contracts_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_contracts_statuses TO anon;
GRANT ALL ON TABLE public.cfg_contracts_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_contracts_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_contracts_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_departments TO postgres;
GRANT ALL ON TABLE public.cfg_departments TO anon;
GRANT ALL ON TABLE public.cfg_departments TO authenticated;
GRANT ALL ON TABLE public.cfg_departments TO service_role;
GRANT SELECT ON TABLE public.cfg_departments TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_departments TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_departments TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_departments_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_evaluation_requirements TO postgres;
GRANT ALL ON TABLE public.cfg_evaluation_requirements TO anon;
GRANT ALL ON TABLE public.cfg_evaluation_requirements TO authenticated;
GRANT ALL ON TABLE public.cfg_evaluation_requirements TO service_role;
GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_evaluation_requirements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_loans_checklists TO postgres;
GRANT ALL ON TABLE public.cfg_loans_checklists TO anon;
GRANT ALL ON TABLE public.cfg_loans_checklists TO authenticated;
GRANT ALL ON TABLE public.cfg_loans_checklists TO service_role;
GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO anon;
GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_material_purchases_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO postgres;
GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO anon;
GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO authenticated;
GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO service_role;
GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_types TO postgres;
GRANT ALL ON TABLE public.cfg_materials_purchases_types TO anon;
GRANT ALL ON TABLE public.cfg_materials_purchases_types TO authenticated;
GRANT ALL ON TABLE public.cfg_materials_purchases_types TO service_role;
GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_purchases_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_materials_statuses TO anon;
GRANT ALL ON TABLE public.cfg_materials_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_materials_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_types TO postgres;
GRANT ALL ON TABLE public.cfg_materials_types TO anon;
GRANT ALL ON TABLE public.cfg_materials_types TO authenticated;
GRANT ALL ON TABLE public.cfg_materials_types TO service_role;
GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_cancel_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_causes_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_counter; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_counter TO postgres;
GRANT ALL ON TABLE public.cfg_orders_counter TO anon;
GRANT ALL ON TABLE public.cfg_orders_counter TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_counter TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_counter_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_objects_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_plans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_priorities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_suspended_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_subs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_extras_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_processing TO postgres;
GRANT ALL ON TABLE public.cfg_orders_visits_processing TO anon;
GRANT ALL ON TABLE public.cfg_orders_visits_processing TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_visits_processing TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO anon;
GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles TO postgres;
GRANT ALL ON TABLE public.cfg_profiles TO anon;
GRANT ALL ON TABLE public.cfg_profiles TO authenticated;
GRANT ALL ON TABLE public.cfg_profiles TO service_role;
GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles_access; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles_access TO postgres;
GRANT ALL ON TABLE public.cfg_profiles_access TO anon;
GRANT ALL ON TABLE public.cfg_profiles_access TO authenticated;
GRANT ALL ON TABLE public.cfg_profiles_access TO service_role;
GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_access_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles_permissions TO postgres;
GRANT ALL ON TABLE public.cfg_profiles_permissions TO anon;
GRANT ALL ON TABLE public.cfg_profiles_permissions TO authenticated;
GRANT ALL ON TABLE public.cfg_profiles_permissions TO service_role;
GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_permissions_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_routes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_routes TO postgres;
GRANT ALL ON TABLE public.cfg_routes TO anon;
GRANT ALL ON TABLE public.cfg_routes TO authenticated;
GRANT ALL ON TABLE public.cfg_routes TO service_role;
GRANT SELECT ON TABLE public.cfg_routes TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_routes TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_routes TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_routes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_systems_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_technicals_manuals_categories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO postgres;
GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO anon;
GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO authenticated;
GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO service_role;
GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_technicals_manuals_categories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_assets_tags_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_users_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_users_statuses TO postgres;
GRANT ALL ON TABLE public.cfg_users_statuses TO anon;
GRANT ALL ON TABLE public.cfg_users_statuses TO authenticated;
GRANT ALL ON TABLE public.cfg_users_statuses TO service_role;
GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_users_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE chat_agent_ai; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.chat_agent_ai TO postgres;
GRANT ALL ON TABLE public.chat_agent_ai TO anon;
GRANT ALL ON TABLE public.chat_agent_ai TO authenticated;
GRANT ALL ON TABLE public.chat_agent_ai TO service_role;
GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-e163795d";
GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-93da8106";
GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE chat_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.chat_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.chat_id_seq TO anon;
GRANT ALL ON SEQUENCE public.chat_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.chat_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE clients_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.clients_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.clients_id_seq TO anon;
GRANT ALL ON SEQUENCE public.clients_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.clients_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_evaluation_requirements TO postgres;
GRANT ALL ON TABLE public.contracts_evaluation_requirements TO anon;
GRANT ALL ON TABLE public.contracts_evaluation_requirements TO authenticated;
GRANT ALL ON TABLE public.contracts_evaluation_requirements TO service_role;
GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-e163795d";
GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-93da8106";
GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_evaluation_requirements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.contracts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contracts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contracts_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_managers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_managers TO postgres;
GRANT ALL ON TABLE public.contracts_managers TO anon;
GRANT ALL ON TABLE public.contracts_managers TO authenticated;
GRANT ALL ON TABLE public.contracts_managers TO service_role;
GRANT SELECT ON TABLE public.contracts_managers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.contracts_managers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.contracts_managers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_managers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.documents TO postgres;
GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;
GRANT SELECT ON TABLE public.documents TO "databasus-e163795d";
GRANT SELECT ON TABLE public.documents TO "databasus-93da8106";
GRANT SELECT ON TABLE public.documents TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.documents_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE extensions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.extensions TO postgres;
GRANT ALL ON TABLE public.extensions TO anon;
GRANT ALL ON TABLE public.extensions TO authenticated;
GRANT ALL ON TABLE public.extensions TO service_role;
GRANT SELECT ON TABLE public.extensions TO "databasus-e163795d";
GRANT SELECT ON TABLE public.extensions TO "databasus-93da8106";
GRANT SELECT ON TABLE public.extensions TO "databasus-3a3c9dfb";


--
-- Name: TABLE goose_db_version; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.goose_db_version TO anon;
GRANT ALL ON TABLE public.goose_db_version TO authenticated;
GRANT ALL ON TABLE public.goose_db_version TO service_role;


--
-- Name: SEQUENCE goose_db_version_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO anon;
GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO service_role;


--
-- Name: TABLE impersonation_password_backup; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.impersonation_password_backup TO postgres;
GRANT ALL ON TABLE public.impersonation_password_backup TO anon;
GRANT ALL ON TABLE public.impersonation_password_backup TO authenticated;
GRANT ALL ON TABLE public.impersonation_password_backup TO service_role;
GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-e163795d";
GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-93da8106";
GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE impersonation_password_backup_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO anon;
GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE import_orders_visits_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.import_orders_visits_contracts TO postgres;
GRANT ALL ON TABLE public.import_orders_visits_contracts TO anon;
GRANT ALL ON TABLE public.import_orders_visits_contracts TO authenticated;
GRANT ALL ON TABLE public.import_orders_visits_contracts TO service_role;
GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_monthly_scores; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_monthly_scores TO postgres;
GRANT ALL ON TABLE public.leader_monthly_scores TO anon;
GRANT ALL ON TABLE public.leader_monthly_scores TO authenticated;
GRANT ALL ON TABLE public.leader_monthly_scores TO service_role;
GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-e163795d";
GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-93da8106";
GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_monthly_scores_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO anon;
GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_score_badges; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_score_badges TO postgres;
GRANT ALL ON TABLE public.leader_score_badges TO anon;
GRANT ALL ON TABLE public.leader_score_badges TO authenticated;
GRANT ALL ON TABLE public.leader_score_badges TO service_role;
GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-e163795d";
GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-93da8106";
GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_score_badges_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO anon;
GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_scores_history; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_scores_history TO postgres;
GRANT ALL ON TABLE public.leader_scores_history TO anon;
GRANT ALL ON TABLE public.leader_scores_history TO authenticated;
GRANT ALL ON TABLE public.leader_scores_history TO service_role;
GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-e163795d";
GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-93da8106";
GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_scores_history_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE logs_api; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.logs_api TO postgres;
GRANT ALL ON TABLE public.logs_api TO anon;
GRANT ALL ON TABLE public.logs_api TO authenticated;
GRANT ALL ON TABLE public.logs_api TO service_role;
GRANT SELECT ON TABLE public.logs_api TO "databasus-e163795d";
GRANT SELECT ON TABLE public.logs_api TO "databasus-93da8106";
GRANT SELECT ON TABLE public.logs_api TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE logs_api_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.logs_api_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.logs_api_id_seq TO anon;
GRANT ALL ON SEQUENCE public.logs_api_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.logs_api_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE logs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.logs_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.logs_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans TO postgres;
GRANT ALL ON TABLE public.maintenances_plans TO anon;
GRANT ALL ON TABLE public.maintenances_plans TO authenticated;
GRANT ALL ON TABLE public.maintenances_plans TO service_role;
GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-e163795d";
GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-93da8106";
GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans_sections; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans_sections TO postgres;
GRANT ALL ON TABLE public.maintenances_plans_sections TO anon;
GRANT ALL ON TABLE public.maintenances_plans_sections TO authenticated;
GRANT ALL ON TABLE public.maintenances_plans_sections TO service_role;
GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-e163795d";
GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-93da8106";
GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans_sections_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO postgres;
GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO anon;
GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO authenticated;
GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO service_role;
GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_sections_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_sections_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO anon;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE materials_purchases; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.materials_purchases TO postgres;
GRANT ALL ON TABLE public.materials_purchases TO anon;
GRANT ALL ON TABLE public.materials_purchases TO authenticated;
GRANT ALL ON TABLE public.materials_purchases TO service_role;
GRANT SELECT ON TABLE public.materials_purchases TO "databasus-e163795d";
GRANT SELECT ON TABLE public.materials_purchases TO "databasus-93da8106";
GRANT SELECT ON TABLE public.materials_purchases TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE material_purchases_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO anon;
GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.materials_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.materials_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE materials_purchases_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO anon;
GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE n8n_chat_histories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.n8n_chat_histories TO postgres;
GRANT ALL ON TABLE public.n8n_chat_histories TO anon;
GRANT ALL ON TABLE public.n8n_chat_histories TO authenticated;
GRANT ALL ON TABLE public.n8n_chat_histories TO service_role;
GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-e163795d";
GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-93da8106";
GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE n8n_chat_histories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_followers TO postgres;
GRANT ALL ON TABLE public.orders_followers TO anon;
GRANT ALL ON TABLE public.orders_followers TO authenticated;
GRANT ALL ON TABLE public.orders_followers TO service_role;
GRANT SELECT ON TABLE public.orders_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_statuses_logs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_statuses_logs TO postgres;
GRANT ALL ON TABLE public.orders_statuses_logs TO anon;
GRANT ALL ON TABLE public.orders_statuses_logs TO authenticated;
GRANT ALL ON TABLE public.orders_statuses_logs TO service_role;
GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_statuses_logs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits TO postgres;
GRANT ALL ON TABLE public.orders_visits TO anon;
GRANT ALL ON TABLE public.orders_visits TO authenticated;
GRANT ALL ON TABLE public.orders_visits TO service_role;
GRANT SELECT ON TABLE public.orders_visits TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets TO postgres;
GRANT ALL ON TABLE public.orders_visits_assets TO anon;
GRANT ALL ON TABLE public.orders_visits_assets TO authenticated;
GRANT ALL ON TABLE public.orders_visits_assets TO service_role;
GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets_activities TO postgres;
GRANT ALL ON TABLE public.orders_visits_assets_activities TO anon;
GRANT ALL ON TABLE public.orders_visits_assets_activities TO authenticated;
GRANT ALL ON TABLE public.orders_visits_assets_activities TO service_role;
GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets_materials TO postgres;
GRANT ALL ON TABLE public.orders_visits_assets_materials TO anon;
GRANT ALL ON TABLE public.orders_visits_assets_materials TO authenticated;
GRANT ALL ON TABLE public.orders_visits_assets_materials TO service_role;
GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat TO postgres;
GRANT ALL ON TABLE public.orders_visits_chat TO anon;
GRANT ALL ON TABLE public.orders_visits_chat TO authenticated;
GRANT ALL ON TABLE public.orders_visits_chat TO service_role;
GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat_participants; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat_participants TO postgres;
GRANT ALL ON TABLE public.orders_visits_chat_participants TO anon;
GRANT ALL ON TABLE public.orders_visits_chat_participants TO authenticated;
GRANT ALL ON TABLE public.orders_visits_chat_participants TO service_role;
GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_participants_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat_reads; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat_reads TO postgres;
GRANT ALL ON TABLE public.orders_visits_chat_reads TO anon;
GRANT ALL ON TABLE public.orders_visits_chat_reads TO authenticated;
GRANT ALL ON TABLE public.orders_visits_chat_reads TO service_role;
GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_reads_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_evaluations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_evaluations TO postgres;
GRANT ALL ON TABLE public.orders_visits_evaluations TO anon;
GRANT ALL ON TABLE public.orders_visits_evaluations TO authenticated;
GRANT ALL ON TABLE public.orders_visits_evaluations TO service_role;
GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_evaluations_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras_followers TO postgres;
GRANT ALL ON TABLE public.orders_visits_extras_followers TO anon;
GRANT ALL ON TABLE public.orders_visits_extras_followers TO authenticated;
GRANT ALL ON TABLE public.orders_visits_extras_followers TO service_role;
GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras_teams TO postgres;
GRANT ALL ON TABLE public.orders_visits_extras_teams TO anon;
GRANT ALL ON TABLE public.orders_visits_extras_teams TO authenticated;
GRANT ALL ON TABLE public.orders_visits_extras_teams TO service_role;
GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_services TO postgres;
GRANT ALL ON TABLE public.orders_visits_services TO anon;
GRANT ALL ON TABLE public.orders_visits_services TO authenticated;
GRANT ALL ON TABLE public.orders_visits_services TO service_role;
GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_teams TO postgres;
GRANT ALL ON TABLE public.orders_visits_teams TO anon;
GRANT ALL ON TABLE public.orders_visits_teams TO authenticated;
GRANT ALL ON TABLE public.orders_visits_teams TO service_role;
GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_vehicles TO postgres;
GRANT ALL ON TABLE public.orders_visits_vehicles TO anon;
GRANT ALL ON TABLE public.orders_visits_vehicles TO authenticated;
GRANT ALL ON TABLE public.orders_visits_vehicles TO service_role;
GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_vehicles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.schema_migrations TO postgres;
GRANT ALL ON TABLE public.schema_migrations TO anon;
GRANT ALL ON TABLE public.schema_migrations TO authenticated;
GRANT ALL ON TABLE public.schema_migrations TO service_role;
GRANT SELECT ON TABLE public.schema_migrations TO "databasus-e163795d";
GRANT SELECT ON TABLE public.schema_migrations TO "databasus-93da8106";
GRANT SELECT ON TABLE public.schema_migrations TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notice_categories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notice_severities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notices_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notices_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.system_notices_id_seq TO anon;
GRANT ALL ON SEQUENCE public.system_notices_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.system_notices_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE technicals_manuals_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals_assets TO postgres;
GRANT ALL ON TABLE public.technicals_manuals_assets TO anon;
GRANT ALL ON TABLE public.technicals_manuals_assets TO authenticated;
GRANT ALL ON TABLE public.technicals_manuals_assets TO service_role;
GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO anon;
GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_files_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO anon;
GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE technicals_manuals_files; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals_files TO postgres;
GRANT ALL ON TABLE public.technicals_manuals_files TO anon;
GRANT ALL ON TABLE public.technicals_manuals_files TO authenticated;
GRANT ALL ON TABLE public.technicals_manuals_files TO service_role;
GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-e163795d";
GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-93da8106";
GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO anon;
GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE tenants; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.tenants TO postgres;
GRANT ALL ON TABLE public.tenants TO anon;
GRANT ALL ON TABLE public.tenants TO authenticated;
GRANT ALL ON TABLE public.tenants TO service_role;
GRANT SELECT ON TABLE public.tenants TO "databasus-e163795d";
GRANT SELECT ON TABLE public.tenants TO "databasus-93da8106";
GRANT SELECT ON TABLE public.tenants TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE tmp_contracts_import_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE tools; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.tools TO postgres;
GRANT ALL ON TABLE public.tools TO anon;
GRANT ALL ON TABLE public.tools TO authenticated;
GRANT ALL ON TABLE public.tools TO service_role;
GRANT SELECT ON TABLE public.tools TO "databasus-e163795d";
GRANT SELECT ON TABLE public.tools TO "databasus-93da8106";
GRANT SELECT ON TABLE public.tools TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE tools_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.tools_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.tools_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tools_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tools_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE units_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.units_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.units_id_seq TO anon;
GRANT ALL ON SEQUENCE public.units_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.units_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_notifications; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_notifications TO postgres;
GRANT ALL ON TABLE public.users_notifications TO anon;
GRANT ALL ON TABLE public.users_notifications TO authenticated;
GRANT ALL ON TABLE public.users_notifications TO service_role;
GRANT SELECT ON TABLE public.users_notifications TO "databasus-e163795d";
GRANT SELECT ON TABLE public.users_notifications TO "databasus-93da8106";
GRANT SELECT ON TABLE public.users_notifications TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_notifications_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tools; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tools TO postgres;
GRANT ALL ON TABLE public.users_tools TO anon;
GRANT ALL ON TABLE public.users_tools TO authenticated;
GRANT ALL ON TABLE public.users_tools TO service_role;
GRANT SELECT ON TABLE public.users_tools TO "databasus-e163795d";
GRANT SELECT ON TABLE public.users_tools TO "databasus-93da8106";
GRANT SELECT ON TABLE public.users_tools TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tools_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tools_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_tools_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_tools_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_tools_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tools_movements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tools_movements TO postgres;
GRANT ALL ON TABLE public.users_tools_movements TO anon;
GRANT ALL ON TABLE public.users_tools_movements TO authenticated;
GRANT ALL ON TABLE public.users_tools_movements TO service_role;
GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-e163795d";
GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-93da8106";
GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tools_movements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tracker; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tracker TO postgres;
GRANT ALL ON TABLE public.users_tracker TO anon;
GRANT ALL ON TABLE public.users_tracker TO authenticated;
GRANT ALL ON TABLE public.users_tracker TO service_role;
GRANT SELECT ON TABLE public.users_tracker TO "databasus-e163795d";
GRANT SELECT ON TABLE public.users_tracker TO "databasus-93da8106";
GRANT SELECT ON TABLE public.users_tracker TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tracker_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app TO postgres;
GRANT ALL ON TABLE public.v_app TO anon;
GRANT ALL ON TABLE public.v_app TO authenticated;
GRANT ALL ON TABLE public.v_app TO service_role;
GRANT SELECT ON TABLE public.v_app TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_app TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_app TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_notices; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_notices TO postgres;
GRANT ALL ON TABLE public.v_app_notices TO anon;
GRANT ALL ON TABLE public.v_app_notices TO authenticated;
GRANT ALL ON TABLE public.v_app_notices TO service_role;
GRANT SELECT ON TABLE public.v_app_notices TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_app_notices TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_app_notices TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_offline_updates; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_offline_updates TO postgres;
GRANT ALL ON TABLE public.v_app_offline_updates TO anon;
GRANT ALL ON TABLE public.v_app_offline_updates TO authenticated;
GRANT ALL ON TABLE public.v_app_offline_updates TO service_role;
GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_pages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_pages TO postgres;
GRANT ALL ON TABLE public.v_app_pages TO anon;
GRANT ALL ON TABLE public.v_app_pages TO authenticated;
GRANT ALL ON TABLE public.v_app_pages TO service_role;
GRANT SELECT ON TABLE public.v_app_pages TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_app_pages TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_app_pages TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_available; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_available TO postgres;
GRANT ALL ON TABLE public.v_assets_available TO anon;
GRANT ALL ON TABLE public.v_assets_available TO authenticated;
GRANT ALL ON TABLE public.v_assets_available TO service_role;
GRANT SELECT ON TABLE public.v_assets_available TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_available TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_available TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_couplings_models; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_couplings_models TO postgres;
GRANT ALL ON TABLE public.v_assets_couplings_models TO anon;
GRANT ALL ON TABLE public.v_assets_couplings_models TO authenticated;
GRANT ALL ON TABLE public.v_assets_couplings_models TO service_role;
GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_followers TO postgres;
GRANT ALL ON TABLE public.v_assets_followers TO anon;
GRANT ALL ON TABLE public.v_assets_followers TO authenticated;
GRANT ALL ON TABLE public.v_assets_followers TO service_role;
GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_loans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_loans TO postgres;
GRANT ALL ON TABLE public.v_assets_loans TO anon;
GRANT ALL ON TABLE public.v_assets_loans TO authenticated;
GRANT ALL ON TABLE public.v_assets_loans TO service_role;
GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_materials TO postgres;
GRANT ALL ON TABLE public.v_assets_materials TO anon;
GRANT ALL ON TABLE public.v_assets_materials TO authenticated;
GRANT ALL ON TABLE public.v_assets_materials TO service_role;
GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_priorities TO postgres;
GRANT ALL ON TABLE public.v_assets_priorities TO anon;
GRANT ALL ON TABLE public.v_assets_priorities TO authenticated;
GRANT ALL ON TABLE public.v_assets_priorities TO service_role;
GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_statuses TO postgres;
GRANT ALL ON TABLE public.v_assets_statuses TO anon;
GRANT ALL ON TABLE public.v_assets_statuses TO authenticated;
GRANT ALL ON TABLE public.v_assets_statuses TO service_role;
GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_tags TO postgres;
GRANT ALL ON TABLE public.v_assets_tags TO anon;
GRANT ALL ON TABLE public.v_assets_tags TO authenticated;
GRANT ALL ON TABLE public.v_assets_tags TO service_role;
GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_tags_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_tags_subs TO postgres;
GRANT ALL ON TABLE public.v_assets_tags_subs TO anon;
GRANT ALL ON TABLE public.v_assets_tags_subs TO authenticated;
GRANT ALL ON TABLE public.v_assets_tags_subs TO service_role;
GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_types TO postgres;
GRANT ALL ON TABLE public.v_assets_types TO anon;
GRANT ALL ON TABLE public.v_assets_types TO authenticated;
GRANT ALL ON TABLE public.v_assets_types TO service_role;
GRANT SELECT ON TABLE public.v_assets_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_unavailable_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO postgres;
GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO anon;
GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO authenticated;
GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO service_role;
GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_companies TO postgres;
GRANT ALL ON TABLE public.v_companies TO anon;
GRANT ALL ON TABLE public.v_companies TO authenticated;
GRANT ALL ON TABLE public.v_companies TO service_role;
GRANT SELECT ON TABLE public.v_companies TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_companies TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_companies TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts TO postgres;
GRANT ALL ON TABLE public.v_contracts TO anon;
GRANT ALL ON TABLE public.v_contracts TO authenticated;
GRANT ALL ON TABLE public.v_contracts TO service_role;
GRANT SELECT ON TABLE public.v_contracts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_contracts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO postgres;
GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO anon;
GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO authenticated;
GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO service_role;
GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_managers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_managers TO postgres;
GRANT ALL ON TABLE public.v_contracts_managers TO anon;
GRANT ALL ON TABLE public.v_contracts_managers TO authenticated;
GRANT ALL ON TABLE public.v_contracts_managers TO service_role;
GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_dash_admin_orders_parent_status_1; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO postgres;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO anon;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO authenticated;
GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO service_role;
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_departments TO postgres;
GRANT ALL ON TABLE public.v_departments TO anon;
GRANT ALL ON TABLE public.v_departments TO authenticated;
GRANT ALL ON TABLE public.v_departments TO service_role;
GRANT SELECT ON TABLE public.v_departments TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_departments TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_departments TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_import_orders_visits_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO postgres;
GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO anon;
GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO authenticated;
GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO service_role;
GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_leader_ranking; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_leader_ranking TO postgres;
GRANT ALL ON TABLE public.v_leader_ranking TO anon;
GRANT ALL ON TABLE public.v_leader_ranking TO authenticated;
GRANT ALL ON TABLE public.v_leader_ranking TO service_role;
GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-3a3c9dfb";


--
-- Name: TABLE warehouses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.warehouses TO postgres;
GRANT ALL ON TABLE public.warehouses TO anon;
GRANT ALL ON TABLE public.warehouses TO authenticated;
GRANT ALL ON TABLE public.warehouses TO service_role;
GRANT SELECT ON TABLE public.warehouses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.warehouses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.warehouses TO "databasus-3a3c9dfb";


--
-- Name: TABLE warehouses_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.warehouses_materials TO postgres;
GRANT ALL ON TABLE public.warehouses_materials TO anon;
GRANT ALL ON TABLE public.warehouses_materials TO authenticated;
GRANT ALL ON TABLE public.warehouses_materials TO service_role;
GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_materials TO postgres;
GRANT ALL ON TABLE public.v_materials TO anon;
GRANT ALL ON TABLE public.v_materials TO authenticated;
GRANT ALL ON TABLE public.v_materials TO service_role;
GRANT SELECT ON TABLE public.v_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_materials_purchases; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_materials_purchases TO postgres;
GRANT ALL ON TABLE public.v_materials_purchases TO anon;
GRANT ALL ON TABLE public.v_materials_purchases TO authenticated;
GRANT ALL ON TABLE public.v_materials_purchases TO service_role;
GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_order_visit_scores; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_order_visit_scores TO postgres;
GRANT ALL ON TABLE public.v_order_visit_scores TO anon;
GRANT ALL ON TABLE public.v_order_visit_scores TO authenticated;
GRANT ALL ON TABLE public.v_order_visit_scores TO service_role;
GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_cancel_reasons TO postgres;
GRANT ALL ON TABLE public.v_orders_cancel_reasons TO anon;
GRANT ALL ON TABLE public.v_orders_cancel_reasons TO authenticated;
GRANT ALL ON TABLE public.v_orders_cancel_reasons TO service_role;
GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_causes_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_causes_reasons TO postgres;
GRANT ALL ON TABLE public.v_orders_causes_reasons TO anon;
GRANT ALL ON TABLE public.v_orders_causes_reasons TO authenticated;
GRANT ALL ON TABLE public.v_orders_causes_reasons TO service_role;
GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_counter; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_counter TO postgres;
GRANT ALL ON TABLE public.v_orders_counter TO anon;
GRANT ALL ON TABLE public.v_orders_counter TO authenticated;
GRANT ALL ON TABLE public.v_orders_counter TO service_role;
GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_followers TO postgres;
GRANT ALL ON TABLE public.v_orders_followers TO anon;
GRANT ALL ON TABLE public.v_orders_followers TO authenticated;
GRANT ALL ON TABLE public.v_orders_followers TO service_role;
GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_objects; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_objects TO postgres;
GRANT ALL ON TABLE public.v_orders_objects TO anon;
GRANT ALL ON TABLE public.v_orders_objects TO authenticated;
GRANT ALL ON TABLE public.v_orders_objects TO service_role;
GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_open TO postgres;
GRANT ALL ON TABLE public.v_orders_open TO anon;
GRANT ALL ON TABLE public.v_orders_open TO authenticated;
GRANT ALL ON TABLE public.v_orders_open TO service_role;
GRANT SELECT ON TABLE public.v_orders_open TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_open TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_open TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_parent TO postgres;
GRANT ALL ON TABLE public.v_orders_parent TO anon;
GRANT ALL ON TABLE public.v_orders_parent TO authenticated;
GRANT ALL ON TABLE public.v_orders_parent TO service_role;
GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_plans TO postgres;
GRANT ALL ON TABLE public.v_orders_plans TO anon;
GRANT ALL ON TABLE public.v_orders_plans TO authenticated;
GRANT ALL ON TABLE public.v_orders_plans TO service_role;
GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_priorities TO postgres;
GRANT ALL ON TABLE public.v_orders_priorities TO anon;
GRANT ALL ON TABLE public.v_orders_priorities TO authenticated;
GRANT ALL ON TABLE public.v_orders_priorities TO service_role;
GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_statuses TO postgres;
GRANT ALL ON TABLE public.v_orders_statuses TO anon;
GRANT ALL ON TABLE public.v_orders_statuses TO authenticated;
GRANT ALL ON TABLE public.v_orders_statuses TO service_role;
GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_suspended_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_suspended_reasons TO postgres;
GRANT ALL ON TABLE public.v_orders_suspended_reasons TO anon;
GRANT ALL ON TABLE public.v_orders_suspended_reasons TO authenticated;
GRANT ALL ON TABLE public.v_orders_suspended_reasons TO service_role;
GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types TO postgres;
GRANT ALL ON TABLE public.v_orders_types TO anon;
GRANT ALL ON TABLE public.v_orders_types TO authenticated;
GRANT ALL ON TABLE public.v_orders_types TO service_role;
GRANT SELECT ON TABLE public.v_orders_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types_subs TO postgres;
GRANT ALL ON TABLE public.v_orders_types_subs TO anon;
GRANT ALL ON TABLE public.v_orders_types_subs TO authenticated;
GRANT ALL ON TABLE public.v_orders_types_subs TO service_role;
GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits TO postgres;
GRANT ALL ON TABLE public.v_orders_visits TO anon;
GRANT ALL ON TABLE public.v_orders_visits TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_assets TO anon;
GRANT ALL ON TABLE public.v_orders_visits_assets TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_assets TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO anon;
GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO anon;
GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_evaluations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_evaluations TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_evaluations TO anon;
GRANT ALL ON TABLE public.v_orders_visits_evaluations TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_evaluations TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO anon;
GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO anon;
GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_services TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_services TO anon;
GRANT ALL ON TABLE public.v_orders_visits_services TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_services TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_teams TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_teams TO anon;
GRANT ALL ON TABLE public.v_orders_visits_teams TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_teams TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.vehicles TO postgres;
GRANT ALL ON TABLE public.vehicles TO anon;
GRANT ALL ON TABLE public.vehicles TO authenticated;
GRANT ALL ON TABLE public.vehicles TO service_role;
GRANT SELECT ON TABLE public.vehicles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.vehicles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.vehicles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO anon;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO service_role;
GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_profiles TO postgres;
GRANT ALL ON TABLE public.v_profiles TO anon;
GRANT ALL ON TABLE public.v_profiles TO authenticated;
GRANT ALL ON TABLE public.v_profiles TO service_role;
GRANT SELECT ON TABLE public.v_profiles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_profiles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_profiles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_profiles_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_profiles_permissions TO postgres;
GRANT ALL ON TABLE public.v_profiles_permissions TO anon;
GRANT ALL ON TABLE public.v_profiles_permissions TO authenticated;
GRANT ALL ON TABLE public.v_profiles_permissions TO service_role;
GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_services TO postgres;
GRANT ALL ON TABLE public.v_services TO anon;
GRANT ALL ON TABLE public.v_services TO authenticated;
GRANT ALL ON TABLE public.v_services TO service_role;
GRANT SELECT ON TABLE public.v_services TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_services TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems TO postgres;
GRANT ALL ON TABLE public.v_systems TO anon;
GRANT ALL ON TABLE public.v_systems TO authenticated;
GRANT ALL ON TABLE public.v_systems TO service_role;
GRANT SELECT ON TABLE public.v_systems TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_systems TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_systems TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent TO postgres;
GRANT ALL ON TABLE public.v_systems_parent TO anon;
GRANT ALL ON TABLE public.v_systems_parent TO authenticated;
GRANT ALL ON TABLE public.v_systems_parent TO service_role;
GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent_assets_tags_available_rate; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO postgres;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO anon;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO authenticated;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO service_role;
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO postgres;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO anon;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO authenticated;
GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO service_role;
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_teams TO postgres;
GRANT ALL ON TABLE public.v_teams TO anon;
GRANT ALL ON TABLE public.v_teams TO authenticated;
GRANT ALL ON TABLE public.v_teams TO service_role;
GRANT SELECT ON TABLE public.v_teams TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_teams TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users TO postgres;
GRANT ALL ON TABLE public.v_users TO anon;
GRANT ALL ON TABLE public.v_users TO authenticated;
GRANT ALL ON TABLE public.v_users TO service_role;
GRANT SELECT ON TABLE public.v_users TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_users TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_users TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_teams_leaders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_teams_leaders TO postgres;
GRANT ALL ON TABLE public.v_teams_leaders TO anon;
GRANT ALL ON TABLE public.v_teams_leaders TO authenticated;
GRANT ALL ON TABLE public.v_teams_leaders TO service_role;
GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals_assets TO postgres;
GRANT ALL ON TABLE public.v_technicals_manuals_assets TO anon;
GRANT ALL ON TABLE public.v_technicals_manuals_assets TO authenticated;
GRANT ALL ON TABLE public.v_technicals_manuals_assets TO service_role;
GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals_types TO postgres;
GRANT ALL ON TABLE public.v_technicals_manuals_types TO anon;
GRANT ALL ON TABLE public.v_technicals_manuals_types TO authenticated;
GRANT ALL ON TABLE public.v_technicals_manuals_types TO service_role;
GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_unit_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO postgres;
GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO anon;
GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO authenticated;
GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO service_role;
GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_asset_available_rate_avg; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO postgres;
GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO anon;
GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO authenticated;
GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO service_role;
GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_availability; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_availability TO postgres;
GRANT ALL ON TABLE public.v_units_assets_tags_availability TO anon;
GRANT ALL ON TABLE public.v_units_assets_tags_availability TO authenticated;
GRANT ALL ON TABLE public.v_units_assets_tags_availability TO service_role;
GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_available_rate; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO postgres;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO anon;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO authenticated;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO service_role;
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_available_rate_latest_by_user; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO postgres;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO anon;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO authenticated;
GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO service_role;
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO postgres;
GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO anon;
GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO authenticated;
GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO service_role;
GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_statuses TO postgres;
GRANT ALL ON TABLE public.v_units_statuses TO anon;
GRANT ALL ON TABLE public.v_units_statuses TO authenticated;
GRANT ALL ON TABLE public.v_units_statuses TO service_role;
GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_types TO postgres;
GRANT ALL ON TABLE public.v_units_types TO anon;
GRANT ALL ON TABLE public.v_units_types TO authenticated;
GRANT ALL ON TABLE public.v_units_types TO service_role;
GRANT SELECT ON TABLE public.v_units_types TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_types TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_types_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_types_parent TO postgres;
GRANT ALL ON TABLE public.v_units_types_parent TO anon;
GRANT ALL ON TABLE public.v_units_types_parent TO authenticated;
GRANT ALL ON TABLE public.v_units_types_parent TO service_role;
GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users_notifications; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users_notifications TO postgres;
GRANT ALL ON TABLE public.v_users_notifications TO anon;
GRANT ALL ON TABLE public.v_users_notifications TO authenticated;
GRANT ALL ON TABLE public.v_users_notifications TO service_role;
GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users_permissions TO postgres;
GRANT ALL ON TABLE public.v_users_permissions TO anon;
GRANT ALL ON TABLE public.v_users_permissions TO authenticated;
GRANT ALL ON TABLE public.v_users_permissions TO service_role;
GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_vehicles TO postgres;
GRANT ALL ON TABLE public.v_vehicles TO anon;
GRANT ALL ON TABLE public.v_vehicles TO authenticated;
GRANT ALL ON TABLE public.v_vehicles TO service_role;
GRANT SELECT ON TABLE public.v_vehicles TO "databasus-e163795d";
GRANT SELECT ON TABLE public.v_vehicles TO "databasus-93da8106";
GRANT SELECT ON TABLE public.v_vehicles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE vehicles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.vehicles_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.vehicles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.vehicles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.vehicles_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE warehouses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.warehouses_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.warehouses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.warehouses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.warehouses_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE warehouses_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO postgres;
GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO service_role;
GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-e163795d";
GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-93da8106";
GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE iceberg_namespaces; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_namespaces TO service_role;
GRANT SELECT ON TABLE storage.iceberg_namespaces TO authenticated;
GRANT SELECT ON TABLE storage.iceberg_namespaces TO anon;


--
-- Name: TABLE iceberg_tables; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_tables TO service_role;
GRANT SELECT ON TABLE storage.iceberg_tables TO authenticated;
GRANT SELECT ON TABLE storage.iceberg_tables TO anon;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-e163795d";
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-93da8106";
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-3a3c9dfb";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-e163795d";
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-93da8106";
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-3a3c9dfb";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- PostgreSQL database dump complete
--


