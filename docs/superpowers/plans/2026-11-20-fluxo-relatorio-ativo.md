# Fluxo do Relatório do Ativo (isAdminSuper) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Para usuários isAdminSuper, as mudanças de etapa do relatório do ativo (reportar, voltar para rascunho, revisar, rejeitar, aprovar, estornar) passam por uma RPC única que valida a transição e o papel no servidor, grava histórico e motivo de rejeição, e o arquivamento da visita arquiva os ativos aprovados.

**Architecture:** Uma tabela de transições pura em TS (`utils/assetReportFlow.ts`) decide os botões; a mesma tabela é replicada na RPC `flow_order_visit_asset_transition_v1(payload jsonb)` (SECURITY DEFINER, padrão `flow_order_visit_*`), que trava a linha, confere `expected_from`, aplica/desfaz a movimentação, grava `orders_visits_assets_processing_logs`, recalcula os contadores da visita e notifica o técnico na rejeição. O hook `useReportStatusFlow` escolhe o caminho novo quando `isAdminSuper`; os demais usuários continuam nos métodos atuais sem mudança.

**Tech Stack:** React 19 + TS, TanStack Query, Jest/Testing Library, Supabase (PL/pgSQL, migrations aplicadas manualmente pelo usuário).

**Spec:** `docs/PLANO_RELATORIO_ATIVO_FLUXO.md` (seções 3 e 4).

## Execução (decidida em 2026-11-20)

**Método:** superpowers:subagent-driven-development. Ainda **não iniciada** — começa só quando o usuário pedir.

1. **Isolamento:** branch `feat/fluxo-relatorio-ativo` em worktree próprio (superpowers:using-git-worktrees), a partir do `main` atualizado; não misturar com alterações locais em aberto.
2. **Por tarefa (1 → 8, em ordem):**
   - subagente **implementador** novo recebe este plano + a spec e faz só a tarefa (TDD, `npx tsc --noEmit && npm test && npm run lint:eslint`, commit);
   - subagente **revisor** novo confere o commit contra o plano: Interfaces (nomes/tipos iguais entre tarefas), testes pedidos, Global Constraints e que nada mudou para não-isAdminSuper;
   - problema apontado → implementador corrige → revisor de novo; sem convergência → levar ao usuário;
   - próxima tarefa só depois da revisão aprovada; resumo curto ao usuário a cada tarefa.
3. **Pausas obrigatórias:** nas Tasks 2 e 3 o agente só escreve os `.sql`; o usuário aplica no SQL Editor (e roda o `_CHECKS.sql` da Task 3) e confirma os resultados antes de seguir para a Task 4.
4. **Fim:** revisor do branch inteiro (consistência entre tarefas); Task 9 (conferência no app web/Android) com o usuário; merge decidido pelo usuário (superpowers:finishing-a-development-branch).

## Global Constraints

- Resposta, comentários, mensagens e textos de UI em pt-BR.
- Fluxo novo só quando `useAuth().currentUser.isAdminSuper === true`; para os demais nenhum comportamento muda (os testes de caracterização existentes de `OrderVisitAssetReport.test.tsx` continuam passando sem edição).
- Fluxo novo: `transitionOrderVisitAsset`, `beginOrderVisitAssetEdit` e `cancelOrderVisitAssetEdit` entram na lista "F — só online" de `services/offline/offlineLayer.ts`. **Exceção (correção 2):** sem conexão, `report` e `revert_draft` do isAdminSuper usam os métodos atuais (`reportedOrderVisitAsset` / `updateOrderVisitAssetProcessingStatus(…, 1, …)`), que vão para a fila como os dos líderes — esses eventos não ficam no histórico novo.
- Leituras novas (`getOrderVisitAssetProcessingLogs`, `getOvaRejectionReasons`, sessão aberta) entram em `OPTIONAL_READ_FALLBACKS` de `offlineLayer.ts` devolvendo `[]`/`null`: sem internet a tela mostra a faixa de etapas sem histórico, sem erro (correção 3).
- `dataService`: só proxy no formato `nome: (...args: Parameters<typeof svc.nome>): ReturnType<typeof svc.nome> => svc.nome(...args)`.
- Leituras novas via TanStack Query (chave começando pelo recurso); nada de `useEffect` + loading manual.
- Datas exibidas com `formatDateInBrazil`; no SQL `TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP)`.
- Migrations: arquivo + `_DOWN`, `CREATE OR REPLACE`, sem `DROP ... CASCADE`, terminar com `NOTIFY pgrst, 'reload schema';`. Aplicação é manual (pedir ao usuário).
- **Compatibilidade com o APK atual** (líderes reportam pelo caminho antigo): nada pode bloquear os `UPDATE` diretos em `orders_visits_assets`/`orders_visits` que o app de hoje faz (sem trigger que recuse, sem RLS nova nessas tabelas, sem mudar `v_orders_visits_assets`/`v_orders_visits`); contadores calculados no banco usam a mesma fórmula de `syncOrderVisitAssetsProcessing`.
- `processing_id`: 1 Rascunho, 2 Reportado, 3 Revisado, 4 Rejeitado, 5 Aprovado (`OVA_PROCESSING`). Arquivado é `is_filed`, não um processing.
- Imports relativos; verificação antes de cada commit: `npx tsc --noEmit && npm test && npm run lint:eslint`.

### Tabela de transições (fonte única — TS e SQL devem bater)

| ação | de | para | quem (além de is_admin_super, que sempre pode) | condição extra |
|---|---|---|---|---|
| `report` | 1, 4 | 2 | qualquer usuário que edita o relatório | — |
| `revert_draft` | 2 | 1 | líder da visita (`ov_team_leader_id`) | visita `ov_processing_id = 1` |
| `review` | 2, 3 | 3 | permissão `orders_visits_processing_review` | — |
| `reject` | 2, 3 | 4 | permissão `orders_visits_processing_disapprove` | `reason_id` obrigatório |
| `approve` | 2, 3 | 5 | gestor do contrato (`contracts_managers.role='manager'`, `orders.contract_id`) | aplica movimentação se `is_moved` |
| `reopen` | 5 | 2 | gestor do contrato | visita não aprovada nem arquivada; desfaz movimentação |

Todas recusam se a visita estiver arquivada (`ov_is_filed`) ou aprovada (`ov_approved_at IS NOT NULL`), ou se o OVA estiver `is_filed`/`is_deleted`.

## Review Focus

1. **Dois usuários na mesma tela**: o segundo a confirmar recebe "O relatório mudou de etapa…" e a tela recarrega o ativo, sem sobrescrever (teste na Task 5).
2. **Estorno de ativo movido**: restaura o `asset_snapshot` gravado na aprovação (não o `before_*`, que pode estar defasado e não guarda o comentário do ativo); se o ativo foi movido de novo, ou a aprovação é anterior ao snapshot, recusa e nada é desfeito (cenários SQL na Task 3).
3. **Aprovar ativo movido com falha no meio**: OVA e `assets` mudam juntos ou nada muda (garantido pela transação da RPC; cenário SQL na Task 3).
4. **Reenvio do mesmo clique** (duplo toque): `client_uuid` repetido não duplica log nem notificação (cenário SQL na Task 3 + teste de serviço na Task 4).
7. **Conexão cai com a revisão aberta**: nenhuma alteração vai para a fila e Cancelar/Confirmar esperam a fila do ativo esvaziar (testes na Task 8).
6. **Revisor fecha o app no meio da revisão** (ou cai a conexão): a sessão de edição fica aberta; ao voltar, ele escolhe continuar ou descartar; outro usuário vê "Em revisão por X" e o gestor do contrato pode descartar (testes na Task 8).
5. **Usuário não-admin com a tela aberta**: continua chamando os métodos antigos (teste na Task 5).

---

### Task 1: Tabela de transições no cliente

**Files:**
- Create: `utils/assetReportFlow.ts`
- Test: `utils/assetReportFlow.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type AssetReportAction = 'report' | 'revert_draft' | 'review' | 'reject' | 'approve' | 'reopen';
  export interface AssetReportFlowContext {
      processingId: number;          // OVA_PROCESSING
      visitProcessingId: number;     // orders_visits.ov_processing_id
      isVisitFiled: boolean;
      isVisitApproved: boolean;
      isAssetFiled: boolean;
      isAdminSuper: boolean;
      isTeamLeader: boolean;
      isContractManager: boolean;
      canReview: boolean;            // canView('orders_visits_processing_review')
      canDisapprove: boolean;        // canView('orders_visits_processing_disapprove')
  }
  export function nextProcessing(action: AssetReportAction): number;
  export function allowedActions(ctx: AssetReportFlowContext): AssetReportAction[];
  ```

- [ ] **Step 1: Escrever os testes**

  `describe('allowedActions')` com, no mínimo:
  - rascunho, admin → `['report']`
  - rejeitado, sem papéis → `['report']`
  - revisado, não-admin, sem papéis → `[]` (não aparece mais "report" em Revisado)
  - reportado, líder, visita em rascunho → contém `'revert_draft'`; mesma situação com visita `ov_processing_id = 2` → não contém
  - reportado, `canReview` → contém `'review'`; `canDisapprove` → contém `'reject'`
  - reportado, gestor → contém `'approve'` (revisar não é obrigatório)
  - aprovado, gestor → `['reopen']`; aprovado, gestor, `isVisitApproved` → `[]`
  - qualquer status com `isVisitFiled` ou `isAssetFiled` → `[]`
  - `isAdminSuper` em Reportado → `['revert_draft'?, 'review', 'reject', 'approve']` (revert só se visita em rascunho)

  `describe('nextProcessing')`: `report→2`, `revert_draft→1`, `review→3`, `reject→4`, `approve→5`, `reopen→2`.

- [ ] **Step 2:** `npx jest --config jest.config.cjs utils/assetReportFlow.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar seguindo a tabela das Global Constraints (um objeto `RULES: Record<AssetReportAction, { from: number[]; to: number; allowed: (ctx) => boolean }>`, ordem do retorno = ordem da union).
- [ ] **Step 4:** Rodar de novo → PASS.
- [ ] **Step 5:** Commit `feat(relatorio-ativo): tabela de transições do relatório do ativo`.

---

### Task 2: Migration — motivos de rejeição, histórico e colunas

**Files:**
- Create: `dev/supabase/migrations/20261120_create_ova_processing_logs_and_rejection_reasons.sql`
- Create: `dev/supabase/migrations/20261120_create_ova_processing_logs_and_rejection_reasons_DOWN.sql`

**Interfaces:**
- Produces (banco):
  - `public.cfg_orders_visits_assets_rejection_reasons (id smallint PK, description varchar NOT NULL, section varchar NULL, sort smallint DEFAULT 0, is_available boolean DEFAULT true, is_deleted boolean DEFAULT false)`; `section` ∈ chaves de `REPORT_SECTION_IDS` (`before`, `checklist`, `activities`, `materials`, `movement`, `after`, `recorder`, `alerts`) ou NULL.
    Seed: 1 Fotos do antes (`before`), 2 Fotos do depois (`after`), 3 Checklist incompleto (`checklist`), 4 Atividades (`activities`), 5 Materiais (`materials`), 6 Movimentação (`movement`), 7 Registrador (`recorder`), 99 Outro (NULL).
    RLS: SELECT para `authenticated`.
  - `public.orders_visits_assets_processing_logs (id bigserial PK, ova_id bigint NOT NULL, ov_id bigint NOT NULL, action varchar NOT NULL, from_processing_id smallint, to_processing_id smallint, user_id bigint NULL CHECK (user_id IS NOT NULL OR action = 'file'), notes text, reason_id smallint NULL, changed_fields jsonb NULL, asset_snapshot jsonb NULL, asset_applied jsonb NULL, client_uuid uuid NULL, created_at timestamp NOT NULL DEFAULT TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP))`, `asset_snapshot` = valores reais de `assets` antes de aplicar a movimentação e `asset_applied` = valores gravados pela aprovação (só nos logs `approve` com `is_moved`; chaves = colunas de `assets`: `status_id`, `status_at`, `unit_id`, `tag_id`, `tag_sub_id`, `unit_asset_tag_id`, `priority_id`, `comments`). Índice `(ova_id, created_at)`, índice único parcial em `client_uuid WHERE client_uuid IS NOT NULL`. RLS: SELECT para quem pode ler o OVA (mesma política de `orders_visits_assets`; copiar a expressão da policy viva via MCP `supabase-ro`); sem INSERT/UPDATE/DELETE direto (só a RPC, que é SECURITY DEFINER).
  - `orders_visits_assets`: `+ disapproved_reason_id smallint NULL`, `+ filed_user_id bigint NULL`, `+ filed_at timestamp NULL`.

- [ ] **Step 1:** Conferir no banco vivo (MCP `supabase-ro`) que as colunas/tabelas acima não existem e copiar a policy SELECT de `orders_visits_assets`.
- [ ] **Step 2:** Escrever o `.sql` (idempotente: `IF NOT EXISTS`, `ON CONFLICT DO NOTHING` no seed) e o `_DOWN` (remove só o que esta migration criou).
- [ ] **Step 3:** Pedir ao usuário para aplicar; conferir com `select * from cfg_orders_visits_assets_rejection_reasons order by sort, id;` → 8 linhas.
- [ ] **Step 4:** Commit `feat(db): histórico de etapas e motivos de rejeição do relatório do ativo`.

---

### Task 3: Migration — RPC de transição e cascata do arquivamento

**Files:**
- Create: `dev/supabase/migrations/20261120_create_flow_order_visit_asset_transition_v1.sql`
- Create: `dev/supabase/migrations/20261120_create_flow_order_visit_asset_transition_v1_DOWN.sql`
- Create: `dev/supabase/migrations/20261120_flow_order_visit_asset_transition_v1_CHECKS.sql` (roteiro de verificação manual, comentado, rodado pelo usuário dentro de `BEGIN … ROLLBACK`)

**Interfaces:**
- Consumes: tabelas da Task 2.
- Produces:
  - `public.flow_order_visit_asset_transition_v1(payload jsonb) RETURNS jsonb`, SECURITY DEFINER, `search_path = public`, `GRANT EXECUTE … TO authenticated`.
    Payload: `{ ova_id: bigint, action: text, expected_from: smallint, notes?: text, reason_id?: smallint, client_uuid?: uuid }` (a Task 8 acrescenta `session_id`).
    Retorno: `{ success: boolean, message: string, code?: 'conflict' | 'forbidden' | 'invalid', processing_id?: smallint }`.
  - Trigger `tgr_orders_visits_file_assets` AFTER UPDATE OF `ov_is_filed` ON `orders_visits` quando passa a `true`: `UPDATE orders_visits_assets SET is_filed = true, filed_user_id = NEW.ov_approved_filed_user_id, filed_at = NEW.ov_approved_filed_at WHERE ov_id = NEW.id AND processing_id = 5 AND NOT is_filed`, e grava log `action='file'` por ativo; depois recalcula contadores.
  - **Compatibilidade:** o trigger roda dentro do "Arquivar visita" do APK atual (`fileOrderVisit`, UPDATE direto). Ele não pode recusar nem falhar: sem `RAISE`, sem depender de colunas que o UPDATE antigo não preenche (`ov_approved_filed_user_id/at` podem vir nulos → usar `COALESCE(..., TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP))` e `user_id` nulo aceito no log — a coluna `user_id` do log passa a aceitar NULL só para `action = 'file'`).
  - Função interna `public.fc_ova_sync_visit_counters(p_ov_id bigint) RETURNS void` com as mesmas contagens de `syncOrderVisitAssetsProcessing` (visitsService.ts:2314-2360), usada pela RPC e pelo trigger.

Ordem dentro da RPC (copiar o esqueleto de `flow_order_visit_update_times_v1`):
1. `auth.uid()` → `users.id`, `is_admin_super`.
2. `client_uuid` já em `orders_visits_assets_processing_logs` → `{success:true, message:'Já processado.'}` sem gravar.
3. `SELECT … FROM orders_visits_assets WHERE id = ova_id AND NOT is_deleted FOR UPDATE`; visita `FOR UPDATE`; `orders.contract_id`.
4. `processing_id <> expected_from` → `code:'conflict'`, mensagem `'O relatório mudou de etapa. Recarregue para ver a situação atual.'`
5. Valida a linha da tabela de transições (de/para, papel, condição extra) → `code:'forbidden'` ou `'invalid'` com mensagem específica.
6. Grava por ação: `report` → `reported_user_id/at`, limpa `disapproved_*` (o histórico fica no log); `revert_draft` → só `processing_id`; `review` → `revised_user_id/at`; `reject` → `disapproved_user_id/at/notes`, `disapproved_reason_id`, + `users_notifications` para `reported_user_id` (title `'Relatório do ativo rejeitado'`, body = descrição do motivo, `ov_id`, `o_id`, `type 'ova_rejected'`, `page_target` igual ao usado pelas notificações de visita existentes — conferir no banco); `approve` → `approved_user_id/at` e, se `is_moved`: lê `assets … FOR UPDATE`, guarda em `asset_snapshot` os valores atuais **das colunas que serão alteradas** e em `asset_applied` os novos; aplica os `after_*` não nulos com `status_at = COALESCE(ov_ended_at, agora)` (mesma regra de visitsService.ts:2093-2165); `reopen` → limpa `approved_*` e, se o último log `approve` do OVA tem `asset_snapshot`: trava `assets`, confere que cada coluna de `asset_applied` ainda tem o valor aplicado (`IS NOT DISTINCT FROM`) e restaura as colunas de `asset_snapshot` (**não** usa `before_*`); se alguma coluna mudou → `code:'invalid'`, `'O ativo já foi movimentado depois desta aprovação; o estorno não pode desfazer a movimentação.'`
7. `INSERT` no log (`changed_fields` fica NULL aqui; a Task 8 passa a preencher a partir da sessão de edição), `PERFORM fc_ova_sync_visit_counters(ov_id)`, retorno `success:true` com `processing_id`.

- [ ] **Step 1:** Escrever o roteiro `_CHECKS.sql` primeiro, um bloco por cenário com o resultado esperado em comentário: cada linha da tabela de transições (permitida e negada), `conflict`, `client_uuid` repetido (1 log, 1 notificação), aprovar movido (OVA=5 **e** `assets` atualizado), estorno movido ok (ativo volta ao `asset_snapshot`, inclusive `comments`), estorno quando o ativo mudou entre a inclusão na visita e a aprovação (volta ao valor da hora da aprovação, não ao `before_*`), aprovação de movido anterior a esta migration sem `asset_snapshot` (estorno recusado com `'Aprovação antiga sem registro dos dados anteriores do ativo; ajuste o ativo manualmente.'`), estorno com ativo movido depois (recusa, nada muda), arquivar visita (só aprovados ficam `is_filed`, logs `file`); **arquivar pelo caminho do APK atual** (`UPDATE orders_visits SET ov_is_filed = true, ov_approved_filed_user_id = …, ov_approved_filed_at = …` e também sem as duas colunas de autoria) numa visita com ativos nas 5 etapas e já com ativos `is_filed` → o UPDATE conclui sem erro, contadores batem com a fórmula de `syncOrderVisitAssetsProcessing`; visita arquivada recusa tudo.
- [ ] **Step 2:** Escrever a RPC, o trigger, `fc_ova_sync_visit_counters` e o `_DOWN`.
- [ ] **Step 3:** Pedir ao usuário para aplicar e rodar `_CHECKS.sql`; todos os cenários com o resultado esperado.
- [ ] **Step 4:** Commit `feat(db): flow_order_visit_asset_transition_v1 e arquivamento em cascata dos ativos`.

---

### Task 4: Serviço, fachada e offline

**Files:**
- Modify: `services/orders/visitsService.ts` (novos métodos junto de `updateOrderVisitAssetProcessingStatus`; corrigir `revised_*` no caminho antigo)
- Modify: `services/dataService.ts`, `services/offline/offlineLayer.ts` (lista "F — só online")
- Modify: `types.ts` (ou o arquivo de tipos onde está `OrderVisitAssetView`): `disapprovedReasonId?`, `disapprovedReasonDescription?`, `filedAt?`, `revisedAt?`, `revisedUserName?` se a view já expõe (conferir `v_orders_visits_assets`; não alterar a view nesta tarefa)
- Test: `services/orders/visitsService.assetTransition.test.ts`

**Interfaces:**
- Consumes: RPC da Task 3, `AssetReportAction` da Task 1.
- Produces:
  ```ts
  export class AssetTransitionError extends Error { code: 'conflict' | 'forbidden' | 'invalid' | 'stale' | undefined }
  transitionOrderVisitAsset(input: {
      ovaId: string; action: AssetReportAction; expectedFrom: number;
      notes?: string; reasonId?: number; clientUuid?: string;
  }): Promise<{ processingId: number }>;
  getOrderVisitAssetProcessingLogs(ovaId: string): Promise<OvaProcessingLog[]>;
  getOvaRejectionReasons(): Promise<OvaRejectionReason[]>;
  // tipos em types.ts:
  interface OvaProcessingLog { id: string; action: AssetReportAction | 'file' | 'review_cancelled'; fromProcessingId: number | null; toProcessingId: number | null; userId: string; userName?: string; notes?: string; reasonId?: number; reasonDescription?: string; changedFields?: string[]; createdAt: string }
  interface OvaRejectionReason { id: number; description: string; section: keyof typeof REPORT_SECTION_IDS | null }
  ```

- [ ] **Step 1: Testes** (mesmo esquema de mocks de `visitsService.editVisitTimes.test.ts`):
  - `transitionOrderVisitAsset` chama `rpc('flow_order_visit_asset_transition_v1', { payload: { ova_id: 12, action: 'reject', expected_from: 2, notes: 'x', reason_id: 1, client_uuid: <o informado> } })`
  - gera `client_uuid` quando não informado (string uuid)
  - `{ success:false, code:'conflict', message:'O relatório mudou…' }` → rejeita com `AssetTransitionError` com `code === 'conflict'` e a mensagem do banco
  - erro do supabase é relançado como veio
  - `getOrderVisitAssetProcessingLogs` ordena por `created_at` asc e mapeia `changed_fields`/nome do usuário
  - caminho antigo: `updateOrderVisitAssetProcessingStatus(id, 3, '7')` envia `revised_user_id: '7'` e `revised_at`
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar; nome do usuário no log via segunda consulta em `users` (mesmo padrão de `getContractManagers`). Proxies no `dataService`; `'transitionOrderVisitAsset'` na lista só-online; `getOrderVisitAssetProcessingLogs: () => []` e `getOvaRejectionReasons: () => []` em `OPTIONAL_READ_FALLBACKS`.
  Teste extra em `services/offline/` (no arquivo de teste existente do `offlineLayer`, se houver; senão `services/offline/offlineLayer.assetFlow.test.ts`): offline e sem cache, `getOrderVisitAssetProcessingLogs` devolve `[]` em vez de `OfflineCacheMissError`.
- [ ] **Step 4:** Rodar → PASS; `npx tsc --noEmit`.
- [ ] **Step 5:** Commit `feat(relatorio-ativo): serviço de transição, histórico e motivos`.

---

### Task 5: Tela usa a tabela de transições e a RPC (isAdminSuper)

**Files:**
- Modify: `hooks/useReportStatusFlow.ts`
- Modify: `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx` (montagem de `actionFlags`, linhas ~428-438; carregar `isTeamLeader` a partir de `visitData.ovTeamLeaderId === currentUserId`)
- Modify: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions.tsx` (flag `showReopen` + `onReopen`, botão secundário "Estornar Aprovação")
- Test: `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.test.tsx` (novo `describe('fluxo novo (isAdminSuper)')`; o mock de `useAuth` passa a ler `mockAuth.isAdminSuper`, padrão `false`)

**Interfaces:**
- Consumes: `allowedActions`/`nextProcessing` (Task 1), `dataService.transitionOrderVisitAsset`, `AssetTransitionError` (Task 4).
- Produces: `useReportStatusFlow` recebe `useNewFlow: boolean`, `onReloadAsset: () => Promise<void>`; devolve também `handleReopen` e `showReopenModal`/`setShowReopenModal`.

Regras:
- `useNewFlow = currentUserIsAdminSuper`. Com `useNewFlow`, `actionFlags` sai de `allowedActions(ctx)`: `showReport = has('report')`, `showRevertDraft = has('revert_draft') && !localEditMode`, `showReview = has('review')||has('reject')||has('approve')||!!localEditMode`, `canReview = has('review')`, `canDisapprove = has('reject')`, `canApprove = has('approve')`, `showReopen = has('reopen') && !localEditMode`. Sem `useNewFlow`, o objeto atual fica idêntico.
- Com `useNewFlow`, cada handler chama `transitionOrderVisitAsset({ ovaId: assetId, action, expectedFrom: processingId, … })` em vez do método antigo; os passos antes (validar, `flushSave`, `completeSelectedAlerts`) e depois (`releaseMyLock`, `advanceAfterAction`, toasts) ficam iguais. Aprovar/revisar deixam de ser otimistas no fluxo novo (só atualizam `asset` após sucesso).
- `AssetTransitionError` com `code === 'conflict'` → `toast.warning(mensagem)` + `onReloadAsset()`; outros → `toast.error(mensagem)`.
- Sem conexão (`isOnline()` falso) no fluxo novo: `report` e `revert_draft` seguem pelo caminho atual (fila offline, mesmos passos de hoje); `review`/`approve`/`reject`/`reopen` → `toast.error('Sem conexão: esta ação precisa de internet.')` e não chamam nada.
- Após sucesso no fluxo novo: `queryClient.invalidateQueries({ queryKey: ['ova-processing-logs', assetId] })` além das invalidações que já existem.

- [ ] **Step 1: Testes** (novos, com `mockAuth.isAdminSuper = true`):
  - Reportar chama `transitionOrderVisitAsset` com `{ action:'report', expectedFrom:1 }` e **não** chama `reportedOrderVisitAsset`
  - Em Revisado não há botão "Reportar Relatório do Ativo"
  - Aprovar em Reportado (gestor) chama `{ action:'approve', expectedFrom:2 }`
  - Conflito: mock rejeita `AssetTransitionError('O relatório mudou…','conflict')` → `toast.warning` e `getOrderVisitAssetById` chamado de novo
  - Aprovado + gestor mostra "Estornar Aprovação"; confirmar chama `{ action:'reopen', expectedFrom:5 }`
  - Offline (`mockOnline.value = false`), Reportar → chama `reportedOrderVisitAsset` (caminho atual) e **não** `transitionOrderVisitAsset`
  - Offline, Aprovar/Rejeitar/Estornar → `toast.error('Sem conexão: esta ação precisa de internet.')`, nada chamado
  - Não-admin (padrão): todos os testes existentes passam sem edição (Review Focus 5)
- [ ] **Step 2:** `npx jest --config jest.config.cjs views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.test.tsx` → novos FAIL, antigos PASS.
- [ ] **Step 3:** Implementar. Modal de estorno reaproveita o `ConfirmModal` já usado na tela, com texto `'O relatório volta para Reportado e a movimentação do ativo é desfeita. Continuar?'`.
- [ ] **Step 4:** Rodar → todos PASS; `npm run lint:eslint` sem erros.
- [ ] **Step 5:** Commit `feat(relatorio-ativo): fluxo novo de etapas para isAdminSuper`.

---

### Task 6: Rejeição por motivo e aviso para o técnico

**Files:**
- Create: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportRejectDialog.tsx` (substitui o modal inline de `OrderVisitAssetReport.tsx:818-857` **só** no fluxo novo; usa `DialogShell`, como os outros diálogos após a etapa 5 de acessibilidade)
- Modify: `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx` (aviso "Motivo da Rejeição" mostra descrição do motivo + texto; seção apontada destacada)
- Modify: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportProgress.tsx` (prop `flaggedSectionId?: string` → item com borda/ícone vermelho)
- Test: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportRejectDialog.test.tsx`

**Interfaces:**
- Consumes: `getOvaRejectionReasons` (Task 4) via `useQuery({ queryKey: ['ova-rejection-reasons'], staleTime: Infinity })`; `handleConfirmRejection(reasonId: number, notes: string)` do hook (Task 5 passa a aceitar esses argumentos no fluxo novo).
- Produces: `<AssetReportRejectDialog open reasons onCancel onConfirm(reasonId, notes) loading />`.

Regras: motivo obrigatório; texto obrigatório só quando o motivo é 99 "Outro"; botão "Confirmar Rejeição" desabilitado até valer.

- [ ] **Step 1: Testes:** lista os motivos por `sort`; confirmar desabilitado sem motivo; com motivo 2 e sem texto habilita e chama `onConfirm(2, '')`; motivo 99 sem texto continua desabilitado.
- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** Rodar → PASS.
- [ ] **Step 5:** No teste da tela (fluxo novo): ativo Rejeitado com `disapprovedReasonId: 2` mostra "Fotos do depois" no aviso e `AssetReportProgress` recebe `flaggedSectionId = REPORT_SECTION_IDS.after`.
- [ ] **Step 6:** Commit `feat(relatorio-ativo): rejeição com motivo e seção apontada`.

---

### Task 7: Faixa de etapas e histórico

**Files:**
- Create: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportTimeline.tsx`
- Modify: `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx` (renderiza no topo de `notices` quando `useNewFlow`)
- Test: `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportTimeline.test.tsx`

**Interfaces:**
- Consumes: `getOrderVisitAssetProcessingLogs` via `useQuery({ queryKey: ['ova-processing-logs', ovaId] })`, `OvaProcessingLog` (Task 4).
- Produces: `<AssetReportTimeline processingId isFiled logs />` (o componente recebe `logs`; a query fica na tela).

Exibição: 5 etapas `Rascunho · Reportado · Revisado · Aprovado · Arquivado`, atual destacada, Rejeitado mostrado como desvio em vermelho na posição de Revisado. Abaixo, "Histórico (N)" recolhível: uma linha por log com verbo (`report` Reportou, `revert_draft` Voltou para rascunho, `review` Revisou, `reject` Rejeitou, `approve` Aprovou, `reopen` Estornou a aprovação, `file` Arquivou, `review_cancelled` Cancelou a revisão — entra quando a Task 8 existir), nome, `formatDateInBrazil(createdAt)`, motivo/notas e, se houver, "Alterou: " + `changedFields` com rótulos de `REPORT_FIELD_LABELS` (criar em `assetReportShared.tsx`, mapa campo→rótulo para os campos que o autosave grava).

- [ ] **Step 1: Testes:** etapa atual com `aria-current="step"`; Rejeitado mostra "Rejeitado"; `isFiled` marca Arquivado; histórico fechado mostra "Histórico (3)", aberto lista os 3 verbos na ordem; `changedFields: ['after_comments']` aparece como rótulo, não como nome de coluna.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(relatorio-ativo): faixa de etapas e histórico`.

---

### Task 8: Sessão de edição — "Cancelar" desfaz o que foi alterado na revisão/aprovação

Hoje o autosave grava na hora e "Cancelar" só sai do modo. No fluxo novo, entrar em Revisar/Aprovar abre uma **sessão de edição** no servidor com uma cópia do relatório; "Cancelar" restaura a cópia; "Confirmar" fecha a sessão e grava no histórico os campos alterados (calculados no servidor pela diferença cópia × atual — substitui o rastreio no cliente).

**Files:**
- Create: `dev/supabase/migrations/20261120_create_ova_edit_sessions.sql` + `_DOWN.sql` + `_CHECKS.sql`
- Modify: `services/orders/visitsService.ts`, `services/dataService.ts`, `services/offline/offlineLayer.ts` (só online)
- Modify: `hooks/useReportStatusFlow.ts`, `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx`, `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions.tsx`
- Test: `services/orders/visitsService.assetEditSession.test.ts`, `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.test.tsx`

**Interfaces:**
- Consumes: `flow_order_visit_asset_transition_v1` (Task 3), `transitionOrderVisitAsset` (Task 4), hook da Task 5.
- Produces (banco):
  - `public.orders_visits_assets_edit_sessions (id bigserial PK, ova_id bigint NOT NULL, user_id bigint NOT NULL, mode varchar NOT NULL CHECK (mode IN ('review','approval')), status varchar NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','cancelled','discarded')), snapshot jsonb NOT NULL, started_at timestamp NOT NULL DEFAULT TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP), closed_at timestamp, closed_user_id bigint)`; índice único parcial `(ova_id) WHERE status = 'open'` (uma sessão aberta por relatório). RLS só SELECT (como o log).
  - `snapshot` = `{ ova: to_jsonb(linha do OVA), activities: [linhas de orders_visits_assets_activities do OVA, inclusive is_deleted], materials: [linhas de orders_visits_assets_materials do OVA], alerts: [linhas de assets_alerts do asset_id] }`.
  - `public.flow_order_visit_asset_edit_v1(payload jsonb) RETURNS jsonb`, SECURITY DEFINER. Payload `{ op: 'begin' | 'cancel', ova_id, mode?, session_id? }`. Retorno `{ success, message, code?, session?: { id, user_id, user_name, mode, started_at }, orphan_photos?: { folder: string, names: string[] }[] }`.
    - `begin`: mesmas regras de papel de `review`/`approve` da tabela de transições e status 2/3; se já há sessão aberta **do mesmo usuário** → devolve ela com `code:'resume'`; de outro usuário → `code:'busy'` + dados da sessão; senão cria com o snapshot.
    - **Guarda de compatibilidade (APK antigo):** em `cancel` e na confirmação, se `processing_id` atual ≠ `snapshot->'ova'->>'processing_id'` (alguém mudou a etapa pelo caminho antigo — ex.: gestor aprovou ou líder voltou para rascunho num APK atual), a sessão é fechada como `discarded` **sem restaurar nada** e devolve `code:'stale'`, `'O relatório mudou de etapa enquanto a revisão estava aberta; as alterações da revisão foram mantidas e a revisão foi encerrada.'`. `begin` também fecha como `discarded` (sem restaurar) qualquer sessão aberta cujo snapshot tenha etapa diferente da atual, antes de decidir `resume`/`busy`.
    - `cancel` (dono da sessão, gestor do contrato ou is_admin_super; os dois últimos marcam `discarded`): numa transação restaura o OVA (`UPDATE … FROM jsonb_populate_record`, **exceto** colunas de etapa/autoria/trava: `processing_id`, `reported_*`, `revised_*`, `disapproved_*`, `approved_*`, `locked_*`, `is_filed`, `filed_*`), e para atividades, materiais e alertas: `INSERT … ON CONFLICT (id) DO UPDATE` com as linhas do snapshot e remove as linhas criadas na sessão (id fora do snapshot; alertas só os com `ova_id` deste OVA). Devolve em `orphan_photos` os nomes que estão nas listas atuais (OVA before/after, checklist) e não estão no snapshot. Grava log `action='review_cancelled'` com `changed_fields`.
  - `CREATE OR REPLACE` de `flow_order_visit_asset_transition_v1`: `review`/`approve` passam a exigir `session_id` de sessão aberta do próprio usuário para o OVA (`code:'invalid'`, `'Abra a revisão novamente.'`), fecham a sessão como `confirmed` e gravam `changed_fields` = chaves do OVA cujo valor mudou + `'activities'`/`'materials'`/`'alerts'` quando o conjunto de linhas mudou. `reject` com sessão aberta do usuário faz o `cancel` antes (rejeitar não guarda alterações).
- Produces (TS):
  ```ts
  interface OvaEditSession { id: string; userId: string; userName?: string; mode: 'review' | 'approval'; startedAt: string }
  beginOrderVisitAssetEdit(ovaId: string, mode: 'review' | 'approval'):
      Promise<{ status: 'started' | 'resume'; session: OvaEditSession } | { status: 'busy'; session: OvaEditSession }>;
  cancelOrderVisitAssetEdit(ovaId: string, sessionId: string): Promise<{ orphanPhotos: { folder: string; names: string[] }[] }>;
  // transitionOrderVisitAsset ganha sessionId?: string
  ```

Regras na tela (fluxo novo):
- "Revisar"/"Aprovar" chama `beginOrderVisitAssetEdit` antes de liberar a edição. `resume` → diálogo `'Você tem uma revisão em andamento desde {data}.'` com **Continuar** / **Descartar alterações**. `busy` → aviso `'Em revisão por {nome} desde {data}.'`; gestor do contrato/isAdminSuper vê **Descartar revisão de {nome}**.
- "Cancelar": desabilitado com fotos enviando; `flushSave()` antes; confirmação `'Desfazer todas as alterações feitas nesta revisão?'`; chama `cancelOrderVisitAssetEdit`, recarrega ativo, atividades, materiais, alertas e checklist; `orphanPhotos` → `photoCleanupService.deleteUnreferencedPhotos` se existir (plano `2026-11-20-limpeza-fotos-r2.md`), senão ignora (o script recolhe).
- Durante a sessão ficam ocultos "Trocar ativo", "Remover ativo da visita" e "Usar como capa" (mexem fora do relatório e não teriam como voltar).
- **Offline durante a sessão (correção 1):** a camada offline enfileira as gravações do modo revisão (autosave `updateOrderVisitAsset`, atividades, materiais, checklist, fotos, alertas) e elas seriam enviadas **depois** de um Cancelar/Confirmar, sobrescrevendo a restauração. Por isso: com sessão aberta e `isOnline()` falso, a tela fica só consulta (`isReadOnly` verdadeiro) com o aviso `'Sem conexão — revisão pausada. As alterações voltam a ser liberadas quando a internet voltar.'`; e "Cancelar"/"Confirmar" ficam desabilitados enquanto `hasUnsentChanges` (já existe na tela: `offlineSync.unsentOvaIds` contém o OVA), com o rótulo `'Enviando alterações pendentes...'`.
- Sair da tela com sessão aberta (voltar / `useBackToClose`): diálogo **Descartar alterações** / **Continuar editando** / **Sair e continuar depois** (sessão fica aberta).
- "Confirmar Revisão/Aprovação" passa `sessionId` ao `transitionOrderVisitAsset`.

- [ ] **Step 1: `_CHECKS.sql`:** begin cria sessão; begin de novo pelo mesmo usuário → `resume`; outro usuário → `busy`; alterar texto, desmarcar atividade, adicionar material, adicionar foto, criar alerta e cancelar → tudo volta ao snapshot, material/alerta novos somem, `orphan_photos` traz a foto nova, etapa e autoria intactas; confirmar sem sessão → recusa; confirmar com sessão → `changed_fields` certo e sessão `confirmed`; gestor descarta sessão de outro → `discarded`; rejeitar com sessão aberta → alterações desfeitas e status 4; **etapa mudada pelo caminho antigo** (`UPDATE orders_visits_assets SET processing_id = 5` direto, como o APK atual faz) com sessão aberta → `cancel` devolve `stale`, nada é restaurado, sessão `discarded`; idem `processing_id = 1`; `begin` depois disso cria sessão nova.
- [ ] **Step 2:** Escrever migration + `_DOWN` (o `_DOWN` volta a transition_v1 da Task 3); pedir ao usuário para aplicar e rodar os checks.
- [ ] **Step 3: Testes de serviço:** `beginOrderVisitAssetEdit` mapeia `started`/`resume`/`busy`; `cancelOrderVisitAssetEdit` com `code:'stale'` lança `AssetTransitionError` com `code === 'stale'` (a tela mostra `toast.warning` com a mensagem e recarrega); `cancelOrderVisitAssetEdit` devolve `orphanPhotos`; `transitionOrderVisitAsset` envia `session_id`.
- [ ] **Step 4: Testes da tela (fluxo novo):** clicar "Revisar" chama `beginOrderVisitAssetEdit(id,'review')` e só então libera os campos; `busy` mostra "Em revisão por Fulano" e mantém só consulta; "Cancelar" + confirmar chama `flushSave` → `cancelOrderVisitAssetEdit` → `getOrderVisitAssetById` de novo; com `pendingCount > 0` "Cancelar" fica desabilitado; com sessão aberta e `mockOnline.value = false` os campos ficam só consulta e aparece "revisão pausada"; com `unsentOvaIds` contendo o OVA, "Cancelar" e "Confirmar" ficam desabilitados com "Enviando alterações pendentes..." (o mock de `useOfflineSync` passa a ler `mockUnsent`); em sessão, "Trocar Ativo" e "Remover Ativo" não aparecem; confirmar envia `sessionId`.
- [ ] **Step 5:** FAIL → implementar → PASS; `npx tsc --noEmit && npm test && npm run lint:eslint`.
- [ ] **Step 6:** Commit `feat(relatorio-ativo): cancelar a revisão desfaz as alterações (sessão de edição)`.

### Task 9: Conferência no app e atualização dos planos

**Files:**
- Modify: `docs/PLANO_RELATORIO_ATIVO_FLUXO.md` (status: implementado para isAdminSuper; o que falta para a liberação geral: offline do `report`/`revert_draft` via `client_uuid`, remover `syncOrderVisitAssetsProcessing` do cliente, aposentar os métodos antigos)

- [ ] **Step 1:** Com um usuário isAdminSuper, no app (web e Android): percorrer rascunho → reportar → rejeitar (motivo Fotos do depois) → ver aviso e destaque → reportar → aprovar direto → estornar → Revisar, alterar texto/atividade/material/foto/alerta e **Cancelar** (tudo volta) → Revisar de novo e fechar o app no meio (ao voltar, Continuar/Descartar) → aprovar → aprovar a visita → arquivar a visita → ativo mostra Arquivado e nenhum botão de etapa. Conferir o histórico em cada passo.
- [ ] **Step 2:** Com um usuário não-admin, repetir reportar/revisar/aprovar e confirmar que nada mudou.
- [ ] **Step 3:** Atualizar o plano e commitar `docs: status do fluxo do relatório do ativo`.
