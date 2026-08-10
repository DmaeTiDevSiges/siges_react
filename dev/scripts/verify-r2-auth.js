import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar .env.local se existir, senão .env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

async function verifyR2() {
    console.log("🔍 Iniciando verificação de permissões do R2...");

    if (!process.env.VITE_R2_ACCESS_KEY_ID || !process.env.VITE_R2_SECRET_ACCESS_KEY) {
        console.error("❌ ERRO: Variáveis VITE_R2_ACCESS_KEY_ID ou VITE_R2_SECRET_ACCESS_KEY não encontradas.");
        process.exit(1);
    }

    const bucketName = process.env.VITE_R2_BUCKET_NAME;
    const accountId = process.env.VITE_R2_ACCOUNT_ID;

    if (!accountId) {
        console.error("❌ ERRO: VITE_R2_ACCOUNT_ID não encontrada.");
        process.exit(1);
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    console.log(`Endpoint: ${endpoint}`);
    console.log(`Bucket: ${bucketName}`);

    const r2 = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
        },
    });

    // TESTE 1: LEITURA (Listar objetos)
    try {
        console.log("📡 Testando permissão de LEITURA (ListObjects)...");
        await r2.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
        console.log("✅ Permissão de LEITURA: OK");
    } catch (err) {
        console.error("❌ ERRO LEITURA: Falha ao listar objetos.", err.name, err.message);
        if (err.name === 'AccessDenied') {
            console.error("   A chave de acesso NÃO tem permissão de leitura.");
        }
    }

    // TESTE 2: ESCRITA
    try {
        const testKey = `test-auth-${Date.now()}.txt`;
        console.log(`📡 Testando permissão de ESCRITA (PutObject) para ${testKey}...`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: "Upload de teste Siges",
            ContentType: "text/plain"
        }));
        console.log(`✅ Permissão de ESCRITA: OK`);
    } catch (err) {
        console.error("❌ ERRO ESCRITA: Falha ao fazer upload.", err.name, err.message);
        if (err.name === 'AccessDenied') {
            console.error("   A chave de acesso NÃO tem permissão de escrita (apenas leitura?). Verifique no painel do Cloudflare R2 > API Tokens.");
        }
    }
}

verifyR2();
