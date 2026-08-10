import React, { useState, useEffect } from 'react';
import { OrderVisit, OrderVisitTeam, User, Order, OrderVisitAssetView } from '../../types';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabase';
import { OrderVisitCardDetail } from '../../components/ordersVisits/OrderVisitCardDetail';
import { Header } from '../../components/Header';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { Card } from '../../components/ui/Card';
import { OrderVisitProcessingButton } from '../../components/ordersVisits/OrderVisitProcessingButton';
import { useKeyboard } from '../../hooks/useKeyboard';
import { IconButton } from '../../components/ui/IconButton';
import { KeyboardAwareScrollView } from '../../components/ui/KeyboardAwareScrollView';

interface OrderVisitPageProps {
    visitId: string;
    onBack: () => void;
    onEndVisit?: () => void;
    activeTab?: VisitTab;
    onTabChange?: (tab: VisitTab) => void;
    onAssetSelect?: (asset: OrderVisitAssetView, visit: OrderVisit) => void;
    onApproveVisitRequest?: (visit: OrderVisit, order: Order) => void;
    onNavigateToEvaluation?: (visitId: string) => void;
    onChatEntered?: (visitId: string) => void;
    onViewOrder?: () => void;
}


import { OrderVisitBottomNav, VisitTab } from '../../components/ordersVisits/OrderVisitBottomNav';
import { CloseVisitModal } from '../../components/ordersVisits/CloseVisitModal';
import { ConfirmDisapproveVisitModal } from '../../components/ordersVisits/ConfirmDisapproveVisitModal';
import { OrderVisitVehiclesList } from './OrderVisitVehicle/OrderVisitVehiclesList';
import { VisitReportPDFButton } from '../../components/reports/VisitReportPDFButton';
import { OrderVisitServicesList } from './OrderVisitService/OrderVisitServicesList';
import { OrderVisitFinancialDetail } from './OrderVisitFinancialDetail';
import { OrderVisitAssetsList } from './OrderVisitAsset/OrderVisitAssetsList';
import { SignatureSection } from '../../components/ordersVisits/SignatureSection';
import { Modal } from '../../components/ui/Modal';
import { OrderRequestForm } from '../OrderRequest/OrderRequestForm';
import { Loading } from '../../components/ui/Loading';
import { OrderVisitChatTab } from './OrderVisitChat/OrderVisitChatTab';
import { AIVisitAssistantTab } from '../../components/ai/AIVisitAssistantTab';
import { AlertModal } from '../../components/ui/AlertModal';
import { VisitEvaluationInline } from '../Visits/VisitEvaluationInline';

export const OrderVisitPage: React.FC<OrderVisitPageProps> = ({
    visitId,
    onBack,
    onEndVisit,
    activeTab: externalActiveTab,
    onTabChange: onExternalTabChange,
    onAssetSelect,
    onApproveVisitRequest,
    onNavigateToEvaluation,
    onChatEntered,
    onViewOrder
}) => {

    const [visit, setVisit] = useState<OrderVisit | null>(null);
    const [team, setTeam] = useState<OrderVisitTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [internalActiveTab, setInternalActiveTab] = useState<VisitTab>('home');
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isDisapproving, setIsDisapproving] = useState(false);
    const [isDisapproveModalOpen, setIsDisapproveModalOpen] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [isFiling, setIsFiling] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
    const [isMissingSignatureModalOpen, setIsMissingSignatureModalOpen] = useState(false);
    const [isReverseConfirmModalOpen, setIsReverseConfirmModalOpen] = useState(false);
    const [isReverseAlertModalOpen, setIsReverseAlertModalOpen] = useState(false);
    const [isReversingApproval, setIsReversingApproval] = useState(false);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [evaluationCount, setEvaluationCount] = useState(0);
    const [totalRequirements, setTotalRequirements] = useState(0);
    const [fullOrderData, setFullOrderData] = useState<Order | null>(null);
    const [isContractManager, setIsContractManager] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [vehiclesCount, setVehiclesCount] = useState(0);
    const [servicesCount, setServicesCount] = useState(0);
    const isKeyboardVisible = useKeyboard();

    const activeTab = externalActiveTab || internalActiveTab;
    const setActiveTab = (tab: VisitTab) => {
        if (onExternalTabChange) {
            onExternalTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };
    const { canView } = usePermissions();


    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true);
                const [visitData, teamData, user] = await Promise.all([
                    dataService.getActiveOrderVisit(visitId),
                    dataService.getOrderVisitTeam(visitId),
                    dataService.getCurrentUser()
                ]);

                setVisit(visitData);
                setTeam(teamData);
                setCurrentUser(user);
                setLoading(false); // Liberar a tela para o usuário imediatamente após o carregamento primário!

                // Check if current user is a manager for this contract silently in the background
                if (visitData?.contractId && user?.id) {
                    try {
                        const managers = await dataService.getContractManagers(visitData.contractId);
                        const isMgr = managers.some(m =>
                            String(m.managerId) === String(user.id) &&
                            m.role?.toLowerCase() === 'manager'
                        );
                        setIsContractManager(isMgr);
                    } catch (err) {
                        console.error('Error checking manager status:', err);
                    }
                }
            } catch (error) {
                console.error('Error loading visit page data:', error);
                toast.error('Erro ao carregar dados da visita');
                setLoading(false); // Em caso de erro, removemos o loading também
            }
        };

        loadPageData();
    }, [visitId]);

    // Busca o total inicial de mensagens do chat ao montar a tela
    useEffect(() => {
        const loadInitialChatCount = async () => {
            const { count } = await supabase
                .from('orders_visits_chat')
                .select('*', { count: 'exact', head: true })
                .eq('ov_id', parseInt(visitId));
            if (count && count > 0) {
                setUnreadChatCount(count);
            }
        };
        loadInitialChatCount();
    }, [visitId]);

    // Realtime: incrementa o badge a cada nova mensagem (qualquer remetente)
    useEffect(() => {
        const unreadChannel = supabase
            .channel(`screen_chat_msgs_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders_visits_chat',
                    filter: `ov_id=eq.${visitId}`
                },
                () => {
                    setUnreadChatCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            unreadChannel.unsubscribe();
        };
    }, [visitId]);

    // Busca o total inicial de veículos e mantém sincronizado
    useEffect(() => {
        const loadInitialVehiclesCount = async () => {
            const { count } = await supabase
                .from('orders_visits_vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('ov_id', parseInt(visitId));
            if (count !== null) {
                setVehiclesCount(count);
            }
        };
        loadInitialVehiclesCount();

        const vehiclesChannel = supabase
            .channel(`screen_vehicles_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders_visits_vehicles',
                    filter: `ov_id=eq.${visitId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setVehiclesCount(prev => prev + 1);
                    } else if (payload.eventType === 'DELETE') {
                        setVehiclesCount(prev => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        return () => {
            vehiclesChannel.unsubscribe();
        };
    }, [visitId]);

    // Busca o total inicial de serviços e mantém sincronizado
    useEffect(() => {
        const loadInitialServicesCount = async () => {
            const { count } = await supabase
                .from('orders_visits_services')
                .select('*', { count: 'exact', head: true })
                .eq('ov_id', parseInt(visitId));
            if (count !== null) {
                setServicesCount(count);
            }
        };
        loadInitialServicesCount();

        const servicesChannel = supabase
            .channel(`screen_services_${visitId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders_visits_services',
                    filter: `ov_id=eq.${visitId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setServicesCount(prev => prev + 1);
                    } else if (payload.eventType === 'DELETE') {
                        setServicesCount(prev => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        return () => {
            servicesChannel.unsubscribe();
        };
    }, [visitId]);

    // Busca dados de avaliação para o badge
    useEffect(() => {
        const loadEvaluationData = async () => {
            if (!visit) return;
            const contractId = visit.contractId || (visit as any).o_contract_id;
            if (!contractId) return;
            try {
                const [requirements, evaluations] = await Promise.all([
                    dataService.getContractEvaluationRequirements(contractId),
                    dataService.getVisitEvaluations(visitId)
                ]);
                setTotalRequirements(requirements.length);
                setEvaluationCount(evaluations.filter(e => e.wasApplied).length);
            } catch (error) {
                console.error('Error loading evaluation data:', error);
            }
        };
        loadEvaluationData();
    }, [visitId, visit]);

    const refreshVisit = async () => {
        try {
            const visitData = await dataService.getActiveOrderVisit(visitId);
            if (visitData) setVisit(visitData);

            // Fetch and update vehicles count
            const { count: vCount } = await supabase
                .from('orders_visits_vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('ov_id', parseInt(visitId));
            if (vCount !== null) {
                setVehiclesCount(vCount);
            }

            // Fetch and update services count
            const { count: sCount } = await supabase
                .from('orders_visits_services')
                .select('*', { count: 'exact', head: true })
                .eq('ov_id', parseInt(visitId));
            if (sCount !== null) {
                setServicesCount(sCount);
            }

            // Fetch and update evaluation count (only selected items)
            if (visitData) {
                const contractId = visitData.contractId || (visitData as any).o_contract_id;
                if (contractId) {
                    const evaluations = await dataService.getVisitEvaluations(visitId);
                    setEvaluationCount(evaluations.filter(e => e.wasApplied).length);
                }
            }
        } catch (error) {
            console.error('Error refreshing visit data:', error);
        }
    };


    // Refresh visit data when switching to costs tab to ensure financial values are up to date
    useEffect(() => {
        if (activeTab === 'costs') {
            refreshVisit();
        }
    }, [activeTab, visitId]);

    const handleRemoveMember = async (userId: string) => {
        if (!visit) return;

        try {
            await dataService.removeTeamMember(visit.id, userId);
            setTeam(prev => prev.filter(m => m.userId !== userId));
            toast.success('Membro removido da equipe');
        } catch (error) {
            console.error('Error removing team member:', error);
            toast.error('Erro ao remover membro');
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!visit) return;

        try {
            await dataService.addTeamMember(visit.id, userId);
            // Refresh team data
            const teamData = await dataService.getOrderVisitTeam(visit.id);
            setTeam(teamData);
            toast.success('Membro adicionado à equipe');
        } catch (error) {
            console.error('Error adding team member:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao adicionar membro');
        }
    };

    const handleEndVisit = async () => {
        setIsCloseModalOpen(true);
    };

    const handleConfirmCloseVisit = async (data: { statusId: number; suspendedReasonId?: number; progress: number }) => {
        if (!visit || !currentUser) return;

        setIsClosing(true);
        try {
            const statusDescription = data.statusId === 8 ? 'Concluída' : 'Suspensa';

            await dataService.closeOrderVisit(
                visit.id,
                visit.oId,
                data.statusId,
                statusDescription,
                data.suspendedReasonId ? String(data.suspendedReasonId) : null,
                data.progress,
                currentUser
            );

            toast.success('Visita encerrada com sucesso!');
            setIsCloseModalOpen(false);
            if (onEndVisit) onEndVisit();
        } catch (error) {
            console.error('Error closing visit:', error);
            toast.error(error instanceof Error ? error.message : 'Erro inesperado ao encerrar visita');
        } finally {
            setIsClosing(false);
        }
    };

    const handleReportVisit = async () => {
        if (!visit?.ovSignatureLeaderPath) {
            setIsMissingSignatureModalOpen(true);
            return;
        }
        setIsReportModalOpen(true);
    };

    const handleConfirmReportVisit = async () => {
        if (!visit || !currentUser) return;

        if (!visit.ovSignatureLeaderPath) {
            toast.warning('O responsável pela visita deve assinar antes de reportar.');
            return;
        }

        setIsReporting(true);
        const reportPromise = async () => {
            await dataService.reportOrderVisit(visit.id, currentUser.id);
            // Refresh visit data to update UI
            await refreshVisit();
            setIsReportModalOpen(false);
        };

        toast.promise(reportPromise(), {
            loading: 'Atualizando registro da visita...',
            success: 'Visita reportada com sucesso!',
            error: (err) => err instanceof Error ? err.message : 'Erro ao reportar visita'
        });

        try {
            await reportPromise();
        } catch (error) {
            console.error('Error reporting visit:', error);
        } finally {
            setIsReporting(false);
        }
    };

    const handleApproveVisit = async () => {
        if (!visit || !currentUser || !onApproveVisitRequest) return;

        const contractId = visit.contractId || (visit as any).o_contract_id;
        if (contractId) {
            const requirements = await dataService.getContractEvaluationRequirements(contractId);
            if (requirements.length > 0) {
                setIsApprovalModalOpen(true);
                return;
            }
        }

        handleApprovalModalDirect();
    };

    const handleApprovalModalEvaluate = () => {
        setIsApprovalModalOpen(false);
        if (onNavigateToEvaluation) {
            onNavigateToEvaluation(visitId);
        }
    };

    const handleApprovalModalDirect = async () => {
        if (!visit || !currentUser || !onApproveVisitRequest) return;
        setIsApprovalModalOpen(false);
        try {
            setIsApproving(true);
            const orderData = await dataService.getOrderById(visit.oId);
            if (orderData) {
                onApproveVisitRequest(visit, orderData);
            } else {
                toast.error('Não foi possível carregar os dados da OS para edição');
            }
        } catch (error) {
            console.error('Error fetching order for approval:', error);
            toast.error('Erro ao carregar dados da OS');
        } finally {
            setIsApproving(false);
        }
    };

    const handleDisapproveVisit = async () => {
        if (!visit || !currentUser || (visit.ovAssetsDisapprovedAmount || 0) === 0) return;
        setIsDisapproveModalOpen(true);
    };

    const handleConfirmDisapproveVisit = async () => {
        if (!visit || !currentUser) return;

        try {
            setIsDisapproving(true);
            await dataService.disapproveOrderVisit(visit.id, currentUser.id);
            toast.success('Visita rejeitada com sucesso!');
            await refreshVisit();
            setIsDisapproveModalOpen(false);
        } catch (error) {
            console.error('Error disapproving visit:', error);
            toast.error('Erro ao rejeitar visita');
        } finally {
            setIsDisapproving(false);
        }
    };
    
    const handleFileVisit = () => {
        setIsFileModalOpen(true);
    };

    const handleConfirmFileVisit = async () => {
        if (!visit || !currentUser) return;

        try {
            setIsFiling(true);
            await dataService.fileOrderVisit(visit.id, currentUser.id);
            toast.success('Visita arquivada com sucesso!');
            await refreshVisit();
            setIsFileModalOpen(false);
        } catch (error) {
            console.error('Error filing visit:', error);
            toast.error('Erro ao arquivar visita');
        } finally {
            setIsFiling(false);
        }
    };

    const handleMarkAsRevised = () => {
        setIsReviseModalOpen(true);
    };

    const handleConfirmReviseVisit = async () => {
        if (!visit || !currentUser) return;

        try {
            setIsRevising(true);
            await dataService.markOrderVisitAsRevised(visit.id, currentUser.id);
            toast.success('Visita marcada como REVISADA!');
            await refreshVisit();
            setIsReviseModalOpen(false);
        } catch (error) {
            console.error('Error marking visit as revised:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao marcar visita como revisada');
        } finally {
            setIsRevising(false);
        }
    };

    const handleReverseApprovalClick = async () => {
        if (!visit || !currentUser) return;
        setIsReversingApproval(true);
        try {
            const movedCount = await dataService.checkMovedAssetsForVisit(visit.id);
            if (movedCount > 0) {
                setIsReverseAlertModalOpen(true);
            } else {
                setIsReverseConfirmModalOpen(true);
            }
        } catch (error) {
            console.error('Error checking moved assets:', error);
            toast.error('Erro ao verificar movimentações de ativos');
        } finally {
            setIsReversingApproval(false);
        }
    };

    const handleConfirmReverseApproval = async () => {
        if (!visit || !currentUser) return;
        setIsReversingApproval(true);
        try {
            await dataService.reverseOrderVisitApproval(visit.id);
            toast.success('Aprovação estornada com sucesso!');
            setIsReverseConfirmModalOpen(false);
            await refreshVisit();
        } catch (error) {
            console.error('Error reversing visit approval:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao estornar aprovação');
        } finally {
            setIsReversingApproval(false);
        }
    };



    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
                <Loading size="md" />
                <p className="text-slate-500 font-bold animate-pulse">CARREGANDO VISITA...</p>
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
                <p className="text-slate-500 font-bold mb-6">Visita não encontrada ou processada.</p>
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold"
                >
                    Voltar
                </button>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-4">
                        <Card className="px-4 py-2.5 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-lg">
                            <OrderVisitProcessingButton
                                processingId={visit.ovProcessingId}
                                size="sm"
                                showLabel={true}
                            />
                            <VisitReportPDFButton
                                visitId={visitId}
                                visitMask={visit.ovMask}
                                variant="action"
                                label="PDF"
                            />
                        </Card>

                        <OrderVisitCardDetail
                            visit={visit}
                            team={team}
                            onRemoveTeamMember={!visit.isFiled ? handleRemoveMember : undefined}
                            onAddTeamMember={!visit.isFiled ? handleAddMember : undefined}
                            onEndVisit={visit.ovStatusId === 1 ? handleEndVisit : undefined}
                            onDeleteVisit={() => toast.success('Funcionalidade em desenvolvimento')}
                            onEditVisit={() => toast.success('Funcionalidade em desenvolvimento')}
                            isReportLoading={isReporting}
                            isApproveLoading={isApproving}
                            isDisapproveLoading={isDisapproving}
                            isFileLoading={isFiling}
                            hideHeaderActions={true}
                            onViewOrder={onViewOrder}
                            onReportVisit={(
                                visit.ovStatusId === 2 &&
                                [1, 4].includes(Number(visit.ovProcessingId || 1)) &&
                                (visit.ovAssetsAmount || 0) > 0 &&
                                String(currentUser?.id) === String(visit.ovTeamLeadId) &&
                                (
                                    ((visit.ovAssetsAmount || 0) === (visit.ovAssetsReportedAmount || 0)) ||
                                    (visit.ovProcessingId === 4 && (visit.ovAssetsDisapprovedAmount || 0) === 0)
                                )
                            ) ? handleReportVisit : undefined}
                            onApproveVisit={(
                                (isContractManager || currentUser?.isAdminSuper || currentUser?.isAdmin) &&
                                (visit.ovProcessingId || 1) !== 5 &&
                                (visit.ovAssetsAmount || 0) > 0 &&
                                (visit.ovAssetsAmount || 0) === (visit.ovAssetsApprovedAmount || 0)
                            ) ? handleApproveVisit : undefined}
                            onDisapproveVisit={(
                                (isContractManager || currentUser?.isAdminSuper || currentUser?.isAdmin) &&
                                (visit.ovProcessingId || 1) !== 5 &&
                                (visit.ovProcessingId || 1) !== 4 &&
                                (visit.ovAssetsDisapprovedAmount || 0) > 0
                            ) ? handleDisapproveVisit : undefined}
                            onFileVisit={(
                                (isContractManager || currentUser?.isAdminSuper || currentUser?.isAdmin) &&
                                (visit.ovProcessingId || 1) === 5 &&
                                !visit.isFiled &&
                                (visit.ovAssetsAmount || 0) > 0 &&
                                (visit.ovAssetsAmount || 0) === (visit.ovAssetsApprovedAmount || 0)
                            ) ? handleFileVisit : undefined}
                            onMarkAsRevised={(
                                canView('orders_visits_processing_review') &&
                                visit.ovStatusId === 2 &&
                                Number(visit.ovProcessingId || 1) === 2 &&
                                !visit.isFiled &&
                                (visit.ovAssetsAmount || 0) > 0 &&
                                (visit.ovAssetsAmount || 0) === (visit.ovAssetsRevisedAmount || 0)
                            ) ? handleMarkAsRevised : undefined}
                            isRevising={isRevising}
                            onReverseApproval={(
                                (isContractManager || currentUser?.isAdminSuper || currentUser?.isAdmin) &&
                                (visit.ovProcessingId || 1) === 5 &&
                                !visit.isFiled
                            ) ? handleReverseApprovalClick : undefined}
                            isReverseApprovalLoading={isReversingApproval}
                        />

                        <SignatureSection
                            visit={visit}
                            onRefresh={refreshVisit}
                            isEditable={!visit.isFiled}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'transport':
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <OrderVisitVehiclesList
                            visitId={visitId}
                            isEditable={!visit.isFiled}
                            companyId={visit.providerCompanyId}
                            onVisitRefresh={refreshVisit}
                        />
                    </div>
                );
            case 'assets':
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <OrderVisitAssetsList
                            visitId={visitId}
                            initialUnitId={visit.unitId}
                            initialUnitName={visit.unitDescription}
                            isEditable={!visit.isFiled}
                            onVisitRefresh={refreshVisit}
                            onAssetSelect={(asset) => {
                                if (onAssetSelect && visit) {
                                    onAssetSelect(asset, visit);
                                }
                            }}
                        />
                    </div>
                );
            case 'services':
                if (!canView('orders_visits_services')) {
                    return <AccessDenied onBack={() => setActiveTab('home')} message="Você não tem permissão para visualizar os serviços desta visita." />;
                }
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <OrderVisitServicesList
                            visitId={visitId}
                            isEditable={!visit.isFiled}
                            contractId={visit.contractId}
                            onVisitRefresh={refreshVisit}
                        />
                    </div>
                );
            case 'costs':
                if (!canView('orders_visits_costs')) {
                    return <AccessDenied onBack={() => setActiveTab('home')} message="Você não tem permissão para visualizar os custos desta visita." />;
                }
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <OrderVisitFinancialDetail visit={visit} />
                    </div>
                );
            case 'chat':
                return <OrderVisitChatTab visitId={visitId} onChatEntered={onChatEntered} />;
            case 'evaluation':
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {visit?.isFiled ? (
                            <div className="text-center py-12 bg-white dark:bg-card-dark rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2">
                                    lock
                                </span>
                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                                    Visita arquivada — avaliação somente leitura
                                </p>
                            </div>
                        ) : (
                            <VisitEvaluationInline visitId={visitId} visit={visit} onRefresh={refreshVisit} onEvaluationCountChange={setEvaluationCount} />
                        )}
                    </div>
                );
            case 'assistant':
                return <AIVisitAssistantTab visitId={visitId} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            {activeTab === 'chat' || activeTab === 'assistant' ? (
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {renderTabContent()}
                </div>
            ) : (
                <KeyboardAwareScrollView className="flex-1 p-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:max-w-3xl md:mx-auto w-full no-scrollbar" extraPadding={30}>
                    {renderTabContent()}
                </KeyboardAwareScrollView>
            )}

            {/* Modal de Reporte */}
            <AlertModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                icon="send"
                iconClassName="text-indigo-500"
                iconBgClassName="bg-indigo-50 dark:bg-indigo-900/20"
                iconRingClassName="ring-indigo-50/50 dark:ring-indigo-900/10"
                title="Reportar Visita"
                description="Ao reportar a visita, ela será enviada para revisão pelo supervisor. Deseja continuar?"
                primaryAction={{
                    label: isReporting ? 'REPORTANDO...' : 'Confirmar Reporte',
                    icon: 'send',
                    onClick: handleConfirmReportVisit,
                    variant: 'primary',
                    disabled: isReporting
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setIsReportModalOpen(false),
                    variant: 'ghost'
                }}
            />

            {/* Modal de Assinatura Obrigatória */}
            <AlertModal
                isOpen={isMissingSignatureModalOpen}
                onClose={() => setIsMissingSignatureModalOpen(false)}
                icon="warning"
                iconClassName="text-amber-500"
                iconBgClassName="bg-amber-50 dark:bg-amber-900/20"
                iconRingClassName="ring-amber-50/50 dark:ring-amber-900/10"
                title="Assinatura Obrigatória"
                description="É necessário a assinatura do Líder antes de reportar a visita."
                primaryAction={{
                    label: 'Entendido',
                    icon: 'check',
                    onClick: () => setIsMissingSignatureModalOpen(false),
                    variant: 'primary'
                }}
                secondaryAction={undefined}
            />

            {/* Modal de Fechamento */}
            <CloseVisitModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                onConfirm={handleConfirmCloseVisit}
                isLoading={isClosing}
                visit={visit}
            />

            {/* Modal de Aprovação - Avaliar ou Aprovar */}
            <AlertModal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                icon="gpp_maybe"
                iconClassName="text-amber-500"
                iconBgClassName="bg-amber-50 dark:bg-amber-900/20"
                iconRingClassName="ring-amber-50/50 dark:ring-amber-900/10"
                title="Aprovar Visita"
                description="Deseja realizar a avaliação dos serviços antes de aprovar a visita?"
                primaryAction={{
                    label: 'AVALIAR PRIMEIRO',
                    icon: 'rate_review',
                    onClick: handleApprovalModalEvaluate,
                    variant: 'primary'
                }}
                secondaryAction={{
                    label: 'APROVAR DIRETO',
                    icon: 'check_circle',
                    onClick: handleApprovalModalDirect,
                    variant: 'success'
                }}
            />

            {/* Bottom Navigation */}
            {!isKeyboardVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <OrderVisitBottomNav
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        unreadChatCount={unreadChatCount}
                        assetsCount={visit?.ovAssetsAmount || 0}
                        vehiclesCount={vehiclesCount}
                        servicesCount={servicesCount}
                        evaluationCount={evaluationCount}
                        totalRequirements={totalRequirements}
                        isAdminSuper={currentUser?.isAdminSuper}
                    />
                </div>
            )}

            <ConfirmDisapproveVisitModal
                isOpen={isDisapproveModalOpen}
                onClose={() => setIsDisapproveModalOpen(false)}
                onConfirm={handleConfirmDisapproveVisit}
                isLoading={isDisapproving}
            />

            {/* Modal de Arquivamento */}
            <AlertModal
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                icon="inventory_2"
                iconClassName="text-emerald-500"
                iconBgClassName="bg-emerald-50 dark:bg-emerald-900/20"
                iconRingClassName="ring-emerald-50/50 dark:ring-emerald-900/10"
                title="Arquivar Visita"
                description="Deseja realmente arquivar esta visita? Esta ação registrará sua aprovação final e marcará a visita como arquivada."
                primaryAction={{
                    label: isFiling ? 'ARQUIVANDO...' : 'Confirmar Arquivamento',
                    icon: 'inventory_2',
                    onClick: handleConfirmFileVisit,
                    variant: 'success',
                    disabled: isFiling
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setIsFileModalOpen(false),
                    variant: 'ghost'
                }}
            />

            {/* Modal de Marcar como Revisada */}
            <AlertModal
                isOpen={isReviseModalOpen}
                onClose={() => setIsReviseModalOpen(false)}
                icon="fact_check"
                iconClassName="text-blue-500"
                iconBgClassName="bg-blue-50 dark:bg-blue-900/20"
                iconRingClassName="ring-blue-50/50 dark:ring-blue-900/10"
                title="Marcar Visita como REVISADA"
                description={
                    <>
                        Todos os <span className="font-black text-slate-700 dark:text-slate-200">{visit.ovAssetsAmount}</span> ativos desta visita já foram revisados.
                        Confirme para marcar a visita como <span className="font-black text-blue-600">REVISADA</span>.
                    </>
                }
                primaryAction={{
                    label: isRevising ? 'REVISANDO...' : 'Confirmar Revisão',
                    icon: 'fact_check',
                    onClick: handleConfirmReviseVisit,
                    variant: 'primary',
                    disabled: isRevising
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setIsReviseModalOpen(false),
                    variant: 'ghost'
                }}
            />

            {/* Modal de Alerta - Movimentações de Ativos Impedindo Estorno */}
            <AlertModal
                isOpen={isReverseAlertModalOpen}
                onClose={() => setIsReverseAlertModalOpen(false)}
                icon="error"
                iconClassName="text-red-500"
                iconBgClassName="bg-red-50 dark:bg-red-900/20"
                iconRingClassName="ring-red-50/50 dark:ring-red-900/10"
                title="Estorno de Aprovação Impedido"
                description="Existem Movimentações de Ativos impedindo o estorno da aprovação."
                primaryAction={{
                    label: 'Fechar',
                    onClick: () => setIsReverseAlertModalOpen(false),
                    variant: 'slate'
                }}
            />

            {/* Modal de Confirmação de Estorno */}
            <AlertModal
                isOpen={isReverseConfirmModalOpen}
                onClose={() => setIsReverseConfirmModalOpen(false)}
                icon="undo"
                iconClassName="text-amber-500"
                iconBgClassName="bg-amber-50 dark:bg-amber-900/20"
                iconRingClassName="ring-amber-50/50 dark:ring-amber-900/10"
                title="Confirmar Estorno"
                description="A Visita e Ativos serão considerados como REPORTADOS. Deseja confirmar ?"
                primaryAction={{
                    label: isReversingApproval ? 'ESTORNANDO...' : 'Confirmar',
                    icon: 'undo',
                    onClick: handleConfirmReverseApproval,
                    variant: 'danger',
                    disabled: isReversingApproval
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setIsReverseConfirmModalOpen(false),
                    variant: 'ghost'
                }}
            />
        </div>
    );
};
