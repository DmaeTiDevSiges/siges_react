ALTER TABLE public.cfg_materials_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated read cfg_materials_statuses"
    ON public.cfg_materials_statuses
    FOR SELECT
    TO authenticated
    USING (true);
