# Plano: Rateio de Aluguel Veicular — SIGES

**Data:** 08/10/2026 (atualizado 10/10/2026)
**Status:** 🟢 Fase 1 ✅ pronta (migration + DOWN + script de validação, **70/70 checks em PostgreSQL 18 local** — falta aplicar no SQL Editor pelo usuário) · Fase 2 (código) ✅ serviço + proxy + helper puro, 125/125 testes · **Fase 2 (despesas variáveis + componente R$/km) ✅ migration `20261009` (arquivo único) + DOWN + `validate_despesas_variaveis.sql` + serviço/proxies + UI** — harness PG18: **84/84 checks** (run.mjs 70/70 + run_fase2 84/84) — falta aplicar no SQL Editor · Fase 3 ✅ UI completa (Contratos, Apuração, VehicleCostTypes, badges/card/relatório, Sidebar, flag) · **Contrato de R$/km com vigência (Parte A) ✅ `20261010`** (tabela `cfg_vehicle_rate_contracts`, `fc_vehicle_rate_contract`, guard de Km + backfill, rota/permissão, telas Contratos de R$/km, import Manus cria contrato automático) · **Despesas/rateio sem contrato de aluguel (Parte B) ✅ `20261011`** (summary/detail/calculate/allocate aceitam competência sem aluguel, rateio só de despesas) · Fase 4 🟡 lint (tsc) 22 erros preexistentes (nenhum em arquivo alterado) · testes **127/127** · **falta E2E no banco vivo**
**Fonte da especificação:** conversa ChatGPT "Rateio De Aluguel Veicular" — https://chatgpt.com/share/6ac4c8b3-7a5c-83e9-b801-78fd736a89ad

### Andamento

| Fase | Entrega | Status |
|---|---|---|
| 1 | `dev/supabase/migrations/20261008_create_vehicle_rental_rateio.sql` (+ `_DOWN.sql`) | ✅ escrita + validada (sintaxe, idempotência ×3, RPCs, guards, revert, DOWN) — **aplicar manualmente** |
| 1 | `dev/supabase/validate_rateio_aluguel.sql` (transação com ROLLBACK, 13 checks) | ✅ executada sem FALHA no PG18 local |
| 2 | `services/orders/vehicleRentalService.ts` (contratos + resumo/detalhe + RPCs) | ✅ |
| 2 | `services/core/orderConfigService.ts` (`getVehicleCostTypes`/`saveVehicleCostType`/`deleteVehicleCostType`) + proxy em `dataService.ts` | ✅ |
| 2 | `visitsService.getOrderVisitVehicles` mapeia `costType` (união com `'rate'`) e usa `amount` nas linhas `rental`/`variable`; tipo `OrderVisitVehicle.costType` | ✅ |
| 2 | `utils/vehicleRentalAllocation.ts` + `.test.ts` (20 testes: Km zero, idempotência, 2 veículos, vigência, `cost_component` distinto) | ✅ |
| 2 | `dev/supabase/migrations/20261009_add_vehicles_monthly_expenses.sql` (+ `_DOWN.sql`) — tabela `vehicles_monthly_expenses`, guard de competência, summary/detail/calculate/allocate/revert com despesas **e componente R$/km (`cost_type 'rate'`)** | ✅ escrita + validada (harness PG18: **84/84 checks**, re-run idempotente, Fase 1 re-executada dá falha ruidosa, DOWN restaura tudo) — **aplicar manualmente depois da Fase 1** |
| 2 | `dev/supabase/validate_despesas_variaveis.sql` (transação + ROLLBACK, 15 seções — inclui `operational_*`, guards de `rate` e estorno) | ✅ executada sem FALHA no PG18 local |
| 2 | `vehicleRentalService`: `getRentalExpenses/saveRentalExpense/deleteRentalExpense` + `variableValue`/`variablePerKm`/`rentalValue`/`variableOvvId` + `operationalValue`/`operationalPerKm` (summary) e `operationalValue` (detail) + proxies em `dataService.ts` | ✅ |
| 3 | Telas (Contratos, Apuração, VehicleCostTypes, badges/card/relatório, Sidebar, flag) | ✅ `views/Transport/*` (Contratos CRUD + Apuração com SIMULAR/CONFIRMAR/FECHAR/ESTORNAR/REABRIR) · `views/Settings/VehicleCostTypes/*` · `OrderVisitVehiclesList` (badge "Rateio Aluguel", só leitura) · `OrderVisitFinancialDetail` (Km \| Rateio Aluguel) · `VisitReportDocument` · `Sidebar` (gate `transport_rental_apportionment`) · `routes.tsx`+`App.tsx` · `features.ts`+envs |
| 3 | UI das despesas variáveis (Fase 2 DB) | ✅ cards com célula **Despesas** · botão **[DESPESAS]** (modal CRUD por veículo/competência, select de `cfg_vehicles_costs_types`, travado em `ALLOCATED/CLOSED`) · Simular com colunas **Aluguel \| Despesas \| Total** · badge **"Rateio Despesas"** + linha somente-leitura em `OrderVisitVehiclesList` · card Transporte em 3 partes · linha no PDF |
| 3 | UI do componente R$/km (`cost_type 'rate'`) | ✅ cards da Apuração em **3×3** (Aluguel, Despesas, Km total / **R$ Km**, **R$/km op.**, **Custo total/km** / Apropriado, Ociosidade, Utilização) + coluna **R$ Km** na Simular + totais com **R$ Km** · badge azul **"Rateio R$ / Km"** + linha somente-leitura na visita · card Transporte em **4 partes** (Km \| Rateio R$/km \| Aluguel \| Despesas) · PDF inalterado (linha `rate` exibe a placa) |
| A | `dev/supabase/migrations/20261010_add_vehicle_rate_contracts.sql` (+ `_DOWN.sql`) — tabela `cfg_vehicle_rate_contracts` (vigência), `fc_vehicle_rate_contract(p_vehicle_id, p_on_date)`, guard no trigger de odômetro (`amount > 0` sem contrato vigente → `RAISE EXCEPTION`), backfill idempotente até `DATE '2026-12-31'`, rota/permissão `transport_rate_contracts` | ✅ escrita + revisão estrutural (paren/quotes/`$$`) + `validate_rate_contracts.sql` (9 testes, transação ROLLBACK) — **aplicar manualmente depois de `20261009`** |
| A | `services/orders/vehicleRateService.ts` + proxies (`getRateContracts`/`saveRateContract`/`deleteRateContract`/`getRateContractInfo`) · `Vehicle.valueUnit` + `usersService.searchVehicles/getVehicle` | ✅ |
| A | `views/Transport/RateContractList.tsx` + `RateContractForm.tsx` + wiring (`routes.tsx`, `App.tsx` screen `'rate-contracts'`, título, voltar) — gate `isVehicleRentalEnabled()` + `canView('transport_rate_contracts')` | ✅ |
| A | Import Manus: `ManusIntegrationService.ensureVehicleRateContract` cria contrato automático (1º do mês corrente → 31/12/2026 ou aberto, `value_unit = PriceUnit`) antes de inserir linhas de odômetro | ✅ |
| A | Tooltip R$/km na visita (`OrderVisitVehiclesList`: "x R$ … / km" com origem/bloqueio do contrato) · rótulos **Rateio R$/km** já presentes no card Transporte (`OrderVisitFinancialDetail`) | ✅ |
| B | `dev/supabase/migrations/20261011_expenses_without_rental_contract.sql` (+ `_DOWN.sql`) — `fc_vehicle_rental_summary/detail/calculate/allocate` sem exigir contrato de aluguel: contrato vigente → `rental`; só despesas → `contract_id NULL`, `contract_value 0`; sem nada → erro "nada a apurar" | ✅ escrita + revisão estrutural + `validate_expenses_without_rental.sql` (9 testes, transação ROLLBACK) — **aplicar manualmente depois de `20261010`** |
| B | `RentalApportionmentScreen` — **Alocar** habilitado com despesas mesmo sem contrato (azul: "só despesas serão rateadas"), aviso âmbar quando não há aluguel nem despesas, botão **Contratos de R$/km**, empty state atualizado | ✅ |
| A/B | **Rename das tabelas (10/10/2026):** `cfg_vehicle_cost_types` → **`cfg_vehicles_costs_types`** e `cfg_vehicle_rental_contracts` → **`cfg_vehicles_rentals_contracts`** — migrations 08–11, DOWNs, `validate_*` e services atualizados no repo + `dev/supabase/migrations/20261012_rename_vehicles_cost_tables.sql` (+ `_DOWN.sql`) para o banco vivo (rename de constraints/índice/sequences, re-emissão de `fc_vehicle_rental_summary`, `NOTIFY pgrst`) + `validate_rename_vehicles_costs.sql` (10 checks) | ✅ repo · **aplicar `20261012` no SQL Editor** (banco está nos nomes antigos) · rota `settings_vehicle_cost_types` (cfg_routes/permissão) **não** é tabela e não mudou |
| 4 | `npm run lint` + `npm test` + E2E no banco vivo | 🟡 lint (tsc): 22 erros **preexistentes** (nenhum em arquivo alterado) · testes **127/127** · **E2E pendente** (migrations `20261010` → `20261011` no SQL Editor + fluxo apurar→confirmar→relatório) |

## 1. Objetivo

Apropriar o custo mensal de aluguel de veículos às visitas técnicas em que o veículo foi utilizado, proporcionalmente ao **Km rodado**, integrando ao fluxo financeiro de custos já existente (rollups, card Transporte, relatórios e aprovação).

## 2. Decisões de escopo (aprovadas pelo usuário)

| # | Decisão | Escolha |
|---|---|---|
| 1 | Nível do rateio | **Por visita** (`orders_visits_vehicles`), não por OS |
| 2 | Base de cálculo | **Km** (odômetro já registrado nas visitas) |
| 3 | Escopo | **MVP completo** (migration + service + UI + flag) |
| 4 | Visitas com custos `approved` | **Lançar mantendo approved** (sem nova aprovação) |
| 5 | Custos variáveis | **Híbrido**: manter km × `vehicles.value_unit` existente + preparar modelo para despesas reais (`cost_component`/colunas reservadas) |
| 6 | Tipos de custo variável | **Parametrizáveis** — tabela `cfg_vehicles_costs_types` |
| 7 | Sequência | **A + C agora**: tabela + seed na Fase 1 **e** tela de gestão em Configurações no MVP (sem consumidor até a Fase 2) |
| 8 | 3º componente "R$/km" | Origem **`vehicles.value_unit`** (já existe — visita já cobra `km × value_unit`) |
| 9 | Km rateado nas visitas | **Troca em lugar** (`20261009`): a linha odômetro vira `cost_type 'rate'` (mesmo id, mesmo `value_total`) → **total cobrado inalterado**, zero dupla cobrança |
| 10 | Arquivo da Fase 2 | **Um arquivo só**: despesas variáveis + componente R$/km na própria `20261009_add_vehicles_monthly_expenses.sql` — ⚠️ **superado em 10/10/2026**: o contrato de R$/km com vigência criou `20261010` (Parte A) e as despesas sem contrato de aluguel criaram `20261011` (Parte B) |

## 3. Premissas técnicas verificadas no código

- Km por visita **já existe**: `orders_visits_vehicles.recorder_start/end` → `amount`, com rollup automático → `orders_visits.ov_vehicles_value` (trigger `fc_orders_visits_vehicles_update_vehicles_value`, `dev/supabase/schema.sql:3517`). Não criar tabela de utilização.
- **Pegadinha:** trigger BEFORE `fc_orders_visits_vehicles_before_save` (`schema.sql:3478`) **sobrescreve** `value_unit` (de `vehicles.value_unit`) e `amount` (odômetro) — precisa de guard por `cost_type` para aceitar linhas de rateio.
- **Separação Km × Rateio:** `fc_financial_orders_visits_vehicles_sum` (`schema.sql:2571`) agrupa só por `vehicle_description, value_unit, discount` — se o R$/km coincidir, mistura origens. Precisa agrupar por `cost_type`.
- Custo variável operacional **já existe**: visita cobra `km × vehicles.value_unit` (R$/km estático, import Manus — `manusIntegrationService.ts:202`).
- Não existe hoje: contrato/aluguel mensal, competência/período, tela de apuração, CRUD de veículos, rota/flag da feature.

## 4. Fórmulas

```
custo/km fixo      = aluguel mensal ÷ total_km do mês
rateio da visita   = km da visita × custo/km
ociosidade         = (aluguel + despesas) − Σ rateios
taxa de utilização = apropriado ÷ (aluguel + despesas)
(fase 2) custo/km total   = (aluguel + despesas do mês) ÷ total_km
(fase 2) R$/km op.        = Σ (linhas de Km × vehicles.value_unit) ÷ total_km
(fase 2) custo total/km   = custo/km rateio + R$/km op.
total_km = 0 → cost_per_km = NULL, tudo vira ociosidade
```

Exemplo: aluguel R$ 6.000 ÷ 3.000 km = R$ 2,00/km; visita de 150 km → R$ 300.
Com R$/km op. de R$ 2,50 (valor padrão do veículo): custo total/km = 2,35 + 2,50 = R$ 4,85.

## 5. Fase 1 — Migration Supabase

Arquivo: `dev/supabase/migrations/20261008_create_vehicle_rental_rateio.sql` (+ `_DOWN.sql`), estilo idempotente do template `20260817_create_cfg_materials_purchases_cancel_reasons.sql`. Aplicação **manual pelo usuário** no SQL Editor (AGENTS.md).

1. **`cfg_vehicles_costs_types`** — `id`, `code` UNIQUE, `description`, `color`, `is_available` + seed (1 Combustível, 2 Pedágio, 3 Manutenção, 4 Seguro/IPVA, 5 Outros) + RLS + GRANT SELECT.
2. **`cfg_vehicles_rentals_contracts`** — `vehicle_id FK vehicles`, `monthly_value numeric(14,2) CHECK ≥ 0`, `start_date`, `end_date`, `active`, `created_at` + RLS/grants.
3. **`ALTER TABLE orders_visits_vehicles ADD COLUMN cost_type varchar NOT NULL DEFAULT 'odometer'`** — `CHECK IN ('odometer','rental','variable')`.
4. **`CREATE OR REPLACE fc_orders_visits_vehicles_before_save`** — `rental`: preserva `amount`/`value_unit` informados e calcula `value_total = amount × value_unit × COALESCE(discount,1)`; `odometer`: comportamento atual intacto. Trigger AFTER de rollup sem mudança.
5. **`vehicles_rentals_periods`** — `vehicle_id`, `reference_month`, `contract_id`, `contract_value`, `total_km`, `cost_per_km numeric(14,6)`, `variable_value DEFAULT 0`, `variable_per_km` (reservado Fase 2), `allocated_value`, `idle_value`, `status DEFAULT 'OPEN' CHECK IN ('OPEN','CALCULATED','ALLOCATED','CLOSED')`, `UNIQUE(vehicle_id, reference_month)`.
6. **`vehicles_rentals_allocations`** — `period_id`, `ov_id`, `ovv_id` (origem odômetro), `rental_ovv_id`, `km`, `rate`, `value`, `cost_component DEFAULT 'RENTAL' CHECK IN ('RENTAL','VARIABLE')`, **`UNIQUE(period_id, ovv_id, cost_component)`** (idempotência de re-execução).
7. **RPCs** (`fc_` + `SECURITY DEFINER` + `SET search_path = 'public'`, GRANT a `authenticated`):
   - `fc_vehicle_rental_calculate(p_vehicle_id, p_reference_month)` — contrato vigente (vigência sobrepõe → escolhe e sinaliza), soma km `odometer` (`is_deleted=false`), grava `cost_per_km`; status → `CALCULATED`.
   - `fc_vehicle_rental_allocate(...)` — por linha de odômetro: allocation + linha `rental` em `orders_visits_vehicles` (mesmo `ov_id`) → rollup atualiza a visita. **Não altera `ov_costs_status`.** Status → `ALLOCATED`.
   - `fc_vehicle_rental_close/reopen(...)` — status `CLOSED`/`ALLOCATED`; trigger de guarda bloqueia UPDATE/DELETE de allocations e linhas `rental` quando `CLOSED`.
8. **`CREATE OR REPLACE fc_financial_orders_visits_vehicles_sum`** — retorna e agrupa também por `cost_type`.
9. **`CREATE OR REPLACE v_orders_visits_vehicles`** — acrescenta `cost_type` ao final (aditivo, **sem DROP CASCADE** — AGENTS.md).
10. **`cfg_routes`** — inserts idempotentes (template `20260829_add_financial_approval_routes.sql`): `transport_rental_apportionment` e `settings_vehicle_cost_types`.

## 6. Fase 2 (código) — Serviço, tipos e testes

- `services/orders/vehicleRentalService.ts`: `getContracts/saveContract`, `getPeriods`, `calculatePeriod`, `simulatePeriod`, `allocatePeriod`, `closePeriod`, `reopenPeriod` → RPCs; **despesas**: `getRentalExpenses/saveRentalExpense/deleteRentalExpense` + `VehicleMonthlyExpense` + `variableValue`/`variablePerKm` (summary) + `rentalValue`/`variableValue`/`variableOvvId` (detail); **R$/km**: `operationalValue`/`operationalPerKm` (summary) e `operationalValue` (detail), mapeados dos RPCs.
- `services/core/orderConfigService.ts`: `getVehicleCostTypes/saveVehicleCostType` (linha de `getCancelReasons`, :878).
- Proxy tipado em `services/dataService.ts` (assinatura + `apply(service, arguments as any)` — regra do AGENTS.md: tipo no service especializado **e** no proxy).
- `visitsService.getOrderVisitVehicles` (:1097): mapear `costType`; `amount` de linha `rental`/`variable` vem da coluna (linhas `odometer`/`rate` continuam com `recorder_end − recorder_start`); tipo `OrderVisitVehicle.costType = 'odometer' | 'rental' | 'variable' | 'rate'`.
- `utils/vehicleRentalAllocation.ts` (helper puro de preview) + `utils/vehicleRentalAllocation.test.ts` (km zero, idempotência, 2 veículos, vigência, `cost_component` distinto não duplica).

## 7. Fase 3 — UI

| Tela/Arquivo | Conteúdo |
|---|---|
| `views/Transport/RentalContractList.tsx` + `RentalContractForm.tsx` | Contrato: veículo (via `usersService.searchVehicles`), valor mensal, vigência |
| `views/Transport/RentalApportionmentScreen.tsx` | Competência → card por veículo em **3×3** (Aluguel \| Despesas \| Km total · **R$ Km** \| **R$/km op.** \| **Custo total/km** · Apropriado \| Ociosidade \| Utilização) → **[DESPESAS]** (CRUD do mês, `cfg_vehicles_costs_types`, travado em `ALLOCATED/CLOSED`) → **[SIMULAR]** (tabela visita a visita: Km \| **R$ Km** \| R$/km \| Aluguel \| Despesas \| Total) → **[CONFIRMAR APROPRIAÇÃO]** → **[FECHAR COMPETÊNCIA]** (fechada = bloqueada) · totais da competência com **R$ Km** |
| `views/Settings/VehicleCostTypes/VehicleCostTypesList.tsx` + `VehicleCostTypeForm.tsx` | CRUD de tipos paramétricos — entradas: `SETTINGS_SCREENS` + switch no `SettingsRouter.tsx`, botão no hub `AppSettings.tsx`, lazy em `app/routes.tsx` |
| `views/OrderVisit/OrderVisitVehicle/OrderVisitVehiclesList.tsx` | Linhas `rental`/`variable`/`rate`: badge **"Rateio Aluguel"** / **"Rateio Despesas"** / **"Rateio R$ / Km"** (tom emerald/amber/azul), sem campos de odômetro, somente-leitura e não removíveis (`isRateioLine`/`rateioTone`) |
| `views/OrderVisit/OrderVisitFinancialDetail.tsx` | Card Transporte subdividido em **4 partes**: **"Km"** (odômetro) \| **"Rateio R$/km"** \| **"Rateio Aluguel"** \| **"Rateio Despesas"** (soma total inalterada) |
| `components/reports/VisitReportDocument.tsx` | Tabela Transporte (:744) identifica linha do rateio (`Rateio Aluguel ·` / `Rateio Despesas ·`); linha `rate` cai no `else` e continua exibindo a **placa** (PDF inalterado) |
| `components/shell/Sidebar.tsx` | Entrada da Apuração atrás de `canView('transport_rental_apportionment')` |
| `app/routes.tsx` + `App.tsx` | Lazy (lazyWithRetry) + mapa screen → elemento |
| `features.ts` + `.env.example/.env.local/.env.production` | Flag `VITE_FEATURE_VEHICLE_RENTAL` (padrão `isFinancialApprovalEnabled`) |

## 8. Fase 4 — Validação

1. `npm run lint` (tsc) + `npm test` após cada fase de código.
2. Migration aplicada manualmente no SQL Editor + script de teste embutido: 2 veículos, 5 visitas → conferir custo/km, ociosidade, idempotência da re-execução, imutabilidade pós-fechamento, `total_km=0`.
3. **Despesas variáveis + R$/km + contrato R$/km + rateio sem aluguel (ordem obrigatória):** aplicar `20261008_create_vehicle_rental_rateio.sql` **primeiro**, depois `20261009_add_vehicles_monthly_expenses.sql`, depois `20261010_add_vehicle_rate_contracts.sql` (Parte A) e por fim `20261011_expenses_without_rental_contract.sql` (Parte B — seu summary de `20261011` é só um `CREATE OR REPLACE` aditivo, mas o guard de Km de A precisa existir antes). Rodar `validate_rateio_aluguel.sql` (tolerante: passa na Fase 1 **e** na Fase 2) + `validate_despesas_variaveis.sql` (15 seções) + `validate_rate_contracts.sql` (9 testes) + `validate_expenses_without_rental.sql` (9 testes) — todos transação + ROLLBACK. ⚠️ Re-executar a Fase 1 **depois** da Fase 2 falha de propósito (mudança de `RETURNS TABLE`).
   - ⚠️ **Banco vivo já com 08–11 aplicadas nos nomes antigos:** aplicar **primeiro** `20261012_rename_vehicles_cost_tables.sql` (+ `validate_rename_vehicles_costs.sql`) — os `validate_*` do repo já usam os nomes novos (`cfg_vehicles_costs_types` / `cfg_vehicles_rentals_contracts`) e falhariam sem o rename.
   - **Classificação dos erros do trigger (importante):** sem contrato de R$/km vigente, salvar Km lança `EXCEPTION` legível para o usuário no `handleUpdateKm` (OrderVisitVehiclesList) — é comportamento esperado, não bug. `amount = 0` continua livre.
4. Harness local PG18 (`/tmp/opencode/pgtest`): `node run.mjs` (**70/70**) + `node run_fase2.mjs` (**84/84** — inclui conversão `rate`, `operational_*`, guards, estorno e DOWN).
5. E2E: apurar → confirmar → linha `rate`/`rental`/`variable` na visita → card Transporte em 4 partes → PDF → status `approved` preservado; lançar despesa em competência alocada deve ser recusada pelo guard; estorno devolve a linha de Km ao odômetro; **Parte A:** lançar Km em veículo **sem** contrato de R$/km → erro do trigger; cadastrar contrato na tela **Apuração > Contratos de R$/km** (`/transport/rate-contracts`) → salvar Km passa; backfill criou contratos até 31/12/2026; import Manus cria contrato automático; **Parte B:** veículo com despesas mas **sem** contrato de aluguel aparece na Apuração e permite **Confirmar Apropriação** só com o componente `variable` (aviso azul), veículo sem aluguel **e** sem despesas fica com ação bloqueada (aviso âmbar).

## 9. Regras de negócio consolidadas

- Nunca gravar custo calculado em tempo real na visita — só na apuração mensal.
- Rateio **nunca** igualitário por nº de visitas — sempre proporcional ao Km.
- Competência `CLOSED` é imutável (guard de trigger).
- Re-execução idempotente (unique index) — allocate pode rodar 2x sem duplicar.
- Visita sem Km no mês não recebe rateio (vira ociosidade).
- Visitas `approved` recebem rateio **mantendo** o status (decisão explícita).
- Linhas `rental` nunca alteram o odômetro nem são editáveis na UI.
- Linha de Km rateada nasce como `rate` (mesmo id/valores da linha original); o **estorno a devolve a `odometer`** e a destrava — nunca criar uma segunda linha de Km (isso seria dupla cobrança).
- `operational_*` (R$/km) é 100% proporcional ao Km: **não gera ociosidade** — ociosidade/utilização continuam só de aluguel + despesas.

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Contratos com vigências sobrepostas no mesmo mês | Função escolhe o vigente e sinaliza conflito |
| Visita aprovada ganha valor sem nova aprovação | Aceito pelo usuário; visível no card Transporte |
| R$/km do rateio = R$/km do odômetro → mistura no resumo financeiro | Ajuste do `fc_financial_orders_visits_vehicles_sum` (Fase 1.8) |
| Tela `VehicleCostTypes` órfã até a Fase 2 | Aceito (decisão A+C); seed garante dados válidos |
| Migration com DROP CASCADE quebrando dependentes | Só `CREATE OR REPLACE` aditivo (AGENTS.md) |

## 11. Fase 2 (DB) — custos variáveis reais + componente R$/km ✅ implementada

Arquivos: `dev/supabase/migrations/20261009_add_vehicles_monthly_expenses.sql` (+ `_DOWN.sql`) e `dev/supabase/validate_despesas_variaveis.sql`. **Validada no harness PG18 local: 84/84 checks** (summary/detalle com `variable_value` **e** `operational_*`, calculate, allocate de 2 componentes + conversão `rate`, guards, fechar/estornar/recalcular, DOWN + reexecução).

**Despesas variáveis**

- Tabela `vehicles_monthly_expenses` (`vehicle_id`, `reference_month` dia 1, `cost_type_id FK cfg_vehicles_costs_types`, `value > 0`, `description`) + RLS + grants.
- Guard `fc_vehicles_monthly_expenses_guard` bloqueia INSERT/UPDATE/DELETE quando a competência está `ALLOCATED/CLOSED`.
- `summary`/`detail`/`calculate`/`allocate`/`revert` somam `variable_value` — `allocate` grava **até 2 linhas por visita** (`RENTAL` + `VARIABLE`), `ociosidade = (aluguel + despesas) − Σ rateios`.
- `summary`/`detail` só usam os valores **gravados** no período em `ALLOCATED/CLOSED`; em `OPEN` e `CALCULATED` calculam **ao vivo** (após um estorno as despesas continuam editáveis e o card não pode mostrar o somatório gravado antigo).
- `cost_per_km = (aluguel + despesas) ÷ total_km` (6 casas); total_km 0 → `NULL`.

**Componente R$/km (`cost_type 'rate'`)**

- **CHECK** de `orders_visits_vehicles.cost_type` ampliada para `('odometer','rental','variable','rate')` (DROP + ADD, sem CASCADE).
- **Conversão em lugar** no `allocate`: após inserir as allocations, a própria linha de Km do mês vira `rate` (só `cost_type` muda — `amount`/`value_unit`/`value_total`/odômetro intactos). Como o rollup soma **todas** as linhas, `ov_vehicles_value` **não muda** (mesmo total, zero dupla).
- `fc_orders_visits_vehicles_before_save` recriada com ramo de **conversão**: troca `odometer ↔ rate` passa sem recalcular `value_unit` (que viria de `vehicles.value_unit` ao vivo) nem apagar as leituras do odômetro.
- Filtros de Km em summary/detail/calculate/allocate/preview/revert: `cost_type IN ('odometer','rate')`.
- **`rate` é imutável** fora da RPC (guard: INSERT/UPDATE bloqueados; DELETE bloqueado via allocation `a.ovv_id`) e o estorno a devolve a `odometer` capturando os `ovv_id` **antes** de apagar as allocations.
- RPCs expõem **`operational_value`** (Σ `value_total` das linhas de Km) e **`operational_per_km`** (`÷ total_km`) no summary; **`operational_value`** por visita no detail.
- **`ociosidade`/`utilização` não mudam**: R$/km entra só no custo total/km (2 células azuis no card da Apuração).

**DOWN (`_DOWN.sql`)** — seção 0: flag + flip `rate → odômetro` + remoção das linhas `variable`/allocations + recálculo só-com-aluguel dos períodos; depois restaura guard, **CHECK de 3 valores**, `before_save` da Fase 1, summary/detail/calculate/allocate/revert (corpos extraídos da Fase 1 por `gen_fase2_down.js`).

- UI: modal de despesas na Apuração, cards 3×3, split em 4 partes, badges (emerald/amber/azul), coluna R$ Km na Simular, PDF.
- ⚠️ **Não re-executar a Fase 1 depois desta** (falha ruidosa por design — a Fase 1 não pode reverter o guard).

Ainda futuros: base horas/dias, CRUD de veículos, dashboard de ociosidade, renomear tabelas para `vehicle_cost_*`.

## 12. Parte A — Contrato de R$/km com vigência ✅ implementada (10/10/2026)

Arquivos: `dev/supabase/migrations/20261010_add_vehicle_rate_contracts.sql` (+ `_DOWN.sql`), `dev/supabase/validate_rate_contracts.sql`, `services/orders/vehicleRateService.ts`, `views/Transport/RateContractList.tsx`, `views/Transport/RateContractForm.tsx`.

- Tabela **`cfg_vehicle_rate_contracts`** (`vehicle_id`, `start_date`, `end_date`, `value_unit numeric(14,6) >= 0`, `active`, `description`) — vigência versionada do R$/km (antes era o campo único `vehicles.value_unit`).
- **`fc_vehicle_rate_contract(p_vehicle_id, p_on_date)`** (STABLE): resolve o contrato vigente (`ORDER BY start_date DESC, id DESC LIMIT 1`) e sinaliza conflito (`count(*) OVER () > 1`) quando há mais de um cobrindo a data.
- **Guard no trigger** `fc_orders_visits_vehicles_before_save`: `amount > 0` (odômetro) exige contrato vigente na data do lançamento (`COALESCE(NEW.created_at, ov_created_at, now())::date`) → `RAISE EXCEPTION` com instrução de cadastro; `amount = 0` usa `vehicles.value_unit` como fallback.
- **Backfill idempotente**: cria contrato automático para todo veículo com `value_unit > 0` sem contrato (início 1º do mês da 1ª visita ou mês corrente, fim `DATE '2026-12-31'`).
- Rota/rota filha `transport_rate_contracts` (`/transport/rate-contracts`, icon `speed`, parent `orders`) + grants copiados de `transport_rental_apportionment` (permissão `transport_rate_contracts`).
- UI: `RateContractList`/`RateContractForm` (espelho dos contratos de aluguel; `valueUnit` step 0.001, pré-preenche do veículo, vigência/situação/observação), ligadas ao mapa de screens (`'rate-contracts'`) com volta para `rental-apportionment`.
- **Import Manus** (`manusIntegrationService.ts`): `ensureVehicleRateContract` cria contrato automático (1º do mês corrente → 31/12/2026, `value_unit = PriceUnit`) quando não há vigente, antes de inserir linhas de odômetro — sem isso o import seria bloqueado pelo guard.
- Visitas lançam Km com `x R$ … / km` + tooltip explicando origem/bloqueio (`OrderVisitVehiclesList`).

## 13. Parte B — Despesas e rateio sem contrato de aluguel ✅ implementada (10/10/2026)

Arquivos: `dev/supabase/migrations/20261011_expenses_without_rental_contract.sql` (+ `_DOWN.sql`), `dev/supabase/validate_expenses_without_rental.sql`, ajustes em `RentalApportionmentScreen.tsx`.

- Só `CREATE OR REPLACE` de 4 funções (sem `DROP` — grants preservados): `fc_vehicle_rental_summary`, `fc_vehicle_rental_detail`, `fc_vehicle_rental_calculate`, `fc_vehicle_rental_allocate`.
- **summary**: CTE `base` com 3 fontes de veículo — `prio 1` contratos de aluguel vigentes, `prio 2` despesas do mês, `prio 3` contratos de R$/km vigentes (`NULL::bigint, NULL::numeric` para aluguel) — agrupadas por `vehicle_id`.
- **calculate**: sem contrato + com despesas → grava `contract_id NULL`, `contract_value 0`, `has_conflict false` (só o componente `variable`); sem contrato + sem despesas → `RAISE EXCEPTION 'Sem contrato de aluguel e sem despesas no mês: nada a apurar …'`.
- **detail**: `COALESCE(v_contract, 0)` na prévia; **allocate**: `v_rental_rate` só quando `contract_id IS NOT NULL` e branch `RENTAL` guardado (gera apenas linhas `variable`).
- **DOWN**: corpos originais da Fase 2 extraídos literalmente de `20261009` (linhas 364-535, 550-669, 678-805, 820-974).
- **UI (Apuração)**: `hasContract || hasExpenses` libera **Confirmar Apropriação**; aviso **azul** "rateio só de despesas" quando há despesas sem aluguel, aviso **âmbar** "nada a apurar" quando não há aluguel nem despesas; botão **Contratos de R$/km** (`speed`) no header; empty state cobre as 3 fontes de veículo.

⚠️ **Ordem de aplicação manual no SQL Editor:** `20261008` → `20261009` → `20261010` → `20261011` (cada `_DOWN.sql` reverte apenas a própria migration; `20261011_DOWN` restaura os corpos de `20261009`). **Rename (banco vivo, 08–11 já aplicadas): `20261012_rename_vehicles_cost_tables.sql` → `validate_rename_vehicles_costs.sql`** — recria `fc_vehicle_rental_summary` (única função viva que referenciava as tabelas por nome; grants/RLS/FKs são OID-based e sobrevivem) e recarrega o schema cache do PostgREST. Em instalações novas a `20261012` é no-op (as migrations 08–11 do repo já criam os nomes novos).
