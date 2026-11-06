import { useLayoutEffect, type RefObject } from 'react';

/**
 * Publica a altura REAL da barra inferior (incluindo a área segura da barra de
 * navegação do Android) na variável CSS `--bottom-nav-h` do <html>.
 *
 * Quem precisa ficar acima da barra usa essa variável em vez de um valor fixo:
 * o padding inferior do conteúdo (Layout, OrderVisitScreen), a distância dos
 * botões flutuantes e a posição dos toasts no APK.
 * (Não escrever exemplos de classe aqui: o Tailwind lê comentários e gera CSS.)
 *
 * Antes os valores eram fixos (4.5rem/5.5rem + env) e não acompanhavam a altura
 * real (fonte do sistema maior, rótulo em 2 linhas, barra da visita mais alta).
 *
 * Barra escondida (desktop via md:hidden, teclado aberto, tela sem navegação):
 * altura 0 / desmontada → a variável vira 0px.
 */
// Barras montadas e a altura de cada uma. Publica a MAIOR: ao trocar a barra
// principal pela da visita, uma desmonta depois da outra montar — sem isso a
// desmontagem zeraria a variável com a outra barra ainda visível.
const mounted = new Map<HTMLElement, number>();

const publishMax = () => {
    const height = mounted.size ? Math.max(...mounted.values()) : 0;
    document.documentElement.style.setProperty('--bottom-nav-h', `${height}px`);
};

export function useBottomNavHeight(ref: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        const measure = () => {
            mounted.set(element, Math.ceil(element.getBoundingClientRect().height));
            publishMax();
        };

        measure();
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        observer?.observe(element);
        // A área segura pode mudar sem a barra mudar de tamanho (rotação).
        window.addEventListener('resize', measure);

        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', measure);
            mounted.delete(element);
            publishMax();
        };
    }, [ref]);
}
