import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// Colors (matching official app reports)
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
};

// Styles
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

    // Header
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

    // Table
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
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText },
    td: { fontSize: 6.2, color: C.text },
    tdBold: { fontSize: 6.5, fontWeight: 'bold', color: C.text },
    labelMuted: { fontSize: 5.5, color: C.textMuted, marginTop: 1 },

    // Footer
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

export interface MovementListRow {
    code?: string;
    description?: string;
    beforeClientName?: string;
    beforeUnitDescription?: string;
    beforeSector?: string;
    beforeStatusDescription?: string;
    beforeStatusAt?: string;
    afterClientName?: string;
    afterUnitDescription?: string;
    afterSector?: string;
    afterStatusDescription?: string;
    afterStatusAt?: string;
    movedComments?: string;
}

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

// Column widths summing to 100%
const COL = {
    ativo: '22%',
    origem: '28%',
    destino: '28%',
    situacao: '12%',
    dataObs: '10%',
};

export const MovementsListDocument = ({ movements, generatedAt, logoBase64 }: { movements: MovementListRow[]; generatedAt?: string; logoBase64?: string }) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Document title="Relatório de Movimentações de Ativos">
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Movimentação de Ativos</Text>
                            <Text style={styles.subtitle}>{movements.length} ativo(s) movimentado(s)</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>

                    {/* Table Header */}
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.ativo }]}>ATIVO</Text>
                        <Text style={[styles.th, { width: COL.origem }]}>ORIGEM</Text>
                        <Text style={[styles.th, { width: COL.destino }]}>DESTINO</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>TRANSIÇÃO SITUAÇÃO</Text>
                        <Text style={[styles.th, { width: COL.dataObs }]}>DATA / OBS</Text>
                    </View>

                    {/* Table Rows */}
                    {movements.map((m, idx) => (
                        <View
                            key={idx}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            {/* ATIVO */}
                            <View style={{ width: COL.ativo }}>
                                <Text style={styles.tdBold}>{fmt(m.code)}</Text>
                                <Text style={[styles.td, { color: C.textMuted }]}>{fmt(m.description)}</Text>
                            </View>

                            {/* ORIGEM */}
                            <View style={{ width: COL.origem }}>
                                <Text style={styles.tdBold}>
                                    {m.beforeClientName ? `${m.beforeClientName} - ` : ''}{fmt(m.beforeUnitDescription)}
                                </Text>
                                <Text style={styles.td}>{fmt(m.beforeSector)}</Text>
                            </View>

                            {/* DESTINO */}
                            <View style={{ width: COL.destino }}>
                                <Text style={styles.tdBold}>
                                    {m.afterClientName ? `${m.afterClientName} - ` : ''}{fmt(m.afterUnitDescription)}
                                </Text>
                                <Text style={styles.td}>{fmt(m.afterSector)}</Text>
                            </View>

                            {/* SITUAÇÃO (DE -> PARA) */}
                            <View style={{ width: COL.situacao }}>
                                <Text style={styles.td}>{fmt(m.beforeStatusDescription)}</Text>
                                <Text style={[styles.td, { color: C.primary, fontWeight: 'bold' }]}>
                                    → {fmt(m.afterStatusDescription)}
                                </Text>
                            </View>

                            {/* DATA / OBS */}
                            <View style={{ width: COL.dataObs }}>
                                <Text style={styles.tdBold}>{fmtDate(m.afterStatusAt || m.beforeStatusAt)}</Text>
                                {m.movedComments ? (
                                    <Text style={styles.labelMuted}>
                                        {m.movedComments}
                                    </Text>
                                ) : null}
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
