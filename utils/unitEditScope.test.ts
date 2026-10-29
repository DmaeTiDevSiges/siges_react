import { resolveClientIds, unitEditScopeAllows, unitScopeQueryIds } from './unitEditScope';

describe('resolveClientIds', () => {
  it('lista ausente/vazia continua vazia', () => {
    expect(resolveClientIds(undefined)).toEqual([]);
    expect(resolveClientIds(null)).toEqual([]);
    expect(resolveClientIds([])).toEqual([]);
  });

  it('normaliza number para string, remove nulos/vazios e duplicatas', () => {
    expect(resolveClientIds([8, '8', 10, null, undefined, '', ' x '])).toEqual([
      '8',
      '10',
      'x',
    ]);
  });
});

describe('unitEditScopeAllows', () => {
  it('super admin ignora o escopo de cliente', () => {
    expect(unitEditScopeAllows(true, [], [])).toBe(true);
    expect(unitEditScopeAllows(true, [], [8])).toBe(true);
    expect(unitEditScopeAllows(true, [1], [])).toBe(true);
  });

  it('permite quando há interseção entre clients do usuário e da unidade', () => {
    expect(unitEditScopeAllows(false, ['8', '10'], ['10'])).toBe(true);
    expect(unitEditScopeAllows(undefined, [8], ['8'])).toBe(true); // number × string
    expect(unitEditScopeAllows(false, [8], ['9', 8])).toBe(true);
  });

  it('nega quando não há interseção', () => {
    expect(unitEditScopeAllows(false, ['8'], ['9'])).toBe(false);
    expect(unitEditScopeAllows(false, ['8', '10'], ['9', '11'])).toBe(false);
  });

  it('nega quando o usuário não tem clientes vinculados (depto NULL/{})', () => {
    expect(unitEditScopeAllows(false, [], ['8'])).toBe(false);
    expect(unitEditScopeAllows(false, null, ['8'])).toBe(false);
    expect(unitEditScopeAllows(false, undefined, ['8'])).toBe(false);
  });

  it('nega quando a unidade não tem clients_ids ({})', () => {
    expect(unitEditScopeAllows(false, ['8'], [])).toBe(false);
    expect(unitEditScopeAllows(false, ['8'], null)).toBe(false);
    expect(unitEditScopeAllows(false, ['8'], undefined)).toBe(false);
  });

  it('nega para não-super-admin enquanto o escopo não carregou (null)', () => {
    expect(unitEditScopeAllows(false, null, ['8'])).toBe(false);
  });
});

describe('unitScopeQueryIds', () => {
  it('super admin não tem corte (undefined = sem filtro no service)', () => {
    expect(unitScopeQueryIds(true, [])).toBeUndefined();
    expect(unitScopeQueryIds(true, [8, 10])).toBeUndefined();
  });

  it('normaliza para number, remove inválidos e duplicatas', () => {
    expect(unitScopeQueryIds(false, ['8', 8, 10, 'x'])).toEqual([8, 10]);
    expect(unitScopeQueryIds(undefined, [8])).toEqual([8]);
  });

  it('escopo vazio (não-super) devolve [] = sem acesso', () => {
    expect(unitScopeQueryIds(false, [])).toEqual([]);
    expect(unitScopeQueryIds(false, null)).toEqual([]);
    expect(unitScopeQueryIds(false, undefined)).toEqual([]);
  });
});
