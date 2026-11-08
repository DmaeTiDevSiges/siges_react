import { z } from 'zod';
import { MAX_ROWS } from './siges.js';
import { AccessDenied } from './identity.js';

/** Utilitários compartilhados pelas ferramentas MCP. */

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const limitArg = z.number().int().min(1).max(MAX_ROWS).optional()
    .describe(`Máximo de itens (padrão 20, teto ${MAX_ROWS})`);

/** Texto livre seguro para ilike / filtros .or() do PostgREST. */
export const likeTerm = (s: string) => s.replace(/[%_,()]/g, ' ').trim();

/** Remove null/undefined/'' para enxugar a resposta (menos tokens, menos confusão do modelo). */
function prune(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(prune);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            if (v === null || v === undefined || v === '') continue;
            out[k] = prune(v);
        }
        return out;
    }
    return value;
}

function ok(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(prune(data)) }] };
}

/** Texto que deixa explícito ao modelo o escopo da consulta (evita "faltam visitas" quando o filtro era só do usuário). */
export const scopeLabel = (onlyMine: boolean) =>
    onlyMine ? 'somente as do usuário vinculado (líder ou equipe)' : 'todas que o usuário pode ver no SIGES';

function fail(err: unknown) {
    if (err instanceof AccessDenied) {
        return { isError: true, content: [{ type: 'text' as const, text: `Acesso negado ao SIGES: ${err.message} Não tente novamente; explique ao usuário que ele precisa falar com o administrador do SIGES.` }] };
    }
    const message = err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err);
    return { isError: true, content: [{ type: 'text' as const, text: `Erro ao consultar o SIGES: ${message}` }] };
}

/** Envolve o handler com tratamento de erro uniforme. */
export function safe<A>(fn: (args: A) => Promise<unknown>) {
    return async (args: A) => {
        try {
            return ok(await fn(args));
        } catch (err) {
            return fail(err);
        }
    };
}
