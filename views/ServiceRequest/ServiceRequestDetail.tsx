import React, { useState } from 'react';
import { Order, User, OrderVisit, ServiceHistoryItem } from '../../types';
import { IconButton } from '../../components/ui/IconButton';
import { ServiceRequestCardDetail } from '../../components/serviceRequests/ServiceRequestCardDetail';
import { OrderMapComponent } from '../../components/orderRequests/OrderRequestMapComponent';
import { useOrderFollow } from '../../hooks/useOrderFollow';
import { dataService } from '../../services/dataService';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderVisitCardListItem } from '../../components/ordersVisits/OrderVisitCardListItem';

interface ServiceRequestDetailProps {
    order: Order;
    onBack: () => void;
    onEdit?: () => void;
    onGenerateOS?: () => void;
    onCancelSS?: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onSelectOrder?: (order: Order) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onRefreshOrder?: () => void;
}

export const ServiceRequestDetail: React.FC<ServiceRequestDetailProps> = ({
    order,
    onBack,
    onEdit,
    onGenerateOS,
    onCancelSS,
    activeTab: externalActiveTab,
    onTabChange,
    onSelectOrder,
    onSelectVisit,
    onRefreshOrder
}) => {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        dataService.getCurrentUser().then(user => {
            if (user) setCurrentUser(user);
        });
    }, []);

    const { isOrderFollowed, toggleFollow } = useOrderFollow(currentUser?.id);

    const [internalActiveTab, setInternalActiveTab] = useState('OS');
    const activeTabRaw = externalActiveTab || internalActiveTab;
    // Normalize tab name for backward compatibility and case sensitivity
    const activeTab = (activeTabRaw === 'OS\'s' || activeTabRaw === 'OSs') ? 'OS' : activeTabRaw;
    const [childOrders, setChildOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [visits, setVisits] = useState<OrderVisit[]>([]);
    const [isLoadingVisits, setIsLoadingVisits] = useState(false);
    const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    React.useEffect(() => {
        if (order.id) {
            setIsLoadingOrders(true);
            dataService.getChildOrders(order.id)
                .then(data => {
                    setChildOrders(data);
                })
                .catch(err => console.error('Error fetching child orders:', err))
                .finally(() => setIsLoadingOrders(false));
        }
    }, [order.id]);

    React.useEffect(() => {
        if (activeTab === 'Visitas' && order.id) {
            setIsLoadingVisits(true);
            dataService.getVisitsByParentOrderId(order.id)
                .then(data => {
                    setVisits(data);
                })
                .catch(err => console.error('Error fetching SS visits:', err))
                .finally(() => setIsLoadingVisits(false));
        }
    }, [activeTab, order.id]);

    React.useEffect(() => {
        if (activeTab === 'Histórico' && order.id) {
            setIsLoadingHistory(true);
            dataService.getServiceOrderHistory(order.id)
                .then(data => {
                    setHistory(data);
                })
                .catch(err => console.error('Error fetching SS history:', err))
                .finally(() => setIsLoadingHistory(false));
        }
    }, [activeTab, order.id]);

    // Realtime updates for SS detail
    React.useEffect(() => {
        if (!order.id) return;

        // Subscribe to child orders changes
        const orderSub = dataService.subscribeToOrders((payload) => {
            if (payload.new && payload.new.parent_id?.toString() === order.id.toString()) {
                dataService.getChildOrders(order.id).then(setChildOrders);
            }
        });

        // Subscribe to visits changes
        const visitSub = dataService.subscribeToVisits((payload) => {
            // Refresh visits (getVisitsByParentOrderId handles the filtering by parent)
            dataService.getVisitsByParentOrderId(order.id).then(setVisits);
        });

        return () => {
            orderSub.unsubscribe();
            visitSub.unsubscribe();
        };
    }, [order.id]);

    const handleTabChange = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setInternalActiveTab(tab);
        }
    };

    const tabs = ['OS', 'Visitas', 'Histórico', 'Localização'];

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

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <div className="p-4 space-y-6 pb-32 relative md:max-w-5xl md:mx-auto">
                    {/* Main Card */}
                    <ServiceRequestCardDetail
                        order={order}
                        onEdit={onEdit}
                        onGenerateOS={onGenerateOS}
                        onCancelSS={onCancelSS}
                        isFollowed={order.id ? isOrderFollowed(order.id) : false}
                        onToggleFollow={async (e) => {
                            e.stopPropagation();
                            if (order.id) await toggleFollow(order.id);
                        }}
                    />

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
                        {activeTab === 'OS' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">OS's Vinculadas</h3>
                                    {isLoadingOrders ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                                        </div>
                                    ) : childOrders.length > 0 ? (
                                        <div className="space-y-4 px-1">
                                            {childOrders.map(childOrder => (
                                                <OrderCardDetail
                                                    key={childOrder.id}
                                                    order={childOrder}
                                                    onSuccess={onRefreshOrder}
                                                    onClick={() => {
                                                        onSelectOrder?.(childOrder);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-card-dark rounded-2xl p-8 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_late</span>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma OS gerada</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'Visitas' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isLoadingVisits ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">CARREGANDO VISITAS...</p>
                                    </div>
                                ) : visits.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Histórico de Visitas ({visits.length})</h3>
                                        <div className="flex flex-col gap-3">
                                            {visits.map(visit => (
                                                <OrderVisitCardListItem
                                                    key={visit.id}
                                                    visit={visit}
                                                    onClick={() => {
                                                        if (onSelectVisit) {
                                                            onSelectVisit(visit);
                                                        } else {
                                                            console.log('Visit clicked:', visit.id);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="material-symbols-outlined text-slate-300 text-4xl">event_busy</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Visitas não disponíveis</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Esta SS ainda não possui Visitas associadas.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Histórico' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-1">
                                {isLoadingHistory ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">CARREGANDO HISTÓRICO...</p>
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="space-y-6 pb-12">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 mb-6">Timeline de Eventos</h3>
                                        
                                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-slate-200 before:via-slate-200 before:to-transparent dark:before:from-slate-800 dark:before:via-slate-800 dark:before:to-transparent">
                                            {history.map((item, index) => (
                                                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    {/* Dot */}
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow absolute left-0 md:left-1/2 md:-ml-5 transition-transform duration-300 group-hover:scale-110 z-10">
                                                        <span className={`material-symbols-outlined text-lg ${
                                                            item.type === 'created' ? 'text-blue-500' :
                                                            item.type === 'visit_started' ? 'text-amber-500' :
                                                            item.type === 'visit_ended' ? 'text-emerald-500' :
                                                            item.type === 'intervention' ? 'text-indigo-500' :
                                                            item.type === 'material' ? 'text-rose-500' :
                                                            'text-slate-400'
                                                        }`}>
                                                            {item.type === 'created' ? 'add_circle' :
                                                             item.type === 'visit_started' ? 'location_on' :
                                                             item.type === 'visit_ended' ? 'task_alt' :
                                                             item.type === 'intervention' ? 'construction' :
                                                             item.type === 'material' ? 'inventory_2' :
                                                             'history'}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Card */}
                                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200 dark:hover:border-white/10 ml-12 md:ml-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <time className="text-[10px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                                {new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                            </time>
                                                            {item.visitMask && (
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.visitMask}</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">{item.title}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        {(item.userName || item.assetCode) && (
                                                            <div className="mt-3 pt-3 border-t border-slate-50 dark:border-white/5 flex flex-wrap gap-3">
                                                                {item.userName && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.userName}</span>
                                                                    </div>
                                                                )}
                                                                {item.assetCode && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="material-symbols-outlined text-[14px] text-slate-400">qr_code_2</span>
                                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">{item.assetCode}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="material-symbols-outlined text-slate-300 text-4xl">history</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Ações não disponíveis</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum evento registrado no histórico desta OS.</p>
                                        </div>
                                    </div>
                                )}
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
        </div>
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
