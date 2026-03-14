# Fluxo: Menu de Ações e Status de SS/OS (order-menu-status.flow)

Este documento define as ações disponíveis no menu de contexto (3 pontos) para Solicitações de Serviço (SS) e Ordens de Serviço (OS), bem como as regras de transição de status e campos obrigatórios.

## 1. Mapeamento de Situações (status_id)

| ID | Situação | Sigla | Descrição |
| :--- | :--- | :--- | :--- |
| **1** | Não Programada | SS | Solicitação inicial enviada pelo cliente. |
| **2** | Em Avaliação | SS / OS | Aguardando análise do gestor ou aprovação de orçamento. |
| **3** | Autorizada | OS | Pronta para execução. |
| **4** | Agendada | OS | Possui data/hora definida para execução. |
| **5** | Em Execução | OS | Visita iniciada e em andamento. |
| **6** | Suspensa | OS | Execução pausada por motivo externo/interno. |
| **7** | Cancelada | SS / OS | Serviço abortado. |
| **8** | Concluída | OS | Serviço finalizado. |

---

## 2. Matriz de Ações (Menu 3 Pontos)

| Status | Tipo | Ações Disponíveis | Regras / Condições |
| :--- | :--- | :--- | :--- |
| **1** | SS | **Gerar OS**, **Cancelar** | |
| **2** | OS | **Autorizar**, **Cancelar** | SS não possui ações neste status. |
| **3** | OS | **Agendar**, **Alterar Equipe**, **Cancelar** | **Cancelar**: bloqueado se houver visitas (is_deleted=false). |
| **4** | OS | **Reagendar**, **Cancelar** | **Cancelar**: bloqueado se houver visitas (is_deleted=false). |
| **5** | OS | Nenhuma Ação | Gestão feita pela Home da Visita. |
| **6** | OS | Nenhuma Ação | |
| **7** | OS | Nenhuma Ação | |
| **8** | OS | Nenhuma Ação | |

---

## 3. Detalhamento dos Modais e Campos

### A. Modal de Autorização / Geração de OS
Acionado pelas ações **Gerar OS** (Status 1) e **Autorizar** (Status 2).
- **Equipe (Dropdown)**: Seleção obrigatória da equipe executora.
- **Líder (Exibição)**: Mostra o líder vinculado à equipe selecionada.
- **Plano (Dropdown)**: Seleção de plano de execução (Fonte: `v_orders_plans`).

### B. Modal de Agendamento / Reagendamento
Acionado por **Agendar** (Status 3) e **Reagendar** (Status 4).
- **Data/Hora**: Seleção obrigatória do momento da execução.

### C. Modal de Cancelamento
Acionado por **Cancelar** (Status 1, 2, 3 e 4).
- **Motivo (Dropdown)**: Seleção obrigatória (Fonte: `v_orders_cancel_reasons`).
- **Lógica de Persistência**: Ao confirmar, atualizar os seguintes campos na tabela `orders`:
  - `status_id`: Definir como **7**.
  - `status_at`: Time Now (America/Sao_Paulo).
  - `canceled_user_id`: ID do usuário logado.
  - `canceled_team_id`: Team ID do usuário logado.
  - `canceled_at`: Time Now (America/Sao_Paulo).
  - `cancel_reason_id`: ID selecionado no modal.

---

## 4. Definições Técnicas
- **Timezone**: Todas as datas devem seguir "America/Sao_Paulo".
- **Botão Principal**: O menu de 3 pontos deve exibir as ações de forma clara, priorizando a ação principal se houver apenas uma viável.

---
*Documento gerado em 30/01/2026 para referência técnica de implementação.*
