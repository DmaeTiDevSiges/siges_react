/**
 * test_r2_credentials.mjs
 * Testa credenciais S3/R2 diretamente — simula o que o imgproxy faz.
 * Uso: node scripts/test_r2_credentials.mjs
 */
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ── Credenciais a testar (substitua aqui para testar diferentes pares) ─────
const TEST_CREDENTIALS = [
    {
        label: '🔑 Novas credenciais (Cloudflare Dashboard - a8c4d9ee...)',
        accessKeyId:     'a8c4d9ee39addf8a104af71a7c168c63',
        secretAccessKey: 'a55b5fd4314284ec14ac0ecefcd58df74a1dabdfd2869784cae73bfcf3fc3692',
    },
    {
        label: '🔑 Frontend .env.local (referência)',
        accessKeyId:     process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    },
];

const ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const BUCKET     = process.env.VITE_R2_BUCKET_NAME || 'siges';
const ENDPOINT   = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Um objeto que sabemos que existe no bucket (busca a primeiro listado)
let knownObject = null;

async function testCredentials({ label, accessKeyId, secretAccessKey }) {
    if (!accessKeyId || !secretAccessKey) {
        console.log(`\n${label}\n  ⚠️  Credencial não informada — pulando.`);
        return;
    }

    console.log(`\n${'═'.repeat(55)}`);
    console.log(label);
    console.log(`  Access Key: ${accessKeyId}`);
    console.log(`  Endpoint  : ${ENDPOINT}`);
    console.log(`  Bucket    : ${BUCKET}`);

    const client = new S3Client({
        region: 'auto',
        endpoint: ENDPOINT,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true, // equivale a IMGPROXY_S3_USE_PATH_STYLE=true
        requestHandler: {
           requestTimeout: 10000 // Timeout para falhar rápido
        }
    });

    // ── Teste 1: Listar objetos (verifica acesso ao bucket) ────────────────
    try {
        const res = await client.send(new ListObjectsV2Command({
            Bucket:  BUCKET,
            MaxKeys: 5,
        }));
        const count = res.Contents?.length ?? 0;
        console.log(`\n  ✅ ListObjects OK — ${count} objetos retornados.`);
        if (count > 0) {
            knownObject = res.Contents[0].Key;
            console.log(`     Primeiro objeto: ${knownObject}`);
        }
    } catch (err) {
        console.log(`\n  ❌ ListObjects FALHOU: ${err.name} — ${err.message}`);
    }

    // ── Teste 2: HeadObject num arquivo real (verifica leitura) ────────────
    const objectKey = knownObject ?? 'companies/1/logo/test.jpg';
    try {
        await client.send(new HeadObjectCommand({
            Bucket: BUCKET,
            Key:    objectKey,
        }));
        console.log(`  ✅ HeadObject OK — "${objectKey}" acessível.`);
    } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            console.log(`  ⚠️  HeadObject: arquivo "${objectKey}" não encontrado — mas credencial tem acesso.`);
        } else {
            console.log(`  ❌ HeadObject FALHOU: ${err.name} — ${err.message}`);
        }
    }
}

console.log('TESTE DE CREDENCIAIS R2/S3');
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Bucket  : ${BUCKET}`);

for (const creds of TEST_CREDENTIALS) {
    await testCredentials(creds);
}

console.log(`\n${'═'.repeat(55)}`);
console.log('RESUMO:');
console.log('  ✅ ListObjects OK    → credencial válida, use no imgproxy');
console.log('  ❌ InvalidAccessKey  → credencial errada ou revogada');
console.log('  ❌ AccessDenied      → credencial válida mas sem permissão Object:Read');
console.log('  ❌ Timeout/Connect   → problema de rede VPS → Cloudflare');
console.log(`${'═'.repeat(55)}\n`);
