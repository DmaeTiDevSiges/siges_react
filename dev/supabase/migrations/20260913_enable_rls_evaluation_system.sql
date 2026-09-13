-- ============================================================
-- Migration: Enable RLS on evaluation system tables
-- Date: 2026-09-13
-- Fix: Enable RLS on tables that were created without it
-- ============================================================

ALTER TABLE public.cfg_evaluation_requirements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contracts_evaluation_requirements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders_visits_evaluations ENABLE ROW LEVEL SECURITY;

-- cfg_evaluation_requirements (catalog of evaluation requirements)
CREATE POLICY "Allow all authenticated read cfg_evaluation_requirements"
    ON public.cfg_evaluation_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated insert cfg_evaluation_requirements"
    ON public.cfg_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated update cfg_evaluation_requirements"
    ON public.cfg_evaluation_requirements FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all authenticated delete cfg_evaluation_requirements"
    ON public.cfg_evaluation_requirements FOR DELETE TO authenticated USING (true);

-- contracts_evaluation_requirements (links requirements to contracts with weight)
CREATE POLICY "Allow all authenticated read contracts_evaluation_requirements"
    ON public.contracts_evaluation_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated insert contracts_evaluation_requirements"
    ON public.contracts_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated update contracts_evaluation_requirements"
    ON public.contracts_evaluation_requirements FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all authenticated delete contracts_evaluation_requirements"
    ON public.contracts_evaluation_requirements FOR DELETE TO authenticated USING (true);

-- orders_visits_evaluations (actual evaluation records per visit)
CREATE POLICY "Allow all authenticated read orders_visits_evaluations"
    ON public.orders_visits_evaluations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated insert orders_visits_evaluations"
    ON public.orders_visits_evaluations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated update orders_visits_evaluations"
    ON public.orders_visits_evaluations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all authenticated delete orders_visits_evaluations"
    ON public.orders_visits_evaluations FOR DELETE TO authenticated USING (true);
