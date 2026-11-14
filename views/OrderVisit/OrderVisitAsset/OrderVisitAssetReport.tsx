/**
 * OrderVisitAssetReport — relatório individual do ativo durante a visita.
 *
 * Layout (por largura do próprio formulário, via container queries — funciona
 * igual em tela cheia e embutido no OrderRequestView):
 *  - estreito (celular): uma coluna na ordem do trabalho em campo, progresso no
 *    topo, seções recolhíveis e barra fixa no rodapé com a ação principal;
 *  - largo (desktop): Antes/Depois lado a lado e painel lateral fixo com ativo,
 *    pendências, salvamento e ações (revisão/aprovação).
 *
 * Seções em components/ordersVisits/ordersVisitsAssets/assetReport/;
 * salvamento automático em hooks/useReportAutosave; fotos em hooks/useReportPhotos.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { dataService } from '../../../services/dataService';
import { Asset, OrderVisit, OrderVisitAssetActivity, OrderVisitAssetMaterial, OrderVisitAssetView } from '../../../types';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssetLock } from '../../../hooks/useAssetLock';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { useReportAutosave } from '../../../hooks/useReportAutosave';
import { useReportPhotos } from '../../../hooks/useReportPhotos';
import { useReportAlerts } from '../../../hooks/useReportAlerts';
import { useReportStatusFlow } from '../../../hooks/useReportStatusFlow';
import { useReportPhotoActions } from '../../../hooks/useReportPhotoActions';
import { OrderVisitAssetCardDetail } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail';
import { MaintenanceChecklistView } from '../../../components/ordersVisits/ordersVisitsAssets/MaintenanceChecklistView';
import { OVA_PROCESSING, REPORT_SECTION_IDS, ReportSection, parseRecorder } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/assetReportShared';
import { AssetReportConditionSection } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportConditionSection';
import { AssetReportActivitiesSection } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActivitiesSection';
import { AssetReportMaterialsSection } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportMaterialsSection';
import { AssetReportMovementSection, UnitAssetTagOption } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportMovementSection';
import { AssetReportRecorderSection } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportRecorderSection';
import { AssetReportAlertsSection } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportAlertsSection';
import { AssetReportSwapPage } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportSwapPage';
import { AssetReportProgress, AssetReportSaveStatus, ReportProgressItem } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportProgress';
import { AssetReportActions, AssetReportActionFlags, hasPrimaryReportAction } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions';
import { AssetReportCopyFromModal } from '../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportCopyFromModal';
import { isOnline } from '../../../services/offline/offlineConfig';
import { sortBySectorPositionDescription } from '../../../utils/assetReportSort';
import {
    buildProgressSpecs, checkReport, hasMaintenancePlan as planIsChosen, isMovementComplete as destinationIsComplete, isSameMovementDestination,
} from '../../../utils/assetReportRules';
import { OrderVisitAssetManualsSection } from './OrderVisitAssetManualsSection';
import { AssetAlertModal } from '../../Assets/AssetAlertModal';
import { PhotoViewer } from '../../../components/ui/PhotoViewer';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { ImageUploadSheet } from '../../../components/ui/ImageUploadSheet';
import { ImageEditorModal } from '../../../components/ui/ImageEditorModal';
import { Loading } from '../../../components/ui/Loading';

interface OrderVisitAssetReportProps {
    assetId: string;
    onBack: () => void;
    onManageActivities?: (orderTypeId: string) => void;
    onManageMaterials?: () => void;
    onViewAsset?: () => void;
    readOnly?: boolean;
    initialAsset?: OrderVisitAssetView;
    initialVisit?: OrderVisit;
    /** Chamado depois que a aprovação foi gravada (ex.: voltar para os ativos da visita). */
    onApproved?: () => void;
    /** Seção a centralizar na tela ao abrir (ex.: voltando da seleção de atividades). */
    focusSection?: 'materials' | null;
    onFocusHandled?: () => void;
    /** Desktop: abre o relatório do ativo anterior/seguinte da visita (setas do painel lateral). */
    onNavigateAsset?: (target: OrderVisitAssetView) => void;
}

/** Tempo do aviso "Próximo ativo" antes de abrir o ativo seguinte. */
const ADVANCE_NOTICE_MS = 1800;

const EDITABLE_STATUSES: number[] = [OVA_PROCESSING.DRAFT, OVA_PROCESSING.REJECTED];

export const OrderVisitAssetReport: React.FC<OrderVisitAssetReportProps> = ({ assetId, onBack, onManageActivities, onManageMaterials, onViewAsset, readOnly, initialAsset, initialVisit, onApproved, focusSection, onFocusHandled, onNavigateAsset }) => {
    const [asset, setAsset] = useState<OrderVisitAssetView | null>(initialAsset || null);
    const [loading, setLoading] = useState(!initialAsset);
    const [dataReady, setDataReady] = useState(false);
    const [initialCondition, setInitialCondition] = useState(initialAsset?.beforeComments || '');
    const [finalCondition, setFinalCondition] = useState(initialAsset?.afterComments || '');
    const [activities, setActivities] = useState<OrderVisitAssetActivity[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<OrderVisitAssetMaterial[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const { currentUser: authUser } = useAuth();
    const currentUserIsAdminSuper = authUser?.isAdminSuper === true;
    const { canView, canCreate } = usePermissions();

    // Fluxo de status
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [localEditMode, setLocalEditMode] = useState<'review' | 'approval' | null>(null);
    const [visitProcessingId, setVisitProcessingId] = useState<number | null>(initialVisit?.ovProcessingId || null);
    const [isVisitFiled, setIsVisitFiled] = useState(!!initialVisit?.isFiled);
    const [isContractManager, setIsContractManager] = useState(false);
    const [isContractManagerAdminSuper, setIsContractManagerAdminSuper] = useState(false);
    const [maintenanceProgress, setMaintenanceProgress] = useState<number>(initialAsset?.maintenancePlanProgress || 0);
    // A checklist calcula o progresso a partir das respostas e é a fonte da verdade;
    // o valor gravado no banco só vale até ela informar o dela.
    const checklistProgressKnownRef = useRef(false);
    const handleChecklistProgress = useCallback((value: number) => {
        checklistProgressKnownRef.current = true;
        setMaintenanceProgress(value);
    }, []);
    // Plano escolhido na checklist (pode mudar na tela, ex.: na revisão).
    const [checklistPlanId, setChecklistPlanId] = useState<string>(initialAsset?.maintenancePlanId || '');
    const checklistPlanKnownRef = useRef(false);
    const handleChecklistPlanChange = useCallback((planId: string) => {
        checklistPlanKnownRef.current = true;
        setChecklistPlanId(planId);
        if (!planId) setMaintenanceProgress(0);
    }, []);

    // Modais
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [showUnmoveConfirmModal, setShowUnmoveConfirmModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    /** Copiar de outro ativo: escolha da origem e confirmação. */
    const [showCopyFromModal, setShowCopyFromModal] = useState(false);
    const [copySource, setCopySource] = useState<OrderVisitAssetView | null>(null);
    const [isCopying, setIsCopying] = useState(false);

    // Fotos
    const photos = useReportPhotos(assetId, initialAsset);
    const initialImages = photos.initialPhotos.map(p => p.url);
    const finalImages = photos.finalPhotos.map(p => p.url);
    const uploadingCount = photos.pendingCount;
    const {
        expandedImage, setExpandedImage, photoActionSection, setPhotoActionSection, editingImage, setEditingImage,
        showCoverConfirmModal, setShowCoverConfirmModal, setSelectedCoverUrl, isUpdatingCover,
        handleAddPhotos, takeCameraPhoto, handleFileDrop, handleEditImage, handleSaveEditedImage,
        handleUseAsCover, handleConfirmCoverPhoto,
    } = useReportPhotoActions(photos, asset);

    // Atividades / materiais
    const [removingActivityId, setRemovingActivityId] = useState<string | null>(null);
    const [removingMaterialId, setRemovingMaterialId] = useState<string | null>(null);
    const [materialToDelete, setMaterialToDelete] = useState<OrderVisitAssetMaterial | null>(null);

    // Alertas
    const {
        alerts: reportAssetAlerts, completedAlertIds, updatingAlertId,
        isAddingAlert, setIsAddingAlert, alertInitialDescription, setAlertInitialDescription,
        toggleCompletedAlert, completeSelectedAlerts, refreshAlerts,
    } = useReportAlerts(asset, currentUserId);

    // Registrador
    const [hasRecorder, setHasRecorder] = useState(initialAsset?.hasRecorder ?? true);
    const [beforeRecorder, setBeforeRecorder] = useState<string>(initialAsset?.beforeRecorder != null ? String(initialAsset.beforeRecorder) : '');
    const [afterRecorder, setAfterRecorder] = useState<string>(initialAsset?.afterRecorder != null ? String(initialAsset.afterRecorder) : '');

    // Troca de ativo
    const [showSwapPage, setShowSwapPage] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);

    // Movimentação
    const [isMoved, setIsMoved] = useState(initialAsset?.isMoved || false);
    const [afterClientId, setAfterClientId] = useState('');
    const [afterUnitId, setAfterUnitId] = useState('');
    const [afterUnitAssetTagId, setAfterUnitAssetTagId] = useState('');
    const [afterStatusId, setAfterStatusId] = useState('');
    const [afterPriorityId, setAfterPriorityId] = useState<number | undefined>(undefined);
    const [afterLocation, setAfterLocation] = useState('');
    const [movedComments, setMovedComments] = useState(initialAsset?.movedComments || '');

    // Barra fixa do celular some enquanto digita (o teclado ocupa a tela)
    const [isTyping, setIsTyping] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const { saveState, queueSave, saveNow, stage, flushSave, flushQuietly } = useReportAutosave(assetId);

    const processingId = Number(asset?.processingId || OVA_PROCESSING.DRAFT);
    const canRemoveItems = !readOnly && !!asset && processingId !== OVA_PROCESSING.APPROVED;

    // Modo offline: trava do relatório para o técnico que abriu (useAssetLock).
    const { lock: assetLock, forceRelease: forceReleaseLock, releaseMine: releaseMyLock } = useAssetLock({
        ovaId: asset?.id ? String(asset.id) : undefined,
        ovId: asset?.ovId ? String(asset.ovId) : undefined,
        currentUserId,
        editable: !readOnly && !!asset && EDITABLE_STATUSES.includes(processingId),
    });
    const isLockedByOther = assetLock.status === 'other';
    const isNotReservedOffline = assetLock.status === 'not-reserved';
    const offlineSync = useOfflineSync();
    const hasUnsentChanges = !!asset?.id && offlineSync.unsentOvaIds.includes(String(asset.id));

    const isReadOnly = readOnly || isLockedByOther || isNotReservedOffline || (asset
        ? !EDITABLE_STATUSES.includes(processingId) && !localEditMode
        : true);

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const isField = (t: EventTarget | null) =>
            t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(t.type));
        const onIn = (e: FocusEvent) => { if (isField(e.target)) setIsTyping(true); };
        const onOut = (e: FocusEvent) => { if (isField(e.target)) setIsTyping(false); };
        el.addEventListener('focusin', onIn);
        el.addEventListener('focusout', onOut);
        return () => {
            el.removeEventListener('focusin', onIn);
            el.removeEventListener('focusout', onOut);
        };
    }, [loading]);

    const loadPageData = async () => {
        try {
            if (!initialAsset) setLoading(true);

            // Somente leitura: pula usuário/permissões — só dados de exibição
            const [data, activitiesData, materialsData, user] = await Promise.all([
                dataService.getOrderVisitAssetById(assetId),
                dataService.getOrderVisitAssetActivities(assetId),
                dataService.getOrderVisitAssetMaterials(assetId),
                readOnly ? Promise.resolve(null) : dataService.getCurrentUser()
            ]);

            if (!readOnly && data?.ovId && !initialVisit) {
                try {
                    const visitData = await dataService.getActiveOrderVisit(data.ovId);
                    if (visitData) {
                        setVisitProcessingId(visitData.ovProcessingId);
                        setIsVisitFiled(!!visitData.isFiled);
                    }
                } catch (vError) {
                    console.warn('Could not fetch visit data', vError);
                }
            }

            if (user) setCurrentUserId(user.id);

            if (!data) {
                toast.error('Ativo da visita não encontrado');
                onBack();
                return;
            }

            setAsset(data);
            setActivities(activitiesData.filter(act => !act.maintenancePlanId || act.maintenancePlanId === '0'));
            setUsedMaterials(materialsData);
            setInitialCondition(data.beforeComments || '');
            setFinalCondition(data.afterComments || '');
            photos.reset(data);

            setIsMoved(data.isMoved || false);
            setAfterClientId(data.afterClientId || data.beforeClientId || data.clientId || '');
            setAfterUnitId(data.afterUnitId || data.beforeUnitId || '');
            setAfterUnitAssetTagId(data.afterUnitAssetTagId || '');
            setAfterStatusId(data.afterStatusId || '');
            setAfterPriorityId(data.afterPriorityId);
            setAfterLocation(data.afterLocation || '');
            setMovedComments(data.movedComments || '');

            let isManager = false;
            if (!readOnly && user && data.oContractId) {
                try {
                    isManager = await dataService.isUserContractManager(user.id, data.oContractId);
                    // "Usar como capa": contracts_managers.role = 'manager' (não 'viewer');
                    // super admin também pode.
                    const managers = await dataService.getContractManagers(data.oContractId);
                    const currentManager = managers.find(m =>
                        String(m.managerId) === String(user.id) && m.role?.toLowerCase() === 'manager'
                    );
                    setIsContractManagerAdminSuper(!!currentManager);
                } catch (mError) {
                    console.warn('Could not verify contract manager status', mError);
                }
            }
            setIsContractManager(isManager);
            if (!checklistProgressKnownRef.current) setMaintenanceProgress(data.maintenancePlanProgress ?? 0);
            if (!checklistPlanKnownRef.current) setChecklistPlanId(data.maintenancePlanId || '');
            setHasRecorder(data.hasRecorder ?? true);
            setBeforeRecorder(data.beforeRecorder != null ? String(data.beforeRecorder) : '');
            setAfterRecorder(data.afterRecorder != null ? String(data.afterRecorder) : '');
        } catch (error) {
            console.error('Error loading asset:', error);
            toast.error('Erro ao carregar detalhes do ativo');
        } finally {
            setLoading(false);
            setDataReady(true);
        }
    };

    // Centraliza a seção pedida depois que os dados chegaram (a altura das seções muda)
    useEffect(() => {
        if (!dataReady || !focusSection) return;
        const timer = setTimeout(() => {
            document.getElementById(REPORT_SECTION_IDS[focusSection])
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            onFocusHandled?.();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, focusSection]);

    useEffect(() => {
        if (assetId) loadPageData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetId]);

    // ── Fotos ────────────────────────────────────────────────────────────────

    const clearMovement = async () => {
        setShowUnmoveConfirmModal(false);
        setIsMoved(false);
        setAfterClientId('');
        setAfterUnitId('');
        setAfterUnitAssetTagId('');
        setAfterStatusId('');
        setAfterPriorityId(undefined);
        setAfterLocation('');
        setMovedComments('');
        await saveNow({
            is_moved: false,
            after_client_id: null,
            after_unit_id: null,
            after_unit_asset_tag_id: null,
            after_tag_id: null,
            after_tag_sub_id: null,
            after_status_id: null,
            after_priority_id: null,
            after_location: null,
            moved_comments: null
        });
        toast.info('Movimentação desativada e dados de destino resetados');
    };

    const handleToggleMoved = async (val: boolean) => {
        if (!val) {
            setShowUnmoveConfirmModal(true);
            return;
        }
        setIsMoved(true);
        const updates: Record<string, unknown> = { is_moved: true };
        if (!afterClientId && asset?.clientId) {
            setAfterClientId(asset.clientId);
            updates.after_client_id = asset.clientId;
        }
        if (!afterUnitId && asset?.beforeUnitId) {
            setAfterUnitId(asset.beforeUnitId);
            updates.after_unit_id = asset.beforeUnitId;
        }
        if (!afterUnitAssetTagId && asset?.beforeUnitAssetTagId) {
            setAfterUnitAssetTagId(asset.beforeUnitAssetTagId);
            updates.after_unit_asset_tag_id = asset.beforeUnitAssetTagId;
        }
        if (afterPriorityId === undefined && asset?.beforePriorityId !== undefined) {
            setAfterPriorityId(asset.beforePriorityId);
            updates.after_priority_id = asset.beforePriorityId;
        }
        if (!afterStatusId && asset?.beforeStatusId) {
            setAfterStatusId(asset.beforeStatusId);
            updates.after_status_id = asset.beforeStatusId;
        }
        if (!afterLocation && asset?.beforeLocation) {
            setAfterLocation(asset.beforeLocation);
            updates.after_location = asset.beforeLocation;
        }
        await saveNow(updates);
    };

    const handleAfterClientChange = (clientId: string) => {
        setAfterClientId(clientId);
        setAfterUnitId('');
        setAfterUnitAssetTagId('');
        saveNow({
            after_client_id: clientId,
            after_unit_id: null,
            after_unit_asset_tag_id: null,
            after_tag_id: null,
            after_tag_sub_id: null
        });
    };

    const handleAfterUnitChange = (unitId: string) => {
        setAfterUnitId(unitId);
        setAfterUnitAssetTagId('');
        saveNow({ after_unit_id: unitId, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    };

    const handleUnitAssetTagChange = (tag: UnitAssetTagOption | null) => {
        setAfterUnitAssetTagId(tag?.id || '');
        saveNow({
            after_unit_asset_tag_id: tag?.id || null,
            after_tag_id: tag?.asset_tag_id?.toString() || null,
            after_tag_sub_id: tag?.asset_tag_sub_id?.toString() || null
        });
    };

    const movementDestination = { afterClientId, afterUnitId, afterUnitAssetTagId, afterPriorityId, afterStatusId, afterLocation };
    const isMovementComplete = destinationIsComplete(movementDestination);

    // ── Validação e status ───────────────────────────────────────────────────

    const hasMaintenancePlan = planIsChosen(checklistPlanId);
    const beforeDone = !!initialCondition.trim() && initialImages.length > 0;
    const afterDone = !!finalCondition.trim() && finalImages.length > 0;

    const progressItems: ReportProgressItem[] = buildProgressSpecs({
        beforeDone, afterDone, hasPlan: hasMaintenancePlan, maintenanceProgress,
        activitiesCount: activities.length, isMoved, movementComplete: isMovementComplete,
    }).map(({ section, ...item }) => ({ ...item, sectionId: REPORT_SECTION_IDS[section] }));

    /** Regras para reportar, revisar e aprovar (mesmas nos três caminhos). */
    const validateReport = (verb: 'reportar' | 'confirmar'): boolean => {
        const check = checkReport({
            uploadingCount, beforeDone, afterDone, activitiesCount: activities.length,
            isMoved, movementComplete: isMovementComplete,
            sameDestination: () => isSameMovementDestination(asset, movementDestination),
            verb,
        });
        if (check.ok) return true;
        if (check.problem === 'same-destination') setShowMovementModal(true);
        else if (check.level === 'info') toast.info(check.message ?? '');
        else toast.error(check.message ?? '');
        return false;
    };

    // ── Desktop: anterior/próximo na lista de ativos da visita (mesma ordem da lista) ──
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

    const {
        showRejectionModal, setShowRejectionModal, rejectionNotes, setRejectionNotes,
        showReportConfirmModal, setShowReportConfirmModal,
        showApproveMovedModal, setShowApproveMovedModal,
        showIncompletePlanConfirmModal, setShowIncompletePlanConfirmModal,
        handleReportClick, handleConfirmReport, handleConfirmApproval, handleConfirmEdit,
        handleRevertDraft, handleConfirmRejection,
    } = useReportStatusFlow({
        assetId, currentUserId, asset, setAsset, localEditMode, setLocalEditMode, setIsUpdatingStatus,
        validateReport, hasMaintenancePlan, maintenanceProgress, isMoved, initialCondition, finalCondition,
        stage, flushSave, completeSelectedAlerts, releaseMyLock, advanceAfterAction, onBack,
    });

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
            await loadPageData();
        } catch (error) {
            console.error('Erro ao copiar relatório:', error);
            toast.error(error instanceof Error && error.message ? error.message : 'Erro ao copiar o relatório.');
        } finally {
            setIsCopying(false);
        }
    };

    // ── Atividades, materiais, ativo ─────────────────────────────────────────

    const ensureUserId = async (): Promise<string> => {
        if (currentUserId) return currentUserId;
        const u = await dataService.getCurrentUser();
        if (u) setCurrentUserId(u.id);
        return u?.id || '';
    };

    const handleRemoveMaterial = async (materialRowId: string) => {
        setRemovingMaterialId(materialRowId);
        try {
            const userId = await ensureUserId();
            if (!userId) return;
            await dataService.removeMaterialFromAsset(materialRowId, userId);
            setUsedMaterials(prev => prev.filter(m => m.id !== materialRowId));
            setMaterialToDelete(null);
            toast.success('Material removido');
        } catch (error) {
            console.error('Error removing material:', error);
            toast.error('Erro ao remover material');
        } finally {
            setRemovingMaterialId(null);
        }
    };

    const handleRemoveActivity = async (activityId: string) => {
        setRemovingActivityId(activityId);
        try {
            const userId = await ensureUserId();
            if (!userId) return;
            await dataService.toggleOrderVisitAssetActivity(assetId, activityId, userId, false);
            setActivities(prev => prev.filter(a => a.activityId !== activityId));
            toast.success('Atividade removida');
        } catch (error) {
            console.error('Error removing activity:', error);
            toast.error('Erro ao remover atividade');
        } finally {
            setRemovingActivityId(null);
        }
    };

    const handleRemoveAsset = async () => {
        try {
            setIsUpdatingStatus(true);
            await dataService.removeAssetFromOrderVisit(assetId);
            toast.success('Ativo removido da visita');
            onBack();
        } catch (error) {
            console.error('Error removing asset:', error);
            toast.error(error instanceof Error && error.message ? `Erro ao remover ativo: ${error.message}` : 'Erro ao remover ativo');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSwapAsset = async (newAsset: Asset) => {
        try {
            setIsSwapping(true);
            await dataService.changeOrderVisitAsset(assetId, newAsset.id, currentUserId);
            toast.success('Ativo alterado com sucesso!');
            setShowSwapPage(false);
            loadPageData();
        } catch (error: any) {
            console.error('Error swapping asset:', error);
            toast.error(error.message || 'Erro ao trocar ativo');
        } finally {
            setIsSwapping(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <Loading size="sm" />
            </div>
        );
    }

    if (!asset) return null;

    const visitPid = Number(visitProcessingId || OVA_PROCESSING.DRAFT);
    const actionFlags: AssetReportActionFlags = {
        showReport: [OVA_PROCESSING.DRAFT, OVA_PROCESSING.REVIEWED, OVA_PROCESSING.REJECTED].includes(processingId as any),
        showRevertDraft: processingId === OVA_PROCESSING.REPORTED && !localEditMode && visitPid === OVA_PROCESSING.DRAFT,
        showReview: processingId === OVA_PROCESSING.REPORTED || processingId === OVA_PROCESSING.REVIEWED || !!localEditMode,
        showSwap: [2, 3, 4].includes(Number(visitProcessingId)) && !isMoved && asset.isFiled === false,
        showRemove: Number(visitProcessingId) !== OVA_PROCESSING.APPROVED && (!asset.isFiled || !isMoved),
        showCopyFrom: processingId === OVA_PROCESSING.DRAFT && !isReadOnly && !localEditMode,
        canDisapprove: canView('orders_visits_processing_disapprove'),
        canReview: canView('orders_visits_processing_review'),
        canApprove: isContractManager,
    };
    const actionProps = {
        ...actionFlags,
        localEditMode,
        isUpdatingStatus,
        uploadingCount,
        onReport: handleReportClick,
        onKeepDraft: onBack,
        onRevertDraft: handleRevertDraft,
        onReject: () => setShowRejectionModal(true),
        onStartReview: () => setLocalEditMode('review'),
        onStartApproval: () => setLocalEditMode('approval'),
        onCancelEdit: () => setLocalEditMode(null),
        onConfirmEdit: handleConfirmEdit,
        onSwap: () => setShowSwapPage(true),
        onRemove: () => setShowRemoveModal(true),
        onCopyFrom: () => {
            if (!isOnline()) { toast.error('Copiar de outro ativo precisa de internet.'); return; }
            setShowCopyFromModal(true);
        },
    };
    const showMobileBar = !readOnly && hasPrimaryReportAction(actionFlags, localEditMode);
    const showProgress = !isReadOnly;
    const progressReadyLabel = localEditMode === 'review'
        ? 'Pronto para revisar'
        : localEditMode === 'approval'
            ? 'Pronto para aprovar'
            : 'Pronto para reportar';

    const gridProps = {
        isReadOnly,
        canUseAsCover: !isVisitFiled && (isContractManagerAdminSuper || currentUserIsAdminSuper),
        onView: setExpandedImage,
        onEdit: handleEditImage,
        onRemove: photos.removePhoto,
        onAdd: setPhotoActionSection,
        onUseAsCover: handleUseAsCover,
        onFileDrop: !Capacitor.isNativePlatform() ? handleFileDrop : undefined,
    };

    const notices = (
        <>
            {processingId === OVA_PROCESSING.REJECTED && asset.disapprovedNotes && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span className="text-[11px] font-black uppercase tracking-widest">Motivo da Rejeição</span>
                    </div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300 leading-relaxed">{asset.disapprovedNotes}</p>
                </div>
            )}

            {/* Modo offline: ativo reservado para outro técnico */}
            {isLockedByOther && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">lock</span>
                    <div className="flex-1 text-xs">
                        <p className="font-black text-amber-800 dark:text-amber-300">Em uso por {assetLock.userName || 'outro técnico'}</p>
                        <p className="text-amber-700 dark:text-amber-400/80 mt-0.5">Só consulta enquanto o relatório não for enviado.</p>
                    </div>
                    {(isContractManager || authUser?.isAdmin || authUser?.isAdminSuper) && (
                        <button
                            type="button"
                            onClick={forceReleaseLock}
                            className="shrink-0 min-h-[40px] px-3 rounded-lg bg-amber-600 text-white text-[11px] font-black uppercase"
                        >
                            Liberar
                        </button>
                    )}
                </div>
            )}

            {/* Modo offline: ativo não reservado no preparo */}
            {isNotReservedOffline && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-slate-500">cloud_off</span>
                    <div className="flex-1 text-xs">
                        <p className="font-black text-slate-700 dark:text-slate-200">Sem internet · só consulta</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">Este ativo não foi reservado para você em "Preparar para campo".</p>
                    </div>
                </div>
            )}

            {/* Modo offline: alterações deste ativo ainda no aparelho */}
            {hasUnsentChanges && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    Alterações deste ativo aguardando envio
                </div>
            )}
        </>
    );

    return (
        <div ref={rootRef} className="@container/page min-h-screen bg-transparent">
            <div className={`mx-auto pt-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] ${readOnly ? 'max-w-md' : 'max-w-md @4xl/page:max-w-6xl'} ${showMobileBar ? 'pb-8' : 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))]'} @4xl/page:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]`}>
                <div className={readOnly ? '' : '@4xl/page:grid @4xl/page:grid-cols-[340px_minmax(0,1fr)] @4xl/page:gap-6 @4xl/page:items-start'}>

                    {/* Desktop: painel lateral fixo (à esquerda) */}
                    {!readOnly && (
                        <aside className="hidden @4xl/page:block sticky top-4 space-y-4">
                            {onNavigateAsset && siblingIndex >= 0 && visitSiblings.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToSibling(prevSibling)}
                                        disabled={!prevSibling || isNavigating}
                                        title={prevSibling ? `Anterior: ${prevSibling.code} · ${prevSibling.description || ''}` : 'Primeiro ativo da visita'}
                                        aria-label="Ativo anterior"
                                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-500 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <div className="flex-1 text-center leading-tight">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativos da visita</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                            {isNavigating ? 'Abrindo…' : `${siblingIndex + 1} de ${visitSiblings.length}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => goToSibling(nextSibling)}
                                        disabled={!nextSibling || isNavigating}
                                        title={nextSibling ? `Próximo: ${nextSibling.code} · ${nextSibling.description || ''}` : 'Último ativo da visita'}
                                        aria-label="Próximo ativo"
                                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-500 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            )}
                            <OrderVisitAssetCardDetail asset={asset} onClick={onViewAsset} />
                            {showProgress && <AssetReportProgress items={progressItems} variant="list" readyLabel={progressReadyLabel} />}
                            {!isReadOnly && saveState !== 'idle' && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <AssetReportSaveStatus state={saveState} onRetry={flushQuietly} />
                                </div>
                            )}
                            <AssetReportActions mode="all" {...actionProps} />
                        </aside>
                    )}

                    {/* Coluna principal */}
                    <div className="@container min-w-0 space-y-6">
                        {notices}

                        {/* Celular: ativo + progresso no topo (no desktop vão para o painel) */}
                        {!readOnly && (
                            <div className="space-y-4 @4xl/page:hidden">
                                <OrderVisitAssetCardDetail asset={asset} onClick={onViewAsset} />
                                {showProgress && <AssetReportProgress items={progressItems} variant="compact" readyLabel={progressReadyLabel} />}
                            </div>
                        )}

                        {/*
                          Seções: no celular seguem a ordem do DOM (ordem do trabalho);
                          com a coluna larga (@2xl) Antes/Depois ficam lado a lado.
                        */}
                        <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-2">
                            {currentUserIsAdminSuper && asset.code && processingId !== OVA_PROCESSING.APPROVED && (
                                <ReportSection icon="menu_book" title="Manuais Técnicos" className="@2xl:col-span-2 @2xl:order-0">
                                    <OrderVisitAssetManualsSection assetId={String(asset.assetId)} assetCode={asset.code} />
                                </ReportSection>
                            )}

                            <AssetReportConditionSection
                                id={REPORT_SECTION_IDS.before}
                                className="@2xl:order-1"
                                side="initial"
                                photos={photos.initialPhotos}
                                value={initialCondition}
                                onChange={(v) => {
                                    setInitialCondition(v);
                                    queueSave({ before_comments: v });
                                }}
                                onBlur={flushQuietly}
                                {...gridProps}
                            />

                            <div id={REPORT_SECTION_IDS.checklist} className="scroll-mt-4 @2xl:col-span-2 @2xl:order-3">
                                <MaintenanceChecklistView
                                    ovAssetId={asset.id}
                                    assetId={asset.assetId}
                                    assetTypeId={asset.assetTypeId}
                                    companyId={asset.oCompanyId}
                                    userId={currentUserId}
                                    initialPlanId={asset.maintenancePlanId}
                                    onUpdateProgress={handleChecklistProgress}
                                    onPlanChange={handleChecklistPlanChange}
                                    disabled={isReadOnly || isVisitFiled}
                                    onAddAlert={canCreate('assets_alerts') ? (description) => {
                                        setAlertInitialDescription(description);
                                        setIsAddingAlert(true);
                                    } : undefined}
                                />
                            </div>

                            <AssetReportActivitiesSection
                                id={REPORT_SECTION_IDS.activities}
                                className="@2xl:col-span-2 @2xl:order-4"
                                activities={activities}
                                isReadOnly={isReadOnly}
                                canRemove={canRemoveItems}
                                removingActivityId={removingActivityId}
                                onAdd={() => {
                                    if (asset.orderTypeId && onManageActivities) onManageActivities(asset.orderTypeId);
                                    else toast.error('Não foi possível identificar o tipo de OS');
                                }}
                                onRemove={handleRemoveActivity}
                            />

                            <AssetReportMaterialsSection
                                id={REPORT_SECTION_IDS.materials}
                                className="@2xl:col-span-2 @2xl:order-5"
                                materials={usedMaterials}
                                isReadOnly={isReadOnly}
                                canRemove={canRemoveItems}
                                showCosts={canView('orders_visits_costs')}
                                removingMaterialId={removingMaterialId}
                                onAdd={() => {
                                    if (onManageMaterials) onManageMaterials();
                                    else toast.error('Funcionalidade indisponível');
                                }}
                                onRemove={setMaterialToDelete}
                            />

                            <AssetReportMovementSection
                                id={REPORT_SECTION_IDS.movement}
                                className="@2xl:col-span-2 @2xl:order-6"
                                isMoved={isMoved}
                                isReadOnly={isReadOnly}
                                showMissing={!isReadOnly && isMoved && !isMovementComplete}
                                origin={{
                                    clientName: asset.beforeClientName || asset.clientName,
                                    unitDescription: asset.beforeUnitDescription,
                                    tagDescription: [asset.beforeTagDescription, asset.beforeTagSubDescription].filter(Boolean).join(' / ') || undefined,
                                    statusDescription: asset.beforeStatusDescription,
                                    location: asset.beforeLocation,
                                }}
                                values={{
                                    clientId: afterClientId,
                                    unitId: afterUnitId,
                                    unitAssetTagId: afterUnitAssetTagId,
                                    statusId: afterStatusId,
                                    priorityId: afterPriorityId,
                                    location: afterLocation,
                                    comments: movedComments,
                                }}
                                onToggle={handleToggleMoved}
                                onClientChange={handleAfterClientChange}
                                onUnitChange={handleAfterUnitChange}
                                onUnitAssetTagChange={handleUnitAssetTagChange}
                                onStatusChange={(v) => { setAfterStatusId(v); saveNow({ after_status_id: v }); }}
                                onPriorityChange={(v) => { setAfterPriorityId(v); saveNow({ after_priority_id: v ?? null }); }}
                                onLocationChange={(v) => { setAfterLocation(v); queueSave({ after_location: v }); }}
                                onCommentsChange={(v) => { setMovedComments(v); queueSave({ moved_comments: v }); }}
                                onTextBlur={flushQuietly}
                            />

                            <AssetReportConditionSection
                                id={REPORT_SECTION_IDS.after}
                                className="@2xl:order-2"
                                side="final"
                                photos={photos.finalPhotos}
                                value={finalCondition}
                                onChange={(v) => {
                                    setFinalCondition(v);
                                    queueSave({ after_comments: v });
                                }}
                                onBlur={flushQuietly}
                                {...gridProps}
                            />

                            <AssetReportRecorderSection
                                id={REPORT_SECTION_IDS.recorder}
                                className={`@2xl:order-7 ${readOnly ? '@2xl:col-span-2' : ''}`}
                                hasRecorder={hasRecorder}
                                before={beforeRecorder}
                                after={afterRecorder}
                                isReadOnly={isReadOnly}
                                onToggle={(val) => { setHasRecorder(val); saveNow({ has_recorder: val }); }}
                                onBeforeChange={(v) => { setBeforeRecorder(v); queueSave({ before_recorder: parseRecorder(v) }); }}
                                onAfterChange={(v) => { setAfterRecorder(v); queueSave({ after_recorder: parseRecorder(v) }); }}
                                onCopyBeforeToAfter={() => { setAfterRecorder(beforeRecorder); saveNow({ after_recorder: parseRecorder(beforeRecorder) }); }}
                                onBlur={flushQuietly}
                            />

                            {!readOnly && (
                                <AssetReportAlertsSection
                                    id={REPORT_SECTION_IDS.alerts}
                                    className="@2xl:order-8"
                                    alerts={reportAssetAlerts}
                                    completedAlertIds={completedAlertIds}
                                    updatingAlertId={updatingAlertId}
                                    disabled={isUpdatingStatus || (localEditMode === null && processingId !== OVA_PROCESSING.DRAFT)}
                                    onToggle={toggleCompletedAlert}
                                    onAdd={canCreate('assets_alerts') && !!localEditMode
                                        ? () => { setAlertInitialDescription(''); setIsAddingAlert(true); }
                                        : undefined}
                                />
                            )}
                        </div>

                        {/* Celular: ações secundárias no fim (a principal fica na barra fixa) */}
                        {!readOnly && (
                            <div className="@4xl/page:hidden">
                                <AssetReportActions mode={showMobileBar ? 'secondary' : 'all'} {...actionProps} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Celular: barra fixa com a ação principal */}
            {showMobileBar && !isTyping && (
                <div className="@4xl/page:hidden sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                    <div className="max-w-md mx-auto space-y-2">
                        {!isReadOnly && <AssetReportSaveStatus state={saveState} onRetry={flushQuietly} />}
                        <AssetReportActions mode="primary" {...actionProps} />
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!materialToDelete}
                onClose={() => { if (!removingMaterialId) setMaterialToDelete(null); }}
                onConfirm={() => { if (materialToDelete) handleRemoveMaterial(materialToDelete.id); }}
                title="Remover Material"
                description={materialToDelete ? (
                    <>Confirma a remoção do material <strong className="text-slate-700 dark:text-slate-200">{materialToDelete.materialDescription}</strong>?</>
                ) : undefined}
                isLoading={!!removingMaterialId}
            />

            <AssetAlertModal
                isOpen={isAddingAlert}
                onClose={() => { setIsAddingAlert(false); setAlertInitialDescription(''); }}
                assetId={asset.assetId || ''}
                ovaId={asset.id}
                initialDescription={alertInitialDescription}
                onSaved={refreshAlerts}
            />

            {showSwapPage && (
                <AssetReportSwapPage
                    currentAssetId={asset.assetId}
                    initialClientId={asset.clientId || ''}
                    initialUnitId={asset.unitId || ''}
                    isSwapping={isSwapping}
                    onClose={() => setShowSwapPage(false)}
                    onConfirm={handleSwapAsset}
                />
            )}

            {expandedImage && (
                <PhotoViewer
                    src={expandedImage}
                    onClose={() => setExpandedImage(null)}
                    alt="Visita Técnica"
                    images={[...initialImages, ...finalImages]}
                    initialIndex={[...initialImages, ...finalImages].indexOf(expandedImage)}
                />
            )}

            {photoActionSection && (
                <ImageUploadSheet
                    isOpen={!!photoActionSection}
                    onClose={() => setPhotoActionSection(null)}
                    onTakeCamera={() => takeCameraPhoto(photoActionSection)}
                    onSelectGallery={() => handleAddPhotos(photoActionSection)}
                />
            )}

            {editingImage && (
                <ImageEditorModal
                    isOpen={!!editingImage}
                    imageFile={editingImage.src}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEditedImage}
                />
            )}

            {showRejectionModal && createPortal(
                <div className="fixed inset-0 z-200 flex items-center justify-center pad-safe-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowRejectionModal(false)}>
                    <div
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl">rebase_edit</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Rejeitar Relatório</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Informe abaixo o motivo do ajuste ou rejeição para que o técnico possa corrigir.
                            </p>
                            <textarea
                                value={rejectionNotes}
                                onChange={(e) => setRejectionNotes(e.target.value)}
                                placeholder="Descreva os motivos..."
                                aria-label="Motivo da rejeição"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[120px]"
                            />
                        </div>
                        <div className="p-6 pt-0 flex flex-col gap-3">
                            <button
                                type="button"
                                disabled={!rejectionNotes.trim() || isUpdatingStatus}
                                onClick={handleConfirmRejection}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUpdatingStatus ? 'Processando...' : 'Confirmar Rejeição'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRejectionModal(false)}
                                className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <Modal
                isOpen={showMovementModal}
                onClose={() => setShowMovementModal(false)}
                title="Atenção"
                message="O destino da movimentação deve ser diferente da origem (Cliente, Unidade, Setor/Posição, Prioridade ou Situação)."
                type="warning"
                confirmLabel="Entendi"
            />

            <Modal
                isOpen={showUnmoveConfirmModal}
                onClose={() => setShowUnmoveConfirmModal(false)}
                onConfirm={clearMovement}
                title="Desligar movimentação"
                message="Os dados de destino serão descartados e o ativo continua como estava originalmente. Deseja continuar?"
                type="warning"
                confirmLabel="Sim, Desligar"
                cancelLabel="Cancelar"
            />

            <AssetReportCopyFromModal
                isOpen={showCopyFromModal}
                visitId={asset.ovId ? String(asset.ovId) : undefined}
                currentOvaId={String(asset.id)}
                onClose={() => setShowCopyFromModal(false)}
                onSelect={(source) => { setShowCopyFromModal(false); setCopySource(source); }}
            />

            <Modal
                isOpen={!!copySource}
                onClose={() => { if (!isCopying) setCopySource(null); }}
                onConfirm={handleCopyFromConfirm}
                title="Copiar relatório"
                message={`Copiar as informações do relatório de ${copySource?.code || ''} ${copySource?.description || ''} para este ativo? Condições, horímetro, situação final, movimentação, plano, atividades e materiais deste relatório serão substituídos. As fotos não são copiadas e continuam como estão.`}
                type="warning"
                confirmLabel="Sim, Copiar"
                confirmLoading={isCopying}
                confirmLoadingLabel="COPIANDO..."
                cancelLabel="Cancelar"
            />

            <Modal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={handleRemoveAsset}
                title="Remover Ativo"
                message="Tem certeza que deseja remover este ativo desta visita? Isso excluirá permanentemente todos os dados associados, incluindo materiais, intervenções e imagens. Esta ação não pode ser desfeita."
                type="error"
                confirmLabel="Sim, Remover"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="REMOVENDO..."
                cancelLabel="Não, Manter"
            />

            <Modal
                isOpen={showCoverConfirmModal}
                onClose={() => {
                    setShowCoverConfirmModal(false);
                    setSelectedCoverUrl(null);
                }}
                onConfirm={handleConfirmCoverPhoto}
                title="Usar como Foto de Capa"
                message="Deseja definir esta imagem como foto principal do ativo?"
                type="info"
                confirmLabel="Sim, Definir como Capa"
                confirmLoading={isUpdatingCover}
                confirmLoadingLabel="ATUALIZANDO..."
                cancelLabel="Cancelar"
            />

            <Modal
                isOpen={showApproveMovedModal}
                onClose={() => setShowApproveMovedModal(false)}
                onConfirm={handleConfirmApproval}
                title="Confirmar Aprovação com Movimentação"
                message="Este ativo possui uma movimentação registrada! Ao confirmar a aprovação, os dados de movimentação deste relatório (situação, local/unidade, tag) irão substituir as informações reais do ativo. Tem certeza que deseja aprovar e confirmar esta movimentação?"
                type="warning"
                confirmLabel="Aprovar Modificando Ativo"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="APROVANDO..."
                cancelLabel="Cancelar"
            />

            <Modal
                isOpen={showIncompletePlanConfirmModal}
                onClose={() => setShowIncompletePlanConfirmModal(false)}
                onConfirm={async () => {
                    setShowIncompletePlanConfirmModal(false);
                    if (maintenanceProgress === 0) {
                        try {
                            // Progresso 0: desvincula o plano
                            await dataService.updateOrderVisitAssetPlan(assetId, null as any);
                            setChecklistPlanId('');
                            await dataService.updateOrderVisitAssetProgress(assetId, 0);
                        } catch (err) {
                            console.error('Error clearing maintenance plan:', err);
                        }
                    }
                    setShowReportConfirmModal(true);
                }}
                title="Plano de Manutenção Incompleto"
                message={
                    maintenanceProgress === 0
                        ? 'O plano de manutenção associado a este ativo está 0% concluído, por isso será desvinculado deste relatório. Deseja reportar o relatório assim mesmo?'
                        : `O plano de manutenção associado a este ativo está ${maintenanceProgress}% concluído. Os itens que faltam deverão ser respondidos em outro momento para encerrar a relação com o plano de manutenção. Deseja reportar o relatório assim mesmo?`
                }
                type="warning"
                confirmLabel="Sim, Reportar assim mesmo"
                cancelLabel="Não, Voltar ao checklist"
            />

            <Modal
                isOpen={showReportConfirmModal}
                onClose={() => setShowReportConfirmModal(false)}
                onConfirm={handleConfirmReport}
                title="Confirmar Reporte"
                message="Após reportar, as informações não poderão ser mais atualizadas. Deseja continuar?"
                type="warning"
                confirmLabel="Sim, Reportar"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="REPORTANDO..."
                cancelLabel="Cancelar"
            />

            {/* Após reportar/revisar/aprovar: aviso sem interação; fecha sozinho e abre o próximo ativo */}
            <Modal
                isOpen={!!advancingTo}
                onClose={() => { /* sem interação: fecha sozinho */ }}
                title="Próximo Ativo"
                message={`${advancingTo?.code || ''}${advancingTo?.description ? ` · ${advancingTo.description}` : ''}${siblingIndex >= 0 && visitSiblings.length > 0 ? ` (${siblingIndex + 2} de ${visitSiblings.length})` : ''}`}
                type="info"
                hideCancelButton
            />
        </div>
    );
};
