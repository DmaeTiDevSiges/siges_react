-- ==============================================================================
-- Migration: 20261201_add_offline_uuid_vehicles_monthly_expenses.sql
-- Modo offline — abastecimento de combustível lançado sem internet.
--
-- Por quê: o lançamento de combustível (vehicles_monthly_expenses) passa a poder
-- ser feito sem internet. O app gera um UUID no aparelho, grava em offline_uuid e
-- envia junto. Se a fila reenviar a mesma operação (queda no meio da
-- sincronização), o índice UNIQUE recusa a duplicata e o app trata como "já enviado".
--
-- NULL = linha criada online pelo fluxo de sempre (UNIQUE aceita vários NULL).
--
-- Somente aditiva — nenhum fluxo atual muda. Idempotente.
-- Sem esta migration o app continua funcionando, mas um reenvio da fila pode
-- duplicar o abastecimento (sem a proteção do UUID).
-- Reverter: 20261201_add_offline_uuid_vehicles_monthly_expenses_DOWN.sql
-- ==============================================================================

BEGIN;

ALTER TABLE public.vehicles_monthly_expenses ADD COLUMN IF NOT EXISTS offline_uuid UUID;

CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicles_monthly_expenses_offline_uuid
    ON public.vehicles_monthly_expenses (offline_uuid);

COMMENT ON COLUMN public.vehicles_monthly_expenses.offline_uuid IS
    'UUID gerado no aparelho quando o lançamento nasce offline (idempotência da sincronização). NULL = criado online.';

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (deve listar 1 linha):
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'vehicles_monthly_expenses'
--      AND column_name = 'offline_uuid';
