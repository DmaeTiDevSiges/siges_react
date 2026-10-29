-- =============================================================================
-- Script de Validação e Correção — Fase 1C (Dados e Observação)
-- Runbook: docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md §6
-- Plano:   docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md §4.3
--
-- Objetivo: resolver pendências de dados antes de ligar RLS (Fase 1D).
-- Impacto na web antiga: nenhum de schema. Correções de dados podem mudar exibição.
--
-- NÃO LIGAR RLS NESTA FASE.
-- =============================================================================

SET lock_timeout = '5s';

-- =============================================================================
-- 1. UNIDADES SEM CLIENTE (73 hoje)
-- Decisão: mapear para pelo menos 1 cliente OU deixar admin-only (clients_ids = {})
-- =============================================================================

-- Lista completa para decisão
SELECT
  u.id,
  u.code,
  u.description,
  u.client_id,
  u.clients_ids,
  u.is_deleted
FROM public.units u
WHERE u.client_id IS NULL
ORDER BY u.description;

-- Contagem
SELECT count(*) AS unidades_sem_cliente
FROM public.units
WHERE client_id IS NULL;

-- Exemplos de unidades sem cliente para decidir destino
-- (Substitua <cliente_id> pelo ID do cliente escolhido)
-- UPDATE public.units
-- SET client_id = <cliente_id>, clients_ids = ARRAY[<cliente_id>]::bigint[]
-- WHERE client_id IS NULL
--   AND id IN (<lista_de_ids>);

-- =============================================================================
-- 2. CLIENTS INVÁLIDOS (client_id inexistente ou 0)
-- Decisão: corrigir para cliente válido OU tratar como vazio (client_id = NULL, clients_ids = {})
-- =============================================================================

-- Clientes inválidos (client_id não existe na tabela clients)
SELECT DISTINCT
  u.client_id,
  count(*) AS unidades
FROM public.units u
LEFT JOIN public.clients c ON c.id = u.client_id
WHERE u.client_id IS NOT NULL
  AND c.id IS NULL
GROUP BY u.client_id;

-- Detalhe das unidades com client_id inválido
SELECT
  u.id,
  u.code,
  u.description,
  u.client_id,
  u.clients_ids
FROM public.units u
LEFT JOIN public.clients c ON c.id = u.client_id
WHERE u.client_id IS NOT NULL
  AND c.id IS NULL
ORDER BY u.description;

-- client_id = 0 (valor inválido explícito)
SELECT
  u.id,
  u.code,
  u.description,
  u.client_id,
  u.clients_ids
FROM public.units u
WHERE u.client_id = 0
ORDER BY u.description;

-- =============================================================================
-- 3. ASSETS SEM UNIDADE (unit_id nulo)
-- Decisão: atribuir unidade OU fallback temporário
-- =============================================================================

SELECT count(*) AS assets_sem_unidade
FROM public.assets
WHERE unit_id IS NULL;

-- Detalhe dos assets sem unidade
SELECT
  a.id,
  a.code,
  a.description,
  a.unit_id,
  a.status_id
FROM public.assets a
WHERE a.unit_id IS NULL
ORDER BY a.description;

-- =============================================================================
-- 4. ORDERS NULOS / 0 / DIVERGENTES
-- Decisão: corrigir antes do RLS (Fase 1D usa orders.client_id para escopo)
-- =============================================================================

-- Resumo
SELECT
  count(*) FILTER (WHERE o.client_id IS NULL) AS orders_client_id_nulo,
  count(*) FILTER (WHERE o.client_id = 0)     AS orders_client_id_zero,
  count(*) FILTER (
    WHERE u.client_id IS NOT NULL
      AND o.client_id IS DISTINCT FROM u.client_id
  )                                            AS orders_divergentes
FROM public.orders o
LEFT JOIN public.units u ON u.id = o.unit_id;

-- Orders com client_id nulo
SELECT
  o.id,
  o.order_mask,
  o.client_id,
  o.unit_id,
  u.client_id AS unidade_client_id
FROM public.orders o
LEFT JOIN public.units u ON u.id = o.unit_id
WHERE o.client_id IS NULL
ORDER BY o.id;

-- Orders com client_id = 0
SELECT
  o.id,
  o.order_mask,
  o.client_id,
  o.unit_id
FROM public.orders o
WHERE o.client_id = 0
ORDER BY o.id;

-- Orders divergentes (order.client_id != units.client_id)
SELECT
  o.id,
  o.order_mask,
  o.client_id    AS order_client_id,
  o.unit_id,
  u.client_id    AS unidade_client_id
FROM public.orders o
LEFT JOIN public.units u ON u.id = o.unit_id
WHERE u.client_id IS NOT NULL
  AND o.client_id IS DISTINCT FROM u.client_id
ORDER BY o.id;

-- =============================================================================
-- 5. CONSISTÊNCIA client_id x clients_ids (deve ser 0 após Fase 1A/1B)
-- =============================================================================

-- Divergências (deve retornar 0)
SELECT count(*) AS divergencias
FROM public.units
WHERE client_id IS NOT NULL
  AND (cardinality(clients_ids) <> 1 OR clients_ids[1] <> client_id);

-- Escalar nulo com array preenchido (deve retornar 0)
SELECT count(*) AS escalar_nulo_array_preenchido
FROM public.units
WHERE client_id IS NULL
  AND cardinality(clients_ids) > 0;

-- NULL dentro do array (deve retornar 0)
SELECT count(*) AS null_no_array
FROM public.units
WHERE EXISTS (SELECT 1 FROM unnest(clients_ids) x WHERE x IS NULL);

-- =============================================================================
-- 6. UNIDADES COM clients_ids = '{}' (sem acesso nos módulos escopados)
-- Semântica: '{}' = sem acesso, NÃO "todos"
-- =============================================================================

SELECT
  u.id,
  u.code,
  u.description,
  u.client_id,
  u.clients_ids
FROM public.units u
WHERE cardinality(u.clients_ids) = 0
ORDER BY u.description;

-- =============================================================================
-- 7. EXEMPLOS DE CORREÇÃO (descomentar e adaptar antes de executar)
-- =============================================================================

-- Exemplo A: Mapear unidade sem cliente para um cliente existente
-- UPDATE public.units
-- SET client_id = <cliente_id_valido>,
--     clients_ids = ARRAY[<cliente_id_valido>]::bigint[]
-- WHERE id = <unidade_id>;

-- Exemplo B: Marcar client_id inválido como vazio
-- UPDATE public.units
-- SET client_id = NULL,
--     clients_ids = '{}'::bigint[]
-- WHERE client_id = 0
--   OR client_id NOT IN (SELECT id FROM public.clients);

-- Exemplo C: Corrigir order com client_id nulo usando o client_id da unidade
-- UPDATE public.orders o
-- SET client_id = u.client_id
-- FROM public.units u
-- WHERE o.unit_id = u.id
--   AND o.client_id IS NULL
--   AND u.client_id IS NOT NULL;

-- Exemplo D: Corrigir order com client_id = 0
-- UPDATE public.orders o
-- SET client_id = u.client_id
-- FROM public.units u
-- WHERE o.unit_id = u.id
--   AND o.client_id = 0
--   AND u.client_id IS NOT NULL;

-- =============================================================================
-- 8. RESUMO FINAL (depois das correções, deve retornar 0 em tudo)
-- =============================================================================

SELECT
  (SELECT count(*) FROM public.units WHERE client_id IS NULL) AS unidades_sem_cliente,
  (SELECT count(*) FROM public.units u
     LEFT JOIN public.clients c ON c.id = u.client_id
     WHERE u.client_id IS NOT NULL AND c.id IS NULL) AS clients_invalidos,
  (SELECT count(*) FROM public.assets WHERE unit_id IS NULL) AS assets_sem_unidade,
  (SELECT count(*) FROM public.units
     WHERE client_id IS NOT NULL
       AND (cardinality(clients_ids) <> 1 OR clients_ids[1] <> client_id)) AS divergencias_client_id_clients_ids;

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
