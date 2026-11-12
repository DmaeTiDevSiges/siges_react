import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Cores (mesmo padrão dos demais documentos de relatório do projeto)
// ---------------------------------------------------------------------------
const C = {
    primary: '#003B71',
    headerBg: '#003B71',
    headerText: '#FFFFFF',
    rowEven: '#F7FAFC',
    rowOdd: '#FFFFFF',
    border: '#D1D5DB',
    text: '#1F2937',
    textMuted: '#6B7280',
    footerText: '#A0B4CC',
    sectionBg: '#EBF5FB',
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 25,
        paddingBottom: 45,
        paddingHorizontal: 20,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: C.text,
        backgroundColor: '#FFFFFF',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    title: { fontSize: 13, fontWeight: 'bold', color: C.primary },
    subtitle: { fontSize: 7, color: C.textMuted, marginTop: 1 },
    logo: { width: 28, height: 28 },
    headerLine: { borderBottomWidth: 2, borderBottomColor: C.primary, width: '100%', marginBottom: 8 },
    sectionTitle: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: C.primary,
        marginTop: 6,
        marginBottom: 4,
    },
    teamBlock: { marginBottom: 8 },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.sectionBg,
        borderLeftWidth: 3,
        borderLeftColor: C.primary,
        paddingVertical: 3,
        paddingHorizontal: 5,
        marginBottom: 1,
    },
    teamTitle: { fontSize: 8.5, fontWeight: 'bold', color: C.primary },
    teamMeta: { fontSize: 7, color: C.textMuted },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: C.headerBg, paddingVertical: 3, paddingHorizontal: 2 },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 3,
        paddingHorizontal: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    rowEven: { backgroundColor: C.rowEven },
    rowOdd: { backgroundColor: C.rowOdd },
    th: { fontSize: 6.5, fontWeight: 'bold', color: C.headerText, paddingHorizontal: 2 },
    td: { fontSize: 7, color: C.text, paddingHorizontal: 2 },
    tdBold: { fontSize: 7, color: C.text, fontWeight: 'bold', paddingHorizontal: 2 },
    tdMuted: { fontSize: 6.5, color: C.textMuted, paddingHorizontal: 2 },
    empty: { fontSize: 7, color: C.textMuted, fontStyle: 'italic', paddingVertical: 3, paddingHorizontal: 4 },
    note: { fontSize: 7, color: C.textMuted, marginTop: 2 },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: C.primary,
        paddingTop: 6,
    },
    footerText: { fontSize: 6.5, color: C.footerText },
});

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface DailyScheduleReportOrder {
    orderMask: string;
    statusLabel?: string;
    priorityCode?: string;
    unitDescription?: string;
    /** Setor / posição. */
    assetTag?: string;
    requestedServices?: string;
    /** Equipe responsável na OS (código | líder). */
    responsibleTeam?: string;
}

export interface DailyScheduleReportTeam {
    code: string;
    name?: string;
    leaderName?: string;
    orders: DailyScheduleReportOrder[];
}

export interface DailyScheduleReportPriority extends DailyScheduleReportOrder {
    rank: number;
    /** Código da equipe em que a OS está programada no dia (vazio = não programada). */
    scheduledTeamCode?: string;
}

// Larguras (somam 100%)
const TEAM_COL = { seq: '5%', os: '11%', sit: '9%', prio: '6%', unit: '19%', tag: '17%', services: '33%' };
const PRIO_COL = { rank: '5%', os: '10%', sit: '8%', prio: '5%', unit: '16%', tag: '14%', resp: '13%', sched: '8%', services: '21%' };

const fmt = (val: unknown, fallback = '—') => {
    if (val === undefined || val === null) return fallback;
    const s = String(val).trim();
    return s || fallback;
};

const renderTeamRow = (teamCode: string, o: DailyScheduleReportOrder, idx: number) => (
    <View key={`${teamCode}-${o.orderMask}`} style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]} wrap={false}>
        <Text style={[styles.tdBold, { width: TEAM_COL.seq }]}>{idx + 1}</Text>
        <Text style={[styles.tdBold, { width: TEAM_COL.os }]}>{fmt(o.orderMask)}</Text>
        <Text style={[styles.td, { width: TEAM_COL.sit }]}>{fmt(o.statusLabel)}</Text>
        <Text style={[styles.td, { width: TEAM_COL.prio }]}>{fmt(o.priorityCode)}</Text>
        <Text style={[styles.td, { width: TEAM_COL.unit }]}>{fmt(o.unitDescription)}</Text>
        <Text style={[styles.td, { width: TEAM_COL.tag }]}>{fmt(o.assetTag)}</Text>
        <Text style={[styles.td, { width: TEAM_COL.services }]}>{fmt(o.requestedServices)}</Text>
    </View>
);

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------
export const DailyScheduleDocument = ({
    contractLabel,
    dateLabel,
    filtersLabel,
    teams,
    emptyTeams,
    priorities,
    generatedAt,
    logoBase64,
}: {
    contractLabel: string;
    dateLabel: string;
    /** Resumo dos filtros aplicados na tela (vazio = sem filtros). */
    filtersLabel?: string;
    teams: DailyScheduleReportTeam[];
    /** Equipes do quadro sem OS no dia (só os rótulos). */
    emptyTeams: string[];
    priorities: DailyScheduleReportPriority[];
    generatedAt: string;
    logoBase64?: string;
}) => {
    const totalScheduled = teams.reduce((acc, t) => acc + t.orders.length, 0);

    return (
        <Document title={`Programação Diária - ${dateLabel}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* CABEÇALHO */}
                <View fixed>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Programação Diária · {dateLabel}</Text>
                            <Text style={styles.subtitle}>
                                {contractLabel} · {teams.length} equipe(s) com OS · {totalScheduled} OS(s) programada(s) · {priorities.length} em prioridade de atendimento
                            </Text>
                            {filtersLabel ? <Text style={styles.subtitle}>Filtros: {filtersLabel}</Text> : null}
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* 1. PROGRAMAÇÃO POR EQUIPE */}
                <Text style={styles.sectionTitle}>Programação por equipe</Text>
                {teams.length === 0 ? (
                    <Text style={styles.empty}>Nenhuma OS programada para as equipes neste dia.</Text>
                ) : (
                    teams.map(team => (
                        <View key={team.code} style={styles.teamBlock}>
                            {/* Título + cabeçalho da tabela + 1ª OS num bloco só: o título nunca fica sozinho no pé da página. */}
                            <View wrap={false}>
                                <View style={styles.teamHeader}>
                                    <Text style={styles.teamTitle}>
                                        {fmt(team.code)}{team.name && team.name !== team.code ? ` · ${team.name}` : ''}
                                    </Text>
                                    <Text style={styles.teamMeta}>
                                        Líder: {fmt(team.leaderName)} · {team.orders.length} OS(s)
                                    </Text>
                                </View>
                                <View style={styles.tableHeaderRow}>
                                    <Text style={[styles.th, { width: TEAM_COL.seq }]}>SEQ.</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.os }]}>OS</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.sit }]}>SITUAÇÃO</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.prio }]}>PRIOR.</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.unit }]}>UNIDADE</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.tag }]}>SETOR / POSIÇÃO</Text>
                                    <Text style={[styles.th, { width: TEAM_COL.services }]}>SERVIÇOS SOLICITADOS</Text>
                                </View>
                                {team.orders.slice(0, 1).map((o, idx) => renderTeamRow(team.code, o, idx))}
                            </View>
                            {team.orders.slice(1).map((o, idx) => renderTeamRow(team.code, o, idx + 1))}
                        </View>
                    ))
                )}
                {emptyTeams.length > 0 && (
                    <Text style={styles.note}>Equipes sem OS no dia: {emptyTeams.join(' · ')}</Text>
                )}

                {/* 2. PRIORIDADE DE ATENDIMENTO */}
                <View break={teams.length > 0}>
                    <Text style={styles.sectionTitle}>OS's PRIORIDADE DE ATENDIMENTO</Text>
                    {priorities.length === 0 ? (
                        <Text style={styles.empty}>Nenhuma OS na prioridade de atendimento.</Text>
                    ) : (
                        <View>
                            <View style={styles.tableHeaderRow} fixed>
                                <Text style={[styles.th, { width: PRIO_COL.rank }]}>Nº</Text>
                                <Text style={[styles.th, { width: PRIO_COL.os }]}>OS</Text>
                                <Text style={[styles.th, { width: PRIO_COL.sit }]}>SITUAÇÃO</Text>
                                <Text style={[styles.th, { width: PRIO_COL.prio }]}>PRIOR.</Text>
                                <Text style={[styles.th, { width: PRIO_COL.unit }]}>UNIDADE</Text>
                                <Text style={[styles.th, { width: PRIO_COL.tag }]}>SETOR / POSIÇÃO</Text>
                                <Text style={[styles.th, { width: PRIO_COL.resp }]}>EQ. RESPONSÁVEL</Text>
                                <Text style={[styles.th, { width: PRIO_COL.sched }]}>NO DIA</Text>
                                <Text style={[styles.th, { width: PRIO_COL.services }]}>SERVIÇOS SOLICITADOS</Text>
                            </View>
                            {priorities.map((o, idx) => (
                                <View key={`p-${o.orderMask}`} style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]} wrap={false}>
                                    <Text style={[styles.tdBold, { width: PRIO_COL.rank }]}>{o.rank}</Text>
                                    <Text style={[styles.tdBold, { width: PRIO_COL.os }]}>{fmt(o.orderMask)}</Text>
                                    <Text style={[styles.td, { width: PRIO_COL.sit }]}>{fmt(o.statusLabel)}</Text>
                                    <Text style={[styles.td, { width: PRIO_COL.prio }]}>{fmt(o.priorityCode)}</Text>
                                    <Text style={[styles.td, { width: PRIO_COL.unit }]}>{fmt(o.unitDescription)}</Text>
                                    <Text style={[styles.td, { width: PRIO_COL.tag }]}>{fmt(o.assetTag)}</Text>
                                    <Text style={[styles.td, { width: PRIO_COL.resp }]}>{fmt(o.responsibleTeam)}</Text>
                                    <Text style={[o.scheduledTeamCode ? styles.tdBold : styles.tdMuted, { width: PRIO_COL.sched }]}>
                                        {o.scheduledTeamCode || 'Não prog.'}
                                    </Text>
                                    <Text style={[styles.td, { width: PRIO_COL.services }]}>{fmt(o.requestedServices)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* RODAPÉ */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>SIGES · Programação Diária · {contractLabel}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Gerado em ${generatedAt} · Página ${pageNumber} de ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};
