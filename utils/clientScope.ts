/**
 * Escopo de cliente compartilhado pelos serviços (Fase 1D do plano de escopos
 * por cliente — `users.department_id` -> `cfg_departments.clients_ids`).
 *
 * Regra comum: `coluna.clients_ids && ids` (interseção), com
 * `coluna.clients_ids IS NULL` caindo fora do resultado (NULL = sem escopo).
 */

/**
 * Normaliza o filtro de escopo de cliente para `.overlaps('clients_ids', ids)`
 * — `coluna.clients_ids && {ids}`.
 *
 * @returns `null` quando não há corte (parâmetro não informado) — comportamento
 *          histórico preservado para as demais telas; ou a lista normalizada de
 *          ids, onde `[]` significa "sem acesso" (devolver lista vazia).
 */
export const normalizeClientScope = (
    scopeClientsIds?: Array<string | number> | null
): number[] | null => {
    if (scopeClientsIds === undefined || scopeClientsIds === null) return null;

    const ids = scopeClientsIds
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0);

    return Array.from(new Set(ids));
};

/**
 * Escopo a repassar a `getSystemsParent(scope?)` / `getSystems(parentId?, scope?)`
 * nas páginas do grupo Gestão.
 *
 * Devolve SEMPRE `cfg_departments.clients_ids` do usuário — inclusive para o
 * super admin (decisão de 27/10/2026: aplicar o escopo também no super admin;
 * antes ele era isento e via "todos" os sistemas). `[]` = sem acesso: nenhuma
 * opção de SISTEMA é exibida até o departamento ter clientes vinculados.
 *
 * Consumir somente depois que `useClientScope().scopeReady` for `true`, senão a
 * lista vazia inicial seria interpretada como "sem acesso".
 */
export const systemsScopeOption = (
    clientIds: readonly (string | number)[] | undefined
): string[] => (clientIds ?? []).map(String);

/** Retorna apenas IDs numéricos de sistemas, opcionalmente limitados às opções visíveis. */
export const normalizeSystemParentFilterIds = (
    value: unknown,
    allowedIds?: readonly (string | number)[]
): string[] => {
    const values = Array.isArray(value)
        ? value
        : value === undefined || value === null || value === '' ? [] : [value];
    const allowed = allowedIds ? new Set(allowedIds.map(String)) : null;

    return Array.from(new Set(values
        .map(String)
        .filter(id => /^\d+$/.test(id) && Number(id) > 0 && (!allowed || allowed.has(id)))));
};

/** Expande o sentinela `TODOS` para os IDs visíveis; preserva seleção vazia. */
export const resolveSystemParentFilterIds = (
    value: unknown,
    visibleIds: readonly (string | number)[]
): string[] => {
    if (typeof value === 'string' && value.toUpperCase() === 'TODOS') {
        return visibleIds.map(String);
    }

    const selectedIds = normalizeSystemParentFilterIds(value, visibleIds);
    return selectedIds;
};

/**
 * Remove do estado de filtros um SISTEMA selecionado que não está mais entre as
 * opções visíveis (ex.: `systemParentId` persistido em localStorage antes do
 * escopo de cliente estar ativo). Sem isso, o filtro continuaria valendo para um
 * sistema que o usuário nem vê na lista.
 *
 * Devolve o mesmo objeto quando nada precisa mudar (evita re-render).
 */
export const pruneSystemFilterOutsideOptions = <F extends { systemParentId?: unknown; systemId?: unknown }>(
    filters: F,
    visibleSystemIds: readonly (string | number)[]
): F => {
    const raw = filters.systemParentId;
    const selected: unknown[] = Array.isArray(raw)
        ? raw
        : raw === undefined || raw === null || raw === '' ? [] : [raw];

    if (selected.length === 0) return filters;

    const visible = new Set(visibleSystemIds.map(String));
    if (selected.every(id => visible.has(String(id)))) return filters;

    return { ...filters, systemParentId: [], systemId: [] };
};
