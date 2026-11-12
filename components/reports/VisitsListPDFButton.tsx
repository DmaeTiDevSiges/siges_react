import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { VisitsListDocument, VisitListRow } from './VisitsListDocument';
import { PDFButton } from '../ui/PDFButton';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';


interface VisitsListPDFButtonProps {
    visits?: VisitListRow[];
    /** Busca as visitas no clique (lista paginada no servidor). */
    loadVisits?: () => Promise<VisitListRow[]>;
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que gera um PDF tabular com a listagem de visitas filtradas.
 */
export const VisitsListPDFButton = ({
    visits,
    loadVisits,
    filename = 'relatorio-visitas',
    className = '',
    totalCount,
}: VisitsListPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        // Lista vem por parâmetro ou é buscada na hora (paginação no servidor).
        let list = visits || [];
        if (loadVisits) {
            const loadingToast = toast.loading('Carregando visitas...');
            try {
                list = await loadVisits();
            } catch (err) {
                console.error('Erro ao carregar visitas para exportar:', err);
                toast.error('Erro ao carregar as visitas.', { id: loadingToast });
                return;
            }
            toast.dismiss(loadingToast);
        }
        if (!list || list.length === 0) {
            toast.error('Nenhuma visita disponível para exportar.');
            return;
        }

        try {
            setIsGenerating(true);
            const toastId = toast.loading(`Gerando PDF com ${list.length} visitas...`);

            const logoBase64 = await getLogoBase64();
            const doc = <VisitsListDocument visits={list} logoBase64={logoBase64} />;
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
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            title={"Exportar lista de visitas em PDF"}
            count={totalCount || undefined}
            className={className}
        />
    );
};
