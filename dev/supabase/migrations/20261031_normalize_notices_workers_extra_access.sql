-- =====================================================
-- Migration: Normalizar acesso à rota notices_workers_extra (MO Extra)
-- Date: 2026-10-20
-- Description: Regra de produto definida pelo usuário: "uma vez na tela,
--              tem acesso total". A tela de MO Extra é operacional — quem
--              consegue abri-la (can_view) deve poder pesquisar unidades e
--              lançar/editar a MO extra. Não há sub-gate de can_edit /
--              can_search dentro da tela.
--
--              Problema corrigido: a migration 20261008 criou a rota com
--                  can_view = true, can_create = false, can_edit = true,
--                                            can_delete = false, can_search = false
--              e apenas para os perfis que JÁ tinham grant em app_notices no
--              momento da criação (IF v_created). Perfis criados/editados
--              depois, ou que herdaram a rota pela chave legada `extra_workers`,
--              ficaram com can_edit/can_search divergentes — a tela aparecia no
--              menu, mas os campos vinham somente-leitura.
--
--              Esta migration alinha TODOS os grants de notices_workers_extra
--              à regra da tela: can_view/can_edit/can_search = true,
--              can_create/can_delete = false (não há criar/excluir nessa tela).
--
--              Também garante que todo perfil que enxerga app_notices enxergue
--              notices_workers_extra (sem depender de v_created da 20261008).
--
--               1) renomeia a chave legada `extra_workers` → `notices_workers_extra`
--                  (grants preservados, pois referenciam route_id);
--               2) cria a rota se nenhuma das duas existir;
--               3) normaliza os grants existentes para a regra da tela;
--               4) propaga a rota a todo perfil que tem app_notices;
--               5) verificação (SELECT) do estado final.
--
--              IDEMPOTENTE: pode rodar mais de uma vez sem efeito colateral.
-- =====================================================

-- =============================================================================
-- 1) Identidade à frente do MAX(id) (mesmo padrão das migrations 20261003/08)
-- =============================================================================
SELECT setval(
    pg_get_serial_sequence('cfg_routes', 'id'),
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM cfg_routes),
        (SELECT last_value FROM cfg_routes_id_seq)
    )
);

-- =============================================================================
-- 2) Renomeia/cria a rota legada e normaliza os grants
-- =============================================================================
DO $$
DECLARE
    v_route_id bigint;
    v_created  boolean := FALSE;
BEGIN
    -- 2a) Renomeia a chave legada quando a nova ainda não existe
    IF EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'extra_workers')
       AND NOT EXISTS (SELECT 1 FROM cfg_routes WHERE route_key = 'notices_workers_extra') THEN
        UPDATE cfg_routes
           SET route_key = 'notices_workers_extra'
         WHERE route_key = 'extra_workers';
        RAISE NOTICE 'Rota extra_workers renomeada para notices_workers_extra';
    END IF;

    -- 2b) Cria a rota se não existir nenhuma das duas
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

    -- 2c) Normaliza os grants EXISTENTES para a regra da tela:
    --     quem entra (can_view) tem acesso total de leitura/edição/pesquisa.
    --     can_create/can_delete = false: a tela não cria nem exclui registros.
    UPDATE cfg_profiles_access
       SET can_view   = TRUE,
           can_edit   = TRUE,
           can_search = TRUE,
           can_create = FALSE,
           can_delete = FALSE
     WHERE route_id = v_route_id;
    RAISE NOTICE 'Grants normalizados para notices_workers_extra (route_id %)', v_route_id;

    -- 2d) Propaga a rota a todo perfil que enxerga app_notices.
    --     Inclui perfis criados/editados DEPOIS da 20261008.
    INSERT INTO cfg_profiles_access (profile_id, route_id, can_view, can_create, can_edit, can_delete, can_search)
    SELECT pa.profile_id, v_route_id, true, false, true, false, true
    FROM cfg_profiles_access pa
    JOIN cfg_routes r ON r.id = pa.route_id
    WHERE r.route_key = 'app_notices'
      AND pa.can_view = TRUE
    ON CONFLICT (profile_id, route_id) DO UPDATE
       SET can_view   = TRUE,
           can_edit   = TRUE,
           can_search = TRUE,
           can_create = FALSE,
           can_delete = FALSE;

    RAISE NOTICE 'Rota propagada a todos os perfis com app_notices';
END $$;

-- =============================================================================
-- 3) Verificação — estado final dos grants
-- =============================================================================
SELECT r.route_key,
       p.description                AS profile,
       pa.can_view,
       pa.can_create,
       pa.can_edit,
       pa.can_delete,
       pa.can_search
  FROM cfg_profiles_access pa
  JOIN cfg_routes  r ON r.id = pa.route_id
  JOIN cfg_profiles p ON p.id = pa.profile_id
 WHERE r.route_key = 'notices_workers_extra'
 ORDER BY p.description;
