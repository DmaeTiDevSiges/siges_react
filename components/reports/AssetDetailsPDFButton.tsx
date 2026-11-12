import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFButton } from '../ui/PDFButton';
import { toast } from 'sonner';
import { AssetDetailsDocument } from './AssetDetailsDocument';
import { Asset, AssetAttribute } from '../../types';
import { FileUtils } from '../../utils/FileUtils';

interface PDFButtonProps {
    asset: Asset;
    attributes: AssetAttribute[];
    attributeValues: Record<string, string>;
    className?: string;
}

export const AssetDetailsPDFButton = ({ asset, attributes, attributeValues, className }: PDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (isGenerating) return;
        setIsGenerating(true);

        const toastId = toast.loading('Gerando Ficha Técnica PDF...', { 
            position: 'top-center'
        });

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `Ficha_Tecnica_${asset.code || asset.id}_${timestamp}.pdf`;

            await new Promise(resolve => setTimeout(resolve, 100));

            const blob = await pdf(
                <AssetDetailsDocument 
                    asset={asset}
                    attributes={attributes}
                    attributeValues={attributeValues}
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
            title={"Baixar Ficha Técnica"}
            className={className || ''}
        />
    );
};
