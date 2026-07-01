import React, { useState, useEffect, useRef } from 'react';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { dataService } from '../../../services/dataService';
import { Material, OrderVisitAssetMaterial, User } from '../../../types';
import { toast } from 'sonner';
import { Card } from '../../../components/ui/Card';
import { ButtonDelete } from '../../../components/ui/ButtonDelete';
import { ButtonNew } from '../../../components/ui/ButtonNew';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { Loading } from '../../../components/ui/Loading';


interface OrderVisitAssetMaterialsProps {
    ovAssetId: string;
    onBack: () => void;
}

export const OrderVisitAssetMaterials: React.FC<OrderVisitAssetMaterialsProps> = ({ ovAssetId, onBack }) => {
    const [usedMaterials, setUsedMaterials] = useState<OrderVisitAssetMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [providerCompanyId, setProviderCompanyId] = useState<string | null>(null);

    // Add Material State
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingMaterialId, setAddingMaterialId] = useState<string | null>(null);
    const [successMaterialId, setSuccessMaterialId] = useState<string | null>(null);

    // Debounce Ref
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { canView } = usePermissions();

    useEffect(() => {
        loadInitialData();
    }, [ovAssetId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [user, pCompanyId] = await Promise.all([
                dataService.getCurrentUser(),
                dataService.getProviderCompanyByOvAssetId(ovAssetId)
            ]);
            setCurrentUser(user);
            setProviderCompanyId(pCompanyId);
            await loadUsedMaterials();
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadUsedMaterials = async () => {
        try {
            const used = await dataService.getOrderVisitAssetMaterials(ovAssetId);
            setUsedMaterials(used || []);
        } catch (error) {
            console.error('Error mapping used materials', error);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (term.length < 2) {
            setAvailableMaterials([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                // Fetch first 20 results that match the search term
                const results = await dataService.getAvailableMaterials(term, 0, 20, providerCompanyId || undefined);
                setAvailableMaterials(results);
            } catch (error) {
                console.error('Error searching materials:', error);
            } finally {
                setSearching(false);
            }
        }, 500);
    };

    const filteredSearchResults = availableMaterials.filter(m => {
        const alreadyAdded = usedMaterials.some(um => um.materialId === m.id);
        return !alreadyAdded;
    });

    const handleAddMaterial = async (material: Material, userId: string) => {
        try {
            setAddingMaterialId(material.id);
            await dataService.addMaterialToAsset(
                ovAssetId,
                material.id,
                1, // default 1
                material.priceUnit || 0,
                userId
            );
            
            setAddingMaterialId(null);
            setSuccessMaterialId(material.id);
            toast.success('Material adicionado!');
            
            setTimeout(() => {
                setSuccessMaterialId(null);
            }, 1500);

            loadUsedMaterials();
        } catch (error) {
            console.error('Error adding material:', error);
            toast.error('Erro ao adicionar material');
            setAddingMaterialId(null);
        }
    };

    const [materialToDelete, setMaterialToDelete] = useState<OrderVisitAssetMaterial | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemoveMaterial = (m: OrderVisitAssetMaterial) => {
        setMaterialToDelete(m);
    };

    const confirmRemoveMaterial = async () => {
        if (!materialToDelete || !currentUser) return;
        setIsDeleting(true);
        try {
            await dataService.removeMaterialFromAsset(materialToDelete.id, currentUser.id);
            toast.success('Material removido com sucesso!');
            setUsedMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
            setMaterialToDelete(null);
        } catch (error) {
            console.error('Error removing material:', error);
            toast.error('Erro ao remover material');
        } finally {
            setIsDeleting(false);
        }
    };

    // State to track raw input values during typing
    const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

    const handleUpdateField = async (id: string, field: 'amount' | 'discount' | 'valueUnit', value: string) => {
        // Sanitize input to allow only numbers and decimal block
        let sanitized = value.replace(/[^\d.,]/g, '');
        sanitized = sanitized.replace(',', '.');

        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }

        const maxDecimals = field === 'discount' ? 4 : 2;
        if (parts.length === 2 && parts[1].length > maxDecimals) {
            sanitized = parts[0] + '.' + parts[1].substring(0, maxDecimals);
        }

        const displayValue = sanitized.replace('.', ',');
        const inputKey = `${id}_${field}`;
        setRawInputs(prev => ({ ...prev, [inputKey]: displayValue }));

        const numValue = parseFloat(sanitized);

        if (isNaN(numValue) || numValue < 0 || sanitized.endsWith('.')) {
            return;
        }

        // Optimistic update
        setUsedMaterials(prev => prev.map(m => {
            if (m.id === id) {
                const newAmount = field === 'amount' ? numValue : (m.amount || 0);
                const newDiscount = field === 'discount' ? numValue : (m.discount || 0);
                const newValueUnit = field === 'valueUnit' ? numValue : (m.valueUnit || 0);
                return {
                    ...m,
                    [field]: numValue,
                    valueTotal: newAmount * newValueUnit * (newDiscount || 1) // default multiplier assumption
                };
            }
            return m;
        }));

        try {
            const dbField = field === 'valueUnit' ? 'valueUnit' : field;
            await dataService.updateMaterialInAsset(id, { [dbField]: numValue });
        } catch (error) {
            console.error(`Error updating material ${field}:`, error);
            toast.error('Erro ao atualizar material');
            loadUsedMaterials();
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] justify-center items-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                            MATERIAIS UTILIZADOS
                        </h2>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setSearchTerm('');
                        setAvailableMaterials([]);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isAdding
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20'
                        }`}
                >
                    {isAdding ? (
                        <>
                            <span className="material-symbols-outlined text-sm">close</span>
                            CANCELAR
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-sm">add</span>
                            ASSOCIAR
                        </>
                    )}
                </button>
            </div>

            {!providerCompanyId && !loading && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold text-center">
                    COMPANHIA NÃO VINCULADA PARA ESTE ATIVO
                </div>
            )}

            {/* Add Material Search Area */}
            {isAdding && (
                <div className="animate-in slide-in-from-top-2 duration-300 mb-6 space-y-2">
                    <div className="relative group focus-within:scale-[1.02] transition-all duration-300">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar material na base..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                onClick={() => handleSearch('')}
                                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>

                    {searching && (
                        <div className="p-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            BUSCANDO...
                        </div>
                    )}

                    {!searching && searchTerm.length >= 2 && filteredSearchResults.length === 0 && (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">search_off</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                NENHUM MATERIAL NÃO-ASSOCIADO <br/> ENCONTRADO PARA "{searchTerm}"
                            </p>
                        </div>
                    )}

                    {!searching && searchTerm.length < 2 && (
                        <div className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Digite pelo menos 2 letras para buscar.
                        </div>
                    )}

                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                        {filteredSearchResults.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-all">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                                        {m.code}
                                    </p>
                                    <p className="font-black text-slate-700 dark:text-slate-200 text-xs leading-tight">
                                        {m.description}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                        Medida: <span className="text-indigo-500">{m.unit}</span>
                                    </p>
                                </div>
                                <ButtonNew
                                    isLoading={addingMaterialId === m.id}
                                    isSuccess={successMaterialId === m.id}
                                    onClick={() => handleAddMaterial(m, currentUser?.id || '')}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid gap-4 pb-12">
                {usedMaterials.length === 0 && !isAdding && (
                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl group transition-all">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                            <span className="material-symbols-outlined text-3xl">inventory_2</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Nenhum material registrado <br /> neste ativo.
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-4 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
                        >
                            Clique para Adicionar
                        </button>
                    </div>
                )}

                {usedMaterials.map(m => (
                    <Card key={m.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl relative">
                        {/* Status bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        
                        <div className="flex items-start justify-between mb-4 pl-2">
                            <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase leading-snug">
                                    {m.materialDescription}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                                    {m.materialCode} {canView('orders_visits_costs') && `• ${m.valueUnit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`} / {m.materialUnit}
                                </p>
                            </div>

                            <ButtonDelete
                                onClick={() => handleRemoveMaterial(m)}
                                icon="delete"
                            />
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 pl-2">
                            <div className="flex items-center gap-2 w-full pr-1">
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 focus-within:text-indigo-500 text-center">
                                        QTD
                                    </label>
                                    <div className="flex items-center gap-1.5 justify-center relative">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={rawInputs[`${m.id}_amount`] ?? (m.amount % 1 === 0 ? m.amount.toString() : m.amount.toFixed(2).replace('.', ','))}
                                            onChange={(e) => handleUpdateField(m.id, 'amount', e.target.value)}
                                            onBlur={() => setRawInputs(prev => {
                                                const news = { ...prev };
                                                delete news[`${m.id}_amount`];
                                                return news;
                                            })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 p-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                {canView('orders_visits_costs') && (
                                    <>
                                        <div className="flex-[1.2]">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 focus-within:text-indigo-500 text-center">
                                                Vlr.Unit
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={rawInputs[`${m.id}_valueUnit`] ?? (m.valueUnit % 1 === 0 ? m.valueUnit.toString() : m.valueUnit.toFixed(2).replace('.', ','))}
                                                onChange={(e) => handleUpdateField(m.id, 'valueUnit', e.target.value)}
                                                onBlur={() => setRawInputs(prev => {
                                                    const news = { ...prev };
                                                    delete news[`${m.id}_valueUnit`];
                                                    return news;
                                                })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 p-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                                            />
                                        </div>

                                        <div className="flex-[0.9]">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 focus-within:text-indigo-500 text-center">
                                                A / D
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={rawInputs[`${m.id}_discount`] ?? (m.discount % 1 === 0 ? m.discount.toString() : m.discount.toFixed(4).replace('.', ','))}
                                                onChange={(e) => handleUpdateField(m.id, 'discount', e.target.value)}
                                                onBlur={() => setRawInputs(prev => {
                                                    const news = { ...prev };
                                                    delete news[`${m.id}_discount`];
                                                    return news;
                                                })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 p-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {canView('orders_visits_costs') && (
                                <div className="flex justify-end items-center gap-1 mt-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TOTAL</span>
                                    <span className="text-[13px] sm:text-[15px] font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                        {m.valueTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Back Button */}
            {!isAdding && (
                <div className="pb-8">
                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-lg group-hover:animate-pulse">arrow_back</span>
                        VOLTAR AO RELATÓRIO
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold text-center mt-3 uppercase tracking-tighter">
                        As alterações são salvas automaticamente
                    </p>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmDeleteModal
                isOpen={!!materialToDelete}
                onClose={() => setMaterialToDelete(null)}
                onConfirm={confirmRemoveMaterial}
                title="Remover Material"
                description={
                    materialToDelete ? (
                        <>
                            Confirma a remoção do material <strong className="text-slate-700 dark:text-slate-200">{materialToDelete.materialDescription}</strong>?
                        </>
                    ) : undefined
                }
                isLoading={isDeleting}
            />
        </div>
    );
};

