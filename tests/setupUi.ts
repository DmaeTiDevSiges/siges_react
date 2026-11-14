// Preparação dos testes de interface (jest-dom + mocks do ambiente nativo).
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom não traz estes (react-router usa).
Object.assign(globalThis, { TextEncoder, TextDecoder });

// Capacitor Preferences não existe no jsdom: memória simples.
jest.mock('@capacitor/preferences', () => {
    const mem = new Map<string, string>();
    return {
        Preferences: {
            get: async ({ key }: { key: string }) => ({ value: mem.get(key) ?? null }),
            set: async ({ key, value }: { key: string; value: string }) => { mem.set(key, value); },
            remove: async ({ key }: { key: string }) => { mem.delete(key); },
        },
    };
});

// jsdom não implementa estes:
window.scrollTo = jest.fn() as any;
Element.prototype.scrollIntoView = jest.fn();
