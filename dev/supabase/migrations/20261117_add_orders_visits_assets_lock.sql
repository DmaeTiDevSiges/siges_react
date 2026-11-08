-- ==============================================================================
-- Migration: 20261117_add_orders_visits_assets_lock.sql
-- Modo offline (F0) — trava do relatório do ativo para o técnico que o abriu.
--
-- Regras (decididas em 08/11/2026):
--   * A trava só é pega COM internet (ao abrir o ativo ou em "Preparar para
--     campo"). Offline o técnico só edita ativos já travados para ele.
--   * Não expira sozinha — um técnico 2 dias sem sinal não perde o trabalho.
--   * É solta pelo próprio técnico (ao relatar + sincronizar, ou manualmente)
--     ou FORÇADA pelo gestor do contrato (contracts_managers.role = 'manager')
--     ou por admin. Ao forçar, lock_token muda: a fila antiga daquele técnico
--     chega ao servidor com o token velho e vira CONFLITO, sem sobrescrever.
--
-- Colunas em public.orders_visits_assets:
--   locked_user_id  BIGINT     quem segura a trava (NULL = livre)
--   locked_at       TIMESTAMP  quando pegou (hora de São Paulo, sem fuso)
--   lock_token      UUID       muda a cada trava nova; o app guarda e envia
--                              em toda operação offline daquele ativo
--
-- RPCs (SECURITY INVOKER — valem as mesmas regras de acesso/RLS do app):
--   ov_asset_lock(p_ova_id)                   → pega ou renova a própria trava
--   ov_asset_unlock(p_ova_id, p_force=false)  → solta (force = gestor/admin)
--
-- Limite: a trava é respeitada pelo app e pelos RPCs de sincronização (F2);
-- uma gravação direta pela API não é bloqueada (mesmo limite registrado em
-- 20261108_add_users_img_face_verified.sql).
--
-- Somente aditiva. Idempotente. Reverter: 20261117_add_orders_visits_assets_lock_DOWN.sql
-- ==============================================================================

BEGIN;

ALTER TABLE public.orders_visits_assets
    ADD COLUMN IF NOT EXISTS locked_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS locked_at      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS lock_token     UUID;

COMMENT ON COLUMN public.orders_visits_assets.locked_user_id IS
    'Técnico que travou o relatório deste ativo (modo offline). NULL = livre.';
COMMENT ON COLUMN public.orders_visits_assets.locked_at IS
    'Quando a trava foi pega (hora de São Paulo, sem fuso).';
COMMENT ON COLUMN public.orders_visits_assets.lock_token IS
    'Token da trava atual; operações offline com token diferente viram conflito.';

CREATE INDEX IF NOT EXISTS ix_orders_visits_assets_locked_user
    ON public.orders_visits_assets (locked_user_id)
    WHERE locked_user_id IS NOT NULL;

-- ── Pegar / renovar ─────────────────────────────────────────────────────────
-- Atômico: o UPDATE só acontece se estiver livre ou já for do próprio usuário.
-- Renovar a própria trava mantém o token (a fila offline continua válida).
CREATE OR REPLACE FUNCTION public.ov_asset_lock(p_ova_id BIGINT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now     TIMESTAMP := timezone('America/Sao_Paulo', now());
    v_user_id BIGINT;
    v_row     RECORD;
    v_holder  RECORD;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.orders_visits_assets a
       SET locked_user_id = v_user_id,
           locked_at      = CASE WHEN a.locked_user_id = v_user_id THEN a.locked_at ELSE v_now END,
           lock_token     = CASE WHEN a.locked_user_id = v_user_id AND a.lock_token IS NOT NULL
                                 THEN a.lock_token ELSE gen_random_uuid() END
     WHERE a.id = p_ova_id
       AND (a.locked_user_id IS NULL OR a.locked_user_id = v_user_id)
    RETURNING a.locked_user_id, a.locked_at, a.lock_token INTO v_row;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'locked', true,
            'locked_user_id', v_row.locked_user_id,
            'locked_at', v_row.locked_at,
            'lock_token', v_row.lock_token
        );
    END IF;

    -- Não travou: ou o ativo não existe/sem acesso, ou é de outro técnico.
    SELECT a.locked_user_id, a.locked_at,
           COALESCE(NULLIF(u.name_short, ''), u.name_full) AS holder_name
      INTO v_holder
      FROM public.orders_visits_assets a
      LEFT JOIN public.users u ON u.id = a.locked_user_id
     WHERE a.id = p_ova_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ativo da visita % não encontrado ou sem permissão.', p_ova_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'locked', false,
        'locked_user_id', v_holder.locked_user_id,
        'locked_user_name', v_holder.holder_name,
        'locked_at', v_holder.locked_at
    );
END;
$$;

-- ── Soltar ──────────────────────────────────────────────────────────────────
-- p_force = false: só solta a própria trava (sem trava = nada a fazer).
-- p_force = true : gestor do contrato da OS ou admin solta a de qualquer um.
CREATE OR REPLACE FUNCTION public.ov_asset_unlock(p_ova_id BIGINT, p_force BOOLEAN DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user     RECORD;
    v_holder   BIGINT;
    v_contract BIGINT;
    v_allowed  BOOLEAN := false;
BEGIN
    SELECT u.id, COALESCE(u.is_admin, false) OR COALESCE(u.is_admin_super, false) AS is_admin
      INTO v_user
      FROM public.users u WHERE u.uuid = auth.uid() LIMIT 1;
    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'Usuário não identificado.' USING ERRCODE = '42501';
    END IF;

    SELECT a.locked_user_id, o.contract_id
      INTO v_holder, v_contract
      FROM public.orders_visits_assets a
      JOIN public.orders_visits ov ON ov.id = a.ov_id
      LEFT JOIN public.orders o ON o.id = ov.o_id
     WHERE a.id = p_ova_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ativo da visita % não encontrado ou sem permissão.', p_ova_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_holder IS NULL THEN
        RETURN jsonb_build_object('unlocked', true, 'was_locked', false);
    END IF;

    IF v_holder = v_user.id THEN
        v_allowed := true;
    ELSIF p_force THEN
        v_allowed := v_user.is_admin OR EXISTS (
            SELECT 1 FROM public.contracts_managers m
             WHERE m.contract_id = v_contract
               AND m.manager_id  = v_user.id
               AND m.role        = 'manager'
               AND m.is_deleted  = false
        );
    END IF;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Ativo travado por outro técnico. Só o gestor do contrato pode liberar.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.orders_visits_assets
       SET locked_user_id = NULL,
           locked_at      = NULL,
           lock_token     = NULL
     WHERE id = p_ova_id;

    RETURN jsonb_build_object(
        'unlocked', true,
        'was_locked', true,
        'forced', v_holder <> v_user.id,
        'previous_user_id', v_holder
    );
END;
$$;

COMMENT ON FUNCTION public.ov_asset_lock(bigint) IS
    'Modo offline: pega/renova a trava do relatório do ativo para o usuário atual. SECURITY INVOKER.';
COMMENT ON FUNCTION public.ov_asset_unlock(bigint, boolean) IS
    'Modo offline: solta a trava (própria; ou forçada por gestor do contrato/admin). SECURITY INVOKER.';

REVOKE ALL ON FUNCTION public.ov_asset_lock(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ov_asset_unlock(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ov_asset_lock(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ov_asset_unlock(bigint, boolean) TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (troque 123 por um id real de orders_visits_assets):
--   SELECT public.ov_asset_lock(123);          -- {"locked": true, ...}
--   SELECT public.ov_asset_lock(123);          -- mesmo lock_token (renovação)
--   SELECT public.ov_asset_unlock(123);        -- {"unlocked": true, "was_locked": true}
