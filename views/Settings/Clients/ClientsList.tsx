import React, { useState, useEffect } from 'react';
import { Client } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { FilterList } from '../../../components/ui/FilterList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadMore } from '../../../components/ui/LoadMore';

import { Loading } from '../../../components/ui/Loading';
import { IconButton } from '../../../components/ui/IconButton';

interface ClientsListProps {
    onSelect: (client: Client) => void;
    onAdd: () => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ onSelect, onAdd }) => {
    const [search, setSearch] = useState(() => localStorage.getItem('clients_search') || '');
    const [filter, setFilter] = useState(() => localStorage.getItem('clients_filter') || 'Todos');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await dataService.getClients();
                setClients(data);
            } catch (error) {
                console.error('Failed to load clients', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        localStorage.setItem('clients_search', val);
    };

    const handleFilterChange = (val: string) => {
        setFilter(val);
        localStorage.setItem('clients_filter', val);
    };

    const filters = ['Todos', 'Ativos', 'Inativos'];

    const filteredClients = clients.filter(c => {
        const searchLower = search.toLowerCase();
        const matchesSearch =
            c.name.toLowerCase().includes(searchLower) ||
            c.code.toLowerCase().includes(searchLower) ||
            (c.email && c.email.toLowerCase().includes(searchLower));

        if (filter === 'Todos') return matchesSearch;
        if (filter === 'Ativos') return matchesSearch && c.status === 'active';
        if (filter === 'Inativos') return matchesSearch && c.status === 'inactive';
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando clientes..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-20 bg-background-light dark:bg-background-dark flex items-center gap-2">
                <SearchInput
                    placeholder="Nome, CPF/CNPJ ou e-mail..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    containerClassName="flex-1"
                />
                <IconButton
                    icon="add"
                    variant="primary"
                    size="lg"
                    onClick={onAdd}
                    title="Novo Cliente"
                />
            </div>

            <div className="sticky top-[80px] z-10 bg-background-light dark:bg-background-dark px-4 pb-4">
                <FilterList
                    options={filters}
                    selected={filter}
                    onSelect={handleFilterChange}
                />
            </div>

            <div className="flex flex-col gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
                {filteredClients.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Nenhum cliente encontrado.
                    </div>
                ) : (
                    filteredClients.slice(0, visibleCount).map(client => (
                        <div
                            key={client.id}
                            onClick={() => onSelect(client)}
                            className="group flex items-center p-3 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 active:scale-[0.96] active:bg-slate-50/50 dark:active:bg-slate-800/50 cursor-pointer"
                        >
                            <div className="shrink-0 relative">
                                <div
                                    className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-700 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${client.logoUrl || 'https://via.placeholder.com/56'})` }}
                                />
                            </div>

                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{client.name}</h3>
                                    <StatusBadge status={client.status} size="sm" />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                    <span className="material-symbols-outlined text-[16px] align-middle text-slate-400">person</span>
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{client.code}</span>
                                    {client.mobile && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="material-symbols-outlined text-[16px] align-middle text-slate-400">smartphone</span>
                                            {client.mobile}
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="ml-2 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                            </div>
                        </div>
                    )))}
            </div>

            <LoadMore
                current={Math.min(visibleCount, filteredClients.length)}
                total={filteredClients.length}
                onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                pageSize={PAGE_SIZE}
            />
        </div>
    );
};
