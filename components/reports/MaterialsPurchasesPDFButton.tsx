import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { MaterialsPurchasesListDocument, MaterialsPurchasesRow } from './MaterialsPurchasesListDocument';

interface MaterialsPurchasesPDFButtonProps {
    purchases: MaterialsPurchasesRow[];
    purchaseCodeFilter?: string;
    filename?: string;
    className?: string;
}

export const MaterialsPurchasesPDFButton: React.FC<MaterialsPurchasesPDFButtonProps> = ({
    purchases,
    purchaseCodeFilter,
    filename = 'relatorio-compras',
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;
        if (!purchases || purchases.length === 0) {
            toast.error('Nenhuma compra para exportar.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Compras...');

        try {
            const logoBase64 = await getLogoBase64();

            const doc = (
                <MaterialsPurchasesListDocument
                    purchases={purchases}
                    purchaseCodeFilter={purchaseCodeFilter}
                    logoBase64={logoBase64}
                />
            );

            const blob = await pdf(doc).toBlob();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const codePart = purchaseCodeFilter ? `_codigo-${purchaseCodeFilter}` : '';
            const file = `${filename}${codePart}_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, file);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de compras:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={generatePDF}
            loading={isGenerating}
            disabled={!purchases || purchases.length === 0}
            title={"Exportar Compras para PDF"}
            count={purchases?.length}
            className={className}
        />
    );
};
