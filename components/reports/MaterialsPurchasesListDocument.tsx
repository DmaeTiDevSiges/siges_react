import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        borderBottom: '2px solid #1A365D',
        paddingBottom: 5
    },
    logo: {
        width: 50,
        height: 50,
    },
    titleContainer: {
        flexDirection: 'column',
    },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1A365D' },
    subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, borderColor: '#E2E8F0' },
    tableRow: { flexDirection: 'row', borderBottomColor: '#E2E8F0', borderBottomWidth: 1, alignItems: 'stretch' },
    tableColHeader: { width: 'auto', borderStyle: 'solid', borderRightWidth: 1, backgroundColor: '#F7FAFC', padding: 5, borderColor: '#E2E8F0', justifyContent: 'flex-start' },
    tableCol: { width: 'auto', borderStyle: 'solid', borderRightWidth: 1, padding: 5, borderColor: '#E2E8F0', justifyContent: 'flex-start' },
    tableColRight: { width: 'auto', borderStyle: 'solid', borderRightWidth: 1, padding: 5, borderColor: '#E2E8F0', justifyContent: 'flex-end', alignItems: 'flex-end' },
    tableCellHeader: { fontWeight: 'bold', color: '#2D3748', fontSize: 9 },
    tableCellHeaderRight: { fontWeight: 'bold', color: '#2D3748', fontSize: 9, textAlign: 'right' },
    tableCell: { fontSize: 8, color: '#4A5568' },
    tableCellRight: { fontSize: 8, color: '#4A5568', textAlign: 'right' },
    tableCellSub: { fontSize: 6, color: '#718096', marginTop: 1 },
    totalRow: { flexDirection: 'row', backgroundColor: '#EBF5FB', borderBottomColor: '#E2E8F0', borderBottomWidth: 1, alignItems: 'stretch' },
    totalCell: { fontSize: 9, fontWeight: 'bold', color: '#1A365D' },
    totalCellRight: { fontSize: 9, fontWeight: 'bold', color: '#1A365D', textAlign: 'right' },
    footer: { position: 'absolute', bottom: 20, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#A0AEC0', borderTop: '2px solid #1A365D', paddingTop: 8 }
});

export interface MaterialsPurchasesRow {
    id?: string;
    created_at?: string;
    purchase_code?: string;
    material_code?: string;
    material_description?: string;
    material_type_description?: string;
    requester_name?: string;
    justification?: string;
    quantity?: number;
    material_unit?: string;
    total_price?: number;
    status_description?: string;
    purchase_type_description?: string;
    authorizer_name?: string;
    authorized_at?: string;
}

const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val).trim() || fallback;
};

const fmtCurrency = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const MaterialsPurchasesListDocument = ({
    purchases,
    purchaseCodeFilter,
    logoBase64
}: {
    purchases: MaterialsPurchasesRow[];
    purchaseCodeFilter?: string;
    logoBase64?: string;
}) => {
    const title = 'Relatório de Compras';
    const subtitle = purchaseCodeFilter
        ? `Filtro código autorização: ${purchaseCodeFilter} — ${purchases.length} compra(s)`
        : `${purchases.length} compra(s)`;
    const totalValue = purchases.reduce((sum, p) => sum + (p.total_price || 0), 0);

    return (
        <Document title={title}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header} fixed>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                    {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                </View>

                <View style={styles.table}>
                    <View style={styles.tableRow} fixed>
                        <View style={[styles.tableColHeader, { width: '12%' }]}><Text style={styles.tableCellHeader}>Código</Text></View>
                        <View style={[styles.tableColHeader, { width: '24%' }]}><Text style={styles.tableCellHeader}>Material</Text></View>
                        <View style={[styles.tableColHeader, { width: '14%' }]}><Text style={styles.tableCellHeader}>Solicitante</Text></View>
                        <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Situação</Text></View>
                        <View style={[styles.tableColHeader, { width: '22%' }]}><Text style={styles.tableCellHeader}>Justificativa</Text></View>
                        <View style={[styles.tableColHeader, { width: '18%' }]}><Text style={styles.tableCellHeaderRight}>Valor Item</Text></View>
                    </View>

                    {purchases.map((p, idx) => {
                        const materialLabel = p.material_code
                            ? `${p.material_code} - ${p.material_description || ''}`
                            : (p.material_description || '—');
                        const typeInfo = [p.purchase_type_description, p.material_type_description].filter(Boolean).join(' - ');

                        return (
                            <View key={idx} style={styles.tableRow} wrap={false}>
                                <View style={[styles.tableCol, { width: '12%' }]}>
                                    <Text style={styles.tableCell}>{fmt(p.purchase_code)}</Text>
                                    {typeInfo ? <Text style={styles.tableCellSub}>{typeInfo}</Text> : null}
                                </View>
                                <View style={[styles.tableCol, { width: '24%' }]}>
                                    <Text style={styles.tableCell}>{fmt(materialLabel)}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '14%' }]}>
                                    <Text style={styles.tableCell}>{fmt(p.requester_name)}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '10%' }]}>
                                    <Text style={styles.tableCell}>{fmt(p.status_description)}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '22%' }]}>
                                    <Text style={styles.tableCell}>{fmt(p.justification)}</Text>
                                </View>
                                <View style={[styles.tableColRight, { width: '18%' }]}>
                                    <Text style={styles.tableCellRight}>{fmtCurrency(p.total_price)}</Text>
                                    <Text style={[styles.tableCellSub, { textAlign: 'right' }]}>{`${p.quantity ?? '—'} ${p.material_unit || ''}`}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* Total */}
                    <View style={styles.totalRow} wrap={false}>
                        <View style={[styles.tableCol, { width: '82%', borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
                            <Text style={styles.totalCell}>Total ({purchases.length} compra{purchases.length !== 1 ? 's' : ''})</Text>
                        </View>
                        <View style={[styles.tableColRight, { width: '18%' }]}>
                            <Text style={styles.totalCellRight}>{fmtCurrency(totalValue)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text>Gerado em {new Date().toLocaleString()}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};
