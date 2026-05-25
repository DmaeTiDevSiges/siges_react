import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { Card } from '../ui/Card';
import { CompanyAvatar } from '../ui/CompanyAvatar';
import { Avatar } from '../ui/Avatar';
import { formatDateTime, getPriorityColor, getStatusConfig } from '../../utils/formatters';
import { OrderActionManager } from './OrderActionManager';
import { dataService } from '../../services/dataService';
import { PhotoViewer } from '../ui/PhotoViewer';

interface OrderRequestCardListItemProps {
    order: Order;
    onClick?: () => void;
    onSuccess?: () => void;
    noBorder?: boolean;
    noShadow?: boolean;
}

export const OrderRequestCardListItem: React.FC<OrderRequestCardListItemProps> = ({ order: req, onClick, onSuccess, noBorder, noShadow }) => {
    const [showViewer, setShowViewer] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const statusCfg = getStatusConfig(req.statusId);

    const progressValue = useMemo(() => {
        if (req.progress === null || req.progress === undefined) return 0;
        const num = Number(String(req.progress).replace('%', ''));
        if (isNaN(num)) return 0;
        return num;
    }, [req.progress]);

    const imageUrls = useMemo(() => {
        // Robust handling of image filenames: handles camelCase, snake_case, and string or array formats
        let files = req.imgFilesNames || (req as any).img_files_names || req.images;

        if (typeof files === 'string' && files.length > 0) {
            try {
                if (files.startsWith('[') || files.startsWith('{')) {
                    files = JSON.parse(files.replace('{', '[').replace('}', ']'));
                } else {
                    files = files.split(',').map(s => s.trim());
                }
            } catch (e) {
                // Manual parse for postgres array format if JSON.parse fails
                files = files.replace(/[{}]/g, '').split(',').map(s => s.trim().replace(/"/g, ''));
            }
        }

        if (!files || !Array.isArray(files) || files.length === 0) return [];

        // Prefer explicit path from DB if available
        const folderPath = req.imgFilePath || (req as any).img_file_path || (req.companyId && req.id ? `companies/${req.companyId}/orders/${req.id}/images` : null);

        if (!folderPath) return [];

        return files.map(filename =>
            dataService.getPublicImageUrl(
                folderPath,
                filename,
                { width: 400, height: 400, resize: 'cover' }
            ) || ''
        ).filter(url => url !== '');
    }, [req.imgFilesNames, (req as any).img_files_names, req.images, req.imgFilePath, (req as any).img_file_path, req.companyId, req.id]);

    const handleImageClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setViewerIndex(index);
        setShowViewer(true);
    };

    return (
        <Card
            id={`order-${req.id}`}
            onClick={onClick}
            noBorder={noBorder}
            noShadow={noShadow}
            className="rounded-[16px]! hover:shadow-xl active:scale-[0.98] active:bg-slate-50 dark:active:bg-white/5 transition-all cursor-pointer group relative h-full flex flex-col"
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    className="flex flex-col gap-0.5 px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white"
                    style={{ backgroundColor: getPriorityColor(req.priorityColor || req.priorityCode || (req as any).priority_color || (req as any).priority_code) }}
                >
                    <span className="text-[18px] font-black leading-none tracking-tight">{req.orderMask || (req as any).order_mask}</span>
                    <div className="flex justify-between items-center w-full mt-1">
                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">{req.type || (req as any).type_name || 'OS'} {req.typeCode || (req as any).type_code}/{req.typeSubCode || (req as any).type_sub_code}/{req.objectCode || (req as any).object_code}</span>
                        <span className="text-[9px] font-black opacity-80">{req.priorityCode || (req as any).priority_code}</span>
                    </div>
                </div>
                <CompanyAvatar src={req.providerLogo || (req as any).provider_logo || undefined} name={req.providerCompanyName || (req as any).provider_company_name || 'Provider'} size="md" className="shadow-lg transform group-hover:scale-110 transition-transform" />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {req.clientName && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">{req.clientName}</p>
                )}
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 mt-0.5">{req.unitDescription || req.typeDescription}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                    {(req.unitAssetTagDescription || (req as any).asset_tag_description)
                        ? `${req.unitAssetTagDescription || (req as any).asset_tag_description}${(req.assetTagSubDescription || req.unitAssetTagSubDescription || (req as any).asset_tag_sub_description) ? ` / ${req.assetTagSubDescription || req.unitAssetTagSubDescription || (req as any).asset_tag_sub_description}` : ''}`
                        : req.typeDescription}
                </p>
                <div className="relative mb-2 flex-1 min-h-0">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight whitespace-pre-line pr-6">{req.requestedServices}</p>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 absolute -right-2 top-0.5">chevron_right</span>
                </div>

                {/* Image Gallery */}
                {imageUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2 items-center" onClick={(e) => e.stopPropagation()}>
                        {imageUrls.map((url, index) => (
                            <div
                                key={index}
                                onClick={(e) => handleImageClick(e, index)}
                                className="shrink-0 w-[80px] h-[80px] rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:opacity-90 transition-opacity relative group"
                            >
                                <Avatar
                                    src={url}
                                    alt={`Imagem ${index + 1}`}
                                    shape="rounded"
                                    className="w-full! h-full! rounded-none!"
                                    imageClassName="hover:scale-105 transition-transform duration-500 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {req.requesterName || (req as any).requester_name || 'Solicitante não identificado'}
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">{req.requesterTeamCode || (req as any).requester_team_code}</div>
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500">{req.requesterPhone || req.phone}</div>
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 text-right">{formatDateTime(req.requestedAt || (req as any).requested_at)}</div>
                </div>
            </div>

            <div className="pt-1 mt-auto">
                <div className="mt-3 mb-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${statusCfg.barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">
                        {Math.round(progressValue)}%
                    </span>
                </div>

                <div>
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
            </div>
            {showViewer && (
                <div onClick={(e) => e.stopPropagation()}>
                    <PhotoViewer
                        images={imageUrls}
                        initialIndex={viewerIndex}
                        onClose={() => setShowViewer(false)}
                    />
                </div>
            )}
        </Card>
    );
};