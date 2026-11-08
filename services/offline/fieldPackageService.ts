import { dataService } from '../dataService';
import { getOfflineStore } from './offlineConfig';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { deleteLockToken, saveLockToken } from './offlineLocks';
import { materialsCatalogKey } from './offlineFlowOps';
import { MATERIALS_CATALOG_LIMIT } from './offlineCatalog';

/**
 * "Preparar para campo" (F1, item 1.5).
 *
 * Com internet, antes de sair:
 *   1. trava os ativos escolhidos pelo técnico (ov_asset_lock) e solta os que
 *      ele desmarcou;
 *   2. chama os MESMOS métodos do dataService, com os MESMOS argumentos que as
 *      telas da visita usam — a camada offline (offlineLayer) guarda cada
 *      resposta, e offline as telas encontram exatamente essas chaves;
 *   3. grava o resumo do pacote (data, ativos travados).
 *
 * Se mudar o que uma tela da visita carrega, atualizar aqui também.
 * Fotos ainda não são baixadas (F3): offline aparecem só se já estiverem no
 * cache do WebView.
 */

export interface FieldPackage {
    visitId: string;
    preparedAt: number;
    preparedByUserId: string;
    /** ovaIds travados para este técnico. */
    lockedOvaIds: string[];
    assetsCount: number;
    /** Leituras que falharam no preparo (0 = pacote completo). */
    failedReads: number;
    /** false = migration da trava ainda não aplicada. */
    lockSupported: boolean;
}

export interface PrepareFieldPackageInput {
    visitId: string;
    userId: string;
    /** Ativos (ovaId) que o técnico vai editar offline. */
    lockOvaIds: string[];
    /** Ativos (ovaId) travados por ele que foram desmarcados. */
    releaseOvaIds?: string[];
    onProgress?: (done: number, total: number) => void;
}

export interface PrepareFieldPackageResult {
    pkg: FieldPackage;
    /** Ativos que não deu para travar (outro técnico já tinha). */
    lockedByOthers: { ovaId: string; userName?: string }[];
}

export const getFieldPackage = async (visitId: string): Promise<FieldPackage | null> => {
    try {
        return await getOfflineStore().get<FieldPackage>(OFFLINE_COLLECTIONS.package, String(visitId));
    } catch {
        return null;
    }
};

export const removeFieldPackage = async (visitId: string): Promise<void> => {
    await getOfflineStore().delete(OFFLINE_COLLECTIONS.package, String(visitId)).catch(() => undefined);
};

/** Ativo travado para este técnico no pacote desta visita? */
export const isOvaLockedInPackage = (pkg: FieldPackage | null, ovaId: string): boolean =>
    !!pkg && pkg.lockedOvaIds.includes(String(ovaId));

/** Executa tarefas com no máximo `limit` em paralelo; conta as que falharam. */
const runLimited = async (
    tasks: (() => Promise<unknown>)[],
    limit: number,
    onDone: () => void,
): Promise<number> => {
    let failed = 0;
    let next = 0;
    const worker = async () => {
        while (next < tasks.length) {
            const task = tasks[next++];
            try {
                await task();
            } catch {
                failed++;
            } finally {
                onDone();
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return failed;
};

export const prepareFieldPackage = async (
    input: PrepareFieldPackageInput,
): Promise<PrepareFieldPackageResult> => {
    const visitId = String(input.visitId);
    const userId = String(input.userId);
    let done = 0;
    let total = 0;
    const tick = () => input.onProgress?.(++done, total);

    // ── 1. Travas ───────────────────────────────────────────────────────────
    const lockedOvaIds: string[] = [];
    const lockedByOthers: PrepareFieldPackageResult['lockedByOthers'] = [];
    let lockSupported = true;

    for (const ovaId of input.releaseOvaIds || []) {
        await dataService.unlockOrderVisitAsset(String(ovaId), false).catch(() => undefined);
        await deleteLockToken(String(ovaId));
    }
    for (const ovaId of input.lockOvaIds) {
        const res = await dataService.lockOrderVisitAsset(String(ovaId));
        if (!res.supported) lockSupported = false;
        if (res.locked) {
            lockedOvaIds.push(String(ovaId));
            await saveLockToken(String(ovaId), res.lockToken);
        }
        else lockedByOthers.push({ ovaId: String(ovaId), userName: res.lockedUserName });
    }

    // ── 2. Visita (OrderVisitScreen, CloseVisitModal, listas) ──────────────
    const visit = await dataService.getActiveOrderVisit(visitId);
    if (!visit) throw new Error('Visita não encontrada.');
    const contractId = visit.contractId ? String(visit.contractId) : '';

    const [assets, vehicles] = await Promise.all([
        dataService.getOrderVisitAssets(visitId),
        dataService.getOrderVisitVehicles(visitId),
    ]);

    const tasks: (() => Promise<unknown>)[] = [
        () => dataService.getOrderVisitById(visitId),
        () => dataService.getOrderVisitTeam(visitId),
        () => dataService.getVisitEvaluations(visitId),
        () => dataService.getOrderVisitServices(visitId),
        () => (visit.oId ? dataService.getOrderById(String(visit.oId)) : Promise.resolve()),
        () => dataService.getSuspendedReasons(),
        () => dataService.getOrderCauseReasons(),
        () => dataService.getAssetStatuses(),
        () => dataService.getAssetPriorities(),
        () => dataService.getClients(),
        () => dataService.getUsers(),
        () => dataService.getUserPermissions(userId),
    ];
    if (contractId) {
        tasks.push(
            () => dataService.getContractManagers(contractId),
            () => dataService.getContractEvaluationRequirements(contractId),
            () => dataService.checkContractUsesManus(contractId),
            () => dataService.getContractServices(contractId),
            () => dataService.isUserContractManager(userId, contractId),
        );
    }
    for (const v of vehicles || []) {
        if (!v.vehicleId) continue;
        tasks.push(
            () => dataService.getPreviousVehicleOdometer(String(v.vehicleId), String(v.id)),
            () => dataService.getRentalContracts(String(v.vehicleId)),
        );
    }

    // ── 3. Ativos (OrderVisitAssetReport, atividades, materiais, checklist) ─
    const providerIds = new Set<string>();
    for (const a of assets || []) {
        const ovaId = String(a.id);
        tasks.push(async () => {
            const data = await dataService.getOrderVisitAssetById(ovaId);
            if (!data) return;
            const sub: (() => Promise<unknown>)[] = [
                () => dataService.getOrderVisitAssetActivities(ovaId),
                () => dataService.getOrderVisitAssetMaterials(ovaId),
                async () => {
                    const providerId = await dataService.getProviderCompanyByOvAssetId(ovaId);
                    if (providerId) providerIds.add(String(providerId));
                },
                () => dataService.getMaintenanceChecklistItemsByVisit(ovaId),
            ];
            if (data.assetId) {
                sub.push(
                    () => dataService.getAssetAlerts(String(data.assetId)),
                    () => dataService.getManualsWithFilesForAssets([String(data.assetId)]),
                );
            }
            if (data.orderTypeId) sub.push(() => dataService.getActivitiesByOrderType(String(data.orderTypeId)));
            if (data.ovId && String(data.ovId) !== visitId) sub.push(() => dataService.getActiveOrderVisit(String(data.ovId)));
            if (data.oContractId) {
                sub.push(
                    () => dataService.isUserContractManager(userId, String(data.oContractId)),
                    () => dataService.getContractManagers(String(data.oContractId)),
                );
            }
            const clientId = data.afterClientId || data.beforeClientId || data.clientId;
            const unitId = data.afterUnitId || data.beforeUnitId;
            if (clientId) sub.push(() => dataService.getUnitsByClient(String(clientId)));
            if (unitId) sub.push(() => dataService.getAssetTagsByUnit(String(unitId)));
            if (data.assetTypeId) sub.push(() => dataService.getMaintenancePlans(String(data.assetTypeId)));

            const planId = data.maintenancePlanId && data.maintenancePlanId !== '0' ? String(data.maintenancePlanId) : '';
            if (planId) {
                sub.push(
                    async () => {
                        const sections = await dataService.getMaintenancePlanSections(planId);
                        await Promise.all((sections || []).map(s => dataService.getMaintenancePlanSectionActivities(String(s.id))));
                    },
                    () => dataService.getMaintenanceChecklistItems(ovaId, planId),
                    () =>
                        data.assetId
                            ? dataService.getGlobalMaintenanceChecklistItems(String(data.assetId), planId, ovaId)
                            : Promise.resolve(),
                );
            }
            total += sub.length;
            const failed = await runLimited(sub, 3, tick);
            if (failed) throw new Error(`${failed} leituras do ativo ${ovaId} falharam`);
        });
    }

    total += tasks.length;
    input.onProgress?.(0, total);
    let failedReads = await runLimited(tasks, 4, tick);

    // ── 4. Catálogo de materiais do fornecedor (busca sem internet, F4) ─────
    const catalogTasks = Array.from(providerIds).map(providerId => async () => {
        // Páginas de 1.000: o PostgREST corta respostas maiores (max_rows) sem avisar.
        const PAGE = 1000;
        const list: unknown[] = [];
        for (let page = 0; list.length < MATERIALS_CATALOG_LIMIT; page++) {
            const chunk = await dataService.getAvailableMaterials('', page, PAGE, providerId);
            list.push(...chunk);
            if (chunk.length < PAGE) break;
        }
        await getOfflineStore().put(OFFLINE_COLLECTIONS.catalog, materialsCatalogKey(providerId), list);
    });
    total += catalogTasks.length;
    failedReads += await runLimited(catalogTasks, 2, tick);

    const pkg: FieldPackage = {
        visitId,
        preparedAt: Date.now(),
        preparedByUserId: userId,
        lockedOvaIds,
        assetsCount: (assets || []).length,
        failedReads,
        lockSupported,
    };
    await getOfflineStore().put(OFFLINE_COLLECTIONS.package, visitId, pkg);
    return { pkg, lockedByOthers };
};
