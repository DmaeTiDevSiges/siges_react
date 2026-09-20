import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
    primary: '#003B71',
    headerBg: '#003B71',
    headerText: '#FFFFFF',
    border: '#D1D5DB',
    text: '#1F2937',
    textMuted: '#6B7280',
    footerText: '#A0B4CC',
    groupBg: '#EBF5FB',
    groupBorder: '#003B71',
    alertRowEven: '#F8FAFC',
    alertRowOdd: '#FFFFFF',
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
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText, paddingHorizontal: 6 },
    td: { fontSize: 6.5, color: C.text, paddingHorizontal: 6 },

    // ── Group Header ────────────────────────────────────────────────────────
    groupHeader: {
        flexDirection: 'row',
        backgroundColor: C.groupBg,
        paddingVertical: 4,
        paddingHorizontal: 2,
        borderTopWidth: 1,
        borderTopColor: C.groupBorder,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    groupTd: { fontSize: 6.5, fontWeight: 'bold', color: C.primary, paddingHorizontal: 6 },
    groupSub: { fontSize: 6, color: C.textMuted, marginTop: 1, paddingHorizontal: 6 },

    // ── Alert Row ───────────────────────────────────────────────────────────
    alertRow: {
        flexDirection: 'row',
        paddingVertical: 3,
        paddingHorizontal: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
        paddingLeft: 6,
    },
    alertRowEven: { backgroundColor: C.alertRowEven },
    alertRowOdd: { backgroundColor: C.alertRowOdd },
    alertTd: { fontSize: 6.5, color: C.text, paddingHorizontal: 6 },
    alertTdDesc: { fontSize: 6.5, color: C.text, paddingLeft: 10, paddingRight: 6 },

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
export interface AssetAlertListRow {
    assetCode?: string;
    assetDescription?: string;
    unitDescription?: string;
    tagStr?: string;
    priorityName?: string;
    orderTypeName?: string;
    description?: string;
    isDone?: boolean;
    createdAt?: string;
    resolvedAt?: string;
    location?: string;
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
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return val; }
};

// Column widths — must sum to 100%
// ATIVO and ALERTA/DESCRIÇÃO are flexible, the rest are fixed to the right
const COL = {
    ativo: '28%',
    alerta: '38%',
    prioridade: '14%',
    situacao: '10%',
    data: '10%',
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const AssetsAlertsListDocument = ({ alerts, generatedAt, logoBase64, titleStr = 'Relatório de Alertas de Ativos' }: { alerts: AssetAlertListRow[]; generatedAt?: string; logoBase64?: string; titleStr?: string }) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Group alerts by assetCode + unitDescription + tagStr
    const groups = React.useMemo(() => {
        const map = new Map<string, { key: string; assetCode?: string; assetDescription?: string; unitDescription?: string; tagStr?: string; location?: string; alerts: AssetAlertListRow[] }>();
        for (const a of alerts) {
            const groupKey = `${a.assetCode || ''}|${a.unitDescription || ''}|${a.tagStr || ''}`;
            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    key: groupKey,
                    assetCode: a.assetCode,
                    assetDescription: a.assetDescription,
                    unitDescription: a.unitDescription,
                    tagStr: a.tagStr,
                    location: a.location,
                    alerts: [],
                });
            }
            map.get(groupKey)!.alerts.push(a);
        }
        return Array.from(map.values());
    }, [alerts]);

    const totalGroups = groups.length;

    return (
        <Document title={titleStr}>
            <Page size="A4" orientation="landscape" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{titleStr}</Text>
                            <Text style={styles.subtitle}>{alerts.length} alerta(s) em {totalGroups} ativo(s)</Text>
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
                        <Text style={[styles.th, { width: COL.alerta }]}>ALERTA / DESCRIÇÃO</Text>
                        <Text style={[styles.th, { width: COL.prioridade }]}>PRIORIDADE / TIPO</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÃO</Text>
                        <Text style={[styles.th, { width: COL.data }]}>DATA</Text>
                    </View>

                    {/* Grouped Rows */}
                    {groups.map((group, gIdx) => {
                        const ativoStr = group.assetCode ? `${group.assetCode} - ${group.assetDescription || ''}` : (group.assetDescription || '—');
                        const subLine = [group.unitDescription, group.tagStr].filter(Boolean).join(' › ');

                        return (
                            <View key={gIdx} wrap={false}>
                                {/* Group Header Row */}
                                <View style={styles.groupHeader}>
                                    <View style={{ width: COL.ativo }}>
                                        <Text style={styles.groupTd}>{fmt(ativoStr)}</Text>
                                        {subLine ? <Text style={styles.groupSub}>{subLine}</Text> : null}
                                        {group.location ? <Text style={styles.groupSub}>{group.location}</Text> : null}
                                    </View>
                                    <Text style={[styles.groupTd, { width: COL.alerta + COL.prioridade + COL.situacao + COL.data }]}>
                                        {group.alerts.length} alerta(s)
                                    </Text>
                                </View>

                                {/* Alert sub-rows */}
                                {group.alerts.map((a, aIdx) => {
                                    const prioTypeStr = `${fmt(a.priorityName)}\n${fmt(a.orderTypeName, '')}`;
                                    return (
                                        <View
                                            key={aIdx}
                                            style={[styles.alertRow, aIdx % 2 === 0 ? styles.alertRowEven : styles.alertRowOdd]}
                                        >
                                            <Text style={[styles.td, { width: COL.ativo }]} />
                                            <Text style={[styles.alertTdDesc, { width: COL.alerta }]}>{fmt(a.description)}</Text>
                                            <Text style={[styles.alertTd, { width: COL.prioridade }]}>{prioTypeStr.trim()}</Text>
                                            <Text style={[styles.alertTd, { width: COL.situacao }]}>{a.isDone ? 'Resolvido' : 'Aberto'}</Text>
                                            <Text style={[styles.alertTd, { width: COL.data }]}>{a.isDone ? fmtDate(a.resolvedAt) : fmtDate(a.createdAt)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
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
