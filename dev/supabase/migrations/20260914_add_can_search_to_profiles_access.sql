-- ============================================================
-- Migration: Add can_search to cfg_profiles_access + fix functions
-- Date: 2026-09-14
-- Fix: canSearch always false — column missing from table and functions
-- ============================================================

-- 1. Add can_search column to cfg_profiles_access
ALTER TABLE public.cfg_profiles_access
    ADD COLUMN IF NOT EXISTS can_search boolean DEFAULT false NOT NULL;

-- 2. Fix fc_get_user_permissions — add can_search to RETURN and SELECT
DROP FUNCTION IF EXISTS public.fc_get_user_permissions(bigint);

CREATE FUNCTION public.fc_get_user_permissions(p_user_id bigint)
RETURNS TABLE(
    route_id bigint,
    route_key character varying,
    route_path character varying,
    route_description character varying,
    route_icon character varying,
    can_view boolean,
    can_create boolean,
    can_edit boolean,
    can_delete boolean,
    can_search boolean
)
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

-- 3. Fix fc_get_profile_permissions — add can_search to RETURN and SELECT
DROP FUNCTION IF EXISTS public.fc_get_profile_permissions(bigint);

CREATE FUNCTION public.fc_get_profile_permissions(p_profile_id bigint)
RETURNS TABLE(
    permission_id bigint,
    route_id bigint,
    route_key character varying,
    route_path character varying,
    route_description character varying,
    can_view boolean,
    can_create boolean,
    can_edit boolean,
    can_delete boolean,
    can_search boolean
)
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
        pa.can_delete,
        pa.can_search
    FROM public.cfg_profiles_access pa
    INNER JOIN public.cfg_routes r ON pa.route_id = r.id
    WHERE pa.profile_id = p_profile_id
      AND r.is_available = true
    ORDER BY r.order_index;
END;
$$;

-- 4. Fix fc_update_profile_routes — include can_search in INSERT
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

-- 5. Fix fc_check_user_permission — add 'search' action
DROP FUNCTION IF EXISTS public.fc_check_user_permission(bigint, character varying, character varying);

CREATE FUNCTION public.fc_check_user_permission(
    p_user_id bigint,
    p_route_key character varying,
    p_action character varying DEFAULT 'view'::character varying
)
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
