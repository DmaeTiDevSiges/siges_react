# Programação Diária de Atendimento — plano

Tela **Gestão > aba Programação** (`orders-daily-schedule`): o gestor monta, por **contrato e dia**,
a prioridade de atendimento das OSs e a distribuição delas pelas equipes. O líder vê a sequência
da própria equipe no **Meu Painel**.

**Situação (10/11/2026):** código pronto (ainda não commitado), `tsc` em conferência.
Falta o usuário **aplicar as migrations** e **conceder `can_create`**, e depois validar na tela
pelo [roteiro de testes](#roteiro-de-testes-na-tela).

---

## 1. Pendências

| # | Item | Responsável | Situação |
|---|------|-------------|----------|
| 1 | Aplicar (ou reaplicar) `20261110_create_orders_daily_schedules.sql` — permissão passou de `edit` para `create`, rota renomeada e corrigido o erro `position` no `RETURNS TABLE` | Usuário (SQL Editor) | Pendente |
| 2 | Aplicar `20261126_create_orders_daily_schedules_logs.sql` (log das movimentações) | Usuário (SQL Editor) | Pendente |
| 3 | Conceder **`can_create`** da rota `orders_daily_schedule` aos perfis que montam a programação (só `can_edit` não basta mais) | Usuário (Permissões) | Pendente |
| 4 | Conferir `npx tsc --noEmit` sem erros | Dev | Em andamento |
| 5 | Rodar o [roteiro de testes](#roteiro-de-testes-na-tela) | Usuário + dev | Pendente |
| 6 | Commit das mudanças | Dev, quando o usuário pedir | Pendente |

As duas migrations são idempotentes (testadas em Postgres local; a 20261126 aplicada duas vezes
sem erro) e rodam dentro de `BEGIN/COMMIT`. A 20261126 tem `_DOWN` para reverter.

---

## 2. Regras de negócio (decididas em 10/11/2026)

### 2.1 Estrutura do quadro (de cima para baixo)

1. **OS's ABERTAS** (faixa azul): OSs abertas do contrato **ainda não priorizadas**, por data de abertura.
2. **OS's PRIORIDADE DE ATENDIMENTO** (faixa âmbar): as OSs escolhidas, em ordem
   (à esquerda = mais prioritária).
3. **Equipes**: uma coluna por equipe do departamento prestador que tem líder ativo.

Cada faixa tem os próprios filtros (Unidade, Setor e busca).

### 2.2 O que aparece

- **OSs Em Avaliação (status 2) não aparecem** em nenhuma faixa nem coluna.
- As **colunas das equipes começam vazias** a cada dia: só mostram as OSs inseridas nelas naquele dia.
  **Exceção:** OS **em execução** aparece sempre na coluna da própria equipe (no topo, se não
  estava na sequência salva) e **não aparece** em ABERTAS nem em PRIORIDADE.
- Ao carregar, a tela descarta da coluna a OS salva que mudou de equipe ou saiu de 3/4/5/6.
  Sem isso, a RPC recusaria salvar a sequência inteira.

### 2.3 Movimentações permitidas

| De → Para | Regra |
|-----------|-------|
| ABERTAS → PRIORIDADE | Permitido; entra na posição onde foi solta, ou no fim se solta fora de um cartão |
| PRIORIDADE → ABERTAS | Permitido (volta pela data de abertura) |
| PRIORIDADE → PRIORIDADE | Reordena |
| ABERTAS → equipe | **Proibido** (precisa passar por PRIORIDADE antes) |
| PRIORIDADE → equipe, OS **Em Avaliação** | Qualquer equipe; ao entrar, a OS é **autorizada** para ela. Hoje não ocorre, porque Em Avaliação não aparece |
| PRIORIDADE → equipe, OS **Autorizada** | **Qualquer equipe.** Na própria, só entra na coluna; em outra, **atualiza na OS a equipe responsável e o líder** (`team_id`/`team_leader_id`, só se ainda estiver Autorizada) |
| PRIORIDADE → equipe, OS **Agendada/Suspensa** com equipe definida | **Só a própria equipe**; a OS não muda |
| Equipe → equipe, OS **Autorizada** | Permitido; atualiza equipe responsável e líder na OS e sai da coluna antiga |
| Equipe → equipe, demais | **Proibido** (só reordena na própria coluna) |
| Equipe → PRIORIDADE ou ABERTAS, OS **Autorizada** | Permitido: sai da coluna do dia (log `unassign_team`); a OS **continua Autorizada com a mesma equipe e líder**. Em PRIORIDADE entra na posição solta; em ABERTAS também sai da prioridade |
| Equipe → faixas, demais | Proibido |
| Cada OS | Entra em **uma equipe só** por dia |

### 2.3.1 Arrastar × rolar

- A OS só é arrastada pela **alça ⠿** no canto do cartão.
- Clicar e puxar em qualquer outro lugar **rola** a faixa ou as equipes para os lados.
- Nas faixas, a roda do mouse também rola para os lados e a barra de rolagem fica visível.
- No celular, deslizar o dedo rola normalmente; para arrastar, use a alça ou o menu ⋮.

### 2.4 OS em execução (status 5)

- Aparece **só na coluna da própria equipe**, automaticamente (fora de ABERTAS e PRIORIDADE).
- **Não se move**: não é arrastável, não tem menu ⋮ e mostra cadeado.
- Tem **borda verde pulsando** (sem animação para quem configurou o sistema para reduzir movimento).
- Se outras OSs forem reordenadas em volta, o número dela pode mudar.

### 2.5 Permissões

- Tudo o que move ou grava exige **`canCreate('orders_daily_schedule')`**: priorizar, despriorizar,
  reordenar, inserir na equipe.
- Sem essa permissão, a tela é só leitura (aviso "acesso só de visualização").
- As RPCs conferem `fc_has_route_permission('orders_daily_schedule', 'create')`.
- Rota: `route_key = orders_daily_schedule`, `route_path = /orders_daily_schedule`.

### 2.6 Dias passados

- Só leitura na tela e nas RPCs (recusam `p_date < hoje` em São Paulo).
- A faixa ABERTAS não aparece em dia passado.

### 2.7 Histórico (consulta)

Ao escolher um dia passado, a tela mostra **a prioridade e a distribuição por equipe registradas
naquele dia**. Equipes que hoje não têm líder ou foram desativadas também aparecem, com
"Sem líder atual" no cabeçalho.

| O quê | Tabela | Conteúdo |
|-------|--------|----------|
| Prioridade do dia (estado final) | `orders_daily_schedules_priorities` | OS + posição |
| Distribuição por equipe (estado final) | `orders_daily_schedules_items` | OS + equipe + posição |
| Cabeçalho do dia | `orders_daily_schedules` | contrato, dia, quem gravou por último e quando |
| Cada movimentação | `orders_daily_schedules_logs` | OS, ação, equipe de origem e destino, posição, usuário, horário |

Ações do log: `prioritize`, `unprioritize`, `authorize_team`, `assign_team`, `change_team` e `unassign_team`.
`change_team` = OS Autorizada mudou de equipe (guarda a equipe de origem e a de destino). Reordenar dentro da mesma faixa ou
coluna **não** gera log.

**Herança da prioridade:**
- Dia **sem registro nenhum** começa com a última prioridade registrada antes dele.
- **Hoje:** ao abrir a tela, quem tem `canCreate` já grava a herdada como a do dia.
- **Dia futuro:** grava no primeiro movimento.
- Dia com registro e prioridade vazia (esvaziada de propósito) **não** herda.

### 2.8 Meu Painel (líder)

`fn_orders_daily_schedule_my_day` devolve a sequência do dia da equipe do usuário logado
(`SECURITY DEFINER`; o líder não precisa de permissão na rota).

---

## 3. Banco

| Migration | Conteúdo |
|-----------|----------|
| `20261110_create_orders_daily_schedules.sql` | Rota, tabelas `orders_daily_schedules`, `_items` e `_priorities`; RPCs `fn_orders_daily_schedule_save`, `fn_orders_daily_priorities_save` e `fn_orders_daily_schedule_my_day`; RLS de leitura por `view` |
| `20261126_create_orders_daily_schedules_logs.sql` (+ `_DOWN`) | Tabela `orders_daily_schedules_logs` e RPC `fn_orders_daily_schedule_log`, que exige `create` e recusa dia passado |

Gravação **só pelas RPCs** (`SECURITY DEFINER`). O client tem apenas `SELECT`, liberado pela RLS
para quem tem `view` na rota.
A gravação da sequência substitui os itens do dia de uma vez, e a da prioridade também.
Por isso o log é uma tabela própria, e não o `audits_logs`, que registraria apaga-e-recria
em vez de "OS X foi de A para B".

---

## 4. Arquivos

| Arquivo | Papel |
|---------|-------|
| `views/Dashboards/OrdersDailyScheduleScreen.tsx` | Tela: faixas, colunas, arrastar e soltar, regras de movimento, gravação com atraso (~1 s), herança |
| `services/orders/dailyScheduleService.ts` | Monta o quadro (`getBoard`), grava sequência e prioridade, `logMove`, autorização |
| `services/dataService.ts` | Fachada: `getDailyScheduleBoard`, `saveDailySchedule`, `saveDailyPriorities`, `logDailyScheduleMove`… |
| `components/orderRequests/dailySchedule/ScheduleOrderCard.tsx` | Cartão; `isScheduleLocked` (em execução) e `scheduleTeamRule` (para qual equipe pode ir) |
| `components/orderRequests/dailySchedule/ScheduleOrderActionsModal.tsx` | Menu ⋮ (alternativa ao arraste no celular): priorizar, devolver, subir/descer, inserir na equipe |
| `components/orderRequests/dailySchedule/ScheduleTeamColumn.tsx` | Coluna da equipe |
| `components/dashboards/DashboardTabs.tsx` | Aba "Programação", à esquerda de "Visitas" |
| `components/ui/FilterSelect.tsx` | `autoWidth`: filtro Contrato cresce com o nome |
| `index.css` | Animação `animate-execution-pulse` |

---

## 5. Em aberto / ideias (não implementadas)

- **Retirar OS não Autorizada da equipe:** só a Autorizada volta da coluna para as faixas;
  Agendada/Suspensa inserida por engano não sai pela tela.
- **Tela de histórico do log:** o log só pode ser consultado no banco. Sugestão: botão
  "Histórico" na Programação com a linha do tempo do dia.
- **Em Avaliação fora da programação:** com isso, a regra "Em Avaliação vai para qualquer equipe
  e é autorizada" não é usada. Autorizar passa a ser feito fora da Programação. Revisitar se
  o fluxo de autorização precisar voltar para cá.
- **Trava só no app:** o banco aceita gravar a sequência com OS em execução e não valida a regra
  "só a própria equipe". Considerar validar também nas RPCs.
- **Dia sem acesso:** o registro nasce quando alguém abre ou mexe na tela naquele dia. Dia sem
  acesso fica sem histórico.

---

## Roteiro de testes na tela

Usuário com `can_create`, contrato com OSs abertas em várias situações, dia de hoje.

- [ ] Aba "Programação" aparece à esquerda de "Visitas"; filtro Contrato com o nome inteiro
- [ ] ABERTAS mostra as OSs abertas **sem** as Em Avaliação; colunas das equipes vazias
- [ ] Arrastar de ABERTAS para PRIORIDADE: contorno tracejado ao pegar, destaque azul ao passar por cima, entra na posição
- [ ] Soltar sobre o título ou os filtros de PRIORIDADE: entra no fim
- [ ] PRIORIDADE → ABERTAS volta pela data de abertura; menu ⋮ faz o mesmo nos dois sentidos
- [ ] ABERTAS → equipe: recusa com aviso
- [ ] PRIORIDADE → equipe com OS Autorizada de outra equipe: OS passa a ter a nova equipe e o novo líder (conferir no detalhe da OS)
- [ ] Autorizada de uma coluna para outra: sai da antiga, atualiza equipe e líder; log `change_team`
- [ ] Autorizada da coluna para PRIORIDADE (entra na posição) e para ABERTAS (sai também da prioridade); equipe e líder da OS não mudam; log `unassign_team`
- [ ] Agendada/Suspensa: só entra na própria equipe; outra equipe recusa com aviso
- [ ] Inserir a mesma OS de novo: aviso "já programada para a equipe X"
- [ ] Equipe → outra equipe com OS não Autorizada: recusa; reordenar na coluna funciona
- [ ] Rolar ABERTAS, PRIORIDADE e as equipes clicando e puxando no cartão (sem mover a OS); roda do mouse rola as faixas
- [ ] Arrastar a OS só pela alça ⠿; no celular, deslizar rola e a alça arrasta
- [ ] OS em execução: só na coluna da própria equipe (fora de ABERTAS e PRIORIDADE), borda verde pulsando, cadeado, não arrasta, sem menu ⋮
- [ ] Cartão expande ao passar o mouse e mostra a descrição inteira; setor e posição no mesmo negrito
- [ ] Recarregar a página: prioridade e colunas continuam iguais (gravadas)
- [ ] `orders_daily_schedules_logs` tem uma linha por movimentação, com o usuário certo
- [ ] Dia anterior: só leitura, mostra o que foi registrado; nada arrasta
- [ ] Usuário só com `can_view`: aviso de visualização, nada arrasta
- [ ] Meu Painel do líder: aparece a sequência do dia da equipe dele
