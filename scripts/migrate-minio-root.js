
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

// --- CONFIGURAÇÃO ---
const SOURCE_PREFIX = "stub/siges/"; // Prefixo a remover da origem
const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_REGION = "eu-south";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";

const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;

// Clientes
const minioClient = new S3Client({
    region: MINIO_REGION,
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY }
});

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    }
});

async function clearR2() {
    console.log(`🧹 Esvaziando bucket de destino (R2)...`);
    let continuationToken = undefined;

    do {
        const listCmd = new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: continuationToken });
        const data = await r2Client.send(listCmd);

        if (data.Contents && data.Contents.length > 0) {
            const objects = data.Contents.map(o => ({ Key: o.Key }));
            await r2Client.send(new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: objects } }));
            process.stdout.write(`\r   -> Limpos ${objects.length} arquivos...`);
        } else {
            console.log("\n✅ Bucket R2 vazio/limpo.");
            break;
        }
        continuationToken = data.NextContinuationToken;
    } while (continuationToken);
}

async function migrate() {
    console.log(`🚀 INICIANDO MIGRAÇÃO (Removendo prefixo '${SOURCE_PREFIX}')`);

    // 1. Limpar R2
    await clearR2();

    let continuationToken = undefined;
    let totalMigrated = 0;

    console.log(`📦 Lendo MinIO: '${MINIO_BUCKET}/${SOURCE_PREFIX}' -> R2: '/'`);

    do {
        const listCmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: SOURCE_PREFIX,
            ContinuationToken: continuationToken
        });

        const data = await minioClient.send(listCmd);

        if (!data.Contents || data.Contents.length === 0) break;

        for (const obj of data.Contents) {
            const sourceKey = obj.Key;

            // REMOVER PREFIXO: transforma 'stub/siges/foto.jpg' em 'foto.jpg'
            let newKey = sourceKey;
            if (sourceKey.startsWith(SOURCE_PREFIX)) {
                newKey = sourceKey.substring(SOURCE_PREFIX.length);
            }

            if (!newKey || newKey === '/' || sourceKey.endsWith('/')) continue;

            const getCmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: sourceKey });
            const sourceObj = await minioClient.send(getCmd);

            const upload = new Upload({
                client: r2Client,
                params: {
                    Bucket: R2_BUCKET,
                    Key: newKey, // Chave sem prefixo
                    Body: sourceObj.Body,
                    ContentType: sourceObj.ContentType,
                }
            });

            await upload.done();
            totalMigrated++;
            // Log simples para não poluir
            if (totalMigrated % 10 === 0) process.stdout.write(`\r✅ Migrados: ${totalMigrated}`);
        }

        continuationToken = data.NextContinuationToken;

    } while (continuationToken);

    console.log(`\n✨ MIGRAÇÃO CONCLUÍDA! Total: ${totalMigrated}`);
}

migrate().catch(console.error);
