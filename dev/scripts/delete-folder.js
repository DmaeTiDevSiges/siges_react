
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

const folderPrefix = 'siges/stub/siges/';

async function deleteRecursive(prefix) {
    console.log(`🔍 Listando objetos em: ${prefix}`);
    let token = undefined;
    let totalDeleted = 0;

    do {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: token
        });

        const response = await client.send(command);
        token = response.NextContinuationToken;

        if (response.Contents && response.Contents.length > 0) {
            const objects = response.Contents.map(obj => ({ Key: obj.Key }));
            console.log(`🗑️ Deletando lote de ${objects.length} arquivos...`);

            await client.send(new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: { Objects: objects }
            }));

            totalDeleted += objects.length;
        } else {
            console.log('✅ Nenhum objeto encontrado.');
        }

    } while (token);

    console.log(`✨ Concluído! Total deletado: ${totalDeleted}`);
}

deleteRecursive(folderPrefix).catch(console.error);
