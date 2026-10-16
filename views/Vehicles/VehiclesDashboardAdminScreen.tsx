import React, { useEffect, useState } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { Loading } from '../../components/ui/Loading';
import { isVehicleRentalEnabled } from '../../features';
import { CostsPeriod } from './CostsPeriod';
import { RentalContractList } from './RentalContractList';
import { VehicleList } from './VehicleList';

export type VehicleTab = 'costs' | 'rental-contracts' | 'vehicles';

interface TabItem {
    id: VehicleTab;
    label: string;
    icon: string;
    permission?: string;
}

const VEHICLE_TABS: { id: VehicleTab; label: string; icon: string; permission?: string }[] = [
    { id: 'costs', label: 'Custos Mensais', icon: 'payments', permission: 'dashboard_vehicles_costs_periods' },
    { id: 'rental-contracts', label: 'Contratos', icon: 'handshake', permission: 'dashboard_vehicles_rentals' },
    { id: 'vehicles', label: 'Veículos', icon: 'local_shipping', permission: 'dashboard_vehicles_crud' }
];

interface VehiclesDashboardAdminScreenProps {
    onNavigate?: (screen: string) => void;
    onSelectVisit?: (visit: { id: string; [key: string]: any }, initialTab?: 'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat') => void;
    initialTab?: VehicleTab;
}

export const VehiclesDashboardAdminScreen: React.FC<VehiclesDashboardAdminScreenProps> = ({ onNavigate, onSelectVisit, initialTab = 'costs' }) => {
    const { canView, loading: permissionsLoading } = usePermissions();
    const [currentTab, setCurrentTab] = useState<VehicleTab>(initialTab);

    useEffect(() => {
        if (initialTab) {
            setCurrentTab(initialTab);
        }
    }, [initialTab]);

    // Empresa selecionada compartilhada entre as abas (avatar/fluxo de filtro).
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Anti-flicker: cada aba é montada apenas na primeira visita e permanece
    // montada (escondida) ao alternar — evita recarregar dados a cada clique.
    const [visited, setVisited] = useState<Set<VehicleTab>>(() => new Set([initialTab]));

    useEffect(() => {
        setVisited(prev => (prev.has(currentTab) ? prev : new Set(prev).add(currentTab)));
    }, [currentTab]);

    if (!isVehicleRentalEnabled()) {
        return (
            <div className="p-8 text-center text-slate-400">
                Recurso de rateio de aluguel veicular desativado.
            </div>
        );
    }

    if (permissionsLoading) {
        return <div className="p-8"><Loading /></div>;
    }

    if (!canView('dashboard_vehicles')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para acessar o módulo de Gestão de Transportes."
            />
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark">
            {/* ── Barra de Navegação por Abas (Gestão Transportes) ── */}
            <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-4 pt-2 sticky top-0 z-20 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {VEHICLE_TABS.filter(tab => !tab.permission || canView(tab.permission)).map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCurrentTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all relative whitespace-nowrap cursor-pointer rounded-t-lg ${
                                    isActive
                                        ? 'text-primary bg-primary/5 dark:bg-primary/10'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-[18px] transition-transform ${isActive ? 'scale-110' : ''}`}
                                    style={{ fontVariationSettings: isActive ? '"FILL" 1' : '' }}
                                >
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Conteúdo da Aba 1: Custos Mensais ── */}
            {visited.has('costs') && (
                <div className={currentTab === 'costs' ? 'flex flex-col flex-1' : 'hidden'}>
                    <CostsPeriod
                        onNavigate={onNavigate}
                        onSelectVisit={onSelectVisit}
                        selectedCompanyId={selectedCompanyId}
                        onCompanySelect={setSelectedCompanyId}
                    />
                </div>
            )}

            {/* ── Conteúdo da Aba 2: Contratos Aluguéis ── */}
            {visited.has('rental-contracts') && (
                <div className={currentTab === 'rental-contracts' ? 'flex-1' : 'hidden'}>
                    <RentalContractList
                        onNavigate={(screen) => {
                            if (screen === 'rental-apportionment') setCurrentTab('costs');
                            else onNavigate?.(screen);
                        }}
                        selectedCompanyId={selectedCompanyId}
                        onCompanySelect={setSelectedCompanyId}
                    />
                </div>
            )}

            {/* ── Conteúdo da Aba 3: Veículos ── */}
            {visited.has('vehicles') && (
                <div className={currentTab === 'vehicles' ? 'flex-1' : 'hidden'}>
                    <VehicleList
                        onNavigate={(screen) => {
                            if (screen === 'rental-apportionment') setCurrentTab('costs');
                            else onNavigate?.(screen);
                        }}
                        selectedCompanyId={selectedCompanyId}
                        onCompanySelect={setSelectedCompanyId}
                    />
                </div>
            )}
        </div>
    );
};
