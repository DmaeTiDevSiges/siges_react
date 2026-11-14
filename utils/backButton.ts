/**
 * Pilha de prioridade do botão "voltar" do Android.
 *
 * Capacitor dispara TODOS os ouvintes de `backButton` ao mesmo tempo; com vários
 * (painel aberto + tela) o voltar fecharia o painel E mudaria de tela. Aqui só o
 * tratador do topo da pilha age: quem abre algo "por cima" (modal, painel, passo
 * de fluxo) registra um tratador e remove ao fechar; o histórico de telas
 * (hooks/useScreenHistory) é o último da fila.
 *
 * Tratador devolve `false` para "não tratei, passe ao próximo"; qualquer outro
 * retorno (inclusive undefined) conta como tratado.
 */
export type BackHandler = () => boolean | void;

const stack: BackHandler[] = [];

/** Registra no topo da pilha. Devolve a função que remove. */
export const registerBackHandler = (handler: BackHandler): (() => void) => {
    stack.push(handler);
    return () => {
        const i = stack.lastIndexOf(handler);
        if (i >= 0) stack.splice(i, 1);
    };
};

/** Roda do topo para a base até alguém tratar. `true` = tratado. */
export const runBackHandlers = (): boolean => {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]() !== false) return true;
    }
    return false;
};

/** Só para testes. */
export const __resetBackHandlers = () => { stack.length = 0; };
