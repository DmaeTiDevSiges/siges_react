-- Reverte 20261108_add_users_img_face_verified.sql
BEGIN;
DROP TRIGGER IF EXISTS trg_users_reset_img_face_verified ON public.users;
DROP FUNCTION IF EXISTS public.fc_users_reset_img_face_verified();
ALTER TABLE public.users
    DROP COLUMN IF EXISTS img_face_verified,
    DROP COLUMN IF EXISTS img_face_verified_at,
    DROP COLUMN IF EXISTS img_face_reason;
COMMIT;
NOTIFY pgrst, 'reload schema';
