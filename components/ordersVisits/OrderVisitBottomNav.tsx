
import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

export type VisitTab = 'home' | 'transport' | 'assets' | 'services' | 'costs';

interface OrderVisitBottomNavProps {
    activeTab: VisitTab;
    onTabChange: (tab: VisitTab) => void;
}

export const OrderVisitBottomNav: React.FC<OrderVisitBottomNavProps> = ({ activeTab, onTabChange }) => {
    const { canView } = usePermissions();

    const allTabs: { id: VisitTab; label: string; icon: string; permission?: string }[] = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'transport', label: 'Transporte', icon: 'local_shipping' },
        { id: 'assets', label: 'Ativos', icon: 'inventory_2' },
        { id: 'services', label: 'Serviços', icon: 'construction', permission: 'orders_visits_services' },
        { id: 'costs', label: 'Custos', icon: 'payments', permission: 'orders_visits_costs' },
    ];

    const tabs = allTabs.filter(tab => !tab.permission || canView(tab.permission as any));

    return (
        <div
            className="shrink-0 w-full bg-surface-light dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 pt-2 px-2 grid rounded-t-[24px] shadow-2xl z-30"
            style={{
                paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
            }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex flex-col items-center justify-center p-2 gap-1 transition-all active:scale-90 ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activeTab === tab.id ? '"FILL" 1' : '' }}>
                        {tab.icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-full">
                        {tab.label}
                    </span>
                    {activeTab === tab.id && (
                        <div className="w-1 h-1 bg-primary rounded-full mt-0.5 animate-pulse" />
                    )}
                </button>
            ))}
        </div>
    );
};
