/**
 * Retrato compacto da rede/estado do app no momento de uma falha, para ir no
 * `extra` de logs_app_client_events (limite de 4000 caracteres). Serve para
 * separar "aparelho sem rede / WebView acordando" de "servidor inacessível":
 * se os erros vierem com online=true e visibility=visible em vários aparelhos
 * no mesmo horário, a causa está no servidor/Cloudflare.
 */
export const networkSnapshot = (): Record<string, unknown> => {
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
        | (Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } })
        | undefined;
    const conn = nav?.connection;
    return {
        online: nav?.onLine ?? null,
        visibility: typeof document !== 'undefined' ? document.visibilityState : null,
        netType: conn?.effectiveType ?? null,
        downlink: conn?.downlink ?? null,
        rtt: conn?.rtt ?? null,
        saveData: conn?.saveData ?? null,
        sinceLoadMs: typeof performance !== 'undefined' ? Math.round(performance.now()) : null,
    };
};
