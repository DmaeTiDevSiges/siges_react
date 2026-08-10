import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatDateTime } from '../../utils/formatters';

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
    tableCellHeader: { fontWeight: 'bold', color: '#2D3748', fontSize: 9 },
    tableCell: { fontSize: 8, color: '#4A5568' },
    tableCellSub: { fontSize: 6, color: '#718096', marginTop: 1 },
    footer: { position: 'absolute', bottom: 20, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#A0AEC0', borderTop: '2px solid #1A365D', paddingTop: 8 }
});

export const OrdersListDocument = ({ orders, logoBase64 }: { orders: any[]; logoBase64?: string }) => (
    <Document title="Relatório de Ordens de Serviço">
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.header} fixed>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Relatório de Ordens de Serviço</Text>
                    <Text style={styles.subtitle}>Siges - Sistema de Gestão</Text>
                </View>
                {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
            </View>

            <View style={styles.table}>
                {/* Cabeçalho da Tabela - fixed para repetir em todas as páginas */}
                <View style={styles.tableRow} fixed>
                    <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>OS</Text></View>
                    <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Unidade</Text></View>
                    <View style={[styles.tableColHeader, { width: '30%' }]}><Text style={styles.tableCellHeader}>Serviços a realizar</Text></View>
                    <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Solicitante</Text></View>
                    <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Situação</Text></View>
                    <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Responsável</Text></View>
                </View>

                {/* Linhas da Tabela */}
                {orders.map((order) => {
                    const type = order.typeCode || '-';
                    const subType = order.typeSubCode || '-';
                    const object = order.objectCode || '-';
                    const subInfo = `${type} / ${subType} / ${object}`.toUpperCase();

                    return (
                        <View key={order.id} style={styles.tableRow} wrap={false}>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>{order.orderMask || order.id}</Text>
                                <Text style={styles.tableCellSub}>{subInfo}</Text>
                                <Text style={styles.tableCellSub}>{(order.priorityDescription || order.priorityName || '-').toUpperCase()}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{order.unitDescription || order.unitName || '-'}</Text>
                                <Text style={styles.tableCellSub}>{(order.clientName || '-').toUpperCase()}</Text>
                                {(order.unitAssetTagDescription || order.unitAssetTagSubDescription) ? (
                                    <Text style={styles.tableCellSub}>
                                        {`${order.unitAssetTagDescription || ''}${order.unitAssetTagDescription && order.unitAssetTagSubDescription ? ' / ' : ''}${order.unitAssetTagSubDescription || ''}`}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{order.requestedServices || '-'}</Text></View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{order.requesterName || order.requesterNameShort || '-'}</Text>
                                <Text style={styles.tableCellSub}>{order.requesterTeamCode || '-'}</Text>
                                <Text style={styles.tableCellSub}>{order.requesterPhone || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{order.statusDescription || order.statusName || '-'}</Text>
                                <Text style={styles.tableCellSub}>{formatDateTime(order.statusAt || order.requestedAt || order.date || order.createdAt)}</Text>
                                <Text style={styles.tableCellSub}>Progresso: {order.progress || '0%'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '15%' }]}>
                                <Text style={styles.tableCell}>{order.contractDescription || '-'}</Text>
                                <Text style={styles.tableCellSub}>{order.teamCode || order.teamDescription || '-'}</Text>
                                <Text style={styles.tableCellSub}>{order.teamLeaderNameShort || '-'}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={styles.footer} fixed>
                <Text>Gerado em {new Date().toLocaleString()}</Text>
                <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
            </View>
        </Page>
    </Document>
);
