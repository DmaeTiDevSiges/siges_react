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

export const AvailabilityReportDocument = ({ availability, logoBase64, unitDescription, startDate, endDate }: { availability: any[]; logoBase64?: string, unitDescription: string, startDate: string, endDate: string }) => (
    <Document title={`Relatório de Disponibilidade - ${unitDescription}`}>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.header} fixed>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Relatório de Disponibilidade</Text>
                    <Text style={styles.subtitle}>Siges - Sistema de Gestão | {unitDescription} | {startDate} a {endDate}</Text>
                </View>
                {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
            </View>

            <View style={styles.table}>
                {/* Cabeçalho da Tabela */}
                <View style={styles.tableRow} fixed>
                    <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Unidade</Text></View>
                    <View style={[styles.tableColHeader, { width: '18%' }]}><Text style={styles.tableCellHeader}>Setor / Sub-Setor</Text></View>
                    <View style={[styles.tableColHeader, { width: '13%' }]}><Text style={styles.tableCellHeader}>Data Hora</Text></View>
                    <View style={[styles.tableColHeader, { width: '7%' }]}><Text style={styles.tableCellHeader}>Dist. (m)</Text></View>
                    <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Disponibilidade</Text></View>
                    <View style={[styles.tableColHeader, { width: '14%' }]}><Text style={styles.tableCellHeader}>Motivo</Text></View>
                    <View style={[styles.tableColHeader, { width: '18%' }]}><Text style={styles.tableCellHeader}>Observações</Text></View>
                    <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Reportado por</Text></View>
                </View>

                {/* Linhas da Tabela */}
                {availability.map((item, index) => {
                    return (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>{item.unit_description || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '18%' }]}>
                                <Text style={styles.tableCell}>{item.tag_description || '-'}</Text>
                                <Text style={styles.tableCellSub}>{(item.tag_sub_description || 'GERAL').toUpperCase()}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '13%' }]}>
                                <Text style={styles.tableCell}>{formatDateTime(item.reported_at)}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '7%' }]}>
                                <Text style={styles.tableCell}>{item.unit_reported_distance_m != null ? Math.round(item.unit_reported_distance_m) : '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '10%', backgroundColor: item.is_available ? '#F0FFF4' : '#FFF5F5' }]}>
                                <Text style={[styles.tableCell, { color: item.is_available ? '#2F855A' : '#C53030', fontWeight: 'bold' }]}>
                                    {item.is_available ? 'SIM' : 'NÃO'}
                                </Text>
                            </View>
                            <View style={[styles.tableCol, { width: '14%' }]}>
                                <Text style={styles.tableCell}>{item.asset_unavailable_reason_description || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '18%' }]}>
                                <Text style={styles.tableCell}>{item.comments || '-'}</Text>
                            </View>
                            <View style={[styles.tableCol, { width: '10%' }]}>
                                <Text style={styles.tableCell}>{item.reported_user_name_short || '-'}</Text>
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
