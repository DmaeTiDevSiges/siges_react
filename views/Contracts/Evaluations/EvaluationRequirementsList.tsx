import React, { useState, useEffect } from 'react';
import { EvaluationRequirement } from '../../../types';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { Loading } from '../../../components/ui/Loading';
import { EmptyState } from '../../../components/ui/EmptyState';

export const EvaluationRequirementsList: React.FC = () => {
    const [requirements, setRequirements] = useState<EvaluationRequirement[]>([]);
    const [loading, setLoading] = useState(false);
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
        } finally {
            setLoading(false);
        }
    };

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
                const result = await dataService.createEvaluationRequirement({
                    description: formData.description,
                    code: formData.code || undefined,
                });

                if (result && 'error' in result) {
                    toast.error(result.error);
                    return;
                }

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Requisitos de Avaliação
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Cadastre os requisitos que serão avaliados nas visitas técnicas
                    </p>
                </div>
                <Button onClick={openNewForm} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Novo Requisito
                </Button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loading size="xs" />
                    </div>
                ) : requirements.length > 0 ? (
                    requirements.map(item => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`w-10 h-6 rounded-full transition-colors ${
                                        item.isAvailable
                                            ? 'bg-primary'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                >
                                    <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${
                                        item.isAvailable ? 'translate-x-5' : 'translate-x-1'
                                    }`} />
                                </button>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                        {item.description}
                                    </h4>
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
                    ))
                ) : (
                    <EmptyState
                        icon="rate_review"
                        message="Nenhum requisito cadastrado. Cadastre requisitos para avaliar os serviços nas visitas técnicas."
                    />
                )}
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
                    <Button fullWidth onClick={handleSubmit} className="mt-4">
                        {editingItem ? 'Salvar' : 'Criar Requisito'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
