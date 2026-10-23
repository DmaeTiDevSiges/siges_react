/**
 * Escopo de sistema (system_parent) de um aviso.
 *
 * Regra de negócio: cada aviso pertence a um ou mais sistemas pai. A MO Extra
 * lançada/exibida só vale para unidades cujo `units.system_parent_id` esteja
 * entre os sistemas do aviso.
 *
 * Lista vazia/ausente = sem restrição (comportamento anterior à migration),
 * útil durante o rollout. A migration 20261035 preenche os avisos antigos com
 * os sistemas do cliente DMAE Pluvial.
 */

export type NoticeSystemParentIdInput = number | string | null | undefined;

/** Normaliza um id de sistema pai; devolve null para valores inválidos. */
export const normalizeSystemParentId = (
  value: NoticeSystemParentIdInput
): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

/**
 * Ids de sistema pai do aviso, sem duplicatas e sem valores inválidos.
 * Lista vazia significa "sem restrição" (fallback de rollout).
 */
export const resolveNoticeSystemParentIds = (
  systemParentIds?: readonly NoticeSystemParentIdInput[] | null
): number[] => {
  const normalized = (systemParentIds ?? [])
    .map(normalizeSystemParentId)
    .filter((id): id is number => id !== null);

  return Array.from(new Set(normalized));
};

/**
 * O aviso se aplica a uma unidade do sistema pai informado?
 * Aviso sem sistemas definidos não restringe (fallback de rollout).
 */
export const noticeAppliesToUnitSystemParent = (
  noticeSystemParentIds: readonly NoticeSystemParentIdInput[] | null | undefined,
  unitSystemParentId: NoticeSystemParentIdInput
): boolean => {
  const ids = resolveNoticeSystemParentIds(noticeSystemParentIds);
  if (ids.length === 0) return true;

  const unitSystemId = normalizeSystemParentId(unitSystemParentId);
  return unitSystemId !== null && ids.includes(unitSystemId);
};
