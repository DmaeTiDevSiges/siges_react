import {
  normalizeSystemParentId,
  noticeAppliesToUnitSystemParent,
  resolveNoticeSystemParentIds,
} from './appNoticeSystemScope';

describe('normalizeSystemParentId', () => {
  it('normaliza números e strings numéricas', () => {
    expect(normalizeSystemParentId(8)).toBe(8);
    expect(normalizeSystemParentId('9')).toBe(9);
  });

  it('descarta valores inválidos', () => {
    expect(normalizeSystemParentId(null)).toBeNull();
    expect(normalizeSystemParentId(undefined)).toBeNull();
    expect(normalizeSystemParentId('')).toBeNull();
    expect(normalizeSystemParentId('abc')).toBeNull();
    expect(normalizeSystemParentId(0)).toBeNull();
    expect(normalizeSystemParentId(-1)).toBeNull();
  });
});

describe('resolveNoticeSystemParentIds', () => {
  it('lista vazia/ausente continua vazia (sem restrição no rollout)', () => {
    expect(resolveNoticeSystemParentIds(undefined)).toEqual([]);
    expect(resolveNoticeSystemParentIds(null)).toEqual([]);
    expect(resolveNoticeSystemParentIds([])).toEqual([]);
  });

  it('normaliza, remove inválidos e duplicatas', () => {
    expect(resolveNoticeSystemParentIds(['8', 8, 10, null, 'x'])).toEqual([8, 10]);
  });
});

describe('noticeAppliesToUnitSystemParent', () => {
  it('inclui unidade do mesmo sistema pai do aviso', () => {
    expect(noticeAppliesToUnitSystemParent([8], 8)).toBe(true);
    expect(noticeAppliesToUnitSystemParent(['8', 10], '10')).toBe(true);
  });

  it('exclui unidade de sistema pai diferente do aviso', () => {
    expect(noticeAppliesToUnitSystemParent([8], 9)).toBe(false);
    expect(noticeAppliesToUnitSystemParent([9], 8)).toBe(false);
  });

  it('exclui unidade sem sistema pai definido quando o aviso tem escopo', () => {
    expect(noticeAppliesToUnitSystemParent([8], null)).toBe(false);
    expect(noticeAppliesToUnitSystemParent([8], undefined)).toBe(false);
  });

  it('aviso sem sistemas definidos não restringe (fallback de rollout)', () => {
    expect(noticeAppliesToUnitSystemParent([], 8)).toBe(true);
    expect(noticeAppliesToUnitSystemParent(undefined, 9)).toBe(true);
    expect(noticeAppliesToUnitSystemParent([], null)).toBe(true);
  });
});
