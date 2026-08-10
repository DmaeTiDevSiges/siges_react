
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// --- CONFIGURAÇÃO MINIO (ORIGEM) ---
// Copiados da sua imagem
const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_REGION = "eu-south";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";

// CLIENTE MINIO (Source)
const minioClient = new S3Client({
    region: MINIO_REGION,
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true, // <--- O SEGREDO!!!!
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY
    }
});

async function testMinio() {
    console.log(`📡 Conectando ao MinIO em: ${MINIO_ENDPOINT}`);
    console.log(`📂 Bucket: ${MINIO_BUCKET}`);
    console.log(`🔑 Force Path Style: TRUE`);

    try {
        const listCmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            MaxKeys: 5
        });

        const data = await minioClient.send(listCmd);

        if (data.Contents && data.Contents.length > 0) {
            console.log(`✅ Sucesso! Encontrados ${data.Contents.length} arquivos.`);
            data.Contents.forEach(obj => console.log(`   - ${obj.Key} (${obj.Size} bytes)`));
        } else {
            console.log("✅ Conexão OK, mas o bucket está vazio.");
        }

    } catch (err) {
        console.error("\n❌ ERRO AO CONECTAR NO MINIO:");
        console.error(err);

        if (err.name === 'NetworkingError') {
            console.error("   -> Verifique se o VPS está acessível.");
        } else if (err.name === 'SignatureDoesNotMatch' || err.name === 'InvalidAccessKeyId') {
            console.error("   -> Chaves incorretas.");
        } else if (err.Code === 'NoSuchBucket') {
            console.error(`   -> Bucket '${MINIO_BUCKET}' não existe.`);
        }
    }
}

testMinio();
