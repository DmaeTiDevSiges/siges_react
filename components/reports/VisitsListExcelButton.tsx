import React, { useState } from 'react';
import { VisitListRow } from './VisitsListDocument';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { ExcelExportUtils } from '../../utils/ExcelExportUtils';
import { Loading } from '../ui/Loading';

interface VisitsListExcelButtonProps {
    visits: VisitListRow[];
    filename?: string;
    className?: string;
    totalCount?: number;
}

const fmtText = (val: any) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
};

const fmtDateTime = (val?: string) => {
    if (!val) return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return val; }
};

const fmtNumber = (val: any) => {
    const n = parseFloat(val);
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
};

/**
 * Botão que exporta a listagem de visitas filtradas para Excel,
 * com o mesmo conteúdo do PDF (mesmas colunas + linha de TOTAIS).
 */
export const VisitsListExcelButton = ({
    visits,
    filename = 'relatorio-visitas',
    className = '',
    totalCount,
}: VisitsListExcelButtonProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!visits || visits.length === 0) {
            toast.error('Nenhuma visita disponível para exportar.');
            return;
        }

        try {
            setIsExporting(true);
            const toastId = toast.loading(`Gerando Excel com ${visits.length} visitas...`);

            const rows = visits.map(v => ({
                ovMask: fmtText(v.ovMask),
                ovStartedAt: fmtDateTime(v.ovStartedAt),
                ovEndedAt: fmtDateTime(v.ovEndedAt),
                contractDescription: fmtText(v.contractDescription),
                orderMask: fmtText(v.orderMask),
                typeCode: fmtText(v.typeCode),
                typeSubCode: fmtText(v.typeSubCode),
                unitDescription: fmtText(v.unitDescription),
                sectorDescription: fmtText(v.sectorDescription),
                statusDescription: fmtText(v.statusDescription),
                processingDescription: fmtText(v.processingDescription),
                materialsValue: fmtNumber(v.materialsValue),
                vehiclesValue: fmtNumber(v.vehiclesValue),
                servicesValue: fmtNumber(v.servicesValue),
                totalValue: fmtNumber(v.totalValue),
            }));

            const mapping = {
                ovMask: 'VISITA',
                ovStartedAt: 'INÍCIO',
                ovEndedAt: 'FIM',
                contractDescription: 'CONTRATO',
                orderMask: 'OS',
                typeCode: 'TIPO',
                typeSubCode: 'SUB',
                unitDescription: 'UNIDADE',
                sectorDescription: 'SETOR',
                statusDescription: 'SITUAÇÃO',
                processingDescription: 'PROCESSAMENTO',
                materialsValue: 'MATERIAIS',
                vehiclesValue: 'TRANSP.',
                servicesValue: 'SERVIÇOS',
                totalValue: 'TOTAL',
            };

            const totals = visits.reduce(
                (acc, v) => ({
                    materiais: acc.materiais + (v.materialsValue || 0),
                    transportes: acc.transportes + (v.vehiclesValue || 0),
                    servicos: acc.servicos + (v.servicesValue || 0),
                    total: acc.total + (v.totalValue || 0),
                }),
                { materiais: 0, transportes: 0, servicos: 0, total: 0 }
            );

            const totalsRow = {
                VISITA: '',
                'INÍCIO': '',
                FIM: '',
                CONTRATO: '',
                OS: '',
                TIPO: '',
                SUB: '',
                UNIDADE: '',
                SETOR: '',
                SITUAÇÃO: '',
                PROCESSAMENTO: 'TOTAIS',
                MATERIAIS: fmtNumber(totals.materiais),
                'TRANSP.': fmtNumber(totals.transportes),
                'SERVIÇOS': fmtNumber(totals.servicos),
                TOTAL: fmtNumber(totals.total),
            };

            const formattedData = [
                ...ExcelExportUtils.formatDataForExport(rows, mapping),
                totalsRow,
            ];

            const now = new Date();
            const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

            await ExcelExportUtils.exportToExcel(formattedData, `${filename}-${dateTag}`, 'Visitas');

            toast.success('Excel gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar Excel de visitas:', error);
            toast.error('Ocorreu um erro ao gerar o Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            title="Exportar lista de visitas em Excel"
            className={`flex items-center gap-2 px-4 py-1.5 bg-green-600/20 border border-green-600/50 text-green-500 rounded-[8px] hover:bg-green-600/30 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm shrink-0 ${className}`}
        >
            {isExporting ? (
                <Loading size="xs" />
            ) : (
                <RiFileExcel2Fill className="text-[14px]" />
            )}
            <span>Excel {totalCount ? `(${totalCount})` : ''}</span>
        </button>
    );
};
