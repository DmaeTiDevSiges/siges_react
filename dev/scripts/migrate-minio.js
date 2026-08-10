
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from 'dotenv';
import fs from 'fs';

// Load R2 keys
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

// --- CONFIGURAÇÃO ---
const SOURCE_PREFIX = "stub/siges/"; // A pasta específica que você quer importar
const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_REGION = "eu-south";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";

const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;

// CLIENTE MINIO (Source)
const minioClient = new S3Client({
    region: MINIO_REGION,
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY
    }
});

// CLIENTE R2 (Destination)
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    }
});

async function clearR2Prefix(prefix) {
    console.log(`🧹 Limpando destino (R2) na pasta: '${prefix}'...`);
    let continuationToken = undefined;
    let deletedCount = 0;

    do {
        const listCmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: prefix,
            ContinuationToken: continuationToken
        });
        const data = await r2Client.send(listCmd);

        if (data.Contents && data.Contents.length > 0) {
            const objects = data.Contents.map(o => ({ Key: o.Key }));
            await r2Client.send(new DeleteObjectsCommand({
                Bucket: R2_BUCKET,
                Delete: { Objects: objects }
            }));
            deletedCount += objects.length;
            process.stdout.write(`\r   -> Removidos ${deletedCount} arquivos antigos...`);
        }
        continuationToken = data.NextContinuationToken;
    } while (continuationToken);
    console.log(deletedCount > 0 ? "\n✅ Limpeza concluída." : "✅ Destino já estava limpo.");
}

async function migrate() {
    console.log(`🚀 INICIANDO MIGRAÇÃO SELETIVA`);
    console.log(`📂 Origem: MinIO '${MINIO_BUCKET}/${SOURCE_PREFIX}'`);
    console.log(`📂 Destino: R2 '${R2_BUCKET}/${SOURCE_PREFIX}'`);

    // 1. Limpar destino antes
    await clearR2Prefix(SOURCE_PREFIX);

    let continuationToken = undefined;
    let totalMigrated = 0;
    let errors = 0;

    console.log("📦 Lendo arquivos da origem...");

    do {
        // Listar APENAS arquivos dentro de stub/siges/
        const listCmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: SOURCE_PREFIX,
            ContinuationToken: continuationToken
        });

        try {
            const data = await minioClient.send(listCmd);

            if (!data.Contents || data.Contents.length === 0) {
                if (totalMigrated === 0) console.log("⚠️ Nenhum arquivo encontrado com esse prefixo.");
                break;
            }

            for (const obj of data.Contents) {
                const key = obj.Key;
                if (key.endsWith('/')) continue; // Ignora pastas virtuais

                try {
                    // Download MinIO
                    const getCmd = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key });
                    const sourceObj = await minioClient.send(getCmd);

                    // Upload R2 (Stream)
                    const upload = new Upload({
                        client: r2Client,
                        params: {
                            Bucket: R2_BUCKET,
                            Key: key, // Mantém o mesmo caminho (stub/siges/...)
                            Body: sourceObj.Body,
                            ContentType: sourceObj.ContentType,
                        }
                    });

                    await upload.done();
                    totalMigrated++;
                    process.stdout.write(`\r✅ Migrado (${totalMigrated}): ${key.substring(0, 50)}... `);

                } catch (err) {
                    console.error(`\n❌ Erro em '${key}': ${err.message}`);
                    errors++;
                }
            }

            continuationToken = data.NextContinuationToken;

        } catch (err) {
            console.error("\n❌ Erro fatal ao listar Origem:", err.message);
            break;
        }

    } while (continuationToken);

    console.log(`\n\n✨ OPERAÇÃO CONCLUÍDA!`);
    console.log(`Total migrado: ${totalMigrated}`);
    console.log(`Erros: ${errors}`);
}

migrate().catch(console.error);
