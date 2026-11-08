/**
 * Contador de falhas de rede das chamadas ao Supabase.
 *
 * Por quê: os serviços do app, em erro, geralmente fazem console.error e
 * devolvem [] ou null — não lançam. Sem isso, o cache de leitura gravaria a
 * lista vazia de uma queda de sinal por cima dos dados bons. O cliente
 * Supabase usa `createTrackingFetch` (services/core/supabase.ts); toda falha
 * de rede incrementa o contador, e o cache compara antes/depois da chamada.
 */
let failures = 0;

export const networkFailureCount = (): number => failures;

export const markNetworkFailure = (): void => {
    failures++;
};

/** Só para testes. */
export const resetNetworkFailures = (): void => {
    failures = 0;
};

export interface TrackingFetchOptions {
    /** Quando devolve um número (ms), leituras REST sem `signal` próprio ganham esse limite. */
    readTimeoutMs?: () => number | null;
}

const isRestRead = (input: RequestInfo | URL, init?: RequestInit): boolean => {
    const method = (init?.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return false;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    return url.includes('/rest/v1/');
};

/**
 * Envolve o fetch: conta falhas de rede (não conta AbortError do próprio app)
 * e, opcionalmente, põe limite de tempo nas leituras REST — com sinal
 * "conectado" mas sem internet de verdade, a requisição ficaria pendurada.
 */
export const createTrackingFetch = (
    baseFetch: typeof fetch,
    options: TrackingFetchOptions = {},
): typeof fetch => {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
        const timeoutMs = !init?.signal && isRestRead(input, init) ? options.readTimeoutMs?.() ?? null : null;
        let timedOut = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let finalInit = init;

        if (timeoutMs && typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            timer = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, timeoutMs);
            finalInit = { ...init, signal: controller.signal };
        }

        try {
            return await baseFetch(input, finalInit);
        } catch (error: any) {
            if (timedOut || error?.name !== 'AbortError') markNetworkFailure();
            throw error;
        } finally {
            if (timer) clearTimeout(timer);
        }
    };
};
