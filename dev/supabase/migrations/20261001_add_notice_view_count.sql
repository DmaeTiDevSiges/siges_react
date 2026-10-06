-- =============================================================================
-- Migration: Contador de visualizações dos avisos do app
-- Date: 2026-10-01
-- Purpose:
--   Adiciona coluna view_count em cfg_app_notices e função RPC
--   increment_notice_view_count(p_notice_id) para incrementar o contador
--   de forma atômica, sem expor UPDATE direto na tabela ao usuário comum.
--
--   O UPDATE direto na tabela é restrito a super admin (RLS "Notices: update").
--   Por isso o incremento é feito via SECURITY DEFINER, validando que o aviso
--   está ativo e dentro do período de exibição (mesma regra do RLS de SELECT).
--
--   Observação: a view v_app_notices tem lista de colunas EXPLÍCITA e o
--   CREATE OR REPLACE não admite adicionar colunas (daria erro
--   "cannot change name of existing column"). Por isso a seção 4 faz
--   DROP VIEW (SEM CASCADE) + CREATE VIEW + regrants.
--   O DROP sem CASCADE é proposital: se existir alguma dependente, o Postgres
--   aborta a migration com erro explícito em vez de apagá-las silenciosamente.
--
--   Efeito colateral aceito: o trigger trigger_update_cfg_app_notices_updated_at
--   também dispara neste UPDATE, refletindo updated_at. A coluna não é exibida
--   nem usada para ordenação em nenhum ponto do app.
-- =============================================================================

-- 1) Nova coluna ----------------------------------------------------------------
ALTER TABLE public.cfg_app_notices
    ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.cfg_app_notices.view_count IS
    'Contador de visualizações (incrementado a cada abertura do detalhe do aviso)';

-- 2) Função RPC de incremento (segura para qualquer usuário autenticado) ---------
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
       AND start_date <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
       AND end_date   >= (NOW() AT TIME ZONE 'America/Sao_Paulo')
    RETURNING view_count INTO v_new_count;

    -- Aviso inexistente/inativo/fora do período: retorna 0 sem erro
    RETURN COALESCE(v_new_count, 0);
END;
$$;

-- 3) Permissões da função --------------------------------------------------------
REVOKE ALL ON FUNCTION public.increment_notice_view_count(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_notice_view_count(INTEGER) TO authenticated;

-- 4) Recria a view com a nova coluna --------------------------------------------
--    DROP sem CASCADE: se houver dependentes, o Postgres falha com erro claro
--    (nada é apagado em cascata). Conforme AGENTS.md, valide os dependentes
--    antes de rodar: nenhuma outra view/função referencia v_app_notices.
DROP VIEW IF EXISTS public.v_app_notices;

CREATE VIEW public.v_app_notices WITH (security_invoker='true') AS
 SELECT n.id,
    n.title,
    n.message,
    n.category_id,
    n.severity_id,
    n.start_date,
    n.end_date,
    n.created_at,
    n.updated_at,
    n.is_active,
    n.dashboards,
    n.created_user_id,
    n.view_count,
    c.code AS category_code,
    c.label AS category_label,
    c.color AS category_color,
    c.icon AS category_icon,
    s.code AS severity_code,
    s.label AS severity_label,
    s.color AS severity_color,
    s.icon AS severity_icon,
    u.name_full AS creator_name,
    to_char(n.start_date, 'DD/MM/YYYY HH24:MI'::text) AS start_date_formatted,
    to_char(n.end_date, 'DD/MM/YYYY HH24:MI'::text) AS end_date_formatted,
    to_char(n.created_at, 'DD/MM/YYYY HH24:MI'::text) AS created_at_formatted
   FROM (((public.cfg_app_notices n
     JOIN public.cfg_app_notices_categories c ON ((n.category_id = c.id)))
     JOIN public.cfg_app_notices_severities s ON ((n.severity_id = s.id)))
     LEFT JOIN public.users u ON ((n.created_user_id = u.id)));

-- 5) Grants (DROP VIEW remove os grants antigos) --------------------------------
DO $$
DECLARE
    r TEXT;
BEGIN
    FOREACH r IN ARRAY ARRAY['postgres', 'anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('GRANT ALL ON public.v_app_notices TO %I', r);
        END IF;
    END LOOP;

    -- Roles de leitura de data-warehouse (existem em alguns ambientes)
    FOREACH r IN ARRAY ARRAY['databasus-e163795d', 'databasus-93da8106', 'databasus-3a3c9dfb'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('GRANT SELECT ON public.v_app_notices TO %I', r);
        END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        ALTER VIEW public.v_app_notices OWNER TO supabase_admin;
    END IF;
END $$;
