import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FaFilePdf } from 'react-icons/fa';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { MaterialsPurchasesListDocument, MaterialsPurchasesRow } from './MaterialsPurchasesListDocument';
import { Loading } from '../ui/Loading';

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
        <button
            onClick={generatePDF}
            disabled={isGenerating || !purchases || purchases.length === 0}
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
            title="Exportar Compras para PDF"
        >
            {isGenerating ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span>PDF ({purchases.length})</span>
        </button>
    );
};
