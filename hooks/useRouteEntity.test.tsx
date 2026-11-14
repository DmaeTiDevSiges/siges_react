import { act, renderHook } from '@testing-library/react';
import { useRouteEntity } from './useRouteEntity';

type Item = { id: string; name: string };

const deferred = <T,>() => {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

const setup = (current: Item | null, fetchById: (id: string) => Promise<Item | null>) => {
    const setCurrent = jest.fn();
    const onFail = jest.fn();
    const hook = renderHook(() => useRouteEntity<Item>(current, setCurrent, fetchById, onFail));
    return { ...hook, setCurrent, onFail };
};

describe('useRouteEntity', () => {
    it('não busca quando o registro em memória já é o da URL', () => {
        const fetchById = jest.fn();
        const { result, setCurrent } = setup({ id: '7', name: 'x' }, fetchById);
        act(() => result.current.load('7'));
        expect(fetchById).not.toHaveBeenCalled();
        expect(setCurrent).not.toHaveBeenCalled();
        expect(result.current.pendingId).toBeNull();
    });

    it('busca pelo id, marca pendente e aplica o resultado', async () => {
        const d = deferred<Item | null>();
        const { result, setCurrent } = setup({ id: '1', name: 'a' }, () => d.promise);
        act(() => result.current.load('2'));
        expect(result.current.pendingId).toBe('2');
        await act(async () => { d.resolve({ id: '2', name: 'b' }); });
        expect(setCurrent).toHaveBeenCalledWith({ id: '2', name: 'b' });
        expect(result.current.pendingId).toBeNull();
    });

    it('não achou ou deu erro: chama onFail', async () => {
        const nf = setup(null, () => Promise.resolve(null));
        await act(async () => { nf.result.current.load('9'); });
        expect(nf.onFail).toHaveBeenCalledTimes(1);
        expect(nf.result.current.pendingId).toBeNull();

        const err = setup(null, () => Promise.reject(new Error('offline')));
        await act(async () => { err.result.current.load('9'); });
        expect(err.onFail).toHaveBeenCalledTimes(1);
        expect(err.setCurrent).not.toHaveBeenCalled();
    });

    it('cancel descarta a resposta atrasada', async () => {
        const d = deferred<Item | null>();
        const { result, setCurrent, onFail } = setup(null, () => d.promise);
        act(() => result.current.load('3'));
        act(() => result.current.cancel());
        await act(async () => { d.resolve({ id: '3', name: 'c' }); });
        expect(setCurrent).not.toHaveBeenCalled();
        expect(onFail).not.toHaveBeenCalled();
        expect(result.current.pendingId).toBeNull();
    });

    it('só a última busca vale', async () => {
        const first = deferred<Item | null>();
        const second = deferred<Item | null>();
        const calls = [first, second];
        const { result, setCurrent } = setup(null, () => calls.shift()!.promise);
        act(() => result.current.load('4'));
        act(() => result.current.load('5'));
        await act(async () => { second.resolve({ id: '5', name: 'e' }); });
        await act(async () => { first.resolve({ id: '4', name: 'd' }); });
        expect(setCurrent).toHaveBeenCalledTimes(1);
        expect(setCurrent).toHaveBeenCalledWith({ id: '5', name: 'e' });
    });
});
