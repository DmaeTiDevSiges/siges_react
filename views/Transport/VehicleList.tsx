import React, { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../../types';
import { dataService } from '../../services/dataService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { CompanyAvatar } from '../../components/ui/CompanyAvatar';
import { VehicleForm, VehicleFormInput } from './VehicleForm';
import { toast } from 'sonner';

interface VehicleListProps {
    onNavigate?: (screen: string) => void;
}

interface CompanyBrief {
    companyName?: string;
    companyLogoUrl?: string;
}

export const VehicleList: React.FC<VehicleListProps> = ({ onNavigate }) => {
    const { canView, loading: permissionsLoading } = usePermissions();
    const { currentUser } = useAuth();
    // Company do usuário logado — atribuída ao criar um veículo novo
    const companyId = currentUser?.companyId;
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [deleting, setDeleting] = useState<Vehicle | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [companies, setCompanies] = useState<Record<string, CompanyBrief>>({});

    const loadVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await dataService.getVehicles();
            setVehicles(data);
            // Avatar: company de cada veículo (vehicles.company_id)
            dataService.getVehiclesCompaniesInfo(data.map(v => v.id))
                .then(infos => {
                    const map: Record<string, CompanyBrief> = {};
                    infos.forEach(info => {
                        if (info.companyId) {
                            map[info.companyId] = {
                                companyName: info.companyName,
                                companyLogoUrl: info.companyLogoUrl
                            };
                        }
                    });
                    setCompanies(map);
                })
                .catch(err => console.error('Error loading vehicle companies', err));
        } catch (error) {
            console.error('Error loading vehicles', error);
            toast.error('Erro ao carregar os veículos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    const handleSave = async (input: VehicleFormInput) => {
        try {
            await dataService.saveVehicle(input, companyId);
            toast.success(input.id ? 'Veículo atualizado!' : 'Veículo criado!');
            setIsFormOpen(false);
            setEditing(null);
            await loadVehicles();
        } catch (error) {
            console.error('Error saving vehicle', error);
            toast.error('Erro ao salvar o veículo');
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setIsDeleting(true);
        try {
            await dataService.deleteVehicle(deleting.id);
            toast.success('Veículo excluído!');
            setDeleting(null);
            await loadVehicles();
        } catch (error) {
            console.error('Error deleting vehicle', error);
            toast.error('Erro ao excluir o veículo');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = vehicles.filter(v => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return v.description.toLowerCase().includes(term)
            || v.plates.toLowerCase().includes(term);
    });

    if (permissionsLoading) {
        return <div className="p-8"><Loading /></div>;
    }

    if (!canView('transport_vehicles')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para acessar os veículos."
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
                        onClick={() => { setEditing(null); setIsFormOpen(true); }}
                        className="flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                        title="Novo Veículo"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            <div className="px-4 pb-32 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search ? 'Nenhum veículo encontrado para esta busca' : 'Nenhum veículo cadastrado'}
                    </div>
                ) : (
                    filtered.map(vehicle => (
                        <div
                            key={vehicle.id}
                            className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px] text-indigo-500">
                                        directions_car
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                            {vehicle.description || `Veículo #${vehicle.id}`}
                                        </h3>
                                        <StatusBadge status={vehicle.isAvailable ? 'active' : 'inactive'} size="sm" />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        {vehicle.plates || '---'}
                                    </p>
                                </div>

                                {/* Avatar da company DO VEÍCULO (vehicles.company_id) */}
                                {vehicle.companyId && companies[vehicle.companyId] && (
                                    <CompanyAvatar
                                        src={companies[vehicle.companyId].companyLogoUrl}
                                        name={companies[vehicle.companyId].companyName || 'Siges'}
                                        size="sm"
                                        className="shrink-0 shadow-sm"
                                    />
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => { setEditing(vehicle); setIsFormOpen(true); }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Editar"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => setDeleting(vehicle)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Excluir"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditing(null); }}
                title={editing ? 'Editar Veículo' : 'Novo Veículo'}
                maxWidth="md"
            >
                <VehicleForm
                    initial={editing}
                    defaultCompanyId={companyId}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditing(null); }}
                />
            </Modal>

            <ConfirmDeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Excluir Veículo"
                description={`Deseja realmente excluir o veículo "${deleting?.description || deleting?.plates}"? Ele ficará indisponível para novas visitas e contratos.`}
                isLoading={isDeleting}
            />
        </div>
    );
};
