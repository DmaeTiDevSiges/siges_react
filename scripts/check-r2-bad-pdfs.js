
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

async function findBadPdfStructures() {
    console.log("🔍 Buscando estruturas incorretas de PDF no R2 (ex: arquivo.pdf/uuid)...");
    let token = undefined;
    let count = 0;
    const badFiles = [];

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            ContinuationToken: token
        });
        try {
            const data = await r2Client.send(cmd);

            if (data.Contents) {
                for (const obj of data.Contents) {
                    // Procura por qualquer chave que tenha .pdf/ no meio
                    if (obj.Key.match(/\.pdf\//i)) {
                        badFiles.push(obj.Key);
                    }
                }
                count += data.Contents.length;
            }
            token = data.NextContinuationToken;
        } catch (e) {
            console.error("Erro listing objects:", e);
            break;
        }
        process.stdout.write(`\rScanned ${count} objects...`);
    } while (token);

    console.log(`\n\nResumo da Varredura:`);
    if (badFiles.length > 0) {
        console.log(`⚠️ ENCONTRADOS ${badFiles.length} ARQUIVOS COM ESTRUTURA ERRADA!`);
        console.log("Exemplos:");
        badFiles.slice(0, 10).forEach(f => console.log(` - ${f}`));
        console.log("\nEsses arquivos ocupam espaço e não são acessíveis pela aplicação corretamente.");
    } else {
        console.log("✅ Nenhum arquivo PDF com estrutura de diretório encontrada no R2.");
    }
}

findBadPdfStructures().catch(console.error);
