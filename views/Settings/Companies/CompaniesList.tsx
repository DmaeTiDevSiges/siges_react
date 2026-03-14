import React, { useState, useEffect } from 'react';
import { Company } from '../../../types';
import { dataService } from '../../../services/dataService';
import { SearchInput } from '../../../components/ui/SearchInput';
import { FilterList } from '../../../components/ui/FilterList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadMore } from '../../../components/ui/LoadMore';
import { IconButton } from '../../../components/ui/IconButton';
import { CompanyAvatar } from '../../../components/ui/CompanyAvatar';

interface CompaniesListProps {
  onSelect: (company: Company) => void;
  onAdd: () => void;
}

export const CompaniesList: React.FC<CompaniesListProps> = ({ onSelect, onAdd }) => {
  const [search, setSearch] = useState(() => localStorage.getItem('companies_search') || '');
  const [filter, setFilter] = useState(() => localStorage.getItem('companies_filter') || 'Todos');

  const handleSearchChange = (val: string) => {
    setSearch(val);
    localStorage.setItem('companies_search', val);
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    localStorage.setItem('companies_filter', val);
  };
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await dataService.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error('Failed to load companies', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filters = ['Todos', 'Ativos', 'Pendentes', 'Expirados'];

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Todos') return matchesSearch;
    if (filter === 'Ativos') return matchesSearch && (c.status as any) === 'active';
    if (filter === 'Pendentes') return matchesSearch && (c.status as any) === 'pending';
    if (filter === 'Expirados') return matchesSearch && (c.status as any) === 'inactive';
    return matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando empresas...</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4 sticky top-0 z-20 bg-background-light dark:bg-background-dark flex items-center gap-2">
        <SearchInput
          placeholder="Buscar empresa, contrato..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          containerClassName="flex-1"
        />
        <IconButton
          icon="add"
          variant="primary"
          size="lg"
          onClick={onAdd}
          title="Nova Empresa"
        />
      </div>

      <div className="sticky top-[80px] z-10 bg-background-light dark:bg-background-dark px-4 pb-4">
        <FilterList
          options={filters}
          selected={filter}
          onSelect={handleFilterChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-32 overflow-y-auto no-scrollbar">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-10 text-slate-500 col-span-full">
            Nenhuma empresa encontrada.
          </div>
        ) : (
          filteredCompanies.slice(0, visibleCount).map(company => (
            <div
              key={company.id}
              onClick={() => onSelect(company)}
              className="group flex items-center p-3 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 active:scale-[0.96] active:bg-slate-50/50 dark:active:bg-slate-800/50 cursor-pointer"
            >
              <div className="shrink-0">
                <CompanyAvatar
                  src={company.logoUrl}
                  name={company.name}
                  size="md"
                />
              </div>

              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{company.name}</h3>
                  <StatusBadge status={company.status} size="sm" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                  <span className="material-symbols-outlined text-[16px] align-middle">
                    {company.category.includes('Elétrica') ? 'bolt' : company.category.includes('IT') ? 'router' : 'apartment'}
                  </span>
                  {company.contractCount} Contratos • {company.category}
                </p>
              </div>

              <div className="ml-2 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </div>
            </div>
          ))
        )}

        <LoadMore
          current={Math.min(visibleCount, filteredCompanies.length)}
          total={filteredCompanies.length}
          onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};
