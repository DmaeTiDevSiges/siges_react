import React from 'react';
import { Select } from '../ui/Select';
import { Loading } from '../ui/Loading';
import { UserAvatar } from '../ui/UserAvatar';
import { formatDateTime, getStatusConfig } from '../../utils/formatters';
import { useVisitTeamAdd } from '../../hooks/useVisitTeamAdd';
import { OrderVisitProcessingButton } from './OrderVisitProcessingButton';
import type { OrderVisitCardDetailProps } from './OrderVisitCardDetail';

/**
 * Detalhe da visita — visual novo (v2, F4 do PLANO_DESIGN_ESTILO_NUBANK.md).
 * Mesmas informações e MESMAS regras de quando cada botão aparece do visual atual
 * (há um teste de equivalência), só que com tokens do design system, texto em caixa
 * normal e a partir de 12 px, sem borda/sombra e botões em pílula. Os botões ficam
 * em tons: principal (marca), perigo (suave), neutro e "excluir" (só texto).
 */

type Tone = 'primary' | 'danger' | 'neutral' | 'ghostDanger';

const TONES: Record<Tone, string> = {
    primary: 'bg-brand text-on-brand hover:bg-brand-strong',
    danger: 'bg-danger-soft text-danger hover:brightness-95',
    neutral: 'bg-surface-2 text-fg hover:brightness-95',
    ghostDanger: 'bg-transparent text-danger hover:bg-danger-soft',
};

interface ActionButtonProps {
    icon: string;
    label: string;
    loadingLabel?: string;
    loading?: boolean;
    tone?: Tone;
    onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, loadingLabel, loading = false, tone = 'primary', onClick }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-label font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${TONES[tone]}`}
    >
        {loading ? <Loading size="xs" /> : <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>}
        {loading && loadingLabel ? loadingLabel : label}
    </button>
);

const RING_LENGTH = 125.6;
const SUSPENDED = 6;
const OS_HIDDEN = 8;

export const OrderVisitCardDetailV2: React.FC<OrderVisitCardDetailProps> = ({
    visit, team, onRemoveTeamMember, onAddTeamMember, onEndVisit, onDeleteVisit, onEditVisit, onReportVisit, onApproveVisit,
    onDisapproveVisit, onFileVisit, onMarkAsRevised, onReverseApproval, onViewOrder,
    isReportLoading = false, isApproveLoading = false, isDisapproveLoading = false, isFileLoading = false,
    isRevising = false, isReverseApprovalLoading = false, hideHeaderActions = false,
}) => {
    const { availableUsers, selectedUserId, setSelectedUserId, isAdding, handleAddClick } = useVisitTeamAdd(visit, team, onAddTeamMember);

    const processingId = Number(visit.ovProcessingId || 1);
    const progress = visit.progress || 0;
    const mask = visit.ovMask || 'Sem número';
    const osLabel = visit.ovOStatusDescription || (visit.ovOStatusId ? getStatusConfig(visit.ovOStatusId).label : '');
    const suspended = visit.ovOStatusId === SUSPENDED;

    return (
        <div id={`visit-detail-${visit.id}`} className="relative rounded-card bg-surface p-5">
            {/* Topo: número da OS, status, progresso e processamento */}
            <div className="mb-5 flex items-start justify-between gap-3">
                {onViewOrder ? (
                    <button
                        type="button"
                        onClick={onViewOrder}
                        className="rounded text-left text-title text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                        {mask}
                    </button>
                ) : (
                    <h2 className="text-title text-fg">{mask}</h2>
                )}

                <div className="flex items-center gap-3">
                    {visit.ovOStatusId !== OS_HIDDEN && osLabel && (
                        <div className="flex flex-col items-end gap-1 text-right">
                            <span className={`rounded-full px-2.5 py-1 text-caption font-medium ${suspended ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'}`}>
                                {osLabel}
                            </span>
                            {suspended && visit.ovOSuspendedReasonDescription && (
                                <span className="line-clamp-2 max-w-[150px] text-caption text-fg-muted" title={visit.ovOSuspendedReasonDescription}>
                                    {visit.ovOSuspendedReasonDescription}
                                </span>
                            )}
                        </div>
                    )}

                    <div
                        role="progressbar"
                        aria-label="Progresso da visita"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="relative flex h-12 w-12 items-center justify-center"
                    >
                        <svg className="h-full w-full -rotate-90" aria-hidden="true">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface-2" />
                            <circle
                                cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={RING_LENGTH}
                                strokeDashoffset={RING_LENGTH * (1 - progress / 100)}
                                className="text-brand"
                            />
                        </svg>
                        <span className="absolute text-caption font-semibold text-fg">{progress}%</span>
                    </div>

                    {!hideHeaderActions && <OrderVisitProcessingButton processingId={visit.ovProcessingId} size="md" />}
                </div>
            </div>

            {/* Cliente, unidade, setor e serviços */}
            <div className="mb-4">
                <p className="text-caption text-fg-muted">{visit.clientName || visit.systemDescription || 'Cliente'}</p>
                <h3 className="mt-0.5 text-headline text-fg">{visit.unitDescription || 'Unidade não informada'}</h3>
                <p className="mt-0.5 text-label font-normal text-fg-muted">
                    {visit.assetTagDescription || 'Setor'} / {visit.assetTagSubDescription || 'Posição'}
                </p>
                <p className="mt-2 text-body text-fg">{visit.requestedServices || 'Nenhum serviço descrito'}</p>
            </div>

            {/* Equipe */}
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-label text-fg">{visit.teamCode || 'Equipe responsável'}</h4>
                {visit.contractDescription && <span className="truncate text-caption text-fg-muted">{visit.contractDescription}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
                {team.map((member) => {
                    const firstName = member.userName?.split(' ')[0] || 'Nome';
                    const available = member.userIsAvailable === true || (member.userIsAvailable as unknown) === 1 || (member.userIsAvailable as unknown) === 'true';
                    return (
                        <div key={member.userId} className="flex flex-col items-center gap-1">
                            <div className="relative flex h-14 w-14 items-center justify-center">
                                <UserAvatar
                                    src={member.userAvatarUrl}
                                    name={member.userName || 'Membro'}
                                    size="md"
                                    status={available ? 'available' : 'busy'}
                                    isOvInProgress={visit.ovStatusId === 1}
                                />
                                {onRemoveTeamMember && !member.isLeader && !visit.isFiled && (
                                    <button
                                        type="button"
                                        aria-label={`Remover ${firstName} da equipe`}
                                        onClick={() => onRemoveTeamMember(member.userId)}
                                        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger transition-transform active:scale-90"
                                    >
                                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                                    </button>
                                )}
                            </div>
                            <span className="w-14 truncate text-center text-caption text-fg-muted">{firstName}</span>
                        </div>
                    );
                })}
            </div>
            {visit.planDescription && <p className="mt-3 text-right text-caption text-fg-subtle">{visit.planDescription}</p>}

            {onAddTeamMember && !visit.isFiled && [1, 2, 3, 4].includes(processingId) && (
                <div className="mt-3 flex gap-2">
                    <div className="flex-1">
                        <Select
                            id="user-selector"
                            value={selectedUserId}
                            onChange={(e: { target: { value: string } }) => setSelectedUserId(e.target.value)}
                            placeholder="Selecionar usuário..."
                            options={availableUsers.map(u => ({ value: u.id, label: u.nameShort || u.nameFull || 'Sem nome' }))}
                            className="h-11!"
                        />
                    </div>
                    <button
                        type="button"
                        aria-label="Adicionar membro"
                        onClick={handleAddClick}
                        disabled={isAdding || !selectedUserId}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-on-brand transition-all active:scale-95 disabled:bg-surface-2 disabled:text-fg-subtle"
                    >
                        {isAdding ? <Loading size="xs" /> : <span className="material-symbols-outlined" aria-hidden="true">add</span>}
                    </button>
                </div>
            )}

            {/* Horários */}
            <div className="mb-1 mt-5 flex items-center justify-between text-caption text-fg-muted">
                <span>{formatDateTime(visit.ovStartedAt)}</span>
                {visit.ovStatusId === 2 && (
                    <>
                        <span>({visit.ovDurationHours?.toFixed(1) || '0.0'} h)</span>
                        <span>{formatDateTime(visit.ovEndedAt)}</span>
                    </>
                )}
            </div>

            {/* Ações (mesma ordem e mesmas regras do visual atual) */}
            {onEndVisit && <ActionButton icon="stop_circle" label="Encerrar visita" onClick={onEndVisit} />}
            {onReportVisit && !onDisapproveVisit && [1, 4].includes(processingId) && (
                <ActionButton icon="send" label="Reportar visita" loadingLabel="Carregando..." loading={isReportLoading} onClick={onReportVisit} />
            )}
            {onMarkAsRevised && !onDisapproveVisit && processingId === 2 && (
                <ActionButton icon="done_all" label="Marcar como revisada" loadingLabel="Revisando..." loading={isRevising} onClick={onMarkAsRevised} />
            )}
            {onApproveVisit && !onDisapproveVisit && (
                <ActionButton icon="verified" label="Aprovar visita" loadingLabel="Aguarde..." loading={isApproveLoading} onClick={onApproveVisit} />
            )}
            {onFileVisit && (
                <ActionButton icon="inventory_2" label="Arquivar visita" loadingLabel="Arquivando..." loading={isFileLoading} onClick={onFileVisit} />
            )}
            {onDisapproveVisit && (
                <ActionButton icon="rebase_edit" label="Rejeitar visita" loadingLabel="Rejeitando..." loading={isDisapproveLoading} tone="danger" onClick={onDisapproveVisit} />
            )}
            {onReverseApproval && (
                <ActionButton icon="undo" label="Estornar aprovação" loadingLabel="Carregando..." loading={isReverseApprovalLoading} tone="neutral" onClick={onReverseApproval} />
            )}
            {onEditVisit && <ActionButton icon="edit_calendar" label="Editar horários" tone="neutral" onClick={onEditVisit} />}
            {onDeleteVisit && <ActionButton icon="delete" label="Excluir visita" tone="ghostDanger" onClick={onDeleteVisit} />}
        </div>
    );
};
