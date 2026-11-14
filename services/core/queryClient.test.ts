jest.mock('../offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));

import { QueryClient } from '@tanstack/react-query';
import { OfflineCacheMissError } from '../offline/readCache';
import { createQueryClient, invalidateOnSyncEnd, shouldRetryQuery } from './queryClient';

describe('createQueryClient', () => {
    it('não pausa consultas sem internet (o dataService responde do cache offline)', () => {
        const q = createQueryClient().getDefaultOptions().queries!;
        expect(q.networkMode).toBe('always');
        expect(q.refetchOnWindowFocus).toBe(false);
    });
});

describe('shouldRetryQuery', () => {
    it('tenta mais uma vez em erro comum, mas não repete dado nunca baixado', () => {
        expect(shouldRetryQuery(0, new Error('x'))).toBe(true);
        expect(shouldRetryQuery(1, new Error('x'))).toBe(false);
        expect(shouldRetryQuery(0, new OfflineCacheMissError('getCompanies'))).toBe(false);
    });
});

describe('invalidateOnSyncEnd', () => {
    const run = (states: boolean[]) => {
        const client = new QueryClient();
        const spy = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
        let listener: (s: { syncing: boolean }) => void = () => undefined;
        const unsubscribe = jest.fn();
        invalidateOnSyncEnd(client, (l => { listener = l as typeof listener; return unsubscribe; }) as never);
        states.forEach(syncing => listener({ syncing }));
        return spy;
    };

    it('invalida só quando o envio termina (true → false)', () => {
        expect(run([false, true, false])).toHaveBeenCalledTimes(1);
    });

    it('não invalida ao começar, nem sem ter enviado nada', () => {
        expect(run([false, true])).not.toHaveBeenCalled();
        expect(run([false, false])).not.toHaveBeenCalled();
    });
});
