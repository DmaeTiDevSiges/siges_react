import { useEffect, useRef } from 'react';

/**
 * Acessibilidade de diálogos e folhas (Modal, BottomSheet): enquanto abertos,
 *  - `Esc` fecha (só o de CIMA, quando há vários empilhados);
 *  - o foco entra no diálogo (se algo dentro já tem foco, ex.: um campo com
 *    `autoFocus`, não é tirado de lá; um elemento com `data-autofocus` é
 *    preferido; senão o próprio diálogo, para o leitor de tela anunciar o título);
 *  - `Tab`/`Shift+Tab` circulam só dentro do diálogo;
 *  - ao fechar, o foco volta para quem abriu.
 * O `container` precisa de `tabIndex={-1}`.
 */
const stack: symbol[] = [];

/** Só para testes. */
export const __resetDialogStack = () => { stack.length = 0; };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusablesOf = (container: HTMLElement): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');

export const useDialogA11y = (
    open: boolean,
    onClose: () => void,
    containerRef: React.RefObject<HTMLElement | null>,
): void => {
    // Sempre o onClose mais recente, sem re-registrar (mexeria na ordem da pilha).
    const latest = useRef(onClose);
    latest.current = onClose;

    useEffect(() => {
        if (!open) return;
        const token = Symbol('dialog');
        stack.push(token);
        const previous = document.activeElement as HTMLElement | null;
        const container = containerRef.current;

        if (container && !container.contains(document.activeElement)) {
            (container.querySelector<HTMLElement>('[data-autofocus]') ?? container).focus({ preventScroll: true });
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (stack[stack.length - 1] !== token || e.defaultPrevented) return;
            if (e.key === 'Escape' && !e.isComposing) {
                e.preventDefault();
                latest.current();
                return;
            }
            if (e.key === 'Tab' && container) {
                const items = focusablesOf(container);
                if (items.length === 0) { e.preventDefault(); container.focus(); return; }
                const first = items[0];
                const last = items[items.length - 1];
                const active = document.activeElement as HTMLElement | null;
                if (!active || !container.contains(active) || active === container) {
                    e.preventDefault();
                    (e.shiftKey ? last : first).focus();
                } else if (e.shiftKey && active === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            const i = stack.lastIndexOf(token);
            if (i >= 0) stack.splice(i, 1);
            if (previous && previous !== document.body && previous.isConnected) previous.focus({ preventScroll: true });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
};
