import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import type { Asset } from '../types';

/**
 * Trocar o ativo do relatório por outro (OrderVisitAssetReport): abre a página de
 * busca, troca na visita e recarrega o relatório. Em caso de falha mostra o motivo
 * (ou "Erro ao trocar ativo") e mantém a página aberta.
 */
export const useReportSwap = (
    assetId: string,
    currentUserId: string,
    reload: () => Promise<void> | void,
) => {
    const [showSwapPage, setShowSwapPage] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);

    const handleSwapAsset = async (newAsset: Asset) => {
        try {
            setIsSwapping(true);
            await dataService.changeOrderVisitAsset(assetId, newAsset.id, currentUserId);
            toast.success('Ativo alterado com sucesso!');
            setShowSwapPage(false);
            reload();
        } catch (error: any) {
            console.error('Error swapping asset:', error);
            toast.error(error.message || 'Erro ao trocar ativo');
        } finally {
            setIsSwapping(false);
        }
    };

    return { showSwapPage, setShowSwapPage, isSwapping, handleSwapAsset };
};
