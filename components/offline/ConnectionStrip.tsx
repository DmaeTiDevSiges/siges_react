import React from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

/**
 * Faixa logo abaixo do cabeçalho (Header) com o estado da conexão e da fila
 * offline. Aparece em todas as telas que usam o Header.
 *
 *   sem internet           → vermelho  "Sem internet · N alterações no aparelho"
 *   enviando / aguardando  → azul      "Enviando N alterações…" / "N aguardando envio"
 *   erro / recusadas       → âmbar     "N alterações não enviadas — abra a visita"
 *   online e fila vazia    → nada
 */
interface ConnectionStripProps {
    isConnected: boolean;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ConnectionStrip: React.FC<ConnectionStripProps> = ({ isConnected }) => {
    const { summary, syncing } = useOfflineSync();
    const { pending, errors, conflicts } = summary;
    const stuck = errors + conflicts;

    let tone = '';
    let icon = '';
    let text = '';

    if (!isConnected) {
        tone = 'bg-red-600 text-white';
        icon = 'cloud_off';
        text = summary.total > 0
            ? `Sem internet · ${plural(summary.total, 'alteração salva', 'alterações salvas')} no aparelho`
            : 'Sem internet';
    } else if (pending > 0) {
        tone = 'bg-indigo-600 text-white';
        icon = syncing ? 'sync' : 'cloud_upload';
        text = syncing
            ? `Enviando ${plural(pending, 'alteração', 'alterações')}…`
            : `${plural(pending, 'alteração aguardando', 'alterações aguardando')} envio`;
    } else if (stuck > 0) {
        tone = 'bg-amber-500 text-amber-950';
        icon = 'error';
        text = `${plural(stuck, 'alteração não enviada', 'alterações não enviadas')} — abra a visita para resolver`;
    } else {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 px-4 py-1 text-[11px] font-bold leading-tight ${tone}`}
        >
            <span className={`material-symbols-outlined text-[14px] ${syncing && isConnected ? 'animate-spin' : ''}`}>{icon}</span>
            <span className="truncate">{text}</span>
        </div>
    );
};
