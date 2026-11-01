import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { TeamShiftsCalendarEntry, TeamShiftsMonthly } from '../../types';

const COLORS = {
    primary: '#003B71',
    header: '#003B71',
    white: '#FFFFFF',
    border: '#D1D5DB',
    text: '#1F2937',
    muted: '#6B7280',
    even: '#F7FAFC',
    total: '#EBF5FB',
    blue: '#1D4ED8',
    purple: '#7E22CE'
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 24,
        paddingBottom: 36,
        paddingHorizontal: 24,
        fontFamily: 'Helvetica',
        color: COLORS.text,
        backgroundColor: COLORS.white
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary
    },
    title: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    subtitle: { marginTop: 3, fontSize: 8, color: COLORS.muted },
    logo: { width: 30, height: 30 },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.header,
        paddingVertical: 5,
        paddingHorizontal: 3
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 20,
        paddingVertical: 4,
        paddingHorizontal: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 22,
        marginTop: 2,
        paddingVertical: 5,
        paddingHorizontal: 3,
        backgroundColor: COLORS.total,
        borderTopWidth: 1.5,
        borderTopColor: COLORS.primary
    },
    headerText: { fontSize: 6.5, fontWeight: 'bold', color: COLORS.white },
    team: { width: '13%', paddingRight: 4, fontSize: 6.5, fontWeight: 'bold' },
    day: { textAlign: 'center', fontSize: 5.5 },
    dayHeader: { textAlign: 'center', fontSize: 5, fontWeight: 'bold', color: COLORS.white },
    dayWeekday: { fontSize: 4.5, color: COLORS.white },
    normal: { width: '5.5%', textAlign: 'right', fontSize: 6, color: COLORS.blue },
    extra: { width: '5.5%', textAlign: 'right', fontSize: 6, color: COLORS.purple },
    available: { width: '8.5%', textAlign: 'right', fontSize: 6, fontWeight: 'bold' },
    totalLabel: { width: '13%', fontSize: 6.5, fontWeight: 'bold', color: COLORS.primary },
    totalNumber: { width: '5.5%', textAlign: 'right', fontSize: 6.5, fontWeight: 'bold', color: COLORS.primary },
    totalHours: { width: '8.5%', textAlign: 'right', fontSize: 6.5, fontWeight: 'bold', color: COLORS.primary },
    footer: {
        position: 'absolute',
        bottom: 16,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
    },
    footerText: { fontSize: 6, color: COLORS.muted }
});

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const MONTH_NAMES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const formatNumber = (value: number) =>
    value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const pad = (value: number) => String(value).padStart(2, '0');

interface TeamShiftsCalendarDocumentProps {
    monthRef: string;
    teams: TeamShiftsMonthly[];
    entries: TeamShiftsCalendarEntry[];
    normalShiftHours: number;
    extraShiftHours: number;
    logoBase64?: string;
}

export const TeamShiftsCalendarDocument = ({
    monthRef,
    teams,
    entries,
    normalShiftHours,
    extraShiftHours,
    logoBase64
}: TeamShiftsCalendarDocumentProps) => {
    const [year, month] = monthRef.split('-').map(Number);
    const monthTitle = `${MONTH_NAMES[month - 1]} de ${year}`;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dates = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
        return {
            date: `${monthRef.slice(0, 7)}-${pad(day)}`,
            day,
            weekday
        };
    });
    const dayColumnWidth = `${67.5 / daysInMonth}%`;
    const entryKeys = new Set(entries.map(entry => `${entry.teamId}:${entry.date}:${entry.shiftType}`));
    const monthlyTotals = teams.map(team => {
        const teamEntries = entries.filter(entry => entry.teamId === team.teamId);
        const normal = teamEntries.filter(entry => entry.shiftType === 'TN').length;
        const extra = teamEntries.filter(entry => entry.shiftType === 'TE').length;
        return {
            team,
            normal,
            extra,
            availableHours: normal * normalShiftHours + extra * extraShiftHours
        };
    });
    const totals = monthlyTotals.reduce(
        (sum, current) => ({
            normal: sum.normal + current.normal,
            extra: sum.extra + current.extra,
            availableHours: sum.availableHours + current.availableHours
        }),
        { normal: 0, extra: 0, availableHours: 0 }
    );
    const generatedAt = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date());

    return (
        <Document title={`Disponibilidade das Equipes - ${monthTitle}`}>
            <Page size="A3" orientation="landscape" style={styles.page}>
                <View style={styles.header} fixed>
                    <View>
                        <Text style={styles.title}>Disponibilidade das Equipes</Text>
                        <Text style={styles.subtitle}>{monthTitle}</Text>
                    </View>
                    {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                </View>

                <View style={styles.tableHeader} fixed>
                    <Text style={[styles.headerText, { width: '13%' }]}>EQUIPE</Text>
                    {dates.map(({ date, day, weekday }) => (
                        <View key={date} style={[styles.dayHeader, { width: dayColumnWidth }]}>
                            <Text style={styles.dayWeekday}>{WEEKDAYS[weekday]}</Text>
                            <Text>{pad(day)}</Text>
                        </View>
                    ))}
                    <Text style={[styles.headerText, { width: '5.5%', textAlign: 'right' }]}>TN MÊS</Text>
                    <Text style={[styles.headerText, { width: '5.5%', textAlign: 'right' }]}>TE MÊS</Text>
                    <Text style={[styles.headerText, { width: '8.5%', textAlign: 'right' }]}>DISP. H</Text>
                </View>

                {monthlyTotals.map(({ team, normal, extra, availableHours }, rowIndex) => (
                    <View
                        key={team.teamId}
                        style={[styles.row, rowIndex % 2 === 0 ? { backgroundColor: COLORS.even } : {}]}
                        wrap={false}
                    >
                        <Text style={styles.team}>{team.teamName}</Text>
                        {dates.map(({ date }) => {
                            const normalMarked = entryKeys.has(`${team.teamId}:${date}:TN`);
                            const extraMarked = entryKeys.has(`${team.teamId}:${date}:TE`);
                            return (
                                <Text key={date} style={[styles.day, { width: dayColumnWidth }]}>
                                    {normalMarked && <Text style={{ color: COLORS.blue }}>TN</Text>}
                                    {normalMarked && extraMarked && <Text style={{ color: COLORS.muted }}>/</Text>}
                                    {extraMarked && <Text style={{ color: COLORS.purple }}>TE</Text>}
                                    {!normalMarked && !extraMarked && '—'}
                                </Text>
                            );
                        })}
                        <Text style={styles.normal}>{normal}</Text>
                        <Text style={styles.extra}>{extra}</Text>
                        <Text style={styles.available}>{formatNumber(availableHours)}</Text>
                    </View>
                ))}

                <View style={styles.totalRow} wrap={false}>
                    <Text style={styles.totalLabel}>TOTAL DO MÊS</Text>
                    {dates.map(({ date }) => (
                        <Text key={date} style={[styles.day, { width: dayColumnWidth }]} />
                    ))}
                    <Text style={styles.totalNumber}>{totals.normal}</Text>
                    <Text style={styles.totalNumber}>{totals.extra}</Text>
                    <Text style={styles.totalHours}>{formatNumber(totals.availableHours)}</Text>
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>SIGES · Disponibilidade das Equipes · TN: turno normal · TE: turno extra</Text>
                    <Text style={styles.footerText}>Gerado em {generatedAt}</Text>
                </View>
            </Page>
        </Document>
    );
};
