import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const C = {
    primary: '#003B71',
    headerBg: '#003B71',
    headerText: '#FFFFFF',
    rowEven: '#F7FAFC',
    rowOdd: '#FFFFFF',
    border: '#D1D5DB',
    text: '#1F2937',
    footerText: '#A0B4CC',
    totalRow: '#EBF5FB',
    totalText: '#003B71',
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 25,
        paddingBottom: 45,
        paddingHorizontal: 20,
        fontSize: 7,
        fontFamily: 'Helvetica',
        color: C.text,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: { marginBottom: 0 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: { fontSize: 13, fontWeight: 'bold', color: C.primary },
    subtitle: { fontSize: 7, color: '#6B7280', marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 5,
    },
    table: { width: '100%' },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: C.headerBg,
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 3.5,
        paddingHorizontal: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    tableRowEven: { backgroundColor: C.rowEven },
    tableRowOdd: { backgroundColor: C.rowOdd },
    tableTotalRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 2,
        backgroundColor: C.totalRow,
        borderTopWidth: 1.5,
        borderTopColor: C.primary,
        marginTop: 2,
    },
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText },
    td: { fontSize: 6.5, color: C.text },
    tdRight: { fontSize: 6.5, color: C.text, textAlign: 'right' },
    tdTotal: { fontSize: 6.5, fontWeight: 'bold', color: C.totalText, textAlign: 'right' },
    tdTotalLabel: { fontSize: 6.5, fontWeight: 'bold', color: C.totalText },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: C.primary,
        paddingTop: 6,
    },
    footerText: { fontSize: 6.5, color: C.footerText },
});

/** Uma linha por veículo da aba Custos Mensais (valores já calculados na tela). */
export interface VehicleCostRow {
    description: string;
    plates: string;
    company: string;
    status: string;
    hasConflict: boolean;
    rentalValue: number;
    expensesValue: number;
    rentalPerKm: number;
    expensesPerKm: number;
    fixedPerKm?: number | null;
    gapKm: number;
    totalKm: number;
    allocatedValue: number;
}

const fmt = (val: unknown, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

const fmtNumber = (val: number | null | undefined) => {
    const n = Number(val);
    if (!isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

const fmtCurrency = (val: number | null | undefined) => {
    const n = Number(val);
    if (!isFinite(n)) return '0,00';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Column widths — must sum to 100%
const COL = {
    veiculo: '16%',
    placa: '9%',
    empresa: '12%',
    situacao: '8%',
    aluguel: '8%',
    despesas: '8%',
    aluguelKm: '7%',
    despesasKm: '7%',
    fixoKm: '7%',
    kmNao: '6%',
    km: '6%',
    apropriados: '6%',
};

export const VehiclesCostsDocument = ({
    rows,
    competency,
    logoBase64,
}: {
    rows: VehicleCostRow[];
    competency?: string;
    logoBase64?: string;
}) => {
    const now = new Date();
    const genStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const totals = rows.reduce(
        (acc, r) => ({
            rentalValue: acc.rentalValue + (r.rentalValue || 0),
            expensesValue: acc.expensesValue + (r.expensesValue || 0),
            gapKm: acc.gapKm + (r.gapKm || 0),
            totalKm: acc.totalKm + (r.totalKm || 0),
            allocatedValue: acc.allocatedValue + (r.allocatedValue || 0),
        }),
        { rentalValue: 0, expensesValue: 0, gapKm: 0, totalKm: 0, allocatedValue: 0 }
    );

    return (
        <Document title="Custos Mensais de Veículos">
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Custos Mensais de Veículos</Text>
                            <Text style={styles.subtitle}>
                                {competency ? `Competência ${competency} · ` : ''}{rows.length} veículo(s)
                            </Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.veiculo }]}>VEÍCULO</Text>
                        <Text style={[styles.th, { width: COL.placa }]}>PLACA</Text>
                        <Text style={[styles.th, { width: COL.empresa }]}>EMPRESA</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÃO</Text>
                        <Text style={[styles.th, { width: COL.aluguel, textAlign: 'right' }]}>R$ ALUGUEL</Text>
                        <Text style={[styles.th, { width: COL.despesas, textAlign: 'right' }]}>R$ DESPESAS</Text>
                        <Text style={[styles.th, { width: COL.aluguelKm, textAlign: 'right' }]}>R$ ALUG/KM</Text>
                        <Text style={[styles.th, { width: COL.despesasKm, textAlign: 'right' }]}>R$ DESP/KM</Text>
                        <Text style={[styles.th, { width: COL.fixoKm, textAlign: 'right' }]}>R$ FIXO/KM</Text>
                        <Text style={[styles.th, { width: COL.kmNao, textAlign: 'right' }]}>KM NÃO APROP.</Text>
                        <Text style={[styles.th, { width: COL.km, textAlign: 'right' }]}>KM APROP.</Text>
                        <Text style={[styles.th, { width: COL.apropriados, textAlign: 'right' }]}>R$ APROPR.</Text>
                    </View>

                    {rows.map((r, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <Text style={[styles.td, { width: COL.veiculo, fontWeight: 'bold' }]}>{fmt(r.description)}</Text>
                            <Text style={[styles.td, { width: COL.placa, fontFamily: 'Courier' }]}>{fmt(r.plates)}</Text>
                            <Text style={[styles.td, { width: COL.empresa }]}>{fmt(r.company)}</Text>
                            <Text style={[styles.td, { width: COL.situacao }]}>
                                {fmt(r.status)}{r.hasConflict ? ' (conflito)' : ''}
                            </Text>
                            <Text style={[styles.tdRight, { width: COL.aluguel }]}>{fmtCurrency(r.rentalValue)}</Text>
                            <Text style={[styles.tdRight, { width: COL.despesas }]}>{fmtCurrency(r.expensesValue)}</Text>
                            <Text style={[styles.tdRight, { width: COL.aluguelKm }]}>{r.rentalPerKm > 0 ? fmtCurrency(r.rentalPerKm) : '—'}</Text>
                            <Text style={[styles.tdRight, { width: COL.despesasKm }]}>{r.expensesPerKm > 0 ? fmtCurrency(r.expensesPerKm) : '—'}</Text>
                            <Text style={[styles.tdRight, { width: COL.fixoKm }]}>{r.fixedPerKm != null ? fmtCurrency(r.fixedPerKm) : '—'}</Text>
                            <Text style={[styles.tdRight, { width: COL.kmNao }]}>{fmtNumber(r.gapKm)}</Text>
                            <Text style={[styles.tdRight, { width: COL.km }]}>{fmtNumber(r.totalKm)}</Text>
                            <Text style={[styles.tdRight, { width: COL.apropriados }]}>{fmtCurrency(r.allocatedValue)}</Text>
                        </View>
                    ))}

                    {rows.length > 0 ? (
                        <View style={styles.tableTotalRow} wrap={false}>
                            <Text style={[styles.tdTotalLabel, { width: COL.veiculo }]}>TOTAIS</Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.placa }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.empresa }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.situacao }]}> </Text>
                            <Text style={[styles.tdTotal, { width: COL.aluguel }]}>{fmtCurrency(totals.rentalValue)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.despesas }]}>{fmtCurrency(totals.expensesValue)}</Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.aluguelKm }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.despesasKm }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.fixoKm }]}> </Text>
                            <Text style={[styles.tdTotal, { width: COL.kmNao }]}>{fmtNumber(totals.gapKm)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.km }]}>{fmtNumber(totals.totalKm)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.apropriados }]}>{fmtCurrency(totals.allocatedValue)}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado em {genStr}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};
