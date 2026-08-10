-- Remove a constraint UNIQUE de serial_number
ALTER TABLE public.tools DROP CONSTRAINT IF EXISTS tools_serial_number_key;

-- Remove todos os índices únicos parciais/total em serial_number
DROP INDEX IF EXISTS public.tools_serial_number_unique_idx;
