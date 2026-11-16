# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Responder sempre em português (pt-BR). Regras detalhadas para agentes estão em [AGENTS.md](AGENTS.md) (e nos guias em `docs/agents/`) — leia-o antes de mexer em serviços, migrations ou estrutura de pastas; abaixo vai só o essencial e o panorama da arquitetura.

## O que é

SIGES — SPA React 19 + TypeScript + Vite para gestão de ordens de serviço, visitas técnicas, ativos, materiais, clientes e equipes. Backend: **Supabase self-hosted** (VPS própria, sem Edge Functions). Empacotada como PWA, **Android/iOS (Capacitor)** e **desktop (Electron)**. Código, comentários e docs estão em português.

## Comandos

```bash
npm run dev                 # Vite dev server
npm run build               # gera public/app_version.txt + vite build
npm run lint                # = tsc --noEmit (typecheck; é o "lint" oficial)
npm run lint:eslint         # ESLint; não pode ter ERROS (hooks fora de ordem é erro)
npm test                    # Jest, projetos "node" (*.test.ts) e "ui" (*.test.tsx)
npm run test:ui             # só o projeto ui (Testing Library/jsdom)
npx jest --config jest.config.cjs path/to/file.test.ts          # um arquivo
npx jest --config jest.config.cjs -t "nome do teste"            # um teste
npm run build:android       # vite build --mode android + cap sync
npm run apk                 # scripts/build-apk.sh
npm run electron:build
npm run db:backup | db:export | db:validate    # scripts/ (banco)
```

Verificação padrão antes de commitar: `npx tsc --noEmit && npm test && npm run lint:eslint`, encadeado com `&&` e olhando a saída antes do commit. Ao mover arquivos, reescreva todos os imports e rode tsc + testes.

## Arquitetura

**Bootstrap e navegação.** `index.tsx` → `App.tsx` (estado global e mapa `screen → tela`; não usa roteamento por URL puro). `app/routes.tsx` declara as ~100 telas com `lazyWithRetry`. Telas que abrem por id precisam de rota em `app/screenRoutes.ts`; telas que exigem seleção em memória entram em `canEnterScreen` no `App.tsx`. Botão voltar do Android: use `useBackToClose` / `registerBackHandler` (`utils/backButton.ts`), nunca `CapApp.addListener('backButton')` em componente.

**Camada de dados (a parte que exige ler vários arquivos).**
`componente/hook → services/dataService.ts → services/<domínio>/<x>Service.ts → Supabase`.
- `dataService.ts` é só uma **fachada tipada**: nenhuma query nela. Método novo = serviço especializado + proxy no formato `nome: (...args: Parameters<typeof svc.nome>): ReturnType<typeof svc.nome> => svc.nome(...args)` (resolve o serviço na hora da chamada; **não** usar `.bind`/`.apply(svc, arguments as any)`, porque a camada offline troca os métodos depois). Mudou o tipo de retorno → ajuste serviço **e** assinatura no `dataService`. Ver `docs/agents/arquitetura-servicos.md`.
- Leitura em tela nova: TanStack Query (`useQuery` com `queryFn: () => dataService.getX()`, chave começando pelo recurso). Não escrever `useEffect` + `loading/error` à mão. Não alterar `networkMode: 'always'` (o offline mora no `dataService`). Tempo real/`refresh_dashboard` → `useLiveInvalidation`. Novo caminho de logout/troca de usuário → `queryClient.clear()`.
- Contextos em `contexts/` (Auth, Permissions, Network, DataQuality, UiVersion). Escopo por cliente via `useClientScope` / departamentos.

**Modo offline em campo.** `services/offline/` (outbox, syncEngine, readCache, offlineLayer que intercepta o `dataService`, catálogo/pacote de campo, travas, auth offline) + hooks `useOfflineSync`/`useOfflineAutoSync`. Planos em `docs/OFFLINE_*.md`. Mudanças em métodos do `dataService` podem afetar a camada offline.

**Workers (Cloudflare/serviços auxiliares)** em `workers/`: `availability-sync`, `r2-files` (wrangler) e `hermes-mcp` (MCP do agente Hermes/WhatsApp, deploy próprio). Arquivos/mídia: Cloudflare R2 + imgproxy (`services/media`). IA em `services/ai`, `components/ai`.

**Feature flags** em `features.ts` via `VITE_FEATURE_*` (`import.meta.env`; nos testes UI usa o stub `tests/featuresStub.ts`).

**Banco.** `dev/supabase/` (schema de referência `schema.sql`, `migrations/`, `SETUP_NOVO_VPS.md`). Migrations são **aplicadas manualmente pelo usuário** no SQL Editor; o banco vivo é a fonte da verdade (o `schema.sql` pode estar defasado — confira colunas reais, há MCP `supabase-ro` somente leitura, ver `docs/SUPABASE_MCP_LEITURA.md`). Antes de `DROP ... CASCADE`, liste views/funções dependentes e recrie-as no mesmo arquivo; prefira `CREATE OR REPLACE VIEW`. Ver `docs/agents/migrations-supabase.md`.

## Convenções que não são óbvias

- Imports **relativos** no app; o alias `@/` só vale nos testes Jest.
- Componente novo em `components/<domínio>/`, tela em `views/<Domínio>/`, serviço em `services/<domínio>/<nome>Service.ts`. Nada solto na raiz.
- Datas: formatar com `formatDateInBrazil` (`utils/formatters.ts`), nunca `toLocale*String`. Timestamp sem offset do banco = horário de São Paulo; em SQL use `timezone('America/Sao_Paulo', now())`.
- Todo botão de PDF usa `components/ui/PDFButton` (vermelho).
- Testes: `*.test.ts` rodam em node; `*.test.tsx` em jsdom com Testing Library (`tests/setupUi.ts`).
- Visual novo (redesign estilo Nubank) só para `isAdminSuper`; planos em `docs/PLANO_DESIGN_ESTILO_NUBANK.md` e `design-system/MASTER.md`.
- Planos de trabalho em andamento ficam em `docs/PLANO_*.md` (melhorias do frontend, programação diária, etc.) — consulte o plano do tema antes de continuar uma frente.
- Workflows n8n (`*.workflow.ts`): leia `docs/agents/n8n-workflows.md` antes de qualquer comando `n8nac`.
