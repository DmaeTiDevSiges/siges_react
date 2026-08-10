
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

async function cleanPlaceholders() {
    console.log("🔍 Buscando arquivos e pastas '.emptyFolderPlaceholder'...");

    let token = undefined;
    const placeholders = [];

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            ContinuationToken: token
        });
        const data = await r2Client.send(cmd);

        if (data.Contents) {
            for (const obj of data.Contents) {
                if (obj.Key.includes('.emptyFolderPlaceholder')) {
                    placeholders.push(obj.Key);
                }
            }
        }
        token = data.NextContinuationToken;
    } while (token);

    if (placeholders.length === 0) {
        console.log("✅ Nenhum placeholder encontrado.");
        return;
    }

    console.log(`⚠️  Encontrados ${placeholders.length} placeholders.`);
    placeholders.slice(0, 5).forEach(k => console.log(`   - ${k}`));
    if (placeholders.length > 5) console.log(`   ... e mais ${placeholders.length - 5}`);

    console.log("\n🧹 Iniciando limpeza...");

    for (const key of placeholders) {
        try {
            await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key
            }));
            // console.log(`   Deleted: ${key}`);
        } catch (e) {
            console.error(`   ❌ Falha ao deletar ${key}:`, e.message);
        }
    }

    console.log(`✨ Limpeza concluída! ${placeholders.length} itens removidos.`);
}

cleanPlaceholders();
