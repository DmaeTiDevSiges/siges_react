import React, { useState } from 'react';
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FileUtils } from '../../utils/FileUtils';
import { getLogoBase64 } from '../../utils/PdfImageUtils';
import { formatDateInBrazil, formatCurrency } from '../../utils/formatters';
import type { VehicleMonthlyExpense, VehicleUtilizationRow } from '../../services/orders/vehicleRentalService';
import { PDFButton } from '../ui/PDFButton';

interface VehicleRentalSectionPDFButtonProps {
    section: 'expenses' | 'utilization';
    vehicleName: string;
    vehiclePlates?: string;
    competency: string;
    expenses?: VehicleMonthlyExpense[];
    utilization?: VehicleUtilizationRow[];
    appropriatePerKm?: number;
    disabled?: boolean;
}

const styles = StyleSheet.create({
    page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica', color: '#1f2937' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#003b71' },
    subtitle: { marginTop: 4, fontSize: 9, color: '#64748b' },
    logo: { width: 38, height: 38 },
    table: { width: '100%' },
    row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1', minHeight: 22, alignItems: 'center' },
    headerRow: { backgroundColor: '#003b71', minHeight: 24 },
    totalRow: { borderTopWidth: 1.5, borderTopColor: '#003b71', backgroundColor: '#eff6ff' },
    cell: { paddingHorizontal: 5, paddingVertical: 5, fontSize: 7 },
    headerCell: { color: '#ffffff', fontSize: 7, fontWeight: 'bold' },
    totalCell: { color: '#003b71', fontWeight: 'bold' },
});

const formatPdfDate = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? '—'
        : formatDateInBrazil(date, 'dateTime', 'pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
};

const formatNumber = (value: number): string => value.toLocaleString('pt-BR');

export const VehicleRentalSectionPDFButton: React.FC<VehicleRentalSectionPDFButtonProps> = ({
    section,
    vehicleName,
    vehiclePlates,
    competency,
    expenses = [],
    utilization = [],
    appropriatePerKm = 0,
    disabled = false,
}) => {
    const [loading, setLoading] = useState(false);
    const isExpenses = section === 'expenses';
    const title = isExpenses ? 'Despesas do Veículo' : 'Utilização do Veículo';
    const columns = isExpenses
        ? [
            { label: 'DATA', width: '22%' },
            { label: 'TIPO', width: '22%' },
            { label: 'DESCRIÇÃO', width: '38%' },
            { label: 'VALOR', width: '18%', right: true },
        ]
        : [
            { label: 'DATA INÍCIO', width: '22%' },
            { label: 'VISITA', width: '17%' },
            { label: 'KM INICIAL', width: '12%', right: true },
            { label: 'KM FINAL', width: '12%', right: true },
            { label: 'KM DIF.', width: '10%', right: true },
            { label: 'R$/KM', width: '13%', right: true },
            { label: 'R$ VISITA', width: '14%', right: true },
        ];

    const rows: Array<{ cells: string[]; total?: boolean }> = isExpenses
        ? [
            ...expenses.map(item => ({
                cells: [
                    formatPdfDate(item.createdAt),
                    item.costTypeDescription || '—',
                    item.description || '—',
                    formatCurrency(item.value),
                ],
            })),
            {
                cells: [
                    `Totais (${expenses.length} lançamento${expenses.length === 1 ? '' : 's'})`,
                    '',
                    '',
                    formatCurrency(expenses.reduce((sum, item) => sum + item.value, 0)),
                ],
                total: true,
            },
        ]
        : (() => {
            const utilizationRows: Array<{ cells: string[]; total?: boolean }> = [];
            let gapTotal = 0;
            let kmTotal = 0;
            let valueTotal = 0;

            utilization.forEach((item, index) => {
                const previous = index > 0 ? utilization[index - 1] : null;
                const gap = previous && item.kmInitial > previous.kmFinal
                    ? item.kmInitial - previous.kmFinal
                    : 0;
                const visitValue = item.kmDiff * appropriatePerKm;
                gapTotal += gap;
                kmTotal += item.kmDiff;
                valueTotal += visitValue;

                if (gap > 0) {
                    utilizationRows.push({
                        cells: [
                            `${formatPdfDate(previous?.visitEndAt)} - ${formatPdfDate(item.visitStartAt)}`,
                            'Km não apontado',
                            formatNumber(previous!.kmFinal),
                            formatNumber(item.kmInitial),
                            `+${formatNumber(gap)}`,
                            '—',
                            '—',
                        ],
                    });
                }

                utilizationRows.push({
                    cells: [
                        formatPdfDate(item.visitStartAt),
                        item.visitMask || `#${item.ovId}`,
                        formatNumber(item.kmInitial),
                        formatNumber(item.kmFinal),
                        formatNumber(item.kmDiff),
                        formatCurrency(appropriatePerKm),
                        formatCurrency(visitValue),
                    ],
                });
            });

            utilizationRows.push({
                cells: [
                    `Totais · ${formatNumber(kmTotal)} Km apropriados${gapTotal ? ` · ${formatNumber(gapTotal)} Km não apontados` : ''}`,
                    '',
                    '',
                    '',
                    formatNumber(kmTotal),
                    '',
                    formatCurrency(valueTotal),
                ],
                total: true,
            });
            return utilizationRows;
        })();

    const handleExport = async () => {
        if (loading || disabled) return;
        setLoading(true);
        const toastId = toast.loading(`Gerando PDF de ${isExpenses ? 'despesas' : 'utilização'}...`);

        try {
            const logoBase64 = await getLogoBase64();
            const document = (
                <Document title={`${title} - ${vehicleName}`}>
                    <Page size="A4" orientation="landscape" style={styles.page}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>{title}</Text>
                                <Text style={styles.subtitle}>
                                    {vehicleName} · {vehiclePlates || 'Sem placa'} · Competência {competency}
                                </Text>
                            </View>
                            {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                        </View>
                        <View style={styles.table}>
                            <View style={[styles.row, styles.headerRow]} fixed>
                                {columns.map(column => (
                                    <Text
                                        key={column.label}
                                        style={[
                                            styles.cell,
                                            styles.headerCell,
                                            { width: column.width, textAlign: column.right ? 'right' : 'left' },
                                        ]}
                                    >
                                        {column.label}
                                    </Text>
                                ))}
                            </View>
                            {rows.map((row, rowIndex) => (
                                <View
                                    key={rowIndex}
                                    style={[styles.row, row.total ? styles.totalRow : {}]}
                                    wrap={false}
                                >
                                    {row.cells.map((cell, cellIndex) => (
                                        <Text
                                            key={`${rowIndex}-${cellIndex}`}
                                            style={[
                                                styles.cell,
                                                row.total ? styles.totalCell : {},
                                                {
                                                    width: columns[cellIndex].width,
                                                    textAlign: columns[cellIndex].right ? 'right' : 'left',
                                                },
                                            ]}
                                        >
                                            {cell}
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </Page>
                </Document>
            );
            const blob = await pdf(document).toBlob();
            const fileBase = vehicleName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            await FileUtils.downloadFile(blob, `${isExpenses ? 'despesas' : 'utilizacao'}-${fileBase}-${competency.replace('/', '-')}.pdf`);
            toast.success('PDF exportado com sucesso.', { id: toastId });
        } catch (error) {
            console.error('Erro ao exportar seção de custos de veículo:', error);
            toast.error('Não foi possível gerar o PDF.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PDFButton
            onClick={handleExport}
            loading={loading}
            disabled={disabled}
            title={`Exportar ${title.toLowerCase()} em PDF`}
        />
    );
};