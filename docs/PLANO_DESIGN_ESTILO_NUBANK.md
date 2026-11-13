# Plano — Redesign visual do SIGES inspirado no app Nubank

> Criado em 13/11/2026. Branch `redesign-nubank`.
>
> **Status 13/11/2026:** chave beta ✅ · F0 ✅ · F1 ✅ (kit em `views/Dev/DesignKitScreen.tsx`, aberto pelo ícone (só em `npm run dev`)
> de paleta no Perfil) · **Piloto em produção desde 13/11** (flag ligada no `.env.production`, chave desligada por padrão) · F2 ✅ (topo "hero"; BottomNav só via CSS) · F3 ✅ (home de cards no `DashboardScreen`:
> visita em andamento, Hoje, Serviços, Visitas, Abastecimentos; tocar abre a lista atual filtrada, "‹ Início"
> e voltar do Android retornam) · F4–F6 ⏳.
> D1: mantido o azul SIGES, ajustado para contraste AA — claro `#1a6fd1`, escuro `#3b93f0` com texto escuro;
> topo usa token `hero`. Chave fica no **Perfil** (Configurações é só admin).

## 1. Objetivo

Levar o SIGES para a linguagem visual que o Nubank popularizou: **limpo, plano, muito espaço em
branco, uma cor de marca forte, hierarquia por tipografia (e não por bordas/caixas), ações em
atalhos redondos e fluxos em bottom sheet / uma pergunta por tela**.

**Inspirado, não cópia.** Copiamos os *padrões de interação e composição*, não a marca. O roxo
`#820AD1` e a fonte proprietária (Graphik) são identidade do Nubank — não usar. A cor de marca
continua sendo do SIGES (ver decisão D1).

## 2. Diagnóstico do estado atual

| Item | Situação hoje | Arquivo |
|---|---|---|
| Tokens | Só 7 cores em `@theme` (`primary #137fec`, backgrounds, surfaces) | [index.css](../index.css), [tailwind.config.js](../tailwind.config.js) |
| Guia de design | `MASTER.md` gerado automaticamente, desatualizado (Poppins/Open Sans, landing page) e **não reflete o app** | [design-system/siges/MASTER.md](../design-system/siges/MASTER.md) |
| Fonte | Inter (Google Fonts) | [index.html](../index.html) |
| Ícones | Material Symbols (1.245 usos) + react-icons (25) | — |
| Cores fixas nos componentes | `text-slate-*` 4.679 · `bg-slate-*` 2.178 · `bg-white` 746 · `bg/text-blue-*` 446 · hex literais 632 · `dark:` 5.962 | 398 arquivos `.tsx` |
| Rótulos | `uppercase tracking-*` em 909 lugares (visual "corporativo", oposto ao Nubank) | — |
| Raios | 164 `rounded-[Npx]` arbitrários (12, 16…) | — |
| Componentes base | `Card`, `Button`, `BottomSheet`, `Modal`, `PageHeader`, `Input` existem em `components/ui` | [components/ui/](../components/ui/) |

**Conclusão:** o maior custo não é desenhar, é a **dispersão de cores fixas**. Por isso o plano
começa por tokens semânticos — trocar `primary` sozinho já recolore ~1.150 usos de uma vez, mas
`slate`/`white`/`blue` precisam de varredura.

## 3. Princípios do estilo (o que caracteriza o "jeito Nubank")

1. **Uma cor de marca dominante**, usada no topo da home e em ações primárias; o resto é neutro.
2. **Superfícies planas**: sem bordas, sem sombras (ou sombra quase invisível). Separação por
   espaço e por divisórias finas em listas.
3. **Tipografia faz a hierarquia**: títulos grandes e pesados (24–28px), valores em destaque,
   texto secundário cinza. **Sentence case** — nada de MAIÚSCULAS com tracking.
4. **Atalhos circulares** em carrossel horizontal (ícone dentro de círculo cinza claro + legenda abaixo).
5. **Listas "linha + chevron"**: ícone à esquerda, título + subtítulo, `›` à direita, linha inteira clicável.
6. **Cards de seção** na home: título, valor principal, linha de apoio, chevron — tudo clicável.
7. **Botões em pílula** (`rounded-full`), altura 48–56px, primário cheio na cor da marca.
8. **Fluxos guiados**: uma pergunta por tela, input grande sem caixa (sublinhado), botão
   flutuante redondo "→" para avançar; confirmações em bottom sheet.
9. **Ocultar valores** (ícone de olho) — útil para custos/valores em dashboards.
10. **Movimento sutil**: transições 150–250ms, press com leve escala, haptics em ações.

## 4. Decisões a tomar antes de começar

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| D1 | Cor de marca | (a) manter azul SIGES `#137fec` · (b) definir nova cor própria (ex.: azul-petróleo, verde técnico) · (c) roxo | **(a) ou (b)**. Evitar roxo: confunde com o Nubank e o `MASTER.md` já veta gradientes roxos |
| D2 | Fonte | Inter (atual) · Manrope · DM Sans | **Manter Inter**, mas usar pesos 600/700 nos títulos e tamanhos maiores. Trocar fonte é custo sem ganho grande |
| D3 | Abrangência | só mobile (Capacitor) · mobile + desktop | Mobile primeiro; desktop herda tokens, layout ajustado depois |
| D4 | Rollout | big-bang · por fases com feature flag | **Por fases**, tokens retrocompatíveis (o app nunca fica "meio quebrado") |
| D5 | Ícones | Material Symbols (manter) · migrar para Lucide | **Manter Material Symbols** em estilo *Rounded*, peso 400, sem fill — muito mais barato |

## 5. Fases

### F0 — Tokens semânticos (fundação) · ~1–2 dias

Criar camada de tokens em [index.css](../index.css) com variáveis CSS trocadas por `.dark`:

```css
@theme {
  /* marca */
  --color-brand:        var(--brand);
  --color-brand-strong: var(--brand-strong);   /* pressed */
  --color-brand-soft:   var(--brand-soft);     /* fundo de chip/ícone */
  --color-on-brand:     var(--on-brand);

  /* neutros semânticos */
  --color-bg:        var(--bg);          /* fundo da página */
  --color-surface:   var(--surface);     /* cards, sheets */
  --color-surface-2: var(--surface-2);   /* círculo de atalho, input */
  --color-line:      var(--line);        /* divisórias */
  --color-fg:        var(--fg);          /* texto principal */
  --color-fg-muted:  var(--fg-muted);    /* texto secundário */
  --color-fg-subtle: var(--fg-subtle);   /* placeholder, desabilitado */

  /* status */
  --color-success: …; --color-warning: …; --color-danger: …; --color-info: …;

  /* forma */
  --radius-card: 20px; --radius-sheet: 24px; --radius-pill: 9999px;
}
:root  { --bg:#FFFFFF; --surface:#FFFFFF; --surface-2:#F0F1F5; --line:#EEEEF2; --fg:#111111; --fg-muted:#6B6B76; … }
.dark  { --bg:#0E0E10; --surface:#18181B; --surface-2:#232328; --line:#26262B; --fg:#F4F4F5; --fg-muted:#A1A1AA; … }
```

- Manter `primary`, `background-light`, `surface-dark` etc. como **aliases** dos novos tokens
  (retrocompatível; nada quebra).
- Escala tipográfica: `display 28/700`, `title 22/700`, `headline 18/600`, `body 16/400`,
  `label 14/500`, `caption 12/400`.
- Reescrever `design-system/siges/MASTER.md` com estes tokens e princípios (substitui o gerado).

**Pronto quando:** o app roda igual, mas existem `bg-surface`, `text-fg-muted`, `bg-brand` etc.

### F1 — Kit de componentes no estilo · ~3–4 dias

Em `components/ui/` (ajustar os existentes, criar os novos):

| Componente | Mudança |
|---|---|
| `Button` | pílula (`rounded-full`), `h-12`/`h-14`, variantes `primary` (brand cheio), `secondary` (`surface-2`), `ghost`, `danger`; remover `shadow-lg shadow-primary/20` |
| `Card` | sem borda, sem sombra, `rounded-card`, padding 20px; prop `onClick` adiciona chevron e estado pressed |
| **`ShortcutButton`** (novo) | círculo 64px `bg-surface-2` + ícone 24px + legenda 12px; `ShortcutRail` com scroll horizontal snap |
| **`ListRow`** (novo) | ícone (círculo `brand-soft`) · título/subtítulo · valor/badge · chevron; divisória `line` entre linhas |
| **`SectionCard`** (novo) | título 18/600 + valor grande + linha de apoio + chevron (o "card de Conta/Cartão") |
| **`HiddenValue`** (novo) | mostra `••••` quando o contexto "ocultar valores" está ativo |
| `BottomSheet` | raio 24px no topo, alça, overlay escuro 40%; virar o padrão para confirmações e ações |
| `Input` | variante `underline` grande (para fluxos guiados) além da atual |
| **`StepFlow`** (novo) | uma pergunta por tela, barra de progresso fina, botão redondo "→" flutuante |
| `PageHeader` | título grande à esquerda, voltar como `‹` simples, sem borda inferior |
| Badges | chips `rounded-full` com fundo suave do status (sem MAIÚSCULAS) |
| `PDFButton` | **mantém vermelho** (regra do projeto), só adota forma pílula |

Criar uma tela interna `views/Dev/DesignKit` (só admin/dev) para ver todos os componentes nos
dois temas.

### F2 — Shell do app · ~2 dias

- **Header da home ("hero")**: bloco na cor da marca ocupando o topo, com avatar, saudação
  ("Olá, Eduardo"), ícones olho (ocultar valores), ajuda e notificações; sem título de tela.
  Telas internas usam header branco simples.
- Status bar Android na cor do hero (`@capacitor/status-bar`) e branca nas telas internas.
- **BottomNav** ([components/shell/BottomNav.tsx](../components/shell/BottomNav.tsx)): fundo `surface`,
  sem borda superior pesada, ícones Rounded, rótulos 11px em sentence case (sem `uppercase
  tracking-widest`), ativo = `brand` + ícone preenchido. Aproveitar e extrair a lista de abas
  ativas para um array (hoje as condições estão repetidas).
- `ConnectionStrip`/offline: faixa fina discreta abaixo do header, no estilo do app.

### F3 — Home "Meu Painel" · ~2–3 dias

Estrutura alvo (de cima para baixo):

1. Hero na cor da marca (saudação + status disponível/ocupado como chip).
2. **Rail de atalhos**: Nova SS, Minhas visitas, Escanear ativo, Almoxarifado, Programação do dia,
   Manuais… (filtrados por permissão, mesma lógica do BottomNav).
3. **SectionCard "Visita em andamento"** (se houver) — destaque com CTA.
4. **SectionCard "Hoje"**: n.º de visitas programadas, próxima visita, chevron.
5. **SectionCard "Ordens"**: abertas / atrasadas.
6. Cards de aviso (`appNotices`/`appTips`) como carrossel de cartões claros horizontais.
7. Gamificação como um `SectionCard` simples.

### F4 — Telas por domínio (varredura) · contínuo, ~1–2 semanas

Ordem por uso em campo:
1. Visitas (lista, detalhe, execução, relatório) → `ListRow` + `SectionCard`; checklist/execução em `StepFlow`.
2. Solicitações de serviço (abertura em `StepFlow`: unidade → ativo → problema → foto → confirmar).
3. Ordens, Ativos, Unidades.
4. Almoxarifado, Veículos, Ferramentas.
5. Dashboards de gestão e Configurações (por último; mais desktop).

Em cada tela: trocar `slate/white/blue/hex` → tokens, remover `uppercase tracking`, trocar
`rounded-[Npx]` por `rounded-card`/`rounded-pill`, bordas → espaço/divisórias.

### F5 — Dark mode, movimento e acabamento · ~2 dias

- Validar contraste 4.5:1 nos dois temas (tokens já resolvem a maior parte do `dark:`).
- Transições padrão (150–250ms), press `active:scale-[0.98]`, haptics leves (`@capacitor/haptics`)
  em confirmar/avançar.
- Skeletons no lugar de spinners nas listas.
- Splash ([SplashScreen.tsx](../components/shell/SplashScreen.tsx)) e ícone na cor da marca.

### F6 — Trava contra regressão · ~1 dia

- Script `scripts/check-design-tokens.js` (rodar no `lint`) que **conta** usos de `bg-slate-`,
  `text-slate-`, `bg-white`, `bg-blue-`, hex literais e `uppercase tracking` e falha se o número
  **subir** em relação a um baseline salvo — permite migrar aos poucos sem regredir.
- Registrar no `AGENTS.md`: "UI nova usa tokens semânticos e componentes de `components/ui`".

## 5.1 Reversibilidade — chave "Visual novo (beta)"

Tudo de F0 a F3 é feito de forma que **desligar a chave devolve o app exatamente ao visual
atual**, sem gerar APK novo. Só depois da aprovação o layout antigo é removido.

### Camadas de segurança

1. **Branch próprio** `redesign-nubank`; cada fase em commit(s) separado(s) →
   `git revert` por fase, ou descartar o branch inteiro.
2. **Feature flag de build** em [features.ts](../features.ts), no padrão das existentes:
   ```ts
   /** Para ativar: VITE_FEATURE_UI_V2=true — exibe a opção "Visual novo (beta)" */
   export const isUiV2Available = (): boolean =>
     import.meta.env.VITE_FEATURE_UI_V2 === 'true';
   ```
   Com a flag `false`, a opção nem aparece e ninguém vê nada novo.
3. **Preferência por usuário** (liga/desliga em Configurações), persistida igual ao tema
   ([App.tsx:829-870](../App.tsx#L829-L870)): `localStorage` `app_ui_version` + espelho no
   `Preferences` nativo (sobrevive à limpeza do WebView). Padrão: `v1` (visual atual).

### Como o visual alterna

- **Classe na raiz:** com `v2`, o app adiciona `ui-v2` em `<html>` (mesmo mecanismo do `dark`).
- **Tokens (F0):** os valores novos só valem dentro de `.ui-v2`; sem a classe, os tokens
  apontam para os valores atuais → visual idêntico ao de hoje.
  ```css
  :root            { --brand:#137fec; --bg:#f1f5f9; … }   /* = atual */
  :root.ui-v2      { --brand:<D1>;    --bg:#FFFFFF; … }   /* novo */
  :root.dark       { … }   :root.ui-v2.dark { … }
  ```
- **Componentes (F1):** `Button`, `Card`, `PageHeader`, `BottomSheet` leem o hook
  `useUiVersion()` (contexto em `contexts/UiVersionContext.tsx`) e escolhem o conjunto de
  classes v1 ou v2. Componentes **novos** (`ShortcutButton`, `ListRow`…) só são usados em
  telas v2.
- **Shell e home (F2/F3):** arquivos novos ao lado dos atuais — `HomeV2.tsx`, `HeroHeader.tsx`,
  `BottomNavV2.tsx` — e o `App.tsx`/`Layout.tsx` escolhe qual renderizar. Os arquivos antigos
  **não são editados** nessas fases.
- **StatusBar:** cor depende de `ui` + `theme` (hoje fixa `#101922` / `#ffffff`).

### Uso da chave

| Etapa | Flag de build | Quem vê |
|---|---|---|
| Desenvolvimento | `true` só no `.env` local | só você |
| Piloto | `true` no APK | quem ligar a opção em Configurações (beta) |
| Aprovado | — | v2 vira padrão; v1 removido na F6 (código antigo, aliases e o hook) |
| Reprovado | `false` no próximo APK, ou o usuário desliga | volta ao atual; branch descartado/revertido |

**Regra:** F4 (varredura tela a tela) **só começa depois da aprovação do piloto**. Ela é a fase
cara de reverter, por isso fica fora do período de teste.

## 6. Estimativa e ordem de entrega

| Fase | Esforço | Entregável visível |
|---|---|---|
| F0 | 1–2 d | nada muda (fundação) |
| F1 | 3–4 d | tela DesignKit |
| F2 | 2 d | shell novo em todo o app |
| F3 | 2–3 d | home nova — **maior impacto percebido** |
| F4 | 1–2 sem | telas migradas uma a uma |
| F5 | 2 d | polimento |
| F6 | 1 d | baseline + regra |

Sugestão: liberar um APK após **F0+F1+F2+F3** (≈ 2 semanas) com a chave "Visual novo (beta)"
(seção 5.1) para piloto; F4 só após aprovação, em releases incrementais. A chave acrescenta
~1 dia ao esforço de F0–F3 (contexto, persistência e versões paralelas do shell/home).

## 7. Riscos

- **Volume de classes fixas** (~9 mil ocorrências de slate/white/blue): mitigado por aliases em
  F0 e pela trava de baseline em F6; não tentar substituição automática em massa via sed.
- **Telas de campo com luz forte**: estilo muito claro/cinza pode perder contraste ao sol —
  manter `fg` quase preto e `fg-muted` não mais claro que `#6B6B76`.
- **Desktop/Electron**: padrões mobile (rail, hero) precisam de breakpoint `md:` próprio.
- **PDFs (`@react-pdf`)** não usam Tailwind — ficam fora deste plano.
