-- =====================================================
-- Migration: Add updated_user_id to cfg_app_notices
-- Description: Registra o usuário que fez a última alteração do aviso
--              e expõe updated_by_name em v_app_notices.
--              Aplicação manual no SQL Editor do Supabase (ver AGENTS.md).
-- Timezone: America/Sao_Paulo (Brasília)
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- 1) Coluna que aponta para o usuário da última alteração --------------
ALTER TABLE public.cfg_app_notices
  ADD COLUMN IF NOT EXISTS updated_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_updated_user_id
  ON public.cfg_app_notices (updated_user_id);

-- 2) Recriação da view (sem CASCADE: nenhuma outra view/função depende
--    de v_app_notices — verificado por pg_depend e grep em dev/) ------
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
    n.updated_user_id,
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
    u.name_short AS creator_name_short,
    uu.name_full AS updated_by_name,
    uu.name_short AS updated_by_name_short,
    to_char(n.start_date, 'DD/MM/YYYY HH24:MI'::text) AS start_date_formatted,
    to_char(n.end_date, 'DD/MM/YYYY HH24:MI'::text) AS end_date_formatted,
    to_char(n.created_at, 'DD/MM/YYYY HH24:MI'::text) AS created_at_formatted
   FROM ((((public.cfg_app_notices n
     JOIN public.cfg_app_notices_categories c ON ((n.category_id = c.id)))
     JOIN public.cfg_app_notices_severities s ON ((n.severity_id = s.id)))
     LEFT JOIN public.users u ON ((n.created_user_id = u.id)))
     LEFT JOIN public.users uu ON ((n.updated_user_id = uu.id)));

-- 3) Grants (DROP VIEW remove os grants antigos) -----------------------
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
