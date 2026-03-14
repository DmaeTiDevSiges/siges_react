
import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Force load env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const logFile = 'r2_debug.log';

const log = (msg) => {
    try {
        fs.appendFileSync(logFile, msg + '\r\n');
        console.log(msg);
    } catch (e) {
        console.error("Log error", e);
    }
};

// Clear log
try {
    fs.writeFileSync(logFile, '');
} catch (e) { }

const check = async () => {
    const bucketName = process.env.VITE_R2_BUCKET_NAME;
    const accountId = process.env.VITE_R2_ACCOUNT_ID;
    const accessKey = process.env.VITE_R2_ACCESS_KEY_ID;

    log(`DEBUG R2 START`);
    log(`Account ID: '${accountId}'`);
    log(`Bucket: '${bucketName}'`);
    log(`Access Key (prefix): '${accessKey ? accessKey.substring(0, 5) : 'NULL'}...'`);

    if (!accountId) {
        log('ERROR: Account ID missing');
        return;
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    log(`Endpoint: ${endpoint}`);

    const r2 = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
        },
    });

    // TESSTE 1: Listar Buckets (Account Level)
    try {
        log("Tentando listar buckets...");
        const result = await r2.send(new ListBucketsCommand({}));
        const bucketNames = result.Buckets ? result.Buckets.map(b => b.Name).join(', ') : 'Nenhum';
        log(`✅ Buckets encontrados: ${bucketNames}`);
    } catch (err) {
        log(`⚠️ Aviso: Falha ao listar buckets (${err.name} - ${err.message}).\n   Isso é normal se o token for restrito a um bucket específico (Bucket-scoped).`);
    }

    // TESTE 2: Upload (PutObject)
    try {
        log(`Tentando upload no bucket '${bucketName}'...`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: `debug-${Date.now()}.txt`,
            Body: "DEBUG"
        }));
        log('✅ SUCESSO: Write OK!');
    } catch (err) {
        log(`❌ FALHA UPLOAD: ${err.name} - ${err.message}`);
        if (err.name === 'AccessDenied') {
            log('   -> Permissão negada. O token não tem permissão de ESCRITA neste bucket.');
        } else if (err.name === 'NoSuchBucket') {
            log('   -> Bucket não encontrado. Verifique se o nome está exato.');
        } else if (err.name === 'InvalidAccessKeyId') {
            log('   -> Access Key inválida.');
        }
    }
};

check();
