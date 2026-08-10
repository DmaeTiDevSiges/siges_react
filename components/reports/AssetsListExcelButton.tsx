import React, { useState } from 'react';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { Loading } from '../ui/Loading';

interface AssetsListExcelButtonProps {
    unitId: string;
    unitName: string;
    assetTagId?: string | null;
    assetTagName?: string;
    totalCount?: number;
    className?: string;
}

export const AssetsListExcelButton: React.FC<AssetsListExcelButtonProps> = ({
    unitId,
    unitName,
    assetTagId,
    assetTagName,
    totalCount,
    className = ''
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;

        setIsExporting(true);
        const toastId = toast.loading('Gerando Excel de Ativos...');

        try {
            const assetsRaw = await dataService.getAssets('all', '', unitId);
            const assets = assetTagId
                ? assetsRaw.filter(a => String((a as any).tagId || '') === String(assetTagId))
                : assetsRaw;

            if (!assets || assets.length === 0) {
                toast.error(assetTagName ? 'Nenhum ativo encontrado para este setor.' : 'Nenhum ativo encontrado para esta unidade.', { id: toastId });
                return;
            }

            const types = await dataService.getAssetTypes('all');
            const typeMap = new Map(types.map(t => [t.id.toString(), t.description]));

            const reportRows = assets.map(a => ({
                unitDescriptionFull: a.unitDescriptionFull || unitName,
                tagName: a.tagName || '',
                code: a.code,
                description: a.description,
                statusCode: a.statusCode || a.statusId,
                statusAt: a.statusAt,
                typeDescription: a.typeId ? typeMap.get(a.typeId.toString()) : '-'
            }));

            const mapping = {
                unitDescriptionFull: 'Unidade',
                tagName: 'Setor',
                code: 'Codigo',
                description: 'Descricao',
                statusCode: 'Situacao',
                statusAt: 'Data Situacao',
                typeDescription: 'Tipo'
            };

            const formattedData = ExcelExportUtils.formatDataForExport(reportRows, mapping);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const scope = assetTagName || unitName;
            const filename = `ativos_${scope.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

            await ExcelExportUtils.exportToExcel(formattedData, filename, 'Ativos');
            toast.success('Excel exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar Excel de ativos:', error);
            toast.error('Ocorreu um erro ao exportar o Excel.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-3 py-1.5 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 text-green-500 hover:bg-green-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-xs ${className}`}
            title="Exportar Ativos para Excel"
        >
            {isExporting ? (
                <Loading size="xs" />
            ) : (
                <RiFileExcel2Fill className="text-[14px]" />
            )}
            <span>XLS {totalCount !== undefined ? `(${totalCount})` : ''}</span>
        </button>
    );
};
