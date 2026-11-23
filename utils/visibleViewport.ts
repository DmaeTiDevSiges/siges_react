import { Capacitor } from '@capacitor/core';

// Parte da tela realmente visível. No app Android o teclado (Keyboard resize 'body' +
// adjustResize) nem sempre encolhe window.innerHeight/visualViewport a tempo, e uma
// lista com position:fixed passa a terminar ATRÁS do teclado — os últimos itens ficam
// inalcançáveis. Aqui o fundo visível desconta a altura do teclado informada pelo plugin.

let baseHeight = 0;
let keyboardHeight = 0;

/** Fundo (em px, coordenadas da janela) da área visível, descontando o teclado. */
export const getVisibleBottom = (): number => {
    const vv = window.visualViewport;
    const inner = window.innerHeight;
    // Altura "sem teclado" = a maior já vista (só cresce).
    if (inner > baseHeight) baseHeight = inner;
    let bottom = vv ? Math.min(inner, vv.offsetTop + vv.height) : inner;
    if (keyboardHeight > 0) bottom = Math.min(bottom, baseHeight - keyboardHeight);
    return bottom;
};

/** Avisa quando o teclado nativo abre/fecha (sem efeito na web). Retorna a limpeza. */
export const watchKeyboard = (onChange: () => void): (() => void) => {
    if (!Capacitor.isNativePlatform()) return () => undefined;
    let cancelled = false;
    const handles: Array<{ remove: () => Promise<void> | void }> = [];
    import('@capacitor/keyboard')
        .then(async ({ Keyboard }) => {
            const show = await Keyboard.addListener('keyboardDidShow', info => {
                keyboardHeight = info?.keyboardHeight ?? 0;
                onChange();
            });
            const hide = await Keyboard.addListener('keyboardDidHide', () => {
                keyboardHeight = 0;
                onChange();
            });
            if (cancelled) {
                show.remove();
                hide.remove();
            } else {
                handles.push(show, hide);
            }
        })
        .catch(() => undefined);
    return () => {
        cancelled = true;
        handles.forEach(h => h.remove());
    };
};
