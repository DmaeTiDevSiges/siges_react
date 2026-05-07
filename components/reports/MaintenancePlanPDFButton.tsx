import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { dataService } from '../../services/dataService';
import { MaintenancePlanDocument } from './MaintenancePlanDocument';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity } from '../../types';
import { FaFilePdf } from 'react-icons/fa';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { Loading } from '../ui/Loading';


interface MaintenancePlanPDFButtonProps {
    planId: string;
    description?: string;
    className?: string;
    /** Compact icon-only variant */
    compact?: boolean;
    /** Action style (pill, dark) */
    variant?: 'default' | 'action';
    /** Custom label text */
    label?: string;
}

export const MaintenancePlanPDFButton: React.FC<MaintenancePlanPDFButtonProps> = ({
    planId,
    description,
    className = '',
    compact = false,
    variant = 'default',
    label,
}) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        const toastId = toast.loading('Gerando PDF do plano...');

        try {
            // 1. Fetch Plan Data
            const plan = await dataService.getMaintenancePlanById(planId);
            if (!plan) {
                toast.error('Plano não encontrado.', { id: toastId });
                return;
            }

            // 2. Fetch Sections
            const sections = await dataService.getMaintenancePlanSections(planId);
            
            // 3. Fetch Activities for each section
            const sectionsWithActivities = await Promise.all(
                sections.map(async (section) => {
                    const activities = await dataService.getMaintenancePlanSectionActivities(section.id);
                    return {
                        ...section,
                        activities: activities || []
                    };
                })
            );

            // 4. Get Logo
            const logoBase64 = await getLogoBase64();

            // 5. Generate PDF
            const blob = await pdf(
                <MaintenancePlanDocument 
                    plan={plan} 
                    sections={sectionsWithActivities} 
                    logoBase64={logoBase64} 
                />
            ).toBlob();

            const fileName = `plano-manutencao-${plan.code || plan.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
            await FileUtils.downloadFile(blob, fileName);

            toast.success('Relatório gerado com sucesso!', { id: toastId });
        } catch (err) {
            console.error('[MaintenancePlanPDFButton] Error:', err);
            toast.error('Erro ao gerar PDF. Tente novamente.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // Estilo "Pílula" (Imagem 2)
    if (variant === 'action') {
        return (
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center gap-2.5 px-4 h-9 bg-[#0f172a] dark:bg-slate-900 border border-white/20 dark:border-white/10 rounded-full hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-black/20 ${className}`}
                title="Gerar Relatório PDF"
            >
                {loading ? (
                    <>
                        <Loading size="xs" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Processando...</span>
                    </>
                ) : (
                    <>
                        <FaFilePdf size={15} className="text-red-500" />
                        <span className="text-[12px] font-black text-slate-200 uppercase tracking-tight">
                            {label || 'PDF'}
                        </span>
                    </>
                )}
            </button>
        );
    }

    // Estilo Compacto Quadrado (Imagem 1)
    if (compact) {
        return (
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#334155] border border-slate-600/50 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-600 transition-all active:scale-90 disabled:opacity-50 ${className}`}
                title="Exportar PDF do Plano"
            >
                {loading ? (
                    <Loading size="xs" />
                ) : (
                    <FaFilePdf size={20} className="text-red-500" />
                )}
            </button>
        );
    }

    // Estilo Padrão
    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50 shadow-sm ${className}`}
        >
            {loading ? (
                <>
                    <Loading size="xs" />
                    <span>Gerando…</span>
                </>
            ) : (
                <>
                    <FaFilePdf className="text-red-500" />
                    <span>{label || 'Exportar PDF'}</span>
                </>
            )}
        </button>
    );
};
