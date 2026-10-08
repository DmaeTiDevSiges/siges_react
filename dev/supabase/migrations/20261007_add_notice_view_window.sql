-- =====================================================
-- Migration: Janela de visualização dos avisos do app
-- Description: Adiciona view_start_date / view_end_date (data/hora início e
--              fim de visualização) em cfg_app_notices, separados da
--              vigência (start_date/end_date).
--                - Vigência: validade do aviso — RLS "Notices: view",
--                  status Ativo/Expirado na lista e RPC
--                  increment_notice_view_count continuam usando start/end_date.
--                - Visualização: janela em que o aviso aparece no ticker
--                  (AppNoticeTicker / getActiveNotices).
--              Backfill copia a vigência para os avisos existentes e as
--              colunas ficam NOT NULL (campos obrigatórios no formulário,
--              sem fallback).
--              Aplicação manual no SQL Editor do Supabase (ver AGENTS.md).
-- Timezone: America/Sao_Paulo (Brasília)
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- 1) Colunas ----------------------------------------------------------------
ALTER TABLE public.cfg_app_notices
  ADD COLUMN IF NOT EXISTS view_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS view_end_date TIMESTAMP;

COMMENT ON COLUMN public.cfg_app_notices.view_start_date IS
  'Data/hora início da visualização (janela do ticker do app)';
COMMENT ON COLUMN public.cfg_app_notices.view_end_date IS
  'Data/hora fim da visualização (janela do ticker do app)';

-- 2) Backfill dos avisos existentes (senão somem do ticker) ------------------
UPDATE public.cfg_app_notices
   SET view_start_date = start_date,
       view_end_date   = end_date
 WHERE view_start_date IS NULL
    OR view_end_date IS NULL;

-- 3) Obrigatoriedade + sanidade ---------------------------------------------
ALTER TABLE public.cfg_app_notices
  ALTER COLUMN view_start_date SET NOT NULL,
  ALTER COLUMN view_end_date SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'check_view_end_after_start'
       AND conrelid = 'public.cfg_app_notices'::regclass
  ) THEN
    ALTER TABLE public.cfg_app_notices
      ADD CONSTRAINT check_view_end_after_start
      CHECK (view_end_date > view_start_date);
  END IF;
END $$;

-- 4) Índice para o filtro do ticker ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_view_window
  ON public.cfg_app_notices (is_active, view_start_date, view_end_date);

-- 5) Recriação da view com as novas colunas ----------------------------------
--    DROP sem CASCADE: se houver dependentes, o Postgres falha com erro claro
--    (nada é apagado em cascata). Conforme AGENTS.md, nenhuma outra
--    view/função referencia v_app_notices — verificado por pg_depend e
--    grep em dev/. Base: definição da migration 20261006.
DROP VIEW IF EXISTS public.v_app_notices;

CREATE VIEW public.v_app_notices WITH (security_invoker='true') AS
 SELECT n.id,
    n.title,
    n.message,
    n.category_id,
    n.severity_id,
    n.start_date,
    n.end_date,
    n.view_start_date,
    n.view_end_date,
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

-- 6) Grants (DROP VIEW remove os grants antigos) ----------------------------
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
