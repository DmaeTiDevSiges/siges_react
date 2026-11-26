import type { OrderVisitChatMessage } from '../types';

/** Mensagem do chat já preparada para o relatório PDF da visita. */
export interface ReportChatMessage {
    id: string;
    userName: string;
    createdAt: string;
    message: string;
    /** "Ação pendente", "Ação resolvida" ou "Informação solicitada" (vazio = mensagem comum). */
    tag: string;
}

// A fonte padrão do PDF (Helvetica) não tem emojis nem alfabetos fora do latino: sairiam
// como lixo. Fica o Latin-1 e a pontuação tipográfica comum.
const UNSUPPORTED = /[^\n\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g;

export const sanitizePdfText = (text: string): string =>
    (text || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\t/g, ' ')
        .replace(UNSUPPORTED, '')
        .replace(/ {2,}/g, ' ')
        .trim();

const tagOf = (m: OrderVisitChatMessage): string => {
    if (m.isActionItem) return m.isResolved ? 'Ação resolvida' : 'Ação pendente';
    if (m.infoRequested) return 'Informação solicitada';
    return '';
};

export const buildReportChat = (messages: OrderVisitChatMessage[] | null | undefined): ReportChatMessage[] =>
    (messages || [])
        .map(m => ({
            id: m.id,
            userName: sanitizePdfText(m.userName || '') || 'Usuário',
            createdAt: m.createdAt,
            // Só emoji: a mensagem não some do relatório.
            message: sanitizePdfText(m.message) || ((m.message || '').trim() ? '(mensagem sem texto imprimível)' : ''),
            tag: tagOf(m),
        }))
        .filter(m => m.message);
