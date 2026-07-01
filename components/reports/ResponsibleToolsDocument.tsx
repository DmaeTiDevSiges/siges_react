import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { UserTool } from '../../types';

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
    sectionBg: '#EBF5FB',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    page: {
        paddingTop: 25,
        paddingBottom: 55,
        paddingHorizontal: 25,
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
    title: { fontSize: 14, fontWeight: 'bold', color: C.primary },
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 8,
    },

    // ── Responsible Section ─────────────────────────────────────────────────
    responsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.sectionBg,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 2,
        marginBottom: 4,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: C.primary,
    },
    responsibleName: { fontSize: 9, fontWeight: 'bold', color: C.primary },
    responsibleCount: { fontSize: 7, color: C.textMuted },

    // ── Table ───────────────────────────────────────────────────────────────
    table: { width: '100%', marginBottom: 4 },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: C.headerBg,
        paddingVertical: 3,
        paddingHorizontal: 2,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 3,
        paddingHorizontal: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    tableRowEven: { backgroundColor: C.rowEven },
    tableRowOdd: { backgroundColor: C.rowOdd },
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText },
    td: { fontSize: 6.5, color: C.text },

    // ── Signature ───────────────────────────────────────────────────────────
    signatureContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    signatureLine: {
        width: 200,
        borderBottomWidth: 1,
        borderBottomColor: C.text,
        marginBottom: 4,
    },
    signatureLabel: { fontSize: 8, color: C.text },
    signatureDate: { fontSize: 7, color: C.textMuted, marginTop: 3 },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 25,
        left: 25,
        right: 25,
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
    codigo: '12%',
    material: '38%',
    marca: '14%',
    modelo: '14%',
    serial: '12%',
    data: '10%',
};

const fmtMaterial = (item: UserTool) => {
    const code = fmt(item.tool_material_code);
    const desc = fmt(item.tool_material_description);
    const unit = item.tool_material_unit ? ` (${item.tool_material_unit})` : '';
    if (code === '—' && desc === '—') return '—';
    return `${code} — ${desc}${unit}`;
};

const MaterialCell = ({ item }: { item: UserTool }) => {
    const code = fmt(item.tool_material_code);
    const desc = fmt(item.tool_material_description);
    const unit = item.tool_material_unit || '';
    if (code === '—' && desc === '—') return <Text style={[styles.td, { width: COL.material }]}>—</Text>;
    return (
        <Text style={[styles.td, { width: COL.material }]}>
            <Text style={{ fontWeight: 'bold' }}>{code}</Text>
            <Text> — {desc}{unit ? ` (${unit})` : ''}</Text>
        </Text>
    );
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const ResponsibleToolsDocument = ({
    userName,
    items,
    generatedAt,
    logoBase64,
}: {
    userName: string;
    items: UserTool[];
    generatedAt?: string;
    logoBase64?: string;
}) => {
    const sorted = [...items].sort((a, b) => (a.tool_material_description || '').localeCompare(b.tool_material_description || '', 'pt-BR'));
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const currentDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <Document title={`Ferramentas - ${userName}`}>
            <Page size="A4" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Ferramentas por Responsável</Text>
                            <Text style={styles.subtitle}>{userName} — {sorted.length} ferramenta(s)</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* RESPONSABLE HEADER */}
                <View style={styles.responsibleHeader}>
                    <Text style={styles.responsibleName}>{userName}</Text>
                    <Text style={styles.responsibleCount}>{sorted.length} ferramenta(s)</Text>
                </View>

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, { width: COL.codigo }]}>CÓDIGO</Text>
                        <Text style={[styles.th, { width: COL.material }]}>MATERIAL</Text>
                        <Text style={[styles.th, { width: COL.marca, textAlign: 'right' }]}>MARCA</Text>
                        <Text style={[styles.th, { width: COL.modelo, textAlign: 'right' }]}>MODELO</Text>
                        <Text style={[styles.th, { width: COL.serial, textAlign: 'right' }]}>SERIAL</Text>
                        <Text style={[styles.th, { width: COL.data, textAlign: 'right' }]}>DATA</Text>
                    </View>

                    {sorted.map((item, idx) => (
                        <View
                            key={item.id}
                            style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                            wrap={false}
                        >
                            <Text style={[styles.td, { width: COL.codigo }]}>{fmt(item.tool_code)}</Text>
                            <MaterialCell item={item} />
                            <Text style={[styles.td, { width: COL.marca, textAlign: 'right' }]}>{fmt(item.tool_brand)}</Text>
                            <Text style={[styles.td, { width: COL.modelo, textAlign: 'right' }]}>{fmt(item.tool_model)}</Text>
                            <Text style={[styles.td, { width: COL.serial, textAlign: 'right' }]}>{fmt(item.tool_serial)}</Text>
                            <Text style={[styles.td, { width: COL.data, textAlign: 'right' }]}>{fmtDate(item.date_start)}</Text>
                        </View>
                    ))}
                </View>

                {/* SIGNATURE */}
                <View style={styles.signatureContainer} wrap={false}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Assinatura do Responsável</Text>
                    <Text style={styles.signatureDate}>{currentDate}</Text>
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
