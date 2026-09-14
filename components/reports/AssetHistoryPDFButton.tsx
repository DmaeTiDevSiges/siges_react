import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { FaFilePdf } from 'react-icons/fa';
import { AssetHistoryDocument } from './AssetHistoryDocument';
import { Asset, AssetHistoryItem } from '../../types';
import { urlsToBase64 } from '../../utils/PdfImageUtils';
import { imgproxyService } from '../../services/imgproxyService';
import { Loading } from '../ui/Loading';

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

            saveAs(blob, fileName);
            toast.success('O download iniciará em instantes.', { id: toastId });

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Ocorreu um erro ao gerar o relatório. Tente novamente.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || history.length === 0}
            title={history.length === 0 ? 'Nenhum histórico para exportar' : 'Exportar histórico em PDF'}
            className={`flex items-center gap-2 px-4 py-1.5 bg-slate-800/40 border border-slate-700 text-slate-300 rounded-full hover:bg-slate-700 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm ${isGenerating ? 'animate-pulse' : ''} ${className || ''}`}
        >
            {isGenerating ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf size={12} className="text-red-500" />
            )}
            <span>PDF {history.length > 0 ? `(${history.length})` : ''}</span>
        </button>
    );
};
