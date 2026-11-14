import { __resetBackHandlers, registerBackHandler, runBackHandlers } from './backButton';

beforeEach(() => __resetBackHandlers());

describe('pilha do botão voltar', () => {
    it('só o tratador do topo age', () => {
        const base = jest.fn();
        const top = jest.fn();
        registerBackHandler(base);
        registerBackHandler(top);
        expect(runBackHandlers()).toBe(true);
        expect(top).toHaveBeenCalledTimes(1);
        expect(base).not.toHaveBeenCalled();
    });

    it('tratador que devolve false passa para o próximo', () => {
        const base = jest.fn();
        registerBackHandler(base);
        registerBackHandler(() => false);
        expect(runBackHandlers()).toBe(true);
        expect(base).toHaveBeenCalledTimes(1);
    });

    it('remover o registro devolve o controle ao anterior', () => {
        const base = jest.fn();
        registerBackHandler(base);
        const off = registerBackHandler(jest.fn());
        off();
        runBackHandlers();
        expect(base).toHaveBeenCalled();
    });

    it('sem ninguém para tratar devolve false', () => {
        expect(runBackHandlers()).toBe(false);
        registerBackHandler(() => false);
        expect(runBackHandlers()).toBe(false);
    });
});
