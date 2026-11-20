# Edição de horários da visita (isAdminSuper) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que só o `isAdminSuper` corrija data/hora de início e fim de uma visita não aprovada, com `orders.status_at` e `orders_statuses_logs` acompanhando.

**Architecture:** RPC `flow_order_visit_update_times_v1` (SECURITY DEFINER) concentra permissão, validações e atualização atômica. O front chama pelo serviço de visitas (proxy no `dataService`, só online), e um modal aberto pelo botão "Editar visita" do card coleta os horários.

**Tech Stack:** React 19 + TypeScript, Supabase (PL/pgSQL), TanStack Query, Jest (node + jsdom/Testing Library).

**Spec:** [docs/superpowers/specs/2026-11-19-editar-horarios-visita-design.md](../specs/2026-11-19-editar-horarios-visita-design.md)

## Global Constraints

- Responder e escrever textos de UI em português (pt-BR); imports relativos (alias `@/` só em testes).
- Datas: exibir com `formatDateTime`/`formatDateInBrazil` (nunca `toLocale*String`); enviar ao banco com `toBrazilNaiveDateTime` (horário de São Paulo, sem offset); em SQL, `timezone('America/Sao_Paulo', now())`.
- Serviço novo em `services/orders/visitsService.ts`; proxy no `dataService` no formato `nome: (...args: Parameters<typeof svc.nome>): ReturnType<typeof svc.nome> => svc.nome(...args)` (sem `.bind`).
- Migration **aplicada manualmente pelo usuário**; conferir colunas reais no banco vivo (MCP `supabase-ro`) antes de escrever o SQL. Prefixo da data: `20261119_`.
- Só online: o método entra na lista "F — só online" de `services/offline/offlineLayer.ts`.
- Modal segue o padrão de `CloseVisitModal`/`DeleteVisitModal` (`DialogShell` ou equivalente, `useBackToClose`, `useDialogA11y`).
- Verificação final: `npx tsc --noEmit && npm test && npm run lint:eslint`.

## Review Focus

- Visita **aberta**: enviar `ended_at` não nulo deve ser recusado; visita **encerrada** com `ended_at` nulo também.
- OS que já avançou (`orders.status_at` ≠ horário antigo): a visita é corrigida e a OS/log **não** são tocados.
- Salvar sem mudar nada (mesmos valores) não pode falhar nem reescrever `status_at`/log.
- Usuário não `isAdminSuper` chamando o RPC direto é recusado no banco, mesmo com botão oculto no front.
- Item movimentado aprovado: alterar só o início passa; alterar o fim é recusado; reenviar o mesmo fim não é tratado como alteração.

---

### Task 1: Migration do RPC `flow_order_visit_update_times_v1`

**Files:**
- Create: `dev/supabase/migrations/20261119_create_flow_order_visit_update_times_v1.sql`
- Create: `dev/supabase/migrations/20261119_create_flow_order_visit_update_times_v1_DOWN.sql` (`DROP FUNCTION IF EXISTS public.flow_order_visit_update_times_v1(jsonb);`)

**Interfaces:**
- Produces: `public.flow_order_visit_update_times_v1(payload jsonb) RETURNS jsonb`. Payload: `{ "visit_id": number, "started_at": "YYYY-MM-DDTHH:mm:ss", "ended_at": "YYYY-MM-DDTHH:mm:ss" | null }`. Retorno: `{ "success": boolean, "message": text }` (nunca lança; `EXCEPTION WHEN OTHERS` devolve `success:false`), mesmo padrão de `flow_order_visit_reassign_v1`.

- [ ] **Step 1: Confirmar colunas reais no banco vivo**
  Via MCP `supabase-ro`, conferir em `orders_visits` (`ov_started_at`, `ov_ended_at`, `ov_status_id`, `ov_approved_at`, `ov_is_filed`, `is_deleted`, `is_canceled`, `o_id`, `ov_updated_user_id`, `ov_updated_at`), `orders` (`status_id`, `status_at`), `orders_statuses_logs` (`id`, `order_id`, `order_status_id`, `order_status_at`), `orders_visits_assets` (`ov_id`, `is_moved`, `processing_id`, `is_deleted`) e `users.is_admin_super`/`users.uuid`. Se algum nome divergir, usar o do banco e registrar no cabeçalho do SQL.

- [ ] **Step 2: Escrever a função** com cabeçalho no estilo da reassign (descrição, spec e plano) e, nesta ordem:
  1. `auth.uid()` nulo → `success:false` "Usuário não autenticado."; ler `users.is_admin_super` por `uuid = auth.uid()`; diferente de `true` → "Apenas o administrador super pode editar os horários da visita.".
  2. Payload: `visit_id` e `started_at` obrigatórios; datas lidas como `timestamp`.
  3. Travar a visita (`FOR UPDATE`) com `is_deleted = false`, `is_canceled = false` e `ov_status_id IN (1,2)`; senão "Visita inválida ou indisponível.". `ov_approved_at IS NOT NULL` ou `ov_is_filed = true` → "Visita aprovada ou arquivada não pode ter os horários editados.".
  4. Coerência fim × estado: visita aberta (`ov_ended_at IS NULL`) exige `ended_at` nulo; encerrada exige `ended_at` não nulo.
  5. Datas: `ended_at >= started_at`; nenhuma maior que `timezone('America/Sao_Paulo', now())`.
  6. Trava de ativos: se `ended_at` **difere** do `ov_ended_at` atual e existe item em `orders_visits_assets` com `ov_id = visita`, `is_deleted = false`, `is_moved = true`, `processing_id = 5` → recusar com a mensagem do spec ("Há ativos movimentados já aprovados nesta visita. Volte o item para rascunho ou revisado, corrija o horário e aprove o item novamente."). Mudança só do início não dispara a trava.
  7. Travar a OS (`FOR UPDATE`) e gravar `ov_started_at`, `ov_ended_at`, `ov_updated_user_id` (id do usuário autenticado) e `ov_updated_at`.
  8. Acompanhamento **somente se** o valor antigo mudou: para o fim, depois para o início, se `orders.status_at = <valor antigo>` então `UPDATE orders SET status_at = <novo>` e `UPDATE orders_statuses_logs SET order_status_at = <novo>` na linha de maior `id` com `order_id`, `order_status_at = <antigo>` e `order_status_id = orders.status_id`. Não tocar em `assets`/`orders_visits_assets`.
  9. Retornar `{success:true, message:'Horários da visita atualizados.'}`. `REVOKE ALL ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;` e `COMMENT ON FUNCTION`.

- [ ] **Step 3: Roteiro de verificação manual (o usuário executa no SQL Editor, dentro de `BEGIN; ... ROLLBACK;`)**
  Incluir no fim do arquivo, comentado, um roteiro que cubra: não admin recusado; visita aberta com fim recusada; fim < início recusado; data futura recusada; visita aprovada recusada; item movimentado aprovado + fim alterado recusado e só início aceito; OS que avançou mantém `status_at`; reenviar os mesmos valores retorna sucesso sem alterar OS/log; caso feliz atualiza visita, `orders.status_at` e a linha do log.
  Expected: cada caso retorna o `success`/mensagem descrito.

- [ ] **Step 4: Commit**
  ```bash
  git add dev/supabase/migrations/20261119_create_flow_order_visit_update_times_v1.sql dev/supabase/migrations/20261119_create_flow_order_visit_update_times_v1_DOWN.sql
  git commit -m "feat(db): RPC flow_order_visit_update_times_v1 para editar horários da visita"
  ```

---

### Task 2: Serviço `editVisitTimes` + proxy + só online

**Files:**
- Modify: `services/orders/visitsService.ts` (junto de `reassignOrderVisit`, ~linha 528)
- Modify: `services/dataService.ts` (junto de `reassignOrderVisit`, linha ~1420)
- Modify: `services/offline/offlineLayer.ts` (grupo "F — só online", ~linha 143-152)
- Test: `services/orders/visitsService.editVisitTimes.test.ts`

**Interfaces:**
- Consumes: RPC da Task 1.
- Produces: `editVisitTimes(visitId: string | number, startedAt: string, endedAt: string | null): Promise<void>` em `visitsService` e `dataService.editVisitTimes` (mesma assinatura). Lança `Error(message)` quando `success:false`; relança o erro do Supabase em falha de rede/RPC.

- [ ] **Step 1: Escrever o teste (falha)** — mock `jest.mock('../core/supabase', () => ({ supabase: { rpc: jest.fn() } }))`:
  - `chama o RPC com visit_id numérico e datas naive`: `editVisitTimes('7', '2026-11-10T09:00', '2026-11-10T11:30')` → `rpc` chamado com `('flow_order_visit_update_times_v1', { payload: { visit_id: 7, started_at: '2026-11-10T09:00:00', ended_at: '2026-11-10T11:30:00' } })`.
  - `fim nulo é enviado como null` (visita aberta).
  - `success:false vira Error com a mensagem do banco`: `rejects.toThrow('Há ativos movimentados já aprovados...')`.
  - `erro do supabase é relançado`.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx jest --config jest.config.cjs services/orders/visitsService.editVisitTimes.test.ts`
  Expected: FAIL (`editVisitTimes` não existe).

- [ ] **Step 3: Implementar** `editVisitTimes` em `visitsService.ts` seguindo `reassignOrderVisit` (converter com `toBrazilNaiveDateTime`; não enviar `user_id`, o banco usa `auth.uid()`). Adicionar o proxy no `dataService.ts` no formato padrão e `'editVisitTimes'` na lista F de `offlineLayer.ts`.

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx jest --config jest.config.cjs services/orders/visitsService.editVisitTimes.test.ts services/offline && npx tsc --noEmit`
  Expected: PASS, sem erros de tipo.

- [ ] **Step 5: Commit**
  ```bash
  git add services/orders/visitsService.ts services/dataService.ts services/offline/offlineLayer.ts services/orders/visitsService.editVisitTimes.test.ts
  git commit -m "feat(visitas): serviço editVisitTimes (só online)"
  ```

---

### Task 3: Regras puras `utils/visitTimes.ts`

**Files:**
- Create: `utils/visitTimes.ts`
- Test: `utils/visitTimes.test.ts`

**Interfaces:**
- Produces:
  - `canEditVisitTimes(params: { isAdminSuper?: boolean; visit: Pick<OrderVisit, 'ovStatusId' | 'approvedAt' | 'isFiled'>; isOnline: boolean }): boolean`: verdadeiro só com `isAdminSuper === true`, online, `ovStatusId` 1 ou 2, sem `approvedAt` e sem `isFiled`.
  - `validateVisitTimes(params: { startedAt: string; endedAt: string | null; isClosed: boolean; nowInput: string }): string | null`: devolve a mensagem de erro ou `null`. Entradas no formato `YYYY-MM-DDTHH:mm` (`datetime-local`); `nowInput` vem de `getBrazilDateTimeInputValue()`.

- [ ] **Step 1: Escrever os testes (falham)**
  - `canEditVisitTimes`: `false` para não admin; `false` offline; `false` com `approvedAt`; `false` com `isFiled`; `false` com `ovStatusId` 3; `true` para visita aberta (1) e encerrada (2) de admin online.
  - `validateVisitTimes`: `'Informe a data/hora de início'` sem início; `'Informe a data/hora de fim'` se `isClosed` e fim vazio; `'O fim não pode ser anterior ao início'`; `'Não é permitido informar data/hora futura'` para início ou fim > `nowInput`; `null` no caso válido; visita aberta ignora o fim.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx jest --config jest.config.cjs utils/visitTimes.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implementar** as duas funções (comparação lexicográfica das strings `YYYY-MM-DDTHH:mm`, como já faz o `CloseVisitModal`).

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx jest --config jest.config.cjs utils/visitTimes.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add utils/visitTimes.ts utils/visitTimes.test.ts
  git commit -m "feat(visitas): regras de permissão e validação dos horários da visita"
  ```

---

### Task 4: Modal `EditVisitTimesModal`

**Files:**
- Create: `components/ordersVisits/EditVisitTimesModal.tsx`
- Test: `components/ordersVisits/EditVisitTimesModal.test.tsx`

**Interfaces:**
- Consumes: `validateVisitTimes` (Task 3); `getBrazilDateTimeInputValue` de `utils/formatters`.
- Produces: `EditVisitTimesModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (data: { startedAt: string; endedAt: string | null }) => Promise<void>; isLoading?: boolean; visit: Pick<OrderVisit, 'ovStartedAt' | 'ovEndedAt' | 'ovStatusId'> }>`.

- [ ] **Step 1: Escrever os testes (falham)** (mocks de `sonner` e de `useBackToClose` como em `CloseVisitModal`/`DeleteVisitModal`):
  - abre com início (e fim, se encerrada) preenchidos com os valores atuais da visita;
  - visita aberta (`ovStatusId` 1): campo de fim **ausente** e `onConfirm` recebe `endedAt: null`;
  - fim anterior ao início: mostra `toast.error('O fim não pode ser anterior ao início')` e **não** chama `onConfirm`;
  - sem alteração: botão "Salvar" desabilitado (nada a salvar);
  - caso válido: `onConfirm` chamado com `{ startedAt: '2026-11-10T08:30', endedAt: '2026-11-10T11:00' }`;
  - `isLoading`: botão desabilitado com texto "Salvando...".

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx jest --config jest.config.cjs components/ordersVisits/EditVisitTimesModal.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Implementar** o modal (`input type="datetime-local"` para início/fim; título "Editar horários da visita"; texto de apoio avisando que a OS acompanha a mudança; botões "Salvar" e "Voltar"). Valores iniciais via `getBrazilDateTimeInputValue(visit.ovStartedAt/ovEndedAt)`; reinicializar quando `isOpen` muda. Validar com `validateVisitTimes` e `toast.error` antes de `onConfirm`.

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx jest --config jest.config.cjs components/ordersVisits/EditVisitTimesModal.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add components/ordersVisits/EditVisitTimesModal.tsx components/ordersVisits/EditVisitTimesModal.test.tsx
  git commit -m "feat(visitas): modal de edição dos horários da visita"
  ```

---

### Task 5: Botão "Editar horários" nos cards V1 e V2

**Files:**
- Modify: `components/ordersVisits/OrderVisitCardDetail.tsx` (V1: `onEditVisit` já é recebido mas não é renderizado; renderizar antes de "Excluir Visita", ~linha 340)
- Modify: `components/ordersVisits/OrderVisitCardDetailV2.tsx` (adicionar `onEditVisit` ao destructuring da linha 53 e um `ActionButton` antes de "Excluir visita", ~linha 222)
- Test: `components/ordersVisits/OrderVisitCardDetail.test.tsx` (acrescentar casos)

**Interfaces:**
- Consumes: prop existente `onEditVisit?: () => void`.
- Produces: botão com rótulo **"Editar horários"** (ícone `edit_calendar`) visível só quando `onEditVisit` é passado, em ambos os visuais.

- [ ] **Step 1: Escrever os testes (falham)** no padrão do arquivo (`renderCard`, `labels()`, `mockUi.isV2`):
  - v1 e v2: com `onEditVisit` aparece "Editar horários" e clicar chama o callback;
  - v1 e v2: sem `onEditVisit` o rótulo não aparece.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npx jest --config jest.config.cjs components/ordersVisits/OrderVisitCardDetail.test.tsx`
  Expected: FAIL nos novos casos.

- [ ] **Step 3: Implementar** o botão nos dois visuais (V1: estilo do "Excluir Visita" porém neutro, `slate`; V2: `ActionButton tone="neutral"`).

- [ ] **Step 4: Rodar e ver passar**
  Run: `npx jest --config jest.config.cjs components/ordersVisits/OrderVisitCardDetail.test.tsx`
  Expected: PASS, incluindo os casos antigos.

- [ ] **Step 5: Commit**
  ```bash
  git add components/ordersVisits/OrderVisitCardDetail.tsx components/ordersVisits/OrderVisitCardDetailV2.tsx components/ordersVisits/OrderVisitCardDetail.test.tsx
  git commit -m "feat(visitas): botão Editar horários nos cards de detalhe da visita"
  ```

---

### Task 6: Ligação na tela da visita e verificação final

**Files:**
- Modify: `views/OrderVisit/OrderVisitScreen.tsx` (substituir o `onEditVisit` provisório da linha 681; estados e handlers junto de `isDeleteModalOpen`/`handleConfirmDeleteVisit`; renderizar o modal junto de `DeleteVisitModal`, ~linha 937)

**Interfaces:**
- Consumes: `canEditVisitTimes`, `EditVisitTimesModal`, `dataService.editVisitTimes`, `useNetwork` (`hooks/useNetworkStatus.ts`, de onde sai `isOnline`; conferir o nome do campo no contexto), `refreshVisit` já existente na tela.

- [ ] **Step 1: Implementar a ligação**
  - Estados `isEditTimesOpen` e `isSavingTimes`.
  - `onEditVisit` só é passado quando `canEditVisitTimes({ isAdminSuper: currentUser?.isAdminSuper, visit, isOnline })` for verdadeiro; abre o modal.
  - `handleConfirmEditTimes(data)`: chama `dataService.editVisitTimes(visit.id, data.startedAt, data.endedAt)`; sucesso → `toast.success('Horários da visita atualizados.')`, fechar modal, `await refreshVisit()` e `window.dispatchEvent(new Event('refresh_dashboard'))`; erro → `toast.error(error instanceof Error ? error.message : 'Erro ao atualizar horários')`, modal permanece aberto; `finally` → `setIsSavingTimes(false)`. Após salvar também invalidar as queries do recurso da OS se a tela já usa `useQuery` (conferir `refreshVisit`).

- [ ] **Step 2: Verificação completa**
  Run: `npx tsc --noEmit && npm test && npm run lint:eslint`
  Expected: tudo passa, sem erros de ESLint.

- [ ] **Step 3: Verificação no app (depois do usuário aplicar a migration)**
  Run: `npm run dev`; como `isAdminSuper`, abrir uma visita encerrada não aprovada → "Editar horários" → alterar fim → conferir novo horário no card, `orders.status_at` e o log; como outro perfil, o botão não aparece; em visita aprovada, não aparece.
  Expected: fluxo funciona; com ativo movimentado aprovado, mudar o fim mostra a mensagem da trava.

- [ ] **Step 4: Commit**
  ```bash
  git add views/OrderVisit/OrderVisitScreen.tsx
  git commit -m "feat(visitas): editar horários da visita pelo isAdminSuper"
  ```
