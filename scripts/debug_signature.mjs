/**
 * debug_signature.mjs
 * Compara assinatura gerada pelo Node (crypto) com a lógica do CryptoJS (frontend)
 * para identificar divergências no cálculo HMAC do imgproxy.
 */
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const key = process.env.VITE_IMGPROXY_KEY;
const salt = process.env.VITE_IMGPROXY_SALT;
const baseUrl = process.env.VITE_IMGPROXY_URL;

if (!key || !salt || !baseUrl) {
    console.error('ERRO: Variáveis não encontradas no .env.local');
    process.exit(1);
}

// ─── Implementação correta (Node.js crypto) ─────────────────────────────────
function signCorrect(path) {
    const keyBin   = Buffer.from(key,  'hex');
    const saltBin  = Buffer.from(salt, 'hex');
    const pathBin  = Buffer.from(path, 'utf8');

    const hmac = crypto.createHmac('sha256', keyBin);
    hmac.update(saltBin);
    hmac.update(pathBin);

    return hmac.digest('base64url').replace(/=+$/, '');
}

// ─── Implementação problemática simulada (lógica do CryptoJS) ────────────────
// O CryptoJS usa: HmacSHA256(saltBin.concat(Utf8.parse(path)), keyBin)
// Isso é matematicamente: HMAC(key=keyBin, message=saltBin||pathBytes)
// Que é IGUAL a: hmac.update(saltBin); hmac.update(pathBin)
// Portanto a ordem deveria estar ok. Vamos verificar outra hipótese:
// O CryptoJS pode estar encodando o path UTF-8 diferentemente.
function signCryptoJSStyle(path) {
    const keyBin  = Buffer.from(key,  'hex');
    const saltBin = Buffer.from(salt, 'hex');
    const pathBin = Buffer.from(path, 'utf8');

    // Simulando saltBin.concat(Utf8.parse(path)) — mesma operação
    const message = Buffer.concat([saltBin, pathBin]);

    const hmac = crypto.createHmac('sha256', keyBin);
    hmac.update(message);

    return hmac.digest('base64url').replace(/=+$/, '');
}

function encodeSourceUrl(url) {
    return Buffer.from(url, 'utf8').toString('base64url').replace(/=+$/, '');
}

// ─── URL de Teste S3 ─────────────────────────────────────────────────────────
const s3Url   = 's3://siges/companies/1/logo/test.jpg';
const httpUrl = 'https://raw.githubusercontent.com/imgproxy/imgproxy/master/examples/logo.png';

for (const testUrl of [s3Url, httpUrl]) {
    const encodedUrl = encodeSourceUrl(testUrl);
    const options    = 'rs:fit:800:800:0/q:85/f:webp';
    const path       = `/${options}/${encodedUrl}`;

    const sigCorrect    = signCorrect(path);
    const sigCryptoJS   = signCryptoJSStyle(path);

    const match = sigCorrect === sigCryptoJS;

    console.log('\n══════════════════════════════════════════');
    console.log('URL Origem  :', testUrl.substring(0, 60));
    console.log('Path        :', path.substring(0, 80) + '...');
    console.log('Sig Correta :', sigCorrect);
    console.log('Sig CryptoJS:', sigCryptoJS);
    console.log('Coincidem?  :', match ? '✅ SIM' : '❌ NÃO');
    console.log('URL Assinada:', `${baseUrl}/${sigCorrect}${path}`);
}

// ─── Testa acesso ao servidor com a assinatura correta ───────────────────────
console.log('\n══════════════════════════════════════════');
console.log('Testando URL S3 interna contra o servidor...');

const encodedS3 = encodeSourceUrl(s3Url);
const pathS3    = `/rs:thumbnail:150:150:0/g:sm/q:80/f:webp/${encodedS3}`;
const sigS3     = signCorrect(pathS3);
const urlS3     = `${baseUrl}/${sigS3}${pathS3}`;

console.log('URL:', urlS3);

try {
    const res = await fetch(urlS3, { signal: AbortSignal.timeout(8000) });
    console.log('Status S3:', res.status, res.statusText);
    if (res.status === 200) {
        console.log('✅ S3 funciona! Content-Type:', res.headers.get('content-type'));
    } else if (res.status === 404) {
        console.log('❌ 404 — Assinatura inválida OU bucket S3 não acessível pelo imgproxy.');
    } else if (res.status === 422) {
        console.log('⚠️ 422 — Processamento falhou (provavelmente erro ao buscar S3). Tente com URL HTTP pública.');
    }
} catch (err) {
    console.error('❌ Erro:', err.message);
}

// ─── Testa com URL HTTP pública (não-S3) ─────────────────────────────────────
console.log('\nTestando URL HTTP pública GitHub...');
const encodedHttp = encodeSourceUrl(httpUrl);
const pathHttp    = `/rs:fit:300:300:0/f:webp/${encodedHttp}`;
const sigHttp     = signCorrect(pathHttp);
const urlHttp     = `${baseUrl}/${sigHttp}${pathHttp}`;

console.log('URL:', urlHttp);
try {
    const res = await fetch(urlHttp, { signal: AbortSignal.timeout(8000) });
    console.log('Status HTTP:', res.status, res.statusText);
    if (res.status === 200) {
        console.log('✅ URL HTTP pública funciona!');
        console.log('   → Problema é com acesso S3, não com a assinatura.');
    } else if (res.status === 404) {
        console.log('❌ 404 em URL HTTP também → problema na assinatura ou config de remote sources.');
    }
} catch (err) {
    console.error('❌ Erro:', err.message);
}
