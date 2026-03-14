DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_company_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_company_id_fkey
        FOREIGN KEY (company_id)
        REFERENCES public.cfg_companies (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
    END IF;
END $$;
