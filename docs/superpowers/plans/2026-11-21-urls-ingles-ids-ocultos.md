# URLs em inglês e ids ocultos — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotas com parâmetro em inglês e, fora do localhost, ids fora da barra de endereço (guardados no `history.state`), mantendo F5 e voltar/avançar.

**Architecture:** `app/screenRoutes.ts` ganha, por rota, um caminho "oculto" (sem ids) e três funções novas: `toUrl` (o que aparece na barra), `fromLocation` (lê tela e ids do caminho **ou** do estado da entrada) e `showIdsInUrl` (decide o modo). `toPath` continua devolvendo o caminho completo com ids e passa a servir de **chave** da entrada no `useScreenHistory`, separada da URL exibida. O `App.tsx` só liga o modo.

**Tech Stack:** React 19, react-router v8 (`HashRouter`, `navigate(path, { state })`, `matchPath`/`generatePath`), Capacitor, Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-21-urls-ingles-ids-ocultos-design.md`

## Global Constraints

- Os nomes das rotas seguem exatamente a tabela "Rotas (antes → depois)" do spec, incluindo as colunas localhost e produção.
- Ids visíveis **somente** quando `hostname` ∈ {`localhost`, `127.0.0.1`} **e** `!Capacitor.isNativePlatform()`.
- Em modo oculto, um caminho com ids (digitado ou antigo) **nunca** abre o registro, e `applySelection` não é chamado.
- Os caminhos antigos em português não são aceitos em nenhum modo (sem apelidos).
- Imports relativos. Comentários e nomes de teste em português.
- Verificação antes de cada commit: `npx tsc --noEmit && npm test && npm run lint:eslint`.
- A árvore de trabalho tem muitas mudanças alheias: faça `git add` **só** dos arquivos da tarefa (nunca `git add -A`/`.`).

## Review Focus

1. **Trocar de registro na mesma tela em modo oculto** (`#/visit-asset` → `#/visit-asset`): tem de virar uma entrada nova, e o voltar traz o ativo anterior. É o caso que quebra se o hook comparar URL em vez de chave. (Teste na Tarefa 2.)
2. **F5 em modo oculto:** recarregar em `#/visit-asset` reabre o mesmo ativo a partir do `history.state`. (Teste na Tarefa 2.)
3. **URL digitada com id em produção** (`#/visit-asset/4364` ao carregar): cai no painel, sem `applySelection`. (Testes nas Tarefas 1 e 2.)
4. **Caminho oculto colado sem estado** (aba nova com `#/visit-asset`): cai no painel. (Testes nas Tarefas 1 e 2.)
5. **Estado de outra tela/rota no `history.state`** (o estado diz `asset-details`, mas o caminho é `/visit`): não pode abrir a tela errada; `fromLocation` exige que `toUrl(state)` bata com o caminho. (Teste na Tarefa 1.)

---

### Task 1: Rotas em inglês e modo oculto em `screenRoutes`

**Files:**
- Modify: `app/screenRoutes.ts` (tabela `ROUTES` e comentário do topo; novas funções)
- Test: `app/screenRoutes.test.tsx`

**Interfaces:**
- Produces:
  - `toPath(screen: string, selection?: Selection): string`: mesma regra de hoje, com padrões em inglês (ex.: `'/visit-asset/900'`). Sem os ids da rota, devolve `/<tela>`.
  - `fromPath(pathname: string): { screen: string; selection: Selection } | null`: inalterada, padrões em inglês.
  - `toUrl(screen: string, selection: Selection | undefined, showIds: boolean): string`: com `showIds` faz o mesmo que `toPath`. Sem `showIds`, se a tela tem rota e todos os ids, devolve o caminho oculto da tabela; senão, `/<tela>`.
  - `type EntryState = { screen?: string; selection?: Selection }`: formato gravado no `history.state` (exportado).
  - `fromLocation(pathname: string, state: unknown, showIds: boolean): { screen: string; selection: Selection } | null`. Com `showIds`, vale `fromPath(pathname)` e o estado é ignorado. Sem `showIds`, vale o estado `{ screen, selection }`, desde que `toUrl(screen, selection, false) === pathname` e a tela tenha rota com todos os ids; senão `null`. A `selection` devolvida contém **só** os ids da rota (`def.params`).
  - `showIdsInUrl(hostname?: string, isNative?: boolean): boolean`: padrões `window.location.hostname` e `Capacitor.isNativePlatform()`.

- [ ] **Step 1: Reescrever os testes de `toPath`/`fromPath` com os caminhos em inglês**

Troque cada caminho em português de `app/screenRoutes.test.tsx` pelo equivalente da tabela, mantendo os casos: `'/visit/12'`, `'/visit-asset/900'`, `'/visit-asset/900/materials'`, `'/visit-asset/900/activities/5'`, `'/visit/12/approve'`, `'/visit/12/evaluate'`, `'/company/3'`, `'/contract/4'`, `'/unit/5'`, `'/material/6'`, `'/manual/7'`, `'/order/77'`, `'/service-request/76'`, `'/asset/tmp:9'` e cliente, departamento e equipe (`'/client/…'`, `'/department/…'`, `'/team/…'`). No teste "não confunde caminhos parecidos", troque `'/visita'` por `'/visit'` e `'/visita/12/outra'` por `'/visit/12/outra'`, e acrescente:

```ts
it('caminhos antigos em português não são mais rotas', () => {
    expect(fromPath('/visita/12')).toBeNull();
    expect(fromPath('/visita-ativo/900')).toBeNull();
    expect(fromPath('/os/77')).toBeNull();
});
```

- [ ] **Step 2: Escrever os testes novos**

```ts
describe('toUrl', () => {
    it('com ids visíveis é igual a toPath', () => {
        expect(toUrl('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' }, true)).toBe('/visit-asset/900/activities/5');
    });
    it('oculto: caminho sem ids', () => {
        expect(toUrl('order-visit-asset-report', { ovaId: '900' }, false)).toBe('/visit-asset');
        expect(toUrl('order-visit-asset-materials', { ovaId: '900' }, false)).toBe('/visit-asset/materials');
        expect(toUrl('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' }, false)).toBe('/visit-asset/activities');
        expect(toUrl('order-visit-approve', { approvalVisitId: '12' }, false)).toBe('/visit/approve');
        expect(toUrl('order-visit-evaluation', { approvalVisitId: '12' }, false)).toBe('/visit/evaluate');
        expect(toUrl('order-visit-execute', { visitId: '12' }, false)).toBe('/visit');
        expect(toUrl('service-request-detail', { orderId: '76' }, false)).toBe('/service-request');
        expect(toUrl('asset-details', { assetId: 'tmp:9' }, false)).toBe('/asset');
    });
    it('oculto, sem os ids ou sem rota: /<tela>', () => {
        expect(toUrl('order-visit-execute', {}, false)).toBe('/order-visit-execute');
        expect(toUrl('dashboard', {}, false)).toBe('/dashboard');
    });
});

describe('fromLocation', () => {
    it('com ids visíveis lê do caminho e ignora o estado', () => {
        expect(fromLocation('/visit-asset/900', { screen: 'order-visit-asset-report', selection: { ovaId: '1' } }, true))
            .toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
    });
    it('oculto: lê do estado e devolve só os ids da rota', () => {
        expect(fromLocation('/visit-asset', { screen: 'order-visit-asset-report', selection: { ovaId: '900', orderId: '77' } }, false))
            .toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
    });
    it('oculto: caminho com id (digitado) não abre nada', () => {
        expect(fromLocation('/visit-asset/4364', null, false)).toBeNull();
        expect(fromLocation('/visit-asset/4364', { screen: 'order-visit-asset-report', selection: { ovaId: '900' } }, false)).toBeNull();
    });
    it('oculto: caminho sem estado (link colado) não abre nada', () => {
        expect(fromLocation('/visit-asset', null, false)).toBeNull();
        expect(fromLocation('/visit-asset', { screen: 'order-visit-asset-report' }, false)).toBeNull();
    });
    it('oculto: estado de outra tela não abre a tela errada', () => {
        expect(fromLocation('/visit', { screen: 'asset-details', selection: { assetId: '9' } }, false)).toBeNull();
    });
});

describe('showIdsInUrl', () => {
    it('só no localhost do navegador', () => {
        expect(showIdsInUrl('localhost', false)).toBe(true);
        expect(showIdsInUrl('127.0.0.1', false)).toBe(true);
        expect(showIdsInUrl('localhost', true)).toBe(false); // Android: https://localhost
        expect(showIdsInUrl('siges.exemplo.com.br', false)).toBe(false);
        expect(showIdsInUrl('', false)).toBe(false); // Electron empacotado (file://)
    });
});
```

Este arquivo `.tsx` roda em jsdom. Se o import de `@capacitor/core` falhar lá, faça o mock no topo como em `hooks/useScreenHistory.routes.test.tsx`: `jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest --config jest.config.cjs app/screenRoutes.test.tsx`
Esperado: FAIL (caminhos em português e `toUrl`/`fromLocation`/`showIdsInUrl` inexistentes).

- [ ] **Step 4: Implementar em `app/screenRoutes.ts`**

- Em `RouteDef`, acrescente `hidden: string` e preencha `pattern` e `hidden` conforme a tabela do spec (mantenha a ordem atual: mais específicas primeiro).
- Implemente `toUrl`, `fromLocation`, `showIdsInUrl` e exporte `EntryState` com as assinaturas das Interfaces. Em `fromLocation` oculto, procure o `def` pela `state.screen`.
- Atualize o comentário do topo: rotas em inglês, modo oculto fora do localhost, `toPath` = chave e `toUrl` = barra.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest --config jest.config.cjs app/screenRoutes.test.tsx`
Esperado: PASS.

- [ ] **Step 6: Commit**

`hooks/useScreenHistory.routes.test.tsx` ainda espera caminhos em português e vai falhar até a Tarefa 2. Por isso, nesta tarefa rode só `npx tsc --noEmit && npx jest --config jest.config.cjs app/screenRoutes.test.tsx && npm run lint:eslint`.

```bash
git add app/screenRoutes.ts app/screenRoutes.test.tsx
git commit -m "feat(rotas): caminhos em inglês e modo com ids ocultos em screenRoutes"
```

---

### Task 2: `useScreenHistory` com chave ≠ URL, e ligação no `App.tsx`

**Files:**
- Modify: `hooks/useScreenHistory.ts` (interface `Routing`, `EntryState` local, os três efeitos e o comentário do topo)
- Modify: `App.tsx:3460-3470` (bloco `routing:` do `useScreenHistory`)
- Modify: `docs/PLANO_MELHORIAS_FRONTEND.md` (linhas 27-33: rotas citadas em português → inglês, mais uma linha sobre o modo oculto)
- Test: `hooks/useScreenHistory.routes.test.tsx`

**Interfaces:**
- Consumes (Tarefa 1): `toPath`, `toUrl(screen, sel, showIds)`, `fromLocation(pathname, state, showIds)`, `showIdsInUrl()`, `EntryState`.
- Produces: nova `Routing<S>` do hook:
  ```ts
  interface Routing<S extends string> {
      /** Chave da entrada (sempre com ids): decide se é entrada nova. */
      toPath: (screen: S, selection: Selection) => string;
      /** O que vai na barra. Padrão: toPath. */
      toUrl?: (screen: S, selection: Selection) => string;
      /** Tela e ids da entrada atual (caminho e/ou history.state); null = não é rota com ids. */
      fromLocation: (pathname: string, state: unknown) => { screen: S; selection: Selection } | null;
  }
  ```
  `legacyRouting` passa a ter `fromLocation: () => null`.

**Regras do hook (o que muda):**
- Toda `navigate` grava `state: { screen, selection }` (a `selection` atual) e usa `toUrl` como caminho.
- `stack` guarda **chaves** (`toPath`). O teste "já estou nesta entrada" (`location.pathname === path`) passa a ser `stack.current[historyIdx()] === path`, e o "voltou para a anterior" compara chaves, como hoje.
- Na sincronização inicial e no POP, troque `routing.fromPath(location.pathname)` por `routing.fromLocation(location.pathname, location.state)`. A chave de quem vem de `fromLocation` é `toPath(linked.screen, linked.selection)`.
- `fromUrl` passa a guardar a **chave** adotada (é comparada com `path`, que é chave).
- Um POP sem `fromLocation` e sem `state.screen` mantém o comportamento atual (reflete a tela atual). Na carga inicial, um caminho não reconhecido cai em `homeScreen`, como hoje.

- [ ] **Step 1: Ajustar o harness e os testes atuais (modo visível)**

No `Harness`, aceite a prop `showIds = true` e passe `routing: { toPath: (s, x) => toPath(s, x), toUrl: (s, x) => toUrl(s, x, showIds), fromLocation: (p, st) => fromLocation(p, st, showIds) }`. Nos testes existentes, troque os hashes pelos equivalentes em inglês (`'#/visit/12'`, `'#/visit-asset/900'`, `'#/visit-asset/901'`, `'#/visit-asset/900/activities/5'`).

- [ ] **Step 2: Escrever os testes do modo oculto**

Em `describe('ids ocultos (fora do localhost)')`, cada teste renderiza `<HashRouter><Harness showIds={false} /></HashRouter>`:

- `'a URL não leva ids'`: abrir `order-visit-execute {visitId:'12'}` → `hash()` vira `'#/visit'`; abrir `order-visit-asset-report {ovaId:'900'}` → `'#/visit-asset'`.
- `'trocar de ativo na mesma tela vira nova entrada e voltar traz o anterior'`: abrir ativo `900` e depois `901`, `settle()`, `back()` → `now()` = `'order-visit-asset-report||900|'`, `applied.at(-1)` = `{ ovaId: '900' }` e `hash()` = `'#/visit-asset'`.
- `'recarregar (F5) reabre o mesmo ativo pelo estado do histórico'`: abrir `order-visit-asset-activities {ovaId:'900', orderTypeId:'5'}`, `settle()`, `unmount()` e renderizar de novo (o `window.history.state` continua) → `now()` = `'order-visit-asset-activities||900|5'` e `hash()` = `'#/visit-asset/activities'`.
- `'URL digitada com id não abre o registro'`: `window.history.replaceState(null, '', '#/visit-asset/4364')` antes do render → `now()` = `'dashboard|||'`, `hash()` = `'#/dashboard'`, `applied` vazio.
- `'caminho oculto colado sem estado cai no painel'`: igual ao anterior, com `'#/visit-asset'`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest --config jest.config.cjs hooks/useScreenHistory`
Esperado: FAIL (`toUrl`/`fromLocation` ainda não fazem parte de `Routing`; modo oculto sem efeito).

- [ ] **Step 4: Implementar no hook as regras acima**

- [ ] **Step 5: Ligar no `App.tsx`**

Importe `toUrl`, `fromLocation` e `showIdsInUrl` de `./app/screenRoutes`. Calcule `const SHOW_IDS_IN_URL = showIdsInUrl();` no topo do módulo. Em `routing:`, passe `toPath`, `toUrl: (s, sel) => toUrl(s, sel, SHOW_IDS_IN_URL)` e `fromLocation: (p, st) => { const r = fromLocation(p, st, SHOW_IDS_IN_URL); return r ? { screen: r.screen as Screen, selection: r.selection } : null; }`. Remova o import de `fromPath`, se ele ficar sem uso.

- [ ] **Step 6: Rodar e ver passar**

Run: `npx jest --config jest.config.cjs hooks/useScreenHistory app/screenRoutes`
Esperado: PASS, incluindo `hooks/useScreenHistory.test.tsx` (rotas legadas, sem alteração).

- [ ] **Step 7: Atualizar `docs/PLANO_MELHORIAS_FRONTEND.md`**

Nas linhas 27-33, troque as rotas por `#/visit/:visitId`, `#/visit-asset/...` etc. Acrescente uma linha: "Fora do localhost (e no app nativo) os ids saem da URL e vão no `history.state` (`toUrl`/`fromLocation`); link colado ou digitado com id cai no painel (21/11/2026)."

- [ ] **Step 8: Verificação completa e teste manual**

Run: `npx tsc --noEmit && npm test && npm run lint:eslint`
Esperado: tudo verde, sem erros de ESLint.

Teste manual:
- `npm run dev`, abrir `http://localhost:3000`, uma visita e um ativo. A barra mostra `#/visit-asset/<id>`; F5 reabre o ativo.
- Repetir por `http://<ip-da-máquina>:3000`: a barra mostra `#/visit-asset`; F5 reabre o mesmo ativo; colar `#/visit-asset/<outro-id>` numa aba nova cai no painel.

- [ ] **Step 9: Commit**

```bash
git add hooks/useScreenHistory.ts hooks/useScreenHistory.routes.test.tsx App.tsx docs/PLANO_MELHORIAS_FRONTEND.md
git commit -m "feat(rotas): ids fora da URL fora do localhost (history.state) e rotas em inglês"
```
