/**
 * Efeito de pulso circular ("gota") ao clicar/tocar em botões e ícones, no app todo.
 *
 * Um único ouvinte no document: acha o elemento clicável mais próximo do alvo e
 * desenha um círculo que se espalha a partir do ponto tocado (elemento fixo, sem
 * mexer no botão — não altera escala nem layout e não é cortado por
 * overflow:hidden). Respeita "reduzir movimento" do sistema. Para excluir um
 * elemento: data-no-pulse.
 */

const PULSE_CLASS = 'click-pulse-ring';
const PULSE_MS = 500;
const MAX_LEVELS = 6;
/** Diâmetro final da gota (px): acompanha o botão, dentro destes limites. */
const MIN_DIAMETER = 44;
const MAX_DIAMETER = 84;

const CLICKABLE = [
    'button',
    'a[href]',
    'summary',
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
].join(',');

const isDisabled = (el: Element) =>
    (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';

/** Elemento que o usuário percebe como "o botão" (ou null se o clique não foi em algo clicável). */
export const findPulseTarget = (start: EventTarget | null): HTMLElement | null => {
    let el = start instanceof Element ? start : null;
    for (let level = 0; el && el !== document.body && level < MAX_LEVELS; level++, el = el.parentElement) {
        if (el.closest('[data-no-pulse]')) return null; // o próprio elemento ou um ancestral
        const clickable = el.matches(CLICKABLE) || getComputedStyle(el).cursor === 'pointer';
        if (!clickable) continue;
        // Ícone/texto dentro de um botão: sobe até o botão.
        const outer = el.closest(CLICKABLE);
        const target = (outer ?? el) as HTMLElement;
        return isDisabled(target) ? null : target;
    }
    return null;
};

/** Cor do anel: fundo do botão se for sólido; senão a cor do texto/ícone. */
const ringColor = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const solid = bg && bg !== 'transparent' && !/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(\.\d+)?\s*\)/.test(bg);
    return solid ? bg : cs.color || 'currentColor';
};

const reducedMotion = () =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** `point` = onde foi o toque; sem ele (teclado), a gota sai do centro do elemento. */
export const pulseElement = (el: HTMLElement, point?: { x: number; y: number }) => {
    if (reducedMotion()) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = point?.x ?? rect.left + rect.width / 2;
    const y = point?.y ?? rect.top + rect.height / 2;
    const diameter = Math.round(Math.min(MAX_DIAMETER, Math.max(MIN_DIAMETER, Math.min(rect.width, rect.height) * 1.8)));
    const drop = document.createElement('div');
    drop.className = PULSE_CLASS;
    drop.setAttribute('aria-hidden', 'true');
    drop.style.left = `${x - diameter / 2}px`;
    drop.style.top = `${y - diameter / 2}px`;
    drop.style.width = `${diameter}px`;
    drop.style.height = `${diameter}px`;
    drop.style.setProperty('--pulse-color', ringColor(el));
    document.body.appendChild(drop);
    const remove = () => drop.remove();
    drop.addEventListener('animationend', remove, { once: true });
    window.setTimeout(remove, PULSE_MS + 150); // garantia (aba em segundo plano não dispara animationend)
};

let installed = false;

/** Instala o ouvinte global (uma vez). Retorna a função que o remove. */
export const installClickPulse = (): (() => void) => {
    if (installed || typeof document === 'undefined') return () => undefined;
    installed = true;
    // Captura: continua valendo se a tela chamar stopPropagation no clique.
    const onClick = (event: MouseEvent) => {
        const target = findPulseTarget(event.target);
        // detail 0 = clique pelo teclado ou por código: não há ponto de toque.
        if (target) pulseElement(target, event.detail > 0 ? { x: event.clientX, y: event.clientY } : undefined);
    };
    document.addEventListener('click', onClick, true);
    return () => {
        document.removeEventListener('click', onClick, true);
        installed = false;
    };
};
