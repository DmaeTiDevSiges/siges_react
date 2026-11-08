#!/usr/bin/env node
/**
 * Sincroniza a lista de permitidos do WhatsApp do Hermes (WHATSAPP_ALLOWED_USERS em
 * ~/.hermes/.env) com os usuários ATIVOS do SIGES que têm celular (users.mobile_full).
 *
 * - Só reescreve o arquivo e reinicia o gateway quando a lista muda.
 * - Proteções: nunca grava lista vazia; se a lista encolher mais de 50% de uma vez,
 *   não aplica (provável erro de consulta) — rode com --force para aplicar mesmo assim.
 * - Números extras fixos (ex.: o dono): SIGES_ALLOWLIST_EXTRA=5551...,5551...
 *
 * Uso:  node dist/sync-allowlist.js [--dry-run] [--force]
 * Rodado pelo timer systemd siges-allowlist.timer (ver README).
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { signJwt } from './identity.js';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const ENV_KEY = 'WHATSAPP_ALLOWED_USERS';

function loadDotEnv(path: string): void {
    if (!existsSync(path)) return;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
}

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
    return v;
}

const log = (msg: string) => console.log(`[siges-allowlist] ${new Date().toISOString()} ${msg}`);

const digits = (s: string) => s.replace(/\D/g, '');

async function fetchSigesNumbers(): Promise<string[]> {
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({ role: 'service_role', iss: 'siges-allowlist', iat: now, exp: now + 120 }, requireEnv('SUPABASE_JWT_SECRET'));
    const db = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const numbers = new Set<string>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await db
            .from('users')
            .select('mobile_full')
            .eq('is_available', true)
            .not('mobile_full', 'is', null)
            .order('id')
            .range(from, from + pageSize - 1);
        if (error) throw error;
        for (const row of data ?? []) {
            const n = digits(String(row.mobile_full ?? ''));
            // Celular BR completo: 55 + DDD + 9 dígitos. Ignora cadastros incompletos.
            if (/^55\d{2}9\d{8}$/.test(n)) {
                numbers.add(n);
                // Contas antigas do WhatsApp são identificadas SEM o 9º dígito
                // (ex.: 555194080770). Incluir as duas formas — mesma regra do servidor (phoneCandidates).
                numbers.add(n.slice(0, 4) + n.slice(5));
            }
        }
        if (!data || data.length < pageSize) break;
    }
    return [...numbers];
}

function readCurrent(envText: string): string[] {
    const m = envText.match(new RegExp(`^${ENV_KEY}=(.*)$`, 'm'));
    if (!m) return [];
    return m[1].replace(/^(['"])(.*)\1$/, '$2').split(',').map(s => s.trim()).filter(Boolean);
}

function restartGateway(): void {
    const bin = process.env.HERMES_BIN || 'hermes';
    execFileSync(bin, ['gateway', 'stop'], { stdio: 'inherit' });
    execFileSync(bin, ['gateway', 'start'], { stdio: 'inherit' });
}

async function main(): Promise<void> {
    loadDotEnv(resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env'));
    const hermesEnv = process.env.HERMES_ENV_FILE || join(homedir(), '.hermes', '.env');
    if (!existsSync(hermesEnv)) throw new Error(`Arquivo do Hermes não encontrado: ${hermesEnv}`);

    const extra = (process.env.SIGES_ALLOWLIST_EXTRA || '').split(',').map(digits).filter(Boolean);
    const fromSiges = await fetchSigesNumbers();
    const next = [...new Set([...extra, ...fromSiges])].sort();

    const envText = readFileSync(hermesEnv, 'utf8');
    const current = [...new Set(readCurrent(envText))].sort();

    const added = next.filter(n => !current.includes(n));
    const removed = current.filter(n => !next.includes(n));
    log(`SIGES: ${fromSiges.length / 2} celulares ativos (${fromSiges.length} formas, com e sem o 9) | extras: ${extra.length} | atual: ${current.length} | +${added.length} -${removed.length}`);

    if (!added.length && !removed.length) { log('sem mudanças.'); return; }
    if (!next.length) throw new Error('lista resultante vazia — não aplicado (verifique a consulta ao SIGES).');
    if (!FORCE && current.length >= 4 && next.length < current.length * 0.5) {
        throw new Error(`lista encolheria de ${current.length} para ${next.length} — não aplicado. Confira e rode com --force.`);
    }
    if (DRY_RUN) { log(`[dry-run] adicionaria: ${added.join(', ') || '-'} | removeria: ${removed.join(', ') || '-'}`); return; }

    copyFileSync(hermesEnv, `${hermesEnv}.bak`);
    const line = `${ENV_KEY}=${next.join(',')}`;
    const updated = new RegExp(`^${ENV_KEY}=.*$`, 'm').test(envText)
        ? envText.replace(new RegExp(`^${ENV_KEY}=.*$`, 'm'), line)
        : `${envText.replace(/\n?$/, '\n')}${line}\n`;
    writeFileSync(hermesEnv, updated, { mode: 0o600 });
    log(`lista atualizada (${next.length} números; backup em ${hermesEnv}.bak). Reiniciando gateway...`);
    restartGateway();
    log('gateway reiniciado.');
}

main().catch(err => {
    console.error(`[siges-allowlist] ERRO: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    process.exit(1);
});
