
import { S3Client, ListMultipartUploadsCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    }
});

async function listIncompleteUploads() {
    console.log("🔍 Listando uploads multipart incompletos (travados)...");

    try {
        const cmd = new ListMultipartUploadsCommand({
            Bucket: R2_BUCKET
        });
        const data = await r2Client.send(cmd);

        if (data.Uploads && data.Uploads.length > 0) {
            console.log(`⚠️  Encontrados ${data.Uploads.length} uploads incompletos:`);
            data.Uploads.forEach(u => {
                console.log(` - Key: ${u.Key}`);
                console.log(`   UploadId: ${u.UploadId}`);
                console.log(`   Iniciado em: ${u.Initiated}`);
                console.log('---');
            });
        } else {
            console.log("✅ Nenhum upload incompleto encontrado.");
        }
    } catch (e) {
        console.error("Erro ao listar uploads:", e);
    }
}

listIncompleteUploads();
