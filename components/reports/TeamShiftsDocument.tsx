import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Colors (mesmo padrão dos demais documentos de relatório do projeto)
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
        fontSize: 8,
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
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 8,
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
        paddingVertical: 4,
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
    td: { fontSize: 7, color: C.text },
    tdRight: { fontSize: 7, color: C.text, textAlign: 'right' },
    tdTotal: { fontSize: 7, fontWeight: 'bold', color: C.totalText, textAlign: 'right' },
    tdTotalLabel: { fontSize: 7, fontWeight: 'bold', color: C.totalText },
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
export interface TeamShiftsReportRow {
    teamCode?: string;
    teamName: string;
    normalShifts: number;
    extraShifts: number;
    businessDays: number;
    /** Horas em visitas aprovadas, já formatadas (ex.: '32,5'). */
    approvedVisitHours: string;
    /** Horas de turno disponíveis no mês, já formatadas. */
    availableHours: string;
    /** Percentual 0–100. */
    idlePercent: number;
    note?: string;
}

// Column widths — must sum to 100%
const COL = {
    equipe: '20%',
    normais: '10%',
    extras: '9%',
    dias: '9%',
    visitas: '14%',
    disponivel: '14%',
    ociosidade: '10%',
    obs: '14%',
};

const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const TeamShiftsDocument = ({
    rows,
    periodLabel,
    generatedAt,
    logoBase64,
}: {
    rows: TeamShiftsReportRow[];
    periodLabel: string;
    generatedAt?: string;
    logoBase64?: string;
}) => {
    const now = new Date();
    const genStr =
        generatedAt ||
        `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const totals = rows.reduce(
        (acc, r) => ({
            normais: acc.normais + (r.normalShifts || 0),
            extras: acc.extras + (r.extraShifts || 0),
            visitas: acc.visitas + (parseFloat(String(r.approvedVisitHours).replace(',', '.')) || 0),
            disponivel: acc.disponivel + (parseFloat(String(r.availableHours).replace(',', '.')) || 0),
        }),
        { normais: 0, extras: 0, visitas: 0, disponivel: 0 }
    );
    const avgIdle =
        rows.length > 0 ? Math.round((rows.reduce((acc, r) => acc + (r.idlePercent || 0), 0) / rows.length) * 10) / 10 : 0;

    const fmtH = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return (
        <Document title="Relatório de Ociosidade das Equipes">
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Ociosidade das Equipes</Text>
                            <Text style={styles.subtitle}>
                                {periodLabel} · {rows.length} equipe(s)
                            </Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.equipe }]}>EQUIPE</Text>
                        <Text style={[styles.th, { width: COL.normais, textAlign: 'right' }]}>TURNOS NORM.</Text>
                        <Text style={[styles.th, { width: COL.extras, textAlign: 'right' }]}>TURNOS EXTRAS</Text>
                        <Text style={[styles.th, { width: COL.dias, textAlign: 'right' }]}>DIAS ÚTEIS</Text>
                        <Text style={[styles.th, { width: COL.visitas, textAlign: 'right' }]}>VISITAS APROV. (H)</Text>
                        <Text style={[styles.th, { width: COL.disponivel, textAlign: 'right' }]}>DISPONÍVEL (H)</Text>
                        <Text style={[styles.th, { width: COL.ociosidade, textAlign: 'right' }]}>OCIOSIDADE</Text>
                        <Text style={[styles.th, { width: COL.obs }]}>OBSERVAÇÃO</Text>
                    </View>

                    {rows.map((r, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <Text style={[styles.td, { width: COL.equipe, fontWeight: 'bold' }]}>
                                {fmt(r.teamCode)} — {fmt(r.teamName)}
                            </Text>
                            <Text style={[styles.tdRight, { width: COL.normais }]}>{r.normalShifts}</Text>
                            <Text style={[styles.tdRight, { width: COL.extras }]}>{r.extraShifts}</Text>
                            <Text style={[styles.tdRight, { width: COL.dias }]}>{r.businessDays}</Text>
                            <Text style={[styles.tdRight, { width: COL.visitas }]}>{fmt(r.approvedVisitHours)}</Text>
                            <Text style={[styles.tdRight, { width: COL.disponivel }]}>{fmt(r.availableHours)}</Text>
                            <Text style={[styles.tdRight, { width: COL.ociosidade, fontWeight: 'bold' }]}>
                                {String(r.idlePercent).replace('.', ',')}%
                            </Text>
                            <Text style={[styles.td, { width: COL.obs }]}>{fmt(r.note, '')}</Text>
                        </View>
                    ))}

                    {/* TOTAL ROW */}
                    <View style={styles.tableTotalRow}>
                        <Text style={[styles.tdTotalLabel, { width: COL.equipe }]}>TOTAIS / MÉDIA</Text>
                        <Text style={[styles.tdTotal, { width: COL.normais }]}>{totals.normais}</Text>
                        <Text style={[styles.tdTotal, { width: COL.extras }]}>{totals.extras}</Text>
                        <Text style={[styles.tdTotal, { width: COL.dias }]}>—</Text>
                        <Text style={[styles.tdTotal, { width: COL.visitas }]}>{fmtH(totals.visitas)}</Text>
                        <Text style={[styles.tdTotal, { width: COL.disponivel }]}>{fmtH(totals.disponivel)}</Text>
                        <Text style={[styles.tdTotal, { width: COL.ociosidade }]}>{String(avgIdle).replace('.', ',')}%</Text>
                        <Text style={[styles.tdTotal, { width: COL.obs }]}> </Text>
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>SIGES · Ociosidade das Equipes</Text>
                    <Text style={styles.footerText}>Gerado em {genStr}</Text>
                </View>
            </Page>
        </Document>
    );
};
