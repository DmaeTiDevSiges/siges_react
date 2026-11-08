> Movido do `AGENTS.md` em 08/11/2026, sem alteração. Resumo das regras no `AGENTS.md`.

## 🏗️ Arquitetura de Serviços — Projeto SIGES React

### Padrão Facade/Proxy: `dataService.ts` vs Serviços Especializados

O projeto SIGES usa uma arquitetura em camadas para acesso a dados:

```
Componente React
      ↓
dataService.ts   ← Fachada pública (proxy com tipos declarados)
      ↓
services/materials/warehouseService.ts   ← Query REAL no Supabase
services/materials/materialsService.ts
services/orders/ordersService.ts
... (demais serviços especializados)
```

### ⚠️ REGRA CRÍTICA: Onde editar queries

| Ação | Arquivo correto | Arquivo NÃO editar |
|------|----------------|-------------------|
| Adicionar campo no `SELECT` | Serviço especializado (ex: `warehouseService.ts`) | `dataService.ts` diretamente |
| Atualizar tipo de retorno | **Ambos**: serviço especializado + `dataService.ts` | Apenas um dos dois |
| Criar novo método | Serviço especializado + adicionar proxy em `dataService.ts` | — |

### Procedimento para adicionar um campo a uma query existente

1. **Serviço especializado** (ex: `services/materials/warehouseService.ts`):
   - Adicionar o campo no `.select('..., novo_campo')`
   - Adicionar o campo no `.map()` de retorno
   - Atualizar o tipo `Promise<{ ..., novo_campo?: string }[]>`

2. **`services/dataService.ts`** (proxy):
   - Atualizar APENAS a assinatura `Promise<{...}>` do método correspondente
   - NÃO alterar o corpo — ele usa `apply(service, arguments as any)`

3. **Componente/View** (se necessário):
   - Atualizar interfaces locais (ex: `interface WarehouseStock`)
   - Atualizar estados (ex: `useState<{ ..., novo_campo? }[]>([])`)

### Exemplo aplicado: campo `address` na tabela `warehouses` (Jul/2026)

```typescript
// ✅ CORRETO — warehouseService.ts (query real)
async getWarehouses(): Promise<{ id: string; code: string; description: string; address?: string }[]> {
    // ...
    .select('id, code, description, address')
    // ...
    return data.map(item => ({ id, code, description, address: item.address || '' }));
}

// ✅ CORRETO — dataService.ts (apenas tipo atualizado)
async getWarehouses(): Promise<{ id: string; code: string; description: string; address?: string }[]> {
    return warehouseService.getWarehouses.apply(warehouseService, arguments as any);
}
```

### Localização dos serviços especializados

```
services/
├── materials/
│   ├── warehouseService.ts    → Almoxarifados e estoque (warehouses, warehouses_materials)
│   ├── materialsService.ts    → Materiais (materials, v_materials)
│   └── purchasesService.ts    → Compras de materiais (materials_purchases)
├── orders/
│   ├── ordersService.ts       → Ordens de serviço
│   └── visitsService.ts       → Visitas técnicas
├── assets/
│   ├── assetsService.ts       → Ativos/equipamentos
│   └── assetTagsService.ts    → Tags de ativos
├── users/
│   └── usersService.ts        → Usuários e autenticação
└── core/
    ├── dashboardService.ts    → Dashboard e métricas
    ├── notificationsService.ts→ Notificações
    └── unitsService.ts        → Unidades/locais
```
