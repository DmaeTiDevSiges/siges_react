# Design System — SIGES

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, follow the rules below.

Fonte da verdade dos valores: [`index.css`](../../index.css) (`@theme` + overrides no fim do arquivo).
Plano do redesign: [`docs/PLANO_DESIGN_ESTILO_NUBANK.md`](../../docs/PLANO_DESIGN_ESTILO_NUBANK.md).

---

## Dois visuais em paralelo (beta)

| | Visual atual (v1) | Visual novo (v2) |
|---|---|---|
| Ativação | padrão | `VITE_FEATURE_UI_V2=true` + chave "Visual novo (beta)" no Perfil |
| Classe na raiz | — | `ui-v2` em `<html>` |
| Em código | `useUiVersion().isV2 === false` | `useUiVersion().isV2 === true` (`contexts/UiVersionContext.tsx`) |

Os tokens semânticos abaixo existem nos dois visuais, com valores diferentes. **UI nova deve usar
os tokens** — assim funciona nos dois sem `if`. Só use `isV2` quando a *estrutura* muda.

---

## Tokens de cor (Tailwind: `bg-*`, `text-*`, `border-*`)

| Token | Uso | v1 claro | v2 claro | v2 escuro |
|---|---|---|---|---|
| `brand` | ações primárias, links, ativo na nav | `#137fec` | `#1a6fd1` | `#3b93f0` |
| `brand-strong` | hover/pressed do primário | `#0e5eb0` | `#0e5eb0` | `#5aa5f5` |
| `brand-soft` | fundo de ícone/chip/destaque | `#e7f2fd` | `#e8f2fe` | `#142b45` |
| `on-brand` | texto sobre `brand` (no escuro é escuro!) | `#fff` | `#fff` | `#0e0e10` |
| `hero` / `on-hero` | topo da home | — | `#1a6fd1` / `#fff` | `#1a6fd1` / `#fff` |
| `bg` | fundo da página | `#f1f5f9` | `#f5f5f7` | `#0e0e10` |
| `surface` | cards, sheets, header | `#fff` | `#fff` | `#18181b` |
| `surface-2` | círculo de atalho, input, pressed | `#f1f5f9` | `#f0f1f5` | `#232328` |
| `line` | divisórias | `#e2e8f0` | `#ececf0` | `#26262b` |
| `fg` | texto principal | `#0f172a` | `#111114` | `#f4f4f5` |
| `fg-muted` | texto secundário | `#64748b` | `#6b6b76` | `#a1a1aa` |
| `fg-subtle` | placeholder, chevron, desabilitado | `#94a3b8` | `#a1a1aa` | `#71717a` |
| `success` / `warning` / `danger` / `info` (+ `-soft`) | status | — | — | — |

No v2, `primary`, `background-light`, `background-dark`, `card-dark` e toda a escala `slate-*`
são remapeados para a paleta neutra — telas antigas mudam de cor sem edição. A cor da marca
(decisão D1) é trocada **só** em `:root.ui-v2` / `:root.ui-v2.dark` no `index.css`.

## Tipografia (Inter)

| Classe | Tamanho / linha / peso | Uso |
|---|---|---|
| `text-display` | 28 / 34 / 700 | número de destaque |
| `text-title` | 22 / 28 / 700 | saudação, título de tela |
| `text-headline` | 18 / 24 / 600 | título de card/seção |
| `text-body` | 16 / 22 / 400 | texto, título de linha |
| `text-label` | 14 / 20 / 500 | rótulos, botões, subtítulos |
| `text-caption` | 12 / 16 / 400 | legendas de atalho, metadados |

**Sentence case.** Não usar `uppercase tracking-*` em UI nova (no v2 é neutralizado por CSS).
Não usar `font-black` (no v2 vira 700).

## Forma

| Token | Valor | Uso |
|---|---|---|
| `rounded-card` | 16px (v1) / 20px (v2) | cards |
| `rounded-sheet` | 24px | topo do bottom sheet |
| `rounded-full` | — | botões (v2), atalhos, chips |

Superfícies planas: sem borda e sem sombra em cards; separação por espaço e `divide-line`.

## Componentes (`components/ui`)

| Componente | Quando usar |
|---|---|
| `Button` | ações. v2 = pílula, sem sombra. Variantes `primary`, `secondary`, `ghost`, `dashed` |
| `Card` | container genérico. v2 = plano, `rounded-card` |
| `SectionCard` | card da home: título + valor + apoio + chevron, card inteiro clicável |
| `ListRow` | linha "ícone · título/subtítulo · valor · ›" — listas e menus |
| `ShortcutRail` / `ShortcutButton` | atalhos circulares em carrossel horizontal |
| `HiddenValue` | valores sensíveis (custos); somem com o "olho" do topo da home |
| `BottomSheet` | confirmações e ações secundárias (preferir a modal centralizada) |
| `PDFButton` | **todo** botão de PDF — continua vermelho |

Shell: `components/shell/HeroHeader.tsx` (topo da home no v2), `HomeShortcutsRail.tsx`.

## Regras

- ❌ Emojis como ícone — usar Material Symbols.
- ❌ Cores fixas (`bg-white`, `text-slate-*`, hex) em UI nova — usar tokens.
- ❌ Gradientes roxos / identidade de terceiros (roxo Nubank, Graphik).
- ✅ `cursor-pointer` e foco visível (`focus-visible:ring-2 ring-brand/40`) em clicáveis.
- ✅ Transições 150–250ms; press com `active:scale-[0.98]` (sem deslocar layout).
- ✅ Contraste mínimo 4.5:1 nos dois temas — o app é usado ao sol.
- ✅ Testar nos 4 modos: v1/v2 × claro/escuro.
