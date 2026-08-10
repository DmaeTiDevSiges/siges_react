import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Asset, AssetAttribute } from '../../types';
import { formatDateTime } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
    primary: '#2563eb', // blue-600
    orange: '#f97316',  // orange-500
    bg: '#f8fafc',      // slate-50
    cardBg: '#ffffff',
    border: '#e2e8f0',  // slate-200
    text: '#0f172a',    // slate-900
    textMuted: '#64748b',// slate-500
    footerText: '#94a3b8',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: C.text,
        backgroundColor: C.bg,
    },
    
    // ── Asset Card ────────────────────────────────────────────────────────
    card: {
        backgroundColor: C.cardBg,
        borderRadius: 8,
        borderTopWidth: 4,
        borderTopColor: C.primary,
        padding: 16,
        marginBottom: 20,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    badgeContainer: {
        backgroundColor: C.orange,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    badgeDate: {
        color: '#ffffff',
        fontSize: 6,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    iconWrap: {
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        padding: 4,
    },
    iconText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94a3b8',
        fontFamily: 'Helvetica-Bold',
    },
    assetTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: C.text,
        textTransform: 'uppercase',
        marginBottom: 12,
        fontFamily: 'Helvetica-Bold',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoCol: {
        flexDirection: 'column',
        marginRight: 10,
    },
    infoLabel: {
        fontSize: 6,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 2,
        fontFamily: 'Helvetica-Bold',
    },
    infoValue: {
        fontSize: 8,
        color: C.text,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
    },

    // ── Technical Data ──────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 10,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        fontFamily: 'Helvetica-Bold',
    },
    grid: {
        backgroundColor: C.cardBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: 'row',
        flexWrap: 'wrap',
        overflow: 'hidden',
    },
    gridCellHalf: {
        width: '50%',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    gridCellFull: {
        width: '100%',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    cellLabel: {
        fontSize: 6,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
    },
    cellValue: {
        fontSize: 9,
        color: C.text,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
    },
    cellTextGroup: {
         flexDirection: 'row',
         borderBottomWidth: 1,
         borderBottomColor: C.border,
    },
    cellTextGroupLast: {
         flexDirection: 'row',
    },
    obsText: {
        fontSize: 8,
        color: C.textMuted,
        fontStyle: 'italic',
        lineHeight: 1.4,
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 6,
    },
    footerText: { fontSize: 7, color: C.footerText },
});

export interface AssetDetailsDocumentProps {
    asset: Asset;
    attributes: AssetAttribute[];
    attributeValues: Record<string, string>;
    generatedAt?: string;
}

export const AssetDetailsDocument = ({ asset, attributes, attributeValues, generatedAt }: AssetDetailsDocumentProps) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const unitDesc = asset.unitDescriptionFull || asset.location || "Não informada";
    const system = [asset.tagName, asset.tagSubName]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(' - ') || "Sem Tag";
    const assetLocation = asset.location || "N/I";
    const clientName = asset.clientName || "(CLIENTE NÃO INFORMADO)";
    const date = formatDateTime(asset.statusAt);

    return (
        <Document title={`Ficha Técnica - ${asset.code || asset.id}`}>
            <Page size="A4" orientation="portrait" style={styles.page}>
                
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{asset.code || asset.id}</Text>
                            <Text style={styles.badgeDate}>REG  {date || '--/--/----'}</Text>
                        </View>
                        {/* We could render typeCode here if available, fallback to M1 */}
                        <View style={styles.iconWrap}>
                            <Text style={styles.iconText}>AT</Text>
                        </View>
                    </View>

                    <Text style={styles.assetTitle}>{asset.description}</Text>

                    <View style={styles.infoRow}>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Unidade</Text>
                            <Text style={styles.infoValue}>{clientName}</Text>
                            <Text style={styles.infoValue}>{unitDesc}</Text>
                        </View>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Setor - Posição</Text>
                            <Text style={styles.infoValue}>{system}</Text>
                        </View>
                        <View style={[styles.infoCol, { flex: 1, alignItems: 'flex-end', marginRight: 0 }]}>
                            <Text style={styles.infoLabel}>Localização</Text>
                            <Text style={styles.infoValue}>{assetLocation}</Text>
                        </View>
                    </View>
                </View>

                {attributes.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>Dados Técnicos</Text>
                        <View style={styles.grid}>
                            {attributes.map((attr, idx) => {
                                const val = attributeValues[attr.fieldKey];
                                const displayValue = val ? (attr.dataType === 'boolean' ? (val === 'true' ? 'Sim' : 'Não') : val) : '-';
                                const label = attr.unit ? `${attr.label} (${attr.unit})` : attr.label;
                                
                                // To alternate full row vs half rows could be tricky without CSS grid,
                                // Let's simplify and make all items take 50% width by default, 
                                // or if colSpan > 6 then 100% width.
                                const isFull = (attr.colSpan || 6) > 6;
                                const isLast = idx === attributes.length - 1;

                                return (
                                    <View key={attr.id} style={[isFull ? styles.gridCellFull : styles.gridCellHalf, isLast ? { borderBottomWidth: 0 } : {}]}>
                                        <Text style={styles.cellLabel}>{label}</Text>
                                        <Text style={styles.cellValue}>{displayValue}</Text>
                                    </View>
                                );
                            })}
                            
                            {/* Always append observations at the end of the grid */}
                            <View style={[styles.gridCellFull, { borderBottomWidth: 0 }]}>
                                <Text style={styles.cellLabel}>Observações</Text>
                                <Text style={styles.obsText}>
                                    {asset.comments || 'Nenhuma observação cadastrada para este equipamento.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

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
