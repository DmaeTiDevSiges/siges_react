-- =====================================================
-- Migration: Adicionar FK workers_period_id → períodos de MO extra
-- Date: 2026-10-20
-- Description: A migration 20261019 adicionou a coluna
--              cfg_app_notices_workers.workers_period_id, mas SEM a foreign
--              key para cfg_app_notices_workers_periods (só criou o índice).
--
--              Consequência: o embed do PostgREST falha com PGRST200
--                  "Could not find a relationship between
--                   'cfg_app_notices_workers' and
--                   'cfg_app_notices_workers_periods' in the schema cache"
--              porque a relação só é inferível a partir de uma FK declarada.
--              A query de listagem de lançamentos (getWorkersByNotice)
--              retornava 400 e a tela caía no catch → lista vazia.
--
--              Esta migration cria a FK (idempotente) e recarrega o cache
--              de schema do PostgREST.
--
--              Aplicar manualmente no SQL Editor do Supabase.
-- =====================================================

-- 1. FK faltante -------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_cfg_app_notices_workers_period'
          AND conrelid = 'public.cfg_app_notices_workers'::regclass
    ) THEN
        ALTER TABLE public.cfg_app_notices_workers
            ADD CONSTRAINT fk_cfg_app_notices_workers_period
            FOREIGN KEY (workers_period_id)
            REFERENCES public.cfg_app_notices_workers_periods(id)
            ON DELETE CASCADE;

        RAISE NOTICE 'FK fk_cfg_app_notices_workers_period criada';
    ELSE
        RAISE NOTICE 'FK fk_cfg_app_notices_workers_period já existe, ignorando';
    END IF;
END $$;

-- 2. Recarrega o schema cache do PostgREST -----------------------------
--    Sem isso o embed continua indisponível até o próximo reload do cache.
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 3. Verificação
-- =============================================================================
-- 3a) A FK existe e aponta para a tabela correta?
SELECT con.conname,
       src.relname  AS tabela,
       tgt.relname  AS referencia,
       pg_get_constraintdef(con.oid) AS definicao
  FROM pg_constraint con
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_class tgt ON tgt.oid = con.confrelid
 WHERE con.conname = 'fk_cfg_app_notices_workers_period';

-- 3b) Relacionamentos que o PostgREST enxerga para o embed
SELECT conname AS constraint,
       'cfg_app_notices_workers' AS origem,
       confrelid::regclass       AS destino
  FROM pg_constraint
 WHERE conrelid = 'public.cfg_app_notices_workers'::regclass
   AND contype  = 'f';
