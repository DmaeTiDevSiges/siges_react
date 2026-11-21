# Limpeza de fotos do R2 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foto removida ou substituída no relatório do ativo (e ativo removido da visita) tem seus 3 arquivos apagados do R2 quando nenhum registro os usa mais, e um script manual recolhe os arquivos que já ficaram para trás.

**Architecture:** Uma função SECURITY DEFINER no banco diz quais nomes de uma pasta não são referenciados por nenhuma linha (o app não enxerga tudo por causa da RLS). Um serviço único (`photoCleanupService`) usa essa resposta para apagar original + `.medium` + `.thumb` em melhor esforço; os pontos de remoção existentes passam a chamá-lo depois de gravar o banco. Um script `npx tsx` lista o bucket e usa a mesma função para limpar órfãos antigos.

**Tech Stack:** TS, Supabase (PL/pgSQL), Cloudflare R2 (`r2Service`, `@aws-sdk/client-s3` no script), Jest.

**Spec:** `docs/PLANO_LIMPEZA_FOTOS_R2.md`

## Execução

Método: superpowers:subagent-driven-development, **não iniciada** — começa quando o usuário pedir. Mesmo fluxo do plano `2026-11-20-fluxo-relatorio-ativo.md` (branch próprio `fix/limpeza-fotos-r2` em worktree, implementador + revisor por tarefa, pausa na Task 1 para o usuário aplicar a migration, pausa na Task 5 para o usuário rodar o script).

## Global Constraints

- Textos e comentários em pt-BR; imports relativos; `dataService` só proxy no formato padrão.
- Nunca apagar do R2 antes de o banco já não referenciar o arquivo (ordem: banco → checagem → R2).
- Apagar do R2 é **melhor esforço**: falha vira `console.warn` e contagem, nunca desfaz nem bloqueia a ação do usuário.
- Variantes: sempre as 3 chaves de `addVariantToPath` (`services/media/imageUtils.ts`): original, `thumb`, `medium`.
- Script: padrão é simulação; `--apply` só apaga grupos cujo arquivo mais novo tem mais de **7 dias** (`--min-age-days`, padrão 7). Credencial de serviço vem de variável de ambiente na linha de comando, nunca gravada em arquivo.
- Escopo do R2: só prefixo `companies/*/assets/*/`.
- Verificação antes de cada commit: `npx tsc --noEmit && npm test && npm run lint:eslint`.

## Review Focus

0. **Foto referenciada com pasta diferente** (OVA antigo com `*_img_file_path` nulo, ou empresa contratante × prestadora): conta como em uso e o script não apaga (cenário SQL na Task 1).
1. **Foto usada como capa do ativo** é removida do relatório: some do relatório, a capa continua funcionando (teste na Task 2 via mock da função; cenário SQL na Task 1).
2. **Mesma foto nos dois lados ou em duas visitas** (ex.: lista editada à mão / cópia futura): só apaga quando a última referência sai (cenário SQL na Task 1).
3. **Remoção feita offline** e sincronizada depois: a limpeza roda ao reexecutar o método do serviço; nenhum arquivo é apagado enquanto a operação está só na fila (teste na Task 2: a limpeza está dentro do método do serviço, não no hook).
4. **Upload em andamento / fila offline não sincronizada** quando o script roda: arquivo recente não é apagado (teste da regra de idade na Task 5).
5. **R2 fora do ar** ao remover: a foto sai do relatório normalmente e o usuário não vê erro (teste na Task 2).

---

### Task 1: Função de referências no banco

**Files:**
- Create: `dev/supabase/migrations/20261120_create_fc_r2_unreferenced_photos.sql`
- Create: `dev/supabase/migrations/20261120_create_fc_r2_unreferenced_photos_DOWN.sql`
- Create: `dev/supabase/migrations/20261120_fc_r2_unreferenced_photos_CHECKS.sql` (roteiro manual em `BEGIN … ROLLBACK`)

**Interfaces:**
- Produces: `public.fc_r2_unreferenced_photos(p_folder text, p_names text[]) RETURNS text[]` — SECURITY DEFINER, `search_path = public`, `GRANT EXECUTE` para `authenticated` e `service_role`. Devolve o subconjunto de `p_names` (normalizado: sem `.thumb`/`.medium`) que **não** aparece em nenhuma referência. **A comparação é só pelo nome, em qualquer pasta** (conservador): o APK atual monta a pasta com `o_company_id` quando `*_img_file_path` está nulo e o envio usa `o_provider_company_id`, então comparar pasta + nome poderia dar como livre uma foto em uso. `p_folder` só limita **quais** arquivos são candidatos, não as referências. Os nomes já são praticamente únicos (`before_/after_/checklist_` + timestamp + sufixo aleatório; capa = timestamp).

Referências (incluir linhas com `is_deleted = true` — soft delete ainda pode ser restaurado):
- `orders_visits_assets`: `before_img_files_names ? name`, `after_img_files_names ? name` e as **colunas antigas de foto única** `before_img_file_name`, `after_img_file_name`, `before_img_file_name_thumb`, `after_img_file_name_thumb` (comparar com o nome normalizado);
- `orders_visits_assets_activities.img_files_names ? name`;
- `assets.img_file_name = name`;
- **sessões de edição abertas** do relatório (`orders_visits_assets_edit_sessions.status = 'open'`, plano `2026-11-20-fluxo-relatorio-ativo.md` Task 8): nomes em `snapshot->'ova'->'before_img_files_names'`/`'after_img_files_names'` e em `snapshot->'activities'[*]->'img_files_names'` contam como referência — senão uma foto removida durante a revisão seria apagada do R2 e o "Cancelar" não teria como devolvê-la. Se a tabela ainda não existir quando esta tarefa for feita, quem implementar a outra acrescenta este trecho.
- qualquer outra coluna que o MCP `supabase-ro` mostrar apontando para `companies/%/assets/%` (Step 1).

- [ ] **Step 1:** No banco vivo (MCP `supabase-ro`), listar colunas `*img_file*`/`*files_names*` e confirmar quais podem apontar para `companies/*/assets/*`; acrescentar as que faltarem à lista acima.
- [ ] **Step 2:** Escrever `_CHECKS.sql`: nome sem referência → volta; nome só no `before` de um OVA → não volta; **nome referenciado por OVA com `before_img_file_path` nulo ou com pasta de outra empresa** → não volta; nome só em `after_img_file_name` (coluna antiga) → não volta; nome em OVA `is_deleted` → não volta; nome que é capa do ativo → não volta; nome no checklist → não volta; `p_names` com `x.thumb.webp` → normaliza para `x.webp`.
- [ ] **Step 3:** Escrever a função e o `_DOWN`; `NOTIFY pgrst, 'reload schema';` no fim.
- [ ] **Step 4:** Pedir ao usuário para aplicar e rodar `_CHECKS.sql`; todos os resultados conferem.
- [ ] **Step 5:** Commit `feat(db): fc_r2_unreferenced_photos para limpeza segura de fotos`.

---

### Task 2: Serviço de limpeza + remover/substituir foto do relatório

**Files:**
- Create: `services/media/photoCleanupService.ts`
- Test: `services/media/photoCleanupService.test.ts`
- Modify: `services/orders/visitsService.ts` (`removeOrderVisitAssetPhoto`, ~2258)
- Test: `services/orders/visitsService.removePhoto.test.ts`

**Interfaces:**
- Consumes: `fc_r2_unreferenced_photos` (Task 1), `r2Service.deleteFile`, `addVariantToPath`.
- Produces:
  ```ts
  export interface PhotoCleanupResult { deleted: number; kept: number; failed: number }
  export const photoCleanupService: {
      deleteUnreferencedPhotos(folder: string, names: string[]): Promise<PhotoCleanupResult>;
  };
  ```
  `deleted`/`kept` contam nomes; `failed` conta chaves do R2 que deram erro. Nunca lança (erro da RPC → `{ deleted: 0, kept: names.length, failed: 0 }` + `console.warn`).

- [ ] **Step 1: Testes do serviço** (mock de `../core/supabase` com `rpc` e de `./r2Service`):
  - RPC devolve `['a.webp']` para `['a.webp','b.webp']` → `deleteFile` chamado com `f/a.webp`, `f/a.thumb.webp`, `f/a.medium.webp` e nada de `b`; resultado `{ deleted: 1, kept: 1, failed: 0 }`
  - `names` vazio → não chama RPC
  - pasta com `/` final não gera `//` nas chaves
  - `deleteFile` rejeita numa chave → `failed: 1`, não lança
  - RPC com erro → não chama `deleteFile`, não lança
- [ ] **Step 2: Testes de `removeOrderVisitAssetPhoto`:** depois do `update` bem-sucedido chama `deleteUnreferencedPhotos(<pasta gravada no OVA>, [fileName])`; a pasta vem de `before_img_file_path`/`after_img_file_path` lido no mesmo `select` (acrescentar a coluna ao select); `update` com erro → lança e **não** chama a limpeza; limpeza com `failed > 0` → método resolve normalmente.
- [ ] **Step 3:** Rodar → FAIL. **Step 4:** Implementar. **Step 5:** Rodar → PASS.
- [ ] **Step 6:** Commit `fix(fotos): apaga do R2 a foto removida do relatório quando ninguém mais a usa`.

Substituir foto (useReportPhotos.ts:104) já chama `removeOrderVisitAssetPhoto` para a antiga — fica coberto sem mudar o hook.

---

### Task 3: Remover ativo da visita

**Files:**
- Modify: `services/orders/visitsService.ts` (`removeAssetFromOrderVisit`, ~2440-2515)
- Test: `services/orders/visitsService.removeAsset.test.ts`

**Interfaces:**
- Consumes: `photoCleanupService.deleteUnreferencedPhotos` (Task 2).

Mudanças: o `select` inicial passa a ler `before_img_file_path, after_img_file_path, o_provider_company_id` (de `v_orders_visits_assets`; conferir nome no banco vivo); remove o bloco de `r2Service.deleteFiles` com o caminho `companies/{o_company_id}/{asset_id}`; depois do `delete` da linha de `orders_visits_assets` e do `updateVisitAssetsAmount`, chama a limpeza para cada lado com a pasta gravada ou, se nula, `companies/{o_provider_company_id}/assets/{asset_id}`.

- [ ] **Step 1: Testes:** limpeza chamada **depois** do delete da linha (ordem dos mocks); pasta = `before_img_file_path` quando existe; pasta padrão com `/assets/` quando nula; delete da linha falha → nenhuma limpeza; nenhum `deleteFiles` com o caminho antigo.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `fix(fotos): remover ativo da visita apaga as fotos no caminho certo e depois do banco`.

---

### Task 4: Exclusão de visita e foto do checklist passam pela checagem

**Files:**
- Modify: `services/orders/visitsService.ts` (`collectVisitFilePaths` ~5124 e o trecho de apagar após o soft delete ~5105; `removeChecklistImage` ~4158)
- Modify: `services/core/maintenancePlansService.ts` (`removeChecklistImage` ~570) — o que o `dataService` de fato expõe; se os dois estão em uso, os dois
- Test: `services/orders/visitsService.deleteVisitFiles.test.ts`

**Interfaces:**
- Consumes: `photoCleanupService.deleteUnreferencedPhotos` (Task 2).
- Produces: exclusão de visita continua devolvendo `filesFailed` (agora = soma de `failed`).

Regra: as fotos dos ativos da visita (relatório e checklist) só apagam o que a função disser que está livre. Como a visita é soft delete e a função conta linhas `is_deleted`, **a exclusão de visita deixa de apagar fotos de ativos** (ficam para o script, se a exclusão for definitiva no futuro). Demais arquivos da visita (fora de `companies/*/assets/*`) seguem como hoje.

- [ ] **Step 1: Testes:** exclusão de visita não chama `deleteFile` para chaves em `companies/*/assets/*` e continua apagando as demais; `removeChecklistImage` grava o banco e depois chama `deleteUnreferencedPhotos(pasta, [fileName])` em vez de `deleteFiles` direto.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `fix(fotos): exclusão de visita e checklist não apagam foto ainda referenciada`.

---

### Task 5: Script de órfãos antigos

**Files:**
- Create: `utils/r2OrphanPhotos.ts` (lógica pura)
- Test: `utils/r2OrphanPhotos.test.ts`
- Create: `scripts/r2-orphan-photos.ts`
- Modify: `package.json` (script `"r2:orphans": "npx tsx scripts/r2-orphan-photos.ts"`)

**Interfaces:**
- Consumes: `fc_r2_unreferenced_photos` (Task 1), `addVariantToPath`.
- Produces:
  ```ts
  export interface R2Object { key: string; size: number; lastModified: Date }
  export interface PhotoGroup { folder: string; name: string; keys: string[]; bytes: number; newest: Date }
  export function groupPhotoObjects(objects: R2Object[]): PhotoGroup[];   // agrupa original + .thumb + .medium; ignora chaves fora de companies/*/assets/*/<arquivo>
  export function isOldEnough(group: PhotoGroup, now: Date, minAgeDays: number): boolean; // newest <= now - minAgeDays
  ```

Script: lê `VITE_R2_ACCOUNT_ID`, `VITE_R2_ACCESS_KEY_ID`, `VITE_R2_SECRET_ACCESS_KEY`, `VITE_R2_BUCKET_NAME`, `VITE_SUPABASE_URL` do `.env.local` e `SUPABASE_SERVICE_ROLE_KEY` só do ambiente; lista com `ListObjectsV2` (paginado, prefixo `companies/`); agrupa; por pasta chama a função em lotes de 500 nomes; escreve `r2-orphan-photos-<data>.csv` (pasta, nome, chaves, KB, mais novo, "apagaria"/"recente") e imprime totais. `--apply` apaga com `DeleteObjects` em lotes de 1000 só os grupos livres e antigos.

- [ ] **Step 1: Testes da lógica pura:** `a.webp`, `a.thumb.webp`, `a.medium.webp` → 1 grupo com 3 chaves e soma dos tamanhos; variante sem original → grupo com nome normalizado; chave `companies/1/orders/9/x.webp` ignorada; `isOldEnough` com 7 dias: 8 dias atrás → true, 6 dias → false, grupo com uma variante recente → false.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar `utils/r2OrphanPhotos.ts` e o script. **Step 4:** PASS.
- [ ] **Step 5:** Pedir ao usuário para rodar `SUPABASE_SERVICE_ROLE_KEY=… npm run r2:orphans` (simulação), revisar o CSV por amostragem (abrir 5 fotos "apagaria" e confirmar que não aparecem em nenhum relatório/capa) e só então decidir rodar `-- --apply`.
- [ ] **Step 6:** Commit `feat(scripts): r2:orphans lista e apaga fotos órfãs antigas do R2`; atualizar o status em `docs/PLANO_LIMPEZA_FOTOS_R2.md`.
