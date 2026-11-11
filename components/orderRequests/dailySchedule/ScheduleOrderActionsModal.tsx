import React from 'react';
import { Modal } from '../../ui/Modal';
import type { DailyScheduleOrder, DailyScheduleTeam } from '../../../services/orders/dailyScheduleService';
import { DAILY_SCHEDULE_STATUS } from '../../../services/orders/dailyScheduleService';
import { canChangeTeam, canReturnFromTeam, scheduleTeamRule } from './ScheduleOrderCard';

export interface ScheduleActionTarget {
    order: DailyScheduleOrder;
    /** 'open' (OS's ABERTAS), 'priority' (faixa de prioridades) ou o id da equipe onde o card está. */
    container: string;
    index: number;
    total: number;
}

interface ScheduleOrderActionsModalProps {
    target: ScheduleActionTarget | null;
    teams: DailyScheduleTeam[];
    /** Equipe em cuja coluna a OS já está no dia (não pode ser inserida de novo). */
    placedTeamId?: string;
    onClose: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTeam: (team: DailyScheduleTeam) => void;
    /** OS's ABERTAS → fim de OS's PRIORIDADE DE ATENDIMENTO. */
    onPrioritize: () => void;
    /** OS's PRIORIDADE DE ATENDIMENTO → de volta para OS's ABERTAS. */
    onUnprioritize: () => void;
    /** OS Autorizada na coluna da equipe → volta para a faixa (sai da equipe no dia). */
    onReturnToStrip: (strip: 'priority' | 'open') => void;
}

/** Alternativa ao arraste (útil no celular): reordenar e mover para uma equipe. */
export const ScheduleOrderActionsModal: React.FC<ScheduleOrderActionsModalProps> = ({
    target, teams, placedTeamId, onClose, onMoveUp, onMoveDown, onMoveToTeam, onPrioritize, onUnprioritize, onReturnToStrip,
}) => {
    const fromPriority = target?.container === 'priority';
    const fromOpen = target?.container === 'open';
    const status = target?.order.statusId;
    const authorizes = status === DAILY_SCHEDULE_STATUS.EVALUATION;
    const rule = target ? scheduleTeamRule(target.order) : null;
    // Da faixa de prioridade: conforme a regra. Da coluna: só a Autorizada troca de equipe.
    const fromTeam = !fromPriority && !fromOpen;
    const movesBetweenTeams = !!target && canChangeTeam(target.order);
    const currentTeamId = fromTeam ? target?.container : placedTeamId;
    const targetTeams = fromTeam
        ? (movesBetweenTeams ? teams.filter(t => t.id !== currentTeamId) : [])
        : (placedTeamId && !movesBetweenTeams) || rule == null
            ? []
            : (rule === 'any' ? teams : teams.filter(t => t.id === rule)).filter(t => t.id !== currentTeamId);

    const btn = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <Modal isOpen={!!target} onClose={onClose} title={target ? `OS ${target.order.orderMask}` : ''} maxWidth="sm">
            {target && fromOpen && (
                <div className="flex flex-col gap-2 py-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">OS's ABERTAS</p>
                    <button type="button" className={btn} onClick={onPrioritize}>
                        <span className="material-symbols-outlined">south</span>
                        Enviar para OS's PRIORIDADE DE ATENDIMENTO
                    </button>
                </div>
            )}
            {target && !fromOpen && (
                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {fromPriority ? `Prioridade de atendimento: ${target.index + 1}º de ${target.total}` : 'Sequência do dia'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" className={btn} disabled={target.index === 0} onClick={onMoveUp}>
                                <span className="material-symbols-outlined">{fromPriority ? 'arrow_back' : 'arrow_upward'}</span>
                                {fromPriority ? 'Mais prioritária' : 'Subir'}
                            </button>
                            <button type="button" className={btn} disabled={target.index >= target.total - 1} onClick={onMoveDown}>
                                <span className="material-symbols-outlined">{fromPriority ? 'arrow_forward' : 'arrow_downward'}</span>
                                {fromPriority ? 'Menos prioritária' : 'Descer'}
                            </button>
                        </div>
                        {fromTeam && canReturnFromTeam(target.order, 'priority') && (
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" className={btn} onClick={() => onReturnToStrip('priority')}>
                                    <span className="material-symbols-outlined">north</span>
                                    Voltar p/ PRIORIDADE
                                </button>
                                {canReturnFromTeam(target.order, 'open') && (
                                    <button type="button" className={btn} onClick={() => onReturnToStrip('open')}>
                                        <span className="material-symbols-outlined">keyboard_double_arrow_up</span>
                                        Voltar p/ ABERTAS
                                    </button>
                                )}
                            </div>
                        )}
                        {fromPriority && (
                            <button type="button" className={btn} onClick={onUnprioritize}>
                                <span className="material-symbols-outlined">north</span>
                                Devolver para OS's ABERTAS
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {authorizes ? 'Autorizar para a equipe' : movesBetweenTeams ? 'Mover para a equipe' : 'Inserir na equipe'}
                        </p>
                        {fromTeam && !movesBetweenTeams ? (
                            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                Só OS Autorizada troca de equipe; esta só é reordenada.
                            </p>
                        ) : !fromTeam && placedTeamId && !movesBetweenTeams ? (
                            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Já programada para a equipe {teams.find(t => t.id === placedTeamId)?.code || ''} neste dia.
                            </p>
                        ) : rule == null ? (
                            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                Só OSs Em Avaliação (qualquer equipe) ou com equipe já definida (só a própria equipe) vão para uma equipe.
                            </p>
                        ) : targetTeams.length === 0 ? (
                            <p className="text-xs text-slate-500">Nenhuma outra equipe disponível neste contrato.</p>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
                                {targetTeams.map(team => (
                                    <button key={team.id} type="button" className={btn} onClick={() => onMoveToTeam(team)}>
                                        <span className="material-symbols-outlined">groups</span>
                                        <span className="flex-1 text-left truncate">{team.code} · {team.leaderName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};
