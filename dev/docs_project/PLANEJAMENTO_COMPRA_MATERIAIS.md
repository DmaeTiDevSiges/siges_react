# Planejamento: Rotina de Compra de Materiais

## 1. Visão Geral

Sistema de requisição de compra de materiais vinculado à tela de detalhe do material.
O fluxo permite que usuários solicitem compras, que passam por um ciclo de aprovação e, ao final, dão entrada automática no estoque.

---

## 2. Fluxo do Processo

```
Usuário cria requisição → Status: "A Autorizar"
        │
        ├── Autorizar → Status: "Autorizada" → Gerar entrada no estoque
        │
        └── Cancelar → Status: "Cancelada" (com justificativa)
```

### Status de Processamento

| ID | Status       | Descrição                                    |
|----|--------------|----------------------------------------------|
| 1  | A Autorizar  | Requisição aguardando aprovação              |
| 2  | Autorizada   | Aprovada, aguardando entrada no estoque      |
| 3  | Concluída    | Entrada realizada no estoque                  |
| 4  | Cancelada    | Rejeicada com justificativa                   |

---

## 3. Tela de Detalhe do Material - Aba "Compras"

### Botão "+ Adicionar" (já existente)
Ao clicar, abre modal de nova requisição de compra.

### Modal: Nova Requisição de Compra

| Campo               | Tipo     | Obrigatório | Descrição                              |
|---------------------|----------|-------------|----------------------------------------|
| Tipo de Compra      | Select   | Sim         | Tipo da requisição (ex: Padrão, Emergencial, Serviço, Aluguel) |
| Quantidade          | Number   | Sim         | Qtd a ser comprada                     |
| Valor Unitário      | Currency | Sim         | Preço unitário estimado (auto-preenchido com `material.priceUnit`, editável) |
| Valor Total         | Currency | Calculado   | Quantidade × Valor Unitário (auto)     |
| Justificativa       | Textarea | Sim         | Motivo da necessidade da compra        |

### Lista de Compras (aba "Compras")
Exibe todas as requisições de compra do material, com:
- Data da requisição
- Tipo de Compra
- Quantidade
- Valor estimado
- Status (badge colorido)
- Usuário solicitante

### Ações por Status

| Status      | Ações Disponíveis                          |
|-------------|--------------------------------------------|
| A Autorizar | [Autorizar] [Cancelar]                     |
| Autorizada  | [Concluir Entrada]                         |
| Concluída   | Nenhuma (somente leitura)                  |
| Cancelada   | Nenhuma (somente leitura, exibe justificativa) |

---

## 4. Tabela `material_purchases`

```sql
CREATE TABLE material_purchases (
    id              SERIAL PRIMARY KEY,
    material_id     INTEGER NOT NULL REFERENCES materials(id),
    purchase_type_id INTEGER NOT NULL REFERENCES cfg_materials_purchases_types(id),
    quantity        INTEGER NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    total_price     NUMERIC(12,2) NOT NULL,  -- calculado: quantity * unit_price
    justification   TEXT NOT NULL,
    status_id       INTEGER NOT NULL DEFAULT 1 REFERENCES cfg_material_purchases_statuses(id),
    requester_id    INTEGER NOT NULL REFERENCES users(id),
    authorizer_id   INTEGER REFERENCES users(id),
    authorized_at   TIMESTAMP,
    cancel_reason   TEXT,
    concluded_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_material_purchases_material ON material_purchases(material_id);
CREATE INDEX idx_material_purchases_status ON material_purchases(status_id);
CREATE INDEX idx_material_purchases_requester ON material_purchases(requester_id);
```

---

## 5. Tabela `cfg_materials_purchases_types`

```sql
CREATE TABLE cfg_materials_purchases_types (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

INSERT INTO cfg_materials_purchases_types (code, description, is_available) VALUES
    ('standard',   'Compra Padrão', TRUE),
    ('emergency',  'Compra Emergencial', TRUE),
    ('service',    'Compra de Serviço', TRUE),
    ('rental',     'Aluguel de Equipamento', TRUE);
```

---

## 6. Tabela `cfg_material_purchases_statuses`

```sql
CREATE TABLE cfg_material_purchases_statuses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL
);

INSERT INTO cfg_material_purchases_statuses (code, description) VALUES
    ('pending',   'A Autorizar'),
    ('authorized','Autorizada'),
    ('completed', 'Concluída'),
    ('cancelled', 'Cancelada');
```

---

## 7. Tabela `warehouses_materials` - Trigger de Entrada Automática

Ao marcar como "Concluída", o sistema automaticamente:
1. Insere ou atualiza registro em `warehouses_materials` (estoque do almoxarifado padrão do material)
2. Atualiza `cost_avg` com o preço unitário da compra
3. Atualiza `price_unit` na tabela `materials`

---

## 8. Dashboard de Materiais

### Cards de Resumo (por status de compra)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  A Autorizar │  │ Autorizadas │  │  Concluídas │  │  Canceladas │
│      12      │  │      5      │  │      38     │  │      3      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

- Cards clicáveis → filtram a lista de compras abaixo
- Exibem quantidade de requisições por status
- Cores: Amarelo (A Autorizar), Azul (Autorizada), Verde (Concluída), Vermelho (Cancelada)

### Lista de Compras (abaixo dos cards)
Tabela com todas as requisições, colunas:
- Material (código + descrição)
- Tipo de Compra
- Quantidade
- Valor Estimado
- Solicitante
- Data
- Status (badge)
- Ações (conforme status)

---

## 9. Service/dataService - Métodos Necessários

```typescript
// Listar tipos de compra disponíveis
getMaterialPurchaseTypes(): Promise<MaterialPurchaseType[]>

// Criar requisição de compra
createMaterialPurchase(data: {
    materialId: string;
    purchaseTypeId: string;
    quantity: number;
    unitPrice: number;
    justification: string;
}): Promise<MaterialPurchase>

// Listar compras de um material
getMaterialPurchases(materialId: string): Promise<MaterialPurchase[]>

// Autorizar compra
authorizeMaterialPurchase(id: string, authorizerId: string): Promise<void>

// Cancelar compra
cancelMaterialPurchase(id: string, cancelReason: string): Promise<void>

// Concluir compra (dar entrada no estoque)
completeMaterialPurchase(id: string): Promise<void>

// Dashboard - contagem por status
getMaterialPurchasesDashboard(): Promise<{
    pending: number;
    authorized: number;
    completed: number;
    cancelled: number;
}>

// Dashboard - listar todas as compras
getMaterialPurchasesAll(): Promise<MaterialPurchase[]>
```

---

## 10. Permissões

| Ação               | Permissão                                |
|--------------------|------------------------------------------|
| Criar requisição   | `materials_purchases_create`             |
| Autorizar          | `materials_purchases_authorizations`     |
| Cancelar           | `materials_purchases_authorizations`     |
| Concluir entrada   | `materials_purchases_create`             |
| Visualizar dashboard| `materials_search`                       |

---

## 11. Telas e Componentes

| Componente                           | Caminho                                        |
|--------------------------------------|------------------------------------------------|
| MaterialPurchasesTab                 | `views/Settings/Materials/MaterialPurchasesTab.tsx` |
| MaterialPurchaseFormModal            | `components/materials/MaterialPurchaseFormModal.tsx` |
| MaterialsDashboard                   | `views/Dashboards/MaterialsDashboard.tsx`      |
| MaterialPurchaseCard                 | `components/materials/MaterialPurchaseCard.tsx` |

---

## 12. Resumo dos Arquivos a Criar/Modificar

### Criar
- `supabase/migrations/YYYY_create_material_purchases.sql`
- `supabase/migrations/YYYY_create_cfg_material_purchases_statuses.sql`
- `supabase/migrations/YYYY_create_cfg_materials_purchases_types.sql`
- `views/Settings/Materials/MaterialPurchasesTab.tsx`
- `components/materials/MaterialPurchaseFormModal.tsx`
- `views/Dashboards/MaterialsDashboard.tsx`
- `components/materials/MaterialPurchaseCard.tsx`

### Modificar
- `services/dataService.ts` → novos métodos
- `views/Settings/Materials/MaterialDetails.tsx` → integrar MaterialPurchasesTab na aba "Compras"
- `App.tsx` → rota para dashboard de materiais
- `components/Sidebar.tsx` / `BottomNav.tsx` → link para dashboard (opcional)

---

## 13. Ordens de Execução

1. Criar tabelas no banco (migrations SQL) - incluindo `cfg_materials_purchases_types`
2. Criar métodos no `dataService.ts`
3. Criar `MaterialPurchasesTab.tsx` (aba de compras no detalhe)
4. Criar `MaterialPurchaseFormModal.tsx` (modal de nova requisição)
5. Integrar aba no `MaterialDetails.tsx`
6. Criar `MaterialsDashboard.tsx` (painel de compras)
7. Criar cards de status no dashboard
8. Testar fluxo completo: criar → autorizar → concluir entrada
