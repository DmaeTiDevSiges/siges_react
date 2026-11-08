import { changedIds } from './useRecentlyChanged';

const m = (entries: [string, string][]) => new Map(entries);

describe('changedIds', () => {
    it('acusa só os ids com assinatura diferente', () => {
        const prev = m([['1', 'on|10:00'], ['2', 'on|10:00'], ['3', 'off|09:00']]);
        const next = m([['1', 'on|10:00'], ['2', 'off|10:15'], ['3', 'off|09:00']]);
        expect(changedIds(prev, next)).toEqual(['2']);
    });

    it('item novo conta como mudança; item removido não', () => {
        const prev = m([['1', 'a'], ['2', 'b']]);
        const next = m([['1', 'a'], ['3', 'c']]);
        expect(changedIds(prev, next)).toEqual(['3']);
    });

    it('cascata: vários setores alterados de uma vez aparecem todos', () => {
        const prev = m([['10', 'on'], ['11', 'on'], ['12', 'on']]);
        const next = m([['10', 'off'], ['11', 'off'], ['12', 'on']]);
        expect(changedIds(prev, next)).toEqual(['10', '11']);
    });

    it('nada muda → lista vazia', () => {
        const same = m([['1', 'x']]);
        expect(changedIds(same, new Map(same))).toEqual([]);
    });
});
