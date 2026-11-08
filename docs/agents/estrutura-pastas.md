> Movido do `AGENTS.md` em 08/11/2026, sem alteração. Resumo das regras no `AGENTS.md`.

## 📁 Estrutura de Pastas — Projeto SIGES React (set/2026)

Convenção aprovada: **manter camadas com subpastas de domínio**. Reestruturação
executada em 26/09/2026 (fases de higiene + consolidação).

### Árvore

```text
index.tsx            bootstrap da SPA
App.tsx              shell da app + mapa screen → tela
app/routes.tsx       telas lazy (lazyWithRetry + isChunkLoadError/forceCleanReloadOnce)
components/          UI por domínio (Badges, ai, appNotices, appTips, assets, dashboards,
                     notifications, permissions, reports, serviceRequests, shell, tools,
                     ui, units, users, ...)
views/               telas por domínio (Admin, Assets, Dashboards, OrderVisit, Settings, ...)
services/            dados por domínio (ai, assets, companies, core, gamification, materials,
                     media, orders, tools, users) + fachada services/dataService.ts
hooks/               hooks compartilhados · contexts/ providers · utils/ helpers
types/               tipos compartilhados (index.ts, manus.ts) — `types.ts` foi movido p/ cá
flows/               fluxos convertidos + testes (*/​*.test.ts)
design-system/       tokens e guias de UI (MASTER.md — não mover, é referenciado por .agent/)
dev/                 migrations/schema Supabase + docs de infra
docs/                docs de produto/fluxo + manual (docs/manual)
```

### Regras

1. **Componente novo** → `components/<domínio>/<Nome>.tsx`. Componente raiz em
   `components/*.tsx` não é permitido (zero soltos hoje).
2. **Serviço novo** → `services/<domínio>/<nome>Service.ts` + proxy tipado em
   `services/dataService.ts` (ver seção "Arquitetura de Serviços" abaixo).
3. **Tela nova** → `views/<Domínio>/` + entrada lazy em `app/routes.tsx` e no mapa
   `screen → elemento` do `App.tsx`.
4. **Imports relativos** (`./`, `../`) no código da app. O alias `@/` (Vite + tsconfig
   `paths`) só é usado nos testes Jest (`moduleNameMapper` em `jest.config.cjs`).
5. **Raiz do repo** só tem bootstrap (`index.tsx`, `App.tsx`, `constants.tsx`, `features.ts`),
   configs (`vite.config.ts`, `tsconfig*.json`, `capacitor.config.ts`, `jest.config.cjs`,
   `package.json`, `.env*`) e docs (`README.md`, `AGENTS.md`). Arquivo solto novo na raiz
   é considerado lixo — colocar na pasta de domínio.
6. **Mover um arquivo** exige reescrever todos os imports (`npx tsc --noEmit` + `npm test`
   após qualquer mudança de pasta).
