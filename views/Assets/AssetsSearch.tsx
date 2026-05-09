import React, { useState, useEffect } from 'react';
import { Asset, User } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { LoadMore } from '../../components/ui/LoadMore';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { scanBarcode, IS_NATIVE } from '../../utils/scanner';
import { IconButton } from '../../components/ui/IconButton';
import { BarcodeScannerModal } from '../../components/ui/BarcodeScannerModal';
import { AssetCard } from '../../components/assets/AssetCard';
import { Loading } from '../../components/ui/Loading';

interface AssetsSearchProps {
    currentUser?: User;
    onSelectAsset?: (asset: Asset) => void;
    onAdd?: () => void;
}

export const AssetsSearch: React.FC<AssetsSearchProps> = ({ currentUser, onSelectAsset, onAdd }) => {
    const { canCreate, canSearch, permissions, loading: permissionsLoading } = usePermissions();
    const hasSearchPermission = canSearch('assets');

    const [search, setSearch] = useState(() => localStorage.getItem('assets_search') || '');
    const [activeSearch, setActiveSearch] = useState(search);

    const handleSearch = () => {
        setActiveSearch(search);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(20);
    const PAGE_SIZE = 20;
    const [followedAssetIds, setFollowedAssetIds] = useState<Set<string>>(new Set());
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleScanResult = async (result: string) => {
        setSearch(result);
        setActiveSearch(result);
        localStorage.setItem('assets_search', result);

        try {
            // Try to find exact match immediately
            const exactAssets = await dataService.getAssets('all', result);
            const exactMatch = exactAssets.find(a =>
                a.code?.toLowerCase() === result.toLowerCase() ||
                a.id === result
            );
            if (exactMatch && onSelectAsset) {
                onSelectAsset(exactMatch);
            }
        } catch (err: any) {
            console.error('Error finding asset after scan:', err);
        }
    };

    // DEBUG: Verificar estado das permissões
    useEffect(() => {
        console.log('🔍 DEBUG PERMISSIONS:', {
            currentUser: currentUser?.id,
            profileId: currentUser?.profileId,
            isAdminSuper: currentUser?.isAdminSuper,
            permissionsLoading,
            permissionsCount: permissions.length,
            canCreateAssets: canCreate('assets'),
            canSearchAssets: hasSearchPermission,
            onAddExists: !!onAdd,
            allPermissions: permissions
        });
    }, [currentUser, permissions, permissionsLoading, onAdd, hasSearchPermission]);

    useEffect(() => {
        const fetchFollowed = async () => {
            try {
                const ids = await dataService.getFollowedAssetIds();
                setFollowedAssetIds(new Set(ids));
            } catch (err) {
                console.error('Error fetching followed assets:', err);
            }
        };
        if (hasSearchPermission) fetchFollowed();
    }, [hasSearchPermission]);

    const toggleFavorite = async (assetId: string) => {
        const isCurrentlyFavorite = followedAssetIds.has(assetId);

        // Optimistic update
        setFollowedAssetIds(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyFavorite) newSet.delete(assetId);
            else newSet.add(assetId);
            return newSet;
        });

        try {
            const isNowFollowing = await dataService.toggleAssetFollow(assetId);
            // Verify if the result matches our optimistic state, update if different
            if (isNowFollowing !== !isCurrentlyFavorite) {
                setFollowedAssetIds(prev => {
                    const newSet = new Set(prev);
                    if (isNowFollowing) newSet.add(assetId);
                    else newSet.delete(assetId);
                    return newSet;
                });
            }
            toast.success(isNowFollowing ? 'Ativo adicionado aos favoritos' : 'Ativo removido dos favoritos');
        } catch (err) {
            console.error('Error toggling favorite:', err);
            // Rollback on error
            setFollowedAssetIds(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyFavorite) newSet.add(assetId);
                else newSet.delete(assetId);
                return newSet;
            });
            toast.error('Erro ao atualizar favorito');
        }
    };

    useEffect(() => {
        if (!hasSearchPermission) return;
        setVisibleCount(PAGE_SIZE);

        const fetchData = async () => {
            if (!activeSearch.trim()) {
                setAssets([]);
                setLoading(false);
                setError(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await dataService.getAssets('all', activeSearch);
                setAssets(data);
            } catch (err: any) {
                console.error('AssetsSearch: ERRO no fetchData:', err);
                setError(err.message || 'Erro inesperado ao carregar ativos.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeSearch, hasSearchPermission]);

    // Use server-side filtered assets directly
    const filteredAssets = assets;

    const visibleAssets = filteredAssets.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAssets.length;

    if (!hasSearchPermission) {
        return (
            <div className="flex flex-col h-full bg-background-light dark:bg-background-dark items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-slate-400 text-[40px]">lock</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">Acesso Negado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Você não tem permissão para realizar buscas neste módulo.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header Section */}
            <div className="px-4 pt-4 pb-3 bg-linear-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-b border-primary/10 dark:border-primary/20">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Código, descrição, marca, modelo, serial"
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                localStorage.setItem('assets_search', val);
                            }}
                            onKeyDown={handleKeyDown}
                            onClear={() => {
                                setSearch('');
                                setActiveSearch('');
                                localStorage.setItem('assets_search', '');
                            }}
                            rightAction={
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
                            }
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 bg-primary text-white rounded-[12px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center hover:bg-primary-dark"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
            />

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loading size="md" text="Carregando ativos..." />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-500">
                            <span className="material-symbols-outlined text-[40px]">error</span>
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2">Falha no Carregamento</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-[40px]">search_off</span>
                        </div>
                        <p className="text-slate-400 text-center text-sm">
                            {search ? 'Nenhum ativo encontrado para esta busca' : 'Nenhum ativo cadastrado'}
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleAssets.map(asset => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                isFavorite={followedAssetIds.has(asset.id)}
                                onToggleFavorite={() => toggleFavorite(asset.id)}
                                onClick={() => onSelectAsset?.(asset)}
                            />
                        ))}

                        <LoadMore
                            current={visibleAssets.length}
                            total={filteredAssets.length}
                            onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            pageSize={PAGE_SIZE}
                        />
                    </>
                )}
            </div>

            {/* Floating Action Button */}
            {onAdd && canCreate('assets') && (
                <button
                    onClick={onAdd}
                    className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all z-20"
                >
                    <span className="material-symbols-outlined text-3xl font-bold">add</span>
                </button>
            )}
        </div>
    );
};


