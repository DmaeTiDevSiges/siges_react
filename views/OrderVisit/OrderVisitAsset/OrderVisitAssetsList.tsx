import React, { useState, useEffect } from 'react';
import { OrderVisitAssetView, Asset, Unit } from '../../../types';
import { dataService } from '../../../services/dataService';
import { Card } from '../../../components/ui/Card';
import { ButtonDelete } from '../../../components/ui/ButtonDelete';
import { ButtonNew } from '../../../components/ui/ButtonNew';
import { ButtonSearch } from '../../../components/ui/ButtonSearch';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { toast } from 'sonner';
import { OrderVisitAssetCardListItem } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardListItem';
import { scanBarcode, IS_NATIVE } from '../../../utils/scanner';
import { IconButton } from '../../../components/ui/IconButton';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';
import { Loading } from '../../../components/ui/Loading';
import { sortBySectorPositionDescription } from '../../../utils/assetReportSort';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { isTmpId } from '../../../services/offline/offlineFlowOps';
import { isOnline } from '../../../services/offline/offlineConfig';


interface OrderVisitAssetsListProps {
    visitId: string;
    isEditable?: boolean;
    initialUnitId?: string;
    initialUnitName?: string;
    onVisitRefresh?: () => void;
    onAssetSelect?: (asset: OrderVisitAssetView) => void;
}

export const OrderVisitAssetsList: React.FC<OrderVisitAssetsListProps> = ({
    visitId,
    isEditable = true,
    initialUnitId,
    initialUnitName,
    onVisitRefresh,
    onAssetSelect
}) => {
    const [visitAssets, setVisitAssets] = useState<OrderVisitAssetView[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Asset State
    const [isAdding, setIsAdding] = useState(false);
    const [searchCode, setSearchCode] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(
        initialUnitId && initialUnitName ? { id: initialUnitId, description: initialUnitName } as Unit : null
    );
    const [unitSearchTerm, setUnitSearchTerm] = useState('');
    const [unitResults, setUnitResults] = useState<Unit[]>([]);
    const [searchResults, setSearchResults] = useState<Asset[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchingUnits, setSearchingUnits] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [assetIdAdding, setAssetIdAdding] = useState<string | null>(null);
    const [assetIdSuccess, setAssetIdSuccess] = useState<string | null>(null);
    /** Ativos marcados nos resultados para associar de uma vez (persiste entre buscas). */
    const [selectedAssets, setSelectedAssets] = useState<Map<string, Asset>>(new Map());
    const [associating, setAssociating] = useState(false);

    const handleScanResult = async (result: string) => {
        setSearchCode(result);
        try {
            // Auto search and try to add if exactly one result
            const results = await dataService.getAssets('active', result);
            if (results.length === 1 && (results[0].code === result || results[0].id === result)) {
                await handleAddAsset(results[0], currentUserId);
            } else {
                setSearchResults(results);
            }
        } catch (err: any) {
            console.error('Error finding asset after scan:', err);
        }
    };

    useEffect(() => {
        loadVisitAssets();
    }, [visitId]);

    // Ativo incluído sem internet ("tmp:…"): quando a fila terminar de enviar,
    // recarrega para trocar pelo id real do servidor.
    const offlineSync = useOfflineSync();
    useEffect(() => {
        if (offlineSync.syncing || !isOnline()) return;
        if (visitAssets.some(a => isTmpId(a.id))) loadVisitAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offlineSync.syncing, offlineSync.summary.total]);

    const loadVisitAssets = async () => {
        try {
            setLoading(true);
            const data = await dataService.getOrderVisitAssets(visitId);
            // Ordem: setor → posição → descrição (o card mostra o setor/posição de antes).
            setVisitAssets(sortBySectorPositionDescription(data, a => ({
                tagName: a.beforeTagDescription,
                tagSubName: a.beforeTagSubDescription,
                description: a.description,
                code: a.code,
            })));
        } catch (error) {
            console.error('Error loading visit assets:', error);
            toast.error('Erro ao carregar ativos da visita');
        } finally {
            setLoading(false);
        }
    };

    const handleUnitSearch = async (term: string) => {
        setUnitSearchTerm(term);
        if (term.length < 2) {
            setUnitResults([]);
            return;
        }

        try {
            setSearchingUnits(true);
            const results = await dataService.searchUnits(term);
            setUnitResults(results);
        } catch (error) {
            console.error('Error searching units:', error);
        } finally {
            setSearchingUnits(false);
        }
    };

    const handleAssetSearch = async () => {
        if (!searchCode && !selectedUnit) {
            toast.info('Informe a unidade ou o código para pesquisar');
            return;
        }

        try {
            setSearching(true);
            const results = await dataService.getAssets('active', searchCode, selectedUnit?.id);

            // Filter out assets already added
            const existingIds = visitAssets.map(a => a.assetId);
            setSearchResults(results.filter(r => !existingIds.includes(r.id)));

            if (results.length === 0) {
                toast.info('Nenhum ativo encontrado com estes critérios');
            }
        } catch (error) {
            console.error('Error searching assets:', error);
            toast.error('Erro ao pesquisar ativos');
        } finally {
            setSearching(false);
        }
    };

    const handleAddAsset = async (asset: Asset, userId: string) => {
        // Prevent duplicate association
        if (visitAssets.some(va => va.assetId === asset.id)) {
            toast.warning('Este ativo já está associado a esta visita.');
            return;
        }

        try {
            setAssetIdAdding(asset.id);
            await dataService.addAssetToOrderVisit(visitId, asset.id, userId);

            // Success animation timing
            setAssetIdAdding(null);
            setAssetIdSuccess(asset.id);

            toast.success('Ativo associado!');

            // Wait a moment to show the success state before resetting
            setTimeout(() => {
                setAssetIdSuccess(null);
                // setIsAdding(false); // Mantém aberto para adicionar mais
                setSearchCode('');
                setSelectedUnit(null);
                setUnitSearchTerm('');
                setSearchResults([]);
                loadVisitAssets();
                if (onVisitRefresh) onVisitRefresh();
            }, 1200);

        } catch (error) {
            console.error('Error adding asset:', error);
            toast.error(error instanceof Error && error.message ? `Erro ao associar ativo: ${error.message}` : 'Erro ao associar ativo');
            setAssetIdAdding(null);
        }
    };

    const isAssetInVisit = (assetId: string) => visitAssets.some(va => va.assetId === assetId);

    const toggleAssetSelection = (asset: Asset) => {
        if (associating || isAssetInVisit(asset.id)) return;
        setSelectedAssets(current => {
            const next = new Map(current);
            if (next.has(asset.id)) next.delete(asset.id);
            else next.set(asset.id, asset);
            return next;
        });
    };

    /** Marca/desmarca todos os resultados que ainda não estão na visita. */
    const toggleSelectAllResults = () => {
        const selectable = searchResults.filter(a => !isAssetInVisit(a.id));
        setSelectedAssets(current => {
            const next = new Map(current);
            const allSelected = selectable.length > 0 && selectable.every(a => next.has(a.id));
            selectable.forEach(a => (allSelected ? next.delete(a.id) : next.set(a.id, a)));
            return next;
        });
    };

    /** Associa à visita todos os ativos marcados, um por vez; o que falhar continua marcado. */
    const handleAssociateSelected = async () => {
        if (associating || selectedAssets.size === 0) return;
        setAssociating(true);
        const added: string[] = [];
        const failed: Array<{ asset: Asset; message: string }> = [];
        for (const asset of selectedAssets.values()) {
            if (isAssetInVisit(asset.id)) continue;
            try {
                await dataService.addAssetToOrderVisit(visitId, asset.id, currentUserId);
                added.push(asset.id);
            } catch (error) {
                console.error('Error adding asset:', asset.code, error);
                failed.push({ asset, message: error instanceof Error ? error.message : '' });
            }
        }
        setAssociating(false);

        if (added.length > 0) toast.success(added.length === 1 ? 'Ativo associado!' : `${added.length} ativos associados!`);
        if (failed.length > 0) {
            const codes = failed.map(f => f.asset.code).join(', ');
            toast.error(`${failed.length === 1 ? 'Não foi possível associar o ativo' : 'Não foi possível associar os ativos'} ${codes}${failed[0].message ? `: ${failed[0].message}` : ''}`);
        }

        // Os associados saem dos resultados; os que falharam seguem marcados para nova tentativa.
        setSelectedAssets(new Map(failed.map(f => [f.asset.id, f.asset])));
        setSearchResults(current => current.filter(r => !added.includes(r.id)));
        if (added.length > 0) {
            loadVisitAssets();
            if (onVisitRefresh) onVisitRefresh();
        }
    };

    const [assetToDelete, setAssetToDelete] = useState<OrderVisitAssetView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemoveAsset = (asset: OrderVisitAssetView) => {
        setAssetToDelete(asset);
    };

    const confirmRemoveAsset = async () => {
        if (!assetToDelete) return;
        setIsDeleting(true);
        try {
            await dataService.removeAssetFromOrderVisit(assetToDelete.id);
            toast.success('Ativo removido da visita');
            setVisitAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
            setAssetToDelete(null);
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error('Error removing asset:', error);
            toast.error(error instanceof Error && error.message ? `Erro ao remover ativo: ${error.message}` : 'Erro ao remover ativo');
        } finally {
            setIsDeleting(false);
        }
    };

    // Get current user ID
    const [currentUserId, setCurrentUserId] = useState<string>('');
    useEffect(() => {
        dataService.getCurrentUser().then(u => {
            if (u) setCurrentUserId(u.id);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    return (
        // Desktop (lg+): associando → busca à esquerda (fixa ao rolar) e lista à direita;
        // sem associar → lista na largura toda, 2 colunas. Mobile: empilhado como antes.
        <div className={`flex flex-col gap-6 ${isAdding ? 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-6 lg:items-start' : ''}`}>
            {/* Header / Add Button */}
            <div className="flex justify-between items-center px-1 lg:col-span-2">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    ATIVOS
                </h3>
                {isEditable && (
                    <button
                        onClick={() => { if (isAdding) setSelectedAssets(new Map()); setIsAdding(!isAdding); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isAdding
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
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
                )}
            </div>

            {/* Association Area */}
            {isAdding && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-500 lg:col-start-1 lg:row-start-2 lg:sticky lg:top-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Unit Search */}
                        <div className="relative">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                UNIDADE
                            </label>
                            {selectedUnit ? (
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-500/30">
                                    <span className="text-sm font-bold truncate text-indigo-600 dark:text-indigo-400">
                                        {selectedUnit.descriptionFull || selectedUnit.description}
                                    </span>
                                    <button onClick={() => setSelectedUnit(null)} className="text-slate-400 hover:text-red-500">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar unidade..."
                                        value={unitSearchTerm}
                                        onChange={(e) => handleUnitSearch(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {unitResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                                            {unitResults.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedUnit(u);
                                                        setUnitResults([]);
                                                        setUnitSearchTerm('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.code}</span>
                                                        <span className="text-slate-900 dark:text-white truncate">
                                                            {u.descriptionFull || u.description}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Code Search */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                CÓDIGO DO ATIVO
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Ex: MTR-01"
                                        value={searchCode}
                                        onChange={(e) => setSearchCode(e.target.value)}
                                        className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="absolute inset-y-0 right-1 flex items-center">
                                        <IconButton
                                            icon="barcode_scanner"
                                            size="sm"
                                            variant="ghost"
                                            className="text-primary"
                                            onClick={async () => {
                                                if (IS_NATIVE) {
                                                    try {
                                                        const result = await scanBarcode();
                                                        if (result) handleScanResult(result);
                                                    } catch (err: any) {
                                                        toast.error(err.message || 'Erro ao escanear');
                                                    }
                                                } else {
                                                    setIsScannerOpen(true);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <ButtonSearch
                                    onClick={handleAssetSearch}
                                    disabled={searching}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2 mt-4 lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto lg:pr-1">
                            <div className="flex items-center justify-between gap-2 ml-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESULTADOS DA BUSCA</p>
                                {searchResults.some(a => !isAssetInVisit(a.id)) && (
                                    <button
                                        type="button"
                                        onClick={toggleSelectAllResults}
                                        disabled={associating}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 disabled:opacity-50"
                                    >
                                        {searchResults.filter(a => !isAssetInVisit(a.id)).every(a => selectedAssets.has(a.id)) ? 'Desmarcar todos' : 'Selecionar todos'}
                                    </button>
                                )}
                            </div>
                            {searchResults.map(asset => {
                                const isAlreadyAdded = visitAssets.some(va => va.assetId === asset.id);
                                const isAddingThis = assetIdAdding === asset.id;
                                const isSuccessThis = assetIdSuccess === asset.id;
                                const isSelected = selectedAssets.has(asset.id);

                                return (
                                    <div
                                        key={asset.id}
                                        onClick={() => {
                                            if (!isAddingThis && !isSuccessThis) toggleAssetSelection(asset);
                                        }}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all group ${
                                            isAlreadyAdded
                                                ? 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-200/50 opacity-60 cursor-not-allowed'
                                                : isAddingThis
                                                    ? 'bg-indigo-50/60 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 cursor-wait shadow-sm scale-[0.99]'
                                                    : isSuccessThis
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 cursor-default'
                                                        : isSelected
                                                            ? 'bg-indigo-50/60 dark:bg-indigo-500/15 border-indigo-400 dark:border-indigo-500/60 shadow-sm cursor-pointer active:scale-[0.99]'
                                                            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 hover:border-indigo-400 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer active:scale-[0.99]'
                                        }`}
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        aria-disabled={isAlreadyAdded}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {asset.description}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">
                                                    {asset.code} • {asset.tagName || asset.location || 'Sem Setor'}{asset.tagSubName ? ` > ${asset.tagSubName}` : ''}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">
                                                    {asset.statusCode || 'Não informada'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status / Loading Icon on the right */}
                                        <div className="shrink-0">
                                            {isAlreadyAdded ? (
                                                <div className="w-10 h-10 rounded-2xl bg-slate-200/70 dark:bg-slate-700/50 text-slate-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl font-bold">check</span>
                                                </div>
                                            ) : isAddingThis ? (
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                                                </div>
                                            ) : isSuccessThis ? (
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm animate-in zoom-in-50 duration-200">
                                                    <span className="material-symbols-outlined text-xl font-bold">check</span>
                                                </div>
                                            ) : isSelected && associating ? (
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                                                </div>
                                            ) : isSelected ? (
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                                                    <span className="material-symbols-outlined text-xl font-bold">check</span>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-transparent group-hover:border-indigo-400 transition-all flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl">check</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Confirmação: associa todos os marcados (inclusive de buscas anteriores) */}
                    {selectedAssets.size > 0 && (
                        <div className="sticky bottom-3 z-10 mt-4 flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-indigo-200 dark:border-indigo-500/30 p-2 shadow-lg">
                            <button
                                type="button"
                                onClick={() => setSelectedAssets(new Map())}
                                disabled={associating}
                                className="px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={handleAssociateSelected}
                                disabled={associating}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-black active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
                            >
                                {associating ? (
                                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-xl">add_task</span>
                                )}
                                {associating
                                    ? 'Associando…'
                                    : selectedAssets.size === 1 ? 'Associar 1 ativo' : `Associar ${selectedAssets.size} ativos`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
            />

            {/* List associated assets */}
            <div className={`grid grid-cols-1 gap-4 content-start min-w-0 lg:col-start-2 lg:row-start-2 ${!isAdding ? 'lg:grid-cols-2' : ''}`}>
                {visitAssets.length === 0 && !isAdding && (
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-2xl p-10 border border-dashed border-slate-200 dark:border-white/5 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">Nenhum ativo associado a esta visita.</p>
                        {isEditable && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-4 text-indigo-500 text-xs font-black uppercase tracking-widest hover:text-indigo-600"
                            >
                                Adicionar Primeiro Ativo
                            </button>
                        )}
                    </div>
                )}

                {visitAssets.map(asset => (
                    <OrderVisitAssetCardListItem
                        key={asset.id}
                        asset={asset}
                        onClick={() => {
                            if (onAssetSelect) {
                                onAssetSelect(asset);
                            }
                        }}
                    />
                ))}
            </div>

            {/* Delete Modal */}
            <ConfirmDeleteModal
                isOpen={!!assetToDelete}
                onClose={() => setAssetToDelete(null)}
                onConfirm={confirmRemoveAsset}
                title="Remover Ativo"
                description={
                    assetToDelete ? (
                        <>
                            Confirma a desvinculação do ativo <strong className="text-slate-700 dark:text-slate-200">{assetToDelete.description}</strong> desta visita?
                        </>
                    ) : undefined
                }
                isLoading={isDeleting}
            />
        </div >
    );
};
