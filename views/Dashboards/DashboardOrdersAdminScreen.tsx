import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Order, OrderVisit } from '../../types';
import { UserServicesPanel } from '../../components/ui/UserServicesPanel';
import { UserVisitsPanel } from '../../components/ui/UserVisitsPanel';
import { dataService } from '../../services/dataService';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderVisitCardListItem } from '../../components/ordersVisits/OrderVisitCardListItem';
import { Loading } from '../../components/ui/Loading';
import { TabsBar } from '../../components/ui/TabsBar';

interface DashboardScreenProps {
    currentUser: User | null;
    onSelectOrder?: (order: Order) => void;
    onResumeVisit?: (visitId: string) => void;
    onEdit?: (order: Order) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ currentUser, onSelectOrder, onResumeVisit, onEdit }) => {
    // Persistence keys
    const STORAGE_KEYS = {
        TAB: 'dashboard_admin_active_tab',
        SERVICE: 'dashboard_admin_selected_service',
        VISIT_STATUS: 'dashboard_admin_selected_visit_status'
    };

    const [activeTab, setActiveTab] = useState<'services' | 'visits'>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.TAB);
        return (saved === 'services' || saved === 'visits') ? saved : 'services';
    });

    const [orders, setOrders] = useState<Order[]>([]);
    const [visits, setVisits] = useState<OrderVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedService, setSelectedService] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.SERVICE) || 'autorizados';
    });

    const [selectedVisitStatus, setSelectedVisitStatus] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.VISIT_STATUS) || 'rascunho';
    });

    const handleTabChange = (tab: 'services' | 'visits') => {
        setActiveTab(tab);
        localStorage.setItem(STORAGE_KEYS.TAB, tab);
    };

    const handleServiceSelect = (service: string) => {
        setSelectedService(service);
        localStorage.setItem(STORAGE_KEYS.SERVICE, service);
    };

    const handleVisitStatusSelect = (status: string) => {
        setSelectedVisitStatus(status);
        localStorage.setItem(STORAGE_KEYS.VISIT_STATUS, status);
    };

    const fetchOrders = useCallback(async () => {
        if (!currentUser?.teamId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [teamOrders, teamVisits] = await Promise.all([
                dataService.getOrdersByTeam(currentUser.teamId),
                dataService.getVisitsByTeam(currentUser.teamId)
            ]);
            setOrders(teamOrders);
            setVisits(teamVisits);
        } catch (error) {
            console.error('Error fetching dashboard orders:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.teamId]);

     useEffect(() => {
         fetchOrders();
 
         const handleRefresh = () => fetchOrders();
         window.addEventListener('refresh_dashboard', handleRefresh);
 
         // Realtime updates
         const orderSub = dataService.subscribeToOrders(() => {
             fetchOrders();
         });
         const visitSub = dataService.subscribeToVisits(() => {
             fetchOrders();
         });
 
         return () => {
             window.removeEventListener('refresh_dashboard', handleRefresh);
             orderSub.unsubscribe();
             visitSub.unsubscribe();
         };
     }, [fetchOrders]);

    // Grouping logic based on status IDs 3, 4 and 6
    const stats = useMemo(() => {
        return {
            autorizados: orders.filter(o => o.statusId === 3).length,
            agendadas: orders.filter(o => o.statusId === 4).length, // Using 4 for Agendadas
            suspensos: orders.filter(o => o.statusId === 6).length,
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const statusMap: Record<string, number> = {
            'autorizados': 3,
            'agendadas': 4,
            'suspensos': 6
        };
        const targetStatus = statusMap[selectedService];
        return orders.filter(o => o.statusId === targetStatus);
    }, [orders, selectedService]);

    // Visits Logic
    const visitsStats = useMemo(() => {
        return {
            rascunho: visits.filter(v => v.ovProcessingId === 1).length,
            reportadas: visits.filter(v => v.ovProcessingId === 2).length,
            revisadas: visits.filter(v => v.ovProcessingId === 3).length,
            reprovadas: visits.filter(v => v.ovProcessingId === 4).length,
        };
    }, [visits]);

    const filteredVisits = useMemo(() => {
        const statusMap: Record<string, number> = {
            'rascunho': 1,
            'reportadas': 2,
            'revisadas': 3,
            'reprovadas': 4
        };
        const target = statusMap[selectedVisitStatus];
        return visits.filter(v => v.ovProcessingId === target);
    }, [visits, selectedVisitStatus]);

    // Robust check for visit in progress (aligns with Header and Profile logic)
    const isInProgress = (currentUser?.isOvInProgress as any) === true ||
        (currentUser?.isOvInProgress as any) === 1 ||
        (currentUser?.isOvInProgress as any) === 'true' ||
        (currentUser as any)?.is_ov_in_progress === true ||
        (currentUser as any)?.is_ov_in_progress === 1 ||
        (currentUser as any)?.is_ov_in_progress === 'true';

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background-light dark:bg-background-dark safe-area-bottom">
            {/* Navigation Tabs */}
            <TabsBar tabs={['Serviços', 'Visitas']} activeTab={activeTab === 'services' ? 'Serviços' : 'Visitas'} onTabChange={(tab) => handleTabChange(tab === 'Serviços' ? 'services' : 'visits')} />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {activeTab === 'services' ? (
                    <div className="flex flex-col h-full">
                        <UserServicesPanel
                            autorizadosCount={stats.autorizados}
                            agendadasCount={stats.agendadas}
                            suspensosCount={stats.suspensos}
                            selectedService={selectedService}
                            onServiceSelect={handleServiceSelect}
                        />

                        {/* Orders List */}
                        <div className="flex-1 px-4 pb-20">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest opacity-60">
                                    {selectedService === 'autorizados' ? 'OS Autorizadas' :
                                        selectedService === 'agendadas' ? 'OS Agendadas' : 'OS Suspensas'}
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {filteredOrders.length} {filteredOrders.length === 1 ? 'Registro' : 'Registros'}
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loading overlay text="Sincronizando..." />
                                </div>
                            ) : filteredOrders.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {filteredOrders.map(order => (
                                        <OrderCardDetail
                                            key={order.id}
                                            order={order}
                                            currentUser={currentUser}
                                            onClick={() => onSelectOrder?.(order)}
                                            onSuccess={fetchOrders}
                                            onEdit={onEdit}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma OS encontrada nesta categoria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark pb-24">
                        {isInProgress && (
                            <div className="px-4 pt-4 pb-2">
                                <div className="bg-red-500 rounded-[16px] p-4 shadow-lg shadow-red-500/20 text-white relative overflow-hidden group cursor-pointer" onClick={() => onResumeVisit?.(currentUser?.ovIdInProgress?.toString() || '')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <span className="material-symbols-outlined text-2xl">play_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Em Andamento</p>
                                                <p className="font-bold text-lg leading-none">{currentUser?.ovIdInProgressMask || 'Visita Atual'}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <UserVisitsPanel
                            rascunhoCount={visitsStats.rascunho}
                            reportadasCount={visitsStats.reportadas}
                            revisadasCount={visitsStats.revisadas}
                            reprovadasCount={visitsStats.reprovadas}
                            selectedStatus={selectedVisitStatus}
                            onStatusSelect={handleVisitStatusSelect}
                        />

                        <div className="flex-1 px-4 overflow-y-auto no-scrollbar">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest opacity-60">
                                    {selectedVisitStatus.charAt(0).toUpperCase() + selectedVisitStatus.slice(1)} ({filteredVisits.length})
                                </h2>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loading overlay text="Sincronizando..." />
                                </div>
                            ) : filteredVisits.length > 0 ? (
                                <div className="flex flex-col gap-3 pb-4">
                                    {filteredVisits.map(visit => (
                                        <OrderVisitCardListItem
                                            key={visit.id}
                                            visit={visit}
                                            onClick={() => { }} // TODO: Add edit/view action
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma visita nesta categoria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
