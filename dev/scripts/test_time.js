
const getBrazilTimestamp = () => {
    const now = new Date();
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
    return `${map.get('year')}-${map.get('month')}-${map.get('day')} ${map.get('hour')}:${map.get('minute')}:${map.get('second')}`;
};

console.log(getBrazilTimestamp());
