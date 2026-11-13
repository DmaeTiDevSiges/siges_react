import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDateInBrazil } from '../../utils/formatters';

import { User, Order, OrderVisit } from '../../types';
import { UserServicesPanel } from '../../components/ui/UserServicesPanel';
import { UserVisitsPanel } from '../../components/ui/UserVisitsPanel';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/core/supabase';
import { OrderVisitCardListItem } from '../../components/ordersVisits/OrderVisitCardListItem';
import { getProcessingStatus } from '../../components/ordersVisits/OrderVisitProcessingButton';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { Skeleton } from '../../components/ui/Skeleton';
import { TabsBar } from '../../components/ui/TabsBar';
import { AIContextualBar } from '../../components/ai/AIContextualBar';
import { formatCurrency } from '../../utils/formatters';
import { isVehicleRentalEnabled } from '../../features';
import { FuelExpenseScreen } from '../Vehicles/FuelExpenseScreen';
import type { VehicleMonthlyExpense } from '../../services/orders/vehicleRentalService';
import type { MyDayScheduleItem } from '../../services/orders/dailyScheduleService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useUiVersion } from '../../contexts/UiVersionContext';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SectionCard } from '../../components/ui/SectionCard';
import { HiddenValue } from '../../components/ui/HiddenValue';

type DashboardTab = 'services' | 'visits' | 'fuel';

const DashboardCardsSkeleton: React.FC<{ count: number }> = ({ count }) => (
    <div className="py-3" aria-hidden="true">
        <div className="overflow-hidden">
            <div className={`flex md:grid ${count === 3 ? 'md:grid-cols-4' : 'md:grid-cols-5'} gap-3 px-4 pb-2`}>
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-card-dark rounded-[16px] p-4 border-2 border-slate-200 dark:border-slate-700 shrink-0 w-[160px] md:w-full"
                    >
                        <Skeleton variant="text" width="70%" />
                        <div className="flex items-center justify-between mt-3">
                            <Skeleton variant="rectangular" width={48} height={48} />
                            <Skeleton variant="text" width={28} height={32} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const DashboardListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: count }).map((_, index) => (
            <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4"
            >
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="75%" className="mt-2" />
                <Skeleton variant="text" width="30%" className="mt-2" />
            </div>
        ))}
    </div>
);

interface DashboardScreenProps {
    currentUser: User | null;
    onSelectOrder?: (order: Order) => void;
    onResumeVisit?: (visitId: string) => void;
    onSelectVisit?: (visit: OrderVisit) => void;
    onEdit?: (order: Order) => void;
    initialTab?: DashboardTab;
    onTabChange?: (tab: DashboardTab) => void;
    onNavigate?: (screen: string) => void;
    onGamificationChange?: (ranking: { position: number; positionChange?: number } | null) => void;
    /** Visual novo (v2): conteúdo no topo da home (ex.: atalhos), rola junto com os cards. */
    topSlot?: React.ReactNode;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ currentUser, onSelectOrder, onResumeVisit, onSelectVisit, onEdit, initialTab = 'services', onTabChange, onNavigate, onGamificationChange, topSlot }) => {
    const { canCreate, canView, loading: permissionsLoading } = usePermissions();
    const { isV2 } = useUiVersion();
    /** Visual novo: 'home' = cards resumidos; 'list' = listas atuais (abas). */
    const [v2View, setV2View] = useState<'home' | 'list'>('home');
    const fuelTabAvailable = isVehicleRentalEnabled() && canView('dashboard_vehicles_costs_periods');

    // Persistence keys
    const STORAGE_KEYS = {
        TAB: 'dashboard_active_tab',
        SERVICE: 'dashboard_selected_service',
        VISIT_STATUS: 'dashboard_selected_visit_status'
    };

    const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.TAB);
        return (saved === 'services' || saved === 'visits' || saved === 'fuel') ? saved as DashboardTab : initialTab;
    });

    const [orders, setOrders] = useState<Order[]>([]);
    const [visits, setVisits] = useState<OrderVisit[]>([]);
    const [openChatVisits, setOpenChatVisits] = useState<OrderVisit[]>([]);
    /** Programação diária de hoje da equipe (sequência) + OSs programadas que não são do líder. */
    const [myDaySchedule, setMyDaySchedule] = useState<MyDayScheduleItem[]>([]);
    const [scheduledExtraOrders, setScheduledExtraOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fuelExpenses, setFuelExpenses] = useState<VehicleMonthlyExpense[]>([]);
    const [fuelLoading, setFuelLoading] = useState(false);
    const [showFuelForm, setShowFuelForm] = useState(false);

    const [selectedService, setSelectedService] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.SERVICE) || 'autorizados';
    });

    const [selectedVisitStatus, setSelectedVisitStatus] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.VISIT_STATUS) || 'rascunho';
    });

    const [teamGamification, setTeamGamification] = useState<{
        position: number;
        positionChange?: number;
    } | null>(null);

    // Sync internal state if initialTab changes (optional, but good for forcing)
    useEffect(() => {
        // Only override if explicitly provided as initialTab (non-default)
        if (initialTab !== 'services' && !localStorage.getItem(STORAGE_KEYS.TAB)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        onGamificationChange?.(teamGamification);
    }, [onGamificationChange, teamGamification]);

    const handleTabChange = (tab: DashboardTab) => {
        setActiveTab(tab);
        localStorage.setItem(STORAGE_KEYS.TAB, tab);
        onTabChange?.(tab);
    };

    useEffect(() => {
        if (!permissionsLoading && activeTab === 'fuel' && !fuelTabAvailable) {
            handleTabChange('visits');
        }
    }, [activeTab, permissionsLoading, fuelTabAvailable]);

    const handleServiceSelect = (service: string) => {
        setSelectedService(service);
        localStorage.setItem(STORAGE_KEYS.SERVICE, service);
    };

    const handleVisitStatusSelect = (status: string) => {
        setSelectedVisitStatus(status);
        localStorage.setItem(STORAGE_KEYS.VISIT_STATUS, status);
    };

    const loadDashboardData = useCallback(async (showLoading: boolean) => {
        if (!currentUser?.id) {
            setIsLoading(false);
            return;
        }

        if (showLoading) setIsLoading(true);
        try {
            const fuelPromise = fuelTabAvailable
                ? dataService.getFuelExpensesByUser(currentUser.id.toString())
                : Promise.resolve([]);

            const [teamOrders, teamVisits, userChatVisits, fuelData, daySchedule] = await Promise.all([
                dataService.getOrdersByLeader(currentUser.id.toString()),
                dataService.getVisitsByLeader(currentUser.id.toString()),
                dataService.getOpenChatVisitsForUser(currentUser.id.toString()),
                fuelPromise,
                dataService.getMyDaySchedule().catch((err) => {
                    console.error('Error fetching daily schedule:', err);
                    return [] as MyDayScheduleItem[];
                })
            ]);
            // OS programada para a equipe mas com outro líder: busca à parte.
            const leaderOrderIds = new Set(teamOrders.map(o => o.id.toString()));
            const missingIds = daySchedule.map(i => i.orderId).filter(id => !leaderOrderIds.has(id));
            const extraOrders = missingIds.length > 0
                ? (await Promise.all(missingIds.map(id => dataService.getOrderById(id).catch(() => null))))
                    .filter((o): o is Order => !!o)
                : [];
            setMyDaySchedule(daySchedule);
            setScheduledExtraOrders(extraOrders);
            setOrders(teamOrders);
            setVisits(teamVisits);
            setOpenChatVisits(userChatVisits);
            if (fuelTabAvailable && fuelData) {
                setFuelExpenses(fuelData);
            }

            // Fetch team gamification data (previous month) if team is evaluable
            if (currentUser.teamIsEvaluable && currentUser.departmentId && currentUser.teamId) {
                const now = new Date();
                const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
                const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

                const previousPeriod = new Date(prevYear, prevMonth - 2, 1);
                const previousPeriodYear = previousPeriod.getFullYear();
                const previousPeriodMonth = previousPeriod.getMonth() + 1;

                const [teamRanking, previousTeamRanking] = await Promise.all([
                    dataService.getTeamRanking(currentUser.departmentId, prevYear, prevMonth),
                    dataService.getTeamRanking(currentUser.departmentId, previousPeriodYear, previousPeriodMonth),
                ]);
                const myTeam = teamRanking.find(t => t.teamId === currentUser.teamId);
                const previousMyTeam = previousTeamRanking.find(t => t.teamId === currentUser.teamId);
                if (myTeam) {
                    setTeamGamification({
                        position: myTeam.position,
                        positionChange: previousMyTeam
                            ? previousMyTeam.position - myTeam.position
                            : undefined,
                    });
                } else {
                    setTeamGamification(null);
                }
            } else {
                setTeamGamification(null);
            }
        } catch (error) {
            console.error('Error fetching dashboard orders:', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [currentUser?.id, currentUser?.teamId, currentUser?.departmentId, currentUser?.teamIsEvaluable, fuelTabAvailable]);

    useEffect(() => {
        loadDashboardData(true);
    }, [loadDashboardData]);

    // Histórico de abastecimentos do usuário (aba "Abastecimentos")
    const loadFuelExpenses = useCallback(async (showLoading = false) => {
        if (!currentUser?.id) return;
        if (showLoading) setFuelLoading(true);
        try {
            const data = await dataService.getFuelExpensesByUser(currentUser.id.toString());
            setFuelExpenses(data);
        } catch (error) {
            console.error('Error fetching fuel expenses:', error);
        } finally {
            if (showLoading) setFuelLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (activeTab === 'fuel' && fuelTabAvailable) {
            loadFuelExpenses(fuelExpenses.length === 0);
        }
    }, [activeTab, fuelTabAvailable, loadFuelExpenses, fuelExpenses.length]);

    /** Fecha o form inline (cancelar/sucesso) e atualiza a lista da aba. */
    const closeFuelForm = useCallback(() => {
        setShowFuelForm(false);
        loadFuelExpenses(false);
    }, [loadFuelExpenses]);

    // Escuta evento global de refresh (ex: vindo de uma notificação em tempo real)
    useEffect(() => {
        const handleRefresh = () => loadDashboardData(false);
        window.addEventListener('refresh_dashboard', handleRefresh);

        // Realtime updates — refresh silencioso para não piscar a UI
        const orderSub = dataService.subscribeToOrders(() => {
            loadDashboardData(false);
        });
        const visitSub = dataService.subscribeToVisits(() => {
            loadDashboardData(false);
        });

        return () => {
            window.removeEventListener('refresh_dashboard', handleRefresh);
            // Supabase RealtimeChannel NÃO tem .unsubscribe() — usar removeChannel()
            if (orderSub) supabase.removeChannel(orderSub);
            if (visitSub) supabase.removeChannel(visitSub);
        };
    }, [loadDashboardData]);

    /** orderId → posição na sequência de hoje. */
    const scheduledPosition = useMemo(
        () => new Map(myDaySchedule.map(item => [item.orderId, item.position])),
        [myDaySchedule]
    );

    const scheduledOrders = useMemo(() => {
        const byId = new Map<string, Order>();
        [...orders, ...scheduledExtraOrders].forEach(o => byId.set(o.id.toString(), o));
        return myDaySchedule
            .map(item => byId.get(item.orderId))
            .filter((o): o is Order => !!o);
    }, [orders, scheduledExtraOrders, myDaySchedule]);

    // Grouping logic based on status IDs 3, 4 and 6
    const stats = useMemo(() => {
        return {
            programadas: scheduledOrders.length,
            autorizados: orders.filter(o => o.statusId === 3).length,
            agendadas: orders.filter(o => o.statusId === 4).length, // Using 4 for Agendadas per user request
            suspensos: orders.filter(o => o.statusId === 6).length,
        };
    }, [orders, scheduledOrders.length]);

    const filteredOrders = useMemo(() => {
        if (selectedService === 'programadas') return scheduledOrders;
        const statusMap: Record<string, number> = {
            'autorizados': 3,
            'agendadas': 4,
            'suspensos': 6
        };
        const targetStatus = statusMap[selectedService];
        return orders.filter(o => o.statusId === targetStatus);
    }, [orders, selectedService, scheduledOrders]);

    // Visits Logic
    const openChatList = useMemo(() => {
        const merged = new Map<string, OrderVisit>();
        visits
            .filter(v => v.chatStatus === 'open' && (v.hasOpenChat || Boolean(v.chatCreatedUserId)))
            .forEach(v => merged.set(v.id, v));
        openChatVisits
            .filter(v => v.chatStatus === 'open')
            .forEach(v => { if (!merged.has(v.id)) merged.set(v.id, v); });
        return Array.from(merged.values());
    }, [visits, openChatVisits]);

    const visitsStats = useMemo(() => {
        return {
            rascunho: visits.filter(v => v.ovProcessingId === 1).length,
            reportadas: visits.filter(v => v.ovProcessingId === 2).length,
            revisadas: visits.filter(v => v.ovProcessingId === 3).length,
            reprovadas: visits.filter(v => v.ovProcessingId === 4).length,
            chatPendentes: openChatList.length,
        };
    }, [visits, openChatList]);

    const filteredVisits = useMemo(() => {
        if (selectedVisitStatus === 'chats') {
            return openChatList;
        }
        const statusMap: Record<string, number> = {
            'rascunho': 1,
            'reportadas': 2,
            'revisadas': 3,
            'reprovadas': 4
        };
        const target = statusMap[selectedVisitStatus];
        return visits.filter(v => v.ovProcessingId === target);
    }, [visits, selectedVisitStatus, openChatList]);

    // Robust check for visit in progress (aligns with Header and Profile logic)
    const isInProgress = (currentUser?.isOvInProgress as any) === true ||
        (currentUser?.isOvInProgress as any) === 1 ||
        (currentUser?.isOvInProgress as any) === 'true' ||
        (currentUser as any)?.is_ov_in_progress === true ||
        (currentUser as any)?.is_ov_in_progress === 1 ||
        (currentUser as any)?.is_ov_in_progress === 'true';

    // ── Visual novo (v2) ──
    const openV2List = useCallback((tab: DashboardTab, filter?: string) => {
        if (tab === 'services' && filter) handleServiceSelect(filter);
        if (tab === 'visits' && filter) handleVisitStatusSelect(filter);
        handleTabChange(tab);
        setV2View('list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { fuelMonthTotal, fuelMonthCount } = useMemo(() => {
        const now = new Date();
        const month = fuelExpenses.filter(f => {
            if (!f.createdAt) return false;
            const d = new Date(f.createdAt);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        return {
            fuelMonthTotal: month.reduce((sum, f) => sum + (Number(f.value) || 0), 0),
            fuelMonthCount: month.length,
        };
    }, [fuelExpenses]);

    // Botão "voltar" do Android: da lista volta aos cards (sem isso, sai do app).
    useEffect(() => {
        if (!isV2 || v2View !== 'list' || !Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        CapApp.addListener('backButton', () => setV2View('home'))
            .then(h => { remove = () => h.remove(); })
            .catch(() => undefined);
        return () => remove?.();
    }, [isV2, v2View]);

    // Desligar a chave com a lista aberta não deve prender ninguém nela.
    useEffect(() => { if (!isV2) setV2View('home'); }, [isV2]);

    const panelView = (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background-light dark:bg-background-dark safe-area-bottom pt-4">
            {/* Navigation Tabs */}
            <TabsBar
                tabs={[
                    { id: 'services', label: 'Serviços' },
                    { id: 'visits', label: 'Visitas' },
                    ...(fuelTabAvailable ? [{ id: 'fuel', label: 'Abastecimentos' }] : [])
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => handleTabChange(tab as DashboardTab)}
                className="px-4"
            />

            {/* AI Suggestions - disabled */}
            <div className="px-4">
                {/* <AIContextualBar context={{ route: 'dashboard', entityType: 'dashboard' }} maxSuggestions={3} /> */}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === 'services' ? (
                    <div className="flex flex-col h-full">
                        {isLoading ? (
                            <DashboardCardsSkeleton count={3} />
                        ) : (
                            <UserServicesPanel
                                programadasCount={stats.programadas}
                                autorizadosCount={stats.autorizados}
                                agendadasCount={stats.agendadas}
                                suspensosCount={stats.suspensos}
                                selectedService={selectedService}
                                onServiceSelect={handleServiceSelect}
                            />
                        )}

                        {/* Orders List */}
                        <div className="flex-1 px-4 pt-4 overflow-y-auto no-scrollbar">
                            {isLoading ? (
                                <div className="mb-4 px-1" aria-hidden="true">
                                    <Skeleton variant="text" width="45%" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest opacity-60">
                                        {selectedService === 'programadas' ? 'OS Programadas hoje · ordem de execução' :
                                            selectedService === 'autorizados' ? 'OS Autorizados' :
                                            selectedService === 'agendadas' ? 'OS Agendados' : 'OS Suspensos'}
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {filteredOrders.length} {filteredOrders.length === 1 ? 'Registro' : 'Registros'}
                                    </span>
                                </div>
                            )}

                            {isLoading ? (
                                <div role="status" aria-label="Carregando serviços">
                                    <DashboardListSkeleton />
                                </div>
                            ) : filteredOrders.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {filteredOrders.map(order => {
                                        const position = scheduledPosition.get(order.id.toString());
                                        return (
                                            <div key={order.id} className="flex flex-col gap-1">
                                                {position != null && (
                                                    <span
                                                        className="self-start flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                                                        title="Programação diária de hoje — ordem de execução"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">event_available</span>
                                                        Hoje · {position}º
                                                    </span>
                                                )}
                                                <OrderCardDetail
                                                    order={order}
                                                    currentUser={currentUser}
                                                    onClick={() => onSelectOrder?.(order)}
                                                    onSuccess={() => loadDashboardData(false)}
                                                    onEdit={onEdit}
                                                />
                                            </div>
                                        );
                                    })}
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
                ) : activeTab === 'visits' ? (
                    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
                        {isLoading ? (
                            <DashboardCardsSkeleton count={5} />
                        ) : isInProgress && (
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

                        {!isLoading && (
                            <UserVisitsPanel
                                rascunhoCount={visitsStats.rascunho}
                                reportadasCount={visitsStats.reportadas}
                                revisadasCount={visitsStats.revisadas}
                                reprovadasCount={visitsStats.reprovadas}
                                chatPendentesCount={visitsStats.chatPendentes}
                                selectedStatus={selectedVisitStatus}
                                onStatusSelect={handleVisitStatusSelect}
                            />
                        )}

                        <div className="flex-1 px-4 pt-4 overflow-y-auto no-scrollbar">
                            {isLoading ? (
                                <div className="mb-4 px-1" aria-hidden="true">
                                    <Skeleton variant="text" width="45%" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest opacity-60">
                                        {selectedVisitStatus === 'chats' ? 'Chats Pendentes' :
                                            getProcessingStatus(
                                                selectedVisitStatus === 'rascunho' ? 1 :
                                                selectedVisitStatus === 'reportadas' ? 2 :
                                                selectedVisitStatus === 'revisadas' ? 3 :
                                                selectedVisitStatus === 'reprovadas' ? 4 : 1
                                            ).label} ({filteredVisits.length})
                                    </h2>
                                </div>
                            )}

                            {isLoading ? (
                                <div role="status" aria-label="Carregando visitas">
                                    <DashboardListSkeleton />
                                </div>
                            ) : filteredVisits.length > 0 ? (
                                <div className="flex flex-col gap-3 pb-4">
                                    {filteredVisits.map(visit => (
                                        <OrderVisitCardListItem
                                            key={visit.id}
                                            visit={visit}
                                            onClick={() => onSelectVisit?.(visit)}
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
                ) : activeTab === 'fuel' && fuelTabAvailable ? (
                    /* ── Aba Abastecimentos ── */
                    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
                        {showFuelForm ? (
                            /* Form de abastecimento aberto dentro da aba (sem sair do Meu Painel) */
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                                <FuelExpenseScreen
                                    onNavigate={closeFuelForm}
                                    onSaved={closeFuelForm}
                                    currentUser={currentUser}
                                    companyId={currentUser?.companyId}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 px-4 pt-4 overflow-y-auto no-scrollbar pb-20">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest opacity-60">
                                    Meus Abastecimentos
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {fuelExpenses.length} {fuelExpenses.length === 1 ? 'Registro' : 'Registros'}
                                </span>
                            </div>

                            {fuelLoading ? (
                                <div role="status" aria-label="Carregando abastecimentos">
                                    <DashboardListSkeleton />
                                </div>
                            ) : fuelExpenses.length > 0 ? (
                                <div className="flex flex-col gap-3 pb-4">
                                    {fuelExpenses.map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[20px] text-amber-500">
                                                        local_gas_station
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-bold text-slate-900 dark:text-white truncate font-mono">
                                                            {item.vehiclePlates || '---'}
                                                        </p>
                                                        <p className="font-black text-sm text-slate-900 dark:text-white shrink-0">
                                                            {formatCurrency(item.value)}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {item.vehicleDescription || item.description || 'Abastecimento'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                        <span className="flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">speed</span>
                                                            {item.odometer != null ? `${item.odometer.toLocaleString('pt-BR')} Km` : '---'}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">water_drop</span>
                                                            {item.fuelQuantity != null ? `${item.fuelQuantity.toLocaleString('pt-BR')} L` : '---'}
                                                        </span>
                                                        <span className="flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                                                            {item.createdAt ? formatDateInBrazil(item.createdAt, 'date', 'pt-BR') : '---'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                                        <span className="material-symbols-outlined text-4xl">local_gas_station</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhum abastecimento registrado.</p>
                                </div>
                            )}
                                </div>

                                {/* FAB Novo Abastecimento */}
                                {canView('dashboard_vehicles_costs_periods') && (
                                    <button
                                        onClick={() => setShowFuelForm(true)}
                                        className="absolute bottom-6 right-4 h-14 w-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-dark transition-colors z-10"
                                        title="Novo Abastecimento"
                                    >
                                        <span className="material-symbols-outlined text-2xl">add</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : null}
            </div>

        </div>
    );

    if (!isV2) return panelView;

    if (v2View === 'list') {
        return (
            <div className="flex flex-col h-full bg-bg">
                <div className="shrink-0 px-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setV2View('home')}
                        className="h-10 pl-1 pr-3 inline-flex items-center gap-0.5 rounded-full text-label text-brand cursor-pointer hover:bg-brand-soft transition-colors"
                    >
                        <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                        Início
                    </button>
                </div>
                <div className="flex-1 min-h-0">{panelView}</div>
            </div>
        );
    }

    return (
        <V2Home
            topSlot={topSlot}
            isLoading={isLoading}
            isInProgress={isInProgress}
            inProgressLabel={currentUser?.ovIdInProgressMask}
            onResumeVisit={() => onResumeVisit?.(currentUser?.ovIdInProgress?.toString() || '')}
            stats={stats}
            visitsStats={visitsStats}
            nextScheduled={scheduledOrders[0]}
            fuelTabAvailable={fuelTabAvailable}
            fuelMonthTotal={fuelMonthTotal}
            fuelMonthCount={fuelMonthCount}
            openList={openV2List}
        />
    );
};

/* ─────────────────────────── Visual novo (v2) ─────────────────────────── */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface V2HomeProps {
    topSlot?: React.ReactNode;
    isLoading: boolean;
    isInProgress: boolean;
    inProgressLabel?: string;
    onResumeVisit: () => void;
    stats: { programadas: number; autorizados: number; agendadas: number; suspensos: number };
    visitsStats: { rascunho: number; reportadas: number; revisadas: number; reprovadas: number; chatPendentes: number };
    nextScheduled?: Order;
    fuelTabAvailable: boolean;
    fuelMonthTotal: number;
    fuelMonthCount: number;
    openList: (tab: DashboardTab, filter?: string) => void;
}

const V2Home: React.FC<V2HomeProps> = ({
    topSlot, isLoading, isInProgress, inProgressLabel, onResumeVisit, stats, visitsStats,
    nextScheduled, fuelTabAvailable, fuelMonthTotal, fuelMonthCount, openList,
}) => {
    const nextLabel = nextScheduled
        ? [nextScheduled.orderMask, nextScheduled.unitName || nextScheduled.unitDescription].filter(Boolean).join(' · ')
        : null;

    return (
        <div className="h-full overflow-y-auto no-scrollbar bg-bg safe-area-bottom">
            {topSlot}

            <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-card bg-surface p-5" aria-hidden="true">
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="text" width="25%" height={28} className="mt-3" />
                            <Skeleton variant="text" width="60%" className="mt-2" />
                        </div>
                    ))
                ) : (
                    <>
                        {isInProgress && (
                            <SectionCard
                                highlight
                                icon="play_circle"
                                title="Visita em andamento"
                                value={inProgressLabel || 'Visita atual'}
                                action={{ label: 'Retomar visita', onClick: onResumeVisit }}
                                onClick={onResumeVisit}
                            />
                        )}

                        <SectionCard
                            icon="event_available"
                            title="Hoje"
                            value={stats.programadas > 0 ? plural(stats.programadas, 'OS programada', 'OS programadas') : 'Nada programado'}
                            description={nextLabel ? `Próxima: ${nextLabel}` : 'Sem programação diária para sua equipe hoje'}
                            onClick={() => openList('services', 'programadas')}
                        />

                        <SectionCard
                            icon="assignment"
                            title="Serviços"
                            value={plural(stats.autorizados, 'autorizado', 'autorizados')}
                            description={`${plural(stats.agendadas, 'agendado', 'agendados')} · ${plural(stats.suspensos, 'suspenso', 'suspensos')}`}
                            onClick={() => openList('services', 'autorizados')}
                        />

                        <SectionCard
                            icon="engineering"
                            title="Visitas"
                            value={plural(visitsStats.rascunho, 'em rascunho', 'em rascunho')}
                            description={`${plural(visitsStats.reportadas, 'reportada', 'reportadas')} · ${plural(visitsStats.reprovadas, 'reprovada', 'reprovadas')}`}
                            onClick={() => openList('visits', 'rascunho')}
                        >
                            {visitsStats.chatPendentes > 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openList('visits', 'chats'); }}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-warning-soft text-warning text-label cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chat</span>
                                    {plural(visitsStats.chatPendentes, 'chat pendente', 'chats pendentes')}
                                </button>
                            )}
                        </SectionCard>

                        {fuelTabAvailable && (
                            <SectionCard
                                icon="local_gas_station"
                                title="Abastecimentos no mês"
                                value={<HiddenValue>{formatCurrency(fuelMonthTotal)}</HiddenValue>}
                                description={plural(fuelMonthCount, 'registro', 'registros')}
                                onClick={() => openList('fuel')}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
