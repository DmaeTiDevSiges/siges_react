import React, { useState, useEffect, useRef } from 'react';
import { AssetAttribute, AssetAttributeGroup } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { Modal } from '../../../../components/ui/Modal';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { Loading } from '../../../../components/ui/Loading';
import { IconButton } from '../../../../components/ui/IconButton';

interface AddAttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetTypeId: string;
    existingAttributeIds: string[];
    onAdd: (attribute: AssetAttribute, config: { isRequired: boolean; colSpan: number }) => void;
}

export const AddAttributeModal: React.FC<AddAttributeModalProps> = ({
    isOpen,
    onClose,
    assetTypeId,
    existingAttributeIds,
    onAdd
}) => {
    const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [availableAttributes, setAvailableAttributes] = useState<AssetAttribute[]>([]);
    const [isRequired, setIsRequired] = useState(false);
    const [colSpan, setColSpan] = useState(6);
    const [isCreating, setIsCreating] = useState(false);

    const [newAttr, setNewAttr] = useState({
        fieldKey: '',
        label: '',
        dataType: 'text' as 'text' | 'number' | 'date' | 'boolean' | 'select',
        unit: '',
        decimals: 0,
        selectOptionsGroupId: '' as string
    });

    const [availableGroups, setAvailableGroups] = useState<AssetAttributeGroup[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadAvailableAttributes();
            loadGroups();
            setSearch('');
            setIsRequired(false);
            setColSpan(6);
            setNewAttr({ fieldKey: '', label: '', dataType: 'text', unit: '', decimals: 0, selectOptionsGroupId: '' });
            setActiveTab('existing');
        }
    }, [isOpen]);

    const loadAvailableAttributes = async () => {
        setLoading(true);
        try {
            const all = await dataService.getAllAssetAttributes();
            const filtered = all.filter(a => !existingAttributeIds.includes(a.id));
            setAvailableAttributes(filtered);
        } catch (error) {
            console.error('Error loading attributes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGroups = async () => {
        try {
            const groups = await dataService.getAttributeGroups();
            setAvailableGroups(groups);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const filteredAttributes = availableAttributes.filter(a =>
        a.label.toLowerCase().includes(search.toLowerCase()) ||
        a.fieldKey.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddExisting = (attr: AssetAttribute) => {
        onAdd(attr, { isRequired, colSpan });
        onClose();
    };

    const handleCreateAndAdd = async () => {
        if (!newAttr.fieldKey || !newAttr.label) return;
        setIsCreating(true);
        try {
            const created = await dataService.createAssetAttribute({
                fieldKey: newAttr.fieldKey,
                label: newAttr.label,
                dataType: newAttr.dataType,
                unit: newAttr.unit || undefined,
                decimals: newAttr.decimals,
                selectOptionsGroupId: newAttr.dataType === 'select' && newAttr.selectOptionsGroupId ? newAttr.selectOptionsGroupId : undefined
            });
            onAdd(created, { isRequired, colSpan });
            onClose();
        } catch (error) {
            console.error('Error creating attribute:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Atributo"
            maxWidth="lg"
            fullScreenMobile
        >
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('existing')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'existing'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        Vincular Existente
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'new'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        Criar Novo
                    </button>
                </div>

                {/* Config Options */}
                <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={(e) => setIsRequired(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Obrigatório</span>
                    </label>
                    <Select
                        value={String(colSpan)}
                        onChange={(e) => setColSpan(parseInt(e.target.value))}
                        className="w-24 text-sm"
                    >
                        <option value="3">3 col.</option>
                        <option value="4">4 col.</option>
                        <option value="6">6 col.</option>
                        <option value="12">12 col.</option>
                    </Select>
                </div>

                {activeTab === 'existing' ? (
                    <>
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar atributos..."
                        />
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <Loading size="sm" />
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {filteredAttributes.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        {search ? 'Nenhum atributo encontrado' : 'Todos os atributos já estão vinculados'}
                                    </div>
                                ) : (
                                    filteredAttributes.map(attr => (
                                        <div
                                            key={attr.id}
                                            onClick={() => handleAddExisting(attr)}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary cursor-pointer transition-colors"
                                        >
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white text-sm">
                                                    {attr.label}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <span className="font-mono">{attr.fieldKey}</span>
                                                    {attr.unit && <span>({attr.unit})</span>}
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-400">add_circle</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-3">
                        <Input
                            label="Chave do Campo"
                            placeholder="ex: power_kw"
                            value={newAttr.fieldKey}
                            onChange={(e) => setNewAttr({ ...newAttr, fieldKey: e.target.value })}
                            required
                        />
                        <Input
                            label="Nome de Exibição"
                            placeholder="ex: Potência"
                            value={newAttr.label}
                            onChange={(e) => setNewAttr({ ...newAttr, label: e.target.value })}
                            required
                        />
                        <Select
                            label="Tipo de Dado"
                            value={newAttr.dataType}
                            onChange={(e) => setNewAttr({ ...newAttr, dataType: e.target.value as 'text' | 'number' | 'date' | 'boolean' | 'select' })}
                        >
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="date">Data</option>
                            <option value="boolean">Sim/Não</option>
                            <option value="select">Seleção</option>
                        </Select>
                        {newAttr.dataType === 'select' && (
                            <Select
                                label="Grupo de Opções"
                                value={newAttr.selectOptionsGroupId}
                                onChange={(e) => setNewAttr({ ...newAttr, selectOptionsGroupId: e.target.value })}
                                placeholder="Selecione um grupo..."
                            >
                                <option value="">Nenhum grupo</option>
                                {availableGroups.map(group => (
                                    <option key={group.id} value={group.id}>{group.group}</option>
                                ))}
                            </Select>
                        )}
                        <Input
                            label="Unidade"
                            placeholder="ex: kW, V, A"
                            value={newAttr.unit}
                            onChange={(e) => setNewAttr({ ...newAttr, unit: e.target.value })}
                        />
                        {newAttr.dataType === 'number' && (
                            <Input
                                label="Casas Decimais"
                                type="number"
                                min="0"
                                max="6"
                                value={String(newAttr.decimals)}
                                onChange={(e) => setNewAttr({ ...newAttr, decimals: parseInt(e.target.value) || 0 })}
                            />
                        )}
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleCreateAndAdd}
                            disabled={!newAttr.fieldKey || !newAttr.label}
                            loading={isCreating}
                        >
                            Criar e Vincular
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
