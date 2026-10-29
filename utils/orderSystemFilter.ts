import { Order, OrderFilters } from '../types';

const normalizeIds = (value: string | number | readonly (string | number)[] | undefined): string[] => {
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    return values
        .map(String)
        .map(id => id.trim())
        .filter(id => id !== '' && id.toLowerCase() !== 'null' && id.toLowerCase() !== 'undefined');
};

export const filterOrdersBySystem = (
    orders: Order[],
    filters: Pick<OrderFilters, 'systemParentId' | 'systemId'>,
    scope?: {
        allowedSystemParentIds: readonly (string | number)[];
        allowedClientIds: readonly (string | number)[];
    }
): Order[] => {
    const parentIds = normalizeIds(filters.systemParentId);
    const systemIds = normalizeIds(filters.systemId);

    const allowedParentIds = scope ? new Set(normalizeIds([...scope.allowedSystemParentIds])) : null;
    const allowedClientIds = scope ? new Set(normalizeIds([...scope.allowedClientIds])) : null;

    if (allowedParentIds?.size === 0 || allowedClientIds?.size === 0) return [];
    if (parentIds.length === 0 && systemIds.length === 0 && !scope) return orders;

    return orders.filter(order => {
        const orderParentId = order.systemParentId === undefined ? undefined : String(order.systemParentId);
        const orderClientId = order.clientId === undefined ? undefined : String(order.clientId);

        return (allowedParentIds === null || (orderParentId !== undefined && allowedParentIds.has(orderParentId))) &&
            (allowedClientIds === null || (orderClientId !== undefined && allowedClientIds.has(orderClientId))) &&
            (parentIds.length === 0 || (orderParentId !== undefined && parentIds.includes(orderParentId))) &&
            (systemIds.length === 0 || (order.systemId !== undefined && systemIds.includes(String(order.systemId))));
    });
};
