/**
 * Quebra a busca de materiais em termos (por espaço). Cada termo vira uma lista
 * de variantes aceitas: quando junta número e letra ("50mm"), aceita também a
 * forma separada ("50 mm") — o cadastro usa as duas grafias.
 * Curingas do LIKE digitados pelo usuário são removidos.
 */
export const splitMaterialSearchTerms = (search: string): string[][] =>
    (search || '')
        .replace(/[%_\\*]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(term => {
            const spaced = term
                .replace(/(\d)([a-zA-Z\u00C0-\u017F])/g, '$1 $2')
                .replace(/([a-zA-Z\u00C0-\u017F])(\d)/g, '$1 $2');
            return spaced !== term ? [term, spaced] : [term];
        });
