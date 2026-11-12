import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { formatDateInBrazil } from '../../utils/formatters';
import { FaFilePdf } from 'react-icons/fa';
import { Loading } from '../ui/Loading';
import type { DailyScheduleReportPriority, DailyScheduleReportTeam } from './DailyScheduleDocument';

interface DailySchedulePDFButtonProps {
    contractLabel: string;
    /** Dia da programação (YYYY-MM-DD). */
    date: string;
    dateLabel: string;
    filtersLabel?: string;
    teams: DailyScheduleReportTeam[];
    emptyTeams: string[];
    priorities: DailyScheduleReportPriority[];
    disabled?: boolean;
    className?: string;
}

/** Gera o PDF da Programação Diária (sequência por equipe + prioridade de atendimento). */
export const DailySchedulePDFButton: React.FC<DailySchedulePDFButtonProps> = ({
    contractLabel, date, dateLabel, filtersLabel, teams, emptyTeams, priorities, disabled, className,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (teams.length === 0 && priorities.length === 0) {
            toast.error('Nada programado neste dia para exportar.');
            return;
        }
        const toastId = toast.loading('Gerando PDF da programação...');
        try {
            setIsGenerating(true);
            // Carregados sob demanda: o @react-pdf é pesado e só entra quando o PDF é pedido.
            const [{ pdf }, { DailyScheduleDocument }, logoBase64] = await Promise.all([
                import('@react-pdf/renderer'),
                import('./DailyScheduleDocument'),
                getLogoBase64(),
            ]);
            const generatedAt = formatDateInBrazil(new Date(), 'dateTime', 'pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            const blob = await pdf(
                <DailyScheduleDocument
                    contractLabel={contractLabel}
                    dateLabel={dateLabel}
                    filtersLabel={filtersLabel}
                    teams={teams}
                    emptyTeams={emptyTeams}
                    priorities={priorities}
                    generatedAt={generatedAt}
                    logoBase64={logoBase64}
                />,
            ).toBlob();
            await FileUtils.downloadFile(blob, `programacao-diaria-${date}.pdf`);
            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF da programação diária:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || disabled}
            title="Exportar a programação do dia em PDF"
            className={`flex items-center gap-2 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 text-[10px] uppercase tracking-wider ${className || ''}`}
        >
            {isGenerating ? <Loading size="xs" /> : <FaFilePdf className="text-[14px]" />}
            <span>PDF</span>
        </button>
    );
};
