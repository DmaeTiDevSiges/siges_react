# Plano — Exclusão completa de visita técnica (`orders_visits.is_deleted = true`)

> **Status:** **IMPLEMENTADO EM CÓDIGO (2026-10-15)** — migration `dev/supabase/migrations/20261015_add_soft_delete_to_visit_children.sql` **ainda precisa ser aplicada manualmente no SQL Editor** antes de usar o recurso em produção (senão os updates nas tabelas filhas novas falham com coluna inexistente).
> **Data:** 2026-10-15
> **Decisões do produto:** soft delete da visita + todos os filhos; bloquear exclusão de visita
> em andamento/arquivada/aprovada e de visita com ativos avaliados; botão apenas no detalhe da
> visita; mecanismo por serviço direto (sem RPC); manter arquivos (fotos/PDF); sem restrição de
> perfil; criar colunas `is_deleted`/`deleted_at`/`deleted_user_id` nas tabelas filhas que não têm.

---

## 1. Objetivo

Permitir a **exclusão completa (soft delete) de uma visita técnica**: marcar
`orders_visits.is_deleted = true` e propagar o soft delete a todas as tabelas filhas, fazendo a
visita desaparecer de todas as telas sem alterar nenhuma query de leitura.

## 2. Por que funciona sem mudar leituras

- A view `v_orders_visits` filtra `WHERE is_deleted = false` **no query externo** (migration `dev/supabase/migrations/20261027_fix_v_orders_visits_soft_delete_filter.sql`) — quase toda leitura da app passa por ela.
  - ⚠️ **Correção (2026-10-16):** até esta migration, o filtro existia apenas dentro de um CTE `ov` que nunca era referenciado pelo `SELECT` externo (código morto) — visitas excluídas continuavam aparecendo em todas as telas. O CTE foi removido e o filtro movido para o `WHERE` externo.
- `ordersService.hasActiveVisits` e os guards da RPC `flow_order_visit_reassign_v1` **já** filtram `is_deleted = false`.
- Realtime (`subscribeToVisits`) dispara no UPDATE → listas se atualizam sozinhas.
- **Nenhuma view/RPC precisa ser recriada** — a migration é puramente aditiva.

## 3. Regras de negócio (guards)

Exclusão permitida **apenas** para visita encerrada, não arquivada/aprovada, sem ativos avaliados.
Sem restrição de perfil (qualquer usuário autenticado — RLS "Universal Access" já permite UPDATE).

| # | Guard | Condição | Mensagem de erro |
| :-- | :--- | :--- | :--- |
| 1 | Visita em andamento | `ov_status_id = 1` OU `ov_ended_at IS NULL` | `Visita em andamento. Encerre-a antes de excluir.` |
| 2 | Visita já excluída | `is_deleted = true` | `Visita já foi excluída.` |
| 3 | Arquivada | `ov_is_filed = true` | `Visita arquivada não pode ser excluída.` |
| 4 | Aprovada | `ov_approved_at` OU `ov_approved_filed_at` preenchido | `Visita aprovada não pode ser excluída.` |
| 5 | Financeiro aprovado | `ov_costs_status = 'approved'` | `Financeiro aprovado. Não é possível excluir a visita.` |
| 6 | Ativos avaliados | Existe `orders_visits_assets` com `is_deleted = false` e qualquer um de `reported_at`, `revised_at`, `disapproved_at`, `approved_at` preenchido ou `is_filed = true` | `A visita possui ativos avaliados e não pode ser excluída.` |

**Decisão D1 — visita aberta nunca é excluída** (diferente do reassign): não há efeitos em
`orders`/`users` porque `closeOrderVisit` já encerrou a visita e liberou a equipe antes da exclusão.

**Decisão D2 — arquivos mantidos**: fotos de ativos e relatório PDF permanecem no storage
(irreversível apenas nas flags; arquivos são preservados).

## 4. Escopo do soft delete (tabelas afetadas)

| Tabela | Tem `is_deleted` hoje | Ação |
| :--- | :--- | :--- |
| `orders_visits` | Sim (+ `ov_deleted_user_id`) | `is_deleted=true`, `deleted_at`, `ov_deleted_user_id`, `ov_updated_at/user_id` |
| `orders_visits_assets` | Sim (+ `deleted_at/user_id`) | soft delete por `ov_id` |
| `orders_visits_services` | Sim | soft delete por `ov_id` |
| `orders_visits_vehicles` | Sim | soft delete por `ov_id` |
| `orders_visits_assets_activities` | Sim | soft delete por `.in('ova_id', assetIds)` |
| `orders_visits_assets_materials` | Sim | soft delete por `.in('ova_id', assetIds)` |
| `orders_visits_teams` | **Não** | **migration** + soft delete por `ov_id` |
| `orders_visits_chat` | **Não** | **migration** + soft delete por `ov_id` |
| `orders_visits_chat_participants` | **Não** | **migration** + soft delete por `ov_id` |
| `orders_visits_chat_reads` | **Não** | **migration** + soft delete por `.in('chat_id', chatIds)` |
| `orders_visits_evaluations` | **Não** | **migration** + soft delete por `ov_id` |

> `orders_visits_extras` é entidade separada (sem FK `ov_id`) — **fora do escopo**.

## 5. Migration SQL (aplicação manual — SQL Editor)

Novo arquivo: `dev/supabase/migrations/20261015_add_soft_delete_to_visit_children.sql`

```sql
-- Puramente aditivo: nenhuma view/RPC dependente precisa ser recriada.
ALTER TABLE public.orders_visits ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

ALTER TABLE public.orders_visits_teams            ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                                                             deleted_at timestamp without time zone,
                                                             deleted_user_id bigint;
ALTER TABLE public.orders_visits_chat             ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                                                             deleted_at timestamp without time zone,
                                                             deleted_user_id bigint;
ALTER TABLE public.orders_visits_chat_participants ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                                                             deleted_at timestamp without time zone,
                                                             deleted_user_id bigint;
ALTER TABLE public.orders_visits_chat_reads       ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                                                             deleted_at timestamp without time zone,
                                                             deleted_user_id bigint;
ALTER TABLE public.orders_visits_evaluations      ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
                                                             deleted_at timestamp without time zone,
                                                             deleted_user_id bigint;
```

- `deleted_at` **sem offset**; valores gravados como horário de SP:
  `timezone('America/Sao_Paulo', now())` no SQL / `getBrazilTimestamp()` no TS (regra de fuso do AGENTS.md).
- Idempotente (`IF NOT EXISTS`) — seguro para reaplicar.

## 6. Service — `visitsService.deleteOrderVisit(visitId, currentUser)`

Arquivo: `services/orders/visitsService.ts` (padrão de `toolsService.deleteTool`).

1. Busca a visita (`ov_status_id, ov_ended_at, is_deleted, ov_is_filed, ov_approved_at,
   ov_approved_filed_at, ov_costs_status`) → guards 1–5 (fail-fast, `throw new Error(msg)`).
2. Guard 6: conta ativos ativos em estado avaliado.
3. Busca ids auxiliares: **todos** os `orders_visits_assets.id` da visita (FK `ova_id` de
   activities/materials) e todos os `orders_visits_chat.id` (FK `chat_id` de reads).
4. `Promise.all` de updates — todos filtrando `.eq('is_deleted', false)` e usando
   `{ is_deleted: true, deleted_at: getBrazilTimestamp(), deleted_user_id: currentUser.id }`:
   - `orders_visits` (`.eq('id')`, + `ov_deleted_user_id`, `ov_updated_at`, `ov_updated_user_id`)
   - assets/services/vehicles/teams/chat/participants/evaluations (`.eq('ov_id')`)
   - activities/materials (`.in('ova_id', assetIds)`)
   - chat_reads (`.in('chat_id', chatIds)`)
5. **Não** toca em `orders`, `users` nem storage.

> ⚠️ **Nota de atomicidade:** updates em paralelo **não** são transacionais (sem RPC). Risco aceito
> e declarado: falha no meio pode deixar filhos parcialmente marcados — a visita excluída some da
> view mesmo assim. Se o risco se mostrar inaceitável no uso real, evoluir para RPC
> `flow_order_visit_delete_v1` (padrão `flow_order_visit_reassign_v1`).

## 7. Proxy — `services/dataService.ts`

Assinatura idêntica na seção de lifecycle (~linha 2593, junto a `closeOrderVisit`):

```typescript
async deleteOrderVisit(visitId: string | number, currentUser: User): Promise<void> {
    return visitsService.deleteOrderVisit.apply(visitsService, arguments as any);
}
```

## 8. UI

| Arquivo | Mudança |
| :--- | :--- |
| `components/ordersVisits/DeleteVisitModal.tsx` (**novo**) | Modal de confirmação estilo `ConfirmDisapproveVisitModal` (visual rose, aviso do que será excluído, botão "Excluir definitivamente", `isLoading`) |
| `components/ordersVisits/OrderVisitCardDetail.tsx` | Renderizar botão **"Excluir visita"** usando a prop `onDeleteVisit` **já declarada** (linhas 20/44, hoje nunca usada), na área de ações (~linha 370); visível apenas quando `Number(visit.ovStatusId) === 2 && !visit.isFiled && !visit.approvedAt` (guard definitivo fica no service) |
| `views/OrderVisit/OrderVisitScreen.tsx:616` | Trocar `toast.success('Funcionalidade em desenvolvimento')` por `setDeleteModalOpen(true)`; handler: `dataService.deleteOrderVisit(visitId, currentUser)` → `toast.success('Visita excluída')` → `window.dispatchEvent(new Event('refresh_dashboard'))` → `onBack()` |

## 9. Cenário de negócio (passos)

| Passo | Situação |
| :--- | :--- |
| 1 | Visita foi encerrada (`ov_status_id=2`), nunca arquivada/aprovada, sem ativos avaliados |
| 2 | Usuário abre o detalhe da visita → botão "Excluir visita" visível |
| 3 | Modal de confirmação explica que visita, equipe, chat, ativos/serviços em rascunho serão excluídos (arquivos mantidos) |
| 4 | Confirmação → guards no service → soft delete em cascata das 11 tabelas |
| 5 | Visita some de todas as telas (view filtra); toast de sucesso; volta à tela anterior |

## 10. Erros comuns

| Erro | Causa | Solução |
| :--- | :--- | :--- |
| `Visita em andamento…` | guard 1 | encerre a visita antes |
| `Visita arquivada/aprovada não pode ser excluída.` | guards 3–5 | exclusão indisponível por design |
| `A visita possui ativos avaliados…` | guard 6 | remova/reporte os ativos antes, ou mantenha a visita |
| Botão não aparece | visita aberta/arquivada/sem permissão de tela | comportamento esperado (renderização condicional) |
| Coluna inexistente após deploy do TS | migration ainda não aplicada no Supabase | aplicar a migration no SQL Editor antes de publicar o app |

## 11. Pendências de implementação

1. ~~Migration §5~~ — **arquivo criado** (`20261015_add_soft_delete_to_visit_children.sql`); **falta aplicar no SQL Editor** (idempotente).
2. ~~Service §6 + proxy §7~~ — **IMPLEMENTADOS** (`visitsService.deleteOrderVisit` + `dataService.deleteOrderVisit`).
3. ~~Modal + botão + handler §8~~ — **IMPLEMENTADOS** (`DeleteVisitModal`, botão em `OrderVisitCardDetail`, handler em `OrderVisitScreen` com condição `ovStatusId === 2 && !isFiled && !approvedAt`).
4. ~~Verificações~~ — **`npx tsc --noEmit`**: zero erros nos arquivos alterados · **`npm test`**: 162/162 passando. Resta o teste manual (bloqueios e exclusão feliz) após aplicar a migration.
5. Opcional: spec `flows/ordersVisits/delete-order-visit.flow` (estilo reassign).
