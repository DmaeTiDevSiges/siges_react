import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

import { toast } from 'sonner';
import { AssetDetailsDocument } from './AssetDetailsDocument';
import { Asset, AssetAttribute } from '../../types';

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
            // Document creation
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `Ficha_Tecnica_${asset.code || asset.id}_${timestamp}.pdf`;

            // Wait a small delay to ensure UI doesn't freeze awkwardly
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
            className={`flex items-center gap-2 bg-slate-100/80 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-full py-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] hover:bg-slate-200/80 dark:hover:bg-white/20 active:scale-95 transition-all outline-none focus:outline-none ${isGenerating ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${className || ''}`}
        >
            {isGenerating ? (
                <span className="material-symbols-outlined text-[20px] animate-spin text-slate-400">
                    progress_activity
                </span>
            ) : (
                <div className="relative w-5 h-5 flex items-center justify-center">
                    {/* Fundo deslocado (sombra vermelha/borda vermelha esquerda-baixo) */}
                    <div className="absolute top-[3px] left-px w-[13px] h-[13px] border-2 border-red-500 rounded-sm rounded-tr-none rounded-bl-md" />
                    <div className="absolute top-[3px] left-px w-[13px] h-[13px] border-l-[3px] border-b-[3px] border-white/80 dark:border-slate-800 rounded-bl-sm z-0" style={{ transform: 'translate(1px, -1px)' }}/>
                    {/* Quadrado principal vermelho */}
                    <div className="absolute top-px right-px w-[14px] h-[14px] bg-red-500 rounded-sm flex items-center justify-center z-10">
                         <span className="text-[5px] font-black text-white leading-none tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>PDF</span>
                    </div>
                </div>
            )}
            <span className="text-[13px] font-black text-slate-700 dark:text-white tracking-wide">PDF</span>
        </button>
    );
};
