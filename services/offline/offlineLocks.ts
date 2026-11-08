import { getOfflineStore } from './offlineConfig';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';

/**
 * Token da trava de cada ativo reservado (migration 20261117).
 * Guardado ao travar (Preparar para campo / abrir o relatório). No envio da
 * fila, o syncEngine compara com o token atual do servidor: diferente =
 * o gestor liberou o ativo enquanto o técnico estava offline → conflito.
 */
interface LockRecord {
    token: string;
    savedAt: number;
}

export const saveLockToken = async (ovaId: string, token?: string): Promise<void> => {
    if (!token) return;
    await getOfflineStore()
        .put<LockRecord>(OFFLINE_COLLECTIONS.locks, String(ovaId), { token, savedAt: Date.now() })
        .catch(() => undefined);
};

export const getLockToken = async (ovaId: string): Promise<string | null> => {
    try {
        return (await getOfflineStore().get<LockRecord>(OFFLINE_COLLECTIONS.locks, String(ovaId)))?.token ?? null;
    } catch {
        return null;
    }
};

export const deleteLockToken = async (ovaId: string): Promise<void> => {
    await getOfflineStore().delete(OFFLINE_COLLECTIONS.locks, String(ovaId)).catch(() => undefined);
};
