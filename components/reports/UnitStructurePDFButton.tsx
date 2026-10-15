import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { UnitStructureDocument } from './UnitStructureDocument';
import { buildUnitStructurePdfRows } from '../../utils/unitStructurePdfRows';
import { dataService } from '../../services/dataService';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { FileUtils } from '../../utils/FileUtils';

interface UnitStructurePDFButtonProps {
    unitId: string;
    unitName?: string;
    /** descrição completa da unidade (description_full) */
    unitDescription?: string;
    className?: string;
}

export const UnitStructurePDFButton: React.FC<UnitStructurePDFButtonProps> = ({
    unitId,
    unitName,
    unitDescription,
    className = ''
}) => {
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        if (loading || !unitId) return;

        setLoading(true);
        const toastId = toast.loading('Gerando PDF do organograma...');

        try {
            const nodes = await dataService.getUnitStructureNodes(unitId);

            if (!nodes || nodes.length === 0) {
                toast.error('Nenhum setor atribuído a esta unidade.', { id: toastId });
                return;
            }

            let resolvedName = unitName;
            let resolvedDescription = unitDescription;

            if (!resolvedName || !resolvedDescription) {
                const unit = await dataService.getUnitById(unitId);
                resolvedName = resolvedName || unit?.description || unit?.code || 'Unidade';
                resolvedDescription = resolvedDescription || unit?.descriptionFull;
            }

            const rows = buildUnitStructurePdfRows(nodes);
            const logoBase64 = await getLogoBase64();

            const doc = (
                <UnitStructureDocument
                    unitName={resolvedName}
                    unitDescription={resolvedDescription}
                    rows={rows}
                    logoBase64={logoBase64}
                />
            );
            const blob = await pdf(doc).toBlob();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `organograma_${resolvedName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('Organograma gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF do organograma:', error);
            toast.error('Ocorreu um erro ao gerar o organograma.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PDFButton
            onClick={generatePDF}
            loading={loading}
            label="PDF"
            className={className}
            title="Exportar organograma da unidade para PDF"
        />
    );
};
