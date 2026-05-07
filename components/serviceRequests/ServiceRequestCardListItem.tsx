import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { Card } from '../ui/Card';
import { CompanyAvatar } from '../ui/CompanyAvatar';
import { dataService } from '../../services/dataService';
import { PhotoViewer } from '../ui/PhotoViewer';
import { Avatar } from '../ui/Avatar';

interface ServiceRequestCardListItemProps {
    order: Order;
    onClick?: () => void;
    isFollowed?: boolean;
    onToggleFollow?: (e: React.MouseEvent) => void;
}

export const ServiceRequestCardListItem: React.FC<ServiceRequestCardListItemProps> = ({ order: req, onClick, isFollowed, onToggleFollow }) => {
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
        e.stopPropagation(); // Avoid opening detail
        setViewerIndex(index);
        setShowViewer(true);
    };

    return (
        <Card
            id={`service-request-${req.id}`}
            onClick={onClick}
            className="rounded-[12px]! p-4 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group relative overflow-visible h-full flex flex-col"
        >
            {/* Header with Date Badge and Company Logo */}
            <div className="flex justify-between items-start mb-3">
                {/* Date Badge - Compact Red/Pink */}
                <div className="flex flex-col px-4 py-2.5 rounded-[14px] bg-rose-500 text-white shadow-md min-w-[120px]">
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
                            fontSize: '48px',
                            fontVariationSettings: isFollowed ? "'FILL' 1" : "'FILL' 0"
                        }}
                    >
                        star
                    </span>
                </button>
            </div>

            {/* Client Name */}
            {req.clientName && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">{req.clientName}</p>
            )}

            {/* Title */}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5 mt-0.5">
                {req.unitDescription || req.typeDescription || 'Sem título'}
            </h3>

            {/* Category / Sector */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                {req.unitAssetTagDescription
                    ? `${req.unitAssetTagDescription}${req.unitAssetTagSubDescription ? ` / ${req.unitAssetTagSubDescription}` : ''}`
                    : req.typeDescription}
            </p>

            {/* Description + Chevron */}
            <div className="relative">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-tight line-clamp-3">
                    {req.requestedServices || 'Sem descrição'}
                </p>
            </div>

            {/* Image Gallery */}
            {
                imageUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2 items-center" onClick={(e) => e.stopPropagation()}>
                        {imageUrls.map((url, index) => (
                            <div
                                key={index}
                                onClick={(e) => handleImageClick(e, index)}
                                className="shrink-0 w-[90px] h-[90px] rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90 transition-opacity relative group"
                            >
                                <Avatar
                                    src={url}
                                    alt={`Imagem ${index + 1}`}
                                    shape="rounded"
                                    className="w-full! h-full! rounded-none!"
                                    imageClassName="hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Contact Info Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2 mt-auto">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {req.requesterNameShort || req.requesterName || 'Solicitante não identificado'}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                    {req.requesterTeamCode || req.teamDescription}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {req.requesterPhone || req.phone}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right flex flex-col">
                    <span>{formatGridDate(req.requestedAt)}</span>
                    <span className="text-[10px] uppercase text-slate-400 tracking-tight mt-0.5">
                        {getRelativeTime(req.statusAt || req.requestedAt)}
                    </span>
                </div>
            </div>


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
        </Card >
    );
};

