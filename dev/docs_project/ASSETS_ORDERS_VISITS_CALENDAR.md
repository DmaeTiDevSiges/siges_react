# 📅 AssetsOrdersVisitsCalendar — Plano de Implementação

> Matriz anual de Ordens de Serviço (OS) por **Ativo × Mês**, com quantificação por **sub-tipo** (PRV, COR, …).
> Inspirada em `DashboardOrdersAdminCalendarScreen.tsx`, porém em escala **12 meses × N ativos**.

---

## 1. Visão Geral

| Item | Decisão |
|---|---|
| Nome do componente | `AssetsOrdersVisitsCalendar` |
| Caminho do view | `views/Dashboards/AssetsOrdersVisitsCalendarScreen.tsx` |
| Fonte de dados | `v_orders_visits_assets` (asset ↔ OS ↔ visita ↔ sub-tipo ↔ datas) |
| Granularidade temporal | Mensal, dentro de um ano selecionado |
| Granularidade espacial (linhas) | Ativo (`assets.id` → `code` + `description`) |
| Granularidade do conteúdo (célula) | Sub-tipo da OS (`cfg_orders_types_sub.code` → `PRV`, `COR`, …) com **contagem** |
| Navegação de ano | Botões `‹` e `›` ao redor do ano corrente |
| Filtros aplicáveis | Contrato, Cliente, Equipe, Setor (asset_tag), Tipo de OS (somente tipo, não sub) |
| Permissão | `dashboard_orders_visits` (mesma do calendário semanal) |
| RLS | As views já respeitam as policies existentes — não é necessário criar policies novas |

---

## 2. Layout (Wireframe)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Header:  ‹  [ 2026 ]  ›        [ Contrato ▾ ]  [ Tipo ▾ ]  [ 🔍 buscar ]       │
├──────────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────┤
│   ATIVO      │JAN │FEV │MAR │ABR │MAI │JUN │JUL │AGO │SET │OUT │NOV │DEZ │TOTAL│
├──────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─────┤
│ 333 BOMBA-01 │PRV │    │COR │    │PRV │    │    │PRV │    │COR │PRV │    │  5  │
│              │ 1  │    │ 1  │    │ 2  │    │    │ 1  │    │ 1  │ 1  │    │     │
├──────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─────┤
│ 444 VÁLV-A   │COR │COR │    │PRV │    │    │    │    │PRV │    │    │PRV │  5  │
│              │ 1  │ 1  │    │ 1  │    │    │    │    │ 1  │    │    │ 1  │     │
└──────────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴─────┘
```

### 2.1 Estrutura HTML/CSS

- Wrapper: `div` com `overflow-x-auto` (em mobile: scroll horizontal).
- Grid **CSS Grid** de 14 colunas: `grid-template-columns: minmax(220px,1.4fr) repeat(12, minmax(70px,1fr)) minmax(70px,0.6fr);`
- Cabeçalho **sticky** (`sticky top-0 z-10`) com 12 colunas de mês + coluna extra de **TOTAL ANUAL**.
- Coluna de ativo **sticky à esquerda** (`sticky left-0 z-10`) com fundo opaco (`bg-white dark:bg-slate-900`).
- Zebra rows: alternância de `bg-slate-50 dark:bg-slate-900/40`.
- Linhas sem dados no ano: total `0` em cinza claro.
- Hover na linha: `hover:bg-slate-100 dark:hover:bg-slate-800/60` + cursor pointer.
- Cada célula de mês contém um **stack vertical de badges**, um por sub-tipo (`PRV(2)`, `COR(1)`).
- Badge: pill colorida baseada em mapa determinístico de cores por sub-tipo (hash → `hsl`).

### 2.2 Controles do header

- **Botão `‹`**: decrementa o ano (`setYear(year - 1)`).
- **Botão `›`**: incrementa (`setYear(year + 1)`).
- **Botão "Hoje"**: volta para o ano atual (`setYear(new Date().getFullYear())`).
- **Botão `⟲` Refresh**: reexecuta a query manualmente.
- Filtros laterais (reaproveitar `OrderFilters` + `FilterSelect`).

---

## 3. Modelo de Dados

### 3.1 Tipos TypeScript (a criar em `types.ts`)

```ts
// Adicionar em types.ts (próximo ao bloco de DashboardOrdersAdminCalendarScreen)
export interface AssetOrdersVisitsCell {
  subTypeCode: string;       // "PRV", "COR", "ELE"...
  subTypeId: number;
  count: number;             // total de OSs no mês para este ativo+sub-tipo
}

export interface AssetOrdersVisitsRow {
  assetId: string;
  assetCode: string;
  assetDescription: string;
  unitId?: string;
  unitDescription?: string;
  // 12 buckets, índice 0 = Jan, 11 = Dez
  months: AssetOrdersVisitsCell[][]; // array de length 12, cada um um array de sub-tipos
  yearTotal: number;
}

export interface AssetOrdersVisitsColumn {
  month: number;             // 1..12
  yearTotal: number;         // soma do mês para todos os ativos
  subTypeTotals: { code: string; count: number }[];
}
```

### 3.2 View fonte: `v_orders_visits_assets`

Colunas relevantes (já confirmadas no `dataService.ts`):

| Coluna | Uso |
|---|---|
| `asset_id`, `code`, `description` | Identificação do ativo (linha) |
| `before_unit_description`, `before_unit_id` | Unidade atual do ativo |
| `o_id`, `ov_id`, `o_mask`, `ov_mask` | OS / Visita |
| `o_type_id`, `o_type_code`, `o_type_sub_id`, `o_type_sub_code` | Tipo e sub-tipo (PRV/COR) |
| `o_contract_id`, `o_team_id` | Filtros |
| `ov_started_at`, `ov_ended_at`, `o_requested_at` | Datas — usar `ov_started_at` (fallback `o_requested_at`) para mês/ano |
| `ov_is_filed`, `ov_is_deleted` | Excluir `is_deleted = true` |

### 3.3 Por que `v_orders_visits_assets` é a fonte correta

- Já traz **ativo + visita + OS + sub-tipo + data** em uma única view.
- `v_orders_visits` agregaria por OS (sem detalhe de ativos individuais).
- `v_orders` não tem ligação com ativos.
- Cada linha de `v_orders_visits_assets` representa um **ativo manipulado** em uma visita — exatamente a granularidade da contagem (`PRV(2)` = 2 visitas-ativo do tipo PRV no mês).

### 3.4 Estratégia de agregação (cliente)

Como o objetivo é apenas **contagem mensal por (asset, sub-tipo)**, a estratégia recomendada é:

1. **Buscar todas as linhas do ano** (1 query, 1 ano, sem paginação).
2. **Agrupar em memória** (Map<assetId, Map<month, Map<subTypeId, count>>>).
3. Derivar `months[0..11]` e `yearTotal`.

> Volume esperado: ~5–50k linhas/ano é trivial para o navegador. Supabase aceita `.range(0, 9999)` e paginação adicional se necessário.

Caso o volume seja muito alto (>50k linhas/ano), evoluir para uma **RPC** `fc_assets_orders_visits_calendar(p_year int, p_contract_ids int[], p_type_id int) returns table(...)` que devolva já agregado. **Manter como plano B** — a abordagem cliente é a v1.

---

## 4. Camada de Dados (`dataService.ts`)

Adicionar duas funções em `services/dataService.ts` (próximo a `getOrdersVisitsView`, ~linha 909):

```ts
// 1) Lista os sub-tipos distintos usados (para o FilterSelect "Sub-tipo em destaque")
async getOrderSubTypesAll(): Promise<{ id: number; code: string; description: string }[]>

// 2) Busca todas as linhas de v_orders_visits_assets no ano + filtros aplicados
async getAssetsOrdersVisitsForYear(filters: {
  year: number;
  contractId?: string | string[];
  systemParentId?: string | string[];
  unitTypeParentId?: string | string[];
  unitId?: string | string[];
  typeId?: string | string[];        // filtro opcional por tipo (não sub)
  tagId?: string | string[];         // asset_tag (setor)
  tagSubId?: string | string[];
}): Promise<RawAssetOrdersVisitRow[]>
```

**Implementação da função 2:**

```ts
let q = supabase
  .from('v_orders_visits_assets')
  .select(
    'asset_id, code, description, before_unit_id, before_unit_description, ' +
    'o_id, ov_id, o_mask, ov_mask, ' +
    'o_type_id, o_type_code, o_type_sub_id, o_type_sub_code, ' +
    'o_contract_id, o_system_parent_id, o_unit_type_parent_id, o_unit_id, o_asset_tag_id, o_asset_tag_sub_id, ' +
    'ov_started_at, ov_ended_at, o_requested_at, ov_is_deleted'
  )
  .eq('ov_is_deleted', false)
  .gte('ov_started_at', `${year}-01-01 00:00:00`)
  .lte('ov_started_at', `${year}-12-31 23:59:59`)
  .order('ov_started_at', { ascending: true })
  .range(0, 9999);   // paginar depois se necessário
```

> ⚠️ Se houver muitos `ov_started_at` nulos, replicar o padrão de `getOrdersVisitsView` (linhas 947/950) usando `or(...)` com fallback para `o_requested_at`.

Helpers de filtro (`applyFilter` idêntico ao da linha 953) para `o_contract_id`, `o_system_parent_id`, `o_unit_type_parent_id`, `o_unit_id`, `o_type_id`, `o_asset_tag_id`, `o_asset_tag_sub_id`.

---

## 5. Camada de Apresentação

### 5.1 Componente principal

`views/Dashboards/AssetsOrdersVisitsCalendarScreen.tsx`

**Props:**

```ts
interface AssetsOrdersVisitsCalendarScreenProps {
  currentUser: User;
  onSelectVisit?: (visit: OrderVisit) => void;   // drill-down (clique na célula)
  onSelectOrder?: (order: Order) => void;        // drill-down (clique na badge)
}
```

**Estados locais:**

```ts
const [year, setYear] = useState<number>(new Date().getFullYear());
const [filters, setFilters] = useState<OrderFilters>({ contractId: [] });
const [appliedFilters, setAppliedFilters] = useState<OrderFilters>({ contractId: [] });
const [rows, setRows] = useState<AssetOrdersVisitsRow[]>([]);
const [columns, setColumns] = useState<AssetOrdersVisitsColumn[]>([]);
const [loading, setLoading] = useState(true);
const [selectedCell, setSelectedCell] = useState<{
  assetId: string; month: number; subTypeCode: string;
} | null>(null);
```

**Efeitos:**

- `useEffect([year, appliedFilters]) → fetchData()` — busca o ano completo.
- `useMemo` para transformação raw → `rows` + `columns` + totais.
- `useMemo` para color map determinístico de sub-tipos.

### 5.2 Sub-componentes

| Componente | Função | Props principais |
|---|---|---|
| `<YearHeader year onPrev onNext onToday onRefresh />` | Faixa superior com setas | `year: number`, callbacks |
| `<AssetColumn rows loading onSelect />` | Coluna sticky de ativos | lista de `AssetOrdersVisitsRow` |
| `<MonthCell cells onClick />` | 1 célula da matriz | `AssetOrdersVisitsCell[]` |
| `<SubTypeBadge code count color onClick />` | Pill `PRV(2)` | code, count, color, onClick |
| `<MonthDetailModal ... />` | Lista de OSs/visitas ao clicar na célula | filtros aplicados + ativo + mês + sub-tipo |

### 5.3 Drill-down (modal de detalhes)

Ao clicar em uma badge (ex.: `PRV(2)` em MAR/2026 do ativo 333):

1. Abre `<MonthDetailModal>` com cabeçalho: `Ativo 333 — BOMBA-01 · MAR/2026 · PRV`.
2. Reconsulta `v_orders_visits_assets` com:
   - `asset_id = X`
   - `o_type_sub_code = 'PRV'`
   - intervalo `YYYY-MM-01` → `YYYY-MM-31`.
3. Lista em um `OrderVisitAssetList` simplificado (código, mask, status, datas, equipe).
4. Clique em item → `onSelectVisit(visit)` (reaproveita o fluxo de abrir visita).

### 5.4 Badges e cores

```ts
const SUBTYPE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  PRV: { bg: 'bg-amber-100 dark:bg-amber-500/20',  text: 'text-amber-800 dark:text-amber-300',  ring: 'ring-amber-300' },
  COR: { bg: 'bg-rose-100 dark:bg-rose-500/20',    text: 'text-rose-800 dark:text-rose-300',    ring: 'ring-rose-300' },
  ELE: { bg: 'bg-sky-100 dark:bg-sky-500/20',      text: 'text-sky-800 dark:text-sky-300',      ring: 'ring-sky-300' },
  MEC: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-300', ring: 'ring-emerald-300' },
};
// Sub-tipos fora do mapa → hash determinístico (igual a DashboardOrdersAdminCalendarScreen linhas 910-912)
```

> O usuário pode confirmar/ajustar essa lista de cores consultando `cfg_orders_types_sub` (já disponível via `getOrderSubTypesByType` em `dataService.ts:527`).

### 5.5 Estados visuais

| Estado | Aparência |
|---|---|
| Linha sem nenhuma OS no ano | Texto cinza, sem badges, total `0` |
| Mês com 0 OSs no ativo | Célula vazia com placeholder `—` em `text-slate-300` |
| Mês atual | Header da coluna com anel `ring-2 ring-primary/40` |
| Linha com `ov_is_filed = false` | Border-left `border-l-2 border-amber-400` (alerta) — opcional |
| Loading inicial | Skeleton de 10 linhas × 14 colunas |
| Erro | `toast.error()` + retry button |

---

## 6. Integração com o App

### 6.1 Tela / Roteamento

O projeto usa **estados internos** (não React Router). Adicionar em `App.tsx`:

1. **Linha 106** — acrescentar à union `Screen`:
   ```ts
   | 'assets-orders-visits-calendar'
   ```
2. **Linha 28-33** — adicionar import:
   ```ts
   import { AssetsOrdersVisitsCalendarScreen } from "./views/Dashboards/AssetsOrdersVisitsCalendarScreen";
   ```
3. **Linha 1615** (no `switch (currentScreen)`) — adicionar:
   ```ts
   case 'assets-orders-visits-calendar':
     return (<AssetsOrdersVisitsCalendarScreen currentUser={currentUser!} onSelectVisit={handleVisitSelect} />);
   ```
4. **handleBack** (linha 860) — adicionar:
   ```ts
   } else if (currentScreen === 'assets-orders-visits-calendar') {
     setCurrentScreen('orders-dashboard');
   }
   ```
5. **DashboardTabs** (linha 384, 426) — incluir `'assets-orders-visits-calendar'` em `isDashboardScreen` e adicionar nova tab **"Matriz"** (ícone `grid_view`) ao lado de **"Calendário"**.

### 6.2 Permissões

Adicionar à `permissionService.ts` (mesma chave já usada para o calendário):

```ts
'dashboard_assets_orders_calendar': { /* padrão: pode ver, sem edit */ }
```

Reutilizar a permissão `dashboard_orders_visits` para evitar novo cadastro. A `DashboardTabs` deve usar:

```ts
const hasMatrix = canView('dashboard_orders_visits');
```

### 6.3 Persistência

- Salvar o ano corrente em `localStorage` (`aovc_year`) para restaurar ao voltar.
- Salvar `appliedFilters` no mesmo padrão de `DashboardOrdersAdminCalendarScreen` (linhas 703-716) → chaves `aovcAdvancedFilters` / `aovcAppliedFilters`.

---

## 7. Performance

| Cenário | Mitigação |
|---|---|
| > 10k linhas no ano | Adicionar `.range(0, 9999)` + paginação interna ou mover agregação para **RPC** `fc_assets_orders_visits_calendar` |
| Re-render excessivo ao trocar ano | Usar `useMemo` para `rows`/`columns` + `React.memo` em `MonthCell` e `SubTypeBadge` |
| Filtros pesados (muitos contratos) | Aplicar `.in('o_contract_id', ids)` no servidor — já implementado no helper |
| Mobile | Scroll horizontal; cabeçalho do mês sticky; ativo em linha truncada com tooltip |

---

## 8. Acessibilidade & UX

- Setas `‹` / `›` devem ter `aria-label="Ano anterior"` / `"Próximo ano"`.
- Células clicáveis: `<button>` (não `<div onClick>`) para navegação por teclado.
- Tab order: header → ativo 1 → ativo 2 → …
- Contraste das badges verificado para `dark` e `light`.
- `prefers-reduced-motion`: animações de hover desligadas.
- Tooltip no total anual: `"5 ordens no ano"` (`title` + `aria-describedby`).

---

## 9. Testes Manuais (QA)

Checklist mínimo antes de marcar como pronto:

1. [ ] Trocar ano (‹ ›) recarrega a matriz.
2. [ ] Voltar para o ano atual com botão **Hoje**.
3. [ ] Filtrar por contrato → apenas OSs do contrato aparecem.
4. [ ] Filtrar por tipo (ELE) → apenas sub-tipos de ELE exibidos.
5. [ ] Clicar em `PRV(2)` → modal mostra as 2 visitas.
6. [ ] Clicar em uma visita do modal → tela de execução abre (`order-visit-execute`).
7. [ ] Mês atual destacado com anel `primary`.
8. [ ] Linha com `is_filed = false` marcada com border amber.
9. [ ] Mobile 375px: scroll horizontal funciona, coluna de ativo fica sticky.
10. [ ] Dark mode: cores legíveis, badges com fundo translúcido.
11. [ ] `tsc --noEmit` sem erros.
12. [ ] `npx tsc --noEmit` no novo arquivo isolado sem warnings de tipo.

---

## 10. Arquivos a Criar / Editar

| Arquivo | Tipo | Descrição |
|---|---|---|
| `views/Dashboards/AssetsOrdersVisitsCalendarScreen.tsx` | **CRIAR** | Componente principal |
| `views/Dashboards/components/AssetsOrdersVisitsCalendarYearHeader.tsx` | **CRIAR** | Header com setas |
| `views/Dashboards/components/AssetsOrdersVisitsCalendarCell.tsx` | **CRIAR** | Célula mensal (badges) |
| `views/Dashboards/components/AssetsOrdersVisitsCalendarMonthModal.tsx` | **CRIAR** | Modal de drill-down |
| `services/dataService.ts` | **EDITAR** | + `getAssetsOrdersVisitsForYear`, + `getOrderSubTypesAll` |
| `types.ts` | **EDITAR** | + `AssetOrdersVisitsRow`, `AssetOrdersVisitsCell`, `AssetOrdersVisitsColumn` |
| `App.tsx` | **EDITAR** | import + `Screen` + case + `handleBack` + tab "Matriz" |
| `services/permissionService.ts` | **EDITAR** | (opcional) chave `dashboard_assets_orders_calendar` |

---

## 11. Critérios de Pronto (DoD)

- ✅ Componente renderiza matriz 12 meses × N ativos.
- ✅ Setas `‹` `›` alteram o ano e recarregam dados.
- ✅ Cada célula mostra badges `SUBTIPO(quantidade)`.
- ✅ Drill-down abre modal com a lista de visitas do ativo+mês+sub-tipo.
- ✅ Filtros de contrato / tipo / setor funcionam.
- ✅ Performance aceitável para 1 ano (≤ 2s em dev).
- ✅ `tsc --noEmit` sem erros.
- ✅ Responsivo (mobile horizontal scroll).
- ✅ Documentado em `docs/ASSETS_ORDERS_VISITS_CALENDAR.md` (este arquivo).
- ✅ Permissão configurada / reutilizada.

---

## 12. Riscos & Mitigações

| Risco | Mitigação |
|---|---|
| Volume muito alto (> 50k linhas/ano) | Migrar para **RPC agregada** como v2 |
| `v_orders_visits_assets` mudar schema | Adicionar **select explícito** (não `*`) e validar colunas no `dataService` antes de publicar |
| Sub-tipos sem código cadastrado | Fallback: `[code ?? 'OUTROS'](n)` em cinza |
| Datas em `ov_started_at` nulas | Replicar padrão `or(...)` com `o_requested_at` (já usado em `getOrdersVisitsView`) |
| Troca rápida de ano gerar requests duplicados | Flag `isMounted` + `AbortController` + debounce 250ms |

---

> **Próximo passo**: confirmar este plano antes de codificar. Posso começar criando o `dataService.getAssetsOrdersVisitsForYear` (passo 1) e em seguida o esqueleto do componente.
