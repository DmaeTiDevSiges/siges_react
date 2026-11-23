import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { AssetQrLabelDocument } from './AssetQrLabelDocument';
import { Asset } from '../../types';
import { FileUtils } from '../../utils/FileUtils';
import { qrCodeDataUrl } from '../../utils/qrDataUrl';

export const AssetQrLabelPDFButton = ({ asset, className }: { asset: Asset; className?: string }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating) return;
        setIsGenerating(true);
        const toastId = toast.loading('Gerando etiqueta PDF...', { position: 'top-center' });

        try {
            const qr = await qrCodeDataUrl(asset.code || asset.id);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const blob = await pdf(<AssetQrLabelDocument asset={asset} qrDataUrl={qr} />).toBlob();
            await FileUtils.downloadFile(blob, `Etiqueta_QR_${asset.code || asset.id}_${timestamp}.pdf`);
            toast.success('O download iniciará em instantes.', { id: toastId });
        } catch (error) {
            console.error('Error generating QR label PDF:', error);
            toast.error('Ocorreu um erro ao gerar a etiqueta. Tente novamente.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return <PDFButton onClick={handleGeneratePDF} loading={isGenerating} title="Baixar etiqueta com QR Code em PDF" className={className || ''} />;
};
