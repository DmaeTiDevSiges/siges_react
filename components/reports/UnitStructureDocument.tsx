import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { UnitStructurePdfRow } from '../../utils/unitStructurePdfRows';

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
    statBg: '#EBF5FB',
    statLabel: '#5B7C99',
    available: '#059669',
    unavailable: '#DC2626',
    noRecord: '#94A3B8',
    noRecordDot: '#CBD5E1',
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
    headerContainer: { marginBottom: 8 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: { fontSize: 13, fontWeight: 'bold', color: C.primary },
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    subtitleStrong: { fontSize: 8.5, fontWeight: 'bold', color: C.text, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 5,
    },

    // ── Summary stats ───────────────────────────────────────────────────────
    statsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    statBox: {
        flexGrow: 1,
        backgroundColor: C.statBg,
        borderRadius: 4,
        paddingVertical: 5,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    statValue: { fontSize: 12, fontWeight: 'bold', color: C.primary },
    statLabel: { fontSize: 5.5, color: C.statLabel, textTransform: 'uppercase', marginTop: 1 },

    // ── Legend ──────────────────────────────────────────────────────────────
    legend: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    legendDot: { width: 6, height: 6, borderRadius: 3 },
    legendText: { fontSize: 6, color: C.textMuted },

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
export interface UnitStructureRow extends UnitStructurePdfRow {}

// ---------------------------------------------------------------------------
// Column widths — must sum to 100%
// ---------------------------------------------------------------------------
const COL = {
    setor: '32%',
    superior: '20%',
    codigo: '10%',
    nivel: '8%',
    subordinados: '12%',
    situacao: '18%',
};

const situationOf = (isAvailable: boolean | null) => {
    if (isAvailable === true) return { label: 'Disponível', color: C.available, dot: C.available };
    if (isAvailable === false) return { label: 'Indisponível', color: C.unavailable, dot: C.unavailable };
    return { label: 'Sem registro', color: C.noRecord, dot: C.noRecordDot };
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const UnitStructureDocument = ({
    unitName,
    unitDescription,
    rows,
    generatedAt,
    logoBase64,
}: {
    unitName: string;
    /** descrição completa da unidade (description_full), quando disponível */
    unitDescription?: string;
    rows: UnitStructureRow[];
    generatedAt?: string;
    logoBase64?: string;
}) => {
    const now = new Date();
    const genStr =
        generatedAt ||
        `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now
            .getHours()
            .toString()
            .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Setores únicos (exclui ocorrências de vínculo secundário/alias)
    const primaryRows = rows.filter(r => !r.isAlias);
    const aliasCount = rows.length - primaryRows.length;
    const levels = primaryRows.reduce((max, r) => Math.max(max, r.depth), 0) + 1;
    const available = primaryRows.filter(r => r.isAvailable === true).length;
    const unavailable = primaryRows.filter(r => r.isAvailable === false).length;
    const noRecord = primaryRows.filter(r => r.isAvailable === null).length;

    const mainSubtitle = unitDescription || unitName || 'Unidade';
    const summaryLine = [
        `${primaryRows.length} setor(es)`,
        aliasCount > 0 ? `${aliasCount} vínculo(s) secundário(s)` : null,
        `${levels} nível(is) de hierarquia`,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Document title={`Organograma - ${unitName || 'Unidade'}`}>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Organograma da Unidade</Text>
                            <Text style={styles.subtitleStrong}>{mainSubtitle}</Text>
                            <Text style={styles.subtitle}>{summaryLine}</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* SUMMARY */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{primaryRows.length}</Text>
                        <Text style={styles.statLabel}>Setores</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{levels}</Text>
                        <Text style={styles.statLabel}>Níveis</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: C.available }]}>{available}</Text>
                        <Text style={styles.statLabel}>Disponíveis</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: C.unavailable }]}>{unavailable}</Text>
                        <Text style={styles.statLabel}>Indisponíveis</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: C.textMuted }]}>{noRecord}</Text>
                        <Text style={styles.statLabel}>Sem registro</Text>
                    </View>
                </View>

                {/* LEGEND */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: C.available }]} />
                        <Text style={styles.legendText}>Disponível</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: C.unavailable }]} />
                        <Text style={styles.legendText}>Indisponível</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: C.noRecordDot }]} />
                        <Text style={styles.legendText}>Sem registro</Text>
                    </View>
                </View>

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeaderRow} fixed>
                        <Text style={[styles.th, { width: COL.setor }]}>SETOR</Text>
                        <Text style={[styles.th, { width: COL.superior }]}>SETOR SUPERIOR</Text>
                        <Text style={[styles.th, { width: COL.codigo }]}>CÓDIGO</Text>
                        <Text style={[styles.th, { width: COL.nivel }]}>NÍVEL</Text>
                        <Text style={[styles.th, { width: COL.subordinados }]}>SUBORDINADOS</Text>
                        <Text style={[styles.th, { width: COL.situacao }]}>SITUAÇÃO</Text>
                    </View>

                    {rows.map((r, idx) => {
                        const situation = situationOf(r.isAvailable);
                        return (
                            <View
                                key={`${r.depth}-${idx}`}
                                style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            >
                                <View style={{ width: COL.setor, flexDirection: 'row', alignItems: 'center' }}>
                                    <View
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: situation.dot,
                                            marginRight: 3,
                                            marginLeft: r.depth * 10,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Text
                                        style={[
                                            styles.td,
                                            { fontWeight: r.depth === 0 && !r.isAlias ? 'bold' : 'normal' },
                                        ]}
                                    >
                                        {r.depth > 0 ? '└ ' : ''}
                                        {r.name}
                                        {r.isAlias ? ' (vínculo secundário)' : ''}
                                    </Text>
                                </View>
                                <Text style={[styles.td, { width: COL.superior, color: r.parentName ? C.text : C.textMuted }]}>
                                    {r.parentName || 'Nível principal'}
                                </Text>
                                <Text style={[styles.td, { width: COL.codigo }]}>{r.code || '—'}</Text>
                                <Text style={[styles.td, { width: COL.nivel }]}>{r.depth + 1}</Text>
                                <Text style={[styles.td, { width: COL.subordinados }]}>
                                    {r.isAlias ? '—' : r.subSectors}
                                </Text>
                                <Text style={[styles.td, { width: COL.situacao, color: situation.color }]}>
                                    {situation.label}
                                </Text>
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
