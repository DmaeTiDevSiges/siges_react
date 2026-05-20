import React, { useState } from 'react';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { dataService } from '../../services/dataService';
import { OrderFilters } from '../../types';
import { toast } from 'sonner';
import { Loading } from '../ui/Loading';


interface ExcelExportButtonProps {
    filters: OrderFilters;
    searchQuery?: string;
    filename: string;
    title?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão para exportar listagens para Excel buscando todos os dados filtrados
 */
export const ExcelExportButton = ({
    filters,
    searchQuery = '',
    filename,
    title = "Exportar Excel",
    className = "",
    totalCount
}: ExcelExportButtonProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const toastId = toast.loading('Buscando dados para o Excel...');

            // Buscar todos os registros ignorando paginação
            const result = await dataService.getOrdersFilters({
                ...filters,
                search: searchQuery,
                page: 0,
                pageSize: 1000 // Busca até 1000 registros para o Excel
            });

            if (!result.data || result.data.length === 0) {
                toast.error('Nenhum dado encontrado para exportar.', { id: toastId });
                setIsExporting(false);
                return;
            }

            toast.loading(`Gerando Excel com ${result.data.length} registros...`, { id: toastId });

            // Mapeamento de colunas para o Excel (unidade_nome etc.)
            const mapping = {
                orderMask: 'OS',
                clientName: 'Cliente',
                unitDescription: 'Unidade',
                unitAssetTagDescription: 'Setor',
                unitAssetTagSubDescription: 'Sub-setor',
                requestedServices: 'Serviços a realizar',
                requesterName: 'Solicitante',
                requesterTeamCode: 'Equipe Solicitante',
                requesterPhone: 'Fone Solicitante',
                contractDescription: 'Contrato',
                teamCode: 'Equipe',
                teamLeaderNameShort: 'Líder',
                statusDescription: 'Situação',
                priorityDescription: 'Prioridade',
                statusAt: 'Data Situação'
            };

            const formattedData = ExcelExportUtils.formatDataForExport(result.data, mapping);
            await ExcelExportUtils.exportToExcel(formattedData, filename, 'Listagem');

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
            className={`flex items-center gap-2 px-4 py-1.5 bg-green-600/20 border border-green-600/50 text-green-500 rounded-full hover:bg-green-600/30 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm ${className}`}
        >
            {isExporting ? (
                <Loading size="xs" />
            ) : (
                <RiFileExcel2Fill size={14} />
            )}
            <span>{isExporting ? 'Processando...' : `${title} ${totalCount !== undefined ? `(${totalCount})` : ''}`}</span>
        </button>
    );
};
