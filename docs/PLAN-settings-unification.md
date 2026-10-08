# PLAN: Settings — Análise, Melhorias e Unificação de Processos

> **Slug**: `settings-unification`
> **Data**: 2026-10-06
> **Agente responsável**: `project-planner` + `frontend-specialist`
> **Prioridade**: Alta

---

## 🔍 Diagnóstico Atual

### Mapa do Fluxo de Settings

```
Tab "Ajustes" (sidebar)
  └── AppSettings (views/Settings/AppSettings.tsx)       ← Hub principal
        ├── [Super Admin] Unidades
        │     ├── Situações → (onClick vazio, NÃO IMPLEMENTADO)
        │     ├── Sistemas / Sub-sistemas → 'systems'
        │     ├── Tipos / Sub-tipos → 'unit-types'
        │     ├── Setores → 'asset-tags'
        │     └── Posições → 'asset-tag-subs'
        ├── [Super Admin] Ordens de Serviço
        │     ├── Atividades → 'activities'
        │     ├── Prioridades → 'priorities'
        │     ├── Tipos de OS → 'order-types'
        │     ├── Sub-Tipos de OS → 'order-sub-types'
        │     ├── Planos → 'order-plans'
        │     └── Objetos → 'order-objects'
        ├── [Super Admin] Clientes → 'clients'
        ├── [Super Admin] Empresas → 'companies'
        ├── [Super Admin] Ativos
        │     ├── Tipos → 'asset-types'
        │     ├── Situações → 'asset-statuses'
        │     ├── Prioridades → 'asset-priorities'
        │     ├── Dados Técnicos → 'asset-type-attributes'
        │     ├── Marcas e Modelos → 'asset-attributes-brands'
        │     ├── Empréstimos: Itens Checklist → 'loans-checklists'
        │     └── Empréstimos: Checklists p/ Tipo → 'asset-loan-checklist-types'
        ├── [Super Admin] Contratos
        │     ├── Serviços → 'services'
        │     ├── Materiais → 'materials'
        │     └── Requisitos para Avaliações → 'evaluation-requirements'
        ├── [Todos] Acesso e Segurança
        │     ├── Usuários → 'all-users'
        │     ├── [canView] Permissões de Acesso → 'profile-permissions'
        │     └── [Super Admin] Gerenciar Rotas → 'route-management'
        ├── [Super Admin] Aplicativo
        │     └── Dicas → 'app-tips'
        └── [Super Admin] Inteligência Artificial
              └── Governança AI → 'ai-admin'
```

---

## Problemas Identificados

### Problema 1 — Duplicidade Estrutural: views/Admin/ vs views/Settings/

Arquivos relacionados a settings estão espalhados em duas pastas distintas:

| Arquivo | Pasta Atual | Deveria Estar |
|---------|-------------|---------------|
| AllUsersList.tsx | views/Admin/ | views/Settings/Users/ |
| ProfilePermissionsScreen.tsx | views/Admin/ | views/Settings/Users/ |
| UserViewScreen.tsx | views/Admin/ | views/Settings/Users/ |
| RouteManagement.tsx | views/Settings/ (raiz) | views/Settings/Security/ |
| RouteForm.tsx | views/Settings/ (raiz) | views/Settings/Security/ |
| AIKnowledgeAdmin.tsx | views/Settings/ (raiz) | views/Settings/AI/ |

### Problema 2 — Componentes Repetitivos Sem Abstração (CRÍTICO)

Pelo menos 10+ pares de List/Form com estrutura quase idêntica:

- SystemsList.tsx é ~90% igual a UnitTypesList.tsx
- SystemForm.tsx é ~85% igual a UnitTypeForm.tsx
- PrioritiesList.tsx é ~80% igual a OrderTypesList.tsx e AssetPrioritiesList.tsx

Padrão repetido em cada arquivo: useState search/loading/visibleCount,
useEffect para fetch, buildTree() nas listas hierárquicas,
sempre os mesmos componentes LoadMore/SearchInput/StatusBadge.

### Problema 3 — Botão "Situações" sem implementação (BUG)

AppSettings.tsx linha 30: onClick={() => { }} // vazio
O item "Situações" em Unidades aparece para o usuário mas não faz nada.

### Problema 4 — Gerenciamento de Estado em App.tsx (DÍVIDA TÉCNICA)

O App.tsx tem ~3568 linhas com 30+ casos setCurrentScreen('settings') espalhados.
Cada sub-tela de settings cria um case separado no switch gigante, sem encapsulamento.

### Problema 5 — AllUsersList acessível via dois caminhos

- Via sidebar → Tab "companies" → all-users
- Via sidebar → Tab "settings" → "Usuários"

### Problema 6 — companies acessível via dois caminhos

- Via sidebar diretamente como tab separada
- Via settings → "Empresas"

---

## Objetivo do Plano

1. Unificar toda a área de admin/config em views/Settings/
2. Criar abstração genérica para o padrão CRUD repetitivo
3. Encapsular o roteamento de settings em um sub-roteador
4. Implementar ou remover o item "Situações" sem implementação
5. Reorganizar pastas eliminando views/Admin/

---

## Fases de Implementação

### Fase 0 — Análise Completa (Pré-requisito)

- [x] F0.1 — Listar todos os imports de views/Admin/ em App.tsx e outros arquivos
- [x] F0.2 — Confirmar se UserViewScreen.tsx é usado em settings ou fluxo de usuário
- [x] F0.3 — Investigar o item "Situações" de Unidades (removido botão vazio)
- [x] F0.4 — Classificar cada List/Form como flat ou hierárquico (tree)

Entregável: Mapa completo de dependências

---

### Fase 1 — Reorganização de Pastas (Sem Lógica)

Estrutura proposta:
```
views/Settings/
  Security/
    RouteManagement.tsx   (movido de Settings/ raiz)
    RouteForm.tsx         (movido de Settings/ raiz)
  Users/
    AllUsersList.tsx      (movido de Admin/)
    ProfilePermissionsScreen.tsx  (movido de Admin/)
    UserViewScreen.tsx    (movido de Admin/)
  AI/
    AIKnowledgeAdmin.tsx  (movido de Settings/ raiz)
```

- [x] F1.1 — Criar subpastas Security/, Users/, AI/
- [x] F1.2 — Mover arquivos conforme tabela acima
- [x] F1.3 — Atualizar todos os imports afetados (routes.tsx, App.tsx, etc.)
- [x] F1.4 — Remover views/Admin/ e arquivos legados duplicados
- [x] F1.5 — Validar que build Vite/TypeScript passa sem erros

Agente: frontend-specialist | Risco: Baixo

---

### Fase 2 — Componente Genérico SettingsCRUDList

Criar abstração reutilizável para eliminar duplicação.

- [x] F2.1 — Criar components/settings/SettingsCRUDList.tsx
- [ ] F2.2 — Criar components/settings/SettingsTreeList.tsx (futuro/opcional)
- [x] F2.3 — Migrar PrioritiesList e AssetPrioritiesList para SettingsCRUDList
- [x] F2.4 — Migrar OrderTypesList, OrderObjectsList, AssetStatusesList, ServicesList para SettingsCRUDList
- [ ] F2.5 — Migrar demais candidatos conforme demanda

Agente: frontend-specialist | Risco: Médio

---

### Fase 3 — Sub-roteador SettingsRouter

Extrair toda a lógica de navegação de settings do App.tsx.

- [x] F3.1 — Criar views/Settings/SettingsRouter.tsx
- [x] F3.2 — Mover todos os ~35 cases de settings do App.tsx para o router
- [x] F3.3 — Substituir o bloco em App.tsx por <SettingsRouter /> e limpar imports
- [x] F3.4 — Encapsular delegação via objeto `ctx`

Agente: frontend-specialist | Risco: Alto (mexe no App.tsx central)

---

### Fase 4 — Correção de Bugs e Features Pendentes

- [x] F4.1 — Implementar ou remover o botão "Situações" (Unidades) vazio (removido de AppSettings.tsx)
- [ ] F4.2 — Resolver duplicidade de acesso a companies (decisão de produto)

Agente: frontend-specialist | Risco: Baixo-médio

---

### Fase 5 — UX: Breadcrumb e Navegação de Settings

- [ ] F5.1 — Avaliar se BackButton + título é suficiente ou se precisa breadcrumb
- [ ] F5.2 — Garantir que "Voltar" em todas as sub-telas retorna para AppSettings
- [ ] F5.3 — Validar handleBack() para todos os cases de settings

Agente: frontend-specialist | Risco: Baixo

---

## Ordem de Execução Recomendada

F0 → F1 → F4.1 → F2 → F3 → F4.2 → F5

IMPORTANTE: Fases F1 e F3 NÃO devem ser executadas simultaneamente.
Confirmar que build passa após F1 antes de iniciar F3.

---

## Métricas de Sucesso

| Métrica | Antes | Meta |
|---------|-------|------|
| Linhas em App.tsx | ~3.568 | < 2.800 (−20%) |
| Cases de settings em App.tsx | ~30 | 1 (SettingsRouter) |
| Componentes duplicados (List) | ~10 pares | 1-2 genéricos |
| Pastas com arquivos de settings | 2 (Settings + Admin) | 1 (Settings) |
| Botões sem implementação | 1 | 0 |

---

## Dependências e Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Quebra de imports ao mover arquivos | Alta | Busca global + atualização em batch |
| Regressão em navegação do App.tsx | Média | Testar todos os caminhos após F3 |
| Abstração genérica incompatível com casos especiais | Média | Aplicar apenas para candidatos confirmados |
| Estado shared (selected* vars) ao extrair SettingsRouter | Alta | Passar via props, avaliar Context |

---

## Checklist de Verificação Final

- [ ] Build TypeScript sem erros (tsc --noEmit)
- [ ] Todos os itens de AppSettings.tsx navegam corretamente
- [ ] Botão "Voltar" em cada sub-tela retorna para Settings
- [ ] views/Admin/ removida ou esvaziada
- [ ] App.tsx com um único ponto de entrada para settings
- [ ] Componentes genéricos cobrem todos os casos-alvo
- [ ] Sem onClick vazio em menu de settings
