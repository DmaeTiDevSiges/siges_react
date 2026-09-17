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
                className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
                title="Gerar Relatório PDF"
            >
                {loading ? (
                    <Loading size="xs" />
                ) : (
                    <FaFilePdf className="text-[14px]" />
                )}
                <span className="font-black uppercase tracking-tight">
                    {label || 'PDF'}
                </span>
            </button>
        );
    }

    // Estilo Compacto Quadrado (Imagem 1)
    if (compact) {
        return (
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center justify-center w-8 h-8 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                title="Exportar PDF do Plano"
            >
                {loading ? (
                    <Loading size="xs" />
                ) : (
                    <FaFilePdf className="text-[14px]" />
                )}
            </button>
        );
    }

    // Estilo Padrão
    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
        >
            {loading ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span className="font-black uppercase tracking-tight">
                {label || 'PDF'}
            </span>
        </button>
    );
};
