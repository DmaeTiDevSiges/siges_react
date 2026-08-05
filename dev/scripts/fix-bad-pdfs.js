
import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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

async function fixBadPdfs() {
    console.log("🛠️  Iniciando correção de PDFs com estrutura incorreta...");

    // 1. Encontrar arquivos ruins
    const badFiles = [];
    let token = undefined;

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            ContinuationToken: token
        });
        const data = await r2Client.send(cmd);
        if (data.Contents) {
            for (const obj of data.Contents) {
                if (obj.Key.match(/\.pdf\//i)) {
                    badFiles.push(obj.Key);
                }
            }
        }
        token = data.NextContinuationToken;
    } while (token);

    console.log(`📋 Encontrados ${badFiles.length} arquivos para corrigir.`);

    let fixed = 0;
    let errors = 0;

    for (const badKey of badFiles) {
        // badKey ex: path/to/file.pdf/uuid
        // queremos: path/to/file.pdf
        const parts = badKey.split('/');
        // Encontrar onde está o .pdf
        const pdfIndex = parts.findIndex(p => p.toLowerCase().endsWith('.pdf'));

        if (pdfIndex === -1) {
            console.log(`⚠️  Ignorando chave estranha: ${badKey}`);
            continue;
        }

        // A chave correta vai até a parte com .pdf
        const correctKey = parts.slice(0, pdfIndex + 1).join('/');

        console.log(`🔄 Processando: ${badKey} -> ${correctKey}`);

        try {
            // Verificar se o arquivo correto JÁ existe
            let exists = false;
            try {
                await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: correctKey }));
                exists = true;
                console.log(`   ✅ Destino já existe. Apenas deletando o ruim.`);
            } catch (e) {
                if (e.name !== 'NotFound') throw e;
            }

            if (!exists) {
                // Copiar
                console.log(`   copying...`);
                await r2Client.send(new CopyObjectCommand({
                    Bucket: R2_BUCKET,
                    CopySource: `${R2_BUCKET}/${badKey}`, // R2 requer bucket na source
                    Key: correctKey
                }));
            }

            // Deletar o ruim
            console.log(`   deleting original...`);
            await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: badKey
            }));

            fixed++;
        } catch (e) {
            console.error(`❌ Erro ao processar ${badKey}:`, e);
            errors++;
        }
    }

    console.log(`\n✨ Concluído! Corrigidos: ${fixed}, Erros: ${errors}`);
}

fixBadPdfs().catch(console.error);
