import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { AssetsAlertsListDocument, AssetAlertListRow } from './AssetsAlertsListDocument';

interface AssetsAlertsPDFButtonProps {
    alerts: any[];
    filterName?: 'abertos' | 'resolvidos' | 'todos';
    className?: string;
}

export const AssetsAlertsPDFButton: React.FC<AssetsAlertsPDFButtonProps> = ({
    alerts,
    filterName = 'todos',
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;
        if (!alerts || alerts.length === 0) {
            toast.error('Nenhum alerta para exportar.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Alertas...');

        try {
            // Map to report rows
            const reportRows: AssetAlertListRow[] = alerts.map(a => ({
                assetCode: a.assetCode,
                assetDescription: a.assetDescription,
                unitDescription: a.unitDescription,
                tagStr: a.tagName ? (a.tagSubName ? `${a.tagName} › ${a.tagSubName}` : a.tagName) : undefined,
                priorityName: a.priorityName,
                orderTypeName: a.orderTypeName,
                description: a.description,
                isDone: a.isDone,
                createdAt: a.createdAt,
                resolvedAt: a.resolvedAt,
                location: a.location,
            }));

            // Get company logo in base64
            const logoBase64 = await getLogoBase64();

            const titleStr = filterName === 'abertos' 
                ? 'Relatório de Alertas de Ativos (Abertos)' 
                : filterName === 'resolvidos' 
                    ? 'Relatório de Alertas de Ativos (Resolvidos)' 
                    : 'Relatório de Alertas de Ativos (Todos)';

            // Instantiate and compile Document to PDF
            const doc = (
                <AssetsAlertsListDocument 
                    alerts={reportRows} 
                    logoBase64={logoBase64}
                    titleStr={titleStr}
                />
            );
            const blob = await pdf(doc).toBlob();

            // Save the PDF file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `alertas_ativos_${filterName}_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de alertas:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={generatePDF}
            loading={isGenerating}
            title={"Exportar Alertas para PDF"}
            count={alerts.length}
            className={className}
        />
    );
};
