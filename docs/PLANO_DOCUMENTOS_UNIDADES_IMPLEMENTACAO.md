# Documentos das Unidades — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biblioteca de PDFs por unidade (tipo, título, data, validade), com consulta, download e cadastro de tipos, em que só quem tem permissão inclui e exclui.

**Architecture:** Duas tabelas novas com RLS e gatilho de proteção; arquivos no R2 pelo worker `r2-files`, que passa a recusar exclusão e sobrescrita nesses caminhos; serviço próprio exposto pelo `dataService`; seção "Documentos" na tela da unidade e tela de tipos em Ajustes.

**Tech Stack:** React 19 + TypeScript, TanStack Query, Supabase (SQL aplicado à mão), Cloudflare Worker + R2, Jest + Testing Library.

**Spec:** [PLANO_DOCUMENTOS_UNIDADES.md](PLANO_DOCUMENTOS_UNIDADES.md)

## Global Constraints

- Textos, comentários e docs em português; imports relativos no app.
- Só funciona com internet: **nenhuma** entrada em `services/offline/`.
- Somente PDF; limite `getMaxUploadBytes()` (25 MB com o worker).
- Caminho no R2: `companies/<units.company_id>/units/<unitId>/documents/<Date.now()>-<6 aleatórios>.pdf`.
- Permissões: rotas `units_documents` e `settings_units_documents_types`. Incluir e excluir exigem permissão **na tela e no banco**; editar também. Ver a unidade (`units`) permite só consultar e baixar.
- Exclusão sempre lógica (`is_deleted`); o arquivo permanece no R2.
- Datas na tela com `formatDateInBrazil`; "hoje" com `getBrazilDateInputValue()`. Nunca `toLocale*String`.
- Leituras com `useQuery`; método novo no `dataService` no formato `nome: (...args: Parameters<typeof svc.nome>): ReturnType<typeof svc.nome> => svc.nome(...args)`.
- Antes de cada commit: `npx tsc --noEmit && npm test && npm run lint:eslint` sem erros (o `tsc` leva mais de 2 min). Commits terminam com a linha `Co-Authored-By` da sessão.

## Review Focus

1. `UPDATE` que a RLS não casa volta sem erro no Supabase → a tela não pode dizer "salvo/excluído" (Tarefa 4).
2. Envio ao R2 dá certo e o `insert` falha → erro visível; o app não tenta apagar o arquivo (o worker recusa) (Tarefa 4).
3. Arquivo `.PDF` maiúsculo ou com `type` vazio (comum no Android) é aceito; `foto.pdf.jpg` é recusado (Tarefa 3).
4. Validade igual a hoje **não** está vencida; validade anterior à data do documento é recusada no formulário e no banco (Tarefas 1, 3 e 6).
5. A proteção do arquivo só vale se o app publicado usa o worker (`useWorker()` em `services/media/r2Service.ts`); com chaves R2 no cliente ela é contornável — conferir o `.env` de produção na publicação (Tarefa 2).

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `dev/supabase/migrations/20261205_create_units_documents.sql` (+ `_DOWN`) | tabelas, rotas, RLS, gatilhos |
| `workers/r2-files/src/index.ts` (+ `index.test.ts`) | recusar exclusão/sobrescrita de documentos |
| `utils/unitDocuments.ts` (+ teste) | regras puras: arquivo, vencimento, filtro |
| `services/units/unitDocumentsService.ts` (+ teste) | acesso a dados e envio |
| `types/index.ts`, `services/dataService.ts` | tipos e fachada |
| `views/Settings/UnitDocumentTypes/UnitDocumentTypesList.tsx` (+ teste) | cadastro de tipos |
| `components/units/UnitDocumentsSection.tsx`, `UnitDocumentFormModal.tsx` (+ teste) | seção na unidade |

---

### Task 1: Migration

**Files:** Create `dev/supabase/migrations/20261205_create_units_documents.sql` e `..._DOWN.sql`. Modelos: `20261104_create_assets_available_integrations.sql` (rotas, `setval` de `cfg_routes`, RLS) e `20261108_add_users_img_face_verified.sql` (cabeçalho).

**Interfaces — Produces:**
- `cfg_units_documents_types(id bigint identity PK, description varchar(120) NOT NULL, is_deleted boolean NOT NULL DEFAULT false, created_at, updated_at timestamp)`; índice único em `lower(description)` onde `is_deleted = false`.
- `units_documents(id bigint identity PK, unit_id bigint NOT NULL FK units, type_id bigint NOT NULL FK cfg_units_documents_types, title varchar(200) NOT NULL, document_date date NOT NULL, expires_at date, file_path text NOT NULL, file_name text NOT NULL, original_file_name text NOT NULL, file_size_bytes bigint NOT NULL, created_at, created_user_id, updated_at, updated_user_id, is_deleted boolean NOT NULL DEFAULT false, deleted_at, deleted_user_id)`; `CHECK (expires_at IS NULL OR expires_at >= document_date)`; `CHECK (btrim(title) <> '')`; índice `(unit_id) WHERE is_deleted = false`.

- [ ] **Step 1: Escrever a migration** (transação, idempotente, horários `timezone('America/Sao_Paulo', now())`):
  - tabelas acima e carga `Desenho, Planta, Diagrama, Laudo, Análise de risco, Outros` (só se não existir a descrição);
  - rotas em `cfg_routes`, `ON CONFLICT (route_key) DO NOTHING`: `units_documents` (path `/units/documents`, descrição "Documentos das Unidades", ícone `picture_as_pdf`, pai = rota `units`) e `settings_units_documents_types` (path `/settings/unit-document-types`, "Tipos de Documento (Unidades)", ícone `description`, pai = rota `settings`);
  - RLS ligada, `REVOKE ALL ... FROM anon`, `GRANT SELECT, INSERT, UPDATE ... TO authenticated` (sem DELETE). Políticas com `fc_has_route_permission`:

| Tabela | SELECT | INSERT | UPDATE |
|---|---|---|---|
| `units_documents` | `('units','view')` | `('units_documents','create') AND is_deleted = false` | `('units_documents','edit') OR ('units_documents','delete')` |
| tipos | `true` | `('settings_units_documents_types','create')` | `... 'edit' OR ... 'delete'` |

  - gatilho `BEFORE INSERT OR UPDATE` em cada tabela (`fc_units_documents_guard`, `fc_units_documents_types_guard`, `SECURITY DEFINER`, `search_path = public, pg_temp`):
    - com `auth.uid()` nulo (SQL Editor, service_role) não restringe;
    - preenche os `*_user_id` a partir de `users.uuid = auth.uid()` e os `*_at`, ignorando o que o cliente mandar;
    - mudança em `is_deleted` sem permissão `delete` → `RAISE EXCEPTION 'Sem permissão para excluir'`;
    - mudança em `type_id`, `title`, `document_date`, `expires_at` (ou `description`) sem permissão `edit` → `'Sem permissão para editar'`;
    - em `units_documents`, mudar `unit_id`, `file_path`, `file_name`, `original_file_name`, `file_size_bytes` → `'O arquivo de um documento não pode ser trocado'`.
  - `NOTIFY pgrst, 'reload schema';` e, em comentário, consultas de conferência (políticas, rotas).
- [ ] **Step 2: Escrever o `_DOWN`** — apaga gatilhos, funções, tabelas e as duas rotas (e suas linhas em `cfg_profiles_access`); comentário avisando que os registros são perdidos.
- [ ] **Step 3: Conferir** com o usuário que `units`, `cfg_routes` e `fc_has_route_permission` existem como esperado (o `schema.sql` pode estar defasado). O usuário aplica no SQL Editor; resultado esperado: `Success`, 2 rotas novas, 6 tipos.
- [ ] **Step 4: Commit** — `feat(db): tabelas, permissões e RLS dos documentos das unidades`

### Task 2: Worker `r2-files`

**Files:** Modify `workers/r2-files/src/index.ts`; Create `workers/r2-files/src/index.test.ts`.

**Interfaces — Produces:** nos caminhos `^companies/\d+/units/\d+/documents/`: `DELETE` → 403; `PUT` ou destino de `/copy` já existente → 409. Demais caminhos inalterados.

- [ ] **Step 1: Teste que falha.** `env` falso com `BUCKET = { head, put, delete, get }` (jest.fn), `ALLOWED_ORIGINS: ''`; `global.fetch` mockado devolvendo `{ id: 'u' }` em `/auth/v1/user` e `[{ id: 1 }]` em `/rest/v1/users`. Um token diferente por teste (há cache).

```ts
const DOC = 'companies/1/units/9/documents/a.pdf';
it('não apaga documento de unidade', async () => {
  const res = await call('DELETE', DOC);
  expect(res.status).toBe(403);
  expect(env.BUCKET.delete).not.toHaveBeenCalled();
});
it('não sobrescreve documento existente', async () => {
  env.BUCKET.head.mockResolvedValue({});
  expect((await call('PUT', DOC)).status).toBe(409);
  expect(env.BUCKET.put).not.toHaveBeenCalled();
});
it('grava documento novo', async () => {
  env.BUCKET.head.mockResolvedValue(null);
  expect((await call('PUT', DOC)).status).toBe(200);
});
it('cópia para cima de documento existente é recusada', async () => {
  env.BUCKET.head.mockResolvedValue({});
  expect((await copy('companies/1/x.pdf', DOC)).status).toBe(409);
});
it('outros caminhos continuam apagáveis', async () => {
  expect((await call('DELETE', 'companies/1/assets/2/f.jpg')).status).toBe(200);
});
```
`call(method, key)` faz `worker.fetch(new Request('https://w/objects/' + key, ...))` com `Authorization` e, no PUT, `Content-Length: 3` e corpo.

- [ ] **Step 2:** `npx jest --config jest.config.cjs workers/r2-files` → FALHA (403/409 não acontecem).
- [ ] **Step 3: Implementar** `isUnitDocumentKey(key: string): boolean` e `assertCanOverwrite(key: string, env: Env): Promise<void>` (usa `env.BUCKET.head`, acrescentar `head` ao tipo mínimo do bucket); chamar em `handleUpload`, `handleCopy` e no ramo `DELETE`. Mensagens: `Documentos da unidade não podem ser apagados` / `Documento já existe`. Atualizar o comentário "Regras de caminho".
- [ ] **Step 4:** mesmo comando → PASSA.
- [ ] **Step 5: Commit** — `feat(worker): documentos de unidade não podem ser apagados nem sobrescritos`
- [ ] **Step 6: Publicar (com o usuário):** `npx wrangler deploy -c workers/r2-files/wrangler.toml`; conferir que o `.env` de produção usa o worker e não tem chaves R2 (Review Focus 5).

### Task 3: Regras puras

**Files:** Create `utils/unitDocuments.ts`, `utils/unitDocuments.test.ts`.

**Interfaces — Produces:**
```ts
validatePdfFile(file: { name: string; type: string; size: number }, maxBytes: number | null): string | null; // null = ok
titleFromFileName(name: string): string;              // sem extensão, "_" vira espaço, aparado, até 200
isDocumentExpired(expiresAt: string | undefined | null, today: string): boolean; // YYYY-MM-DD
filterUnitDocuments<T extends { typeId: string; title: string }>(docs: T[], f: { typeId: string; search: string }): T[];
formatFileSize(bytes: number): string;                // "800 KB", "2,4 MB"
```

- [ ] **Step 1: Testes que falham**

```ts
const MB = 1024 * 1024;
expect(validatePdfFile({ name: 'PLANTA.PDF', type: '', size: 10 }, 25 * MB)).toBeNull();
expect(validatePdfFile({ name: 'foto.pdf.jpg', type: 'image/jpeg', size: 10 }, null)).toBe('Envie um arquivo PDF.');
expect(validatePdfFile({ name: 'a.pdf', type: 'application/pdf', size: 0 }, null)).toBe('O arquivo está vazio.');
expect(validatePdfFile({ name: 'a.pdf', type: 'application/pdf', size: 30 * MB }, 25 * MB))
  .toBe('O arquivo tem 30,0 MB; o limite é 25,0 MB.');
expect(titleFromFileName('laudo_spda_2026.pdf')).toBe('laudo spda 2026');
expect(isDocumentExpired('2026-11-26', '2026-11-26')).toBe(false);
expect(isDocumentExpired('2026-11-25', '2026-11-26')).toBe(true);
expect(isDocumentExpired(undefined, '2026-11-26')).toBe(false);
const docs = [{ typeId: '1', title: 'Análise de Risco' }, { typeId: '2', title: 'Planta baixa' }];
expect(filterUnitDocuments(docs, { typeId: '', search: 'analise' })).toEqual([docs[0]]);
expect(filterUnitDocuments(docs, { typeId: '2', search: '' })).toEqual([docs[1]]);
expect(formatFileSize(819200)).toBe('800 KB');
expect(formatFileSize(2.4 * MB)).toBe('2,4 MB');
```
- [ ] **Step 2:** `npx jest --config jest.config.cjs utils/unitDocuments` → FALHA.
- [ ] **Step 3: Implementar** (busca sem acento: `normalize('NFD')` removendo `\p{Diacritic}`).
- [ ] **Step 4:** mesmo comando → PASSA.
- [ ] **Step 5: Commit** — `feat(unidades): regras de documentos (arquivo, vencimento, filtro)`

### Task 4: Serviço e fachada

**Files:** Create `services/units/unitDocumentsService.ts` e `.test.ts`; Modify `types/index.ts`, `services/dataService.ts`.

**Interfaces — Consumes:** tabelas (Task 1); `r2Service.uploadFile(file, path, onProgress)`.
**Produces** (em `types/index.ts`):
```ts
export interface UnitDocumentType { id: string; description: string; isDeleted: boolean }
export interface UnitDocumentFields { typeId: string; title: string; documentDate: string; expiresAt?: string | null }
export interface UnitDocument extends UnitDocumentFields {
  id: string; unitId: string; typeDescription: string; filePath: string; fileName: string;
  originalFileName: string; fileSizeBytes: number; createdAt: string;
}
```
Métodos de `unitDocumentsService`, todos com proxy de mesmo nome no `dataService`:
```ts
getUnitDocumentTypes(): Promise<UnitDocumentType[]>;      // não excluídos, por descrição
createUnitDocumentType(description: string): Promise<void>;
updateUnitDocumentType(id: string, description: string): Promise<void>;
deleteUnitDocumentType(id: string): Promise<void>;
getUnitDocuments(unitId: string): Promise<UnitDocument[]>; // não excluídos; document_date desc, id desc
uploadUnitDocument(unitId: string, fields: UnitDocumentFields, file: File, onProgress?: (p: number) => void): Promise<void>;
updateUnitDocument(id: string, fields: UnitDocumentFields): Promise<void>;
deleteUnitDocument(id: string): Promise<void>;
```
Regras: `getUnitDocuments` traz `cfg_units_documents_types(description)` **sem** `!inner` e sem filtrar tipo excluído; `uploadUnitDocument` lê `units.company_id` (sem ele: erro `Unidade sem empresa cadastrada.`), envia ao R2 e insere (`file_path` = pasta, `file_name` = nome); todo `update` termina em `.select('id')` e lança `Nada foi alterado: sem permissão ou registro inexistente.` se voltar vazio; descrição repetida (erro `23505`) vira `Já existe um tipo com essa descrição.`.

- [ ] **Step 1: Testes que falham** (mock de `../core/supabase` e `../media/r2Service`, no estilo de `services/orders/visitsService.editVisitTimes.test.ts`; um `chain(result)` encadeável e "thenable" para o `from`):
  - `mapeia o documento` — linha com `type_id: 2`, `cfg_units_documents_types: { description: 'Laudo' }`, `expires_at: null` → `{ typeId: '2', typeDescription: 'Laudo', expiresAt: undefined }` e filtro `is_deleted = false`.
  - `envia para o caminho da empresa e da unidade` — `company_id: 3`, unidade `'9'` → `uploadFile` chamado com caminho `^companies/3/units/9/documents/\d+-[a-z0-9]{6}\.pdf$`.
  - `não insere se o envio falhar` — `uploadFile` rejeita → `insert` não chamado.
  - `insert falhou: erro sobe e nada é apagado` — rejeita com o erro; `r2Service.deleteFile` não chamado.
  - `exclusão que não casa linha é erro` — `update(...).select` devolve `[]` → rejeita `Nada foi alterado`; o payload foi `{ is_deleted: true }`.
- [ ] **Step 2:** `npx jest --config jest.config.cjs services/units/unitDocuments` → FALHA.
- [ ] **Step 3: Implementar** serviço, tipos e os 8 proxies.
- [ ] **Step 4:** mesmo comando → PASSA; `npx tsc --noEmit` sem erros.
- [ ] **Step 5: Commit** — `feat(unidades): serviço de documentos e tipos`

### Task 5: Tipos de documento em Ajustes

**Files:** Create `views/Settings/UnitDocumentTypes/UnitDocumentTypesList.tsx` e `.test.tsx`; Modify `app/routes.tsx`, `views/Settings/SettingsRouter.tsx`, `views/Settings/AppSettings.tsx`, `App.tsx`.

**Interfaces — Consumes:** métodos de tipos (Task 4), `usePermissions`. **Produces:** `UnitDocumentTypesList: React.FC`; tela `'unit-document-types'`.

Uma tela só: lista com busca; formulário em `Modal` (campo "Descrição", obrigatório); excluir com `ConfirmDeleteModal`; chave de consulta `['unit-document-types']`, invalidada após gravar. Botões conforme `canCreate/canEdit/canDelete('settings_units_documents_types')`; sem `canView`, mostrar "Sem permissão para ver os tipos de documento.". Erros em `toast.error` com a mensagem do serviço.

- [ ] **Step 1: Testes que falham** (mocks de `dataService` e `PermissionsContext`):
  - lista os tipos; sem permissões não há "Adicionar", "Editar" nem "Excluir";
  - com `create`: salvar `"  Memorial "` chama `createUnitDocumentType('Memorial')`; vazio não chama;
  - com `delete`: confirmar chama `deleteUnitDocumentType(id)`; erro do serviço aparece no toast.
- [ ] **Step 2:** `npx jest --config jest.config.cjs UnitDocumentTypes` → FALHA.
- [ ] **Step 3: Implementar** a tela e ligá-la: lazy em `app/routes.tsx`; `SETTINGS_SCREENS` e `case` em `SettingsRouter.tsx`; em `App.tsx` incluir `'unit-document-types'` no tipo `Screen`, no título (`'Tipos de Documento'`) e no mesmo tratamento de voltar de `'unit-types'`. Em `AppSettings.tsx`, `SettingItem` (ícone `description`, título "Documentos de Unidade", subtítulo "Tipos de documento") num bloco logo após "Unidades", **fora** do `isSuperAdmin`, visível com `canView('settings_units_documents_types')`.
- [ ] **Step 4:** teste → PASSA; `npx tsc --noEmit` sem erros.
- [ ] **Step 5: Commit** — `feat(ajustes): cadastro de tipos de documento de unidade`

### Task 6: Seção Documentos na unidade

**Files:** Create `components/units/UnitDocumentsSection.tsx`, `UnitDocumentFormModal.tsx`, `UnitDocumentsSection.test.tsx`; Modify `views/Settings/Clients/Units/UnitView.tsx` (logo antes do comentário `{/* Assets Modal */}`).

**Interfaces — Consumes:** Tasks 3 e 4; `useNetworkStatus().isConnected`; `r2Service.downloadFile(path)`; `FileUtils.downloadFile(blob, nome)`.
**Produces:**
```ts
UnitDocumentsSection: React.FC<{ unitId: string }>
UnitDocumentFormModal: React.FC<{ isOpen: boolean; unitId: string; types: UnitDocumentType[];
  document?: UnitDocument; onClose: () => void; onSaved: () => void }>
```
Comportamento (textos exatos):
- Título "Documentos"; consultas `['unit-documents', unitId]` e `['unit-document-types']`, `enabled: isConnected`.
- Sem internet: só "Os documentos exigem conexão com a internet.". Vazio: "Nenhum documento nesta unidade.". Filtro sem resultado: "Nenhum documento encontrado.". Erro de leitura: "Não foi possível carregar os documentos." com "Tentar de novo".
- Item: título, tipo, data, tamanho; "Válido até dd/mm/aaaa" ou selo "Vencido".
- Ações com `aria-label` "Abrir", "Baixar" (sempre), "Editar" (`canEdit`), "Excluir" (`canDelete`); botão "Adicionar" (`canCreate`), todas em `units_documents`.
- Baixar: `downloadFile` do R2 → `FileUtils.downloadFile(blob, originalFileName)`. Abrir: na web, abrir a aba **antes** do `await` (senão o navegador bloqueia) e apontá-la para `URL.createObjectURL` do blob com tipo `application/pdf`; no app nativo, igual a Baixar. Falha: toast "Não foi possível abrir o documento.".
- Formulário: campos "Arquivo PDF" (só na inclusão), "Tipo", "Título" (preenchido por `titleFromFileName` se vazio), "Data do documento", "Validade (opcional)"; botão "Salvar" desabilitado durante o envio, com progresso em %. Validações: `validatePdfFile(file, getMaxUploadBytes())`; obrigatórios → "Preencha tipo, título e data do documento."; validade menor → "A validade não pode ser anterior à data do documento.". Na edição de documento cujo tipo foi excluído, o tipo atual continua na lista de opções. Falha no envio mantém o modal aberto com o que foi digitado.
- Excluir: `ConfirmDeleteModal` com o título do documento.
- A seção usa `useBackToClose` indiretamente pelo `Modal`; nada de listener próprio do botão voltar.

- [ ] **Step 1: Testes que falham** (`jest.useFakeTimers` não é necessário; fixar "hoje" mockando `getBrazilDateInputValue` para `'2026-11-26'`):
  - sem permissão: lista aparece com "Abrir" e "Baixar", sem "Adicionar", "Editar", "Excluir";
  - com permissões: os três aparecem;
  - offline: mostra a mensagem e `getUnitDocuments` não é chamado;
  - documento com validade `2026-11-25` mostra "Vencido"; `2026-11-26` não;
  - "Baixar" chama `r2Service.downloadFile('pasta/arquivo.pdf')` e `FileUtils.downloadFile(blob, 'laudo.pdf')`;
  - formulário: validade anterior à data → mensagem e `uploadUnitDocument` não chamado;
  - excluir confirmado chama `deleteUnitDocument(id)`; erro mostra toast e o item continua.
- [ ] **Step 2:** `npx jest --config jest.config.cjs UnitDocumentsSection` → FALHA.
- [ ] **Step 3: Implementar** os dois componentes (reusar `Modal`, `Input`, `Select`, `SearchInput`, `ConfirmDeleteModal`, `Loading`) e inserir `<UnitDocumentsSection unitId={unit.id} />` na `UnitView`.
- [ ] **Step 4:** teste → PASSA; `npx tsc --noEmit && npm test && npm run lint:eslint`.
- [ ] **Step 5: Commit** — `feat(unidades): seção de documentos na tela da unidade`
- [ ] **Step 6: Conferência manual** (migration aplicada, worker publicado, permissões concedidas em Perfis): enviar, abrir, baixar na web e no Android, editar, excluir; entrar com perfil sem permissão e confirmar que não há botões de incluir/excluir.

## Publicação (ordem)

1. Aplicar a migration. 2. Publicar o worker. 3. Publicar o app (web/APK). 4. Conceder as permissões aos perfis.
