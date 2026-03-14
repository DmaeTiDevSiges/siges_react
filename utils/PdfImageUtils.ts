/**
 * PdfImageUtils - Utilitários para imagens em PDFs gerados no APK/Web.
 *
 * Problema no Capacitor/Android:
 *   - Caminhos relativos como "/siges_logo.png" não resolvem dentro do WebView nativo.
 *   - URLs externas (ex: R2/Cloudflare) podem ser bloqueadas por CORS no contexto nativo.
 *   - A solução é converter todas as imagens para base64 ANTES de passar ao @react-pdf/renderer.
 */

/**
 * Converte um blob WebP para JPEG usando canvas.
 * @react-pdf/renderer não suporta WebP — apenas JPEG e PNG.
 */
async function convertWebpToJpeg(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(blob); return; }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (jpegBlob) => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(jpegBlob || blob);
                    },
                    'image/jpeg',
                    0.92
                );
            } catch {
                URL.revokeObjectURL(objectUrl);
                resolve(blob);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for conversion'));
        };
        img.src = objectUrl;
    });
}

/**
 * Tenta fazer fetch de uma URL e convertê-la para base64 data URI.
 * Tenta primeiro com mode 'cors', depois sem restrição de mode.
 * Converte automaticamente WebP para JPEG (PDF compatibility).
 * Retorna null em caso de qualquer falha.
 */
async function fetchAsBase64(url: string): Promise<string | null> {
    const headers = { 'Accept': 'image/jpeg, image/png, image/*' };

    // Tentativa 1: mode cors (padrão)
    try {
        const res = await fetch(url, { mode: 'cors', headers });
        if (res.ok) {
            let blob = await res.blob();
            if (blob.size > 0) {
                // @react-pdf/renderer não suporta WebP
                if (blob.type === 'image/webp') {
                    console.info('[PdfImageUtils] Converting WebP to JPEG for PDF compatibility:', url.substring(0, 80));
                    blob = await convertWebpToJpeg(blob);
                }
                return await blobToDataUri(blob);
            }
        }
    } catch (e) {
        console.warn('[PdfImageUtils] CORS fetch failed:', url.substring(0, 80), e);
    }

    // Tentativa 2: sem especificar mode (deixa o browser/WebView decidir)
    try {
        const res = await fetch(url, { headers });
        if (res.ok) {
            let blob = await res.blob();
            if (blob.size > 0) {
                if (blob.type === 'image/webp') {
                    console.info('[PdfImageUtils] Converting WebP to JPEG for PDF compatibility:', url.substring(0, 80));
                    blob = await convertWebpToJpeg(blob);
                }
                return await blobToDataUri(blob);
            }
        }
    } catch (e) {
        console.warn('[PdfImageUtils] Direct fetch failed:', url.substring(0, 80), e);
    }

    console.error('[PdfImageUtils] All fetch attempts failed for:', url.substring(0, 100));
    return null;
}

/**
 * Converte um Blob para data URI (base64).
 */
function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

/**
 * Converte uma URL de imagem (relativa ou absoluta) para uma string base64 data URI.
 * Compatível com web e Capacitor/Android WebView.
 * Em caso de falha, retorna null sem lançar erro.
 */
export async function urlToBase64(url: string): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Já é base64

    return await fetchAsBase64(url);
}

/**
 * Converte um array de URLs de imagens para base64, ignorando as falhas.
 * Útil para passar fotos de ativos ao PDF de forma segura.
 */
export async function urlsToBase64(urls: (string | undefined)[]): Promise<string[]> {
    const results = await Promise.allSettled(
        (urls || []).filter(Boolean).map((url) => urlToBase64(url as string))
    );
    return results
        .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value as string);
}

/**
 * Retorna o logo da aplicação como base64 data URI.
 *
 * Tenta múltiplas estratégias de URL para compatibilidade com:
 *   - Web (origin normal, ex: https://app.siges.com)
 *   - Capacitor Android (assets servidos em http://localhost)
 *   - Capacitor iOS (assets servidos em capacitor://localhost)
 *
 * Se todas falharem, retorna string vazia — o PDF é gerado sem logo (sem erro fatal).
 */
export async function getLogoBase64(): Promise<string> {
    const logoPath = '/siges_logo.png';
    const origins: string[] = [];

    if (typeof window !== 'undefined') {
        // 1. Origin atual (funciona na web e em alguns contextos Capacitor)
        if (window.location.origin && window.location.origin !== 'null') {
            origins.push(window.location.origin);
        }
        // 2. http://localhost — Capacitor Android serve assets aqui por padrão
        if (!origins.includes('http://localhost')) {
            origins.push('http://localhost');
        }
        // 3. capacitor://localhost — protocolo nativo do Capacitor (iOS / alguns Android)
        origins.push('capacitor://localhost');
    }

    for (const origin of origins) {
        const result = await fetchAsBase64(`${origin}${logoPath}`);
        if (result) return result;
    }

    // Todas as tentativas falharam — retorna vazio para não crashar o PDF
    return '';
}
