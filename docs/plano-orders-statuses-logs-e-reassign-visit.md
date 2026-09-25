# Plano — Log global de situação (`orders_statuses_logs`) + Transferência de visita OS 1 → OS 2

> **Status:** plano para análise — não implementado  
> **Data:** 2026-09-24  
> **Decisões do produto:** registrar histórico em `orders_statuses_logs`; reversão da OS 1 a partir dessa tabela; decrementar `ov_counter`; guards em `orders_visits_assets` **e** `orders_visits_services`; permissão apenas para o líder da visita.

---

## 1. Objetivo

1. **Log global:** toda alteração de situação de `orders` (`status_id` / `status_at`) em qualquer parte do app passa a gravar histórico em `orders_statuses_logs`.
2. **Transferência de visita:** durante o deslocamento, o líder pode reapontar a visita em andamento (OS 1 → OS 2) preservando tempo/equipe/veículo, restaurando a situação anterior da OS 1 a partir do log.

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
-- dev/supabase/schema.sql (~10059)
CREATE TABLE public.orders_statuses_logs (
    id bigint NOT NULL,
    order_id bigint,
    order_status_id bigint,
    order_status_ate timestamp without time zone,  -- RENOMEAR → orders_status_at
    created_user_id bigint,
    created_date timestamp without time zone,
    order_parent_id bigint,
    company_id bigint,
    department_id bigint
);
```

- RLS ativa, policy `"Universal Access"`.
- **Zero INSERTs** no repo (SQL, TS, n8n, scripts) → tabela órfã.
- `order_status_ate` **não** é referenciado em código de app (só dumps/schema) → rename seguro.
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
| `trg_order_status_inheritance` | **Muta** status da SS pai (cascata → deve gerar log também) |
| `trg_followers_orders_status_changed` | Só notifica; usa `NEW.updated_user_id` |

### 3.4 Riscos / limitações conhecidos

1. **`updated_user_id`** só é preenchido em `authorizeOrder` e `scheduleOrder` → audit de autor precisa de fallback (`auth.uid()` / `app.user_id`).
2. **Herança duplicada** (trigger + TS `updateServiceRequestStatus`) → com `IS DISTINCT FROM` no log, não há linha duplicada se os valores forem iguais.
3. **Visitas já em andamento** no deploy do trigger: sem linha pré-visita → reassign falha no guard (por design).
4. Duas implementações SQL concorrentes de `flow_order_visit_close_v2` (front usa UPDATE direto).
5. `updateOrder` pode mudar só `status_id` ou só `status_at` → trigger deve reagir a qualquer um dos dois.

---

## 4. Semântica do log (OLD state)

Cada linha representa o estado **anterior** vigente antes da mudança (ou o estado inicial no INSERT):

```
orders: [3, T0]  --muda para-->  [5, T1]
log:                    INSERT (order_status_id = 3, orders_status_at = T0)
orders agora: [5, T1]   ← estado atual só na tabela orders
```

- Início de visita (3/6 → 5) grava o **pré-visita** → base da reversão da OS 1.
- INSERT da OS grava o estado **inicial** (histórico completo).
- UPDATE grava sempre o **OLD** (não o novo).

**Por que OLD:** o guard da RPC de reassign precisa do status/data **anteriores ao início da visita**; com OLD esse dado nasce no primeiro UPDATE para status 5.

---

## 5. Decisões técnicas

| # | Decisão |
|---|---------|
| D1 | Rename `order_status_ate` → **`orders_status_at`** |
| D2 | Trigger **no banco** (cobre TS + RPCs + cascata sem editar 11+ call sites) |
| D3 | Padrão **log OLD** + log de **INSERT** (estado inicial) |
| D4 | `created_user_id` = `app.user_id` (GUC na RPC) → `users.uuid = auth.uid()` → `NEW/OLD.updated_user_id` |
| D5 | Reversão da OS 1 exclusivamente via `orders_statuses_logs` (sem heurística) |
| D6 | Guards reassign: sem `orders_visits_assets` **e** sem `orders_visits_services` |
| D7 | Permissão: apenas `ov_team_leader_id` |
| D8 | `ov_counter` OS 1: decrementar com proteção anti-colisão de `ov_mask` |
| D9 | Log global **não** exude mudança em TS de status |

---

## 6. Migration (ordem)

Sugestão: `dev/supabase/migrations/20260924_orders_statuses_logs_rename_and_triggers.sql`

### 6.1 Rename

```sql
ALTER TABLE public.orders_statuses_logs
  RENAME COLUMN order_status_ate TO orders_status_at;
```

### 6.2 Função `fc_orders_statuses_logs()`

```sql
CREATE OR REPLACE FUNCTION public.fc_orders_statuses_logs()
RETURNS trigger AS $$
DECLARE
  v_user_id bigint;
BEGIN
  IF TG_OP = 'INSERT'
     OR OLD.status_id IS DISTINCT FROM NEW.status_id
     OR OLD.status_at IS DISTINCT FROM NEW.status_at THEN

    v_user_id := COALESCE(
      NULLIF(current_setting('app.user_id', true), '')::bigint,
      (SELECT id FROM public.users WHERE uuid = auth.uid()),
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.updated_user_id END,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.updated_user_id END
    );

    INSERT INTO public.orders_statuses_logs (
      order_id,
      order_status_id,
      orders_status_at,
      created_user_id,
      created_date,
      order_parent_id,
      company_id,
      department_id
    ) VALUES (
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.status_id
           WHEN TG_OP = 'INSERT' THEN NEW.status_id
           ELSE OLD.status_id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.status_at
           WHEN TG_OP = 'INSERT' THEN NEW.status_at
           ELSE OLD.status_at END,
      v_user_id,
      TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP),
      CASE WHEN TG_OP = 'DELETE' THEN OLD.parent_id ELSE NEW.parent_id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.company_id ELSE NEW.company_id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.department_id ELSE NEW.department_id END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.3 Triggers em `orders`

```sql
CREATE TRIGGER trg_orders_statuses_logs_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fc_orders_statuses_logs();

CREATE TRIGGER trg_orders_statuses_logs_update
  AFTER UPDATE OF status_id, status_at ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fc_orders_statuses_logs();

NOTIFY pgrst, 'reload schema';
```

**Cascata:** update da SS pai pelo trigger de herança → segunda linha de log (correto).  
**Dedupe:** se TS + trigger copiarem os mesmos valores, `IS DISTINCT FROM` evita linha extra.

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
SELECT order_status_id, orders_status_at
FROM public.orders_statuses_logs
WHERE order_id = v_os1
  AND orders_status_at <= v_visit.ov_started_at
ORDER BY orders_status_at DESC, id DESC
LIMIT 1;
-- vazio → erro:
-- "Sem histórico de situação anterior à visita.
--  Operação indisponível para visitas iniciadas antes da ativação do log."
```

**Transação:**

```sql
PERFORM set_config('app.user_id', v_user_id::text, true);  -- TX local p/ trigger
```

| # | Ação |
|---|------|
| 1 | OS2: `ov_counter = ov_counter + 1`; visita: `o_id = OS2`, `ov_mask = OS2.order_mask \|\| '.' \|\| LPAD(novo_counter, 2)` |
| 2 | OS2 → `status_id = 5`, `status_at = now` (SP) — trigger loga OLD (3 ou 6) |
| 3 | OS1 → `status_id = log.order_status_id`, `status_at = log.orders_status_at` — trigger loga OLD (5) |
| 4 | `ov_counter` OS1: decrementar **somente se** nenhuma visita restante da OS usa o sufixo atual; senão `MAX(sufixos restantes)` (evita colisão de máscara) |
| 5 | `users` (equipe da visita): `o_id_in_progress = OS2`, `op_id_in_progress = OS2.parent_id`, `ov_id_in_progress_mask = novo_mask` |
| 6 | Notificações seguidores da SS da OS 2 (padrão de `flow_order_visit_create_v2`); opcional OS 1 |
| 7 | Recalcular SS das duas OS (trigger de herança +/ou `updateServiceRequestStatus`) |
| 8 | Retorno: `{ success, message, visit_id, new_mask, restored_status_id, restored_status_at }` |

**Não altera:** `ov_started_at`, equipe (`orders_visits_teams`), veículo, chat.

---

## 7. Entregas de aplicação

| # | Item | Caminho |
|---|------|---------|
| 1 | Migration (rename + função + 2 triggers + RPC) | `dev/supabase/migrations/…` |
| 2 | Spec do fluxo | `flows/ordersVisits/reassign-order-visit.flow` |
| 3 | Service | `services/orders/visitsService.ts` → `reassignOrderVisit` |
| 4 | Proxy | `services/dataService.ts` |
| 5 | Modal + botão “Transferir visita” | `components/ordersVisits/` + `views/OrderVisit/OrderVisitScreen.tsx` (ou home) — **só líder**, guards de UI (sem assets/services) |

**Log global:** sem alteração obrigatória em TS de status.

**Hardening opcional:** passar a gravar `updated_user_id` nos demais UPDATEs de status (melhora `created_user_id` em edge cases de service role).

---

## 8. Validação no banco vivo (antes da migration)

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders_statuses_logs'
  AND column_name IN ('order_status_ate', 'orders_status_at');

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

### Log global

- [ ] `authorizeOrder` → linha com status anterior e `orders_status_at` antigo  
- [ ] `scheduleOrder` → status 4 com `orders_status_at` = data agendada (fixa)  
- [ ] `closeOrderVisit` (UPDATE direto do front) → log  
- [ ] Iniciar visita → log pré-visita (3 ou 6) em OS **e** SS pai  
- [ ] Cancelar / concluir OS → log  
- [ ] Herança SS: 1 linha útil; sem duplicata se TS + trigger tiverem mesmos valores  
- [ ] `created_user_id` preenchido em fluxo autenticado  

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

1. SELECTs de validação no banco vivo  
2. Migration (rename → função → triggers → RPC)  
3. Spec `reassign-order-visit.flow`  
4. Service + `dataService`  
5. Modal/botão (líder)  
6. Testes manuais da seção 9  
7. Aplicar migration **manualmente** no SQL Editor do Supabase (regra do projeto — migrations não são auto-aplicadas)

---

## 11. Limitações declaradas

| Limitação | Comportamento |
|-----------|----------------|
| Visitas em andamento **antes** do deploy do trigger | Reassign rejeitado (guard 8) com mensagem explícita |
| `created_user_id` nulo | Possível em service role / sem JWT se `app.user_id` não for setado |
| Estado atual da OS | Fica só em `orders`; o log guarda o histórico de estados **anteriores** |
| Duas versões SQL de `flow_order_visit_close_v2` | Fora do escopo deste plano; front usa UPDATE direto |

---

## 12. Referências de código

| Referência | Caminho |
|------------|---------|
| Criação de visita (RPC) | `dev/supabase/flow_order_visit_create_v2.sql` |
| Encerramento (RPC órfã) | `dev/supabase/flow_order_visit_close_v2.sql` |
| Encerramento real (TS) | `services/orders/visitsService.ts` → `closeOrderVisit` |
| Início da visita (TS) | `services/orders/visitsService.ts:254` → `startOrderVisit` |
| Herança SS (trigger) | `dev/supabase/triggers/trg_order_status_inheritance.sql` |
| Notificação seguidores | `dev/supabase/triggers/trg_followers_orders_status_changed.sql` |
| Spec create visita | `flows/ordersVisits/create-order-visit.flow` |
| Spec close visita | `flows/ordersVisits/close-order-visit.flow` |
| Definição log | `dev/supabase/schema.sql` (~10059) |
| Status config | `dev/supabase/data/cfg_orders_statuses_rows.sql` |
| Prioridade status | `dev/supabase/patch_add_priority_level_to_statuses.sql` |
| Política de migrations | `AGENTS.md` (aplicação manual no Supabase; cuidado com `DROP … CASCADE`) |
