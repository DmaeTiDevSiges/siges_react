import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Asset } from '../../types';

interface HistoryItemWithImages {
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    user?: string;
    team?: string;
    color?: string;
    ovId: string;
    orderId: string;
    orderMask?: string;
    ovMask?: string;
    beforeStatus?: string;
    beforeUnit?: string;
    beforeTag?: string;
    beforePriority?: string;
    beforeComments?: string;
    beforeImg?: string;
    afterStatus?: string;
    afterUnit?: string;
    afterTag?: string;
    afterPriority?: string;
    afterComments?: string;
    afterImg?: string;
    providerCompanyId?: string;
    providerCompanyName?: string;
    providerCompanyLogoUrl?: string;
    isMoved?: boolean;
    servicesValue?: number;
    materialsValue?: number;
    vehiclesValue?: number;
    totalValue?: number;
    beforeImgBase64?: string | null;
    afterImgBase64?: string | null;
}

const C = {
    primary: '#2563eb',
    orange: '#f97316',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    footerText: '#94a3b8',
    emerald: '#059669',
    blue: '#2563eb',
    amber: '#d97706',
    purple: '#7c3aed',
};

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
    sectionTitle: {
        fontSize: 10,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        fontFamily: 'Helvetica-Bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
        gap: 8,
    },
    summaryBadge: {
        flexDirection: 'column',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        minWidth: 70,
    },
    summaryLabel: {
        fontSize: 6,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
        fontFamily: 'Helvetica-Bold',
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    historyItem: {
        backgroundColor: C.cardBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
        padding: 12,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    itemDate: {
        fontSize: 8,
        fontWeight: 'bold',
        color: C.textMuted,
        textTransform: 'uppercase',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    statusText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: C.emerald,
        textTransform: 'uppercase',
    },
    itemTeam: {
        fontSize: 8,
        fontWeight: 'bold',
        color: C.text,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    itemMask: {
        fontSize: 7,
        fontWeight: 'bold',
        color: C.textMuted,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    sectionLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
        fontFamily: 'Helvetica-Bold',
    },
    sectionContent: {
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 8,
        color: C.text,
        lineHeight: 1.4,
    },
    photoRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    photoWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    photoLabel: {
        fontSize: 6,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 4,
        objectFit: 'cover',
    },
    costsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: C.border,
        gap: 6,
    },
    costBadge: {
        flexDirection: 'column',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        minWidth: 55,
    },
    costLabel: {
        fontSize: 5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
    },
    costValue: {
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
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

const formatCurrencyPDF = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export interface AssetHistoryDocumentProps {
    asset: Asset;
    history: HistoryItemWithImages[];
    generatedAt?: string;
}

export const AssetHistoryDocument = ({ asset, history, generatedAt }: AssetHistoryDocumentProps) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const unitDesc = asset.unitDescriptionFull || asset.location || 'Não informada';
    const system = [asset.tagName, asset.tagSubName]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(' - ') || 'Sem Tag';
    const assetLocation = asset.location || 'N/I';
    const clientName = asset.clientName || '(CLIENTE NÃO INFORMADO)';

    const totalServices = history.reduce((sum, item) => sum + (item.servicesValue || 0), 0);
    const totalMaterials = history.reduce((sum, item) => sum + (item.materialsValue || 0), 0);
    const totalVehicles = history.reduce((sum, item) => sum + (item.vehiclesValue || 0), 0);
    const totalCosts = history.reduce((sum, item) => sum + (item.totalValue || 0), 0);

    return (
        <Document title={`Histórico - ${asset.code || asset.id}`}>
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Asset Header Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{asset.code || asset.id}</Text>
                            <Text style={styles.badgeDate}>REG  {asset.statusAt || '--/--/----'}</Text>
                        </View>
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

                {/* Summary Totals */}
                {(totalCosts > 0 || totalServices > 0) && (
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                            <Text style={[styles.summaryLabel, { color: C.blue }]}>Serviços</Text>
                            <Text style={[styles.summaryValue, { color: C.blue }]}>{formatCurrencyPDF(totalServices)}</Text>
                        </View>
                        <View style={[styles.summaryBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                            <Text style={[styles.summaryLabel, { color: C.amber }]}>Materiais</Text>
                            <Text style={[styles.summaryValue, { color: C.amber }]}>{formatCurrencyPDF(totalMaterials)}</Text>
                        </View>
                        <View style={[styles.summaryBadge, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                            <Text style={[styles.summaryLabel, { color: C.purple }]}>Transp.</Text>
                            <Text style={[styles.summaryValue, { color: C.purple }]}>{formatCurrencyPDF(totalVehicles)}</Text>
                        </View>
                        <View style={[styles.summaryBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                            <Text style={[styles.summaryLabel, { color: C.emerald }]}>Total</Text>
                            <Text style={[styles.summaryValue, { color: C.emerald }]}>{formatCurrencyPDF(totalCosts)}</Text>
                        </View>
                    </View>
                )}

                {/* History Section Title */}
                <Text style={styles.sectionTitle}>Histórico ({history.length} {history.length === 1 ? 'registro' : 'registros'})</Text>

                {/* History Items */}
                {history.map((item) => (
                    <View key={item.id} style={styles.historyItem} wrap={false}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemDate}>{item.date}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Aprovado</Text>
                            </View>
                        </View>

                        {item.team && (
                            <Text style={styles.itemTeam}>{item.team}</Text>
                        )}
                        <Text style={styles.itemMask}>{item.ovMask || item.orderMask || item.type || 'AT ---'}</Text>

                        {(item.beforeUnit || item.beforeTag || item.beforeComments || item.beforeImgBase64) && (
                            <View style={styles.sectionContent}>
                                <Text style={styles.sectionLabel}>Antes</Text>
                                {item.beforeUnit && <Text style={styles.sectionText}>{item.beforeUnit}</Text>}
                                {item.beforeTag && <Text style={styles.sectionText}>{item.beforeTag}</Text>}
                                {item.beforeStatus && <Text style={styles.sectionText}>{item.beforeStatus}</Text>}
                                {item.beforeComments && <Text style={styles.sectionText}>{item.beforeComments}</Text>}
                                {item.beforeImgBase64 && (
                                    <View style={styles.photoRow}>
                                        <View style={styles.photoWrapper}>
                                            <Image src={item.beforeImgBase64} style={styles.photo} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {(item.afterUnit || item.afterTag || item.afterComments || item.afterImgBase64) && (
                            <View style={styles.sectionContent}>
                                <Text style={styles.sectionLabel}>Depois</Text>
                                {item.afterUnit && <Text style={styles.sectionText}>{item.afterUnit}</Text>}
                                {item.afterTag && <Text style={styles.sectionText}>{item.afterTag}</Text>}
                                {item.afterStatus && <Text style={styles.sectionText}>{item.afterStatus}</Text>}
                                {item.afterComments && <Text style={styles.sectionText}>{item.afterComments}</Text>}
                                {item.afterImgBase64 && (
                                    <View style={styles.photoRow}>
                                        <View style={styles.photoWrapper}>
                                            <Image src={item.afterImgBase64} style={styles.photo} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {item.description && item.description !== 'Sem observações' && (
                            <View style={{ marginBottom: 8 }}>
                                <Text style={styles.sectionLabel}>Intervenções</Text>
                                <Text style={styles.sectionText}>{item.description}</Text>
                            </View>
                        )}

                        {((item.totalValue != null && item.totalValue > 0) || (item.servicesValue != null && item.servicesValue > 0) || (item.materialsValue != null && item.materialsValue > 0) || (item.vehiclesValue != null && item.vehiclesValue > 0)) && (
                            <View style={styles.costsRow}>
                                <View style={[styles.costBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                                    <Text style={[styles.costLabel, { color: C.blue }]}>Serviços</Text>
                                    <Text style={[styles.costValue, { color: C.blue }]}>{formatCurrencyPDF(item.servicesValue || 0)}</Text>
                                </View>
                                <View style={[styles.costBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                                    <Text style={[styles.costLabel, { color: C.amber }]}>Materiais</Text>
                                    <Text style={[styles.costValue, { color: C.amber }]}>{formatCurrencyPDF(item.materialsValue || 0)}</Text>
                                </View>
                                <View style={[styles.costBadge, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                                    <Text style={[styles.costLabel, { color: C.purple }]}>Transp.</Text>
                                    <Text style={[styles.costValue, { color: C.purple }]}>{formatCurrencyPDF(item.vehiclesValue || 0)}</Text>
                                </View>
                                <View style={[styles.costBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                                    <Text style={[styles.costLabel, { color: C.emerald }]}>Total</Text>
                                    <Text style={[styles.costValue, { color: C.emerald }]}>{formatCurrencyPDF(item.totalValue || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                {/* Footer */}
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
