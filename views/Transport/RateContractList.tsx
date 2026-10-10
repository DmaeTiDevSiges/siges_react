import React, { useState, useEffect, useCallback } from 'react';
import { dataService } from '../../services/dataService';
import type { VehicleRateContract } from '../../services/orders/vehicleRateService';
import type { VehicleCompanyInfo } from '../../types';
import { usePermissions } from '../../contexts/PermissionsContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { RateContractForm, RateContractFormInput } from './RateContractForm';
import { formatCurrency } from '../../utils/formatters';
import { isVehicleRentalEnabled } from '../../features';
import { toast } from 'sonner';

interface RateContractListProps {
    onNavigate?: (screen: string) => void;
}

const fmtDate = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 10).split('-').reverse().join('/');
};

export const RateContractList: React.FC<RateContractListProps> = ({ onNavigate }) => {
    const { canView, loading: permissionsLoading } = usePermissions();
    const [contracts, setContracts] = useState<VehicleRateContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<VehicleRateContract | null>(null);
    const [deleting, setDeleting] = useState<VehicleRateContract | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [vehicleCompanies, setVehicleCompanies] = useState<Record<string, VehicleCompanyInfo>>({});

    const loadContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await dataService.getRateContracts();
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
            console.error('Error loading rate contracts', error);
            toast.error('Erro ao carregar os contratos de R$/km');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContracts();
    }, [loadContracts]);

    const handleSave = async (input: RateContractFormInput) => {
        try {
            await dataService.saveRateContract(input);
            toast.success(input.id ? 'Contrato atualizado!' : 'Contrato criado!');
            setIsFormOpen(false);
            setEditing(null);
            await loadContracts();
        } catch (error) {
            console.error('Error saving rate contract', error);
            toast.error('Erro ao salvar o contrato');
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setIsDeleting(true);
        try {
            await dataService.deleteRateContract(deleting.id);
            toast.success('Contrato excluído!');
            setDeleting(null);
            await loadContracts();
        } catch (error) {
            console.error('Error deleting rate contract', error);
            toast.error('Erro ao excluir o contrato');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = contracts.filter(c => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (c.vehicleDescription || '').toLowerCase().includes(term)
            || (c.vehiclePlates || '').toLowerCase().includes(term);
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

    if (!canView('transport_rate_contracts')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para acessar os contratos de R$/km."
            />
        );
    }

    if (loading) {
        return <div className="p-8"><Loading /></div>;
    }

    return (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar por veículo ou placa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => onNavigate?.('rental-apportionment')}
                        className="flex items-center justify-center h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Apuração de Aluguel"
                    >
                        <span className="material-symbols-outlined">calculate</span>
                    </button>
                    <button
                        onClick={() => { setEditing(null); setIsFormOpen(true); }}
                        className="flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                        title="Novo Contrato de R$/km"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            <div className="px-4 pb-32 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search ? 'Nenhum contrato encontrado para esta busca' : 'Nenhum contrato de R$/km cadastrado'}
                    </div>
                ) : (
                    filtered.map(contract => (
                        <div
                            key={contract.id}
                            className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px] text-sky-500">
                                        speed
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

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Custo por Km
                                    </p>
                                    <p className="font-black text-slate-900 dark:text-white">
                                        {formatCurrency(contract.valueUnit)}
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
                title={editing ? 'Editar Contrato de R$/km' : 'Novo Contrato de R$/km'}
                maxWidth="lg"
            >
                <RateContractForm
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
                description={`Deseja realmente excluir o contrato de R$/km de "${deleting?.vehicleDescription || deleting?.vehicleId}"?`}
                isLoading={isDeleting}
            />
        </div>
    );
};
