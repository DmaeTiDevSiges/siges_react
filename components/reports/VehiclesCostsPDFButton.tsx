import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { VehiclesCostsDocument, VehicleCostRow } from './VehiclesCostsDocument';
import { PDFButton } from '../ui/PDFButton';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';

interface VehiclesCostsPDFButtonProps {
    rows: VehicleCostRow[];
    competency?: string;
    filename?: string;
    className?: string;
    totalCount?: number;
}

/**
 * Botão que gera um PDF com os veículos listados na aba Custos Mensais.
 */
export const VehiclesCostsPDFButton = ({
    rows,
    competency,
    filename = 'custos-mensais-veiculos',
    className = '',
    totalCount,
}: VehiclesCostsPDFButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!rows || rows.length === 0) {
            toast.error('Nenhum veículo disponível para exportar.');
            return;
        }

        try {
            setIsGenerating(true);
            const toastId = toast.loading(`Gerando PDF com ${rows.length} veículo(s)...`);

            const logoBase64 = await getLogoBase64();
            const doc = (
                <VehiclesCostsDocument
                    rows={rows}
                    competency={competency}
                    logoBase64={logoBase64}
                />
            );
            const blob = await pdf(doc).toBlob();

            const competencyTag = competency ? `-${competency.replace(/\//g, '-')}` : '';
            const now = new Date();
            const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            await FileUtils.downloadFile(blob, `${filename}${competencyTag}-${dateTag}.pdf`);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF de custos mensais:', error);
            toast.error('Ocorreu um erro ao gerar o PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PDFButton
            onClick={handleDownload}
            loading={isGenerating}
            title={"Exportar custos mensais dos veículos em PDF"}
            count={totalCount ?? undefined}
            className={className}
        />
    );
};
