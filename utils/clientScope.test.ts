import {
    normalizeClientScope,
    normalizeSystemParentFilterIds,
    resolveSystemParentFilterIds,
    systemsScopeOption,
    pruneSystemFilterOutsideOptions
} from './clientScope';

describe('normalizeClientScope', () => {
    it('sem parâmetro (undefined/null) = sem corte (null)', () => {
        expect(normalizeClientScope(undefined)).toBeNull();
        expect(normalizeClientScope(null)).toBeNull();
    });

    it('lista vazia = sem acesso (não vira null)', () => {
        expect(normalizeClientScope([])).toEqual([]);
        expect(normalizeClientScope([''])).toEqual([]);
    });

    it('normaliza string/number e remove inválidos e duplicados', () => {
        expect(normalizeClientScope(['8', 10, '10', 0, -2, 'abc', NaN, null as any]))
            .toEqual([8, 10]);
    });

    it('remove ids repetidos mesmo em formatos diferentes', () => {
        expect(normalizeClientScope([8, '8', 8])).toEqual([8]);
    });
});

describe('systemsScopeOption', () => {
    it('leva os clients_ids do departamento (vale para TODOS os perfis, inclusive super admin)', () => {
        expect(systemsScopeOption(['8', '10'])).toEqual(['8', '10']);
        expect(systemsScopeOption([8, 10])).toEqual(['8', '10']);
    });

    it('depto sem escopo = lista vazia (nenhum sistema exibido)', () => {
        expect(systemsScopeOption([])).toEqual([]);
        expect(systemsScopeOption(undefined)).toEqual([]);
    });
});

describe('normalizeSystemParentFilterIds', () => {
    it('rejects TODOS and other non-numeric values instead of treating them as system IDs', () => {
        expect(normalizeSystemParentFilterIds(['TODOS', '2', 'abc', 3])).toEqual(['2', '3']);
    });

    it('restricts selections to visible systems and removes duplicates', () => {
        expect(normalizeSystemParentFilterIds(['2', 2, '3'], ['2', '4'])).toEqual(['2']);
    });
});

describe('resolveSystemParentFilterIds', () => {
    it('resolves TODOS to all visible IDs', () => {
        expect(resolveSystemParentFilterIds('TODOS', ['2', '3'])).toEqual(['2', '3']);
    });

    it('preserves empty selection to allow deselecting all systems', () => {
        expect(resolveSystemParentFilterIds([], ['2', '3'])).toEqual([]);
        expect(resolveSystemParentFilterIds([], [])).toEqual([]);
    });

    it('keeps all selected IDs explicitly instead of collapsing them to null/empty', () => {
        expect(resolveSystemParentFilterIds(['2', '3'], ['2', '3'])).toEqual(['2', '3']);
    });

    it('returns no IDs when there are no visible system options', () => {
        expect(resolveSystemParentFilterIds('TODOS', [])).toEqual([]);
    });
});

describe('pruneSystemFilterOutsideOptions', () => {
    const filters = (systemParentId: any, systemId: any = ['99']) => ({ systemParentId, systemId, contractId: ['1'] });

    it('mantém o objeto quando não há sistema selecionado', () => {
        const a = filters([]);
        const b = filters('');
        expect(pruneSystemFilterOutsideOptions(a, ['1', '2'])).toBe(a);
        expect(pruneSystemFilterOutsideOptions(b, ['1'])).toBe(b);
    });

    it('mantém quando o sistema selecionado está visível', () => {
        const a = filters(['2']);
        const b = filters('2');
        expect(pruneSystemFilterOutsideOptions(a, ['1', '2'])).toBe(a);
        expect(pruneSystemFilterOutsideOptions(b, [2])).toBe(b);
    });

    it('limpa systemParentId e systemId quando o sistema saiu das opções', () => {
        const f = filters(['7'], ['99']);
        expect(pruneSystemFilterOutsideOptions(f, ['1', '2'])).toEqual({
            systemParentId: [],
            systemId: [],
            contractId: ['1']
        });
    });

    it('aceita valor escalar e compara como string', () => {
        const f = filters('7');
        expect(pruneSystemFilterOutsideOptions(f, ['7'])).toBe(f);
        expect(pruneSystemFilterOutsideOptions(f, [8])).toEqual({ systemParentId: [], systemId: [], contractId: ['1'] });
    });
});
