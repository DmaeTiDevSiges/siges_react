-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.fc_tgr_units_searchable() CASCADE;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.fc_tgr_units_searchable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    unit_type_code TEXT;
BEGIN
    SELECT public.cfg_units_types.code AS unit_type_code
    INTO unit_type_code
    FROM public.cfg_units_types
    WHERE public.cfg_units_types.id = NEW.unit_type_id;    

    NEW.description_full = NEW.code || ' - ' || COALESCE(unit_type_code, '') || ' ' || NEW.description;

    RETURN NEW;
END;
$$;

-- Remove the existing trigger from the units table
DROP TRIGGER IF EXISTS tgr_units_searchable ON units;

-- Create the new trigger
CREATE TRIGGER tgr_units_searchable
BEFORE INSERT OR UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION public.fc_tgr_units_searchable();