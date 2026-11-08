# Plano — Melhorias de segurança do SIGES

> **Status (07/11/2026):** plano aprovado para execução; nenhuma fase iniciada.
> Diagnóstico completo (achados, risco e validação): doc
> [Melhorias de segurança do SIGES](https://claude.ai/artifact/CPxa8n9EPxxvsMjn6tyUEk).
> **Regra-base:** toda variável `VITE_*` vai para o JavaScript público (site e APK).
> Segredo só em servidor: Cloudflare Worker (`wrangler secret`), Edge Function,
> n8n ou `.env` de servidor.

## 1. Resumo dos achados

| # | Gravidade | Achado | Fase |
|---|---|---|---|
| 1 | Crítica | Chaves do R2 (`VITE_R2_ACCESS_KEY_ID` / `VITE_R2_SECRET_ACCESS_KEY`) no bundle | 1 |
| 2 | Crítica | Política "Universal Access" (`USING (true)`) em ~106 tabelas: usuário logado altera permissões, OS e auditoria | 1 (1ª leva) e 3 |
| 3 | Alta | Webhook n8n de WhatsApp (e demais webhooks) sem autenticação | 2 |
| 4 | Alta | Impersonação devolve e-mail e senha do alvo ao navegador | 3 |
| 5 | Alta | `VITE_GEMINI_API_KEY` no bundle | 2 |
| 6 | Alta | `VITE_IMGPROXY_KEY` / `VITE_IMGPROXY_SALT` no bundle | 2 |
| 7 | Alta | Token fixo em `services/ai/manusIntegrationService.ts` | 2 |
| 8 | Média | Código lê `VITE_SUPABASE_SERVICE_ROLE_KEY` | 2 |
| 9 | Média | Fotos no R2 com URL pública e caminho previsível | 3 |
| 10 | Média | `20261112_revoke_anon_access.sql` e `20261113_restrict_users_writes.sql` sem confirmação no banco vivo | 0 |

## 2. Princípios de execução

1. **Publicar antes de revogar.** Uma chave só é revogada depois que o site e o APK
   novos (que não a usam) estão publicados. Revogar antes quebra os aparelhos.
2. **Toda chave que já esteve no bundle é considerada vazada** e é rotacionada,
   não apenas removida do código.
3. **Migrations de RLS em levas pequenas**, cada uma com `_DOWN`, aplicadas
   manualmente no SQL Editor (padrão do projeto) e testadas com um usuário comum
   antes de produção.
4. **Cada item só fecha quando o teste de validação passa em produção**
   (seção 8).
5. Segue `AGENTS.md`: serviço novo em `services/<domínio>/` + proxy em
   `dataService.ts`; `npx tsc --noEmit` e `npm test` após cada mudança.

## 3. Fase 0 — Verificar o banco (item 10)

Objetivo: saber de onde partimos antes de mexer em RLS.

- [ ] Rodar no SQL Editor:
  ```sql
  -- 20261112 aplicada? deve dar false nas duas
  SELECT has_table_privilege('anon', 'public.users', 'SELECT')  AS anon_le_users,
         has_table_privilege('anon', 'public.orders', 'INSERT') AS anon_grava_orders;
  -- 20261113 aplicada? deve dar true
  SELECT to_regprocedure('public.fn_users_caller()') IS NOT NULL AS restrict_users_writes;
  -- Inventário: políticas que liberam tudo
  SELECT tablename, policyname, roles, cmd
  FROM pg_policies WHERE schemaname = 'public' AND qual = 'true'
  ORDER BY tablename;
  ```
- [ ] Se 20261112/20261113 não estiverem aplicadas: aplicar, nessa ordem, e
      repetir as consultas.
- [ ] Guardar o inventário de políticas (resultado da 3ª consulta) como linha de
      base da Fase 3.

**Pronto quando:** `curl` com a chave anon, sem login, em
`/rest/v1/users?select=id&limit=1` devolve erro de permissão.

## 4. Fase 1 — Fechar o crítico (itens 1 e 2, 1ª leva)

### 4.1 R2 pelo Worker `siges-files` (item 1)

O Worker `workers/r2-files` já existe e acessa o bucket por binding, sem chave,
exigindo login do Supabase. `services/media/r2Service.ts` já usa o Worker quando
`VITE_R2_WORKER_URL` está definida.

- [ ] Verificar se `siges-files` está publicado e com o secret `SUPABASE_ANON_KEY`
      (`cd workers/r2-files && npx wrangler deployments list` e `secret list`).
      Se não: `npx wrangler secret put SUPABASE_ANON_KEY` + `npx wrangler deploy`.
- [ ] Conferir `ALLOWED_ORIGINS` em `workers/r2-files/wrangler.toml` com os domínios
      reais do site e `https://localhost` (APK).
- [ ] Definir `VITE_R2_WORKER_URL` em `.env.local` e `.env.production`.
- [ ] Remover `VITE_R2_ACCESS_KEY_ID` e `VITE_R2_SECRET_ACCESS_KEY` dos `.env` e do
      ambiente de build.
- [ ] Testar upload, download, cópia e exclusão (fotos de vistoria, anexos de OS,
      avatar, assinatura) no site e no APK.
- [ ] Publicar site e APK.
- [ ] **Revogar o token R2 antigo** no painel da Cloudflare (R2 → Manage API Tokens).
- [ ] Remover o modo legado (SDK S3) de `r2Service.ts` e a dependência, se não houver
      outro uso.

### 4.2 RLS — 1ª leva (item 2)

Migration `dev/supabase/migrations/2026MMDD_rls_permissions_audit.sql` (+ `_DOWN`),
no padrão de `20261105` / `20261113` (`fc_has_route_permission`):

| Tabela | Leitura | Escrita |
|---|---|---|
| `cfg_profiles_access` | logados | só com rota `profile_permissions` (`can_edit`) ou super admin |
| `cfg_profiles` | logados | idem |
| `cfg_routes` | logados | só super admin |
| `audits_logs` | só com rota `audit_log` | nenhuma pela API (gravação só por gatilho; sem UPDATE/DELETE) |

- [ ] Antes: mapear no código quem grava nessas tabelas
      (`grep -rn "from('cfg_profiles_access')"` etc.) para não quebrar telas.
- [ ] Remover a política "Universal Access" dessas 4 tabelas e criar as novas.
- [ ] Testar com: super admin, administrador de empresa, usuário comum.
- [ ] Aplicar em produção.

**Pronto quando:** o bundle não contém a chave R2, a chave antiga é recusada, e um
usuário comum recebe erro ao tentar alterar `cfg_profiles_access` ou apagar
`audits_logs` pela API.

## 5. Fase 2 — Segredos só no servidor (itens 3, 5, 6, 7, 8)

### 5.1 Webhooks do n8n com autenticação (item 3)

`services/core/apiN8nService.ts` centraliza as chamadas; `aiSsCreationService.ts`,
`aiVisitAssistantService.ts` e `aiService.ts` também chamam webhooks.

- [ ] No app: enviar `Authorization: Bearer <access_token do Supabase>` em todas as
      chamadas a webhook (um helper único em `apiN8nService`).
- [ ] Em cada workflow (WhatsApp, criação de SS, assistente de visita, demais): primeiro
      nó valida o token em `GET {SUPABASE_URL}/auth/v1/user`; sem token válido → 401.
- [ ] Publicar workflows **antes** do app novo só se aceitarem as duas formas por um
      período curto; senão, publicar juntos.

### 5.2 IA no servidor: Gemini e Manus (itens 5 e 7)

Usos: `services/ai/aiService.ts`, `fuelReceiptService.ts`, `manualRagService.ts`,
`components/ai/AIChatWindow.tsx` (Gemini) e `manusIntegrationService.ts` (Manus,
usado em `views/OrderRequest/OrderRequestView.tsx`).

- [ ] Decidir o servidor (decisão D3): Worker novo `workers/ai-proxy`, Edge Function
      ou n8n.
- [ ] Criar o proxy com validação do token do usuário, limite por usuário/minuto e
      chaves como secrets.
- [ ] Trocar as chamadas diretas do app pelo proxy (serviço em `services/ai/` + proxy
      em `dataService.ts`).
- [ ] Remover `VITE_GEMINI_API_KEY` e o token fixo do Manus do código e dos `.env`.
- [ ] Publicar site e APK; **rotacionar** a chave Gemini (Google AI Studio) e o token
      Manus; definir limite de gasto no Google.
- [ ] Scripts em `scripts/*.ts` que usam a chave Gemini: passar a ler de variável sem
      prefixo `VITE_` (não vão para o bundle).

### 5.3 imgproxy (item 6)

`services/media/imgproxyService.ts` assina as URLs no navegador (8 usos no app).

- [ ] Mover a assinatura para o Worker `siges-files` (rota `GET /img?src=...&w=...`
      que assina e redireciona) ou para endpoint equivalente.
- [ ] No servidor do imgproxy: `IMGPROXY_ALLOWED_SOURCES` = URL pública do bucket.
- [ ] Remover `VITE_IMGPROXY_KEY` / `VITE_IMGPROXY_SALT`; publicar; **trocar chave e
      sal** no imgproxy.

### 5.4 Referências à service role (item 8)

- [ ] Remover `VITE_SUPABASE_SERVICE_ROLE_KEY` de `services/core/apiN8nService.ts`
      (impersonação) e `services/assets/assetTagsService.ts` (aquecimento do
      PostgREST: usar a chave anon).
- [ ] Barreira no build: em `vite.config.ts`, falhar se alguma variável `VITE_*`
      contiver `SECRET`, `SERVICE_ROLE`, `PASSWORD` ou `PRIVATE` no nome.

**Pronto quando:** nenhum valor secreto aparece em `dist/` (busca pelo valor de cada
chave antiga), as chaves antigas são recusadas e webhook sem token responde 401.

## 6. Fase 3 — Endurecimento contínuo (itens 2, 4, 9)

### 6.1 RLS — demais levas (item 2)

- [ ] 2ª leva: `orders`, `orders_visits*`, `assets_available` — escrita restrita à
      empresa do usuário e às rotas correspondentes.
- [ ] Levas seguintes: cadastros `cfg_*`, em grupos de 10–15 tabelas, leitura para
      logados e escrita pela rota de Ajustes correspondente.
- [ ] A cada leva, comparar o inventário da Fase 0 e registrar o que sobrou.

### 6.2 Impersonação (item 4)

Usos: `views/Settings/Users/AllUsersList.tsx` → `usersService` → `apiN8nService.impersonateUser`.

- [ ] Servidor (n8n ou Worker) valida que o solicitante é super admin.
- [ ] Gera link de acesso de uso único (`auth.admin.generateLink`, tipo magic link)
      em vez de senha; registra em `audits_logs` quem, quem foi impersonado e quando.
- [ ] App recebe só o link; nenhuma senha sai do servidor.
- [ ] Alternativa (decisão D4): remover o recurso.

### 6.3 Fotos protegidas (item 9)

- [ ] Decisão D1: bucket privado com download pelo Worker `siges-files` (protege as
      antigas; muda as URLs) **ou** nomes UUID só para arquivos novos.
- [ ] Se bucket privado: trocar `VITE_R2_PUBLIC_URL` pelo Worker nos pontos de
      exibição (`services/dataService.ts`, `r2Service.ts`), cuidar de cache e do
      imgproxy (que passa a buscar pelo Worker ou por URL assinada).

**Pronto quando:** só as tabelas aprovadas ainda têm política `USING (true)`, a
impersonação não trafega senha, e uma foto não abre sem login (ou com URL adivinhada).

## 7. Decisões em aberto

| # | Decisão | Opções | Impacto |
|---|---|---|---|
| D1 | Proteção das fotos | bucket privado via Worker / UUID nos novos | Fase 3.3 |
| D2 | Ordem das tabelas nas levas de RLS e quem testa | — | Fases 1.2 e 3.1 |
| D3 | Onde ficam as chamadas de IA | Worker / Edge Function / n8n | Fase 2.2 |
| D4 | Impersonação | manter com link único / remover | Fase 3.2 |
| D5 | Janela de publicação do APK para revogar chaves | — | Fases 1 e 2 |

## 8. Validação (resumo)

| Item | Teste | Esperado |
|---|---|---|
| 1, 5, 6, 7 | `grep -rF "<valor antigo>" dist` após o build; DevTools → Sources → busca | nenhuma ocorrência |
| 1, 5, 6, 7 | usar a chave antiga | acesso negado |
| 2 | usuário comum tenta `update` em `cfg_profiles_access`, `delete` em `audits_logs`, `update` em OS de outra empresa | erro de RLS |
| 3 | `curl -X POST` no webhook sem `Authorization` | 401 |
| 4 | impersonar sem ser super admin / sendo | 403 / link único + linha em `audits_logs` |
| 6 | imgproxy com imagem de domínio externo | recusado |
| 9 | abrir URL de foto sem login | negado |
| 10 | consultas da Fase 0 | conforme comentários |

## 9. Reversão

- Migrations de RLS: cada uma tem `_DOWN`; aplicar o `_DOWN` restaura a política
  anterior.
- R2 / imgproxy / IA: até a revogação, voltar o build anterior restaura o
  funcionamento. **Depois da revogação não há volta para a chave antiga**: por isso a
  revogação é sempre o último passo de cada fase.
