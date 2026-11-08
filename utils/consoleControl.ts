/**
 * Console silencioso: a única mensagem do app no console é a versão.
 *
 * Carregado como o PRIMEIRO import de index.tsx, antes de qualquer outro módulo,
 * para silenciar também o que é logado na carga dos módulos e pelas bibliotecas.
 * As ~1.500 chamadas console.* do código continuam no fonte (diagnóstico), só
 * não aparecem.
 *
 * Para investigar um problema, ligar o modo diagnóstico no console do navegador:
 *   sigesDebug(true)   → recarrega com todas as mensagens
 *   sigesDebug(false)  → volta ao console silencioso
 * (fica salvo em localStorage 'siges_debug' só naquele navegador)
 *
 * Mensagens do próprio navegador (falhas de rede, avisos de segurança, cliente
 * do Vite em desenvolvimento) não passam por aqui e não podem ser escondidas.
 */

const STORAGE_KEY = 'siges_debug';

const SILENCED = [
    'log', 'info', 'debug', 'warn', 'error', 'trace', 'table', 'dir', 'dirxml',
    'group', 'groupCollapsed', 'groupEnd', 'time', 'timeLog', 'timeEnd', 'count', 'countReset', 'assert',
] as const;

const originalLog = console.log.bind(console);

function debugEnabled(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

if (!debugEnabled()) {
    const noop = () => undefined;
    const target = console as unknown as Record<string, unknown>;
    for (const method of SILENCED) {
        if (typeof target[method] === 'function') target[method] = noop;
    }
}

declare global {
    interface Window {
        sigesDebug?: (on: boolean) => void;
    }
}

if (typeof window !== 'undefined') {
    window.sigesDebug = (on: boolean) => {
        try {
            if (on) localStorage.setItem(STORAGE_KEY, '1');
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* sem localStorage: nada a fazer */
        }
        window.location.reload();
    };
}

/** Única mensagem que sempre aparece no console. */
export function logAppVersion(version: string): void {
    originalLog(`Siges versão ${version}`);
}
