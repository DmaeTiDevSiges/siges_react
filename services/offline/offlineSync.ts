import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { supabase, readStoredSessionUserId } from '../core/supabase';
import { networkService } from '../core/networkService';
import { logClientEvent } from '../core/clientDiagnosticsService';
import { isOfflineTelemetryAvailable } from './offlineGate';
import { getOfflineStore, isOnline } from './offlineConfig';
import { networkFailureCount } from './networkFailures';
import { createOutbox, type Outbox, type OutboxOp, type OutboxStorage, type OutboxSummary } from './outbox';
import { backoffMs, replaceDeep, runSync, type ErrorKind, type SyncResult } from './syncEngine';
import { OFFLINE_OPS, opEntityKey } from './offlineOps';
import { deleteLockToken, getLockToken, saveLockToken } from './offlineLocks';
import { isTmpId, TMP_PREFIX } from './offlineFlowOps';
import { findIdByOfflineUuid } from '../core/offlineUuidInsert';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { isIndexedDbAvailable } from './store/indexedDbStore';
import { deleteOfflineFile, isOfflineFileRef, loadOfflineFile, markOfflineFileUploaded } from './offlineFiles';
import { dependentsOf } from './pendingOps';

/**
 * Liga a fila (outbox) e o motor (syncEngine) ao app (F2).
 * Inicializado pelo offlineLayer, que entrega os métodos ORIGINAIS do
 * dataService (sem a camada offline) — é o que a fila reexecuta.
 */

const OUTBOX_KEY = 'siges_offline_outbox_v1';
/** Coleção da fila no store do navegador (IndexedDB). */
const OUTBOX_COLLECTION = 'outbox';

const platformStorage = (): OutboxStorage => {
    if (Capacitor.isNativePlatform()) {
        return {
            async load() {
                const { value } = await Preferences.get({ key: OUTBOX_KEY });
                return value ? (JSON.parse(value) as OutboxOp[]) : [];
            },
            async save(ops) {
                await Preferences.set({ key: OUTBOX_KEY, value: JSON.stringify(ops) });
            },
        };
    }
    // Navegador (dev): IndexedDB (via store offline), sem o limite de ~5 MB do
    // localStorage. A fila antiga no localStorage é migrada uma vez.
    if (isIndexedDbAvailable()) {
        const store = getOfflineStore();
        return {
            async load() {
                const saved = await store.get<OutboxOp[]>(OUTBOX_COLLECTION, OUTBOX_KEY);
                if (saved) return saved;
                try {
                    const legacy = window.localStorage.getItem(OUTBOX_KEY);
                    if (legacy) {
                        const ops = JSON.parse(legacy) as OutboxOp[];
                        await store.put(OUTBOX_COLLECTION, OUTBOX_KEY, ops);
                        window.localStorage.removeItem(OUTBOX_KEY);
                        return ops;
                    }
                } catch {
                    /* sem fila antiga */
                }
                return [];
            },
            async save(ops) {
                await store.put(OUTBOX_COLLECTION, OUTBOX_KEY, ops);
            },
        };
    }
    // Sem IndexedDB: localStorage. Atenção: o logout limpa o localStorage — só para testes.
    return {
        async load() {
            const raw = window.localStorage.getItem(OUTBOX_KEY);
            return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
        },
        async save(ops) {
            window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(ops));
        },
    };
};

export interface OfflineSyncState {
    summary: OutboxSummary;
    syncing: boolean;
    lastResult?: SyncResult;
    lastSyncAt?: number;
    /** ovaIds com operações ainda não enviadas (pendente/erro/conflito). */
    unsentOvaIds: string[];
}

type AnyFn = (...args: any[]) => any;

let outbox: Outbox | null = null;
let originals: Record<string, AnyFn> = {};
let state: OfflineSyncState = {
    summary: { pending: 0, errors: 0, conflicts: 0, total: 0 },
    syncing: false,
    unsentOvaIds: [],
};
let unsentKeys = new Set<string>();
let unsentScopes = new Set<string>();
const listeners = new Set<(s: OfflineSyncState) => void>();
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let running: Promise<SyncResult> | null = null;
let failedRounds = 0;

const emit = (patch: Partial<OfflineSyncState>) => {
    state = { ...state, ...patch };
    listeners.forEach(l => {
        try {
            l(state);
        } catch {
            /* ignora */
        }
    });
};

const looksLikeNetworkError = (e: any): boolean => {
    const msg = String(e?.message || e || '').toLowerCase();
    return e?.name === 'AuthRetryableFetchError' || ['failed to fetch', 'network', 'load failed', 'timeout', 'aborted'].some(t => msg.includes(t));
};

export const classifySyncError = (e: unknown, networkFailed: boolean): ErrorKind => {
    if (networkFailed || looksLikeNetworkError(e)) return 'network';
    // flow_order_visit_close_v4: visita já encerrada por outra pessoa/aparelho.
    if ((e as any)?.code === 'SG409') return 'conflict';
    return 'error';
};

/** F4: depois de "Relatar ativo" subir, solta a trava e tira o ativo do pacote. */
const unlockOvaAfterSync = async (ovaId: string, visitId?: string) => {
    await originals.unlockOrderVisitAsset?.(ovaId, false);
    await deleteLockToken(ovaId);
    if (visitId) {
        const store = getOfflineStore();
        const pkg = await store.get<any>(OFFLINE_COLLECTIONS.package, visitId).catch(() => null);
        if (pkg?.lockedOvaIds?.includes(ovaId)) {
            await store.put(OFFLINE_COLLECTIONS.package, visitId, {
                ...pkg,
                lockedOvaIds: pkg.lockedOvaIds.filter((id: string) => id !== ovaId),
            });
        }
    }
};

/** Trava conferida antes de enviar as operações de um ativo. */
const checkLock = async (ovaId: string) => {
    const lockFn = originals.lockOrderVisitAsset;
    if (!lockFn) return 'ok' as const;
    const res = await lockFn(ovaId);
    if (!res?.supported) return 'ok' as const;
    if (!res.locked) return 'conflict' as const;
    const saved = await getLockToken(ovaId);
    if (saved && res.lockToken && saved !== res.lockToken) return 'conflict' as const;
    if (!saved) await saveLockToken(ovaId, res.lockToken);
    return 'ok' as const;
};

const doSync = async (): Promise<SyncResult> => {
    if (!outbox) throw new Error('Fila offline não inicializada');
    emit({ syncing: true });
    try {
        const result = await runSync({
            outbox,
            isOnline,
            sessionUserUuid: readStoredSessionUserId,
            ensureSession: async () => {
                const { data, error } = await supabase.auth.getSession();
                if (error || !data.session) throw error || new Error('Sem sessão');
            },
            execute: async op => {
                const fn = originals[op.method];
                if (!fn) throw new Error(`Operação desconhecida: ${op.method}`);
                const spec = OFFLINE_OPS[op.method];
                // F3: referência a arquivo do aparelho → File / data URL de novo.
                const refs = op.args.filter(isOfflineFileRef);
                const args = await Promise.all(op.args.map(a => (isOfflineFileRef(a) ? loadOfflineFile(a) : a)));
                // Visita iniciada offline (etapa 3): o "tmp:" dela vira o id real em
                // TODOS os argumentos (exceto no próprio "Iniciar", que vai criá-la).
                if (op.visitId && isTmpId(op.visitId) && op.method !== 'startOrderVisit') {
                    const realVisit = await findIdByOfflineUuid('orders_visits', op.visitId.slice(TMP_PREFIX.length));
                    if (!realVisit) throw new Error('A visita iniciada sem internet ainda não chegou ao servidor.');
                    for (let i = 0; i < args.length; i++) args[i] = replaceDeep(args[i], op.visitId, realVisit);
                }
                // Ativo criado offline: o "tmp:" dele vira o id real em TODOS os
                // argumentos (exceto na própria inclusão, que ainda vai criá-lo).
                if (op.ovaId && isTmpId(op.ovaId) && op.method !== 'addAssetToOrderVisit') {
                    const realOva = await findIdByOfflineUuid('orders_visits_assets', op.ovaId.slice(TMP_PREFIX.length));
                    if (!realOva) throw new Error('O ativo incluído sem internet ainda não chegou ao servidor.');
                    for (let i = 0; i < args.length; i++) args[i] = replaceDeep(args[i], op.ovaId, realOva);
                }
                // F4: item criado offline ("tmp:<uuid>") → id real pelo offline_uuid.
                if (spec?.tmpIdTable && isTmpId(args[0])) {
                    const realId = await findIdByOfflineUuid(spec.tmpIdTable, String(args[0]).slice(TMP_PREFIX.length));
                    if (!realId) throw new Error('O item criado sem internet ainda não chegou ao servidor.');
                    args[0] = realId;
                }
                await fn(...args);
                for (const ref of refs) await markOfflineFileUploaded(ref.name);
                if (spec?.afterSync) {
                    await spec.afterSync(args, { unlockOva: id => unlockOvaAfterSync(id, op.visitId) }).catch(e =>
                        console.warn(`[offline] ${op.method}: pós-envio falhou:`, e),
                    );
                }
            },
            checkLock,
            failureCount: networkFailureCount,
            classifyError: classifySyncError,
            entityKey: op => opEntityKey(op.method, op.args),
            barrier: op => OFFLINE_OPS[op.method]?.barrier,
            isTemporaryId: isTmpId,
        });
        const summary = await outbox.summary();
        if (result.stoppedByNetwork && summary.pending > 0) {
            failedRounds++;
            scheduleSync(backoffMs(failedRounds));
        } else {
            failedRounds = 0;
        }
        emit({ lastResult: result, lastSyncAt: Date.now() });
        reportSyncTelemetry(result, summary).catch(() => undefined);
        return result;
    } finally {
        emit({ syncing: false });
    }
};

/** Envia agora (uma rodada por vez — chamadas simultâneas esperam a mesma). */
export const syncNow = (): Promise<SyncResult> => {
    if (!running) {
        running = doSync().finally(() => {
            running = null;
        });
    }
    return running;
};

export const scheduleSync = (delayMs = 1500): void => {
    if (!outbox) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        if (isOnline()) syncNow().catch(e => console.warn('[offline] sincronização falhou:', e));
    }, delayMs);
};

export const initOfflineSync = (originalMethods: Record<string, AnyFn>): void => {
    originals = originalMethods;
    if (outbox) return;
    outbox = createOutbox(platformStorage());
    outbox.subscribe((summary, ops) => {
        // Toda operação na fila (pendente, erro ou conflito) ainda não chegou ao servidor.
        unsentKeys = new Set(ops.map(o => opEntityKey(o.method, o.args)));
        unsentScopes = new Set(
            ops.flatMap(o => [o.ovaId ? `ova:${o.ovaId}` : '', o.visitId ? `visit:${o.visitId}` : ''].filter(Boolean)),
        );
        emit({
            summary,
            unsentOvaIds: Array.from(new Set(ops.map(o => o.ovaId).filter(Boolean) as string[])),
        });
    });
};

/** Começa a escutar rede / volta ao app / relógio. Idempotente. */
export const startOfflineSync = (): void => {
    if (started || !outbox) return;
    started = true;
    watchOfflineTime(); // F5: mede quanto tempo o aparelho ficou sem internet
    networkService.subscribe(s => {
        if (s.isConnected) {
            failedRounds = 0;
            scheduleSync(800);
        }
    });
    if (Capacitor.isNativePlatform()) {
        App.addListener('resume', () => scheduleSync(800)).catch(() => undefined);
    }
    setInterval(() => {
        if (state.summary.pending > 0 && !running && !timer) scheduleSync(0);
    }, 60_000);
    scheduleSync(3000);
};

export const getOutbox = (): Outbox | null => outbox;

/** Há operação não enviada (pendente/erro/conflito) para este registro? */
export const hasUnsentFor = (entityKey: string): boolean => unsentKeys.has(entityKey);

/** F4: há operação não enviada deste ativo ("ova:<id>") ou visita ("visit:<id>")? */
export const hasUnsentForScope = (scope: string): boolean => unsentScopes.has(scope);

export const getOfflineSyncState = (): OfflineSyncState => state;

export const subscribeOfflineSync = (listener: (s: OfflineSyncState) => void): (() => void) => {
    listeners.add(listener);
    listener(state);
    return () => {
        listeners.delete(listener);
    };
};

export const retryOfflineErrors = async (): Promise<void> => {
    if (!outbox) return;
    await outbox.retryErrors();
    scheduleSync(0);
};

export const discardOfflineConflicts = async (): Promise<number> => (outbox ? outbox.discard('conflict') : 0);

export const discardOfflineErrors = async (): Promise<number> => (outbox ? outbox.discard('error') : 0);

// ── F5: ações por operação (tela de pendências) ─────────────────────────────

/** Uma operação com erro volta para a fila e o envio é disparado. */
export const retryOfflineOp = async (opId: string): Promise<void> => {
    if (!outbox) return;
    await outbox.update(opId, { status: 'pending', lastError: undefined });
    scheduleSync(0);
};

/**
 * Descarta a operação e as que dependem dela (itens criados offline por ela),
 * apagando as fotos/assinaturas locais que só existiam para essas operações.
 * Devolve quantas operações saíram da fila.
 */
export const discardOfflineOp = async (opId: string): Promise<number> => {
    if (!outbox) return 0;
    const all = await outbox.list();
    const op = all.find(o => o.id === opId);
    if (!op) return 0;
    const ids = new Set([op.id, ...dependentsOf(op, all).map(d => d.id)]);
    const removed = await outbox.removeWhere(o => ids.has(o.id));
    for (const r of removed) {
        for (const a of r.args) if (isOfflineFileRef(a)) await deleteOfflineFile(a.name);
    }
    return removed.length;
};

// ── F5: telemetria (item 5.4) ────────────────────────────────────────────────
// Uma linha em logs_app_client_events por rodada que fez algo (enviou, errou
// ou foi recusada): tamanho da fila, tempo sem internet, falhas por operação.

let offlineSince: number | null = null;
let lastOfflineMs: number | null = null;
let telemetryWatching = false;

const watchOfflineTime = () => {
    if (telemetryWatching) return;
    telemetryWatching = true;
    if (!isOnline()) offlineSince = Date.now();
    networkService.subscribe(s => {
        if (!s.isConnected && offlineSince == null) offlineSince = Date.now();
        if (s.isConnected && offlineSince != null) {
            lastOfflineMs = Date.now() - offlineSince;
            offlineSince = null;
        }
    });
};

const reportSyncTelemetry = async (result: SyncResult, after: OutboxSummary): Promise<void> => {
    watchOfflineTime();
    if (!result.sent && !result.errors && !result.conflicts) return;
    if (!isOfflineTelemetryAvailable()) return; // migration 20261123 ainda não aplicada
    const failedByMethod: Record<string, number> = {};
    for (const op of (await outbox?.list()) || []) {
        if (op.status !== 'pending') failedByMethod[op.method] = (failedByMethod[op.method] || 0) + 1;
    }
    logClientEvent(
        'offline_sync',
        `fila: ${result.sent} enviada(s), ${result.errors} erro(s), ${result.conflicts} recusada(s), ${after.total} restante(s)`,
        {
            extra: {
                sent: result.sent,
                errors: result.errors,
                conflicts: result.conflicts,
                heldBack: result.heldBack,
                skippedOtherUser: result.skippedOtherUser,
                stoppedByNetwork: result.stoppedByNetwork,
                queueAfter: after,
                offlineMinutes: lastOfflineMs != null ? Math.round(lastOfflineMs / 60000) : null,
                failedByMethod,
            },
        },
    );
    lastOfflineMs = null;
};

