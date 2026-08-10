# Task: User Management and Profiles for Contracts

O objetivo desta tarefa é permitir que os usuários gerenciem gestores de contratos com dois perfis: **VIEWER** e **MANAGER**. Além disso, garantiremos que um usuário não possa ser associado mais de uma vez ao mesmo contrato.

## 1. Database Schema Verification
- [x] A tabela `contracts_managers` já possui a coluna `role`.
- [x] O `dataService.ts` já possui métodos para `getContractManagers`, `addContractManager` e `removeContractManager`.
- [x] O método `addContractManager` já aceita um terceiro argumento `role` (default 'viewer') e já trata a prevenção de duplicatas (atualizando o registro se já existir).

## 2. UI Updates (ContractDetails.tsx)
- [ ] **Seleção de Perfil na Adição**: No resultado da busca de usuários para adicionar, substituir o botão genérico de "Adicionar" por dois botões ou uma forma de selecionar entre "VIEWER" e "MANAGER".
- [ ] **Alteração de Perfil de Usuários Vinculados**: Permitir que o usuário mude o perfil de um gestor já associado diretamente na lista de membros.
- [ ] **Aesthetics**: Seguir o padrão de design atual com cores harmoniosas e ícones consistentes.

## 3. Implementation Details

### views/Contracts/ContractDetails.tsx
- Atualizar `handleAddManager` para receber `role`.
- No mapeamento da `filteredUsers` (Busca), exibir dois botões de ação:
  - Botão "VIEWER" (ícone: `visibility`)
  - Botão "MANAGER" (ícone: `manage_accounts`)
- Na lista de gestores atuais (`managers.map`):
  - Permitir a troca de papel clicando no crachá de papel.

### services/dataService.ts
- Revisar `addContractManager` para garantir que o `role` 'viewer' ou 'manager' seja salvo corretamente como string minúscula (conforme usado no `getManagedContracts`).

## 4. Verification
- Testar a adição de um usuário como VIEWER.
- Testar a alteração do mesmo usuário para MANAGER (deve atualizar o registro, não duplicar).
- Testar a exclusão e posterior re-adição (deve restaurar o registro).
