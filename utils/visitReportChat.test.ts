import { buildReportChat, sanitizePdfText } from './visitReportChat';

const msg = (over: Record<string, unknown>) => ({
    id: '1', ovId: '9', userId: '2', userName: 'Ana', createdAt: '2026-11-25T10:00:00',
    message: 'ok', isActionItem: false, isResolved: false, infoRequested: false, ...over,
}) as any;

describe('buildReportChat', () => {
    it('sem mensagens (ou vazias) não gera seção', () => {
        expect(buildReportChat(undefined)).toEqual([]);
        expect(buildReportChat([msg({ message: '   ' })])).toEqual([]);
    });

    it('mantém acentos e quebras de linha e tira emojis', () => {
        expect(sanitizePdfText('Válvula trocada 👍\r\nOk — “feito”')).toBe('Válvula trocada \nOk — “feito”');
    });

    it('mensagem só com emoji continua no relatório', () => {
        expect(buildReportChat([msg({ message: '👍' })])[0].message).toBe('(mensagem sem texto imprimível)');
    });

    it('marca ação pendente, resolvida e informação solicitada', () => {
        const tags = buildReportChat([
            msg({ isActionItem: true }),
            msg({ isActionItem: true, isResolved: true }),
            msg({ infoRequested: true }),
            msg({}),
        ]).map(m => m.tag);
        expect(tags).toEqual(['Ação pendente', 'Ação resolvida', 'Informação solicitada', '']);
    });
});
