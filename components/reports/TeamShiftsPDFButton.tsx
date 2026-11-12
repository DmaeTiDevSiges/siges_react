import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { TeamShiftsDocument, TeamShiftsReportRow } from './TeamShiftsDocument';
import { PDFButton } from '../ui/PDFButton';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';

interface TeamShiftsPDFButtonProps {
    rows: TeamShiftsReportRow[];
    periodLabel: string;
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que gera o PDF da apuração mensal de turnos/ociosidade das equipes.
 */
export const TeamShiftsPDFButton = ({
    rows,
    periodLabel,
    filename = 'ociosidade-equipes',
    className = '',
    totalCount,
}: TeamShiftsPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!rows || rows.length === 0) {
            toast.error('Nenhuma equipe disponível para exportar.');
            return;
        }

        try {
            setIsGenerating(true);
            const toastId = toast.loading(`Gerando PDF com ${rows.length} equipe(s)...`);

            const logoBase64 = await getLogoBase64();
            const doc = <TeamShiftsDocument rows={rows} periodLabel={periodLabel} logoBase64={logoBase64} />;
            const blob = await pdf(doc).toBlob();

            const now = new Date();
            const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            await FileUtils.downloadFile(blob, `${filename}-${dateTag}.pdf`);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de ociosidade:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            title={"Exportar apuração de ociosidade em PDF"}
            count={totalCount || undefined}
            className={className}
        />
    );
};
