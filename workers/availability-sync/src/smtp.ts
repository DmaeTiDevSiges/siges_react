/**
 * Cliente SMTP mínimo para enviar alertas pelo Gmail (smtp.gmail.com:465, TLS
 * implícito, AUTH LOGIN com app password). Sem dependências: o socket é
 * injetado, e em produção vem de `connect()` do runtime (cloudflare:sockets).
 */

export interface SmtpSocket {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    close(): Promise<void> | void;
}

export interface MailMessage {
    from: string;
    to: string[];
    subject: string;
    text: string;
}

export interface SmtpCredentials {
    user: string;
    password: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(text: string): string {
    const bytes = enc.encode(text);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}

/** Assunto com acentos: encoded-word UTF-8 (RFC 2047). */
function encodeHeader(text: string): string {
    return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${b64(text)}?=`;
}

function wrap76(s: string): string {
    return s.replace(/.{1,76}/g, '$&\r\n').trimEnd();
}

export function buildMime(msg: MailMessage, date = new Date()): string {
    const headers = [
        `From: SIGES <${msg.from}>`,
        `To: ${msg.to.join(', ')}`,
        `Subject: ${encodeHeader(msg.subject)}`,
        `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    // Corpo em base64: acentos sem risco e nenhuma linha começa com "." (dot-stuffing).
    return headers.join('\r\n') + '\r\n\r\n' + wrap76(b64(msg.text)) + '\r\n';
}

class LineReader {
    private buffer = '';
    private reader: ReadableStreamDefaultReader<Uint8Array>;

    constructor(stream: ReadableStream<Uint8Array>) {
        this.reader = stream.getReader();
    }

    private async line(): Promise<string> {
        while (!this.buffer.includes('\r\n')) {
            const { value, done } = await this.reader.read();
            if (done) throw new Error('SMTP: conexão encerrada pelo servidor');
            this.buffer += dec.decode(value, { stream: true });
        }
        const i = this.buffer.indexOf('\r\n');
        const out = this.buffer.slice(0, i);
        this.buffer = this.buffer.slice(i + 2);
        return out;
    }

    /** Lê uma resposta completa (multi-linha "250-..." até "250 ...") e confere o código. */
    async expect(code: number): Promise<string> {
        let last = '';
        do {
            last = await this.line();
        } while (/^\d{3}-/.test(last));
        if (!last.startsWith(String(code))) {
            // Nunca ecoa credenciais: a resposta do servidor não as contém.
            throw new Error(`SMTP: esperado ${code}, recebido "${last.slice(0, 160)}"`);
        }
        return last;
    }

    release(): void {
        this.reader.releaseLock();
    }
}

const SMTP_TIMEOUT_MS = 20_000;

/** Envia o e-mail; desiste após 20 s (servidor mudo não prende o Worker). */
export async function sendMail(
    socket: SmtpSocket,
    creds: SmtpCredentials,
    msg: MailMessage,
    timeoutMs = SMTP_TIMEOUT_MS,
): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`SMTP: sem resposta em ${timeoutMs / 1000} s`));
            Promise.resolve(socket.close()).catch(() => undefined);
        }, timeoutMs);
    });
    try {
        await Promise.race([dialog(socket, creds, msg), timeout]);
    } finally {
        clearTimeout(timer);
    }
}

async function dialog(socket: SmtpSocket, creds: SmtpCredentials, msg: MailMessage): Promise<void> {
    const writer = socket.writable.getWriter();
    const reader = new LineReader(socket.readable);
    const send = (line: string) => writer.write(enc.encode(line + '\r\n'));

    try {
        await reader.expect(220);
        await send('EHLO siges-availability-sync');
        await reader.expect(250);
        await send('AUTH LOGIN');
        await reader.expect(334);
        await send(b64(creds.user));
        await reader.expect(334);
        await send(b64(creds.password));
        await reader.expect(235);
        await send(`MAIL FROM:<${msg.from}>`);
        await reader.expect(250);
        for (const rcpt of msg.to) {
            await send(`RCPT TO:<${rcpt}>`);
            await reader.expect(250);
        }
        await send('DATA');
        await reader.expect(354);
        await writer.write(enc.encode(buildMime(msg) + '.\r\n'));
        await reader.expect(250);
        await send('QUIT');
    } finally {
        try { reader.release(); } catch { /* já liberado */ }
        try { writer.releaseLock(); } catch { /* já liberado */ }
        await socket.close();
    }
}
