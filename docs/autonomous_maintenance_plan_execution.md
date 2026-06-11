# Execução Autônoma de Planos de Manutenção (Standalone)

Esta documentação consolida o planejamento, decisões técnicas, modelagem de banco de dados e as alterações no frontend para a implementação da funcionalidade de execução de planos de manutenção de forma autônoma (sem OS e sem Visita).

---

## 1. Regras de Negócio e Comportamento
- **Ponto de Acesso**: A execução é iniciada diretamente na tela de detalhes do Ativo (`AssetDetail`).
- **Elegibilidade do Ativo**: Apenas tipos de ativos específicos, habilitados com a flag `allow_autonomous_maintenance_plan = true` na tabela `cfg_assets_types`, permitirão a execução do plano.
- **Estrutura do Checklist**: Baseia-se diretamente nas tabelas `maintenances_plans`, `maintenances_plans_sections` e `maintenances_plans_sections_activities`.
- **Fotos e Notas**: Cada item do checklist permite anexar fotos e comentários.
- **Relatório**: Ao finalizar, é possível exportar um PDF simplificado com o resumo da execução.
- **Controle de Acesso**: Permissões gerenciadas através do hook `usePermissions` com o recurso `'autonomous_maintenance_plans_executions'`.

---

## 2. Banco de Dados (Supabase SQL)

O script SQL de migração está salvo no repositório em `supabase/migrations/autonomous_maintenance_plans_executions.sql` e contém:

```sql
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

-- 4. Políticas RLS
ALTER TABLE public.autonomous_maintenance_plans_executions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_maintenance_plans_executions_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can select executions" ON public.autonomous_maintenance_plans_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert executions" ON public.autonomous_maintenance_plans_executions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update executions" ON public.autonomous_maintenance_plans_executions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated can select items" ON public.autonomous_maintenance_plans_executions_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert items" ON public.autonomous_maintenance_plans_executions_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update items" ON public.autonomous_maintenance_plans_executions_items FOR UPDATE TO authenticated USING (true);
```

---

## 3. Tipos TypeScript (`types.ts`)

Novas interfaces a serem adicionadas:

```typescript
export interface AutonomousMaintenancePlanExecution {
  id: string;
  assetId: string;
  maintenancePlanId: string;
  executedByUserId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;

  // UI Helpers / View Joins
  assetCode?: string;
  assetDescription?: string;
  planDescription?: string;
  planCode?: string;
  executedByName?: string;
  allowAutonomousMaintenancePlan?: boolean;
}

export interface AutonomousMaintenancePlanExecutionItem {
  id: string;
  executionId: string;
  activityId: string;
  maintenancePlanSectionId?: string;
  maintenancePlanId?: string;
  status?: 'OK' | 'NOK' | 'NA' | null;
  comments?: string;
  imgFilePath?: string;
  imgFilesNames?: any; // JSONB
  createdAt?: string;

  // UI Helpers
  activityDescription?: string;
  activityCode?: string;
}
```

---

## 4. Métodos do `dataService.ts`

Métodos a serem implementados no dataService do Supabase:

```typescript
  /** Cria uma nova execução autónoma de plano de manutenção para um ativo. */
  async createAutonomousMaintenancePlanExecution(
    assetId: string,
    planId: string,
    userId: string
  ): Promise<AutonomousMaintenancePlanExecution> {
    const { data, error } = await supabase
      .from('autonomous_maintenance_plans_executions')
      .insert({
        asset_id: parseInt(assetId),
        maintenance_plan_id: parseInt(planId),
        executed_by_user_id: parseInt(userId),
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return mapToCamelCase(data);
  }

  /** Busca todas as execuções de plano de manutenção de um ativo. */
  async getAutonomousMaintenancePlanExecutions(assetId: string): Promise<AutonomousMaintenancePlanExecution[]> {
    const { data, error } = await supabase
      .from('v_autonomous_maintenance_plans_executions')
      .select('*')
      .eq('asset_id', parseInt(assetId))
      .order('started_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToCamelCase);
  }

  /** Finaliza uma execução preenchendo as notas e a data de conclusão. */
  async completeAutonomousMaintenancePlanExecution(
    executionId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('autonomous_maintenance_plans_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(executionId));

    if (error) throw error;
  }

  /** Cancela uma execução em andamento. */
  async cancelAutonomousMaintenancePlanExecution(executionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('autonomous_maintenance_plans_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(executionId));

    if (error) throw error;
  }

  /** Insere ou atualiza as respostas do checklist para cada atividade da execução. */
  async upsertAutonomousMaintenancePlanExecutionItem(
    executionId: string,
    activityId: string,
    sectionId: string | undefined,
    planId: string | undefined,
    userId: string,
    updates: Partial<AutonomousMaintenancePlanExecutionItem>
  ): Promise<AutonomousMaintenancePlanExecutionItem> {
    const dbPayload = {
      execution_id: parseInt(executionId),
      activity_id: parseInt(activityId),
      maintenance_plan_section_id: sectionId ? parseInt(sectionId) : null,
      maintenance_plan_id: planId ? parseInt(planId) : null,
      status: updates.status,
      comments: updates.comments,
      img_file_path: updates.imgFilePath,
      img_files_names: updates.imgFilesNames || []
    };

    const { data, error } = await supabase
      .from('autonomous_maintenance_plans_executions_items')
      .upsert(dbPayload, { onConflict: 'execution_id,activity_id' })
      .select()
      .single();

    if (error) throw error;
    return mapToCamelCase(data);
  }

  /** Carrega todos os itens preenchidos de uma execução. */
  async getAutonomousMaintenancePlanExecutionItems(executionId: string): Promise<AutonomousMaintenancePlanExecutionItem[]> {
    const { data, error } = await supabase
      .from('autonomous_maintenance_plans_executions_items')
      .select('*')
      .eq('execution_id', parseInt(executionId));

    if (error) throw error;
    return (data || []).map(mapToCamelCase);
  }
```

---

## 5. Estrutura do Frontend (Novos Arquivos)

- **`views/AutonomousMaintenancePlanExecution/AutonomousMaintenancePlanExecutionScreen.tsx`**:
  - Tela de checklist ativo. Carrega a estrutura de seções (`maintenances_plans_sections`) e atividades (`maintenances_plans_sections_activities`) a partir do plano selecionado.
- **`views/AutonomousMaintenancePlanExecution/AutonomousMaintenancePlanExecutionHistory.tsx`**:
  - Tela/Componente de listagem histórica de manutenções autônomas executadas no Ativo.
- **`components/maintenance/AutonomousPlanExecutionPDFButton.tsx`**:
  - Componente de exportação simplificada de PDF para as execuções realizadas.

---

## 6. Integrações no Frontend (Arquivos Existentes)

- **`views/Assets/AssetDetail.tsx`**:
  - Validar e extrair a flag `allowAutonomousMaintenancePlan` do Ativo buscado.
  - Renderizar o botão de execução standalone caso o Ativo seja elegível e o usuário logado possua permissão `create` na rota `'autonomous_maintenance_plans_executions'`.
  - Exibir a aba contendo a listagem histórica (`AutonomousMaintenancePlanExecutionHistory`).

- **`App.tsx`**:
  - Adicionar as rotas correspondentes de execução e histórico de planos autônomos.
