#!/usr/bin/env node
/**
 * Testa o servidor siges-tools SEM o Hermes: sobe dist/index.js, faz o handshake MCP
 * e chama uma ferramenta como se fosse o usuário do celular informado (token assinado
 * com SIGES_HOOK_SECRET, igual ao plugin siges-identity). Mostra o tempo da chamada.
 *
 * Uso:
 *   node dist/cli-test.js list
 *   node dist/cli-test.js <celular> <ferramenta> ['{"arg":"valor"}']
 * Ex.:
 *   node dist/cli-test.js 5551994080765 siges_unidade '{"busca":"301"}'
 */
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
}

const [cmd, toolName, rawArgs] = process.argv.slice(2);
if (!cmd) {
    console.error('Uso: node dist/cli-test.js list | <celular> <ferramenta> [json]');
    process.exit(2);
}

function sign(sender: string): string {
    const secret = process.env.SIGES_HOOK_SECRET;
    if (!secret) throw new Error('SIGES_HOOK_SECRET ausente no .env');
    const b64 = Buffer.from(sender).toString('base64url');
    const ts = Math.floor(Date.now() / 1000);
    const payload = `v1.${b64}.${ts}`;
    return `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

const child = spawn(process.execPath, [resolve(here, 'index.js')], { stdio: ['pipe', 'pipe', 'inherit'] });
const pending = new Map<number, (msg: any) => void>();
createInterface({ input: child.stdout }).on('line', line => {
    try {
        const msg = JSON.parse(line);
        pending.get(msg.id)?.(msg);
    } catch { /* ignora linhas não-JSON */ }
});
let nextId = 1;
function rpc(method: string, params?: unknown): Promise<any> {
    const id = nextId++;
    return new Promise(res => {
        pending.set(id, res);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
}

try {
    await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'cli-test', version: '0' } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    if (cmd === 'list') {
        const r = await rpc('tools/list');
        for (const t of r.result.tools) console.log(`- ${t.name}: ${t.description.slice(0, 90)}`);
    } else {
        const args = { ...(rawArgs ? JSON.parse(rawArgs) : {}), _siges_auth: sign(cmd) };
        const t0 = Date.now();
        const r = await rpc('tools/call', { name: toolName, arguments: args });
        const ms = Date.now() - t0;
        if (r.error) console.log('ERRO MCP:', JSON.stringify(r.error));
        else console.log((r.result.isError ? '[isError] ' : '') + r.result.content.map((c: any) => c.text).join('\n'));
        console.log(`\n⏱  ${ms} ms`);
    }
} finally {
    child.kill();
}
