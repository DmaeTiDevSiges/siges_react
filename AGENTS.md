# 🤖 AI Agents Guidelines — SIGES React

Regras que quase toda tarefa precisa. Detalhes, exemplos e procedimentos longos ficam
nos arquivos indicados em cada seção — leia o arquivo quando a tarefa for daquele tema.

<!-- n8n-as-code-start -->
<!-- n8nac-version: 1.6.2 -->
## 🔌 n8n (só para tarefas de workflow n8n)

Antes de criar, editar, `pull` ou `push` de qualquer `.workflow.ts`, ou de rodar `n8nac`,
**leia [docs/agents/n8n-workflows.md](docs/agents/n8n-workflows.md) inteiro — é obrigatório**
(bootstrap do workspace, sync git-like, protocolo de pesquisa de nós, testes, credenciais).

Resumo: workspace inicializado (`n8nac-config.json`) antes de qualquer comando · `list` e
`pull` antes de editar · o schema de `npx --yes n8nac skills node-info <nó>` é a verdade
(tipo, versão, parâmetros) · `push` com o caminho completo do `.workflow.ts` · `verify` depois.
<!-- n8n-as-code-end -->

---

## 📁 Estrutura de pastas

```text
index.tsx / App.tsx   bootstrap da SPA + mapa screen → tela
app/routes.tsx        telas lazy (lazyWithRetry)
components/<domínio>/ UI          views/<Domínio>/ telas
services/<domínio>/   dados + fachada services/dataService.ts
hooks/ contexts/ utils/ types/    compartilhados
flows/                fluxos convertidos + testes
design-system/        tokens/guias (MASTER.md — não mover, referenciado por .agent/)
dev/                  migrations/schema Supabase + infra
docs/                 docs de produto/fluxo, manual e docs/agents/ (guias para agentes)
```

1. Componente novo → `components/<domínio>/<Nome>.tsx` (nada solto em `components/`).
2. Serviço novo → `services/<domínio>/<nome>Service.ts` + proxy tipado em `services/dataService.ts`.
3. Tela nova → `views/<Domínio>/` + entrada lazy em `app/routes.tsx` e no mapa do `App.tsx`.
4. Imports relativos (`./`, `../`) no app; o alias `@/` só nos testes Jest.
5. Raiz do repo: só bootstrap, configs e docs (`README.md`, `AGENTS.md`). Arquivo novo vai para a pasta de domínio.
6. Mover arquivo exige reescrever todos os imports e rodar `npx tsc --noEmit` + `npm test`.
7. Testes: `*.test.ts` = serviços (Jest/node); `*.test.tsx` = telas/componentes (Testing Library, `npm run test:ui`). `npm run lint:eslint` não pode ter **erros** (hooks fora de ordem é erro). Plano de melhorias: [docs/PLANO_MELHORIAS_FRONTEND.md](docs/PLANO_MELHORIAS_FRONTEND.md).

Árvore detalhada, lista de arquivos permitidos na raiz e histórico: [docs/agents/estrutura-pastas.md](docs/agents/estrutura-pastas.md).

---

## 🏗️ Serviços: `dataService.ts` é fachada

Componente → `services/dataService.ts` (proxy tipado) → serviço especializado (query real no Supabase).

| Ação | Onde |
|------|------|
| Campo novo no `select` / `.map()` | Serviço especializado (ex.: `services/materials/warehouseService.ts`) — **não** o `dataService.ts` |
| Tipo de retorno mudou | **Os dois**: serviço especializado + assinatura no `dataService.ts` |
| Método novo | Serviço especializado + proxy no `dataService.ts` |

No `dataService.ts`, altere só a assinatura; o corpo continua `servico.metodo.apply(servico, arguments as any)`.
Passo a passo, exemplo real e mapa dos serviços: [docs/agents/arquitetura-servicos.md](docs/agents/arquitetura-servicos.md).

---

## 🗄️ Migrations Supabase

Aplicadas **manualmente pelo usuário** no SQL Editor (ver também `.agent/rules/GEMINI.md`); o banco vivo é a fonte da verdade do schema.

1. Antes de qualquer `DROP ... CASCADE`, identifique **todas** as views/funções dependentes.
2. Prefira `CREATE OR REPLACE VIEW` (mudança só aditiva); `DROP CASCADE` só para remover colunas.
3. Se usar `DROP ... CASCADE`, recrie os dependentes no **mesmo** arquivo (ex.: `v_orders_visits_assets` depende de `v_orders_visits`).
4. Confira o nome real das colunas no banco vivo — `dev/supabase/schema.sql` pode estar defasado.
5. Valide: rode a SQL no editor e teste a feature afetada antes de declarar concluído.

SQL para achar dependentes e casos conhecidos: [docs/agents/migrations-supabase.md](docs/agents/migrations-supabase.md).

---

## 🕒 Fuso horário — `America/Sao_Paulo`

1. Exibir/formatar datas: `formatDateInBrazil` (`utils/formatters.ts`), nunca `toLocaleDateString`/`toLocaleTimeString`/`toLocaleString` direto.
2. Timestamp sem offset vindo do banco = horário local de São Paulo; com `Z`/offset = instante, converter na exibição.
3. Gravar timestamp sem fuso em SQL: `timezone('America/Sao_Paulo', now())`, nunca o fuso implícito da sessão.
4. Fuso padrão das sessões: `dev/supabase/set_database_timezone_sao_paulo.sql` (sessão aberta exige reconexão).
