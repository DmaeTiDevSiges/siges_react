import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DailyScheduleOrder } from '../../../services/orders/dailyScheduleService';
import { DAILY_SCHEDULE_STATUS } from '../../../services/orders/dailyScheduleService';

const STATUS_STYLE: Record<number, { label: string; className: string }> = {
    [DAILY_SCHEDULE_STATUS.NOT_PROGRAMMED]: { label: 'NP', className: 'bg-slate-500/15 text-slate-500 dark:text-slate-400' },
    [DAILY_SCHEDULE_STATUS.EVALUATION]: { label: 'AV', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    [DAILY_SCHEDULE_STATUS.AUTHORIZED]: { label: 'AU', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    [DAILY_SCHEDULE_STATUS.SCHEDULED]: { label: 'AG', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
    [DAILY_SCHEDULE_STATUS.EXECUTION]: { label: 'EX', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    [DAILY_SCHEDULE_STATUS.SUSPENDED]: { label: 'SU', className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
};

/** Só OS Autorizada troca de equipe; as demais ficam presas à coluna (só reordenam). */
/** OS em execução não se move na programação (nem reordena, nem troca de equipe). */
export const isScheduleLocked = (order: DailyScheduleOrder) => order.statusId === DAILY_SCHEDULE_STATUS.EXECUTION;

/** Situações que já têm equipe definida e só entram na coluna da própria equipe. */
const KEEPS_OWN_TEAM = new Set<number>([
    DAILY_SCHEDULE_STATUS.SCHEDULED,
    DAILY_SCHEDULE_STATUS.SUSPENDED,
]);

/** OS Autorizada: muda de equipe (atualiza equipe responsável e líder na OS). */
export const canChangeTeam = (order: DailyScheduleOrder) => order.statusId === DAILY_SCHEDULE_STATUS.AUTHORIZED;

/**
 * Da coluna da equipe de volta para uma faixa (sai da equipe só no dia; a OS não muda):
 * Autorizada ou Suspensa → só PRIORIDADE. OS programada numa equipe nunca vai direto para
 * ABERTAS; fora da equipe (já na PRIORIDADE), pode seguir para ABERTAS.
 */
export const canReturnFromTeam = (order: DailyScheduleOrder, strip: 'priority' | 'open') =>
    strip === 'priority' && (canChangeTeam(order) || order.statusId === DAILY_SCHEDULE_STATUS.SUSPENDED);

/**
 * Para qual equipe a OS pode ir:
 *   'any'  → Em Avaliação (autoriza para a equipe) ou Autorizada (troca equipe e líder na OS);
 *   id     → Agendada/Suspensa com equipe definida: só a própria equipe;
 *   null   → não vai para equipe (sem situação/equipe válida ou em execução).
 */
export const scheduleTeamRule = (order: DailyScheduleOrder): 'any' | string | null => {
    if (isScheduleLocked(order)) return null;
    if (order.statusId === DAILY_SCHEDULE_STATUS.EVALUATION || canChangeTeam(order)) return 'any';
    if (KEEPS_OWN_TEAM.has(order.statusId) && order.teamId) return order.teamId;
    return null;
};

interface ScheduleOrderCardViewProps {
    order: DailyScheduleOrder;
    position?: number;
    /** Exibe o cadeado (OS que não troca de equipe). */
    showLock?: boolean;
    isOverlay?: boolean;
    /** Exibe a equipe responsável e o líder da OS (faixas; nas colunas a equipe já é o cabeçalho). */
    showTeam?: boolean;
    /**
     * Faixa de prioridade: OS já programada na coluna desta equipe no dia (código da equipe).
     * O card fica com aspecto de desabilitado, mas continua reordenável.
     */
    scheduledTeamCode?: string;
    /**
     * Alça de arraste (atributos/listeners do dnd-kit + ref do ativador). Só ela inicia o
     * arraste: o resto do cartão fica livre para rolar a faixa/equipes.
     */
    handleProps?: Record<string, any>;
    onOpenActions?: () => void;
    onOpenOrder?: () => void;
}

export const ScheduleOrderCardView: React.FC<ScheduleOrderCardViewProps> = ({
    order, position, showLock, isOverlay, showTeam, scheduledTeamCode, handleProps, onOpenActions, onOpenOrder,
}) => {
    const scheduled = scheduledTeamCode != null && !isOverlay;
    const status = STATUS_STYLE[order.statusId] || { label: order.statusCode || '?', className: 'bg-slate-500/15 text-slate-500' };
    return (
        <div
            className={`group relative w-full rounded-xl border bg-white dark:bg-slate-800 p-3 select-none transition-shadow
                ${isOverlay
                    ? 'shadow-2xl ring-2 ring-primary rotate-1 cursor-grabbing'
                    : isScheduleLocked(order)
                        ? 'border-2 border-emerald-500 animate-execution-pulse cursor-default'
                        : scheduled
                            ? 'border-dashed border-slate-300 dark:border-white/15 bg-slate-100! dark:bg-slate-800/40! opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                            : 'shadow-sm hover:shadow-md border-slate-200 dark:border-white/10'}`}
            title={scheduled ? `Já programada na equipe ${scheduledTeamCode || ''} neste dia` : undefined}
        >
            <div className="flex items-start gap-2">
                {/* Coluna esquerda: alça de arraste no topo, número (prioridade/sequência) no canto inferior. */}
                {(handleProps || isOverlay || position != null) && (
                    <div className="shrink-0 self-stretch -ml-2 flex flex-col items-center">
                        {(handleProps || isOverlay) && (
                            <button
                                type="button"
                                data-drag-handle
                                {...handleProps}
                                className="-my-1 py-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-none"
                                title="Arrastar a OS"
                                aria-label={`Arrastar a OS ${order.orderMask}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                            </button>
                        )}
                        {position != null && (
                            <span className="mt-auto pt-2 flex items-center justify-center">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[11px] font-black">
                                    {position}
                                </span>
                            </span>
                        )}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onPointerDown={e => e.stopPropagation()}
                            onClick={onOpenOrder}
                            className="shrink-0 font-black text-sm text-slate-900 dark:text-white hover:text-primary hover:underline"
                            title="Abrir OS"
                        >
                            {order.orderMask}
                        </button>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${status.className}`} title={order.statusDescription}>
                            {status.label}
                        </span>
                        {showLock && (
                            <span
                                className="material-symbols-outlined text-[14px] text-slate-400"
                                title="OS em execução — não pode ser movimentada"
                            >
                                lock
                            </span>
                        )}
                        {order.priorityCode && (
                            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase" title={order.priorityDescription}>
                                {order.priorityCode}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5" title={order.unitDescription}>
                        {order.unitDescription || '—'}
                    </p>
                    {(order.assetTagDescription || order.assetTagSubDescription) && (
                        <p
                            className="text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase truncate"
                            title={[order.assetTagDescription, order.assetTagSubDescription].filter(Boolean).join(' / ')}
                        >
                            {order.assetTagDescription || 'Setor'}
                            {order.assetTagSubDescription && (
                                <span> / {order.assetTagSubDescription}</span>
                            )}
                        </p>
                    )}
                    {order.requestedServices && (
                        <p
                            className={`text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line break-words ${isOverlay ? 'line-clamp-2' : 'line-clamp-2 group-hover:line-clamp-none'}`}
                        >
                            {order.requestedServices}
                        </p>
                    )}
                    {showTeam && (
                        <p
                            className={`flex items-center mt-1.5 pt-1.5 ${scheduled ? 'pr-5' : ''} border-t border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase truncate ${order.teamCode || order.teamLeaderName
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-400 dark:text-slate-500 italic'}`}
                            title={order.teamCode || order.teamLeaderName
                                ? `Equipe: ${[order.teamCode, order.teamDescription].filter(Boolean).join(' - ') || 'N/I'} | Líder: ${order.teamLeaderName || 'N/I'}`
                                : 'OS sem equipe definida'}
                        >
                            {order.teamCode || order.teamLeaderName ? (
                                <span className="truncate">
                                    {order.teamCode || 'Equipe N/I'}
                                    <span className="font-semibold normal-case text-slate-500 dark:text-slate-400">{" | "}{order.teamLeaderName || 'Sem líder'}</span>
                                </span>
                            ) : (
                                <span className="truncate normal-case">Sem equipe</span>
                            )}
                        </p>
                    )}
                </div>
                {onOpenActions && (
                    <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={onOpenActions}
                        className="shrink-0 -mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Mover para… / reordenar"
                        aria-label={`Ações da OS ${order.orderMask}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                )}
            </div>
            {scheduled && (
                <span
                    className="material-symbols-outlined absolute bottom-2 right-2 text-[16px] text-slate-500 dark:text-slate-400"
                    title={`Já programada na equipe ${scheduledTeamCode || ''} neste dia`}
                    aria-label="Já programada numa equipe neste dia"
                >
                    event_available
                </span>
            )}
        </div>
    );
};

interface DraggableProps {
    order: DailyScheduleOrder;
    disabled?: boolean;
    onOpenActions?: () => void;
    onOpenOrder?: () => void;
}

/** Prefixo dos ids da faixa de prioridades (a mesma OS também pode estar numa coluna). */
export const PRIORITY_ID_PREFIX = 'p:';
/** Prefixo dos ids da faixa OS's ABERTAS. */
export const OPEN_ID_PREFIX = 'o:';

/**
 * Card das faixas horizontais: OS's PRIORIDADE DE ATENDIMENTO (padrão; o número é a prioridade) ou
 * OS's ABERTAS (variant 'open': sem número).
 */
export const PriorityOrderCard: React.FC<DraggableProps & { rank?: number; variant?: 'priority' | 'open'; scheduledTeamCode?: string }> = ({
    order, rank, variant = 'priority', scheduledTeamCode, disabled, onOpenActions, onOpenOrder,
}) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: `${variant === 'open' ? OPEN_ID_PREFIX : PRIORITY_ID_PREFIX}${order.id}`,
        data: { container: variant },
        disabled: disabled || isScheduleLocked(order),
    });
    const locked = disabled || isScheduleLocked(order);
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`w-[260px] shrink-0 touch-manipulation ${isDragging ? 'opacity-30' : ''}`}
        >
            <ScheduleOrderCardView
                order={order}
                position={rank}
                showLock={isScheduleLocked(order)}
                showTeam
                scheduledTeamCode={scheduledTeamCode}
                handleProps={locked ? undefined : { ...attributes, ...listeners, ref: setActivatorNodeRef }}
                onOpenActions={locked ? undefined : onOpenActions}
                onOpenOrder={onOpenOrder}
            />
        </div>
    );
};

/** Card de uma coluna de equipe: ordenável dentro da coluna. */
export const SortableTeamOrderCard: React.FC<DraggableProps & { teamId: string; position: number }> = ({
    order, teamId, position, disabled, onOpenActions, onOpenOrder,
}) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: order.id,
        data: { container: teamId },
        disabled: disabled || isScheduleLocked(order),
    });
    const locked = disabled || isScheduleLocked(order);
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`touch-manipulation ${isDragging ? 'opacity-30' : ''}`}
        >
            <ScheduleOrderCardView
                order={order}
                position={position}
                showLock={isScheduleLocked(order)}
                handleProps={locked ? undefined : { ...attributes, ...listeners, ref: setActivatorNodeRef }}
                onOpenActions={locked ? undefined : onOpenActions}
                onOpenOrder={onOpenOrder}
            />
        </div>
    );
};
