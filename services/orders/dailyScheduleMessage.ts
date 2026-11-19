// Texto da Programação Diária para colar num grupo de WhatsApp (função pura, sem banco).
// Usa os mesmos dados do relatório PDF; formatação do WhatsApp: *negrito*, _itálico_.
import type {
    DailyScheduleReportOrder,
    DailyScheduleReportPriority,
    DailyScheduleReportTeam,
} from '../../components/reports/DailyScheduleDocument';

export interface DailyScheduleMessageInput {
    contractLabel: string;
    /** Ex.: "seg., 16/11/2026". */
    dateLabel: string;
    teams: DailyScheduleReportTeam[];
    /** Equipes sem OS no dia, já formatadas ("EQ1 (João)"). */
    emptyTeams?: string[];
    priorities?: DailyScheduleReportPriority[];
}

const SERVICE_MAX = 90;

const clean = (value?: string) => (value || '').replace(/\s+/g, ' ').trim();

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const orderLine = (index: number, o: DailyScheduleReportOrder): string => {
    const where = [clean(o.unitDescription), clean(o.assetTag)].filter(Boolean).join(' / ');
    const head = [`${index}. OS ${o.orderMask}`, where].filter(Boolean).join(' · ');
    const services = truncate(clean(o.requestedServices), SERVICE_MAX);
    return services ? `${head}\n   _${services}_` : head;
};

export const buildDailyScheduleMessage = (input: DailyScheduleMessageInput): string => {
    const { contractLabel, dateLabel, teams, emptyTeams = [], priorities = [] } = input;
    const blocks: string[] = [];

    blocks.push(
        [`📋 *PROGRAMAÇÃO DO DIA* — ${dateLabel}`, contractLabel ? `_${contractLabel}_` : ''].filter(Boolean).join('\n'),
    );

    for (const team of teams) {
        // Só a descrição da equipe; o código só entra se ela não tiver descrição.
        const title = `👷 *${team.name || team.code}*${team.leaderName ? ` — Líder: ${team.leaderName}` : ''}`;
        blocks.push([title, ...team.orders.map((o, i) => orderLine(i + 1, o))].join('\n'));
    }

    if (emptyTeams.length > 0) blocks.push(`⚪ *Sem OS programadas:* ${emptyTeams.join(', ')}`);

    // Prioridade ainda sem equipe (as já programadas aparecem na coluna da equipe).
    const pending = priorities.filter(p => !p.scheduledTeamCode);
    if (pending.length > 0) {
        blocks.push(['🔝 *Prioridade de atendimento (sem equipe)*', ...pending.map(p => orderLine(p.rank, p))].join('\n'));
    }

    const total = teams.reduce((acc, t) => acc + t.orders.length, 0);
    blocks.push(`Total: ${total} OS programada${total === 1 ? '' : 's'} em ${teams.length} equipe${teams.length === 1 ? '' : 's'}`);

    return blocks.join('\n\n');
};
