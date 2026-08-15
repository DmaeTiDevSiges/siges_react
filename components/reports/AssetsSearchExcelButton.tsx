import React, { useState } from 'react';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { Loading } from '../ui/Loading';
import { dataService } from '../../services/dataService';

interface AssetsSearchExcelButtonProps {
    assets: any[];
    searchQuery?: string;
    className?: string;
}

export const AssetsSearchExcelButton: React.FC<AssetsSearchExcelButtonProps> = ({
    assets,
    searchQuery = '',
    className = ''
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            if (!assets || assets.length === 0) {
                toast.error('Nenhum ativo para exportar.');
                return;
            }

            setIsExporting(true);
            const toastId = toast.loading('Gerando Excel de Ativos...');

            // Fetch types to map typeId to description
            const types = await dataService.getAssetTypes('all');
            const typeMap = new Map(types.map(t => [t.id.toString(), t.description]));

            // Prepara os dados formatados para o Excel
            const reportRows = assets.map(a => ({
                unitDescriptionFull: a.unitDescriptionFull || a.unitDescription || '',
                tagName: a.tagName || a.assetTagDescription || '',
                tagSubName: a.tagSubName || '',
                code: a.code,
                description: a.description,
                statusDescription: a.statusDescription || a.statusCode || a.statusId || '',
                statusAt: a.statusAt,
                typeDescription: a.typeId ? typeMap.get(a.typeId.toString()) : '—'
            }));

            // Mapeamento de colunas para o Excel
            const mapping = {
                unitDescriptionFull: 'Unidade',
                tagName: 'Setor',
                tagSubName: 'Posição',
                code: 'Código',
                description: 'Descrição',
                statusDescription: 'Situação',
                statusAt: 'Data Situação',
                typeDescription: 'Tipo'
            };

            const formattedData = ExcelExportUtils.formatDataForExport(reportRows, mapping);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `ativos_pesquisa_${timestamp}`;
            
            await ExcelExportUtils.exportToExcel(formattedData, filename, 'Ativos');

            toast.success('Excel exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            toast.error('Ocorreu um erro ao exportar o Excel.');
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
            <span>XLS ({assets.length})</span>
        </button>
    );
};
