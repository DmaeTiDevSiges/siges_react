import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Unit, AssetTag, User } from '../../types';
import { IconButton } from '../../components/ui/IconButton';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { AvailabilityHistory } from '../../components/ui/AvailabilityHistory';
import { toast } from 'sonner';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Loading } from '../../components/ui/Loading';



interface UnitAssetTagAvailableDetailsProps {
    unitId: string;
    assetTagId: string;
    onBack: () => void;
    onNewEntry: () => void;
}

export const UnitAssetTagAvailableDetails: React.FC<UnitAssetTagAvailableDetailsProps> = ({ 
    unitId, 
    assetTagId, 
    onBack,
    onNewEntry 
}) => {
    const { canCreate } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [unit, setUnit] = useState<Unit | null>(null);
    const [assetTag, setAssetTag] = useState<any | null>(null);
    const [history7Days, setHistory7Days] = useState<{ date: string; isAvailable: boolean | null }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // ... same load logic but with offset
                if (historyLoading) return; // Prevent multiple simultaneous fetches if triggered by loadData
                
                // Fetch basic info only once or when IDs change
                // (Optimized: we could split history fetch from basic info fetch if needed)
                const [itemData, unitsData] = await Promise.all([
                    dataService.getUnitAssetTagItemById(assetTagId),
                    dataService.getUnits('all')
                ]);
                
                setAssetTag(itemData);
                const foundUnit = unitsData.find(u => u.id === unitId);
                setUnit(foundUnit || null);
                setLoading(false);
            } catch (error) {
                console.error('Error loading detail data:', error);
                setLoading(false);
            }
        };

        loadData();
    }, [unitId, assetTagId]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setHistoryLoading(true);
                const historyData = await dataService.getAssetAvailabilityHistory7Days(assetTagId, historyOffset);
                setHistory7Days(historyData);
                setHistoryLoading(false);
            } catch (error) {
                console.error('Error loading history:', error);
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [assetTagId, historyOffset]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loading size="md" />
                <p className="text-slate-500 font-medium">Carregando histórico...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
                {/* Identification Header - Precisely matched design */}
                <div className="mb-8 ml-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-[-2px]">
                        {(unit as any)?.client?.name || 'DMAE PLUVIAL'}
                    </span>
                    <h2 className="text-3xl font-black text-[#1E293B] dark:text-white uppercase tracking-tight leading-tight">
                        {(unit as any)?.name || unit?.description || 'EBAP 05'}
                    </h2>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {assetTag?.asset_tag_tag_sub_description || 'SETOR'} / {assetTag?.asset_tag_item_description || 'POSIÇÃO'}
                    </span>
                </div>

                {/* Status Overview Card - Style matched from image */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 mb-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Top Row: Icon + Unit/Sector/Pos + Company Logo */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 ${assetTag?.last_is_available ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                                <span className="material-symbols-outlined text-4xl [font-variation-settings:'FILL'_1]">
                                    {assetTag?.last_is_available ? 'thumb_up' : 'thumb_down'}
                                </span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                                    {unit?.description || 'UNIDADE'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">
                                    {assetTag?.asset_tag_tag_sub_description || 'SETOR'}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                                    {assetTag?.asset_tag_item_description || 'POSIÇÃO'}
                                </span>
                            </div>
                        </div>

                        {/* Reporter Company Avatar & Evidence Photo */}
                        <div className="flex gap-3 items-start animate-in fade-in zoom-in duration-700 delay-200">
                            {assetTag?.last_reported_image && (
                                <div 
                                    className="h-14 w-14 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setLightboxImage(assetTag.last_reported_image)}
                                >
                                    <OptimizedImage 
                                        src={assetTag.last_reported_image} 
                                        alt="Evidência" 
                                        className="w-full h-full object-cover"
                                        preset="medium"
                                    />
                                </div>
                            )}
                            {assetTag?.last_reported_by_company_logo && (
                                <img 
                                    src={assetTag.last_reported_by_company_logo} 
                                    alt="Empresa" 
                                    className="h-14 w-14 rounded-2xl object-contain bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800/80 shadow-sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Info Rows */}
                    <div className="space-y-3 pb-6 border-b border-slate-50 dark:border-slate-800/50">
                        {!assetTag?.last_is_available && (
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivo</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                    {assetTag?.last_asset_unavailable_reason_description || 'NÃO INFORMADO'}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Operação</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                                {assetTag?.last_is_available ? '1' : '0'}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Row: Reporter Info and Action */}
                    <div className="flex justify-between items-end mt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[16px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800/50 shadow-inner group">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">person</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                                    {assetTag?.last_reported_by_name || 'Desconhecido'}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">
                                    {new Date(assetTag?.last_reported_at || Date.now()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} h
                                </span>
                            </div>
                        </div>
                        
                        {/* Summary Action Button */}
                        <div className="w-12 h-12 rounded-[16px] bg-[#00B4B4] text-white flex items-center justify-center shadow-lg shadow-[#00B4B4]/30 hover:shadow-[#00B4B4]/40 active:scale-90 transition-all cursor-pointer group">
                            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">description</span>
                        </div>
                    </div>

                    <AvailabilityHistory 
                        history={history7Days} 
                        loading={historyLoading} 
                        offsetDays={historyOffset}
                        onOffsetChange={(dir) => {
                            setHistoryOffset(prev => dir === 'prev' ? prev + 7 : Math.max(0, prev - 7));
                        }}
                    />
                </div>

                {/* Floating Action Button */}
                {canCreate('assets_available') && (
                    <button 
                        onClick={onNewEntry}
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-90 transition-all z-20 hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </button>
                )}
            </div>

            {lightboxImage && (
                <PhotoViewer
                    src={lightboxImage}
                    onClose={() => setLightboxImage(null)}
                    alt="Evidência Fotográfica"
                />
            )}
        </div>
    );
};
