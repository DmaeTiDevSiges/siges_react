import { BRAZIL_TIME_ZONE, parseBrazilDate } from './formatters';
import type { AssetActivityEntry, AssetActivityMatrix, AssetActivityMatrixRow } from '../types';

/** Rótulos dos meses, índice 0 = Janeiro (mesma ordem usada nos buckets). */
export const ACTIVITY_MONTH_LABELS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/** Separador improvável para montar a chave de agrupamento sem colisão. */
const KEY_SEPARATOR = '\u0001';

/**
 * As datas de visita vêm do banco como `timestamp without time zone` gravados em
 * horário de São Paulo (padrão do SIGES). O ano/mês da matriz precisa ser o de
 * São Paulo — nunca o do aparelho — por isso `parseBrazilDate` + Intl com fuso fixo.
 */
export const getBrazilYearMonth = (
    value: string | Date | null | undefined
): { year: number; month: number } | null => {
    if (!value) return null;

    const date = parseBrazilDate(value);
    if (Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(date);
    const map = new Map(parts.map(part => [part.type, part.value]));

    const year = Number(map.get('year'));
    const month = Number(map.get('month')) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) return null;

    return { year, month };
};

/** Ano corrente no fuso de São Paulo. */
export const getBrazilCurrentYear = (now: Date = new Date()): number =>
    getBrazilYearMonth(now)?.year ?? now.getFullYear();

/**
 * Anos que possuem atividades deste ativo, em ordem decrescente.
 * O ano corrente entra sempre, para a aba nunca abrir sem opção selecionável.
 */
export const getAvailableYears = (entries: AssetActivityEntry[], now: Date = new Date()): number[] => {
    const years = new Set<number>([getBrazilCurrentYear(now)]);

    entries.forEach(entry => {
        const parsed = getBrazilYearMonth(entry.date);
        if (parsed) years.add(parsed.year);
    });

    return [...years].sort((a, b) => b - a);
};

const compareRows = (a: AssetActivityMatrixRow, b: AssetActivityMatrixRow): number => {
    const byUnit = a.unitDescription.localeCompare(b.unitDescription, 'pt-BR');
    if (byUnit !== 0) return byUnit;

    const byTag = a.tagDescription.localeCompare(b.tagDescription, 'pt-BR');
    if (byTag !== 0) return byTag;

    const byTagSub = a.tagSubDescription.localeCompare(b.tagSubDescription, 'pt-BR');
    if (byTagSub !== 0) return byTagSub;

    return a.activityDescription.localeCompare(b.activityDescription, 'pt-BR');
};

/**
 * Cruza as atividades do ativo com os meses do ano informado.
 * Cada linha é um conjunto Unidade + Setor + Posição + Atividade; cada célula
 * é a quantidade de visitas aprovadas em que aquela atividade foi executada naquele mês.
 */
export const buildAssetActivityMatrix = (
    entries: AssetActivityEntry[],
    year: number
): AssetActivityMatrix => {
    const rowsByKey = new Map<string, AssetActivityMatrixRow>();
    const monthTotals = new Array(12).fill(0);
    let total = 0;

    entries.forEach(entry => {
        const parsed = getBrazilYearMonth(entry.date);
        if (!parsed || parsed.year !== year) return;

        // O banco grava descrições com espaços sobrando (ex.: "EBAP 04  "):
        // normalizar evita duas linhas para a mesma unidade/setor/posição.
        const unitDescription = (entry.unitDescription || '').trim();
        const tagDescription = (entry.tagDescription || '').trim();
        const tagSubDescription = (entry.tagSubDescription || '').trim();
        const activityDescription = (entry.activityDescription || '').trim();

        const key = [
            unitDescription,
            tagDescription,
            tagSubDescription,
            entry.activityId,
        ].join(KEY_SEPARATOR);

        let row = rowsByKey.get(key);
        if (!row) {
            row = {
                key,
                unitDescription,
                tagDescription,
                tagSubDescription,
                activityId: entry.activityId,
                activityDescription,
                months: new Array(12).fill(0),
                total: 0,
            };
            rowsByKey.set(key, row);
        }

        row.months[parsed.month] += 1;
        row.total += 1;
        monthTotals[parsed.month] += 1;
        total += 1;
    });

    return {
        rows: [...rowsByKey.values()].sort(compareRows),
        monthTotals,
        total,
    };
};
