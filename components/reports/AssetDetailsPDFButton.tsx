import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { FaFilePdf } from 'react-icons/fa';
import { toast } from 'sonner';
import { AssetDetailsDocument } from './AssetDetailsDocument';
import { Asset, AssetAttribute } from '../../types';
import { Loading } from '../ui/Loading';

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
            disabled={isGenerating}
            title="Baixar Ficha Técnica"
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${isGenerating ? 'animate-pulse' : ''} ${className || ''}`}
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
