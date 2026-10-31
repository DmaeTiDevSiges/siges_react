import { supabase } from '../core/supabase';
import { auditService } from './auditService';

jest.mock('../core/supabase', () => ({
    supabase: { from: jest.fn(), rpc: jest.fn() }
}));

const fromMock = supabase.from as jest.Mock;
const rpcMock = supabase.rpc as jest.Mock;

/** Query builder encadeável (select/eq/order/range/or/gte/lte/in/single) que resolve no final. */
const buildChain = (resolveValue: { data: any; error: any; count?: number | null }) => {
    const chain: any = {};
    for (const method of ['select', 'eq', 'order', 'range', 'or', 'gte', 'lte', 'in', 'single']) {
        chain[method] = jest.fn().mockReturnValue(chain);
    }
    chain.then = (onFulfilled: any, onRejected: any) =>
        Promise.resolve(resolveValue).then(onFulfilled, onRejected);
    return chain;
};

/**
 * O serviço faz DUAS queries (audits_logs + lookup de autores em users),
 * então o mock precisa devolver um builder por tabela.
 */
const mockTables = (tables: Record<string, any>) => {
    fromMock.mockImplementation((table: string) =>
        tables[table] ?? buildChain({ data: [], error: null, count: 0 })
    );
};

/** Linha crua de audits_logs (sem coluna user_uuid — removida na 20261049). */
const row = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    created_date: '2026-10-31 10:00:00',
    table_name: 'orders',
    operation: 'UPDATE',
    record_id: '42',
    user_id: 7,
    ...overrides
});

describe('auditService table configuration', () => {
    it('loads the configured table states from the protected RPC', async () => {
        rpcMock.mockResolvedValue({
            data: [{ table_name: 'orders', is_enabled: true, table_exists: true }],
            error: null,
        });

        await expect(auditService.listTableConfig()).resolves.toEqual([
            { table_name: 'orders', is_enabled: true, table_exists: true },
        ]);
        expect(rpcMock).toHaveBeenCalledWith('get_audit_table_config');
    });

    it('sends table changes as one atomic RPC request', async () => {
        rpcMock.mockResolvedValue({ data: null, error: null });
        const changes = [{ table_name: 'orders', enabled: false }];

        await expect(auditService.updateTableConfig(changes)).resolves.toBeUndefined();
        expect(rpcMock).toHaveBeenCalledWith('set_audit_table_config', { p_changes: changes });
    });

    it('surfaces configuration RPC errors to the caller', async () => {
        const error = { message: 'permission denied' };
        rpcMock.mockResolvedValue({ data: null, error });

        await expect(auditService.listTableConfig()).rejects.toBe(error);
    });
});

describe('auditService.listLogs', () => {
    it('mapeia a linha para camelCase e resolve o nome do autor numa 2ª query', async () => {
        const logsChain = buildChain({ data: [row()], error: null, count: 1 });
        const usersChain = buildChain({
            data: [{ id: 7, name_short: 'JOAO S', name_full: 'João Silva' }],
            error: null,
        });
        mockTables({ audits_logs: logsChain, users: usersChain });

        const result = await auditService.listLogs();

        expect(fromMock).toHaveBeenCalledWith('audits_logs');
        // Sem join embutido: o autor vem do lookup em users
        expect(fromMock).toHaveBeenCalledWith('users');
        expect(usersChain.in).toHaveBeenCalledWith('id', [7]);
        expect(result.total).toBe(1);
        expect(result.logs[0]).toEqual({
            id: 1,
            createdAt: '2026-10-31 10:00:00',
            tableName: 'orders',
            operation: 'UPDATE',
            recordId: '42',
            userId: 7,
            userName: 'JOAO S',
            dataOld: null,
            dataNew: null,
        });
    });

    it('usa name_full quando name_short é nulo e marca como sem autor quando user_id é nulo', async () => {
        mockTables({
            audits_logs: buildChain({
                data: [
                    row({ id: 2, user_id: 8 }),
                    row({ id: 3, user_id: null }),
                ],
                error: null,
                count: 2,
            }),
            users: buildChain({
                data: [{ id: 8, name_short: null, name_full: 'Maria Lima' }],
                error: null,
            }),
        });

        const { logs } = await auditService.listLogs();

        expect(logs[0].userName).toBe('Maria Lima');
        expect(logs[1].userName).toBeNull();
        expect(logs[1].userId).toBeNull();
    });

    it('não consulta users quando nenhum evento tem autor', async () => {
        const usersChain = buildChain({ data: [], error: null });
        mockTables({
            audits_logs: buildChain({ data: [row({ id: 9, user_id: null })], error: null, count: 1 }),
            users: usersChain,
        });

        const { logs } = await auditService.listLogs();

        expect(logs[0].userName).toBeNull();
        expect(usersChain.select).not.toHaveBeenCalled();
    });

    it('continua listando quando o lookup de autores falha (só perde o nome)', async () => {
        mockTables({
            audits_logs: buildChain({ data: [row()], error: null, count: 1 }),
            users: buildChain({ data: null, error: { message: 'boom' } }),
        });

        const { logs, total } = await auditService.listLogs();

        expect(total).toBe(1);
        expect(logs).toHaveLength(1);
        expect(logs[0].userId).toBe(7);
        expect(logs[0].userName).toBeNull();
    });

    it('aplica filtros na query (tabela, operação, autor, período e busca)', async () => {
        const logsChain = buildChain({ data: [], error: null, count: 0 });
        mockTables({ audits_logs: logsChain });

        await auditService.listLogs({
            tableName: 'orders',
            operation: 'DELETE',
            userId: 7,
            dateFrom: '2026-10-01',
            dateTo: '2026-10-31',
            search: '42',
            page: 1,
            pageSize: 10,
        });

        expect(logsChain.eq).toHaveBeenCalledWith('table_name', 'orders');
        expect(logsChain.eq).toHaveBeenCalledWith('operation', 'DELETE');
        expect(logsChain.eq).toHaveBeenCalledWith('user_id', 7);
        expect(logsChain.gte).toHaveBeenCalledWith('created_date', '2026-10-01 00:00:00');
        expect(logsChain.lte).toHaveBeenCalledWith('created_date', '2026-10-31 23:59:59');
        expect(logsChain.or).toHaveBeenCalledWith('record_id.ilike.%42%,table_name.ilike.%42%');
        expect(logsChain.range).toHaveBeenCalledWith(10, 19);
    });

    it('retorna lista vazia quando o Supabase devolve erro', async () => {
        mockTables({
            audits_logs: buildChain({ data: null, error: { message: 'boom' }, count: null }),
        });

        const result = await auditService.listLogs();

        expect(result).toEqual({ logs: [], total: 0 });
    });
});

describe('auditService.getLogById', () => {
    it('retorna o evento com data_old/data_new para o diff e o autor', async () => {
        const logsChain = buildChain({
            data: row({ data_old: { description: 'antes' }, data_new: { description: 'depois' } }),
            error: null,
        });
        mockTables({
            audits_logs: logsChain,
            users: buildChain({
                data: [{ id: 7, name_short: 'JOAO S', name_full: 'João Silva' }],
                error: null,
            }),
        });

        const log = await auditService.getLogById(1);

        expect(logsChain.eq).toHaveBeenCalledWith('id', 1);
        expect(logsChain.single).toHaveBeenCalled();
        expect(log?.dataOld).toEqual({ description: 'antes' });
        expect(log?.dataNew).toEqual({ description: 'depois' });
        expect(log?.userId).toBe(7);
        expect(log?.userName).toBe('JOAO S');
    });

    it('retorna null quando não encontra', async () => {
        mockTables({
            audits_logs: buildChain({ data: null, error: { message: 'not found' } }),
        });

        expect(await auditService.getLogById(999)).toBeNull();
    });
});
