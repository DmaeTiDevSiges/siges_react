# Filtro de Equipes no Card de Líderes (Avatar da Empresa)

**Data:** 15/10/2026
**Tela:** `OrdersRequestsDashboardAdmin` (dashboard de Ordens de Serviço — aba OS)
**Status:** Implementado

## 1. Objetivo

Permitir que, no card de Empresas/Líderes do dashboard de OS, o usuário clique no
**avatar da empresa** e selecione quais **equipes com líderes** devem ser exibidas
naquele card — usando um **modal idêntico** ao do filtro **EQ.RESPONSAVEL** da barra
de filtros (árvore com busca, checkboxes e Cancelar/Confirmar).

Exibir um **badge** no avatar da empresa com a **quantidade de equipes selecionadas**
sempre que houver filtro ativo.

## 2. Regras de negócio (aprovadas)

| Regra | Comportamento |
|---|---|
| Escopo da seleção | **Por empresa** — cada avatar tem seu próprio conjunto de equipes selecionadas |
| Estado inicial | **Todas as equipes** visíveis (padrão "Todos", como no filtro EQ.RESPONSAVEL) |
| Badge | Exibido **somente quando há seleção explícita** (`> 0` equipes); mostra a contagem |
| Líder sem equipe (`teamId` vazio) | **Sempre visível**, não é afetado pelo filtro |
| Confirmar com 0 equipes | Limpa a seleção da empresa (volta a exibir todas, badge some) |
| Persistência | **localStorage** na chave `leaderCardTeamSelections` (mesmo padrão dos filtros avançados) |
| Efeito | **Somente visual do card** — não altera queries/estatísticas do dashboard |

### Semântica da seleção

```ts
leaderTeamSelections: Record<string /* companyId */, string[] /* teamIds */>
```

- **Sem entrada** para a empresa (ou array vazio) → todas as equipes visíveis, sem badge.
- **Array com N ids** → só líderes dessas equipes (mais líderes sem `teamId`), badge = N.

## 3. Alterações de código

### 3.1 `components/ui/TreeFilterModal.tsx` (novo)

Modal de árvore **reutilizável**, extraído do `TreeFilterSelect`:

- `buildTree`, busca, checkboxes em árvore (seleciona pai ⇒ seleciona descendentes),
  botões Cancelar / Confirmar(N) — exatamente o comportamento do EQ.RESPONSAVEL.
- Props: `isOpen`, `onClose`, `label`, `title?`, `options: TreeFilterOption[]`,
  `value: string[]`, `onConfirm(values: string[])`.
- Ao abrir (`isOpen` → true) reseta busca, rascunho (`tempValue = value`) e expansão.

### 3.2 `components/ui/TreeFilterSelect.tsx` (refatorado)

Passa a **compor** `TreeFilterModal`; o trigger (chips EQ.RESPONSAVEL / EQ.SOLICITANTE)
e a API pública permanecem **inalterados** — zero regressão nos filtros existentes
(`FilterBarResponsive`, `DashboardUnitsPowerElectric`, `DashboardOrdersAdminCalendarScreen`).

### 3.3 `views/OrderRequest/OrdersRequestsDashboardAdmin.tsx`

- **Estado:** `leaderTeamSelections` (lazy-load do localStorage + persistência),
  `teamsModalCompanyId` (empresa com modal aberto), `allTeamsCache` (cache opcional).
- **Memo `leadersByCompany`:**
  - `activeLeaders` (líderes por contrato/empresa) alimentam `group.allLeaders`
    (base estável para as opções do modal — não muda com disponibilidade);
  - `group.leaders` (disponíveis/em visita) passa a ser filtrado pela seleção de equipes;
  - líderes sem `teamId` sempre permanecem.
- **Opções do modal (`leaderTeamsModalOptions`):** equipes cujo `id` é `teamId` de algum
  `allLeaders` do grupo, com nome/`parentId` resolvidos via `filterOptions.teams`.
  Se alguma equipe do líder não estiver na lista (carga limitada ao departamento do
  usuário), busca `dataService.getTeams()` (lista completa) **uma única vez** em efeito
  lazy, cacheada em `allTeamsCache`.
- **Avatar da empresa** (`:≈1390`) agora é um `<button>`:
  - clique (com `stopPropagation`; protegido contra arraste pelo `onClickCapture` do
    scroll horizontal) → `setTeamsModalCompanyId(group.companyId)`;
  - badge `absolute -top-1 -right-1` no avatar com a contagem quando `> 0`;
  - hover com leve escala no logo (`group-hover/empresa:scale-105`).
- **Modal:** um único `TreeFilterModal` renderizado após a linha do card
  (portal do `Modal`), com título `Filtrar equipes — {empresa}`.
  Confirmar grava/remove a entrada no estado (→ localStorage); Cancelar só fecha.

## 4. Fluxo do usuário

1. Dashboard de OS → card de Empresas/Líderes.
2. Clique no avatar da empresa → modal "Filtrar equipes — {empresa}" com as equipes
   daquela empresa que têm líderes (árvore, busca, multi-seleção).
3. Confirmar → card mostra só os líderes das equipes selecionadas; badge com a contagem
   aparece sobre o avatar.
4. Reabrir e desmarcar tudo + Confirmar (ou Confirmar com 0) → limpa o filtro da empresa.
5. A seleção persiste após recarregar a página (localStorage).

## 5. Chave localStorage

| Chave | Conteúdo |
|---|---|
| `leaderCardTeamSelections` | `{ [companyId]: string[] /* teamIds */ }` |

## 6. Performance do modal (ajuste pós-implementação)

O primeiro ajuste apresentava lentidão ao marcar/desmarcar equipes. Causas e correções:

1. **Re-render da árvore inteira a cada clique** → linhas extraídas para
   `TreeFilterRow` (`React.memo`) com props primitivas (`selected`, `expanded`,
   `childCount`) e callbacks estáveis; as linhas visíveis são achatadas em memo
   (`visibleRows`). Agora só as linhas afetadas re-renderizam.
2. **Reset indevido do rascunho** → o efeito de reset (seleção/busca/expansão) rodava
   a cada mudança de identidade de `value`/`options` (o dashboard passava um array
   novo a cada render, e a carga assíncrona de equipes completas trocava `options`
   com o modal aberto). Agora o reset ocorre **apenas na transição fechado → aberto**
   (`wasOpenRef`), e o dashboard usa a referência estável `NO_TEAM_SELECTION`.

## 7. Validação

- `npx tsc --noEmit` — sem erros novos.
- `npm test` — suíte existente (Jest, `*.test.ts`) sem regressões.
- Teste manual: abrir modal a partir do avatar; confirmar seleção; verificar badge,
  filtragem e persistência; confirmar que EQ.RESPONSAVEL/EQ.SOLICITANTE continuam
  idênticos (refatoração de composição).
