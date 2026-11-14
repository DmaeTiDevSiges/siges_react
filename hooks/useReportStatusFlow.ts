import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { OVA_PROCESSING } from '../components/ordersVisits/ordersVisitsAssets/assetReport/assetReportShared';
import type { OrderVisitAssetView } from '../types';

export interface ReportStatusFlowParams {
    assetId: string;
    currentUserId: string;
    asset: OrderVisitAssetView | null;
    setAsset: React.Dispatch<React.SetStateAction<OrderVisitAssetView | null>>;
    /** Modo de edição da revisão/aprovação (fica no componente: define se a tela é somente leitura). */
    localEditMode: 'review' | 'approval' | null;
    setLocalEditMode: (mode: 'review' | 'approval' | null) => void;
    /** "Processando..." (compartilhado com remover/trocar ativo, que ficam no componente). */
    setIsUpdatingStatus: (value: boolean) => void;
    /** Regras (`checkReport`): mostra o aviso/modal e diz se pode seguir. */
    validateReport: (verb: 'reportar' | 'confirmar') => boolean;
    hasMaintenancePlan: boolean;
    maintenanceProgress: number;
    isMoved: boolean;
    initialCondition: string;
    finalCondition: string;
    /** Autosave: marca os textos e grava tudo que está pendente. */
    stage: (fields: Record<string, unknown>) => void;
    flushSave: () => Promise<unknown>;
    /** Alertas marcados que ainda não foram gravados (useReportAlerts). */
    completeSelectedAlerts: () => Promise<void>;
    /** Solta a reserva do relatório (modo offline). */
    releaseMyLock: () => Promise<unknown>;
    /** Depois de reportar/revisar/aprovar: próximo ativo da visita ou volta. */
    advanceAfterAction: () => void;
    onBack: () => void;
}

/**
 * Fluxo de status do relatório do ativo (OrderVisitAssetReport): reportar (com a
 * confirmação extra de plano incompleto), revisar/aprovar (com a confirmação de
 * ativo movido e a mudança otimista que se desfaz se a gravação falhar), reverter
 * para rascunho e rejeitar com motivo. As regras do que falta preencher estão em
 * utils/assetReportRules; aqui ficam o estado das janelas e as gravações.
 */
export const useReportStatusFlow = ({
    assetId, currentUserId, asset, setAsset, localEditMode, setLocalEditMode, setIsUpdatingStatus,
    validateReport, hasMaintenancePlan, maintenanceProgress, isMoved, initialCondition, finalCondition,
    stage, flushSave, completeSelectedAlerts, releaseMyLock, advanceAfterAction, onBack,
}: ReportStatusFlowParams) => {
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [showReportConfirmModal, setShowReportConfirmModal] = useState(false);
    const [showApproveMovedModal, setShowApproveMovedModal] = useState(false);
    const [showIncompletePlanConfirmModal, setShowIncompletePlanConfirmModal] = useState(false);

    const handleReportClick = () => {
        if (!validateReport('reportar')) return;
        if (hasMaintenancePlan && maintenanceProgress < 100) {
            setShowIncompletePlanConfirmModal(true);
            return;
        }
        setShowReportConfirmModal(true);
    };

    const handleConfirmReport = async () => {
        try {
            setIsUpdatingStatus(true);
            // Garante os textos e grava tudo que ainda estiver pendente
            stage({ before_comments: initialCondition, after_comments: finalCondition });
            try {
                await flushSave();
            } catch {
                return; // aviso já exibido; continua em rascunho
            }
            await completeSelectedAlerts();
            await dataService.reportedOrderVisitAsset(assetId, currentUserId);
            await releaseMyLock();
            setShowReportConfirmModal(false);
            toast.success('Relatório reportado com sucesso!');
            advanceAfterAction();
        } catch (error) {
            toast.error('Erro ao reportar');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleConfirmApproval = async () => {
        const targetStatus = localEditMode === 'review' ? OVA_PROCESSING.REVIEWED : OVA_PROCESSING.APPROVED;
        const previousAsset = asset;

        setAsset(prev => prev ? {
            ...prev,
            processingId: targetStatus,
            processingDescription: targetStatus === OVA_PROCESSING.REVIEWED ? 'Revisado' : 'Aprovado'
        } : prev);
        setLocalEditMode(null);
        setShowApproveMovedModal(false);
        toast.success(`Processamento alterado para ${targetStatus === OVA_PROCESSING.REVIEWED ? 'Revisado' : 'Aprovado'}`);

        try {
            setIsUpdatingStatus(true);
            await dataService.updateOrderVisitAssetProcessingStatus(assetId, targetStatus, currentUserId);
            // Revisado/aprovado: segue para o próximo ativo da visita (no último, volta para a lista)
            advanceAfterAction();
        } catch (error) {
            console.error('Error confirming processing:', error);
            toast.error('Erro ao confirmar processamento');
            setAsset(previousAsset);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleConfirmEdit = async () => {
        if (!validateReport('confirmar')) return;
        try {
            await flushSave();
        } catch {
            return;
        }
        if (localEditMode === 'approval' && isMoved) {
            setShowApproveMovedModal(true);
            return;
        }
        await handleConfirmApproval();
    };

    const handleRevertDraft = async () => {
        try {
            setIsUpdatingStatus(true);
            await dataService.updateOrderVisitAssetProcessingStatus(assetId, OVA_PROCESSING.DRAFT, currentUserId);
            toast.info('Relatório do ativo revertido para Rascunho');
        } catch (error) {
            console.error('Error reverting asset to draft:', error);
            toast.error('Erro ao retornar para rascunho');
        } finally {
            setIsUpdatingStatus(false);
            onBack();
        }
    };

    const handleConfirmRejection = async () => {
        if (!asset) return;
        try {
            setIsUpdatingStatus(true);
            await dataService.disapproveOrderVisitAsset(assetId, currentUserId, rejectionNotes);
            setAsset({ ...asset, processingId: OVA_PROCESSING.REJECTED, processingDescription: 'Rejeitado', disapprovedNotes: rejectionNotes });
            setShowRejectionModal(false);
            setRejectionNotes('');
            toast.success('Relatório Rejeitado');
        } catch (error) {
            toast.error('Erro ao rejeitar');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return {
        showRejectionModal, setShowRejectionModal, rejectionNotes, setRejectionNotes,
        showReportConfirmModal, setShowReportConfirmModal,
        showApproveMovedModal, setShowApproveMovedModal,
        showIncompletePlanConfirmModal, setShowIncompletePlanConfirmModal,
        handleReportClick, handleConfirmReport, handleConfirmApproval, handleConfirmEdit,
        handleRevertDraft, handleConfirmRejection,
    };
};
