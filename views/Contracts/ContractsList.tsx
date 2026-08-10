import React, { useState, useEffect } from 'react';
import { Contract } from '../../types';
import { dataService } from '../../services/dataService';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterList } from '../../components/ui/FilterList';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';

interface ContractsListProps {
    companyId?: string;
    onSelect?: (contract: Contract) => void;
    onAdd?: () => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({ companyId, onSelect, onAdd }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todos');
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                let data = await dataService.getContracts();
                if (companyId) {
                    data = data.filter(c => c.clientCompanyId === companyId);
                }
                setContracts(data);
            } catch (error) {
                console.error('Failed to load contracts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, [companyId]);

    const filters = ['Todos', 'Ativos', 'Inativos'];

    const filteredContracts = contracts.filter(c => {
        const matchesSearch =
            (c.clientCompanyName?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (c.providerCompanyName?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (c.code?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (c.description?.toLowerCase().includes(search.toLowerCase()) || false);

        if (filter === 'Todos') return matchesSearch;
        if (filter === 'Ativos') return matchesSearch && c.isAvailable === true;
        if (filter === 'Inativos') return matchesSearch && c.isAvailable === false;
        return matchesSearch;
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando contratos...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                searchProps={{
                    value: search,
                    onChange: setSearch,
                    placeholder: "Contrato, Empresa, Parceiro..."
                }}
                mainAction={onAdd ? {
                    onClick: onAdd,
                    icon: 'add',
                    title: 'Novo Contrato'
                } : undefined}
            />

            <div className="px-4 pb-4">
                <FilterList
                    options={filters}
                    selected={filter}
                    onSelect={setFilter}
                />
            </div>

            <div className="flex flex-col gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
                {filteredContracts.length === 0 ? (
                    <EmptyState
                        message="Nenhum contrato encontrado."
                        icon="description"
                    />
                ) : (
                    filteredContracts.slice(0, visibleCount).map(contract => (
                        <div
                            key={contract.id}
                            onClick={() => onSelect?.(contract)}
                            className="group flex flex-col p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 active:scale-[0.96] active:bg-slate-50/50 dark:active:bg-slate-800/50 cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={contract.logoUrl}
                                        alt={contract.providerCompanyName}
                                        size="md"
                                        shape="rounded"
                                    />
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{contract.providerCompanyName}</h3>
                                        {contract.providerDepartmentName && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                                {contract.providerDepartmentName}
                                            </p>
                                        )}
                                        <p className="text-xs text-primary font-bold">{contract.code}</p>
                                    </div>
                                </div>
                                <StatusBadge status={contract.isAvailable ? 'active' : 'inactive'} size="sm" label={contract.isAvailable ? 'Ativo' : 'Inativo'} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Departamento Responsável</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{contract.clientDepartmentName || 'Não informado'}</p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Cliente</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{contract.clientName || 'Não informado'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Início</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        {contract.dateStart ? new Date(contract.dateStart).toLocaleDateString('pt-BR') : '-'}
                                    </p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Término</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        {contract.dateEnd ? new Date(contract.dateEnd).toLocaleDateString('pt-BR') : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-0.5">Descrição</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{contract.description || 'Sem descrição'}</p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">R$</span>
                                    {(contract.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                            </div>
                        </div>
                    )))}

                <LoadMore
                    current={Math.min(visibleCount, filteredContracts.length)}
                    total={filteredContracts.length}
                    onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
};
