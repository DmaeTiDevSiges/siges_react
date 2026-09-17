import React, { useState, useEffect, useCallback } from 'react';
import { AssetLoanChecklistType, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { Select } from '../../../../components/ui/Select';
import { IconButton } from '../../../../components/ui/IconButton';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface AssetLoanChecklistTypesListProps {
    onSelect: (item: AssetLoanChecklistType) => void;
    onAdd: () => void;
}

interface SortableItemProps {
    item: AssetLoanChecklistType;
    onSelect: (item: AssetLoanChecklistType) => void;
    onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, onSelect, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as const,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between"
        >
            <div className="flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-none"
                >
                    <span className="material-symbols-outlined text-xl">drag_indicator</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">check_box</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.itemDescription}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                        Ordem: {item.sortOrder}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <IconButton
                    icon="edit"
                    onClick={() => onSelect(item)}
                    size="sm"
                />
                <IconButton
                    icon="delete"
                    onClick={() => onDelete(item.id)}
                    size="sm"
                    variant="danger"
                />
            </div>
        </div>
    );
};

export const AssetLoanChecklistTypesList: React.FC<AssetLoanChecklistTypesListProps> = ({ onSelect, onAdd }) => {
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [selectedAssetType, setSelectedAssetType] = useState<string>('');
    const [items, setItems] = useState<AssetLoanChecklistType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableChecklists, setAvailableChecklists] = useState<{ id: string; description: string }[]>([]);
    const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        loadAssetTypes();
    }, []);

    useEffect(() => {
        if (selectedAssetType) {
            loadChecklistTypes();
        }
    }, [selectedAssetType]);

    const loadAssetTypes = async () => {
        try {
            const data = await dataService.getAssetTypes();
            setAssetTypes(data);
            if (data.length > 0) {
                setSelectedAssetType(data[0].id);
            }
        } catch (error) {
            console.error('Error loading asset types:', error);
        }
    };

    const loadChecklistTypes = async () => {
        try {
            setLoading(true);
            const data = await dataService.getChecklistTypesByAssetType(selectedAssetType);
            setItems(data);
        } catch (error) {
            console.error('Error loading checklist types:', error);
            toast.error('Erro ao carregar itens de checklist');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        try {
            const orderedIds = newItems.map(item => item.id);
            await dataService.reorderChecklistTypes(selectedAssetType, orderedIds);
            toast.success('Ordem atualizada');
        } catch (error) {
            console.error('Error reordering:', error);
            toast.error('Erro ao salvar ordem');
            loadChecklistTypes();
        }
    }, [items, selectedAssetType]);

    const handleOpenAddModal = async () => {
        if (!selectedAssetType) return;
        setShowAddModal(true);
        setSelectedChecklistIds([]);
        setLoadingAvailable(true);
        try {
            const available = await dataService.getAvailableChecklistsForAssetType(selectedAssetType);
            setAvailableChecklists(available);
        } catch (error) {
            console.error('Error loading available checklists:', error);
            toast.error('Erro ao carregar itens disponíveis');
        } finally {
            setLoadingAvailable(false);
        }
    };

    const handleAddChecklists = async () => {
        if (!selectedAssetType || selectedChecklistIds.length === 0) return;
        setSaving(true);
        try {
            await dataService.addChecklistsToAssetType(selectedAssetType, selectedChecklistIds);
            toast.success(`${selectedChecklistIds.length} item(s) adicionado(s)`);
            setShowAddModal(false);
            loadChecklistTypes();
        } catch (error) {
            console.error('Error adding checklists:', error);
            toast.error('Erro ao adicionar itens');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este vínculo?')) return;

        try {
            await dataService.deleteChecklistType(id);
            setItems(items.filter(item => item.id !== id));
            toast.success('Vínculo removido com sucesso');
        } catch (error) {
            console.error('Error deleting checklist type:', error);
            toast.error('Erro ao remover vínculo');
        }
    };

    const toggleChecklistSelection = (id: string) => {
        setSelectedChecklistIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const assetTypeOptions = assetTypes.map(type => ({
        value: type.id,
        label: type.description || type.code,
    }));

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                        Checklists por Tipo de Ativo
                    </h2>
                    <button
                        onClick={handleOpenAddModal}
                        disabled={!selectedAssetType}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Adicionar Itens
                    </button>
                </div>

                <Select
                    label="Tipo de Ativo"
                    value={selectedAssetType}
                    onChange={(e) => setSelectedAssetType(e.target.value)}
                    options={assetTypeOptions}
                    placeholder="Selecione o tipo de ativo"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-500/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-3xl">checklist</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Nenhum item vinculado</p>
                        <p className="text-[11px] text-slate-500 mt-1">Adicione itens de checklist para este tipo de ativo</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={items.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <SortableItem
                                        key={item.id}
                                        item={item}
                                        onSelect={onSelect}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Adicionar Itens de Checklist"
                maxWidth="md"
            >
                <div className="space-y-4">
                    {loadingAvailable ? (
                        <div className="py-8 flex justify-center">
                            <Loading size="sm" />
                        </div>
                    ) : availableChecklists.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            Todos os itens já estão vinculados a este tipo de ativo
                        </div>
                    ) : (
                        <>
                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {availableChecklists.map((checklist) => (
                                    <label
                                        key={checklist.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedChecklistIds.includes(checklist.id)}
                                            onChange={() => toggleChecklistSelection(checklist.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {checklist.description}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddChecklists}
                                    disabled={selectedChecklistIds.length === 0 || saving}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Adicionar {selectedChecklistIds.length > 0 && `(${selectedChecklistIds.length})`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};
