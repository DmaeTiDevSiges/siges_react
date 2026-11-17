/** Status da OS cancelada (cfg_orders_statuses). */
export const ORDER_STATUS_CANCELED = 7;

/**
 * Gerar OS a partir de uma SS: a 1ª OS herda os "Serviços a realizar" da SS; da 2ª em diante o
 * campo vem em branco (o texto da SS já foi atendido). OS canceladas não contam — a nova faz o
 * papel da que foi cancelada e herda o texto.
 */
export const hasActiveChildOrder = (children: { statusId?: number | string }[]): boolean =>
    children.some(o => Number(o.statusId) !== ORDER_STATUS_CANCELED);
