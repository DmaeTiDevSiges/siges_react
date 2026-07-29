import React from 'react';
import { Asset } from '../../types';
import { Avatar } from '../ui/Avatar';
import { dataService } from '../../services/dataService';

interface AssetCardProps {
    asset: Asset;
    onClick?: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, isFavorite, onToggleFavorite }) => {

    const status = asset.statusCode || "USO";
    const date = asset.statusAt ? new Date(asset.statusAt).toLocaleDateString('pt-BR') : "";
    const unitDesc = asset.unitDescriptionFull || asset.location || "Não informada";
    const assetLocation = asset.location || "N/I";
    const system = [asset.tagName, asset.tagSubName]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(' > ') || "Sem Tag";

    return (
        <div
            onClick={onClick}
            className="group relative w-full bg-white dark:bg-slate-900 rounded-[12px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.98] cursor-pointer overflow-hidden p-4 border-l-4"
            style={{ borderLeftColor: asset.statusColor || '#149185' }}
        >

            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-stretch justify-between gap-3">
                    <div
                        className="text-white rounded-[12px] px-4 py-2 flex items-center shadow-sm"
                        style={{ backgroundColor: asset.statusColor || '#149185' }}
                    >
                        <div className="flex flex-col leading-tight">
                            <span className="text-[14px] font-bold tracking-tight uppercase">{asset.code}</span>
                            <div className="flex items-center gap-2.5 mt-[10px]">
                                <span className="text-[9px] font-black uppercase tracking-wider">{status}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">{date}</span>
                            </div>
                        </div>
                    </div>

                    <Avatar
                        src={asset.imgUrl || dataService.getPublicImageUrl(asset.imgFilePath, asset.imgFileName, { width: 400, height: 400, resize: 'cover' })}
                        alt={asset.description}
                        size="md"
                        className="border-2 border-slate-50 dark:border-slate-800"
                    />
                </div>

                <div className="space-y-1 text-left">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase">
                        {asset.description}
                    </h3>

                    <div className="space-y-[10px] pt-2">
                        <div className="flex flex-col gap-[2px]">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Unidade</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                {asset.clientName || "(CLIENTE NÃO INFORMADO)"}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                {unitDesc}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-[2px] flex-1">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Setor &gt; Posição</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">{system}</span>
                            </div>
                            <div className="flex flex-col gap-[2px] text-right min-w-[30%]">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Localização</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">{assetLocation}</span>
                            </div>
                        </div>

                        {asset.comments && (
                            <div className="flex flex-col gap-[2px]">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Comentários</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                    {asset.comments}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[22px] group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
