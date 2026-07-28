import React, { useState, useEffect, useCallback } from 'react';
import { AssetType, TypeAttributeConfig, AssetAttribute } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { TypeAttributeItem } from './TypeAttributeItem';
import { AddAttributeModal } from './AddAttributeModal';
import { Loading } from '../../../../components/ui/Loading';
import { ConfirmDeleteModal } from '../../../../components/ui/ConfirmDeleteModal';
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
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export const AssetTypeAttributesScreen: React.FC = () => {
    const [types, setTypes] = useState<AssetType[]>([]);
    const [selectedType, setSelectedType] = useState<AssetType | null>(null);
    const [configs, setConfigs] = useState<TypeAttributeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingConfigs, setLoadingConfigs] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<{ junctionId: string; attributeId: string } | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [editingNamingPattern, setEditingNamingPattern] = useState(false);
    const [namingPatternValue, setNamingPatternValue] = useState('');
    const [savingNamingPattern, setSavingNamingPattern] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        loadTypes();
    }, []);

    useEffect(() => {
        if (selectedType) {
            loadConfigs(selectedType.id);
        } else {
            setConfigs([]);
        }
    }, [selectedType]);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const data = await dataService.getAssetTypes('all');
            setTypes(data);
        } catch (error) {
            console.error('Error loading types:', error);
            toast.error('Erro ao carregar tipos de ativo');
        } finally {
            setLoading(false);
        }
    };

    const loadConfigs = async (typeId: string) => {
        setLoadingConfigs(true);
        try {
            const data = await dataService.getTypeAttributeConfigs(typeId);
            setConfigs(data);
        } catch (error) {
            console.error('Error loading configs:', error);
            toast.error('Erro ao carregar atributos do tipo');
        } finally {
            setLoadingConfigs(false);
        }
    };

    const handleSaveNamingPattern = async () => {
        if (!selectedType) return;
        setSavingNamingPattern(true);
        try {
            await dataService.updateAssetType(selectedType.id, {
                namingPattern: namingPatternValue
            });
            setSelectedType(prev => prev ? { ...prev, namingPattern: namingPatternValue } : null);
            setTypes(prev => prev.map(t =>
                t.id === selectedType.id ? { ...t, namingPattern: namingPatternValue } : t
            ));
            setEditingNamingPattern(false);
            toast.success('Padrão de nomeação atualizado');
        } catch (error) {
            console.error('Error saving naming pattern:', error);
            toast.error('Erro ao salvar padrão de nomeação');
        } finally {
            setSavingNamingPattern(false);
        }
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !selectedType) return;

        const oldIndex = configs.findIndex(c => c.id === active.id);
        const newIndex = configs.findIndex(c => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newConfigs = arrayMove(configs, oldIndex, newIndex);
        setConfigs(newConfigs);

        try {
            await dataService.reorderTypeAttributes(
                selectedType.id,
                newConfigs.map(c => c.id)
            );
        } catch (error) {
            console.error('Error reordering:', error);
            toast.error('Erro ao reordenar atributos');
            loadConfigs(selectedType.id);
        }
    }, [configs, selectedType]);

    const handleToggleRequired = useCallback(async (junctionId: string, value: boolean) => {
        if (!selectedType) return;

        setConfigs(prev => prev.map(c =>
            c.id === junctionId ? { ...c, isRequired: value } : c
        ));

        try {
            await dataService.updateTypeAttributeConfig(selectedType.id, junctionId, { isRequired: value });
        } catch (error) {
            console.error('Error updating required:', error);
            toast.error('Erro ao atualizar obrigatório');
            loadConfigs(selectedType.id);
        }
    }, [selectedType]);

    const handleChangeColSpan = useCallback(async (junctionId: string, value: number) => {
        if (!selectedType) return;

        setConfigs(prev => prev.map(c =>
            c.id === junctionId ? { ...c, colSpan: value } : c
        ));

        try {
            await dataService.updateTypeAttributeConfig(selectedType.id, junctionId, { colSpan: value });
        } catch (error) {
            console.error('Error updating colSpan:', error);
            toast.error('Erro ao atualizar colunas');
            loadConfigs(selectedType.id);
        }
    }, [selectedType]);

    const handleRemove = useCallback((junctionId: string, attributeId: string) => {
        setRemoveTarget({ junctionId, attributeId });
    }, []);

    const confirmRemove = async () => {
        if (!removeTarget || !selectedType) return;
        setIsRemoving(true);
        try {
            await dataService.unlinkAttributeFromType(selectedType.id, removeTarget.attributeId);
            setConfigs(prev => prev.filter(c => c.id !== removeTarget.junctionId));
            toast.success('Atributo removido');
        } catch (error) {
            console.error('Error removing:', error);
            toast.error('Erro ao remover atributo');
        } finally {
            setIsRemoving(false);
            setRemoveTarget(null);
        }
    };

    const handleAddAttribute = async (attribute: AssetAttribute, config: { isRequired: boolean; colSpan: number }) => {
        if (!selectedType) return;
        try {
            const newConfig = await dataService.linkAttributeToType(
                selectedType.id,
                attribute.id,
                {
                    isRequired: config.isRequired,
                    colSpan: config.colSpan,
                    orderIndex: configs.length + 1
                }
            );
            setConfigs(prev => [...prev, {
                ...newConfig,
                fieldKey: attribute.fieldKey,
                label: attribute.label,
                dataType: attribute.dataType,
                unit: attribute.unit,
                decimals: attribute.decimals
            }]);
            toast.success('Atributo vinculado');
        } catch (error) {
            console.error('Error linking:', error);
            toast.error('Erro ao vincular atributo');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loading size="md" text="Carregando tipos..." />
            </div>
        );
    }

    return (
        <div className="flex h-full bg-background-light dark:bg-background-dark">
            {/* Left Panel - Types List */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Tipos de Ativo
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {types.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 transition-colors ${
                                selectedType?.id === type.id
                                    ? 'bg-primary/10 border-l-2 border-l-primary'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent'
                            }`}
                        >
                            <div className="font-medium text-sm text-slate-900 dark:text-white">
                                {type.description}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {type.code}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Panel - Attribute Config */}
            <div className="flex-1 flex flex-col min-w-0">
                {!selectedType ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-5xl mb-3 block">touch_app</span>
                            <p className="text-sm">Selecione um tipo para configurar seus atributos</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    {selectedType.description}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {configs.length} atributo{configs.length !== 1 ? 's' : ''} configurado{configs.length !== 1 ? 's' : ''}
                                </p>
                                {editingNamingPattern ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={namingPatternValue}
                                            onChange={(e) => setNamingPatternValue(e.target.value)}
                                            placeholder="Ex: {type} {brand} {model}"
                                            className="flex-1 text-xs font-mono px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveNamingPattern();
                                                if (e.key === 'Escape') setEditingNamingPattern(false);
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveNamingPattern}
                                            disabled={savingNamingPattern}
                                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                        >
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        </button>
                                        <button
                                            onClick={() => setEditingNamingPattern(false)}
                                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setNamingPatternValue(selectedType.namingPattern || '');
                                            setEditingNamingPattern(true);
                                        }}
                                        className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary font-mono bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded inline-flex transition-colors group"
                                        title="Clique para editar o padrão de nomeação"
                                    >
                                        <span>Padrão: {selectedType.namingPattern || '(não definido)'}</span>
                                        <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Adicionar Atributo
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingConfigs ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loading size="sm" text="Carregando atributos..." />
                                </div>
                            ) : configs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-5xl mb-3 block">tune</span>
                                    <p className="text-sm mb-1">Nenhum atributo configurado</p>
                                    <p className="text-xs">Clique em "Adicionar Atributo" para começar</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext
                                        items={configs.map(c => c.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {configs.map(config => (
                                                <TypeAttributeItem
                                                    key={config.id}
                                                    config={config}
                                                    onToggleRequired={handleToggleRequired}
                                                    onChangeColSpan={handleChangeColSpan}
                                                    onRemove={handleRemove}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Add Attribute Modal */}
            {selectedType && (
                <AddAttributeModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    assetTypeId={selectedType.id}
                    existingAttributeIds={configs.map(c => c.attributeId)}
                    onAdd={handleAddAttribute}
                />
            )}

            {/* Confirm Remove Modal */}
            <ConfirmDeleteModal
                isOpen={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                onConfirm={confirmRemove}
                title="Remover Atributo"
                message="Tem certeza que deseja remover este atributo do tipo?"
                confirmLabel="Remover"
                loading={isRemoving}
            />
        </div>
    );
};
