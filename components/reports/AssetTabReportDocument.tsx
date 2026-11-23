import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Asset } from '../../types';
import { formatDateTime } from '../../utils/formatters';

// Documento genérico das abas do Detalhe do Ativo (Alertas, Empréstimos, Atividades,
// Manuais, Componentes): cabeçalho do ativo + uma ou mais tabelas. Cada aba só monta
// as seções; o layout fica num lugar só.

const C = {
    primary: '#2563eb',
    orange: '#f97316',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    headBg: '#f1f5f9',
    footerText: '#94a3b8',
};

export interface AssetTabColumn {
    label: string;
    /** Largura relativa (flex). Padrão 1. */
    flex?: number;
    align?: 'left' | 'center' | 'right';
}

export interface AssetTabSection {
    heading?: string;
    columns: AssetTabColumn[];
    rows: string[][];
    /** Linha de totais, mesma quantidade de colunas. */
    footerRow?: string[];
    emptyText?: string;
}

export interface AssetTabReportDocumentProps {
    asset: Asset;
    title: string;
    subtitle?: string;
    sections: AssetTabSection[];
    orientation?: 'portrait' | 'landscape';
    generatedAt?: string;
}

const styles = StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: 44, paddingHorizontal: 30, fontSize: 9, fontFamily: 'Helvetica', color: C.text, backgroundColor: C.bg },
    card: { backgroundColor: C.cardBg, borderRadius: 8, borderTopWidth: 4, borderTopColor: C.primary, padding: 14, marginBottom: 14 },
    badge: { backgroundColor: C.orange, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', marginBottom: 8 },
    badgeText: { color: '#000', fontSize: 12, fontFamily: 'Helvetica-Bold' },
    assetTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
    infoRow: { flexDirection: 'row' },
    infoCol: { flex: 1, marginRight: 10 },
    infoLabel: { fontSize: 6, color: C.textMuted, textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
    title: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.primary, textTransform: 'uppercase' },
    subtitle: { fontSize: 8, color: C.textMuted, marginTop: 2, marginBottom: 10 },
    heading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.textMuted, textTransform: 'uppercase', marginTop: 8, marginBottom: 4 },
    table: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderRadius: 6, marginBottom: 10 },
    headRow: { flexDirection: 'row', backgroundColor: C.headBg, borderBottomWidth: 1, borderBottomColor: C.border },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
    footRow: { flexDirection: 'row', backgroundColor: C.headBg },
    th: { padding: 5, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.textMuted, textTransform: 'uppercase' },
    td: { padding: 5, fontSize: 8 },
    tdBold: { padding: 5, fontSize: 8, fontFamily: 'Helvetica-Bold' },
    empty: { padding: 12, fontSize: 8, color: C.textMuted, textAlign: 'center' },
    footer: { position: 'absolute', bottom: 20, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
    footerText: { fontSize: 7, color: C.footerText },
});

const cell = (col: AssetTabColumn) => ({ flex: col.flex ?? 1, textAlign: col.align ?? 'left' as const });

export const AssetTabReportDocument = ({ asset, title, subtitle, sections, orientation = 'portrait', generatedAt }: AssetTabReportDocumentProps) => {
    const genStr = generatedAt || formatDateTime(new Date());
    const unitDesc = asset.unitDescriptionFull || asset.location || 'Não informada';
    const system = [asset.tagName, asset.tagSubName]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(' - ') || 'Sem Tag';

    return (
        <Document title={`${title} - ${asset.code || asset.id}`}>
            <Page size="A4" orientation={orientation} style={styles.page}>
                <View style={styles.card}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{asset.code || asset.id}</Text>
                    </View>
                    <Text style={styles.assetTitle}>{asset.description}</Text>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Unidade</Text>
                            <Text style={styles.infoValue}>{asset.clientName || '(CLIENTE NÃO INFORMADO)'}</Text>
                            <Text style={styles.infoValue}>{unitDesc}</Text>
                        </View>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Setor - Posição</Text>
                            <Text style={styles.infoValue}>{system}</Text>
                        </View>
                        <View style={[styles.infoCol, { marginRight: 0 }]}>
                            <Text style={styles.infoLabel}>Localização</Text>
                            <Text style={styles.infoValue}>{asset.location || 'N/I'}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View style={{ height: 8 }} />}

                {sections.map((section, si) => (
                    <View key={si}>
                        {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
                        <View style={styles.table}>
                            <View style={styles.headRow} fixed>
                                {section.columns.map((col, ci) => (
                                    <Text key={ci} style={[styles.th, cell(col)]}>{col.label}</Text>
                                ))}
                            </View>
                            {section.rows.length === 0 ? (
                                <Text style={styles.empty}>{section.emptyText || 'Nenhum registro.'}</Text>
                            ) : section.rows.map((row, ri) => (
                                <View key={ri} style={styles.row} wrap={false}>
                                    {section.columns.map((col, ci) => (
                                        <Text key={ci} style={[styles.td, cell(col)]}>{row[ci] || '-'}</Text>
                                    ))}
                                </View>
                            ))}
                            {section.footerRow && section.rows.length > 0 && (
                                <View style={styles.footRow} wrap={false}>
                                    {section.columns.map((col, ci) => (
                                        <Text key={ci} style={[styles.tdBold, cell(col)]}>{section.footerRow![ci] ?? ''}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                ))}

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado em {genStr}</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};
