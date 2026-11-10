/**
 * useReportAutosave — salvamento automático dos campos do relatório do ativo
 * (orders_visits_assets) via dataService.updateOrderVisitAsset.
 *
 * - queueSave: texto; grava ~1,2 s depois de parar de digitar.
 * - saveNow: select/switch/saída do campo; grava já.
 * - flushSave: grava o pendente e devolve a promise (rejeita se falhar) —
 *   use antes de mudar o status do relatório.
 * - Uma gravação por vez; o que falhar volta para a fila sem sobrescrever o
 *   que foi digitado depois, e o técnico é avisado.
 * - Ao desmontar (sair da tela, voltar do Android) o pendente é gravado.
 * - Offline a chamada entra na fila do offlineLayer e resolve na hora.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';

export type ReportSaveState = 'idle' | 'saving' | 'saved' | 'error';

export const useReportAutosave = (ovaId: string, delayMs = 1200) => {
    const [saveState, setSaveState] = useState<ReportSaveState>('idle');
    const pendingRef = useRef<Record<string, unknown>>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chainRef = useRef<Promise<void>>(Promise.resolve());

    const flushSave = useCallback((): Promise<void> => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const updates = pendingRef.current;
        if (Object.keys(updates).length === 0) return chainRef.current;
        pendingRef.current = {};
        setSaveState('saving');

        const run = chainRef.current.then(async () => {
            try {
                await dataService.updateOrderVisitAsset(ovaId, updates as any);
                if (Object.keys(pendingRef.current).length === 0 && !timerRef.current) {
                    setSaveState('saved');
                }
            } catch (error) {
                console.error('Error autosaving report fields:', error);
                pendingRef.current = { ...updates, ...pendingRef.current };
                setSaveState('error');
                toast.error('Não foi possível salvar as alterações do relatório.', { id: 'ova-autosave-error' });
                throw error;
            }
        });
        chainRef.current = run.catch(() => undefined);
        return run;
    }, [ovaId]);

    /** Junta campos ao pendente sem disparar gravação. */
    const stage = useCallback((updates: Record<string, unknown>) => {
        Object.assign(pendingRef.current, updates);
    }, []);

    const queueSave = useCallback((updates: Record<string, unknown>) => {
        Object.assign(pendingRef.current, updates);
        setSaveState('saving');
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            flushSave().catch(() => undefined);
        }, delayMs);
    }, [flushSave, delayMs]);

    /** Grava já; erro já foi avisado, então não rejeita. */
    const saveNow = useCallback((updates: Record<string, unknown>): Promise<void> => {
        Object.assign(pendingRef.current, updates);
        return flushSave().catch(() => undefined);
    }, [flushSave]);

    /** Para o onBlur dos campos. */
    const flushQuietly = useCallback(() => {
        flushSave().catch(() => undefined);
    }, [flushSave]);

    const flushRef = useRef(flushSave);
    flushRef.current = flushSave;
    useEffect(() => () => {
        flushRef.current().catch(() => undefined);
    }, []);

    return { saveState, queueSave, saveNow, stage, flushSave, flushQuietly };
};
