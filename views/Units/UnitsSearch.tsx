import React, { useState, useEffect } from 'react';
import { Unit, Client, User } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { UnitCardListItem } from '../../components/units/UnitCardListItem';
import { usePermissions } from '../../contexts/PermissionsContext';

interface UnitsSearchProps {
    currentUser: User;
    onSelectUnit?: (unit: Unit & { clientName?: string }) => void;
    onAdd?: () => void;
}

export const UnitsSearch: React.FC<UnitsSearchProps> = ({ currentUser, onSelectUnit, onAdd }) => {
    const { canSearch, canCreate } = usePermissions();
    const hasSearchPermission = canSearch('units');
    // ... hook logic ...
    const [search, setSearch] = useState(() => localStorage.getItem('units_search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [units, setUnits] = useState<(Unit & { clientName?: string })[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);
    const PAGE_SIZE = 20;

    // ... useEffects ...
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // Aguarda 500ms após o usuário parar de digitar

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const fetchData = async () => {
            // Só buscar unidades se houver texto de pesquisa
            if (!debouncedSearch || debouncedSearch.trim().length === 0) {
                setUnits([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Ensure clients are loaded for name mapping
                let currentClients = clients;
                if (currentClients.length === 0) {
                    const clientsData = await dataService.getClients();
                    currentClients = clientsData.filter(c => c.status === 'active');
                    setClients(currentClients);
                }

                const searchNorm = debouncedSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                // 1. Search Units directly (Server-Side)
                const textSearchResults = await dataService.searchUnits(debouncedSearch);

                // 2. Search Units by Client Name (Server-Side via getUnitsByClient for matching clients)
                // Find clients that match the search term
                const matchingClients = currentClients.filter(c =>
                    c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNorm)
                );

                // Fetch units for these specific clients
                // Limit to 5 matching clients to prevent explosion if search is "a"
                const limitClients = matchingClients.slice(0, 5);
                const clientUnitsPromises = limitClients.map(client =>
                    dataService.getUnitsByClient(client.id)
                );

                const clientUnitsArrays = await Promise.all(clientUnitsPromises);
                const clientUnits = clientUnitsArrays.flat();

                // Merge and Deduplicate
                const allUnitsMap = new Map();

                // Add text search results
                textSearchResults.forEach(u => allUnitsMap.set(u.id, u));

                // Add client search results
                clientUnits.forEach(u => allUnitsMap.set(u.id, u));

                const mergedUnits = Array.from(allUnitsMap.values()).map((unit: any) => ({
                    ...unit,
                    clientName: currentClients.find(c => c.id === unit.clientId)?.name
                }));

                setUnits(mergedUnits);
            } catch (error) {
                console.error('Failed to load units', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [debouncedSearch]);

    // Use pure server results as we trust the search
    const filteredUnits = units;

    const visibleUnits = filteredUnits.slice(0, visibleCount);
    const hasMore = visibleCount < filteredUnits.length;

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
                {/* Search Bar */}
                <SearchInput
                    placeholder="Nome e/ou código"
                    value={search}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearch(val);
                        localStorage.setItem('units_search', val);
                    }}
                    onClear={() => {
                        setSearch('');
                        localStorage.setItem('units_search', '');
                    }}
                />
            </div>

            {/* Units List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24">
                {/* ... loading/empty states same as before ... */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Carregando unidades...</p>
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-400 text-[40px]">
                                {search ? 'search_off' : 'search'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-center text-sm font-medium mb-1">
                            {search ? 'Nenhuma unidade encontrada' : 'Digite para buscar unidades'}
                        </p>
                        {!search && (
                            <p className="text-slate-500 dark:text-slate-600 text-center text-xs max-w-xs">
                                Busque por nome e/ou código
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3">
                            {visibleUnits.map(unit => (
                                <UnitCardListItem
                                    key={unit.id}
                                    unit={unit}
                                    onClick={(u) => onSelectUnit?.(u)}
                                />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                                    className="px-6 py-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary transition-all active:scale-95 shadow-sm"
                                >
                                    Carregar mais ({filteredUnits.length - visibleCount} restantes)
                                </button>
                            </div>
                        )}
                    </>
                )}
                {/* Floating Action Button */}
                {onAdd && canCreate('units') && (
                    <button
                        onClick={onAdd}
                        className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all z-20"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </button>
                )}
            </div>
        </div>
    );
};
