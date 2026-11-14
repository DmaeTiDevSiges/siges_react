/**
 * Leitor mínimo de tags JSX para os guardas de acessibilidade. Acompanha as chaves
 * `{…}` (com textos e templates dentro) para achar o `>` que fecha a tag mesmo
 * quando um atributo tem função com objetos aninhados — o que uma expressão regular
 * não consegue. Comentários são "apagados" (trocados por espaços) para não gerar
 * falso positivo, mantendo as posições e as linhas.
 */
export interface JsxTag { name: string; attrs: string; start: number; openEnd: number; selfClosing: boolean }

export const blankComments = (text: string): string =>
    text
        .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
        .replace(/^([ \t]*)\/\/.*$/gm, (_m, indent: string) => indent + ' '.repeat(_m.length - indent.length));

/** Fim (índice do `>`) da tag que abre em `from` (logo depois do nome), ou -1. */
const closeOfOpeningTag = (t: string, from: number): number => {
    let depth = 0;
    let quote: string | null = null;
    let tplDepth = 0;
    for (let i = from; i < t.length; i++) {
        const c = t[i];
        if (quote) {
            if (c === '\\') { i++; continue; }
            if (quote === '`') {
                if (c === '$' && t[i + 1] === '{') { tplDepth++; i++; continue; }
                if (c === '}' && tplDepth > 0) { tplDepth--; continue; }
                if (c === '`' && tplDepth === 0) quote = null;
                continue;
            }
            if (c === quote) quote = null;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
        if (c === '{') { depth++; continue; }
        if (c === '}') { depth--; continue; }
        if (c === '>' && depth === 0) return i;
    }
    return -1;
};

export const findTags = (source: string, names: string[]): JsxTag[] => {
    const text = blankComments(source.replace(/\r\n/g, '\n'));
    const re = new RegExp(`<(${names.join('|')})(?=[\\s/>])`, 'g');
    const tags: JsxTag[] = [];
    for (const m of text.matchAll(re)) {
        const start = m.index!;
        const nameEnd = start + m[0].length;
        const end = closeOfOpeningTag(text, nameEnd);
        if (end < 0) continue;
        const raw = text.slice(nameEnd, end);
        tags.push({ name: m[1], attrs: raw.replace(/\/\s*$/, ''), start, openEnd: end + 1, selfClosing: /\/\s*$/.test(raw) });
    }
    return tags;
};

export const lineOf = (source: string, index: number): number =>
    source.replace(/\r\n/g, '\n').slice(0, index).split('\n').length;

export const textOf = (source: string): string => blankComments(source.replace(/\r\n/g, '\n'));
