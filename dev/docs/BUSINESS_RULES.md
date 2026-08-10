# Regras de Negócio e Padrões de Layout - SIGES

Este documento centraliza as definições de regras de negócio, padrões de interface e comportamentos esperados do sistema SIGES para garantir consistência em todo o desenvolvimento.

## 1. Padrões de Cores e Status

### Disponibilidade de Usuários
*   **Disponível**: Amarelo (users.isAvailable = true e users.ovIdInProgress = 0).
*   **Indisponível**: Cinza (users.isAvailable = false e users.ovIdInProgress = 0).
*   **Em Atividade**: Verde (users.isAvailable = true e users.ovIdInProgress > 0).

### Status Badge (Componente UI)
*   **Active**: Verde (users.isAvailable = true e users.ovIdInProgress > 0).
*   **Inactive / Error**: Cinza (users.isAvailable = false e users.ovIdInProgress = 0).
*   **Pending / Warning**: Amarelo (users.isAvailable = true e users.ovIdInProgress = 0).

## 2. Navegação e Layout

### Estrutura Geral
*   **Menu Lateral (Sidebar)**: Removido do aplicativo principal. A navegação primária deve ser feita através da barra inferior (BottomNav).
*   **Bottom Navigation**: Deve ser visível nas telas principais de fluxo operacional:
    *   Painel (Dashboard)
    *   Unidades (Lista, Pesquisa e Detalhes)
    *   Contratos
    *   Perfil
    *   Ajustes (para Super Admins)
*   **Cabeçalho (Header)**:
    *   Botão "Voltar": Deve ser omitido nas telas de nível superior que possuem acesso direto via BottomNav (ex: Painel, Unidades, Perfil, Ajustes). Deve aparecer apenas em sub-telas (fluxos profundos).
    *   Botão Menu: Opcional, usado apenas onde especificamente necessário.
    *   Avatar do Usuário: Exibido no topo, com indicador de disponibilidade.

## 3. Entidades de Negócio

### Usuário
*   **Disponibilidade**: Controlada por flag manual (`isAvailable`). Refletida visualmente por um indicador (bolinha) no avatar.
*   **Hierarquia**: Super Admin, Admin de Empresa, Líder de Equipe, Usuário Padrão.

### Unidades
*   **Listagem**: Cards devem exibir informações hierárquicas (Sistema, Subsistema) alinhadas à esquerda.
*   **Detalhes**: Deve permitir ações rápidas e visualização clara de endereço e status.

## 4. Design System (Diretrizes)
*   **Estilo**: "Dark Premium" como alvo estético para modo escuro.
*   **Tipografia**: Fontes modernas, pesos de fonte contrastantes para hierarquia (ex: Títulos em negrito, rótulos uppercase em texto menor e cor suave).
*   **Componentes**:
    *   Cards com bordas arredondadas (`rounded-xl` ou `rounded-2xl`).
    *   Sombras suaves para profundidade.
    *   Inputs e Selects com validação visual.


### Pesquisa de Unidades
*   **Filtros**: Deve permitir a busca de unidades por nome, endereço e status.
*   **Ordenação**: Deve permitir a ordenação de unidades por nome.
*   **Paginação**: Infinit scroll

### Barra de Navegação
*   **Visibilidade**: visivel em todas as telas.

---
*Este documento deve ser atualizado conforme novas regras de negócio forem definidas.*