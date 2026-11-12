import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    const teamSectionTitle = authorizes ? 'Autorizar para a equipe' : movesBetweenTeams ? 'Mover para a equipe' : 'Inserir na equipe';
    let teamNotice: { icon: string; text: string } | null = null;
    if (target && !fromOpen) {
        if (fromTeam && !movesBetweenTeams) {
            teamNotice = { icon: 'lock', text: 'Só OS Autorizada troca de equipe; esta só é reordenada.' };
        } else if (!fromTeam && placedTeamId && !movesBetweenTeams) {
            teamNotice = { icon: 'check_circle', text: `Já programada para a equipe ${teams.find(t => t.id === placedTeamId)?.code || ''} neste dia.` };
        } else if (rule == null) {
            teamNotice = { icon: 'lock', text: 'Só OSs Em Avaliação (qualquer equipe) ou com equipe já definida (só a própria equipe) vão para uma equipe.' };
        } else if (targetTeams.length === 0) {
            teamNotice = { icon: 'info', text: 'Nenhuma outra equipe disponível neste contrato.' };
        }
    }

    // Escape fecha (como o menu de ações da OS).
    useEffect(() => {
        if (!target) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [target, onClose]);

    if (!target) return null;

    const subtitle = [target.order.unitDescription, target.order.assetTagDescription].filter(Boolean).join(' · ');

    // Mesmo bottom sheet do menu de ações da OS (OrderActionManager).
    return createPortal(
        <div className="fixed inset-0 z-100 flex items-end justify-center" onClick={onClose}>
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Ações da OS ${target.order.orderMask}`}
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6" />

                <div className="mb-6 pr-12">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">OS {target.order.orderMask}</h3>
                    {subtitle && (
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{subtitle}</p>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {fromOpen && (
                        <Section title="OS's ABERTAS">
                            <ActionItem
                                icon="south"
                                label="Priorizar"
                                description="Enviar para OS's PRIORIDADE DE ATENDIMENTO"
                                variant="primary"
                                onClick={onPrioritize}
                            />
                        </Section>
                    )}

                    {!fromOpen && (
                        <Section title={fromPriority ? `Prioridade de atendimento: ${target.index + 1}º de ${target.total}` : 'Sequência do dia'}>
                            <ActionItem
                                icon={fromPriority ? 'arrow_back' : 'arrow_upward'}
                                label={fromPriority ? 'Mais prioritária' : 'Subir'}
                                description={fromPriority ? 'Uma posição à frente na prioridade' : 'Uma posição acima na sequência'}
                                disabled={target.index === 0}
                                onClick={onMoveUp}
                            />
                            <ActionItem
                                icon={fromPriority ? 'arrow_forward' : 'arrow_downward'}
                                label={fromPriority ? 'Menos prioritária' : 'Descer'}
                                description={fromPriority ? 'Uma posição atrás na prioridade' : 'Uma posição abaixo na sequência'}
                                disabled={target.index >= target.total - 1}
                                onClick={onMoveDown}
                            />
                            {fromTeam && canReturnFromTeam(target.order, 'priority') && (
                                <ActionItem
                                    icon="north"
                                    label="Voltar para PRIORIDADE"
                                    description="Sai da equipe neste dia"
                                    onClick={() => onReturnToStrip('priority')}
                                />
                            )}
                            {fromPriority && (
                                <ActionItem
                                    icon="north"
                                    label="Devolver para ABERTAS"
                                    description={placedTeamId
                                        ? `Programada na equipe ${teams.find(t => t.id === placedTeamId)?.code || ''}: retire-a da equipe antes`
                                        : 'Remove da prioridade de atendimento'}
                                    variant="danger"
                                    disabled={!!placedTeamId}
                                    onClick={onUnprioritize}
                                />
                            )}
                        </Section>
                    )}

                    {!fromOpen && (
                        <Section title={teamSectionTitle}>
                            {teamNotice ? (
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[20px] shrink-0">{teamNotice.icon}</span>
                                    <span className="text-sm font-semibold leading-snug">{teamNotice.text}</span>
                                </div>
                            ) : (
                                targetTeams.map(team => (
                                    <ActionItem
                                        key={team.id}
                                        icon="groups"
                                        label={team.code}
                                        description={`Líder: ${team.leaderName}`}
                                        variant={authorizes ? 'primary' : 'default'}
                                        onClick={() => onMoveToTeam(team)}
                                    />
                                ))
                            )}
                        </Section>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

const VARIANT_COLORS: Record<'primary' | 'danger' | 'default', { bg: string; text: string }> = {
    primary: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    danger: { bg: 'bg-red-500/10', text: 'text-red-500' },
    default: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        {children}
    </div>
);

/** Item de ação no mesmo estilo do menu de ações da OS. */
const ActionItem: React.FC<{
    icon: string;
    label: string;
    description?: string;
    variant?: 'primary' | 'danger' | 'default';
    disabled?: boolean;
    onClick: () => void;
}> = ({ icon, label, description, variant = 'default', disabled, onClick }) => {
    const colors = VARIANT_COLORS[variant];
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] group disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-slate-50 dark:disabled:hover:bg-white/5"
        >
            <div className={`w-12 h-12 shrink-0 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} shadow-sm transition-transform group-hover:scale-110 group-disabled:scale-100`}>
                <span className="material-symbols-outlined text-[28px]">{icon}</span>
            </div>
            <div className="flex flex-col items-start text-left min-w-0">
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate max-w-full">{label}</span>
                {description && (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-full">{description}</span>
                )}
            </div>
        </button>
    );
};
