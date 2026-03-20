import React, { useState, useEffect } from 'react';
import { OrderVisit, OrderVisitTeam, User } from '../../types';
import { dataService } from '../../services/dataService';
import { OrderVisitCardDetail } from '../../components/ordersVisits/OrderVisitCardDetail';
import { Header } from '../../components/Header';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { Card } from '../../components/ui/Card';
import { OrderVisitProcessingButton } from '../../components/ordersVisits/OrderVisitProcessingButton';
import { useKeyboard } from '../../hooks/useKeyboard';

interface OrderVisitPageProps {
    visitId: string;
    onBack: () => void;
    onEndVisit?: () => void;
    activeTab?: VisitTab;
    onTabChange?: (tab: VisitTab) => void;
    onAssetSelect?: (assetId: string) => void;
    onApproveVisitRequest?: (visit: OrderVisit, order: Order) => void;
}


import { OrderVisitBottomNav, VisitTab } from '../../components/ordersVisits/OrderVisitBottomNav';
import { CloseVisitModal } from '../../components/ordersVisits/CloseVisitModal';
import { ConfirmDisapproveVisitModal } from '../../components/ordersVisits/ConfirmDisapproveVisitModal';
import { OrderVisitVehiclesList } from './OrderVisitVehicle/OrderVisitVehiclesList';
import { VisitReportPDFButton } from '../../components/reports/VisitReportPDFButton';
import { OrderVisitServicesList } from './OrderVisitService/OrderVisitServicesList';
import { OrderVisitFinancialDetail } from './OrderVisitFinancialDetail';
import { OrderVisitAssetsList } from './OrderVisitAsset/OrderVisitAssetsList';
import { Modal } from '../../components/ui/Modal';
import { OrderRequestForm } from '../OrderRequest/OrderRequestForm';
import { Order } from '../../types';



export const OrderVisitPage: React.FC<OrderVisitPageProps> = ({
    visitId,
    onBack,
    onEndVisit,
    activeTab: externalActiveTab,
    onTabChange: onExternalTabChange,
    onAssetSelect,
    onApproveVisitRequest
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
    const [fullOrderData, setFullOrderData] = useState<Order | null>(null);
    const [isContractManager, setIsContractManager] = useState(false);
    const isKeyboardVisible = useKeyboard();

    const activeTab = externalActiveTab || internalActiveTab;
    const setActiveTab = onExternalTabChange || setInternalActiveTab;
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

                // Check if current user is a manager for this contract
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
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [visitId]);

    const refreshVisit = async () => {
        try {
            const visitData = await dataService.getActiveOrderVisit(visitId);
            if (visitData) setVisit(visitData);
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
        setIsReportModalOpen(true);
    };

    const handleConfirmReportVisit = async () => {
        if (!visit || !currentUser) return;

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

        try {
            setIsApproving(true);
            // Fetch full order data for editing
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



    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold animate-pulse">CARREGANDO VISITA...</p>
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
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
                            hideHeaderActions={true}
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
                                (visit.ovProcessingId || 1) !== 4 &&
                                (visit.ovAssetsAmount || 0) > 0 &&
                                (visit.ovAssetsAmount || 0) === (visit.ovAssetsApprovedAmount || 0)
                            ) ? handleApproveVisit : undefined}
                            onDisapproveVisit={(
                                (isContractManager || currentUser?.isAdminSuper || currentUser?.isAdmin) &&
                                (visit.ovProcessingId || 1) !== 5 &&
                                (visit.ovProcessingId || 1) !== 4 &&
                                (visit.ovAssetsDisapprovedAmount || 0) > 0
                            ) ? handleDisapproveVisit : undefined}
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
                            onAssetSelect={onAssetSelect}
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
            default:
                return null;
        }
    };

    return (
        <div className="w-full safe-area-bottom">
            <div className="p-4 pb-24 md:max-w-3xl md:mx-auto w-full no-scrollbar">
                {renderTabContent()}
            </div>

            {/* Modal de Reporte */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title="Reportar Visita"
                maxWidth="sm"
            >
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ao reportar a visita, ela será enviada para revisão pelo supervisor. Deseja continuar?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsReportModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmReportVisit}
                            disabled={isReporting}
                            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                        >
                            {isReporting ? 'REPORTANDO...' : 'Confirmar Reporte'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Edição de OS para Aprovação (REMOVED: Now a page) */}


            {/* Modal de Fechamento */}
            <CloseVisitModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                onConfirm={handleConfirmCloseVisit}
                isLoading={isClosing}
            />

            {/* Bottom Navigation */}
            {!isKeyboardVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <OrderVisitBottomNav
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
            )}
            <ConfirmDisapproveVisitModal
                isOpen={isDisapproveModalOpen}
                onClose={() => setIsDisapproveModalOpen(false)}
                onConfirm={handleConfirmDisapproveVisit}
                isLoading={isDisapproving}
            />
        </div>
    );
};

