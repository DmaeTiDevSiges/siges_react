// Tipos mínimos do módulo do runtime (evita dependência de @cloudflare/workers-types).
declare module 'cloudflare:sockets' {
    export interface Socket {
        readable: ReadableStream<Uint8Array>;
        writable: WritableStream<Uint8Array>;
        closed: Promise<void>;
        close(): Promise<void>;
    }
    export function connect(
        address: { hostname: string; port: number },
        options?: { secureTransport?: 'off' | 'on' | 'starttls'; allowHalfOpen?: boolean },
    ): Socket;
}
