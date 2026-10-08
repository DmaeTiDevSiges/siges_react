-- =====================================================
-- Migration: Remove o critério de vigência (start_date/end_date)
--             da exibição dos avisos no header (ticker)
-- Date: 2026-10-08
-- Description: A exibição do ticker passa a considerar apenas:
--                1) is_active = TRUE
--                2) janela de visualização (view_start_date/view_end_date)
--
--              Antes, o aviso precisava estar ativo E dentro da vigência
--              E dentro da janela de visualização. Agora a vigência deixa
--              de ser critério de exibição (permanece como dado administrativo:
--              lista de avisos, status Ativo/Expirado e constraint da tabela).
--
--              Esta migration ajusta as duas camadas de banco que aplicavam
--              a vigência para usuários comuns:
--                1) policy RLS "Notices: view" (SELECT de cfg_app_notices /
--                   v_app_notices via security_invoker);
--                2) função RPC increment_notice_view_count (validava a vigência
--                   antes de incrementar o contador — um aviso fora da vigência
--                   retornava 0 e o clique não contava).
--
--              Quem tem a rota app_notices com can_view (ou is_admin_super)
--              continua vendo a lista completa (inativos/expirados), como antes.
--
--              Idempotente (seguro para reexecutar).
--              Aplicação manual no SQL Editor do Supabase (ver AGENTS.md).
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- =============================================================================
-- 1) Policy "Notices: view" — sem checagem de vigência
-- =============================================================================
-- SELECT: ativo + janela de visualização no cliente (ticker)
--         OU permissão de rota (vê a lista completa, inclusive inativos/expirados)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Notices: view" ON public.cfg_app_notices;
END $$;

CREATE POLICY "Notices: view"
    ON public.cfg_app_notices FOR SELECT
    TO authenticated
    USING (
        is_active = TRUE
        OR public.fc_has_route_permission('app_notices', 'view')
    );

-- =============================================================================
-- 2) RPC increment_notice_view_count — sem checagem de vigência
-- =============================================================================
-- Mantém apenas a validação is_active: o contador reflete o que o ticker mostra.
CREATE OR REPLACE FUNCTION public.increment_notice_view_count(p_notice_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    UPDATE public.cfg_app_notices
       SET view_count = COALESCE(view_count, 0) + 1
     WHERE id = p_notice_id
       AND is_active = TRUE
    RETURNING view_count INTO v_new_count;

    -- Aviso inexistente/inativo: retorna 0 sem erro
    RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_notice_view_count(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_notice_view_count(INTEGER) TO authenticated;

-- =============================================================================
-- 3) Verificação
-- =============================================================================
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'cfg_app_notices'
 ORDER BY policyname;

SELECT prosrc
  FROM pg_proc
 WHERE proname = 'increment_notice_view_count'
   AND pronargs = 1;
