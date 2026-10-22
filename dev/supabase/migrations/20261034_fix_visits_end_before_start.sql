-- Migration: saneamento de visitas com encerramento anterior ao início
-- Data: 2026-10-22
--
-- Contexto: a migration 20261033 passou a validar no trigger de duração que
-- `ov_ended_at >= ov_started_at`. Como o trigger é BEFORE INSERT OR UPDATE
-- em orders_visits, qualquer UPDATE em uma linha histórica inválida passaria
-- a falhar. Este arquivo corrige essas linhas antes do uso normal do sistema.
--
-- Estratégia: os três registros históricos tinham o horário maior igual a
-- `ov_created_at` (momento do encerramento/criação do registro) e o horário
-- menor gravado em `ov_ended_at`. Portanto o correto é TROCAR início e fim,
-- preservando a duração (que estava apenas com o sinal invertido).
--
-- Aplicar manualmente no SQL Editor do Supabase, depois de 20261033.

-- ---------------------------------------------------------------------------
-- 1. Diagnóstico (visitAs que serão corrigidas)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_ids text;
BEGIN
    SELECT string_agg(id::text, ', ' ORDER BY id)
      INTO v_ids
      FROM public.orders_visits
     WHERE ov_started_at IS NOT NULL
       AND ov_ended_at IS NOT NULL
       AND ov_ended_at < ov_started_at;

    IF v_ids IS NULL THEN
        RAISE NOTICE 'OK (1): nenhuma visita com fim anterior ao início';
    ELSE
        RAISE NOTICE 'Corrigindo visitas com fim anterior ao início: %', v_ids;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Saneamento
-- ---------------------------------------------------------------------------
UPDATE public.orders_visits
   SET ov_started_at = ov_ended_at,
       ov_ended_at = ov_started_at
 WHERE ov_started_at IS NOT NULL
   AND ov_ended_at IS NOT NULL
   AND ov_ended_at < ov_started_at;

-- ---------------------------------------------------------------------------
-- 3. Conferência
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_bad int;
BEGIN
    SELECT COUNT(*)
      INTO v_bad
      FROM public.orders_visits
     WHERE ov_started_at IS NOT NULL
       AND ov_ended_at IS NOT NULL
       AND ov_ended_at < ov_started_at;

    IF v_bad > 0 THEN
        RAISE EXCEPTION 'FALHA: ainda existem % visita(s) com fim anterior ao início', v_bad;
    END IF;

    RAISE NOTICE 'OK (3): nenhuma visita com fim anterior ao início';
END $$;
