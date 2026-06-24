import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Registro de fonte (opcional, para um visual mais premium)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '2px solid #1A365D',
        paddingBottom: 10,
    },
    logo: {
        width: 60,
        height: 'auto',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A365D',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#F7FAFC',
        padding: 4,
        color: '#2D3748',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 100,
        fontWeight: 'bold',
        color: '#4A5568',
    },
    value: {
        flex: 1,
    },
    description: {
        marginTop: 5,
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        lineHeight: 1.4,
    },
    photoContainer: {
        width: '30%',
        marginBottom: 10,
    },
    photo: {
        width: '100%',
        height: 120,
        borderRadius: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#A0AEC0',
        borderTop: '1px solid #E2E8F0',
        paddingTop: 10,
    }
});

interface OSDocumentProps {
    data: {
        id: string;
        unidade: string;
        ativo: string;
        setor: string;
        data: string;
        prioridade: string;
        status: string;
        descricao: string;
        executor?: string;
        fotos?: string[];
    };
}

export const OSDocument = ({ data }: OSDocumentProps) => (
    <Document title={`OS-${data.id}`}>
        <Page size="A4" style={styles.page}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>ORDEM DE SERVIÇO</Text>
                    <Text>Siges - Sistema de Gestão</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>#{data.id}</Text>
            </View>

            {/* Informações Gerais */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DADOS GERAIS</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Unidade:</Text>
                    <Text style={styles.value}>{data.unidade}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Ativo:</Text>
                    <Text style={styles.value}>{data.ativo}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Setor:</Text>
                    <Text style={styles.value}>{data.setor}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Data Abertura:</Text>
                    <Text style={styles.value}>{data.data}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Prioridade:</Text>
                    <Text style={styles.value}>{data.prioridade}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.value}>{data.status}</Text>
                </View>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DESCRIÇÃO DO PROBLEMA / SERVIÇO</Text>
                <Text style={styles.description}>{data.descricao}</Text>
            </View>

            {/* Fotos (Simulado) */}
            {data.fotos && data.fotos.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>REGISTROS FOTOGRÁFICOS</Text>
                    <View style={styles.grid}>
                        {data.fotos.map((foto, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <Image src={foto} style={styles.photo} />
                                <Text style={{ fontSize: 7, marginTop: 2, textAlign: 'center' }}>Ref: Foto {index + 1}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text>Documento gerado automaticamente pelo sistema SIGES em {new Date().toLocaleString()}</Text>
                <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
            </View>
        </Page>
    </Document>
);
