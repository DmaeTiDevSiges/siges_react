# Plano de Melhorias — SIGES

**Data:** 23/09/2026  
**Status:** 📋 Para análise  
**Contexto:** App React 19 + Vite + Capacitor (mobile) + Supabase **local em VPS (sem Edge Functions)** + Cloudflare R2/CDN.  
**Base de schema:** `dev/supabase/schema.sql` (dump Contabo 2026-09-23 · análise em `dev/supabase/dump_export/ANALISE.md`)

---

## 1. Resumo executivo

O app tem ~130k linhas TS/TSX, 109 telas lazy e boa fachada `dataService`. Os maiores riscos são **segurança no bundle do client**, **RLS permissivo (policies `USING (true)` / “Universal Access”)** e **qualidade/dívida técnica** (App.tsx monolítico, 32 erros TS, bundle pesado). As imagens já foram otimizadas (variantes R2, commit `64ae511`).

| # | Melhoria | Impacto | Esforço | Prioridade |
|---|----------|---------|---------|------------|
| 1 | Remover secrets do bundle (R2/Gemini/imgproxy) | 🔴 Crítico | Médio | P0 |
| 2 | Endurecer RLS/policies nas tabelas core | 🔴 Crítico | Médio-alto | P0 |
| 3 | ESLint + zerar 32 erros TS | 🟠 Alto | **Baixo** | P1 |
| 4 | Limpar bundle / deps mortas | 🟠 Alto (mobile) | **Baixo** | P1 |
| 5 | Fatiar App.tsx (incremental) | 🟠 Alto | Médio | P2 |
| 6 | Jest + testes dos fluxos críticos | 🟠 Alto | Médio | P2 |
| 7 | Notificações + stubs + fila offline | 🟡 UX | Baixo→médio | P3 |
| 8 | Extrair hooks das views 2k+ linhas | 🟡 Médio | Contínuo | P3 |

---

## 2. Contexto técnico (inventário)

- **445 arquivos** `.ts/.tsx` · **~129.965 linhas**
- `App.tsx` **3.433 linhas** (61 `useState`, ~133 telas em switch manual)
- `dataService.ts` **3.052 linhas** / ~486 métodos (fachada OK)
- `visitsService` 4.150 · `ordersService` 3.493 · `types.ts` 1.877
- Views grandes: `OrderVisitAssetReport` 2.129 / 65 useState; `ServicesRequestsDashboardAdmin` 2.102 / 45; `OrdersVisitsDashboardAdmin` 2.058 / 32
- `lint` = só `tsc --noEmit` → **32 erros** · **0 ESLint/Prettier** · `tsconfig` sem `strict`
- **9 arquivos de teste** · 51 testes passam · **1 suite falha** (alias `@/*`) · maioria TODO
- `dist` ~8,7 MB · vendor **2,54 MB** (AWS SDK S3 no client)
- Supabase: **VPS local, sem Edge Functions** (importante para opções de proxy)
- **Schema (dump 23/09/2026):** `dev/supabase/schema.sql` — 160 tables (130 `public`), 86 views, 122 functions, 50 triggers, 172 policies, 156 `ENABLE ROW LEVEL SECURITY`, 224 indexes

---

## 3. P0 — Segurança

### 3.1 Secrets no bundle do client

**Problema:** `VITE_*` é inlined no JS público. Verificado em `dist/`:

| Variável | Risco |
|----------|--------|
| `VITE_R2_SECRET_ACCESS_KEY` | Lê/escreve/apaga bucket R2 |
| `VITE_R2_ACCESS_KEY_ID` | Idem |
| `VITE_GEMINI_API_KEY` | Custo/abuso de API |
| `VITE_IMGPROXY_KEY` | Assinaturas imgproxy |
| (`VITE_SUPABASE_SERVICE_ROLE_KEY`) | Não no `.env.local` atual, mas padrão em código pronto para vazar |

**Onde:** `services/r2Service.ts` (S3Client), `services/aiService.ts`, `services/imgproxyService.ts`, `vite.config.ts`.

**Restrição:** Sem Edge Functions no Supabase → proxy precisa ser n8n, Cloudflare Worker ou endpoint na VPS.

**Opções presign/upload R2:**

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A. n8n** | Workflow gera URL pré-assinada / proxy | Já instalado | Latência; n8n guarda secret |
| **B. CF Worker** | Binding R2, secret só no Worker | Mesmo CF, free tier | Deploy novo |
| **C. API na VPS** | Node mini ao lado do Supabase | Controle total | Manutenção |

**Gemini:** usar **n8n** (`VITE_API_N8N_WEBHOOK_ASSISTANT` já existe).

**Ação:**

1. **Rotacionar** chaves R2 + Gemini (já expostas)
2. Presign R2 via A/B/C — remover `S3Client` e `VITE_R2_SECRET_*` do client
3. Gemini via n8n — remover `VITE_GEMINI_API_KEY`
4. Não usar `VITE_` para nenhum secret

**Leitura pública R2 (CDN)** não precisa de secret — só **upload/delete** saem do client.

---

### 3.2 RLS / policies permissivas

> **Fonte:** `dev/supabase/schema.sql` (dump Contabo 2026-09-23) · detalhes em `dev/supabase/dump_export/ANALISE.md`.

**Correção do diagnóstico antigo:** o plano anterior citava “19/53 tabelas com RLS” e “core sem RLS”. No dump atual:

| Métrica | Valor |
|---------|------:|
| Tables totais / `public` | 160 / 130 |
| `public` com RLS | **129/130** |
| `public` sem RLS | **1** — `assets_loans_checklists` |
| Policies | 172 |
| `USING (true)` (sem filtro real) | **139** |
| Policies “Universal Access” | **107** |
| Policies que filtram `company_id` | **0** |
| Policies com `auth.uid` / `EXISTS` (checagem de papel) | 21 |
| Tabelas com policy só para role pública (sem `TO authenticated`) | 117 |
| Tabelas com policy `authenticated` | 12 |

**Problema real:** RLS está ligado quase em tudo, mas as policies do core são no-op:

```sql
CREATE POLICY "Universal Access" ON public.users USING (true) WITH CHECK (true);
CREATE POLICY "Universal Access" ON public.orders USING (true) WITH CHECK (true);
CREATE POLICY "Universal Access" ON public.orders_visits USING (true) WITH CHECK (true);
CREATE POLICY "Universal Access" ON public.assets USING (true) WITH CHECK (true);
```

Idem para `units`, `clients`, `contracts`, `materials`, `warehouses`, etc. Qualquer role com acesso ao PostgREST (`anon`/`authenticated`) lê/escreve sem isolamento por empresa/usuário — a separação multi-tenant depende só do client.

**Também no dump:**

- 1 tabela `public` sem RLS: `assets_loans_checklists`
- 26 tabelas com RLS e sem policy — **todas em `auth`/`storage`** (esperado no Supabase; não bloqueia o app)
- 33 funções sem `SET search_path` — majoritariamente `auth.*`/`storage.*` (risco SECURITY DEFINER menor para o schema do app)

**Ação (Sprint B):**

1. Subir uma migration por domínio (não um monolito): `users` → `orders` → `orders_visits` → `assets` → `units`/`clients`/`contracts`/`materials`
2. Trocar `Universal Access` por policies com `TO authenticated` + `USING` em `company_id` (e `auth.uid()` onde fizer sentido)
3. Cobrir `assets_loans_checklists` com RLS + policy
4. Testar com usuários de **empresas distintas** (read cross-tenant deve falhar)
5. Validar no SQL Editor / app antes de cada troca (regras de `DROP` em `AGENTS.md`)

---

## 4. P1 — Qualidade e bundle (alto ROI, baixo esforço)

### 4.1 ESLint + 32 erros TypeScript

- Adicionar ESLint flat config (react-hooks, unused) + Prettier
- Zerar 32 erros `tsc` (~1 dia)
- **Bugs reais nos erros:** `AssetLoanChecklistTypeForm` chama `createChecklistType`/`updateChecklistType` **inexistentes** em `dataService` (feature quebrada em runtime)
- Ativar `strict` gradualmente (opcional, fases)

### 4.2 Limpar bundle / deps

- Vendor 2,54 MB: AWS SDK no browser (some com 3.1)
- Remover/confirmar não usadas: `@capacitor/filesystem`, `share`, `status-bar`, `browser`, `keyboard`?, `react-barcode`, `pg`, `leaflet.markercluster`?
- Dedupe: `@google/genai` + `@google/generative-ai` duplicados
- Código morto: `Header.tsx.backup`, `ProtectedRoute` nunca importado, `jest.config.cjs` **e** `.js` idênticos, `components/vite.config.js`
- Lazy: `BarcodeScannerModal` / `html5-qrcode`
- Revisar `nodePolyfills` globais no `vite.config.ts`
- Listas com `pageSize: 200` sem virtualização (`ServicesRequestsDashboardAdmin`, `OrdersRequestsDashboardAdmin`)

---

## 5. P2 — Arquitetura e testes

### 5.1 Fatiar App.tsx (incremental, sem rewrite)

1. Extrair mapa `screen → elemento` + títulos
2. Handlers por domínio → hooks (`useCompanyHandlers`, `useUnitHandlers`…)
3. (Opcional futuro) rotas/URLs reais — hoje deep link limitado (`?screen=…`)

**Fatia em 2–4 PRs.**

### 5.2 Testes

- Corrigir Jest: `moduleNameMapper` `@/*`, `testMatch` incluir `.tsx`, jsdom para componentes
- Hoje: 51 passam, 1 suite falha; `DataQualityIndicator.test.tsx` **nunca roda**
- Cobertura real quase zero em `visitsService`/`ordersService`/`dataService`
- Priorizar 3 fluxos: **fechar visita**, **aprovar OS/SS**, **criar OS**

---

## 6. P3 — Produto / UX

- **Notificações:** `useNotifications` (`markAsRead` etc.) só estado local; unificar com `NotificationsModal` + `dataService`
- **Stubs:** `onClick={() => {}}` em dashboards; `console.log` como handler em `App.tsx`
- **Offline:** `NetworkContext` detecta mas **não há fila de mutações** — crítico para visitas em campo (fila + retry p/ SS/visitas/fotos)
- **Views 2k+ linhas:** extrair subcomponentes + hooks de filtros (re-renders)
- Busca client-side a cada keystroke em listas de 200 itens → debounce se necessário

---

## 7. Ordem sugerida de execução

```
Sprint A (segurança)     → 3.1 rotacionar + presign R2 (escolher A/B/C) + Gemini n8n
Sprint B (segurança)     → 3.2 endurecer policies (base: schema.sql / dump 23/09)
Sprint C (qualidade)     → 4.1 ESLint + 32 erros TS (+ bug checklist types)
Sprint D (perf mobile)   → 4.2 deps mortas + lazy scanner + dedupe Google
Sprint E (dívida)        → 5.1 fatiar App.tsx (PRs incrementais)
Sprint F (confiança)     → 5.2 jest + testes de visita/OS/SS
Depois                    → 6 offline queue, notificações, hooks de views
```

---

## 8. Decisões pendentes (precisam de você)

1. **Presign R2:** n8n **ou** Cloudflare Worker **ou** API na VPS?
2. **Gemini:** confirmar proxy via n8n webhook já existente?
3. **RLS:** ordem das tabelas na Sprint B (sugestão: users → orders → orders_visits → assets) e critério multi-tenant (`company_id` vs `auth.uid`)?
4. Prioridade: começar por **segurança (P0)** ou **quick wins (P1: TS + deps)**?

---

## 9. Fora de escopo / não mexer

- Lazy loading das 109 telas, fachada `dataService`, `OptimizedImage` + variantes R2 (feito)
- CSP, `.env.local` fora do git
- Reescrever o app / migrar router completo de uma vez

---

## 10. Referências

- `AGENTS.md` — arquitetura de serviços e migrations
- `dev/docs_project/IMAGES_PERFORMANCE_PLAN.md` — imagens (concluído)
- **`dev/supabase/schema.sql`** — schema principal (dump Contabo 2026-09-23)
- `dev/supabase/dump_export/ANALISE.md` — análise estrutural (RLS, policies, triggers)
- `dev/supabase/dump_export/list_*.txt` — listas por categoria (tables, policies, triggers…)
- Números: 32 erros tsc · 0 ESLint · 9 arquivos de teste · vendor 2,54 MB · **129/130 tabelas `public` com RLS** (mas 139 policies `USING (true)`)
