# Planejamento: Movimentações de Materiais

## Visão Geral

Criar um sistema de registro de movimentações de materiais entre almoxarifados, com suporte a **saída**, **devolução** e **transferência**.

---

## 1. Contexto Atual

### O que já existe
| Componente | Descrição |
|------------|-----------|
| `materials` | Cadastro de materiais (code, description, unit, price, balance) |
| `warehouses` | Almoxarifados (code, description, department_id, company_id) |
| `warehouses_materials` | Estoque por almoxarifado (quantity, min_stock, cost_avg, UNIQUE warehouse_id+material_id) |
| `materials_purchases` | Fluxo de compras (solicitar → autorizar → concluir → entrada no estoque) |
| `v_materials` | View que agrega total_stock e warehouse_count |
| `completeMaterialPurchase()` | Incrementa `quantity` em `warehouses_materials` ao concluir compra |

### O que falta
- **Não existe tabela de movimentações** de materiais
- **Não existe saída** (dar material a um usuário/setor)
- **Não existe devolução** (receber material de volta)
- **Não existe transferência** entre almoxarifados

---

## 2. Modelo de Dados Proposto

### 2.1 Tabela: `cfg_materials_movements_types`

```sql
CREATE TABLE public.cfg_materials_movements_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
);

-- Dados iniciais
INSERT INTO cfg_materials_movements_types (code, description) VALUES
    ('SAIDA', 'Saída'),
    ('DEVOLUCAO', 'Devolução'),
    ('TRANSFERENCIA', 'Transferência');
```

### 2.2 Tabela: `materials_movements`

```sql
CREATE TABLE public.materials_movements (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,          -- Codigo da movimentação (ex: MOV-000001)
    movement_type_id INT NOT NULL REFERENCES cfg_materials_movements_types(id),
    material_id BIGINT NOT NULL REFERENCES materials(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,

    -- Almoxarifado de origem (obrigatório para SAIDA e TRANSFERENCIA)
    from_warehouse_id INT REFERENCES warehouses(id),
    -- Almoxarifado de destino (obrigatório para DEVOLUCAO e TRANSFERENCIA)
    to_warehouse_id INT REFERENCES warehouses(id),

    -- Usuário de destino (obrigatório para SAIDA)
    to_user_id INT REFERENCES users(id),
    -- Usuário de origem (obrigatório para DEVOLUCAO)
    from_user_id INT REFERENCES users(id),

    -- OS/SS vinculada (opcional)
    order_id BIGINT REFERENCES orders(id),

    justification TEXT,
    notes TEXT,

    created_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- RLS (padrão do projeto)
ALTER TABLE materials_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_movements_all" ON materials_movements
    FOR ALL TO authenticated USING (true);
```

### 2.3 Atualização em `warehouses_materials`

A tabela já existe. As movimentações irão **atualizar** `quantity`:

| Tipo | Origem | Destino |
|------|--------|---------|
| **SAÍDA** | `from_warehouse_id.quantity -= qtd` | — |
| **DEVOLUÇÃO** | — | `to_warehouse_id.quantity += qtd` |
| **TRANSFERÊNCIA** | `from_warehouse_id.quantity -= qtd` | `to_warehouse_id.quantity += qtd` |

---

## 3. Tipos de Movimentação

### 3.1 SAÍDA
> Material sai do almoxarifado para um usuário/setor.

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| `material_id` | ✅ | Material sendo movimentado |
| `quantity` | ✅ | Quantidade |
| `from_warehouse_id` | ✅ | Almoxarifado de origem |
| `to_user_id` | ✅ | Usuário que recebe |
| `order_id` | ❌ | OS/SS vinculada |
| `justification` | ✅ | Motivo da saída |
| `notes` | ❌ | Observações |

**Regras:**
- `from_warehouse_id.quantity >= quantity` (estoque suficiente)
- Cria registro em `materials_movements`
- Decrementa `warehouses_materials.quantity` no almoxarifado de origem

### 3.2 DEVOLUÇÃO
> Material retorna do usuário para o almoxarifado.

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| `material_id` | ✅ | Material sendo devolvido |
| `quantity` | ✅ | Quantidade |
| `to_warehouse_id` | ✅ | Almoxarifado de destino |
| `from_user_id` | ✅ | Usuário que devolve |
| `order_id` | ❌ | OS/SS vinculada |
| `justification` | ✅ | Motivo da devolução |
| `notes` | ❌ | Observações |

**Regras:**
- Cria registro em `materials_movements`
- Incrementa `warehouses_materials.quantity` no almoxarifado de destino

### 3.3 TRANSFERÊNCIA
> Material sai de um almoxarifado e entra em outro.

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| `material_id` | ✅ | Material sendo transferido |
| `quantity` | ✅ | Quantidade |
| `from_warehouse_id` | ✅ | Almoxarifado de origem |
| `to_warehouse_id` | ✅ | Almoxarifado de destino |
| `justification` | ✅ | Motivo da transferência |
| `notes` | ❌ | Observações |

**Regras:**
- `from_warehouse_id != to_warehouse_id`
- `from_warehouse_id.quantity >= quantity`
- Cria registro em `materials_movements`
- Decrementa origem + Incrementa destino (transação atômica)

---

## 4. API (Supabase Edge Functions ou RPC)

### 4.1 Funções SQL Recomendadas

```sql
-- Saída de material
CREATE OR REPLACE FUNCTION fn_material_exit(
    p_material_id BIGINT,
    p_from_warehouse_id INT,
    p_to_user_id INT,
    p_quantity INT,
    p_justification TEXT,
    p_order_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS BIGINT;

-- Devolução de material
CREATE OR REPLACE FUNCTION fn_material_return(
    p_material_id BIGINT,
    p_to_warehouse_id INT,
    p_from_user_id INT,
    p_quantity INT,
    p_justification TEXT,
    p_order_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS BIGINT;

-- Transferência entre almoxarifados
CREATE OR REPLACE FUNCTION fn_material_transfer(
    p_material_id BIGINT,
    p_from_warehouse_id INT,
    p_to_warehouse_id INT,
    p_quantity INT,
    p_justification TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS BIGINT;
```

### 4.2 Métodos no `dataService.ts`

```typescript
// Registrar saída
async materialExit(data: MaterialMovementData): Promise<void>

// Registrar devolução
async materialReturn(data: MaterialMovementData): Promise<void>

// Registrar transferência
async materialTransfer(data: MaterialMovementData): Promise<void>

// Listar movimentações (com filtros)
async getMaterialMovements(filters: MovementFilters): Promise<MaterialMovement[]>

// Buscar movimentações de um material específico
async getMaterialMovementsByMaterial(materialId: number): Promise<MaterialMovement[]>

// Buscar movimentações de um almoxarifado
async getMaterialMovementsByWarehouse(warehouseId: number): Promise<MaterialMovement[]>
```

---

## 5. Interface (Componentes React)

### 5.1 Aba "Movimentações" em Materiais

Adicionar aba "Movimentações" na tela de detalhes do material (`MaterialDetails.tsx`), similar ao que já existe em Ferramentas.

```
MaterialDetails
├── Aba "Almoxarifados" (já existe)
├── Aba "Compras" (já existe)
└── Aba "Movimentações" (NOVA)
    ├── Botão "Nova Saída"
    ├── Botão "Nova Devolução"
    ├── Botão "Nova Transferência"
    └── Lista de movimentações com timeline
```

### 5.2 Tela Principal de Materiais

Adicionar aba "Movimentações" na navegação principal de materiais:

```
MaterialsMainView (novo componente)
├── Aba "Inventário" (lista atual)
├── Aba "Movimentações" (NOVA)
│   ├── Filtro por tipo (Saída/Devolução/Transferência)
│   ├── Filtro por almoxarifado
│   ├── Filtro por período
│   ├── Botão "Nova Movimentação"
│   └── Lista agrupada por data
└── Aba "Compras" (dashboard atual)
```

### 5.3 Formulários

| Formulário | Descrição |
|------------|-----------|
| `MaterialExitForm` | Seleciona: material, almoxarifado origem, usuário destino, quantidade, justificativa |
| `MaterialReturnForm` | Seleciona: material, almoxarifado destino, usuário origem, quantidade, justificativa |
| `MaterialTransferForm` | Seleciona: material, almoxarifado origem, almoxarifado destino, quantidade, justificativa |

### 5.4 Componentes de Relatório

| Componente | Descrição |
|------------|-----------|
| `MaterialMovementsList` | Lista paginada com filtros |
| `MaterialMovementCard` | Card com ícone, tipo, quantidade, data, responsável |
| `MaterialMovementsTimeline` | Timeline visual (similar ao histórico de ferramentas) |
| `MaterialMovementsPDFButton` | Exportar PDF |
| `MaterialMovementsExcelButton` | Exportar Excel |

---

## 6. Permissões

| Chave | Descrição | Atribuir a |
|-------|-----------|------------|
| `materials_movements_create` | Criar saída, devolução, transferência | Administradores, Almoxarifes |
| `materials_movements_view` | Visualizar movimentações | Todos com acesso a materiais |
| `materials_movements_export` | Exportar PDF/Excel | Administradores |

---

## 7. Fluxo de Execução

```
1. Usuário clica "Nova Saída" / "Nova Devolução" / "Nova Transferência"
2. Formulário é exibido com campos dinâmicos conforme o tipo
3. Usuário preenche e confirma
4. Frontend chama a RPC no Supabase (fn_material_exit, etc.)
5. Função SQL:
   a. Valida estoque suficiente (saída/transferência)
   b. Gera código da movimentação (MOV-XXXXXX)
   c. Insere em materials_movements
   d. Atualiza warehouses_materials (quantidade)
   e. Retorna ID da movimentação
6. Toast de sucesso + recarrega lista
```

---

## 8. Script de Migração

**Arquivo:** `supabase/migrations/20260701_create_materials_movements.sql`

```sql
-- 1. Tabela de tipos de movimentação
-- 2. Tabela de movimentações
-- 3. Funções SQL (fn_material_exit, fn_material_return, fn_material_transfer)
-- 4. RLS policies
-- 5. Seed dos tipos
```

---

## 9. Checklist de Implementação

- [ ] Criar migração SQL (tabelas + funções + RLS + seed)
- [ ] Adicionar tipos TypeScript (`MaterialMovement`, `MaterialMovementType`)
- [ ] Criar métodos no `dataService.ts`
- [ ] Criar formulários (`MaterialExitForm`, `MaterialReturnForm`, `MaterialTransferForm`)
- [ ] Criar componente `MaterialMovementsList`
- [ ] Adicionar aba "Movimentações" em `MaterialDetails.tsx`
- [ ] Criar tela principal de movimentações (aba na navegação)
- [ ] Adicionar botões de exportação PDF/Excel
- [ ] Configurar permissões
- [ ] Testes de integração (saída, devolução, transferência, validação de estoque)

---

## 10. Referências

- **Padrão de movimentação:** `supabase/migrations/20260625_create_tools_and_movements.sql` (ferramentas)
- **Serviço de referência:** `services/toolsService.ts` (métodos de movimentação)
- **Componente de referência:** `views/Tools/UserToolsView.tsx` (timeline de movimentações)
- **Estoque atual:** `supabase/migrations/20260629_create_warehouses_and_stock.sql`
