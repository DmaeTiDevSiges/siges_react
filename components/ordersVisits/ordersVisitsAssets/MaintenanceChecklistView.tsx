import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { dataService } from '../../../services/dataService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, OrderVisitAssetActivity } from '../../../types';
import { Select } from '../../ui/Select';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../ui/OptimizedImage';
import { PhotoViewer } from '../../ui/PhotoViewer';
import { Input } from '../../ui/Input';
import { ImageUploadSheet } from '../../ui/ImageUploadSheet';
import { ImageEditorModal } from '../../ui/ImageEditorModal';
import { Loading } from '../../ui/Loading';


interface MaintenanceChecklistViewProps {
    ovAssetId: string;
    assetId?: string; // cfg_assets.id
    assetTypeId?: string;
    companyId?: string;
    userId: string;
    initialPlanId?: string;
    onUpdateProgress?: (progress: number) => void;
    disabled?: boolean;
}

// ── Componente de Item do Checklist ──
// Definido fora do componente principal para manter uma identidade estável
// e evitar que o campo de observações perca o foco ao digitar.
interface ActivityItemProps {
    activity: MaintenancePlanSectionActivity;
    response: OrderVisitAssetActivity | undefined;
    historyItem: OrderVisitAssetActivity | undefined;
    isDisabled: boolean;
    handleViewImages: (urls: string[], index: number) => void;
    handleAnswerItem: (activityId: string, status: 'OK' | 'NOK' | 'NA' | null) => Promise<void>;
    handleResetItem: (activityId: string) => Promise<void>;
    handleLocalCommentChange: (activityId: string, comment: string) => void;
    handleSaveComment: (activityId: string, comment: string) => Promise<void>;
    handleRemovePhoto: (activityId: string, fileName: string) => Promise<void>;
    getFullImageUrl: (activityId: string, fileName: string) => string;
    setUploadSheetOpenId: (id: string | null) => void;
    uploadingItem: string | null;
    companyId?: string;
    assetId?: string;
    ovAssetId: string;
}

const ActivityItem = React.memo(({
    activity,
    response,
    historyItem,
    isDisabled,
    handleViewImages,
    handleAnswerItem,
    handleResetItem,
    handleLocalCommentChange,
    handleSaveComment,
    handleRemovePhoto,
    getFullImageUrl,
    setUploadSheetOpenId,
    uploadingItem,
    companyId,
    assetId,
    ovAssetId
}: ActivityItemProps) => {
    const [isViewingHistory, setIsViewingHistory] = useState(false);
    const status = response?.status;
    const deletingPhotosLocal = React.useRef<Set<string>>(new Set());

    const toggleHistory = useCallback(() => setIsViewingHistory(v => !v), []);

    const imgFilesNames: string[] = response?.imgFilesNames || [];

    return (
        <div className={`group relative bg-white dark:bg-slate-900/50 rounded-2xl border overflow-hidden transition-all ${isDisabled
            ? 'border-slate-100 dark:border-slate-800/50 opacity-80'
            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
            }`}>
            <div className={`flex transition-transform duration-300 ease-in-out w-[200%] ${isViewingHistory ? 'translate-x-0' : '-translate-x-1/2'}`}>

                {/* PANE ESQUERDO (HISTÓRICO) */}
                <div className="w-1/2 shrink-0 p-4 bg-amber-50/30 dark:bg-amber-500/5 flex flex-col relative">
                    {historyItem ? (
                        <>
                            <div className="flex justify-between items-start gap-4 flex-1">
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight mb-2 mt-1">{activity.activityDescription}</div>
                                    {activity.description && activity.description !== activity.activityDescription && (
                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal italic mb-2">{activity.description}</div>
                                    )}
                                    <div className="inline-flex items-center bg-amber-100/30 dark:bg-amber-900/10 p-1 rounded-xl border border-amber-200/50 dark:border-amber-800/30 mb-2 pointer-events-none">
                                        <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 ${historyItem.status === 'OK' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20' : 'text-amber-600/40 dark:text-amber-500/30'}`}><span className="material-symbols-outlined text-xl">thumb_up</span></div>
                                        <div className="w-px h-8 bg-amber-200/50 dark:bg-amber-800/30 mx-1" />
                                        <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 ${historyItem.status === 'NOK' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] ring-2 ring-red-500/20' : 'text-amber-600/40 dark:text-amber-500/30'}`}><span className="material-symbols-outlined text-xl">thumb_down</span></div>
                                        <div className="w-px h-8 bg-amber-200/50 dark:bg-amber-800/30 mx-1" />
                                        <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 ${historyItem.status === 'NA' ? 'bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.4)] ring-2 ring-slate-500/20' : 'text-amber-600/40 dark:text-amber-500/30'}`}><span className="material-symbols-outlined text-xl font-bold">remove</span></div>
                                    </div>
                                    {historyItem.comments && (<p className="text-xs text-amber-800 dark:text-amber-200/80 mb-2 italic">{historyItem.comments}</p>)}
                                    {historyItem.imgFilesNames && historyItem.imgFilesNames.length > 0 && (
                                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                            {historyItem.imgFilesNames.map((img: string, i: number) => {
                                                const path = historyItem.imgFilePath || (companyId && assetId ? `companies/${companyId}/assets/${assetId}` : `checklist/${historyItem.orderVisitAssetId}/${historyItem.activityId}`);
                                                const url = dataService.getPublicImageUrl(path, img) || '';
                                                return (
                                                    <div key={i} className="w-[70px] h-[70px] shrink-0 rounded-[10px] border border-amber-200 dark:border-amber-700/50 overflow-hidden cursor-pointer active:scale-95 transition-all" onClick={() => {
                                                        const urls = historyItem.imgFilesNames?.map((img: string) => {
                                                            const path = historyItem.imgFilePath || (companyId && assetId ? `companies/${companyId}/assets/${assetId}` : `checklist/${historyItem.orderVisitAssetId}/${historyItem.activityId}`);
                                                            return dataService.getPublicImageUrl(path, img) || '';
                                                        }) || [];
                                                        handleViewImages(urls, i);
                                                    }}>
                                                        <OptimizedImage src={url} alt={`Foto histórico ${i + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">Sem histórico disponível</div>
                    )}
                </div>

                {/* PANE DIREITO (ATUAL) */}
                <div className="w-1/2 shrink-0 p-4 flex flex-col relative">
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight mb-1">{activity.activityDescription}</div>
                                {activity.description && activity.description !== activity.activityDescription && (
                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal italic">{activity.description}</div>
                                )}
                            </div>
                            {!isDisabled && response && response.status !== null && response.status !== undefined && (
                                <button onClick={() => handleResetItem(activity.activityId)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all shrink-0" title="Limpar atividade">
                                    <span className="material-symbols-outlined text-lg">delete_outline</span>
                                </button>
                            )}
                        </div>

                        {/* Thumbs */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <button disabled={isDisabled} onClick={() => handleAnswerItem(activity.activityId, 'OK')} className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-emerald-500/30 active:brightness-125 ${status === 'OK' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20' : 'text-slate-400 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400'}`}><span className="material-symbols-outlined text-xl">thumb_up</span></button>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
                                <button disabled={isDisabled} onClick={() => handleAnswerItem(activity.activityId, 'NOK')} className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-red-500/30 active:brightness-125 ${status === 'NOK' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] ring-2 ring-red-500/20' : 'text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400'}`}><span className="material-symbols-outlined text-xl">thumb_down</span></button>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
                                <button disabled={isDisabled} onClick={() => handleAnswerItem(activity.activityId, 'NA')} className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-slate-500/30 active:brightness-125 ${status === 'NA' ? 'bg-slate-500 dark:bg-slate-400 text-white shadow-[0_0_15px_rgba(100,116,139,0.4)] ring-2 ring-slate-500/20' : 'text-slate-400 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300'}`} title="Não se aplica"><span className="material-symbols-outlined text-xl">remove</span></button>
                            </div>
                        </div>

                        {/* Comentário */}
                        {(!isDisabled || response?.comments) && (
                            <div className="relative group/input">
                                <Input disabled={isDisabled || status === null || status === undefined} placeholder="Adicionar observação..." value={response?.comments || ''} onChange={(e) => handleLocalCommentChange(activity.activityId, e.target.value)} onBlur={(e) => handleSaveComment(activity.activityId, e.target.value)} className="h-10! text-xs bg-transparent! pr-8" />
                                {!isDisabled && response?.comments && status !== null && status !== undefined && (
                                    <button onClick={() => { handleLocalCommentChange(activity.activityId, ''); handleSaveComment(activity.activityId, ''); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover/input:opacity-100" title="Limpar observação"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fotos */}
                    <div className="mt-3 w-full flex items-center gap-3 overflow-x-auto pt-2 pr-2 pb-2">
                        {imgFilesNames.map((img, idx) => (
                            <div key={idx} className={`relative group/photo cursor-pointer transition-all duration-300 transform shrink-0 ${deletingPhotosLocal.current.has(`${activity.activityId}-${img}`) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                                <div className="w-[70px] h-[70px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 active:scale-95 transition-all" onClick={() => {
                                    const urls = imgFilesNames.map(f => getFullImageUrl(activity.activityId, f));
                                    handleViewImages(urls, idx);
                                }}>
                                    <OptimizedImage src={getFullImageUrl(activity.activityId, img)} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                                {!isDisabled && (
                                    <button onClick={(e) => { e.stopPropagation(); handleRemovePhoto(activity.activityId, img); }} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white dark:border-slate-900 active:scale-95">
                                        <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                    </button>
                                )}
                            </div>
                        ))}
                        {!isDisabled && (status !== null && status !== undefined) && imgFilesNames.length < 3 && (
                            <button onClick={() => setUploadSheetOpenId(activity.activityId)} disabled={uploadingItem === activity.activityId} className="w-[70px] h-[70px] rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all active:scale-95 shrink-0">
                                {uploadingItem === activity.activityId ? (<Loading size="xs" />) : (<span className="material-symbols-outlined text-2xl">add_a_photo</span>)}
                            </button>
                        )}
                    </div>
                    {/* fecha pane direito */}
                </div>
                {/* fecha slider */}
            </div>

            {/* FOOTER */}
            {historyItem && (
                <div className={`flex items-center justify-between px-4 py-3 border-t transition-colors ${isViewingHistory ? 'border-amber-100 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-500/5' : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30'}`}>
                    {isViewingHistory ? (
                        <>
                            <button onClick={toggleHistory} className="group flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors" title="Voltar para visita atual">
                                <div className="w-6 h-6 flex items-center justify-center bg-indigo-50 group-hover:bg-indigo-100 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 rounded-full transition-all border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm"><span className="material-symbols-outlined text-[14px]">chevron_right</span></div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 whitespace-nowrap">Visita atual</span>
                            </button>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="material-symbols-outlined text-[14px] text-amber-600 dark:text-amber-400">history</span>
                                <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-tight">
                                    {historyItem.createdAt ? formatDistanceToNow(new Date(historyItem.createdAt), { addSuffix: true, locale: ptBR }) : 'Última Visita'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <button onClick={toggleHistory} className="group flex items-center gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors" title="Ver visita anterior">
                            <div className="w-6 h-6 flex items-center justify-center bg-amber-50 group-hover:bg-amber-100 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20 rounded-full transition-all border border-amber-200/50 dark:border-amber-500/30 shadow-sm"><span className="material-symbols-outlined text-[14px]">chevron_left</span></div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Última visita</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

export const MaintenanceChecklistView: React.FC<MaintenanceChecklistViewProps> = ({
    ovAssetId,
    assetId,
    assetTypeId,
    companyId,
    userId,
    initialPlanId,
    onUpdateProgress,
    disabled = false
}) => {
    const [plans, setPlans] = useState<MaintenancePlan[]>([]);
    const [sections, setSections] = useState<MaintenancePlanSection[]>([]);
    const [activities, setActivities] = useState<MaintenancePlanSectionActivity[]>([]);
    const [checklistResponses, setChecklistResponses] = useState<Record<string, OrderVisitAssetActivity>>({});
    const [historyResponsesState, setHistoryResponsesState] = useState<Record<string, OrderVisitAssetActivity>>({});
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loadingChecklist, setLoadingChecklist] = useState(false);
    const [uploadingItem, setUploadingItem] = useState<string | null>(null);
    const [expandedImages, setExpandedImages] = useState<string[] | null>(null);
    const [expandedInitialIndex, setExpandedInitialIndex] = useState(0);
    const [deletingPhotos, setDeletingPhotos] = useState<Set<string>>(new Set());
    const [uploadSheetOpenId, setUploadSheetOpenId] = useState<string | null>(null);
    const [editingPhoto, setEditingPhoto] = useState<{ activityId: string, fileName: string, src: string } | null>(null);
    const [viewingHistory, setViewingHistory] = useState<Set<string>>(new Set());

    const toggleHistoryView = useCallback((activityId: string) => {
        setViewingHistory(prev => {
            const next = new Set(prev);
            if (next.has(activityId)) next.delete(activityId);
            else next.add(activityId);
            return next;
        });
    }, []);

    const lastSyncedProgress = useRef<number>(-1);

    const answeredCount = activities.filter(a => {
        const r = checklistResponses[a.activityId];
        return r && r.status !== null && r.status !== undefined;
    }).length;

    const progressPercent = activities.length > 0 ? Math.round((answeredCount / activities.length) * 100) : 0;

    useEffect(() => {
        if (selectedPlanId && activities.length > 0 && progressPercent !== lastSyncedProgress.current) {
            dataService.updateOrderVisitAssetProgress(ovAssetId, progressPercent).catch(err => {
                console.error('Non-blocking error updating OVA progress:', err);
            });
            lastSyncedProgress.current = progressPercent;
            if (onUpdateProgress) onUpdateProgress(progressPercent);
        }
    }, [progressPercent, selectedPlanId, ovAssetId, activities.length, onUpdateProgress]);

    useEffect(() => {
        loadPlans();
    }, [assetTypeId]);

    const loadPlans = async () => {
        setLoadingPlans(true);
        try {
            const [availablePlans, existingItems] = await Promise.all([
                dataService.getMaintenancePlans(assetTypeId),
                dataService.getMaintenanceChecklistItemsByVisit(ovAssetId)
            ]);
            setPlans(availablePlans);

            if (initialPlanId && initialPlanId !== '0') {
                handlePlanSelect(initialPlanId);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Erro ao buscar planos de manutenção');
        } finally {
            setLoadingPlans(false);
        }
    };

    const handlePlanSelect = async (planId: string) => {
        setSelectedPlanId(planId);

        // Update the maintenance_plan_id on the OrderVisitAsset record
        dataService.updateOrderVisitAssetPlan(ovAssetId, planId).catch(err => {
            console.error('Non-blocking error updating OVA plan ID:', err);
        });

        if (!planId) {
            setSections([]);
            setActivities([]);
            setChecklistResponses({});
            return;
        }

        setLoadingChecklist(true);
        console.log('Loading checklist for planId:', planId, 'ovAssetId:', ovAssetId, 'assetId:', assetId);

        try {
            const [planSections, currentResponses, historyResponses] = await Promise.all([
                dataService.getMaintenancePlanSections(planId),
                dataService.getMaintenanceChecklistItems(ovAssetId, planId),
                assetId ? dataService.getGlobalMaintenanceChecklistItems(assetId, planId, ovAssetId) : Promise.resolve([])
            ]);

            console.log('Fetched sections:', planSections.length);
            setSections(planSections);

            if (planSections.length > 0) {
                // Fetch activities for all sections
                const activitiesPromises = planSections.map(section =>
                    dataService.getMaintenancePlanSectionActivities(section.id)
                );
                const activitiesArrays = await Promise.all(activitiesPromises);
                const allActivities = activitiesArrays.flat();
                setActivities(allActivities);

                const responsesMap: Record<string, OrderVisitAssetActivity> = {};
                const historyMap: Record<string, OrderVisitAssetActivity> = {};

                historyResponses.forEach(item => {
                    if (item.orderVisitAssetId !== ovAssetId && item.status !== null && item.status !== undefined) {
                        historyMap[item.activityId] = item;
                    }
                });

                currentResponses.forEach(item => {
                    responsesMap[item.activityId] = item;
                });

                // 3. Set default comments if empty in current/history
                allActivities.forEach(activity => {
                    const response = responsesMap[activity.activityId];
                    if (activity.commentsDefault && (!response || !response.comments)) {
                        responsesMap[activity.activityId] = {
                            ...(response || {
                                activityId: activity.activityId,
                                orderVisitAssetId: ovAssetId,
                                maintenancePlanId: selectedPlanId
                            }),
                            comments: activity.commentsDefault
                        } as any;
                    }
                });

                setHistoryResponsesState(historyMap);
                setChecklistResponses(responsesMap);
            } else {
                setActivities([]);
                setChecklistResponses({});
                setHistoryResponsesState({});
            }
        } catch (error) {
            console.error('Error loading checklist details:', error);
            toast.error('Erro ao carregar o conteúdo do checklist');
        } finally {
            setLoadingChecklist(false);
        }
    };

    const handleAnswerItem = useCallback(async (activityId: string, status: 'OK' | 'NOK' | 'NA' | null) => {
        // Optimistic Update: Update state immediately for instant feedback
        const previousResponses = { ...checklistResponses };
        setChecklistResponses(prev => ({
            ...prev,
            [activityId]: {
                ...(prev[activityId] || {}),
                status
            } as any
        }));

        try {
            const response = await dataService.upsertMaintenanceChecklistItem(
                ovAssetId,
                selectedPlanId,
                activityId,
                userId,
                { status }
            );
            if (response) {
                setChecklistResponses(prev => ({
                    ...prev,
                    [activityId]: response
                }));
            }
        } catch (error) {
            console.error('Error answering item:', error);
            // Revert on error
            setChecklistResponses(previousResponses);
            toast.error('Erro ao salvar resposta');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ovAssetId, selectedPlanId, userId]);

    const handleResetItem = useCallback(async (activityId: string) => {
        try {
            await dataService.deleteMaintenanceChecklistItem(ovAssetId, selectedPlanId, activityId);
            setChecklistResponses(prev => {
                const updated = { ...prev };
                delete updated[activityId];
                return updated;
            });
            toast.success('Atividade redefinida');
        } catch (error) {
            console.error('Error resetting item:', error);
            toast.error('Erro ao redefinir atividade');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ovAssetId, selectedPlanId, userId]);

    const handleLocalCommentChange = useCallback((activityId: string, comment: string) => {
        setChecklistResponses(prev => ({
            ...prev,
            [activityId]: {
                ...(prev[activityId] || {
                    activityId,
                    orderVisitAssetId: ovAssetId,
                    maintenancePlanId: selectedPlanId
                }),
                comments: comment
            } as any
        }));
    }, [ovAssetId, selectedPlanId]);

    const handleSaveComment = useCallback(async (activityId: string, comment: string) => {
        try {
            const response = await dataService.upsertMaintenanceChecklistItem(ovAssetId, selectedPlanId, activityId, userId, { comments: comment });
            if (response) {
                setChecklistResponses(prev => ({ ...prev, [activityId]: response }));
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            toast.error('Erro ao salvar comentário');
        }
    }, [ovAssetId, selectedPlanId, userId]);

    const handleTakePhoto = async (activityId: string, source: CameraSource) => {
        const response = checklistResponses[activityId];
        const existingPhotos = response?.imgFilesNames || [];

        if (existingPhotos.length >= 3) {
            toast.error('Limite máximo de 3 fotos atingido');
            return;
        }

        setUploadingItem(activityId);
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: source
            });

            if (image.base64String) {
                const fileExt = 'jpeg';
                const base64Data = `data:image/jpeg;base64,${image.base64String}`;

                // Convert base64 to File object
                const res = await fetch(base64Data);
                const blob = await res.blob();
                const file = new File([blob], `photo.jpg`, { type: 'image/jpeg' });

                const uploadResult = await dataService.uploadChecklistImage(ovAssetId, activityId, file, companyId, assetId);

                if (uploadResult) {
                    const updatedPhotos = [...existingPhotos, uploadResult.filename];
                    const updatedResponse = await dataService.upsertMaintenanceChecklistItem(
                        ovAssetId,
                        selectedPlanId,
                        activityId,
                        userId,
                        {
                            imgFilesNames: updatedPhotos,
                            imgFilePath: uploadResult.path
                        }
                    );

                    if (updatedResponse) {
                        setChecklistResponses(prev => ({
                            ...prev,
                            [activityId]: updatedResponse
                        }));
                        toast.success('Foto adicionada');
                    }
                }
            }
        } catch (error) {
            console.error('Error adding photo:', error);
            if (error instanceof Error && !error.message.includes('User cancelled')) {
                toast.error('Erro ao fazer upload da foto');
            }
        } finally {
            setUploadingItem(null);
        }
    };

    const handleRemovePhoto = useCallback(async (activityId: string, fileName: string) => {
        const key = `${activityId}-${fileName}`;
        setDeletingPhotos(prev => new Set(prev).add(key));

        // Wait for exit animation
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const updatedResponse = await dataService.removeChecklistImage(
                ovAssetId,
                selectedPlanId,
                activityId,
                fileName,
                userId
            );

            if (updatedResponse) {
                setChecklistResponses(prev => ({
                    ...prev,
                    [activityId]: updatedResponse
                }));
                toast.success('Foto removida');
            }
        } catch (error) {
            console.error('Error removing photo:', error);
            toast.error('Erro ao excluir foto');
        } finally {
            setDeletingPhotos(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ovAssetId, selectedPlanId, userId]);

    const getFullImageUrl = useCallback((activityId: string, fileName: string): string => {
        const response = checklistResponses[activityId];
        const resOvAssetId = response?.orderVisitAssetId || ovAssetId;
        const path = response?.imgFilePath || (companyId && assetId ? `companies/${companyId}/assets/${assetId}` : `checklist/${resOvAssetId}/${activityId}`);
        return dataService.getPublicImageUrl(path, fileName) || '';
    }, [checklistResponses, ovAssetId, companyId, assetId]);

    const isPlanLocked = initialPlanId != null && initialPlanId !== '' && initialPlanId !== '0' && Number(initialPlanId) !== 0;

    const handleViewImages = useCallback((urls: string[], index: number = 0) => {
        setExpandedInitialIndex(index);
        setExpandedImages(urls);
    }, []);

    const handleEditPhoto = useCallback((activityId: string, fileName: string) => {
        const src = getFullImageUrl(activityId, fileName);
        setEditingPhoto({ activityId, fileName, src });
    }, [getFullImageUrl]);

    const handleSaveEditedPhoto = async (editedFile: File) => {
        if (!editingPhoto) return;
        const { activityId, fileName } = editingPhoto;

        try {
            const uploadPromise = async () => {
                // 1. Upload new version
                const uploadResult = await dataService.uploadChecklistImage(ovAssetId, activityId, editedFile, companyId, assetId);

                // 2. Remove old version from checklist data
                const response = checklistResponses[activityId];
                if (response && response.imgFilesNames) {
                    const updatedPhotos = response.imgFilesNames.map((f: string) => f === fileName ? uploadResult.filename : f);

                    const updatedResponse = await dataService.upsertMaintenanceChecklistItem(
                        ovAssetId,
                        selectedPlanId,
                        activityId,
                        userId,
                        {
                            imgFilesNames: updatedPhotos,
                            imgFilePath: uploadResult.path
                        }
                    );

                    if (updatedResponse) {
                        setChecklistResponses(prev => ({
                            ...prev,
                            [activityId]: updatedResponse
                        }));
                    }
                }
                setEditingPhoto(null);
            };

            toast.promise(uploadPromise(), {
                loading: 'Salvando edições...',
                success: 'Foto editada com sucesso!',
                error: 'Erro ao salvar edições'
            });
        } catch (error) {
            console.error('Error saving edited photo:', error);
        }
    };


    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <span className="material-symbols-outlined text-2xl">fact_check</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            Verificação de itens
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atividades de campo</p>
                    </div>
                </div>

                {selectedPlanId && activities.length > 0 && (
                    <div className="relative flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                                className="text-slate-100 dark:text-slate-800"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="transparent"
                                r="18"
                                cx="24"
                                cy="24"
                            />
                            <circle
                                className={`${progressPercent === 100 ? 'text-emerald-500' : 'text-indigo-500'} transition-all duration-500`}
                                strokeWidth="3"
                                strokeDasharray={113.1}
                                strokeDashoffset={113.1 - (progressPercent / 100) * 113.1}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="18"
                                cx="24"
                                cy="24"
                            />
                        </svg>
                        <span className="absolute text-[9px] font-black text-slate-600 dark:text-slate-300">
                            {progressPercent}%
                        </span>
                    </div>
                )}
            </div>

            {loadingPlans ? (
                <div className="animate-pulse h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
            ) : (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Plano de Manutenção
                        </label>
                    </div>
                    <Select
                        disabled={disabled || loadingChecklist || isPlanLocked}
                        value={selectedPlanId || (isPlanLocked ? String(initialPlanId) : '')}
                        onChange={(e: any) => handlePlanSelect(e.target.value)}
                        options={isPlanLocked
                            ? [{
                                value: String(initialPlanId),
                                label: plans.find(p => String(p.id) === String(initialPlanId))?.description || 'Plano atual selecionado'
                            }]
                            : [
                                { value: '', label: 'Selecione um plano...' },
                                ...plans.map(p => ({ value: String(p.id), label: p.description }))
                            ]
                        }
                    />
                </div>
            )}

            {loadingChecklist ? (
                <div className="space-y-4">
                    <div className="animate-pulse h-8 bg-slate-100 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-700 rounded w-full"></div>
                    <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-700 rounded w-full"></div>
                </div>
            ) : (
                selectedPlanId && sections.length > 0 && (
                    <div className="space-y-6">
                        {sections.map(section => {
                            const sectionActivities = activities.filter(a => a.maintenancePlanSectionId === section.id);
                            if (sectionActivities.length === 0) return null;

                            const sectionAnsweredCount = sectionActivities.filter(a => {
                                const r = checklistResponses[a.activityId];
                                return r && r.status !== null && r.status !== undefined;
                            }).length;
                            const sectionProgressPercent = sectionActivities.length > 0 ? Math.round((sectionAnsweredCount / sectionActivities.length) * 100) : 0;

                            return (
                                <div key={section.id} className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            <h4 className="text-[10px] font-black text-slate-500 dark:text-blue-400 uppercase tracking-widest leading-none">
                                                {section.description}
                                            </h4>
                                        </div>
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-10 h-10 transform -rotate-90">
                                                <circle
                                                    className="text-slate-100 dark:text-slate-800"
                                                    strokeWidth="2.5"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="16"
                                                    cx="20"
                                                    cy="20"
                                                />
                                                <circle
                                                    className={`${sectionProgressPercent === 100 ? 'text-emerald-500' : 'text-indigo-500'} transition-all duration-500`}
                                                    strokeWidth="2.5"
                                                    strokeDasharray={100.5}
                                                    strokeDashoffset={100.5 - (sectionProgressPercent / 100) * 100.5}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="16"
                                                    cx="20"
                                                    cy="20"
                                                />
                                            </svg>
                                            <span className="absolute text-[8px] font-black text-slate-600 dark:text-slate-300">
                                                {sectionProgressPercent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {sectionActivities.map(activity => (
                                            <ActivityItem
                                                key={activity.activityId}
                                                activity={activity}
                                                response={checklistResponses[activity.activityId]}
                                                historyItem={historyResponsesState[activity.activityId]}
                                                isDisabled={disabled}
                                                handleViewImages={handleViewImages}
                                                handleAnswerItem={handleAnswerItem}
                                                handleResetItem={handleResetItem}
                                                handleLocalCommentChange={handleLocalCommentChange}
                                                handleSaveComment={handleSaveComment}
                                                handleRemovePhoto={handleRemovePhoto}
                                                getFullImageUrl={getFullImageUrl}
                                                setUploadSheetOpenId={setUploadSheetOpenId}
                                                uploadingItem={uploadingItem}
                                                companyId={companyId}
                                                assetId={assetId}
                                                ovAssetId={ovAssetId}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {selectedPlanId && sections.length === 0 && !loadingChecklist && (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">error</span>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4">
                        Nenhuma seção configurada para este plano.
                    </p>
                </div>
            )}

            {expandedImages && (
                <PhotoViewer
                    images={expandedImages}
                    initialIndex={expandedInitialIndex}
                    onClose={() => setExpandedImages(null)}
                />
            )}

            <ImageUploadSheet
                isOpen={!!uploadSheetOpenId}
                onClose={() => setUploadSheetOpenId(null)}
                onSelectGallery={() => {
                    if (uploadSheetOpenId) handleTakePhoto(uploadSheetOpenId, CameraSource.Photos);
                }}
                onTakeCamera={() => {
                    if (uploadSheetOpenId) handleTakePhoto(uploadSheetOpenId, CameraSource.Camera);
                }}
            />

            {editingPhoto && (
                <ImageEditorModal
                    isOpen={!!editingPhoto}
                    imageFile={editingPhoto.src}
                    onClose={() => setEditingPhoto(null)}
                    onSave={handleSaveEditedPhoto}
                />
            )}
        </div>
    );
};
