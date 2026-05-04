import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { dataService } from '../../services/dataService';
import { BatchVisitReportDocument, VisitReportData } from './VisitReportDocument';
import { urlsToBase64, getLogoBase64, addWhiteBackgroundToImage } from '../../utils/PdfImageUtils';
import { imgproxyService } from '../../services/imgproxyService';
import { FaFilePdf } from 'react-icons/fa';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { Loading } from '../ui/Loading';


interface BatchVisitReportPDFButtonProps {
    visits: any[];
    filename?: string;
    className?: string;
    label?: string;
}

/**
 * Componente que gera um único PDF contendo relatórios completos para múltiplas visitas.
 */
export const BatchVisitReportPDFButton = ({
    visits,
    filename = 'relatorio-lote-visitas',
    className = '',
    label,
}: BatchVisitReportPDFButtonProps) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar disparar o clique do card/filtro
        if (loading) return;
        if (!visits || visits.length === 0) {
            toast.error('Nenhuma visita disponível para exportar.');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`Gerando relatórios para ${visits.length} visitas... Isso pode levar um tempo.`);

        try {
            const logoBase64 = await getLogoBase64();
            const reportsData: VisitReportData[] = [];

            // 1. Process each visit
            for (let i = 0; i < visits.length; i++) {
                const visitItem = visits[i];
                const visitId = visitItem.id;
                
                toast.loading(`Processando visita ${i + 1}/${visits.length}: ${visitItem.ovMask || visitId}`, { id: toastId });

                // Fetch data for this specific visit
                const [visit, team, vehicles, assets, services, allActivities, allMaterials] = await Promise.all([
                    dataService.getActiveOrderVisit(visitId),
                    dataService.getOrderVisitTeam(visitId),
                    dataService.getOrderVisitVehicles(visitId),
                    dataService.getOrderVisitAssets(visitId),
                    dataService.getOrderVisitServices(visitId),
                    dataService.getOrderVisitAssetsActivitiesByVisit(visitId),
                    dataService.getOrderVisitAssetsMaterialsByVisit(visitId)
                ]);

                if (!visit) continue;

                // Process maintenance plans structure
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
                        const sectionActivitiesResults = await Promise.all(sections.map(s => dataService.getMaintenancePlanSectionActivities(s.id)));
                        
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
                        console.error('Error fetching plan structure:', e);
                    }
                }));

                const activitiesByAssetId: Record<string, any[]> = {};
                assets.forEach(asset => {
                    const assetId = asset.id;
                    const planId = asset.maintenancePlanId;
                    const currentResponses = (allActivities || []).filter(a => a.orderVisitAssetId === assetId);
                    const responsesMap = new Map(currentResponses.map(r => [r.activityId, r]));

                    if (planId && planFullStructureMap[planId]) {
                        activitiesByAssetId[assetId] = planFullStructureMap[planId].map(node => {
                            const response = responsesMap.get(node.activityId);
                            return {
                                ...node,
                                status: response ? response.status : null,
                                comments: response ? (response.comments || '') : (node.commentsDefault || ''),
                                imgFilePath: response?.imgFilePath,
                                imgFilesNames: response?.imgFilesNames || [],
                                maintenancePlanId: planId
                            };
                        });
                    } else {
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
                    activitiesByAssetId[assetId].sort((a: any, b: any) => (a.sectionOrder - b.sectionOrder) || (a.activityOrder - b.activityOrder));
                });

                const materialsByAssetId = (allMaterials || []).reduce((acc: any, mat) => {
                    const assetId = mat.orderVisitAssetId;
                    if (assetId) {
                        if (!acc[assetId]) acc[assetId] = [];
                        acc[assetId].push(mat);
                    }
                    return acc;
                }, {});

                // Process images to base64
                const assetsWithDetails = assets.map(a => ({
                    ...a,
                    activities: activitiesByAssetId[a.id] || [],
                    materials: materialsByAssetId[a.id] || []
                }));

                const reportData: VisitReportData = {
                    visit: {
                        ...visit,
                        statusDescription: visit.statusDescription,
                        processingDescription: visit.processingDescription,
                        priority: visit.priorityDescription || visit.priorityCode || 'NORMAL',
                        requesterName: visit.oRequesterName || visit.clientName,
                        contactPhone: visit.oRequesterPhone || '—',
                        sectorDescription: visit.assetTagDescription,
                        signatureLeaderUrl: visit.ovSignatureLeaderPath,
                        signatureLeaderName: visit.ovSignatureLeaderName,
                        signatureRequesterUrl: visit.ovSignatureRequesterPath,
                        signatureRequesterName: visit.ovSignatureRequesterName,
                    },
                    team: team || [],
                    vehicles: vehicles || [],
                    services: services || [],
                    assets: assetsWithDetails.map(a => ({
                        ...a,
                        maintenancePlanName: a.maintenancePlanId ? planMetaMap[a.maintenancePlanId]?.description : undefined,
                        maintenancePlanCode: a.maintenancePlanId ? planMetaMap[a.maintenancePlanId]?.code : undefined,
                    })),
                };

                // Convert all images to Base64 (Essential for PDF rendering in batch)
                const processedAssets = await Promise.all(reportData.assets.map(async (a) => {
                    const photoOptions = { width: 400, height: 400, resize: 'fit' as const, format: 'jpeg' as const, quality: 70 };
                    
                    const initialPhotoUrls = await urlsToBase64((a.initialPhotoUrls ?? []).filter(Boolean).map(url => imgproxyService.generateUrl(url as string, photoOptions)));
                    const finalPhotoUrls = await urlsToBase64((a.finalPhotoUrls ?? []).filter(Boolean).map(url => imgproxyService.generateUrl(url as string, photoOptions)));
                    
                    const activities = await Promise.all((a.activities || []).map(async (act: any) => {
                        if (!act.imgFilesNames || act.imgFilesNames.length === 0) return act;
                        const folderPath = act.imgFilePath || `checklist/${a.id}/${act.activityId}`;
                        const photoUrls = act.imgFilesNames.map((fileName: string) => imgproxyService.generateUrl(`s3://siges/${folderPath}/${fileName}`, { width: 200, height: 200, resize: 'fit' as const, format: 'jpeg' as const }));
                        const photosBase64 = await urlsToBase64(photoUrls);
                        return { ...act, photosBase64 };
                    }));

                    return { ...a, initialPhotoUrls, finalPhotoUrls, activities };
                }));

                // Signatures
                const leaderSigUrl = reportData.visit.signatureLeaderUrl && reportData.visit.signatureLeaderName 
                    ? imgproxyService.generateUrl(`s3://siges/${reportData.visit.signatureLeaderUrl}/${reportData.visit.signatureLeaderName}`, { width: 300, height: 150, resize: 'fit', format: 'png' }) 
                    : null;
                const requesterSigUrl = reportData.visit.signatureRequesterUrl && reportData.visit.signatureRequesterName 
                    ? imgproxyService.generateUrl(`s3://siges/${reportData.visit.signatureRequesterUrl}/${reportData.visit.signatureRequesterName}`, { width: 300, height: 150, resize: 'fit', format: 'png' }) 
                    : null;
                
                const sigBase64s = await urlsToBase64([leaderSigUrl, requesterSigUrl].filter(Boolean) as string[]);
                let sigIdx = 0;
                const finalLeaderSig = leaderSigUrl ? await addWhiteBackgroundToImage(sigBase64s[sigIdx++]) : undefined;
                const finalRequesterSig = requesterSigUrl ? await addWhiteBackgroundToImage(sigBase64s[sigIdx++]) : undefined;

                reportsData.push({
                    ...reportData,
                    logoBase64,
                    assets: processedAssets,
                    visit: {
                        ...reportData.visit,
                        signatureLeaderUrl: finalLeaderSig,
                        signatureRequesterUrl: finalRequesterSig,
                    }
                });
            }

            // 2. Generate the PDF
            toast.loading('Compilando PDF final...', { id: toastId });
            const doc = <BatchVisitReportDocument reportsData={reportsData} title={filename} />;
            const blob = await pdf(doc).toBlob();
            
            const now = new Date();
            const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            await FileUtils.downloadFile(blob, `${filename}-${dateTag}.pdf`);

            toast.success('Relatório em lote gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar relatório de visitas em lote:', error);
            toast.error('Ocorreu um erro ao gerar o PDF em lote.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={`flex items-center gap-2 px-3 h-8 bg-[#0f172a] border border-white/5 rounded-full hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 ${className}`}
            title={label || "Exportar relatórios em PDF"}
        >
            {loading ? (
                <>
                    <Loading size="xs" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">...</span>
                </>
            ) : (
                <>
                    <FaFilePdf size={14} className="text-red-500" />
                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight">PDF</span>
                </>
            )}
        </button>
    );
};
