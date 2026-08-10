
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const bucketName = process.env.VITE_R2_BUCKET_NAME;

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    },
});

async function nukeBucket() {
    console.log(`🚨 INICIANDO LIMPEZA TOTAL DO BUCKET: ${bucketName}`);
    console.log(`⚠️ ISSO VAI APAGAR TODOS OS ARQUIVOS!`);
    console.log(`⏳ Aguarde...`);

    let totalDeleted = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
        const listCmd = new ListObjectsV2Command({
            Bucket: bucketName,
            ContinuationToken: continuationToken
        });

        const data = await client.send(listCmd);

        if (data.Contents && data.Contents.length > 0) {
            const objects = data.Contents.map(obj => ({ Key: obj.Key }));

            await client.send(new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: { Objects: objects }
            }));

            totalDeleted += objects.length;
            process.stdout.write(`\r🗑️ Deletados até agora: ${totalDeleted} objetos...`);
        } else {
            console.log("\n✅ Bucket já está vazio.");
            break;
        }

        isTruncated = data.IsTruncated;
        continuationToken = data.NextContinuationToken;
    }

    console.log(`\n✨ LIMPEZA CONCLUÍDA! Total removido: ${totalDeleted} arquivos.`);
}

nukeBucket().catch(console.error);
