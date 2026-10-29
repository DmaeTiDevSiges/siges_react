import { Order } from '../types';
import { filterOrdersBySystem } from './orderSystemFilter';

describe('filterOrdersBySystem', () => {
    const orders = [
        { id: '1', systemParentId: '10', systemId: '101' },
        { id: '2', systemParentId: '10', systemId: '102' },
        { id: '3', systemParentId: '20', systemId: '201' },
        { id: '4', systemId: '202' },
    ] as Order[];

    it('mantém todos os pedidos quando os filtros estão vazios', () => {
        expect(filterOrdersBySystem(orders, { systemParentId: [], systemId: [] })).toBe(orders);
    });

    it('filtra por um ou vários sistemas pais', () => {
        expect(filterOrdersBySystem(orders, { systemParentId: ['10'], systemId: [] }).map(order => order.id))
            .toEqual(['1', '2']);
        expect(filterOrdersBySystem(orders, { systemParentId: ['10', '20'], systemId: [] }).map(order => order.id))
            .toEqual(['1', '2', '3']);
    });

    it('filtra por subsistema e combina com o sistema pai', () => {
        expect(filterOrdersBySystem(orders, { systemParentId: [], systemId: ['201'] }).map(order => order.id))
            .toEqual(['3']);
        expect(filterOrdersBySystem(orders, { systemParentId: ['10'], systemId: ['201'] }))
            .toEqual([]);
    });

    it('não inclui pedidos sem sistema quando há filtro ativo', () => {
        expect(filterOrdersBySystem(orders, { systemParentId: ['10'], systemId: [] }).map(order => order.id))
            .not.toContain('4');
    });

    it('mantém o escopo de clientes e sistemas autorizados mesmo sem filtro selecionado', () => {
        const scopedOrders = [
            { id: '1', clientId: '100', systemParentId: '10', systemId: '101' },
            { id: '2', clientId: '200', systemParentId: '10', systemId: '101' },
            { id: '3', clientId: '100', systemParentId: '20', systemId: '201' },
        ] as Order[];

        expect(filterOrdersBySystem(
            scopedOrders,
            { systemParentId: [], systemId: [] },
            { allowedSystemParentIds: ['10'], allowedClientIds: ['100'] }
        ).map(order => order.id)).toEqual(['1']);
    });

    it('combina seleção de SISTEMA com os escopos permitidos', () => {
        const scopedOrders = [
            { id: '1', clientId: '100', systemParentId: '10', systemId: '101' },
            { id: '2', clientId: '100', systemParentId: '20', systemId: '201' },
        ] as Order[];

        expect(filterOrdersBySystem(
            scopedOrders,
            { systemParentId: ['20'], systemId: [] },
            { allowedSystemParentIds: ['10'], allowedClientIds: ['100'] }
        )).toEqual([]);
    });
});
