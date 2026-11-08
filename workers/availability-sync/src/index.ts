/**
 * siges-availability-sync — Cloudflare Worker que sincroniza a disponibilidade
 * de ativos a partir de APIs externas (substitui o workflow n8n
 * SigesGuaibaFlowAvailability). Ver docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md.
 *
 * Execução:
 *   - Cron Trigger (wrangler.toml): roda todas as integrações ativas.
 *   - POST /run           execução manual (Authorization: Bearer <SYNC_TOKEN>)
 *       ?integration=<id> só uma integração
 *       ?dry=1            força modo observação (nunca grava)
 *   - POST /app/run       execução pelo app (token do usuário + permissão
 *                         settings_external_apis) — ver src/app.ts
 *   - POST /alert/test    envia um e-mail de teste do alerta (Bearer <SYNC_TOKEN>)
 *   - GET  /health        200 "ok"
 *
 * Alerta: execução AGENDADA que falha por inteiro envia e-mail pelo Gmail
 * (src/alert.ts). Sem GMAIL_USER/GMAIL_APP_PASSWORD/ALERT_EMAIL_TO, só loga.
 *
 * Modo observação: DRY_RUN="true" (padrão). Nele o Worker consulta e normaliza,
 * mas não chama a RPC de ingestão. /run não consegue ligar a escrita se o
 * DRY_RUN do ambiente estiver ligado — só é possível forçar observação.
 *
 * Secrets (npx wrangler secret put ...):
 *   SUPABASE_SERVICE_ROLE_KEY   chama fn_add_assets_available (só service_role)
 *   SYNC_TOKEN                  protege POST /run
 *   SUPABASE_ANON_KEY           chave pública; valida sessão/permissão em /app/run
 *   INTEGRATION_<id>_API_KEY    chave da API externa da integração <id>
 *   GMAIL_USER                  conta Gmail que envia os alertas
 *   GMAIL_APP_PASSWORD          app password dessa conta (16 caracteres)
 */

import { connect } from 'cloudflare:sockets';
import { loadIntegrations, syncAll, syncIntegration, type IntegrationReport } from './sync';
import { corsHeaders, handleAppRun, HttpError, type AppEnv } from './app';
import { alertConfigured, buildFailureAlert, toMessage, type AlertEnv } from './alert';
import { sendMail } from './smtp';

export interface Env extends AppEnv, AlertEnv {
    SYNC_TOKEN?: string;
    /** "false" liga a escrita; qualquer outro valor mantém observação. */
    DRY_RUN?: string;
}

interface ScheduledController {
    cron: string;
    scheduledTime: number;
}
interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
}

function envDryRun(env: Env): boolean {
    return env.DRY_RUN !== 'false';
}

async function sendAlertEmail(env: Env, alert: { subject: string; text: string }): Promise<void> {
    const socket = connect({ hostname: 'smtp.gmail.com', port: 465 }, { secureTransport: 'on', allowHalfOpen: false });
    await sendMail(
        socket,
        { user: env.GMAIL_USER as string, password: (env.GMAIL_APP_PASSWORD as string).replace(/\s+/g, '') },
        toMessage(env, alert),
    );
}

/** Execução agendada que falhou por inteiro → e-mail. Falha no envio só vai para o log. */
async function notifyFailure(env: Env, reports: IntegrationReport[], fatalError: string | null): Promise<void> {
    const alert = buildFailureAlert(reports, fatalError, new Date());
    if (!alert) return;
    if (!alertConfigured(env)) {
        console.warn(JSON.stringify({ alert: 'não enviado: GMAIL_USER/GMAIL_APP_PASSWORD/ALERT_EMAIL_TO ausentes' }));
        return;
    }
    try {
        await sendAlertEmail(env, alert);
        console.log(JSON.stringify({ alert: 'enviado', subject: alert.subject }));
    } catch (err) {
        console.error(JSON.stringify({ alert: 'falha no envio', error: String(err).slice(0, 300) }));
    }
}

function logReports(reports: IntegrationReport[], trigger: string): void {
    for (const r of reports) {
        const line = {
            trigger,
            integration: r.integrationId,
            provider: r.providerCode,
            ok: r.ok,
            dryRun: r.dryRun,
            observedAt: r.observedAt,
            stations: r.stationCount,
            missingMappings: r.missingMappings,
            counts: r.counts,
            error: r.error,
            problems: r.problems,
            observation: r.observation,
        };
        if (r.ok) console.log(JSON.stringify(line));
        else console.error(JSON.stringify(line));
    }
}

function timingSafeEqual(a: string, b: string): boolean {
    const enc = new TextEncoder();
    const x = enc.encode(a);
    const y = enc.encode(b);
    let diff = x.length ^ y.length;
    for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
    return diff === 0;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
    });
}

async function handleRun(request: Request, env: Env): Promise<Response> {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!env.SYNC_TOKEN || !token || !timingSafeEqual(token, env.SYNC_TOKEN)) {
        return json({ error: 'não autorizado' }, 401);
    }

    const url = new URL(request.url);
    const dryRun = envDryRun(env) || url.searchParams.get('dry') === '1';
    const only = url.searchParams.get('integration');

    let reports: IntegrationReport[];
    if (only) {
        if (!/^[0-9]{1,18}$/.test(only)) return json({ error: 'integration inválida' }, 400);
        const target = (await loadIntegrations(env, fetch)).find(i => String(i.id) === only);
        if (!target) return json({ error: 'integração ativa não encontrada' }, 404);
        reports = [await syncIntegration(env, target, dryRun)];
    } else {
        reports = await syncAll(env, dryRun);
    }

    logReports(reports, 'manual');
    return json({ dryRun, reports }, reports.every(r => r.ok) ? 200 : 207);
}

export default {
    async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(
            syncAll(env, envDryRun(env))
                .then(async reports => {
                    logReports(reports, 'cron');
                    await notifyFailure(env, reports, null);
                })
                .catch(async err => {
                    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
                    console.error(JSON.stringify({ trigger: 'cron', error: message }));
                    await notifyFailure(env, [], message);
                }),
        );
    },

    async fetch(request: Request, env: Env): Promise<Response> {
        const { pathname } = new URL(request.url);
        if (request.method === 'GET' && pathname === '/health') {
            return new Response('ok', { headers: { 'Cache-Control': 'no-store' } });
        }
        if (pathname === '/app/run') {
            const cors = corsHeaders(request, env);
            if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
            if (request.method !== 'POST') return json({ error: 'método não permitido' }, 405, cors);
            try {
                const result = await handleAppRun(request, env);
                logReports([result.report], 'app');
                return json(result, 200, cors);
            } catch (err) {
                if (err instanceof HttpError) return json({ error: err.message }, err.status, cors);
                return json({ error: 'erro interno: ' + String(err).slice(0, 300) }, 500, cors);
            }
        }
        if (request.method === 'POST' && pathname === '/alert/test') {
            const auth = request.headers.get('Authorization') || '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
            if (!env.SYNC_TOKEN || !token || !timingSafeEqual(token, env.SYNC_TOKEN)) {
                return json({ error: 'não autorizado' }, 401);
            }
            if (!alertConfigured(env)) {
                return json({ error: 'configure GMAIL_USER, GMAIL_APP_PASSWORD e ALERT_EMAIL_TO' }, 400);
            }
            try {
                await sendAlertEmail(env, {
                    subject: '[SIGES] Teste do alerta da sincronização',
                    text: 'Este é um e-mail de teste do Worker siges-availability-sync.\n\nSe chegou, os alertas de falha da sincronização agendada estão configurados.',
                });
                return json({ ok: true, enviadoPara: env.ALERT_EMAIL_TO });
            } catch (err) {
                return json({ error: String(err).slice(0, 300) }, 502);
            }
        }
        if (request.method === 'POST' && pathname === '/run') {
            try {
                return await handleRun(request, env);
            } catch (err) {
                return json({ error: String(err).slice(0, 500) }, 500);
            }
        }
        return json({ error: 'não encontrado' }, 404);
    },
};
