import { isOnline } from './offlineConfig';
import { getOfflineSyncState, syncNow } from './offlineSync';

/**
 * Sair do app com alterações feitas sem internet ainda na fila (F5, item 5.2).
 *
 * A fila NÃO é apagada no logout (fica no aparelho) — mas só sobe quando o
 * mesmo usuário entrar de novo. Antes de sair: com internet, tenta enviar;
 * se ainda sobrar algo, pergunta.
 * Devolve true = pode sair.
 */
export const confirmLogoutWithOfflineQueue = async (): Promise<boolean> => {
    let { summary } = getOfflineSyncState();
    if (!summary.total) return true;

    if (isOnline() && summary.pending > 0) {
        await syncNow().catch(() => undefined);
        summary = getOfflineSyncState().summary;
        if (!summary.total) return true;
    }

    const n = summary.total;
    return window.confirm(
        `${n === 1 ? 'Há 1 alteração feita' : `Há ${n} alterações feitas`} sem internet que ainda NÃO ${n === 1 ? 'chegou' : 'chegaram'} ao servidor.\n\n` +
            'Se sair agora, elas ficam guardadas neste aparelho e só serão enviadas quando você entrar de novo com este mesmo usuário.\n\n' +
            'Sair mesmo assim?',
    );
};
