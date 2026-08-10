
import React, { useState, useEffect } from 'react';
import { Unit, Client } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { LoadMore } from '../../../../components/ui/LoadMore';
import { IconButton } from '../../../../components/ui/IconButton';
import { Avatar } from '../../../../components/ui/Avatar';
import { Marker } from '../../../../components/ui/Marker';
import { usePermissions } from '../../../../contexts/PermissionsContext';

import { UnitCardListItem } from '../../../../components/units/UnitCardListItem';
import { Loading } from '../../../../components/ui/Loading';

interface UnitsListProps {
    client: Client;
    onSelect?: (unit: Unit) => void;
    onAdd?: () => void;
}

export const UnitsList: React.FC<UnitsListProps> = ({ client, onSelect, onAdd }) => {
    const { canCreate } = usePermissions();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const data = await dataService.getUnitsByClient(client.id);
            setUnits(data);
        } catch (error) {
            console.error('Failed to load units', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [client.id]);

    const filteredUnits = units.filter(u => {
        const matchesSearch = u.description.toLowerCase().includes(search.toLowerCase()) ||
            (u.code && u.code.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = filter === 'all' || u.statusId === (filter === 'active' ? '1' : '2');
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* 1. Client Card at Top */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <Avatar
                        src={client.logoUrl}
                        alt={client.name}
                        size="lg"
                        className="w-16 h-16 rounded-[12px] bg-white shadow-sm border border-slate-100 dark:border-slate-800"
                        imageClassName="object-contain"
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate leading-none">
                                {client.name}
                            </h2>
                            <StatusBadge status={client.status} size="sm" />
                        </div>

                        <div className="flex flex-col gap-0 text-slate-500 dark:text-slate-400">
                            <span className="text-xs leading-snug">{client.code}</span>
                            <span className="text-xs leading-snug">{client.mobile || '---'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Search and Filter */}
            <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar unidade..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {onAdd && canCreate('units') && (
                        <IconButton
                            icon="add"
                            variant="primary"
                            size="lg"
                            onClick={onAdd}
                            title="Adicionar Unidade"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'all'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'active'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'inactive'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        Inativos
                    </button>
                </div>
            </div>

            {/* 3. Units List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loading size="md" text="Carregando unidades..." />
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        {search ? 'Nenhuma unidade encontrada para esta busca' : 'Nenhuma unidade cadastrada'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUnits.map(unit => (
                            <UnitCardListItem
                                key={unit.id}
                                unit={unit}
                                onClick={(u) => onSelect?.(u)}
                            />
                        ))}
                    </div>
                )}

                <LoadMore
                    current={Math.min(visibleCount, filteredUnits.length)}
                    total={filteredUnits.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
};
