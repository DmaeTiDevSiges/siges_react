-- =============================================================
-- PASSO 1: Criar tabela de backup de senhas
-- =============================================================
CREATE TABLE IF NOT EXISTS public.impersonation_password_backup (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    user_email TEXT NOT NULL,
    original_encrypted_password TEXT NOT NULL,
    backed_up_at TIMESTAMPTZ DEFAULT now(),
    restored_at TIMESTAMPTZ DEFAULT NULL
);

-- RLS: apenas service_role pode acessar
ALTER TABLE public.impersonation_password_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.impersonation_password_backup
    USING (auth.role() = 'service_role');

-- =============================================================
-- PASSO 2: Recriar generate_impersonation_link (salva hash original)
-- =============================================================
DROP FUNCTION IF EXISTS public.generate_impersonation_link(BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.generate_impersonation_link(BIGINT, TEXT, TEXT);

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

-- =============================================================
-- PASSO 3: Criar restore_original_password
-- =============================================================
CREATE OR REPLACE FUNCTION public.restore_original_password(
    p_user_uuid UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
