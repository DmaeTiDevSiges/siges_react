-- ==============================================================================
-- Migration: 20261122_create_fn_offline_change_versions.sql
-- Modo offline — detectar inclusões, alterações e exclusões sem baixar tudo.
--
-- O download automático do app (services/offline/offlineAutoSync.ts) chama esta
-- função a cada poucos minutos com as unidades / tipos de ativo / tipos de OS que
-- já tem no aparelho. Ela devolve uma "versão" (texto) de cada grupo; o app baixa
-- de novo só o grupo cuja versão mudou.
--
-- Versão de tabela com datas = quantidade de linhas + maior data entre
-- created_at, updated_at e deleted_at:
--   inclusão → muda a quantidade e a data; alteração → muda updated_at;
--   exclusão lógica → muda deleted_at/updated_at; exclusão física → muda a quantidade.
-- Tabelas SEM datas (cfg_orders_types_activities, cfg_activities) → md5 do conteúdo.
--
-- Grupos:
--   units        unidade → ativos (assets) + setores (cfg_units_assets_tags)
--   asset_types  tipo de ativo → planos + seções + atividades das seções
--   order_types  tipo de OS → atividades (cfg_orders_types_activities + cfg_activities)
--   materials    materiais da empresa prestadora (estoque NÃO entra: muda o tempo todo)
--   vehicles     veículos da empresa
--   users        usuários (a tela de equipe usa a lista geral)
--
-- SECURITY INVOKER: roda com o RLS de quem chama (só conta o que ele enxerga —
-- o mesmo que o app baixa). Somente leitura (STABLE).
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Sem esta função o app continua funcionando: refaz cada grupo após 1 dia.
-- Reverter: 20261122_create_fn_offline_change_versions_DOWN.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_offline_change_versions(
    p_company_id     BIGINT,
    p_unit_ids       BIGINT[] DEFAULT '{}',
    p_asset_type_ids BIGINT[] DEFAULT '{}',
    p_order_type_ids BIGINT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
SELECT jsonb_build_object(
    'units', COALESCE((
        SELECT jsonb_object_agg(x.unit_id::text,
            (SELECT count(*) || ':' || COALESCE(max(GREATEST(a.created_at, a.updated_at, a.deleted_at))::text, '')
               FROM public.assets a WHERE a.unit_id = x.unit_id)
            || '|' ||
            (SELECT count(*) || ':' || COALESCE(max(GREATEST(t.created_at, t.updated_at, t.deleted_at))::text, '')
               FROM public.cfg_units_assets_tags t WHERE t.unit_id = x.unit_id))
          FROM (SELECT DISTINCT unnest(p_unit_ids) AS unit_id) x
    ), '{}'::jsonb),

    'asset_types', COALESCE((
        SELECT jsonb_object_agg(x.type_id::text,
            (SELECT count(*) || ':' || COALESCE(max(GREATEST(p.created_at, p.updated_at, p.deleted_at))::text, '')
               FROM public.maintenances_plans p WHERE p.asset_type_id = x.type_id)
            || '|' ||
            (SELECT count(*) || ':' || COALESCE(max(GREATEST(s.created_at, s.updated_at, s.deleted_at))::text, '')
               FROM public.maintenances_plans_sections s
               JOIN public.maintenances_plans p ON p.id = s.maintenance_plan_id
              WHERE p.asset_type_id = x.type_id)
            || '|' ||
            (SELECT count(*) || ':' || COALESCE(max(GREATEST(sa.created_at, sa.updated_at, sa.deleted_at))::text, '')
               FROM public.maintenances_plans_sections_activities sa
               JOIN public.maintenances_plans_sections s ON s.id = sa.maintenance_plan_section_id
               JOIN public.maintenances_plans p ON p.id = s.maintenance_plan_id
              WHERE p.asset_type_id = x.type_id))
          FROM (SELECT DISTINCT unnest(p_asset_type_ids) AS type_id) x
    ), '{}'::jsonb),

    'order_types', COALESCE((
        SELECT jsonb_object_agg(x.type_id::text, COALESCE((
            SELECT md5(string_agg(
                       concat_ws(':', ota.id, ota.activity_id, ota.is_available,
                                 ca.description, ca.code, ca.is_available, ca.is_deleted),
                       ',' ORDER BY ota.id))
              FROM public.cfg_orders_types_activities ota
              LEFT JOIN public.cfg_activities ca ON ca.id = ota.activity_id
             WHERE ota.o_type_id = x.type_id), ''))
          FROM (SELECT DISTINCT unnest(p_order_type_ids) AS type_id) x
    ), '{}'::jsonb),

    'materials', (
        SELECT count(*) || ':' || COALESCE(max(GREATEST(m.created_at, m.updated_at, m.deleted_at))::text, '')
          FROM public.materials m WHERE m.provider_company_id = p_company_id),

    'vehicles', (
        SELECT count(*) || ':' || COALESCE(max(GREATEST(v.created_at, v.updated_at, v.deleted_at))::text, '')
          FROM public.vehicles v WHERE v.company_id = p_company_id),

    'users', (
        SELECT count(*) || ':' || COALESCE(max(GREATEST(u.created_at, u.updated_at))::text, '')
          FROM public.users u)
);
$$;

COMMENT ON FUNCTION public.fn_offline_change_versions(BIGINT, BIGINT[], BIGINT[], BIGINT[]) IS
    'Modo offline: versão (contagem + última data, ou md5) de cada grupo de dados baixado no aparelho; o app baixa de novo só o que mudou.';

REVOKE ALL ON FUNCTION public.fn_offline_change_versions(BIGINT, BIGINT[], BIGINT[], BIGINT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_offline_change_versions(BIGINT, BIGINT[], BIGINT[], BIGINT[]) TO authenticated, service_role;

-- Conferência (troque os ids):
--   SELECT public.fn_offline_change_versions(2, ARRAY[10, 11]::bigint[], ARRAY[5]::bigint[], ARRAY[3]::bigint[]);
--   -- Altere um ativo da unidade 10 e rode de novo: só "units"."10" muda.
