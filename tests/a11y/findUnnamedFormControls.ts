/**
 * Acha `<input>`, `<select>` e `<textarea>` soltos que não têm nome acessível: sem
 * `aria-label`/`aria-labelledby`/`title`, sem `<label htmlFor>` apontando para o `id`
 * e fora de um `<label>`. Quem usa leitor de tela não saberia o que preencher
 * (placeholder sozinho some ao digitar e não é um nome confiável).
 * Ficam de fora: `type="hidden"`, campos escondidos (`className="hidden"`, só
 * disparados por um botão) e exemplos dentro de comentários.
 * Corrija com `aria-label="<campo>"` ou use `Input`/`Textarea` (rótulo ligado).
 */
import { findTags, lineOf, textOf } from './jsxScan';

const NAMED = /aria-label=|aria-labelledby=|\btitle=/;

export interface UnnamedFormControl { line: number; snippet: string }

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findUnnamedFormControls = (source: string): UnnamedFormControl[] => {
    const text = textOf(source);
    const found: UnnamedFormControl[] = [];
    for (const tag of findTags(source, ['input', 'select', 'textarea'])) {
        const { attrs } = tag;
        const type = /type=["']?(\w+)/.exec(attrs)?.[1];
        if (type === 'hidden' || NAMED.test(attrs) || /className=["']hidden["']/.test(attrs)) continue;
        const idMatch = /\bid=(?:"([^"]+)"|\{([^}]+)\})/.exec(attrs);
        if (idMatch) {
            const ident = (idMatch[1] ?? idMatch[2]).trim().replace(/^[{`"']+|[}`"']+$/g, '');
            if (new RegExp(`htmlFor=[{"']?[^>]*${escapeRegExp(ident)}`).test(text)) continue;
        }
        const before = text.slice(0, tag.start);
        if (before.lastIndexOf('<label') > before.lastIndexOf('</label>')) continue;
        found.push({ line: lineOf(source, tag.start), snippet: text.slice(tag.start, tag.start + 80).replace(/\s+/g, ' ') });
    }
    return found;
};
