/**
 * Acha `<input>`, `<select>` e `<textarea>` soltos que não têm nome acessível: sem
 * `aria-label`/`aria-labelledby`/`title`, sem `<label htmlFor>` apontando para o `id`
 * e fora de um `<label>`. Quem usa leitor de tela não saberia o que preencher
 * (placeholder sozinho some ao digitar e não é um nome confiável).
 * Ficam de fora: `type="hidden"`, campos escondidos (`className="hidden"`, só
 * disparados por um botão) e exemplos dentro de comentários.
 * Corrija com `aria-label="<campo>"` ou use `Input`/`Textarea` (rótulo ligado).
 */
const CONTROL = /<(input|select|textarea)\b((?:[^>{]|\{[^}]*(?:\{[^}]*\}[^}]*)*\})*?)\/?>/gs;
const NAMED = /aria-label=|aria-labelledby=|\btitle=/;

export interface UnnamedFormControl { line: number; snippet: string }

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findUnnamedFormControls = (source: string): UnnamedFormControl[] => {
    const text = source.replace(/\r\n/g, '\n');
    const found: UnnamedFormControl[] = [];
    for (const m of text.matchAll(CONTROL)) {
        const [, , attrs] = m;
        const start = m.index!;
        const type = /type=["']?(\w+)/.exec(attrs)?.[1];
        if (type === 'hidden') continue;
        if (NAMED.test(attrs)) continue;
        if (/className=["']hidden["']/.test(attrs)) continue;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        if (/^\s*(\*|\/\/)/.test(text.slice(lineStart, start))) continue;
        const idMatch = /\bid=(?:"([^"]+)"|\{([^}]+)\})/.exec(attrs);
        if (idMatch) {
            const ident = (idMatch[1] ?? idMatch[2]).trim().replace(/^[{`"']+|[}`"']+$/g, '');
            if (new RegExp(`htmlFor=[{"']?[^>]*${escapeRegExp(ident)}`).test(text)) continue;
        }
        const before = text.slice(0, start);
        if (before.lastIndexOf('<label') > before.lastIndexOf('</label>')) continue;
        found.push({ line: before.split('\n').length, snippet: text.slice(start, start + 80).replace(/\s+/g, ' ') });
    }
    return found;
};
