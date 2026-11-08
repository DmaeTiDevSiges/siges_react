import { alertConfigured, buildFailureAlert, recipients } from './alert';
import { buildMime, sendMail, type SmtpSocket } from './smtp';
import type { IntegrationReport } from './sync';

const ok: IntegrationReport = { integrationId: 8, name: 'GuaibaFlow', providerCode: 'guaibaflow', ok: true, dryRun: false };
const failed: IntegrationReport = { ...ok, ok: false, error: 'API externa respondeu HTTP 403' };
const when = new Date('2026-11-08T03:00:05Z'); // 0h00 em Brasília

describe('buildFailureAlert', () => {
    it('não avisa quando a execução deu certo, nem por problemas de estação', () => {
        const comProblemas: IntegrationReport = { ...ok, problems: [{ external_id: '24', result: 'rejected', message: 'x', asset_available_id: null }] };
        expect(buildFailureAlert([ok, comProblemas], null, when)).toBeNull();
    });

    it('avisa a falha inteira de uma integração, com horário de Brasília', () => {
        const a = buildFailureAlert([ok, failed], null, when)!;
        expect(a.subject).toBe('[SIGES] Falha na sincronização: GuaibaFlow');
        expect(a.text).toContain('08/11/2026, 00:00');
        expect(a.text).toContain('integração 8');
        expect(a.text).toContain('API externa respondeu HTTP 403');
    });

    it('avisa erro antes de qualquer integração', () => {
        const a = buildFailureAlert([], 'SIGES respondeu HTTP 401', when)!;
        expect(a.subject).toContain('todas as integrações');
        expect(a.text).toContain('SIGES respondeu HTTP 401');
    });
});

describe('configuração', () => {
    it('exige conta, app password e ao menos um destinatário válido', () => {
        expect(recipients({ ALERT_EMAIL_TO: 'a@x.com, inválido ,b@y.com.br' })).toEqual(['a@x.com', 'b@y.com.br']);
        expect(alertConfigured({ GMAIL_USER: 'u@gmail.com', GMAIL_APP_PASSWORD: 'p', ALERT_EMAIL_TO: '' })).toBe(false);
        expect(alertConfigured({ GMAIL_USER: 'u@gmail.com', GMAIL_APP_PASSWORD: 'p', ALERT_EMAIL_TO: 'a@x.com' })).toBe(true);
    });
});

/** Servidor SMTP simulado: responde cada comando e guarda o que recebeu. */
function fakeSmtp(authCode = '235') {
    const received: string[] = [];
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const enc = new TextEncoder();
    const reply = (s: string) => controller.enqueue(enc.encode(s + '\r\n'));
    let inData = false;
    let pending = '';
    const readable = new ReadableStream<Uint8Array>({ start(c) { controller = c; reply('220 smtp.gmail.com ESMTP'); } });
    const writable = new WritableStream<Uint8Array>({
        write(chunk) {
            pending += new TextDecoder().decode(chunk);
            let i;
            while ((i = pending.indexOf('\r\n')) >= 0) {
                const line = pending.slice(0, i);
                pending = pending.slice(i + 2);
                received.push(line);
                if (inData) {
                    if (line === '.') { inData = false; reply('250 2.0.0 OK queued'); }
                    continue;
                }
                if (line.startsWith('EHLO')) { reply('250-smtp.gmail.com'); reply('250 AUTH LOGIN PLAIN'); }
                else if (line === 'AUTH LOGIN') reply('334 VXNlcm5hbWU6');
                else if (received.length === 3) reply('334 UGFzc3dvcmQ6');
                else if (received.length === 4) { if (authCode === '235') reply('235 2.7.0 Accepted'); else { reply('535-5.7.8 Username and Password not accepted.'); reply('535 5.7.8 https://support.google.com/mail/?p=BadCredentials'); } }
                else if (line.startsWith('MAIL FROM') || line.startsWith('RCPT TO')) reply('250 2.1.0 OK');
                else if (line === 'DATA') { inData = true; reply('354 Go ahead'); }
                else if (line === 'QUIT') reply('221 bye');
            }
        },
    });
    const socket: SmtpSocket = { readable, writable, close: () => { try { controller.close(); } catch { /* fechado */ } } };
    return { socket, received };
}

describe('sendMail', () => {
    const msg = { from: 'siges@gmail.com', to: ['a@x.com', 'b@y.com'], subject: '[SIGES] Falha na sincronização', text: 'Olá, ação necessária.' };

    it('autentica, envia a todos os destinatários e codifica acentos', async () => {
        const { socket, received } = fakeSmtp();
        await sendMail(socket, { user: 'siges@gmail.com', password: 'abcd efgh' }, msg);
        expect(received[0]).toBe('EHLO siges-availability-sync');
        expect(received[2]).toBe(btoa('siges@gmail.com'));
        expect(received).toContain('RCPT TO:<a@x.com>');
        expect(received).toContain('RCPT TO:<b@y.com>');
        const utf8b64 = btoa(String.fromCharCode(...new TextEncoder().encode(msg.subject)));
        expect(received).toContain('Subject: =?UTF-8?B?' + utf8b64 + '?=');
        expect(received.at(-1)).toBe('QUIT');
    });

    it('falha com mensagem clara quando o Gmail recusa a senha', async () => {
        const { socket } = fakeSmtp('535');
        await expect(sendMail(socket, { user: 'u', password: 'errada' }, msg)).rejects.toThrow(/esperado 235.*535/);
    });

    it('desiste quando o servidor não responde', async () => {
        const mute: SmtpSocket = { readable: new ReadableStream<Uint8Array>(), writable: new WritableStream<Uint8Array>(), close: () => undefined };
        await expect(sendMail(mute, { user: 'u', password: 'p' }, msg, 50)).rejects.toThrow(/sem resposta/);
    });

    it('corpo em base64 com linhas de até 76 caracteres', () => {
        const body = buildMime({ ...msg, text: 'x'.repeat(500) }).split('\r\n\r\n')[1];
        expect(body.split('\r\n').every(l => l.length <= 76)).toBe(true);
    });
});
