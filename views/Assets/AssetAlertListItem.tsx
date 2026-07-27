import React, { memo } from 'react';
import { AssetAlert } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '../../components/ui/Avatar';
import { IconButton } from '../../components/ui/IconButton';
import { dataService } from '../../services/dataService';

interface AssetAlertListItemProps {
    alert: AssetAlert;
    onClick?: () => void;
    onEdit?: (alert: AssetAlert) => void;
    onDelete?: (id: string) => void;
    onViewReport?: (ovaId: string) => void;
    hideAssetIdentification?: boolean;
    onSelectOrder?: (orderId: string) => void;
}

// Movida para fora do componente: não é recriada a cada render
const formatDate = (dateStr?: string, pattern: string = "dd/MM/yyyy HH:mm 'h'") => {
    if (!dateStr) return '';
    try {
        return format(new Date(dateStr), pattern, { locale: ptBR });
    } catch (e) {
        return '';
    }
};

export const AssetAlertListItem = memo<AssetAlertListItemProps>(({
    alert,
    onClick,
    onEdit,
    onDelete,
    onViewReport,
    hideAssetIdentification,
    onSelectOrder
}) => {

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(alert);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(alert.id);
    };

    const handleCardClick = () => {
        if (alert.isDone && alert.ovaId && onViewReport) {
            onViewReport(alert.ovaId);
        } else if (onClick) {
            onClick();
        }
    };

    // Obter cor de prioridade com segurança
    const priorityColor = alert.priorityColor || '#64748b';

    return (
        <div
            onClick={handleCardClick}
            className={`group relative bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl overflow-hidden p-5 flex flex-col transition-all duration-300 ${
                (onClick || (alert.isDone && alert.ovaId)) 
                    ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]' 
                    : ''
            } ${alert.isDone ? 'opacity-80' : ''}`}
        >
            {!hideAssetIdentification && (
                <>
                    {/* ========================================================================= */}
                    {/* PARTE SUPERIOR: INFORMAÇÕES DO ATIVO (ESTILO IMAGEM 01)                    */}
                    {/* ========================================================================= */}
                    <div className="flex items-stretch justify-between gap-3 mb-4">
                        {/* Status Badge estilo Ativo */}
                        <div
                            className="text-white rounded-[12px] px-4 py-2.5 flex items-center shadow-md shrink-0"
                            style={{ backgroundColor: alert.assetStatusColor || priorityColor }}
                        >
                            <div className="flex flex-col text-left justify-center">
                                <span className="text-[16px] font-bold tracking-tight leading-none mb-1">
                                    {alert.assetCode || 'N/A'}
                                </span>
                                <div className="flex items-center gap-1.5 leading-none text-[9.5px] font-bold opacity-95 tracking-wide">
                                    <span>{alert.assetStatusName || 'N/A'}</span>
                                    <span>{formatDate(alert.createdAt, "dd/MM/yyyy")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Avatar do Ativo */}
                        <Avatar
                            src={alert.imgFileName ? dataService.getPublicImageUrl(alert.imgFilePath, alert.imgFileName, { width: 100, height: 100, resize: 'cover' }) : dataService.getPublicImageUrl('', '', { width: 100, height: 100, resize: 'cover' })}
                            alt={alert.assetDescription || 'Ativo'}
                            size="sm"
                            className="border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                    </div>

                    {/* Descrição do Ativo */}
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase leading-snug tracking-wide text-left mb-4">
                        {alert.assetDescription || 'Sem descrição do ativo'}
                    </h3>

                    {/* Grade Técnica */}
                    <div className="grid grid-cols-2 gap-4 text-left mb-2">
                        {/* Unidade */}
                        <div className="flex flex-col gap-[2px]">
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Unidade</span>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                                {alert.clientName || '(Sem cliente)'}
                            </span>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                                {alert.unitDescription || '(Sem unidade)'}
                            </span>
                        </div>

                        {/* Setor e Posição */}
                        <div className="flex flex-col gap-[2px]">
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Setor - Posição</span>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">
                                {[alert.tagName, alert.tagSubName].filter(Boolean).join(' > ') || 'SEM TAG'}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* ========================================================================= */}
            {/* PARTE INFERIOR: DETALHES DO ALERTA (ESTILO IMAGEM 02)                     */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-3 text-left">
                {/* Badges e Status do Alerta */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            {/* Badge Prioridade */}
                            {alert.priorityName && (
                                <div 
                                    className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
                                    style={{ backgroundColor: priorityColor }}
                                >
                                    {alert.priorityName}
                                </div>
                            )}
                            {/* Badge Tipo de Ordem */}
                            {alert.orderTypeName && (
                                <div className="bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                    {alert.orderTypeName}
                                </div>
                            )}
                        </div>
                        {/* Badge OS Vinculada */}
                        {alert.orderId && onSelectOrder && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelectOrder(alert.orderId!); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 w-fit hover:bg-blue-600/20 dark:hover:bg-blue-600/30 transition-colors cursor-pointer"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">OS: {alert.orderMask}</span>
                            </button>
                        )}
                    </div>

                    {/* Status Aberto / Resolvido */}
                    <div className="flex items-center gap-2">
                        {alert.isDone ? (
                            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">Resolvido</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600/10 dark:bg-red-600/20 text-red-500 dark:text-red-400 border border-red-500/20">
                                <span className="material-symbols-outlined text-[12px] font-black">error_outline</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">Aberto</span>
                            </div>
                        )}

                        {/* Botões de Ação (Apenas para abertos) */}
                        {!alert.isDone && (onEdit || onDelete) && (
                            <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                                {onEdit && (
                                    <IconButton 
                                        icon="edit" 
                                        size="sm" 
                                        onClick={handleEditClick}
                                        className="text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all rounded-xl border-none"
                                    />
                                )}
                                {onDelete && (
                                    <IconButton 
                                        icon="delete" 
                                        size="sm" 
                                        onClick={handleDeleteClick}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-xl border-none"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Texto da Descrição do Alerta */}
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {alert.description || 'Sem descrição do alerta'}
                </p>

                {/* Calendário e Datas */}
                <div className="flex items-center justify-between w-full pt-1">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span className="text-[13px] font-bold uppercase tracking-wide">
                            {formatDate(alert.createdAt)}
                        </span>
                    </div>

                    {/* Data de Resolução */}
                    {alert.isDone && alert.resolvedAt && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <span className="material-symbols-outlined text-[13px] font-bold">check_circle</span>
                            <span className="text-[13px] font-bold uppercase tracking-wide">
                                {formatDate(alert.resolvedAt)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AssetAlertListItem.displayName = 'AssetAlertListItem';
