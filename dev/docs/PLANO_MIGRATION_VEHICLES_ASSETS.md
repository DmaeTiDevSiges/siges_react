# Plano de Implementação: Substituir `vehicles` por `assets`

## Contexto

A tabela `vehicles` é um catálogo simples (~19 colunas) usado exclusivamente para veículos de transporte em visitas de ordens de serviço. A tabela `assets` é um sistema rico (~59 colunas) que já gerencia motos, bombas, compressores, etc. O objetivo é unificar veículos no sistema de assets, eliminando a duplicação.

---

## Fase 1 — Estender a tabela `assets` com colunas veiculares

O `assets` **não possui** colunas essenciais para veículos. Adicionar via migration:

| Coluna | Tipo | Observação |
|--------|------|------------|
| `plates` | varchar | Placa do veículo (já existe em vehicles) |
| `color` | varchar | Cor do veículo |
| `year` | varchar | Ano do veículo |
| `value_unit` | numeric | Preço por unidade (Km) para billing |
| `unit` | text | Unidade de medida (ex: "Km") |
| `discount` | numeric | Multiplicador de desconto (default 1) |
| `finger_print` | varchar | ID de integração externa (Manus) |
| `is_available` | boolean | Disponibilidade (default true) |
| `department_id` | bigint | Departamento vinculado |

**Arquivos afetados:**
- Criar: `supabase/migrations/YYYYMMDD_add_vehicle_columns_to_assets.sql`
- Atualizar: `supabase/patch_create_assets_table.sql` (schema de referência)
- Atualizar: `types.ts` — interface `Asset` (adicionar os campos)

---

## Fase 2 — Migrar dados da tabela `vehicles` para `assets`

Migration SQL que:
1. Insere cada registro de `vehicles` como um registro em `assets` com `type_id` apontando para um tipo "Veículo"
2. Mapeia colunas: `description`, `plates`, `model`, `brand`, `color`, `year`, `value_unit`, `unit`, `discount`, `finger_print`, `company_id`, `department_id`
3. Cria tabela temporária `vehicle_asset_id_map` (vehicle_id → asset_id) para referenciar nas FKs

**Arquivos afetados:**
- Criar: `supabase/migrations/YYYYMMDD_migrate_vehicles_to_assets.sql`

---

## Fase 3 — Adaptar `orders_visits_vehicles` para referenciar `assets`

**Opção A (Recomendada):** Criar coluna `asset_id` na tabela `orders_visits_vehicles` e deprecar `vehicle_id`
- Adicionar `asset_id bigint` com FK → `assets(id)`
- Migrar dados: `asset_id = vehicle_asset_id_map.asset_id`
- Manter colunas veiculares específicas: `recorder_start`, `recorder_end`, `amount`, `value_unit`, `value_total`, `discount`

**Opção B:** Reutilizar `orders_visits_assets` adicionando colunas veiculares
- Adicionar `value_unit`, `discount`, `value_total` em `orders_visits_assets`
- Problema: mistura inspect-before/after com billing veicular, complexidade alta

**Arquivos afetados (Opção A):**
- Criar: `supabase/migrations/YYYYMMDD_add_asset_id_to_orders_visits_vehicles.sql`
- Atualizar: `schema_public.sql` e `schema_public_with_drops.sql`
- Atualizar: `v_orders_visits_vehicles` (VIEW — trocar JOIN de vehicles para assets)
- Atualizar: `fc_orders_visits_vehicles_update_value_unit` (ler `value_unit` de `assets` em vez de `vehicles`)
- Atualizar: `fc_orders_visits_vehicles_update_vehicles_value` (trigger já usa a tabela junction, não muda)

---

## Fase 4 — Adaptar `users.vehicle_id`

Migrar a FK de `users.vehicle_id` de `vehicles` para `assets`:
1. Criar coluna `asset_id` na tabela `users`
2. Migrar dados via mapa
3. Deprecar `vehicle_id`

**Arquivos afetados:**
- Criar: `supabase/migrations/YYYYMMDD_add_asset_id_to_users.sql`
- Atualizar: `types.ts` — interface `User` (adicionar `assetId`, manter `vehicleId` como deprecated)
- Atualizar: `dataService.ts` — `updateUserVehicle()` → `updateUserAsset()`
- Atualizar: `ProfileScreen.tsx` — buscar asset em vez de vehicle
- Atualizar: `UserViewScreen.tsx` — exibir status do asset

---

## Fase 5 — Atualizar `dataService.ts` (9+ métodos)

| Método atual | Novo nome | Mudança |
|---|---|---|
| `searchVehicles()` | `searchAssets()` | Query em `v_assets` com filtro por tipo "Veículo" |
| `getVehicle()` | `getAsset()` | Query em `assets` |
| `updateUserVehicle()` | `updateUserAsset()` | Usar `asset_id` em vez de `vehicle_id` |
| `getOrderVisitVehicles()` | `getOrderVisitAssets()` | JOIN com `assets` em vez de `vehicles` |
| `addVehicleToOrderVisit()` | `addAssetToOrderVisit()` | Insert com `asset_id` |
| `removeVehicleFromOrderVisit()` | `removeAssetFromOrderVisit()` | DELETE (sem mudança lógica) |
| `updateVehicleKm()` | `updateAssetKm()` | Update em `orders_visits_vehicles` (colunas mantidas) |
| `closeOrderVisit()` (validação) | `closeOrderVisit()` | Validar via `asset_id` |
| `getOrdersVisitsVehiclesMerged()` | `getOrdersVisitsAssetsMerged()` | Query atualizada |

**Arquivo:** `services/dataService.ts`

---

## Fase 6 — Atualizar integração Manus

Em `services/manusIntegrationService.ts`:
- `importContractData()`: Upsert em `assets` (não `vehicles`) usando `finger_print`
- `importVisit()`: Link via `asset_id` em vez de `vehicle_id`
- Mapeamento de campos: `v.VehicleId` → `finger_print`, `v.Description` → `description`, etc.

---

## Fase 7 — Atualizar frontend (7+ componentes)

| Componente | Arquivo | Mudança |
|---|---|---|
| Lista de veículos da visita | `views/OrderVisit/OrderVisitVehicle/OrderVisitVehiclesList.tsx` | Usar novos métodos, manter UX de KM |
| Tela de visita (tab) | `views/OrderVisit/OrderVisitScreen.tsx` | Renomear tab 'transport' se necessário |
| Badge de transporte | `components/ordersVisits/OrderVisitBottomNav.tsx` | Prop names |
| Perfil do usuário | `views/Users/ProfileScreen.tsx` | Buscar asset em vez de vehicle |
| Visualização do usuário | `views/Admin/UserViewScreen.tsx` | Exibir status do asset |
| Detalhe do asset | `views/Assets/AssetView.tsx` | Já usa `vehiclesValue`, verificar |
| Financeiro da visita | `views/OrderVisit/OrderVisitFinancialDetail.tsx` | Labels |

---

## Fase 8 — Atualizar dashboards e relatórios

| Arquivo | Mudança |
|---|---|
| `views/Dashboards/DashboardOrdersVisitsAdminScreen.tsx` | `getOrdersVisitsAssetsMerged()`, labels "Transporte" |
| `views/Dashboards/DashboardUnitsPowerElectric.tsx` | Mesma mudança |
| `views/Dashboards/DashboardOrdersAdminCalendarScreen.tsx` | `vehiclesValue` pode manter nome (é o valor financeiro) |
| `components/dashboards/.../DashboardOrdersVisitsAdminListItem.tsx` | Exibição do valor |
| `components/reports/VisitReportDocument.tsx` | Seção de veículos no PDF |
| `components/reports/VisitReportPDFButton.tsx` | Dados de veículos |
| `components/reports/BatchVisitReportPDFButton.tsx` | Dados de veículos |
| `components/reports/VisitsListDocument.tsx` | Lista de veículos |

---

## Fase 9 — Atualizar funções e triggers SQL

| Função/Trigger | Mudança |
|---|---|
| `fc_orders_visits_vehicles_update_value_unit()` | Ler `value_unit` de `assets` em vez de `vehicles` |
| `fc_orders_visits_vehicles_amount_update()` | Sem mudança (usa colunas da junction) |
| `fc_orders_visits_vehicles_update_vehicles_value()` | Sem mudança (usa colunas da junction) |
| `flow_order_visit_create_v2.sql` | Usar `asset_id` em vez de `vehicle_id` do user |
| `flow_order_visit_close_v2.sql` | Validar via `asset_id` |
| VIEW `v_orders_visits_vehicles` | JOIN com `assets` em vez de `vehicles` |
| VIEW `v_vehicles` | **Remover** (substituída por `v_assets` com filtro de tipo) |

---

## Fase 10 — Limpeza final

1. Criar migration para **dropar** a tabela `vehicles` e a VIEW `v_vehicles`
2. Remover a coluna `vehicle_id` da tabela `users` (após migração)
3. Remover a coluna `vehicle_id` de `orders_visits_vehicles` (após migração para `asset_id`)
4. Atualizar `types.ts`: remover interface `Vehicle` e `OrderVisitVehicle` (ou renomear para `OrderVisitAsset`)
5. Atualizar `types/manus.ts`: renomear `ManusVehicle` para `ManusAsset` (ou manter para compatibilidade Manus)
6. Atualizar dados de seed: `supabase/data/vehicles_rows.sql` → integração no seed de assets

---

## Ordem de Execução e Dependências

```
Fase 1 (schema assets)
  ↓
Fase 2 (migrar dados vehicles → assets)
  ↓
Fase 3 (orders_visits_vehicles FK) + Fase 4 (users FK) [paralelas]
  ↓
Fase 5 (dataService) + Fase 6 (Manus) [paralelas]
  ↓
Fase 7 (frontend) + Fase 8 (dashboards/reports) [paralelas]
  ↓
Fase 9 (triggers/views SQL)
  ↓
Fase 10 (limpeza)
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Dados de veículos perdidos na migração | Migration SQL com transaction + verificação de contagem |
| Integração Manus quebra | Testar importação com dados reais antes de deploy |
| KM/recorder lógica afetada | As colunas `recorder_start/end` permanecem na junction table, apenas o FK muda |
| `users.vehicle_id` usado em fluxo de criação de visita | Atualizar `flow_order_visit_create_v2.sql` para usar `asset_id` |
| Dashboards mostram "Transporte" | Manter labels para UX, mudar apenas fonte de dados |

---

## Arquivos para Criar (5 migrations)

1. `YYYYMMDD_add_vehicle_columns_to_assets.sql`
2. `YYYYMMDD_migrate_vehicles_to_assets.sql`
3. `YYYYMMDD_add_asset_id_to_orders_visits_vehicles.sql`
4. `YYYYMMDD_add_asset_id_to_users.sql`
5. `YYYYMMDD_drop_vehicles_table.sql` (fase final)

## Arquivos para Modificar (~25 arquivos)

- `types.ts`, `types/manus.ts`
- `services/dataService.ts`, `services/manusIntegrationService.ts`
- `views/OrderVisit/OrderVisitVehicle/OrderVisitVehiclesList.tsx`
- `views/OrderVisit/OrderVisitScreen.tsx`
- `views/Users/ProfileScreen.tsx`, `views/Admin/UserViewScreen.tsx`
- `views/Assets/AssetView.tsx`
- `views/Dashboards/DashboardOrdersVisitsAdminScreen.tsx`
- `views/Dashboards/DashboardUnitsPowerElectric.tsx`
- `views/Dashboards/DashboardOrdersAdminCalendarScreen.tsx`
- `components/ordersVisits/OrderVisitBottomNav.tsx`
- `components/dashboards/.../DashboardOrdersVisitsAdminListItem.tsx`
- `components/reports/VisitReportDocument.tsx`, `VisitReportPDFButton.tsx`, `BatchVisitReportPDFButton.tsx`, `VisitsListDocument.tsx`
- `views/OrderVisit/OrderVisitFinancialDetail.tsx`
- `supabase/flow_order_visit_create_v2.sql`, `flow_order_visit_close_v2.sql`
- `supabase/schema.sql`, `supabase/migrations/schema_public.sql`, `schema_public_with_drops.sql`
