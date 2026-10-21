import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDateInBrazil } from '../../utils/formatters';
import {
  describePeriod,
  isShiftOpen,
  pickPeriodForNow,
  suggestNextShiftRange,
} from '../../utils/appNoticePeriod';
import {
  getBloqueioLancamento,
  getNoticeJanelaStatus,
  type JanelaStatus,
} from '../../utils/appNoticeWindow';

import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppNotices } from '../../hooks/useAppNotices';
import { dataService } from '../../services/dataService';
import { NoticeWorker, NoticeWorkerPeriod, SystemNotice, Unit } from '../../types';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExtraWorkersListItem } from '../../components/appNotices/ExtraWorkersListItem';
import { ShiftCreator } from '../../components/appNotices/ShiftCreator';
import { toast } from 'sonner';

interface UnitEntry {
  unitId: number;
  title: string;
  subtitle?: string;
  total: number;
  value: number;
}

const JANELA_LABEL: Record<JanelaStatus, string> = {
  active: 'ativo',
  future: 'exibição ainda não iniciada',
  ended: 'exibição encerrada',
};

interface ExtraWorkersListProps {
  /** Navegação para outra tela (usada no atalho que resolve o bloqueio). */
  onNavigate?: (screen: string) => void;
}

export const ExtraWorkersList: React.FC<ExtraWorkersListProps> = ({ onNavigate }) => {
  const { canView } = usePermissions();
  const { currentUser } = useAuth();
  const { notices, loading: loadingNotices } = useAppNotices();

  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<NoticeWorkerPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [viewPeriod, setViewPeriod] = useState<NoticeWorkerPeriod | null>(null);
  const [creatingShift, setCreatingShift] = useState(false);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [rows, setRows] = useState<NoticeWorker[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const loadedRowsKeyRef = useRef<string>('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Unit[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState<number | null>(null);

  const companyId = currentUser?.companyId;
  const isSuper = !!currentUser?.isAdminSuper;
  // Acesso à tela = acesso total: a rota `notices_workers_extra` gateia a
  // visão (Sidebar/BottomNav/guard abaixo) e quem entra pode lançar.
  // `isAdminSuper` continua com bypass (PermissionsContext.hasPermission).
  const canEditWorkers = canView('notices_workers_extra');
  // Company numérica do usuário (undefined quando o perfil só herda company
  // pela equipe) — usada como escopo de leitura/gravação.
  const userCompanyId = useMemo(() => {
    const id = Number(companyId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [companyId]);

  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) || null;

  // Seleciona um aviso ativo ("em andamento") — prefere o primeiro com
  // janela de visualização em curso (lançável); senão, o primeiro da lista.
  useEffect(() => {
    if (notices.length === 0) {
      setSelectedNoticeId(null);
      return;
    }
    if (!notices.some((n) => n.id === selectedNoticeId)) {
      const now = new Date();
      const preferred =
        notices.find((n) => getNoticeJanelaStatus(n, now) === 'active') || notices[0];
      setSelectedNoticeId(preferred.id);
    }
  }, [notices, selectedNoticeId]);

  /**
   * Loads shifts and extra worker entries for the notice.
   * The displayed shift is the explicitly selected one, or by default the one
   * containing the current moment (clock); if none is current, the most recent.
   */
  const loadAll = useCallback(
    async (notice: SystemNotice | null, periodId?: number | null) => {
      if (!notice?.id) {
        setPeriods([]);
        setViewPeriod(null);
        setRows([]);
        setLoadingRows(false);
        loadedRowsKeyRef.current = '';
        return;
      }
      const key = `${notice.id}:${periodId ?? 'auto'}`;
      if (loadedRowsKeyRef.current !== key) {
        setLoadingRows(true);
      }
      try {
        const periodsList = await dataService.getNoticeWorkerPeriods(notice.id);
        setPeriods(periodsList);

        // Escala exibida: a escolhida explicitamente; senão, a vigente agora;
        // senão, a mais recente do aviso.
        let target: NoticeWorkerPeriod | null = null;
        if (periodId != null) {
          target = periodsList.find((p) => p.id === periodId) ?? null;
        }
        if (!target) {
          target =
            pickPeriodForNow(periodsList, new Date(), notice.viewEndDate) ??
            periodsList[periodsList.length - 1] ??
            null;
        }
        setViewPeriod(target);
        setSelectedPeriodId(target?.id ?? null);
        if (!target) {
          setRows([]);
          loadedRowsKeyRef.current = key;
          return;
        }
        const data = await dataService.getNoticeWorkers(
          notice.id,
          isSuper ? undefined : userCompanyId,
          target.id
        );
        setRows(data);
        loadedRowsKeyRef.current = key;
      } catch (error) {
        console.error('Error loading notice workers:', error);
        setRows([]);
      } finally {
        setLoadingRows(false);
      }
    },
    [isSuper, userCompanyId]
  );

  useEffect(() => {
    if (selectedNotice) {
      void loadAll(selectedNotice, selectedPeriodId);
    } else {
      setPeriods([]);
      setViewPeriod(null);
      setSelectedPeriodId(null);
      setRows([]);
      setLoadingRows(false);
      loadedRowsKeyRef.current = '';
    }
    // selectedPeriodId é resolvido dentro do loadAll; incluí-lo aqui causaria loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNotice, loadAll]);

  // Modo edição: a ESCALA selecionada ainda em curso + janela de visualização
  // do aviso em curso. Escala encerrada → consulta em modo leitura.
  // `nowInstant` acompanha o relógio (atualiza a cada minuto) para que o
  // bloqueio por escala encerrada apareça sem recarregar a página.
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => {
    const timer = setInterval(() => setMinuteTick(Math.floor(Date.now() / 60000)), 60000);
    return () => clearInterval(timer);
  }, []);
  const nowInstant = useMemo(() => new Date(), [minuteTick]);

  // Defaults do formulário "Nova escala": a primeira escala do aviso vem com a
  // janela de visualização inteira; os seguintes começam no fim do último.
  const suggestedShiftRange = useMemo(
    () => suggestNextShiftRange(periods, selectedNotice?.viewStartDate, selectedNotice?.viewEndDate),
    [periods, selectedNotice?.viewStartDate, selectedNotice?.viewEndDate]
  );

  // Situação da janela de visualização do aviso selecionado (explica bloqueios)
  const janelaStatus = selectedNotice ? getNoticeJanelaStatus(selectedNotice, nowInstant) : null;

  // A escala exibida ainda não terminou? (critério de edição da MO extra dela)
  const shiftIsOpen = isShiftOpen(viewPeriod, nowInstant, selectedNotice?.viewEndDate);

  // Faixa de chips das escalas — usada para centralizar a escala selecionada.
  const chipsRef = useRef<HTMLDivElement>(null);

  // Escala que contém o instante atual ("escala de agora"), para destacá-la na
  // faixa mesmo quando outra está selecionada para consulta.
  const currentPeriodId = useMemo(
    () => pickPeriodForNow(periods, nowInstant, selectedNotice?.viewEndDate)?.id ?? null,
    [periods, nowInstant, selectedNotice?.viewEndDate]
  );

  // Centraliza o chip selecionado na faixa (só rola a faixa, nunca a página).
  useEffect(() => {
    if (selectedPeriodId == null || !chipsRef.current) return;
    const chip = chipsRef.current.querySelector<HTMLElement>(
      `[data-period-id="${selectedPeriodId}"]`
    );
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedPeriodId]);

  /**
   * Criar escala depende só do escopo (permissão + aviso + janela), NUNCA da
   * escala selecionada — senão o aviso sem nenhuma escala ficaria travado para
   * sempre (sem escala não há `viewPeriod`, logo nada seria "em curso").
   */
  const canCreateShift =
    canEditWorkers && !!selectedNotice && janelaStatus === 'active';

  // Motivo do bloqueio do lançamento (null = liberado)
  const bloqueio = getBloqueioLancamento({
    canEdit: canEditWorkers,
    hasNotice: !!selectedNotice,
    isShiftOpen: shiftIsOpen,
    janelaStatus,
  });

  // Edição da MO extra liberada? (fonte única: o classificador de bloqueio)
  const canWriteHere = bloqueio === null;

  /**
   * Launch extra MO: same base as creating a shift. With no shifts at all, the
   * service automatically opens the first one (see `resolvePeriodForWrite`),
   * so the absence of shifts must not block the launch.
   */
  const canLaunchWorker = canCreateShift;

  // Pesquisa de unidades: bloqueada quando a escala selecionada está encerrada.
  const canSearchUnits = canEditWorkers && !!selectedNotice && shiftIsOpen;

  // Text and action to resolve the block. Hidden when the user can still
  // create shifts: "scale closed" is a read-only notice for the selected shift,
  // not a blocker for working on the notice.
  const bloqueioTexto = useMemo(() => {
    if (!bloqueio) return null;
    if (bloqueio === 'escala_encerrada' && canLaunchWorker) return null;
    const fmt = (value?: string) =>
      value ? formatDateInBrazil(value, 'dateTime', 'pt-BR') : '—';
    switch (bloqueio) {
      case 'sem_permissao_edicao':
        return 'Seu perfil não tem acesso à tela de MO Extra. Fale com o administrador para liberar a rota.';
      case 'sem_aviso':
        return 'Selecione um aviso em andamento para informar a MO extra.';
      case 'escala_encerrada':
        return 'Consulta de escala encerrada — somente leitura. Selecione uma escala em curso para lançar.';
      case 'janela_futura':
        return `A visualização do aviso começa em ${fmt(
          selectedNotice?.viewStartDate
        )} — o lançamento abre nessa data.`;
      case 'janela_encerrada':
        return `A visualização do aviso encerrou em ${fmt(
          selectedNotice?.viewEndDate
        )} — o lançamento fica bloqueado.`;
      default:
        return 'Lançamento indisponível neste momento.';
    }
  }, [bloqueio, selectedNotice, canLaunchWorker]);

  // Atalho que resolve o bloqueio (ajustar vigência no aviso / permissões / escala)
  const bloqueioAcao = useMemo(() => {
    if (!bloqueio) return null;
    if (bloqueio === 'escala_encerrada' && canLaunchWorker) return null;
    if (bloqueio === 'escala_encerrada') {
      // Ação local: seleciona a escala vigente agora, sem sair da tela
      const currentPeriod = pickPeriodForNow(periods, nowInstant, selectedNotice?.viewEndDate);
      if (currentPeriod) {
        return {
          label: 'Ir para a escala atual',
          onClick: () => {
            setSelectedPeriodId(currentPeriod.id);
            setViewPeriod(currentPeriod);
            void loadAll(selectedNotice, currentPeriod.id);
          },
        };
      }
      return null;
    }
    if (!onNavigate) return null;
    if (bloqueio === 'sem_permissao_edicao') {
      return { label: 'Ver permissões do perfil', onClick: () => onNavigate('profile-permissions') };
    }
    if (bloqueio === 'sem_aviso' || bloqueio === 'janela_futura' || bloqueio === 'janela_encerrada') {
      return { label: 'Ir para Avisos', onClick: () => onNavigate('app-notices') };
    }
    return null;
  }, [bloqueio, onNavigate, periods, nowInstant, selectedNotice, loadAll, canLaunchWorker]);

  // Pesquisa incremental de unidades (mínimo 2 caracteres).
  // Gate próprio: a consulta não é uma gravação — não exige "hoje" nem janela
  // ativa. Basta ter acesso à tela e um aviso selecionado (para o escopo).
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2 || !canSearchUnits) {
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
  }, [search, canSearchUnits]);

  // Ao sair do modo de lançamento, limpa a pesquisa pendente
  useEffect(() => {
    if (!canSearchUnits) setSearch('');
  }, [canSearchUnits]);

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
      // Valor editável = company do usuário. Super admin (sem escopo) soma
      // todas as companies, senão não teria valor para editar.
      if (userCompanyId) {
        if (Number(row.companyId) === userCompanyId) entry.value += amount;
      } else {
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
  }, [rows, userCompanyId]);

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

  /**
   * Cria uma nova escala a partir dos timestamps naive escolhidos
   * (`YYYY-MM-DDTHH:mm:00`). A primeira escala de um aviso vem pré-preenchida
   * com a janela de visualização inteira (ver `suggestNextShiftRange`).
   */
  const handleCreateShift = useCallback(
    async (startDate: string, endDate: string) => {
      if (!selectedNotice) {
        toast.error('Selecione um aviso em andamento');
        return false;
      }
      if (!canCreateShift) {
        toast.error(bloqueioTexto || 'A criação de escala está bloqueada neste momento');
        return false;
      }
      if (!startDate || !endDate || endDate <= startDate) {
        toast.error('Horário inválido — o fim deve ser posterior ao início.');
        return false;
      }

      setCreatingShift(true);
      try {
        const created = await dataService.createNoticeWorkerPeriod({
          noticeId: selectedNotice.id,
          startDate,
          endDate,
          userId: currentUser?.id ? Number(currentUser.id) : null,
        });
        // O service pode ESTICAR o início para trás (cobrir o vão da escala
        // anterior) — avisa quando isso acontece.
        const stretched = created?.startDate && !created.startDate.startsWith(startDate);
        toast.success(
          stretched
            ? 'Escala criada — o início foi ajustado para encostar na escala anterior'
            : 'Escala criada'
        );
        await loadAll(selectedNotice, created?.id ?? undefined);
        return true;
      } catch (error) {
        const code = error instanceof Error ? error.message : '';
        if (code === 'PERIODO_ENGOLIDO_COM_LANCAMENTOS') {
          toast.error(
            'A nova escala cobriria totalmente uma escala que já tem MO extra lançada. Ajuste os horários ou lance a MO extra na escala nova em vez disso.'
          );
        } else if (code === 'PERIODO_SOBREPOSTO') {
          toast.error('Já existe uma escala nesse horário — escolha um intervalo livre.');
        } else if (code === 'PERIODO_FORA_DA_JANELA') {
          toast.error(
            'O horário está fora da janela de visualização do aviso. Se a escala termina no dia seguinte, confira se o aviso ainda cobre esse horário.'
          );
        } else if (code === 'PERIODO_INVALIDO') {
          toast.error('Horário inválido — o fim deve ser depois do início.');
        } else if (code === 'NOTICE_NOT_FOUND') {
          toast.error('Aviso não encontrado');
        } else {
          const detail = error instanceof Error ? error.message : String(error);
          console.error('Error creating notice worker period:', error);
          toast.error(`Erro ao criar escala: ${detail}`);
        }
        return false;
      } finally {
        setCreatingShift(false);
      }
    },
    [selectedNotice, canCreateShift, bloqueioTexto, currentUser?.id, loadAll]
  );

  const handleSave = useCallback(
    async (unitId: number, amount: number) => {
      if (!selectedNoticeId) {
        toast.error('Selecione um aviso em andamento');
        return;
      }
      if (!shiftIsOpen) {
        toast.error('Escala encerrada — não é possível alterar as quantidades de MO extra.');
        void loadAll(selectedNotice, selectedPeriodId);
        return;
      }
      if (!canLaunchWorker) {
        toast.error(bloqueioTexto || 'Somente o dia atual do aviso pode ser editado');
        void loadAll(selectedNotice, selectedPeriodId);
        return;
      }
      // Escopo de gravação:
      //  - usuário comum: a company do perfil (obrigatória);
      //  - super admin: usa a própria company quando existir; sem ela, o
      //    service/DB decide (company_id é NOT NULL na tabela).
      const scopeCompany = userCompanyId;
      if (!scopeCompany && !isSuper) {
        toast.error(
          'Seu usuário não tem company definida (nem por equipe) — o lançamento de MO extra precisa desse vínculo.'
        );
        return;
      }

      const exists = rows.some(
        (row) => Number(row.unitId) === unitId && Number(row.companyId) === scopeCompany
      );
      if (!exists && amount === 0) return;

      const previous = rows;
      setSavingUnitId(unitId);
      if (scopeCompany) {
        setRows((prev) => {
          if (amount <= 0) {
            return prev.filter(
              (row) => !(Number(row.unitId) === unitId && Number(row.companyId) === scopeCompany)
            );
          }
          const index = prev.findIndex(
            (row) => Number(row.unitId) === unitId && Number(row.companyId) === scopeCompany
          );
          if (index < 0) {
            const searchUnit = results.find((u) => Number(u.id) === unitId);
            return [
              ...prev,
              {
                id: -Date.now(),
                noticeId: selectedNoticeId,
                companyId: scopeCompany,
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
      }

      try {
        if (!scopeCompany) {
          // Super admin sem company própria: a tabela exige company_id NOT NULL.
          // Sem um seletor de company na tela, o lançamento não tem escopo.
          toast.error(
            'Selecione/defina uma company para lançar a MO extra (o registro exige company).'
          );
          return;
        }
        // Grava no TURNO selecionado explicitamente. Sem turno selecionado
        // (nenhuma escala no dia), o service cria uma pelo relógio.
        await dataService.setNoticeWorkers({
          noticeId: selectedNoticeId,
          companyId: scopeCompany,
          unitId,
          amount,
          userId: currentUser?.id ? Number(currentUser.id) : null,
          periodId: selectedPeriodId ?? undefined,
        });
        await loadAll(selectedNotice, selectedPeriodId);
      } catch (error) {
        const code = error instanceof Error ? error.message : '';
        if (code === 'JANELA_ENCERRADA') {
          toast.error('A visualização do aviso já foi encerrada');
        } else if (code === 'JANELA_NAO_INICIADA') {
          toast.error('A visualização do aviso ainda não começou');
        } else if (code === 'NOTICE_NOT_FOUND') {
          toast.error('Aviso não encontrado');
        } else if (code === 'COMPANY_NOT_DEFINED') {
          toast.error('Seu usuário não tem company definida — não é possível vincular a MO extra.');
        } else if (code === 'UNIT_NOT_DEFINED') {
          toast.error('Unidade inválida — a MO extra não foi vinculada.');
        } else {
          // Não mascara a causa real (FK, RLS, constraint do período)
          const detail =
            error instanceof Error
              ? error.message
              : typeof error === 'object' && error !== null && 'message' in error
                ? String((error as any).message)
                : String(error);
          console.error('Error saving notice workers:', error);
          toast.error(`Erro ao salvar MO extra: ${detail}`);
        }
        setRows(previous);
      } finally {
        setSavingUnitId(null);
      }
    },
    [selectedNoticeId, selectedNotice, selectedPeriodId, isSuper, userCompanyId, rows, currentUser?.id, canLaunchWorker, bloqueioTexto, loadAll, results]
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
          message="Nenhum aviso em andamento. A MO extra é informada durante a janela de visualização de um aviso ativo — crie ou ative um aviso na tela Avisos."
          action={
            onNavigate
              ? { label: 'Ir para Avisos', onClick: () => onNavigate('app-notices') }
              : undefined
          }
        />
      </div>
    );
  }

  const periodBadge = viewPeriod
    ? describePeriod(viewPeriod, selectedNotice?.viewEndDate)
    : null;

  return (
    <div className="flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden no-scrollbar bg-background-light dark:bg-background-dark safe-area-bottom">
      <div className="p-4 space-y-4 border-b border-slate-200 dark:border-slate-800 min-w-0 w-full">
        {/* Aviso em andamento */}
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-1.5">
            Aviso em andamento *
          </label>
          <Select
            value={selectedNoticeId != null ? String(selectedNoticeId) : ''}
            onChange={(e) => setSelectedNoticeId(e.target.value ? Number(e.target.value) : null)}
            options={notices.map((notice) => ({
              value: String(notice.id),
              label: notice.title,
            }))}
            placeholder="Selecione um aviso"
          />
          {selectedNotice && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatDateInBrazil(selectedNotice.viewStartDate, 'dateTime', 'pt-BR')} —{' '}
                {formatDateInBrazil(selectedNotice.viewEndDate, 'dateTime', 'pt-BR')}
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${
                  janelaStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : janelaStatus === 'future'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {janelaStatus === 'active'
                    ? 'check_circle'
                    : janelaStatus === 'future'
                      ? 'schedule'
                      : 'block'}
                </span>
                {janelaStatus ? JANELA_LABEL[janelaStatus] : ''}
              </span>
            </div>
          )}
        </div>

        {/* Escalas do aviso — várias no mesmo dia, e podem cruzar dias */}
        {selectedNotice && (
          <div className="space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                Escalas do aviso ({periods.length})
              </label>
              <div className="flex items-center gap-2 shrink-0">
                {creatingShift && (
                  <span className="animate-spin material-symbols-outlined text-[16px] text-primary">
                    progress_activity
                  </span>
                )}
                {canCreateShift && (
                  <ShiftCreator
                    triggerOnly
                    open={shiftFormOpen}
                    onOpenChange={setShiftFormOpen}
                    onCreate={handleCreateShift}
                    disabled={creatingShift}
                    defaultStart={suggestedShiftRange.start}
                    defaultEnd={suggestedShiftRange.end}
                  />
                )}
              </div>
            </div>

            {periods.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Nenhuma escala lançada. Crie a primeira abaixo
                {canLaunchWorker && ' ou lance a MO extra — o primeiro lançamento cria automaticamente'}.
              </p>
            ) : (
              <div
                ref={chipsRef}
                className="flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar w-full max-w-full min-w-0 pb-1 scroll-smooth"
              >
                {periods.map((p) => {
                  const isSelected = selectedPeriodId === p.id;
                  const isCurrent = currentPeriodId === p.id && !isSelected;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-period-id={p.id}
                      onClick={() => {
                        setSelectedPeriodId(p.id);
                        setViewPeriod(p);
                        if (selectedNotice) {
                          void loadAll(selectedNotice, p.id);
                        }
                      }}
                      title={isCurrent ? 'Escala em andamento agora' : undefined}
                      className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight border transition-colors ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      {isCurrent && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse"
                          aria-hidden="true"
                        />
                      )}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Formulário aberto ocupa a largura cheia, abaixo das escalas */}
            {canCreateShift && shiftFormOpen && (
              <ShiftCreator
                open={shiftFormOpen}
                onOpenChange={setShiftFormOpen}
                onCreate={handleCreateShift}
                disabled={creatingShift}
                defaultStart={suggestedShiftRange.start}
                defaultEnd={suggestedShiftRange.end}
              />
            )}
          </div>
        )}

        {/* Período exibido (vigente ou histórico) */}
        {selectedNotice && (
          <div
            className={`rounded-xl px-3 py-2 border ${
              viewPeriod
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 mt-0.5">
                {viewPeriod ? 'schedule' : 'hourglass_empty'}
              </span>
              <div className="min-w-0">
                {viewPeriod ? (
                  <>
                    <p className="text-[11px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-300">
                      {shiftIsOpen ? 'Escala em curso' : 'Escala encerrada (consulta)'}
                      {canWriteHere && ' · edição liberada'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {periodBadge}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Nenhuma escala lançada.
                    {canWriteHere && ' O primeiro lançamento cria o período automaticamente.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumo (por escala) */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-tight">
              Unidades{viewPeriod ? ` · ${viewPeriod.label}` : ''}
            </p>
            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
              {totals.units}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-tight">
              MO Extra{viewPeriod ? ` · ${viewPeriod.label}` : ''}
            </p>
            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
              {totals.workers}
            </p>
          </div>
        </div>
      </div>

      {/* Pesquisa de unidades — visível apenas com escala aberta */}
      {shiftIsOpen && (
        <div className="p-4 space-y-2 border-b border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Pesquisar Unidades
          </label>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            disabled={!canSearchUnits}
            placeholder={canSearchUnits ? 'Pesquisar unidade...' : 'Pesquisa indisponível'}
            rightAction={
              searching ? (
                <span className="animate-spin material-symbols-outlined text-[18px] text-primary pr-2">
                  progress_activity
                </span>
              ) : null
            }
          />
        {bloqueioTexto && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-start gap-1">
              <span className="material-symbols-outlined text-[14px] mt-px">info</span>
              <span>{bloqueioTexto}</span>
            </p>
            {bloqueioAcao && (
              <button
                type="button"
                onClick={bloqueioAcao.onClick}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                {bloqueioAcao.label}
              </button>
            )}
          </div>
        )}
        {canSearchUnits && search.trim().length >= 2 && (
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
                  editable={canLaunchWorker}
                  saving={savingUnitId === Number(unit.id)}
                  onChange={handleSave}
                />
              ))
            )}
          </div>
        )}
        </div>
      )}

      {/* Unidades lançadas */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            {canLaunchWorker ? 'Unidades lançadas' : `Escala: ${viewPeriod?.label ?? '—'}`}
          </h2>
          {loadingRows && listItems.length === 0 && (
            <span className="animate-spin material-symbols-outlined text-[16px] text-primary">
              progress_activity
            </span>
          )}
        </div>

        {!loadingRows && listItems.length === 0 ? (
          <EmptyState
            icon="groups"
            message={
              canLaunchWorker
                ? 'Nenhuma unidade lançada nesta escala ainda.'
                : 'Nenhuma unidade lançada nesta escala.'
            }
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
                editable={canLaunchWorker}
                saving={savingUnitId === item.unitId}
                onChange={handleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
