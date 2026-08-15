import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FaFilePdf } from 'react-icons/fa';
import { FileUtils } from '../../utils/FileUtils';
import { AssetsListDocument, AssetListRow } from './AssetsListDocument';
import { dataService } from '../../services/dataService';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { Loading } from '../ui/Loading';


interface AssetsListPDFButtonProps {
    unitId: string;
    unitName: string;
    assetTagId?: string | null;
    assetTagName?: string;
    totalCount?: number;
    className?: string;
}

export const AssetsListPDFButton: React.FC<AssetsListPDFButtonProps> = ({
    unitId,
    unitName,
    assetTagId,
    assetTagName,
    totalCount,
    className = ''
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Ativos...');

        try {
            const assets = await dataService.getAssets('all', '', unitId, assetTagId || undefined);

            if (!assets || assets.length === 0) {
                toast.error(assetTagName ? 'Nenhum ativo encontrado para este setor.' : 'Nenhum ativo encontrado para esta unidade.', { id: toastId });
                setIsGenerating(false);
                return;
            }

            // 2. Fetch types to map typeId to description
            const types = await dataService.getAssetTypes('all');
            const typeMap = new Map<string, string>(types.map(t => [t.id.toString(), t.description as string]));

            // 3. Map to report rows
            const reportRows: AssetListRow[] = assets.map(a => ({
                unitDescriptionFull: a.unitDescriptionFull || unitName,
                tagName: a.tagName,
                tagSubName: a.tagSubName || '',
                code: a.code,
                description: a.description,
                statusDescription: a.statusDescription || a.statusCode || '',
                statusAt: a.statusAt,
                typeDescription: (a.typeId ? typeMap.get(a.typeId.toString()) : null) || '—'
            }));

            // 4. Generate the PDF
            const logoBase64 = await getLogoBase64();
            const doc = <AssetsListDocument assets={reportRows} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            // 5. Save the file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const scope = assetTagName || unitName;
            const filename = `ativos_${scope.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.pdf`;
            await FileUtils.downloadFile(blob, filename);

            toast.success('Relatório de Ativos gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de ativos:', error);
            toast.error('Ocorreu um erro ao gerar o relatório.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={generatePDF}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${isGenerating ? 'animate-pulse' : ''} ${className}`}
            title="Exportar Ativos para PDF"
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
