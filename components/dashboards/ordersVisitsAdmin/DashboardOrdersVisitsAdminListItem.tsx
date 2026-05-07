import React, { memo } from 'react';
import { OrderVisit, OrderVisitTeam } from '../../../types';
import { Card } from '../../ui/Card';
import { UserAvatar } from '../../ui/UserAvatar';
import { formatDateTime, getPriorityColor, formatCurrency, getStatusConfig } from '../../../utils/formatters';
import { IconButton } from '../../ui/IconButton';
import { VisitReportPDFButton } from '../../reports/VisitReportPDFButton';

interface DashboardOrdersVisitsAdminListItemProps {
    visit: OrderVisit;
    teamMembers?: OrderVisitTeam[];
    onClick?: () => void;
}

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const size = 36;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-slate-700/50"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-500"
                />
            </svg>
            <span className="absolute text-[9px] font-black text-slate-900 dark:text-white">{progress}%</span>
        </div>
    );
};

const DashboardOrdersVisitsAdminListItem: React.FC<DashboardOrdersVisitsAdminListItemProps> = ({
    visit,
    teamMembers = [],
    onClick
}) => {
    return (
        <Card
            id={`visit-admin-item-${visit.id}`}
            onClick={onClick}
            className="group relative bg-white dark:bg-[#0f172a] rounded-[24px]! p-5 transition-all cursor-pointer border-none! shadow-lg dark:shadow-2xl hover:shadow-primary/10 flex flex-col gap-6"
        >
            {/* Top Row: Badge, Value and Progress */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                    {/* ID Badge */}
                    <div
                        className={`relative flex flex-col gap-0.5 px-4 py-3 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white overflow-hidden ${!visit.priorityColor ? getPriorityColor(visit.priorityCode || 'AT') : ''}`}
                        style={visit.priorityColor ? { backgroundColor: visit.priorityColor } : undefined}
                    >
                        <span className="text-[18px] font-black leading-none tracking-tight">{visit.ovMask}</span>
                        <div className="flex justify-between items-center w-full mt-1">
                            <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">
                                {visit.processingDescription || 'OS ELE/COR/SRV'}
                            </span>
                            <span className="text-[9px] font-black opacity-80 uppercase">
                                {visit.priorityCode || 'AT'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress and Action */}
                <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                        <VisitReportPDFButton visitId={visit.id} visitMask={visit.ovMask || ''} variant="action" />
                    </div>

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

                    <CircularProgress progress={visit.progress || 0} />
                    <button
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${visit.ovProcessingId === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                            visit.ovProcessingId === 2 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' :
                                visit.ovProcessingId === 3 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' :
                                    visit.ovProcessingId === 4 ? 'bg-red-50 dark:bg-red-900/30 text-red-500' :
                                        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'
                            }`}
                        title={visit.processingDescription}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {visit.ovProcessingId === 2 ? 'assignment_turned_in' :
                                visit.ovProcessingId === 3 ? 'verified' :
                                    visit.ovProcessingId === 4 ? 'cancel' :
                                        visit.ovProcessingId === 5 ? 'check_circle' :
                                            'edit_note'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Content Row: Info */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {visit.clientName && (
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        {visit.clientName}
                    </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                    {visit.unitDescription}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">
                        {visit.assetTagDescription ? (
                            `${visit.assetTagDescription}${visit.assetTagSubDescription ? ` / ${visit.assetTagSubDescription}` : ''}`
                        ) : (
                            visit.systemDescription || 'SISTEMA'
                        )}
                    </span>

                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-tight">
                    {visit.requestedServices || 'Sem descrição do serviço'}
                </p>
            </div>

            {/* Bottom Group: Team and Footer pushed to bottom */}
            <div className="flex flex-col gap-6 mt-auto">
                {/* Team Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                            { (visit.teamCode || 'EQUIPE').toUpperCase() }
                        </span>
                        {visit.contractDescription && (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                {visit.contractDescription.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {teamMembers.map((member) => (
                            <div key={member.userId} className="flex flex-col items-center gap-2 group/avatar relative">
                                <div className="relative">
                                    <UserAvatar
                                        name={member.userName || ''}
                                        src={member.userAvatarUrl}
                                        size="md"
                                        status={member.userIsAvailable ? 'available' : 'unavailable'}
                                        className="border-2! border-emerald-500/50!"
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {member.userName?.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                    {visit.planDescription && (
                        <div className="flex justify-end mt-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                {visit.planDescription.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Row: Timestamps and then Financial Breakdown */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-5">
                    {/* 1. Timestamps Row */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] opacity-50">calendar_today</span>
                            <span>{formatDateTime(visit.ovStartedAt)}</span>
                        </div>
                        {(visit.ovStatusId !== 1 && visit.ovDurationHours && visit.ovDurationHours > 0) ? (
                            <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                {visit.ovDurationHours.toFixed(1)} h
                            </div>
                        ) : (
                            <div className="w-4" /> /* Spacer if hidden to maintain layout */
                        )}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] opacity-50">event_available</span>
                            <span>{formatDateTime(visit.ovEndedAt)}</span>
                        </div>
                    </div>

                    {/* 2. Financial Breakdown Cards Row (at the very bottom) */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/30">
                        <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl min-w-[70px]">
                            <span className="text-[8px] font-black text-blue-500 dark:text-blue-400/70 uppercase leading-none">Serviços</span>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-none">{formatCurrency(visit.servicesValue || 0)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl min-w-[70px]">
                            <span className="text-[8px] font-black text-amber-500 dark:text-amber-400/70 uppercase leading-none">Materiais</span>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none">{formatCurrency(visit.materialsValue || 0)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-purple-500/5 border border-purple-500/10 rounded-xl min-w-[70px]">
                            <span className="text-[8px] font-black text-purple-500 dark:text-purple-400/70 uppercase leading-none">Transp.</span>
                            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 leading-none">{formatCurrency(visit.vehiclesValue || 0)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl ml-auto">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500/70 uppercase leading-none">TOTAL</span>
                            <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-500 leading-none tracking-tight">
                                {formatCurrency(visit.totalValue || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default memo(DashboardOrdersVisitsAdminListItem);
