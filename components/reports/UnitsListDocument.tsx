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
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

const fmtType = (unit: any) => {
    const type = fmt(unit.typeName);
    const subType = unit.subTypeName ? ` / ${unit.subTypeName}` : '';
    if (type === '—' && !subType) return '—';
    return `${type}${subType}`.trim().replace(/^— \/ /, '');
};

const fmtSystem = (unit: any) => {
    const system = fmt(unit.systemParentName);
    const subSystem = unit.systemName ? ` / ${unit.systemName}` : '';
    if (system === '—' && !subSystem) return '—';
    return `${system}${subSystem}`.trim().replace(/^— \/ /, '');
};

// Column widths — must sum to 100%
const COL = {
    descricao: '35%',
    sistema: '25%',
    endereco: '20%',
    uc: '10%',
    situacao: '10%',
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const UnitsListDocument = ({
    units,
    generatedAt,
    logoBase64,
    searchQuery
}: {
    units: any[];
    generatedAt?: string;
    logoBase64?: string;
    searchQuery?: string;
}) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Document title="Relatório de Unidades">
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Unidades</Text>
                            <Text style={styles.subtitle}>
                                {units.length} unidade(s)
                                {searchQuery ? ` • Filtro: "${searchQuery}"` : ''}
                            </Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>

                    {/* Table Header */}
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.descricao, paddingRight: 12 }]}>DESCRIÇÃO</Text>
                        <Text style={[styles.th, { width: COL.sistema, paddingRight: 12 }]}>SISTEMA / SUB-SISTEMA</Text>
                        <Text style={[styles.th, { width: COL.endereco, paddingRight: 12 }]}>ENDEREÇO</Text>
                        <Text style={[styles.th, { width: COL.uc, paddingRight: 12 }]}>UC</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÃO</Text>
                    </View>

                    {/* Table Rows */}
                    {units.map((u, idx) => (
                        <View
                            key={u.id || idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <View style={{ width: COL.descricao, paddingRight: 12 }}>
                                <Text style={styles.td}>{fmt(u.descriptionFull || u.description)}</Text>
                                {u.clientName ? (
                                    <Text style={[styles.td, { color: C.textMuted, marginTop: 1, fontSize: 5.5 }]}>
                                        {u.clientName}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={{ width: COL.sistema, paddingRight: 12 }}>
                                <Text style={styles.td}>{fmtSystem(u)}</Text>
                                {fmtType(u) ? (
                                    <Text style={[styles.td, { color: C.textMuted, marginTop: 1, fontSize: 5.5 }]}>
                                        {fmtType(u)}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={{ width: COL.endereco, paddingRight: 12 }}>
                                <Text style={styles.td}>{fmt(u.addressFull)}</Text>
                                {(u.latitude !== undefined && u.latitude !== null && u.longitude !== undefined && u.longitude !== null) ? (
                                    <Text style={[styles.td, { color: C.textMuted, marginTop: 1, fontSize: 5.5 }]}>
                                        ({u.latitude}, {u.longitude})
                                    </Text>
                                ) : null}
                            </View>
                            <Text style={[styles.td, { width: COL.uc, paddingRight: 12 }]}>{fmt(u.installationCodePowerSupply)}</Text>
                            <Text style={[styles.td, { width: COL.situacao }]}>{fmt(u.statusName)}</Text>
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
