
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    }
});

const bucket = process.env.VITE_R2_BUCKET_NAME;

async function debugR2Object() {
    console.log("🔍 Analisando objetos no caminho 'companies/1/assets/1080/'...");

    try {
        const list = await r2Client.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: 'companies/1/assets/1080/',
            MaxKeys: 5
        }));

        if (!list.Contents || list.Contents.length === 0) {
            console.log("❌ Nenhum objeto encontrado nesse caminho.");
            return;
        }

        for (const obj of list.Contents) {
            console.log(`\n📄 Key: "${obj.Key}"`);
            console.log(`   Tamanho: ${obj.Size} bytes`);

            const head = await r2Client.send(new HeadObjectCommand({
                Bucket: bucket,
                Key: obj.Key
            }));
            console.log(`   ContentType: ${head.ContentType}`);
        }
    } catch (err) {
        console.error("❌ Erro ao analisar:", err.message);
    }
}

debugR2Object();
