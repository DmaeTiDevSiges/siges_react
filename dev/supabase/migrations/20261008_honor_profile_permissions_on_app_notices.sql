-- =====================================================
-- Migration: Honorar permissões de perfil nas RLS de cfg_app_notices
-- Date: 2026-10-08
-- Description: As policies de cfg_app_notices checavam apenas
--              users.is_admin_super, mas a UI abre a tela de avisos
--              pela permissão de rota (app_notices). Resultado: um
--              usuário sem is_admin_super mas com o perfil completo
--              via UI recebia "Erro ao criar aviso" (INSERT/UPDATE/
--              DELETE negados) e não via Inativos/Expirados na lista
--              (SELECT limitado à vigência).
--
--              Esta migration:
--                1) cria o helper fc_has_route_permission(route_key,
--                   action) — SECURITY DEFINER, consulta
--                   users → cfg_profiles → cfg_profiles_access →
--                   cfg_routes pelo auth.uid(), com bypass de
--                   is_admin_super;
--                2) reescreve as 4 policies somando a permissão de
--                   rota ao bypass atual. O SELECT mantém a janela de
--                   vigência para quem NÃO tem a rota (ticker/todos
--                   os usuários continuam iguais);
--                3) corrige a chave da rota da MO Extra: a UI usa
--                   'notices_workers_extra' (Sidebar, BottomNav,
--                   ExtraWorkersList) e a migration 20261003 criou
--                   'extra_workers' — gate da tela MO Extra nunca
--                   passava para não-super-admin.
--
--              Idempotente (seguro para reexecutar).
--              Aplicação manual no SQL Editor do Supabase (ver AGENTS.md).
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- =============================================================================
-- 1) Helper: o usuário tem a permissão (ou é super admin)?
-- =============================================================================
-- Retorna TRUE se o usuário autenticado:
--   a) tem a linha em cfg_profiles_access para a rota com a flag da ação
--      ligada (via users.profile_id → cfg_profiles), OU
--   b) é is_admin_super (bypass total, igual ao comportamento atual).
-- SECURITY DEFINER + SET search_path = public (padrão do repo,
-- ver 20260913_fix_mutable_search_path.sql).

CREATE OR REPLACE FUNCTION public.fc_has_route_permission(
    p_route_key character varying,
    p_action    character varying
)
RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
    SELECT COALESCE((
               SELECT TRUE
                 FROM public.users u
                 JOIN public.cfg_profiles p         ON p.id         = u.profile_id
                 JOIN public.cfg_profiles_access pa ON pa.profile_id = p.id
                 JOIN public.cfg_routes r           ON r.id          = pa.route_id
                WHERE u.uuid = auth.uid()
                  AND r.route_key = p_route_key
                  AND r.is_available = TRUE
                  AND CASE p_action
                        WHEN 'view'   THEN pa.can_view
                        WHEN 'create' THEN pa.can_create
                        WHEN 'edit'   THEN pa.can_edit
                        WHEN 'delete' THEN pa.can_delete
                        WHEN 'search' THEN pa.can_search
                        ELSE FALSE
                      END = TRUE
                LIMIT 1
           ), FALSE)
       OR COALESCE((
               SELECT TRUE
                 FROM public.users u
                WHERE u.uuid = auth.uid()
                  AND u.is_admin_super = TRUE
                LIMIT 1
           ), FALSE);
$$;

COMMENT ON FUNCTION public.fc_has_route_permission(character varying, character varying) IS
    'TRUE se o usuário autenticado possui a permissão (can_view/create/edit/delete/search) na rota informada, ou é is_admin_super';

REVOKE ALL ON FUNCTION public.fc_has_route_permission(character varying, character varying)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fc_has_route_permission(character varying, character varying)
    TO authenticated, service_role;

-- =============================================================================
-- 2) Policies de cfg_app_notices — permissão de rota somada ao super admin
-- =============================================================================
DO $$
BEGIN
    -- atuais
    DROP POLICY IF EXISTS "Notices: view"   ON public.cfg_app_notices;
    DROP POLICY IF EXISTS "Notices: insert" ON public.cfg_app_notices;
    DROP POLICY IF EXISTS "Notices: update" ON public.cfg_app_notices;
    DROP POLICY IF EXISTS "Notices: delete" ON public.cfg_app_notices;
    -- legadas (migrações antigas, caso reapliquem)
    DROP POLICY IF EXISTS "Notices: view active" ON public.cfg_app_notices;
    DROP POLICY IF EXISTS "Notices: super admin" ON public.cfg_app_notices;
    DROP POLICY IF EXISTS "Notices: create"      ON public.cfg_app_notices;
END $$;

-- SELECT: ativo + vigência (público — ticker/lista de quem não administra)
--         OU permissão de rota (vê a lista completa, inclusive inativos/expirados)
CREATE POLICY "Notices: view"
    ON public.cfg_app_notices FOR SELECT
    TO authenticated
    USING (
        (
            is_active = TRUE
            AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
            AND end_date   >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
        )
        OR public.fc_has_route_permission('app_notices', 'view')
    );

CREATE POLICY "Notices: insert"
    ON public.cfg_app_notices FOR INSERT
    TO authenticated
    WITH CHECK (
        public.fc_has_route_permission('app_notices', 'create')
    );

CREATE POLICY "Notices: update"
    ON public.cfg_app_notices FOR UPDATE
    TO authenticated
    USING (public.fc_has_route_permission('app_notices', 'edit'))
    WITH CHECK (public.fc_has_route_permission('app_notices', 'edit'));

CREATE POLICY "Notices: delete"
    ON public.cfg_app_notices FOR DELETE
    TO authenticated
    USING (
        public.fc_has_route_permission('app_notices', 'delete')
    );

-- =============================================================================
-- 3) Rota da MO Extra — chave divergente entre UI e banco
-- =============================================================================
-- UI: 'notices_workers_extra' (Sidebar.tsx, BottomNav.tsx, ExtraWorkersList.tsx)
-- Banco: 'extra_workers' (migration 20261003_create_cfg_app_notices_workers.sql)

-- 3a) Garante identidade à frente do MAX(id) (mesmo padrão da 20261003)
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

DO $$
DECLARE
    v_route_id bigint;
    v_created  boolean := FALSE;
BEGIN
    -- Renomeia a chave legada quando a nova ainda não existe
    -- (cfg_profiles_access referencia por route_id → grants preservados)
    IF EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'extra_workers')
       AND NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'notices_workers_extra') THEN
        UPDATE cfg_routes
           SET route_key = 'notices_workers_extra'
         WHERE route_key = 'extra_workers';
        RAISE NOTICE 'Rota extra_workers renomeada para notices_workers_extra';
    END IF;

    -- Cria a rota se não existir nenhuma das duas (ambiente nunca migrado)
    SELECT id INTO v_route_id
      FROM cfg_routes
     WHERE route_key = 'notices_workers_extra';

    IF v_route_id IS NULL THEN
        INSERT INTO cfg_routes (route_key, route_path, description, icon, parent_id, order_index, is_available)
        VALUES (
            'notices_workers_extra',
            '/notices/extra-workers',
            'Trabalhadores Extras',
            'groups',
            (SELECT id FROM cfg_routes WHERE route_key = 'app_notices'),
            60,
            true
        )
        RETURNING id INTO v_route_id;

        v_created := TRUE;
        RAISE NOTICE 'Rota notices_workers_extra criada (id %)', v_route_id;
    END IF;

    -- Concede view/edit aos perfis que têm app_notices — APENAS quando a
    -- rota foi criada agora (se já existia, os grants atuais são mantidos)
    IF v_created THEN
        INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
        SELECT pa.profile_id, v_route_id, true, false, true, false, false
        FROM cfg_profiles_access pa
        JOIN cfg_routes r ON r.id = pa.route_id
        WHERE r.route_key = 'app_notices'
          AND pa.can_view = TRUE
        ON CONFLICT (profile_id, route_id) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 4) Verificação
-- =============================================================================
-- 4a) Policies resultantes
SELECT policyname,
       cmd,
       qual,
       with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'cfg_app_notices'
 ORDER BY policyname;

-- 4b) Rota da MO Extra (deve existir só com a chave da UI)
SELECT id, route_key, route_path, description, parent_id, is_available
  FROM cfg_routes
 WHERE route_key IN ('app_notices', 'notices_workers_extra', 'extra_workers')
 ORDER BY id;

-- 4c) Perfis que passam a administrar avisos (rota app_notices)
SELECT p.id            AS profile_id,
       p.description   AS perfil,
       r.route_key,
       pa.can_view,
       pa.can_create,
       pa.can_edit,
       pa.can_delete,
       pa.can_search
  FROM cfg_profiles_access pa
  JOIN cfg_profiles p ON p.id = pa.profile_id
  JOIN cfg_routes   r ON r.id = pa.route_id
 WHERE r.route_key IN ('app_notices', 'notices_workers_extra')
 ORDER BY p.description, r.route_key;
