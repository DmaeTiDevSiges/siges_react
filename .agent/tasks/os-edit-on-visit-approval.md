# Implementação de Edição de OS no Fluxo de Aprovação de Visita

Este plano detalha as alterações necessárias para abrir um formulário de edição da OS antes de efetivar a aprovação de uma visita, permitindo correções rápidas por parte do supervisor/usuário.

## Status da Tarefa
- [ ] Fase 1: Atualização do DataService (Adicionar `updateOrder`)
- [ ] Fase 2: Adaptação do `OrderRequestForm` para suportar Edição
- [ ] Fase 3: Implementação do Modal de Edição na `OrderVisitPage`
- [ ] Fase 4: Integração do Fluxo de Aprovação após Edição
- [ ] Fase 5: Verificação e Testes

## Detalhes Técnicos

### 1. DataService
- Implementar `updateOrder(id, data)` para atualizar os campos da tabela `orders`.
- Garantir que a troca de contrato também atualize as informações de provedor.

### 2. UI/UX (OrderRequestForm)
- Se `initialData.id` estiver presente e não houver `parentId` indicando uma nova OS filha, o formulário deve operar em modo de edição.
- O botão final mudará de "Criar" para "Salvar Alterações" (ou similar).

### 3. Fluxo de Visita
- Ao clicar em "Aprovar Visita", um estado `isEditingOS` será ativado.
- O `OrderRequestForm` será renderizado em um modal ou seção sobreposta.
- Após o `onSubmit` de sucesso da OS, chama-se o método de aprovação da visita existente.

## Verificação
- [ ] Abrir uma visita pendente de aprovação.
- [ ] Clicar em "Aprovar Visita".
- [ ] Verificar se o formulário de OS abre com os dados atuais.
- [ ] Alterar um campo (ex: Tipo de OS) e salvar.
- [ ] Confirmar se a OS foi atualizada e a visita foi aprovada (processingId = 5).
