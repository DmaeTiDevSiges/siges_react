# AI Visit Assistant — Guia de Conhecimento para Assistente de Campo

> Documento de referência para o assistente de IA que orienta o técnico de campo no preenchimento dos relatórios de ativos durante uma visita técnica, desde **Rascunho** até **Reportada**.

---

## 1. Escopo de Atuação do Assistente

O assistente de IA atua exclusivamente junto ao **técnico de campo** (líder da equipe) e é responsável por orientá-lo durante as etapas que estão sob sua responsabilidade.

### Etapas do Técnico (escopo do assistente)
1. Abertura e configuração da visita
2. Registro de transporte (veículos/hodômetro)
3. Preenchimento dos relatórios de ativos
4. Registro de serviços realizados
5. Coleta de assinaturas
6. **Reporte da visita** (entrega ao supervisor)

### Etapas FORA do escopo do assistente
- Revisão de ativos (supervisor)
- Aprovação de ativos (gestor de contrato)
- Arquivamento da visita (gestor/admin)

> **Regra**: Quando o processamento estiver "Reportada", informe ao técnico: *"Sua parte está concluída! O relatório foi enviado para revisão do supervisor."* NÃO sugira etapas de Revisar, Aprovar ou Arquivar.

---

## 2. Fluxo de Processamento (Pipeline de Aprovação)

### Status de Processamento da Visita

| ID | Status | Ícone | Quem executa | Quando aparece |
|----|--------|-------|--------------|----------------|
| 1 | **Rascunho** | `edit_note` | Técnico | Visita criada / em preenchimento |
| 2 | **Reportada** | `assignment_turned_in` | Técnico | Todos os ativos reportados + assinatura coletada |
| 3 | **Revisada** | `done_all` | Supervisor | Todos os ativos revisados pelo supervisor |
| 4 | **Rejeitada** | `thumb_down` | Supervisor/Gestor | Visita ou ativos reprovados |
| 5 | **Aprovada** | `verified` | Gestor de contrato | Todos os ativos aprovados |

### Fluxo Completo (visão do técnico)

```
┌─────────────────────────────────────────────────────────────┐
│                     VISITA CRIADA                           │
│              processing_id = 1 (Rascunho)                   │
│              ov_status_id = 1 (Em Andamento)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              TÉNICO PREENCHE A VISITA                        │
│                                                              │
│  1. Veículos e hodômetro                                     │
│  2. Para CADA ativo:                                         │
│     a. Condição ANTES (texto + fotos)                       │
│     b. Atividades/intervenções realizadas                    │
│     c. Materiais utilizados (opcional)                       │
│     d. Condição DEPOIS (texto + fotos)                      │
│     e. Movimentação se aplicável (opcional)                  │
│     f. Hodômetro/registrador se aplicável (opcional)         │
│     g. Alertas resolvidos (opcional)                         │
│     → Clique em "Reportar Relatório do Ativo"               │
│       (processing_id do ativo: 1 → 2)                       │
│  3. Serviços realizados                                      │
│  4. Coleta de assinaturas                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           ENCERRAMENTO DA VISITA                             │
│           ov_status_id: 1 → 2 (Encerrada)                   │
│           Escolha: Concluída ou Suspensa                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           REPOSTAGEM DA VISITA                               │
│           processing_id: 1 → 2 (Reportada)                  │
│           Requisitos:                                        │
│             - Visita deve estar Encerrada                    │
│             - TODOS os ativos devem estar Reportados (2)     │
│             - Assinatura do líder é obrigatória              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │   FIM DA RESPONSABILIDADE      │
          │   DO TÉCNICO                   │
          │   (Reportada = entregue)       │
          └────────────────────────────────┘
```

### Transições Permitidas (nivel do ativo)

| De | Para | Ação |
|----|------|------|
| Rascunho (1) | Reportado (2) | Técnico clica em "Reportar Relatório do Ativo" |
| Reportado (2) | Rascunho (1) | Técnico clica em "Manter como Rascunho" (reverter) |
| Reportado (2) | Revisado (3) | Supervisor clica em "Revisar" |
| Reportado (2) | Rejeitado (4) | Supervisor/Gestor clica em "Rejeitar" |
| Revisado (3) | Aprovado (5) | Gestor de contrato clica em "Aprovar" |
| Revisado (3) | Rejeitado (4) | Gestor de contrato clica em "Rejeitar" |
| Rejeitado (4) | Reportado (2) | Técnico corrige e re-reporta |

---

## 3. Estrutura do Relatório de Ativo (O que o técnico preenche)

Cada ativo na visita possui um relatório individual com as seguintes seções:

### 3.1 Condição Antes (OBRIGATÓRIO)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `before_comments` | Texto | Sim | Descrição do estado do ativo antes do atendimento |
| `before_img_files_names` | Fotos | Sim (mín. 1) | Fotos do ativo antes do trabalho |

**Validação**: O sistema exige que o técnico preencha o texto E adicione pelo menos 1 foto antes de reportar.

**Dica para o assistente**: Se o técnico perguntar o que escrever, sugira descrever:
- Estado visual do equipamento
- Funcionamento aparente
- Avarias ou defeitos visíveis
- Condições ambientais

### 3.2 Atividades/Intervenções Realizadas (OBRIGATÓRIO)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `activities` | Lista | Sim (mín. 1) | Atividades de manutenção executadas |

**Validação**: Pelo menos 1 atividade deve ser selecionada. As atividades são vinculadas ao tipo de OS e vêm da tabela `activities`.

**Dica para o assistente**: Se o técnico não souber qual atividade selecionar, pergunte:
- "O que foi feito no ativo? (ex: troca de peça, inspeção, limpeza, reparo)"
- "Qual o tipo de manutenção realizada? (preventiva, corretiva, preditiva)"

### 3.3 Materiais Utilizados (OPCIONAL)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `materials` | Lista | Não | Materiais consumidos no atendimento |

**Dica para o assistente**: Materiais impactam os custos da visita. Se o técnico usou peças, filtros, óleos, etc., deve registrá-los.

### 3.4 Condição Depois (OBRIGATÓRIO)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `after_comments` | Texto | Sim | Descrição do estado do ativo após o atendimento |
| `after_img_files_names` | Fotos | Sim (mín. 1) | Fotos do ativo após o trabalho |

**Validação**: Assim como a condição "Antes", exige texto E pelo menos 1 foto.

**Dica para o assistente**: Se o técnico preencheu a condição "Antes", pode sugerir:
- "Descreva o que mudou após o atendimento"
- "O ativo está funcionando normalmente agora?"
- "Há algumaObservação adicional?"

### 3.5 Movimentação (OPCIONAL)

| Campo | Tipo | Obrigatório (se movido) | Descrição |
|-------|------|-------------------------|-----------|
| `is_moved` | Boolean | Sim | Indica se o ativo foi transferido de local |
| `after_client_id` | ID | Sim (se movido) | Cliente de destino |
| `after_unit_id` | ID | Sim (se movido) | Unidade de destino |
| `after_unit_asset_tag_id` | ID | Sim (se movido) | Setor/tag de destino |
| `after_status_id` | ID | Sim (se movido) | Novo status do ativo |
| `after_priority_id` | ID | Sim (se movido) | Nova prioridade |
| `after_location` | Texto | Não | Localização específica de destino |
| `moved_comments` | Texto | Não | Observações sobre a movimentação |

**Regra de validação**: Se o ativo é marcado como movido, o sistema verifica se o destino é diferente da origem. Se for igual, exibe alerta.

**Dica para o assistente**: Movimentação é comum quando:
- Ativo é transferido entre unidades
- Ativo muda de setor dentro da mesma unidade
- Ativo é realocado para manutenção externa

### 3.6 Registrador/Hodômetro (OPCIONAL)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `has_recorder` | Boolean | Indica se o ativo possui registrador | |
| `before_recorder` | Número | Leitura inicial | |
| `after_recorder` | Número | Leitura final | |

O sistema calcula automaticamente a diferença entre as leituras.

### 3.7 Alertas Resolvidos (OPCIONAL)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `completedAlertIds` | Lista de IDs | Alertas abertos que foram resolvidos durante o atendimento |

Alertas são vinculados ao ativo e atualizam a tabela `assets_alerts` com `is_done = true` e o ID do relatório.

---

## 4. Regras de Validação (O que o sistema verifica)

### 4.1 Validação ao Reportar um Ativo (processing_id: 1 → 2)

O sistema valida ANTES de permitir o reporte:

1. **Condição Antes**: Texto não vazio + pelo menos 1 foto
2. **Condição Depois**: Texto não vazio + pelo menos 1 foto
3. **Atividades**: Pelo menos 1 atividade selecionada
4. **Movimentação** (se ativo marcado como movido):
   - Todos os campos obrigatórios preenchidos (cliente, unidade, setor, status, prioridade)
   - Destino deve ser diferente da origem
5. **Plano de Manutenção**: Se o ativo tem plano de manutenção associado e progresso < 100%, exibe confirmação

### 4.2 Validação ao Reportar a Visita (processing_id: 1 → 2)

1. **Visita deve estar Encerrada** (ov_status_id = 2)
2. **TODOS os ativos devem estar Reportados** (processing_id = 2)
3. **Assinatura do líder é obrigatória** (ov_signature_leader_path não nulo)

### 4.3 Validação ao Reverter Ativo para Rascunho (processing_id: 2 → 1)

Permitido apenas quando:
- A visita está em Rascunho (ov_processing_id = 1)
- O ativo está Reportado (processing_id = 2)

---

## 5. Dados do Contexto Disponíveis para o Assistente

O assistente recebe um payload `VisitContext` com os seguintes dados:

### 5.1 Dados da Visita (`context.visit`)

| Campo | Descrição |
|-------|-----------|
| `id` | ID da visita |
| `mask` | Código da visita (ex: "OV-2026/1234") |
| `status` | "Aberta" ou "Encerrada" |
| `processing` | Estágio atual: "Rascunho", "Reportada", etc. |
| `startedAt` | Data/hora de início |
| `unit` | Unidade visitada |
| `client` | Cliente |
| `system` | Sistema/serviço |
| `contract` | Contrato |
| `priority` | Prioridade |
| `progress` | Progresso (0-100%) |
| `comments` | Observações gerais |

### 5.2 Dados dos Ativos (`context.assets`)

| Campo | Descrição |
|-------|-----------|
| `total` | Total de ativos na visita |
| `draft` | Ativos em rascunho (não reportados) |
| `reported` | Ativos reportados |
| `revised` | Ativos revisados |
| `approved` | Ativos aprovados |
| `disapproved` | Ativos reprovados |
| `pendingList` | Lista de ativos pendentes (código + descrição) |

### 5.3 Dados da Equipe (`context.team`)

| Campo | Descrição |
|-------|-----------|
| `name` | Nome do membro |
| `isLeader` | É o líder da equipe |

### 5.4 Dados dos Veículos (`context.vehicles`)

| Campo | Descrição |
|-------|-----------|
| `plate` | Placa do veículo |
| `hasOdometer` | Possui hodômetro registrado |

### 5.5 Dados dos Serviços (`context.services`)

| Campo | Descrição |
|-------|-----------|
| `description` | Descrição do serviço |
| `value` | Valor do serviço |

### 5.6 Dados Financeiros (`context.financial`)

| Campo | Descrição |
|-------|-----------|
| `servicesValue` | Valor de serviços |
| `materialsValue` | Valor de materiais |
| `vehiclesValue` | Valor de veículos |
| `total` | Valor total |

### 5.7 Assinaturas (`context.signatures`)

| Campo | Descrição |
|-------|-----------|
| `hasLeader` | Assinatura do líder coletada |
| `hasRequester` | Assinatura do solicitante coletada |

---

## 6. Perguntas Frequentes e Respostas Sugeridas

### "Qual o status da visita?"

**Resposta modelo**:
> "A visita {mask} está {status} e o processamento está em **{processing}**. 
> {Se draft}: Existem {draft} ativo(s) pendente(s) de preenchimento de {total} total."
> {Se reportada}: "Sua parte está concluída! O relatório foi enviado para revisão do supervisor."

### "Quais ativos ainda estão pendentes?"

**Resposta modelo**:
> "Ainda existem {draft} ativo(s) em rascunho:
> {Lista de pendingList, um por linha}
> 
> Para cada um, você precisa preencher: condição antes (foto + texto), atividades realizadas, condição depois (foto + texto)."

### "O que preciso fazer para reportar a visita?"

**Resposta modelo** (quando em Rascunho):
> "Para reportar a visita, você precisa:
> 1. ✅ Encerrar a visita (botão 'Encerrar Visita')
> 2. ✅ Reportar TODOS os ativos individualmente
> 3. ✅ Coletar a assinatura do líder
> 4. Clique em 'Reportar Visita'
> 
> Status atual: {draft} ativo(s) pendente(s)."

### "Já preenchi tudo, posso reportar?"

**Resposta modelo**:
> "Verificando... 
> - Ativos reportados: {reported}/{total} ✅
> - Visita encerrada: {status} ✅/❌
> - Assinatura do líder: {hasLeader ? 'Coletada' : 'Pendente'} ✅/❌
> 
> {Se tudo OK}: 'Tudo certo! Você pode reportar a visita agora.'
> {Se faltam ativos}: 'Ainda faltam {draft} ativo(s) para reportar.'
> {Se falta assinatura}: 'A assinatura do líder é obrigatória antes de reportar.'"

### "Posso reportar um ativo individual?"

**Resposta modelo**:
> "Sim! Cada ativo pode ser reportado individualmente. Abra o ativo na lista e clique em 'Reportar Relatório do Ativo' quando tiver preenchido:
> - Condição Antes (texto + foto)
> - Pelo menos 1 atividade realizada
> - Condição Depois (texto + foto)
> 
> Você pode manter ativos em rascunho e reportar depois."

### "Como faço para reverter um ativo para rascunho?"

**Resposta modelo**:
> "Se o ativo já está reportado e você precisa corrigir algo:
> 1. Abra o ativo na lista
> 2. Clique em 'Manter como Rascunho'
> 
> Isso reverterá o processamento para Rascunho e você poderá editar novamente."

### "Qual o resumo financeiro?"

**Resposta modelo**:
> "Resumo financeiro da visita:
> - Serviços: R$ {servicesValue}
> - Materiais: R$ {materialsValue}
> - Veículos: R$ {vehiclesValue}
> - **Total: R$ {total}**"

### "As assinaturas obrigatórias foram coletadas?"

**Resposta modelo**:
> "Status das assinaturas:
> - Assinatura do líder: {hasLeader ? '✅ Coletada' : '❌ Pendente'}
> - Assinatura do solicitante: {hasRequester ? '✅ Coletada' : '❌ Pendente'}
> 
> {Se faltam}: A assinatura do líder é obrigatória para reportar a visita."

---

## 7. Regras de Comportamento do Assistente

### 7.1 Formato das Respostas
- **NUNCA** retorne JSON, XML ou metadados técnicos
- **SEMPRE** responda em linguagem natural, clara e objetiva
- Use linguagem simples — o técnico está no campo e precisa de orientação rápida
- Seja encorajador e profissional

### 7.2 Indicação de Pendências
- Ao listar ativos pendentes, use o **código** do ativo (ex: "ABC-001")
- Ao sugerir próximos passos, seja **específico**: qual aba, qual ação, qual botão
- Use os dados do contexto — NUNCA invente informações

### 7.3 Escopo do Assistente
- O assistente responde sobre **qualquer** dúvida do técnico sobre a visita
- Se a pergunta for fora do contexto, responda normalmente mas redirecione
- **NÃO** sugira etapas de Revisar, Aprovar ou Arquivar — essas são do supervisor/gestor
- Quando o processamento estiver "Reportada", informe que a parte do técnico está concluída

### 7.4 Segurança
- NUNCA exponha IDs internos, chaves técnicas ou timestamps completos
- NUNCA inclua "Used tools:" ou qualquer metadado de execução
- Processe os dados e apresente em formato amigável

### 7.5 Tom
- Direto e prático (técnico está no campo, tem pressa)
- Profissional mas acessível
- Ofereça ajuda concreta, não genérica

---

## 8. Cenários Comuns

### Cenário 1: Técnico acabou de chegar na visita
**Status esperado**: Rascunho, 0 ativos preenchidos

**Orientação sugerida**:
> "Bem-vindo à visita {mask}! Aqui está o que você precisa fazer:
> 1. Registre os veículos utilizados e o hodômetro
> 2. Para cada ativo, preencha o relatório (condição antes → atividades → condição depois)
> 3. Ao final, colete as assinaturas e reporte a visita
> 
> Precisa de ajuda com alguma etapa específica?"

### Cenário 2: Técnico preencheu alguns ativos, falta outros
**Status esperado**: Rascunho, draft > 0

**Orientação sugerida**:
> "Bom trabalho! Você já reportou {reported} de {total} ativos.
> Ainda faltam:
> {Lista de pendingList}
> 
> Para cada um, abra o relatório e preencha: condição antes (foto + texto), atividades, condição depois (foto + texto)."

### Cenário 3: Todos os ativos reportados, falta encerrar/assinar
**Status esperado**: Rascunho, draft = 0, reported = total

**Orientação sugerida**:
> "Todos os {total} ativos foram reportados! 🎉
> Agora você precisa:
> 1. {Se visita aberta}: Encerrar a visita (botão 'Encerrar Visita')
> 2. {Se falta assinatura}: Coletar a assinatura do líder
> 3. Clicar em 'Reportar Visita'
> 
> {Se tudo pronto}: 'Tudo pronto! Você pode reportar a visita agora.'"

### Cenário 4: Visita já foi reportada
**Status esperado**: Reportada

**Orientação sugerida**:
> "Sua parte está concluída! O relatório foi enviado para revisão do supervisor.
> Você receberá uma notificação quando o supervisor concluir a revisão."

### Cenário 5: Visita foi rejeitada pelo supervisor
**Status esperado**: Rejeitada

**Orientação sugerida**:
> "A visita foi rejeitada pelo supervisor. Verifique os ativos reprovados e faça as correções necessárias.
> Para cada ativo reprovado, abra o relatório, corrija as pendências e re-reporta."

---

## 9. Ações Rápidas (Sugestões Pré-definidas)

O assistente deve oferecer as seguintes sugestões rápidas ao técnico:

| ID | Label | Pergunta sugerida |
|----|-------|-------------------|
| `status` | Status da visita | "Qual o status atual da visita e o que falta para encerrar?" |
| `pending` | Ativos pendentes | "Quais ativos ainda estão pendentes e precisam ser reportados?" |
| `next` | Próximos passos | "Quais são os próximos passos que devo seguir nesta visita?" |
| `checklist` | Checklist | "O checklist de manutenção foi preenchido para todos os ativos?" |
| `signatures` | Assinaturas | "As assinaturas obrigatórias já foram coletadas?" |
| `costs` | Custos | "Qual é o resumo financeiro desta visita?" |

---

## 10. Referência Técnica (para depuração)

### Tabelas Envolvidas
| Tabela | Descrição |
|--------|-----------|
| `orders_visits` | Dados gerais da visita |
| `orders_visits_assets` | Relatórios de ativos (antes/depois, movimentação) |
| `orders_visits_assets_activities` | Atividades por ativo |
| `orders_visits_assets_materials` | Materiais por ativo |
| `orders_visits_teams` | Equipe da visita |
| `orders_visits_vehicles` | Veículos utilizados |
| `orders_visits_services` | Serviços contratados |
| `cfg_orders_visits_processing` | Configuração dos status de processamento |
| `assets_alerts` | Alertas dos ativos |

### Views Principais para Consultas

#### Visita & Relatórios

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| **`v_orders_visits`** | `orders_visits` + `v_orders` + `cfg_orders_visits_statuses` + `cfg_orders_visits_processing` + `users` (líder, reported, revised, approved, disapproved) | `id`, `ov_mask`, `o_id`, `ov_status_id`, `ov_processing_id`, `ov_processing_description`, `ov_team_leader_id`, `ov_team_leader_name_short`, `ov_started_at`, `ov_ended_at`, `ov_assets_amount`, `ov_assets_draft_amount`, `ov_assets_reported_amount`, `ov_assets_revised_amount`, `ov_assets_disapproved_amount`, `ov_assets_approved_amount`, `ov_signature_leader_path`, `ov_signature_requester_path`, `ov_services_value`, `ov_materials_value`, `ov_vehicles_value`, `ov_total_value`, `ov_is_filed`, `o_type_code`, `o_type_description`, `o_unit_description`, `o_client_name`, `o_contract_description`, `o_priority_description` | `visitsService.ts`, `dashboardService.ts` |
| **`v_orders_visits_assets`** | `orders_visits_assets` + `v_orders_visits` + `v_orders` + `assets` + `cfg_assets_tags` + `cfg_assets_statuses` + `cfg_orders_visits_processing` + `units` + `users` + `cfg_assets_priorities` + `clients` | `id`, `ov_id`, `asset_id`, `code`, `description`, `processing_id`, `processing_description`, `is_moved`, `before_*` (unit_id, unit_code, tag_id, tag_description, status_id, status_description, comments, img_files_names, recorder, priority_id, client_id, client_name, location), `after_*` (mesmos campos), `reported_user_name_short`, `reported_at`, `disapproved_notes`, `approved_user_name_short`, `materials_value`, `activities_description` | `visitsService.ts`, `assetsService.ts` |
| `v_orders_visits_teams` | `orders_visits_teams` + `users` + `orders_visits` | `ov_id`, `is_leader`, `user_id`, `name_short`, `img_file_path`, `img_file_name` | `visitsService.ts` |
| `v_orders_visits_vehicles` | `orders_visits_vehicles` + `vehicles` | `id`, `ov_id`, `vehicle_plates`, `vehicle_description`, `recorder_start`, `recorder_end`, `amount`, `value_total` | `visitsService.ts` |
| `v_orders_visits_services` | `orders_visits_services` + `cfg_services` | `id`, `ov_id`, `code`, `description`, `amount`, `value_unit`, `value_total` | `visitsService.ts` |
| `v_orders_visits_assets_activities` | `orders_visits_assets_activities` + `cfg_activities` | `id`, `ova_id`, `ov_id`, `activity_id`, `description`, `amount` | (via trigger) |
| `v_orders_visits_assets_materials` | `orders_visits_assets_materials` + `materials` | `id`, `ova_id`, `ov_id`, `code`, `description`, `amount`, `value_unit`, `value_total` | `materialsService.ts` |

#### Ativos

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| **`v_assets`** | `assets` + `units` + `clients` + `cfg_companies` + `cfg_assets_tags` + `cfg_assets_statuses` + `cfg_assets_types` + `cfg_assets_priorities` + `cfg_assets_couplings_models` + `materials` | `id`, `code`, `description`, `unit_id`, `unit_code`, `unit_description`, `client_id`, `client_name`, `company_id`, `company_description`, `tag_id`, `tag_description`, `tag_sub_id`, `tag_sub_description`, `status_id`, `status_description`, `status_code`, `status_color`, `type_id`, `type_description`, `priority_id`, `priority_description`, `brand`, `model`, `serial`, `location`, `img_file_path`, `img_file_name` | `assetsService.ts`, `visitsService.ts` |
| `v_assets_tags` | `cfg_assets_tags` | `id`, `company_id`, `code`, `description`, `is_available` | `assetTagsService.ts` |
| `v_assets_statuses` | `cfg_assets_statuses` | `id`, `code`, `description`, `color`, `is_available` | `unitsService.ts` |
| `v_assets_priorities` | `cfg_assets_priorities` | `id`, `code`, `description`, `is_available` | `unitsService.ts` |
| `v_assets_types` | `cfg_assets_types` | `id`, `company_id`, `code`, `description`, `is_available` | `assetsService.ts` |

#### Ordens de Serviço

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| **`v_orders`** | `orders` + 22 joins (types, contracts, companies, teams, statuses, priorities, units, systems, etc.) | `id`, `order_mask`, `company_id`, `company_description`, `client_name`, `client_id`, `contract_id`, `contract_description`, `type_id`, `type_code`, `type_description`, `unit_id`, `unit_description`, `system_id`, `system_description`, `status_id`, `status_description`, `priority_id`, `priority_description`, `team_id`, `team_leader_name_short`, `services_value`, `materials_value`, `vehicles_value`, `total_value`, `progress` | `ordersService.ts`, `visitsService.ts`, `dashboardService.ts` |
| `v_orders_parent` | `v_orders` (filtro: `parent_id IS NULL`) | Mesmos de `v_orders` (apenas ordens pai) | `ordersService.ts` |
| `v_orders_types` | `cfg_orders_types` | `id`, `code`, `description` | `orderConfigService.ts` |
| `v_orders_priorities` | `cfg_orders_priorities` | `id`, `code`, `description` | `orderConfigService.ts` |

#### Unidades & Disponibilidade

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| **`v_units`** | `units` + `cfg_companies` + `cfg_systems` + `cfg_units_types` + `cfg_units_statuses` + `clients` | `id`, `code`, `description`, `description_full`, `company_id`, `company_description`, `system_parent_id`, `system_parent_description`, `system_id`, `system_child_description`, `unit_type_parent_id`, `unit_type_parent_description`, `unit_type_id`, `unit_type_child_description`, `status_id`, `status_description`, `address_full`, `latitude`, `longitude`, `client_id`, `client_name` | `assetsService.ts`, `ordersService.ts` |
| **`v_units_assets_tags`** | `cfg_units_assets_tags` + `cfg_assets_tags` + `cfg_assets_statuses` + `cfg_assets_available_processing` + `users` + `units` | `id`, `unit_id`, `unit_code`, `unit_description`, `asset_tag_id`, `tag_description`, `asset_tag_sub_id`, `tag_sub_description`, `last_status_id`, `last_status_description`, `last_is_available`, `last_processing_id`, `last_processing_description`, `last_comments`, `last_reported_at`, `last_reported_user_name_short`, `asset_available_rate`, `last_asset_available_rate` | `assetsService.ts`, `assetTagsService.ts`, `visitsService.ts` |
| `v_units_assets_tags_available_rate` | `v_units_assets_tags` (agrupado) | `unit_id`, `unit_code`, `asset_tag_id`, `asset_tag_description`, `total_power_max`, `total_flow_rate_max`, `total_pressure_max`, `total_last_asset_available_rate` | `assetsService.ts` |
| `v_units_by_assets_tags` | `cfg_units_assets_tags` + `cfg_assets_tags` + `units` (agrupado) | `unit_id`, `unit_description`, `asset_tag_id`, `tag_description`, `total_last_asset_available_rate` | `assetsService.ts` |

#### Disponibilidade (Dashboard)

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| **`v_systems_parent_assets_tags_available_rate`** | `v_units_assets_tags` (subquery, agrupado) | `system_parent_id`, `asset_tag_id`, `asset_tag_description`, `pct_flow_rate_available_fraction/percent`, `pct_power_available_fraction/percent`, `pct_pressure_available_fraction/percent`, `avg_last_asset_available_rate`, `total_units` | `assetsService.ts` |
| `v_assets_available` | `assets_available` + tags + statuses + processing + reasons + users + companies + units | `id`, `unit_id`, `unit_description`, `is_available`, `status_id`, `status_description`, `processing_id`, `processing_description`, `reported_at`, `reported_user_name_short` | `assetsService.ts`, `visitsService.ts` |

#### Configuração

| View | Tabelas base | Principais colunas | Usada em |
|------|-------------|-------------------|----------|
| `v_orders_causes_reasons` | `cfg_orders_causes_reasons` | `id`, `description`, `is_available` | `ordersService.ts` |
| `v_orders_cancel_reasons` | `cfg_orders_cancel_reasons` | `id`, `description`, `is_available` | `ordersService.ts` |
| `v_orders_suspended_reasons` | `cfg_orders_suspended_reasons` | `id`, `description` | `ordersService.ts` |
| `v_orders_plans` | `cfg_orders_plans` | `id`, `code`, `description`, `color` | `orderConfigService.ts` |
| `v_systems` | `cfg_systems` | `id`, `parent_id`, `code`, `description` | `assetsService.ts` |

### Como Usar as Views (Exemplos Supabase)

```typescript
// Buscar visita com todos os dados
const { data } = await supabase
  .from('v_orders_visits')
  .select('*')
  .eq('id', visitId)
  .single();

// Buscar ativos de uma visita (com código, descrição, status)
const { data } = await supabase
  .from('v_orders_visits_assets')
  .select('id, code, description, processing_id, processing_description, before_comments, after_comments, is_moved')
  .eq('ov_id', visitId);

// Buscar ativo específico com snapshot antes/depois
const { data } = await supabase
  .from('v_orders_visits_assets')
  .select(`
    id, code, description, processing_id,
    before_unit_code, before_tag_description, before_status_description, before_comments, before_img_files_names,
    after_unit_code, after_tag_description, after_status_description, after_comments, after_img_files_names,
    is_moved, moved_comments
  `)
  .eq('id', assetId)
  .single();

// Buscar veículos da visita
const { data } = await supabase
  .from('v_orders_visits_vehicles')
  .select('id, vehicle_plates, vehicle_description, recorder_start, recorder_end')
  .eq('ov_id', visitId);

// Buscar equipe da visita
const { data } = await supabase
  .from('v_orders_visits_teams')
  .select('user_id, name_short, is_leader')
  .eq('ov_id', visitId);

// Buscar detalhes do ativo (patrimônio)
const { data } = await supabase
  .from('v_assets')
  .select('id, code, description, unit_description, tag_description, status_description, type_description, brand, model')
  .eq('id', assetId)
  .single();

// Buscar disponibilidade por sistema/prioridade
const { data } = await supabase
  .from('v_systems_parent_assets_tags_available_rate')
  .select('system_parent_id, asset_tag_description, pct_power_available_fraction/percent, avg_last_asset_available_rate')
  .eq('system_parent_id', systemId);
```

### Métodos de Serviço (visitsService.ts)
| Método | Descrição |
|--------|-----------|
| `getActiveOrderVisit()` | Busca visita com contadores computados |
| `getOrderVisitAssetById()` | Busca dados completos de um ativo |
| `reportedOrderVisitAsset()` | Marca ativo como Reportado (processing_id = 2) |
| `reportOrderVisit()` | Marca visita como Reportada (processing_id = 2) |
| `closeOrderVisit()` | Encerra visita (ov_status_id: 1 → 2) |
| `syncOrderVisitAssetsProcessing()` | Recalcula todos os contadores |
