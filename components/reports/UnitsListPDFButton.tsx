import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { UnitsListDocument } from './UnitsListDocument';

interface UnitsListPDFButtonProps {
    units: any[];
    searchQuery?: string;
    className?: string;
}

export const UnitsListPDFButton: React.FC<UnitsListPDFButtonProps> = ({
    units,
    searchQuery = '',
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;
        if (!units || units.length === 0) {
            toast.error('Nenhuma unidade para exportar.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Unidades...');

        try {
            // 1. Get company logo in base64
            const logoBase64 = await getLogoBase64();

            // 2. Instantiate and compile Document to PDF
            const doc = (
                <UnitsListDocument 
                    units={units} 
                    logoBase64={logoBase64} 
                    searchQuery={searchQuery} 
                />
            );
            const blob = await pdf(doc).toBlob();

            // 3. Save the PDF file using FileUtils (handles Web and Cordova/Capacitor APK)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `unidades_pesquisa_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de unidades:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={generatePDF}
            loading={isGenerating}
            title={"Exportar Unidades para PDF"}
            count={units.length}
            className={className}
        />
    );
};
