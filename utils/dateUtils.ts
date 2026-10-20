/**
 * dateUtils.ts
 * Utilitários de data/hora sem dependência circular.
 * Extraído de dataService.ts para uso em todos os services.
 */

import { BRAZIL_TIME_ZONE, getBrazilTimestampOffset, parseBrazilDate } from './formatters';

export const getBrazilTimestamp = (dateInput?: string | Date | null) => {
    const timestamp = dateInput ? parseBrazilDate(dateInput) : new Date();
    if (isNaN(timestamp.getTime())) {
        throw new Error('Data inválida para geração do timestamp de São Paulo');
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIME_ZONE,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const parts = formatter.formatToParts(timestamp);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}T${map.get('hour')}:${map.get('minute')}:${map.get('second')}${getBrazilTimestampOffset(timestamp)}`;
};

/**
 * Timestamp de São Paulo SEM offset (`YYYY-MM-DDTHH:mm:ss`), para colunas
 * `timestamp WITHOUT time zone`.
 *
 * Use este helper — e não `getBrazilTimestamp` (que devolve algo como
 * `...T14:30:00-03:00`) — ao gravar colunas naive. Um literal com offset
 * enviado a uma coluna naive tem o offset DESCARTA­DO, mas o valor é
 * reinterpretado no fuso da sessão: o mesmo instante vira `14:30` (sessão SP)
 * ou `17:30` (sessão UTC). Essa ambiguidade deslocava a comparação da janela
 * de visualização e rejeitava lançamentos de MO extra.
 */
export const getBrazilNaiveTimestamp = (dateInput?: string | Date | null): string => {
    const timestamp = dateInput ? parseBrazilDate(dateInput) : new Date();
    if (isNaN(timestamp.getTime())) {
        throw new Error('Data inválida para geração do timestamp de São Paulo');
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIME_ZONE,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const parts = formatter.formatToParts(timestamp);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}T${map.get('hour')}:${map.get('minute')}:${map.get('second')}`;
};

/** Alias for getBrazilTimestamp as requested by user */
export const getBrazilTime = getBrazilTimestamp;
