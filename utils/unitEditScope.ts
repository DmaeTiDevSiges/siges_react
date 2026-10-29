/**
 * Escopo de cliente para gerenciar unidades (editar/excluir).
 *
 * Regra de negócio: o usuário logado herda seus `clients_ids` de
 * `cfg_departments.clients_ids` (via `users.department_id` — Fase 1D do plano
 * de escopos por cliente). Para editar ou excluir uma unidade, além da
 * permissão de rota (`units`), é preciso que:
 *
 *   - o usuário seja super admin (`isAdminSuper`), OU
 *   - algum dos `units.clients_ids` da unidade esteja na lista do usuário.
 *
 * Casos que negam (mesmo com a permissão de rota concedida):
 *   - departamento sem clientes vinculados (NULL/`{}`) → escopo vazio;
 *   - unidade sem `clients_ids` (`{}`) → nada a intersectar;
 *   - sem interseção entre os dois.
 */

export type UnitClientIdInput = number | string | null | undefined;

/** Normaliza um id de cliente para string; descarta nulos/vazios. */
const normalizeClientId = (value: UnitClientIdInput): string | null => {
  if (value === null || value === undefined) return null;
  const id = String(value).trim();
  return id === '' ? null : id;
};

/** Lista de ids normalizada (string), sem nulos nem duplicatas. */
export const resolveClientIds = (
  ids: readonly UnitClientIdInput[] | null | undefined
): string[] => {
  const normalized = (ids ?? [])
    .map(normalizeClientId)
    .filter((id): id is string => id !== null);

  return Array.from(new Set(normalized));
};

/**
 * O usuário pode gerenciar (editar/excluir) a unidade no escopo de cliente?
 *
 * @param isAdminSuper super admin ignora o escopo de cliente
 * @param userClientIds `cfg_departments.clients_ids` do departamento do usuário
 * @param unitClientIds `units.clients_ids` da unidade alvo
 */
export const unitEditScopeAllows = (
  isAdminSuper: boolean | undefined,
  userClientIds: readonly UnitClientIdInput[] | null | undefined,
  unitClientIds: readonly UnitClientIdInput[] | null | undefined
): boolean => {
  if (isAdminSuper === true) return true;

  const userClients = resolveClientIds(userClientIds);
  if (userClients.length === 0) return false;

  const unitClients = resolveClientIds(unitClientIds);
  if (unitClients.length === 0) return false;

  return unitClients.some((id) => userClients.includes(id));
};

/**
 * Ids normalizados para o filtro server-side (`units.clients_ids && {ids}`).
 *
 * @returns `undefined` quando NÃO há corte a aplicar (super admin) e a lista
 *          normalizada de ids no demais casos — `[]` significa "sem acesso"
 *          (o service devolve lista vazia antes de consultar).
 */
export const unitScopeQueryIds = (
  isAdminSuper: boolean | undefined,
  userClientIds: readonly UnitClientIdInput[] | null | undefined
): number[] | undefined => {
  if (isAdminSuper === true) return undefined;

  return resolveClientIds(userClientIds)
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);
};
