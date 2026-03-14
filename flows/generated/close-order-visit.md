# Order Visit Close

**Categoria:** ordersVisits  
**Versão:** 1.0.0  
**Descrição:** Fluxo para encerramento de uma Visita na Ordem de Serviço

**Autor:** Flow System  
**Data:** 2026-01-21  

---

## Contexto

Este fluxo é executado quando um usuário autenticado encerra uma Visita na Ordem de Serviço. O sistema coleta dados da sessão do usuário, dos dados enviados pelo formulário e de tabelas de configuração relacionadas, e então atualiza o registro da visita na tabela `orders_visits` seguindo regras de negócio previamente definidas.

## Passos do Fluxo

### 1. Acessar Tela Detalhes da Visita

**Ação:** 
- O usuário está autenticado
- O usuário acessa a tela de detalhes de uma Visita
- O acesso a localizacao do usuario deve estar habilitado
- O usuário clicar no botao Encerrar Visita
- Clicar no botao Encerrar Visita
- Sugir um modal de confirmacao para o usuario confirmar o encerramento da visita

### 2. Responder ao Modal de Confirmacao

**Ação:** 
- O usuário interage com o modal de confirmacao
- O usuário nao confirma o encerramento da visita
- O fluxo é cancelado
- O usuario retorna para a tela de detalhes da Visita

### 3. Encerrar Visita

**Ação:** 
- O usuário clica no botao Encerrar Visita para confirmar o encerramento da visita devendo abrir uma caixa de dialogo para confirmar.
- Verificar se existem veiculos associados a visita (orders_visits_vehicles)
- Se existir, verificar para todos os veiculos associados a visita se recorder_start < recorder_end:
- Se for verdadeiro, continuar
- Se for falso, abrir uma notificação informando que há registros de veiculos sem finalização
- Se nao existir veiculos associados a visita, continuar.
- Informar Situação da OS:
- Abrir modal para selecionar a Situacao da OS:
- Suspensa ou Concluida (botoes)
- Se Opçao escolhida for Suspensa:
- Obrigatoriamente informar o motivo da suspensao cfg_orders_suspended_reasons (dropdown)
- Obrigatoriamente informar o progresso da OS entre 1 a 99
- Se Opçao escolhida for Concluida:
- Considerar progresso da OS como 100%
- Clicar em Confirmar
- Tabela orders_visits (Atualizar o registro da Visita)
- ov_ended_at = user current_timestamp (sem time zone)
- ov_status_id = 2 (Encerrada)
- Se Suspensa:
- ov_o_status_id = 6 (Suspensa)
- ov_o_suspended_reason_id = modal
- ov_o_progress = modal / 100 (dividir por 100)
- Se Concluida:
- ov_o_status_id = 8 (Concluida)
- ov_o_progress = 1
- status_at = user current_timestamp (sem time zone)
- Tabela orders (Atualizar o registro da OS)
- status_id = Suspensa ou Concluida (Segundo o modal)
- status_at = ov_ended_at
- progress = modal / 100 (dividir por 100)
- Tabela users (realizar um loop em orders_visits_teams e atualizar os campos abaixo para users.id = orders_visits_teams.user_id)
- is_available = true
- ov_in_progress_leader_id = 0
- o_contract_id_in_progress = 0
- o_type_id_in_progress = 0
- o_type_sub_id_in_progress = 0
- o_plan_id_in_progress = 0
- o_asset_tag_id_in_progress = 0
- o_unit_id_in_progress = 0
- o_system_id_in_progress = 0
- o_system_parent_id_in_progress = 0
- o_unit_type_id_in_progress = 0
- o_unit_type_parent_id_in_progress = 0
- o_object_id_in_progress = 0
- ov_id_in_progress = 0
- o_id_in_progress = 0
- op_id_in_progress = 0
- is_ov_in_progress = false
- ov_id_in_progress_mask = null

### 4. Enviar Notificação para os seguidores da OS

**Ação:** 
- Realizar um loop em orders_followers onde orders_followers.o_id = orders_visits.o_id
- Inserir um registro na tabela users_notifications para cada orders_followers.user_id do loop
- user_id_to = orders_followers.user_id
- user_id_from = user.id do usuario logado
- title = "Visita encerrada."
- body = "{users.name_short} encerrou a visita:
- type = "Visita encerrada"
- user_to_whatsapp = users.mobile_whatsapp
- Todos os registors inseridos na tabela users_notifications

## Regras de Negócio

- Nenhum campo adicional pode ser inserido além dos definidos neste fluxo
- Todos os dados auxiliares devem ser resolvidos antes da inserção
- Inserções parciais não são permitidas
- Os campos tipo timestamp devem respeitar o fuso horário do Brasil (America/Sao_Paulo)

## Casos de Erro

- Algum dado obrigatório do usuário não puder ser resolvido
- Abortar a operação
- Não inserir ou alterar nenhum registro
- Exibir mensagem de erro

## Resultado Final

- Um registro é atualizado na tabela orders
- Um registro é atualizado na tabela orders_visits
- Um ou mais registros são atualizados na tabela orders_visits_vehicles
- Um ou mais registros são atualizados na tabela users
- Um ou mais registros são inseridos na tabela users_notifications
- A operação é concluída sem estados parciais

