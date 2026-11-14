import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { isOnline } from '../services/offline/offlineConfig';
import type { OrderVisitAssetView } from '../types';

/**
 * "Copiar de outro ativo" no relatório (OrderVisitAssetReport): escolher a
 * origem entre os ativos da visita, confirmar e copiar condições, horímetro,
 * situação, atividades e materiais (fotos NÃO são copiadas). Precisa de internet
 * e só vale em rascunho; grava o pendente antes para o autosave não sobrescrever
 * a cópia depois, e recarrega o relatório no fim.
 */
export const useReportCopyFrom = (
    asset: OrderVisitAssetView | null,
    currentUserId: string,
    flushSave: () => Promise<unknown>,
    reload: () => Promise<void>,
) => {
    /** Escolha da origem e confirmação. */
    const [showCopyFromModal, setShowCopyFromModal] = useState(false);
    const [copySource, setCopySource] = useState<OrderVisitAssetView | null>(null);
    const [isCopying, setIsCopying] = useState(false);

    /** Abre a escolha da origem (precisa de internet). */
    const openCopyFrom = () => {
        if (!isOnline()) { toast.error('Copiar de outro ativo precisa de internet.'); return; }
        setShowCopyFromModal(true);
    };

    /** Copia o relatório da origem escolhida para este (em rascunho); fotos não são copiadas. */
    const handleCopyFromConfirm = async () => {
        if (!copySource || !asset) return;
        if (!isOnline()) {
            toast.error('Copiar de outro ativo precisa de internet.');
            return;
        }
        setIsCopying(true);
        try {
            // Grava o que estiver pendente antes, para o autosave não sobrescrever a cópia depois.
            await flushSave().catch(() => undefined);
            const result = await dataService.copyOrderVisitAssetReport(String(asset.id), String(copySource.id), currentUserId);
            toast.success(`Relatório copiado de ${copySource.code || 'outro ativo'}: ${result.activities} atividade(s) e ${result.materials} material(is). Inclua as fotos.`);
            setCopySource(null);
            await reload();
        } catch (error) {
            console.error('Erro ao copiar relatório:', error);
            toast.error(error instanceof Error && error.message ? error.message : 'Erro ao copiar o relatório.');
        } finally {
            setIsCopying(false);
        }
    };

    return { showCopyFromModal, setShowCopyFromModal, copySource, setCopySource, isCopying, openCopyFrom, handleCopyFromConfirm };
};
