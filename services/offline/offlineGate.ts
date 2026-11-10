import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { networkService } from '../core/networkService';

/**
 * Chave do banco do modo offline (F5, item 5.3 — migration 20261123).
 *
 * O modo offline liga com DUAS chaves: a flag do APK (VITE_FEATURE_OFFLINE_MODE)
 * E esta, lida de fn_offline_enabled() (usuário > empresa). Assim o piloto é
 * liberado/retirado sem gerar APK novo.
 *
 *   - Sem a função no banco (migration não aplicada) → ABERTA (comportamento
 *     anterior: só a flag do APK).
 *   - O último valor fica guardado no aparelho por usuário: sem internet vale
 *     o que foi lido da última vez.
 *   - Fechar NÃO apaga a fila: o envio do que ficou no aparelho continua
 *     (offlineSync roda por isOfflinePlatform, não por esta chave).
 *
 * Sem dependência de offlineConfig/supabase no topo (offlineConfig importa este
 * arquivo; o supabase é carregado só na hora de consultar).
 */

const KEY = 'siges_offline_gate_v1';

interface PersistedGate {
    uuid: string;
    enabled: boolean;
    /** 'db' = lido da função; 'no-function' = migration ausente. */
    source: 'db' | 'no-function';
    checkedAt: number;
}

let open = true; // até saber, aberta (não muda nada para quem já usava só a flag)
let lastUuid: string | null = null;
let persisted: PersistedGate | null = null;
let watching = false;
const listeners = new Set<(open: boolean) => void>();

const read = async (): Promise<PersistedGate | null> => {
    try {
        const raw = Capacitor.isNativePlatform()
            ? (await Preferences.get({ key: KEY })).value
            : window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as PersistedGate) : null;
    } catch {
        return null;
    }
};

const write = async (value: PersistedGate) => {
    try {
        const raw = JSON.stringify(value);
        if (Capacitor.isNativePlatform()) await Preferences.set({ key: KEY, value: raw });
        else window.localStorage.setItem(KEY, raw);
    } catch {
        /* sem armazenamento: vale só nesta sessão */
    }
};

const set = (next: boolean) => {
    if (next === open) return;
    open = next;
    listeners.forEach(l => {
        try {
            l(open);
        } catch {
            /* ignora */
        }
    });
};

/** Migration 20261123 detectada no banco (telemetria 'offline_sync' aceita)? */
export const isOfflineTelemetryAvailable = (): boolean => persisted?.source === 'db';

/** A chave do banco está aberta para o usuário atual? (síncrono) */
export const isOfflineDbGateOpen = (): boolean => open;

export const subscribeOfflineGate = (listener: (open: boolean) => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** Abertura do app: aplica o último valor guardado (antes de saber o usuário). */
export const loadPersistedOfflineGate = async (): Promise<void> => {
    persisted = await read();
    if (persisted) set(persisted.enabled);
};

/**
 * Login / troca de usuário / internet voltou: lê a chave no banco.
 * Sem internet, aplica o valor guardado desse usuário (se houver).
 */
export const refreshOfflineGate = async (userUuid: string | null | undefined): Promise<boolean> => {
    if (!userUuid) return open;
    lastUuid = userUuid;
    if (!persisted) persisted = await read();
    if (persisted?.uuid === userUuid) set(persisted.enabled);

    const online = networkService.isInitialized() ? networkService.isConnected() : navigator.onLine !== false;
    if (online) {
        try {
            const { supabase } = await import('../core/supabase');
            const { data, error } = await supabase.rpc('fn_offline_enabled');
            let value: PersistedGate | null = null;
            if (error) {
                if (error.code === 'PGRST202' || error.code === '42883') {
                    value = { uuid: userUuid, enabled: true, source: 'no-function', checkedAt: Date.now() };
                }
            } else {
                value = { uuid: userUuid, enabled: data === true, source: 'db', checkedAt: Date.now() };
            }
            if (value) {
                persisted = value;
                await write(value);
                set(value.enabled);
            }
        } catch {
            /* rede caiu no meio: segue com o guardado */
        }
    }

    if (!watching) {
        watching = true;
        networkService.subscribe(s => {
            if (s.isConnected && lastUuid) refreshOfflineGate(lastUuid).catch(() => undefined);
        });
    }
    return open;
};
