import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

export type VisitTab = 'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat' | 'assistant' | 'evaluation';

export interface OrderVisitBottomNavProps {
    activeTab: VisitTab;
    onTabChange: (tab: VisitTab) => void;
    unreadChatCount?: number;
    assetsCount?: number;
    vehiclesCount?: number;
    servicesCount?: number;
    evaluationCount?: number;
    totalRequirements?: number;
    isAdminSuper?: boolean;
}

export const OrderVisitBottomNav: React.FC<OrderVisitBottomNavProps> = ({ 
    activeTab, 
    onTabChange, 
    unreadChatCount = 0, 
    assetsCount = 0,
    vehiclesCount = 0,
    servicesCount = 0,
    evaluationCount = 0,
    totalRequirements = 0,
    isAdminSuper = false
}) => {
    const { canView } = usePermissions();

    const allTabs: { id: VisitTab; label: string; icon: string; permission?: string; adminOnly?: boolean }[] = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'transport', label: 'Transporte', icon: 'local_shipping' },
        { id: 'assets', label: 'Ativos', icon: 'inventory_2' },
        { id: 'services', label: 'Serviços', icon: 'construction', permission: 'orders_visits_services' },
        { id: 'costs', label: 'Custos', icon: 'payments', permission: 'orders_visits_costs' },
        { id: 'evaluation', label: 'Avaliação', icon: 'rate_review', permission: 'orders_visits_evaluations' },
        { id: 'chat', label: 'Chat', icon: 'forum' },
        { id: 'assistant', label: 'Assistente', icon: 'support_agent', adminOnly: true },
    ];

    const tabs = allTabs.filter(tab => {
        if (tab.adminOnly && !isAdminSuper) return false;
        return !tab.permission || canView(tab.permission as any);
    });

    return (
        <div
            className="shrink-0 w-full bg-surface-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pt-2 px-1 flex flex-row items-stretch overflow-x-auto rounded-t-[24px] shadow-2xl z-30 no-scrollbar"
            style={{
                paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))'
            }}
        >
            {tabs.map((tab) => {
                const isChatTab = tab.id === 'chat';
                const showChatBadge = isChatTab && unreadChatCount > 0;
                const showEvaluationBadge = tab.id === 'evaluation' && evaluationCount > 0;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`min-w-[60px] flex-1 flex flex-col items-center justify-center p-2 gap-1 transition-all active:scale-90 ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <div className="relative">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === tab.id ? '"FILL" 1' : '' }}>
                                {tab.icon}
                            </span>
                            {showChatBadge && (
                                <span
                                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-yellow-400 text-slate-900 text-[9px] font-black rounded-full inline-flex items-center justify-center tabular-nums shadow-md shadow-yellow-400/40 animate-bounce"
                                    style={{ animationDuration: '1.4s', lineHeight: 1, paddingInline: '3px' }}
                                >
                                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                                </span>
                            )}
                            {tab.id === 'assets' && assetsCount > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-yellow-400 text-slate-900 text-[9px] font-black rounded-full inline-flex items-center justify-center tabular-nums shadow-md shadow-yellow-400/40"
                                    style={{ lineHeight: 1, paddingInline: '3px' }}
                                >
                                    {assetsCount > 99 ? '99+' : assetsCount}
                                </span>
                            )}
                            {tab.id === 'transport' && vehiclesCount > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-yellow-400 text-slate-900 text-[9px] font-black rounded-full inline-flex items-center justify-center tabular-nums shadow-md shadow-yellow-400/40"
                                    style={{ lineHeight: 1, paddingInline: '3px' }}
                                >
                                    {vehiclesCount > 99 ? '99+' : vehiclesCount}
                                </span>
                            )}
                            {tab.id === 'services' && servicesCount > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-yellow-400 text-slate-900 text-[9px] font-black rounded-full inline-flex items-center justify-center tabular-nums shadow-md shadow-yellow-400/40"
                                    style={{ lineHeight: 1, paddingInline: '3px' }}
                                >
                                    {servicesCount > 99 ? '99+' : servicesCount}
                                </span>
                            )}
                            {showEvaluationBadge && (
                                <span
                                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-yellow-400 text-slate-900 text-[9px] font-black rounded-full inline-flex items-center justify-center tabular-nums shadow-md shadow-yellow-400/40"
                                    style={{ lineHeight: 1, paddingInline: '3px' }}
                                >
                                    {evaluationCount > 99 ? '99+' : evaluationCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-full">
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
