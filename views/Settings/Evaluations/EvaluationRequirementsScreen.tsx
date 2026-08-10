import React, { useState, useEffect } from 'react';
import { EvaluationRequirement } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { Loading } from '../../../components/ui/Loading';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface EvaluationRequirementsScreenProps {
    onBack: () => void;
}

export const EvaluationRequirementsScreen: React.FC<EvaluationRequirementsScreenProps> = ({ onBack }) => {
    const [requirements, setRequirements] = useState<EvaluationRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<EvaluationRequirement | null>(null);
    const [formData, setFormData] = useState({ description: '', code: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await dataService.getEvaluationRequirements();
            setRequirements(data);
        } catch (error) {
            console.error('Error loading requirements:', error);
            toast.error('Erro ao carregar requisitos');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequirements = requirements.filter(item => {
        const matchesSearch = !searchQuery || 
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || 
            (filter === 'active' && item.isAvailable) ||
            (filter === 'inactive' && !item.isAvailable);
        return matchesSearch && matchesFilter;
    });

    const handleSubmit = async () => {
        if (!formData.description.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }

        try {
            if (editingItem) {
                await dataService.updateEvaluationRequirement(editingItem.id, {
                    description: formData.description,
                    code: formData.code || undefined,
                });
                toast.success('Requisito atualizado');
            } else {
                await dataService.createEvaluationRequirement({
                    description: formData.description,
                    code: formData.code || undefined,
                });
                toast.success('Requisito criado');
            }
            setShowForm(false);
            setEditingItem(null);
            setFormData({ description: '', code: '' });
            await loadData();
        } catch (error) {
            console.error('Error saving requirement:', error);
            toast.error('Erro ao salvar requisito');
        }
    };

    const handleEdit = (item: EvaluationRequirement) => {
        setEditingItem(item);
        setFormData({ description: item.description, code: item.code || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este requisito?')) return;
        try {
            await dataService.deleteEvaluationRequirement(id);
            toast.success('Requisito excluído');
            await loadData();
        } catch (error) {
            console.error('Error deleting requirement:', error);
            toast.error('Erro ao excluir requisito');
        }
    };

    const handleToggleAvailability = async (item: EvaluationRequirement) => {
        try {
            await dataService.updateEvaluationRequirement(item.id, { isAvailable: !item.isAvailable });
            await loadData();
        } catch (error) {
            console.error('Error toggling availability:', error);
            toast.error('Erro ao alterar disponibilidade');
        }
    };

    const openNewForm = () => {
        setEditingItem(null);
        setFormData({ description: '', code: '' });
        setShowForm(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                    <IconButton
                        icon="arrow_back"
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-300"
                    />
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            Requisitos para Avaliações
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Gerenciar catálogo de requisitos
                        </p>
                    </div>
                    <Button onClick={openNewForm} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Search and Filters */}
                <div className="space-y-3">
                    <SearchInput
                        placeholder="Buscar requisitos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                filter === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            Todos ({requirements.length})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                filter === 'active'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            Ativos ({requirements.filter(r => r.isAvailable).length})
                        </button>
                        <button
                            onClick={() => setFilter('inactive')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                filter === 'inactive'
                                    ? 'bg-slate-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            Inativos ({requirements.filter(r => !r.isAvailable).length})
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loading size="md" />
                        </div>
                    ) : filteredRequirements.length > 0 ? (
                        filteredRequirements.map(item => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleAvailability(item)}
                                            className={`w-10 h-6 rounded-full transition-colors ${
                                                item.isAvailable
                                                    ? 'bg-green-500'
                                                    : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${
                                                item.isAvailable ? 'translate-x-5' : 'translate-x-1'
                                            }`} />
                                        </button>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                                {item.description}
                                            </h3>
                                            {item.code && (
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    #{item.code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge
                                            status={item.isAvailable ? 'active' : 'inactive'}
                                            size="sm"
                                        />
                                        <IconButton
                                            icon="edit"
                                            size="sm"
                                            onClick={() => handleEdit(item)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState
                            icon="rate_review"
                            message="Nenhum requisito cadastrado. Crie requisitos para avaliar os serviços nas visitas técnicas."
                        />
                    )}
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ description: '', code: '' });
                }}
                title={editingItem ? 'Editar Requisito' : 'Novo Requisito'}
            >
                <div className="space-y-4">
                    <Input
                        label="Descrição *"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ex: EPIs utilizadas corretamente"
                    />
                    <Input
                        label="Código (opcional)"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ex: EPI001"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        O código é opcional, mas ajuda na identificação rápida do requisito.
                    </p>
                    <Button fullWidth onClick={handleSubmit} className="mt-4">
                        {editingItem ? 'Salvar' : 'Criar Requisito'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
