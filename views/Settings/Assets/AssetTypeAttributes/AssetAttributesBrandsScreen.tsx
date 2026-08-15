import React, { useState, useEffect } from 'react';
import { AssetAttributeGroup, AssetAttributeGroupOption } from '../../../../types';
import { assetAttributeGroupsService } from '../../../../services/assets/assetAttributeGroupsService';
import { Loading } from '../../../../components/ui/Loading';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { IconButton } from '../../../../components/ui/IconButton';
import { ConfirmDeleteModal } from '../../../../components/ui/ConfirmDeleteModal';
import { toast } from 'sonner';

export const AssetAttributesBrandsScreen: React.FC = () => {
    const [groups, setGroups] = useState<AssetAttributeGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<AssetAttributeGroup | null>(null);
    const [options, setOptions] = useState<AssetAttributeGroupOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [editingGroup, setEditingGroup] = useState<AssetAttributeGroup | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupDesc, setEditGroupDesc] = useState('');
    const [newOptionName, setNewOptionName] = useState('');
    const [newOptionDesc, setNewOptionDesc] = useState('');
    const [editingOption, setEditingOption] = useState<AssetAttributeGroupOption | null>(null);
    const [editOptionName, setEditOptionName] = useState('');
    const [editOptionDesc, setEditOptionDesc] = useState('');
    const [removeTarget, setRemoveTarget] = useState<{ type: 'group' | 'option'; id: string } | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadOptions(selectedGroup.id);
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const data = await assetAttributeGroupsService.getGroups();
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async (groupId: string) => {
        setLoadingOptions(true);
        try {
            const data = await assetAttributeGroupsService.getOptionsByGroup(groupId);
            setOptions(data);
        } catch (error) {
            console.error('Error loading options:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const created = await assetAttributeGroupsService.createGroup(newGroupName.trim(), newGroupDesc.trim() || undefined);
            setGroups(prev => [...prev, created].sort((a, b) => a.group.localeCompare(b.group)));
            setNewGroupName('');
            setNewGroupDesc('');
            setIsCreatingGroup(false);
            toast.success('Grupo criado!');
        } catch (error: any) {
            if (error?.message?.includes('unique')) {
                toast.error('Já existe um grupo com esse nome.');
            } else {
                toast.error('Erro ao criar grupo.');
            }
        }
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup || !editGroupName.trim()) return;
        try {
            await assetAttributeGroupsService.updateGroup(editingGroup.id, editGroupName.trim(), editGroupDesc.trim() || undefined);
            setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, group: editGroupName.trim(), description: editGroupDesc.trim() } : g));
            if (selectedGroup?.id === editingGroup.id) {
                setSelectedGroup(prev => prev ? { ...prev, group: editGroupName.trim(), description: editGroupDesc.trim() } : null);
            }
            setEditingGroup(null);
            toast.success('Grupo atualizado!');
        } catch (error: any) {
            if (error?.message?.includes('unique')) {
                toast.error('Já existe um grupo com esse nome.');
            } else {
                toast.error('Erro ao atualizar grupo.');
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (!removeTarget || removeTarget.type !== 'group') return;
        setIsRemoving(true);
        try {
            await assetAttributeGroupsService.deleteGroup(removeTarget.id);
            setGroups(prev => prev.filter(g => g.id !== removeTarget.id));
            if (selectedGroup?.id === removeTarget.id) {
                setSelectedGroup(null);
                setOptions([]);
            }
            setRemoveTarget(null);
            toast.success('Grupo removido!');
        } catch (error) {
            toast.error('Erro ao remover grupo.');
        } finally {
            setIsRemoving(false);
        }
    };

    const handleCreateOption = async () => {
        if (!selectedGroup || !newOptionName.trim()) return;
        try {
            const created = await assetAttributeGroupsService.createOption(selectedGroup.id, newOptionName.trim(), newOptionDesc.trim() || undefined);
            setOptions(prev => [...prev, created]);
            setNewOptionName('');
            setNewOptionDesc('');
            toast.success('Opção adicionada!');
        } catch (error: any) {
            if (error?.message?.includes('unique')) {
                toast.error('Já existe uma opção com esse nome neste grupo.');
            } else {
                toast.error('Erro ao adicionar opção.');
            }
        }
    };

    const handleDeleteOption = async () => {
        if (!removeTarget || removeTarget.type !== 'option') return;
        setIsRemoving(true);
        try {
            await assetAttributeGroupsService.deleteOption(removeTarget.id);
            setOptions(prev => prev.filter(o => o.id !== removeTarget.id));
            setRemoveTarget(null);
            toast.success('Opção removida!');
        } catch (error) {
            toast.error('Erro ao remover opção.');
        } finally {
            setIsRemoving(false);
        }
    };

    const handleUpdateOption = async () => {
        if (!editingOption || !editOptionName.trim()) return;
        try {
            await assetAttributeGroupsService.updateOption(editingOption.id, editOptionName.trim(), editOptionDesc.trim() || undefined);
            setOptions(prev => prev.map(o => o.id === editingOption.id ? { ...o, group: editOptionName.trim(), description: editOptionDesc.trim() } : o));
            setEditingOption(null);
            toast.success('Opção atualizada!');
        } catch (error: any) {
            if (error?.message?.includes('unique')) {
                toast.error('Já existe uma opção com esse nome neste grupo.');
            } else {
                toast.error('Erro ao atualizar opção.');
            }
        }
    };

    const handleConfirmDelete = () => {
        if (removeTarget?.type === 'group') handleDeleteGroup();
        else handleDeleteOption();
    };

    return (
        <div className="flex h-full bg-background-light dark:bg-background-dark">
            {/* Left Panel - Groups */}
            <div className="w-80 border-r border-slate-200 dark:border-white/10 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Grupos</h2>
                        <Button variant="primary" onClick={() => setIsCreatingGroup(true)}>
                            <span className="material-symbols-outlined text-[16px]">add</span>
                        </Button>
                    </div>
                    {isCreatingGroup && (
                        <div className="space-y-2 mb-3">
                            <Input
                                placeholder="Nome do grupo"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                            <Input
                                placeholder="Descrição"
                                value={newGroupDesc}
                                onChange={e => setNewGroupDesc(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button variant="primary" fullWidth onClick={handleCreateGroup} disabled={!newGroupName.trim()}>Salvar</Button>
                                <Button variant="ghost" onClick={() => { setIsCreatingGroup(false); setNewGroupName(''); setNewGroupDesc(''); }}>Cancelar</Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loading size="sm" /></div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">Nenhum grupo cadastrado</div>
                    ) : (
                        groups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-white/5 transition-colors ${
                                    selectedGroup?.id === group.id
                                        ? 'bg-primary/10 border-l-2 border-l-primary'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    {editingGroup?.id === group.id ? (
                                        <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                            <Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} autoFocus className="text-xs!" />
                                            <div className="flex gap-1">
                                                <Button variant="primary" onClick={handleUpdateGroup} disabled={!editGroupName.trim()}>OK</Button>
                                                <Button variant="ghost" onClick={() => setEditingGroup(null)}>X</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{group.group}</p>
                                            {group.description && <p className="text-[10px] text-slate-400 truncate">{group.description}</p>}
                                        </>
                                    )}
                                </div>
                                {editingGroup?.id !== group.id && (
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <IconButton icon="edit" variant="ghost" className="text-slate-400! w-6! h-6!" onClick={() => { setEditingGroup(group); setEditGroupName(group.group); setEditGroupDesc(group.description || ''); }} />
                                        <IconButton icon="delete" variant="ghost" className="text-slate-400! hover:text-red-500! w-6! h-6!" onClick={() => setRemoveTarget({ type: 'group', id: group.id })} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Options */}
            <div className="flex-1 flex flex-col">
                {selectedGroup ? (
                    <>
                        <div className="p-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                Opções de {selectedGroup.group}
                            </h2>
                        </div>
                        <div className="p-4 border-b border-slate-200 dark:border-white/10">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nome da opção"
                                    value={newOptionName}
                                    onChange={e => setNewOptionName(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Descrição (opcional)"
                                    value={newOptionDesc}
                                    onChange={e => setNewOptionDesc(e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="primary" onClick={handleCreateOption} disabled={!newOptionName.trim()}>
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingOptions ? (
                                <div className="flex justify-center py-8"><Loading size="sm" /></div>
                            ) : options.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                                    <p className="text-xs">Nenhuma opção cadastrada</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {options.map(option => (
                                        <div key={option.id} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                {editingOption?.id === option.id ? (
                                                    <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                                        <Input value={editOptionName} onChange={e => setEditOptionName(e.target.value)} autoFocus className="text-xs!" />
                                                        <Input value={editOptionDesc} onChange={e => setEditOptionDesc(e.target.value)} placeholder="Descrição" className="text-xs!" />
                                                        <div className="flex gap-1">
                                                            <Button variant="primary" onClick={handleUpdateOption} disabled={!editOptionName.trim()}>OK</Button>
                                                            <Button variant="ghost" onClick={() => setEditingOption(null)}>X</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{option.group}</p>
                                                        {option.description && <p className="text-[10px] text-slate-400 truncate">{option.description}</p>}
                                                    </>
                                                )}
                                            </div>
                                            {editingOption?.id !== option.id && (
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    <IconButton
                                                        icon="edit"
                                                        variant="ghost"
                                                        className="text-slate-400! w-6! h-6!"
                                                        onClick={() => { setEditingOption(option); setEditOptionName(option.group); setEditOptionDesc(option.description || ''); }}
                                                    />
                                                    <IconButton
                                                        icon="delete"
                                                        variant="ghost"
                                                        className="text-slate-400! hover:text-red-500!"
                                                        onClick={() => setRemoveTarget({ type: 'option', id: option.id })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
                        <p className="text-sm">Selecione um grupo para ver as opções</p>
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                isOpen={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                onConfirm={handleConfirmDelete}
                title={removeTarget?.type === 'group' ? 'Remover Grupo' : 'Remover Opção'}
                description={removeTarget?.type === 'group' ? 'Todas as opções vinculadas também serão removidas. Tem certeza?' : 'Tem certeza que deseja remover esta opção?'}
                isLoading={isRemoving}
            />
        </div>
    );
};
