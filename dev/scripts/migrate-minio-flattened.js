
import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const SOURCE_PREFIX = "stub/siges/";
const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;
const CONCURRENCY = 15;

const minioClient = new S3Client({
    region: "eu-south",
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

async function getExistingR2Keys() {
    console.log("🔍 Mapeando arquivos já existentes no R2...");
    const existingKeys = new Set();
    let token = undefined;
    do {
        const cmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            ContinuationToken: token
        });
        const data = await r2Client.send(cmd);
        if (data.Contents) {
            data.Contents.forEach(obj => existingKeys.add(obj.Key));
        }
        token = data.NextContinuationToken;
    } while (token);
    console.log(`✅ ${existingKeys.size} arquivos já estão no R2.`);
    return existingKeys;
}

async function migrate() {
    console.log("🚀 INICIANDO MIGRAÇÃO OTIMIZADA (PARALELA + SKIP)");

    const existingKeys = await getExistingR2Keys();
    let token = undefined;
    let totalFiles = 0;
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const queue = [];

    async function processFile(sourceKey) {
        if (sourceKey.endsWith('/')) return;

        let newKey = sourceKey.startsWith(SOURCE_PREFIX) ? sourceKey.substring(SOURCE_PREFIX.length) : sourceKey;

        // LÓGICA DE ACHATAMENTO:
        const parts = newKey.split('/');
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            const secondToLast = parts[parts.length - 2];
            if (secondToLast.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|pdf)$/)) {
                parts.pop();
                newKey = parts.join('/');
            }
        }

        if (existingKeys.has(newKey)) {
            skippedCount++;
            return;
        }

        try {
            const getCmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: sourceKey });
            const response = await minioClient.send(getCmd);

            const upload = new Upload({
                client: r2Client,
                params: {
                    Bucket: R2_BUCKET,
                    Key: newKey,
                    Body: response.Body,
                    ContentType: response.ContentType,
                }
            });

            await upload.done();
            migratedCount++;
            process.stdout.write(`\r✅ Progresso: ${migratedCount} migrados | ${skippedCount} pulados | ${errorCount} erros`);
        } catch (e) {
            errorCount++;
            console.log(`\n❌ Falha em ${sourceKey}: ${e.message}`);
        }
    }

    do {
        const listCmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: SOURCE_PREFIX,
            ContinuationToken: token
        });

        const data = await minioClient.send(listCmd);
        token = data.NextContinuationToken;

        if (data.Contents) {
            for (let i = 0; i < data.Contents.length; i += CONCURRENCY) {
                const chunk = data.Contents.slice(i, i + CONCURRENCY);
                await Promise.all(chunk.map(obj => processFile(obj.Key)));
            }
        }
    } while (token);

    console.log(`\n\n✨ FINALIZADO!`);
    console.log(`📦 Migrados: ${migratedCount}`);
    console.log(`⏩ Pulados: ${skippedCount}`);
    console.log(`⚠️ Erros: ${errorCount}`);
}

migrate().catch(err => {
    console.error("❌ CRITICAL ERROR IN MIGRATION:", err);
    process.exit(1);
});
