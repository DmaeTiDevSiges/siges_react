# Edição de data/hora de início e fim da visita (apenas isAdminSuper)

Data: 2026-11-19 · Tamanho: mudança pequena/média (design curto)

## Intenção e porquê
O líder às vezes esquece de iniciar ou de encerrar a visita. O `isAdminSuper` precisa registrar depois os horários reais, para que relatórios, histórico de situação, gamificação e pontuação de líderes reflitam a realidade.

## Objetivos
- Só `isAdminSuper` edita `ov_started_at` e `ov_ended_at` de uma visita.
- Permitido com a visita **aberta** (só o início) ou **encerrada** (início e fim), enquanto **não aprovada** (`ov_approved_at` nulo) e não arquivada.
- `orders.status_at` acompanha a mudança, junto com `orders_statuses_logs`.

## Não objetivos
- Não altera status, progresso, equipe nem encerra/reabre visita.
- Não altera `status_at` / `after_status_at` dos ativos reportados. **Decisão do usuário:** a movimentação do ativo só grava a data na aprovação do item (`updateOrderVisitAssetProcessingStatus`, processing 5, usa `ov_ended_at`). Corrigindo o horário antes disso, a movimentação nasce com a data certa.
- Sem uso offline (não passa pela outbox).

## Anti-objetivo
Qualquer usuário não `isAdminSuper` conseguir alterar essas datas, inclusive chamando o Supabase direto.

## Abordagens consideradas
- **A) RPC no banco com a regra no servidor (escolhida).** Segura, atômica, no padrão de `flow_order_visit_reassign_v1`. Custo: migration aplicada manualmente.
- B) Update direto pelo front: sem migration, mas a trava fica só na tela/RLS. Descartada (dado alimenta gamificação e ranking).
- C) Reaproveitar o fluxo `is_manual_visit_start_end` do contrato: é para informar o fim ao encerrar, não para corrigir depois. Descartada.

## Desenho
**Banco** — `flow_order_visit_update_times_v1(p_visit_id, p_started_at, p_ended_at)`, SECURITY DEFINER, `search_path = public`, retorna jsonb `{success, message}` (padrão da reassign):
1. Valida: usuário autenticado é `isAdminSuper` (mesma fonte usada pela reassign); visita existe, não excluída, `ov_approved_at` nulo e não arquivada.
1b. **Trava de ativos (escolha minha, para a premissa acima valer):** a aprovação do item do ativo é por item e independe da aprovação da visita. Se algum item não excluído da visita com `is_moved` estiver aprovado (`processing_id = 5`), **alterar o fim é bloqueado**. Alterar só o início continua permitido.
   - **Mensagem da trava:** "Há ativos movimentados já aprovados nesta visita. Volte o item para rascunho ou revisado, corrija o horário e aprove o item novamente."
   - **Por que o fluxo funciona (verificado no código):** reverter o item só altera `processing_id`; a movimentação do ativo (`assets`) **não** é desfeita, e só a aprovação (5) a grava, lendo o `ov_ended_at` atual da visita e sobrescrevendo status, unidade, tag, prioridade e `status_at`. Logo, reaprovar o item depois da correção grava o ativo com a data certa. O mesmo vale para `reverse_order_visit_approval`, que só põe os itens em `processing_id = 2`.
   - **Limite conhecido (já existe hoje, fora do escopo):** entre reverter e reaprovar o item, o ativo permanece com a movimentação antiga. Se outra visita alterar o ativo nesse intervalo, a reaprovação sobrescreve essa alteração.
   - **Alternativa não adotada:** o RPC reescrever o `status_at` do ativo automaticamente (só se igual ao fim antigo) e dispensar a trava. Fica como opção futura, caso o fluxo manual atrapalhe.
2. Validações de data: início obrigatório; fim obrigatório se a visita está encerrada e deve permanecer nulo se está aberta; fim >= início; nenhuma data no futuro.
3. Trava a visita e a OS (`FOR UPDATE`) e grava `ov_started_at`/`ov_ended_at` + `ov_updated_user_id`/`ov_updated_at`.
4. Acompanhamento do `status_at`, **somente se igual ao valor antigo** (a OS ainda está na situação criada por essa visita):
   - início alterado → `orders.status_at` e a linha mais recente de `orders_statuses_logs` com status 5 (data igual à antiga);
   - fim alterado → `orders.status_at` e a linha de log da situação final correspondente (data igual à antiga).
   Se a OS já avançou, não mexe. A SS pai acompanha pelo trigger de herança existente.
5. Migration em `dev/supabase/migrations/`, aplicada por você. Antes, conferir colunas reais pelo MCP `supabase-ro`.

**Serviço** — `editVisitTimes` em `services/orders/visitsService.ts` chama o RPC; datas convertidas com `toBrazilNaiveDateTime`. Proxy em `dataService.ts` no formato padrão (sem `.bind`). Erro `success:false` vira mensagem na tela.

**Front**
- `OrderVisitScreen.tsx`: `onEditVisit` passa a abrir o modal, só se `currentUser?.isAdminSuper === true`, visita sem `approvedAt`, não arquivada e online. O botão deixa de aparecer para os demais.
- Novo `components/ordersVisits/EditVisitTimesModal.tsx`: campos datetime-local de início e fim (fim oculto/desabilitado se a visita está aberta); validação igual à do banco; ao salvar, invalida as queries da visita/OS (`useQuery`/TanStack) e mostra toast.
- Datas exibidas com `formatDateInBrazil`.

**Testes** — jest `.test.tsx` do modal (validações, fim ≤ início, aberta x encerrada) e visibilidade do botão por perfil; `.test.ts` do serviço (conversão de datas, repasse de erro). Verificação final: `npx tsc --noEmit && npm test && npm run lint:eslint`.

## Deixado ao construtor
Nome exato do campo de arquivamento e da fonte do `isAdminSuper` no banco (conferir no banco vivo); texto das mensagens; layout do modal.
