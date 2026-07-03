/**
 * dateUtils.ts
 * Utilitários de data/hora sem dependência circular.
 * Extraído de dataService.ts para uso em todos os services.
 */

export const getBrazilTimestamp = (dateInput?: string | Date | null) => {
    let now: Date;
    if (dateInput) {
        if (typeof dateInput === 'string') {
            const clean = dateInput.replace(' ', 'T');
            const hasTimezone = clean.includes('Z') || /[-+]\d{2}(:?\d{2})?$/.test(clean);
            now = new Date(hasTimezone ? clean : clean + 'Z');
        } else {
            now = dateInput;
        }
    } else {
        now = new Date();
    }
    
    if (isNaN(now.getTime())) now = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}T${map.get('hour')}:${map.get('minute')}:${map.get('second')}-03:00`;
};

/** Alias for getBrazilTimestamp as requested by user */
export const getBrazilTime = getBrazilTimestamp;
