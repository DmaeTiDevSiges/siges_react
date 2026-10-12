import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { dataService } from '../../services/dataService';
import type { VehicleRentalContract } from '../../services/orders/vehicleRentalService';
import type { VehicleCompanyInfo } from '../../types';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { RentalContractForm, RentalContractFormInput } from './RentalContractForm';
import { formatCurrency } from '../../utils/formatters';
import { isVehicleRentalEnabled } from '../../features';
import { toast } from 'sonner';

interface RentalContractListProps {
    onNavigate?: (screen: string) => void;
    selectedCompanyId?: string | null;
    onCompanySelect?: (id: string | null) => void;
}

const fmtDate = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 10).split('-').reverse().join('/');
};

export const RentalContractList: React.FC<RentalContractListProps> = ({
    onNavigate,
    selectedCompanyId: externalCompanyId,
    onCompanySelect,
}) => {
    const { canView, loading: permissionsLoading } = usePermissions();
    const [contracts, setContracts] = useState<VehicleRentalContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<VehicleRentalContract | null>(null);
    const [deleting, setDeleting] = useState<VehicleRentalContract | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [vehicleCompanies, setVehicleCompanies] = useState<Record<string, VehicleCompanyInfo>>({});
    const companiesScroll = useDraggableScroll();

    // Usa o filtro externo (compartilhado entre abas) ou gerencia localmente
    const [internalCompanyId, setInternalCompanyId] = useState<string | null>(null);
    const selectedCompanyId = externalCompanyId !== undefined ? externalCompanyId : internalCompanyId;
    const setSelectedCompanyId = (id: string | null) => {
        onCompanySelect ? onCompanySelect(id) : setInternalCompanyId(id);
    };

    const loadContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await dataService.getRentalContracts();
            setContracts(data);
            // Avatar da company DO VEÍCULO (vehicles.company_id) — não a do usuário logado
            dataService.getVehiclesCompaniesInfo(data.map(c => String(c.vehicleId)))
                .then(infos => {
                    const map: Record<string, VehicleCompanyInfo> = {};
                    infos.forEach(info => { map[info.vehicleId] = info; });
                    setVehicleCompanies(map);
                })
                .catch(err => console.error('Error loading vehicle companies', err));
        } catch (error) {
            console.error('Error loading rental contracts', error);
            toast.error('Erro ao carregar os contratos de veículos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContracts();
    }, [loadContracts]);

    const handleSave = async (input: RentalContractFormInput) => {
        try {
            await dataService.saveRentalContract(input);
            toast.success(input.id ? 'Contrato atualizado!' : 'Contrato criado!');
            setIsFormOpen(false);
            setEditing(null);
            await loadContracts();
        } catch (error) {
            console.error('Error saving rental contract', error);
            toast.error('Erro ao salvar o contrato');
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setIsDeleting(true);
        try {
            await dataService.deleteRentalContract(deleting.id);
            toast.success('Contrato excluído!');
            setDeleting(null);
            await loadContracts();
        } catch (error) {
            console.error('Error deleting rental contract', error);
            toast.error('Erro ao excluir o contrato');
        } finally {
            setIsDeleting(false);
        }
    };

    // Compute companies list with count
    const companiesWithCount = useMemo(() => {
        const map = new Map<string, { id: string; name: string; logoUrl?: string; count: number }>();
        let withoutCompanyCount = 0;
        for (const c of contracts) {
            const vc = vehicleCompanies[String(c.vehicleId)];
            if (vc && vc.companyId) {
                const compId = String(vc.companyId);
                const existing = map.get(compId);
                if (existing) existing.count += 1;
                else map.set(compId, { id: compId, name: vc.companyName || 'Empresa', logoUrl: vc.companyLogoUrl, count: 1 });
            } else {
                withoutCompanyCount += 1;
            }
        }
        const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        if (withoutCompanyCount > 0) list.push({ id: 'none', name: 'Sem Empresa', logoUrl: undefined, count: withoutCompanyCount });
        return list;
    }, [contracts, vehicleCompanies]);

    const filtered = contracts.filter(c => {
        const term = search.trim().toLowerCase();
        const matchSearch = !term
            || (c.vehicleDescription || '').toLowerCase().includes(term)
            || (c.vehiclePlates || '').toLowerCase().includes(term);
        if (!matchSearch) return false;
        if (selectedCompanyId) {
            const vc = vehicleCompanies[String(c.vehicleId)];
            if (selectedCompanyId === 'none') {
                if (vc && vc.companyId) return false;
            } else {
                if (!vc || String(vc.companyId) !== selectedCompanyId) return false;
            }
        }
        return true;
    });

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

    if (!canView('dashboard_vehicles_rentals')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para acessar os contratos de veículos."
            />
        );
    }

    if (loading) {
        return <div className="p-8"><Loading /></div>;
    }

    return (
        <div className="flex flex-col">
            {/* ── Barra de filtro por empresa ── */}
            {companiesWithCount.length > 0 && (
                <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-800 bg-background-light dark:bg-background-dark">
                    <div
                        ref={companiesScroll.ref}
                        onMouseDown={companiesScroll.onMouseDown}
                        onTouchStart={companiesScroll.onTouchStart}
                        onClickCapture={companiesScroll.onClickCapture}
                        className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1.5 pb-2.5 px-3 cursor-grab active:cursor-grabbing touch-auto select-none"
                    >
                        {/* Todas */}
                        <button
                            type="button"
                            onClick={() => setSelectedCompanyId(null)}
                            className={`flex flex-col items-center shrink-0 group focus:outline-none transition-all p-1 ${
                                selectedCompanyId === null ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                            }`}
                            title={`Todas as empresas (${contracts.length} contratos)`}
                        >
                            <div
                                className={`relative w-[55px] h-[55px] rounded-[14px] flex items-center justify-center transition-all ${
                                    selectedCompanyId === null
                                        ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[26px]">domain</span>
                                <span className="absolute -top-1.5 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-orange-500 text-black text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                                    {contracts.length}
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

                        {companiesWithCount.map(comp => {
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
                                    title={`${comp.name} (${comp.count} ${comp.count === 1 ? 'contrato' : 'contratos'})`}
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
                </div>
            )}


            <div className="px-4 py-3 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar por veículo ou placa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClear={() => setSearch('')}
                        />
                    </div>
                    <button
                        onClick={() => { setEditing(null); setIsFormOpen(true); }}
                        className="flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                        title="Novo Contrato"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            <div className="px-4 pb-32 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search || selectedCompanyId
                            ? 'Nenhum contrato encontrado para os filtros selecionados'
                            : 'Nenhum contrato de veículo cadastrado'}
                        {(search || selectedCompanyId) && (
                            <button
                                onClick={() => { setSearch(''); setSelectedCompanyId(null); }}
                                className="block mx-auto mt-3 text-xs font-semibold text-primary hover:underline"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(contract => (
                        <div
                            key={contract.id}
                            className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px] text-emerald-500">
                                        local_shipping
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                            {contract.vehicleDescription || `Veículo #${contract.vehicleId}`}
                                        </h3>
                                        <StatusBadge status={contract.active ? 'active' : 'inactive'} size="sm" />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        {contract.vehiclePlates || '---'}
                                    </p>
                                </div>

                                {/* Avatar da company DO VEÍCULO — alinhado à direita */}
                                {vehicleCompanies[String(contract.vehicleId)] && (
                                    <CompanyAvatar
                                        src={vehicleCompanies[String(contract.vehicleId)].companyLogoUrl}
                                        name={vehicleCompanies[String(contract.vehicleId)].companyName || 'Siges'}
                                        size="sm"
                                        className="shrink-0 shadow-sm"
                                    />
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => { setEditing(contract); setIsFormOpen(true); }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => setDeleting(contract)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Excluir"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Valor Mensal
                                    </p>
                                    <p className="font-black text-slate-900 dark:text-white">
                                        {formatCurrency(contract.monthlyValue)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        R$ Fixo/Km
                                    </p>
                                    <p className="font-black text-blue-600 dark:text-blue-400">
                                        {contract.valueUnit != null
                                            ? formatCurrency(contract.valueUnit)
                                            : '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Vigência
                                    </p>
                                    <p className="font-black text-slate-900 dark:text-white text-sm">
                                        {fmtDate(contract.startDate)} — {contract.endDate ? fmtDate(contract.endDate) : 'atual'}
                                    </p>
                                </div>
                            </div>

                            {contract.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                    {contract.description}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditing(null); }}
                title={editing ? 'Editar Contrato de Veículo' : 'Novo Contrato de Veículo'}
                maxWidth="lg"
            >
                <RentalContractForm
                    initial={editing}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditing(null); }}
                />
            </Modal>

            <ConfirmDeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Excluir Contrato"
                description={`Deseja realmente excluir o contrato de "${deleting?.vehicleDescription || deleting?.vehicleId}"?`}
                isLoading={isDeleting}
            />
        </div>
    );
};
