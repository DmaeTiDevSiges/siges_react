/**
 * Acha `<button>` cujo único conteúdo é um ícone (material-symbols) e que não tem
 * nome acessível (`aria-label`, `aria-labelledby` ou `title`). Quem usa leitor de
 * tela não tem como saber o que o botão faz. Corrija com `aria-label="<ação>"`
 * ou use o componente `IconButton` (que exige o nome no tipo).
 * Botões com texto ou expressão além do ícone ({label}) não contam.
 */
const BUTTON = /<button\b((?:[^>{]|\{[^}]*(?:\{[^}]*\}[^}]*)*\})*)>(.*?)<\/button>/gs;
const ICON_SPAN = /<span[^>]*material-symbols[^>]*>.*?<\/span>/gs;
const NAMED = /aria-label=|aria-labelledby=|title=/;

export interface UnnamedIconButton { line: number; snippet: string }

export const findUnnamedIconButtons = (source: string): UnnamedIconButton[] => {
    const text = source.replace(/\r\n/g, '\n');
    const found: UnnamedIconButton[] = [];
    for (const m of text.matchAll(BUTTON)) {
        const [, attrs, body] = m;
        if (!body.includes('material-symbols')) continue;
        const rest = body.replace(ICON_SPAN, '').replace(/<[^>]+>/g, '').trim();
        if (rest || NAMED.test(attrs)) continue;
        const line = text.slice(0, m.index).split('\n').length;
        found.push({ line, snippet: text.slice(m.index!, m.index! + 80).replace(/\s+/g, ' ') });
    }
    return found;
};
