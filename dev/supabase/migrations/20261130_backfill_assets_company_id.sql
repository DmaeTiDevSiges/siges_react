-- ==============================================================================
-- Migration: 20261130_backfill_assets_company_id.sql
-- Ativos criados/duplicados pelo app ficavam com assets.company_id em branco
-- (o insert não gravava a empresa). O app já passou a preencher; esta migration
-- corrige os ativos antigos.
--
-- Ordem de origem (a mesma do app): empresa da unidade → empresa do cliente → 1.
-- Só mexe em linhas com company_id NULL. Idempotente. Aplicar manualmente no
-- SQL Editor do Supabase.
--
-- ANTES, para ver o tamanho do problema e de onde virá cada empresa:
--   SELECT count(*) FILTER (WHERE a.company_id IS NULL)                        AS em_branco,
--          count(*) FILTER (WHERE a.company_id IS NULL AND u.company_id IS NOT NULL) AS via_unidade,
--          count(*) FILTER (WHERE a.company_id IS NULL AND u.company_id IS NULL
--                                AND c.company_id IS NOT NULL)                AS via_cliente,
--          count(*) FILTER (WHERE a.company_id IS NULL AND u.company_id IS NULL
--                                AND c.company_id IS NULL)                    AS padrao_1
--     FROM public.assets a
--     LEFT JOIN public.units   u ON u.id = a.unit_id
--     LEFT JOIN public.clients c ON c.id = a.client_id;
-- ==============================================================================

BEGIN;

UPDATE public.assets a
   SET company_id = COALESCE(u.company_id, c.company_id, 1)
  FROM public.assets a2
  LEFT JOIN public.units   u ON u.id = a2.unit_id
  LEFT JOIN public.clients c ON c.id = a2.client_id
 WHERE a.id = a2.id
   AND a.company_id IS NULL;

COMMIT;

-- Conferência (deve voltar 0):
--   SELECT count(*) FROM public.assets WHERE company_id IS NULL;
