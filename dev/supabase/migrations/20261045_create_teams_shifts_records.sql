-- Migração: Registro mensal de turnos por equipe + fechamento de competência
-- Funcionalidade "Ociosidade" (aba OCIOSIDADE da página Gestão)
-- Aplicar manualmente no SQL Editor do Supabase.

-- 1. Registros mensais de turnos (lançamento manual por equipe × mês)
CREATE TABLE IF NOT EXISTS public.teams_shifts_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES public.cfg_teams(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL, -- sempre o 1º dia do mês de competência
    normal_shifts INTEGER NOT NULL DEFAULT 0 CHECK (normal_shifts >= 0),
    extra_shifts INTEGER NOT NULL DEFAULT 0 CHECK (extra_shifts >= 0),
    note TEXT,
    created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    CONSTRAINT uq_teams_shifts_records UNIQUE (team_id, reference_month)
);

CREATE INDEX IF NOT EXISTS idx_teams_shifts_records_month
    ON public.teams_shifts_records(reference_month);

-- 2. Fechamento de competência (bloqueia a edição do mês por departamento)
CREATE TABLE IF NOT EXISTS public.teams_shifts_months (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reference_month DATE NOT NULL,
    department_id BIGINT NOT NULL REFERENCES public.cfg_departments(id) ON DELETE CASCADE,
    locked_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Sao_Paulo', now()),
    CONSTRAINT uq_teams_shifts_months UNIQUE (reference_month, department_id)
);

-- 3. RLS (espelhando cfg_teams: "Universal Access"; o gate de isAdminSuper
--    é feito na aplicação, como nas demais tabelas do projeto)
ALTER TABLE public.teams_shifts_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_shifts_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal Access" ON public.teams_shifts_records USING (true) WITH CHECK (true);
CREATE POLICY "Universal Access" ON public.teams_shifts_months USING (true) WITH CHECK (true);
