import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import {
    vehicleRentalService,
    type VehicleMonthlyExpense,
    type VehicleRentalDetailRow,
    type VehicleRentalSummaryRow,
    type VehicleUtilizationRow
} from '../../services/orders/vehicleRentalService';
import type { VehicleCompanyInfo, VehicleCostType } from '../../types';
import { dataService } from '../../services/dataService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { formatCurrency } from '../../utils/formatters';
import { isVehicleRentalEnabled } from '../../features';
import { toast } from 'sonner';

interface RentalApportionmentScreenProps {
    onNavigate?: (screen: string) => void;
    onSelectVisit?: (visit: { id: string; [key: string]: any }, initialTab?: 'home' | 'transport' | 'assets' | 'services' | 'costs' | 'chat') => void;
}

const STATUS_LABEL: Record<string, string> = {
    OPEN: 'Em aberto',
    CALCULATED: 'Calculada',
    ALLOCATED: 'Alocada',
    CLOSED: 'Fechada'
};

const STATUS_STYLE: Record<string, string> = {
    OPEN: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    CALCULATED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    ALLOCATED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    CLOSED: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
};

const addMonths = (month: string, delta: number): string => {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 + delta, 1));
    return date.toISOString().slice(0, 7);
};

const monthLabel = (month: string): string => {
    const [y, m] = month.split('-').map(Number);
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${names[m - 1]}/${y}`;
};

const shortDate = (ts?: string | null): string => {
    if (!ts) return '—';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const RentalApportionmentScreen: React.FC<RentalApportionmentScreenProps> = ({ onNavigate, onSelectVisit }) => {
    const { canView, loading: permissionsLoading } = usePermissions();

    // Company de cada veículo (vehicles.company_id) — avatar dos cards.
    // Nunca usar a company do usuário logado: veículos podem ter outra.
    const [vehicleCompanies, setVehicleCompanies] = useState<Record<string, VehicleCompanyInfo>>({});

    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [search, setSearch] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const companiesScroll = useDraggableScroll();
    const [rows, setRows] = useState<VehicleRentalSummaryRow[]>([]);
    const [vehicleGaps, setVehicleGaps] = useState<Record<string, number>>({});
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const hasLoadedRef = useRef(false);
    const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
    const [detailVehicle, setDetailVehicle] = useState<VehicleRentalSummaryRow | null>(null);
    const [detailRows, setDetailRows] = useState<VehicleRentalDetailRow[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Despesas variáveis do mês (lançamento manual por veículo/competência)
    const [expenseVehicleId, setExpenseVehicleId] = useState<string | null>(null);
    const [expenseVehicle, setExpenseVehicle] = useState<VehicleRentalSummaryRow | null>(null);
    const [expenses, setExpenses] = useState<VehicleMonthlyExpense[]>([]);
    const [costTypes, setCostTypes] = useState<VehicleCostType[]>([]);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseBusy, setExpenseBusy] = useState(false);
    const [expenseForm, setExpenseForm] = useState<{
        id?: string;
        costTypeId: string;
        value: string;
        description: string;
    } | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<VehicleMonthlyExpense | null>(null);

    // Utilização (colapso por veículo no card)
    const [utilizationVehicleId, setUtilizationVehicleId] = useState<string | null>(null);
    const [utilizationRows, setUtilizationRows] = useState<VehicleUtilizationRow[]>([]);
    const [utilizationLoading, setUtilizationLoading] = useState(false);

    const referenceMonth = `${month}-01`;

    const loadSummary = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setInitialLoading(true);
        } else {
            setIsRefreshing(true);
        }
        try {
            const data = await dataService.getRentalSummary(referenceMonth);
            // Gaps de odômetro entre visitas (Km não apontado)
            try {
                const gaps = await vehicleRentalService.getMonthOdometerGaps(referenceMonth);
                setVehicleGaps(gaps);
            } catch (gapErr) {
                console.error('Error loading odometer gaps:', gapErr);
            }
            // Avatar: company do veículo (vehicles.company_id), por card
            try {
                const infos = await dataService.getVehiclesCompaniesInfo(data.map(r => String(r.vehicleId)));
                const map: Record<string, VehicleCompanyInfo> = {};
                infos.forEach(info => { map[info.vehicleId] = info; });
                setVehicleCompanies(map);
            } catch (err) {
                console.error('Error loading vehicle companies', err);
            }
            setRows(data);
        } catch (error) {
            console.error('Error loading rental summary', error);
            toast.error('Erro ao carregar a apuração');
        } finally {
            setInitialLoading(false);
            setIsRefreshing(false);
        }
    }, [referenceMonth]);

    useEffect(() => {
        setUtilizationVehicleId(null);
        setUtilizationRows([]);
        setExpenseVehicleId(null);
        setExpenseVehicle(null);
        setExpenses([]);
        setExpenseForm(null);
        setSelectedCompanyId(null);
        const isFirst = !hasLoadedRef.current;
        hasLoadedRef.current = true;
        loadSummary(isFirst);
    }, [loadSummary]);

    const runAction = async (
        vehicleId: string,
        action: () => Promise<unknown>,
        successMessage: string
    ) => {
        setBusyVehicleId(vehicleId);
        try {
            await action();
            toast.success(successMessage);
            await loadSummary();
        } catch (error: any) {
            console.error('Rental apportionment error', error);
            toast.error(error?.message || 'Erro na apuração');
        } finally {
            setBusyVehicleId(null);
        }
    };

    // SIMULAR → detalhe visita a visita (sem gravar nada)
    const handleSimulate = async (row: VehicleRentalSummaryRow) => {
        setDetailVehicle(row);
        setDetailRows([]);
        setDetailLoading(true);
        try {
            const data = await dataService.getRentalDetail(row.vehicleId, referenceMonth);
            setDetailRows(data);
        } catch (error) {
            console.error('Error loading rental detail', error);
            toast.error('Erro ao montar a simulação');
            setDetailVehicle(null);
        } finally {
            setDetailLoading(false);
        }
    };

    // UTILIZAÇÃO → colapsa tabela visita a visita (odômetro + datas + custo)
    const handleToggleUtilization = async (row: VehicleRentalSummaryRow) => {
        const vehicleId = String(row.vehicleId);
        if (utilizationVehicleId === vehicleId) {
            setUtilizationVehicleId(null);
            setUtilizationRows([]);
            return;
        }
        setUtilizationVehicleId(vehicleId);
        setUtilizationRows([]);
        setUtilizationLoading(true);
        try {
            const data = await dataService.getRentalUtilization(vehicleId, referenceMonth);
            const sorted = [...data].sort((a, b) => {
                const timeA = a.visitStartAt ? new Date(a.visitStartAt).getTime() : 0;
                const timeB = b.visitStartAt ? new Date(b.visitStartAt).getTime() : 0;
                if (timeA !== timeB) return timeA - timeB;
                if (a.kmInitial !== b.kmInitial) return a.kmInitial - b.kmInitial;
                return Number(a.ovId) - Number(b.ovId);
            });
            setUtilizationRows(sorted);
        } catch (error) {
            console.error('Error loading utilization', error);
            toast.error('Erro ao carregar a utilização');
            setUtilizationVehicleId(null);
        } finally {
            setUtilizationLoading(false);
        }
    };

    // Navega para a tela de execução da visita abrindo diretamente na aba de Transporte
    const handleOpenVisitTransport = async (visitId: string) => {
        if (!visitId) return;
        if (onSelectVisit) {
            try {
                const fullVisit = await dataService.getOrderVisitById(visitId);
                onSelectVisit(fullVisit || ({ id: visitId } as any), 'transport');
            } catch (err) {
                console.warn('Erro ao buscar visita completa para navegação, repassando ID:', err);
                onSelectVisit({ id: visitId } as any, 'transport');
            }
        } else if (onNavigate) {
            onNavigate('order-visit-execute');
        }
    };

    // CONFIRMAR APROPRIAÇÃO: recalcula a competência e aloca os rateios
    const handleAllocate = (row: VehicleRentalSummaryRow) =>
        runAction(
            row.vehicleId,
            async () => {
                await dataService.calculateRentalPeriod(row.vehicleId, referenceMonth);
                return dataService.allocateRentalPeriod(row.vehicleId, referenceMonth);
            },
            `Rateio confirmado para ${row.vehicleDescription || row.vehicleId}`
        );

    const handleClose = (row: VehicleRentalSummaryRow) =>
        runAction(
            row.vehicleId,
            () => dataService.closeRentalPeriod(row.vehicleId, referenceMonth),
            'Competência fechada (imutável).'
        );

    const handleReopen = (row: VehicleRentalSummaryRow) =>
        runAction(
            row.vehicleId,
            () => dataService.reopenRentalPeriod(row.vehicleId, referenceMonth),
            'Competência reaberta.'
        );

    const handleRevert = (row: VehicleRentalSummaryRow) =>
        runAction(
            row.vehicleId,
            () => dataService.revertRentalPeriod(row.vehicleId, referenceMonth),
            'Rateio estornado.'
        );

    // ── DESPESAS VARIÁVEIS DO MÊS (combustível, pedágio, etc.) ──
    const reloadExpenses = useCallback(async () => {
        if (!expenseVehicle) return;
        try {
            const data = await dataService.getRentalExpenses(expenseVehicle.vehicleId, referenceMonth);
            setExpenses(data);
        } catch (error) {
            console.error('Error reloading expenses', error);
        }
    }, [expenseVehicle, referenceMonth]);

    const handleToggleExpenses = async (row: VehicleRentalSummaryRow) => {
        const vehicleId = String(row.vehicleId);
        if (expenseVehicleId === vehicleId) {
            setExpenseVehicleId(null);
            setExpenseVehicle(null);
            setExpenses([]);
            setExpenseForm(null);
            return;
        }
        setExpenseVehicleId(vehicleId);
        setExpenseVehicle(row);
        setExpenseForm(null);
        setExpenses([]);
        setExpenseLoading(true);
        try {
            const [list, types] = await Promise.all([
                dataService.getRentalExpenses(vehicleId, referenceMonth),
                dataService.getVehicleCostTypes()
            ]);
            setExpenses(list);
            setCostTypes(types.filter(t => t.isAvailable !== false));
        } catch (error) {
            console.error('Error loading expenses', error);
            toast.error('Erro ao carregar as despesas da competência');
            setExpenseVehicleId(null);
            setExpenseVehicle(null);
        } finally {
            setExpenseLoading(false);
        }
    };

    const handleSaveExpense = async () => {
        if (!expenseVehicle || !expenseForm) return;

        const raw = String(expenseForm.value || '').trim();
        const normalized = raw.includes(',')
            ? raw.replace(/\./g, '').replace(',', '.')
            : raw;
        const value = Number(normalized);

        if (!expenseForm.costTypeId) {
            toast.error('Selecione o tipo de despesa');
            return;
        }
        if (!Number.isFinite(value) || value <= 0) {
            toast.error('Informe um valor maior que zero');
            return;
        }

        setExpenseBusy(true);
        try {
            await dataService.saveRentalExpense({
                id: expenseForm.id,
                vehicleId: expenseVehicle.vehicleId,
                referenceMonth,
                costTypeId: expenseForm.costTypeId,
                value,
                description: expenseForm.description || null
            });
            toast.success(expenseForm.id ? 'Despesa atualizada.' : 'Despesa lançada.');
            setExpenseForm(null);

            // Recalcula o período para propagar o novo custo total/km às visitas
            const status = expenseVehicle.periodStatus || 'OPEN';
            if (status === 'OPEN' || status === 'CALCULATED') {
                try {
                    await dataService.calculateRentalPeriod(expenseVehicle.vehicleId, referenceMonth);
                } catch (recalcErr) {
                    console.warn('Recálculo silencioso falhou:', recalcErr);
                }
            }

            await Promise.all([reloadExpenses(), loadSummary()]);
        } catch (error: any) {
            console.error('Error saving expense', error);
            toast.error(error?.message || 'Erro ao salvar a despesa');
        } finally {
            setExpenseBusy(false);
        }
    };

    const handleDeleteExpense = async () => {
        if (!expenseToDelete || !expenseVehicle) return;
        setExpenseBusy(true);
        try {
            await dataService.deleteRentalExpense(expenseToDelete.id);
            toast.success('Despesa excluída.');
            setExpenseToDelete(null);

            // Recalcula o período para propagar o novo custo total/km às visitas
            const status = expenseVehicle.periodStatus || 'OPEN';
            if (status === 'OPEN' || status === 'CALCULATED') {
                try {
                    await dataService.calculateRentalPeriod(expenseVehicle.vehicleId, referenceMonth);
                } catch (recalcErr) {
                    console.warn('Recálculo silencioso falhou:', recalcErr);
                }
            }

            await Promise.all([reloadExpenses(), loadSummary()]);
        } catch (error: any) {
            console.error('Error deleting expense', error);
            toast.error(error?.message || 'Erro ao excluir a despesa');
            setExpenseBusy(false);
            return;
        }
        setExpenseBusy(false);
    };

    // Somente ALLOCATED e CLOSED bloqueiam edição; OPEN e CALCULATED permitem lançamento livre
    const expensesLocked =
        !!expenseVehicle &&
        (expenseVehicle.periodStatus === 'ALLOCATED' || expenseVehicle.periodStatus === 'CLOSED');

    const expenseTotal = expenses.reduce((sum, item) => sum + item.value, 0);

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

    if (!canView('transport_rental_apportionment')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para acessar a apuração de aluguel veicular."
            />
        );
    }

    const companiesWithCount = useMemo(() => {
        const map = new Map<string, { id: string; name: string; logoUrl?: string; count: number }>();
        let withoutCompanyCount = 0;

        for (const row of rows) {
            const vc = vehicleCompanies[String(row.vehicleId)];
            if (vc && vc.companyId) {
                const compId = String(vc.companyId);
                const existing = map.get(compId);
                if (existing) {
                    existing.count += 1;
                } else {
                    map.set(compId, {
                        id: compId,
                        name: vc.companyName || 'Empresa',
                        logoUrl: vc.companyLogoUrl,
                        count: 1
                    });
                }
            } else {
                withoutCompanyCount += 1;
            }
        }

        const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        if (withoutCompanyCount > 0) {
            list.push({
                id: 'none',
                name: 'Sem Empresa',
                logoUrl: undefined,
                count: withoutCompanyCount
            });
        }
        return list;
    }, [rows, vehicleCompanies]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const term = search.trim().toLowerCase();
            if (term) {
                const desc = (row.vehicleDescription || '').toLowerCase();
                const plates = (row.vehiclePlates || '').toLowerCase();
                if (!desc.includes(term) && !plates.includes(term)) {
                    return false;
                }
            }
            if (selectedCompanyId) {
                const vc = vehicleCompanies[String(row.vehicleId)];
                if (selectedCompanyId === 'none') {
                    if (vc && vc.companyId) return false;
                } else {
                    if (!vc || String(vc.companyId) !== selectedCompanyId) return false;
                }
            }
            return true;
        });
    }, [rows, search, selectedCompanyId, vehicleCompanies]);

    const totals = filteredRows.reduce(
        (acc, row) => ({
            contractValue: acc.contractValue + row.contractValue,
            variableValue: acc.variableValue + row.variableValue,
            operationalValue: acc.operationalValue + (row.operationalValue ?? 0),
            totalKm: acc.totalKm + row.totalKm,
            gapKm: acc.gapKm + (vehicleGaps[String(row.vehicleId)] || 0),
            allocatedValue: acc.allocatedValue + row.allocatedValue,
            idleValue: acc.idleValue + row.idleValue
        }),
        { contractValue: 0, variableValue: 0, operationalValue: 0, totalKm: 0, gapKm: 0, allocatedValue: 0, idleValue: 0 }
    );

    return (
        <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark">
            {/* ── Cabeçalho: empresas no topo + competência + busca ── */}
            <div className="px-4 py-3 sticky top-0 z-10 bg-background-light dark:bg-background-dark border-b border-slate-100 dark:border-slate-800 space-y-3">
                {/* Título CUSTOS MENSAIS + Linha horizontal rolável de avatares das empresas */}
                <div className="pb-1 border-b border-slate-100 dark:border-slate-800">
                    <div className="px-1 pt-0.5 pb-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[17px] text-primary">payments</span>
                            CUSTOS MENSAIS
                        </h2>
                    </div>

                    {companiesWithCount.length > 0 && (
                        <div
                            ref={companiesScroll.ref}
                            onMouseDown={companiesScroll.onMouseDown}
                            onTouchStart={companiesScroll.onTouchStart}
                            onClickCapture={companiesScroll.onClickCapture}
                            className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1.5 pb-2.5 px-3 cursor-grab active:cursor-grabbing touch-auto select-none"
                        >
                            {/* Todas as empresas */}
                            <button
                                type="button"
                                onClick={() => setSelectedCompanyId(null)}
                                className={`flex flex-col items-center shrink-0 group focus:outline-none transition-all p-1 ${
                                    selectedCompanyId === null ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                                }`}
                                title={`Todas as empresas (${rows.length} ${rows.length === 1 ? 'veículo' : 'veículos'})`}
                            >
                                <div
                                    className={`relative w-[55px] h-[55px] rounded-[14px] flex items-center justify-center transition-all ${
                                        selectedCompanyId === null
                                            ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[26px]">
                                        domain
                                    </span>
                                    <span className="absolute -top-1.5 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-orange-500 text-black text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                                        {rows.length}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold text-center leading-tight truncate max-w-[62px] mt-1.5 transition-colors ${
                                        selectedCompanyId === null
                                            ? 'text-primary dark:text-primary font-black'
                                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                    }`}
                                >
                                    Todas
                                </span>
                            </button>

                            {/* Avatares das empresas */}
                            {companiesWithCount.map((comp) => {
                                const isSelected = selectedCompanyId === comp.id;
                                return (
                                    <button
                                        key={comp.id}
                                        type="button"
                                        onClick={() => setSelectedCompanyId(isSelected ? null : comp.id)}
                                        className={`flex flex-col items-center shrink-0 group focus:outline-none transition-all p-1 ${
                                            isSelected
                                                ? 'opacity-100'
                                                : selectedCompanyId !== null
                                                ? 'opacity-50 hover:opacity-90'
                                                : 'opacity-85 hover:opacity-100'
                                        }`}
                                        title={`${comp.name} (${comp.count} ${comp.count === 1 ? 'veículo' : 'veículos'})`}
                                    >
                                        <div
                                            className={`relative rounded-[14px] transition-all ${
                                                isSelected
                                                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                                                    : 'hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600'
                                            }`}
                                        >
                                            {comp.id === 'none' ? (
                                                <div className="w-[55px] h-[55px] rounded-[14px] bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                    <span className="material-symbols-outlined text-[26px]">help_outline</span>
                                                </div>
                                            ) : (
                                                <CompanyAvatar
                                                    src={comp.logoUrl}
                                                    name={comp.name}
                                                    className="w-[55px]! h-[55px]! rounded-[14px]! shadow-xs"
                                                />
                                            )}
                                            <span className="absolute -top-1.5 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-orange-500 text-black text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                                                {comp.count}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[10px] font-bold text-center leading-tight truncate max-w-[62px] mt-1.5 transition-colors ${
                                                isSelected
                                                    ? 'text-primary dark:text-primary font-black'
                                                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                            }`}
                                        >
                                            {comp.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMonth(addMonths(month, -1))}
                        disabled={isRefreshing}
                        className="flex items-center justify-center h-11 w-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                        title="Mês anterior"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex-1 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Competência
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                            <p className="font-black text-slate-900 dark:text-white">
                                {monthLabel(month)}
                            </p>
                            {isRefreshing && (
                                <span className="material-symbols-outlined text-[15px] text-primary animate-spin">
                                    progress_activity
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setMonth(addMonths(month, 1))}
                        disabled={isRefreshing}
                        className="flex items-center justify-center h-11 w-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                        title="Próximo mês"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('rental-contracts')}
                        className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
                        title="Contratos de Aluguel"
                    >
                        <span className="material-symbols-outlined">handshake</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('rate-contracts')}
                        className="flex items-center justify-center h-11 w-11 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                        title="Contratos de R$/km"
                    >
                        <span className="material-symbols-outlined">speed</span>
                    </button>
                    <button
                        onClick={() => onNavigate?.('vehicles')}
                        className="flex items-center justify-center h-11 w-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        title="Veículos"
                    >
                        <span className="material-symbols-outlined">local_shipping</span>
                    </button>
                </div>

                <div>
                    <SearchInput
                        placeholder="Buscar por veículo ou placa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                    />
                </div>
            </div>

            {initialLoading ? (
                <div className="p-8"><Loading /></div>
            ) : rows.length === 0 ? (
                <div className={`text-center py-20 px-6 text-slate-400 transition-opacity duration-150 ${isRefreshing ? 'opacity-60' : ''}`}>
                    <span className="material-symbols-outlined text-[40px] mb-3 block">local_shipping</span>
                    <p className="font-bold mb-1">Nenhum veículo para apurar nesta competência</p>
                    <p className="text-sm">
                        Cadastre um contrato de aluguel, um contrato de R$/km ou lance
                        despesas para que o veículo apareça aqui.
                    </p>
                </div>
            ) : filteredRows.length === 0 ? (
                <div className={`text-center py-20 px-6 text-slate-400 transition-opacity duration-150 ${isRefreshing ? 'opacity-60' : ''}`}>
                    <span className="material-symbols-outlined text-[40px] mb-3 block">search_off</span>
                    <p className="font-bold mb-1">Nenhum veículo encontrado</p>
                    <p className="text-sm">
                        {selectedCompanyId
                            ? 'Nenhum veículo corresponde aos filtros selecionados para esta empresa.'
                            : `Nenhum veículo corresponde à busca "${search}".`}
                    </p>
                    <button
                        onClick={() => { setSearch(''); setSelectedCompanyId(null); }}
                        className="mt-3 text-xs font-semibold text-primary hover:underline"
                    >
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <div className={`px-4 pb-32 space-y-4 transition-opacity duration-150 ${isRefreshing ? 'opacity-60 pointer-events-none' : ''}`}>
                    {filteredRows.map(row => {
                        const status = row.periodStatus || 'OPEN';
                        const busy = busyVehicleId === row.vehicleId;
                        const hasContract = !!row.contractId;
                        // Rateio permitido sem contrato de aluguel quando há
                        // despesas no mês (só o componente VARIABLE é apurado).
                        const hasExpenses = row.variableValue > 0;
                        const canApportion = hasContract || hasExpenses;
                        const statusKey = STATUS_STYLE[status] ? status : 'OPEN';
                        const vc = vehicleCompanies[String(row.vehicleId)];

                        return (
                            <div
                                key={row.vehicleId}
                                className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                            >
                                {/* Veículo + status */}
                                <div className="p-4 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px] text-emerald-500">
                                            local_shipping
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                {row.vehicleDescription || `Veículo #${row.vehicleId}`}
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_STYLE[statusKey]}`}>
                                                {STATUS_LABEL[status] || status}
                                            </span>
                                            {row.hasConflict && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                                    Contrato conflitante
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            {row.vehiclePlates || '---'}
                                        </p>
                                    </div>
                                    {/* Avatar da company DO VEÍCULO — alinhado à direita */}
                                    {vc && (
                                        <CompanyAvatar
                                            src={vc.companyLogoUrl}
                                            name={vc.companyName || 'Siges'}
                                            size="sm"
                                            className="shrink-0 ml-auto shadow-sm"
                                        />
                                    )}
                                </div>

                                {/* Números */}
                                {/* Números: 3 × 3 */}
                                <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aluguel</p>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">
                                            {formatCurrency(row.contractValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Despesas</p>
                                        <p className="font-black text-amber-600 dark:text-amber-400 text-sm">
                                            {formatCurrency(row.variableValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Km Apropriado</p>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">
                                            {row.totalKm.toLocaleString('pt-BR')} Km
                                        </p>
                                        {(vehicleGaps[String(row.vehicleId)] || 0) > 0 && (
                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5" title="Quilômetros entre visitas sem OS registrada (buraco de odômetro)">
                                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                                +{vehicleGaps[String(row.vehicleId)].toLocaleString('pt-BR')} Km não apontado
                                            </p>
                                        )}
                                    </div>

                                    {/* Componente R$/km (linhas de Km do mês) */}
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">R$ Km</p>
                                        <p className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                            {row.operationalValue != null ? formatCurrency(row.operationalValue) : '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">R$/km op.</p>
                                        <p className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                            {row.operationalPerKm != null ? formatCurrency(row.operationalPerKm) : '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo total/km</p>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">
                                            {row.costPerKm != null || row.operationalPerKm != null
                                                ? formatCurrency((row.costPerKm ?? 0) + (row.operationalPerKm ?? 0))
                                                : '—'}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Apropriado</p>
                                        <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                            {formatCurrency(row.allocatedValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ociosidade</p>
                                        <p className="font-black text-amber-600 dark:text-amber-400 text-sm">
                                            {formatCurrency(row.idleValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Utilização</p>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">
                                            {row.utilization != null ? `${(row.utilization * 100).toFixed(1)}%` : '—'}
                                        </p>
                                    </div>
                                </div>

                                {!hasContract && (
                                    canApportion ? (
                                        <p className="px-4 py-2 text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                            Sem contrato de aluguel nesta competência: o rateio abrange
                                            apenas as despesas do mês (o R$/km é apurado por linha de Km).
                                        </p>
                                    ) : (
                                        <p className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                                            Sem contrato de aluguel e sem despesas nesta competência —
                                            nada a apurar. Cadastre um contrato de aluguel ou lance despesas.
                                        </p>
                                    )
                                )}

                                {/* Ações */}
                                <div className="p-3 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSimulate(row)}
                                        disabled={busy}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        Simular
                                    </button>

                                    <button
                                        onClick={() => handleToggleExpenses(row)}
                                        disabled={busy}
                                        title="Lançar e detalhar despesas variáveis do mês (combustível, pedágio...)"
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 ${expenseVehicleId === String(row.vehicleId)
                                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                        Despesas
                                    </button>

                                    <button
                                        onClick={() => handleToggleUtilization(row)}
                                        disabled={busy}
                                        title="Detalhar utilização do veículo na competência (visitas, Km e custo)"
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 ${utilizationVehicleId === String(row.vehicleId)
                                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                                : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">speed</span>
                                        Utilização
                                    </button>

                                    {(status === 'OPEN' || status === 'CALCULATED') && (
                                        <button
                                            onClick={() => handleAllocate(row)}
                                            disabled={busy || !canApportion}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">checklist</span>
                                            {busy ? 'Processando...' : 'Confirmar Apropriação'}
                                        </button>
                                    )}

                                    {status === 'ALLOCATED' && (
                                        <>
                                            <button
                                                onClick={() => handleClose(row)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                                Fechar Competência
                                            </button>
                                            <button
                                                onClick={() => handleRevert(row)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">undo</span>
                                                Estornar
                                            </button>
                                        </>
                                    )}

                                    {status === 'CLOSED' && (
                                        <button
                                            onClick={() => handleReopen(row)}
                                            disabled={busy}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                            Reabrir
                                        </button>
                                    )}
                                </div>

                                {/* Despesas — tabela colapsável */}
                                {expenseVehicleId === String(row.vehicleId) && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                        {expenseLoading ? (
                                            <div className="p-4"><Loading /></div>
                                        ) : (
                                            <div>
                                                {expensesLocked && (
                                                    <p className="p-3 bg-amber-50 dark:bg-amber-900/20 text-xs font-bold text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800/40">
                                                        Competência alocada/fechada — despesas somente leitura. Faça o estorno (ou reabra) para alterar os lançamentos.
                                                    </p>
                                                )}

                                                {!expensesLocked && expenseVehicle?.vehicleId === String(row.vehicleId) && expenseBusy && !expenseForm && (
                                                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                                        Recalculando custos de transporte...
                                                    </p>
                                                )}

                                                {/* Formulário de adicionar / editar */}
                                                {expenseForm && !expensesLocked && (
                                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                {expenseForm.id ? 'Editar despesa' : 'Nova despesa'}
                                                            </p>
                                                            <button
                                                                onClick={() => setExpenseForm(null)}
                                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                                    Tipo de despesa
                                                                </label>
                                                                <select
                                                                    value={expenseForm.costTypeId}
                                                                    onChange={e => setExpenseForm({ ...expenseForm, costTypeId: e.target.value })}
                                                                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary"
                                                                >
                                                                    <option value="">Selecione...</option>
                                                                    {costTypes.map(type => (
                                                                        <option key={type.id} value={type.id}>
                                                                            {type.description}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                                    Valor (R$)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={expenseForm.value}
                                                                    onChange={e => setExpenseForm({ ...expenseForm, value: e.target.value })}
                                                                    placeholder="0,00"
                                                                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                                    Descrição (opcional)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={expenseForm.description}
                                                                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                                                    placeholder="Ex.: combustível, pedágio..."
                                                                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-1">
                                                            <button
                                                                onClick={() => setExpenseForm(null)}
                                                                disabled={expenseBusy}
                                                                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={handleSaveExpense}
                                                                disabled={expenseBusy}
                                                                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                                                            >
                                                                {expenseBusy ? 'Salvando...' : 'Salvar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {expenses.length === 0 && !expenseForm ? (
                                                    <p className="p-4 text-xs text-slate-400 text-center">
                                                        Nenhuma despesa lançada nesta competência.
                                                        {!expensesLocked && (
                                                            <span className="block mt-2">
                                                                <button
                                                                    onClick={() => setExpenseForm({ costTypeId: '', value: '', description: '' })}
                                                                    disabled={expenseBusy}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
                                                                >
                                                                    <span className="material-symbols-outlined text-[15px]">add</span>
                                                                    Nova despesa
                                                                </button>
                                                            </span>
                                                        )}
                                                    </p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full text-sm">
                                                            <thead>
                                                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                                    <th className="text-left px-3 py-2">Data</th>
                                                                    <th className="text-left px-3 py-2">Tipo</th>
                                                                    <th className="text-left px-3 py-2">Descrição</th>
                                                                    <th className="text-right px-3 py-2">Valor</th>
                                                                    {!expensesLocked && (
                                                                        <th className="text-center px-3 py-2 w-20">Ações</th>
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {expenses.map(item => (
                                                                    <tr
                                                                        key={item.id}
                                                                        className="border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                                                                    >
                                                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                            {shortDate(item.createdAt)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                                            <div className="flex items-center gap-2">
                                                                                <span
                                                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                                    style={{ backgroundColor: item.costTypeColor || '#f59e0b' }}
                                                                                />
                                                                                <span>
                                                                                    {item.costTypeDescription || item.costTypeCode || 'Despesa'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                                            {item.description || '—'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-white">
                                                                            {formatCurrency(item.value)}
                                                                        </td>
                                                                        {!expensesLocked && (
                                                                            <td className="px-3 py-2 text-center whitespace-nowrap">
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            setExpenseForm({
                                                                                                id: item.id,
                                                                                                costTypeId: item.costTypeId,
                                                                                                value: String(item.value).replace('.', ','),
                                                                                                description: item.description || ''
                                                                                            })
                                                                                        }
                                                                                        className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                                        title="Editar despesa"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[15px]">edit</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setExpenseToDelete(item)}
                                                                                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                                        title="Excluir despesa"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[15px]">delete</span>
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                                                    <td className="px-3 py-2" colSpan={3}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span>Totais ({expenses.length} lançamento{expenses.length === 1 ? '' : 's'})</span>
                                                                            {!expensesLocked && !expenseForm && (
                                                                                <button
                                                                                    onClick={() => setExpenseForm({ costTypeId: '', value: '', description: '' })}
                                                                                    disabled={expenseBusy}
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ml-2"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[13px]">add</span>
                                                                                    Nova despesa
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-sm font-black text-slate-900 dark:text-white">
                                                                        {formatCurrency(expenseTotal)}
                                                                    </td>
                                                                    {!expensesLocked && <td className="px-3 py-2" />}
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Utilização — tabela colapsável (odômetro visita a visita) */}
                                {utilizationVehicleId === String(row.vehicleId) && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                        {utilizationLoading ? (
                                            <div className="p-4"><Loading /></div>
                                        ) : utilizationRows.length === 0 ? (
                                            <p className="p-4 text-xs text-slate-400 text-center">
                                                Nenhuma visita com Km rodado nesta competência.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                            <th className="text-left px-3 py-2">
                                                                <span className="inline-flex items-center gap-1">
                                                                    Data Início
                                                                    <span className="material-symbols-outlined text-[13px] text-amber-500 font-black" title="Ordenado em ordem crescente de data de início">arrow_upward</span>
                                                                </span>
                                                            </th>
                                                            <th className="text-left px-3 py-2">Visita</th>
                                                            <th className="text-right px-3 py-2">Km inicial</th>
                                                            <th className="text-right px-3 py-2">Km final</th>
                                                            <th className="text-right px-3 py-2">Km Dif</th>
                                                            <th className="text-right px-3 py-2">R$ Custo Total/Km</th>
                                                            <th className="text-right px-3 py-2">Valor Visita</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {utilizationRows.map((u, idx) => {
                                                            const prev = idx > 0 ? utilizationRows[idx - 1] : null;
                                                            const gap = prev && u.kmInitial > prev.kmFinal ? (u.kmInitial - prev.kmFinal) : 0;
                                                            return (
                                                                <React.Fragment key={u.ovvId}>
                                                                    {gap > 0 && (
                                                                        <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-y border-amber-500/30 text-amber-800 dark:text-amber-300">
                                                                            <td className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                                                                {shortDate(prev?.visitEndAt)} - {shortDate(u.visitStartAt)}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span
                                                                                        className="inline-flex items-center gap-1.5"
                                                                                        title={`Intervalo sem apontamento entre ${prev?.visitMask || `#${prev?.ovId}`} e ${u.visitMask || `#${u.ovId}`}`}
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[15px] text-amber-500">warning</span>
                                                                                        <span>Km Não Apontado (Buraco)</span>
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1 text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                                                                        <span>Entre</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => prev && handleOpenVisitTransport(prev.ovId)}
                                                                                            title="Abrir visita anterior na aba Transporte"
                                                                                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                                                        >
                                                                                            {prev?.visitMask || `#${prev?.ovId}`}
                                                                                        </button>
                                                                                        <span>e</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleOpenVisitTransport(u.ovId)}
                                                                                            title="Abrir visita seguinte na aba Transporte"
                                                                                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                                                        >
                                                                                            {u.visitMask || `#${u.ovId}`}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-medium text-amber-700 dark:text-amber-300">
                                                                                {prev?.kmFinal.toLocaleString('pt-BR')}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-medium text-amber-700 dark:text-amber-300">
                                                                                {u.kmInitial.toLocaleString('pt-BR')}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-black text-amber-600 dark:text-amber-400">
                                                                                +{gap.toLocaleString('pt-BR')}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500 text-xs">
                                                                                —
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500 text-xs">
                                                                                —
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    <tr className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                            {shortDate(u.visitStartAt)} - {shortDate(u.visitEndAt)}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleOpenVisitTransport(u.ovId)}
                                                                                title="Abrir página da visita com a aba Transporte ativa"
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group cursor-pointer border border-blue-200/70 dark:border-blue-800/60 shadow-xs"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[14px] text-blue-500 group-hover:scale-110 transition-transform">
                                                                                    directions_car
                                                                                </span>
                                                                                <span>{u.visitMask || `#${u.ovId}`}</span>
                                                                                <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                                                                                    open_in_new
                                                                                </span>
                                                                            </button>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                                            {u.kmInitial.toLocaleString('pt-BR')}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                                            {u.kmFinal.toLocaleString('pt-BR')}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                                                                            {u.kmDiff.toLocaleString('pt-BR')}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-300">
                                                                            {u.costTotalPerKm != null ? formatCurrency(u.costTotalPerKm) : '—'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-white">
                                                                            {formatCurrency(u.visitValue)}
                                                                        </td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot>
                                                        {(() => {
                                                            const kmAppropriated = utilizationRows.reduce((sum, u) => sum + u.kmDiff, 0);
                                                            let kmGaps = 0;
                                                            for (let i = 1; i < utilizationRows.length; i++) {
                                                                if (utilizationRows[i].kmInitial > utilizationRows[i - 1].kmFinal) {
                                                                    kmGaps += (utilizationRows[i].kmInitial - utilizationRows[i - 1].kmFinal);
                                                                }
                                                            }
                                                            const kmTotalOdometer = kmAppropriated + kmGaps;
                                                            const totalVisitValue = utilizationRows.reduce((sum, u) => sum + u.visitValue, 0);

                                                            return (
                                                                <>
                                                                    {kmGaps > 0 && (
                                                                        <tr className="text-[11px] font-bold text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-slate-800 bg-amber-500/5">
                                                                            <td className="px-3 py-2" colSpan={4}>
                                                                                <span className="flex items-center gap-1">
                                                                                    <span className="material-symbols-outlined text-[15px]">info</span>
                                                                                    Km Não Apontado (Total de buracos entre visitas no mês)
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right text-sm font-black text-amber-600 dark:text-amber-400">
                                                                                {kmGaps.toLocaleString('pt-BR')} Km
                                                                            </td>
                                                                            <td className="px-3 py-2" colSpan={2} />
                                                                        </tr>
                                                                    )}
                                                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                                                        <td className="px-3 py-2" colSpan={4}>
                                                                            Totais (Km Apropriado {kmGaps > 0 ? `+ ${kmGaps.toLocaleString('pt-BR')} Km não apontados = ${kmTotalOdometer.toLocaleString('pt-BR')} Km odômetro` : ''})
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-sm font-black text-slate-900 dark:text-white">
                                                                            {kmAppropriated.toLocaleString('pt-BR')} Km
                                                                        </td>
                                                                        <td className="px-3 py-2" />
                                                                        <td className="px-3 py-2 text-right text-sm font-black text-slate-900 dark:text-white">
                                                                            {formatCurrency(totalVisitValue)}
                                                                        </td>
                                                                    </tr>
                                                                </>
                                                            );
                                                        })()}
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Totais da competência */}
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            {search.trim() ? `Totais filtrados (${filteredRows.length} ${filteredRows.length === 1 ? 'veículo' : 'veículos'})` : 'Totais da competência'}
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs">Aluguel</p>
                                <p className="font-black">{formatCurrency(totals.contractValue)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Despesas</p>
                                <p className="font-black text-amber-400">{formatCurrency(totals.variableValue)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">R$ Km</p>
                                <p className="font-black text-blue-400">{formatCurrency(totals.operationalValue)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Km Apropriado</p>
                                <p className="font-black">{totals.totalKm.toLocaleString('pt-BR')} Km</p>
                                {totals.gapKm > 0 && (
                                    <p className="text-xs text-amber-400 font-bold mt-0.5">
                                        +{totals.gapKm.toLocaleString('pt-BR')} Km não apontados
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Apropriado</p>
                                <p className="font-black text-emerald-400">{formatCurrency(totals.allocatedValue)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Ociosidade</p>
                                <p className="font-black text-amber-400">{formatCurrency(totals.idleValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de simulação (visita a visita) ── */}
            <Modal
                isOpen={!!detailVehicle}
                onClose={() => setDetailVehicle(null)}
                title={`Simulação — ${detailVehicle?.vehicleDescription || ''}`}
                maxWidth="2xl"
            >
                {detailLoading ? (
                    <div className="p-6"><Loading /></div>
                ) : detailRows.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                        Nenhuma visita com Km rodado nesta competência.
                    </div>
                ) : (
                    <div className="p-2">
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left px-3 py-2">Visita</th>
                                        <th className="text-right px-3 py-2">Km</th>
                                        <th className="text-right px-3 py-2">R$ Km</th>
                                        <th className="text-right px-3 py-2">R$/km</th>
                                        <th className="text-right px-3 py-2">Aluguel</th>
                                        <th className="text-right px-3 py-2">Despesas</th>
                                        <th className="text-right px-3 py-2">Total</th>
                                        <th className="text-center px-3 py-2">Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailRows.map(row => (
                                        <tr
                                            key={row.ovvId}
                                            className="border-b border-slate-50 dark:border-slate-800/60 last:border-0"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {row.visitMask || `#${row.ovId}`}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                {row.km.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-300">
                                                {row.operationalValue != null ? formatCurrency(row.operationalValue) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                {row.rate != null ? formatCurrency(row.rate) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-indigo-600 dark:text-indigo-300">
                                                {formatCurrency(row.rentalValue)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-amber-600 dark:text-amber-400">
                                                {formatCurrency(row.variableValue)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-white">
                                                {formatCurrency(row.value)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {row.rentalOvvId || row.variableOvvId ? (
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        Rateiado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2 items-center px-3 py-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {detailRows.length} visita(s)
                            </span>
                            <span className="flex items-center gap-3 text-sm">
                                <span className="font-bold text-blue-500 dark:text-blue-400">
                                    R$ Km: {formatCurrency(detailRows.reduce((sum, r) => sum + (r.operationalValue ?? 0), 0))}
                                </span>
                                <span className="font-bold text-indigo-500 dark:text-indigo-400">
                                    Aluguel: {formatCurrency(detailRows.reduce((sum, r) => sum + r.rentalValue, 0))}
                                </span>
                                <span className="font-bold text-amber-500 dark:text-amber-400">
                                    Despesas: {formatCurrency(detailRows.reduce((sum, r) => sum + r.variableValue, 0))}
                                </span>
                                <span className="font-black text-slate-900 dark:text-white">
                                    Total: {formatCurrency(detailRows.reduce((sum, r) => sum + r.value, 0))}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </Modal>



            {/* ── Confirmação de exclusão de despesa ── */}
            <ConfirmDeleteModal
                isOpen={!!expenseToDelete}
                onClose={() => setExpenseToDelete(null)}
                onConfirm={handleDeleteExpense}
                isLoading={expenseBusy}
                title="Excluir despesa"
                description={
                    <>
                        Remover <strong>{expenseToDelete?.costTypeDescription || 'esta despesa'}</strong> no valor de{' '}
                        <strong>{expenseToDelete ? formatCurrency(expenseToDelete.value) : ''}</strong>?
                        Esta ação não pode ser desfeita.
                    </>
                }
            />
        </div>
    );
};
