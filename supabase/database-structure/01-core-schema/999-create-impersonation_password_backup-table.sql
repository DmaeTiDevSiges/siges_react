-- =============================================================================
-- Table: impersonation_password_backup
-- Description: Backup de senhas originais para funcionalidade de impersonação
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.impersonation_password_backup (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    user_email TEXT NOT NULL,
    original_encrypted_password TEXT NOT NULL,
    backed_up_at TIMESTAMPTZ DEFAULT now(),
    restored_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.impersonation_password_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.impersonation_password_backup
    USING (auth.role() = 'service_role');
