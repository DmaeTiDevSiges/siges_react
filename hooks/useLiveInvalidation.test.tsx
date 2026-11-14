import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveInvalidation } from './useLiveInvalidation';

const setup = (opts: Parameters<typeof useLiveInvalidation>[0]) => {
    const client = new QueryClient();
    const spy = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useLiveInvalidation(opts), { wrapper });
    return { spy, ...hook };
};

describe('useLiveInvalidation', () => {
    it('invalida as chaves quando a assinatura em tempo real dispara', () => {
        let fire: () => void = () => undefined;
        const unsubscribe = jest.fn();
        const { spy, unmount } = setup({
            keys: [['orders'], ['visits']],
            subscribe: [cb => { fire = cb; return { unsubscribe }; }],
        });
        expect(spy).not.toHaveBeenCalled();
        fire();
        expect(spy).toHaveBeenCalledWith({ queryKey: ['orders'] });
        expect(spy).toHaveBeenCalledWith({ queryKey: ['visits'] });
        unmount();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('invalida quando o evento do window dispara e para de ouvir ao sair', () => {
        const { spy, unmount } = setup({ keys: [['orders']], event: 'refresh_dashboard' });
        window.dispatchEvent(new CustomEvent('refresh_dashboard'));
        expect(spy).toHaveBeenCalledTimes(1);
        unmount();
        window.dispatchEvent(new CustomEvent('refresh_dashboard'));
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('desligado (enabled: false) não assina nada', () => {
        const sub = jest.fn(() => ({ unsubscribe: jest.fn() }));
        setup({ keys: [['orders']], subscribe: [sub], event: 'x', enabled: false });
        expect(sub).not.toHaveBeenCalled();
    });
});
