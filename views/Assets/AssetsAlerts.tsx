import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AssetAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { Loading } from '../../components/ui/Loading';
import { AssetsAlertsPDFButton } from '../../components/reports/AssetsAlertsPDFButton';
import { AssetAlertGroupCard } from './AssetAlertGroupCard';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Modal } from '../../components/ui/Modal';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

const STORAGE_KEY_ALERT_FILTER = 'assetsAlerts_alertFilter';
const STORAGE_KEY_ADVANCED_FILTERS = 'assetsAlerts_advancedFilters';

interface AssetsAlertsProps {
    onSelectAsset?: (assetId: string) => void;
    onSelectOrder?: (orderId: string) => void;
}

interface AlertFilters {
    clientName?: string[];
    systemParentName?: string[];
    unitDescription?: string[];
    tagName?: string[];
    tagSubName?: string[];
    orderTypeName?: string[];
    priorityName?: string[];
}

interface SelectionModal {
    isOpen: boolean;
    filterKey: keyof AlertFilters | 'situation';
    label: string;
    options: { value: string; label: string }[];
    currentValue: string[];
}

export const AssetsAlerts: React.FC<AssetsAlertsProps> = ({ onSelectAsset, onSelectOrder }) => {
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alertFilter, setAlertFilter] = useState<'abertos' | 'resolvidos'>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ALERT_FILTER);
        if (saved === 'abertos' || saved === 'resolvidos') return saved;
        return 'abertos';
    });
    const [advancedFilters, setAdvancedFilters] = useState<AlertFilters>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ADVANCED_FILTERS);
        if (saved) {
            try { return JSON.parse(saved); } catch { return {}; }
        }
        return {};
    });
    const [selectionModal, setSelectionModal] = useState<SelectionModal>({
        isOpen: false, filterKey: '' as keyof AlertFilters, label: '', options: [], currentValue: []
    });
    const [selectionSearch, setSelectionSearch] = useState('');
    const filtersScroll = useDraggableScroll();

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ALERT_FILTER, alertFilter);
    }, [alertFilter]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ADVANCED_FILTERS, JSON.stringify(advancedFilters));
    }, [advancedFilters]);

    const uniqueOptions = useMemo(() => {
        const extract = (field: keyof AssetAlert) => {
            const values = alerts.map(a => a[field]).filter(Boolean) as string[];
            return [...new Set(values)].sort().map(v => ({ value: v, label: v }));
        };
        return {
            clients: extract('clientName'),
            systems: extract('systemParentName'),
            units: extract('unitDescription'),
            sectors: extract('tagName'),
            positions: extract('tagSubName'),
            orderTypes: extract('orderTypeName'),
            priorities: extract('priorityName'),
        };
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (alertFilter === 'abertos' && alert.isDone) return false;
            if (alertFilter === 'resolvidos' && !alert.isDone) return false;

            const f = advancedFilters;
            if (f.clientName?.length && !f.clientName.includes(alert.clientName || '')) return false;
            if (f.systemParentName?.length && !f.systemParentName.includes(alert.systemParentName || '')) return false;
            if (f.unitDescription?.length && !f.unitDescription.includes(alert.unitDescription || '')) return false;
            if (f.tagName?.length && !f.tagName.includes(alert.tagName || '')) return false;
            if (f.tagSubName?.length && !f.tagSubName.includes(alert.tagSubName || '')) return false;
            if (f.orderTypeName?.length && !f.orderTypeName.includes(alert.orderTypeName || '')) return false;
            if (f.priorityName?.length && !f.priorityName.includes(alert.priorityName || '')) return false;

            return true;
        });
    }, [alerts, alertFilter, advancedFilters]);

    const alertsByAsset = useMemo(() => {
        const map = new Map<string, AssetAlert[]>();
        for (const alert of filteredAlerts) {
            const key = alert.assetId || alert.id;
            const existing = map.get(key);
            if (existing) existing.push(alert);
            else map.set(key, [alert]);
        }
        return Array.from(map.values());
    }, [filteredAlerts]);

    const totalActiveFilters = useMemo(() => {
        return Object.values(advancedFilters).reduce((count, val) => {
            if (Array.isArray(val)) return count + val.length;
            return count;
        }, 0);
    }, [advancedFilters]);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dataService.getAllAssetAlerts();
            setAlerts(data);
        } catch (err: any) {
            console.error('Failed to load asset alerts', err);
            setError('Erro ao carregar alertas de ativos.');
        } finally {
            setLoading(false);
        }
    }, []);

    const openSelectionModal = useCallback((key: keyof AlertFilters | 'situation', label: string, options: { value: string; label: string }[]) => {
        setSelectionModal({
            isOpen: true,
            filterKey: key,
            label,
            options,
            currentValue: key === 'situation' ? [alertFilter] : (advancedFilters[key as keyof AlertFilters] || [])
        });
        setSelectionSearch('');
    }, [alertFilter, advancedFilters]);

    const handleModalConfirm = useCallback((value: string[]) => {
        if (selectionModal.filterKey === 'situation') {
            const selectedValue = (value[0] as 'abertos' | 'resolvidos') || 'abertos';
            setAlertFilter(selectedValue);
        } else {
            setAdvancedFilters(prev => ({
                ...prev,
                [selectionModal.filterKey]: value.length > 0 ? value : undefined
            }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    }, [selectionModal.filterKey]);

    const handleClearAllFilters = useCallback(() => {
        setAdvancedFilters({});
        setAlertFilter('abertos');
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loading size="md" text="Carregando alertas..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
                <span className="material-icons-outlined text-red-400 text-4xl">error_outline</span>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{error}</p>
                <button
                    onClick={loadAlerts}
                    className="text-sm font-bold text-primary px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-[#0f172a]">

            {/* Barra de Filtros */}
            <div className="z-30 bg-white dark:bg-[#0B132B] border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <div className="flex items-center gap-2 p-3">
                    <div
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 cursor-grab active:cursor-grabbing touch-auto"
                        ref={filtersScroll.ref}
                        onMouseDown={filtersScroll.onMouseDown}
                        onTouchStart={filtersScroll.onTouchStart}
                        onClickCapture={filtersScroll.onClickCapture}
                    >
                        <FilterSelect
                            label="SITUAÇÃO"
                            value={alertFilter === 'abertos' ? 'Abertos' : 'Resolvidos'}
                            onClick={() => openSelectionModal('situation', 'SITUAÇÃO', [
                                { value: 'abertos', label: 'Abertos' },
                                { value: 'resolvidos', label: 'Resolvidos' }
                            ])}
                            onClear={() => setAlertFilter('abertos')}
                        />
                        <FilterSelect
                            label="CLIENTE"
                            value={advancedFilters.clientName || []}
                            onClick={() => openSelectionModal('clientName', 'CLIENTE', uniqueOptions.clients)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, clientName: [] }))}
                        />
                        <FilterSelect
                            label="SISTEMA"
                            value={advancedFilters.systemParentName || []}
                            onClick={() => openSelectionModal('systemParentName', 'SISTEMA', uniqueOptions.systems)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, systemParentName: [] }))}
                        />
                        <FilterSelect
                            label="UNIDADE"
                            value={advancedFilters.unitDescription || []}
                            onClick={() => openSelectionModal('unitDescription', 'UNIDADE', uniqueOptions.units)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, unitDescription: [] }))}
                        />
                        <FilterSelect
                            label="SETOR"
                            value={advancedFilters.tagName || []}
                            onClick={() => openSelectionModal('tagName', 'SETOR', uniqueOptions.sectors)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, tagName: [] }))}
                        />
                        <FilterSelect
                            label="POSIÇÃO"
                            value={advancedFilters.tagSubName || []}
                            onClick={() => openSelectionModal('tagSubName', 'POSIÇÃO', uniqueOptions.positions)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, tagSubName: [] }))}
                        />
                        <FilterSelect
                            label="TIPO OS"
                            value={advancedFilters.orderTypeName || []}
                            onClick={() => openSelectionModal('orderTypeName', 'TIPO OS', uniqueOptions.orderTypes)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, orderTypeName: [] }))}
                        />
                        <FilterSelect
                            label="PRIORIDADE"
                            value={advancedFilters.priorityName || []}
                            onClick={() => openSelectionModal('priorityName', 'PRIORIDADE', uniqueOptions.priorities)}
                            onClear={() => setAdvancedFilters(prev => ({ ...prev, priorityName: [] }))}
                        />
                    </div>
                </div>
            </div>

            {/* Ações abaixo dos filtros */}
            <div className="px-4 py-2 flex justify-end shrink-0">
                <AssetsAlertsPDFButton alerts={filteredAlerts} filterName={alertFilter} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
                {filteredAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <span className="material-icons-outlined text-slate-300 dark:text-slate-600 text-5xl">check_circle</span>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                            {alertFilter === 'abertos' ? 'Nenhum alerta em aberto' : alertFilter === 'resolvidos' ? 'Nenhum alerta resolvido' : 'Nenhum alerta ativo'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[240px]">
                            {alertFilter === 'abertos'
                                ? 'Todos os ativos estão sem alertas pendentes no momento.'
                                : alertFilter === 'resolvidos'
                                    ? 'Não há registros de alertas resolvidos.'
                                    : 'Não existem alertas registrados no momento.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {alertsByAsset.map((group, idx) => (
                            <AssetAlertGroupCard
                                key={group[0].assetId || idx}
                                alerts={group}
                                onClick={() => group[0].assetId && onSelectAsset?.(group[0].assetId)}
                                onSelectOrder={onSelectOrder}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Seleção */}
            <Modal
                isOpen={selectionModal.isOpen}
                onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))}
                title={`Filtrar por ${selectionModal.label}`}
                maxWidth="md"
            >
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder={`Pesquisar ${selectionModal.label}...`}
                            value={selectionSearch}
                            onChange={(e) => setSelectionSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
                        {selectionModal.options
                            .filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase()))
                            .map(opt => {
                                const isSelected = selectionModal.currentValue.includes(opt.value);
                                return (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => {
                                                if (selectionModal.filterKey === 'situation') {
                                                    setSelectionModal(prev => ({ ...prev, currentValue: [opt.value] }));
                                                } else {
                                                    const newVal = isSelected
                                                        ? selectionModal.currentValue.filter(v => v !== opt.value)
                                                        : [...selectionModal.currentValue, opt.value];
                                                    setSelectionModal(prev => ({ ...prev, currentValue: newVal }));
                                                }
                                            }}
                                        />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        {selectionModal.options.filter(opt => opt.label.toLowerCase().includes(selectionSearch.toLowerCase())).length === 0 && (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                                <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))}
                            className="flex-1 py-3 items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleModalConfirm(selectionModal.currentValue)}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-sm"
                        >
                            Confirmar ({selectionModal.currentValue.length})
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
