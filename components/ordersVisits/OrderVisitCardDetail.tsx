import React from 'react';
import { Select } from '../ui/Select';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { OrderVisit, OrderVisitTeam, User } from '../../types';
import { Card } from '../ui/Card';
import { UserAvatar } from '../ui/UserAvatar';
import { formatDateTime } from '../../utils/formatters';
import { OrderVisitProcessingButton } from './OrderVisitProcessingButton';
import { Loading } from '../ui/Loading';
import { getStatusConfig } from '../../utils/formatters';


interface OrderVisitCardDetailProps {
    visit: OrderVisit;
    team: OrderVisitTeam[];
    onRemoveTeamMember?: (userId: string) => void;
    onAddTeamMember?: (userId: string) => void;
    onEndVisit?: () => void;
    onDeleteVisit?: () => void;
    onEditVisit?: () => void;
    onReportVisit?: () => void;
    onApproveVisit?: () => void;
    onDisapproveVisit?: () => void;
    onFileVisit?: () => void;
    onMarkAsRevised?: () => void;
    onReverseApproval?: () => void;
    onViewOrder?: () => void;
    isReportLoading?: boolean;
    isApproveLoading?: boolean;
    isDisapproveLoading?: boolean;
    isFileLoading?: boolean;
    isRevising?: boolean;
    isReverseApprovalLoading?: boolean;
    hideHeaderActions?: boolean;
}

export const OrderVisitCardDetail: React.FC<OrderVisitCardDetailProps> = ({
    visit,
    team,
    onRemoveTeamMember,
    onAddTeamMember,
    onEndVisit,
    onDeleteVisit,
    onEditVisit,
    onReportVisit,
    onApproveVisit,
    onDisapproveVisit,
    onFileVisit,
    onMarkAsRevised,
    onReverseApproval,
    onViewOrder,
    isReportLoading = false,
    isApproveLoading = false,
    isDisapproveLoading = false,
    isFileLoading = false,
    isRevising = false,
    isReverseApprovalLoading = false,
    hideHeaderActions = false
}) => {
    // Determining colors
    const badgeColor = "bg-rose-500"; // Default

    const [availableUsers, setAvailableUsers] = React.useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = React.useState<string>('');
    const [isAdding, setIsAdding] = React.useState(false);

    React.useEffect(() => {
        if (onAddTeamMember) {
            loadAvailableUsers();
        }
    }, [onAddTeamMember, team]);

    const loadAvailableUsers = async () => {
        try {
            const users = await dataService.getUsers();
            // Filter: 
            // 1. users.status_id = 2 (Ativo)
            // 2. users.id <> v_orders_visit.ov_team_leader_id
            // 3. users.teams.department_id = v_orders.provider_department_id
            // 4. (Implicit) Not already in team
            const teamUserIds = new Set(team.map(m => m.userId));
            const filtered = users.filter(u =>
                String(u.statusId) === '2' &&
                String(u.id) !== String(visit.ovTeamLeadId) &&
                String(u.departmentId) === String(visit.providerDepartmentId) &&
                !teamUserIds.has(u.id)
            ).sort((a, b) => (a.nameShort || '').localeCompare(b.nameShort || '', 'pt-BR'));

            setAvailableUsers(filtered);
        } catch (error) {
            console.error('Error loading available users:', error);
        }
    }

    const handleAddClick = async () => {
        if (!selectedUserId) {
            toast.error('Selecione um usuário');
            return;
        }

        setIsAdding(true);
        try {
            if (onAddTeamMember) {
                await onAddTeamMember(selectedUserId);
                setSelectedUserId('');
            }
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <Card
            id={`visit-detail-${visit.id}`}
            className="rounded-2xl! shadow-xl p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 relative"
        >
            {/* Top Bar: Masks and Progress */}
            <div className="flex justify-between items-start mb-6">
                <div
                    onClick={onViewOrder}
                    className={`${badgeColor} text-white px-4 py-2 rounded-[16px] shadow-lg flex flex-col min-w-[120px] ${onViewOrder ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''}`}
                >
                    <span className="text-[22px] font-black leading-none tracking-tight">{visit.ovMask || '??.??.????'}</span>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">OS ELE/COR/SRV</span>
                        <span className="text-[9px] font-black opacity-80">AT</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* OS Status Info */}
                    {visit.ovOStatusId !== 8 && (
                        <div className="flex flex-col items-end text-right mr-1">
                            <span className="text-[10px] font-black uppercase text-white">
                                {visit.ovOStatusDescription || (visit.ovOStatusId ? getStatusConfig(visit.ovOStatusId).label : '')}
                            </span>
                            {visit.ovOStatusId === 6 && visit.ovOSuspendedReasonDescription && (
                                <span className="text-[9px] font-bold text-white uppercase max-w-[150px] leading-tight mt-0.5 line-clamp-2" title={visit.ovOSuspendedReasonDescription}>
                                    {visit.ovOSuspendedReasonDescription}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Progress Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={125.6}
                                strokeDashoffset={125.6 * (1 - ((visit.progress || 0) / 100))}
                                className="text-emerald-500"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-black text-slate-900 dark:text-white">{visit.progress || 0}%</span>
                    </div>

                    {!hideHeaderActions && (
                        /* Processing Status Badge */
                        <OrderVisitProcessingButton
                            processingId={visit.ovProcessingId}
                            size="md"
                        />
                    )}
                </div>
            </div>

            {/* Asset / Unit Info */}
            <div className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 leading-none">
                    {visit.clientName || visit.systemDescription || 'CLIENTE'}
                </p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 mt-0.5">
                    {visit.unitDescription || 'Unidade não informada'}
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 leading-none">
                    {visit.assetTagDescription || 'SETOR'} / {visit.assetTagSubDescription || 'POSIÇÃO'}
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                    {visit.requestedServices || 'Nenhum serviço descrito'}
                </p>
            </div>

            {/* Team Section */}
            <div className="flex justify-between items-center mb-0.5">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                    {(visit.teamCode || 'EQ.RESPONSAVEL').toUpperCase()}
                </h4>
                {visit.contractDescription && (
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                        {visit.contractDescription.toUpperCase()}
                    </span>
                )}
            </div>
            <div className="">
                <div className="flex flex-wrap gap-2 mb-4">
                    {team.map((member) => (
                        <div key={member.userId} className="flex flex-col items-center gap-1 group">
                            <div className="relative h-14 w-14 flex items-center justify-center">
                                <UserAvatar
                                    src={member.userAvatarUrl}
                                    name={member.userName || 'Membro'}
                                    size="md"
                                    status={(member.userIsAvailable === true || (member.userIsAvailable as any) === 1 || (member.userIsAvailable as any) === 'true' || (member as any).user_is_available === true || (member as any).user_is_available === 1 || (member as any).user_is_available === 'true') ? 'available' : 'unavailable'}
                                    isOvInProgress={visit.ovStatusId === 1}
                                    className="shadow-sm"
                                />
                                {onRemoveTeamMember && !member.isLeader && !visit.isFiled && (
                                    <button
                                        onClick={() => onRemoveTeamMember(member.userId)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md transform hover:scale-110 transition-transform border-2 border-white"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 text-center w-14 truncate">
                                {member.userName?.split(' ')[0] || 'Nome'}
                            </span>
                        </div>
                    ))}
                </div>
                {visit.planDescription && (
                    <div className="flex justify-end mt-2 mb-2">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                            {visit.planDescription.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Add Member Footer */}
                {onAddTeamMember && !visit.isFiled && [1, 2, 3, 4].includes(Number(visit.ovProcessingId || 1)) && (
                    <div className="pt-2 flex gap-2">
                        <div className="flex-1">
                            <Select
                                id="user-selector"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                placeholder="Selecionar usuário..."
                                options={availableUsers.map(u => ({ value: u.id, label: u.nameShort || u.nameFull || 'Sem nome' }))}
                                className="h-11!"
                            />
                        </div>
                        <button
                            onClick={handleAddClick}
                            disabled={isAdding || !selectedUserId}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 ${isAdding || !selectedUserId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                            {isAdding ? (
                                <Loading size="xs" />
                            ) : (
                                <span className="material-symbols-outlined font-black">add</span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Activity Time - Moved here per request */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-6 mb-2">
                <span>{formatDateTime(visit.ovStartedAt)}</span>
                {visit.ovStatusId === 2 && (
                    <>
                        <span>({visit.ovDurationHours?.toFixed(1) || '0.0'} h)</span>
                        <span>{formatDateTime(visit.ovEndedAt)}</span>
                    </>
                )}
            </div>

            {/* Main Action Button */}
            {onEndVisit && (
                <button
                    onClick={onEndVisit}
                    className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">stop_circle</span>
                    Encerrar Visita
                </button>
            )}

            {/* Report Visit Button */}
            {onReportVisit && !onDisapproveVisit && [1, 4].includes(Number(visit.ovProcessingId || 1)) && (
                <button
                    onClick={onReportVisit}
                    disabled={isReportLoading}
                    className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isReportLoading ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">send</span>
                    )}
                    {isReportLoading ? 'CARREGANDO...' : 'Reportar Visita'}
                </button>
            )}

            {/* Mark Visit as Revised Button — only when ALL assets are in REVISADA (3) */}
            {onMarkAsRevised && !onDisapproveVisit && Number(visit.ovProcessingId || 1) === 2 && (
                <button
                    onClick={onMarkAsRevised}
                    disabled={isRevising}
                    className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isRevising ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">done_all</span>
                    )}
                    {isRevising ? 'REVISANDO...' : 'Marcar como REVISADA'}
                </button>
            )}

            {/* Approve Visit Button */}
            {onApproveVisit && !onDisapproveVisit && (
                <button
                    onClick={onApproveVisit}
                    disabled={isApproveLoading}
                    className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isApproveLoading ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">verified</span>
                    )}
                    {isApproveLoading ? 'Aguarde ...' : 'Aprovar Visita'}
                </button>
            )}

            {/* File (Archive) Visit Button */}
            {onFileVisit && (
                <button
                    onClick={onFileVisit}
                    disabled={isFileLoading}
                    className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isFileLoading ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">inventory_2</span>
                    )}
                    {isFileLoading ? 'ARQUIVANDO...' : 'ARQUIVAR VISITA'}
                </button>
            )}

            {/* Disapprove (Reject) Visit Button */}
            {onDisapproveVisit && (
                <button
                    onClick={onDisapproveVisit}
                    disabled={isDisapproveLoading}
                    className="w-full mt-4 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isDisapproveLoading ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">rebase_edit</span>
                    )}
                    {isDisapproveLoading ? 'REJEITANDO...' : 'REJEITAR VISITA (AJUSTAR)'}
                </button>
            )}

            {/* Estornar Aprovação Button */}
            {onReverseApproval && (
                <button
                    onClick={onReverseApproval}
                    disabled={isReverseApprovalLoading}
                    className="w-full mt-4 py-4 bg-slate-600 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-slate-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isReverseApprovalLoading ? (
                        <Loading size="xs" />
                    ) : (
                        <span className="material-symbols-outlined">undo</span>
                    )}
                    {isReverseApprovalLoading ? 'CARREGANDO...' : 'Estornar Aprovação'}
                </button>
            )}
        </Card>
    );
};
