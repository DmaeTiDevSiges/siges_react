#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';
import { getSiges } from './siges.js';

// Carrega workers/hermes-mcp/.env (sem dependência extra). Variáveis já
// definidas no ambiente (ex.: pelo config do Hermes) têm prioridade.
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
}

const server = new McpServer({ name: 'siges-tools', version: '0.1.0' });
registerTools(server);

// stdout é o canal do protocolo MCP — logs só em stderr.
try {
    const { me } = await getSiges();
    console.error(`[siges-tools] conectado como ${me.name} (user_id ${me.id})`);
} catch (err) {
    // Não derruba o servidor: cada ferramenta tenta o login de novo e devolve o erro ao agente.
    console.error('[siges-tools] login inicial falhou:', err instanceof Error ? err.message : err);
}

await server.connect(new StdioServerTransport());
