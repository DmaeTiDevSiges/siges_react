import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { dataService } from '../dataService';
import { networkService } from '../core/networkService';
import { getOfflineStore, isOfflineSupported, isOnline } from './offlineConfig';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { prepareFieldPackage } from './fieldPackageService';
import { getOfflineSyncState, hasUnsentForScope, subscribeOfflineSync } from './offlineSync';
import { downloadMaterialsCatalog, downloadUnitAssets, downloadVehiclesCatalog, removeCatalog, unitAssetsCatalogKey } from './offlineCatalogDownload';
import {
    assetTypesToFetch,
    emptyAutoSyncSaved,
    planAutoSync,
    type AutoSyncSaved,
} from './offlineAutoSyncPlan';

/**
 * Download automático dos dados offline (decisão de 09/11/2026).
 *
 * Sem o técnico tocar em nada, com internet:
 *   1. base: usuários (lista da equipe), materiais da empresa prestadora,
 *      veículos da empresa;
 *   2. todas as OSs abertas da empresa do usuário (status fora de 7/8):
 *      cada UNIDADE uma vez só (ativos, setores), clientes (unidades), tipos
 *      de OS (atividades), a própria OS e os planos de manutenção dos tipos de
 *      ativo dessas unidades;
 *   3. as visitas em andamento do usuário (mesmo pacote do "Preparar para
 *      campo", sem travar ativos — a trava acontece ao abrir o ativo).
 *
 * Quando: ao abrir o app (1ª vez baixa tudo), ao voltar a internet / voltar ao
 * app e a cada 15 min. Incremental: só o que é novo ou tem mais de 1 dia;
 * unidades que saíram das OSs abertas são apagadas do aparelho.
 * As leituras passam pelo dataService, então a camada offline (offlineLayer)
 * guarda cada resposta com a mesma chave que as telas usam.
 */

export interface AutoSyncStatus {
    running: boolean;
    /** Texto curto da etapa ("Unidades", "Planos de manutenção"...). */
    phase: string;
    done: number;
    total: number;
    lastSuccessAt?: number;
    lastError?: string;
}

/** Dados de unidades/planos/OSs: refaz se tiver mais de 1 dia. */
const DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Visita em andamento: atualiza o pacote a cada 30 min (ou ao abrir/reconectar). */
const VISIT_MAX_AGE_MS = 30 * 60 * 1000;
const INTERVAL_MS = 15 * 60 * 1000;
/** Reconexões seguidas não disparam vários downloads. */
const MIN_GAP_MS = 2 * 60 * 1000;
const STATE_KEY = 'state';

type Trigger = 'start' | 'reconnect' | 'resume' | 'interval' | 'manual';

interface AutoSyncUser {
    id?: string | number;
    companyId?: string | number;
}

let status: AutoSyncStatus = { running: false, phase: '', done: 0, total: 0 };
const listeners = new Set<(s: AutoSyncStatus) => void>();
let currentUser: AutoSyncUser | null = null;
let lastRunAt = 0;
let started = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

const emit = (patch: Partial<AutoSyncStatus>) => {
    status = { ...status, ...patch };
    listeners.forEach(l => l(status));
};

export const getAutoSyncStatus = (): AutoSyncStatus => status;
export const subscribeAutoSync = (listener: (s: AutoSyncStatus) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

class OfflineAbort extends Error {}

const loadSaved = async (userId: string, companyId: string): Promise<AutoSyncSaved> => {
    try {
        const saved = await getOfflineStore().get<AutoSyncSaved>(OFFLINE_COLLECTIONS.autosync, STATE_KEY);
        // Outro usuário/empresa no aparelho: começa do zero.
        if (saved && saved.userId === userId && saved.companyId === companyId) return { ...emptyAutoSyncSaved(userId, companyId), ...saved };
    } catch {
        /* sem estado */
    }
    return emptyAutoSyncSaved(userId, companyId);
};

const saveState = (saved: AutoSyncSaved) =>
    getOfflineStore().put(OFFLINE_COLLECTIONS.autosync, STATE_KEY, saved).catch(() => undefined);

/** Executa as tarefas com limite de paralelismo; para tudo se a internet cair. */
const runTasks = async (tasks: (() => Promise<unknown>)[], limit: number, onDone: () => void): Promise<number> => {
    let failed = 0;
    let next = 0;
    const worker = async () => {
        while (next < tasks.length) {
            if (!isOnline()) throw new OfflineAbort();
            const task = tasks[next++];
            try {
                await task();
            } catch (e) {
                if (!isOnline()) throw new OfflineAbort();
                failed++;
                console.warn('[offline-auto] leitura falhou:', e);
            }
            onDone();
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return failed;
};

const runOnce = async (trigger: Trigger): Promise<void> => {
    const user = currentUser;
    const userId = user?.id != null ? String(user.id) : '';
    const companyId = user?.companyId != null ? String(user.companyId) : '';
    if (!userId || !companyId) return;

    const now = Date.now();
    const saved = await loadSaved(userId, companyId);
    let done = 0;
    let total = 0;
    const tick = () => emit({ done: ++done, total });
    const addTotal = (n: number) => emit({ total: (total += n) });
    let failed = 0;

    emit({ running: true, phase: 'Verificando OSs abertas', done: 0, total: 0, lastError: undefined });

    // ── 1. OSs abertas → plano incremental ─────────────────────────────────
    const openOrders = await dataService.getOpenOrdersForOffline(companyId);
    const plan = planAutoSync(saved, openOrders, now, DATA_MAX_AGE_MS);
    const forceVisits = trigger === 'start' || trigger === 'reconnect' || trigger === 'manual';
    const visitIds = await dataService.getOpenVisitIdsByUser(userId).catch(() => [] as string[]);
    // Visita com alterações ainda não enviadas fica de fora: o pacote novo viria
    // do servidor SEM elas e esconderia o que o técnico fez. Atualiza na próxima
    // rodada, depois que a fila subir.
    const visitsToFetch = visitIds.filter(
        v => !hasUnsentForScope(`visit:${v}`) && (forceVisits || !saved.visits[v] || now - saved.visits[v] >= VISIT_MAX_AGE_MS),
    );

    // ── 2. Base + unidades + clientes + tipos de OS + OSs ──────────────────
    emit({ phase: 'Unidades e OSs abertas' });
    const unitAssets: Record<string, any[]> = {};
    const stamp = (bucket: Record<string, number>, id: string) => () => {
        bucket[id] = Date.now();
    };
    const tasks: (() => Promise<unknown>)[] = [
        () => dataService.getUsers(),
        () => downloadMaterialsCatalog(companyId, DATA_MAX_AGE_MS),
        () => downloadVehiclesCatalog(companyId, DATA_MAX_AGE_MS),
        ...plan.unitsToFetch.map(unitId => async () => {
            unitAssets[unitId] = await downloadUnitAssets(unitId);
            await dataService.getAssetTagsByUnit(unitId);
            stamp(saved.units, unitId)();
        }),
        ...plan.clientsToFetch.map(clientId => async () => {
            await dataService.getUnitsByClient(clientId);
            stamp(saved.clients, clientId)();
        }),
        ...plan.orderTypesToFetch.map(typeId => async () => {
            await dataService.getActivitiesByOrderType(typeId);
            stamp(saved.orderTypes, typeId)();
        }),
        ...plan.ordersToFetch.map(orderId => async () => {
            await dataService.getOrderById(orderId);
            const ref = openOrders.find(o => o.id === orderId);
            saved.orders[orderId] = ref?.updatedAt ?? '';
        }),
    ];
    addTotal(tasks.length);
    failed += await runTasks(tasks, 4, tick);

    // Unidades/OSs que não estão mais abertas: sai do aparelho.
    for (const unitId of plan.unitsToDrop) {
        await removeCatalog(unitAssetsCatalogKey(unitId));
        delete saved.units[unitId];
    }
    for (const orderId of plan.ordersToDrop) delete saved.orders[orderId];

    // ── 3. Planos de manutenção dos tipos de ativo das unidades ────────────
    emit({ phase: 'Planos de manutenção' });
    const allAssets: any[] = [];
    for (const unitId of plan.unitsNeeded) {
        allAssets.push(...(unitAssets[unitId] || (await downloadUnitAssets(unitId, Number.MAX_SAFE_INTEGER).catch(() => []))));
    }
    const planStructures = new Set<string>();
    const typeTasks = assetTypesToFetch(saved, allAssets, now, DATA_MAX_AGE_MS).map(typeId => async () => {
        const plans = await dataService.getMaintenancePlans(typeId);
        for (const p of plans || []) {
            const planId = p?.id != null ? String(p.id) : '';
            if (!planId || planStructures.has(planId)) continue;
            planStructures.add(planId);
            const sections = await dataService.getMaintenancePlanSections(planId);
            await Promise.all((sections || []).map(s => dataService.getMaintenancePlanSectionActivities(String(s.id))));
        }
        saved.assetTypes[typeId] = Date.now();
    });
    addTotal(typeTasks.length);
    failed += await runTasks(typeTasks, 3, tick);

    // ── 4. Visitas em andamento do usuário (sem travar) ────────────────────
    if (visitsToFetch.length) {
        emit({ phase: 'Visitas em andamento' });
        const visitTasks = visitsToFetch.map(visitId => async () => {
            await prepareFieldPackage({ visitId, userId, lockOvaIds: [], auto: true });
            saved.visits[visitId] = Date.now();
        });
        addTotal(visitTasks.length);
        failed += await runTasks(visitTasks, 1, tick);
    }
    for (const visitId of Object.keys(saved.visits)) if (!visitIds.includes(visitId)) delete saved.visits[visitId];

    if (failed === 0) saved.lastSuccessAt = Date.now();
    await saveState(saved);
    emit({
        lastSuccessAt: saved.lastSuccessAt,
        lastError: failed > 0 ? `${failed} ${failed === 1 ? 'item não baixou' : 'itens não baixaram'} — nova tentativa em 15 min` : undefined,
    });
};

/** Dispara uma atualização (ignora se já estiver rodando ou sem internet). */
export const runOfflineAutoSync = async (trigger: Trigger = 'manual'): Promise<void> => {
    if (!isOfflineSupported() || !currentUser || status.running) return;
    if (!isOnline()) return;
    if (trigger !== 'manual' && trigger !== 'start' && Date.now() - lastRunAt < MIN_GAP_MS) return;
    lastRunAt = Date.now();
    try {
        await runOnce(trigger);
    } catch (e: any) {
        if (!(e instanceof OfflineAbort)) {
            console.warn('[offline-auto] falhou:', e);
            emit({ lastError: 'Não foi possível atualizar os dados offline' });
        }
    } finally {
        emit({ running: false, phase: '' });
    }
};

/**
 * Usuário logado (ou null no logout). Na 1ª chamada liga os gatilhos; trocar
 * de usuário dispara um download novo.
 */
export const setOfflineAutoSyncUser = (user: AutoSyncUser | null): void => {
    const previousId = currentUser?.id != null ? String(currentUser.id) : '';
    currentUser = user && user.id != null && user.companyId != null ? user : null;
    if (!isOfflineSupported() || !currentUser) return;

    if (!started) {
        started = true;
        // Internet voltou: primeiro a fila sobe (offlineSync), depois o download.
        networkService.subscribe(s => {
            if (s.isConnected) setTimeout(() => runOfflineAutoSync('reconnect'), 5000);
        });
        // Fila esvaziou depois de uma rodada com visitas puladas → atualiza os pacotes.
        let hadPending = getOfflineSyncState().summary.pending > 0;
        subscribeOfflineSync(state => {
            const pending = state.summary.pending > 0;
            if (hadPending && !pending && !state.syncing) {
                lastRunAt = 0;
                setTimeout(() => runOfflineAutoSync('reconnect'), 3000);
            }
            hadPending = pending;
        });
        if (Capacitor.isNativePlatform()) {
            App.addListener('resume', () => {
                if (Date.now() - lastRunAt >= INTERVAL_MS) runOfflineAutoSync('resume');
            }).catch(() => undefined);
        }
        intervalId = setInterval(() => runOfflineAutoSync('interval'), INTERVAL_MS);
    }
    if (previousId !== String(currentUser.id)) {
        // Espera a abertura do app assentar antes de baixar.
        setTimeout(() => runOfflineAutoSync('start'), 8000);
    }
};

/** Só para testes. */
export const __resetOfflineAutoSync = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    started = false;
    currentUser = null;
    lastRunAt = 0;
    status = { running: false, phase: '', done: 0, total: 0 };
};
