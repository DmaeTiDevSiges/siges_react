import React, { useState, useMemo } from 'react';
import { Order, User } from '../../types';
import { Card } from '../ui/Card';
import { CompanyAvatar } from '../ui/CompanyAvatar';
import { formatDateTime, getPriorityColor, getStatusConfig } from '../../utils/formatters';
import { OrderActionManager } from './OrderActionManager';
import { dataService } from '../../services/dataService';
import { PhotoViewer } from '../ui/PhotoViewer';
import { Avatar } from '../ui/Avatar';
import { Loading } from '../ui/Loading';


interface OrderCardDetailProps {
    order: Order;
    currentUser?: User | null;
    onClick?: () => void;
    onStartVisit?: () => void;
    onSuccess?: () => void;
    onEdit?: (order: Order) => void;
    isStartingVisit?: boolean;
    noBorder?: boolean;
    noShadow?: boolean;
}

export const OrderCardDetail: React.FC<OrderCardDetailProps> = ({ order: req, currentUser, onClick, onStartVisit, onSuccess, onEdit, isStartingVisit, noBorder, noShadow }) => {
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
    }, [req.imgFilesNames, (req as any).img_files_names, req.images, req.imgFilePath, (req as any).img_file_path, req.companyId, req.id, (req as any).company_id]);

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
            className="rounded-[16px]! hover:shadow-xl active:scale-[0.98] active:bg-slate-50 dark:active:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    className="flex flex-col gap-0.5 px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform group-hover:scale-105 min-w-[140px] text-white"
                    style={{ backgroundColor: getPriorityColor(req.priorityColor || req.priorityCode || (req as any).priority_code || (req as any).priority_color) }}
                >
                    <span className="text-[18px] font-black leading-none tracking-tight">{req.orderMask || (req as any).order_mask}</span>
                    <div className="flex justify-between items-center w-full mt-1">
                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">OS {req.typeCode || (req as any).type_code}/{req.typeSubCode || (req as any).type_sub_code}/{req.objectCode || (req as any).object_code}</span>
                        <span className="text-[9px] font-black opacity-80">{req.priorityCode || (req as any).priority_code}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CompanyAvatar src={req.providerLogo || (req as any).provider_logo || undefined} name={req.providerCompanyName || (req as any).provider_company_name || 'Provider'} size="md" className="shadow-lg transform group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {req.clientName && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">{req.clientName}</p>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 mt-0.5">{req.unitDescription || req.typeDescription}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                {req.unitAssetTagDescription
                    ? `${req.unitAssetTagDescription}${req.assetTagSubDescription ? ` / ${req.assetTagSubDescription}` : ''}`
                    : req.typeDescription}
            </p>
            <div className="relative">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 leading-tight whitespace-pre-line flex-1 pr-6">{req.requestedServices}</p>
            </div>

            {/* Image Gallery */}
            {imageUrls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mb-4 items-center" onClick={(e) => e.stopPropagation()}>
                    {imageUrls.map((url, index) => (
                        <div
                            key={index}
                            onClick={(e) => handleImageClick(e, index)}
                            className="shrink-0 w-[90px] h-[90px] rounded-[14px] overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity relative group"
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
                    {req.requesterName || 'Solicitante não identificado'}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right">{req.requesterTeamCode}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500">{req.requesterPhone || req.phone}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 text-right">{formatDateTime(req.requestedAt)}</div>
            </div>

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


            <div className="pt-1">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{req.contractDescription}</span>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                            {req.causeReasonDescription || (req as any).cause_reason_description || 'CAUSA N/I'}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{req.planDescription === 'N/I' ? 'Plano N/I' : req.planDescription}</span>
                </div>

                {/* Status Info - Without Card */}
                <div className="flex items-center gap-2.5 mt-2">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${statusCfg.bgColor}`}
                    >
                        <span
                            className={`material-symbols-outlined text-xl ${statusCfg.color}`}
                        >
                            {statusCfg.icon}
                        </span>
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{req.statusDescription || (req as any).status_description || (req as any).status_name || 'Status'}</span>
                        <span className="text-[9px] font-bold text-slate-400">{formatDateTime(req.statusAt || (req as any).status_at)}</span>
                        <span className="text-[9px] font-black text-slate-500/70 dark:text-slate-400/50 uppercase tracking-tighter">{req.teamCode || (req as any).team_code || '---'} {(req.teamLeaderNameShort || (req as any).team_leader_name_short) && `| ${req.teamLeaderNameShort || (req as any).team_leader_name_short}`}</span>
                    </div>
                    <OrderActionManager order={req} currentUser={currentUser ?? null} onSuccess={onSuccess} onEdit={onEdit} />
                </div>
            </div>

            {/* Start Visit Button */}
            {onStartVisit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isStartingVisit) onStartVisit();
                    }}
                    disabled={isStartingVisit}
                    className={`w-full mt-4 py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${isStartingVisit
                        ? 'bg-slate-400 cursor-wait'
                        : 'bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-[0.98] hover:shadow-xl'
                        }`}
                >
                    {isStartingVisit ? (
                        <>
                            <Loading size="xs" />
                            <span>INICIANDO...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-xl">play_circle</span>
                            INICIAR VISITA
                        </>
                    )}
                </button>
            )}
            {/* Photo Viewer */}
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
