import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { dataService } from '../../services/dataService';
import { VisitReportDocument, VisitReportData } from './VisitReportDocument';
import { urlsToBase64, getLogoBase64 } from '../../utils/PdfImageUtils';
import { imgproxyService } from '../../services/imgproxyService';
import { FaFilePdf } from 'react-icons/fa';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';


interface VisitReportPDFButtonProps {
    visitId: string;
    visitMask?: string;
    className?: string;
    /** Compact icon-only variant (for card action area) */
    compact?: boolean;
    /** Action style (pill, dark) */
    variant?: 'default' | 'action';
    /** Custom label text */
    label?: string;
}

/**
 * Fetches all data for a visit and generates a professional PDF report.
 */
export const VisitReportPDFButton = ({
    visitId,
    visitMask,
    className = '',
    compact = false,
    variant = 'default',
    label,
}: VisitReportPDFButtonProps) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (loading) return;
        setLoading(true);
        const toastId = toast.loading('Gerando relatório da visita…');

        try {
            // 1. Fetch all data in parallel
            const [visit, team, vehicles, assets, services, allActivities, allMaterials] = await Promise.all([
                dataService.getActiveOrderVisit(visitId),
                dataService.getOrderVisitTeam(visitId),
                dataService.getOrderVisitVehicles(visitId),
                dataService.getOrderVisitAssets(visitId),
                dataService.getOrderVisitServices(visitId),
                dataService.getOrderVisitAssetsActivitiesByVisit(visitId),
                dataService.getOrderVisitAssetsMaterialsByVisit(visitId)
            ]);

            console.log(`[VisitReportPDFButton] Debug Data for Visit ${visitId}:`, {
                visitId,
                foundAssets: assets?.length || 0,
                foundActivities: allActivities?.length || 0,
                foundMaterials: allMaterials?.length || 0,
                visitCode: visit?.ovMask || visit?.id
            });
            console.log(`[VisitReportPDFButton] First 3 Activities:`, (allActivities || []).slice(0, 3));
            console.log(`[VisitReportPDFButton] First 3 Assets Plans:`, (assets || []).slice(0, 3).map(a => a.maintenancePlanId));

            if (!visit) {
                toast.error('Visita não encontrada.', { id: toastId });
                return;
            }

            // 2. Fetch all unique maintenance plans mentioned in assets OR activities
            const activitiesPlanIds = (allActivities || []).map(a => a.maintenancePlanId).filter(Boolean);
            const assetPlanIds = (assets || []).map(a => a.maintenancePlanId).filter(Boolean);
            const uniquePlanIds = Array.from(new Set([...activitiesPlanIds, ...assetPlanIds])) as string[];

            const planMetaMap: Record<string, any> = {};
            const planNodesMap: Record<string, any> = {};
            const planFullStructureMap: Record<string, any[]> = {};

            await Promise.all(uniquePlanIds.map(async (planId) => {
                try {
                    const [plan, sections] = await Promise.all([
                        dataService.getMaintenancePlanById(planId),
                        dataService.getMaintenancePlanSections(planId)
                    ]);
                    
                    if (plan) planMetaMap[planId] = plan;

                    const sectionActivitiesPromises = sections.map(s => dataService.getMaintenancePlanSectionActivities(s.id));
                    const sectionActivitiesResults = await Promise.all(sectionActivitiesPromises);

                    const allPlanActivities: any[] = [];
                    sections.forEach((s, idx) => {
                        const actsInSec = sectionActivitiesResults[idx];
                        actsInSec.forEach((act: any) => {
                            const key = `${planId}_${act.activityId}`;
                            const node = {
                                sectionDescription: s.description,
                                sectionOrder: s.orderIndex,
                                activityOrder: act.orderIndex,
                                activityId: act.activityId,
                                activityDescription: act.activityDescription || act.description,
                                activityCode: act.activityCode,
                                commentsDefault: act.commentsDefault
                            };
                            planNodesMap[key] = node;
                            allPlanActivities.push(node);
                        });
                    });
                    planFullStructureMap[planId] = allPlanActivities;
                } catch (e) {
                    console.error('Error fetching plan structure for PDF:', e);
                }
            }));

            // Group activities by asset, ensuring ALL plan activities are listed if a plan is assigned
            const activitiesByAssetId: Record<string, any[]> = {};
            
            assets.forEach(asset => {
                const assetId = asset.id;
                const planId = asset.maintenancePlanId;
                
                // 1. Get current responses for this asset
                const currentResponses = (allActivities || []).filter(a => a.orderVisitAssetId === assetId);
                const responsesMap = new Map(currentResponses.map(r => [r.activityId, r]));

                // 2. Build the final activities array for this asset
                if (planId && planFullStructureMap[planId]) {
                    // Start with the full plan structure
                    const structure = planFullStructureMap[planId];
                    activitiesByAssetId[assetId] = structure.map(node => {
                        const response = responsesMap.get(node.activityId);
                        return {
                            ...node,
                            isOk: response ? response.isOk : null,
                            comments: response ? (response.comments || '') : (node.commentsDefault || ''),
                            imgFilePath: response?.imgFilePath,
                            imgFilesNames: response?.imgFilesNames || [],
                            maintenancePlanId: planId
                        };
                    });
                    
                    // Add any activities that were manually added but are not in the plan (if any)
                    const extraActivities = currentResponses.filter(r => !structure.some(s => s.activityId === r.activityId));
                    if (extraActivities.length > 0) {
                        activitiesByAssetId[assetId].push(...extraActivities.map(r => ({
                            ...r,
                            sectionDescription: 'Atividades Avulsas',
                            sectionOrder: 9999,
                            activityOrder: 9999
                        })));
                    }
                } else {
                    // No plan assigned, just show all manual activities
                    activitiesByAssetId[assetId] = currentResponses.map(r => {
                        const key = `${r.maintenancePlanId}_${r.activityId}`;
                        const node = planNodesMap[key];
                        return {
                            ...r,
                            sectionDescription: node?.sectionDescription || 'Atividades',
                            sectionOrder: node?.sectionOrder || 999,
                            activityOrder: node?.activityOrder || 999
                        };
                    });
                }

                // Sort by section and activity order
                activitiesByAssetId[assetId].sort((a: any, b: any) => {
                    if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
                    return (a.activityOrder || 0) - (b.activityOrder || 0);
                });
            });

            const materialsByAssetId = (allMaterials || []).reduce((acc: any, mat) => {
                const assetId = mat.orderVisitAssetId;
                if (!acc[assetId]) acc[assetId] = [];
                acc[assetId].push(mat);
                return acc;
            }, {});

            // Join data for report
            const assetsWithDetails = assets.map(a => ({
                ...a,
                activities: activitiesByAssetId[a.id] || [],
                materials: materialsByAssetId[a.id] || []
            }));

            // 3. Build report data object
            const reportData: VisitReportData = {
                visit: {
                    id: visit.id,
                    ovMask: visit.ovMask,
                    orderMask: visit.orderMask,
                    ovStatusId: visit.ovStatusId,
                    statusDescription: visit.statusDescription,
                    processingDescription: visit.processingDescription,
                    ovStartedAt: visit.ovStartedAt,
                    ovEndedAt: visit.ovEndedAt,
                    ovDurationHours: visit.ovDurationHours,
                    ovComments: visit.ovComments,
                    teamLeaderName: visit.teamLeaderName,
                    priority: visit.priorityDescription || visit.priorityCode || 'NORMAL',
                    requesterName: visit.oRequesterName || visit.clientName,
                    contactPhone: visit.oRequesterPhone || '—',
                    sectorDescription: visit.assetTagDescription,
                    unitDescription: visit.unitDescription,
                    systemDescription: visit.systemDescription,
                    clientName: visit.clientName,
                    assetTagDescription: visit.assetTagDescription,
                    assetTagSubDescription: visit.assetTagSubDescription,
                    requestedServices: visit.requestedServices,
                    contractDescription: visit.contractDescription,
                    planDescription: visit.planDescription,
                    teamCode: visit.teamCode,
                    reason: visit.oReasonDescription,
                    cause: visit.oCauseDescription,
                    observation: visit.observation || visit.ovComments,
                    servicesValue: visit.servicesValue,
                    materialsValue: visit.materialsValue,
                    vehiclesValue: visit.vehiclesValue,
                    totalValue: visit.totalValue,
                    ovAssetsAmount: visit.ovAssetsAmount,
                    reportedAt: visit.reportedAt,
                    reportedUserNameShort: visit.reportedUserNameShort,
                    revisedAt: visit.revisedAt,
                    revisedUserNameShort: visit.revisedUserNameShort,
                    disapprovedAt: visit.disapprovedAt,
                    disapprovedUserNameShort: visit.disapprovedUserNameShort,
                    approvedAt: visit.approvedAt,
                    approvedUserNameShort: visit.approvedUserNameShort,
                    approvedFiledAt: visit.approvedFiledAt,
                    approvedFiledUserNameShort: visit.approvedFiledUserNameShort,
                },
                team: team || [],
                vehicles: vehicles || [],
                services: (services || []).map(s => ({
                    id: s.id,
                    serviceDescription: s.serviceDescription,
                    serviceCode: s.serviceCode,
                    amount: s.amount,
                    serviceUnit: s.serviceUnit,
                    valueUnit: s.valueUnit,
                    discount: s.discount,
                    valueTotal: s.valueTotal
                })),
                assets: (assetsWithDetails || []).map((a: any) => ({
                    id: a.id,
                    code: a.code,
                    description: a.description,
                    brand: a.brand,
                    model: a.model,
                    serial: a.serial,
                    location: a.location,
                    beforeUnitDescription: a.beforeUnitDescription,
                    afterUnitDescription: a.afterUnitDescription,
                    beforeStatusDescription: a.beforeStatusDescription,
                    afterStatusDescription: a.afterStatusDescription,
                    beforeTagDescription: a.beforeTagDescription,
                    afterTagDescription: a.afterTagDescription,
                    beforeTagSubDescription: a.beforeTagSubDescription,
                    afterTagSubDescription: a.afterTagSubDescription,
                    beforeComments: a.beforeComments,
                    afterComments: a.afterComments,
                    isMoved: a.isMoved,
                    movedComments: a.movedComments,
                    processingId: a.processingId,
                    maintenancePlanId: (a.maintenancePlanId && a.maintenancePlanId !== '0' && a.maintenancePlanId !== 'null' && a.maintenancePlanId.trim() !== '') ? a.maintenancePlanId : undefined,
                    maintenancePlanName: planMetaMap[a.maintenancePlanId]?.description,
                    maintenancePlanCode: planMetaMap[a.maintenancePlanId]?.code,
                    maintenancePlanProgress: a.maintenancePlanProgress,
                    activitiesDescription: a.activitiesDescription,
                    initialPhotoUrls: a.initialPhotoUrls ?? [],
                    finalPhotoUrls: a.finalPhotoUrls ?? [],
                    activities: (a.activities ?? []).map((act: any) => ({
                        activityId: act.activityId,
                        activityDescription: act.activityDescription,
                        activityCode: act.activityCode,
                        isOk: act.isOk,
                        comments: act.comments,
                        imgFilePath: act.imgFilePath,
                        imgFilesNames: act.imgFilesNames || [],
                        sectionDescription: act.sectionDescription,
                        sectionOrder: act.sectionOrder,
                        activityOrder: act.activityOrder
                    })),
                    materials: (a.materials ?? []).map((m: any) => ({
                        description: m.materialDescription || m.description,
                        code: m.materialCode || m.code,
                        amount: m.amount,
                        unit: m.materialUnit || m.unit,
                        valueUnit: m.valueUnit,
                        discount: m.discount,
                        valueTotal: m.valueTotal,
                    })),
                })),
            };

            // 4. Pre-fetch all images as base64 for PDF compatibility
            toast.loading('Carregando imagens…', { id: toastId });
            const logoBase64 = await getLogoBase64();

            const assetsWithBase64 = await Promise.all(
                reportData.assets.map(async (a) => {
                    const pdfImageOptions = { width: 800, height: 800, resize: 'fit' as const, format: 'jpeg' as const, quality: 90 };
                    const thumbOptions = { width: 300, height: 300, resize: 'fit' as const, format: 'jpeg' as const, quality: 80 };

                    // Asset main images
                    const initialProxied = (a.initialPhotoUrls ?? []).filter(Boolean).map(url => 
                        imgproxyService.generateUrl(url as string, pdfImageOptions)
                    );
                    const finalProxied = (a.finalPhotoUrls ?? []).filter(Boolean).map(url => 
                        imgproxyService.generateUrl(url as string, pdfImageOptions)
                    );

                    // Activity images
                    const activitiesWithImages = await Promise.all((a.activities || []).map(async (act: any) => {
                        if (!act.imgFilesNames || act.imgFilesNames.length === 0) return act;
                        
                        const folderPath = act.imgFilePath || `checklist/${a.id}/${act.activityId}`;
                        const photoUrls = act.imgFilesNames.map((fileName: string) => 
                            imgproxyService.generateUrl(`s3://siges/${folderPath}/${fileName}`, thumbOptions)
                        );
                        
                        try {
                            const photosBase64 = await urlsToBase64(photoUrls);
                            return { ...act, photosBase64 };
                        } catch (e) {
                            console.warn('Error loading activity photos for PDF:', e);
                            return { ...act, photosBase64: [] };
                        }
                    }));

                    return {
                        ...a,
                        initialPhotoUrls: await urlsToBase64(initialProxied),
                        finalPhotoUrls: await urlsToBase64(finalProxied),
                        activities: activitiesWithImages
                    };
                })
            );

            const reportDataWithBase64: VisitReportData = {
                ...reportData,
                logoBase64,
                assets: assetsWithBase64,
            };

            // 5. Render PDF and download
            toast.loading('Gerando PDF…', { id: toastId });
            const blob = await pdf(<VisitReportDocument data={reportDataWithBase64} />).toBlob();
            const fileName = `visita-${visitMask ?? visitId}-${new Date().toISOString().slice(0, 10)}.pdf`;
            await FileUtils.downloadFile(blob, fileName);

            toast.success('Relatório gerado com sucesso!', { id: toastId });
        } catch (err) {
            console.error('[VisitReportPDFButton] Error generating PDF:', err);
            toast.error('Erro ao gerar relatório. Tente novamente.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'action') {
        return (
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center gap-2 px-3 h-8 bg-[#0f172a] border border-white/5 rounded-full hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 ${className}`}
                title="Gerar Relatório PDF"
            >
                {loading ? (
                    <>
                        <HiOutlineDotsCircleHorizontal className="animate-spin text-slate-400" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Gerando...</span>
                    </>
                ) : (
                    <>
                        <FaFilePdf size={14} className="text-red-500" />
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight">
                            {label || 'PDF'}
                        </span>
                    </>
                )}
            </button>
        );
    }

    if (compact) {
        return (
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                title="Exportar Relatório PDF da Visita"
            >
                {loading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                    <FaFilePdf size={14} className="text-red-500" />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${className}`}
            title="Exportar Relatório PDF da Visita"
        >
            {loading ? (
                <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Gerando…</span>
                </>
            ) : (
                <>
                    <FaFilePdf size={16} className="text-red-500" />
                    <span>Relatório PDF</span>
                </>
            )}
        </button>
    );
};
