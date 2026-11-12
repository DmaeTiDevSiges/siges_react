import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { dataService } from '../../services/dataService';
import { MaintenancePlanDocument } from './MaintenancePlanDocument';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity } from '../../types';
import { PDFButton } from '../ui/PDFButton';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { getBrazilDateInputValue } from '../../utils/formatters';


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

            const fileName = `plano-manutencao-${plan.code || plan.id}-${getBrazilDateInputValue()}.pdf`;
            await FileUtils.downloadFile(blob, fileName);

            toast.success('Relatório gerado com sucesso!', { id: toastId });
        } catch (err) {
            console.error('[MaintenancePlanPDFButton] Error:', err);
            toast.error('Erro ao gerar PDF. Tente novamente.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // Botão PDF padrão do app; `compact` = só o ícone.
    return (
        <PDFButton
            onClick={handleExport}
            loading={loading}
            label={variant === 'action' || !compact ? (label || 'PDF') : undefined}
            iconOnly={compact && variant !== 'action'}
            title={compact && variant !== 'action' ? 'Exportar PDF do Plano' : 'Gerar Relatório PDF'}
            className={className}
        />
    );
};
