CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

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

CREATE FUNCTION public.fc_materials_searchable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    NEW.searchable = NEW.code || ' ' || NEW.description;

    RETURN NEW;
END;
$$;

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

CREATE FUNCTION public.fc_orders_replace_special_chars() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  new.requested_services := extensions.unaccent(new.requested_services);
  RETURN NEW;
END;
$$;

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

CREATE FUNCTION public.fc_orders_visits_assets_materials_update_value_total() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.value_total := NEW.amount * COALESCE(NEW.value_unit, 0) * COALESCE(NEW.discount, 1);
    RETURN NEW;
END;
$$;

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

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

CREATE FUNCTION public.update_cfg_app_notices_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_cfg_app_tips_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_system_notices_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEW;
END;
$$;

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

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;

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

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;

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

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;

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

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;

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

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;
