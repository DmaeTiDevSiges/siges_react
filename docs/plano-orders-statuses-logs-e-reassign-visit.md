# Plano — Log global de situação (`orders_statuses_logs`) + Transferência de visita OS 1 → OS 2

> **Status:** **Parte 1 (log global) IMPLEMENTADA EM CÓDIGO** — os registros de `orders_statuses_logs` são de responsabilidade de **trigger no banco** (`fc_orders_statuses_logs()` + `trg_orders_statuses_logs` / `trg_orders_statuses_logs_insert`), migration `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` — aplicação **manual** no SQL Editor (regra do projeto; confirmar execução). **Parte 2 (transferência de visita OS 1 → OS 2): plano para análise — não implementado.**  
> **Data:** 2026-09-24 · **Atualizado:** 2026-09-25  
> **Decisões do produto:** registrar histórico em `orders_statuses_logs`; reversão da OS 1 a partir dessa tabela; decrementar `ov_counter`; guards em `orders_visits_assets` **e** `orders_visits_services`; permissão apenas para o líder da visita.  
> **⚠️ Pendências abertas:** **§13** — 14 itens (semântica NEW/OLD, `status_at` sem trigger, ordenação do guard 8, RLS, `NOTIFY pgrst`, aplicação da migration e testes).

---

## 1. Objetivo

1. **Log global — IMPLEMENTADO:** toda alteração de situação de `orders` (`status_id`) em qualquer parte do app (TS, RPCs, cascata de herança, n8n, SQL manual) grava histórico em `orders_statuses_logs` **por trigger no banco** — nenhuma linha de código TypeScript participa.
2. **Transferência de visita — pendente:** durante o deslocamento, o líder pode reapontar a visita em andamento (OS 1 → OS 2) preservando tempo/equipe/veículo, restaurando a situação anterior da OS 1 a partir do log.


---

## 2. Cenário de negócio

| Passo | Situação |
|-------|----------|
| 1 | OS 1 (Autorizada **ou** Suspensa) tem visita iniciada → OS 1 fica **Em execução** (status 5) |
| 2 | Em deslocamento, a equipe precisa atender a **OS 2** (Autorizada ou Suspensa) |
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
5. OS2 existe; `is_deleted = false`; `status_id IN (3, 6)`
6. OS2 ≠ OS1
7. OS2 sem outra visita com `ov_status_id = 1` e `ov_ended_at IS NULL`
8. **Log pré-visita da OS 1:**

```sql
-- Semântica NEW (implementada): pula a linha do estado 5 gravada no início da visita
SELECT order_status_id, order_status_at
FROM public.orders_statuses_logs
WHERE order_id = v_os1
  AND order_status_at <= v_visit.ov_started_at
ORDER BY order_status_at DESC, id DESC
OFFSET 1
LIMIT 1;
-- vazio → erro:
-- "Sem histórico de situação anterior à visita.
--  Operação indisponível para visitas iniciadas antes da ativação do log."
```

**Transação:**

```sql
-- opcional: a função implementada NÃO lê app.user_id (usa auth.uid());
-- manter só se a semântica do log mudar para exigir a GUC.
PERFORM set_config('app.user_id', v_user_id::text, true);  -- TX local p/ trigger
```

| # | Ação |
|---|------|
| 1 | OS2: `ov_counter = ov_counter + 1`; visita: `o_id = OS2`, `ov_mask = OS2.order_mask \|\| '.' \|\| LPAD(novo_counter, 2)` |
| 2 | OS2 → `status_id = 5`, `status_at = now` (SP) — trigger grava a **nova** situação (5) |
| 3 | OS1 → `status_id = log.order_status_id`, `status_at = log.order_status_at` — trigger grava a **situação restaurada** |
| 4 | `ov_counter` OS1: decrementar **somente se** nenhuma visita restante da OS usa o sufixo atual; senão `MAX(sufixos restantes)` (evita colisão de máscara) |
| 5 | `users` (equipe da visita): `o_id_in_progress = OS2`, `op_id_in_progress = OS2.parent_id`, `ov_id_in_progress_mask = novo_mask` |
| 6 | Notificações seguidores da SS da OS 2 (padrão de `flow_order_visit_create_v2`); opcional OS 1 |
| 7 | Recalcular SS das duas OS (trigger de herança +/ou `updateServiceRequestStatus`) |
| 8 | Retorno: `{ success, message, visit_id, new_mask, restored_status_id, restored_status_at }` |

**Não altera:** `ov_started_at`, equipe (`orders_visits_teams`), veículo, chat.

---

## 7. Entregas de aplicação

| # | Item | Caminho | Situação |
|---|------|---------|----------|
| 1 | Migration **log global** (rename + função + 2 triggers + índice) | `dev/supabase/migrations/20260925_create_orders_statuses_logs_trigger.sql` | ✅ criada (aplicação manual a confirmar) |
| 1b | Migration **RPC reassign** (`flow_order_visit_reassign_v1`) | `dev/supabase/migrations/…` | pendente |
| 2 | Spec do fluxo | `flows/ordersVisits/reassign-order-visit.flow` | pendente |
| 3 | Service | `services/orders/visitsService.ts` → `reassignOrderVisit` | pendente |
| 4 | Proxy | `services/dataService.ts` | pendente |
| 5 | Modal + botão “Transferir visita” | `components/ordersVisits/` + `views/OrderVisit/OrderVisitScreen.tsx` (ou home) — **só líder**, guards de UI (sem assets/services) | pendente |
| 6 | Sincronia do schema de referência | `dev/supabase/schema.sql` | ✅ feita |

**Log global:** sem alteração obrigatória em TS de status (nenhum arquivo `.ts`/`.tsx` foi alterado).

**Hardening opcional:** passar a gravar `updated_user_id` nos demais UPDATEs de status (melhora `created_user_id` em edge cases de service role).

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

- [ ] OS1 Autorizada → OS2 Autorizada / Suspensa (com e sem SS pai)  
- [ ] OS1 Suspensa → OS2  
- [ ] Guard: visita com ativo → rejeita  
- [ ] Guard: visita com serviço → rejeita  
- [ ] Guard: não-líder → rejeita  
- [ ] Guard: OS2 em Execução/Concluída → rejeita  
- [ ] Guard: OS2 com visita aberta → rejeita  
- [ ] Guard: sem log (visita anterior ao trigger) → rejeita com mensagem  
- [ ] `ov_counter` OS1: próxima visita não reusa `ov_mask`  
- [ ] UI: máscara nova, OS1 restaurada, `users.*_in_progress` atualizados  

---

## 10. Ordem de execução sugerida

1. SELECTs de validação no banco vivo (§8)  
2. ~~Migration log global (rename → função → 2 triggers → índice)~~ ✅ criada em `20260925_create_orders_statuses_logs_trigger.sql`  
3. Aplicar a migration **manualmente** no SQL Editor do Supabase (regra do projeto) — **a confirmar**  
4. Testes da seção 9 — **log global** (pendente)  
5. **Decisão:** semântica NEW (atual) vs OLD (§4) para o guard 8 do reassign  
6. Migration da RPC `flow_order_visit_reassign_v1`  
7. Spec `reassign-order-visit.flow`  
8. Service + `dataService`  
9. Modal/botão (líder)  
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
| R2 | GUC `app.user_id`: a função implementada **não lê**; a RPC previa `set_config` | decidir se mantém a chamada | §6.4 |
| P3 | Hardening: gravar `updated_user_id` nos demais UPDATEs de status | qualidade do `created_user_id` | §7 |
| R3 | Parte 2 completa: RPC `flow_order_visit_reassign_v1`, spec, service, proxy, modal (D5–D8) | feature inteira | §5, §7 |

### 13.2 Novas — levantadas em 2026-09-25, ainda não decididas

| ID | Pendência | Por que importa |
|----|-----------|-----------------|
| R4 | Ordenação do guard 8: usar `ORDER BY id DESC` em vez de `order_status_at DESC` | `scheduleOrder` grava `status_at` = data agendada (possivelmente **futura**) — a ordem por data não é cronológica e quebra o `OFFSET 1` (§6.4) |
| P4 | `NOTIFY pgrst, 'reload schema'` ficou de fora da migration (estava no desenho original §6.3) | cache do PostgREST mantém o nome antigo `order_status_ate`; sem impacto hoje porque nenhum código lê a coluna |
| P5 | Fallback `NEW.updated_user_id` | sem JWT pode gravar usuário de um update **anterior** (stale) em vez de `NULL` |
| P6 | Índice existe só `(order_id)` | considerar `(order_id, order_status_at)` para o guard 8 e consultas por ordem |
| P7 | RLS `"Universal Access"` permite `anon` ler **e** escrever | decidir policy: escrita só pela trigger (`SECURITY DEFINER`) e leitura autenticada |
| P8 | Consumidor do log: não há leitor, UI ou relatório definido | a tabela só acumula linhas |

### 13.3 Operacionais a confirmar

| ID | Pendência |
|----|-----------|
| O1 | Migration `20260925_create_orders_statuses_logs_trigger.sql` aplicada no SQL Editor? (o teste de criação de OS gerou **0 linhas**) |
| O2 | Testes da §9 (**log global**) — nenhum executado |
| O3 | `flows/ordersVisits/reassign-order-visit.flow` não existe — esperado: entrega da Parte 2 |
