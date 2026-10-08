-- =============================================================================
-- Migration: garante DEFAULT em public.warehouses_materials.id
-- Data: 2026-10-07
-- =============================================================================
-- Problema observado (POST /rest/v1/warehouses_materials -> 400):
--   23502 | null value in column "id" of relation "warehouses_materials"
--          violates not-null constraint
--
-- Ocorre em todo INSERT que não envia id explicitamente:
--   • materialsService.createMaterial (criar material + estoque inicial)
--   • warehouseService.createWarehouseMaterial (adicionar almoxarifado ao material)
--
-- Diagnóstico feito via REST em 2026-10-07: um INSERT sem id e com
-- warehouse_id/material_id inexistentes falhou por 23502 (not-null) ANTES do
-- check de FK (23503) => comprovadamente a coluna id está sem DEFAULT, embora
-- o dump de referência (dev/supabase/dump_export/schema_public.sql:12292) tenha
-- o "SET DEFAULT nextval(...)". Ou seja, o banco vivo diverge do dump.
--
-- Idempotente e aditiva: apenas CREATE SEQUENCE IF NOT EXISTS + SET DEFAULT +
-- realinhamento da sequência. Nenhum DROP, nenhuma alteração de dados.
-- Aplicação: manual, no SQL Editor do Supabase (ver AGENTS.md).
-- =============================================================================

-- 1) Sequência (mesma definição do dump: AS integer, START WITH 1)
CREATE SEQUENCE IF NOT EXISTS public.warehouses_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 2) Sequência dona da coluna (no-op se já for o caso)
ALTER SEQUENCE public.warehouses_materials_id_seq
    OWNED BY public.warehouses_materials.id;

-- 3) DEFAULT da coluna — é isto que o INSERT precisa
ALTER TABLE public.warehouses_materials
    ALTER COLUMN id SET DEFAULT nextval('public.warehouses_materials_id_seq'::regclass);

-- 4) Realinha a sequência com o maior id existente (próximo livre = MAX+1)
SELECT setval(
    'public.warehouses_materials_id_seq',
    COALESCE((SELECT MAX(id) FROM public.warehouses_materials), 0) + 1,
    false
);

-- 5) Conferência (deve retornar uma linha com column_default preenchido)
SELECT c.column_name,
       c.is_nullable,
       c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'warehouses_materials'
  AND c.column_name = 'id';
