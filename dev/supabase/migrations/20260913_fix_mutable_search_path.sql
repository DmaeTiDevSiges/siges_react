-- ============================================================
-- Migration: Fix mutable search_path on functions
-- Date: 2026-09-13
-- Fix: Supabase advisor warnings for functions with mutable search_path
-- ============================================================

-- Functions found in codebase (DROP + CREATE with SET search_path = public)

-- 1. fc_get_user_permissions
DROP FUNCTION IF EXISTS public.fc_get_user_permissions(bigint);

CREATE FUNCTION public.fc_get_user_permissions(p_user_id bigint)
RETURNS TABLE(route_id bigint, route_key character varying, route_path character varying, route_description character varying, route_icon character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
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

-- 2. fc_get_profile_permissions
DROP FUNCTION IF EXISTS public.fc_get_profile_permissions(bigint);

CREATE FUNCTION public.fc_get_profile_permissions(p_profile_id bigint)
RETURNS TABLE(permission_id bigint, route_id bigint, route_key character varying, route_path character varying, route_description character varying, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
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

-- 3. fc_update_profile_routes
DROP FUNCTION IF EXISTS public.fc_update_profile_routes(bigint, jsonb);

CREATE FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb)
RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
BEGIN
    DELETE FROM public.cfg_profiles_access 
    WHERE profile_id = p_profile_id;
    
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

-- 4. fc_check_user_permission
DROP FUNCTION IF EXISTS public.fc_check_user_permission(bigint, character varying, character varying);

CREATE FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying DEFAULT 'view'::character varying)
RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
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

-- 5. fc_order_counter_increment
DROP FUNCTION IF EXISTS public.fc_order_counter_increment(bigint, integer, text);

CREATE FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text)
RETURNS json
    LANGUAGE plpgsql
    SET search_path = public
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

-- 6. fc_orders_types_activities_search
DROP FUNCTION IF EXISTS public.fc_orders_types_activities_search(text, text);

CREATE FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text)
RETURNS SETOF public.v_orders_types_activities
    LANGUAGE plpgsql
    SET search_path = public
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

-- Functions only in live database (ALTER FUNCTION to set search_path)
-- Wrapped in DO blocks to handle missing functions gracefully

DO $$
BEGIN
    ALTER FUNCTION public.fc_update_op_counter() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_orders_op_counter_trigger() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_orders_visits_extras_teams_update() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_dash_admin_orders_extras_filters() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_orders_visits_update_total_value() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.fc_sync_ov_costs_status() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;
