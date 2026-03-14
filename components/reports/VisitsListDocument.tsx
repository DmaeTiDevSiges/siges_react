import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
    primary: '#003B71',
    headerBg: '#003B71',
    headerText: '#FFFFFF',
    rowEven: '#F7FAFC',
    rowOdd: '#FFFFFF',
    border: '#D1D5DB',
    text: '#1F2937',
    textMuted: '#6B7280',
    footerText: '#A0B4CC',
    totalRow: '#EBF5FB',
    totalText: '#003B71',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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

    // ── Header ──────────────────────────────────────────────────────────────
    headerContainer: { marginBottom: 0 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: { fontSize: 13, fontWeight: 'bold', color: C.primary },
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 5,
    },

    // ── Table ───────────────────────────────────────────────────────────────
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

    // ── Footer ───────────────────────────────────────────────────────────────
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface VisitListRow {
    ovMask?: string;
    ovStartedAt?: string;
    ovEndedAt?: string;
    contractDescription?: string;
    orderMask?: string;
    typeCode?: string;
    typeSubCode?: string;
    unitDescription?: string;
    sectorDescription?: string;
    statusDescription?: string;
    processingDescription?: string;
    materialsValue?: number;
    vehiclesValue?: number;
    servicesValue?: number;
    totalValue?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

const fmtDateTime = (val?: string) => {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return val; }
};

const fmtCurrency = (val: any) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '0,00';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Column widths — must sum to 100%
const COL = {
    ov: '7%',
    periodo: '10%',
    contrato: '8%',
    os: '7%',
    osTipo: '4.5%',
    osTipoSub: '4.5%',
    unidade: '15%',
    setor: '8%',
    situacao: '7%',
    processamento: '8%',
    materiais: '6%',
    transportes: '6%',
    servicos: '6%',
    total: '7%',
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const VisitsListDocument = ({ visits, generatedAt, logoBase64 }: { visits: VisitListRow[]; generatedAt?: string; logoBase64?: string }) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Totals
    const totals = visits.reduce(
        (acc, v) => ({
            materiais: acc.materiais + (v.materialsValue || 0),
            transportes: acc.transportes + (v.vehiclesValue || 0),
            servicos: acc.servicos + (v.servicesValue || 0),
            total: acc.total + (v.totalValue || 0),
        }),
        { materiais: 0, transportes: 0, servicos: 0, total: 0 }
    );

    return (
        <Document title="Relatório de Visitas">
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Visitas</Text>
                            <Text style={styles.subtitle}>{visits.length} visita(s)</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>

                    {/* Table Header - fixed for repeat on every page */}
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.ov }]}>VISITA</Text>
                        <Text style={[styles.th, { width: COL.periodo }]}>INÍCIO / FIM</Text>
                        <Text style={[styles.th, { width: COL.contrato }]}>CONTRATO</Text>
                        <Text style={[styles.th, { width: COL.os }]}>OS</Text>
                        <Text style={[styles.th, { width: COL.osTipo }]}>TIPO</Text>
                        <Text style={[styles.th, { width: COL.osTipoSub }]}>SUB</Text>
                        <Text style={[styles.th, { width: COL.unidade }]}>UNIDADE</Text>
                        <Text style={[styles.th, { width: COL.setor }]}>SETOR</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÃO</Text>
                        <Text style={[styles.th, { width: COL.processamento }]}>PROCESSAMENTO</Text>
                        <Text style={[styles.th, { width: COL.materiais, textAlign: 'right' }]}>MATERIAIS</Text>
                        <Text style={[styles.th, { width: COL.transportes, textAlign: 'right' }]}>TRANSP.</Text>
                        <Text style={[styles.th, { width: COL.servicos, textAlign: 'right' }]}>SERVIÇOS</Text>
                        <Text style={[styles.th, { width: COL.total, textAlign: 'right' }]}>TOTAL</Text>
                    </View>

                    {/* Table Rows */}
                    {visits.map((v, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            {/* Col 1: OV Mask */}
                            <Text style={[styles.td, { width: COL.ov, fontWeight: 'bold' }]}>{fmt(v.ovMask)}</Text>
                            {/* Col 2: Período — início on top, fim below */}
                            <View style={{ width: COL.periodo, flexDirection: 'column' }}>
                                <Text style={styles.td}>{fmtDateTime(v.ovStartedAt)}</Text>
                                <Text style={[styles.td, { color: '#6B7280', marginTop: 1 }]}>{fmtDateTime(v.ovEndedAt)}</Text>
                            </View>
                            <Text style={[styles.td, { width: COL.contrato }]}>{fmt(v.contractDescription)}</Text>
                            <Text style={[styles.td, { width: COL.os }]}>{fmt(v.orderMask)}</Text>
                            <Text style={[styles.td, { width: COL.osTipo }]}>{fmt(v.typeCode)}</Text>
                            <Text style={[styles.td, { width: COL.osTipoSub }]}>{fmt(v.typeSubCode)}</Text>
                            <Text style={[styles.td, { width: COL.unidade }]}>{fmt(v.unitDescription)}</Text>
                            <Text style={[styles.td, { width: COL.setor }]}>{fmt(v.sectorDescription)}</Text>
                            <Text style={[styles.td, { width: COL.situacao }]}>{fmt(v.statusDescription)}</Text>
                            <Text style={[styles.td, { width: COL.processamento }]}>{fmt(v.processingDescription)}</Text>
                            <Text style={[styles.tdRight, { width: COL.materiais }]}>{fmtCurrency(v.materialsValue)}</Text>
                            <Text style={[styles.tdRight, { width: COL.transportes }]}>{fmtCurrency(v.vehiclesValue)}</Text>
                            <Text style={[styles.tdRight, { width: COL.servicos }]}>{fmtCurrency(v.servicesValue)}</Text>
                            <Text style={[styles.tdRight, { width: COL.total }]}>{fmtCurrency(v.totalValue)}</Text>
                        </View>
                    ))}

                    {/* Totals Row */}
                    {visits.length > 0 ? (
                        <View style={styles.tableTotalRow} wrap={false}>
                            <Text style={[styles.tdTotalLabel, { width: COL.ov }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.periodo }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.contrato }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.os }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.osTipo }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.osTipoSub }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.unidade }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.setor }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.situacao }]}> </Text>
                            <Text style={[styles.tdTotalLabel, { width: COL.processamento }]}>TOTAIS</Text>
                            <Text style={[styles.tdTotal, { width: COL.materiais }]}>{fmtCurrency(totals.materiais)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.transportes }]}>{fmtCurrency(totals.transportes)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.servicos }]}>{fmtCurrency(totals.servicos)}</Text>
                            <Text style={[styles.tdTotal, { width: COL.total }]}>{fmtCurrency(totals.total)}</Text>
                        </View>
                    ) : null}
                </View>

                {/* FOOTER */}
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
