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

interface OrderVisitAssetsListProps {
    visitId: string;
    isEditable?: boolean;
    initialUnitId?: string;
    initialUnitName?: string;
    onVisitRefresh?: () => void;
    onAssetSelect?: (assetId: string) => void;
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

    const loadVisitAssets = async () => {
        try {
            setLoading(true);
            const data = await dataService.getOrderVisitAssets(visitId);
            setVisitAssets(data);
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

            // Wait a moment to show the success state before closing/resetting
            setTimeout(() => {
                setAssetIdSuccess(null);
                setIsAdding(false);
                setSearchCode('');
                setSelectedUnit(null);
                setUnitSearchTerm('');
                setSearchResults([]);
                loadVisitAssets();
                if (onVisitRefresh) onVisitRefresh();
            }, 800);

        } catch (error) {
            console.error('Error adding asset:', error);
            toast.error('Erro ao associar ativo');
            setAssetIdAdding(null);
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
            toast.error('Erro ao remover ativo');
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
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    ATIVOS
                </h3>
                {isEditable && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
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
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="space-y-2 mt-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RESULTADOS DA BUSCA</p>
                            {searchResults.map(asset => (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-indigo-200">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">
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
                                    {visitAssets.some(va => va.assetId === asset.id) ? (
                                        <button disabled className="w-[45px] h-[45px] shrink-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed">
                                            <span className="material-symbols-outlined text-2xl font-bold">check</span>
                                        </button>
                                    ) : (
                                        <ButtonNew
                                            onClick={() => handleAddAsset(asset, currentUserId)}
                                            isLoading={assetIdAdding === asset.id}
                                            isSuccess={assetIdSuccess === asset.id}
                                        />
                                    )}
                                </div>
                            ))}
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
            <div className="space-y-4">
                {visitAssets.length === 0 && !isAdding && (
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-10 border border-dashed border-slate-200 dark:border-white/5 text-center">
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
                                onAssetSelect(asset.id);
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
