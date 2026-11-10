import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DailyScheduleOrder, DailyScheduleTeam } from '../../../services/orders/dailyScheduleService';
import { SortableTeamOrderCard } from './ScheduleOrderCard';
import { OptimizedImage } from '../../ui/OptimizedImage';
import { getInitials } from '../../../utils/formatters';

interface ScheduleTeamColumnProps {
    team: DailyScheduleTeam;
    orders: DailyScheduleOrder[];
    readOnly: boolean;
    /** Durante um arraste: true = aceita, false = recusa, undefined = sem arraste. */
    accepts?: boolean;
    onOpenActions: (order: DailyScheduleOrder, teamId: string) => void;
    onOpenOrder: (order: DailyScheduleOrder) => void;
}

export const ScheduleTeamColumn: React.FC<ScheduleTeamColumnProps> = ({
    team, orders, readOnly, accepts, onOpenActions, onOpenOrder,
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: `team:${team.id}`, data: { container: team.id } });

    const stateClass =
        accepts === false
            ? 'opacity-40'
            : isOver && accepts
                ? 'ring-2 ring-primary bg-primary/5'
                : '';

    return (
        <section
            className={`w-[280px] shrink-0 flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40 transition-all ${stateClass}`}
            aria-label={`Equipe ${team.code} — líder ${team.leaderName}`}
        >
            <header className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-white/10">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                    {team.leaderAvatarUrl
                        ? <OptimizedImage src={team.leaderAvatarUrl} alt={team.leaderName} className="w-full h-full object-cover" />
                        : getInitials(team.leaderName)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{team.leaderName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate" title={team.name}>{team.code}</p>
                </div>
                <span className="text-xs font-black text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5">
                    {orders.length}
                </span>
                {accepts === false && <span className="material-symbols-outlined text-[16px] text-slate-400">block</span>}
            </header>

            <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 p-2 min-h-[140px]">
                <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {orders.map((order, idx) => (
                        <SortableTeamOrderCard
                            key={order.id}
                            order={order}
                            teamId={team.id}
                            position={idx + 1}
                            disabled={readOnly}
                            onOpenActions={() => onOpenActions(order, team.id)}
                            onOpenOrder={() => onOpenOrder(order)}
                        />
                    ))}
                </SortableContext>
                {orders.length === 0 && (
                    <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-400 py-6">
                        {readOnly ? 'Sem OSs programadas' : 'Solte uma OS aqui'}
                    </div>
                )}
            </div>
        </section>
    );
};
