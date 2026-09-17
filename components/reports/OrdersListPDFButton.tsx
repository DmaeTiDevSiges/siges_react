import React, { useState } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { OrdersListDocument } from './OrdersListDocument';
import { FaFilePdf } from 'react-icons/fa';
import { HiOutlineDotsCircleHorizontal } from 'react-icons/hi';
import { dataService } from '../../services/dataService';
import { OrderFilters } from '../../types';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { Loading } from '../ui/Loading';


interface OrdersListPDFButtonProps {
    filters: OrderFilters;
    searchQuery?: string;
    filename?: string;
    className?: string;
    totalCount?: number;
    fetchData?: (opts: any) => Promise<{ data: any[]; total: number }>;
}

/**
 * Botão que busca TODOS os dados baseados nos filtros atuais antes de gerar o PDF
 * Isso resolve o problema de exportar apenas o que está "carregado" na tela (lazy loading/infinite scroll)
 */
export const OrdersListPDFButton = ({
    filters,
    searchQuery = '',
    filename = 'relatorio-os',
    className = "",
    totalCount,
    fetchData
}: OrdersListPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            const toastId = toast.loading('Buscando dados para o relatório...');

            const fetchFn = fetchData || ((opts: any) => dataService.getOrdersFilters(opts));
            const result = await fetchFn({
                ...filters,
                search: searchQuery,
                page: 0,
                pageSize: 1000
            });

            if (!result.data || result.data.length === 0) {
                toast.error('Nenhum dado encontrado para os filtros atuais.', { id: toastId });
                setIsGenerating(false);
                return;
            }

            toast.loading(`Gerando PDF com ${result.data.length} registros...`, { id: toastId });

            // Gerar o PDF usando a API imperativa do @react-pdf/renderer
            const logoBase64 = await getLogoBase64();
            const doc = <OrdersListDocument orders={result.data} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            // Salvar o arquivo usando FileUtils
            await FileUtils.downloadFile(blob, `${filename}.pdf`);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
        >
            {isGenerating ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span>PDF {totalCount !== undefined ? `(${totalCount})` : ''}</span>
        </button>
    );
};
