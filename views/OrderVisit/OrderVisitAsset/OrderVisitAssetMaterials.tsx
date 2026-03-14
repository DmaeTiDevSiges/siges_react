import React, { useEffect, useState } from 'react';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { dataService } from '../../../services/dataService';
import { Material, OrderVisitAssetMaterial, User } from '../../../types';
import { toast } from 'sonner';
import { ButtonDelete } from '../../../components/ui/ButtonDelete';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';

interface OrderVisitAssetMaterialsProps {
    ovAssetId: string;
    onBack: () => void;
}

export const OrderVisitAssetMaterials: React.FC<OrderVisitAssetMaterialsProps> = ({ ovAssetId, onBack }) => {
    // Basic States
    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<OrderVisitAssetMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCatalog, setShowCatalog] = useState(false);

    // Pagination / Infinite Scroll States
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [providerCompanyId, setProviderCompanyId] = useState<string | null>(null);
    const pageSize = 20;

    // Confirm Delete State
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Form state for adding new material
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [amount, setAmount] = useState('1');
    const { canView } = usePermissions();

    const loadAvailableMaterials = async (isFirstPage: boolean, search: string = '', pCompanyId?: string | null) => {
        try {
            const currentPage = isFirstPage ? 0 : page + 1;
            const currentPCompanyId = pCompanyId !== undefined ? pCompanyId : providerCompanyId;

            if (isFirstPage) {
                // Only show primary loader if list is empty
                if (availableMaterials.length === 0) setLoading(true);
            } else {
                setFetchingMore(true);
            }

            const materials = await dataService.getAvailableMaterials(
                search,
                currentPage,
                pageSize,
                currentPCompanyId || undefined
            );

            if (isFirstPage) {
                setAvailableMaterials(materials);
                setPage(0);
            } else {
                setAvailableMaterials(prev => [...prev, ...materials]);
                setPage(currentPage);
            }

            setHasMore(materials.length === pageSize);
        } catch (error) {
            console.error('Error loading materials catalog:', error);
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [used, user, pCompanyId] = await Promise.all([
                    dataService.getOrderVisitAssetMaterials(ovAssetId),
                    dataService.getCurrentUser(),
                    dataService.getProviderCompanyByOvAssetId(ovAssetId)
                ]);
                setUsedMaterials(used || []);
                setCurrentUser(user);
                setProviderCompanyId(pCompanyId);

                // Load first page of catalog with provider filter
                await loadAvailableMaterials(true, '', pCompanyId);
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        if (ovAssetId) {
            loadInitialData();
        }
    }, [ovAssetId]);

    // Handle search debounce
    useEffect(() => {
        if (!showCatalog) return;

        const timer = setTimeout(() => {
            loadAvailableMaterials(true, searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, showCatalog]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (!showCatalog || !hasMore || fetchingMore || loading) return;

        const handleObserver = (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            if (target.isIntersecting) {
                loadAvailableMaterials(false, searchTerm);
            }
        };

        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        const target = document.querySelector('#scroll-sentinel');
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [showCatalog, hasMore, fetchingMore, loading, searchTerm, page]);

    const handleAddMaterial = async () => {
        if (!currentUser || !selectedMaterial || !amount) return;

        const qty = parseFloat(amount);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Informe uma quantidade válida');
            return;
        }

        setSaving(selectedMaterial.id);
        try {
            await dataService.addMaterialToAsset(
                ovAssetId,
                selectedMaterial.id,
                qty,
                selectedMaterial.defaultValue,
                currentUser.id
            );

            // Refresh used list
            const updated = await dataService.getOrderVisitAssetMaterials(ovAssetId);
            setUsedMaterials(updated);

            toast.success('Material adicionado');
            setShowCatalog(false);
            setSelectedMaterial(null);
            setAmount('1');
        } catch (error) {
            console.error('Error adding material:', error);
            toast.error('Erro ao adicionar material');
        } finally {
            setSaving(null);
        }
    };

    const handleUpdateMaterial = async (id: string, field: 'amount' | 'discount', value: string) => {
        // Optimistic update
        const newValue = parseFloat(value.replace(',', '.')) || 0;
        setUsedMaterials(prev => prev.map(m => {
            if (m.id !== id) return m;

            const newAmount = field === 'amount' ? newValue : m.amount;
            const newDiscount = field === 'discount' ? newValue : (m.discount || 0); // Assuming 0 as base if null

            // Calculate total: Amount * Unit Value * Discount Factor (if discount works as a multiplier/factor) 
            // OR Amount * Unit Value - Discount
            // Based on previous step formula: amount * valueUnit * discount

            // If discount is a multiplier (e.g. 1.0 = full price, 0.9 = 10% off), then:
            // But user input '6,0000' resulted in a high value, suggesting 'discount' might be a multiplier 
            // OR it adds/multiplies to the result.
            // Following the logic: Total = Qty * UnitPrice * A/D

            return {
                ...m,
                [field]: newValue,
                valueTotal: newAmount * m.valueUnit * (field === 'discount' ? newValue : (m.discount || 1)) // Default to 1 if undefined for multiplication
            };
        }));

        try {
            await dataService.updateMaterialInAsset(id, { [field]: newValue });
        } catch (error) {
            console.error('Error updating material:', error);
            toast.error('Erro ao atualizar material');
            // Revert changes if needed (could re-fetch or store previous state)
        }
    };

    const handleRemoveMaterial = (id: string) => {
        setItemToDelete(id);
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !currentUser) return;

        setSaving(itemToDelete);
        try {
            await dataService.removeMaterialFromAsset(itemToDelete, currentUser.id);
            setUsedMaterials(prev => prev.filter(m => m.id !== itemToDelete));
            toast.success('Material removido');
        } catch (error) {
            console.error('Error removing material:', error);
            toast.error('Erro ao remover material');
        } finally {
            setSaving(null);
            setItemToDelete(null);
        }
    };

    if (loading && usedMaterials.length === 0 && availableMaterials.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center p-8">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    MATERIAIS UTILIZADOS
                </h2>
                {!showCatalog && (
                    <button
                        onClick={() => setShowCatalog(true)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </button>
                )}
            </div>

            {showCatalog ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                    {/* Catalog Search */}
                    <div className="relative group focus-within:scale-[1.02] transition-all duration-300">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-lg group-focus-within:text-blue-500 transition-colors">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar no catálogo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {selectedMaterial ? (
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                        {selectedMaterial.description}
                                    </span>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                                        Unidade: {selectedMaterial.unit}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedMaterial(null)} className="text-blue-400 hover:text-blue-600">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Quantidade</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleAddMaterial}
                                        disabled={!!saving}
                                        className="h-[46px] px-6 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? '...' : 'Adicionar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableMaterials.length === 0 && !loading ? (
                                <div className="py-12 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum material encontrado</p>
                                </div>
                            ) : (
                                <>
                                    {availableMaterials.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMaterial(m)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
                                        >
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{m.code}</p>
                                                <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase leading-none mt-1">{m.description}</p>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 inline-block">{m.unit}</span>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                                        </button>
                                    ))}

                                    {/* Sentinel for Infinite Scroll */}
                                    <div id="scroll-sentinel" className="h-4 flex items-center justify-center py-4">
                                        {fetchingMore && (
                                            <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {usedMaterials.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-2xl text-slate-300">inventory</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Nenhum material <br /> registrado neste ativo.
                            </p>
                            <button
                                onClick={() => setShowCatalog(true)}
                                className="mt-4 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                            >
                                Adicionar Primeiro
                            </button>
                        </div>
                    ) : (
                        usedMaterials.map(item => (
                            <div
                                key={item.id}
                                className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                            >
                                {/* Header with icon, title and delete button */}
                                <div className="flex items-start justify-between p-4 pb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                            {item.materialCode}
                                        </p>
                                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide leading-tight mt-1">
                                            {item.materialDescription}
                                        </h3>


                                        {canView('orders_visits_costs') && (
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                                {item.valueUnit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {item.materialUnit}
                                            </p>
                                        )}
                                    </div>
                                    <ButtonDelete
                                        onClick={() => handleRemoveMaterial(item.id)}
                                        disabled={!!saving && saving === item.id}
                                        icon="delete"
                                    />
                                </div>

                                {/* Grid with quantity, discount and total */}
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                Quantidade
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    defaultValue={item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    onBlur={(e) => handleUpdateMaterial(item.id, 'amount', e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    className="w-full text-base font-black text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                                                />
                                                <span className="text-xs font-bold text-slate-400 uppercase shrink-0">{item.materialUnit}</span>
                                            </div>
                                        </div>
                                        {canView('orders_visits_costs') && (
                                            <>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                        A / D
                                                    </p>
                                                    <input
                                                        type="text"
                                                        defaultValue={item.discount?.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                                                        onBlur={(e) => handleUpdateMaterial(item.id, 'discount', e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                        className="w-full text-base font-black text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                                                    />
                                                </div>
                                                <div className="text-right flex flex-col items-end justify-end">
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                        Total
                                                    </p>
                                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 py-1.5">
                                                        {item.valueTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                </div>
            )}
            {/* Total Services Outside Card */}
            {usedMaterials.length > 0 && !showCatalog && canView('orders_visits_costs') && (
                <div className="flex flex-col items-end pt-4 px-4">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">
                        TOTAL MATERIAIS
                    </p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        {usedMaterials.reduce((sum, item) => sum + (item.valueTotal || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Remover Material"
                description="Tem certeza que deseja remover este material? O valor total será recalculado."
                confirmText="REMOVER"
                isLoading={!!saving && saving === itemToDelete}
            />
            {/* Botão de Conclusão / Voltar */}
            {!showCatalog && (
                <div className="pt-8 pb-12">
                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-lg group-hover:animate-pulse">description</span>
                        CONTINUAR PREENCHIMENTO DO RELATÓRIO
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold text-center mt-3 uppercase tracking-tighter">
                        As alterações são salvas automaticamente
                    </p>
                </div>
            )}
        </div>
    );
};
