import { enqueueArrival, type NotificationArrival } from './useNotificationArrival';

const n = (id: string, senderId: string | null, avatarUrl: string | null = null): NotificationArrival => ({ id, senderId, avatarUrl });

describe('enqueueArrival', () => {
    it('enfileira notificações de remetentes diferentes', () => {
        const q = enqueueArrival(enqueueArrival([], n('1', 'a'), new Set()), n('2', 'b'), new Set());
        expect(q.map(x => x.id)).toEqual(['1', '2']);
    });

    it('ignora id já exibido ou já na fila', () => {
        expect(enqueueArrival([], n('1', 'a'), new Set(['1']))).toEqual([]);
        const q = [n('1', 'a')];
        expect(enqueueArrival(q, n('1', 'a'), new Set())).toBe(q);
    });

    it('rajada do mesmo remetente vira um efeito só (o mais recente)', () => {
        const q = enqueueArrival([n('1', 'a', 'x.png')], n('2', 'a', 'y.png'), new Set());
        expect(q).toEqual([n('2', 'a', 'y.png')]);
    });

    it('notificações do sistema (sem remetente) não se agrupam', () => {
        const q = enqueueArrival([n('1', null)], n('2', null), new Set());
        expect(q.map(x => x.id)).toEqual(['1', '2']);
    });

    it('guarda no máximo 3, descartando as mais antigas', () => {
        let q: NotificationArrival[] = [];
        for (const [id, s] of [['1', 'a'], ['2', 'b'], ['3', 'c'], ['4', 'd']] as const) q = enqueueArrival(q, n(id, s), new Set());
        expect(q.map(x => x.id)).toEqual(['2', '3', '4']);
    });
});
