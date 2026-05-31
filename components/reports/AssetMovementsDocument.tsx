import React from 'react';
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
export interface AssetMovementRow {
    code?: string;
    description?: string;
    beforeClientName?: string;
    beforeUnitDescription?: string;
    beforeSector?: string;
    beforeStatus?: string;
    beforeDate?: string;
    afterClientName?: string;
    afterUnitDescription?: string;
    afterSector?: string;
    afterStatus?: string;
    afterDate?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

// Column widths — must sum to 100%
const COL = {
    ativo: '18%',
    origemUnidade: '15%',
    origemSetor: '15%',
    origemSituacaoData: '11%',
    destinoUnidade: '15%',
    destinoSetor: '15%',
    destinoSituacaoData: '11%',
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const AssetMovementsDocument = ({ assets, generatedAt, logoBase64 }: { assets: AssetMovementRow[]; generatedAt?: string; logoBase64?: string }) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Document title="Relatório de Movimentações de Ativos">
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Movimentações de Ativos</Text>
                            <Text style={styles.subtitle}>{assets.length} movimentação(ões)</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>

                    {/* Table Header */}
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.ativo }]}>ATIVO (CÓD. / DESCRIÇÃO)</Text>
                        <Text style={[styles.th, { width: COL.origemUnidade }]}>ORIGEM (UNIDADE)</Text>
                        <Text style={[styles.th, { width: COL.origemSetor }]}>ORIGEM (SETOR)</Text>
                        <Text style={[styles.th, { width: COL.origemSituacaoData }]}>ORIGEM (SIT. / DATA)</Text>
                        <Text style={[styles.th, { width: COL.destinoUnidade }]}>DESTINO (UNIDADE)</Text>
                        <Text style={[styles.th, { width: COL.destinoSetor }]}>DESTINO (SETOR)</Text>
                        <Text style={[styles.th, { width: COL.destinoSituacaoData }]}>DESTINO (SIT. / DATA)</Text>
                    </View>

                    {/* Table Rows */}
                    {assets.map((a, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <View style={[styles.td, { width: COL.ativo }]}>
                                <Text style={{ fontWeight: 'bold' }}>{fmt(a.code)}</Text>
                                <Text style={{ marginTop: 2 }}>{fmt(a.description)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.origemUnidade }]}>
                                <Text>{fmt(a.beforeClientName)}</Text>
                                <Text style={{ marginTop: 2 }}>{fmt(a.beforeUnitDescription)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.origemSetor }]}>
                                <Text>{fmt(a.beforeSector)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.origemSituacaoData }]}>
                                <Text>{fmt(a.beforeStatus)}</Text>
                                <Text style={{ marginTop: 2 }}>{fmt(a.beforeDate)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.destinoUnidade }]}>
                                <Text>{fmt(a.afterClientName)}</Text>
                                <Text style={{ marginTop: 2 }}>{fmt(a.afterUnitDescription)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.destinoSetor }]}>
                                <Text>{fmt(a.afterSector)}</Text>
                            </View>
                            <View style={[styles.td, { width: COL.destinoSituacaoData }]}>
                                <Text>{fmt(a.afterStatus)}</Text>
                                <Text style={{ marginTop: 2 }}>{fmt(a.afterDate)}</Text>
                            </View>
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
