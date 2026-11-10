import { readStoredSessionUserId } from '../core/supabase';
import { getOfflineStore, isOfflineSupported, isOnline } from './offlineConfig';
import { networkFailureCount } from './networkFailures';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';

/**
 * Login offline (F1, item 1.1).
 *
 * O perfil do usuário (com permissões) é guardado a cada carga online. Sem
 * rede, getCurrentUser devolve esse perfil — mas SÓ se a sessão do Supabase
 * daquele mesmo usuário ainda estiver salva no aparelho. Depois de um logout
 * a sessão some e o perfil não é mais usado (e clearOfflineData apaga tudo).
 */

interface ProfileLike {
    uuid?: string;
}

const getCachedProfile = async <T extends ProfileLike>(): Promise<T | null> => {
    const uid = await readStoredSessionUserId();
    if (!uid) return null;
    try {
        const profile = await getOfflineStore().get<T>(OFFLINE_COLLECTIONS.profile, uid);
        return profile && profile.uuid === uid ? profile : null;
    } catch {
        return null;
    }
};

const saveProfile = (user: ProfileLike): void => {
    if (!user.uuid) return;
    getOfflineStore()
        .put(OFFLINE_COLLECTIONS.profile, user.uuid, user)
        .catch(e => console.warn('[offline] falha ao guardar perfil:', e));
};

const looksLikeNetworkError = (e: any): boolean => {
    const msg = String(e?.message || e || '').toLowerCase();
    return (
        e?.name === 'AuthRetryableFetchError' ||
        e?.status === 0 ||
        ['fetch', 'network', 'timeout', 'load failed', 'connection'].some(t => msg.includes(t))
    );
};

/**
 * Envolve a carga do usuário atual. Sem o modo offline, chama `load` direto.
 */
export const resolveCurrentUserOffline = async <T extends ProfileLike>(
    load: () => Promise<T | null>,
): Promise<T | null> => {
    if (!isOfflineSupported()) return load();

    if (!isOnline()) {
        const cached = await getCachedProfile<T>();
        if (cached) return cached;
    }

    const before = networkFailureCount();
    try {
        const user = await load();
        if (user) {
            saveProfile(user);
            return user;
        }
        if (networkFailureCount() !== before) {
            const cached = await getCachedProfile<T>();
            if (cached) return cached;
        }
        return user;
    } catch (error) {
        if (networkFailureCount() !== before || !isOnline() || looksLikeNetworkError(error)) {
            const cached = await getCachedProfile<T>();
            if (cached) return cached;
        }
        throw error;
    }
};

/** Para o App: perfil guardado da sessão salva (carga que estourou o tempo). */
export const getCachedCurrentUser = async <T extends ProfileLike>(): Promise<T | null> =>
    isOfflineSupported() ? getCachedProfile<T>() : null;

/** Logout: apaga perfil, cache de leitura e pacotes do aparelho. */
export const clearOfflineData = async (): Promise<void> => {
    try {
        // Só os dados baixados: a fila (no navegador, coleção "outbox" do mesmo
        // store) fica — igual ao APK, onde ela está no Preferences.
        const store = getOfflineStore();
        await Promise.all(Object.values(OFFLINE_COLLECTIONS).map(c => store.clear(c)));
    } catch (e) {
        console.warn('[offline] falha ao limpar dados offline:', e);
    }
};
