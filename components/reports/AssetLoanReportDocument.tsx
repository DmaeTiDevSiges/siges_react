import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { AssetLoan, Asset } from '../../types';
import { ChecklistItemState } from '../assetLoans/AssetLoanChecklistForm';

const C = {
    primary: '#003B71',
    primaryLight: '#e8eef6',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    footerText: '#94a3b8',
    amber: '#f59e0b',
    amberBg: '#fffbeb',
    green: '#16a34a',
    red: '#dc2626',
    greenBg: '#f0fdf4',
    redBg: '#fef2f2',
    blue: '#2563eb',
    blueBg: '#eff6ff',
};

const statusLabel: Record<string, string> = {
    analysis: 'Análise',
    pending: 'Ativo',
    closed: 'Devolvido',
    overdue: 'Atrasado',
};

const statusLabelMap: Record<string, string> = {
    ok: 'OK',
    damaged: 'Danificado',
    missing: 'Faltando',
    pending: 'Pendente',
    not_applicable: 'N/A',
};

const statusColorMap: Record<string, string> = {
    ok: C.green,
    damaged: C.red,
    missing: C.red,
    pending: C.textMuted,
    not_applicable: C.textMuted,
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

    // ── Header ──
    headerContainer: { marginBottom: 0 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: { fontSize: 14, fontWeight: 'bold', color: C.primary, fontFamily: 'Helvetica-Bold' },
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginBottom: 8,
    },

    // ── Asset Card ──
    assetCard: {
        backgroundColor: C.cardBg,
        borderRadius: 8,
        borderTopWidth: 4,
        borderTopColor: C.primary,
        padding: 14,
        marginBottom: 14,
    },
    assetCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    badgeContainer: {
        backgroundColor: C.primary,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    badgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
    badgeSubText: { color: '#ffffff', fontSize: 6, marginTop: 1 },
    statusBadge: (status: string) => ({
        backgroundColor: status === 'overdue' ? C.red : status === 'closed' ? C.green : C.primary,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
    }),
    statusBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
    assetTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: C.text,
        textTransform: 'uppercase',
        marginBottom: 10,
        fontFamily: 'Helvetica-Bold',
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    infoCol: { flexDirection: 'column', flex: 1 },
    infoLabel: { fontSize: 6, color: C.textMuted, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    infoValue: { fontSize: 8, color: C.text, fontFamily: 'Helvetica-Bold' },

    // ── Section Title ──
    sectionTitle: {
        fontSize: 10,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 1,
        fontFamily: 'Helvetica-Bold',
    },

    // ── Inspector Cards ──
    inspectorRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    inspectorCard: {
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
        padding: 10,
    },
    inspectorCardDelivery: {
        backgroundColor: C.blueBg,
        borderColor: C.blue,
    },
    inspectorCardReturn: {
        backgroundColor: C.greenBg,
        borderColor: C.green,
    },
    inspectorLabel: {
        fontSize: 6,
        color: C.textMuted,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    inspectorName: {
        fontSize: 9,
        color: C.text,
        fontFamily: 'Helvetica-Bold',
    },
    inspectorDate: {
        fontSize: 7,
        color: C.textMuted,
        marginTop: 2,
    },

    // ── Divergent Summary ──
    divergentSummary: {
        backgroundColor: C.amberBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.amber,
        padding: 10,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    divergentSummaryText: { fontSize: 9, color: C.text, fontFamily: 'Helvetica-Bold' },

    // ── Checklist Item Card ──
    checklistItem: {
        backgroundColor: C.cardBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 8,
        overflow: 'hidden',
    },
    checklistItemDivergent: {
        borderColor: C.amber,
        borderWidth: 1.5,
    },
    checklistItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    checklistItemName: {
        fontSize: 8,
        fontWeight: 'bold',
        color: C.text,
        fontFamily: 'Helvetica-Bold',
        flex: 1,
    },
    divergentBadge: {
        backgroundColor: C.amber,
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 5,
    },
    divergentBadgeText: {
        color: '#ffffff',
        fontSize: 6,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    checklistItemBody: {
        flexDirection: 'row',
        padding: 10,
        gap: 10,
    },
    phaseColumn: {
        flex: 1,
    },
    phaseLabel: {
        fontSize: 6,
        color: C.textMuted,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    phaseStatus: (status: string) => ({
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        color: statusColorMap[status] || C.text,
        marginBottom: 2,
    }),
    phaseNotes: {
        fontSize: 7,
        color: C.textMuted,
        fontStyle: 'italic',
        lineHeight: 1.3,
        marginTop: 2,
    },
    phaseImages: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    phaseImage: {
        width: 60,
        height: 45,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: C.border,
    },
    phaseDivider: {
        width: 1,
        backgroundColor: C.border,
    },

    // ── Notes ──
    notesSection: {
        backgroundColor: C.cardBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.border,
        padding: 10,
        marginBottom: 14,
    },
    notesText: { fontSize: 8, color: C.text, lineHeight: 1.4 },

    // ── Signatures ──
    signatureSection: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
    },
    signatureBlock: {
        flex: 1,
        alignItems: 'center',
    },
    signatureImage: {
        width: 150,
        height: 50,
        marginBottom: 4,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        width: '100%',
        marginBottom: 4,
    },
    signatureLabel: {
        fontSize: 7,
        color: C.textMuted,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    signatureName: {
        fontSize: 7,
        color: C.text,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 2,
    },
    signatureDate: {
        fontSize: 6,
        color: C.textMuted,
        textAlign: 'center',
        marginTop: 1,
    },

    // ── Footer ──
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

export interface AssetLoanReportDocumentProps {
    loan: AssetLoan;
    asset: Asset | null;
    beforeItems: ChecklistItemState[];
    afterItems: ChecklistItemState[];
    logoBase64?: string;
    signatureDeliveryBase64?: string;
    signatureReturnBase64?: string;
    generatedAt?: string;
}

export const AssetLoanReportDocument = ({
    loan,
    asset,
    beforeItems,
    afterItems,
    logoBase64,
    signatureDeliveryBase64,
    signatureReturnBase64,
    generatedAt,
}: AssetLoanReportDocumentProps) => {
    const now = new Date();
    const genStr = generatedAt || `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const fmtDate = (d?: string | null) => {
        if (!d) return '—';
        try {
            const date = new Date(d);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        } catch { return d; }
    };

    const fmtDateTime = (d?: string | null) => {
        if (!d) return '—';
        try {
            const date = new Date(d);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } catch { return d; }
    };

    // Merge before/after items by index
    const mergedItems: {
        item: string;
        beforeStatus: string;
        beforeNotes: string;
        beforeImages: string[];
        afterStatus: string;
        afterNotes: string;
        afterImages: string[];
        divergent: boolean;
    }[] = [];
    const maxLen = Math.max(beforeItems.length, afterItems.length);
    for (let i = 0; i < maxLen; i++) {
        const b = beforeItems[i];
        const a = afterItems[i];
        const bStatus = b?.status || 'pending';
        const aStatus = a?.status || 'pending';
        const divergent = bStatus !== aStatus;
        mergedItems.push({
            item: b?.itemDescription || b?.customItemDescription || a?.itemDescription || a?.customItemDescription || `Item ${i + 1}`,
            beforeStatus: statusLabelMap[bStatus] || bStatus,
            beforeNotes: b?.notes || '',
            beforeImages: (b?.images || []).map(img => img.imageUrl || '').filter(Boolean),
            afterStatus: statusLabelMap[aStatus] || aStatus,
            afterNotes: a?.notes || '',
            afterImages: (a?.images || []).map(img => img.imageUrl || '').filter(Boolean),
            divergent,
        });
    }

    const divergentCount = mergedItems.filter(m => m.divergent).length;

    return (
        <Document title={`Relatório de Empréstimo - ${asset?.code || loan.id}`}>
            <Page size="A4" orientation="portrait" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Empréstimo de Ativo</Text>
                            <Text style={styles.subtitle}>Siges - Sistema de Gestão</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* ASSET CARD */}
                <View style={styles.assetCard}>
                    <View style={styles.assetCardHeader}>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{asset?.code || '—'}</Text>
                            <Text style={styles.badgeSubText}>REG {fmtDate(loan.createdAt)}</Text>
                        </View>
                        <View style={styles.statusBadge(loan.computedStatus || loan.status)}>
                            <Text style={styles.statusBadgeText}>{statusLabel[loan.computedStatus || loan.status] || loan.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.assetTitle}>{asset?.description || 'Ativo não informado'}</Text>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Unidade</Text>
                            <Text style={styles.infoValue}>{asset?.clientName || '(CLIENTE NÃO INFORMADO)'}</Text>
                            <Text style={styles.infoValue}>{asset?.unitDescriptionFull || asset?.location || 'Não informada'}</Text>
                        </View>
                        <View style={[styles.infoCol, { flex: 2 }]}>
                            <Text style={styles.infoLabel}>Setor - Posição</Text>
                            <Text style={styles.infoValue}>{[asset?.tagName, asset?.tagSubName].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' - ') || 'Sem Tag'}</Text>
                        </View>
                        <View style={[styles.infoCol, { flex: 1, alignItems: 'flex-end', marginRight: 0 }]}>
                            <Text style={styles.infoLabel}>Localização</Text>
                            <Text style={styles.infoValue}>{asset?.location || 'N/I'}</Text>
                        </View>
                    </View>
                </View>

                {/* CHECKLIST ITEMS */}
                {mergedItems.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Checklist Comparativo</Text>
                        <View style={[styles.infoRow, { marginBottom: 10 }]}>
                            <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Solicitante</Text>
                                <Text style={styles.infoValue}>{loan.borrowerName}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Data Entrega</Text>
                                <Text style={styles.infoValue}>{fmtDate(loan.createdAt)}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Data Prevista</Text>
                                <Text style={styles.infoValue}>{fmtDate(loan.expectedReturnDate)}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.infoLabel}>Data Devolução</Text>
                                <Text style={styles.infoValue}>{fmtDate(loan.actualReturnDate)}</Text>
                            </View>
                        </View>
                        {mergedItems.map((row, idx) => (
                            <View key={idx} style={[styles.checklistItem, row.divergent && styles.checklistItemDivergent]}>
                                <View style={styles.checklistItemHeader}>
                                    <Text style={styles.checklistItemName}>{row.item}</Text>
                                    {row.divergent && (
                                        <View style={styles.divergentBadge}>
                                            <Text style={styles.divergentBadgeText}>DIVERGENTE</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.checklistItemBody}>
                                    {/* BEFORE */}
                                    <View style={styles.phaseColumn}>
                                        <Text style={styles.phaseLabel}>Antes</Text>
                                        <Text style={styles.phaseStatus(row.beforeStatus)}>{row.beforeStatus}</Text>
                                        {row.beforeNotes ? (
                                            <Text style={styles.phaseNotes}>{row.beforeNotes}</Text>
                                        ) : null}
                                        {row.beforeImages.length > 0 && (
                                            <View style={styles.phaseImages}>
                                                {row.beforeImages.map((img, imgIdx) => (
                                                    <Image key={imgIdx} src={img} style={styles.phaseImage} />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.phaseDivider} />
                                    {/* AFTER */}
                                    <View style={styles.phaseColumn}>
                                        <Text style={styles.phaseLabel}>Depois</Text>
                                        <Text style={styles.phaseStatus(row.afterStatus)}>{row.afterStatus}</Text>
                                        {row.afterNotes ? (
                                            <Text style={styles.phaseNotes}>{row.afterNotes}</Text>
                                        ) : null}
                                        {row.afterImages.length > 0 && (
                                            <View style={styles.phaseImages}>
                                                {row.afterImages.map((img, imgIdx) => (
                                                    <Image key={imgIdx} src={img} style={styles.phaseImage} />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* DIVERGENT SUMMARY */}
                {divergentCount > 0 && (
                    <View style={styles.divergentSummary}>
                        <Text style={{ fontSize: 14 }}>⚠</Text>
                        <Text style={styles.divergentSummaryText}>
                            {divergentCount} {divergentCount === 1 ? 'item divergiu' : 'itens divergiram'} entre as avaliações antes e depois
                        </Text>
                    </View>
                )}

                {/* VISTORIADORES */}
                <View style={styles.inspectorRow}>
                    <View style={[styles.inspectorCard, styles.inspectorCardDelivery]}>
                        <Text style={styles.inspectorLabel}>Vistoriador da Entrega</Text>
                        <Text style={styles.inspectorName}>{loan.inspectorDeliveryName || 'Não informado'}</Text>
                        {loan.signatureDeliveryAt && (
                            <Text style={styles.inspectorDate}>Assinado em {fmtDateTime(loan.signatureDeliveryAt)}</Text>
                        )}
                    </View>
                    <View style={[styles.inspectorCard, styles.inspectorCardReturn]}>
                        <Text style={styles.inspectorLabel}>Vistoriador da Devolução</Text>
                        <Text style={styles.inspectorName}>{loan.inspectorReturnName || 'Aguardando devolução...'}</Text>
                        {loan.signatureReturnAt && (
                            <Text style={styles.inspectorDate}>Assinado em {fmtDateTime(loan.signatureReturnAt)}</Text>
                        )}
                    </View>
                </View>

                {/* NOTES */}
                {loan.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.sectionTitle}>Observações</Text>
                        <Text style={styles.notesText}>{loan.notes}</Text>
                    </View>
                )}

                {/* SIGNATURES */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        {signatureDeliveryBase64 ? (
                            <Image src={signatureDeliveryBase64} style={styles.signatureImage} />
                        ) : (
                            <View style={[styles.signatureImage, styles.signatureLine]} />
                        )}
                        <Text style={styles.signatureLabel}>Assinatura Entrega</Text>
                        {loan.signatureDeliverySignerName && (
                            <Text style={styles.signatureName}>{loan.signatureDeliverySignerName}</Text>
                        )}
                        <Text style={styles.signatureDate}>{fmtDateTime(loan.signatureDeliveryAt)}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        {signatureReturnBase64 ? (
                            <Image src={signatureReturnBase64} style={styles.signatureImage} />
                        ) : (
                            <View style={[styles.signatureImage, styles.signatureLine]} />
                        )}
                        <Text style={styles.signatureLabel}>Assinatura Devolução</Text>
                        {loan.signatureReturnSignerName && (
                            <Text style={styles.signatureName}>{loan.signatureReturnSignerName}</Text>
                        )}
                        <Text style={styles.signatureDate}>{fmtDateTime(loan.signatureReturnAt)}</Text>
                    </View>
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
