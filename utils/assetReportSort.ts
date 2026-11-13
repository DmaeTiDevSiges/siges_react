/**
 * Ordem dos relatórios de ativos (PDF/XLS da unidade): descrição do setor → descrição da
 * posição → código do ativo. Comparação em pt-BR, sem diferenciar maiúsculas/acentos e com
 * números em ordem natural ("GMB 2" antes de "GMB 10"). Sem setor/posição vai para o fim.
 */
export interface AssetReportSortable {
    tagName?: string | null;
    tagSubName?: string | null;
    code?: string | null;
    description?: string | null;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

const compareText = (a?: string | null, b?: string | null) => {
    const x = (a || '').trim();
    const y = (b || '').trim();
    if (!x && !y) return 0;
    if (!x) return 1; // vazio por último
    if (!y) return -1;
    return collator.compare(x, y);
};

export const compareAssetsBySectorPosition = (a: AssetReportSortable, b: AssetReportSortable) =>
    compareText(a.tagName, b.tagName) ||
    compareText(a.tagSubName, b.tagSubName) ||
    compareText(a.code, b.code);

/** Cópia ordenada (não altera o array original). */
export const sortAssetsBySectorPosition = <T extends AssetReportSortable>(rows: T[]): T[] =>
    [...rows].sort(compareAssetsBySectorPosition);

/** Setor → posição → descrição (código como desempate). Usado na lista de ativos da visita. */
export const compareAssetsBySectorPositionDescription = (a: AssetReportSortable, b: AssetReportSortable) =>
    compareText(a.tagName, b.tagName) ||
    compareText(a.tagSubName, b.tagSubName) ||
    compareText(a.description, b.description) ||
    compareText(a.code, b.code);

/**
 * Ordena qualquer lista lendo setor/posição/descrição/código por um seletor
 * (ex.: ativos da visita, que guardam o setor em beforeTagDescription).
 */
export const sortBySectorPositionDescription = <T,>(rows: T[], pick: (row: T) => AssetReportSortable): T[] =>
    [...rows].sort((a, b) => compareAssetsBySectorPositionDescription(pick(a), pick(b)));
