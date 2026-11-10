/**
 * Condição Antes / Depois do relatório do ativo: texto + até 3 fotos.
 */
import React, { useState } from 'react';
import { OptimizedImage } from '../../../ui/OptimizedImage';
import {
    MAX_REPORT_PHOTOS,
    ReportPhoto,
    ReportPhotoSide,
    ReportSection,
    ReportSectionStatus,
    reportTextareaClass,
} from './assetReportShared';

interface ImageGridProps {
    photos: ReportPhoto[];
    side: ReportPhotoSide;
    isReadOnly: boolean;
    canUseAsCover: boolean;
    onView: (url: string) => void;
    onEdit: (side: ReportPhotoSide, index: number) => void;
    onRemove: (side: ReportPhotoSide, index: number) => void;
    onAdd: (side: ReportPhotoSide) => void;
    onUseAsCover?: (url: string) => void;
    onFileDrop?: (side: ReportPhotoSide, file: File) => void;
}

const AssetReportImageGrid: React.FC<ImageGridProps> = ({ photos, side, isReadOnly, canUseAsCover, onView, onEdit, onRemove, onAdd, onUseAsCover, onFileDrop }) => {
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const dropHandlers = (idx: number) => onFileDrop ? {
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(idx); },
        onDragLeave: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(null); },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverIdx(null);
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('image/')) onFileDrop(side, file);
        },
    } : {};

    return (
        <div className="grid grid-cols-3 gap-3 mt-3">
            {Array.from({ length: MAX_REPORT_PHOTOS }, (_, idx) => {
                const photo = photos[idx];

                if (photo?.url) {
                    const isPending = !!photo.pending;
                    return (
                        <div key={photo.key} className="flex flex-col gap-1">
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => onView(photo.url)}
                                    aria-label={`Ampliar foto ${idx + 1}`}
                                    className="block w-full h-full"
                                >
                                    <OptimizedImage src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" preset="medium" />
                                </button>
                                {isPending && (
                                    <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center" role="status" aria-label="Enviando foto">
                                        <span className="material-symbols-outlined text-white text-2xl animate-spin">progress_activity</span>
                                    </div>
                                )}
                                {!isReadOnly && !isPending && (
                                    <div className="absolute top-1 right-1 z-20 flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(side, idx)}
                                            aria-label={`Editar foto ${idx + 1}`}
                                            className="w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        {photos.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemove(side, idx)}
                                                aria-label={`Excluir foto ${idx + 1}`}
                                                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {canUseAsCover && !isPending && onUseAsCover && (
                                <button
                                    type="button"
                                    onClick={() => onUseAsCover(photo.url)}
                                    title="Usar como foto de capa do ativo"
                                    aria-label="Usar como foto de capa do ativo"
                                    className="w-full py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                                    Capa
                                </button>
                            )}
                        </div>
                    );
                }

                if (!isReadOnly) {
                    const isDragOver = dragOverIdx === idx;
                    const isRequired = photos.length === 0 && idx === 0;
                    return (
                        <button
                            type="button"
                            key={`empty-${idx}`}
                            onClick={() => onAdd(side)}
                            {...dropHandlers(idx)}
                            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group ${isDragOver
                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-[1.02]'
                                : isRequired
                                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:border-red-500'
                                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/50'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${isDragOver ? 'text-blue-500' : isRequired ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'}`}>
                                {isDragOver ? 'upload_file' : 'add_a_photo'}
                            </span>
                            <span className={`mt-1 text-[10px] font-bold uppercase ${isDragOver ? 'text-blue-600 dark:text-blue-400' : isRequired ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {isDragOver ? 'Solte aqui' : isRequired ? 'Obrigatório' : 'Adicionar'}
                            </span>
                        </button>
                    );
                }

                return (
                    <div key={`none-${idx}`} className="aspect-square rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-lg mb-1">image_not_supported</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 italic">Sem foto {idx + 1}</span>
                    </div>
                );
            })}
        </div>
    );
};

interface AssetReportConditionSectionProps extends Omit<ImageGridProps, 'side'> {
    id: string;
    side: ReportPhotoSide;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    className?: string;
}

export const AssetReportConditionSection: React.FC<AssetReportConditionSectionProps> = ({ id, side, value, onChange, onBlur, className, ...grid }) => {
    const isBefore = side === 'initial';
    const done = !!value.trim() && grid.photos.length > 0;
    const status: ReportSectionStatus | undefined = grid.isReadOnly ? undefined : done ? 'done' : undefined;

    return (
        <ReportSection
            id={id}
            className={className}
            icon={isBefore ? 'assignment' : 'assignment_turned_in'}
            title={isBefore ? 'Condição Antes' : 'Condição Depois'}
            required
            status={status}
            summary={`${grid.photos.length} foto(s)${value.trim() ? ` · ${value.trim().slice(0, 40)}` : ''}`}
        >
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                disabled={grid.isReadOnly}
                aria-label={isBefore ? 'Condição antes' : 'Condição depois'}
                placeholder={grid.isReadOnly ? 'Sem comentários' : isBefore ? 'Descreva como foi encontrado o ativo...' : 'Descreva a condição final (depois) do ativo...'}
                className={`${reportTextareaClass} min-h-[100px]`}
            />
            <AssetReportImageGrid side={side} {...grid} />
        </ReportSection>
    );
};
