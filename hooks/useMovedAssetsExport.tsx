import React, { useState } from 'react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { formatDateInBrazil } from '../utils/formatters';
import { ExcelExportUtils } from '../utils/ExcelExportUtils';
import { FileUtils } from '../utils/FileUtils';
import { getLogoBase64 } from '../utils/PdfImageUtils';
import { AssetMovementsDocument } from '../components/reports/AssetMovementsDocument';

/** Ativo movimentado durante as visitas (apropriação "Movimentações"). */
type MovedAsset = any;

const sector = (tag?: string, sub?: string) => `${tag || ''}${sub ? ' > ' + sub : ''}`;
const date = (value?: string) => (value ? formatDateInBrazil(value, 'date', 'pt-BR') : '');

export const EXCEL_MAPPING = {
    code: 'Código', description: 'Descrição',
    beforeClientUnit: 'Origem (Cliente - Unidade)', beforeSector: 'Origem (Setor > Posição)',
    beforeStatus: 'Origem (Situação)', beforeDate: 'Origem (Data)',
    afterClientUnit: 'Destino (Cliente - Unidade)', afterSector: 'Destino (Setor > Posição)',
    afterStatus: 'Destino (Situação)', afterDate: 'Destino (Data)', comments: 'Observações',
};

export const buildMovementExcelRows = (movedAssets: MovedAsset[]) => movedAssets.map(a => ({
    code: a.code || '',
    description: a.description || '',
    beforeClientUnit: `${a.beforeClientName || ''} - ${a.beforeUnitDescription || ''}`,
    beforeSector: sector(a.beforeTagDescription, a.beforeTagSubDescription),
    beforeStatus: a.beforeStatusDescription || '',
    beforeDate: date(a.beforeStatusAt),
    afterClientUnit: `${a.afterClientName || ''} - ${a.afterUnitDescription || ''}`,
    afterSector: sector(a.afterTagDescription, a.afterTagSubDescription),
    afterStatus: a.afterStatusDescription || '',
    afterDate: date(a.afterStatusAt),
    comments: a.movedComments || '',
}));

export const buildMovementPdfRows = (movedAssets: MovedAsset[]) => movedAssets.map(a => ({
    code: a.code || '', description: a.description || '',
    beforeClientName: a.beforeClientName || '', beforeUnitDescription: a.beforeUnitDescription || '',
    beforeSector: sector(a.beforeTagDescription, a.beforeTagSubDescription),
    beforeStatus: a.beforeStatusDescription || '',
    beforeDate: date(a.beforeStatusAt),
    afterClientName: a.afterClientName || '', afterUnitDescription: a.afterUnitDescription || '',
    afterSector: sector(a.afterTagDescription, a.afterTagSubDescription),
    afterStatus: a.afterStatusDescription || '',
    afterDate: date(a.afterStatusAt),
}));

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

/** Exportação (Excel e PDF) da lista de ativos movimentados do painel de visitas. */
export const useMovedAssetsExport = (movedAssets: MovedAsset[] | undefined) => {
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const handleExportExcel = async () => {
        try {
            const list = movedAssets || [];
            if (list.length === 0) {
                toast.error('Nenhuma movimentação para exportar.');
                return;
            }
            setIsExportingExcel(true);
            const toastId = toast.loading('Gerando Excel de Movimentações...');
            const formattedData = ExcelExportUtils.formatDataForExport(buildMovementExcelRows(list), EXCEL_MAPPING);
            await ExcelExportUtils.exportToExcel(formattedData, `movimentacoes_ativos_${stamp()}`, 'Movimentações');
            toast.success('Excel exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            toast.error('Ocorreu um erro ao exportar o Excel.');
        } finally { setIsExportingExcel(false); }
    };

    const handleExportPDF = async () => {
        try {
            const list = movedAssets || [];
            if (list.length === 0) {
                toast.error('Nenhuma movimentação para exportar.');
                return;
            }
            setIsExportingPDF(true);
            const toastId = toast.loading('Gerando PDF de Movimentações...');
            const logoBase64 = await getLogoBase64();
            const doc = <AssetMovementsDocument assets={buildMovementPdfRows(list)} logoBase64={logoBase64} generatedAt={formatDateInBrazil(new Date(), 'dateTime', 'pt-BR')} />;
            const blob = await pdf(doc).toBlob();
            await FileUtils.downloadFile(blob, `movimentacoes_ativos_${stamp()}.pdf`);
            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally { setIsExportingPDF(false); }
    };

    return { handleExportExcel, handleExportPDF, isExportingExcel, isExportingPDF };
};
