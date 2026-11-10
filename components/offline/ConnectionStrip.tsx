import React from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useOfflineAutoSync } from '../../hooks/useOfflineAutoSync';
import { openPendingOpsPanel } from './PendingOpsPanel';

/**
 * Faixa logo abaixo do cabeçalho (Header) com o estado da conexão e da fila
 * offline. Aparece em todas as telas que usam o Header.
 *
 *   sem internet           → vermelho  "Sem internet · N alterações no aparelho"
 *   enviando / aguardando  → azul      "Enviando N alterações…" / "N aguardando envio"
 *   erro / recusadas       → âmbar     "N alterações não enviadas — abra a visita"
 *   baixando dados offline → barra     "Atualizando dados offline · etapa · N%"
 *   online e fila vazia    → nada
 */
interface ConnectionStripProps {
    isConnected: boolean;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ConnectionStrip: React.FC<ConnectionStripProps> = ({ isConnected }) => {
    const { summary, syncing } = useOfflineSync();
    const autoSync = useOfflineAutoSync();
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
    } else if (autoSync.running && autoSync.total > 0) {
        // Só com download de verdade: a conferência de mudanças (a cada 5 min) não aparece.
        const percent = autoSync.total > 0 ? Math.min(100, Math.round((autoSync.done / autoSync.total) * 100)) : 0;
        return (
            <div role="status" aria-live="polite" className="relative bg-slate-800 text-white dark:bg-slate-900">
                <div className="flex items-center justify-center gap-1.5 px-4 py-1 text-[11px] font-bold leading-tight">
                    {/* O ícone "sync" tem setas no sentido anti-horário: gira ao contrário do animate-spin */}
                    <span className="material-symbols-outlined text-[14px] animate-spin [animation-direction:reverse]">sync</span>
                    <span className="truncate">
                        Atualizando dados offline{autoSync.phase ? ` · ${autoSync.phase}` : ''}{autoSync.total > 0 ? ` · ${percent}%` : '…'}
                    </span>
                </div>
                <div className="h-0.5 w-full bg-white/10">
                    <div
                        className="h-full bg-emerald-400 transition-[width] duration-500"
                        style={{ width: `${autoSync.total > 0 ? percent : 5}%` }}
                    />
                </div>
            </div>
        );
    } else {
        return null;
    }

    const content = (
        <>
            <span className={`material-symbols-outlined text-[14px] ${syncing && isConnected ? 'animate-spin [animation-direction:reverse]' : ''}`}>{icon}</span>
            <span className="truncate">{text}</span>
            {summary.total > 0 && <span className="material-symbols-outlined text-[14px] opacity-80">chevron_right</span>}
        </>
    );
    const classes = `w-full flex items-center justify-center gap-1.5 px-4 py-1 text-[11px] font-bold leading-tight ${tone}`;

    // Com alterações na fila, a faixa abre a tela de pendências (F5).
    return summary.total > 0 ? (
        <button type="button" onClick={openPendingOpsPanel} aria-live="polite" aria-label={`${text}. Ver pendências`} className={classes}>
            {content}
        </button>
    ) : (
        <div role="status" aria-live="polite" className={classes}>
            {content}
        </div>
    );
};
