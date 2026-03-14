import React, { useState } from 'react';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { dataService } from '../../services/dataService';
import { OrderFilters } from '../../types';
import { toast } from 'sonner';

interface RequestsExcelExportButtonProps {
    filters: OrderFilters;
    searchQuery?: string;
    filename: string;
    title?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão para exportar Solicitações (SS's) para Excel buscando todos os dados filtrados
 */
export const RequestsExcelExportButton = ({
    filters,
    searchQuery = '',
    filename,
    title = "Exportar Excel",
    className = "",
    totalCount
}: RequestsExcelExportButtonProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const toastId = toast.loading('Buscando dados das solicitações para o Excel...');

            // Buscar todos os registros usando o método para SS
            const data = await dataService.getUnscheduledSS({
                ...filters,
                search: searchQuery,
            });

            if (!data || data.length === 0) {
                toast.error('Nenhuma solicitação encontrada para exportar.', { id: toastId });
                setIsExporting(false);
                return;
            }

            toast.loading(`Gerando Excel com ${data.length} solicitações...`, { id: toastId });

            // Mapeamento de colunas para o Excel exclusivo para SS
            const mapping = {
                orderMask: 'SS',
                clientName: 'Cliente',
                unitDescription: 'Unidade',
                unitAssetTagDescription: 'Setor',
                unitAssetTagSubDescription: 'Sub-setor',
                requestedServices: 'Serviços Solicitados',
                requesterName: 'Solicitante',
                requesterTeamCode: 'Equipe Solicitante',
                requesterPhone: 'Fone Solicitante',
                contractDescription: 'Contrato',
                teamCode: 'Equipe Responsável',
                teamLeaderNameShort: 'Líder Equipe',
                statusDescription: 'Situação',
                priorityDescription: 'Prioridade',
                statusAt: 'Data Situação'
            };

            const formattedData = ExcelExportUtils.formatDataForExport(data, mapping);
            ExcelExportUtils.exportToExcel(formattedData, filename, 'Listagem de SS');

            toast.success('Excel de solicitações exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar Excel de SS:', error);
            toast.error('Ocorreu um erro ao exportar o Excel das solicitações.');
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
                <div className="w-3 h-3 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
            ) : (
                <RiFileExcel2Fill size={14} />
            )}
            <span>{isExporting ? 'Processando...' : `${title} ${totalCount ? `(${totalCount})` : ''}`}</span>
        </button>
    );
};
