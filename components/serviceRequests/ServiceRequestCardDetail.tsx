import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Order, User } from '../../types';
import { Card } from '../ui/Card';
import { dataService } from '../../services/dataService';
import { PhotoViewer } from '../ui/PhotoViewer';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { getPriorityColor, getStatusConfig } from '../../utils/formatters';
import { Modal } from '../ui/Modal';

interface ServiceRequestCardDetailProps {
    order: Order;
    onClick?: () => void;
    isFollowed?: boolean;
    onToggleFollow?: (e: React.MouseEvent) => void;
    onEdit?: () => void;
    onGenerateOS?: () => void;
    onCancelSS?: () => void;
    currentUser?: User | null;
}

export const ServiceRequestCardDetail: React.FC<ServiceRequestCardDetailProps> = ({ order: req, onClick, isFollowed, onToggleFollow, onEdit, onGenerateOS, onCancelSS, currentUser }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const statusCfg = getStatusConfig(req.statusId);
    // Parse date for Badge (Day.Month.Year - No padding based on image Step 1020)
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return { day: '21', month: '1', year: '2026' };
        const date = new Date(dateStr);
        const day = date.getDate().toString();
        const month = (date.getMonth() + 1).toString();
        const year = date.getFullYear().toString();
        return { day, month, year };
    };

    // Format date for Grid (dd/mm/aaaa HH:mm h)
    const formatGridDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes} h`;
    };

    // Calculate relative time (e.g. "Há 2 horas")
    const getRelativeTime = (dateStr?: string) => {
        if (!dateStr) return 'Sem data';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Data inv.';

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Há instantes';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `Há ${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Há ${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `Há ${diffInDays} dias`;
    };

    const { day, month, year } = parseDate(req.requestedAt);

    const [showViewer, setShowViewer] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

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
        const folderPath = req.imgFilePath || (req.companyId && req.id ? `companies/${req.companyId}/orders/${req.id}/images` : null);

        if (!folderPath) return [];

        return files.map(filename =>
            dataService.getPublicImageUrl(
                folderPath,
                filename,
                { width: 400, height: 400, resize: 'cover' }
            ) || ''
        ).filter(url => url !== '');
    }, [req.imgFilesNames, (req as any).img_files_names, req.images, req.imgFilePath, req.companyId, req.id]);

    const handleImageClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setViewerIndex(index);
        setShowViewer(true);
    };

    const [isCancelling, setIsCancelling] = useState(false);

    const handleConfirmCancel = async () => {
        if (!onCancelSS) return;
        setIsCancelling(true);
        try {
            await onCancelSS();
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    return (
        <Card
            id={`service-request-detail-${req.id}`}
            onClick={onClick}
            className="rounded-[12px]! p-4 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group relative overflow-visible"
        >
            {/* Header with Date Badge and Company Logo */}
            <div className="flex justify-between items-start mb-3">
                {/* Date Badge - Priority Based Color */}
                <div className={`flex flex-col px-4 py-2.5 rounded-[14px] text-white shadow-md min-w-[120px] ${getPriorityColor(req.priorityCode || 'AT')}`}>
                    <span className="text-[20px] font-black leading-none mb-1">{req.orderMask || 'OS'}</span>
                    <div className="flex justify-between items-center w-full gap-2">
                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">SS {req.typeCode || 'N/I'}</span>
                        <span className="text-[9px] font-black opacity-80">{req.priorityCode || 'AT'}</span>
                    </div>
                </div>

                <button
                    className={`transition-all active:scale-90 ${isFollowed ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFollow) onToggleFollow(e);
                    }}
                >
                    <span
                        key={isFollowed ? 'followed' : 'unfollowed'}
                        className={`material-symbols-outlined ${isFollowed ? 'animate-star-pop' : ''}`}
                        style={{
                            fontSize: '36px',
                            fontVariationSettings: isFollowed ? "'FILL' 1" : "'FILL' 0"
                        }}
                    >
                        star
                    </span>
                </button>
            </div>

            {/* Client Name */}
            {
                req.clientName && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{req.clientName}</p>
                )
            }

            {/* Title */}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-1">
                {req.unitDescription || req.typeDescription || 'Sem título'}
            </h3>

            {/* Category and Chevron */}
            <div className="flex justify-between items-center mb-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {req.unitAssetTagDescription
                        ? `${req.unitAssetTagDescription}${req.unitAssetTagSubDescription ? ` / ${req.unitAssetTagSubDescription}` : ''}`
                        : req.typeDescription}
                </p>

            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-tight line-clamp-3">
                {req.requestedServices || 'Sem descrição'}
            </p>
            {/* Image Gallery */}
            {
                imageUrls.length > 0 && (
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
                )
            }

            {/* Contact Info Grid - Optimized for Premium Look */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {req.requesterName || 'Solicitante não identificado'}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                    {req.requesterTeamCode}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {req.requesterPhone}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right flex flex-col">
                    <span>{formatGridDate(req.requestedAt)}</span>
                    <span className="text-[10px] uppercase text-slate-400 tracking-tight mt-0.5">
                        {getRelativeTime(req.requestedAt)}
                    </span>
                </div>
            </div>

            {/* Situation / Footer */}
            <div className="h-px bg-slate-100 dark:bg-white/5 my-3" />
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusCfg.bgColor}`}
                    >
                        <span
                            className={`material-symbols-outlined text-[22px] ${statusCfg.color}`}
                        >
                            {statusCfg.icon}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            {req.statusDescription}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            {formatGridDate(req.statusAt || req.requestedAt)}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <IconButton
                        icon="more_vert"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className={`transition-all duration-300 ${showMenu ? 'ring-4 ring-primary/20 bg-primary/10 text-primary' : ''}`}
                    />
                </div>
            </div>

            {/* Unified Bottom Sheet Menu for SS */}
            {
                showMenu && createPortal(
                    <div className="fixed inset-0 z-100 flex items-end justify-center" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>
                        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" />
                        <div
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-8" />

                            <div className="flex flex-col gap-3">
                                {onGenerateOS && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onGenerateOS?.(); }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm transition-transform group-hover:scale-110">
                                            <span className="material-symbols-outlined text-[28px]">assignment_add</span>
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Gerar OS</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Converter esta solicitação</span>
                                        </div>
                                    </button>
                                )}

                                {onEdit && currentUser?.isAdminSuper && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(); }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm transition-transform group-hover:scale-110">
                                            <span className="material-symbols-outlined text-[28px]">edit_square</span>
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Editar SS</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alterar dados da solicitação</span>
                                        </div>
                                    </button>
                                )}

                                {onCancelSS && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                            setShowCancelModal(true);
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-red-500/10 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm transition-transform group-hover:scale-110">
                                            <span className="material-symbols-outlined text-[28px]">cancel</span>
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Cancelar SS</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encerrar solicitação</span>
                                        </div>
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setShowMenu(false)}
                                className="w-full mt-8 py-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                            >
                                Fechar Menu
                            </button>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Photo Viewer */}
            {
                showViewer && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <PhotoViewer
                            images={imageUrls}
                            initialIndex={viewerIndex}
                            onClose={() => setShowViewer(false)}
                        />
                    </div>
                )
            }

            {/* Cancel Confirmation Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                confirmLoading={isCancelling}
                confirmLoadingLabel="CANCELANDO..."
                title="Cancelar Solicitação"
                message="Deseja realmente cancelar esta solicitação? Esta ação não poderá ser desfeita."
                confirmLabel="Sim, Cancelar"
                cancelLabel="Não, Manter"
                type="error"
            />
        </Card >
    );
};
