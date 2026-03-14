import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { VisitsListDocument, VisitListRow } from './VisitsListDocument';
import { FaFilePdf } from 'react-icons/fa';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';

interface VisitsListPDFButtonProps {
    visits: VisitListRow[];
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que gera um PDF tabular com a listagem de visitas filtradas.
 */
export const VisitsListPDFButton = ({
    visits,
    filename = 'relatorio-visitas',
    className = '',
    totalCount,
}: VisitsListPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!visits || visits.length === 0) {
            toast.error('Nenhuma visita disponível para exportar.');
            return;
        }

        try {
            setIsGenerating(true);
            const toastId = toast.loading(`Gerando PDF com ${visits.length} visitas...`);

            const logoBase64 = await getLogoBase64();
            const doc = <VisitsListDocument visits={visits} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            const now = new Date();
            const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            await FileUtils.downloadFile(blob, `${filename}-${dateTag}.pdf`);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de visitas:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            title="Exportar lista de visitas em PDF"
            className={`flex items-center gap-2 px-4 py-1.5 bg-slate-800/40 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm ${className}`}
        >
            {isGenerating ? (
                <>
                    <HiOutlineDotsCircleHorizontal className="animate-spin" />
                    <span>Processando...</span>
                </>
            ) : (
                <>
                    <FaFilePdf size={12} className="text-red-500" />
                    <span>PDF {totalCount ? `(${totalCount})` : ''}</span>
                </>
            )}
        </button>
    );
};
