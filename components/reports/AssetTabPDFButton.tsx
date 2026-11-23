import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFButton } from '../ui/PDFButton';
import { AssetTabReportDocument, AssetTabSection } from './AssetTabReportDocument';
import { Asset } from '../../types';
import { FileUtils } from '../../utils/FileUtils';

interface AssetTabPDFButtonProps {
    asset: Asset;
    /** Título no PDF e na mensagem de carregamento (ex.: "Alertas"). */
    title: string;
    subtitle?: string;
    /** Prefixo do arquivo (ex.: "Alertas" → Alertas_<código>_<data>.pdf). */
    fileNamePrefix: string;
    /** Seções do PDF. Pode ser assíncrono (ex.: aba que carrega dados sozinha). */
    getSections: () => AssetTabSection[] | Promise<AssetTabSection[]>;
    orientation?: 'portrait' | 'landscape';
    /** Quantidade de registros (mostrada no botão e desabilita se 0). */
    count?: number;
    disabled?: boolean;
    className?: string;
}

/** Botão PDF das abas do ativo (usa o PDFButton padrão vermelho). */
export const AssetTabPDFButton = ({
    asset, title, subtitle, fileNamePrefix, getSections, orientation, count, disabled, className,
}: AssetTabPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const empty = count === 0;

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGenerating || empty) return;
        setIsGenerating(true);
        const toastId = toast.loading(`Gerando PDF de ${title.toLowerCase()}...`, { position: 'top-center' });

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const sections = await getSections();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `${fileNamePrefix}_${asset.code || asset.id}_${timestamp}.pdf`;

            const blob = await pdf(
                <AssetTabReportDocument asset={asset} title={title} subtitle={subtitle} sections={sections} orientation={orientation} />
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
            disabled={disabled || empty}
            title={empty ? `Nenhum registro de ${title.toLowerCase()} para exportar` : `Exportar ${title.toLowerCase()} em PDF`}
            count={count !== undefined && count > 0 ? count : undefined}
            className={className || ''}
        />
    );
};
