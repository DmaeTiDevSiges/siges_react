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
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText },
    td: { fontSize: 6.5, color: C.text },

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
export interface AssetListRow {
    unitDescriptionFull?: string;
    tagName?: string;
    tagSubName?: string;
    typeDescription?: string;
    code?: string;
    description?: string;
    statusDescription?: string;
    statusAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

const fmtDate = (val?: string) => {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return val; }
};

// Column widths — must sum to 100%
const COL = {
    unidade: '14%',
    setor: '14%',
    posicao: '14%',
    codigo: '6%',
    descricao: '22%',
    situacao: '10%',
    data: '10%',
    tipo: '10%',
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const AssetsListDocument = ({ assets, generatedAt, logoBase64 }: { assets: AssetListRow[]; generatedAt?: string; logoBase64?: string }) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Document title="Relatório de Ativos">
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Ativos</Text>
                            <Text style={styles.subtitle}>{assets.length} ativo(s)</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>

                    {/* Table Header */}
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.unidade }]}>UNIDADES</Text>
                        <Text style={[styles.th, { width: COL.setor }]}>SETORES</Text>
                        <Text style={[styles.th, { width: COL.posicao }]}>POSIÇÕES</Text>
                        <Text style={[styles.th, { width: COL.codigo }]}>CÓDIGOS</Text>
                        <Text style={[styles.th, { width: COL.descricao }]}>DESCRIÇÕES</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÕES</Text>
                        <Text style={[styles.th, { width: COL.data }]}>DATAS SITUAÇÕES</Text>
                        <Text style={[styles.th, { width: COL.tipo }]}>TIPOS</Text>
                    </View>

                    {/* Table Rows */}
                    {assets.map((a, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <Text style={[styles.td, { width: COL.unidade }]}>{fmt(a.unitDescriptionFull)}</Text>
                            <Text style={[styles.td, { width: COL.setor }]}>{fmt(a.tagName)}</Text>
                            <Text style={[styles.td, { width: COL.posicao }]}>{fmt(a.tagSubName)}</Text>
                            <Text style={[styles.td, { width: COL.codigo }]}>{fmt(a.code)}</Text>
                            <Text style={[styles.td, { width: COL.descricao }]}>{fmt(a.description)}</Text>
                            <Text style={[styles.td, { width: COL.situacao }]}>{fmt(a.statusDescription)}</Text>
                            <Text style={[styles.td, { width: COL.data }]}>{fmtDate(a.statusAt)}</Text>
                            <Text style={[styles.td, { width: COL.tipo }]}>{fmt(a.typeDescription)}</Text>
                        </View>
                    ))}
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
