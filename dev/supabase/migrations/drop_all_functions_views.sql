-- Drop all functions in public schema to allow clean migration
-- Run this BEFORE executing schema_public.sql if database has existing objects

DO $$ 
DECLARE
    func_record record;
BEGIN
    -- Drop all functions (except system functions)
    FOR func_record IN 
        SELECT routine_name, 
               pg_get_function_arguments(p.oid) as args
        FROM information_schema.routines 
        JOIN pg_proc p ON p.proname = information_schema.routines.routine_name
        WHERE routine_schema = 'public' 
          AND routine_type = 'FUNCTION'
          AND p.pronamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s)', 
                          func_record.routine_name, 
                          func_record.args);
            RAISE NOTICE 'Dropped function: %.%', 'public', func_record.routine_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping function %: %', func_record.routine_name, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all views
    FOR func_record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', func_record.table_name);
            RAISE NOTICE 'Dropped view: %.%', 'public', func_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping view %: %', func_record.table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Cleanup completed successfully!';
END $$;
