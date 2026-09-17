import React, { useState, useEffect } from 'react';
import { LoansChecklist, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { IconButton } from '../../../../components/ui/IconButton';
import { Loading } from '../../../../components/ui/Loading';
import { toast } from 'sonner';

interface LoansChecklistsListProps {
    onSelect: (item: LoansChecklist) => void;
    onAdd: () => void;
}

export const LoansChecklistsList: React.FC<LoansChecklistsListProps> = ({ onSelect, onAdd }) => {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<LoansChecklist[]>([]);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [itemAssetTypes, setItemAssetTypes] = useState<Record<string, string[]>>({});
    const [itemInUse, setItemInUse] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [checklists, types] = await Promise.all([
                dataService.getLoansChecklists(),
                dataService.getAssetTypes(),
            ]);
            setItems(checklists);
            setAssetTypes(types);

            const associations: Record<string, string[]> = {};
            const inUse: Record<string, boolean> = {};

            await Promise.all(
                checklists.map(async (item) => {
                    try {
                        const typeIds = await dataService.getLoansChecklistAssetTypes(item.id);
                        associations[item.id] = typeIds;
                    } catch {
                        associations[item.id] = [];
                    }
                    try {
                        inUse[item.id] = await dataService.isLoansChecklistInUse(item.id);
                    } catch {
                        inUse[item.id] = false;
                    }
                })
            );
            setItemAssetTypes(associations);
            setItemInUse(inUse);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (itemInUse[id]) {
            toast.warning('Este item está vinculado a empréstimo(s) e não pode ser excluído');
            return;
        }
        if (!window.confirm('Tem certeza que deseja excluir este item?')) return;

        try {
            await dataService.deleteLoansChecklist(id);
            setItems(items.filter(item => item.id !== id));
            toast.success('Item excluído com sucesso');
        } catch (error) {
            console.error('Error deleting checklist:', error);
            toast.error('Erro ao excluir item');
        }
    };

    const getAssetTypeNames = (typeIds: string[]): string[] => {
        return typeIds
            .map(id => assetTypes.find(t => t.id === id))
            .filter(Boolean)
            .map(t => t!.description || t!.code);
    };

    const filteredItems = items.filter(item =>
        item.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                        Itens de Checklist
                    </h2>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Item
                    </button>
                </div>

                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar item..."
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-500/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-3xl">checklist</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Nenhum item cadastrado</p>
                        <p className="text-[11px] text-slate-500 mt-1">Crie itens e associe a tipos de ativo</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredItems.map((item) => {
                            const typeIds = itemAssetTypes[item.id] || [];
                            const typeNames = getAssetTypeNames(typeIds);
                            const isInUse = itemInUse[item.id] || false;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-lg">check_box</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {item.description}
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
                                            <div title={isInUse ? 'Vinculado a empréstimo(s)' : ''}>
                                                <IconButton
                                                    icon="delete"
                                                    onClick={() => handleDelete(item.id)}
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={isInUse}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {typeNames.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {typeNames.map((name, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full"
                                                >
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
