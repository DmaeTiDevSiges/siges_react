import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { FaFilePdf } from 'react-icons/fa';
import { AssetLoanReportDocument } from './AssetLoanReportDocument';
import { AssetLoan, Asset } from '../../types';
import { ChecklistItemState } from '../assetLoans/AssetLoanChecklistForm';
import { getLogoBase64, addWhiteBackgroundToImage } from '../../utils/PdfImageUtils';
import { dataService } from '../../services/dataService';
import { imgproxyService } from '../../services/imgproxyService';
import { toast } from 'sonner';
import { Loading } from '../ui/Loading';

const imgToBase64 = (url: string): Promise<string | null> =>
    new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(null); return; }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });

interface AssetLoanReportPDFButtonProps {
    loan: AssetLoan;
    asset: Asset | null;
    beforeItems: ChecklistItemState[];
    afterItems: ChecklistItemState[];
    className?: string;
}

export const AssetLoanReportPDFButton: React.FC<AssetLoanReportPDFButtonProps> = ({
    loan,
    asset,
    beforeItems,
    afterItems,
    className = '',
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating) return;

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF do empréstimo...', { position: 'top-center' });

        try {
            await new Promise(resolve => setTimeout(resolve, 100));

            const [logoBase64] = await Promise.all([getLogoBase64()]);

            let signatureDeliveryBase64: string | undefined;
            let signatureReturnBase64: string | undefined;

            if (loan.signatureDeliveryPath && loan.signatureDeliveryName) {
                const rawUrl = dataService.getSignatureUrl(loan.signatureDeliveryPath, loan.signatureDeliveryName);
                if (rawUrl) {
                    const url = imgproxyService.generateUrl(rawUrl, { width: 400, height: 200, resize: 'fit', format: 'png' });
                    try {
                        const b64 = await imgToBase64(url);
                        if (b64) {
                            signatureDeliveryBase64 = await addWhiteBackgroundToImage(b64);
                        }
                    } catch (e) {
                        console.warn('Erro ao carregar assinatura de entrega:', e);
                    }
                }
            }
            if (loan.signatureReturnPath && loan.signatureReturnName) {
                const rawUrl = dataService.getSignatureUrl(loan.signatureReturnPath, loan.signatureReturnName);
                if (rawUrl) {
                    const url = imgproxyService.generateUrl(rawUrl, { width: 400, height: 200, resize: 'fit', format: 'png' });
                    try {
                        const b64 = await imgToBase64(url);
                        if (b64) {
                            signatureReturnBase64 = await addWhiteBackgroundToImage(b64);
                        }
                    } catch (e) {
                        console.warn('Erro ao carregar assinatura de devolução:', e);
                    }
                }
            }

            // Convert checklist images to base64
            const convertItemsImages = async (items: ChecklistItemState[]): Promise<ChecklistItemState[]> => {
                return Promise.all(items.map(async (item) => {
                    if (!item.images || item.images.length === 0) return item;
                    const base64Images = await Promise.all(
                        item.images.map(img => imgToBase64(img.imageUrl))
                    );
                    return {
                        ...item,
                        images: item.images.map((img, idx) => ({
                            ...img,
                            imageUrl: base64Images[idx] || img.imageUrl,
                        })),
                    };
                }));
            };

            const beforeItemsBase64 = await convertItemsImages(beforeItems);
            const afterItemsBase64 = await convertItemsImages(afterItems);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const assetCode = asset?.code || 'export';
            const borrower = loan.borrowerName?.replace(/\s+/g, '_') || '';
            const fileName = `Emprestimo_${assetCode}_${borrower}_${timestamp}.pdf`;

            const blob = await pdf(
                <AssetLoanReportDocument
                    loan={loan}
                    asset={asset}
                    beforeItems={beforeItemsBase64}
                    afterItems={afterItemsBase64}
                    logoBase64={logoBase64}
                    signatureDeliveryBase64={signatureDeliveryBase64}
                    signatureReturnBase64={signatureReturnBase64}
                />
            ).toBlob();

            saveAs(blob, fileName);
            toast.success('O download iniciará em instantes.', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF do empréstimo:', error);
            toast.error('Ocorreu um erro ao gerar o relatório. Tente novamente.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            title="Baixar Relatório de Empréstimo"
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${isGenerating ? 'animate-pulse' : ''} ${className}`}
        >
            {isGenerating ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span>PDF</span>
        </button>
    );
};
