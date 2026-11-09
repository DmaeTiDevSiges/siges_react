# Modo offline em campo — relatório do ativo e da visita

Status: **F0 concluída; F1–F4 com código pronto. Próximo passo: portão de validação no aparelho — a F5 só começa depois dele** (decisão de 08/11/2026; roteiro em [OFFLINE_PLANO_IMPLEMENTACAO.md](OFFLINE_PLANO_IMPLEMENTACAO.md)). Flag: `VITE_FEATURE_OFFLINE_MODE` (`features.ts → isOfflineModeEnabled`).

## Objetivo

O técnico preenche e encerra a visita **sem internet**, sem interrupção, desde que a
visita tenha sido aberta e **preparada para campo** com internet. Tudo é gravado no
aparelho e enviado numa fila quando a conexão volta.

## Decisões (08/11/2026)

| # | Tema | Decisão |
|---|------|---------|
| 1 | Dois técnicos no mesmo ativo | **Trava do ativo** para quem o abriu. Pega só online, não expira, solta ao relatar+sincronizar, manualmente, ou forçada pelo gestor do contrato/admin. |
| 2 | Encerrar visita offline | **Permitido.** Entra por último na fila, só depois de tudo da visita sincronizado. Grava a hora do aparelho. |
| 3 | "Relatado" para o gestor | Aparece só depois de sincronizar. |
| — | Liga/desliga | `VITE_FEATURE_OFFLINE_MODE` (build). Desligada não descarta a fila existente. |

## Arquitetura

```
View ──► dataService (fachada) ──► offline ON e método da visita?
                                    ├─ leitura : SQLite local → atualiza da rede se online
                                    └─ gravação: SQLite local + operação na fila (outbox)
                                                 │
                     networkService (reconectou) ▼
                                   motor de sincronização: renova sessão → envia em ordem
                                   → RPCs idempotentes (client_uuid / client_op_id / lock_token)
```

- **Banco local:** F1 usa `@capacitor/filesystem` (`Directory.Data`, não é limpo como o IndexedDB do WebView) atrás da interface `OfflineStore`; SQLite (`@capacitor-community/sqlite` 8.1.1, compatível) fica como opção se a F2 precisar.
- **Fotos e assinaturas:** webp no `Filesystem` (`Directory.Data`), exibidas com `convertFileSrc`; upload R2 na sincronização.
- **Fila:** operações de intenção (`addMaterial`, `toggleActivity`, `addPhoto`, `reportAsset`, `closeVisit`…), com
  `op_id` (UUID), dependências e estado `pendente | enviando | ok | erro | conflito`.
- **Conflito:** nunca some em silêncio — aparece na tela de pendências do técnico.

## Banco (F0 — aplicar no SQL Editor, nesta ordem)

| Migration | O que faz | Reverter |
|-----------|-----------|----------|
| `20261116_add_offline_client_uuid.sql` | `client_uuid UUID UNIQUE` em `orders_visits_assets`, `_assets_activities`, `_assets_materials`, `orders_visits_services`, `orders_visits_vehicles` | `_DOWN` |
| `20261117_add_orders_visits_assets_lock.sql` | `locked_user_id`, `locked_at`, `lock_token` + RPCs `ov_asset_lock(ova_id)` e `ov_asset_unlock(ova_id, force)` | `_DOWN` |
| `20261118_create_flow_order_visit_close_v4.sql` | `flow_order_visit_close_v4` (hora do aparelho, idempotente por `p_client_op_id`, conflito `SG409`) + `ov_close_client_op_id`, `ov_close_received_at` em `orders_visits`. **A v3 não muda.** | `_DOWN` |

Todas somente aditivas e idempotentes. Validadas em Postgres 18 local com tabelas mínimas
(aplicar 2×, DOWN, e cenários: trava/renovação/recusa/força do gestor; encerramento
offline com hora do aparelho, reenvio sem notificação duplicada, conflito, relógio
adiantado/atrasado, chamada online igual à v3). **Falta validar no banco real** (RLS
das tabelas novas nos RPCs `SECURITY INVOKER`).

### Códigos de erro que o app trata na fila

| Código | Significado | Ação na fila |
|--------|-------------|--------------|
| `SG409` | Visita já encerrada por outro / operação desatualizada | `conflito` |
| `42501` | Sem permissão / ativo travado por outro | `conflito` |
| `22023` | Validação (km de veículo, hora antes do início) | `erro` — técnico corrige |
| `P0002` | Registro não encontrado / sem acesso | `conflito` |
| rede/5xx/JWT | Transitório | tentar de novo com espera crescente |

## Inventário dos métodos da visita (dataService)

Levantado em `views/OrderVisit/**` e `components/ordersVisits/**` (sem chat e financeiro).

### A. Leituras → pacote de campo (cache local)

- **Visita:** `getActiveOrderVisit`, `getOrderVisitTeam`, `getOrderById`, `getContractManagers`,
  `isUserContractManager`, `getContractEvaluationRequirements`, `getVisitEvaluations`,
  `checkContractUsesManus`, `getSuspendedReasons`, `getOrderCauseReasons`, `getCurrentUser`
- **Ativos:** `getOrderVisitAssets`, `getOrderVisitAssetById`, `getOrderVisitAssetActivities`,
  `getOrderVisitAssetMaterials`, `getActivitiesByOrderType`, `getAssetAlerts`, `getAssetStatuses`,
  `getAssetPriorities`, `getClients`, `getUnitsByClient`, `getAssetTagsByUnit`,
  `getManualsWithFilesForAssets` (metadados; PDF só se baixado)
- **Checklist/planos:** `getMaintenancePlans`, `getMaintenancePlanSections`,
  `getMaintenancePlanSectionActivities`, `getMaintenanceChecklistItems`,
  `getMaintenanceChecklistItemsByVisit`, `getGlobalMaintenanceChecklistItems` (histórico — opcional).
  O pacote baixa **todos os planos do tipo do ativo** (não só o já selecionado), com estrutura,
  respostas e histórico de cada um — o técnico pode escolher/trocar o plano sem internet.
- **Materiais:** `getProviderCompanyByOvAssetId`, `getAvailableMaterials` (catálogo do fornecedor; estoque = foto do momento)
- **Serviços:** `getOrderVisitServices`, `getContractServices`
- **Veículos:** `getOrderVisitVehicles`, `getPreviousVehicleOdometer`, `getRentalContracts`

### B. Gravações simples → fila, última gravação vence por campo

`updateOrderVisitAsset`, `updateOrderVisitAssetPlan`, `updateOrderVisitAssetProgress`,
`updateMaterialInAsset`, `updateOrderVisitService`, `updateVehicleKm`, `updateAssetAlert`,
`toggleOrderVisitAssetActivity` (idempotente por ativo+atividade),
`upsertMaintenanceChecklistItem`, `deleteMaintenanceChecklistItem`

### C. Inserts → fila com `client_uuid`

`addMaterialToAsset`, `addServiceToOrderVisit`, `addVehicleToOrderVisit`, `addIdleToOrderVisit`,
`addAssetToOrderVisit` (só ativos já no pacote da unidade)

Remoções correspondentes (`removeMaterialFromAsset`, `removeServiceFromOrderVisit`,
`removeVehicleFromOrderVisit`, `removeAssetFromOrderVisit`): se o item ainda não subiu,
só sai da fila; se já subiu, vira operação de soft delete.

### D. Arquivos → Filesystem + upload adiado

`uploadOrderVisitAssetPhoto`, `removeOrderVisitAssetPhoto`, `updateAssetPhotoFromReport`,
`uploadChecklistImage`, `removeChecklistImage`, `saveOrderVisitSignature`, `deleteOrderVisitSignature`

Hoje o upload da foto lê a lista do banco, sobe no R2 e regrava a lista — na sincronização
isso vira RPC com `array_append` no servidor (F3).

### E. Fluxo/status → fila com RPC no servidor (F4)

| Método | Observação |
|--------|-----------|
| `reportedOrderVisitAsset` | Hoje: update + `syncOrderVisitAssetsProcessing` no cliente → levar contadores ao servidor |
| `updateOrderVisitAssetProcessingStatus` | Offline só para o técnico (processing 1/2). Aprovação (5) continua online |
| `reportOrderVisit` | Valida estado no cliente (processing 1/4, ativos) → RPC que valida no servidor |
| `closeOrderVisit` | `flow_order_visit_close_v4` com `p_client_ended_at` + `p_client_op_id`; validar km no aparelho antes de enfileirar |

### F. Só online (botão desabilitado offline, com aviso)

`disapproveOrderVisitAsset`, `disapproveOrderVisit`, `fileOrderVisit`, `markOrderVisitAsRevised`,
`reverseOrderVisitApproval`, `deleteOrderVisit`, `changeOrderVisitAsset`, `checkMovedAssetsForVisit`,
`getReassignPreview`, `addTeamMember`, `removeTeamMember`, `getUsers`, `searchUnits`,
`getAssets` (busca livre), `searchVehicles`, chat da visita, painel de IA.

## Fases

Plano detalhado (tarefas, arquivos, critérios de aceite, testes): [OFFLINE_PLANO_IMPLEMENTACAO.md](OFFLINE_PLANO_IMPLEMENTACAO.md).

| Fase | Entrega | Status |
|------|---------|--------|
| F0 | Migrations, flag, este inventário | ✅ 08/11/2026 (migrations a aplicar) |
| F1 | Store local + "Preparar para campo" + leituras (A) com cache + trava ao abrir o ativo + login offline | 🟡 código pronto 08/11/2026 — testar no aparelho |
| F2 | Fila + motor de sincronização + gravações simples (B) | 🟡 código pronto 08/11/2026 — testar no aparelho |
| F3 | Fotos/assinaturas offline (D) | 🟡 código pronto 08/11/2026 — testar no aparelho |
| F4 | Inserts (C) + fluxo (E) (sem RPC novo: client_uuid + barreiras) | 🟡 código pronto 08/11/2026 — testar no aparelho |
| ⛔ | Portão: F1–F4 validadas no aparelho real, defeitos corrigidos | ⏳ próximo passo |
| F5 | Tela de pendências/conflitos, testes em modo avião, liberação por empresa/usuário | ⏸ aguarda o portão de validação (F1–F4 no aparelho) |

## Riscos conhecidos

- **Equipe aparece ocupada** no servidor até o encerramento offline sincronizar.
- **Estoque de material** não é garantido offline — validado na sincronização; falta vira alerta ao gestor.
- **Sessão:** JWT expira em ~1h; a sincronização renova antes de enviar. Refresh revogado → fila fica guardada até novo login.
- **Gravação direta pela API** não respeita a trava (só o app e os RPCs de sincronização).
- **Segurança (fora do offline):** `VITE_R2_SECRET_ACCESS_KEY` preenchida em `.env.local` vai para o bundle do APK — migrar para o Worker (`VITE_R2_WORKER_URL`) e rotacionar a chave.
