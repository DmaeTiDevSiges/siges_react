-- =====================================================
-- Migration: Sistemas (system_parent) do aviso
-- Description: Associa um aviso a um ou mais sistemas pai. A MO Extra do
--              aviso passa a ser exibida/lançada apenas para unidades cujo
--              `units.system_parent_id` esteja entre os sistemas do aviso.
--
--              - `system_parent_ids BIGINT[]` espelha o padrão de
--                `dashboards TEXT[]`.
--              - Avisos existentes são migrados para os sistemas do cliente
--                DMAE Pluvial (id 1), mantendo a regra legada.
--              - A coluna fica NOT NULL e com pelo menos 1 sistema; o
--                formulário também exige a seleção.
--
--              Aplicar manualmente no SQL Editor do Supabase (ver AGENTS.md).
--              Idempotente (seguro para reexecutar).
--
--              Observação: se uma versão anterior desta migration chegou a ser
--              aplicada criando `client_ids`, ela ficou sem uso. Para limpar:
--                ALTER TABLE public.cfg_app_notices DROP COLUMN IF EXISTS client_ids;
-- Timezone: America/Sao_Paulo (Brasília)
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- 1) Coluna ------------------------------------------------------------------
ALTER TABLE public.cfg_app_notices
  ADD COLUMN IF NOT EXISTS system_parent_ids BIGINT[];

COMMENT ON COLUMN public.cfg_app_notices.system_parent_ids IS
  'Sistemas pai do aviso: a MO Extra só considera unidades com units.system_parent_id em system_parent_ids';

-- 2) Backfill dos avisos existentes (regra legada: DMAE Pluvial = 1) ---------
--    Os sistemas do Pluvial vêm das próprias unidades do cliente 1, sem
--    hardcode de ids (ex.: Drenagem Urbana, Proteção Contra Cheia, etc.).
UPDATE public.cfg_app_notices n
   SET system_parent_ids = (
     SELECT COALESCE(
       ARRAY_AGG(DISTINCT u.system_parent_id)
         FILTER (WHERE u.system_parent_id IS NOT NULL),
       ARRAY[10]::BIGINT[] -- fallback: Drenagem Urbana
     )
       FROM public.units u
       JOIN public.cfg_systems s ON s.id = u.system_parent_id
      WHERE u.client_id = 1
        AND u.is_deleted = false
        AND s.parent_id IS NULL
   )
 WHERE n.system_parent_ids IS NULL
    OR cardinality(n.system_parent_ids) = 0;

-- 3) Obrigatoriedade + sanidade ---------------------------------------------
ALTER TABLE public.cfg_app_notices
  ALTER COLUMN system_parent_ids SET DEFAULT ARRAY[10]::BIGINT[],
  ALTER COLUMN system_parent_ids SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'check_system_parent_ids_not_empty'
       AND conrelid = 'public.cfg_app_notices'::regclass
  ) THEN
    ALTER TABLE public.cfg_app_notices
      ADD CONSTRAINT check_system_parent_ids_not_empty
      CHECK (cardinality(system_parent_ids) >= 1);
  END IF;
END $$;

-- 4) Índice para consultas/filtros por sistema pai ---------------------------
CREATE INDEX IF NOT EXISTS idx_cfg_app_notices_system_parent_ids
  ON public.cfg_app_notices USING GIN (system_parent_ids);

-- 5) Recriação da view com as novas colunas ----------------------------------
--    DROP sem CASCADE: se houver dependentes, o Postgres falha com erro claro
--    (nada é apagado em cascata). Conforme AGENTS.md, nenhuma outra
--    view/função referencia v_app_notices — verificado por pg_depend e
--    grep em dev/. Base: definição da migration 20261007.
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
    n.system_parent_ids,
    ARRAY(
      SELECT s.description
        FROM public.cfg_systems s
       WHERE s.id = ANY(n.system_parent_ids)
         AND s.parent_id IS NULL
       ORDER BY s.id
    ) AS system_parent_names,
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

-- 6) Grants (DROP VIEW remove os grants antigos) -----------------------------
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
