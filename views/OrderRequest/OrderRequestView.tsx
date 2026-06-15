import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, User, OrderVisit, ServiceHistoryItem } from '../../types';
import { dataService } from '../../services/dataService';
import { IconButton } from '../../components/ui/IconButton';
import { Avatar } from '../../components/ui/Avatar';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderMapComponent } from '../../components/orderRequests/OrderRequestMapComponent';
import { ServiceRequestCardDetail } from '../../components/serviceRequests/ServiceRequestCardDetail';
import { OrderVisitCardListItem } from '../../components/ordersVisits/OrderVisitCardListItem';
import { useOrderFollow } from '../../hooks/useOrderFollow';
import { usePermissions } from '../../contexts/PermissionsContext';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { Modal } from '../../components/ui/Modal';
import { ManusIntegrationService, ManusImageClassification } from '../../services/manusIntegrationService';
import { ManusVisit } from '../../types/manus';
import { ManusVisitCard } from '../../components/ordersVisits/ManusVisitCard';
import { ManusImageSelectionModal } from '../../components/ordersVisits/ManusImageSelectionModal';
import { formatCurrency } from '../../utils/formatters';
import { Loading } from '../../components/ui/Loading';
import { BatchVisitReportPDFButton } from '../../components/reports/BatchVisitReportPDFButton';
import { OrderVisitAssetCardListItem } from '../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardListItem';
import { OrderVisitAssetReport } from '../OrderVisit/OrderVisitAsset/OrderVisitAssetReport';
import { OrderVisitAssetView } from '../../types';


interface OrderRequestViewProps {
    order: Order;
    onBack: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
    onSelectParentOrder?: (order: Order) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onStartVisit?: () => void;
    onRefreshOrder?: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export const OrderRequestView: React.FC<OrderRequestViewProps> = ({
    order,
    onBack,
    onEdit,
    onCancel,
    onSelectParentOrder,
    onSelectVisit,
    onStartVisit,
    onRefreshOrder,
    activeTab: externalActiveTab,
    onTabChange
}) => {
    const { canView } = usePermissions();
    const [internalActiveTab, setInternalActiveTab] = useState('SS');
    const activeTab = externalActiveTab || internalActiveTab;

    const handleTabChange = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };

    const [showMenu, setShowMenu] = useState(false);
    const [showConfirmVisit, setShowConfirmVisit] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isStartingVisit, setIsStartingVisit] = useState(false);
    const [parentOrder, setParentOrder] = useState<Order | null>(null);
    const [visits, setVisits] = useState<OrderVisit[]>([]);
    const [isLoadingVisits, setIsLoadingVisits] = useState(false);

    // Manus State
    const [manusVisits, setManusVisits] = useState<ManusVisit[]>([]);
    const [isLoadingManus, setIsLoadingManus] = useState(false);
    const [showImageSelectionModal, setShowImageSelectionModal] = useState(false);
    const [selectedVisitForImages, setSelectedVisitForImages] = useState<ManusVisit | null>(null);
    const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Histórico — assets grouped by visit
    const [visitAssetsMap, setVisitAssetsMap] = useState<Record<string, { visit: OrderVisit; assets: OrderVisitAssetView[] }>>({});
    const [isLoadingVisitAssets, setIsLoadingVisitAssets] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

    // Get current user for logic and follow hook
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        dataService.getCurrentUser().then(user => {
            if (user) setCurrentUser(user);
        });
    }, []);

    // Use the custom hook for follow functionality
    const { isOrderFollowed, toggleFollow } = useOrderFollow(currentUser?.id);

    const tabs = ['SS', 'Visitas', 'Histórico', 'Assets', 'Localização'];

    if (!canView('orders_requests')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background-light dark:bg-slate-950">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-[40px]">lock</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Acesso Negado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                    Você não tem permissão para visualizar os detalhes desta ordem de serviço.
                    Entre em contato com o administrador se acreditar que isso é um erro.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    Voltar
                </button>
            </div>
        );
    }

    useEffect(() => {
        if (order.parentId) {
            // Fetch parent order details
            dataService.getParentOrder(order.parentId)
                .then(parent => {
                    if (parent) {
                        setParentOrder(parent);
                    } else {
                        setParentOrder(null);
                    }
                })
                .catch(err => {
                    console.error("Error fetching parent order:", err);
                    setParentOrder(null);
                });
        } else {
            setParentOrder(null);
        }
    }, [order.parentId]);

    useEffect(() => {
        if (activeTab === 'Visitas') {
            setIsLoadingVisits(true);
            dataService.getVisitsByOrderId(order.id)
                .then(data => {
                    setVisits(data);
                })
                .catch(err => {
                    console.error("Error fetching order visits:", err);
                })
                .finally(() => {
                    setIsLoadingVisits(false);
                });

            if (order.orderMask) {
                setIsLoadingManus(true);
                ManusIntegrationService.fetchVisits(order.orderMask)
                    .then(data => setManusVisits(data || []))
                    .catch(err => console.error("Error fetching manus visits:", err))
                    .finally(() => setIsLoadingManus(false));
            }
        }
    }, [activeTab, order.id, order.orderMask]);
    
    useEffect(() => {
        if (activeTab === 'Histórico' && order.id) {
            setIsLoadingVisitAssets(true);
            dataService.getVisitsByOrderId(order.id)
                .then(async (visitsData) => {
                    const map: Record<string, { visit: OrderVisit; assets: OrderVisitAssetView[] }> = {};
                    await Promise.all(
                        visitsData.map(async (v) => {
                            try {
                                const assets = await dataService.getOrderVisitAssets(v.id);
                                map[v.id] = { visit: v, assets };
                            } catch {
                                map[v.id] = { visit: v, assets: [] };
                            }
                        })
                    );
                    setVisitAssetsMap(map);
                })
                .catch(err => console.error('Error fetching visit assets:', err))
                .finally(() => setIsLoadingVisitAssets(false));
        }
    }, [activeTab, order.id]);

    const handleVerifyManus = async (visit: ManusVisit) => {
        if (!currentUser) return;
        setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'verifying' } : v));
        try {
            const result = await ManusIntegrationService.verifyDependencies(visit, currentUser.id);
            if (result.success) {
                setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'ready', _contractData: result.contractData } : v));
            } else {
                setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'error', _importMessage: result.message } : v));
            }
        } catch (err: any) {
            setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'error', _importMessage: err.message } : v));
        }
    };

    const handleImportManus = async (visit: ManusVisit, classifications?: ManusImageClassification[]) => {
        if (!currentUser) return;

        // Check if we need to show the image selection modal first
        const hasImages = visit.Reports?.some(r => r.Images && r.Images.length > 0);
        
        if (hasImages && !classifications) {
            setSelectedVisitForImages(visit);
            setShowImageSelectionModal(true);
            return;
        }

        setShowImageSelectionModal(false);
        setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'importing' } : v));
        
        try {
            const visitId = await ManusIntegrationService.importVisit(
                visit, 
                visit._contractData, 
                order, 
                currentUser.id,
                classifications
            );

            if (visitId) {
                setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'success' } : v));
                if (onRefreshOrder) onRefreshOrder();
                
                const allVisits = await dataService.getVisitsByOrderId(order.id);
                setVisits(allVisits);
                
                const newVisit = allVisits.find(v => v.id === visitId);
                if (newVisit && onSelectVisit) {
                    onSelectVisit(newVisit);
                }
            } else {
                setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'error', _importMessage: 'Erro ao importar a visita.' } : v));
            }
        } catch (err: any) {
            setManusVisits(prev => prev.map(v => v.UniqueId === visit.UniqueId ? { ...v, _importStatus: 'error', _importMessage: err.message } : v));
        }
    };

    const handleConfirmCancel = async () => {
        if (!onCancel) return;
        setIsCancelling(true);
        try {
            await onCancel();
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    // Realtime visits update
    useEffect(() => {
        const subscription = dataService.subscribeToVisits((payload) => {
            if (payload.new && payload.new.o_id?.toString() === order.id) {
                dataService.getVisitsByOrderId(order.id)
                    .then(setVisits)
                    .catch(err => console.error("Error refreshing visits:", err));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [order.id]);

    // Realtime order update (OS atual)
    useEffect(() => {
        const subscription = dataService.subscribeToOrders((payload) => {
            if (payload.new && payload.new.id.toString() === order.id) {
                if (onRefreshOrder) onRefreshOrder();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [order.id, onRefreshOrder]);

    // Realtime update para a SS pai — o trigger trg_order_status_inheritance
    // atualiza a SS quando o status de uma OS filha muda. Escutamos aqui para
    // garantir que o card da SS exibido na aba "SS" reflita o status correto
    // sem que o usuário precise sair e voltar à tela.
    useEffect(() => {
        if (!order.parentId) return;

        const parentSubscription = dataService.subscribeToOrders((payload) => {
            if (payload.new && payload.new.id.toString() === order.parentId) {
                dataService.getParentOrder(order.parentId!)
                    .then(parent => {
                        if (parent) setParentOrder(parent);
                    })
                    .catch(err => console.error('Error refreshing parent order:', err));
            }
        });

        return () => {
            parentSubscription.unsubscribe();
        };
    }, [order.parentId]);

    const handleToggleParentFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!parentOrder?.id) return;
        await toggleFollow(parentOrder.id);
    };

    // Format grid date like in card
    const formatGridDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes} h`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative">

            <div className="flex-1 overflow-y-auto no-scrollbar relative animate-in fade-in duration-700">



                {/* Bottom Sheet Menu */}
                {showMenu && createPortal(
                    <div className="fixed inset-0 z-100 flex items-end justify-center" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>
                        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" />
                        <div
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Icon Button - Top Right */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>

                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-14" />

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(); }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm transition-transform group-hover:scale-110">
                                        <span className="material-symbols-outlined text-[28px]">edit_note</span>
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Editar</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alterar dados da OS</span>
                                    </div>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        setShowCancelModal(true);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-red-500/10 transition-all active:scale-[0.98] group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm transition-transform group-hover:scale-110">
                                        <span className="material-symbols-outlined text-[28px]">cancel</span>
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Cancelar OS</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encerrar ordem de serviço</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                <div className={`p-4 space-y-8 pb-32 relative md:max-w-5xl md:mx-auto transition-all duration-700 ease-in-out`}>

                    {/* Start Visit Confirmation Modal */}
                    {showConfirmVisit && createPortal(
                        <div className="fixed inset-0 z-200 flex items-center justify-center p-6" onClick={() => setShowConfirmVisit(false)}>
                            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" />
                            <div
                                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-8 text-center">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                        <span className="material-symbols-outlined text-[40px]">hail</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Iniciar Visita?</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                        Você está prestes a iniciar a visita para esta Ordem de Serviço. Sua localização será registrada.
                                    </p>
                                </div>

                                <div className="p-6 pt-0 flex flex-col gap-3">
                                    <button
                                        onClick={async () => {
                                            setShowConfirmVisit(false);
                                            if (onStartVisit) {
                                                setIsStartingVisit(true);
                                                try {
                                                    await onStartVisit();
                                                } catch (e) {
                                                    setIsStartingVisit(false);
                                                }
                                            }
                                        }}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                    >
                                        Confirmar Início
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmVisit(false)}
                                        className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* Determine if the "START VISIT" button should be visible */}
                    {/* v_orders.team_leader_id = users.id AND users.is_available = true */}
                    {(() => {
                        const canStartVisit = currentUser?.id === order.teamLeaderId && currentUser?.isAvailable === true;

                        return (
                            <div className="z-10 mx-1">
                                <OrderCardDetail
                                    order={order}
                                    currentUser={currentUser}
                                    onStartVisit={canStartVisit ? () => setShowConfirmVisit(true) : undefined}
                                    onSuccess={onRefreshOrder}
                                    onEdit={onEdit}
                                    isStartingVisit={isStartingVisit}
                                />
                            </div>
                        );
                    })()}

                    {/* Tabs */}
                    <div className="flex items-center border-b border-slate-200 dark:border-white/5 no-scrollbar overflow-x-auto gap-6 px-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`pb-4 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab
                                    ? 'text-rose-500'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-8">
                        {activeTab === 'SS' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {order.parentId ? (
                                    parentOrder ? (
                                        <ServiceRequestCardDetail
                                            order={parentOrder}
                                            onClick={() => onSelectParentOrder?.(parentOrder)}
                                            isFollowed={parentOrder.id ? isOrderFollowed(parentOrder.id) : false}
                                            onToggleFollow={handleToggleParentFollow}
                                        />
                                    ) : (
                                        <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
                                            Carregando dados da SS original...
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-white dark:bg-card-dark rounded-2xl p-8 text-center border border-slate-100 dark:border-white/5 border-dashed">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <span className="material-symbols-outlined text-3xl">link_off</span>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold">
                                            Esta ordem de serviço não possui uma SS de origem vinculada.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Visitas' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isLoadingVisits ? (
                                    <div className="py-20 text-center space-y-4">
                                        <Loading size="md" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">CARREGANDO VISITAS...</p>
                                    </div>
                                ) : visits.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {/* Manus Import section */}
                                        {isLoadingManus ? (
                                            <div className="py-4 text-center">
                                                <Loading size="xs" />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold animate-pulse">Buscando no Manus...</p>
                                            </div>
                                        ) : manusVisits.length > 0 ? (
                                            <div className="flex flex-col gap-3 mb-6 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px]">cloud_download</span>
                                                    Importação Manus ({manusVisits.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {manusVisits.map((mv, idx) => (
                                                        <ManusVisitCard 
                                                            key={mv.UniqueId || idx} 
                                                            visit={mv}
                                                            onVerify={() => handleVerifyManus(mv)}
                                                            onImport={() => handleImportManus(mv)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Histórico de Visitas ({visits.length})</h3>
                                        <div className="flex items-center gap-2">
                                                <BatchVisitReportPDFButton
                                                    visits={visits}
                                                    variant="action"
                                                    filename={`relatorios-os-${order.orderMask || order.id}`}
                                                />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total:</span>
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                                    {formatCurrency(visits.reduce((sum, v) => sum + (v.totalValue || 0), 0))}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {visits.map(visit => (
                                                <OrderVisitCardListItem
                                                    key={visit.id}
                                                    visit={visit}
                                                    onClick={() => {
                                                        if (onSelectVisit) {
                                                            onSelectVisit(visit);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {isLoadingManus ? (
                                            <div className="py-4 text-center">
                                                <Loading size="xs" />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold animate-pulse">Buscando no Manus...</p>
                                            </div>
                                        ) : manusVisits.length > 0 ? (
                                            <div className="flex flex-col gap-3 mb-6 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px]">cloud_download</span>
                                                    Importação Manus ({manusVisits.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {manusVisits.map((mv, idx) => (
                                                        <ManusVisitCard 
                                                            key={mv.UniqueId || idx} 
                                                            visit={mv}
                                                            onVerify={() => handleVerifyManus(mv)}
                                                            onImport={() => handleImportManus(mv)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">event_busy</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Visitas não disponíveis</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">Esta Ordem de Serviços ainda não possui Visitas associadas</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Histórico' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isLoadingVisitAssets ? (
                                    <div className="py-20 text-center space-y-4">
                                        <Loading size="md" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">CARREGANDO ATIVOS...</p>
                                    </div>
                                ) : Object.keys(visitAssetsMap).length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                                            <span className="material-symbols-outlined text-4xl">precision_manufacturing</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Sem ativos registrados</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum ativo encontrado nas visitas desta OS.</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Visits scroll horizontally, assets stack vertically */
                                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                                        <div className="flex gap-4 pb-4 items-start" style={{ width: 'max-content' }}>
                                            {Object.values(visitAssetsMap)
                                                .filter(({ assets }) => assets.length > 0)
                                                .sort((a, b) => new Date(b.visit.ovCreatedAt).getTime() - new Date(a.visit.ovCreatedAt).getTime())
                                                .map(({ visit, assets }) => (
                                                    /* Each visit is a fixed-width column */
                                                    <div key={visit.id} className="w-[448px] shrink-0 flex flex-col gap-3">
                                                        {/* Visit Header */}
                                                            <div className="flex flex-col gap-1 px-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visita</span>
                                                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                                                        {visit.ovMask}
                                                                    </span>
                                                                    {visit.teamLeaderName && (
                                                                        <span className="ml-auto text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                                                                            {visit.teamLeaderName}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between px-1 mt-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {visit.ovOStatusDescription && (
                                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                                                                                {visit.ovOStatusDescription}
                                                                            </span>
                                                                        )}
                                                                        {visit.ovOSuspendedReasonDescription && (
                                                                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wide flex items-center gap-1">
                                                                                <span className="w-1 h-1 rounded-full bg-amber-500" />
                                                                                {visit.ovOSuspendedReasonDescription}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-bold text-slate-400">
                                                                            {visit.ovStartedAt && new Date(visit.ovStartedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                            {visit.ovEndedAt && ` — ${new Date(visit.ovEndedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        {/* Vertical asset cards */}
                                                        <div className="flex flex-col gap-3">
                                                            {assets.map(asset => (
                                                                <div key={asset.id} className="flex flex-col">
                                                                    <div
                                                                        onClick={() => setSelectedAssetIds(prev =>
                                                                            prev.includes(asset.id)
                                                                                ? prev.filter(id => id !== asset.id)
                                                                                : [...prev, asset.id]
                                                                        )}
                                                                    >
                                                                        <OrderVisitAssetCardListItem
                                                                            asset={asset}
                                                                        />
                                                                    </div>

                                                                    {/* Inline asset report */}
                                                                    {selectedAssetIds.includes(asset.id) && (
                                                                        <div className="mt-2 rounded-2xl border border-white/5 bg-slate-950 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                                                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900">
                                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relatório do Ativo</span>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                                                                                    }}
                                                                                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                                </button>
                                                                            </div>
                                                                            <div className="h-auto inline-report-wrapper">
                                                                                <OrderVisitAssetReport
                                                                                    assetId={asset.id}
                                                                                    onBack={() => setSelectedAssetIds(prev => prev.filter(id => id !== asset.id))}
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'Assets' && (
                            <div className="py-20 text-center space-y-4 animate-in fade-in duration-500">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="material-symbols-outlined text-slate-300 text-4xl">settings_input_component</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Ativos Vinculados</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum ativo vinculado diretamente a esta ordem de serviço.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Localização' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Mapa da Unidade</h3>
                                    {order.unitLatitude && order.unitLongitude ? (
                                        <div className="space-y-4">
                                            <OrderMapComponent
                                                latitude={Number(order.unitLatitude)}
                                                longitude={Number(order.unitLongitude)}
                                                unitAvatarUrl={order.unitAvatarUrl}
                                                title={order.unitDescription || order.unitName}
                                                leaderLatitude={order.teamLeaderLatitude ? Number(order.teamLeaderLatitude) : undefined}
                                                leaderLongitude={order.teamLeaderLongitude ? Number(order.teamLeaderLongitude) : undefined}
                                                leaderName={order.teamLeaderNameShort}
                                                leaderAvatarUrl={order.teamLeaderAvatarUrl}
                                                leaderIsAvailable={order.teamLeaderIsAvailable}
                                                leaderOvIdInProgress={order.teamLeaderOvIdInProgress}
                                            />
                                            <div className="bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-blue-500">location_on</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço da Unidade</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{order.unitDescriptionFull || order.unitDescription || 'Endereço não informado'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">map</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Coordenadas Ausentes</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">Esta unidade não possui latitude e longitude cadastradas.</p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Image Selection Modal */}
            {showImageSelectionModal && selectedVisitForImages && createPortal(
                <ManusImageSelectionModal 
                    visit={selectedVisitForImages}
                    onConfirm={(classifications) => handleImportManus(selectedVisitForImages, classifications)}
                    onCancel={() => setShowImageSelectionModal(false)}
                />,
                document.body
            )}
            {/* Cancel Confirmation Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                confirmLoading={isCancelling}
                confirmLoadingLabel="CANCELANDO..."
                title="Cancelar Ordem de Serviço"
                message="Deseja realmente cancelar esta ordem de serviço? Esta ação não poderá ser desfeita."
                confirmLabel="Sim, Cancelar"
                cancelLabel="Não, Manter"
                type="error"
            />
        </div >
    );
};

const InfoCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase truncate">{value}</span>
    </div>
);
