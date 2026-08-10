import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FaFilePdf } from 'react-icons/fa';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { AssetsListDocument, AssetListRow } from './AssetsListDocument';
import { Loading } from '../ui/Loading';
import { dataService } from '../../services/dataService';

interface AssetsSearchPDFButtonProps {
    assets: any[];
    searchQuery?: string;
    className?: string;
}

export const AssetsSearchPDFButton: React.FC<AssetsSearchPDFButtonProps> = ({
    assets,
    searchQuery = '',
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;
        if (!assets || assets.length === 0) {
            toast.error('Nenhum ativo para exportar.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Ativos...');

        try {
            // Fetch types to map typeId to description
            const types = await dataService.getAssetTypes('all');
            const typeMap = new Map<string, string>(types.map(t => [t.id.toString(), t.description || '']));

            // Map to report rows
            const reportRows: AssetListRow[] = assets.map(a => ({
                unitDescriptionFull: a.unitDescriptionFull || a.unitDescription || '',
                tagName: a.tagName || a.assetTagDescription || '',
                code: a.code,
                description: a.description,
                statusCode: a.statusCode || a.statusId,
                statusAt: a.statusAt,
                typeDescription: a.typeId ? (typeMap.get(a.typeId.toString()) || '—') : '—'
            }));

            // Get company logo in base64
            const logoBase64 = await getLogoBase64();

            // Instantiate and compile Document to PDF
            const doc = (
                <AssetsListDocument 
                    assets={reportRows} 
                    logoBase64={logoBase64} 
                />
            );
            const blob = await pdf(doc).toBlob();

            // Save the PDF file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `ativos_pesquisa_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de ativos:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={generatePDF}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
            title="Exportar Ativos para PDF"
        >
            {isGenerating ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span>PDF ({assets.length})</span>
        </button>
    );
};
