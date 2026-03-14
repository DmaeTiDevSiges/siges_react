import React from 'react';
import { Order } from '../../types';
import { Card } from '../ui/Card';
import { CompanyAvatar } from '../ui/CompanyAvatar';
import { Avatar } from '../ui/Avatar';
import { formatDateTime, getPriorityColor, getStatusConfig } from '../../utils/formatters';
import { OrderActionManager } from './OrderActionManager';

interface OrderRequestCardListItemProps {
    order: Order;
    onClick?: () => void;
    onSuccess?: () => void;
    noBorder?: boolean;
    noShadow?: boolean;
}

export const OrderRequestCardListItem: React.FC<OrderRequestCardListItemProps> = ({ order: req, onClick, onSuccess, noBorder, noShadow }) => {
    const statusCfg = getStatusConfig(req.statusId);

    return (
        <Card
            id={`order-${req.id}`}
            onClick={onClick}
            noBorder={noBorder}
            noShadow={noShadow}
            className="rounded-[16px]! hover:shadow-xl active:scale-[0.98] active:bg-slate-50 dark:active:bg-white/5 transition-all cursor-pointer group relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white ${getPriorityColor(req.priorityCode || (req as any).priority_code)}`}>
                    <span className="text-[18px] font-black leading-none tracking-tight">{req.orderMask || (req as any).order_mask}</span>
                    <div className="flex justify-between items-center w-full mt-1">
                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">{req.type || (req as any).type_name || 'OS'} {req.typeCode || (req as any).type_code}/{req.typeSubCode || (req as any).type_sub_code}/{req.objectCode || (req as any).object_code}</span>
                        <span className="text-[9px] font-black opacity-80">{req.priorityCode || (req as any).priority_code}</span>
                    </div>
                </div>
                <CompanyAvatar src={req.providerLogo || (req as any).provider_logo || undefined} name={req.providerCompanyName || (req as any).provider_company_name || 'Provider'} size="md" className="shadow-lg transform group-hover:scale-110 transition-transform" />
            </div>

            {req.clientName && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">{req.clientName}</p>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 mt-0.5">{req.unitDescription || req.typeDescription}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                {(req.unitAssetTagDescription || (req as any).asset_tag_description)
                    ? `${req.unitAssetTagDescription || (req as any).asset_tag_description}${(req.assetTagSubDescription || req.unitAssetTagSubDescription || (req as any).asset_tag_sub_description) ? ` / ${req.assetTagSubDescription || req.unitAssetTagSubDescription || (req as any).asset_tag_sub_description}` : ''}`
                    : req.typeDescription}
            </p>
            <div className="relative">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 leading-tight whitespace-pre-line flex-1 pr-6">{req.requestedServices}</p>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 absolute -right-2 top-0.5">chevron_right</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {req.requesterName || (req as any).requester_name || 'Solicitante não identificado'}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">{req.requesterTeamCode || (req as any).requester_team_code}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500">{req.requesterPhone || req.phone}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 text-right">{formatDateTime(req.requestedAt || (req as any).requested_at)}</div>
            </div>

            <div className="mt-3 mb-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${statusCfg.barColor}`}
                        style={{ width: req.progress || '0%' }}
                    />
                </div>
                <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">
                    {req.progress || '0%'}
                </span>
            </div>

            <div className="pt-1">
                <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{req.contractDescription || (req as any).contract_description}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{req.planDescription === 'N/I' || (req as any).plan_description === 'N/I' ? 'Plano N/I' : (req.planDescription || (req as any).plan_description)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${statusCfg.bgColor}`}
                        >
                            <span
                                className={`material-symbols-outlined text-2xl ${statusCfg.color}`}
                            >
                                {statusCfg.icon}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{req.statusDescription || (req as any).status_description || 'N/A'}</span>
                            <span className="text-[10px] font-bold text-slate-400">{req.statusAt || (req as any).status_at ? formatDateTime(req.statusAt || (req as any).status_at) : '---'}</span>
                            <span className="text-[10px] font-black text-slate-500/70 dark:text-slate-400/50 uppercase tracking-tighter">{req.teamCode || (req as any).team_code || '---'} {(req.teamLeaderNameShort || (req as any).team_leader_name_short) && `| ${req.teamLeaderNameShort || (req as any).team_leader_name_short}`}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{req.causeReasonDescription || (req as any).cause_reason_description}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                            <OrderActionManager order={req} onSuccess={onSuccess} />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};