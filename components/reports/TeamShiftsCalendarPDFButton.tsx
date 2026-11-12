import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFButton } from '../ui/PDFButton';
import { toast } from 'sonner';
import { TeamShiftsCalendarEntry, TeamShiftsMonthly } from '../../types';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { TeamShiftsCalendarDocument } from './TeamShiftsCalendarDocument';

interface TeamShiftsCalendarPDFButtonProps {
    monthRef: string;
    teams: TeamShiftsMonthly[];
    entries: TeamShiftsCalendarEntry[];
    normalShiftHours: string;
    extraShiftHours: string;
    disabled?: boolean;
}

const parseHours = (value: string) => {
    const hours = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(hours) && hours >= 0 ? hours : 0;
};

export const TeamShiftsCalendarPDFButton: React.FC<TeamShiftsCalendarPDFButtonProps> = ({
    monthRef,
    teams,
    entries,
    normalShiftHours,
    extraShiftHours,
    disabled = false
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (teams.length === 0) {
            toast.error('Nenhuma equipe disponível para exportar.');
            return;
        }

        try {
            setIsGenerating(true);
            const toastId = toast.loading('Gerando PDF da disponibilidade mensal...');
            const logoBase64 = await getLogoBase64();
            const document = (
                <TeamShiftsCalendarDocument
                    monthRef={monthRef}
                    teams={teams}
                    entries={entries}
                    normalShiftHours={parseHours(normalShiftHours)}
                    extraShiftHours={parseHours(extraShiftHours)}
                    logoBase64={logoBase64}
                />
            );
            const blob = await pdf(document).toBlob();
            await FileUtils.downloadFile(blob, `disponibilidade-equipes-${monthRef.slice(0, 7)}.pdf`);
            toast.success('PDF mensal gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF da disponibilidade mensal:', error);
            toast.error(error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            disabled={disabled}
            title="Exportar o mês completo com marcações e totais"
        />
    );
};
