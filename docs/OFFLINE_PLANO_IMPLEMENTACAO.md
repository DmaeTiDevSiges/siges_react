# Modo offline em campo — plano de implementação (F1 a F5)

Complementa [OFFLINE_MODO_CAMPO.md](OFFLINE_MODO_CAMPO.md) (decisões, inventário, migrations da F0).
Estimativa total: **6 a 7 semanas, 1 dev**. Cada fase termina num APK testável e
pode ir para produção com a flag desligada sem afetar ninguém.

**Situação (10/11/2026):** migrations **20261116, 20261117, 20261118 e 20261122 aplicadas** no Supabase
(informado pelo usuário). Falta conferir a trava com usuários reais e rodar o portão no aparelho.

**Situação anterior (09/11/2026):**
- F1–F4 com código pronto (08/11). Em 09/11 entraram também: **incluir veículo** e
  **incluir/remover membro da equipe** offline (F4) e a **etapa 1 do
  [preparo automático](#preparo-automático-decisões-de-09112026)** (download sem o técnico tocar
  em nada + barra de progresso + trava opção (a)). Testes de `services/offline`: 80 passando;
  `tsc` do app inteiro em conferência.
- **Próximo passo:** [portão de validação no aparelho](#-portão-de-validação--f1-a-f4-no-aparelho-antes-da-f5),
  agora incluindo a etapa 1. Depois: etapa 2 (incluir ativo offline) → F5 → etapa 3 (iniciar visita offline).

---

## 0. Pré-requisitos (antes da F1)

| Item | Responsável | Como conferir |
|------|-------------|---------------|
| Aplicar migrations 20261116 → 20261117 → 20261118 | Usuário (SQL Editor) | Consultas de conferência no fim de cada arquivo |
| Testar `ov_asset_lock` com um técnico e `ov_asset_unlock(id, true)` com um gestor reais | Usuário + dev | Retorno `locked: true` / `forced: true` (confirma RLS) |
| Confirmar plugin SQLite compatível com Capacitor 8 | Dev (dia 1 da F1) | `@capacitor-community/sqlite` instala e abre banco no emulador. **Plano B:** IndexedDB via Dexie |

## Decisões de escopo deste plano

- **Offline só no APK Android** (`Capacitor.isNativePlatform()`). A web continua online — evita
  SQLite em WASM e mantém o desenvolvimento simples. Desenvolvimento/testes no emulador.
- **Offline ativo** = `isOfflineModeEnabled()` **e** plataforma nativa. Os dados chegam pelo
  **preparo automático** (09/11/2026); o "Preparar para campo" manual continua como "atualizar
  agora" e para reservar ativos. Fora disso, o `dataService` se comporta exatamente como hoje.
- **Jest** usa um store em memória (mesma interface do SQLite) — a lógica da fila é testada sem aparelho.

## Estrutura de arquivos (nova)

```text
services/offline/
  offlineConfig.ts         isOfflineActive(visitId?) — flag + nativo + visita preparada
  store/
    offlineStore.ts        interface: get/put/delete/list por coleção + transação
    sqliteStore.ts         implementação nativa (@capacitor-community/sqlite)
    memoryStore.ts         implementação para Jest
  offlineCache.ts          cachedRead(chave, buscador): rede quando online, cache quando não
  fieldPackageService.ts   "Preparar para campo": baixa e trava, mede tamanho, data do pacote
  outbox.ts                fila: enfileirar, listar, estados, dependências, tmp→id real
  syncEngine.ts            dispara ao reconectar; renova sessão; envia em ordem; backoff
  operations/              um arquivo por tipo de operação:
    <tipo>.ts                applyLocal(store, payload)  → atualiza o cache p/ a tela
                             push(payload)               → chama o RPC no servidor
                             onSuccess(store, resposta)  → troca tmp id, limpa pendência
  offlineFiles.ts          fotos/assinaturas no Filesystem (Directory.Data)
  offlineAuth.ts           sessão + perfil + permissões em cache
hooks/useOfflineStatus.ts  online?, visita preparada?, pendências, conflitos
components/offline/        OfflineBadge, PendingSeal (selo "não enviado"), LockBanner
views/Offline/PendingOpsScreen.tsx   tela de pendências/conflitos (+ rota lazy)
```

Regra do projeto mantida: views continuam chamando **só o `dataService`**. Os métodos da
visita passam a delegar para `services/offline/*` quando `isOfflineActive()`.

### Modelo de dados local

Documentos JSON por coleção (não um espelho das tabelas):

| Coleção | Chave | Conteúdo |
|---------|-------|----------|
| `visit` | ovId | retorno de `getActiveOrderVisit` + equipe + gestores |
| `ova` | ovaId | retorno de `getOrderVisitAssetById` (+ trava: `lock_token`) |
| `ova_list` | ovId | `getOrderVisitAssets` |
| `ova_activities` / `ova_materials` / `ova_checklist` | ovaId | listas |
| `ov_services` / `ov_vehicles` | ovId | listas |
| `lookup` | nome (ex.: `assetStatuses`, `activitiesByType:12`) | listas de apoio |
| `package` | ovId | data do download, tamanho, ativos travados |
| `outbox` | opId | operação (tipo, payload, depende de, estado, tentativas, erro) |
| `profile` | `me` | usuário atual + permissões |

Item criado offline recebe id local `tmp:<offline_uuid>`; operações seguintes referenciam o
`offline_uuid`, e o servidor resolve. Após o envio, `onSuccess` troca `tmp:` pelo id real no cache.

---

## F1 — Abrir e consultar a visita sem internet (1,5 semana) — ✅ código pronto (08/11/2026), falta testar no aparelho

### Como ficou (diferenças do plano original)

| Item | Plano | Implementado | Por quê |
|------|-------|--------------|---------|
| 1.3 Store | SQLite | `@capacitor/filesystem` (1 JSON por documento em `Directory.Data`) atrás da interface `OfflineStore` | Sem plugin nativo novo; volume pequeno (1 visita). SQLite 8.1.1 é compatível e entra trocando só a implementação, se a F2 precisar |
| 1.4 Cache | `cachedRead` nos métodos | `installOfflineLayer(dataService)` envolve os 37 métodos de leitura e os 41 de gravação de uma vez, no fim de `services/dataService.ts` | Nenhuma view precisou mudar para o cache |
| Falha de rede "engolida" | — | `createTrackingFetch` no cliente Supabase conta falhas; o cache não grava o `[]` de uma queda por cima do dado bom | Os serviços devolvem `[]`/`null` em erro em vez de lançar |
| 1.5 Fotos | baixar miniaturas | **adiado para a F3** | Offline as fotos aparecem só se já estiverem no cache do WebView |
| 1.7 Indicador | cabeçalho | Cartão "Modo campo" na aba inicial da visita (online: preparar/atualizar; offline: aviso com a data do pacote) | O cabeçalho já tem indicador de conexão |
| 1.8 Botões | desabilitar cada botão | Toda gravação da visita offline é recusada na camada com aviso "Sem internet…" | Um ponto só, cobre todas as telas |
| Web | fora | Liga também em `npm run dev` (localStorage) para testar com DevTools → Offline | Web de produção continua sem offline |

### Arquivos

- `services/offline/` — `offlineConfig.ts`, `offlineLayer.ts`, `readCache.ts` (+ `readCache.test.ts`, 22 testes), `networkFailures.ts`, `offlineAuth.ts`, `fieldPackageService.ts`, `store/{offlineStore,memoryStore,filesystemStore,localStorageStore}.ts`
- `components/offline/FieldPackageCard.tsx`, `hooks/useAssetLock.ts`
- Alterados: `services/dataService.ts` (proxies da trava + instalação da camada), `services/orders/visitsService.ts` (`lockOrderVisitAsset`, `unlockOrderVisitAsset`, `getOrderVisitAssetsLocks`), `services/users/usersService.ts` (login offline; logout limpa os dados offline), `services/core/supabase.ts` (fetch com contador + `readStoredSessionUserId`), `services/core/networkService.ts` (`isInitialized`), `App.tsx` (perfil guardado se a carga estourar o tempo), `views/OrderVisit/OrderVisitScreen.tsx`, `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx`, `types/index.ts`

### Como testar

1. `.env.local` (ou `.env.android`): `VITE_FEATURE_OFFLINE_MODE=true`; migrations 20261116–18 aplicadas.
2. Navegador: `npm run dev` → abrir a visita → **Preparar** → DevTools › Network › **Offline** → recarregar.
   APK: `npm run build:android` → preparar com Wi-Fi → modo avião → fechar e reabrir o app.
3. Conferir os critérios de aceite abaixo.

### Itens (plano original)

**Objetivo:** técnico com a visita preparada abre o app em modo avião, entra na visita e vê
tudo (ativos, atividades, checklist, materiais, serviços, veículos, fotos já baixadas).
Edição ainda bloqueada offline (aviso "disponível na próxima versão").

| # | Tarefa | Arquivos |
|---|--------|----------|
| 1.1 | **Login offline:** `getCurrentUser` com erro de rede + sessão local (`supabase.auth.getSession()`) → devolve perfil do cache. `AuthContext` não zera o usuário por erro de rede | `services/users/usersService.ts`, `contexts/AuthContext.tsx`, `services/offline/offlineAuth.ts` |
| 1.2 | Permissões em cache (última versão boa) | `contexts/PermissionsContext.tsx` |
| 1.3 | Store SQLite + memória, interface e migrations locais (versão do esquema local) | `services/offline/store/*` |
| 1.4 | `cachedRead` nos métodos do grupo A do inventário (≈35) | `services/dataService.ts`, `services/offline/offlineCache.ts` |
| 1.5 | **"Preparar para campo"** na visita: escolhe ativos → `ov_asset_lock` em cada → baixa grupo A → baixa miniaturas das fotos existentes → mostra tamanho e data | `services/offline/fieldPackageService.ts`, botão em `views/OrderVisit/OrderVisitScreen.tsx` |
| 1.6 | **Trava ao abrir o ativo** (online, flag ligada): travado por outro → modo leitura + `LockBanner` "travado por Fulano"; gestor vê "Liberar" | `OrderVisitAssetReport.tsx`, `components/offline/LockBanner.tsx`, `dataService` (`lockOrderVisitAsset`, `unlockOrderVisitAsset`) |
| 1.7 | Indicador no cabeçalho: "Offline · pacote de 08/11 14:32" | `components/shell/Header.tsx`, `hooks/useOfflineStatus.ts` |
| 1.8 | Botões do grupo F desabilitados offline com aviso | views da visita |

**Aceite:**
- Modo avião → fechar app → abrir: continua logado, abre a visita preparada, navega em todos os ativos.
- Visita não preparada offline: mensagem clara, sem tela em branco ou spinner infinito.
- Dois técnicos: o segundo vê "travado por" e não edita; gestor libera e o segundo consegue travar.
- Flag desligada: nenhuma mudança de comportamento (comparar fluxo atual).

**Testes:** Jest para `cachedRead`, `offlineAuth`, `fieldPackageService` (store em memória, Supabase mockado).

---

## F2 — Fila e sincronização: gravações simples (1,5 semana) — ✅ código pronto (08/11/2026), falta testar no aparelho

### Como ficou (diferenças do plano original)

| Item | Plano | Implementado | Por quê |
|------|-------|--------------|---------|
| 2.3 `offline_ops_applied` | migration | **adiado para a F4** | As 10 operações do grupo B só DEFINEM valores — reenviar dá o mesmo resultado. A idempotência genérica só é necessária para inserts e fluxo (F4) |
| 2.4 RPCs de sync | 6 RPCs novos | **nenhum** — a fila reexecuta o **próprio método do serviço** (`originals` do offlineLayer) | Regra de negócio num lugar só, sem cópia em SQL; nenhuma migration nova nesta fase |
| Trava no envio | RPC confere `lock_token` | Antes da 1ª operação de cada ativo, o envio chama `ov_asset_lock`: com outro técnico **ou** token diferente do guardado (gestor liberou) → todas as operações do ativo viram **conflito** | Mesmo efeito, sem RPC novo |
| Persistência da fila | SQLite | `Preferences` (SharedPreferences, gravação atômica), fora do store de cache | Logout limpa o cache, **nunca** a fila; app morto no meio não perde operação |
| Ordem após erro | — | Erro/conflito num registro **segura** as pendentes seguintes do mesmo registro | "Tentar de novo" não volta valor antigo por cima do novo |
| Gravações C–F online | — | Esperam a fila esvaziar (`OfflinePendingSyncError` se sobrar pendente/erro) | "Relatar" não passa na frente de alterações não enviadas |
| 2.6 Selo | por item | Selo no relatório do ativo ("Alterações deste ativo aguardando envio") + painel da fila no cartão "Modo campo" (enviar agora, tentar de novo, descartar) | Tela de pendências completa fica na F5 |

### Arquivos

- Novos: `services/offline/outbox.ts`, `syncEngine.ts` (+ `syncEngine.test.ts`, 19 testes), `offlineOps.ts`, `offlineSync.ts`, `offlineLocks.ts`, `hooks/useOfflineSync.ts`
- Alterados: `offlineLayer.ts` (fila no grupo B, portão nas demais), `readCache.ts` (índice de chaves + `patchCachedRead*`), `offlineConfig.ts` (`isOfflinePlatform`), `fieldPackageService.ts` e `hooks/useAssetLock.ts` (guardam o token; offline: só edita o que foi reservado), `components/offline/FieldPackageCard.tsx`, `OrderVisitAssetReport.tsx`

### Quando a fila envia

Ao reconectar (networkService), ao voltar para o app (`App` resume), a cada 60 s se houver pendentes, 3 s após abrir o app, no botão "Enviar agora" e antes de qualquer gravação C–F. Falha de rede → nova tentativa em 5 s, 10 s, 20 s… até 5 min. A fila roda **mesmo com a flag desligada** (APK/dev), para esvaziar o que ficou no aparelho.

### Como testar (além da F1)

1. Visita preparada → modo avião → marcar atividades, checklist, comentários, status "depois", qtd. de material, km → aviso "alteração salva no aparelho".
2. Fechar e reabrir o app offline → as alterações continuam na tela.
3. Voltar a internet → em segundos o painel zera; conferir no banco.
4. Conflito: técnico offline edita; gestor libera o ativo no relatório; técnico volta → "Recusadas: N" → Descartar.

### Itens (plano original)

**Objetivo:** atividades, checklist, observações, status/unidade/tag "depois", progresso,
quantidades de material, km de veículo e alertas editáveis offline e enviados ao reconectar.

| # | Tarefa | Arquivos |
|---|--------|----------|
| 2.1 | `outbox.ts`: estados `pendente → enviando → ok \| erro \| conflito`, ordem FIFO por visita, dependências | `services/offline/outbox.ts` |
| 2.2 | `syncEngine.ts`: gatilho no `networkService` + botão manual; renova sessão antes; backoff 5s→10min; uma sincronização por vez; retoma se o app morrer no meio | `services/offline/syncEngine.ts` |
| 2.3 | **Migration** `offline_ops_applied(op_id uuid PK, user_id, op_type, applied_at, result jsonb)` — idempotência genérica para todos os RPCs de sync | `dev/supabase/migrations/2026xxxx_create_offline_ops_applied.sql` |
| 2.4 | **RPCs de sync (grupo B)**: cada um confere `offline_ops_applied`, `lock_token` do ativo, aplica e registra. Ex.: `sync_ova_update_v1`, `sync_ova_activity_toggle_v1`, `sync_ova_checklist_upsert_v1`, `sync_ova_material_qty_v1`, `sync_ov_vehicle_km_v1`, `sync_asset_alert_update_v1` | migration |
| 2.5 | Operações (`applyLocal` / `push` / `onSuccess`) para os 10 métodos do grupo B | `services/offline/operations/*` |
| 2.6 | Selo "não enviado" nos itens com pendência | `components/offline/PendingSeal.tsx` |
| 2.7 | Mapa de erros → estado (tabela de códigos em OFFLINE_MODO_CAMPO.md) | `syncEngine.ts` |

**Aceite:**
- Marcar 20 atividades offline → reconectar → todas no servidor, sem duplicar, na ordem.
- Matar o app durante o envio → reabrir → termina sem duplicar (idempotência).
- Gestor força a liberação da trava enquanto o técnico está offline → operações do técnico viram **conflito**, nada sobrescrito.
- Token expirado após 2h offline → sincroniza depois de renovar, sem pedir login.

**Testes:** Jest para `outbox` e `syncEngine` (ordem, retry, idempotência, conflito, app morto no meio).

---

## F3 — Fotos e assinaturas offline (1 semana) — ✅ código pronto (08/11/2026), falta testar no aparelho

### Como ficou

| Item | Implementado |
|------|--------------|
| 3.1 Captura | Offline, a foto é **comprimida na hora** (mesma compressão do envio) e salva em `Directory.Data/offline-files/<nome final>`. Guardar já comprimido define a extensão final (webp/png/jpg) e ocupa ~300 KB em vez de vários MB |
| Nome final | Gerado no aparelho e passado ao serviço (`options.fileName` em `uploadOrderVisitAssetPhoto`, `uploadChecklistImage`, `saveOrderVisitSignature`). Reenviar sobrescreve o mesmo arquivo no R2; a lista de fotos do ativo não duplica (o serviço confere antes de acrescentar) |
| Fila | Na fila vai uma **referência** ao arquivo, nunca o conteúdo (Preferences continua leve). No envio, o arquivo é reconstruído (File ou data URL) e o mesmo método do serviço sobe |
| 3.2 Exibição | `getPublicImageUrl` (imageUtils **e** a cópia no dataService) consulta primeiro o mapa nome → URL local (`offlineFileUrls.ts`); `OptimizedImage`/imgproxy reconhecem `_capacitor_file_` como local (não pedem variante `.medium`) |
| Remover | Remover uma foto do ativo que ainda não subiu **anula o envio** (nada vai ao servidor). Checklist e assinatura: anula o upload e ainda envia a remoção (o upsert/assinatura anterior pode já estar no servidor) |
| Ordem | Upload da foto do checklist, upsert e remoção do mesmo item usam a **mesma chave**: se a foto falhar, o upsert que a cita espera |
| Assinatura | Hora da assinatura = hora do aparelho (`options.signedAt`), não a do envio |
| 3.4 Envio | Sequencial, na ordem do técnico (paralelo limitado ficou de fora — simplicidade > velocidade) |
| 3.5 Limpeza | Após subir, o arquivo fica mais 3 dias (a tela segue mostrando até a leitura online trazer a URL do servidor) e é apagado ao abrir o app. **Aviso de pouco espaço não implementado** (Capacitor não expõe espaço livre) |
| 3.6 Worker R2 | **Não feito** — depende de configurar `VITE_R2_WORKER_URL` e rotacionar a chave; segue recomendado |
| "Usar como capa" | Continua só online (ação de gestor) |

### Arquivos

- Novos: `services/offline/offlineFiles.ts`, `offlineFileOps.ts` (+ `offlineFileOps.test.ts`, 8 testes), `offlineFileUrls.ts`, `services/core/checklistPaths.ts`
- Alterados: `visitsService.uploadOrderVisitAssetPhoto`, `maintenancePlansService.uploadChecklistImage`, `dataService.saveOrderVisitSignature` (+ `getPublicImageUrl`), `imageUtils.getPublicImageUrl`, `OptimizedImage.tsx`, `imgproxyService.ts`, `offlineLayer.ts`, `offlineSync.ts`, `outbox.ts` (`removeWhere`), `offlineOps.ts` (spec com `prepareArgs`/`cancelsPending`)

### Como testar

1. Modo avião → fotos antes/depois em 2–3 ativos, fotos no checklist, assinatura do líder e do solicitante.
2. Fechar e reabrir offline → fotos e assinaturas continuam na tela.
3. Remover uma das fotos ainda offline → some da tela; ao reconectar ela não sobe.
4. Reconectar → painel zera; conferir no R2 e no banco (sem nome duplicado na lista).
5. Derrubar a rede no meio do envio → reconectar → termina sem duplicar.

### Itens (plano original)

**Objetivo:** fotos antes/depois, fotos do checklist e assinaturas (líder e solicitante)
funcionam offline e sobem depois.

| # | Tarefa | Arquivos |
|---|--------|----------|
| 3.1 | Captura → compressão webp (`imageCompressionService`) → `Filesystem` com **nome final gerado no aparelho** | `services/offline/offlineFiles.ts` |
| 3.2 | Exibição local via `Capacitor.convertFileSrc` enquanto pendente | `OptimizedImage` / `PhotoViewer` |
| 3.3 | Envio: upload R2 com a mesma chave (retry sobrescreve o mesmo arquivo = idempotente) → RPC `sync_ova_photo_add_v1` com `array_append` só se ausente; remoção idem | `operations/photo*.ts`, migration |
| 3.4 | Fotos sobem **em paralelo limitado (2)** e só após as operações de dados do mesmo ativo | `syncEngine.ts` |
| 3.5 | Limpeza: apagar o arquivo local após confirmação; aviso se espaço livre < 500 MB | `offlineFiles.ts` |
| 3.6 | **Recomendado nesta fase:** upload via Worker (`VITE_R2_WORKER_URL`) e retirar `VITE_R2_SECRET_ACCESS_KEY` do APK | `services/media/r2Service.ts`, `.env.local` |

**Aceite:** 30 fotos offline em 3 ativos → reconectar → todas no R2 e na lista do ativo,
sem duplicata, mesmo com queda no meio. Assinatura offline aparece no relatório após sync.

---

## F4 — Inserts, Relatar e Encerrar offline (1,5 semana) — ✅ código pronto (08/11/2026), falta testar no aparelho

### O que funciona offline

| Ação | Como |
|------|------|
| Incluir material no ativo | Linha nasce com `offline_uuid` e id local `tmp:<uuid>`; aparece na lista com descrição do **catálogo baixado no preparo** |
| Buscar material | Offline, filtra o catálogo do fornecedor da OS (baixado em páginas de 1.000, até 10.000) com as **mesmas regras** da busca online (`materialSearchTerms.ts`) |
| Alterar qtd./remover material ou serviço criado offline | No envio, `tmp:<uuid>` vira o id real (`findIdByOfflineUuid`). Remover antes de o insert subir **anula** insert + alterações na fila |
| Incluir/remover serviço | Mesmo esquema; valor/desconto/descrição do serviço do contrato em cache |
| Incluir/remover veículo | Busca no **cadastro de veículos da empresa** (`searchVehicles`, até 1.000, baixado no preparo); linha de Km vazia com `offline_uuid`/`tmp:<uuid>`; Km e remoção do temporário seguem o insert. Sem cache, Km anterior e contrato de locação ficam em branco (sem aviso). Ociosidade continua só online |
| Incluir/remover membro da equipe | Lista de usuários do preparo (`getUsers`); entra na fila por visita+usuário; no envio `addTeamMember(..., { idempotent: true })` (reenvio não vira "já faz parte"); remover quem ainda não subiu anula a inclusão |
| Relatar ativo | Hora do aparelho; contadores da visita atualizados no cache; **espera** todas as alterações daquele ativo; ao subir, solta a trava |
| Relatar visita | Valida com o cache (mesma regra do serviço) antes de enfileirar; **espera** todas as da visita; reenvio idempotente (`options.idempotent`) |
| Encerrar visita | Valida Km no aparelho; `flow_order_visit_close_v4` com `p_client_op_id` + `p_client_ended_at` (hora do toque); **espera** todas as da visita; `SG409` → conflito; perfil guardado deixa de estar "em visita" |

### Diferenças do plano original

| Plano | Implementado | Por quê |
|-------|--------------|---------|
| `offline_ops_applied` + RPCs `sync_*_add_v1` | **Nenhuma migration nova.** `insertWithOfflineUuid` (`services/core/offlineUuidInsert.ts`): grava `offline_uuid`; `23505` no índice do `offline_uuid` = já gravado = sucesso | O índice UNIQUE da 20261116 já garante "não duplica"; menos SQL para manter |
| `sync_ova_report_v1` (contadores no servidor) | O próprio `reportedOrderVisitAsset` (já recalcula os contadores) com `options.reportedAt` | Reexecutar o recálculo é idempotente |
| `sync_ov_report_v1` | `reportOrderVisit` com `options.idempotent` (já relatado pelo mesmo usuário → nada a fazer) | Idem |
| Dependências por operação | **Barreiras** no syncEngine: `'ova'` (Relatar ativo) e `'visit'` (Relatar visita, Encerrar) — esperam qualquer anterior do mesmo ativo/visita que não subiu. Com internet, também esperam a fila | Regra única, testada |
| Inserir veículo/ativo offline | Veículo e membro da equipe: **offline** (cadastro de veículos e usuários no pacote). Ativo e ociosidade: só online | Ativo depende da busca no cadastro; ociosidade, do contrato de locação |

Sem as migrations 20261116/20261118 aplicadas: inclusões gravam sem `offline_uuid` (sem proteção contra duplicata) e o encerramento cai na v3 (hora = hora do envio).

### Arquivos

- Novos: `services/offline/offlineFlowOps.ts` (+ `offlineFlowOps.test.ts`, 21 testes), `offlineCatalog.ts`, `services/core/offlineUuidInsert.ts`, `services/materials/materialSearchTerms.ts`
- Alterados: `materialsService.addMaterialToAsset`, `visitsService.addServiceToOrderVisit` / `reportedOrderVisitAsset` / `reportOrderVisit` / `closeOrderVisit` (parâmetro `options`), proxies no `dataService`, `syncEngine.ts` (barreiras), `outbox.ts` (`visitId`), `offlineOps.ts`, `offlineLayer.ts` (escopo, barreira online, busca offline), `offlineSync.ts` (id temporário, pós-envio, `SG409`), `fieldPackageService.ts` (catálogo), `useAssetLock.ts`

### Como testar

1. Preparar a visita com internet → modo avião.
2. Ativo: incluir material (buscar no catálogo), alterar quantidade, incluir outro e removê-lo; fotos; checklist; **Relatar**.
3. Visita: incluir serviço; assinatura; **Encerrar** (conferir hora); **Relatar visita**.
4. Fechar/reabrir offline: tudo na tela; técnico não aparece mais "em visita".
5. Reconectar: fila zera na ordem; conferir no banco: sem material/serviço duplicado, o removido não existe, `ov_ended_at` = hora do toque, `ov_close_received_at` preenchido, trava solta.
6. Conflito: outro aparelho encerra a mesma visita antes → "Recusadas: 1".

### Itens (plano original)

**Objetivo:** adicionar/remover material, serviço, veículo, ociosidade e ativo (do pacote);
**Relatar ativo**, **Relatar visita** e **Encerrar visita** offline.

| # | Tarefa | Arquivos |
|---|--------|----------|
| 4.1 | RPCs com `offline_uuid`: `sync_ova_material_add_v1`, `sync_ov_service_add_v1`, `sync_ov_vehicle_add_v1`, `sync_ov_idle_add_v1`, `sync_ov_asset_add_v1` + remoções (soft delete por id **ou** `offline_uuid`) | migration |
| 4.2 | Remoção de item ainda não enviado = cancela a operação na fila (nada vai ao servidor) | `outbox.ts` |
| 4.3 | `sync_ova_report_v1`: relatar ativo + **contadores no servidor** (substitui `syncOrderVisitAssetsProcessing` do cliente) + solta a trava | migration, `operations/reportAsset.ts` |
| 4.4 | `sync_ov_report_v1`: mesmas validações de `reportOrderVisit` (processing 1/4, ativos) no servidor | migration |
| 4.5 | Encerrar: validar km dos veículos **no aparelho** antes de enfileirar → op `closeVisit` dependente de **todas** as ops da visita → `flow_order_visit_close_v4` com `p_client_ended_at` + `p_client_op_id` | `operations/closeVisit.ts`, `visitsService.closeOrderVisit` |
| 4.6 | Estoque: material aceito offline; falta de saldo no sync vira alerta ao gestor (não bloqueia a fila) | RPC de material |

**Aceite:**
- Visita inteira offline (ativos, materiais, serviços, veículos, fotos, relatar, encerrar) → reconectar → resultado idêntico ao da mesma visita feita online (comparar registros).
- `ov_ended_at` = hora do toque em "Encerrar", não a do envio.
- Visita encerrada por outro aparelho antes → conflito visível, sem notificação duplicada.

---

## ⛔ Portão de validação — F1 a F5 no aparelho (antes do piloto e da etapa 3)

**Decisão (08/11/2026):** a F5 só começa depois que a F1–F4 passar no aparelho real.
**Atualização (10/11/2026):** a pedido do usuário a F5 foi implantada antes; o portão agora
valida F1–F5 (roteiro da F5 na seção dela) e vem antes do piloto e da etapa 3.

> ✅ **Portão considerado APROVADO por decisão do usuário (10/11/2026)** — "assumir como todos os
> testes realizados e aprovados". Não há registro item a item da execução: as caixas abaixo
> ficaram sem marcar e servem de roteiro de referência / regressão. Defeitos encontrados em campo
> entram na tabela "Defeitos".
>
> Junto: **liberação geral** decidida pelo usuário (`cfg_companies.offline_enabled = true` para
> todas as empresas, padrão `true` para novas), **sem piloto**.

**Por quê:** a F5 serve para **liberar** o modo offline aos técnicos (tela de pendências, chave por
empresa/usuário, piloto). Até aqui tudo foi validado com `tsc` + 442 testes unitários, mas nada
rodou num Android de verdade: Filesystem, Preferences, câmera, WebView offline e o Supabase real
(RLS das migrations) só aparecem no aparelho. Um defeito de base achado agora é barato; achado no
piloto, custa dados de campo e confiança dos técnicos.

### Pré-requisitos

- [x] Migrations aplicadas no SQL Editor (✅ 10/11/2026, informado pelo usuário), nesta ordem, com as consultas de conferência do fim de cada arquivo:
      `20261116_add_offline_client_uuid.sql` → `20261117_add_orders_visits_assets_lock.sql` → `20261118_create_flow_order_visit_close_v4.sql`
- [ ] Trava conferida com usuários reais: técnico → `ov_asset_lock` devolve `locked: true`; gestor → `ov_asset_unlock(id, true)` devolve `forced: true` (confirma RLS dos RPCs `SECURITY INVOKER`)
- [ ] `VITE_FEATURE_OFFLINE_MODE=true` no `.env.local` (ou `.env.android`) → `npm run build:android` → APK instalado
- [ ] 1 visita de teste com 2–3 ativos, veículo com Km, serviços no contrato e materiais no catálogo do fornecedor

### Roteiro (marcar ao passar)

**F1 — consulta e trava**
- [ ] Preparar para campo com Wi-Fi → mensagem "Visita pronta para campo · N ativo(s) reservado(s)"
- [ ] Modo avião → fechar o app → abrir: continua logado (não cai no login)
- [ ] Visita, ativos, atividades, checklist, materiais, serviços e veículos abrem sem internet
- [ ] Visita **não** preparada offline: aviso "visita não preparada", sem tela em branco/spinner infinito
- [ ] 2º técnico abre ativo reservado → "Em uso por Fulano", só consulta; gestor toca "Liberar" → 2º técnico consegue editar

**F2 — edição e sincronização**
- [ ] Offline: atividades, checklist (status/comentário), comentários, status/unidade/tag "depois", horímetro, qtd. de material/serviço, Km → aviso "alteração salva no aparelho"
- [ ] Fechar/reabrir offline: alterações continuam na tela
- [ ] Reconectar: painel "Aguardando envio" zera sozinho; valores conferidos no banco
- [ ] Forçar parada do app no meio do envio → reabrir → termina sem duplicar
- [ ] Conflito: gestor libera o ativo com o técnico offline → ao reconectar, "Recusadas: N" → Descartar
- [ ] Ativo **não** reservado (opção (a), 09/11): offline fica editável; ao reconectar a fila trava e sobe — ou vira "Recusadas" se outro técnico estiver com a trava

**F3 — fotos e assinaturas**
- [ ] Offline: fotos antes/depois em 2–3 ativos, fotos no checklist, assinatura do líder e do solicitante
- [ ] Fechar/reabrir offline: fotos e assinaturas aparecem
- [ ] Remover uma foto ainda offline → ao reconectar ela **não** sobe
- [ ] Reconectar: arquivos no R2 e nomes no banco **sem duplicata**; hora da assinatura = hora em que assinou
- [ ] Rede caindo no meio do envio das fotos → reconectar → termina sem duplicar

**F4 — inclusões e fluxo**
- [ ] Offline: buscar material no catálogo, incluir, alterar qtd.; incluir outro e removê-lo
- [ ] Offline: incluir e remover serviço; buscar e incluir veículo, lançar Km, remover outro
- [ ] Offline: incluir e remover membro da equipe; reconectar → membro na equipe e "em visita"
- [ ] Offline: **Relatar ativo** → **Encerrar visita** (Km inválido é recusado no aparelho) → **Relatar visita**
- [ ] Fechar/reabrir offline: técnico não aparece mais "em visita"
- [ ] Reconectar: fila zera na ordem; banco sem material/serviço duplicado; o removido não existe; `ov_ended_at` = hora do toque; `ov_close_received_at` preenchido; trava solta
- [ ] Outro aparelho encerra a mesma visita antes → "Recusadas: 1", sem notificação duplicada

**Gerais**
- [ ] Rede intermitente (entra/sai de cobertura) durante o envio
- [ ] Token vencido: ≥ 2 h offline → sincroniza sem pedir login
- [ ] APK com a flag em `false` e fila pendente → fila esvazia, nada perdido
- [ ] Fluxo **online** de sempre (flag ligada, com internet) sem mudança de comportamento

### Defeitos

Registrar cada falha aqui (data, passo, o que aconteceu, print/log) e corrigir **antes** da F5:

| Data | Passo | O que aconteceu | Status |
|------|-------|-----------------|--------|
| | | | |

### Critério de saída

Todos os itens marcados e nenhum defeito aberto que perca, duplique ou sobrescreva dado. Só então: **F5**.

---

## F5 — Pendências, conflitos, piloto (1 semana) — ✅ código pronto (10/11/2026), falta testar no aparelho

**Decisão (10/11/2026):** a F5 foi implantada **antes** do portão, a pedido do usuário (muda a
decisão de 08/11). A etapa 3 (iniciar visita offline) continua **depois** do portão. O portão
passa a cobrir F1–F5.

### Como ficou

| # | Implementado |
|---|--------------|
| 5.1 | **Tela de pendências** (`components/offline/PendingOpsPanel.tsx`): painel em tela cheia montado uma vez no `App`, aberto tocando na faixa do cabeçalho (quando há fila) ou em "Ver pendências" no cartão "Modo campo". Lista por visita, com o nome de cada operação em português, ativo, data, tentativas e o erro em texto legível. Pendente: só informa. Erro: **Tentar de novo** / **Descartar**. Recusada: **Descartar**. Descartar leva junto o que depende do item (ex.: material criado offline → quantidade; ativo criado offline → tudo dele) e apaga as fotos locais dessas operações. Botões "Enviar agora" e "Tentar de novo os com erro". Botão "voltar" do Android fecha o painel |
| 5.2 | **Aviso ao sair** (`offlineLogoutGuard.ts`) no `ProfileScreen` e no `AuthContext`: com internet tenta enviar antes; se sobrar algo, pergunta. A fila não é apagada — sobe quando o mesmo usuário entrar de novo |
| 5.3 | **Chave do banco** (migration **20261123**, `offlineGate.ts`): offline só com a flag do APK **e** `fn_offline_enabled()` = usuário (`users.offline_enabled`) > empresa (`cfg_companies.offline_enabled`, padrão `false`). Lida no login e quando a internet volta; o último valor fica no aparelho (vale offline). Sem a migration: chave aberta (como antes). Fechar não apaga a fila. Liberar depois com o técnico logado começa o download sem reabrir o app |
| 5.4 | **Telemetria**: evento `offline_sync` em `logs_app_client_events` a cada rodada que enviou, errou ou foi recusada — enviadas, erros, recusadas, seguradas, fila restante, minutos sem internet e falhas por operação. Só grava depois que a 20261123 foi detectada |
| 5.5 | Piloto — **dispensado** pelo usuário em 10/11/2026: liberação geral direto (acompanhar a telemetria `offline_sync` nas primeiras semanas) |

**Liberar o piloto (SQL Editor, depois de aplicar a 20261123):**
```sql
UPDATE public.users SET offline_enabled = true WHERE id IN (/* 2 ou 3 técnicos */);
-- Telemetria:
SELECT created_at, user_uuid, message, extra FROM public.logs_app_client_events
 WHERE event_type = 'offline_sync' ORDER BY id DESC LIMIT 50;
```

**Atenção:** aplicar a 20261123 **desliga o offline para todos** até liberar empresa/usuário.

### Arquivos

- Novos: `services/offline/pendingOps.ts` (+ `pendingOps.test.ts`, 9 testes), `offlineGate.ts`, `offlineLogoutGuard.ts`, `components/offline/PendingOpsPanel.tsx`, `dev/supabase/migrations/20261123_add_offline_enabled.sql` (+ `_DOWN`, validada em Postgres local)
- Alterados: `offlineSync.ts` (`retryOfflineOp`, `discardOfflineOp`, telemetria), `offlineConfig.ts` (chave do banco em `isOfflineSupported`), `offlineLayer.ts`, `App.tsx` (painel + chave antes do download automático), `ConnectionStrip.tsx` (faixa abre as pendências), `FieldPackageCard.tsx` ("Ver pendências"), `ProfileScreen.tsx`, `AuthContext.tsx`, `clientDiagnosticsService.ts` (tipo `offline_sync`)

### Como testar (entra no portão)

- [ ] Aplicar a 20261123 → técnico sem liberação: sem faixa de modo campo, sem download automático; liberar o usuário → em segundos começa o download (sem reabrir o app)
- [ ] Gerar um erro e uma recusa (ex.: gestor libera o ativo com o técnico offline) → faixa âmbar → tocar → tela de pendências mostra os dois com o motivo
- [ ] "Tentar de novo" num erro; "Descartar" numa recusa; descartar a inclusão de um material criado offline leva junto a quantidade alterada
- [ ] Sair do app (Perfil → Sair) com fila pendente sem internet → aviso; cancelar mantém logado
- [ ] Depois de uma rodada de envio, conferir a linha `offline_sync` em `logs_app_client_events`
- [ ] Desligar a chave do técnico com fila pendente → a fila ainda sobe

### Itens (plano original)

| # | Tarefa |
|---|--------|
| 5.1 | `PendingOpsScreen`: lista por visita/ativo, estado, erro legível, "Tentar de novo", "Sincronizar agora". Conflito: "Ver detalhe" e "Descartar minha alteração" (com confirmação) |
| 5.2 | Bloqueios: aviso ao deslogar, trocar de usuário ou desinstalar-like (limpar dados) com fila pendente |
| 5.3 | **Liberação por banco** (chave 2): `companies.offline_enabled` ou `users.offline_enabled` — offline só com flag do APK **e** chave do banco |
| 5.4 | Telemetria via `clientDiagnosticsService`: tamanho da fila, tempo offline, falhas por tipo |
| 5.5 | Roteiro de testes em aparelho real (abaixo) + piloto com 2–3 técnicos por 2 semanas |

### Roteiro de testes em aparelho

1. Modo avião durante a visita inteira (do preparo ao encerramento).
2. Rede intermitente (entrar/sair de cobertura a cada 30 s).
3. App morto (forçar parada) no meio da sincronização.
4. 2 dias offline (token e refresh token).
5. Dois aparelhos, mesma visita, ativos diferentes; depois o mesmo ativo (trava).
6. Gestor força liberação com o técnico offline.
7. Pouco espaço livre com muitas fotos.
8. APK novo com flag desligada e fila pendente → fila esvazia, nada perdido.

---

## Cronograma

| Semana | Fase | Marco |
|--------|------|-------|
| 1–1,5 | F1 | APK: login offline + consulta da visita + trava |
| 2,5–3 | F2 | APK: edição simples offline + sincronização |
| 4 | F3 | APK: fotos e assinaturas offline |
| 5–5,5 | F4 | APK: visita completa offline, incluindo encerrar |
| — | Preparo automático, etapa 1 | ✅ código pronto (09/11): download automático + barra + trava (a) |
| — | ⛔ Portão | F1–F4 + etapa 1 validadas no aparelho real (roteiros acima e abaixo); defeitos corrigidos |
| +1 | Etapa 2 | APK: incluir ativo da unidade sem internet |
| +1 | F5 | Pendências/conflitos, chave por empresa/usuário, telemetria |
| +1,5 | Etapa 3 | APK: encerrar e iniciar outra visita sem internet (migration nova) |
| +2 | Piloto | 2–3 técnicos por 2 semanas → liberação geral |

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Plugin SQLite incompatível com Capacitor 8 | Testar no dia 1; plano B Dexie/IndexedDB (mesma interface `offlineStore`) |
| Regra de negócio espalhada no cliente (contadores, movimentação) | Levar para RPCs na F2/F4; o app só enfileira intenções |
| Esquema do banco muda e o pacote local fica velho | Versão do pacote; ao reconectar, revalida e baixa de novo se mudou |
| Técnico não prepara a visita antes de sair | **Resolvido pelo preparo automático** (09/11): OSs abertas da empresa e visitas em andamento baixadas sem ação do técnico |
| Visita preparada há muitos dias | Preparo automático atualiza a cada 15 min / ao reconectar; cartão mostra a data do pacote |
| Volume do download automático (muitas OSs abertas → muitas unidades/ativos) | Unidade baixada uma vez só; incremental (só novo ou > 1 dia); unidades sem OS aberta apagadas; ativos limitados a 5.000 por unidade; medir no portão (tempo da 1ª carga e espaço usado) |
| Dois técnicos editam o mesmo ativo offline (trava opção (a)) | O 1º a sincronizar fica com a trava; o 2º vê "Recusadas" e resolve na tela de pendências (F5) |
| Visita iniciada offline (etapa 3) conflita com outra equipe que abriu a mesma OS online | Recusada no envio junto com tudo o que depende dela → precisa da tela de pendências (F5) antes de liberar |
| Equipe aparece ocupada até o sync | Documentado; aceito (decisão de 08/11/2026) |

## Preparo automático (decisões de 09/11/2026)

Motivo: o técnico pode perder o sinal no meio do atendimento — e até **encerrar uma visita e
iniciar outra sem internet** — então os dados não podem depender do "Preparar para campo" manual.

| Etapa | Situação |
|-------|----------|
| 1. Download automático + barra de progresso + trava opção (a) | ✅ **Código pronto** (09/11) — falta validar no aparelho |
| 2. Incluir ativo offline (busca nos ativos da unidade baixados) | ✅ **Código pronto** (10/11, antecipado a pedido do usuário) — falta validar no aparelho |
| 3. Encerrar e iniciar outra visita offline | ✅ **Código pronto** (10/11) — migration 20261124 aplicada |

Decisões do usuário (09/11/2026):
1. Preparo **automático**: na 1ª abertura baixa os dados de **todas as OSs abertas** da empresa;
   depois acompanha as mudanças das OSs abertas.
2. Escopo = OSs com `provider_company_id` = empresa do usuário logado. Técnico atendendo OS de
   outra prestadora **nunca deve existir** (confirmado).
3. Baixar: ativos da unidade, atividades, materiais da `provider_company_id`, planos de
   manutenção, usuários da empresa (+ veículos).
4. Travas: **opção (a)** — não reservar no download; travar ao abrir o ativo com sinal.
5. Barra de progresso global enquanto atualiza (com conexão).
6. Objetivo final: o técnico pode **encerrar uma visita e iniciar outra sem internet** —
   por isso todas as unidades das OSs abertas, não só as da visita atual.

**Pré-requisito:** aplicar `20261122_create_fn_offline_change_versions.sql` (conferência no fim do arquivo). ✅ Aplicada em 10/11/2026 (informado pelo usuário).

**Arquivos da etapa 1**
- Novos: `services/offline/offlineAutoSync.ts` (gatilhos, execução, estado),
  `offlineAutoSyncPlan.ts` (+ `.test.ts`, 5 testes — o que baixar/apagar),
  `offlineCatalogDownload.ts` (catálogos com idade: materiais, veículos, ativos da unidade),
  `offlineVersionsService.ts` (versões do banco — `fn_offline_change_versions`),
  `hooks/useOfflineAutoSync.ts`
- Alterados: `ordersService.getOpenOrdersForOffline`, `visitsService.getOpenVisitIdsByUser`
  (+ proxies no `dataService`), `fieldPackageService.ts` (`auto: true`: não trava, reaproveita
  catálogo de < 1 dia, mantém travas do preparo manual), `useAssetLock.ts` (offline: sem
  "não reservado"), `ConnectionStrip.tsx` (barra), `App.tsx` (liga com o usuário logado),
  `store/offlineStore.ts` (coleção `autosync`), `offlineFlowOps.ts` (catálogo de materiais
  não confunde com ativos/veículos)

**Etapa 1 — o que faz**
- Gatilhos: login/abertura do app (1ª vez baixa tudo), internet voltou, app voltou ao primeiro
  plano e **conferência a cada 5 min**. Só no APK com a flag do modo offline.
- Escopo: OSs abertas (`status_id` fora de 7/8, não excluídas) com `provider_company_id` = empresa
  do usuário (`getOpenOrdersForOffline`). **Cada unidade uma vez só.**
- Baixa: ativos da unidade (`getAssets('all','',unitId)` → catálogo `assets:unit:<id>`), setores
  (`getAssetTagsByUnit`), unidades do cliente, atividades por tipo de OS, a OS (`getOrderById`),
  planos de manutenção dos tipos de ativo (estrutura completa), usuários (`getUsers`), materiais
  e veículos da empresa.
- Incremental (`offlineAutoSyncPlan.ts`, testado): baixa de novo **só o que mudou** — inclusão,
  alteração ou exclusão (decisão de 09/11/2026). A cada conferência o app chama
  `fn_offline_change_versions` (migration **20261122**), que devolve uma versão por grupo:
  | Grupo | Versão muda quando… |
  |-------|---------------------|
  | Unidade | ativo ou setor (`cfg_units_assets_tags`) incluído, alterado ou excluído |
  | Tipo de ativo | plano, seção ou atividade de seção incluído, alterado ou excluído |
  | Tipo de OS | atividade (`cfg_orders_types_activities` / `cfg_activities`) incluída, alterada ou excluída (md5 do conteúdo — tabelas sem data) |
  | Materiais / veículos / usuários | cadastro incluído, alterado ou excluído (estoque não entra) |
  | OS | `updated_at` da OS mudou |
  Prazo de segurança: 7 dias (sem a função no banco: 1 dia, como antes). Unidades que saíram das
  OSs abertas são apagadas do aparelho. A barra só aparece quando há download de verdade.
- Visitas em andamento do usuário (`getOpenVisitIdsByUser`): mesmo pacote do preparo manual,
  **sem travar** (`auto: true`). Visita com alterações ainda não enviadas é pulada até a fila subir.
- Travas — opção (a): online, o relatório do ativo trava ao abrir (`useAssetLock`); offline,
  qualquer ativo é editável e o envio da fila trava (conflito se outro técnico tiver a trava).
- Barra: `ConnectionStrip` mostra "Atualizando dados offline · etapa · N%" (a fila tem prioridade).

**Internet volta no meio da visita:** 1º a fila sobe na ordem (barreiras, ids `tmp:`, trava);
depois o download automático roda; as visitas com pendências só são atualizadas quando a fila
esvazia.

**Etapa 2 — incluir ativo offline (✅ código pronto em 10/11/2026)**
- Busca: `getAssets(filtro, termo, unitId)` offline filtra o catálogo `assets:unit:<id>` com a
  mesma regra da busca online (cada termo em `searchable`: código, descrição, setor…).
  Leitor de QR/código também cai na busca local.
- `addAssetToOrderVisit` vira operação da fila: linha com `offline_uuid` (coluna já criada pela
  20261116 em `orders_visits_assets`) e id `tmp:<uuid>`; os dados "antes/depois" vêm do ativo
  no catálogo (hoje o serviço lê `assets` + `v_orders_visits` no servidor).
- Tudo que o técnico fizer no ativo novo (relatório, checklist, atividades, materiais, fotos)
  usa o id `tmp:` e é resolvido no envio — a resolução de `tmp:` precisa valer para o
  `ovaId` em qualquer argumento, não só no 1º.
- Remover o ativo antes de subir anula a inclusão e tudo do ativo na fila.
- Testes: unidade (busca local, cadeia de ids `tmp:`) + roteiro no aparelho.

Implementado (10/11/2026):
- `getAssets` / `searchUnits` sem internet → `searchAssetsOffline` / `searchUnitsOffline`
  (`offlineCatalog.ts`), no catálogo `assets:unit:<id>`.
- `addAssetToOrderVisit` / `removeAssetFromOrderVisit` em `offlineFlowOps.ts`. Remover offline
  só vale para ativo `tmp:` (o que já está no servidor continua exigindo conexão).
- Envio (`syncEngine` + `offlineSync`): operação com `ovaId` `tmp:` não confere trava, espera
  a inclusão (se ela falhou, as do ativo ficam pendentes) e tem o `tmp:` trocado pelo id real
  em todos os argumentos (`replaceDeep`, inclusive `{ ovaId }` do alerta).
- Leituras do ativo novo sem cache devolvem vazio (`TMP_READ_FALLBACKS`); trava = do técnico.
- Testes: `services/offline/assetOffline.test.ts`.

Roteiro no aparelho (etapa 2):
- [ ] Com internet, abrir a visita e esperar "Atualizando dados offline" terminar.
- [ ] Sem internet: buscar ativo por código e por unidade; associar.
- [ ] Abrir o relatório do ativo novo: condições, fotos, checklist, atividades, materiais, registrador.
- [ ] Reportar o ativo sem internet.
- [ ] Associar outro ativo e removê-lo antes de reconectar (não deve subir nada dele).
- [ ] Reconectar: conferir no servidor que o ativo entrou **uma vez**, com fotos, checklist e materiais.

**Etapa 3 — encerrar e iniciar outra visita offline — ✅ código pronto (10/11/2026)**

Implementado (10/11/2026):
- **Migration `20261124_create_flow_order_visit_create_v3.sql`** (+ `_DOWN`, validada em Postgres
  local): `orders_visits.offline_uuid` (UNIQUE) e `flow_order_visit_create_v3(payload)` — mesma
  lógica da v2 + idempotência (`offline_uuid`: reenvio devolve a visita já criada, sem duplicar
  visita/equipe/veículo/contador/notificação), hora do aparelho (`client_started_at`; futuro → agora;
  início manual do contrato continua com prioridade), veículo do líder com `vehicle_client_uuid`,
  conflito `SG409` (OS concluída/cancelada/excluída ou com outro líder) e conferência de que quem
  chama é o líder (`auth.uid()`). A v2 não muda.
- **App:** sem internet e com o modo offline liberado, "Iniciar visita" vai para a fila e o técnico
  entra na visita na hora (`tmp:<uuid>`), montada no aparelho a partir da OS: dados da OS, equipe só
  com o líder, veículo do líder (`tmp:` — o Km digitado acha a linha criada pela v3), OS "Em
  andamento", perfil "em visita". Validações no aparelho iguais às da tela (OS aberta, líder
  designado, técnico disponível).
- **Envio:** tudo da visita nova espera o "Iniciar"; aceito → o `tmp:` da visita vira o id real em
  todos os argumentos (serviços, veículos, ativos, fotos, encerrar, relatar…). Recusado → conflito,
  e tudo dela fica parado; descartar na tela de pendências leva junto (inclusive o Km do veículo).
- **Sem a v3 no banco:** o "Iniciar" da fila vira erro (não cai na v2, que poderia duplicar a visita).
- **Encerrar → iniciar outra sem internet:** ao encerrar, o líder volta "disponível" na tela (igual ao
  servidor), liberando o "Iniciar" da próxima OS.
- Limite conhecido: se o encerramento da visita anterior ainda não tiver subido quando o "Iniciar"
  chegar, os membros da equipe ainda constam "em visita" no servidor e não entram na equipe nova
  (dá para incluir depois — incluir membro offline já existe).
- Testes: `services/offline/visitOffline.test.ts` (9).

Roteiro no aparelho (etapa 3):
- [x] Aplicar a 20261124 (✅ 10/11/2026, informado pelo usuário).
- [ ] Sem internet: encerrar a visita atual → abrir outra OS (de outra unidade) → **Iniciar** → cai na visita nova.
- [ ] Na visita nova: Km do veículo, incluir ativo, relatório, serviço, assinatura, **Encerrar**, **Relatar**.
- [ ] Fechar/reabrir offline: continua na visita nova.
- [ ] Reconectar: no banco a visita aparece **uma vez**, com `ov_started_at` = hora do toque, número `OS-xxx.NN`, veículo com o Km, ativos/serviços nela, encerrada.
- [ ] Conflito: gestor conclui a OS (ou troca o líder) antes de reconectar → "Recusada" na tela de pendências; descartar leva tudo da visita.

Decisões e plano original:

Decisões do usuário (10/11/2026):

| # | Tema | Decisão |
|---|------|---------|
| 1 | Quando | **Depois do portão** de validação no aparelho (F1–F4 + etapas 1–2 testadas e defeitos corrigidos) |
| 2 | Equipe da visita iniciada offline | **Regra atual, aplicada no envio**: o banco inclui os membros da equipe do líder disponíveis no momento em que a criação chega ao servidor. No aparelho, a visita começa só com o líder até sincronizar |
| 3 | Horário de início | **Hora do aparelho** (toque em "Iniciar"), com as mesmas proteções contra relógio errado da `close_v4` (futuro → agora; antes de limites aceitáveis → recusa) |
| 4 | OS mudou enquanto offline (líder trocado, OS cancelada/concluída) | **Recusar e segurar**: a criação vira conflito; tudo o que depende da visita fica parado no aparelho até decisão na tela de pendências (F5) |

Contexto levantado (10/11/2026): só o líder designado na OS e disponível pode iniciar
(`OrderRequestView.canStartVisit`), então duas visitas abertas na mesma OS só surgem se o gestor
mexer na OS durante o offline. `flow_order_visit_create_v2` também gera o número da visita
(`ov_mask`, contador da OS — offline só aparece após o envio), muda OS/SS para "Em andamento",
inclui o veículo do líder e notifica os seguidores da SS. Estimativa: ~1,5 semana.

Plano técnico:
- Migration: `flow_order_visit_create_v3` com `p_client_uuid` + `p_client_started_at`
  (idempotente; mesmas regras da v2) e `offline_uuid` em `orders_visits`.
- Visita nasce `tmp:<uuid>` no aparelho a partir da OS baixada (`getOrderById`) e do perfil;
  equipe, status do técnico ("em visita") e a OS ficam no cache local.
- Resolução de `tmp:` da visita em todos os argumentos (`visitId` de serviços, veículos,
  ativos, encerrar…), em cadeia com os ativos `tmp:` da etapa 2.
- Conflito: outra equipe abriu a mesma OS / OS concluída enquanto offline → a criação é
  recusada e tudo o que depende dela fica parado na tela de pendências (F5) para decidir.
- ~~Antes de começar: confirmar se a regra de negócio permite duas visitas abertas na mesma OS.~~ Respondido em 10/11 (decisão 4 acima + contexto).

**Validar no aparelho (etapa 1)**
- [ ] 1ª abertura com internet: barra aparece e termina; desligar dados → abrir OS/visita de outra unidade e os planos funcionam
- [ ] Nova OS aberta para a empresa → em até 5 min a unidade dela é baixada; OS concluída → unidade some (se não houver outra OS aberta nela)
- [ ] Com a migration 20261122: incluir/alterar/excluir um ativo da unidade, uma atividade do tipo de OS e uma seção de plano → em até 5 min a mudança aparece offline; sem mudança, nenhuma barra a cada 5 min
- [ ] Sem internet no meio da visita, editar ativo não travado no preparo → reconectar → sobe (ou vira conflito se outro técnico travou)
- [ ] Internet volta com alterações pendentes: a fila sobe primeiro ("Enviando…"), depois a barra do download; a visita com pendências só é atualizada após a fila zerar (nada do que foi feito some da tela)
- [ ] Medir: tempo da 1ª carga e espaço usado no aparelho (Configurações › Apps › SIGES › Armazenamento)
