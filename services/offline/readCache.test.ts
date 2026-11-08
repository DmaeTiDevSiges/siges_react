import { cachedRead, cacheKey, normalizeArgs, OfflineCacheMissError, readCached, type ReadCacheDeps } from './readCache';
import { createMemoryStore } from './store/memoryStore';
import { createTrackingFetch, markNetworkFailure, networkFailureCount, resetNetworkFailures } from './networkFailures';
import { hashKey } from './store/offlineStore';

const flush = () => new Promise(r => setTimeout(r, 0));

const makeDeps = (online = true): ReadCacheDeps & { setOnline: (v: boolean) => void } => {
    let isOn = online;
    return {
        store: createMemoryStore(),
        isOnline: () => isOn,
        failureCount: networkFailureCount,
        now: () => 1000,
        setOnline: (v: boolean) => {
            isOn = v;
        },
    };
};

beforeEach(() => resetNetworkFailures());

describe('normalizeArgs / cacheKey', () => {
    it('número e texto geram a mesma chave', () => {
        expect(cacheKey('getX', [123])).toBe(cacheKey('getX', ['123']));
    });
    it('undefined no final não muda a chave', () => {
        expect(cacheKey('getX', ['1'])).toBe(cacheKey('getX', ['1', undefined]));
    });
    it('undefined no meio vira null', () => {
        expect(normalizeArgs(['a', undefined, 'b'])).toEqual(['a', null, 'b']);
    });
    it('arrays e objetos são normalizados (ordem das chaves não importa)', () => {
        expect(cacheKey('m', [[1, 2]])).toBe(cacheKey('m', [['1', '2']]));
        expect(cacheKey('m', [{ b: 1, a: 2 }])).toBe(cacheKey('m', [{ a: '2', b: '1' }]));
    });
    it('métodos diferentes não colidem', () => {
        expect(cacheKey('getA', ['1'])).not.toBe(cacheKey('getB', ['1']));
    });
});

describe('cachedRead', () => {
    it('online: devolve o valor da rede e guarda no cache', async () => {
        const deps = makeDeps(true);
        const value = await cachedRead(deps, 'getAssets', ['10'], async () => [{ id: 1 }]);
        expect(value).toEqual([{ id: 1 }]);
        await flush();
        expect(await readCached(deps.store, 'getAssets', [10])).toEqual({ value: [{ id: 1 }], savedAt: 1000 });
    });

    it('offline: devolve o cache sem chamar a rede', async () => {
        const deps = makeDeps(true);
        await cachedRead(deps, 'getAssets', ['10'], async () => [{ id: 1 }]);
        await flush();
        deps.setOnline(false);
        const fetcher = jest.fn(async () => [{ id: 2 }]);
        expect(await cachedRead(deps, 'getAssets', ['10'], fetcher)).toEqual([{ id: 1 }]);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('offline sem cache: OfflineCacheMissError', async () => {
        const deps = makeDeps(false);
        await expect(cachedRead(deps, 'getAssets', ['10'], async () => [])).rejects.toBeInstanceOf(OfflineCacheMissError);
    });

    it('serviço "engole" a falha de rede e devolve [] → mantém o cache bom', async () => {
        const deps = makeDeps(true);
        await cachedRead(deps, 'getAssets', ['10'], async () => [{ id: 1 }]);
        await flush();
        const value = await cachedRead(deps, 'getAssets', ['10'], async () => {
            markNetworkFailure(); // fetch falhou lá dentro
            return [];
        });
        expect(value).toEqual([{ id: 1 }]);
        await flush();
        expect((await readCached(deps.store, 'getAssets', ['10']))?.value).toEqual([{ id: 1 }]);
    });

    it('serviço "engole" a falha e não há cache → devolve o que o serviço deu', async () => {
        const deps = makeDeps(true);
        const value = await cachedRead(deps, 'getAssets', ['10'], async () => {
            markNetworkFailure();
            return [];
        });
        expect(value).toEqual([]);
        await flush();
        expect(await readCached(deps.store, 'getAssets', ['10'])).toBeNull();
    });

    it('lança por falha de rede → devolve o cache', async () => {
        const deps = makeDeps(true);
        await cachedRead(deps, 'getVisit', ['5'], async () => ({ id: 5 }));
        await flush();
        const value = await cachedRead(deps, 'getVisit', ['5'], async () => {
            markNetworkFailure();
            throw new TypeError('Failed to fetch');
        });
        expect(value).toEqual({ id: 5 });
    });

    it('erro que não é de rede (permissão) sobe mesmo com cache', async () => {
        const deps = makeDeps(true);
        await cachedRead(deps, 'getVisit', ['5'], async () => ({ id: 5 }));
        await flush();
        await expect(
            cachedRead(deps, 'getVisit', ['5'], async () => {
                throw new Error('permission denied');
            }),
        ).rejects.toThrow('permission denied');
    });

    it('falha ao gravar o cache não quebra a leitura', async () => {
        const deps = makeDeps(true);
        const onWriteError = jest.fn();
        deps.store.put = async () => {
            throw new Error('disco cheio');
        };
        const value = await cachedRead({ ...deps, onWriteError }, 'm', [], async () => 42);
        expect(value).toBe(42);
        await flush();
        expect(onWriteError).toHaveBeenCalled();
    });

    it('null do serviço (sem falha de rede) é cacheado como resposta válida', async () => {
        const deps = makeDeps(true);
        await cachedRead(deps, 'getVisit', ['9'], async () => null);
        await flush();
        deps.setOnline(false);
        expect(await cachedRead(deps, 'getVisit', ['9'], async () => ({ id: 9 }))).toBeNull();
    });
});

describe('createTrackingFetch', () => {
    it('conta falha de rede e repassa o erro', async () => {
        const f = createTrackingFetch(async () => {
            throw new TypeError('Failed to fetch');
        });
        await expect(f('https://x.supabase.co/rest/v1/a')).rejects.toThrow('Failed to fetch');
        expect(networkFailureCount()).toBe(1);
    });

    it('não conta AbortError do próprio app', async () => {
        const f = createTrackingFetch(async () => {
            const e = new Error('aborted');
            e.name = 'AbortError';
            throw e;
        });
        await expect(f('https://x/rest/v1/a', { signal: new AbortController().signal })).rejects.toThrow();
        expect(networkFailureCount()).toBe(0);
    });

    it('sucesso não conta falha', async () => {
        const f = createTrackingFetch(async () => ({ ok: true }) as any);
        await f('https://x/rest/v1/a');
        expect(networkFailureCount()).toBe(0);
    });

    it('leitura REST pendurada: corta no limite e conta como falha', async () => {
        const f = createTrackingFetch(
            (_input, init) =>
                new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        const e = new Error('aborted');
                        e.name = 'AbortError';
                        reject(e);
                    });
                }),
            { readTimeoutMs: () => 20 },
        );
        await expect(f('https://x/rest/v1/a')).rejects.toThrow('aborted');
        expect(networkFailureCount()).toBe(1);
    });

    it('não põe limite em gravações (POST) nem fora do /rest/v1', async () => {
        const seen: (AbortSignal | undefined | null)[] = [];
        const f = createTrackingFetch(async (_i, init) => {
            seen.push(init?.signal);
            return { ok: true } as any;
        }, { readTimeoutMs: () => 20 });
        await f('https://x/rest/v1/a', { method: 'POST' });
        await f('https://x/storage/v1/object/a');
        expect(seen).toEqual([undefined, undefined]);
    });
});

describe('memoryStore / hashKey', () => {
    it('get/put/delete/keys/clear', async () => {
        const s = createMemoryStore();
        await s.put('c', 'k1', { a: 1 });
        await s.put('c', 'k2', { a: 2 });
        expect(await s.get('c', 'k1')).toEqual({ a: 1 });
        expect((await s.keys('c')).sort()).toEqual(['k1', 'k2']);
        await s.delete('c', 'k1');
        expect(await s.get('c', 'k1')).toBeNull();
        await s.clear();
        expect(await s.keys('c')).toEqual([]);
    });

    it('quem lê não altera o que está guardado', async () => {
        const s = createMemoryStore();
        await s.put('c', 'k', { list: [1] });
        const v = (await s.get<{ list: number[] }>('c', 'k'))!;
        v.list.push(2);
        expect(await s.get('c', 'k')).toEqual({ list: [1] });
    });

    it('hashKey é estável e curto', () => {
        expect(hashKey('getAssets:["10"]')).toBe(hashKey('getAssets:["10"]'));
        expect(hashKey('getAssets:["10"]')).not.toBe(hashKey('getAssets:["11"]'));
        expect(hashKey('x'.repeat(5000)).length).toBeLessThan(15);
    });
});
