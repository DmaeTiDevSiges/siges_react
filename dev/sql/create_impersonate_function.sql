-- Drop old function first (different signature)
DROP FUNCTION IF EXISTS public.generate_impersonation_link(BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.generate_impersonation_link(BIGINT, TEXT, TEXT);

-- Function to generate a temporary login for impersonation
-- Creates a one-time password for the target user
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.generate_impersonation_link(
    p_target_user_id BIGINT,
    p_redirect_to TEXT DEFAULT NULL,
    p_service_role_key TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uuid UUID;
    v_email TEXT;
    v_temp_password TEXT;
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
