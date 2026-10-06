import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppNotices } from '../../hooks/useAppNotices';
import { dataService } from '../../services/dataService';
import { NoticeWorker, Unit } from '../../types';
import { SearchInput } from '../../components/ui/SearchInput';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExtraWorkersListItem } from '../../components/appNotices/ExtraWorkersListItem';
import { toast } from 'sonner';

interface UnitEntry {
  unitId: number;
  title: string;
  subtitle?: string;
  total: number;
  value: number;
}

export const ExtraWorkersList: React.FC = () => {
  const { canView, canEdit } = usePermissions();
  const { currentUser } = useAuth();
  const { notices, loading: loadingNotices } = useAppNotices();

  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [rows, setRows] = useState<NoticeWorker[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Unit[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState<number | null>(null);

  const companyId = currentUser?.companyId;
  const isSuper = !!currentUser?.isAdminSuper;
  const canEditWorkers = canEdit('notices_workers_extra');

  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) || null;

  // Seleciona um aviso ativo ("em andamento")
  useEffect(() => {
    if (notices.length === 0) {
      setSelectedNoticeId(null);
      return;
    }
    if (!notices.some((n) => n.id === selectedNoticeId)) {
      setSelectedNoticeId(notices[0].id);
    }
  }, [notices, selectedNoticeId]);

  const loadRows = useCallback(
    async (noticeId: number | null) => {
      if (!noticeId) {
        setRows([]);
        return;
      }
      setLoadingRows(true);
      try {
        const data = await dataService.getNoticeWorkers(
          noticeId,
          isSuper ? undefined : (companyId ?? null)
        );
        setRows(data);
      } catch (error) {
        console.error('Error loading notice workers:', error);
        setRows([]);
      } finally {
        setLoadingRows(false);
      }
    },
    [isSuper, companyId]
  );

  useEffect(() => {
    setRows([]);
    if (selectedNoticeId) {
      void loadRows(selectedNoticeId);
    }
  }, [selectedNoticeId, loadRows]);

  // Pesquisa incremental de unidades (mínimo 2 caracteres)
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const units = await dataService.searchUnits(term, 50);
        setResults(units);
      } catch (error) {
        console.error('Error searching units:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Agrupa lançamentos por unidade (total visível + valor da company logada)
  const byUnit = useMemo(() => {
    const map = new Map<number, UnitEntry>();
    rows.forEach((row) => {
      const amount = Number(row.workersExtraAmount) || 0;
      if (amount <= 0) return;
      const unitId = Number(row.unitId);
      const title = row.unitDescriptionFull || row.unitDescription || `Unidade ${unitId}`;
      const subtitle =
        row.unitAddressFull ||
        (row.unitDescription && row.unitDescriptionFull && row.unitDescription !== row.unitDescriptionFull
          ? row.unitDescription
          : (row.unitCode ? `Cód. ${row.unitCode}` : undefined));
      const entry =
        map.get(unitId) ||
        ({
          unitId,
          title,
          subtitle,
          total: 0,
          value: 0,
        } as UnitEntry);
      entry.total += amount;
      if (companyId && Number(row.companyId) === Number(companyId)) {
        entry.value += amount;
      }
      map.set(unitId, entry);
    });
    for (const [id, entry] of map.entries()) {
      if (entry.total <= 0) {
        map.delete(id);
      }
    }
    return map;
  }, [rows, companyId]);

  const listItems = useMemo(
    () =>
      Array.from(byUnit.values()).sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { numeric: true, sensitivity: 'base' })
      ),
    [byUnit]
  );

  const totals = useMemo(
    () => ({
      units: listItems.length,
      workers: listItems.reduce((sum, item) => sum + item.total, 0),
    }),
    [listItems]
  );

  const newResults = useMemo(
    () =>
      results
        .filter((unit) => !byUnit.has(Number(unit.id)))
        .sort((a, b) =>
          (a.descriptionFull || a.description || '').localeCompare(
            b.descriptionFull || b.description || '',
            'pt-BR',
            { numeric: true, sensitivity: 'base' }
          )
        ),
    [results, byUnit]
  );

  const handleSave = useCallback(
    async (unitId: number, amount: number) => {
      if (!selectedNoticeId) {
        toast.error('Selecione um aviso em andamento');
        return;
      }
      if (!companyId) {
        toast.error('Usuário sem company definida não pode lançar MO extra');
        return;
      }

      const exists = rows.some(
        (row) => Number(row.unitId) === unitId && Number(row.companyId) === Number(companyId)
      );
      if (!exists && amount === 0) return;

      const previous = rows;
      setSavingUnitId(unitId);
      setRows((prev) => {
        if (amount <= 0) {
          return prev.filter(
            (row) => !(Number(row.unitId) === unitId && Number(row.companyId) === Number(companyId))
          );
        }
        const index = prev.findIndex(
          (row) => Number(row.unitId) === unitId && Number(row.companyId) === Number(companyId)
        );
        if (index < 0) {
          const searchUnit = results.find((u) => Number(u.id) === unitId);
          return [
            ...prev,
            {
              id: -Date.now(),
              noticeId: selectedNoticeId,
              companyId: Number(companyId),
              unitId,
              workersExtraAmount: amount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              unitDescription: searchUnit?.description,
              unitDescriptionFull: searchUnit?.descriptionFull,
              unitCode: searchUnit?.code,
              unitAddressFull: searchUnit?.addressFull,
            },
          ];
        }
        const next = [...prev];
        next[index] = { ...next[index], workersExtraAmount: amount };
        return next;
      });

      try {
        await dataService.setNoticeWorkers({
          noticeId: selectedNoticeId,
          companyId,
          unitId,
          amount,
          userId: currentUser?.id ? Number(currentUser.id) : null,
        });
        await loadRows(selectedNoticeId);
      } catch (error) {
        console.error('Error saving notice workers:', error);
        setRows(previous);
        toast.error('Erro ao salvar MO extra');
      } finally {
        setSavingUnitId(null);
      }
    },
    [selectedNoticeId, companyId, rows, currentUser?.id, loadRows]
  );

  if (!canView('notices_workers_extra')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <span className="material-symbols-outlined text-5xl mb-4">lock</span>
        <p className="text-lg font-medium">Sem permissão</p>
        <p className="text-sm">Você não tem permissão para acessar esta funcionalidade.</p>
      </div>
    );
  }

  if (loadingNotices) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="md" text="Carregando avisos..." />
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark">
        <EmptyState
          icon="notifications_off"
          message="Nenhum aviso em andamento. A MO extra é informada durante um aviso ativo."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-background-light dark:bg-background-dark safe-area-bottom">
      <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800">
        {/* Aviso em andamento */}
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-1.5">
            Aviso em andamento *
          </label>
          <select
            value={selectedNoticeId ?? ''}
            onChange={(e) => setSelectedNoticeId(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
          >
            {notices.map((notice) => (
              <option key={notice.id} value={notice.id}>
                {notice.title}
              </option>
            ))}
          </select>
          {selectedNotice && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {new Date(selectedNotice.startDate).toLocaleString('pt-BR')} —{' '}
              {new Date(selectedNotice.endDate).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {/* Resumo */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-tight">Unidades</p>
            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
              {totals.units}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-tight">
              MO Extra
            </p>
            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
              {totals.workers}
            </p>
          </div>
        </div>
      </div>

      {/* Unidades lançadas */}
      <div className="p-4 space-y-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Unidades lançadas neste aviso
          </h2>
          {loadingRows && (
            <span className="animate-spin material-symbols-outlined text-[16px] text-primary">
              progress_activity
            </span>
          )}
        </div>

        {!loadingRows && listItems.length === 0 ? (
          <EmptyState
            icon="groups"
            message="Nenhuma unidade lançada neste aviso ainda."
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {listItems.map((item) => (
              <ExtraWorkersListItem
                key={item.unitId}
                unitId={item.unitId}
                title={item.title}
                subtitle={item.subtitle}
                total={item.total}
                value={item.value}
                editable={canEditWorkers}
                saving={savingUnitId === item.unitId}
                onChange={handleSave}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pesquisa de unidades */}
      {canEditWorkers && (
        <div className="p-4 space-y-2">
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Pesquisar Unidades
          </label>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Pesquisar unidade..."
            rightAction={
              searching ? (
                <span className="animate-spin material-symbols-outlined text-[18px] text-primary pr-2">
                  progress_activity
                </span>
              ) : null
            }
          />
          {search.trim().length >= 2 && (
            <div className="flex flex-col gap-1.5">
              {searching && newResults.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <span className="animate-spin material-symbols-outlined text-[18px] text-primary">
                    progress_activity
                  </span>
                  <span>Pesquisando unidades...</span>
                </div>
              ) : !searching && newResults.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 px-1 py-2">
                  Nenhuma unidade nova encontrada para "{search.trim()}".
                </p>
              ) : (
                newResults.map((unit) => (
                  <ExtraWorkersListItem
                    key={`search-${unit.id}`}
                    unitId={Number(unit.id)}
                    title={unit.descriptionFull || unit.description}
                    subtitle={unit.addressFull || (unit.code ? `Cód. ${unit.code}` : undefined)}
                    total={0}
                    value={0}
                    editable={canEditWorkers}
                    saving={savingUnitId === Number(unit.id)}
                    onChange={handleSave}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
