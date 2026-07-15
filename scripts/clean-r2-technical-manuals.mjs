/**
 * Script para limpar todos os arquivos dos manuais técnicos no Cloudflare R2
 * 
 * Uso: node scripts/clean-r2-technical-manuals.mjs
 * 
 * Requer variáveis de ambiente:
 *   VITE_R2_ACCOUNT_ID
 *   VITE_R2_ACCESS_KEY_ID
 *   VITE_R2_SECRET_ACCESS_KEY
 *   VITE_R2_BUCKET_NAME
 * 
 * Carrega automaticamente do .env via dotenv
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config({ path: '.env.local' });

const accountId = process.env.VITE_R2_ACCOUNT_ID;
const accessKeyId = process.env.VITE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.VITE_R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Variáveis de ambiente do R2 não configuradas. Verifique o .env');
    process.exit(1);
}

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
});

const PREFIX = 'companies/';

async function listAllObjects(prefix) {
    const objects = [];
    let continuationToken = undefined;

    do {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        });

        const response = await s3.send(command);

        if (response.Contents) {
            objects.push(...response.Contents.map(obj => ({ Key: obj.Key })));
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
}

async function deleteBatch(objects) {
    if (objects.length === 0) return;

    const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects },
    });

    await s3.send(command);
}

async function main() {
    console.log(` bucket: ${bucketName}`);
    console.log(` prefixo: ${PREFIX}*/technical-manuals/*`);
    console.log('');

    // 1. Listar todos os objetos em companies/*/technical-manuals/*
    const technicalManualsPrefix = PREFIX; // listamos tudo em companies/ e filtramos
    console.log(' Listando arquivos...');
    const allObjects = await listAllObjects(PREFIX);

    // Filtrar apenas paths que contenham /technical-manuals/
    const tmObjects = allObjects.filter(obj => obj.Key && obj.Key.includes('/technical-manuals/'));

    if (tmObjects.length === 0) {
        console.log(' Nenhum arquivo de manuais técnicos encontrado no R2.');
        return;
    }

    console.log(` Encontrados ${tmObjects.length} arquivo(s) para remover:\n`);

    // Agrupar por manual (companyId/technical-manuals/tmId)
    const grouped = {};
    for (const obj of tmObjects) {
        const parts = obj.Key.split('/');
        const tmId = parts[3] || 'unknown';
        const key = `${parts[1]}/${parts[2]}/${parts[3]}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(obj.Key);
    }

    for (const [folder, files] of Object.entries(grouped)) {
        console.log(`  ${folder}/ (${files.length} arquivo${files.length > 1 ? 's' : ''})`);
        for (const f of files) {
            console.log(`    - ${f.split('/').pop()}`);
        }
    }

    console.log('');

    // 2. Deletar em batches de 1000 (limite do S3)
    console.log(' Deletando...');
    const BATCH_SIZE = 1000;
    let deleted = 0;

    for (let i = 0; i < tmObjects.length; i += BATCH_SIZE) {
        const batch = tmObjects.slice(i, i + BATCH_SIZE);
        await deleteBatch(batch);
        deleted += batch.length;
        process.stdout.write(`\r  ${deleted}/${tmObjects.length} removidos`);
    }

    console.log('\n\n Concluído!');
}

main().catch(err => {
    console.error(' Erro:', err.message);
    process.exit(1);
});
