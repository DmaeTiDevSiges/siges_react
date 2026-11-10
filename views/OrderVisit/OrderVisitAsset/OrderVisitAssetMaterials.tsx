/**
 * OrderVisitAssetMaterials — materiais usados no ativo durante a visita.
 *
 * Layout por largura do próprio conteúdo (container queries):
 *  - celular: busca no topo, resultados, depois "Neste ativo" em cartões;
 *  - desktop: catálogo à esquerda e tabela "Neste ativo" à direita.
 * Nos dois: barra fixa no rodapé com total, estado do salvamento e Voltar.
 *
 * Edição de quantidade / valor unitário / A-D:
 *  - grava ~1 s depois de parar de digitar (ou ao sair do campo / ao usar − +),
 *    uma gravação por material por vez, na ordem;
 *  - o total mostrado usa a mesma conta do banco
 *    (trigger fc_orders_visits_assets_materials_update_value_total:
 *     amount * value_unit * COALESCE(discount, 1)) e, após gravar, é trocado
 *    pelo valor oficial devolvido pelo servidor.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCostRowEditor } from '../../../hooks/useCostRowEditor';
import { AD_TOOLTIP, AdjustHint, CostSaveStatus, NumberInput, QtyStepper, appLabelClass, brl } from '../../../components/ordersVisits/ordersVisitsCosts/CostFields';
import { toast } from 'sonner';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { dataService } from '../../../services/dataService';
import { Material, OrderVisitAssetMaterial, OrderVisitAssetView } from '../../../types';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Loading } from '../../../components/ui/Loading';
import { OrderVisitAssetCardDetail } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail';

interface OrderVisitAssetMaterialsProps {
    ovAssetId: string;
    onBack: () => void;
}

export const OrderVisitAssetMaterials: React.FC<OrderVisitAssetMaterialsProps> = ({ ovAssetId, onBack }) => {
    const { canView } = usePermissions();
    const showCosts = canView('orders_visits_costs');
    const { currentUser: authUser } = useAuth();

    const [usedMaterials, setUsedMaterials] = useState<OrderVisitAssetMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [providerCompanyId, setProviderCompanyId] = useState<string | null>(null);
    const [asset, setAsset] = useState<OrderVisitAssetView | null>(null);

    // Busca no catálogo
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Material[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchSeqRef = useRef(0);

    // Remoção
    const [materialToDelete, setMaterialToDelete] = useState<OrderVisitAssetMaterial | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const resolveUserId = () => userId || authUser?.id || '';

    const loadUsedMaterials = useCallback(async () => {
        try {
            const used = await dataService.getOrderVisitAssetMaterials(ovAssetId);
            setUsedMaterials(used || []);
            return used || [];
        } catch (error) {
            console.error('Error loading used materials', error);
            return null;
        }
    }, [ovAssetId]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const [user, companyId] = await Promise.all([
                    dataService.getCurrentUser().catch(() => null),
                    dataService.getProviderCompanyByOvAssetId(ovAssetId),
                ]);
                if (!active) return;
                setUserId(user?.id || authUser?.id || '');
                setProviderCompanyId(companyId);
                await loadUsedMaterials();
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                if (active) setLoading(false);
            }
        })();
        dataService.getOrderVisitAssetById(ovAssetId)
            .then(data => { if (active) setAsset(data); })
            .catch(() => undefined);
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ovAssetId]);

    // ── Edição (hooks/useCostRowEditor) ─────────────────────────────────────
    const editor = useCostRowEditor<OrderVisitAssetMaterial>({
        setRows: setUsedMaterials,
        save: (id, updates) => dataService.updateMaterialInAsset(id, updates),
        // Total oficial (trigger do banco) só deste material
        fetchTotal: async (id) => (await dataService.getOrderVisitAssetMaterials(ovAssetId)).find(m => m.id === id)?.valueTotal,
        onError: () => {
            toast.error('Erro ao salvar o material. Os valores foram recarregados.');
            loadUsedMaterials();
        },
    });
    const { saveState, fieldText, change: handleFieldChange, blur: handleFieldBlur, step: handleStep } = editor;

    // ── Catálogo ─────────────────────────────────────────────────────────────

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (term.trim().length < 2 || !providerCompanyId) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const seq = ++searchSeqRef.current;
        searchTimerRef.current = setTimeout(async () => {
            try {
                // Catálogo da empresa prestadora da OS (não a do usuário logado)
                const found = await dataService.getAvailableMaterials(term.trim(), 0, 20, providerCompanyId);
                if (seq === searchSeqRef.current) setResults(found);
            } catch (error) {
                console.error('Error searching materials:', error);
                if (seq === searchSeqRef.current) toast.error('Erro ao buscar materiais');
            } finally {
                if (seq === searchSeqRef.current) setSearching(false);
            }
        }, 400);
    };

    const handleAdd = async (material: Material) => {
        const uid = resolveUserId();
        if (!uid) {
            toast.error('Não foi possível identificar o usuário. Abra a tela novamente.');
            return;
        }
        try {
            setAddingId(material.id);
            await dataService.addMaterialToAsset(ovAssetId, material.id, 1, material.priceUnit || 0, uid);
            await loadUsedMaterials();
        } catch (error) {
            console.error('Error adding material:', error);
            toast.error('Erro ao adicionar material');
        } finally {
            setAddingId(null);
        }
    };

    const confirmRemove = async () => {
        if (!materialToDelete) return;
        const uid = resolveUserId();
        if (!uid) {
            toast.error('Não foi possível identificar o usuário. Abra a tela novamente.');
            return;
        }
        setIsDeleting(true);
        try {
            editor.cancelRow(materialToDelete.id);
            await dataService.removeMaterialFromAsset(materialToDelete.id, uid);
            setUsedMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
            setMaterialToDelete(null);
        } catch (error) {
            console.error('Error removing material:', error);
            toast.error('Erro ao remover material');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] justify-center items-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    // Já no ativo: por id e, como reserva, pelo código (a view pode não trazer material_id)
    const usedIds = new Set(usedMaterials.map(m => m.materialId).filter(Boolean));
    const usedCodes = new Set(usedMaterials.map(m => m.materialCode).filter(c => c && c !== '---'));
    const isInAsset = (m: Material) => usedIds.has(m.id) || (!!m.code && usedCodes.has(m.code));
    const total = usedMaterials.reduce((sum, m) => sum + (m.valueTotal || 0), 0);
    const count = usedMaterials.length;
    const showResults = searchTerm.trim().length >= 2;

    // ── Blocos ───────────────────────────────────────────────────────────────

    const searchPanel = (
        <section className="space-y-3" aria-label="Catálogo de materiais">
            <SearchInput
                inputMode="search"
                aria-label="Buscar material no catálogo"
                placeholder="Buscar material por nome ou código"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onClear={() => handleSearch('')}
                disabled={!providerCompanyId}
                className="text-base"
            />

            {!providerCompanyId && (
                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 text-sm font-bold text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <span className="material-symbols-outlined">domain_disabled</span>
                    A OS não tem empresa prestadora definida. Defina-a para buscar os materiais.
                </div>
            )}

            {providerCompanyId && !showResults && (
                <p className="px-1 text-xs text-slate-500 dark:text-slate-400">Digite pelo menos 2 letras para buscar no catálogo.</p>
            )}

            {showResults && searching && (
                <div className="flex justify-center py-6"><Loading size="xs" /></div>
            )}

            {showResults && !searching && results.length === 0 && providerCompanyId && (
                <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                    <p className="mt-1 text-sm font-bold text-slate-500">Nada encontrado para "{searchTerm}".</p>
                </div>
            )}

            {showResults && !searching && results.length > 0 && (
                <ul className="space-y-2 @4xl/page:max-h-[calc(100vh-18rem)] @4xl/page:overflow-y-auto @4xl/page:pr-1">
                    {results.map(m => {
                        const added = isInAsset(m);
                        const isAdding = addingId === m.id;
                        return (
                            <li
                                key={m.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border ${added
                                    ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <div className="min-w-0 flex-1">
                                    {m.code && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.code}</p>}
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">{m.description}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Unid.: <span className="font-bold text-indigo-500">{m.unit}</span>
                                        {showCosts && m.priceUnit ? <> · {brl(m.priceUnit)}</> : null}
                                    </p>
                                </div>
                                {added ? (
                                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                        No ativo
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleAdd(m)}
                                        disabled={isAdding}
                                        aria-label={`Adicionar ${m.description}`}
                                        className="w-11 h-11 shrink-0 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 disabled:opacity-60"
                                    >
                                        {isAdding
                                            ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            : <span className="material-symbols-outlined">add</span>}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );

    const emptyUsed = (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-3xl text-slate-300">inventory_2</span>
            <p className="mt-1 text-sm font-bold text-slate-500">Nenhum material neste ativo.</p>
            <p className="text-xs text-slate-400">Busque no catálogo e toque em + para adicionar.</p>
        </div>
    );

    const deleteButton = (m: OrderVisitAssetMaterial) => (
        <button
            type="button"
            onClick={() => setMaterialToDelete(m)}
            aria-label={`Remover ${m.materialDescription}`}
            title="Remover material"
            className="w-11 h-11 shrink-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center"
        >
            <span className="material-symbols-outlined">delete</span>
        </button>
    );

    // Celular: cartões
    const usedCards = (
        <ul className="space-y-3 @4xl/page:hidden">
            {usedMaterials.map(m => (
                <li key={m.id} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <span className="absolute left-0 inset-y-0 w-1 bg-indigo-500" aria-hidden="true" />
                    <div className="flex items-start gap-2 pl-1">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-snug">{m.materialDescription}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{m.materialCode}{m.materialUnit ? ` · ${m.materialUnit}` : ''}</p>
                        </div>
                        {deleteButton(m)}
                    </div>

                    <div className="mt-3 pl-1">
                        <span className={appLabelClass}>Quantidade</span>
                        <QtyStepper
                            value={fieldText(m, 'amount')}
                            amount={m.amount || 0}
                            unit={m.materialUnit}
                            onChange={(t) => handleFieldChange(m.id, 'amount', t)}
                            onBlur={() => handleFieldBlur(m.id, 'amount')}
                            onStep={(d) => handleStep(m, d)}
                        />
                    </div>

                    {showCosts && (
                        <div className="mt-3 pl-1 grid grid-cols-2 gap-3">
                            <NumberInput label="Vlr. unit." value={fieldText(m, 'valueUnit')} onChange={(t) => handleFieldChange(m.id, 'valueUnit', t)} onBlur={() => handleFieldBlur(m.id, 'valueUnit')} />
                            <div title={AD_TOOLTIP}>
                                <NumberInput label="A / D (fator)" value={fieldText(m, 'discount')} onChange={(t) => handleFieldChange(m.id, 'discount', t)} onBlur={() => handleFieldBlur(m.id, 'discount')} />
                                <AdjustHint factor={m.discount} />
                            </div>
                        </div>
                    )}

                    {showCosts && (
                        <div className="mt-3 pl-1 flex items-baseline justify-end gap-2">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{brl(m.valueTotal)}</span>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    // Desktop: cada material em duas linhas —
    // 1) descrição + lixeira à direita; 2) quantidade, valores e total.
    const cols = showCosts
        ? 'grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'
        : 'grid-cols-[200px]';
    const usedTable = (
        <ul className="hidden @4xl/page:block space-y-3">
            {usedMaterials.map(m => (
                <li key={m.id} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="absolute left-0 inset-y-0 w-1 bg-indigo-500" aria-hidden="true" />

                    {/* Linha 1: descrição + lixeira */}
                    <div className="flex items-center gap-3 pl-5 pr-2 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-snug">{m.materialDescription}</p>
                            <p className="text-[11px] text-slate-500">{m.materialCode}{m.materialUnit ? ` · ${m.materialUnit}` : ''}</p>
                        </div>
                        {deleteButton(m)}
                    </div>

                    {/* Linha 2: campos */}
                    <div className={`grid ${cols} gap-4 items-start pl-5 pr-4 py-3`}>
                        <div>
                            <span className={appLabelClass}>Quantidade</span>
                            <QtyStepper
                                value={fieldText(m, 'amount')}
                                amount={m.amount || 0}
                                onChange={(t) => handleFieldChange(m.id, 'amount', t)}
                                onBlur={() => handleFieldBlur(m.id, 'amount')}
                                onStep={(d) => handleStep(m, d)}
                            />
                        </div>
                        {showCosts && (
                            <NumberInput label="Vlr. unit." value={fieldText(m, 'valueUnit')} onChange={(t) => handleFieldChange(m.id, 'valueUnit', t)} onBlur={() => handleFieldBlur(m.id, 'valueUnit')} />
                        )}
                        {showCosts && (
                            <div title={AD_TOOLTIP}>
                                <NumberInput label="A / D (fator)" value={fieldText(m, 'discount')} onChange={(t) => handleFieldChange(m.id, 'discount', t)} onBlur={() => handleFieldBlur(m.id, 'discount')} />
                                <AdjustHint factor={m.discount} />
                            </div>
                        )}
                        {showCosts && (
                            <div className="text-right">
                                <span className={appLabelClass}>Total</span>
                                <span className="block h-12 leading-[3rem] text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{brl(m.valueTotal)}</span>
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="@container/page min-h-full flex flex-col">
            <div className="flex-1 w-full max-w-md @4xl/page:max-w-6xl mx-auto py-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] space-y-5 animate-in fade-in duration-300">

                <div className="space-y-5 @4xl/page:space-y-0 @4xl/page:grid @4xl/page:grid-cols-[340px_minmax(0,1fr)] @4xl/page:gap-6 @4xl/page:items-start">
                    {/* Ativo associado + catálogo (no desktop: coluna esquerda fixa) */}
                    <div className="space-y-5 @4xl/page:sticky @4xl/page:top-4">
                        {asset && <OrderVisitAssetCardDetail asset={asset} />}
                        <div>
                            <h3 className="hidden @4xl/page:block mb-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Catálogo</h3>
                            {searchPanel}
                        </div>
                    </div>

                    <section aria-label="Materiais neste ativo">
                        {count === 0 ? emptyUsed : (
                            <>
                                {usedCards}
                                {usedTable}
                            </>
                        )}
                    </section>
                </div>
            </div>

            {/* Barra fixa: total + salvamento + voltar (celular e desktop) */}
            <div className="sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                <div className="w-full max-w-md @4xl/page:max-w-6xl mx-auto flex flex-row-reverse items-center gap-3">
                    <div className="min-w-0 flex-1 text-right">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">
                            {count === 0 ? 'Nenhum material' : `${count} ${count === 1 ? 'material' : 'materiais'}`}
                            {showCosts && count > 0 && <span className="tabular-nums"> · {brl(total)}</span>}
                        </p>
                        <CostSaveStatus state={saveState} align="right" />
                    </div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="shrink-0 h-12 px-5 @4xl/page:px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-500/20 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </button>
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={!!materialToDelete}
                onClose={() => { if (!isDeleting) setMaterialToDelete(null); }}
                onConfirm={confirmRemove}
                title="Remover Material"
                description={materialToDelete ? (
                    <>Confirma a remoção do material <strong className="text-slate-700 dark:text-slate-200">{materialToDelete.materialDescription}</strong>?</>
                ) : undefined}
                isLoading={isDeleting}
            />
        </div>
    );
};
