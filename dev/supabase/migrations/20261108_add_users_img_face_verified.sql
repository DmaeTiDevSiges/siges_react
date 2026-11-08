-- ==============================================================================
-- Migration: 20261108_add_users_img_face_verified.sql
-- Foto de perfil com rosto humano — marcação no banco (etapa 3) e base para a
-- revisão das fotos atuais (etapa 4, Ajustes → Usuários → Revisar fotos).
--
-- Colunas em public.users:
--   img_face_verified     BOOLEAN      NULL  = não verificada (foto antiga ou
--                                            trocada fora do app)
--                                      TRUE  = passou nas regras (1 rosto, tamanho,
--                                            confiança — services/ai/profileFaceRules.ts)
--                                      FALSE = verificada e recusada
--   img_face_verified_at  TIMESTAMPTZ  quando a verificação foi feita
--   img_face_reason       TEXT         motivo: ok | no_face | multiple_faces |
--                                      face_too_small | low_confidence
--
-- Gatilho: se a foto (img_file_path/img_file_name) mudar SEM que a mesma gravação
-- registre uma verificação nova (img_face_verified_at igual), a marcação volta
-- para NULL. Assim uma troca de foto por fora do app nunca herda "verificada".
--
-- Limite: a verificação roda no app; a marcação mostra o que o app verificou,
-- não impede uma gravação direta pela API (ver docs/PLANO_MELHORIAS_SEGURANCA.md).
--
-- Idempotente. Reverter: 20261108_add_users_img_face_verified_DOWN.sql
-- ==============================================================================

BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS img_face_verified    BOOLEAN,
    ADD COLUMN IF NOT EXISTS img_face_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS img_face_reason      TEXT;

COMMENT ON COLUMN public.users.img_face_verified IS
    'Foto de perfil com exatamente um rosto (verificada no app). NULL = não verificada; FALSE = recusada.';
COMMENT ON COLUMN public.users.img_face_verified_at IS
    'Quando img_face_verified foi definido.';
COMMENT ON COLUMN public.users.img_face_reason IS
    'Motivo da última verificação: ok, no_face, multiple_faces, face_too_small, low_confidence.';

CREATE OR REPLACE FUNCTION public.fc_users_reset_img_face_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (NEW.img_file_path IS DISTINCT FROM OLD.img_file_path
        OR NEW.img_file_name IS DISTINCT FROM OLD.img_file_name)
       AND NEW.img_face_verified_at IS NOT DISTINCT FROM OLD.img_face_verified_at THEN
        NEW.img_face_verified    := NULL;
        NEW.img_face_verified_at := NULL;
        NEW.img_face_reason      := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_reset_img_face_verified ON public.users;
CREATE TRIGGER trg_users_reset_img_face_verified
    BEFORE UPDATE OF img_file_path, img_file_name ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.fc_users_reset_img_face_verified();

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência:
--   SELECT img_face_verified, count(*) FROM public.users GROUP BY 1;
