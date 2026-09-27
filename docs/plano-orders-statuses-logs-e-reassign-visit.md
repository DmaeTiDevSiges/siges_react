# Plano — Log global de situação (`orders_statuses_logs`) + Transferência de visita OS 1 → OS 2 + Histórico de situações (aba “Situações”)

> **Status:** **Parte 1 (log global) IMPLEMENTADA** — registros de `orders_statuses_logs` por trigger (`fc_orders_statuses_logs()` + `trg_orders_statuses_logs` / `trg_orders_statuses_logs_insert`), migration `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` (**aplicada no banco vivo — O1 ✅**). **Parte 2 (transferência de visita OS 1 → OS 2) IMPLEMENTADA E NO AR** — RPC `flow_order_visit_reassign_v1` aplicada no SQL Editor (O4 ✅) + `REVOKE` de `anon` (D16 ✅), spec `flows/ordersVisits/reassign-order-visit.flow`, service/proxy, modal + botão (D10); sandbox **37/37 (§6.4.1)**; restam os testes ao vivo (**O5**). **Regra D17 (chat fica na OS de origem)**: migration `20260926_orders_visits_chat_origin_order.sql` + efeito 8 na RPC **aplicados (O7 ✅)** — falta o teste no app. **Parte 3 (consumidor do log — P8) IMPLEMENTADA EM CÓDIGO** — aba **“Situações”** na OS, `ordersService.getOrderStatusHistory` + `OrderStatusHistoryTimeline` (D14/D15, spec `flows/orders/order-status-history.flow.md`).
> **Data:** 2026-09-24 · **Atualizado:** 2026-09-25  
> **Decisões do produto:** registrar histórico em `orders_statuses_logs`; reversão da OS 1 a partir dessa tabela; decrementar `ov_counter`; guards em `orders_visits_assets` **e** `orders_visits_services`; permissão apenas para o líder da visita; exibir o histórico de situações ao usuário.  
> **⚠️ Pendências abertas:** **§13** — aplicações manuais das 2 migrations, testes da §9, plus P2/P3/P5/P6/P7.

---

## 1. Objetivo

1. **Log global — IMPLEMENTADO:** toda alteração de situação de `orders` (`status_id`) em qualquer parte do app (TS, RPCs, cascata de herança, n8n, SQL manual) grava histórico em `orders_statuses_logs` **por trigger no banco** — nenhuma linha de código TypeScript participa.
2. **Transferência de visita — IMPLEMENTADA:** durante o deslocamento, o líder pode reapontar a visita em andamento (OS 1 → OS 2) preservando tempo/equipe/veículo, restaurando a situação anterior da OS 1 a partir do log.
3. **Consumidor do log — IMPLEMENTADO (P8):** a tela de detalhe da OS exibe as linhas do log numa aba **“Situações”** (timeline com situação, data efetiva, autor e vínculo de SS).


---

## 2. Cenário de negócio

| Passo | Situação |
|-------|----------|
| 1 | OS 1 (Autorizada, Agendada **ou** Suspensa) tem visita iniciada → OS 1 fica **Em execução** (status 5) |
| 2 | Em deslocamento, a equipe precisa atender a **OS 2** (Autorizada, Agendada ou Suspensa) |
| 3 | Reapontar a mesma visita da OS 1 para a OS 2 (`o_id` + `ov_mask` em `orders_visits`) |
| 4 | Condições: OS 1 **sem** ativos (`orders_visits_assets`) e **sem** serviços (`orders_visits_services`) na visita |
| 5 | Situação e `status_at` da OS 1 voltam ao estado **anterior ao início da visita** (via `orders_statuses_logs`) |
| 6 | `ov_counter` da OS 1 é decrementado (com proteção de colisão de máscara) |
| 7 | Somente o **líder** da visita (`ov_team_leader_id`) pode executar |

**IDs de situação (`cfg_orders_statuses`):** `1` Não programada · `2` Avaliação · `3` Autorizada · `4` Agendada · `5` Execução (em andamento) · `6` Suspensa · `7` Cancelada · `8` Concluída.

---

## 3. Achados do levantamento (2026-09-24)

### 3.1 Tabela de log

```sql
-- dev/supabase/schema.sql (atualizado em 2026-09-25)
CREATE TABLE public.orders_statuses_logs (
    id bigint NOT NULL,
    order_id bigint,
    order_status_id bigint,
    order_status_at timestamp without time zone,   -- renomeado de order_status_ate (OK)
    created_user_id bigint,
    created_date timestamp without time zone,
    order_parent_id bigint,
    company_id bigint,
    department_id bigint
);
```

- RLS ativa, policy `"Universal Access"`.
- **Antes da trigger:** zero INSERTs no repo (SQL, TS, n8n, scripts) → tabela órfã. **Hoje:** preenchida exclusivamente pela trigger `trg_orders_statuses_logs(_insert)`.
- Rename `order_status_ate` → `order_status_at` **executado** (bloco idempotente da migration; nenhum código de app referenciava o nome antigo).
- `databasus-*` têm apenas `GRANT SELECT` (não escrevem).


### 3.2 Quem altera status hoje (disperso, sem função central)

**SQL / RPC**

| Caminho | O que muda |
|---------|------------|
| `flow_order_visit_create_v2` (`dev/supabase/flow_order_visit_create_v2.sql`) | OS + SS pai → `status_id=5`, `status_at=now` |
| `flow_order_visit_close_v2` | OS → status do payload, `status_at=now` — **sem chamador `.rpc()` no front** |
| `fc_order_status_inheritance` (trigger) | Copia status da filha vencedora para a SS pai |

**TypeScript (`supabase.from('orders').update/insert`)**

| Método (`services/orders/…`) | Status |
|------------------------------|--------|
| `createServiceRequest` | INSERT `status_id=1` |
| `createOrder` | INSERT `status_id=2` |
| `authorizeOrder` | `3` + `updated_user_id` |
| `scheduleOrder` | `4` + **`status_at` fixo** (data agendada) + `updated_user_id` |
| `startOrderVisit` | RPC → `5` |
| `closeOrderVisit` | UPDATE direto (status do modal) — **não usa a RPC** |
| `updateOrderStatus` | qualquer |
| `completeServiceOrder` | `8` |
| `cancelServiceOrder` / `cancelOrder` | `7` |
| `updateOrder` | `statusId`/`statusAt` **condicionais** (podem ir separados) |
| `updateServiceRequestStatus` | Herança SS em TS (duplica o trigger) |

**Não mutam status:** views, n8n, scripts, demais services (materials, assets, etc.).

### 3.3 Triggers existentes em `orders`

| Trigger | Efeito |
|---------|--------|
| `trg_orders_statuses_logs` (`AFTER UPDATE OF status_id`, `WHEN OLD IS DISTINCT FROM NEW`) | **IMPLEMENTADO** — grava linha em `orders_statuses_logs` a cada mudança real de situação |
| `trg_orders_statuses_logs_insert` (`AFTER INSERT`) | **IMPLEMENTADO** — grava a situação inicial da ordem (SS `1`, OS `2`) |
| `trg_order_status_inheritance` | **Muta** status da SS pai (cascata → gera a própria linha de log) |
| `trg_followers_orders_status_changed` | Só notifica; usa `NEW.updated_user_id` |
| `tgr_orders_sanitize_requested_services` | Só normaliza `requested_services` |

As duas triggers de log executam `public.fc_orders_statuses_logs()` (`SECURITY DEFINER`, `SET search_path = public`), criada na mesma migration.

### 3.4 Riscos / limitações conhecidos

1. **`updated_user_id`** só é preenchido em `authorizeOrder` e `scheduleOrder` → `created_user_id` do log usa fallback `auth.uid()` → `users.id` → `NEW.updated_user_id` → `NEW.created_user_id`.
2. **Herança duplicada** (trigger + TS `updateServiceRequestStatus`) → com `IS DISTINCT FROM` no log, não há linha duplicada se os valores forem iguais.
3. **Visitas já em andamento** no deploy do trigger: sem linha pré-visita → reassign falha no guard (por design).
4. Duas implementações SQL concorrentes de `flow_order_visit_close_v2` (front usa UPDATE direto).
5. **⚠️ O trigger implementado reage só a `status_id`** (`UPDATE OF status_id` + `WHEN`): um UPDATE que mude **apenas `status_at`** (caso `updateOrder`, D5/§3.2) **não** gera linha. Se o plano de reassign precisar desse evento, é necessário um terceiro trigger `UPDATE OF status_at` — decisão pendente.
6. **⚠️ Semântica implementada é NEW (estado atual), não OLD** — ver §4; o guard 8 da RPC de reassign precisa ser ajustado.


---

## 4. Semântica do log (IMPLEMENTADA: estado NEW)

> ⚠️ **Divergência em relação ao desenho original (2026-09-24), que previa log de OLD.**
> A trigger em produção grava o estado **depois** da mudança (`NEW.status_id` / `NEW.status_at`); no INSERT grava o estado **inicial**.

```
orders: [3, T0]  --muda para-->  [5, T1]
log:                    INSERT (order_status_id = 5, order_status_at = T1)   ← estado resultante
orders agora: [5, T1]
```

Sequência real para uma OS autorizada e visitada:

| Momento | Trigger | Linha gravada |
|---------|---------|---------------|
| OS criada | `_insert` | `(1 ou 2, T_criacao)` |
| Autorizada | `_logs` (UPDATE) | `(3, T_auth)` |
| Visita iniciada | `_logs` (UPDATE) | `(5, T_start)` |

**Impacto no guard 8 da RPC de reassign (§6.4):** o estado **pré-visita** não é a última linha ≤ `ov_started_at`, e sim a **anterior a ela**:

```sql
SELECT order_status_id, order_status_at
FROM public.orders_statuses_logs
WHERE order_id = v_os1
  AND order_status_at <= v_visit.ov_started_at
ORDER BY order_status_at DESC, id DESC
OFFSET 1          -- pula a linha do estado 5 gravada no início da visita
LIMIT 1;
```

**Alternativa (decisão pendente):** trocar a semântica para OLD (gravar `OLD.status_id`/`OLD.status_at` no UPDATE), que devolve o comportamento original do guard sem o `OFFSET 1` — exigiria recriar a função (a tabela/trigger ficariam iguais).

- INSERT da OS grava o estado **inicial** (histórico completo) — igual ao previsto.
- UPDATE grava o **novo** estado; o estado corrente continua vivo em `orders`.


---

## 5. Decisões técnicas

| # | Decisão | Situação |
|---|---------|----------|
| D1 | Rename `order_status_ate` → **`order_status_at`** (singular, como implementado — o desenho original dizia `orders_status_at`) | ✅ feito |
| D2 | Trigger **no banco** (cobre TS + RPCs + cascata sem editar 11+ call sites) | ✅ feito |
| D3 | Log de **INSERT** (estado inicial) + **UPDATE** de `status_id` — implementado com semântica **NEW**; OLD ficou como alternativa pendente (§4) | ⚠️ divergente |
| D4 | `created_user_id` = `users.id` via `auth.uid()` → fallback `NEW.updated_user_id` → `NEW.created_user_id` (GUC `app.user_id` não foi necessário) | ✅ feito |
| D5 | Reversão da OS 1 exclusivamente via `orders_statuses_logs` (sem heurística) | pendente (reassign) |
| D6 | Guards reassign: sem `orders_visits_assets` **e** sem `orders_visits_services` | pendente (reassign) |
| D7 | Permissão: apenas `ov_team_leader_id` | pendente (reassign) |
| D8 | `ov_counter` OS 1: decrementar com proteção anti-colisão de `ov_mask` | pendente (reassign) |
| D9 | Log global **não** exige mudança em TS de status | ✅ confirmado (zero código TS alterado) |
| D10 | **Ponto de entrada do reassign = botão na OS destino** (`OrderRequestView` / `OrderCardDetail`), no slot que hoje fica vazio com visita aberta — **não** na tela da visita ativa | ✅ decidido 2026-09-25 |
| D11 | **Elegibilidade da OS destino**: `status_id IN (3, 4, 6)` — Autorizada, Agendada ou Suspensa. Em Avaliação (`2`) **não** transfere | ✅ decidido 2026-09-25 |
| D12 | **Guard 8 ancorado por `id`** (`ORDER BY id DESC` sobre as linhas `status_id = 5`), **não** por `order_status_at` — `scheduleOrder` grava datas futuras; resolve **R4** | ✅ decidido 2026-09-25 |
| D13 | **Identidade na RPC via `auth.uid()`** (`users.uuid`), sem GUC `app.user_id` (resolve **R2**); payload segue aceitando `user_id` para o caso sem JWT (service role), com guarda `uuid = auth.uid()` quando houver JWT | ✅ decidido 2026-09-25 |
| D14 | **Exibição do log = nova aba “Situações” na OS** (`OrderRequestView`) — 7ª aba entre “Histórico” e “Assets”. A SS **não** ganha a aba (mantém `getServiceOrderHistory`) | ✅ decidido 2026-09-25 |
| D15 | **Leitura = método novo** `getOrderStatusHistory(orderId)` (query direta em `orders_statuses_logs` com joins), **sem** estender `getServiceOrderHistory` | ✅ decidido 2026-09-25 |
| D17 | **Chat NÃO acompanha a transferência** — preservados apenas **equipe, tempo e veículo**. Nova coluna `orders_visits_chat.o_id`; a RPC congela as mensagens antigas com `o_id = OS1` e remove todos os participantes; `getVisitChatMessages` filtra por `o_id` | ✅ decidido + **aplicado no banco vivo** 2026-09-25 |
| D16 | **`REVOKE EXECUTE … FROM PUBLIC, anon`** na RPC — Postgres dá EXECUTE a `PUBLIC` por padrão e a anon key é pública no bundle; como a guarda `auth.uid()` é pulada sem JWT, um caller anon poderia escolher qualquer `user_id` | ✅ decidido + **aplicado e validado** 2026-09-25 (anon → 401) |

---

## 6. Migration (ordem)

### 6.1–6.3 Rename + função + triggers — ✅ IMPLEMENTADO

**Arquivo:** `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` (aplicado manualmente no SQL Editor; `dev/supabase/schema.sql` sincronizado).

Conteúdo real (diferente do desenho original abaixo, mantido como referência histórica):

| # | Objeto | Definição |
|---|--------|-----------|
| 1 | Rename | `DO $$ … RENAME COLUMN order_status_ate TO order_status_at` — idempotente (só renomeia se o antigo existir e o novo não) |
| 2 | Função | `fc_orders_statuses_logs()` — `SECURITY DEFINER`, `SET search_path = public`; guarda `IF TG_OP = 'UPDATE' THEN IF OLD.status_id IS NOT DISTINCT FROM NEW.status_id …` (IF aninhado: em INSERT o record `OLD` não está atribuído); grava **`NEW.status_id` / `NEW.status_at`**; `created_user_id` = `users.id` via `auth.uid()` com `EXCEPTION WHEN OTHERS` e fallback `NEW.updated_user_id` → `NEW.created_user_id`; `created_date` = `TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)`; `order_parent_id` = `NULLIF(parent_id, 0)` |
| 3 | Trigger UPDATE | `trg_orders_statuses_logs` — `AFTER UPDATE OF status_id ON public.orders FOR EACH ROW WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)` |
| 4 | Trigger INSERT | `trg_orders_statuses_logs_insert` — `AFTER INSERT ON public.orders FOR EACH ROW` |
| 5 | Índice | `idx_orders_statuses_logs_order_id (order_id)` |

**Cascata:** update da SS pai pelo trigger de herança → segunda linha de log (correto).  
**Dedupe:** o `WHEN (IS DISTINCT FROM)` mantém updates de `progress`, contadores e imagens fora do log.  
**Cobertura:** app (TS), RPCs (`flow_order_visit_create_v2`, encerramento), herança, n8n e SQL manual — tudo que faz `UPDATE orders SET status_id` passa pela mesma trigger.

#### Validação em sandbox (PGlite — 2026-09-25)

> Antes de aplicar no SQL Editor: Postgres 17 via **PGlite** (WASM) em `/tmp/opencode/pgsim/sim.mjs`, aplicando o arquivo `.sql` inteiro e replicando o fluxo real de SS/OS. Execução: `cd /tmp/opencode/pgsim && node sim.mjs` → **10/10 PASS**.

| # | Cenário | Resultado |
|---|---------|-----------|
| 1 | Migration aplica sem erro (sintaxe + rename idempotente) | PASS |
| 2 | Criar SS (INSERT status 1) | PASS (+1) |
| 3 | Autorizar SS (UPDATE 1 → 3) | PASS (+1) |
| 4 | Criar OS filha (INSERT status 2) | PASS (+1) — **caso do reporte original (0 linhas)** |
| 5 | Herança: SS herdada da OS (3 → 2) | PASS (+1) |
| 6 | Update de `progress` / imagem | PASS (+0) — `WHEN` filtra |
| 7 | Iniciar visita: OS (2 → 5) e SS herdada (2 → 5) | PASS (+1 cada) |
| 8 | Sem JWT (service role/n8n): cancelar OS (5 → 7) | PASS (+1) — **`created_user_id` saiu stale = 10 → confirma P5** |
| 9 | Idempotência (re-executar a migration) | PASS |
| 10 | Guard 8 do reassign com `OFFSET 1` recupera pré-visita (status 2) | PASS |

**Não coberto pelo sandbox:** RLS, PostgREST e cache `pgrst` (**P4**) — exigem o banco vivo.

#### Desenho original (referência — não executado)

<details>
<summary>Proposta de 2026-09-24 (rename → função → 2 triggers)</summary>

```sql
-- 6.1 Rename proposto (executou com outro nome alvo: order_status_at)
ALTER TABLE public.orders_statuses_logs
  RENAME COLUMN order_status_ate TO orders_status_at;

-- 6.2 Função proposta (semântica OLD + GUC app.user_id + suporte a DELETE)
CREATE OR REPLACE FUNCTION public.fc_orders_statuses_logs()
RETURNS trigger AS $$ … $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Triggers propostas
CREATE TRIGGER trg_orders_statuses_logs_insert
  AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_statuses_logs();

CREATE TRIGGER trg_orders_statuses_logs_update
  AFTER UPDATE OF status_id, status_at ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fc_orders_statuses_logs();
```

</details>


### 6.4 RPC `flow_order_visit_reassign_v1(payload jsonb)`

Payload: `{ visit_id, user_id, target_order_id }`.

**Guards (fail-fast):**

1. Visita existe; `ov_status_id = 1`; `ov_ended_at IS NULL`; `is_deleted = false`; `is_canceled = false`
2. `ov_team_leader_id = user_id`
3. `NOT EXISTS orders_visits_assets WHERE ov_id = visit AND is_deleted = false`
4. `NOT EXISTS orders_visits_services WHERE ov_id = visit AND is_deleted = false`
5. OS2 existe; `is_deleted = false`; **é uma OS** (`parent_id > 0` — senão: *"A OS de destino deve ser uma Ordem de Serviço"*); `status_id IN (3, 4, 6)` — **Autorizada / Agendada / Suspensa** (labels em `utils/formatters.ts:178-185`; `2` Em Avaliação e `7/8` **não** são elegíveis)
6. OS2 ≠ OS1
7. OS2 sem outra visita com `ov_status_id = 1` e `ov_ended_at IS NULL`
8. **Log pré-visita da OS 1** — ⚠️ implementado **por `id`, não por data** (resolve **R4**):

```sql
-- Semântica NEW: ancora na última linha de status 5 (gravada no início da visita)
-- e pega a imediatamente anterior pela ordem de inserção (id).
SELECT max(l.id) INTO v_anchor_id
FROM public.orders_statuses_logs l WHERE l.order_id = v_os1.id AND l.order_status_id = 5;
-- v_anchor_id IS NULL → erro (guard 8)

SELECT l.order_status_id, l.order_status_at INTO v_pre
FROM public.orders_statuses_logs l
WHERE l.order_id = v_os1.id AND l.id < v_anchor_id
ORDER BY l.id DESC
LIMIT 1;
-- vazio → erro:
-- "Sem histórico de situação anterior à visita.
--  Operação indisponível para visitas iniciadas antes da ativação do log."
```

> **Por que não `order_status_at`:** `scheduleOrder` grava `status_at` = data agendada (às vezes
> **futura**), então ordenar/filtrar por data não é cronológico. O `id` é sempre a ordem real de
> inserção — inclusive nas restaurações (que regravam datas antigas). **R4 resolvido.**

**Transação:**

```sql
-- DECISÃO R2: a função implementada NÃO cria a GUC app.user_id.
-- O log usa auth.uid() (D4) — nenhum set_config é necessário.
-- Guard 2a extra: quando existe JWT, exige users.uuid = auth.uid() = user_id do payload
-- (impede passar o id de outro usuário); sem JWT (service role) segue o payload.
```

| # | Ação |
|---|------|
| 1 | OS2: `ov_counter = ov_counter + 1`; visita: `o_id = OS2`, `ov_mask = OS2.order_mask \|\| '.' \|\| LPAD(novo_counter, 2)` |
| 2 | OS2 → `status_id = 5`, `status_at = now` (SP) — trigger grava a **nova** situação (5) |
| 3 | OS1 → `status_id = log.order_status_id`, `status_at = log.order_status_at` — trigger grava a **situação restaurada** |
| 4 | `ov_counter` OS1: decrementar **somente se** nenhuma visita restante da OS usa o sufixo atual; senão `MAX(sufixos restantes)` (evita colisão de máscara) |
| 5 | `users` (equipe da visita): `o_id_in_progress = OS2`, `op_id_in_progress = OS2.parent_id`, `ov_id_in_progress_mask = novo_mask` |
| 6 | Notificações aos seguidores das duas OS — **automáticas** via `trg_followers_orders_status_changed` (`AFTER UPDATE OF status_id`) |
| 7 | SS pai das duas OS — **automática** via `trg_order_status_inheritance` (`AFTER UPDATE OF status_id, status_at`) |
| 8 | **Chat (D17):** `orders_visits_chat.o_id = OS1` nas mensagens da visita (congeladas na origem); `DELETE` de todos os `orders_visits_chat_participants` da visita |
| 9 | Retorno: `{ success, message, visit_id, new_mask, source_order_id, restored_status_id, restored_status_at }` |

**Não altera:** `ov_started_at`, equipe (`orders_visits_teams`), veículo. **Chat (D17):** não acompanha — mensagens congeladas com `o_id = OS1` e participantes removidos.

### 6.4.1 Validação em sandbox (PGlite — 2026-09-25)

Script `/tmp/opencode/pgsim/sim_reassign.mjs` (temporário, fora do repo): aplica
`20260925_create_orders_statuses_logs_trigger.sql` + `20260925_create_flow_order_visit_reassign_v1.sql`
em PGlite e roda 37 asserções → **37/37 PASS**, cobrindo:

- migrações aplicam sem erro (incl. `NOTIFY pgrst, 'reload schema'` e `GRANT`);
- guards 1, 2a, 3, 4, 5 (destino inexistente / não-OS / status fora de 3-4-6), 6 e 7 → erro correto e **0 linhas novas** em `orders_statuses_logs`;
- guard 8 (sem histórico anterior à visita) → erro e **0 linhas novas**;
- caminho feliz: OS1 em status 4 com `status_at` **futuro** → restauração correta (**R4/D12**), OS2 → status 5, `ov_mask` novo, `users.o_id_in_progress` movido, SS/visita não alteram `ov_started_at`;
- round-trip: transferir de volta restaura os estados originais;
- **D17 (chat):** mensagens congeladas em `o_id = OS1`, participantes removidos e chat **continua** preso à OS original no round-trip.

> **Ainda faltam os testes no banco vivo (§9)** — o sandbox não tem RLS nem auth reais.

---

## 7. Entregas de aplicação

| # | Item | Caminho | Situação |
|---|------|---------|----------|
| 1 | Migration **log global** (rename + função + 2 triggers + índice) | `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` | ✅ criada (aplicação manual a confirmar) |
| 1b | Migration **RPC reassign** (`flow_order_visit_reassign_v1`) | `dev/supabase/migrations/20260925_create_flow_order_visit_reassign_v1.sql` | ✅ criada e **aplicada no banco vivo** (O4) + REVOKE D16 — sandbox 37/37 |
| 2 | Spec do fluxo | `flows/ordersVisits/reassign-order-visit.flow` | ✅ criada (2026-09-25): guards 1-8, efeitos por tabela, estados de UI, erros |
| 3 | Service | `services/orders/visitsService.ts` → `reassignOrderVisit` + `getReassignPreview` | ✅ criada |
| 4 | Proxy | `services/dataService.ts` → `reassignOrderVisit` + `getReassignPreview` | ✅ criada |
| 5 | Modal + botão **“Transferir visita” na OS destino** (D10) | `views/OrderRequest/OrderRequestView.tsx` (`onTransferVisit` + `onVisitTransferred`) + `components/orderRequests/OrderRequestCardDetail.tsx` (slot do `{onStartVisit && …}`, âmbar/`swap_horiz`) + `components/ordersVisits/TransferVisitModal.tsx` + `App.tsx` (navega para a visita) — guards de UI baratos: líder + visita aberta + destino ≠ origem + status (D11); guards 3/4/7 checados na abertura do modal (§7.1) | ✅ implementada — testar no banco vivo |
| 6 | Sincronia do schema de referência | `dev/supabase/schema.sql` | ✅ feita |
| 7 | **Parte 3 — consumidor do log (P8):** tipo `OrderStatusLogItem` | `types.ts` | ✅ criado |
| 8 | Service + proxy | `services/orders/ordersService.ts` → `getOrderStatusHistory` (join `cfg_orders_statuses` + `users`, `order('id', desc)`, `limit 200`) + `services/dataService.ts` | ✅ criado |
| 9a | **D17 — chat preso à OS1:** coluna `orders_visits_chat.o_id` + filtro em `getVisitChatMessages` | `dev/supabase/migrations/20260926_orders_visits_chat_origin_order.sql` + `services/orders/visitChatService.ts` + efeito 8 na RPC | ✅ em código e **migration aplicada** (O7) — falta testar no app |
| 9 | UI: aba “Situações” + timeline | `views/OrderRequest/OrderRequestView.tsx` (7ª aba) + `components/orderRequests/OrderStatusHistoryTimeline.tsx` + spec `flows/orders/order-status-history.flow.md` | ✅ implementada — testar no banco vivo |

**Log global:** sem alteração obrigatória em TS de status (nenhum arquivo `.ts`/`.tsx` foi alterado).

**Hardening opcional:** passar a gravar `updated_user_id` nos demais UPDATEs de status (melhora `created_user_id` em edge cases de service role).

### 7.1 UI do reassign — botão e modal (D10/D11)

> Fluxo completo (etapas, efeitos e erros): [`flows/ordersVisits/reassign-order-visit.flow`](../flows/ordersVisits/reassign-order-visit.flow)

**a) Botão — `OrderRequestCardDetail.tsx` (slot hoje vazio com visita aberta)**

```ts
// UI barata — só com dados já carregados (guards 2, 5, 6)
const hasOpenVisit   = !!currentUser?.ovIdInProgress;
const canTransfer    = isVisitLeader                      // visit.ovTeamLeaderId === currentUser.id
                    && order.id !== visit.oId             // destino ≠ origem
                    && [3, 4, 6].includes(Number(order.statusId));  // D11

// canStartVisit (hoje) = líder && isAvailable  →  some com visita aberta
// canTransfer           → TRANSFERIR VISITA · swap_horiz · bg-amber-500
```

Estados: `idle` → `transferring` (`isTransferring`, botão desabilitado + `Loading`) → sucesso/erro.

**b) Modal — `components/ordersVisits/TransferVisitModal.tsx`**

| Bloco | Conteúdo |
|-------|----------|
| **Mini card da OS1 (origem)** | cliente, unidade, setor/posição (`unit_asset_tag_description / sub`), serviços solicitados; rodapé com a `ov_mask` da visita (cabeçalho/nº da OS removidos a pedido) |
| ~~Origem/Destino/Cliente/Unidade~~ | linhas antigas **removidas** (D17 — destino é a OS aberta no app) |
| Preservado | equipe, veículo, tempo de visita — **chat fica na OS de origem (D17)** |
| Aviso | "A OS de origem voltará à situação anterior registrada no histórico" |
| Ações | `Confirmar` (vermelho) · `Fechar` |

**c) Divisão dos guards (fonte única = o `.flow`)**

| Camada | Guards | Comportamento |
|--------|--------|---------------|
| Renderização do botão | 2, 5, 6 | baratos, sem fetch |
| Abertura do modal | 3, 4, 7 (fetch) | modal abre **bloqueado** com a mensagem, sem `Confirmar` |
| RPC | 1-8 (autoritativa) | `success: false` → `toast.error(message)`; rollback |

**d) Efeitos por tabela** — §6.4 (passos 1-8) + `.flow` etapa 4.

**e) Erros** — tabela *Erros Comuns* do `.flow`; testes de aceitação na §9 (*Transferência*).

---

## 8. Validação no banco vivo

> Antes: checar a coluna antes de rodar a migration. **Agora:** confirmar o estado pós-migration.

```sql
-- 1) coluna já renomeada (esperado: só order_status_at)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders_statuses_logs'
  AND column_name IN ('order_status_ate', 'order_status_at');

-- 2) as duas triggers instaladas
SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'public.orders'::regclass AND NOT tgisinternal
  AND tgname LIKE 'trg_orders_statuses_logs%';

-- 3) produção da tabela
SELECT count(*) AS total,
       count(DISTINCT order_id) AS ordens,
       min(created_date) AS min_dt,
       max(created_date) AS max_dt
FROM public.orders_statuses_logs;

SELECT *
FROM public.orders_statuses_logs
WHERE order_id = <os_teste>
ORDER BY id DESC
LIMIT 20;
```

---

## 9. Testes pós-implementação

### Log global (trigger — validar agora)

> Semântica **NEW**: a linha grava o estado **resultante** da mudança (§4).
>
> **Sandbox (§6.1):** os itens de criação/autorização/herança/visita/`WHEN`/fallback sem JWT já passaram em PGlite — falta rodar os mesmos passos **no banco vivo** após aplicar a migration.

- [ ] Criar SS → linha `(1, …)` via trigger de INSERT  
- [ ] Criar OS a partir da SS → linha `(2, …)` da OS **e** linha da SS se o status dela mudou  
- [ ] `authorizeOrder` → linha com `order_status_id = 3` e `order_status_at` = momento da autorização  
- [ ] `scheduleOrder` → linha com status 4 e `order_status_at` = data agendada (fixa)  
- [ ] `closeOrderVisit` (UPDATE direto do front) → log  
- [ ] Iniciar visita → linha com status 5 na OS **e** linha na SS pai (se mudou)  
- [ ] Cancelar / concluir OS → linha com status 7 / 8  
- [ ] Herança SS: 1 linha útil; sem duplicata se TS + trigger tiverem mesmos valores  
- [ ] `created_user_id` preenchido em fluxo autenticado (`auth.uid()`); fallback `created_user_id` sem JWT  
- [ ] Update de `progress` / contador / imagem **não** gera linha (`WHEN IS DISTINCT FROM`)  

### Transferência

- [ ] OS1 Autorizada → OS2 Autorizada / Agendada / Suspensa (com e sem SS pai)  
- [ ] OS1 Agendada → OS2  
- [ ] OS1 Suspensa → OS2  
- [ ] Guard: visita com ativo → rejeita  
- [ ] Guard: visita com serviço → rejeita  
- [ ] Guard: não-líder → rejeita  
- [ ] Guard: OS2 em Execução/Concluída → rejeita  
- [ ] Guard: OS2 com visita aberta → rejeita  
- [ ] Guard: sem log (visita anterior ao trigger) → rejeita com mensagem  
- [ ] `ov_counter` OS1: próxima visita não reusa `ov_mask`  
- [ ] UI: máscara nova, OS1 restaurada, `users.*_in_progress` atualizados  
- [ ] UI (§7.1): botão **só** aparece com visita aberta + líder + destino ≠ origem + `status ∈ {3,4,6}`  
- [ ] UI: OS2 em Avaliação/Execução/Concluída → **sem** botão  
- [ ] UI: modal abre **bloqueado** (ativos/serviços da visita ou visita aberta na OS2)  
- [ ] UI: erro da RPC → `toast.error` com a mensagem exata e rollback (OS1/OS2/visita intactos)  
- [ ] **Chat (D17):** após transferir, a visita (agora na OS2) abre o chat **zerado** e sem participantes; as mensagens antigas não aparecem mais; enviar nova mensagem recria participantes  

### Aba “Situações” (consumidor do log)

> Pré-requisito: migration da Parte 1 aplicada (**O1**) e ao menos 1 mudança de situação registrada.

- [ ] Aba aparece na OS (`OrderRequestView`) com o rótulo **Situações**; SS (`ServiceRequestDetail`) **sem** a aba  
- [ ] Lista ordenada do mais recente para o mais antigo; primeira linha com selo **“Atual”**  
- [ ] Chip mostra nome/ícone/cor vindos de `cfg_orders_statuses`, com fallback `getStatusConfig`  
- [ ] “Situação em vigor desde …” usa `order_status_at`; “Gravado em …” aparece **só** quando difere (ex.: `scheduleOrder`)  
- [ ] Autor = `name_short`; mudança sem usuário (n8n/import/sem JWT) mostra **“Sistema”**  
- [ ] OS com SS pai exibe o chip `SS <id>` (`order_parent_id`)  
- [ ] OS recém-criada sem log (pré-trigger) → estado vazio “Sem histórico de situações”  
- [ ] Loading “CARREGANDO SITUAÇÕES…” durante a busca  

---

## 10. Ordem de execução sugerida

1. SELECTs de validação no banco vivo (§8)  
2. ~~Migration log global (rename → função → 2 triggers → índice)~~ ✅ criada em `20260925_create_orders_statuses_logs_trigger.sql`  
3. Aplicar a migration **manualmente** no SQL Editor do Supabase (regra do projeto) — **a confirmar**  
4. Testes da seção 9 — **log global** (pendente)  
5. ~~**Decisão:** semântica NEW (atual) vs OLD (§4) para o guard 8 do reassign~~ ✅ mantida NEW + guard por `id` (D12)  
6. ~~Migration da RPC `flow_order_visit_reassign_v1`~~ ✅ criada em `20260925_create_flow_order_visit_reassign_v1.sql`  
7. ~~Spec `reassign-order-visit.flow`~~ ✅ criada em `2026-09-25` (+ §7.1)
8. ~~Service + `dataService`~~ ✅ `reassignOrderVisit` + `getReassignPreview`  
9. ~~Modal/botão (líder)~~ ✅ `TransferVisitModal` + botão âmbar + `onVisitTransferred` em `App.tsx`  
10. ~~**Parte 3:** aba “Situações” + `getOrderStatusHistory` + timeline~~ ✅ criados  
11. Testes da seção 9 — **aba Situações** (depende das migrations aplicadas)  
10. Testes da seção 9 — **transferência**  

---

## 11. Limitações declaradas

| Limitação | Comportamento |
|-----------|----------------|
| Visitas em andamento **antes** do deploy do trigger | Reassign rejeitado (guard 8) com mensagem explícita |
| `created_user_id` nulo | Possível em service role / sem JWT (fallback `NEW.updated_user_id` → `NEW.created_user_id`; se todos nulos, fica `NULL`) |
| Estado atual da OS | Fica só em `orders`; o log guarda o histórico de estados (cada linha = estado resultante de uma mudança — semântica NEW) |
| UPDATE que muda só `status_at` | Não gera linha (trigger cobre apenas `status_id`) — decidir se vira `UPDATE OF status_id, status_at` |
| Duas versões SQL de `flow_order_visit_close_v2` | Fora do escopo deste plano; front usa UPDATE direto |

---

## 12. Referências de código

| Referência | Caminho |
|------------|---------|
| **Migration log global (trigger)** | `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` |
| Criação de visita (RPC) | `dev/supabase/flow_order_visit_create_v2.sql` |
| Encerramento (RPC órfã) | `dev/supabase/flow_order_visit_close_v2.sql` |
| Encerramento real (TS) | `services/orders/visitsService.ts` → `closeOrderVisit` |
| Início da visita (TS) | `services/orders/visitsService.ts:254` → `startOrderVisit` |
| Herança SS (trigger) | `dev/supabase/triggers/trg_order_status_inheritance.sql` |
| Notificação seguidores | `dev/supabase/triggers/trg_followers_orders_status_changed.sql` |
| Spec create visita | `flows/ordersVisits/create-order-visit.flow` |
| Spec close visita | `flows/ordersVisits/close-order-visit.flow` |
| Definição log | `dev/supabase/schema.sql` (`CREATE TABLE public.orders_statuses_logs`, função, triggers e índice já sincronizados) |
| Status config | `dev/supabase/data/cfg_orders_statuses_rows.sql` |
| Prioridade status | `dev/supabase/patch_add_priority_level_to_statuses.sql` |
| Política de migrations | `AGENTS.md` (aplicação manual no Supabase; cuidado com `DROP … CASCADE`) |

---

## 13. Pendências / decisões em aberto

> Levantamento: 2026-09-25. **P** = impacta a Parte 1 (log) · **R** = impacta a Parte 2 (reassign) · **O** = operacional

### 13.1 Decisões técnicas já sinalizadas no doc

| ID | Pendência | Impacto | Ref. |
|----|-----------|---------|------|
| P1/R1 | Semântica do log: **NEW** (atual) vs **OLD** (desenho original) | Guard 8 do reassign precisa do `OFFSET 1` ou a função é recriada | §4, D3, §10.5 |
| P2 | Trigger reage **só a `status_id`**: UPDATE que muda apenas `status_at` não loga (`updateOrder`) | Evento ausente no histórico | §3.4.5 |
| R2 | ~~GUC `app.user_id`: a função implementada **não lê**; a RPC previa `set_config`~~ ✅ **decidido (D13)**: sem GUC, identidade via `auth.uid()` | §6.4 |
| P3 | Hardening: gravar `updated_user_id` nos demais UPDATEs de status | qualidade do `created_user_id` | §7 |
| R3 | ~~Parte 2 completa: RPC `flow_order_visit_reassign_v1`, spec, service, proxy, modal (D5–D8)~~ ✅ **criados** — falta aplicar as migrations no vivo e testar | feature inteira | §5, §7, §10 |

### 13.2 Novas — levantadas em 2026-09-25, ainda não decididas

| ID | Pendência | Por que importa |
|----|-----------|-----------------|
| R4 | ~~Ordenação do guard 8: usar `ORDER BY id DESC` em vez de `order_status_at DESC`~~ ✅ **implementado (D12)** — validado no sandbox (data futura restaurada corretamente) | `scheduleOrder` grava `status_at` = data agendada (possivelmente **futura**) — a ordem por data não é cronológica e quebra o `OFFSET 1` (§6.4) |
| P4 | `NOTIFY pgrst, 'reload schema'` ficou de fora da migration (estava no desenho original §6.3) | cache do PostgREST mantém o nome antigo `order_status_ate`; sem impacto hoje porque nenhum código lê a coluna |
| P5 | Fallback `NEW.updated_user_id` | sem JWT pode gravar usuário de um update **anterior** (stale) em vez de `NULL` — **confirmado no sandbox §6.1 (10/10)** |
| P6 | Índice existe só `(order_id)` | considerar `(order_id, order_status_at)` para o guard 8 e consultas por ordem |
| P7 | RLS `"Universal Access"` permite `anon` ler **e** escrever | decidir policy: escrita só pela trigger (`SECURITY DEFINER`) e leitura autenticada |
| P8 | ~~Consumidor do log: não há leitor, UI ou relatório definido~~ ✅ **Parte 3**: aba “Situações” na OS (D14/D15) — falta testar no banco vivo | a tabela só acumula linhas |

### 13.3 Operacionais a confirmar

| ID | Pendência |
|----|-----------|
| O1 | ~~Migration `20260925_create_orders_statuses_logs_trigger.sql` aplicada?~~ ✅ **confirmada no banco vivo (2026-09-25, via REST)**: coluna já é `order_status_at`, **14 linhas** no log, `created_user_id` preenchido, linhas herdadas (`order_parent_id`) |
| O2 | Testes da §9 (**log global**) — sandbox PGlite 10/10 ✅; banco vivo tem **14 linhas reais** ✅, mas o checklist manual da §9 (autorizar/agendar/iniciar visita/`WHEN`) ainda não foi percorrido |
| O3 | ~~`flows/ordersVisits/reassign-order-visit.flow` não existe~~ ✅ criada em 2026-09-25 (+ §7.1) |
| O4 | ~~RPC `flow_order_visit_reassign_v1` não existe~~ ✅ **confirmada no banco vivo (2026-09-25)** — `POST /rest/v1/rpc/...` → **HTTP 200** com as mensagens de guarda corretas (`Parâmetros inválidos…`, `Visita inválida ou já finalizada.`) |
| O4b | ~~Segurança (D16): anon podia chamar a RPC~~ ✅ **REVOKE aplicado e validado (2026-09-25)** — anon key → **HTTP 401 `42501 permission denied for function`** |
| O5 | Testes da §9 — **transferência** no banco vivo (sandbox: 37/37, §6.4.1) — **destravado** (RPC no ar) |
| O7 | ~~Aplicar migration do chat e reaplicar a RPC~~ ✅ **confirmado no banco vivo (2026-09-25)**: coluna `orders_visits_chat.o_id` existe (SELECT via REST 200) e a RPC responde `401 permission denied` para anon (ou seja, existe — sem ela seria `404`) |
| O6 | Testes da §9 — **aba “Situações”** no banco vivo — **destravado** (Parte 1 ativa, 14 linhas no log) |
