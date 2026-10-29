# Plano — Escopo de dados por cliente via `cfg_departments.clients_ids`

> **Status:** EM PLANEJAMENTO — **Gate 2 concluído** (Fase 1B validada); Fase 1C em execução (dados e observação)  
> **Data de criação:** 2026-10-23  
> **Última atualização:** 2026-10-27  
> **Responsável:** Implementação SIGES  
> **Migrations:**
> - `dev/supabase/migrations/20261026_units_clients_ids_compat.sql` — Fase 1A (aditiva, compatível com a web antiga)
> - `dev/supabase/migrations/20261026_client_scope.sql` — Fase 1D (barreira real; somente após aposentar a web antiga)
>
> **Runbook:** `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md`  
> **Rollback:** `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`

---

## 1. Objetivo

Restringir o acesso a dados por cliente com base no vínculo entre `users.team_id` → `cfg_teams.department_id` → `cfg_departments.clients_ids`. Todo usuário com acesso a módulos escopados deve atuar em **contexto de um único cliente**, selecionado obrigatoriamente.

A implantação será **incremental e sem downtime**. Enquanto houver uma versão antiga web em produção, ela continuará usando `units.client_id`, `v_units`, `fc_units_search*` e `nearby_units` sem alteração de contrato. O app novo passa a usar `units.clients_ids`; um trigger mantém os dois campos sincronizados em modo single-client. A barreira de RLS só é ligada depois que a web antiga for aposentada (ou explicitamente validada).

---

## 2. Decisões Consolidadas

| Decisão | Definição | Status |
| :-- | :--- | :--: |
| Fonte de escopo | `users.team_id` -> `cfg_teams.department_id` -> `cfg_departments.clients_ids` | [x] Confirmado |
| `users.department_id` | Campo legado. Não será utilizado para este escopo. Será removido em migration separada após rollout validado. | [x] Confirmado |
| Sem clientes vinculados | `clients_ids = NULL` ou `clients_ids = {}` = **restrito com lista vazia. Sem acesso aos módulos escopados.** | [x] Confirmado |
| Com clientes vinculados | `clients_ids` preenchido com pelo menos 1 `clients.id` = restrito apenas à lista. | [x] Confirmado |
| Herança | Sem herança via `cfg_departments.parent_id`. Apenas departamento direto da equipe. | [x] Confirmado |
| Usuário sem equipe ou equipe sem departamento | **Restrito com lista vazia.** Sem acesso aos módulos escopados. | [x] Confirmado |
| Admin / Super Admin | **Obrigatório selecionar 1 cliente** (lista com todos os clientes ativos). **Sem opção "Todos".** | [x] Confirmado |
| Seletor de cliente | Quando houver >1 cliente disponível (departamento ou admin), exibir seletor "Cliente" no cabeçalho. Obrigatório escolher antes de acessar módulos escopados. Persistido em `localStorage` (`siges_active_client_id`). | [x] Confirmado |
| 1 cliente | Seleciona automaticamente. Seletor não aparece. | [x] Confirmado |
| Módulos escopados | `clients`, `units`, `assets`, `contracts`, `orders`, `orders_visits` e todas as tabelas/visões filhas | [x] Confirmado |
| Módulos não-escopados | `warehouses`, `materials`, `vehicles`, `tools`, `users` (listagem), `users_notifications`, `cfg_app_*`, `rankings`, `Ranking de Líderes` | [x] Confirmado |
| Dashboards/Relatórios | Entram no escopo e respeitam o cliente ativo (exceto `Ranking de Líderes` que permanece global) | [x] Confirmado |
| Limpeza `users.department_id` | Fase separada (após rollout validado) | [x] Confirmado |
| Compatibilidade com a web antiga | A web antiga continua em `units.client_id` e nos objetos atuais. `v_units`, `fc_units_search*` e `nearby_units` só mudam na Fase 5; policies só mudam na Fase 1D. | [x] Confirmado |
| `units.client_id` | Legado transitório. Na Fase 1A/1B, `units.clients_ids` é espelho de `client_id`; depois do multi-cliente, `client_id` vira projeção legada (`clients_ids[1]`); removido na Fase 5. | [x] Confirmado |
| Multi-cliente em `units` | UI e escrita multi-cliente **desligadas** até a web antiga ser aposentada. A Fase 1B opera em modo single-client. | [x] Confirmado |
| Edição multi-cliente | Proposta: após o Gate 4, somente Admin/Super Admin edita unidades multi-cliente; usuários de departamento editam unidades single-client do próprio escopo. | [ ] Pendente |
| RLS e web antiga | A troca de `"Universal Access"` por policies de escopo é a Fase 1D e só ocorre após aposentar a web antiga (ou após validação explícita de compatibilidade). | [x] Confirmado |

---

## 3. Arquitetura

### 3.1 Fluxo de resolução
```text
auth.uid() 
  -> public.users.uuid 
  -> public.users.team_id 
  -> public.cfg_teams.department_id 
  -> public.cfg_departments.clients_ids
```

### 3.2 Regras de avaliação
| Caso | `fc_scope_has_resolution()` | `fc_scope_is_unrestricted()` | `fc_scope_client_ids()` | Resultado |
| :-- | :---: | :---: | :---: | :--- |
| Admin/Super Admin | `true` | `true`* | `[]` (lista completa carregada no app) | Atua em contexto único via seletor (todos os clientes disponíveis) |
| Com equipe+departamento e `clients_ids` com >=1 | `true` | `false` | `[client_ids...]` | Restrito à lista, filtra pelo cliente ativo |
| Com equipe+departamento e `clients_ids` NULL ou `{}` | `true` | `false` | `[]` | Restrito com lista vazia |
| Sem equipe OU equipe sem departamento | `false` | `false` | `[]` | Restrito com lista vazia |

\* Admin/Super Admin nunca herda o bloqueio por `clients_ids` vazio, mas **nunca** visualiza "todos" simultaneamente — precisa selecionar 1 cliente no `ClientSelector`.

### 3.3 Compatibilidade transitória (Fases 1A/1B)

```text
Web antiga  ── lê/escreve ──> units.client_id
App novo    ── lê/escreve ──> units.clients_ids
                                  ↕
                         trigger de sincronização
```

Regras da fase de transição:

1. `units.clients_ids` é a fonte do app novo; `units.client_id` continua sendo a fonte da web antiga.
2. O trigger mantém os dois iguais em modo **single-client**: `clients_ids = ARRAY[client_id]`.
3. O app novo escreve **somente** `clients_ids` (não envia `client_id` no payload).
4. A web antiga escreve **somente** `client_id`; o trigger atualiza `clients_ids`.
5. Unidade multi-cliente editada pela web antiga gera erro explícito (proteção contra perda de dados). Multi-cliente fica desligado até a Fase 1D (após o Gate 4).
6. `v_units`, `fc_units_search*` e `nearby_units` permanecem **inalterados** até a Fase 5; as policies permanecem inalteradas até a Fase 1D.
7. O app novo pode usar a view aditiva `v_units_clients` para exibir todos os nomes; a web antiga ignora essa view.

---

## 4. Estratégia de Implantação Incremental

### 4.1 Princípios

- **Aditivo primeiro:** criar coluna, trigger, índice e views novas; não renomear, não dropar, não mudar tipos/assinaturas.
- **Um escritor por coluna na transição:** web antiga escreve `client_id`; app novo escreve `clients_ids`; trigger reconcilia.
- **Gates explícitos:** nenhuma fase destrutiva ou de RLS começa sem o gate anterior aprovado.
- **Rollback barato:** cada fase tem rollback próprio; a web antiga continua funcionando se o app novo for revertido.
- **Sem big-bang:** a barreira real de RLS fica para a Fase 1D, depois da aposentadoria da web antiga.

### 4.2 Gates de implantação

| Gate | Após | Critério para avançar | Impacto na web antiga |
| :-- | :-- | :-- | :-- |
| **Gate 1** | Fase 1A | `client_id` x `clients_ids` com 0 divergências; smoke tests da web antiga OK; rollback testado | Nenhum (coluna/trigger/índice aditivos) |
| **Gate 2** | Fase 1B | App novo em canário sem erros; 0 divergências; web antiga OK; multi-cliente desligado | Nenhum (app novo isolado) |
| **Gate 3** | Fase 1C | 73 unidades sem cliente resolvidas ou com decisão; `client_id` inválidos tratados; assets sem `unit_id` mapeados/decididos; orders null/0/divergentes tratados; 1–2 semanas de observação | Nenhum (correções de dados podem alterar exibição; comunicar) |
| **Gate 4** | Antes da Fase 1D | Web antiga aposentada (ou compatibilidade explicitamente validada); snapshot de policies/views/índices; rollback da 1D pronto | **Mudança de comportamento** (RLS) |
| **Gate 5** | Antes da Fase 5 | `clients_ids` autoritativo; nenhum fluxo lê/escreve `units.client_id`; web antiga sem tráfego; backup do `client_id` | **Quebra** se a web antiga ainda existir |

### 4.3 Fases

#### Fase 0 — Documentação
- [x] Criar `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md`
- [x] Criar `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`
- [x] Criar `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md`
- [ ] Manter estes documentos atualizados

#### Fase 1A — Compatibilidade aditiva de `units.clients_ids`
> Objetivo: preparar os dados sem mudar nada do que a web antiga consome.  
> **Status:** CONCLUÍDA (2026-10-27). Migration aplicada e Gate 1 aprovado.

- [x] Snapshot/backup e export de `units(id, client_id)` (ver rollback §0)
- [x] Criar migration `dev/supabase/migrations/20261026_units_clients_ids_compat.sql`
- [x] Adicionar `units.clients_ids bigint[] NOT NULL DEFAULT '{}'`
- [x] Criar trigger `trg_units_sync_clients_ids` + função `fn_sync_units_clients_ids` (single-client, scalar-wins, guarda multi-cliente)
- [x] Backfill `clients_ids = ARRAY[client_id]` onde `client_id IS NOT NULL` e array vazio
- [x] Criar índice `idx_units_clients_ids_gin` (`GIN`; `CONCURRENTLY` opcional, em execução separada)
- [x] (Opcional) Criar view aditiva `v_units_clients` para o app novo
- [x] Validar: 0 divergências, sem `NULL` dentro do array; registrar `client_id` inválidos para a Fase 1C
- [x] Smoke tests da web antiga (unidades, ativos, ordens, visitas, manuais)
- [x] Testar rollback da Fase 1A
- [x] **Não alterar** `v_units`, `fc_units_search*`, `nearby_units` nem policies

#### Fase 1B — App novo em modo single-client
> Objetivo: o app novo passa a ler/escrever `clients_ids`, mas ainda com um cliente por unidade.  
> **Status:** CONCLUÍDA (2026-10-27). Gate 2 aprovado.

- [x] Atualizar `types/index.ts`: `Unit.clientsIds`, `clientId` como legado derivado
- [x] Atualizar `services/core/unitsService.ts`: selecionar `clients_ids`; criar/atualizar enviando **somente** `clients_ids`
- [x] Atualizar `services/companies/companiesService.ts` (`getUnitsByClient`): `.contains('clients_ids', [Number(clientId)])`
- [x] Atualizar `views/Settings/Clients/Units/UnitForm.tsx`: select único -> salvar `[cliente]`
- [x] Atualizar `views/Units/UnitsSearch.tsx`: exibir/filtrar por `clientsIds`/`v_units_clients`
- [x] Atualizar `views/Settings/SettingsRouter.tsx`: `selectedUnit?.clientsIds?.[0]`
- [x] Atualizar fallback de `views/ServiceRequest/ServiceRequestForm.tsx`: `clientsIds.includes(...)`
- [x] Feature flag `MULTI_CLIENT_UNITS=false` (UI multi-cliente desligada)
- [x] Deploy direto (sem canário); web antiga permanece
- [x] Testar: criar/editar unidade no app novo e ver o efeito na web antiga; editar na web antiga e ver no app novo
- [x] **Não alterar** `v_units`, `fc_units_search*`, `nearby_units` nem policies

#### Fase 1C — Dados e observação (pré-escopo)
> Objetivo: resolver pendências de dados e observar a convivência antes de ligar a barreira real.  
> **Status:** EM EXECUÇÃO (2026-10-27).

> **Efeito esperado:** as 73 unidades com `clients_ids = '{}'` (e os ativos vinculados a elas) não aparecem em `getUnitsByClient` no app novo. A web antiga continua exibindo. Resolver na Fase 1C antes de ampliar o canário.

#### Fase 1C — Dados e observação (pré-escopo)
> Objetivo: resolver pendências de dados e observar a convivência antes de ligar a barreira real.

- [ ] Rodar consistência `client_id` x `clients_ids` (deve ser 0)
- [ ] Resolver as 73 unidades com `client_id` nulo (mapear cliente ou decidir admin-only)
- [ ] Tratar `client_id` inválidos (`0`, cliente inexistente)
- [ ] Contar/decidir assets com `unit_id` nulo
- [ ] Tratar orders com `client_id` nulo/0/divergente de `units.client_id`
- [ ] Decidir semântica de `clients_ids = '{}'` (negar; admin-only)
- [ ] Observar 1–2 semanas; monitorar logs e erros
- [ ] **Não ligar RLS** nesta fase

#### Fase 1D — Escopo real (somente após aposentar a web antiga)
> Objetivo: aplicar a barreira real de RLS/policies e o seletor de cliente.

- [ ] **Gate 4** aprovado (web antiga sem tráfego ou compatibilidade validada)
- [ ] Snapshot de policies/views/índices (rollback §0)
- [ ] Criar migration `dev/supabase/migrations/20261026_client_scope.sql`
- [ ] Substituir `fn_sync_units_clients_ids` pelo modo array-wins (remove o guard multi-cliente da 1A/1B)
- [ ] Adicionar `cfg_departments.clients_ids` (bigint[] NULL)
- [ ] Criar `CHECK` para bloquear `NULL` dentro do array
- [ ] Criar índice `GIN` em `cfg_departments.clients_ids`
- [ ] Criar trigger `trg_validate_department_clients_ids` + função `fn_validate_department_clients_ids`
- [ ] Criar funções `fc_scope_has_resolution`, `fc_scope_client_ids`, `fc_scope_is_unrestricted`, `fc_scope_department_id`
- [ ] Criar índices em `client_id` (`orders`, `units`, `assets`, `contracts`, `assets_alerts`)
- [ ] Substituir políticas `"Universal Access"` por políticas por comando
- [ ] Aplicar políticas em tabelas diretas + filhas
- [ ] `v_assets_loans`: item já atendido (`security_invoker = true`); não reverter
- [ ] Validar casos: sem equipe, equipe sem departamento, NULL/{}, com lista, admin
- [ ] Ativar `ActiveClientProvider`/`ClientSelector` no app novo (implementados na Fase 2.5)
- [ ] Testes REST com token restrito
- [ ] Testar rollback da Fase 1D

**Predicados base das policies (Fase 1D):**

Todas as policies de leitura e escrita incluem
`fc_scope_is_unrestricted() OR <predicado>`; o `WITH CHECK` usa o mesmo
predicado para impedir gravação fora do escopo.

| Tabela | Predicado para usuário restrito | Observação |
| :-- | :-- | :-- |
| `clients` | `id = ANY(fc_scope_client_ids())` | Direto |
| `units` | Leitura: `clients_ids && fc_scope_client_ids()`; escrita: `clients_ids <@ fc_scope_client_ids()` | Interseção para ler; contenção para gravar |
| `assets` | `EXISTS (SELECT 1 FROM units u WHERE u.id = assets.unit_id AND u.clients_ids && fc_scope_client_ids())` | Escopo via unidade; **não** usar `assets.client_id` |
| `orders` | `client_id = ANY(fc_scope_client_ids())` | Limpar nulos/0/divergentes na Fase 1C |
| `orders_visits` | via `orders.client_id` (por `order_id`) | Se tiver `client_id` próprio, validar consistência na 1C |
| `contracts` | `client_id = ANY(fc_scope_client_ids())` | Se o contrato for por unidade, validar o vínculo |
| Filhas de `assets` | via `asset_id` → `assets.unit_id` → `units.clients_ids` | Ex.: `assets_alerts`, `assets_loans` |
| Filhas de `orders`/`orders_visits` | via pai → `orders.client_id` | Ex.: manutenções, itens, checklists |
| `v_assets_loans` | Sem policy nova | Já é `security_invoker=true` |

> **Atenção no `units`:** leitura usa `&&` (vê a unidade se compartilha qualquer
> cliente), mas escrita usa `<@` (só pode gravar clientes que possui). Usar `&&`
> no `WITH CHECK` permitiria adicionar um cliente fora do escopo.
>
> **Usuário sem clientes:** incluir `cardinality(fc_scope_client_ids()) > 0` no
> `WITH CHECK` das escritas. Sem isso, `clients_ids <@ '{}'` permitiria inserir
> uma unidade vazia mesmo sem acesso.

> **Fora do primeiro rollout:** `users`, `cfg_teams`, `cfg_departments`,
> `cfg_profiles_access` e demais `cfg_*` continuam como estão. O escopo ainda
> pode ser contornado por leitura dessas tabelas; o endurecimento exige decisão
> separada (ver pendências).

#### Fase 2 — Camada de Dados (App)
> Pode ser desenvolvida em paralelo, mas só é **habilitada** após a Fase 1D.

- [ ] Atualizar `types/index.ts` (`Department.clientsIds?`, `ClientScope`)
- [ ] Atualizar `services/users/usersService.ts`
- [ ] Atualizar `services/companies/companiesService.ts` (`getClients()`)
- [ ] Criar/atualizar `services/core/clientScopeService.ts`
- [ ] Criar/atualizar `hooks/useClientScope.ts`
- [ ] Atualizar `contexts/AuthContext.tsx`

#### Fase 2.5 — Seletor único por cliente (obrigatório)
> Habilitar somente com a Fase 1D.

- [ ] Criar `contexts/ActiveClientContext.tsx` (admin carrega todos os clientes ativos; obrigatório selecionar 1)
- [ ] Criar `components/shell/ClientSelector.tsx`
- [ ] Criar `components/permissions/ActiveClientGuard.tsx`
- [ ] Adicionar `ActiveClientProvider` no `App.tsx`
- [ ] Adicionar `ClientSelector` no `components/shell/Header.tsx`
- [ ] Aplicar `ActiveClientGuard` nas rotas escopadas
- [ ] Forçar filtro por `activeClientId` em `ordersService`, `unitsService`, `dashboardService`
- [ ] Pré-preencher e travar cliente em formulários (SS/OS/Ativo)
- [ ] Persistir em `localStorage` (`siges_active_client_id`)

#### Fase 3 — Interface (UI)
- [ ] Criar `components/permissions/ScopeAllocationGuard.tsx`
- [ ] Atualizar `views/Departments/DepartmentForm.tsx` (aviso: precisa vincular pelo menos um cliente)
- [ ] Atualizar `views/Departments/DepartmentsList.tsx` / `DepartmentDetails.tsx`
- [ ] Atualizar `views/Settings/Users/AllUsersList.tsx` (alerta reforçado)
- [ ] Criar `components/ui/MultiSelect.tsx` se não existir
- [ ] Habilitar multi-cliente em `UnitForm` somente após Gate 4, restrito a Admin/Super Admin (proposta)

#### Fase 4 — Testes, Validação e Rollout
- [ ] **4A — Pré-escopo:** testes SQL/REST da Fase 1A; consistência; smoke tests da web antiga; canário do app novo
- [ ] **4B — Escopo restrito:** testes com token restrito; admin obrigatoriamente seleciona 1 cliente; múltiplos clientes no departamento; 1 cliente auto-selecionado; sem clientes/sem equipe bloqueado; troca de cliente atualiza listas/dashboards
- [ ] **4C — Produção:** canário do app novo; monitoramento; confirmação de aposentadoria da web antiga
- [ ] Testes Jest
- [ ] Rollout staging/produção (sem downtime)
- [ ] Rollback ensaiado por fase

#### Fase 5 — Limpeza (separada)
- [ ] Confirmar que a web antiga não tem mais tráfego
- [ ] Confirmar que nenhum fluxo lê/escreve `units.client_id`
- [ ] Backup/snapshot de `units(id, client_id)` e das definições de `v_units`/`nearby_units`
- [ ] Redefinir `v_units` para calcular `client_id = (clients_ids)[1]` (mesmo nome/tipo/posição) **antes** do drop
- [ ] Redefinir `nearby_units` para `(clients_ids)[1]` (mesmo return type) **antes** do drop
- [ ] Dropar `units.client_id` (sem `CASCADE`; sem dependências)
- [ ] Validar `v_units`, `fc_units_search*`, `nearby_units`
- [ ] (Opcional, depois) remover `client_id`/`client_name` das views/funções; recriar `fc_*` e `nearby_units` se o return type mudar

> **Limitação da projeção legada:** `v_units.client_id = clients_ids[1]` mantém
> `fc_units_search*` funcionando para buscas single-client, mas **não** expande
> unidades multi-cliente. O app novo deve filtrar por `clients_ids`/
> `v_units_clients`. Se precisar de busca multi-cliente via `fc_*`, redefinir as
> funções em migration separada.
- [ ] Verificar divergências `users.department_id` x `cfg_teams.department_id`
- [ ] Backup se houver divergências
- [ ] Dropar `users.department_id` em migration separada
- [ ] Atualizar `dev/supabase/schema.sql`

### 4.4 O que NÃO fazer enquanto a web antiga estiver ativa

- Não trocar policies nem habilitar RLS em `units`, `assets`, `orders`, `clients`, `contracts`, `orders_visits` ou filhas.
- Não alterar a assinatura/semântica de `v_units`, `fc_units_search`, `fc_units_search_filters` ou `nearby_units`.
- Não renomear/dropar `units.client_id`.
- Não habilitar UI/escrita multi-cliente em `units`.
- Não fazer backfill de `assets.client_id` (o escopo de ativo é via `assets.unit_id`).
- Não rodar `DROP ... CASCADE` em views/funções.
- Não remover `"Universal Access"` antes do Gate 4.

### 4.5 Rollback por fase (resumo)

| Fase | Rollback | Impacto na web antiga |
| :-- | :-- | :-- |
| 1A | Dropar trigger/função, view `v_units_clients`, índice e coluna `units.clients_ids` | Nenhum |
| 1B | Reverter deploy do app novo; banco permanece aditivo | Nenhum |
| 1C | Restaurar dados do backup/snapshot; sem rollback de schema | Nenhum (se correções forem revertidas) |
| 1D | Remover policies `client_scope_*`, restaurar policies do snapshot, dropar funções/colunas/índices do escopo e restaurar a função de sincronização 1A, se alterada | **Sim** — só executar após aposentadoria ou com compatibilidade validada |
| 5 | Restaurar backup, recriar `units.client_id`, restaurar `v_units`/`nearby_units` | **Sim** — exige web antiga já aposentada |

Detalhes em `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`.

---

## 5. Diário de Implementação

| Data | Fase | Alteração | Observações |
| :-- | :--- | :--- | :--- |
| 2026-10-23 | 0 | Criação dos planos | Criado plano principal + rollback |
| 2026-10-23 | 0 | Atualização de regras | `NULL`/`{}` passa a restringir. Só com >=1 cliente libera. |
| 2026-10-23 | 0 | Adicionado seletor único | Admin/Super Admin também obrigado a selecionar 1 cliente. Sem opção "Todos". |
| 2026-10-23 | 0 | Adicionado filtro por `units.clients_ids` | Preparado para pesquisa de unidades |
| 2026-10-26 | 0 | Reestruturação em fases incrementais | 1A (compatibilidade) → 1B (app single-client) → 1C (dados/observação) → 1D (RLS) → 5 (limpeza) |
| 2026-10-26 | 0 | Compatibilidade com web antiga | Web antiga continua em `client_id`; app novo escreve `clients_ids`; trigger sincroniza; multi-cliente desligado |
| 2026-10-26 | 0 | Runbook criado | `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md` |
| 2026-10-27 | 1A | Migration criada e aplicada | `dev/supabase/migrations/20261026_units_clients_ids_compat.sql` — coluna `units.clients_ids`, trigger de sincronia, backfill, índice GIN e view `v_units_clients` |
| 2026-10-27 | 1A | Gate 1 aprovado | 0 divergências, smoke tests da web antiga OK, rollback testado. Liberado para iniciar Fase 1B. |
| 2026-10-27 | 1B | Código adaptado para `clients_ids` | `types/index.ts`, `unitsService.ts`, `companiesService.ts`, `UnitForm.tsx`, `UnitsSearch.tsx`, `SettingsRouter.tsx`, `ServiceRequestForm.tsx`, `features.ts` |
| 2026-10-27 | 1B | Gate 2 aprovado | App novo escreve `clients_ids` em modo single-client. Deploy direto sem canário. Liberado para Fase 1C. |

---

## 6. Referências

- `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md` — passo a passo SQL/deploy/rollback
- `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`
- `services/users/usersService.ts` — resolução via `cfg_teams.department_id`
- `services/core/unitsService.ts` — leitura/escrita de `units.clients_ids`
- `services/companies/companiesService.ts` — `getUnitsByClient` com `.contains`
- `dev/supabase/schema.sql` — `v_units`, `nearby_units`, `fc_units_search*`
- `dev/supabase/dump_export/list_policies.txt` — inventário de policies
