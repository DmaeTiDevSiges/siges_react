import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Asset } from '../../types';

// Etiqueta de identificação do ativo (A6): QR Code nível H + código + descrição.

const styles = StyleSheet.create({
    page: { padding: 24, fontFamily: 'Helvetica', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
    box: { borderWidth: 2, borderColor: '#0f172a', borderRadius: 10, padding: 18, alignItems: 'center', width: '100%' },
    kind: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
    qr: { width: 200, height: 200, marginBottom: 12 },
    code: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    description: { fontSize: 8, color: '#334155', textAlign: 'center', textTransform: 'uppercase' },
    place: { fontSize: 7, color: '#64748b', textAlign: 'center', marginTop: 6 },
});

export const AssetQrLabelDocument = ({ asset, qrDataUrl }: { asset: Asset; qrDataUrl: string }) => {
    const place = [asset.clientName, asset.unitDescriptionFull || asset.location].filter(Boolean).join(' · ');
    return (
        <Document title={`Etiqueta - ${asset.code || asset.id}`}>
            <Page size="A6" style={styles.page}>
                <View style={styles.box}>
                    <Text style={styles.kind}>Identificação de ativo</Text>
                    <Image src={qrDataUrl} style={styles.qr} />
                    <Text style={styles.code}>{asset.code || asset.id}</Text>
                    <Text style={styles.description}>{asset.description}</Text>
                    {place ? <Text style={styles.place}>{place}</Text> : null}
                </View>
            </Page>
        </Document>
    );
};
