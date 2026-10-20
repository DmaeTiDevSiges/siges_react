-- =====================================================
-- Migration: Permitir VÁRIAS escalas (turnos) no mesmo aviso/dia
-- Date: 2026-10-20
-- Description: Regra de negócio definida pelo usuário: "eu posso ter várias
--              escalas no mesmo dia". O modelo anterior assumia uma linha do
--              tempo CONTÍNUA com no máximo um período em aberto por aviso.
--
--              Mudanças:
--                1) remove uq_notice_workers_period_open (um único
--                   period_end IS NULL por aviso) — é a trava estrutural que
--                   impedia mais de um turno vigente;
--                2) a trigger de sobreposição passa a agir como REDE DE
--                   SEGURANÇA: o app encadeia automaticamente as escalas
--                   (corta o fim da anterior no início da nova / estica a nova
--                   para cobrir o vão) ANTES de inserir, então no INSERT não
--                   deve haver sobreposição. A trigger rejeita qualquer
--                   sobreposição que escape da lógica do app;
--                3) trigger da janela passa a validar period_end além de
--                   period_start — um turno não pode "vazar" para fora da
--                   janela de visualização;
--                4) turnos passam a TER period_end (não há mais "aberto
--                   indefinidamente"): o app cria turnos fechados.
--
--              Compatibilidade: períodos ANTIGOS em aberto (period_end IS
--              NULL) continuam válidos e são tratados pelo app como válidos
--              até view_end_date (effectiveEnd). Nada é convertido aqui.
--
--              Idempotente. Aplicar manualmente no SQL Editor do Supabase.
-- =====================================================

-- 1. Remove a trava de "um único período aberto" ------------------------
DROP INDEX IF EXISTS public.uq_notice_workers_period_open;

-- 2. Trigger de janela: validar period_start E period_end ---------------
--    Além da janela, impede SOBREPOSIÇÃO entre turnos do mesmo aviso.
--    (A sobreposição era antes impossível por construção — um aberto por
--    vez; agora que vários turnos coexistem, precisa ser validada.)
CREATE OR REPLACE FUNCTION public.cfg_app_notices_workers_periods_validate_janela()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    janela_inicio timestamp;   -- sem fuso: mesma natureza de period_start
    janela_fim    timestamp;   -- sem fuso: mesma natureza de period_start
    conflito_id   bigint;
    conflito_ini  timestamp;
    conflito_fim  timestamp;
BEGIN
    SELECT n.view_start_date, n.view_end_date
      INTO janela_inicio, janela_fim
      FROM public.cfg_app_notices n
     WHERE n.id = NEW.notice_id;

    IF janela_inicio IS NULL OR janela_fim IS NULL THEN
        RAISE EXCEPTION 'Janela de visualização do aviso não configurada (view_start_date / view_end_date)';
    END IF;

    -- 2a) O turno deve começar e terminar dentro da janela
    IF NEW.period_start < janela_inicio OR NEW.period_start >= janela_fim THEN
        RAISE EXCEPTION 'Período fora da janela de visualização do aviso (period_start = %, view_start_date = %, view_end_date = %)',
            NEW.period_start, janela_inicio, janela_fim;
    END IF;

    IF NEW.period_end IS NOT NULL AND NEW.period_end > janela_fim THEN
        RAISE EXCEPTION 'Fim do período após a janela de visualização do aviso (period_end = %, view_end_date = %)',
            NEW.period_end, janela_fim;
    END IF;

    -- 2b) Turnos do mesmo aviso não podem se sobrepor.
    --     Intervalos semiabertos [start, end): encostar é permitido
    --     (06:00-14:00 e 14:00-22:00 são válidos).
    --     Período em aberto (period_end NULL) é tratado como válido até a
    --     janela, mantendo compatibilidade com os registros antigos.
    SELECT p.id, p.period_start, COALESCE(p.period_end, janela_fim)
      INTO conflito_id, conflito_ini, conflito_fim
      FROM public.cfg_app_notices_workers_periods p
     WHERE p.notice_id = NEW.notice_id
       AND p.id IS DISTINCT FROM NEW.id
       AND NEW.period_start < COALESCE(p.period_end, janela_fim)
       AND p.period_start < COALESCE(NEW.period_end, janela_fim)
     ORDER BY p.period_start
     LIMIT 1;

    IF conflito_id IS NOT NULL THEN
        RAISE EXCEPTION 'Sobreposição de escala: o período % (%) conflita com o intervalo informado (% a %)',
            conflito_id, conflito_ini, NEW.period_start, COALESCE(NEW.period_end::text, 'janela');
    END IF;

    RETURN NEW;
END;
$$;

-- Recria a trigger incluindo a coluna period_end no gatilho de UPDATE
DROP TRIGGER IF EXISTS trg_cfg_app_notices_workers_periods_validate_janela
    ON public.cfg_app_notices_workers_periods;
CREATE TRIGGER trg_cfg_app_notices_workers_periods_validate_janela
    BEFORE INSERT OR UPDATE OF period_start, period_end ON public.cfg_app_notices_workers_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.cfg_app_notices_workers_periods_validate_janela();

-- 3. Rótulo do turno não é mais único por aviso -------------------------
--    Antes: uq_cfg_app_notices_workers_periods (notice_id, label).
--    Com vários turnos no mesmo dia e horários iguais entre dias (ex.:
--    "Turno 06:00-14:00" repetido), o label colide. Como o label é gerado
--    a partir do horário de início (que já é único por construção), manter
--    a unicidade é seguro — mas o app passa a gerar labels que incluem a
--    data. A constraint permanece; se houver colisão, o app recebe 23505 e
--    tenta novamente com sufixo. Nada a alterar aqui.
--
--    (Bloco mantido apenas como registro da decisão.)

-- 4. Verificação --------------------------------------------------------
-- 4a) O índice que travava múltiplos turnos não existe mais
SELECT indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename  = 'cfg_app_notices_workers_periods'
   AND indexname  = 'uq_notice_workers_period_open';

-- 4b) Triggers ativas na tabela de períodos
SELECT tgname
  FROM pg_trigger
 WHERE tgrelid = 'public.cfg_app_notices_workers_periods'::regclass
   AND NOT tgisinternal
 ORDER BY tgname;
