import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Identidade do remetente no modo MULTIUSUÁRIO.
 *
 * Quem chama a ferramenta é o modelo de IA, então NADA que ele escreve é confiável
 * para identificar o usuário. O plugin do Hermes (hook pre_tool_call, código fora
 * da IA) pega o remetente da sessão do gateway e grava em `_siges_auth` um token
 * assinado com SIGES_HOOK_SECRET, sobrescrevendo o que o modelo tiver posto ali.
 *
 * Formato:  v1.<remetente_base64url>.<unix_ts>.<hmac_sha256_hex>
 * HMAC sobre: "v1.<remetente_base64url>.<unix_ts>"
 */

export const AUTH_ARG = '_siges_auth';
const MAX_AGE_SECONDS = 300;

/** Contexto da chamada de ferramenta em andamento (token bruto vindo do hook). */
export const callContext = new AsyncLocalStorage<{ auth?: string }>();

export class AccessDenied extends Error {}

export function verifySenderToken(token: string | undefined, secret: string): string {
    if (!token) throw new AccessDenied('remetente não identificado (o plugin do Hermes não assinou a chamada).');
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') throw new AccessDenied('token de remetente inválido.');
    const [, senderB64, ts, sig] = parts;

    const expected = createHmac('sha256', secret).update(`v1.${senderB64}.${ts}`).digest('hex');
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new AccessDenied('assinatura do remetente inválida.');

    const age = Math.floor(Date.now() / 1000) - Number(ts);
    if (!Number.isFinite(age) || age < -60 || age > MAX_AGE_SECONDS) throw new AccessDenied('token de remetente expirado.');

    return Buffer.from(senderB64, 'base64url').toString('utf8');
}

/**
 * Converte o remetente do WhatsApp em candidatos de `users.mobile_full`
 * (formato 5551994080765). Aceita "5551994080765", "+55 51 99408-0765",
 * "5551994080765@s.whatsapp.net". Trata o 9º dígito (números antigos aparecem sem ele).
 */
export function phoneCandidates(sender: string): string[] {
    if (/@lid$/i.test(sender)) {
        throw new AccessDenied('o WhatsApp entregou um identificador LID, não um telefone; o plugin precisa resolver o número.');
    }
    const digits = sender.split('@')[0].replace(/\D/g, '');
    if (digits.length < 10) throw new AccessDenied('remetente não é um telefone válido.');
    const out = new Set([digits]);
    if (digits.startsWith('55')) {
        if (digits.length === 13 && digits[4] === '9') out.add(digits.slice(0, 4) + digits.slice(5)); // sem o 9
        if (digits.length === 12) out.add(digits.slice(0, 4) + '9' + digits.slice(4));                 // com o 9
    }
    return [...out];
}

/** JWT HS256 (mesmo formato que o GoTrue do Supabase self-hosted emite). */
export function signJwt(payload: Record<string, unknown>, secret: string): string {
    const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const body = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}`;
    return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}
