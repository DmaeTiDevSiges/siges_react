import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { OSDocument } from './OSDocument';
import { HiDocumentDownload, HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { FileUtils } from '../../utils/FileUtils';
import { toast } from 'sonner';

interface PDFExportButtonProps {
    osData: any;
    className?: string;
}

/**
 * Botão que facilita a exportação de uma OS para PDF
 * Atualizado para suportar APK via FileUtils
 */
export const PDFExportButton = ({ osData, className = "" }: PDFExportButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (isGenerating) return;

        try {
            setIsGenerating(true);
            const toastId = toast.loading('Gerando PDF da OS...');

            const doc = <OSDocument data={osData} />;
            const blob = await pdf(doc).toBlob();

            await FileUtils.downloadFile(blob, `OS-${osData.id || 'export'}.pdf`);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF da OS:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
        >
            {isGenerating ? (
                <>
                    <HiOutlineDotsCircleHorizontal className="animate-spin" />
                    <span>Gerando...</span>
                </>
            ) : (
                <>
                    <HiDocumentDownload size={20} />
                    <span>Baixar PDF</span>
                </>
            )}
        </button>
    );
};
