import React, { useState } from 'react';
import { toast } from 'sonner';
import { logClientEvent } from '../../services/core/clientDiagnosticsService';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { formatDateInBrazil } from '../../utils/formatters';
import { PDFButton } from '../ui/PDFButton';
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
            // Uma nova versão do app troca os arquivos (chunks): o import falha com a tela
            // antiga aberta. Tenta de novo uma vez antes de desistir.
            const loadModules = () => Promise.all([import('@react-pdf/renderer'), import('./DailyScheduleDocument')]);
            const [[{ pdf }, { DailyScheduleDocument }], logoBase64] = await Promise.all([
                loadModules().catch(() => new Promise<void>(r => setTimeout(r, 600)).then(loadModules)),
                getLogoBase64().catch(() => undefined),
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
            const detail = error instanceof Error ? error.message : String(error);
            logClientEvent('error', `PDF programação diária falhou — ${detail}`, {
                stack: error instanceof Error ? error.stack : undefined,
                extra: { stage: 'daily_schedule_pdf', teams: teams.length, priorities: priorities.length, date },
            });
            toast.error('Ocorreu um erro ao gerar o PDF.', { id: toastId, description: detail.slice(0, 160) });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            disabled={disabled}
            title="Exportar a programação do dia em PDF"
            className={className}
        />
    );
};
