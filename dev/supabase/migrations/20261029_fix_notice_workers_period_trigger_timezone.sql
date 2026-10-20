-- =====================================================
-- Migration: Corrigir trigger de validação da janela de MO extra
-- Date: 2026-10-20
-- Description: A função cfg_app_notices_workers_periods_validate_janela
--              (criada na 20261019) declarava as variáveis da janela como
--              `timestamptz`, mas as colunas de origem (view_start_date /
--              view_end_date) e a coluna comparada (period_start) são
--              `timestamp WITHOUT time zone`.
--
--              A coerção para timestamptz usa o TimeZone da SESSÃO. Em
--              sessões fora de America/Sao_Paulo (ex.: conexões do pooler
--              abertas antes do ALTER DATABASE ... SET timezone), a janela
--              deslocava 3h e a comparação
--                  IF NEW.period_start >= janela_fim
--              passava a ser verdadeira, lançando
--                  'Período fora da janela de visualização do aviso'
--              e REJEITANDO o INSERT do lançamento.
--
--              Sintoma observado: ao acrescentar o contador, a unidade
--              aparece (merge otimista da UI) e, após o reload, é removida
--              — porque a linha nunca foi gravada.
--
--              Correção: comparar naive vs. naive (sem coerção), igual à
--              validação do app (parseBrazilDate). Também melhora a
--              mensagem de erro incluindo period_start.
--
--              Idempotente (CREATE OR REPLACE).
--              Aplicar manualmente no SQL Editor do Supabase.
-- =====================================================

CREATE OR REPLACE FUNCTION public.cfg_app_notices_workers_periods_validate_janela()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    janela_inicio timestamp;   -- sem fuso: mesma natureza de period_start
    janela_fim    timestamp;   -- sem fuso: mesma natureza de period_start
BEGIN
    SELECT n.view_start_date, n.view_end_date
      INTO janela_inicio, janela_fim
      FROM public.cfg_app_notices n
     WHERE n.id = NEW.notice_id;

    IF janela_inicio IS NULL OR janela_fim IS NULL THEN
        RAISE EXCEPTION 'Janela de visualização do aviso não configurada (view_start_date / view_end_date)';
    END IF;

    IF NEW.period_start < janela_inicio OR NEW.period_start >= janela_fim THEN
        RAISE EXCEPTION 'Período fora da janela de visualização do aviso (period_start = %, view_start_date = %, view_end_date = %)',
            NEW.period_start, janela_inicio, janela_fim;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger já existe (20261019) e aponta para a função acima (CREATE OR
-- REPLACE troca o corpo). Recria por segurança caso não exista.
DROP TRIGGER IF EXISTS trg_cfg_app_notices_workers_periods_validate_janela
    ON public.cfg_app_notices_workers_periods;
CREATE TRIGGER trg_cfg_app_notices_workers_periods_validate_janela
    BEFORE INSERT OR UPDATE OF period_start ON public.cfg_app_notices_workers_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.cfg_app_notices_workers_periods_validate_janela();

-- =============================================================================
-- Verificação: garantir que a função usa `timestamp` (sem fuso)
-- =============================================================================
SELECT p.proname,
       pg_get_functiondef(p.oid) AS definicao
  FROM pg_proc p
 WHERE p.proname = 'cfg_app_notices_workers_periods_validate_janela';
