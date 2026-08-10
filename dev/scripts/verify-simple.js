import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

// Force load .env.local
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

async function verifyR2Simple() {
    process.stdout.write("VERIFICAÇÃO SIMPLIFICADA R2:\n");

    if (!process.env.VITE_R2_ACCESS_KEY_ID || !process.env.VITE_R2_SECRET_ACCESS_KEY) {
        console.error("❌ ERRO: Chaves ausentes.");
        return;
    }

    const bucketName = process.env.VITE_R2_BUCKET_NAME;
    const accountId = process.env.VITE_R2_ACCOUNT_ID;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    const r2 = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
        },
    });

    // TESTE ESCRITA
    try {
        const testKey = `test-simple-${Date.now()}.txt`;
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: "TESTE",
        }));
        console.log("✅ ESCRITA: SUCESSO");
    } catch (err) {
        console.error("❌ ESCRITA: FALHA (" + err.name + ")");
    }
}

verifyR2Simple();
