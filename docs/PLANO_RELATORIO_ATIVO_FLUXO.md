# Plano: fluxo do Relatório do Ativo (rascunho → reportar → revisar/rejeitar → aprovar → arquivar)

Status: **proposta** (2026-11-20). Nada implementado ainda.

Escopo: o formulário `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx`, o hook
`hooks/useReportStatusFlow.ts`, os botões `components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions.tsx`
e os métodos de status em `services/orders/visitsService.ts` (`reportedOrderVisitAsset`,
`disapproveOrderVisitAsset`, `updateOrderVisitAssetProcessingStatus`, `syncOrderVisitAssetsProcessing`).

---

## 1. Como funciona hoje

`orders_visits_assets.processing_id` (`OVA_PROCESSING` em `assetReportShared.tsx`):

```
 1 Rascunho ──Reportar──▶ 2 Reportado ──Revisar──▶ 3 Revisado ──Aprovar──▶ 5 Aprovado
     ▲                       │   │                     │  │
     └──Manter rascunho──────┘   │                     │  └──Reportar de novo (showReport inclui 3)
                                 └──Rejeitar──▶ 4 Rejeitado ◀──Rejeitar──┘
                                                   └──Reportar──▶ 2
 Arquivar: só existe na VISITA (orders_visits.ov_is_filed); o ativo tem is_filed, mas o app nunca o liga.
```

Quem pode o quê (decidido só no cliente, em `actionFlags` da tela):

| Ação | Regra atual |
|---|---|
| Reportar | status 1, 3 ou 4 |
| Manter como rascunho (reverter) | status 2 **e** visita em rascunho |
| Rejeitar | permissão `orders_visits_processing_disapprove`, status 2/3 |
| Revisar | permissão `orders_visits_processing_review`, status 2/3 (abre modo edição) |
| Aprovar | `isContractManager` (consulta no cliente), status 2/3 (abre modo edição) |
| Arquivar | não existe para o ativo |

## 2. Problemas encontrados

1. **Transição sem validação no servidor.** Cada ação é um `UPDATE` direto em `orders_visits_assets`
   vindo do cliente. Nada impede pular etapas (ex.: aprovar um rascunho), nem que dois usuários
   mudem o mesmo ativo ao mesmo tempo (o último ganha).
2. **Aprovação não é atômica.** Aprovar ativo movido faz 2 gravações separadas (OVA e depois `assets`)
   e depois a recontagem. Se a segunda falha, o relatório fica Aprovado sem aplicar a movimentação.
3. **Revisar não grava autoria.** `updateOrderVisitAssetProcessingStatus(…, 3)` não preenche
   `revised_user_id` / `revised_at` (as colunas existem).
4. **Histórico se perde.** Reportar de novo apaga `disapproved_*` (só existe a última rejeição);
   reverter para rascunho não limpa `revised_*`/`approved_*`. Não há como saber quantas vezes o
   relatório foi rejeitado, por quem, nem o que o revisor mudou.
5. **Contadores da visita calculados no cliente** (`syncOrderVisitAssetsProcessing`): sujeitos a
   corrida e a falha silenciosa (só `console.error`).
6. **Aprovador decidido no cliente** (`isUserContractManager`) — RLS/servidor não confere.
7. **Arquivar ativo não existe**; `ov_assets_approved_filed_amount` tende a ficar sempre 0
   (confirmar no banco vivo).
8. **Regras de botões espalhadas na tela** (`actionFlags` em `OrderVisitAssetReport.tsx:428-438`),
   difícil de testar isoladamente. Casos estranhos: "Reportar" aparece em Revisado; Aprovado não
   tem estorno; Rejeitado não mostra quem rejeitou nem quando.
9. **Rejeição só com texto livre**, sem motivo categorizado nem itens apontados (ex.: "foto do depois
   ilegível"), o que dificulta corrigir e medir retrabalho.

## 3. Proposta

### 3.1 Máquina de estados única (cliente e servidor falam a mesma língua)

Ações: `report`, `revert_draft`, `reject`, `review`, `approve`, `reopen` (estorno), `file`, `unfile`.

| De \ ação | report | revert_draft | reject | review | approve | reopen | file |
|---|---|---|---|---|---|---|---|
| 1 Rascunho | → 2 | | | | | | |
| 2 Reportado | | → 1 (autor, visita em rascunho) | → 4 | → 3 | → 5 | | |
| 3 Revisado | | | → 4 | (re-revisar) | → 5 | | |
| 4 Rejeitado | → 2 | | | | | | |
| 5 Aprovado | | | | | | → 2 (gestor do contrato) | só via visita arquivada |

- Remove "Reportar" a partir de Revisado (revisado só vai para Aprovado ou Rejeitado).
- `reopen` (estorno da aprovação) só para perfil a definir; desfaz a movimentação aplicada? → ver decisões.
- Arquivado é **flag** (`is_filed`), não novo `processing_id`, para não quebrar views/contadores.

No cliente: `utils/assetReportFlow.ts` puro (`allowedActions(state, ctx)` e `nextStatus(state, action)`)
com `assetReportFlow.test.ts`. `actionFlags` da tela passa a ser derivado dele.

### 3.2 Banco (migrations manuais, com `_DOWN`)

1. **Tabela de histórico** `orders_visits_assets_processing_logs`
   (`ova_id`, `ov_id`, `action`, `from_processing_id`, `to_processing_id`, `user_id`, `notes`,
   `reason_code`, `changes jsonb` — campos alterados pelo revisor, `client_uuid` (idempotência offline),
   `created_at` em `timezone('America/Sao_Paulo', now())`). RLS de leitura igual à do OVA.
2. **RPC `flow_order_visit_asset_transition_v1(p_ova_id, p_action, p_expected_from, p_notes, p_reason_code, p_client_uuid, p_acted_at)`**
   no padrão dos `flow_order_visit_*` existentes:
   - `SELECT … FOR UPDATE` no OVA; confere `p_expected_from` (senão erro "status mudou, recarregue");
   - valida a transição pela mesma tabela do item 3.1 e a permissão/papel do usuário
     (gestor do contrato para `approve`, permissões de review/disapprove);
   - grava colunas de autoria corretas (`reported_*`, `revised_*`, `disapproved_*`, `approved_*`,
     e novas `filed_user_id`/`filed_at` se faltarem);
   - em `approve` com `is_moved`, aplica a movimentação em `assets` **na mesma transação**;
   - insere o log; reenvio com mesmo `client_uuid` não duplica;
   - recalcula os contadores de `orders_visits` no servidor (substitui `syncOrderVisitAssetsProcessing`);
   - bloqueia mudanças se a visita estiver aprovada/arquivada (exceto `file`);
   - `NOTIFY pgrst, 'reload schema'` ao final.
3. Arquivar a visita (`fileOrderVisit`) passa a marcar `is_filed` dos ativos aprovados (decidir se
   o arquivamento é só em cascata ou também por ativo).

### 3.3 Serviço / fachada / offline

- `visitsService.transitionOrderVisitAsset({ ovaId, action, expectedFrom, notes, reasonCode, clientUuid })`
  + proxy no `dataService` (formato padrão do `docs/agents/arquitetura-servicos.md`).
- Os três métodos atuais viram wrappers finos da RPC (mantém nomes para a camada offline e a fila
  já gravada nos aparelhos), depois marcados `@deprecated`.
- `services/offline/`: `report`/`revert_draft` continuam enfileiráveis (técnico em campo), usando
  `client_uuid` e `p_acted_at` (= `reportedAt` de hoje). `review`/`approve`/`reject`/`file` **só online**
  (revisor está no escritório; evita aprovação conflitante). Conflito de `expected_from` na sincronização
  vira pendência visível, não erro silencioso.
- `getOrderVisitAssetProcessingLogs(ovaId)` para o histórico (TanStack Query, chave `['ova-processing-logs', ovaId]`),
  invalidada junto com as consultas de OS/visita após cada transição.

### 3.4 Formulário (UI)

1. **Faixa de status no topo**: etapa atual em linha do tempo (Rascunho · Reportado · Revisado · Aprovado · Arquivado),
   com quem/quando de cada etapa (`formatDateInBrazil`).
2. **Histórico** recolhível ("3 eventos · rejeitado 1×"), lendo a tabela de logs.
3. **Rejeição melhor**: motivo obrigatório por categoria (fotos, atividades, materiais, movimentação,
   registrador, outro) + texto + opção de apontar seções; ao reabrir o relatório, o técnico vê o banner
   com o motivo e as seções apontadas destacadas no `AssetReportProgress`.
4. **"Cancelar" desfaz a revisão/aprovação** (decidido em 2026-11-20): entrar em Revisar/Aprovar abre uma
   *sessão de edição* no servidor com cópia do relatório (campos, atividades/checklist, materiais, alertas do ativo).
   Cancelar restaura a cópia; fotos novas viram órfãs e são limpas; Confirmar fecha a sessão e grava no histórico
   os campos alterados (diferença calculada no servidor). Uma sessão aberta por relatório; quem saiu no meio
   escolhe continuar ou descartar; o gestor do contrato pode descartar a de outro. Durante a sessão, Trocar ativo,
   Remover ativo e Usar como capa ficam ocultos.
5. **Arquivado** aparece na faixa de status quando a visita é arquivada (sem botão no ativo, decisão 4.3).
6. **Estornar aprovação** (secundário, perfil restrito, com confirmação e motivo).
7. Erro de concorrência ("outro usuário já alterou este relatório") recarrega o ativo em vez de
   sobrescrever.
8. Notificação ao técnico quando rejeitado (reaproveitar `users_notifications`) — verificar se já existe.

Visual: seguir os componentes atuais; se houver redesign, só para `isAdminSuper` (ver `PLANO_DESIGN_ESTILO_NUBANK.md`).

## 4. Decisões (respondidas em 2026-11-20)

1. **Revisar não é obrigatório**: aprovar sai de Reportado ou de Revisado.
2. **Estorno da aprovação**: só o **gestor do contrato** (`contracts_managers.role = 'manager'`).
   Volta para Reportado e desfaz a movimentação restaurando no ativo os valores **reais da hora da
   aprovação** (guardados no histórico como `asset_snapshot`), não os `before_*` — que são gravados
   na inclusão do ativo na visita (podem estar defasados) e não têm o comentário do ativo. Só restaura
   se o ativo ainda estiver como a aprovação o deixou; senão recusa.
3. **Arquivar**: só em cascata, ao **arquivar a visita** (ativos aprovados ficam `is_filed = true`).
4. **Voltar para rascunho**: o **líder da equipe** da visita (`orders_visits.ov_team_leader_id`).
5. **Motivos de rejeição**: **tabela** de configuração (`cfg_orders_visits_assets_rejection_reasons`).
6. **Liberação**: o fluxo novo vale só para **isAdminSuper**; os demais seguem no fluxo atual
   até a liberação geral. Primeira versão só online.

Plano de implementação: `docs/superpowers/plans/2026-11-20-fluxo-relatorio-ativo.md`.

## 5. Fases

| Fase | Entrega | Verificação |
|---|---|---|
| F0 | Respostas da seção 4; conferir no banco vivo (MCP `supabase-ro`) colunas reais, valores de `is_filed`, contadores e triggers do OVA | — |
| F1 | `utils/assetReportFlow.ts` + testes; `actionFlags` derivado dele; corrigir `revised_*` no serviço atual (bug 3) | `npm test`, testes da tela `OrderVisitAssetReport.test.tsx` |
| F2 | Migrations: tabela de logs, colunas `filed_*` se faltarem, RPC `flow_order_visit_asset_transition_v1` + `_DOWN` (aplicadas pelo usuário) | testar cada transição válida/inválida no SQL Editor |
| F3 | Serviço + `dataService` + wrappers + offline (`client_uuid`, só `report`/`revert_draft` enfileiráveis) | testes de serviço com mock; teste da fila offline |
| F4 | UI: faixa de status, histórico, rejeição por motivo, banner para o técnico, arquivar, estorno | `test:ui`; uso real no app (celular + desktop) |
| F5 | Remover `syncOrderVisitAssetsProcessing` do cliente e os wrappers depois que os APKs antigos esvaziarem a fila | `tsc`, `npm test`, `lint:eslint` |

Cada fase fecha com `npx tsc --noEmit && npm test && npm run lint:eslint`.

## 6. Riscos

- **APK atual em campo** (revisado em 2026-11-20): o reporte do ativo e da visita pelos líderes não é afetado — o
  caminho antigo (UPDATE direto) continua liberado e as views não mudam. Cuidados incluídos no plano: revisão aberta
  é encerrada sem restaurar se a etapa mudar pelo APK antigo; o gatilho de arquivamento não pode falhar no
  "Arquivar visita" antigo.
- **Offline** (revisado em 2026-11-20): líderes/técnicos seguem com a fila atual. No fluxo novo: revisão aberta fica
  só consulta sem internet e Cancelar/Confirmar esperam a fila do ativo esvaziar (senão a fila sobrescreveria a
  restauração); reportar/voltar para rascunho sem internet usam o caminho atual (fora do histórico novo); histórico
  e motivos sem cache aparecem vazios, sem erro.

- **Fila offline antiga** nos aparelhos chama os métodos atuais: os wrappers precisam aceitar os mesmos
  argumentos até a F5.
- **Views dependentes** (`v_orders_visits_assets`, `v_orders_visits`): a migration não deve dar `DROP … CASCADE`;
  se precisar expor colunas novas, `CREATE OR REPLACE VIEW` mantendo a ordem das colunas.
- **Permissão no servidor** pode bloquear quem hoje aprova pela regra do cliente: comparar as duas regras
  na F0 antes de ligar.
