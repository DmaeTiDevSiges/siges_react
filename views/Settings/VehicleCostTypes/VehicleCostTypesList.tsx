import React, { useState, useEffect, useCallback } from 'react';
import { VehicleCostType } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { VehicleCostTypeForm, VehicleCostTypeFormInput } from './VehicleCostTypeForm';
import { toast } from 'sonner';

interface VehicleCostTypesListProps {
    onBack?: () => void;
}

export const VehicleCostTypesList: React.FC<VehicleCostTypesListProps> = () => {
    const [types, setTypes] = useState<VehicleCostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<VehicleCostType | null>(null);
    const [deleting, setDeleting] = useState<VehicleCostType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadTypes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await dataService.getVehicleCostTypes();
            setTypes(data);
        } catch (error) {
            console.error('Error loading vehicle cost types', error);
            toast.error('Erro ao carregar os tipos de custo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    const handleSave = async (input: VehicleCostTypeFormInput) => {
        try {
            await dataService.saveVehicleCostType(input);
            toast.success(input.id ? 'Tipo de custo atualizado!' : 'Tipo de custo criado!');
            setIsFormOpen(false);
            setEditing(null);
            await loadTypes();
        } catch (error) {
            console.error('Error saving vehicle cost type', error);
            toast.error('Erro ao salvar o tipo de custo');
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setIsDeleting(true);
        try {
            await dataService.deleteVehicleCostType(deleting.id);
            toast.success('Tipo de custo excluído!');
            setDeleting(null);
            await loadTypes();
        } catch (error) {
            console.error('Error deleting vehicle cost type', error);
            toast.error('Erro ao excluir o tipo de custo');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = types.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="p-8"><Loading /></div>;
    }

    return (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar tipo de custo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditing(null); setIsFormOpen(true); }}
                        className="flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
                        title="Adicionar Tipo de Custo"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            <div className="px-4 pb-32 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search ? 'Nenhum tipo encontrado para esta busca' : 'Nenhum tipo de custo cadastrado'}
                    </div>
                ) : (
                    filtered.map(type => (
                        <div
                            key={type.id}
                            className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 p-4 flex items-center gap-3"
                        >
                            <div
                                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: `${type.color || '#64748b'}22` }}
                            >
                                <span
                                    className="material-symbols-outlined text-[20px]"
                                    style={{ color: type.color || '#64748b' }}
                                >
                                    sell
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                        {type.description}
                                    </h3>
                                    <StatusBadge status={type.isAvailable === false ? 'inactive' : 'active'} size="sm" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="material-symbols-outlined text-[14px] text-slate-400">tag</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        {type.code || '---'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => { setEditing(type); setIsFormOpen(true); }}
                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                    onClick={() => setDeleting(type)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Excluir"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditing(null); }}
                title={editing ? 'Editar Tipo de Custo' : 'Novo Tipo de Custo'}
                maxWidth="md"
            >
                <VehicleCostTypeForm
                    initial={editing}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditing(null); }}
                />
            </Modal>

            <ConfirmDeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Excluir Tipo de Custo"
                description={`Deseja realmente excluir o tipo "${deleting?.description}"?`}
                isLoading={isDeleting}
            />
        </div>
    );
};
