/**
 * Programação Diária de Atendimento (Gestão > aba Programação).
 *
 * Kanban por contrato + dia:
 *   • faixa "OS's ABERTAS" (rolagem horizontal): OSs abertas do contrato ainda não priorizadas;
 *     arrastar uma delas para PRIORITÁRIAS a coloca na fila (e pode voltar);
 *   • faixa "OS's PRIORIDADE DE ATENDIMENTO" (rolagem horizontal): as OSs escolhidas, reordenáveis
 *     da esquerda (mais prioritária) para a direita — prioridade registrada por dia (dia sem
 *     registro parte da última prioridade registrada);
 *     arrastar uma OS Em Avaliação para uma equipe AUTORIZA a OS para ela (qualquer equipe);
 *     OS com equipe já definida só entra na coluna da própria equipe;
 *   • colunas = equipes do prestador do contrato que têm líder; a ordem dos cards é a
 *     sequência de execução do dia (salva automaticamente ~1s após cada movimento);
 *   • colunas começam limpas no dia (só as OSs inseridas); na coluna a OS só é reordenada;
 *   • dias passados são somente leitura (mostram o que foi programado).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCorners,
    pointerWithin,
    useDndContext,
    useDroppable,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import type { Contract, Order, User } from '../../types';
import { dataService } from '../../services/dataService';
import type { DailyScheduleBoard, DailyScheduleItemInput, DailyScheduleMoveLog, DailyScheduleOrder, DailyScheduleTeam } from '../../services/orders/dailyScheduleService';
import { DAILY_SCHEDULE_STATUS, ORDER_STATUS_CONFLICT } from '../../services/orders/dailyScheduleService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { formatDateInBrazil, getBrazilDateInputValue } from '../../utils/formatters';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { TreeFilterSelect } from '../../components/ui/TreeFilterSelect';
import { FilterSelectionContent } from '../../components/ui/FilterSelectionContent';
import { Modal } from '../../components/ui/Modal';
import { Calendar } from '../../components/ui/Calendar';
import { Loading } from '../../components/ui/Loading';
import { OPEN_ID_PREFIX, PRIORITY_ID_PREFIX, PriorityOrderCard, ScheduleOrderCardView, canChangeTeam, canReturnFromTeam, isScheduleLocked, scheduleTeamRule } from '../../components/orderRequests/dailySchedule/ScheduleOrderCard';
import { ScheduleTeamColumn } from '../../components/orderRequests/dailySchedule/ScheduleTeamColumn';
import { ScheduleAuthorizeModal } from '../../components/orderRequests/dailySchedule/ScheduleAuthorizeModal';
import { ScheduleOrderActionsModal, type ScheduleActionTarget } from '../../components/orderRequests/dailySchedule/ScheduleOrderActionsModal';

const PRIORITY = 'priority';
const OPEN = 'open';
type StripKind = typeof OPEN | typeof PRIORITY;

interface StripFilter {
    unit: string[];
    tag: string[];
    search: string;
}
const EMPTY_STRIP_FILTER: StripFilter = { unit: [], tag: [], search: '' };
const EMPTY_STRIP_FILTERS: Record<StripKind, StripFilter> = { open: EMPTY_STRIP_FILTER, priority: EMPTY_STRIP_FILTER };

const filterStrip = (list: DailyScheduleOrder[], f: StripFilter) => {
    const term = f.search.trim().toLowerCase();
    return list.filter(o =>
        (f.unit.length === 0 || (o.unitId && f.unit.includes(o.unitId))) &&
        (f.tag.length === 0 || (o.assetTagId && f.tag.includes(o.assetTagId))) &&
        (!term || [o.orderMask, o.unitDescription, o.assetTagDescription, o.assetTagSubDescription, o.requestedServices]
            .some(v => String(v || '').toLowerCase().includes(term))));
};

const byRequestedAt = (a: DailyScheduleOrder, b: DailyScheduleOrder) =>
    String(a.requestedAt || '').localeCompare(String(b.requestedAt || ''));
/** Equipe responsável e líder gravados na OS ao ir para a coluna da equipe (espelha v_orders). */
const teamFields = (team: DailyScheduleTeam): Partial<DailyScheduleOrder> => ({
    teamId: team.id,
    teamLeaderId: team.leaderId,
    teamCode: team.code,
    teamDescription: team.name,
    teamLeaderName: team.leaderName,
});

const CONTRACT_STORAGE_KEY = 'dailySchedule_contractId';
/** Dia de atendimento escolhido: ao sair e voltar para a tela, continua o mesmo. */
const DATE_STORAGE_KEY = 'dailySchedule_date';
const SAVE_DELAY_MS = 1000;
const ROUTE_KEY = 'orders_daily_schedule';

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface PendingSave {
    contractId: string;
    date: string;
    items: DailyScheduleItemInput[];
    timer: ReturnType<typeof setTimeout>;
}

interface PendingPrioritySave {
    contractId: string;
    date: string;
    orderIds: string[];
    timer: ReturnType<typeof setTimeout>;
}

interface PendingAuthorization {
    order: DailyScheduleOrder;
    team: DailyScheduleTeam;
    index: number;
}

const shiftDate = (date: string, days: number) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const readStorage = (key: string) => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
};
const writeStorage = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* sem storage: ignora */ }
};

const contractLabel = (c: Contract) => [c.code, c.description].filter(Boolean).join(' · ') || `Contrato ${c.id}`;

const errorMessage = (err: any) => err?.message || 'Erro inesperado';

/** Itens a gravar: todas as colunas, na ordem exibida. */
const toItems = (board: DailyScheduleBoard): DailyScheduleItemInput[] =>
    board.teams.flatMap(team => (board.columns[team.id] || []).map(order => ({ orderId: order.id, teamId: team.id })));

const isContainerId = (id: string | number) => String(id) === PRIORITY || String(id) === OPEN || String(id).startsWith('team:');

const stripPrefix = (id: string) => {
    if (id.startsWith(PRIORITY_ID_PREFIX)) return id.slice(PRIORITY_ID_PREFIX.length);
    if (id.startsWith(OPEN_ID_PREFIX)) return id.slice(OPEN_ID_PREFIX.length);
    return id;
};

const uniqueOptions = (pairs: Array<[string | undefined, string | undefined]>) => {
    const map = new Map<string, string>();
    pairs.forEach(([value, label]) => { if (value && !map.has(value)) map.set(value, label || value); });
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
};

/** Prioriza o card sob o ponteiro (define a posição); a coluna/faixa só vale quando não há card. */
const collisionDetection: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    if (hits.length > 0) {
        const cards = hits.filter(h => !isContainerId(h.id));
        return cards.length > 0 ? cards : hits;
    }
    return closestCorners(args);
};

/**
 * Rolagem horizontal com o mouse: clicar e puxar em qualquer lugar (menos na alça ⠿ e em
 * campos de texto) rola o contêiner. `wheel`: a roda do mouse também rola para os lados
 * (até a ponta; depois a página volta a rolar). No toque, a rolagem nativa já funciona.
 */
const useHorizontalScroll = (wheel: boolean) => {
    const drag = useDraggableScroll();
    const { ref } = drag;
    useEffect(() => {
        const el = ref.current;
        if (!el || !wheel) return;
        const onWheel = (e: WheelEvent) => {
            if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            const max = el.scrollWidth - el.clientWidth;
            if (max <= 0) return;
            const next = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY));
            if (next === el.scrollLeft) return;
            el.scrollLeft = next;
            e.preventDefault();
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [ref, wheel]);
    return {
        ref,
        onMouseDown: (e: React.MouseEvent) => {
            // Só a alça fica de fora (ela arrasta a OS). Em botões, um clique sem mover
            // continua sendo clique (a rolagem só começa após ~5px).
            if ((e.target as HTMLElement).closest('[data-drag-handle], input, select, textarea')) return;
            drag.onMouseDown(e);
        },
        onClickCapture: drag.onClickCapture,
    };
};

/**
 * Faixas OS's ABERTAS / PRIORIDADE DE ATENDIMENTO: a SEÇÃO inteira (título, filtros e
 * cards) é área de soltar — antes só a fileira de cards, e soltar no título caía no alvo
 * "mais próximo" (outra faixa) sem fazer nada. Destaca ao passar por cima: azul quando
 * aceita (vindo da outra faixa), vermelho quando recusa (vindo de uma equipe).
 */
const PriorityStrip: React.FC<{
    containerId: StripKind;
    className: string;
    header: React.ReactNode;
    accepting: boolean;
    refusing: boolean;
    itemIds: string[];
    children: React.ReactNode;
}> = ({ containerId, className, header, accepting, refusing, itemIds, children }) => {
    const { setNodeRef } = useDroppable({ id: containerId, data: { container: containerId } });
    const { over } = useDndContext();
    const scroll = useHorizontalScroll(true);
    // Sobre a faixa ou sobre um card dela (os cards têm prioridade na colisão).
    const hovering = !!over && (String(over.id) === containerId || (over.data.current as any)?.container === containerId);
    const highlight = hovering && refusing
        ? 'ring-2 ring-rose-400 bg-rose-500/5'
        : hovering && accepting
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-primary/5'
            : accepting
                ? 'outline-dashed outline-2 outline-offset-2 outline-primary/50'
                : '';
    return (
        <section ref={setNodeRef} className={`${className} transition-all ${highlight}`}>
            {header}
            <div
                ref={scroll.ref}
                onMouseDown={scroll.onMouseDown}
                onClickCapture={scroll.onClickCapture}
                className="flex gap-3 overflow-x-auto py-2 px-1 -mx-1 min-h-[120px] rounded-2xl cursor-grab active:cursor-grabbing"
            >
                <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
                    {children}
                </SortableContext>
            </div>
        </section>
    );
};

interface OrdersDailyScheduleScreenProps {
    currentUser: User;
    onSelectOrder?: (order: Order) => void;
}

export const OrdersDailyScheduleScreen: React.FC<OrdersDailyScheduleScreenProps> = ({ currentUser, onSelectOrder }) => {
    const { canCreate } = usePermissions();
    /** Rolagem das colunas das equipes com o mouse (a roda continua rolando a página). */
    const teamsScroll = useHorizontalScroll(false);
    const today = getBrazilDateInputValue();

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [contractsLoading, setContractsLoading] = useState(true);
    const [contractId, setContractId] = useState<string>(() => readStorage(CONTRACT_STORAGE_KEY));
    const [date, setDate] = useState<string>(() => {
        const saved = readStorage(DATE_STORAGE_KEY);
        return /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : today;
    });
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [contractModalOpen, setContractModalOpen] = useState(false);
    /** Filtro EQ.RESPONSAVEL: vazio = todas as equipes. */
    const [teamFilter, setTeamFilter] = useState<string[]>([]);
    /** Filtros da faixa de prioridades: vazio = todos. */
    const [stripFilters, setStripFilters] = useState<Record<StripKind, StripFilter>>(EMPTY_STRIP_FILTERS);
    const [stripFilterModal, setStripFilterModal] = useState<{ strip: StripKind; field: 'unit' | 'tag' } | null>(null);
    const patchStripFilter = (strip: StripKind, patch: Partial<StripFilter>) =>
        setStripFilters(current => ({ ...current, [strip]: { ...current[strip], ...patch } }));

    const [board, setBoard] = useState<DailyScheduleBoard | null>(null);
    const [loading, setLoading] = useState(false);
    /** Giro do botão de atualizar: dura o carregamento, no mínimo ~0,7 s (visível mesmo se for rápido). */
    const [refreshing, setRefreshing] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    const [active, setActive] = useState<{ order: DailyScheduleOrder; container: string } | null>(null);
    const [pendingAuth, setPendingAuth] = useState<PendingAuthorization | null>(null);
    const [authSaving, setAuthSaving] = useState(false);
    const [actionTarget, setActionTarget] = useState<ScheduleActionTarget | null>(null);

    const pendingSaveRef = useRef<PendingSave | null>(null);
    const pendingPriorityRef = useRef<PendingPrioritySave | null>(null);
    const mountedRef = useRef(true);
    const loadSeqRef = useRef(0);

    const contract = useMemo(() => contracts.find(c => c.id === contractId), [contracts, contractId]);
    const isPast = date < today;
    /** canCreate('orders_daily_schedule'): ordenar prioridades, mover para equipes, reordenar e trocar de equipe. */
    const hasCreatePermission = canCreate(ROUTE_KEY);
    const readOnly = isPast || !hasCreatePermission;
    const canSaveSequence = !readOnly && !!board?.supported;
    const canEditPriorities = hasCreatePermission && !isPast;
    const canSavePriorities = canEditPriorities && !!board?.supported;

    // ── Contratos ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setContractsLoading(true);
            try {
                const list = currentUser?.isAdminSuper
                    ? await dataService.getContracts()
                    : await dataService.getManagedContracts(String(currentUser.id));
                const visible = (list || [])
                    .filter(c => !c.isDeleted && c.isAvailable !== false)
                    .sort((a, b) => String(a.code || a.description || '').localeCompare(String(b.code || b.description || '')));
                if (cancelled) return;
                setContracts(visible);
                setContractId(prev => {
                    if (prev && visible.some(c => c.id === prev)) return prev;
                    return visible.length === 1 ? visible[0].id : '';
                });
            } catch (err) {
                console.error('Erro ao carregar contratos da programação diária:', err);
                if (!cancelled) toast.error('Erro ao carregar contratos');
            } finally {
                if (!cancelled) setContractsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [currentUser?.id, currentUser?.isAdminSuper]);

    // ── Gravação automática ───────────────────────────────────────────────────
    const runSave = useCallback(async (save: Omit<PendingSave, 'timer'>) => {
        if (mountedRef.current) setSaveState('saving');
        try {
            await dataService.saveDailySchedule(save.contractId, save.date, save.items);
            if (mountedRef.current && !pendingSaveRef.current && !pendingPriorityRef.current) setSaveState('saved');
        } catch (err) {
            console.error('Erro ao salvar programação diária:', err);
            if (mountedRef.current) {
                setSaveState('error');
                toast.error(`Sequência não salva: ${errorMessage(err)}`);
            }
        }
    }, []);

    const runPrioritySave = useCallback(async (save: Omit<PendingPrioritySave, 'timer'>) => {
        if (mountedRef.current) setSaveState('saving');
        try {
            await dataService.saveOrderPriorities(save.contractId, save.date, save.orderIds);
            if (mountedRef.current && !pendingSaveRef.current && !pendingPriorityRef.current) setSaveState('saved');
        } catch (err) {
            console.error('Erro ao salvar prioridades:', err);
            if (mountedRef.current) {
                setSaveState('error');
                toast.error(`Prioridades não salvas: ${errorMessage(err)}`);
            }
        }
    }, []);

    const flushSave = useCallback(() => {
        const pending = pendingSaveRef.current;
        if (pending) {
            clearTimeout(pending.timer);
            pendingSaveRef.current = null;
            void runSave(pending);
        }
        const pendingPriority = pendingPriorityRef.current;
        if (pendingPriority) {
            clearTimeout(pendingPriority.timer);
            pendingPriorityRef.current = null;
            void runPrioritySave(pendingPriority);
        }
    }, [runSave, runPrioritySave]);

    const schedulePrioritySave = useCallback((priorities: DailyScheduleOrder[]) => {
        if (!canSavePriorities || !contractId) return;
        if (pendingPriorityRef.current) clearTimeout(pendingPriorityRef.current.timer);
        const save = { contractId, date, orderIds: priorities.map(o => o.id) };
        pendingPriorityRef.current = {
            ...save,
            timer: setTimeout(() => {
                pendingPriorityRef.current = null;
                void runPrioritySave(save);
            }, SAVE_DELAY_MS),
        };
        setSaveState('pending');
    }, [canSavePriorities, contractId, date, runPrioritySave]);

    const scheduleSave = useCallback((next: DailyScheduleBoard) => {
        if (!canSaveSequence || !contractId) return;
        // Prioridade ainda herdada: registra junto, para o histórico do dia ter as duas.
        if (next.prioritiesInheritedFrom) {
            schedulePrioritySave(next.priorities);
            setBoard(current => (current ? { ...current, prioritiesInheritedFrom: undefined } : current));
        }
        if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current.timer);
        const save = { contractId, date, items: toItems(next) };
        pendingSaveRef.current = {
            ...save,
            timer: setTimeout(() => {
                pendingSaveRef.current = null;
                void runSave(save);
            }, SAVE_DELAY_MS),
        };
        setSaveState('pending');
    }, [canSaveSequence, contractId, date, runSave, schedulePrioritySave]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            flushSave();
        };
    }, [flushSave]);

    // ── Carga do quadro ───────────────────────────────────────────────────────
    /** `fresh`: busca tudo de novo, inclusive as equipes (botão atualizar). */
    const loadBoard = useCallback(async (fresh?: boolean) => {
        if (!contract) { setBoard(null); return; }
        if (!contract.providerDepartmentId) {
            setBoard(null);
            return;
        }
        const seq = ++loadSeqRef.current;
        setLoading(true);
        try {
            const data = await dataService.getDailyScheduleBoard({
                contractId: contract.id,
                providerDepartmentId: contract.providerDepartmentId,
                date,
                readOnly: date < getBrazilDateInputValue(),
                fresh,
            });
            if (seq === loadSeqRef.current) {
                setBoard(data);
                setSaveState('idle');
            }
        } catch (err) {
            console.error('Erro ao carregar programação diária:', err);
            if (seq === loadSeqRef.current) {
                setBoard(null);
                toast.error(`Erro ao carregar a programação: ${errorMessage(err)}`);
            }
        } finally {
            if (seq === loadSeqRef.current) setLoading(false);
        }
    }, [contract, date]);

    useEffect(() => { void loadBoard(); }, [loadBoard]);

    // Hoje com prioridade herdada: registra já como a do dia (histórico completo mesmo sem mexer).
    useEffect(() => {
        if (!board?.prioritiesInheritedFrom || date !== today || !canSavePriorities) return;
        schedulePrioritySave(board.priorities);
        setBoard(current => (current ? { ...current, prioritiesInheritedFrom: undefined } : current));
    }, [board?.prioritiesInheritedFrom, board?.priorities, date, today, canSavePriorities, schedulePrioritySave]);

    const changeDate = (next: string) => {
        flushSave();
        setDate(next);
        writeStorage(DATE_STORAGE_KEY, next);
        setCalendarOpen(false);
    };

    const changeContract = (next: string) => {
        flushSave();
        if (next !== contractId) {
            setTeamFilter([]);
            setStripFilters(EMPTY_STRIP_FILTERS);
        }
        setContractId(next);
        writeStorage(CONTRACT_STORAGE_KEY, next);
    };

    // ── Operações do quadro ───────────────────────────────────────────────────
    /** Card arrastado: id 'p:<id>' = faixa de prioridades; senão, coluna onde está. */
    const locate = (dndId: string): { order: DailyScheduleOrder; container: string } | null => {
        if (!board) return null;
        if (dndId.startsWith(OPEN_ID_PREFIX)) {
            const order = board.openOrders.find(o => o.id === stripPrefix(dndId));
            return order ? { order, container: OPEN } : null;
        }
        if (dndId.startsWith(PRIORITY_ID_PREFIX)) {
            const order = board.priorities.find(o => o.id === stripPrefix(dndId));
            return order ? { order, container: PRIORITY } : null;
        }
        for (const team of board.teams) {
            const order = (board.columns[team.id] || []).find(o => o.id === dndId);
            if (order) return { order, container: team.id };
        }
        return null;
    };

    const reorderWithin = (teamId: string, from: number, to: number) => {
        if (!board || readOnly || from === to || to < 0) return;
        const next: DailyScheduleBoard = {
            ...board,
            columns: { ...board.columns, [teamId]: arrayMove(board.columns[teamId], from, to) },
        };
        setBoard(next);
        scheduleSave(next);
    };

    const reorderPriorities = (from: number, to: number) => {
        if (!board || !canEditPriorities || from === to || from < 0 || to < 0 || to >= board.priorities.length) return;
        const priorities = arrayMove(board.priorities, from, to);
        setBoard({ ...board, priorities, prioritiesInheritedFrom: undefined });
        schedulePrioritySave(priorities);
    };

    /** Registra a movimentação (orders_daily_schedules_logs); não segura a tela. */
    const logMove = (order: DailyScheduleOrder, log: Omit<DailyScheduleMoveLog, 'contractId' | 'date' | 'orderId'>) => {
        if (contractId) void dataService.logDailyScheduleMove({ contractId, date, orderId: order.id, ...log });
    };

    /** OS's ABERTAS → OS's PRIORIDADE DE ATENDIMENTO na posição `index`. */
    const prioritize = (order: DailyScheduleOrder, index: number) => {
        if (!board || !canEditPriorities) return;
        const priorities = board.priorities.filter(o => o.id !== order.id);
        const position = Math.min(Math.max(index, 0), priorities.length);
        priorities.splice(position, 0, order);
        logMove(order, { action: 'prioritize', toPosition: position + 1 });
        setBoard({
            ...board,
            openOrders: board.openOrders.filter(o => o.id !== order.id),
            priorities,
            prioritiesInheritedFrom: undefined,
        });
        schedulePrioritySave(priorities);
    };

    /**
     * OS Autorizada na coluna da equipe → volta para PRIORIDADE (na posição `index`) ou para
     * ABERTAS. Sai da equipe só no dia; a OS continua Autorizada com a mesma equipe e líder.
     */
    const returnToStrip = (order: DailyScheduleOrder, fromTeamId: string, strip: StripKind, index: number) => {
        if (!board || readOnly || !canReturnFromTeam(order, strip)) return;
        const wasPrioritized = board.priorities.some(o => o.id === order.id);
        const columns = { ...board.columns, [fromTeamId]: (board.columns[fromTeamId] || []).filter(o => o.id !== order.id) };
        const priorities = board.priorities.filter(o => o.id !== order.id);
        let openOrders = board.openOrders.filter(o => o.id !== order.id);
        if (strip === PRIORITY) {
            priorities.splice(Math.min(Math.max(index, 0), priorities.length), 0, order);
        } else {
            openOrders = [...openOrders, order].sort(byRequestedAt);
        }
        const next: DailyScheduleBoard = { ...board, columns, priorities, openOrders, prioritiesInheritedFrom: undefined };
        setBoard(next);
        scheduleSave(next);
        schedulePrioritySave(priorities);
        logMove(order, { action: 'unassign_team', fromTeamId });
        if (strip === OPEN && wasPrioritized) logMove(order, { action: 'unprioritize' });
        if (strip === PRIORITY && !wasPrioritized) logMove(order, { action: 'prioritize', toPosition: priorities.indexOf(order) + 1 });
        toast.success(`OS ${order.orderMask} voltou para ${strip === PRIORITY ? "OS's PRIORIDADE DE ATENDIMENTO" : "OS's ABERTAS"}`);
    };

    /** OS's PRIORIDADE DE ATENDIMENTO → de volta para OS's ABERTAS (ordem de abertura). */
    const unprioritize = (order: DailyScheduleOrder) => {
        if (!board || !canEditPriorities) return;
        logMove(order, { action: 'unprioritize' });
        const priorities = board.priorities.filter(o => o.id !== order.id);
        const openOrders = [...board.openOrders.filter(o => o.id !== order.id), order].sort(byRequestedAt);
        setBoard({ ...board, priorities, openOrders, prioritiesInheritedFrom: undefined });
        schedulePrioritySave(priorities);
    };

    const handleConflict = (err: any, fallback: string) => {
        if (errorMessage(err) === ORDER_STATUS_CONFLICT) {
            toast.error('A OS mudou de situação em outro lugar. O quadro foi atualizado.');
        } else {
            toast.error(`${fallback}: ${errorMessage(err)}`);
        }
        void loadBoard();
    };

    /** Atualiza a OS na faixa e a coloca na coluna da equipe (tirando de qualquer outra). */
    const placeInTeam = (current: DailyScheduleBoard, updated: DailyScheduleOrder, team: DailyScheduleTeam, index: number): DailyScheduleBoard => {
        const columns: Record<string, DailyScheduleOrder[]> = {};
        for (const [teamId, list] of Object.entries(current.columns)) {
            columns[teamId] = list.filter(o => o.id !== updated.id);
        }
        const target = [...(columns[team.id] || [])];
        target.splice(Math.min(index, target.length), 0, updated);
        columns[team.id] = target;
        return {
            ...current,
            priorities: current.priorities.map(o => (o.id === updated.id ? updated : o)),
            columns,
        };
    };

    /** Equipe em cuja coluna a OS já está neste dia (cada OS entra numa equipe só). */
    const placedTeamOf = (orderId: string): string | undefined => {
        if (!board) return undefined;
        return Object.keys(board.columns).find(teamId => board.columns[teamId].some(o => o.id === orderId));
    };

    /**
     * OS Autorizada para outra equipe (da faixa de prioridade ou de outra coluna): atualiza na
     * OS a equipe responsável e o líder (só se ela ainda estiver Autorizada) e a coloca na coluna.
     */
    const moveAuthorized = async (order: DailyScheduleOrder, team: DailyScheduleTeam, index: number) => {
        if (!board) return;
        const previous = board;
        const fromTeamId = order.teamId;
        const next = placeInTeam(board, { ...order, ...teamFields(team) }, team, index);
        setBoard(next);
        try {
            await dataService.moveAuthorizedOrderToScheduleTeam(order.id, team);
            logMove(order, { action: 'change_team', fromTeamId, toTeamId: team.id, toPosition: index + 1 });
            toast.success(`OS ${order.orderMask} movida para ${team.code} (líder ${team.leaderName})`);
            scheduleSave(next);
        } catch (err) {
            setBoard(previous);
            handleConflict(err, 'Erro ao mover a OS');
        }
    };

    /** OS que já tem a equipe definida: entra na coluna da própria equipe (sem mudar a OS). */
    const placeInOwnTeam = (order: DailyScheduleOrder, team: DailyScheduleTeam, index: number) => {
        if (!board) return;
        const next = placeInTeam(board, order, team, index);
        setBoard(next);
        scheduleSave(next);
        logMove(order, { action: 'assign_team', toTeamId: team.id, toPosition: index + 1 });
        toast.success(`OS ${order.orderMask} programada para ${team.code}`);
    };

    const confirmAuthorization = async (planId?: string) => {
        if (!pendingAuth || !board) return;
        const { order, team, index } = pendingAuth;
        setAuthSaving(true);
        try {
            await dataService.authorizeOrderToScheduleTeam(order.id, team, planId);
            logMove(order, { action: 'authorize_team', toTeamId: team.id, toPosition: index + 1 });
            const authorized: DailyScheduleOrder = {
                ...order,
                statusId: DAILY_SCHEDULE_STATUS.AUTHORIZED,
                statusCode: 'AU',
                statusDescription: 'AUTORIZADA',
                ...teamFields(team),
            };
            setBoard(current => {
                if (!current) return current;
                const next = placeInTeam(current, authorized, team, index);
                scheduleSave(next);
                return next;
            });
            toast.success(`OS ${order.orderMask} autorizada para ${team.code}`);
            setPendingAuth(null);
        } catch (err) {
            setPendingAuth(null);
            handleConflict(err, 'Erro ao autorizar a OS');
        } finally {
            setAuthSaving(false);
        }
    };

    /** Regra única para arraste e menu "Mover para…". */
    const requestMove = (order: DailyScheduleOrder, from: string, to: string, index: number) => {
        if (!board) return;
        if (isScheduleLocked(order)) {
            toast.error(`A OS ${order.orderMask} está em execução e não pode ser movimentada.`);
            return;
        }
        // Da coluna da equipe para uma faixa: só a Autorizada volta.
        if (from !== OPEN && from !== PRIORITY && (to === OPEN || to === PRIORITY)) {
            if (canReturnFromTeam(order, to as StripKind)) returnToStrip(order, from, to as StripKind, index);
            else if (canReturnFromTeam(order, PRIORITY)) toast.error("OS Suspensa volta primeiro para OS's PRIORIDADE DE ATENDIMENTO; de lá pode ir para ABERTAS.");
            else toast.error('Só OS Autorizada ou Suspensa volta da equipe para as faixas. Esta só é reordenada na própria coluna.');
            return;
        }
        if (from === OPEN || to === OPEN) {
            if (from === OPEN && to === PRIORITY) prioritize(order, index);
            else if (from === PRIORITY && to === OPEN) unprioritize(order);
            else if (from === OPEN && to !== OPEN) toast.error("Envie a OS para OS's PRIORIDADE DE ATENDIMENTO antes de programá-la para uma equipe.");
            else if (from !== OPEN) toast.error("A sequência da equipe não volta para OS's ABERTAS.");
            return;
        }
        if (to === PRIORITY) {
            if (from === PRIORITY) {
                reorderPriorities(board.priorities.findIndex(o => o.id === order.id), index);
            } else {
                toast.error("A sequência da equipe não volta para a faixa. Para mudar a prioridade, reordene em OS's PRIORIDADE DE ATENDIMENTO.");
            }
            return;
        }
        if (readOnly) return;
        const team = board.teams.find(t => t.id === to);
        if (!team) return;

        if (from === PRIORITY) {
            const placed = placedTeamOf(order.id);
            if (placed && canChangeTeam(order) && placed !== team.id) {
                // Já está noutra coluna: troca de equipe (sai de lá).
                void moveAuthorized(order, team, index);
                return;
            }
            if (placed) {
                const placedCode = board.teams.find(t => t.id === placed)?.code || '';
                toast.info(`A OS ${order.orderMask} já está programada para a equipe ${placedCode} neste dia.`);
                return;
            }
            const rule = scheduleTeamRule(order);
            if (rule === 'any' && order.statusId === DAILY_SCHEDULE_STATUS.EVALUATION) {
                // Em Avaliação: autoriza para a equipe escolhida (mesmo já tendo outra informada).
                setPendingAuth({ order, team, index });
            } else if (rule === 'any') {
                // Autorizada: mesma equipe só entra na coluna; outra equipe troca equipe e líder na OS.
                if (order.teamId === team.id) placeInOwnTeam(order, team, index);
                else void moveAuthorized(order, team, index);
            } else if (rule === team.id) {
                placeInOwnTeam(order, team, index);
            } else if (rule) {
                const ownCode = board.teams.find(t => t.id === rule)?.code;
                toast.error(`A OS ${order.orderMask} já tem equipe definida e só pode ir para ${ownCode ? `a equipe ${ownCode}` : 'a própria equipe'}.`);
            } else {
                toast.error('Só OSs Em Avaliação (qualquer equipe) ou com equipe já definida (só a própria equipe) vão para uma equipe.');
            }
            return;
        }
        if (from === to) {
            const oldIndex = board.columns[to].findIndex(o => o.id === order.id);
            reorderWithin(to, oldIndex, Math.min(index, board.columns[to].length - 1));
            return;
        }
        if (canChangeTeam(order)) {
            void moveAuthorized(order, team, index);
            return;
        }
        toast.error('Só OS Autorizada troca de equipe. Esta só é reordenada na própria coluna.');
    };

    // ── Drag & drop ───────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        // Arraste só pela alça ⠿ (touch-none): ativa rápido; o resto do cartão rola normalmente.
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active: dragged }: DragStartEvent) => {
        const found = locate(String(dragged.id));
        if (found) setActive(found);
    };

    const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
        const current = active;
        setActive(null);
        if (!current || !over || !board) return;

        const overId = String(over.id);
        if (String(dragged.id) === overId) return;
        const to: string | undefined = (over.data.current as any)?.container
            ?? (overId.startsWith('team:') ? overId.slice(5) : undefined);
        if (!to) return;

        let index: number;
        if (to === PRIORITY) {
            const overIndex = board.priorities.findIndex(o => o.id === stripPrefix(overId));
            // Solto na faixa (fora de um card): vindo de ABERTAS entra no fim.
            index = overIndex >= 0 ? overIndex : board.priorities.length - (current.container === PRIORITY ? 1 : 0);
        } else if (to === OPEN) {
            index = 0;
        } else {
            const column = board.columns[to] || [];
            const overIndex = column.findIndex(o => o.id === overId);
            index = overIndex >= 0 ? overIndex : column.length;
        }
        requestMove(current.order, current.container, to, index);
    };

    const acceptsDrop = (teamId: string): boolean | undefined => {
        if (!active) return undefined;
        if (active.container === OPEN) return false;
        if (active.container === PRIORITY) {
            const placed = placedTeamOf(active.order.id);
            if (placed) return canChangeTeam(active.order) && placed !== teamId;
            const rule = scheduleTeamRule(active.order);
            return rule === 'any' || rule === teamId;
        }
        return active.container === teamId || canChangeTeam(active.order);
    };

    // ── Menu de ações (alternativa ao arraste) ───────────────────────────────
    const openActions = (order: DailyScheduleOrder, container: string) => {
        // Dia passado ou sem canCreate: nada a mover.
        if (!board || readOnly || isScheduleLocked(order)) return;
        const list = container === PRIORITY ? board.priorities : container === OPEN ? board.openOrders : board.columns[container] || [];
        setActionTarget({ order, container, index: list.findIndex(o => o.id === order.id), total: list.length });
    };

    const openOrder = async (order: DailyScheduleOrder) => {
        if (!onSelectOrder) return;
        try {
            const full = await dataService.getOrderById(order.id);
            if (full) onSelectOrder(full);
            else toast.error('OS não encontrada.');
        } catch {
            toast.error('Erro ao abrir a OS.');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const stripLists: Record<StripKind, DailyScheduleOrder[]> = {
        open: board?.openOrders || [],
        priority: board?.priorities || [],
    };
    const rankById = useMemo(
        () => new Map((board?.priorities || []).map((o, idx) => [o.id, idx + 1])),
        [board?.priorities],
    );
    const stripOptions = (strip: StripKind, field: 'unit' | 'tag') =>
        uniqueOptions(stripLists[strip].map(o => (field === 'unit' ? [o.unitId, o.unitDescription] : [o.assetTagId, o.assetTagDescription])));
    const labelsOf = (values: string[], options: Array<{ value: string; label: string }>) =>
        values.length === 1 ? (options.find(o => o.value === values[0])?.label || values) : values;

    const dateLabel = formatDateInBrazil(`${date}T12:00:00`, 'date', 'pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const saveLabel: Record<SaveState, string> = {
        idle: '',
        pending: 'Alterações pendentes…',
        saving: 'Salvando…',
        saved: 'Sequência salva',
        error: 'Erro ao salvar',
    };

    // Opções do filtro: só a descrição (sem o código); sem descrição, cai no rótulo completo.
    const contractOptions = contracts.map(c => ({ value: c.id, label: c.description || contractLabel(c) }));

    const teamFilterOptions = (board?.teams || []).map(t => ({
        value: t.id,
        label: `${t.code} · ${t.leaderName}`,
        parentId: t.parentId,
    }));
    const visibleTeams = (board?.teams || []).filter(t => teamFilter.length === 0 || teamFilter.includes(t.id));

    const totalScheduled = board ? Object.values(board.columns).reduce((acc, list) => acc + list.length, 0) : 0;

    /** Faixa horizontal OS's ABERTAS ou OS's PRIORIDADE DE ATENDIMENTO (mesmo layout, filtros próprios). */
    const renderStrip = (strip: StripKind) => {
        if (!board) return null;
        const isOpen = strip === OPEN;
        const list = stripLists[strip];
        const filter = stripFilters[strip];
        const filtered = filterStrip(list, filter);
        const unitOptions = stripOptions(strip, 'unit');
        const tagOptions = stripOptions(strip, 'tag');
        const prefix = isOpen ? OPEN_ID_PREFIX : PRIORITY_ID_PREFIX;
        const emptyText = list.length > 0
            ? 'Nenhuma OS encontrada com os filtros.'
            : isOpen
                ? "Todas as OSs abertas já estão em OS's PRIORIDADE DE ATENDIMENTO."
                : isPast ? 'Nenhuma prioridade registrada neste dia.' : "Arraste OSs de OS's ABERTAS para cá.";
        const header = (
            <>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white">{isOpen ? "OS's ABERTAS" : "OS's PRIORIDADE DE ATENDIMENTO"}</h3>
                    <span className={`text-xs font-black rounded-lg px-2 py-0.5 ${isOpen
                        ? 'text-sky-700 dark:text-sky-400 bg-sky-500/15'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-500/15'}`}
                    >
                        {filtered.length !== list.length ? `${filtered.length} de ${list.length}` : list.length}
                    </span>
                    {canEditPriorities && (
                        <span className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <span className="material-symbols-outlined text-[14px]">{isOpen ? 'south' : 'swap_horiz'}</span>
                            {isOpen ? "Arraste para OS's PRIORIDADE DE ATENDIMENTO para priorizar" : 'Arraste para ordenar: à esquerda, mais prioritária'}
                        </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2 ml-auto w-full lg:w-auto">
                        <FilterSelect
                            autoWidth
                            label="UNIDADE"
                            value={labelsOf(filter.unit, unitOptions)}
                            onClick={() => setStripFilterModal({ strip, field: 'unit' })}
                            onClear={() => patchStripFilter(strip, { unit: [] })}
                            disabled={unitOptions.length === 0}
                        />
                        <FilterSelect
                            label="SETOR"
                            value={labelsOf(filter.tag, tagOptions)}
                            onClick={() => setStripFilterModal({ strip, field: 'tag' })}
                            onClear={() => patchStripFilter(strip, { tag: [] })}
                            disabled={tagOptions.length === 0}
                        />
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="search"
                                value={filter.search}
                                onChange={e => patchStripFilter(strip, { search: e.target.value })}
                                placeholder="Buscar OS, unidade, serviço..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
                {!isOpen && board.prioritiesInheritedFrom && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        Prioridade deste dia ainda não registrada — partindo da de {formatDateInBrazil(`${board.prioritiesInheritedFrom}T12:00:00`, 'date', 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Reordene para registrar.
                    </p>
                )}
            </>
        );
        const fromOtherStrip = !!active && active.container !== strip && (active.container === OPEN || active.container === PRIORITY);
        const fromTeamColumn = !!active && active.container !== OPEN && active.container !== PRIORITY;
        return (
            <PriorityStrip
                containerId={strip}
                className={`rounded-2xl border p-4 mb-4 ${isOpen
                    ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-800/30'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'}`}
                header={header}
                accepting={canEditPriorities && (fromOtherStrip || (fromTeamColumn && canReturnFromTeam(active!.order, strip)))}
                refusing={fromTeamColumn && !canReturnFromTeam(active!.order, strip)}
                itemIds={filtered.map(o => `${prefix}${o.id}`)}
            >
                    {filtered.length > 0 ? (
                        filtered.map(order => (
                            <PriorityOrderCard
                                key={order.id}
                                order={order}
                                variant={strip}
                                rank={isOpen ? undefined : rankById.get(order.id) || 0}
                                disabled={!canEditPriorities}
                                onOpenActions={() => openActions(order, strip)}
                                onOpenOrder={() => openOrder(order)}
                            />
                        ))
                    ) : (
                        <div className="w-full flex items-center justify-center text-xs font-bold text-slate-400">{emptyText}</div>
                    )}
            </PriorityStrip>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Título */}
            <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Programação Diária</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Priorize as OSs abertas, distribua entre as equipes e ordene a execução do dia.</p>
            </div>

            {/* Contrato (esquerda) + dia (direita) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    <FilterSelect
                        autoWidth
                        label="CONTRATO"
                        value={contract ? (contract.description || contractLabel(contract)) : ''}
                        onClick={() => setContractModalOpen(true)}
                        disabled={contractsLoading}
                        required
                    />
                    <TreeFilterSelect
                        label="EQ.RESPONSAVEL"
                        value={teamFilter}
                        options={teamFilterOptions}
                        onChange={setTeamFilter}
                        onClear={() => setTeamFilter([])}
                        disabled={!board || board.teams.length === 0}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (refreshing || loading) return;
                            const startedAt = Date.now();
                            setRefreshing(true);
                            flushSave();
                            void loadBoard(true).finally(() => {
                                setTimeout(() => setRefreshing(false), Math.max(0, 700 - (Date.now() - startedAt)));
                            });
                        }}
                        disabled={!contract}
                        className="self-start sm:self-auto shrink-0 flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-primary hover:border-primary disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        title="Atualizar a programação"
                        aria-label="Atualizar a programação"
                    >
                        <span className={`material-symbols-outlined text-[20px] ${refreshing || loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {saveState !== 'idle' && (
                        <span className={`flex items-center gap-1 text-xs font-bold ${saveState === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>
                            <span className="material-symbols-outlined text-[16px]">
                                {saveState === 'saved' ? 'cloud_done' : saveState === 'error' ? 'cloud_off' : 'cloud_sync'}
                            </span>
                            {saveLabel[saveState]}
                        </span>
                    )}
                    {date !== today && (
                        <button
                            type="button"
                            onClick={() => changeDate(today)}
                            className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/15"
                        >
                            Hoje
                        </button>
                    )}
                    <div className="relative flex items-center gap-1 h-[52px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1 shadow-sm">
                        <button type="button" onClick={() => changeDate(shiftDate(date, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Dia anterior">
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_left</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalendarOpen(open => !open)}
                            className="flex items-center gap-2 px-2 py-1.5 min-w-[170px] justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Escolher dia"
                            aria-expanded={calendarOpen}
                        >
                            <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{dateLabel}</span>
                        </button>
                        <button type="button" onClick={() => changeDate(shiftDate(date, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Próximo dia">
                            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                        </button>
                        {calendarOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2">
                                    <Calendar value={date} onChange={changeDate} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Avisos */}
            {isPast && contract && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    Dia passado — somente leitura. Exibindo o que foi programado neste dia.
                </div>
            )}
            {!isPast && !hasCreatePermission && contract && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Você tem acesso só de visualização à programação diária.
                </div>
            )}
            {board && !board.supported && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    A sequência do dia e as prioridades ainda não podem ser salvas (migration 20261110 pendente). Autorizações e trocas de equipe funcionam normalmente.
                </div>
            )}

            {!contractId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">contract</span>
                    <p className="font-black text-slate-500">Selecione um contrato</p>
                    <p className="text-xs text-slate-400">A programação é feita por contrato e por dia.</p>
                </div>
            ) : contract && !contract.providerDepartmentId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">domain_disabled</span>
                    <p className="font-black text-slate-500">Contrato sem departamento prestador</p>
                    <p className="text-xs text-slate-400">Cadastre o departamento prestador no contrato para listar as equipes.</p>
                </div>
            ) : loading && !board ? (
                <div className="py-20"><Loading /></div>
            ) : board ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={collisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActive(null)}
                >
                    <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
                        {/* Faixas OS's ABERTAS (acima) e OS's PRIORIDADE DE ATENDIMENTO */}
                        {!isPast && renderStrip(OPEN)}
                        {(!isPast || board.priorities.length > 0) && renderStrip(PRIORITY)}

                        {/* Colunas por equipe */}
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-extrabold text-slate-900 dark:text-white">Equipes</h3>
                            <span className="text-xs font-bold text-slate-400">
                                {teamFilter.length > 0 ? `${visibleTeams.length} de ${board.teams.length}` : board.teams.length} equipes · {totalScheduled} OSs no dia
                            </span>
                        </div>
                        {board.teams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group_off</span>
                                <p className="font-black text-slate-500">Nenhuma equipe com líder</p>
                                <p className="text-xs text-slate-400">O departamento prestador deste contrato não tem equipes ativas com líder.</p>
                            </div>
                        ) : (
                            <div
                                ref={teamsScroll.ref}
                                onMouseDown={teamsScroll.onMouseDown}
                                onClickCapture={teamsScroll.onClickCapture}
                                className="flex gap-3 overflow-x-auto pb-4 items-stretch cursor-grab active:cursor-grabbing"
                            >
                                {visibleTeams.map(team => (
                                    <ScheduleTeamColumn
                                        key={team.id}
                                        team={team}
                                        orders={board.columns[team.id] || []}
                                        readOnly={readOnly}
                                        accepts={acceptsDrop(team.id)}
                                        onOpenActions={openActions}
                                        onOpenOrder={openOrder}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <DragOverlay>
                        {active ? <div className="w-[280px]"><ScheduleOrderCardView order={active.order} isOverlay showTeam={active.container === PRIORITY || active.container === OPEN} /></div> : null}
                    </DragOverlay>
                </DndContext>
            ) : null}

            <Modal isOpen={contractModalOpen} onClose={() => setContractModalOpen(false)} title="Filtrar por CONTRATO" maxWidth="md">
                <FilterSelectionContent
                    single
                    label="CONTRATO"
                    options={contractOptions}
                    initialValue={contractId ? [contractId] : []}
                    onConfirm={(values) => {
                        if (values[0]) changeContract(values[0]);
                        setContractModalOpen(false);
                    }}
                />
            </Modal>

            <Modal
                isOpen={!!stripFilterModal}
                onClose={() => setStripFilterModal(null)}
                title={`Filtrar por ${stripFilterModal?.field === 'unit' ? 'UNIDADE' : 'SETOR'}`}
                maxWidth="md"
            >
                {stripFilterModal && (
                    <FilterSelectionContent
                        key={`${stripFilterModal.strip}:${stripFilterModal.field}`}
                        label={stripFilterModal.field === 'unit' ? 'UNIDADE' : 'SETOR'}
                        options={stripOptions(stripFilterModal.strip, stripFilterModal.field)}
                        initialValue={stripFilters[stripFilterModal.strip][stripFilterModal.field]}
                        onConfirm={(values) => {
                            patchStripFilter(stripFilterModal.strip, { [stripFilterModal.field]: values });
                            setStripFilterModal(null);
                        }}
                    />
                )}
            </Modal>

            <ScheduleAuthorizeModal
                order={pendingAuth?.order || null}
                team={pendingAuth?.team || null}
                isSaving={authSaving}
                onCancel={() => setPendingAuth(null)}
                onConfirm={confirmAuthorization}
            />

            <ScheduleOrderActionsModal
                target={actionTarget}
                teams={board?.teams || []}
                placedTeamId={actionTarget?.container === PRIORITY ? placedTeamOf(actionTarget.order.id) : undefined}
                onClose={() => setActionTarget(null)}
                onMoveUp={() => {
                    if (actionTarget) {
                        if (actionTarget.container === PRIORITY) reorderPriorities(actionTarget.index, actionTarget.index - 1);
                        else reorderWithin(actionTarget.container, actionTarget.index, actionTarget.index - 1);
                    }
                    setActionTarget(null);
                }}
                onMoveDown={() => {
                    if (actionTarget) {
                        if (actionTarget.container === PRIORITY) reorderPriorities(actionTarget.index, actionTarget.index + 1);
                        else reorderWithin(actionTarget.container, actionTarget.index, actionTarget.index + 1);
                    }
                    setActionTarget(null);
                }}
                onPrioritize={() => {
                    if (actionTarget && board) prioritize(actionTarget.order, board.priorities.length);
                    setActionTarget(null);
                }}
                onUnprioritize={() => {
                    if (actionTarget) unprioritize(actionTarget.order);
                    setActionTarget(null);
                }}
                onReturnToStrip={(strip) => {
                    if (actionTarget && board) {
                        returnToStrip(actionTarget.order, actionTarget.container, strip, board.priorities.length);
                    }
                    setActionTarget(null);
                }}
                onMoveToTeam={(team) => {
                    if (actionTarget) {
                        const index = board?.columns[team.id]?.length ?? 0;
                        requestMove(actionTarget.order, actionTarget.container, team.id, index);
                    }
                    setActionTarget(null);
                }}
            />
        </div>
    );
};

export default OrdersDailyScheduleScreen;
