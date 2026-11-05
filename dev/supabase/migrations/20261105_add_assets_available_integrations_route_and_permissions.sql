-- ==============================================================================
-- Migration: 20261105_add_assets_available_integrations_route_and_permissions.sql
-- Plano: docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md (Fase 4 — administração)
-- Aplicar manualmente no SQL Editor do Supabase após 20261104.
--
-- O que esta migration entrega:
--   1. Rota grupo dashboard_assets_available_integrations
--      (parent dashboard, sem vínculo direto com o grupo de ativos).
--   2. Permissões administrativas completas:
--        view / create / edit / delete / mapeamento / logs.
--   3. Suporte ao mapeamento de motivo externo (já previsto nas constraints
--      e na RPC existentes de ingestão, que usam config.reason_map).
--
-- Decisão de escopo:
--   * O grupo é um "dashboard admin" porque trata da administração de uma
--     origem operacional de disponibilidade, não da busca geral de ativos do
--     usuário final. Ele segue a convenção dos demais grupos dashboard admin
--     (ex.: dashboard_contracts_evaluations, dashboard_teams_shifts_calendar).
--   * A permissão chave é dashboard_assets_available_integrations. A tela do
--     SIGES usa ela como principl para mostrar o grupo e as telas filhas no
--     mapa de permissões (can_view ativa o grupo; can_create/edit/delete/mapeamento
--     habilitam as ações correspondentes).
--   * Mapeamento de motivo externo: está incluso porque a migration de Fase 1
--     já cria a estrutura e validação para config.reason_map e a RPC já o resolve.
--     Não se cria coluna nova aqui; o adaptador da integração é quem declara o
--     mapeamento externo → cfg_assets_unavailable_reasons.id via a config não secreta.
-- ============================================================================

BEGIN;

-- ── 0) Sequência ────────────────────────────────────────────────────────────
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- ── 1) Grupo: administração de integrações de disponibilidade ───────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM cfg_routes
        WHERE route_key = 'dashboard_assets_available_integrations'
    ) THEN
        INSERT INTO public.cfg_routes (
            route_key,
            route_path,
            description,
            icon,
            parent_id,
            order_index,
            is_available,
            is_visible_to_admin
        )
        VALUES (
            'dashboard_assets_available_integrations',
            '/dashboard/assets-available-integrations',
            'Integrações de disponibilidade de ativos',
            'integrations',
            (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard'),
            40,
            true,
            true
        );
        RAISE NOTICE 'Rota dashboard_assets_available_integrations criada com sucesso';
    ELSE
        RAISE NOTICE 'Rota dashboard_assets_available_integrations já existe, ignorando';
    END IF;
END
$$;

-- ── 2) Permissões administrativas ───────────────────────────────────────────
--    Um perfil pode ter qualquer combinação dessas ações; a tela lê apenas
--    as ações que o usuário realmente possui e oculta o resto.
--    routerKey raiz (view) controla a presença do grupo no menu/mapa.
--
-- Exploratório útil antes de liberar o grupo para outros perfis:
--   SELECT r.route_key,
--          r.route_path,
--          r.description,
--          r.icon,
--          r.is_visible_to_admin,
--          ftf.name AS table_name
--     FROM public.cfg_routes r
--     LEFT JOIN public.pg_catalog.pg_class ftc ON ftc.relname = r.route_key
--    WHERE r.route_key LIKE 'dashboard_assets_available_integrations%'
--    ORDER BY r.order_index;
--
-- Exploratório útil para documentar os metadados dos endpoints externos:
--   SELECT id,
--          name,
--          provider_code,
--          base_url,
--          is_active,
--          created_at AT TIME ZONE 'America/Sao_Paulo' AS created_at_sp,
--          updated_at AT TIME ZONE 'America/Sao_Paulo' AS updated_at_sp
--     FROM public.cfg_assets_available_integrations
--    ORDER BY company_id, name;
--
-- INSERT INTO public.cfg_routes (
    route_key,
    route_path,
    description,
    icon,
    parent_id,
    order_index,
    is_available,
    is_visible_to_admin
)
VALUES
    (
        'dashboard_assets_available_integrations_view',
        '/dashboard/assets-available-integrations',
        'Ver integrações de disponibilidade de ativos',
        'integrations',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        10,
        true,
        true
    ),
    (
        'dashboard_assets_available_integrations_create',
        '/dashboard/assets-available-integrations/nova',
        'Cadastrar integração de disponibilidade de ativos',
        'add_circle',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        20,
        true,
        true
    ),
    (
        'dashboard_assets_available_integrations_edit',
        '/dashboard/assets-available-integrations/:id/editar',
        'Editar integração de disponibilidade de ativos',
        'edit_note',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        30,
        true,
        true
    ),
    (
        'dashboard_assets_available_integrations_delete',
        '/dashboard/assets-available-integrations/:id/excluir',
        'Excluir integração de disponibilidade de ativos',
        'delete',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        40,
        true,
        true
    ),
    (
        'dashboard_assets_available_integrations_mappings',
        '/dashboard/assets-available-integrations/:id/mapeamentos',
        'Gerenciar mapeamentos de integração de disponibilidade de ativos',
        'link',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        50,
        true,
        true
    ),
    (
        'dashboard_assets_available_integrations_logs',
        '/dashboard/assets-available-integrations/:id/logs',
        'Consultar logs de integração de disponibilidade de ativos',
        'history',
        (SELECT id FROM public.cfg_routes WHERE route_key = 'dashboard_assets_available_integrations'),
        60,
        true,
        true
    )
ON CONFLICT (route_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
