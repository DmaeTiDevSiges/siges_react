-- Remove a constraint UNIQUE existente em serial_number
ALTER TABLE public.tools DROP CONSTRAINT IF EXISTS tools_serial_number_key;

-- Remove índice parcial antigo se existir
DROP INDEX IF EXISTS public.tools_serial_number_key;

-- Cria um índice único parcial que ignora registros soft-deletados
CREATE UNIQUE INDEX tools_serial_number_unique_idx ON public.tools (serial_number) WHERE (is_deleted = false);
