
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const check = async () => {
    const bucketName = process.env.VITE_R2_BUCKET_NAME;
    const accountId = process.env.VITE_R2_ACCOUNT_ID;
    const accessKey = process.env.VITE_R2_ACCESS_KEY_ID;

    // Check for whitespace
    if (bucketName?.trim() !== bucketName) console.warn("⚠️ ALERTA: Nome do bucket tem espaços em branco!");
    if (accountId?.trim() !== accountId) console.warn("⚠️ ALERTA: Account ID tem espaços em branco!");
    if (accessKey?.trim() !== accessKey) console.warn("⚠️ ALERTA: Access Key tem espaços em branco!");

    console.log(`📡 Account ID: '${accountId}'`);
    console.log(`📦 Bucket: '${bucketName}'`);
    console.log(`🔑 Access Key: '${accessKey?.substring(0, 5)}...'`);
    console.log(`🌍 Endpoint: https://${accountId}.r2.cloudflarestorage.com`);

    const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        console.log("📤 Tentando upload de teste...");
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: `debug-${Date.now()}.txt`,
            Body: "DEBUG"
        }));
        console.log('✅ SUCESSO: Permissão de escrita OK!');
    } catch (err) {
        console.error(`❌ FALHA: ${err.name} - ${err.message}`);
        console.error("   Possíveis causas:");
        console.error("   1. Bucket não existe com esse nome EXATO.");
        console.error("   2. Account ID errado na URL.");
        console.error("   3. Token sem permissão para ESTE bucket específico.");
    }
};

check();
