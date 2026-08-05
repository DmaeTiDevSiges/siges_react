-- =========================================================================
-- MIGRATION: Execução Autônoma de Plano de Manutenção (sem OS / sem Visita)
-- =========================================================================

-- Adiciona a coluna para controlar quais tipos de ativos permitem a execução autônoma
ALTER TABLE public.cfg_assets_types 
ADD COLUMN IF NOT EXISTS allow_autonomous_maintenance_plan boolean DEFAULT false;

-- 1. Tabela principal de execuções
CREATE TABLE public.autonomous_maintenance_plans_executions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    asset_id bigint NOT NULL REFERENCES public.assets(id),
    maintenance_plan_id bigint NOT NULL REFERENCES public.maintenances_plans(id),
    executed_by_user_id bigint NOT NULL REFERENCES public.users(id),
    status varchar(20) DEFAULT 'in_progress' NOT NULL,
    -- in_progress | completed | cancelled
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    version_mode varchar DEFAULT 'live'
);

-- 2. Tabela de itens (checklist) por execução
CREATE TABLE public.autonomous_maintenance_plans_executions_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    execution_id bigint NOT NULL REFERENCES public.autonomous_maintenance_plans_executions(id) ON DELETE CASCADE,
    activity_id bigint NOT NULL REFERENCES public.cfg_activities(id),
    maintenance_plan_section_id bigint REFERENCES public.maintenances_plans_sections(id),
    maintenance_plan_id bigint REFERENCES public.maintenances_plans(id),
    status varchar(3),   -- OK | NOK | NA
    comments text,
    img_file_path varchar,
    img_files_names jsonb DEFAULT '[]'::jsonb,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    updated_user_id bigint,
    UNIQUE (execution_id, activity_id)
);

-- 3. View enriquecida para consultas
CREATE OR REPLACE VIEW public.v_autonomous_maintenance_plans_executions AS
SELECT
    me.id,
    me.asset_id,
    a.code   AS asset_code,
    a.description AS asset_description,
    a.company_id,
    me.maintenance_plan_id,
    mp.description AS plan_description,
    mp.code        AS plan_code,
    me.status,
    me.started_at,
    me.completed_at,
    me.notes,
    me.executed_by_user_id,
    u.name_short AS executed_by_name,
    me.created_at,
    me.is_deleted,
    me.version_mode,
    cat.allow_autonomous_maintenance_plan
FROM public.autonomous_maintenance_plans_executions me
LEFT JOIN public.assets            a   ON me.asset_id             = a.id
LEFT JOIN public.maintenances_plans mp  ON me.maintenance_plan_id  = mp.id
LEFT JOIN public.users              u   ON me.executed_by_user_id  = u.id
LEFT JOIN public.cfg_assets_types   cat ON a.type_id               = cat.id
WHERE me.is_deleted = false;

-- 4. Permissão de leitura para authenticated (ajustar RLS conforme necessário)
ALTER TABLE public.autonomous_maintenance_plans_executions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_maintenance_plans_executions_items ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme os perfis do seu projeto)
CREATE POLICY "authenticated can select executions"
    ON public.autonomous_maintenance_plans_executions FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "authenticated can insert executions"
    ON public.autonomous_maintenance_plans_executions FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update executions"
    ON public.autonomous_maintenance_plans_executions FOR UPDATE
    TO authenticated USING (true);

CREATE POLICY "authenticated can select items"
    ON public.autonomous_maintenance_plans_executions_items FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "authenticated can insert items"
    ON public.autonomous_maintenance_plans_executions_items FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update items"
    ON public.autonomous_maintenance_plans_executions_items FOR UPDATE
    TO authenticated USING (true);
