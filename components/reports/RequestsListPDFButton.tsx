import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { RequestsListDocument } from './RequestsListDocument';
import { PDFButton } from '../ui/PDFButton';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { dataService } from '../../services/dataService';
import { OrderFilters } from '../../types';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';


interface RequestsListPDFButtonProps {
    filters: OrderFilters;
    searchQuery?: string;
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que busca TODAS as SS's baseadas nos filtros atuais antes de gerar o PDF
 */
export const RequestsListPDFButton = ({
    filters,
    searchQuery = '',
    filename = 'relatorio-ss',
    className = "",
    totalCount
}: RequestsListPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            const toastId = toast.loading('Buscando dados das solicitações...');

            // Buscar todos os registros usando o método especializado para SS
            const data = await dataService.getUnscheduledSS({
                ...filters,
                search: searchQuery,
            });

            if (!data || data.length === 0) {
                toast.error('Nenhuma solicitação encontrada para os filtros atuais.', { id: toastId });
                setIsGenerating(false);
                return;
            }

            toast.loading(`Gerando PDF com ${data.length} solicitações...`, { id: toastId });

            // Gerar o PDF
            const logoBase64 = await getLogoBase64();
            const doc = <RequestsListDocument requests={data} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            // Salvar o arquivo
            await FileUtils.downloadFile(blob, `${filename}.pdf`);

            toast.success('PDF de solicitações gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de SS:', error);
            toast.error('Ocorreu um erro ao gerar o PDF das solicitações.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            title={"Exportar lista de SSs em PDF"}
            count={totalCount}
            className={className}
        />
    );
};
