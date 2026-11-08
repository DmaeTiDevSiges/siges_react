/**
 * Alerta por e-mail quando uma execução AGENDADA falha por inteiro
 * (decisão de 07/11/2026: só falha da execução inteira gera aviso).
 *
 * "Falha inteira" = nada daquela integração foi processado: API fora do ar,
 * chave inválida, formato inesperado, 401 no Supabase etc. (report.error),
 * ou erro antes de qualquer integração (ex.: não conseguiu ler a configuração).
 * Estações rejeitadas, sem mapeamento ou com erro individual NÃO geram e-mail.
 */

import type { IntegrationReport } from './sync';
import type { MailMessage } from './smtp';

export interface AlertEnv {
    /** Conta Gmail que envia (secret). */
    GMAIL_USER?: string;
    /** App password de 16 caracteres da conta Gmail (secret). */
    GMAIL_APP_PASSWORD?: string;
    /** Destinatários, separados por vírgula (var). */
    ALERT_EMAIL_TO?: string;
}

export function alertConfigured(env: AlertEnv): boolean {
    return !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD && recipients(env).length > 0);
}

export function recipients(env: AlertEnv): string[] {
    return (env.ALERT_EMAIL_TO || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s));
}

function brasilia(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

/** Monta o e-mail, ou null quando não houve falha inteira. */
export function buildFailureAlert(
    reports: IntegrationReport[],
    fatalError: string | null,
    when: Date,
): { subject: string; text: string } | null {
    const failed = reports.filter(r => r.error);
    if (!fatalError && failed.length === 0) return null;

    const lines: string[] = [
        `A sincronização agendada de disponibilidade de ativos falhou em ${brasilia(when)} (horário de Brasília).`,
        '',
    ];
    if (fatalError) {
        lines.push('Nenhuma integração foi processada:', `  ${fatalError}`, '');
    }
    for (const r of failed) {
        lines.push(`• ${r.name} (integração ${r.integrationId}, ${r.providerCode})`, `  ${r.error}`, '');
    }
    lines.push(
        'Nada foi gravado para as integrações acima nesta execução. A próxima roda no horário agendado.',
        '',
        'Onde investigar:',
        '  - Cloudflare → Workers → siges-availability-sync → Logs',
        '  - SIGES → Ajustes → APIs Externas → botão Executar → Testar',
        '  - Guia de erros: doc "Integração GuaibaFlow → SIGES", seção Solução de problemas',
    );

    const names = fatalError ? 'todas as integrações' : failed.map(r => r.name).join(', ');
    return { subject: `[SIGES] Falha na sincronização: ${names}`, text: lines.join('\n') };
}

export function toMessage(env: AlertEnv, alert: { subject: string; text: string }): MailMessage {
    return { from: env.GMAIL_USER as string, to: recipients(env), subject: alert.subject, text: alert.text };
}
