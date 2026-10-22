/**
 * Utility functions for text formatting and manipulation
 */

export const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

const getBrazilTimezoneOffset = (timestamp: number): number => {
    const timeZoneName = new Intl.DateTimeFormat('en', {
        timeZone: BRAZIL_TIME_ZONE,
        timeZoneName: 'longOffset'
    }).formatToParts(new Date(timestamp)).find(part => part.type === 'timeZoneName')?.value;
    if (!timeZoneName) throw new Error(`Não foi possível determinar o fuso horário ${BRAZIL_TIME_ZONE}`);
    if (timeZoneName === 'GMT') return 0;

    const offset = timeZoneName.match(/^GMT([+-])(\d{2}):?(\d{2})?$/);
    if (!offset) throw new Error(`Fuso horário inesperado para ${BRAZIL_TIME_ZONE}: ${timeZoneName}`);
    const minutes = Number(offset[2]) * 60 + Number(offset[3] || 0);
    return (offset[1] === '+' ? 1 : -1) * minutes * 60_000;
};

export const parseBrazilDate = (value: Date | string | number): Date => {
    if (value instanceof Date || typeof value === 'number') return new Date(value);

    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const localDateTime = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/);
    const wallClock = dateOnly ? `${value}T00:00:00` : localDateTime ? `${localDateTime[1]}T${localDateTime[2]}` : null;
    if (wallClock) {
        const wallClockUtc = Date.parse(`${wallClock}Z`);
        let timestamp = wallClockUtc - getBrazilTimezoneOffset(wallClockUtc);
        timestamp = wallClockUtc - getBrazilTimezoneOffset(timestamp);
        return new Date(timestamp);
    }

    return new Date(value);
};

export const formatDateInBrazil = (
    value: Date | string | number,
    format: 'date' | 'time' | 'dateTime',
    locales?: string | string[],
    options: Intl.DateTimeFormatOptions = {}
): string => {
    const date = parseBrazilDate(value);
    if (Number.isNaN(date.getTime())) return 'Invalid Date';

    const safeOptions = { ...options, timeZone: BRAZIL_TIME_ZONE };
    const locale = Array.isArray(locales) && locales.length === 0 ? 'pt-BR' : locales || 'pt-BR';
    // 'dateTime' sem componentes de data/hora informados cai no default do Intl,
    // que devolve APENAS a data ("2026-10-16", meia-noite). Chamadas de comparação
    // (ex.: getActiveNotices/AppNoticeTicker) precisam do horário: sem ele, um aviso
    // que começa hoje só aparece amanhã e um aviso que termina hoje some só à meia-noite.
    const hasDateTimePart = Boolean(
        safeOptions.dateStyle || safeOptions.timeStyle ||
        safeOptions.year || safeOptions.month || safeOptions.day || safeOptions.weekday || safeOptions.era ||
        safeOptions.hour || safeOptions.minute || safeOptions.second || safeOptions.timeZoneName ||
        safeOptions.hourCycle || safeOptions.hour12 || safeOptions.fractionalSecondDigits
    );
    const formatter = new Intl.DateTimeFormat(
        locale,
        format === 'date'
            ? { ...safeOptions, ...(!safeOptions.dateStyle && !safeOptions.year && !safeOptions.month && !safeOptions.day ? { year: 'numeric', month: 'numeric', day: 'numeric' } : {}) }
            : format === 'time'
                ? { ...safeOptions, ...(!safeOptions.timeStyle && !safeOptions.hour && !safeOptions.minute && !safeOptions.second ? { hour: 'numeric', minute: 'numeric', second: 'numeric' } : {}) }
                : format === 'dateTime'
                    ? { ...safeOptions, ...(!hasDateTimePart ? { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' } : {}) }
                    : safeOptions
    );
    return formatter.format(date);
};

export const getBrazilDateInputValue = (value: Date | string | number = new Date()): string => {
    const date = parseBrazilDate(value);
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const map = new Map(parts.map(part => [part.type, part.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}`;
};

/**
 * Valor para `<input type="datetime-local">` no fuso de São Paulo
 * (`YYYY-MM-DDTHH:mm`).
 */
export const getBrazilDateTimeInputValue = (value: Date | string | number = new Date()): string => {
    const date = parseBrazilDate(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Data inválida para geração do valor de data/hora');
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const map = new Map(parts.map(part => [part.type, part.value]));
    return `${map.get('year')}-${map.get('month')}-${map.get('day')}T${map.get('hour')}:${map.get('minute')}`;
};

/**
 * Normaliza um valor de `datetime-local` (`YYYY-MM-DDTHH:mm`) para o
 * timestamp naive (`YYYY-MM-DDTHH:mm:ss`) usado nas colunas
 * `timestamp without time zone`.
 *
 * Não aplica offset: o valor digitado já é o horário de parede de São Paulo.
 */
export const toBrazilNaiveDateTime = (value: string): string => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        throw new Error('Data/hora inválida. Use o formato AAAA-MM-DDTHH:mm.');
    }
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || '00'}`;
};

/**
 * Duração em horas entre dois timestamps naive (sem conversão de fuso).
 * Retorna `NaN` quando algum valor é inválido.
 */
export const getNaiveDurationHours = (start: string, end: string): number => {
    const toUtc = (value: string): number => {
        const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return NaN;
        return Date.UTC(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] || 0)
        );
    };

    const diffMs = toUtc(end) - toUtc(start);
    return Number.isFinite(diffMs) ? diffMs / 3_600_000 : NaN;
};

/**
 * Formata uma duração em horas para texto curto (ex.: "1 d 8 h 30 min").
 */
export const formatDurationHuman = (hours: number): string => {
    if (!Number.isFinite(hours) || hours < 0) return '';
    const totalMinutes = Math.round(hours * 60);
    const days = Math.floor(totalMinutes / 1440);
    const remainingHours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} d`);
    if (remainingHours > 0) parts.push(`${remainingHours} h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);
    return parts.join(' ');
};

export const addBrazilCalendarDays = (value: Date | string | number, days: number): string => {
    const [year, month, day] = getBrazilDateInputValue(value).split('-').map(Number);
    const adjusted = new Date(Date.UTC(year, month - 1, day + days));
    return `${adjusted.getUTCFullYear()}-${String(adjusted.getUTCMonth() + 1).padStart(2, '0')}-${String(adjusted.getUTCDate()).padStart(2, '0')}`;
};

export const getBrazilTimestampOffset = (value: Date): string => {
    const offsetMinutes = getBrazilTimezoneOffset(value.getTime()) / 60_000;
    const sign = offsetMinutes < 0 ? '-' : '+';
    const absoluteMinutes = Math.abs(offsetMinutes);
    return `${sign}${String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')}:${String(absoluteMinutes % 60).padStart(2, '0')}`;
};

/**
 * Get initials from a full name
 * @param name - Full name to extract initials from
 * @returns Initials (max 2 characters) or '?' if name is empty
 * @example getInitials('João Silva') // 'JS'
 */
export const getInitials = (name?: string): string => {
    if (!name) return '?';

    const parts = name.trim().split(' ').filter(n => n.length > 0);

    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }

    return name.trim().slice(0, 2).toUpperCase();
};

/**
 * Format currency value to Brazilian Real
 * @param value - Numeric value to format
 * @returns Formatted currency string
 * @example formatCurrency(1000) // 'R$ 1.000,00'
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Format date to Brazilian format
 * @param date - Date string or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date: string | Date): string => {
    if (typeof date === 'string') {
        const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
            const [_, year, month, day] = dateOnlyMatch;
            return `${day}/${month}/${year}`;
        }
    }
    const d = parseBrazilDate(date);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: BRAZIL_TIME_ZONE }).format(d);
};

/**
 * Format date and time to Brazilian format (SEMPRE: dd/mm/aaaa HH:mm h)
 * @param date - Date string or Date object
 * @returns Formatted datetime string (DD/MM/YYYY HH:mm h)
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = parseBrazilDate(date);
    if (isNaN(d.getTime())) return 'N/A';

    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TIME_ZONE,
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('day')}/${map.get('month')}/${map.get('year')} ${map.get('hour')}:${map.get('minute')} h`;
};

/**
 * Format date and time in compact brazilian format (dd/mm/aaaa HH:mmh)
 * @param date - Date string or Date object
 * @returns Formatted datetime string (DD/MM/YYYY HH:mmh)
 */
export const formatDateTimeCompact = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    if (typeof date === 'string') {
        // timestamp sem timezone (gravado em horário do Brasil): formata direto, sem conversão
        const naive = date.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
        if (naive && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(date)) {
            const [, year, month, day, hour, minute] = naive;
            return `${day}/${month}/${year} ${hour}:${minute}h`;
        }
    }
    const d = parseBrazilDate(date);
    if (isNaN(d.getTime())) return '-';
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TIME_ZONE,
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const map = new Map(parts.map(p => [p.type, p.value]));
    return `${map.get('day')}/${map.get('month')}/${map.get('year')} ${map.get('hour')}:${map.get('minute')}h`;
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Format date to relative time (agora há pouco, 1 hora atrás, etc)
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'Nunca';

    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'agora há pouco';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''} atrás`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''} atrás`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ano${diffInYears > 1 ? 's' : ''} atrás`;
};

/**
 * Get color for a priority code
 * @param priorityCode - Priority code (AT, MD, BX)
 * @returns Tailwind class for background color
 */
export const getPriorityColor = (priorityCodeOrColor?: string | number): string => {
    if (!priorityCodeOrColor) return '#64748b'; // Default slate-500
    
    const val = String(priorityCodeOrColor).toLowerCase();
    
    // If it's already a hex color, return it
    if (val.startsWith('#')) return val;
    
    switch (val) {
        // Raw DB color names
        case 'red':    return '#f43f5e'; // rose-500
        case 'orange': return '#f97316'; // orange-500
        case 'green':  return '#22c55e'; // green-500
        case 'blue':   return '#3b82f6'; // blue-500
        case 'yellow': return '#eab308'; // yellow-500
        // Priority codes
        case 'at':     return '#f43f5e'; // Alta - rose-500
        case 'md':     return '#f97316'; // Média - orange-500
        case 'bx':     return '#22c55e'; // Baixa - green-500
        // Numeric IDs (based on DB screenshot)
        case '1':      return '#f43f5e'; // Alta
        case '2':      return '#f97316'; // Média
        case '3':      return '#22c55e'; // Baixa
        default:       return '#64748b'; // slate-500
    }
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
    const chan = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};

/**
 * Text color class for a badge with an inline hex background.
 * Orange/yellow/amber backgrounds with enough luminance get black text,
 * everything else keeps white text.
 */
export const getTextColorForBg = (bg?: string): string => {
    if (!bg) return 'text-white';
    const rgb = hexToRgb(bg);
    if (!rgb) return 'text-white';

    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    if (d === 0) return 'text-white';

    let h: number;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = ((h * 60) + 360) % 360;

    const isOrangeYellow = h >= 10 && h <= 75;
    if (!isOrangeYellow) return 'text-white';

    return relativeLuminance(rgb) > 0.179 ? 'text-black' : 'text-white';
};


/**
 * Get configuration (icon, color, label) for a status ID
 * @param statusId - Status ID from database
 * @returns Object with icon name, text color class, background color class, and bar color class
 */
export const getStatusConfig = (statusId?: number | string) => {
    const id = Number(statusId);
    switch (id) {
        case 1: // Pendente (SS)
            return { icon: 'assignment_late', color: 'text-black dark:text-orange-500', bgColor: 'bg-orange-500/10', barColor: 'bg-orange-500', label: 'Pendentes' };
        case 2: // Avaliação
            return { icon: 'assignment_late', color: 'text-black dark:text-yellow-500', bgColor: 'bg-yellow-500/10', barColor: 'bg-yellow-500', label: 'Avaliação' };
        case 3: // Autorizada
            return { icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10', barColor: 'bg-blue-500', label: 'Autorizadas' };
        case 4: // Agendada
            return { icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', barColor: 'bg-indigo-500', label: 'Agendadas' };
        case 5: // Execução
            return { icon: 'play_circle', color: 'text-green-500', bgColor: 'bg-green-500/10', barColor: 'bg-green-500', label: 'Execução' };
        case 6: // Suspensa
            return { icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10', barColor: 'bg-red-500', label: 'Suspensas' };
        case 7: // Cancelada
            return { icon: 'cancel', color: 'text-rose-600', bgColor: 'bg-rose-600/10', barColor: 'bg-rose-600', label: 'Canceladas' };
        default:
            return { icon: 'task_alt', color: 'text-slate-500', bgColor: 'bg-slate-500/10', barColor: 'bg-slate-500', label: 'Status' };
    }
};
