import React, { useEffect, useState, useRef } from 'react';
import { dataService } from '../../../services/dataService';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, OrderVisitAssetActivity } from '../../../types';
import { Select } from '../../ui/Select';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../ui/OptimizedImage';
import { PhotoViewer } from '../../ui/PhotoViewer';
import { Input } from '../../ui/Input';
import { ImageUploadSheet } from '../../ui/ImageUploadSheet';
import { ImageEditorModal } from '../../ui/ImageEditorModal';

interface MaintenanceChecklistViewProps {
    ovAssetId: string;
    assetId?: string; // cfg_assets.id
    assetTypeId?: string;
    companyId?: string;
    userId: string;
    initialPlanId?: string;
    onUpdateProcessing?: (processingId: number) => void;
    disabled?: boolean;
}

export const MaintenanceChecklistView: React.FC<MaintenanceChecklistViewProps> = ({ 
    ovAssetId, 
    assetId, 
    assetTypeId, 
    companyId, 
    userId, 
    initialPlanId,
    onUpdateProcessing,
    disabled = false
}) => {
    const [plans, setPlans] = useState<MaintenancePlan[]>([]);
    const [sections, setSections] = useState<MaintenancePlanSection[]>([]);
    const [activities, setActivities] = useState<MaintenancePlanSectionActivity[]>([]);
    const [checklistResponses, setChecklistResponses] = useState<Record<string, OrderVisitAssetActivity>>({});
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loadingChecklist, setLoadingChecklist] = useState(false);
    const [uploadingItem, setUploadingItem] = useState<string | null>(null);
    const [expandedImages, setExpandedImages] = useState<string[] | null>(null);
    const [deletingPhotos, setDeletingPhotos] = useState<Set<string>>(new Set());
    const [uploadSheetOpenId, setUploadSheetOpenId] = useState<string | null>(null);
    const [editingPhoto, setEditingPhoto] = useState<{ activityId: string, fileName: string, src: string } | null>(null);
    
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
        }
    }, [progressPercent, selectedPlanId, ovAssetId, activities.length]);

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
                
                // 1. Fill with history first
                historyResponses.forEach(item => {
                    if (!responsesMap[item.activityId]) {
                        responsesMap[item.activityId] = item;
                    }
                });

                // 2. Overwrite with current visit responses (these are the priority)
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

                setChecklistResponses(responsesMap);
            } else {
                setActivities([]);
                setChecklistResponses({});
            }
        } catch (error) {
            console.error('Error loading checklist details:', error);
            toast.error('Erro ao carregar o conteúdo do checklist');
        } finally {
            setLoadingChecklist(false);
        }
    };

    const handleAnswerItem = async (activityId: string, status: 'OK' | 'NOK' | 'NA' | null) => {
        // Optimistic Update: Update state immediately for instant feedback
        const previousResponses = { ...checklistResponses };
        setChecklistResponses(prev => ({
            ...prev,
            [activityId]: {
                ...(prev[activityId] || {}),
                status
            }
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
                // Check if we need to update progress/status
                if (onUpdateProcessing) {
                    onUpdateProcessing(2);
                }
            }
        } catch (error) {
            console.error('Error answering item:', error);
            // Revert on error
            setChecklistResponses(previousResponses);
            toast.error('Erro ao salvar resposta');
        }
    };

    const handleResetItem = async (activityId: string) => {
        try {
            await dataService.deleteMaintenanceChecklistItem(ovAssetId, selectedPlanId, activityId);
            setChecklistResponses(prev => {
                const updated = { ...prev };
                delete updated[activityId];
                return updated;
            });
            if (onUpdateProcessing) {
                onUpdateProcessing(2); // Set to "Reportado" or "Em Processamento"
            }
            toast.success('Atividade redefinida');
        } catch (error) {
            console.error('Error resetting item:', error);
            toast.error('Erro ao redefinir atividade');
        }
    };

    const handleLocalCommentChange = (activityId: string, comment: string) => {
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
    };

    const handleSaveComment = async (activityId: string, comment: string) => {
        try {
            const response = await dataService.upsertMaintenanceChecklistItem(ovAssetId, selectedPlanId, activityId, userId, { comments: comment });
            if (response) {
                setChecklistResponses(prev => ({ ...prev, [activityId]: response }));
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            toast.error('Erro ao salvar comentário');
        }
    };

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

    const handleRemovePhoto = async (activityId: string, fileName: string) => {
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
    };

    const getFullImageUrl = (activityId: string, fileName: string) => {
        const response = checklistResponses[activityId];
        const resOvAssetId = response?.orderVisitAssetId || ovAssetId;
        const path = response?.imgFilePath || (companyId && assetId ? `companies/${companyId}/assets/${assetId}` : `checklist/${resOvAssetId}/${activityId}`);
        return dataService.getPublicImageUrl(path, fileName);
    };

    const isPlanLocked = initialPlanId != null && initialPlanId !== '' && initialPlanId !== '0' && Number(initialPlanId) !== 0;

    const handleEditPhoto = (activityId: string, fileName: string) => {
        const src = getFullImageUrl(activityId, fileName);
        setEditingPhoto({ activityId, fileName, src });
    };

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
                    const updatedPhotos = response.imgFilesNames.map(f => f === fileName ? uploadResult.filename : f);
                    
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

                            return (
                                <div key={section.id} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                        <h4 className="text-[10px] font-black text-slate-500 dark:text-blue-400 uppercase tracking-widest leading-none">
                                            {section.description}
                                        </h4>
                                    </div>
                                    <div className="space-y-3">
                                        {sectionActivities.map(activity => {
                                            const response = checklistResponses[activity.activityId];
                                            const status = response?.status;
                                            const isHistorical = response && response.orderVisitAssetId !== ovAssetId && response.status !== null && response.status !== undefined;
                                            const isItemDisabled = isHistorical || disabled;
                                                                                        
                                            return (
                                                <div key={activity.id} className={`group relative bg-white dark:bg-slate-900/50 rounded-2xl p-4 border transition-all ${
                                                    isHistorical 
                                                    ? 'border-slate-100 dark:border-slate-800/50 opacity-80' 
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                                }`}>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight mb-1">
                                                                    {activity.activityDescription}
                                                                </div>
                                                                {activity.description && activity.description !== activity.activityDescription && (
                                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal italic">
                                                                        {activity.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isHistorical && (
                                                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 h-fit">
                                                                    <span className="material-symbols-outlined text-xs">lock</span>
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Histórico</span>
                                                                </div>
                                                            )}
                                                            {!isHistorical && !isItemDisabled && response && response.status !== null && response.status !== undefined && (
                                                                <button
                                                                    onClick={() => handleResetItem(activity.activityId)}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all shrink-0"
                                                                    title="Limpar atividade"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete_outline</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Ações: Thumbs and Photo */}
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                                <button
                                                                    disabled={isItemDisabled}
                                                                    onClick={() => handleAnswerItem(activity.activityId, 'OK')}
                                                                    className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-emerald-500/30 active:brightness-125 ${
                                                                        status === 'OK'
                                                                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20'
                                                                        : 'text-slate-400 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400'
                                                                    }`}
                                                                >
                                                                    <span className="material-symbols-outlined text-xl">thumb_up</span>
                                                                </button>
                                                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                                                                <button
                                                                    disabled={isItemDisabled}
                                                                    onClick={() => handleAnswerItem(activity.activityId, 'NOK')}
                                                                    className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-red-500/30 active:brightness-125 ${
                                                                        status === 'NOK'
                                                                        ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] ring-2 ring-red-500/20'
                                                                        : 'text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400'
                                                                    }`}
                                                                >
                                                                    <span className="material-symbols-outlined text-xl">thumb_down</span>
                                                                </button>
                                                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                                                                <button
                                                                    disabled={isItemDisabled}
                                                                    onClick={() => handleAnswerItem(activity.activityId, 'NA')}
                                                                    className={`w-12 h-10 flex items-center justify-center rounded-lg transition-all duration-150 active:ring-4 active:ring-slate-500/30 active:brightness-125 ${
                                                                        status === 'NA'
                                                                        ? 'bg-slate-500 dark:bg-slate-400 text-white shadow-[0_0_15px_rgba(100,116,139,0.4)] ring-2 ring-slate-500/20'
                                                                        : 'text-slate-400 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300'
                                                                    }`}
                                                                    title="Não se aplica"
                                                                >
                                                                    <span className="material-symbols-outlined text-xl">do_not_disturb_on</span>
                                                                </button>
                                                            </div>

                                                            {/* Photos Section */}
                                                            <div className="flex items-center gap-2">
                                                                {response?.imgFilesNames?.map((img: string, idx: number) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className={`relative group/photo cursor-pointer transition-all duration-300 transform ${
                                                                            deletingPhotos.has(`${activity.activityId}-${img}`) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                                                                        }`}
                                                                    >
                                                                        <div 
                                                                            className="w-[70px] h-[70px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                                                                            onClick={() => handleEditPhoto(activity.activityId, img)}
                                                                        >
                                                                            <OptimizedImage 
                                                                                src={getFullImageUrl(activity.activityId, img)} 
                                                                                alt={`Foto ${idx + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        {!isItemDisabled && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRemovePhoto(activity.activityId, img);
                                                                                    }}
                                                                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white dark:border-slate-900 active:scale-95"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                                                                </button>

                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {!isItemDisabled && (status !== null && status !== undefined) && (response?.imgFilesNames?.length || 0) < 3 && (
                                                                    <button
                                                                        onClick={() => setUploadSheetOpenId(activity.activityId)}
                                                                        disabled={uploadingItem === activity.activityId}
                                                                        className="w-[70px] h-[70px] rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all active:scale-95"
                                                                    >
                                                                        {uploadingItem === activity.activityId ? (
                                                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                                        ) : (
                                                                            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Comment Section (Inline) */}
                                                        {(!isItemDisabled || response?.comments) && (
                                                            <div className="relative group/input">
                                                                <Input
                                                                    disabled={isItemDisabled || status === null || status === undefined}
                                                                    placeholder="Adicionar observação..."
                                                                    value={response?.comments || ''}
                                                                    onChange={(e) => handleLocalCommentChange(activity.activityId, e.target.value)}
                                                                    onBlur={(e) => handleSaveComment(activity.activityId, e.target.value)}
                                                                    className={`h-10! text-[10px] bg-transparent! pr-8 ${
                                                                        isHistorical 
                                                                        ? 'border-transparent! text-slate-500 italic' 
                                                                        : ''
                                                                    }`}
                                                                />
                                                                {!isItemDisabled && response?.comments && status !== null && status !== undefined && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleLocalCommentChange(activity.activityId, '');
                                                                            handleSaveComment(activity.activityId, '');
                                                                        }}
                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover/input:opacity-100"
                                                                        title="Limpar observação"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
