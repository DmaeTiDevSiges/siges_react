import React, { useState } from 'react';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { TeamShiftsReportRow } from './TeamShiftsDocument';
import { Loading } from '../ui/Loading';

interface TeamShiftsExcelButtonProps {
    rows: TeamShiftsReportRow[];
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que exporta a apuração mensal de turnos/ociosidade das equipes para Excel.
 */
export const TeamShiftsExcelButton = ({
    rows,
    filename = 'ociosidade-equipes',
    className = '',
    totalCount,
}: TeamShiftsExcelButtonProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!rows || rows.length === 0) {
            toast.error('Nenhuma equipe disponível para exportar.');
            return;
        }

        try {
            setIsExporting(true);
            const toastId = toast.loading(`Gerando Excel com ${rows.length} equipe(s)...`);

            const mapping = {
                teamCode: 'Código',
                teamName: 'Equipe',
                normalShifts: 'Turnos Normais',
                extraShifts: 'Turnos Extras',
                businessDays: 'Dias Úteis',
                approvedVisitHours: 'Visitas Aprovadas (h)',
                availableHours: 'Disponível (h)',
                idlePercent: 'Ociosidade (%)',
                note: 'Observação',
            };

            const formattedData = ExcelExportUtils.formatDataForExport(rows as any[], mapping);
            await ExcelExportUtils.exportToExcel(formattedData, filename, 'Ociosidade');

            toast.success('Excel exportado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar Excel de ociosidade:', error);
            toast.error('Ocorreu um erro ao exportar o Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            title="Exportar apuração de ociosidade em Excel"
            className={`flex items-center gap-2 px-3 py-1.5 bg-green-600/20 border border-green-600/50 text-green-500 hover:bg-green-600/30 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-[10px] uppercase tracking-wider ${className}`}
        >
            {isExporting ? (
                <Loading size="xs" />
            ) : (
                <RiFileExcel2Fill size={14} />
            )}
            <span>Excel {totalCount ? `(${totalCount})` : ''}</span>
        </button>
    );
};
