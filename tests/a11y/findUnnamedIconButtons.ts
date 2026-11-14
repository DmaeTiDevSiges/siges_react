import { findTags, lineOf, textOf } from './jsxScan';

/**
 * Acha `<button>` cujo único conteúdo é um ícone (material-symbols) e que não tem
 * nome acessível (`aria-label`, `aria-labelledby` ou `title`). Quem usa leitor de
 * tela não tem como saber o que o botão faz. Corrija com `aria-label="<ação>"`
 * ou use o componente `IconButton` (que exige o nome no tipo).
 * Botões com texto ou expressão além do ícone ({label}) não contam.
 */
const ICON_SPAN = /<span[^>]*material-symbols[^>]*>.*?<\/span>/gs;
const NAMED = /aria-label=|aria-labelledby=|title=/;

export interface UnnamedIconButton { line: number; snippet: string }

export const findUnnamedIconButtons = (source: string): UnnamedIconButton[] => {
    const text = textOf(source);
    const found: UnnamedIconButton[] = [];
    for (const tag of findTags(source, ['button'])) {
        if (tag.selfClosing || NAMED.test(tag.attrs)) continue;
        const close = text.indexOf('</button>', tag.openEnd);
        if (close < 0) continue;
        const body = text.slice(tag.openEnd, close);
        if (!body.includes('material-symbols')) continue;
        const rest = body.replace(ICON_SPAN, '').replace(/<[^>]+>/g, '').trim();
        if (rest) continue;
        found.push({ line: lineOf(source, tag.start), snippet: text.slice(tag.start, tag.start + 80).replace(/\s+/g, ' ') });
    }
    return found;
};
