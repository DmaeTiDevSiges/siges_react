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
            // 1. Fetch all data in parallel
            const [visit, team, vehicles, assets, services, allActivities, allMaterials, checklistValues] = await Promise.all([
                dataService.getActiveOrderVisit(visitId),
                dataService.getOrderVisitTeam(visitId),
                dataService.getOrderVisitVehicles(visitId),
                dataService.getOrderVisitAssets(visitId),
                dataService.getOrderVisitServices(visitId),
                dataService.getOrderVisitAssetsActivitiesByVisit(visitId),
                dataService.getOrderVisitAssetsMaterialsByVisit(visitId),
                dataService.getChecklistValuesByVisit(visitId)
            ]);

            if (!visit) {
                toast.error('Visita não encontrada.', { id: toastId });
                return;
            }

            // Group activities and materials by asset ID for efficiency
            const activitiesByAssetId = (allActivities || []).reduce((acc: any, act) => {
                const assetId = act.orderVisitAssetId;
                if (!acc[assetId]) acc[assetId] = [];
                acc[assetId].push(act);
                return acc;
            }, {});

            const materialsByAssetId = (allMaterials || []).reduce((acc: any, mat) => {
                const assetId = mat.orderVisitAssetId;
                if (!acc[assetId]) acc[assetId] = [];
                acc[assetId].push(mat);
                return acc;
            }, {});

            const checklistByAssetId = (checklistValues || []).reduce((acc: any, val) => {
                const assetId = val.orderVisitAssetId;
                if (!acc[assetId]) acc[assetId] = [];
                acc[assetId].push(val);
                return acc;
            }, {});

            // Join data for report
            const assetsWithDetails = assets.map(a => ({
                ...a,
                activities: activitiesByAssetId[a.id] || [],
                materials: materialsByAssetId[a.id] || [],
                checklistItems: checklistByAssetId[a.id] || []
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
                    // Approval audit trail
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
                    activitiesDescription: a.activitiesDescription,
                    initialPhotoUrls: a.initialPhotoUrls ?? [],
                    finalPhotoUrls: a.finalPhotoUrls ?? [],
                    checklistItems: a.checklistItems ?? [],
                    activities: (a.activities ?? []).map((act: any) => ({
                        activityDescription: act.activityDescription,
                        activityCode: act.activityCode,
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


            // 4. Pre-fetch all images as base64 for APK compatibility
            toast.loading('Carregando imagens…', { id: toastId });
            const logoBase64 = await getLogoBase64();

            const assetsWithBase64 = await Promise.all(
                reportData.assets.map(async (a) => {
                    // Use imgproxy with JPEG format — @react-pdf/renderer does NOT support WebP
                    const pdfImageOptions = { width: 800, height: 800, resize: 'fit' as const, format: 'jpeg' as const, quality: 90 };
                    const initialProxied = (a.initialPhotoUrls ?? []).filter(Boolean).map(url => 
                        imgproxyService.generateUrl(url as string, pdfImageOptions)
                    );
                    const finalProxied = (a.finalPhotoUrls ?? []).filter(Boolean).map(url => 
                        imgproxyService.generateUrl(url as string, pdfImageOptions)
                    );

                    return {
                        ...a,
                        initialPhotoUrls: await urlsToBase64(initialProxied),
                        finalPhotoUrls: await urlsToBase64(finalProxied),
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
                className={`flex items-center gap-2 px-3 h-8 bg-slate-900 dark:bg-slate-900 border border-slate-800 dark:border-white/10 rounded-full hover:bg-slate-800 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 ${className}`}
                title="Gerar Relatório PDF"
            >
                {loading ? (
                    <>
                        <HiOutlineDotsCircleHorizontal className="animate-spin text-slate-400" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Processando...</span>
                    </>
                ) : (
                    <>
                        <FaFilePdf size={12} className="text-red-500" />
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-tighter">
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
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
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
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    <span>Relatório PDF</span>
                </>
            )}
        </button>
    );
};
