import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FaFilePdf } from 'react-icons/fa';
import { FileUtils } from '../../utils/FileUtils';
import { AssetsListDocument, AssetListRow } from './AssetsListDocument';
import { dataService } from '../../services/dataService';
import { getLogoBase64 } from '../../utils/PdfImageUtils';

interface AssetsListPDFButtonProps {
    unitId: string;
    unitName: string;
    totalCount?: number;
}

export const AssetsListPDFButton: React.FC<AssetsListPDFButtonProps> = ({
    unitId,
    unitName,
    totalCount
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        const toastId = toast.loading('Gerando PDF de Ativos...');

        try {
            // 1. Fetch all assets for the unit
            // We use 'all' filter and empty search, passing unitId
            const assetsRaw = await dataService.getAssets('all', '', unitId);

            if (!assetsRaw || assetsRaw.length === 0) {
                toast.error('Nenhum ativo encontrado para esta unidade.', { id: toastId });
                setIsGenerating(false);
                return;
            }

            // 2. Fetch types to map typeId to description
            const types = await dataService.getAssetTypes('all');
            const typeMap = new Map(types.map(t => [t.id.toString(), t.description]));

            // 3. Map to report rows
            const reportRows: AssetListRow[] = assetsRaw.map(a => ({
                unitDescriptionFull: a.unitDescriptionFull || unitName,
                tagName: a.tagName,
                code: a.code,
                description: a.description,
                statusCode: a.statusCode,
                statusAt: a.statusAt,
                typeDescription: a.typeId ? typeMap.get(a.typeId.toString()) : '—'
            }));

            // 4. Generate the PDF
            const logoBase64 = await getLogoBase64();
            const doc = <AssetsListDocument assets={reportRows} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            // 5. Save the file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `ativos_${unitName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.pdf`;
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait ${isGenerating ? 'animate-pulse' : ''}`}
            title="Exportar Ativos para PDF"
        >
            {isGenerating ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
                <FaFilePdf className="text-lg" />
            )}
            <span className="text-[11px] font-black uppercase tracking-wider">
                PDF {totalCount !== undefined ? `(${totalCount})` : ''}
            </span>
        </button>
    );
};
