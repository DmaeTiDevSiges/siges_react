/**
 * test_imgproxy.mjs
 * Testa o imgproxy com URLs s3:// — estratégia real do app.
 * IMGPROXY_ALLOW_REMOTE_IMAGES=false → HTTP URLs retornam 404 (esperado).
 * S3 URLs → devem retornar 200 quando tudo está correto.
 */
import crypto from 'crypto';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const key         = process.env.VITE_IMGPROXY_KEY;
const salt        = process.env.VITE_IMGPROXY_SALT;
const baseUrl     = process.env.VITE_IMGPROXY_URL;
const accountId   = process.env.VITE_R2_ACCOUNT_ID;
const accessKey   = process.env.VITE_R2_ACCESS_KEY_ID;
const secretKey   = process.env.VITE_R2_SECRET_ACCESS_KEY;
const bucket      = process.env.VITE_R2_BUCKET_NAME || 'siges';

if (!key || !salt || !baseUrl) {
    console.error('ERRO: variáveis IMGPROXY não encontradas no .env.local');
    process.exit(1);
}

// ── Assinatura HMAC (idêntica ao imgproxyService.ts) ────────────────────────
function createSignature(path) {
    const keyBin  = Buffer.from(key,  'hex');
    const saltBin = Buffer.from(salt, 'hex');
    const hmac = crypto.createHmac('sha256', keyBin);
    hmac.update(saltBin);
    hmac.update(Buffer.from(path, 'utf8'));
    return hmac.digest('base64url').replace(/=+$/, '');
}

function encodeSourceUrl(url) {
    return Buffer.from(url, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function buildS3Url(s3Path, options = 'rs:fit:300:300:0/q:80/f:webp') {
    const s3Url   = `s3://${bucket}/${s3Path}`;
    const encoded = encodeSourceUrl(s3Url);
    const path    = `/${options}/${encoded}`;
    const sig     = createSignature(path);
    return {
        full: `${baseUrl}/${sig}${path}`,
        s3:   s3Url,
    };
}

async function test(label, url, s3) {
    console.log(`\n[${label}]`);
    console.log(`  S3  : ${s3}`);
    console.log(`  URL : ${url.substring(0, 90)}...`);
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
        console.log(`  Status: ${res.status} ${res.statusText}`);
        if (res.status === 200) {
            console.log(`  ✅ SUCESSO — Content-Type: ${res.headers.get('content-type')}`);
        } else if (res.status === 404) {
            console.log(`  ❌ 404 — Assinatura inválida`);
        } else if (res.status === 422) {
            const body = await res.text().catch(() => '');
            console.log(`  ⚠️  422 — Imgproxy processou mas fonte inacessível`);
            console.log(`  Detalhe: ${body.substring(0, 200)}`);
        } else if (res.status === 503) {
            console.log(`  ⏱️  503 — Timeout ao baixar a fonte S3. Container sem acesso ao R2.`);
        } else if (res.status === 500) {
            const body = await res.text().catch(() => '');
            console.log(`  ❌ 500 — ${body.substring(0, 200)}`);
        }
    } catch (err) {
        console.error(`  ❌ Erro: ${err.message}`);
    }
}

// ── Buscar um arquivo real do bucket para testar ─────────────────────────────
let realImagePath = 'settings/images/users/100003/1755816304481762.jpg';

if (accountId && accessKey && secretKey) {
    try {
        const client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
            forcePathStyle: true,
        });
        const res = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 20,
            // Busca arquivos de imagem
        }));
        const images = res.Contents?.filter(o =>
            /\.(jpg|jpeg|png|webp)$/i.test(o.Key)
        );
        if (images?.length > 0) {
            realImagePath = images[0].Key;
            console.log(`Usando imagem real do bucket: ${realImagePath}`);
        }
    } catch (e) {
        console.log(`Usando path hardcoded (listagem falhou: ${e.message})`);
    }
}

console.log('═══════════════════════════════════════════════════════');
console.log('TESTE IMGPROXY — URLs S3 (modo real do app)');
console.log(`Servidor : ${baseUrl}`);
console.log(`Bucket   : ${bucket}`);
console.log('═══════════════════════════════════════════════════════');

// 1. Health check
console.log('\n[HEALTH CHECK]');
try {
    const r = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    console.log(`  Status: ${r.status} ${r.ok ? '✅' : '❌'}`);
} catch (e) { console.error(`  ❌ ${e.message}`); }

// 2. Imagem real do bucket via S3
const { full: urlReal, s3: s3Real } = buildS3Url(realImagePath);
await test('Imagem real (s3://)', urlReal, s3Real);

// 3. Arquivo que sabidamente existe (dos logs do imgproxy)
const knownPath = 'settings/images/users/100003/1755816304481762.jpg';
if (knownPath !== realImagePath) {
    const { full, s3 } = buildS3Url(knownPath);
    await test('Path dos logs do imgproxy', full, s3);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('LEGENDA:');
console.log('  ✅ 200           → tudo funcionando!');
console.log('  ❌ 404           → assinatura errada');
console.log('  ⚠️  422           → assinatura ok, mas arquivo não encontrado no S3');
console.log('  ⏱️  503           → conexão S3 timeout (container sem acesso ao R2)');
console.log('═══════════════════════════════════════════════════════\n');
