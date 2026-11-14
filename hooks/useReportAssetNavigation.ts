import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { sortBySectorPositionDescription } from '../utils/assetReportSort';
import type { OrderVisitAssetView } from '../types';

/** Tempo do aviso "Próximo ativo" antes de abrir o ativo seguinte. */
const ADVANCE_NOTICE_MS = 1800;

export interface ReportAssetNavigationParams {
    assetId: string;
    asset: OrderVisitAssetView | null;
    onNavigateAsset?: (target: OrderVisitAssetView) => void;
    /** Prop `readOnly` da tela (não busca a lista de ativos da visita). */
    readOnly?: boolean;
    /** Somente leitura de fato (inclui status e trava): se true, navegar não grava nada. */
    isReadOnly: boolean;
    /** Fotos ainda subindo. */
    uploadingCount: number;
    flushSave: () => Promise<unknown>;
    /** Depois de reportar/revisar/aprovar sem próximo ativo: volta (onApproved, senão onBack). */
    onApproved?: () => void;
    onBack: () => void;
    /** Raiz da tela: volta ao topo ao abrir o ativo seguinte. */
    rootRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Navegação entre os ativos da mesma visita (OrderVisitAssetReport): setas
 * anterior/próximo no desktop (na ordem da lista da visita) e o avanço
 * automático depois de reportar/revisar/aprovar, com o aviso "Próximo ativo".
 * Navegar grava o pendente antes (exceto em somente leitura) e espera as fotos.
 */
export const useReportAssetNavigation = ({
    assetId, asset, onNavigateAsset, readOnly, isReadOnly, uploadingCount, flushSave, onApproved, onBack, rootRef,
}: ReportAssetNavigationParams) => {
    const [visitSiblings, setVisitSiblings] = useState<OrderVisitAssetView[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    /** Ativo para o qual o avanço automático está indo (exibe o aviso "Próximo ativo"). */
    const [advancingTo, setAdvancingTo] = useState<OrderVisitAssetView | null>(null);
    const siblingsOvId = asset?.ovId ? String(asset.ovId) : '';
    useEffect(() => {
        if (!onNavigateAsset || readOnly || !siblingsOvId) return;
        let cancelled = false;
        dataService.getOrderVisitAssets(siblingsOvId)
            .then(list => {
                if (cancelled) return;
                setVisitSiblings(sortBySectorPositionDescription(list, a => ({
                    tagName: a.beforeTagDescription,
                    tagSubName: a.beforeTagSubDescription,
                    description: a.description,
                    code: a.code,
                })));
            })
            .catch(() => { /* sem lista: as setas só não aparecem */ });
        return () => { cancelled = true; };
    }, [siblingsOvId, onNavigateAsset, readOnly]);

    const siblingIndex = visitSiblings.findIndex(a => String(a.id) === String(assetId));
    const prevSibling = siblingIndex > 0 ? visitSiblings[siblingIndex - 1] : null;
    const nextSibling = siblingIndex >= 0 && siblingIndex < visitSiblings.length - 1 ? visitSiblings[siblingIndex + 1] : null;

    /**
     * Depois de reportar, revisar ou aprovar: abre o próximo ativo da visita (mesma ordem da
     * lista). No último — ou sem a lista/navegação — volta para a lista de ativos da visita.
     */
    const advanceAfterAction = () => {
        if (nextSibling && onNavigateAsset) {
            // Aviso "Próximo ativo" antes da troca: sem ele o usuário acha que continua no mesmo ativo
            setAdvancingTo(nextSibling);
            return;
        }
        (onApproved || onBack)();
    };

    // Aviso "Próximo ativo": aguarda, fecha e abre o ativo seguinte (remonta a tela)
    useEffect(() => {
        if (!advancingTo || !onNavigateAsset) return;
        const target = advancingTo;
        const timer = setTimeout(() => {
            setAdvancingTo(null);
            window.scrollTo({ top: 0 });
            rootRef.current?.scrollIntoView({ block: 'start' });
            onNavigateAsset(target);
        }, ADVANCE_NOTICE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [advancingTo]);

    /** Grava o pendente e abre o relatório do outro ativo. */
    const goToSibling = async (target: OrderVisitAssetView | null) => {
        if (!target || !onNavigateAsset || isNavigating) return;
        if (uploadingCount > 0) {
            toast.info('Aguarde o envio das fotos antes de trocar de ativo.');
            return;
        }
        setIsNavigating(true);
        try {
            if (!isReadOnly) await flushSave();
        } catch {
            toast.error('Não foi possível salvar as alterações deste ativo. Tente novamente.');
            setIsNavigating(false);
            return;
        }
        onNavigateAsset(target);
    };

    return { visitSiblings, siblingIndex, prevSibling, nextSibling, isNavigating, advancingTo, advanceAfterAction, goToSibling };
};
