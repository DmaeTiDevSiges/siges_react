import { findPulseTarget, installClickPulse } from './clickPulse';

const mount = (html: string) => {
    document.body.innerHTML = html;
};
const rings = () => document.querySelectorAll('.click-pulse-ring');

describe('findPulseTarget', () => {
    it('botão, e ícone dentro do botão sobe até o botão', () => {
        mount('<button id="b"><span id="i">x</span></button>');
        expect(findPulseTarget(document.getElementById('i'))?.id).toBe('b');
        expect(findPulseTarget(document.getElementById('b'))?.id).toBe('b');
    });
    it('ignora botão desabilitado e data-no-pulse', () => {
        mount('<button id="d" disabled>x</button><button id="n" data-no-pulse>y</button>');
        expect(findPulseTarget(document.getElementById('d'))).toBeNull();
        expect(findPulseTarget(document.getElementById('n'))).toBeNull();
    });
    it('data-no-pulse no ancestral também exclui', () => {
        mount('<div data-no-pulse><button id="b">x</button></div>');
        expect(findPulseTarget(document.getElementById('b'))).toBeNull();
    });
    it('div com cursor pointer conta como clicável; texto solto não', () => {
        mount('<div id="c" style="cursor:pointer"><i id="k">k</i></div><p id="t">texto</p>');
        expect(findPulseTarget(document.getElementById('k'))?.id).toBe('c');
        expect(findPulseTarget(document.getElementById('t'))).toBeNull();
    });
});

describe('installClickPulse', () => {
    const rect = { left: 10, top: 20, width: 100, height: 40, right: 110, bottom: 60, x: 10, y: 20, toJSON: () => ({}) };
    let stop: () => void;
    beforeEach(() => {
        mount('<button id="b">ok</button>');
        document.getElementById('b')!.getBoundingClientRect = () => rect as DOMRect;
        window.matchMedia = ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {} })) as any;
        stop = installClickPulse();
    });
    afterEach(() => stop());

    it('desenha uma gota circular no ponto tocado, sem alterar o botão', () => {
        document.getElementById('b')!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 30, clientY: 50 }));
        expect(rings()).toHaveLength(1);
        const drop = rings()[0] as HTMLElement;
        // botão 100x40 → diâmetro 72, centrado no toque (30, 50)
        expect([drop.style.left, drop.style.top, drop.style.width, drop.style.height]).toEqual(['-6px', '14px', '72px', '72px']);
        expect(document.getElementById('b')!.getAttribute('style')).toBeNull();
    });

    it('pelo teclado a gota sai do centro do botão', () => {
        document.getElementById('b')!.click();
        const drop = rings()[0] as HTMLElement;
        expect([drop.style.left, drop.style.top]).toEqual(['24px', '4px']);
    });

    it('não anima com "reduzir movimento" ligado', () => {
        window.matchMedia = ((q: string) => ({ matches: true, media: q, addListener() {}, removeListener() {} })) as any;
        document.getElementById('b')!.click();
        expect(rings()).toHaveLength(0);
    });
});
