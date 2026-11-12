import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { FileUtils } from '../../utils/FileUtils';
import { ResponsibleToolsDocument } from './ResponsibleToolsDocument';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { UserTool } from '../../types';

interface ResponsibleToolsPDFButtonProps {
    userName: string;
    items: UserTool[];
    className?: string;
}

export const ResponsibleToolsPDFButton: React.FC<ResponsibleToolsPDFButtonProps> = ({
    userName,
    items,
    className = '',
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        const toastId = toast.loading(`Gerando PDF de ${userName}...`);

        try {
            const logoBase64 = await getLogoBase64();
            const doc = <ResponsibleToolsDocument userName={userName} items={items} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const safeName = userName.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const filename = `ferramentas_${safeName}_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={generatePDF}
            loading={isGenerating}
            title={`Exportar PDF - ${userName}`}
            className={className}
        />
    );
};
