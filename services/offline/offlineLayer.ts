import { toast } from 'sonner';
import { cachedRead, OfflineCacheMissError, type ReadCacheDeps } from './readCache';
import { getOfflineStore, isOfflinePlatform, isOfflineSupported, isOnline } from './offlineConfig';
import { networkFailureCount } from './networkFailures';
import { OFFLINE_OPS, registerOfflineOps, setOfflineOpsStore, visitOfOva, type OfflineOpContext, type OfflineOpSpec } from './offlineOps';
import { OFFLINE_FLOW_OPS } from './offlineFlowOps';
import { searchMaterialsOffline, searchVehiclesOffline } from './offlineCatalog';
import { OFFLINE_FILE_OPS } from './offlineFileOps';
import { deleteOfflineFile, initOfflineFiles, isOfflineFileRef } from './offlineFiles';
import {
    getOfflineSyncState,
    getOutbox,
    hasUnsentFor,
    hasUnsentForScope,
    initOfflineSync,
    scheduleSync,
    startOfflineSync,
    syncNow,
} from './offlineSync';
import { readStoredSessionUserId } from '../core/supabase';

/**
 * Camada offline instalada sobre o dataService (F1).
 *
 * As views continuam chamando só o dataService. Com o modo offline disponível
 * (offlineConfig.isOfflineSupported), os métodos abaixo passam a:
 *   - LEITURA  (grupo A do inventário): rede primeiro, cache como reserva;
 *   - GRAVAÇÃO grupo B (offlineOps.ts) e arquivos D (offlineFileOps.ts, F3):
 *     sem internet → fila (outbox), o cache é atualizado e a tela segue; o
 *     syncEngine envia ao reconectar;
 *   - demais GRAVAÇÕES (C–F): offline, recusadas com aviso; online, esperam a
 *     fila esvaziar — "Relatar" não passa na frente de alterações pendentes.
 * Com o modo offline indisponível, nada muda: o método original é chamado.
 *
 * Inventário: docs/OFFLINE_MODO_CAMPO.md.
 */

/** Grupo A — leituras da visita (+ apoio usado na abertura do app). */
export const OFFLINE_READ_METHODS = [
    // Visita
    'getActiveOrderVisit',
    'getOrderVisitById',
    'getOrderVisitTeam',
    'getOrderById',
    'getContractManagers',
    'isUserContractManager',
    'getContractEvaluationRequirements',
    'getVisitEvaluations',
    'checkContractUsesManus',
    'getSuspendedReasons',
    'getOrderCauseReasons',
    'getUsers',
    'getUserPermissions',
    // Ativos
    'getOrderVisitAssets',
    'getOrderVisitAssetById',
    'getOrderVisitAssetActivities',
    'getOrderVisitAssetMaterials',
    'getActivitiesByOrderType',
    'getAssetAlerts',
    'getAssetStatuses',
    'getAssetPriorities',
    'getClients',
    'getUnitsByClient',
    'getAssetTagsByUnit',
    'getManualsWithFilesForAssets',
    // Checklist / planos
    'getMaintenancePlans',
    'getMaintenancePlanSections',
    'getMaintenancePlanSectionActivities',
    'getMaintenanceChecklistItems',
    'getMaintenanceChecklistItemsByVisit',
    'getGlobalMaintenanceChecklistItems',
    // Materiais
    'getProviderCompanyByOvAssetId',
    // Serviços
    'getOrderVisitServices',
    'getContractServices',
    // Veículos
    'getOrderVisitVehicles',
    'getPreviousVehicleOdometer',
    'getRentalContracts',
] as const;

/** Grupos B–F — gravações da visita (B vai para a fila; C–F, ver acima). */
export const OFFLINE_WRITE_METHODS = [
    // B — simples
    'updateOrderVisitAsset',
    'updateOrderVisitAssetPlan',
    'updateOrderVisitAssetProgress',
    'updateMaterialInAsset',
    'updateOrderVisitService',
    'updateVehicleKm',
    'updateAssetAlert',
    'toggleOrderVisitAssetActivity',
    'upsertMaintenanceChecklistItem',
    'deleteMaintenanceChecklistItem',
    // C — inserts / remoções
    'addMaterialToAsset',
    'addServiceToOrderVisit',
    'addVehicleToOrderVisit',
    'addIdleToOrderVisit',
    'addAssetToOrderVisit',
    'removeMaterialFromAsset',
    'removeServiceFromOrderVisit',
    'removeVehicleFromOrderVisit',
    'removeAssetFromOrderVisit',
    'addTeamMember',
    'removeTeamMember',
    // D — arquivos
    'uploadOrderVisitAssetPhoto',
    'removeOrderVisitAssetPhoto',
    'updateAssetPhotoFromReport',
    'uploadChecklistImage',
    'removeChecklistImage',
    'saveOrderVisitSignature',
    'deleteOrderVisitSignature',
    // E — fluxo
    'reportedOrderVisitAsset',
    'updateOrderVisitAssetProcessingStatus',
    'reportOrderVisit',
    'closeOrderVisit',
    // F — só online
    'disapproveOrderVisitAsset',
    'disapproveOrderVisit',
    'fileOrderVisit',
    'markOrderVisitAsRevised',
    'reverseOrderVisitApproval',
    'deleteOrderVisit',
    'changeOrderVisitAsset',
    'lockOrderVisitAsset',
    'unlockOrderVisitAsset',
] as const;

/**
 * Leituras complementares sem cache (ex.: veículo incluído sem internet): sem
 * aviso, devolvem "vazio" — a tela segue sem o Km anterior / contrato de locação.
 */
const OPTIONAL_READ_FALLBACKS: Record<string, () => unknown> = {
    getPreviousVehicleOdometer: () => null,
    getRentalContracts: () => [],
};

export class OfflineWriteBlockedError extends Error {
    readonly method: string;
    constructor(method: string) {
        super('Sem internet. Esta ação só pode ser feita com conexão.');
        this.name = 'OfflineWriteBlockedError';
        this.method = method;
    }
}

// As views mostram o próprio "Erro ao …"; este aviso explica o motivo real.
// Um por vez (várias chamadas em paralelo falham juntas).
let lastNoticeAt = 0;
const notifyOnce = (message: string) => {
    const now = Date.now();
    if (now - lastNoticeAt < 4000) return;
    lastNoticeAt = now;
    try {
        toast.warning(message, { id: 'offline-notice' });
    } catch {
        /* sem UI (testes) */
    }
};

export const offlineReadDeps = (): ReadCacheDeps => ({
    store: getOfflineStore(),
    isOnline,
    failureCount: networkFailureCount,
    onWriteError: e => console.warn('[offline] falha ao gravar cache:', e),
});

type AnyFn = (...args: any[]) => any;

/** Métodos originais do dataService (sem a camada) — a fila reexecuta estes. */
const originals: Record<string, AnyFn> = {};

const looksLikeNetworkError = (e: any): boolean => {
    const msg = String(e?.message || e || '').toLowerCase();
    return ['failed to fetch', 'network', 'load failed', 'timeout', 'aborted'].some(t => msg.includes(t));
};

export class OfflinePendingSyncError extends Error {
    constructor() {
        super('Há alterações feitas sem internet ainda não enviadas. Aguarde a sincronização (ou resolva as pendências na visita) e tente de novo.');
        this.name = 'OfflinePendingSyncError';
    }
}

// Gravações que não esperam a fila (metadados da própria trava).
const NO_SYNC_GATE = new Set(['lockOrderVisitAsset', 'unlockOrderVisitAsset']);

const opContext = (): OfflineOpContext => ({
    store: getOfflineStore(),
    now: Date.now,
    tempId: () => `tmp:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
});

/** Ativo e visita da operação (trava e barreiras). */
const scopeOf = async (spec: OfflineOpSpec, args: any[]): Promise<{ ovaId?: string; visitId?: string }> => {
    let ovaId: string | undefined;
    let visitId: string | undefined;
    try {
        ovaId = (await spec.ovaId?.(args)) || undefined;
    } catch {
        ovaId = undefined;
    }
    try {
        visitId = (await spec.visitId?.(args)) || (ovaId ? await visitOfOva(ovaId) : undefined) || undefined;
    } catch {
        visitId = undefined;
    }
    return { ovaId, visitId };
};

/** F4: "Relatar"/"Encerrar" com internet também esperam as pendentes do ativo/visita. */
const behindBarrier = async (spec: OfflineOpSpec, args: any[]): Promise<boolean> => {
    if (!spec.barrier) return false;
    const { ovaId, visitId } = await scopeOf(spec, args);
    const scope = spec.barrier === 'ova' ? (ovaId ? `ova:${ovaId}` : '') : visitId ? `visit:${visitId}` : '';
    return !!scope && hasUnsentForScope(scope);
};

/** Guarda a gravação na fila, atualiza o cache e devolve o que a tela espera. */
const enqueueWrite = async (name: string, rawArgs: any[]): Promise<unknown> => {
    const spec = OFFLINE_OPS[name];
    const outbox = getOutbox();
    if (!outbox) throw new OfflineWriteBlockedError(name);

    // F3: arquivo → salvo no aparelho com o nome final; na fila vai a referência.
    const args = spec.prepareArgs ? await spec.prepareArgs(rawArgs) : rawArgs;

    // F3: ex.: remover uma foto que ainda não subiu anula o envio dela.
    let cancelled: { method: string; args: unknown[] }[] = [];
    if (spec.cancelsPending) {
        cancelled = await outbox.removeWhere(op => op.status === 'pending' && spec.cancelsPending!(args, op));
        for (const op of cancelled) {
            for (const a of op.args) if (isOfflineFileRef(a)) await deleteOfflineFile(a.name);
        }
    }
    const skip =
        cancelled.length > 0 &&
        (typeof spec.skipIfCancelled === 'function' ? spec.skipIfCancelled(cancelled) : !!spec.skipIfCancelled);

    if (!skip) {
        const { ovaId, visitId } = await scopeOf(spec, args);
        await outbox.enqueue({ method: name, args, userUuid: await readStoredSessionUserId(), ovaId, visitId });
    }

    let value: unknown;
    try {
        value = await spec.applyLocal(opContext(), args);
    } catch (e) {
        console.warn(`[offline] ${name}: alteração na fila, mas o cache local não foi atualizado:`, e);
    }
    notifyOnce('Sem internet: alteração salva no aparelho. Ela será enviada quando a conexão voltar.');
    scheduleSync();
    return value;
};

export const installOfflineLayer = (target: Record<string, any>): void => {
    if ((target as any).__offlineLayerInstalled) return;
    Object.defineProperty(target, '__offlineLayerInstalled', { value: true });
    setOfflineOpsStore(getOfflineStore());
    registerOfflineOps(OFFLINE_FILE_OPS);
    registerOfflineOps(OFFLINE_FLOW_OPS);

    // F4: busca de materiais sem internet → catálogo baixado no preparo.
    const originalSearch = target.getAvailableMaterials as AnyFn | undefined;
    if (typeof originalSearch === 'function') {
        target.getAvailableMaterials = function (this: unknown, ...args: any[]) {
            if (!isOfflineSupported() || isOnline()) return originalSearch.apply(this, args);
            return searchMaterialsOffline(getOfflineStore(), args[0], args[1], args[2], args[3]);
        };
    }

    // Inclusão de veículo sem internet → cadastro da empresa baixado no preparo.
    const originalVehicleSearch = target.searchVehicles as AnyFn | undefined;
    if (typeof originalVehicleSearch === 'function') {
        target.searchVehicles = function (this: unknown, ...args: any[]) {
            if (!isOfflineSupported() || isOnline()) return originalVehicleSearch.apply(this, args);
            return searchVehiclesOffline(getOfflineStore(), args[0], args[1], args[2]);
        };
    }

    for (const name of OFFLINE_READ_METHODS) {
        const original = target[name] as AnyFn | undefined;
        if (typeof original !== 'function') {
            console.warn(`[offline] dataService.${name} não existe — fora do cache.`);
            continue;
        }
        target[name] = function (this: unknown, ...args: any[]) {
            if (!isOfflineSupported()) return original.apply(this, args);
            return cachedRead(offlineReadDeps(), name, args, () => original.apply(this, args)).catch(error => {
                if (error instanceof OfflineCacheMissError) {
                    if (name in OPTIONAL_READ_FALLBACKS) return OPTIONAL_READ_FALLBACKS[name]();
                    notifyOnce(error.message);
                }
                throw error;
            });
        };
    }

    for (const name of OFFLINE_WRITE_METHODS) {
        const original = target[name] as AnyFn | undefined;
        if (typeof original !== 'function') {
            console.warn(`[offline] dataService.${name} não existe — sem tratamento offline.`);
            continue;
        }
        originals[name] = (...args: any[]) => original.apply(target, args);
        const spec = OFFLINE_OPS[name];

        if (spec) {
            // F2 — grupo B: sem internet (ou atrás de uma pendente do mesmo registro) → fila.
            target[name] = async function (this: unknown, ...args: any[]) {
                if (!isOfflineSupported()) return original.apply(this, args);
                const behindQueue = hasUnsentFor(spec.entityKey(args)) || (await behindBarrier(spec, args));
                if (isOnline() && !behindQueue) {
                    const before = networkFailureCount();
                    try {
                        const result = await original.apply(this, args);
                        if (networkFailureCount() === before) {
                            // Mantém o cache igual ao servidor (se cair a rede logo depois).
                            if (!spec.skipLocalOnOnline) spec.applyLocal(opContext(), args).catch(() => undefined);
                            return result;
                        }
                        // O serviço "engoliu" uma falha de rede: reenviar pela fila (idempotente).
                    } catch (error) {
                        const network = networkFailureCount() !== before || !isOnline() || looksLikeNetworkError(error);
                        if (!network) throw error;
                    }
                }
                return enqueueWrite(name, args);
            };
            continue;
        }

        // Demais gravações: offline = recusadas; online = esperam a fila esvaziar.
        target[name] = async function (this: unknown, ...args: any[]) {
            if (!isOfflineSupported() && !getOfflineSyncState().summary.total) return original.apply(this, args);
            if (!isOnline()) {
                if (!isOfflineSupported()) return original.apply(this, args);
                const error = new OfflineWriteBlockedError(name);
                notifyOnce(error.message);
                throw error;
            }
            if (!NO_SYNC_GATE.has(name)) {
                let { summary } = getOfflineSyncState();
                if (summary.pending > 0) {
                    await syncNow().catch(() => undefined);
                    summary = getOfflineSyncState().summary;
                }
                if (summary.pending > 0 || summary.errors > 0) {
                    const error = new OfflinePendingSyncError();
                    notifyOnce(error.message);
                    throw error;
                }
            }
            return original.apply(this, args);
        };
    }

    // A fila roda no APK/dev mesmo com a flag desligada: o que ficou no aparelho é enviado.
    if (isOfflinePlatform()) {
        initOfflineSync(originals);
        startOfflineSync();
        initOfflineFiles().catch(e => console.warn('[offline] arquivos locais:', e));
    }
};
