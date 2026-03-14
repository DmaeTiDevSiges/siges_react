
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

async function cleanIncompleteUploads() {
    console.log("🧹 Iniciando limpeza de uploads multipart incompletos...");

    try {
        const listCmd = new ListMultipartUploadsCommand({
            Bucket: R2_BUCKET
        });
        const data = await r2Client.send(listCmd);

        if (!data.Uploads || data.Uploads.length === 0) {
            console.log("✅ Nenhum upload incompleto para limpar.");
            return;
        }

        console.log(`⚠️  Encontrados ${data.Uploads.length} uploads para abortar.`);

        for (const upload of data.Uploads) {
            console.log(`🗑️  Abortando upload: ${upload.Key} (ID: ${upload.UploadId.substring(0, 20)}...)`);

            try {
                await r2Client.send(new AbortMultipartUploadCommand({
                    Bucket: R2_BUCKET,
                    Key: upload.Key,
                    UploadId: upload.UploadId
                }));
                console.log("   ✅ Sucesso");
            } catch (err) {
                console.error(`   ❌ Erro ao abortar: ${err.message}`);
            }
        }

        console.log("\n✨ Limpeza concluída!");

    } catch (e) {
        console.error("Erro geral:", e);
    }
}

cleanIncompleteUploads();
