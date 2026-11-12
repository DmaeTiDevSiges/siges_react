import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { AssetHistoryDocument } from './AssetHistoryDocument';
import { Asset, AssetHistoryItem } from '../../types';
import { urlsToBase64 } from '../../utils/PdfImageUtils';
import { imgproxyService } from '../../services/media/imgproxyService';
import { FileUtils } from '../../utils/FileUtils';

interface AssetHistoryPDFButtonProps {
    asset: Asset;
    history: AssetHistoryItem[];
    className?: string;
}

export const AssetHistoryPDFButton = ({ asset, history, className }: AssetHistoryPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isGenerating || history.length === 0) return;
        setIsGenerating(true);

        const toastId = toast.loading('Gerando PDF do histórico...', {
            position: 'top-center'
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 100));

            const historyWithImages = await Promise.all(
                history.map(async (item) => {
                    const pdfImgOptions = { width: 400, height: 400, resize: 'fill' as const, format: 'jpeg' as const, quality: 90 };
                    const beforeProxied = item.beforeImg ? imgproxyService.generateUrl(item.beforeImg, pdfImgOptions) : undefined;
                    const afterProxied = item.afterImg ? imgproxyService.generateUrl(item.afterImg, pdfImgOptions) : undefined;
                    const [beforeImgBase64, afterImgBase64] = await urlsToBase64([beforeProxied, afterProxied]);
                    return { ...item, beforeImgBase64, afterImgBase64 };
                })
            );

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `Historico_${asset.code || asset.id}_${timestamp}.pdf`;

            const blob = await pdf(
                <AssetHistoryDocument
                    asset={asset}
                    history={historyWithImages}
                />
            ).toBlob();

            await FileUtils.downloadFile(blob, fileName);
            toast.success('O download iniciará em instantes.', { id: toastId });

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Ocorreu um erro ao gerar o relatório. Tente novamente.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleGeneratePDF}
            loading={isGenerating}
            disabled={history.length === 0}
            title={history.length === 0 ? 'Nenhum histórico para exportar' : 'Exportar histórico em PDF'}
            count={history.length > 0 ? history.length : undefined}
            className={className || ''}
        />
    );
};
