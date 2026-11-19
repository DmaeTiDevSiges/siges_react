// Programação Diária de Atendimento (Gestão > aba Programação).
//
// Quadro kanban por contrato + dia:
//   • faixa "OS's ABERTAS": OSs abertas do contrato ainda não priorizadas (ordem de abertura);
//     OSs Em Avaliação ficam fora da programação (não aparecem em nenhuma faixa);
//   • faixa "OS's PRIORIDADE DE ATENDIMENTO": as OSs escolhidas, na prioridade de atendimento registrada
//     para o dia (orders_daily_schedules_priorities);
//   • colunas: equipes do departamento prestador do contrato que têm líder ativo.
// As colunas começam limpas no dia: só aparecem as OSs inseridas nelas.
// Inserir uma OS Em Avaliação numa coluna AUTORIZA a OS (status 3) para aquela equipe/líder
// (qualquer equipe); OS com equipe já definida só entra na coluna da própria equipe.
// Na coluna a OS só é reordenada (não troca de equipe).
// A ordem do dia fica em orders_daily_schedules(_items) — migration 20261110.
import { supabase } from '../core/supabase';
import { getPublicImageUrl } from '../media/imageUtils';
import { ordersService } from './ordersService';
import { sortColumnsByLeaderName } from './dailyScheduleSort';

export const DAILY_SCHEDULE_STATUS = {
    NOT_PROGRAMMED: 1,
    EVALUATION: 2,
    AUTHORIZED: 3,
    SCHEDULED: 4,
    EXECUTION: 5,
    SUSPENDED: 6,
} as const;

export interface DailyScheduleOrder {
    id: string;
    orderMask: string;
    statusId: number;
    statusCode?: string;
    statusDescription?: string;
    statusAt?: string;
    teamId?: string;
    teamLeaderId?: string;
    /** Equipe responsável (cfg_teams.code / description) e líder (users.name_short) na OS. */
    teamCode?: string;
    teamDescription?: string;
    teamLeaderName?: string;
    priorityCode?: string;
    priorityDescription?: string;
    unitId?: string;
    unitDescription?: string;
    assetTagId?: string;
    assetTagDescription?: string;
    /** Posição (sub-setor). */
    assetTagSubDescription?: string;
    requestedServices?: string;
    typeLabel?: string;
    requestedAt?: string;
}

/**
 * Coluna do quadro: um LÍDER com a equipe dele. Equipe com mais de um líder vira várias
 * colunas (a equipe se repete); a programação continua gravada por equipe (`teamId`).
 */
export interface DailyScheduleTeam {
    /** Chave da coluna: `<teamId>:<leaderId>` (histórico sem líder: `<teamId>:`). */
    id: string;
    /** cfg_teams.id — o que vai para orders.team_id e para a sequência gravada. */
    teamId: string;
    code: string;
    name: string;
    /** Coluna da equipe-mãe (cfg_teams.parent_id) — só quando ela também está no quadro. */
    parentId?: string;
    leaderId: string;
    leaderName: string;
    leaderAvatarUrl?: string;
}

export const scheduleColumnId = (teamId: string, leaderId?: string) => `${teamId}:${leaderId || ''}`;

/**
 * Coluna "da própria OS": a do líder gravado na OS; sem ela no quadro, a 1ª coluna da equipe.
 */
export const ownScheduleColumnId = (
    order: Pick<DailyScheduleOrder, 'teamId' | 'teamLeaderId'>,
    columns: DailyScheduleTeam[],
): string | undefined => {
    if (!order.teamId) return undefined;
    const sameTeam = columns.filter(c => c.teamId === order.teamId);
    return (sameTeam.find(c => c.leaderId && c.leaderId === order.teamLeaderId) || sameTeam[0])?.id;
};

export interface DailyScheduleBoard {
    /** false → migration 20261110 ainda não aplicada (sem registro da sequência/prioridade). */
    supported: boolean;
    teams: DailyScheduleTeam[];
    /** OSs priorizadas, na prioridade do dia (dia passado: o que foi registrado). */
    priorities: DailyScheduleOrder[];
    /** OSs abertas do contrato ainda não priorizadas (ordem de abertura). Dia passado: vazio. */
    openOrders: DailyScheduleOrder[];
    /** Dia sem prioridade registrada: data (YYYY-MM-DD) da prioridade usada como ponto de partida. */
    prioritiesInheritedFrom?: string;
    /** teamId → OSs na ordem de execução. */
    columns: Record<string, DailyScheduleOrder[]>;
    updatedAt?: string;
}

/** Movimentação registrada em orders_daily_schedules_logs (migration 20261126). */
export type DailyScheduleMoveAction = 'prioritize' | 'unprioritize' | 'authorize_team' | 'assign_team' | 'change_team' | 'unassign_team';

export interface DailyScheduleMoveLog {
    contractId: string;
    date: string;
    orderId: string;
    action: DailyScheduleMoveAction;
    fromTeamId?: string;
    toTeamId?: string;
    /** Posição de destino (1 = primeira). */
    toPosition?: number;
}

export interface DailyScheduleItemInput {
    orderId: string;
    teamId: string;
}

/** Item da programação do dia da equipe do usuário logado (Meu Painel). */
export interface MyDayScheduleItem {
    orderId: string;
    teamId: string;
    position: number;
    scheduleDate: string;
}

/** Erro lançado quando a OS mudou de situação/equipe enquanto o quadro estava aberto. */
export const ORDER_STATUS_CONFLICT = 'ORDER_STATUS_CONFLICT';

const ORDER_COLUMNS = [
    'id', 'order_mask', 'status_id', 'status_code', 'status_description', 'status_at',
    'team_id', 'team_code', 'team_description', 'team_leader_id', 'team_leader_name_short', 'priority_code', 'priority_description',
    'unit_id', 'unit_description', 'asset_tag_id', 'asset_tag_description', 'asset_tag_sub_description',
    'requested_services',
    'type_code', 'type_sub_code', 'object_code', 'requested_at',
].join(', ');

const mapOrder = (item: any): DailyScheduleOrder => ({
    id: item.id.toString(),
    orderMask: item.order_mask,
    statusId: Number(item.status_id),
    statusCode: item.status_code?.trim(),
    statusDescription: item.status_description,
    statusAt: item.status_at,
    teamId: item.team_id?.toString(),
    teamLeaderId: item.team_leader_id?.toString(),
    teamCode: item.team_code || undefined,
    teamDescription: item.team_description || undefined,
    teamLeaderName: item.team_leader_name_short || undefined,
    priorityCode: item.priority_code,
    priorityDescription: item.priority_description,
    unitId: item.unit_id?.toString(),
    unitDescription: item.unit_description,
    assetTagId: item.asset_tag_id?.toString(),
    assetTagDescription: item.asset_tag_description,
    assetTagSubDescription: item.asset_tag_sub_description,
    requestedServices: item.requested_services,
    typeLabel: [item.type_code, item.type_sub_code, item.object_code].filter(Boolean).join('/'),
    requestedAt: item.requested_at,
});

/** Tabela/relacionamento ainda não existe no banco (migration pendente ou cache do PostgREST desatualizado). */
const isMissingRelation = (error: any) =>
    ['42P01', 'PGRST200', 'PGRST205'].includes(error?.code) ||
    /does not exist|could not find the table|could not find a relationship/i.test(error?.message || '');

const byRequestedAt = (a: DailyScheduleOrder, b: DailyScheduleOrder) =>
    String(a.requestedAt || '').localeCompare(String(b.requestedAt || ''));

/** Função ausente no banco (RPC ainda não criada pela migration). */
const isMissingFunction = (error: any) =>
    ['PGRST202', '42883'].includes(error?.code) || /could not find the function/i.test(error?.message || '');

/** RPC fn_orders_daily_schedule_board indisponível (migration 20261128 pendente) nesta sessão. */
let boardRpcMissing = false;

const TEAMS_CACHE_MS = 5 * 60 * 1000;
const teamsCache = new Map<string, { at: number; teams: DailyScheduleTeam[] }>();

interface RawBoardData {
    /** false → migration 20261110 ainda não aplicada. */
    supported: boolean;
    hasSchedule: boolean;
    updatedAt?: string;
    savedItems: Array<{ order_id: number; team_id: number; position: number }>;
    savedPriorities: Array<{ order_id: number; position: number }>;
    prioritiesInheritedFrom?: string;
    /** Dia de hoje/futuro: OSs abertas do contrato; dia passado: só as registradas no dia. */
    orders: DailyScheduleOrder[];
}

export const dailyScheduleService = {
    /**
     * Equipes ativas do departamento prestador que têm ao menos um líder ativo.
     * Guardadas por TEAMS_CACHE_MS (quase não mudam); `fresh` busca de novo.
     */
    async getTeamsWithLeaders(providerDepartmentId: string, fresh?: boolean): Promise<DailyScheduleTeam[]> {
        const cached = teamsCache.get(providerDepartmentId);
        if (!fresh && cached && Date.now() - cached.at < TEAMS_CACHE_MS) return cached.teams;
        const teams = await this.fetchTeamsWithLeaders(providerDepartmentId);
        teamsCache.set(providerDepartmentId, { at: Date.now(), teams });
        return teams;
    },

    async fetchTeamsWithLeaders(providerDepartmentId: string): Promise<DailyScheduleTeam[]> {
        const { data: teams, error } = await supabase
            .from('cfg_teams')
            .select('id, code, description, sort_order, parent_id')
            .eq('department_id', providerDepartmentId)
            .eq('is_available', true)
            .order('sort_order', { ascending: true })
            .order('description');
        if (error) throw error;
        if (!teams || teams.length === 0) return [];

        const { data: leaders, error: leadersError } = await supabase
            .from('users')
            .select('id, team_id, name_short, name_full, img_file_path, img_file_name')
            .eq('is_team_leader', true)
            .eq('status_id', 2)
            .in('team_id', teams.map((t: any) => t.id))
            .order('name_short');
        if (leadersError) throw leadersError;

        // Todos os líderes ativos de cada equipe (já em ordem de nome).
        const leadersByTeam = new Map<string, any[]>();
        for (const leader of leaders || []) {
            const key = leader.team_id?.toString();
            if (!key) continue;
            leadersByTeam.set(key, [...(leadersByTeam.get(key) || []), leader]);
        }

        // Coluna da equipe-mãe = a do 1º líder dela (o filtro em árvore aponta para ela).
        const firstColumnOfTeam = new Map<string, string>();
        for (const [teamId, list] of leadersByTeam) firstColumnOfTeam.set(teamId, scheduleColumnId(teamId, list[0].id.toString()));

        // Um card por líder (a equipe se repete quando tem mais de um líder), em ordem alfabética do líder.
        const columns = teams.flatMap((t: any) => {
            const teamId = t.id.toString();
            const parentColumn = t.parent_id ? firstColumnOfTeam.get(t.parent_id.toString()) : undefined;
            return (leadersByTeam.get(teamId) || []).map((leader: any): DailyScheduleTeam => {
                const leaderId = leader.id.toString();
                const id = scheduleColumnId(teamId, leaderId);
                return {
                    id,
                    teamId,
                    code: t.code,
                    name: t.description,
                    parentId: parentColumn && parentColumn !== id ? parentColumn : undefined,
                    leaderId,
                    leaderName: leader.name_short || leader.name_full || 'Líder',
                    leaderAvatarUrl: leader.img_file_name
                        ? getPublicImageUrl(leader.img_file_path, leader.img_file_name, { width: 100, height: 100, resize: 'cover' })
                        : undefined,
                };
            });
        });
        return sortColumnsByLeaderName(columns);
    },

    /**
     * Dados crus do dia (sequência, prioridade/herança e OSs). 1º tenta a RPC única
     * fn_orders_daily_schedule_board (migration 20261128: uma ida ao banco, consulta enxuta);
     * sem ela, cai nas consultas diretas — em paralelo e com a herança numa consulta só.
     */
    async loadBoardData(contractId: string, date: string, readOnly: boolean, fresh?: boolean): Promise<RawBoardData> {
        if (fresh) boardRpcMissing = false;
        if (!boardRpcMissing) {
            const { data, error } = await supabase.rpc('fn_orders_daily_schedule_board', {
                p_contract_id: Number(contractId),
                p_date: date,
                p_read_only: readOnly,
            });
            if (!error && data) {
                const raw = data as any;
                return {
                    supported: true,
                    hasSchedule: !!raw.schedule,
                    updatedAt: raw.schedule?.updated_at,
                    savedItems: raw.items || [],
                    savedPriorities: raw.priorities || [],
                    prioritiesInheritedFrom: raw.inherited_from || undefined,
                    orders: ((raw.orders || []) as any[]).map(mapOrder),
                };
            }
            if (error && !isMissingFunction(error)) throw error;
            boardRpcMissing = true; // migration 20261128 ainda não aplicada
        }
        return this.loadBoardDataDirect(contractId, date, readOnly);
    },

    /** Caminho sem a RPC: consultas diretas em paralelo (tolerante à migration 20261110 ausente). */
    async loadBoardDataDirect(contractId: string, date: string, readOnly: boolean): Promise<RawBoardData> {
        const schedulePromise = supabase
            .from('orders_daily_schedules')
            .select('id, updated_at, orders_daily_schedules_items(order_id, team_id, position), orders_daily_schedules_priorities(order_id, position)')
            .eq('contract_id', contractId)
            .eq('schedule_date', date)
            .maybeSingle();
        // Herança (dia sem registro): a última prioridade registrada antes do dia, numa consulta
        // só (!inner = só dias que têm prioridade). Roda junto; é descartada se o dia tiver registro.
        const inheritPromise = readOnly
            ? Promise.resolve(null)
            : supabase
                .from('orders_daily_schedules')
                .select('schedule_date, orders_daily_schedules_priorities!inner(order_id, position)')
                .eq('contract_id', contractId)
                .lt('schedule_date', date)
                .order('schedule_date', { ascending: false })
                .limit(1)
                .maybeSingle();
        const openOrdersPromise = readOnly
            ? Promise.resolve(null)
            : supabase
                .from('v_orders')
                .select(ORDER_COLUMNS)
                .eq('contract_id', contractId)
                .not('parent_id', 'is', null)
                .not('status_id', 'in', '(7,8)')
                .order('requested_at', { ascending: true });

        const [scheduleRes, inheritRes, openRes] = await Promise.all([schedulePromise, inheritPromise, openOrdersPromise]);

        let supported = true;
        const schedule: any = scheduleRes.data;
        if (scheduleRes.error) {
            if (isMissingRelation(scheduleRes.error)) supported = false;
            else throw scheduleRes.error;
        }
        const savedItems = (schedule?.orders_daily_schedules_items || []) as RawBoardData['savedItems'];
        let savedPriorities = (schedule?.orders_daily_schedules_priorities || []) as RawBoardData['savedPriorities'];
        let prioritiesInheritedFrom: string | undefined;
        // Dia SEM registro nenhum: parte da última prioridade registrada antes dele.
        // (Dia com registro e prioridade vazia = esvaziada de propósito: não herda.)
        if (supported && !schedule && inheritRes) {
            if (inheritRes.error && !isMissingRelation(inheritRes.error)) throw inheritRes.error;
            const previous: any = inheritRes.data;
            if (previous) {
                savedPriorities = previous.orders_daily_schedules_priorities || [];
                prioritiesInheritedFrom = previous.schedule_date;
            }
        }

        let orders: DailyScheduleOrder[] = [];
        if (readOnly) {
            // Dia passado: só as OSs registradas no dia (podem já estar concluídas).
            const ids = [...new Set([...savedItems.map(i => i.order_id), ...savedPriorities.map(p => p.order_id)])];
            if (ids.length > 0) {
                const { data, error } = await supabase.from('v_orders').select(ORDER_COLUMNS).in('id', ids);
                if (error) throw error;
                orders = (data || []).map(mapOrder);
            }
        } else if (openRes) {
            if (openRes.error) throw openRes.error;
            orders = (openRes.data || []).map(mapOrder);
        }

        return {
            supported,
            hasSchedule: !!schedule,
            updatedAt: schedule?.updated_at,
            savedItems,
            savedPriorities,
            prioritiesInheritedFrom,
            orders,
        };
    },

    /**
     * Monta o quadro do dia.
     * readOnly (dia passado): HISTÓRICO — exatamente a prioridade e a distribuição por equipe
     * registradas naquele dia (inclusive equipes que hoje não têm líder).
     * Senão: ABERTAS = OSs abertas não priorizadas (sem Em Avaliação); PRIORIDADE = as
     * registradas no dia (ou herdadas do último dia registrado); colunas = só as OSs
     * inseridas no dia, na sequência salva.
     * Equipes e dados do dia são buscados ao mesmo tempo. `fresh`: ignora o cache das equipes
     * (botão atualizar).
     */
    async getBoard(params: {
        contractId: string;
        providerDepartmentId: string;
        date: string; // YYYY-MM-DD
        readOnly: boolean;
        fresh?: boolean;
    }): Promise<DailyScheduleBoard> {
        const { contractId, providerDepartmentId, date, readOnly, fresh } = params;

        const [cachedTeams, raw] = await Promise.all([
            this.getTeamsWithLeaders(providerDepartmentId, fresh),
            this.loadBoardData(contractId, date, readOnly, fresh),
        ]);
        // Cópia: o histórico acrescenta colunas sem líder e não pode sujar o cache.
        const teams = [...cachedTeams];
        const { supported, updatedAt, savedItems, savedPriorities, prioritiesInheritedFrom } = raw;

        // Sem a migration 20261129 a RPC não traz equipe/líder: completa pelas colunas do quadro
        // (mesma equipe; o líder da OS normalmente é um dos líderes atuais da equipe).
        for (const order of raw.orders) {
            if (!order.teamId) continue;
            const sameTeam = cachedTeams.filter(t => t.teamId === order.teamId);
            if (sameTeam.length === 0) continue;
            if (!order.teamCode) {
                order.teamCode = sameTeam[0].code;
                order.teamDescription = order.teamDescription || sameTeam[0].name;
            }
            const leader = sameTeam.find(t => t.leaderId === order.teamLeaderId);
            if (!order.teamLeaderName && leader) order.teamLeaderName = leader.leaderName;
        }

        const priorityByOrder = new Map<string, number>(savedPriorities.map(p => [p.order_id.toString(), p.position]));
        const byPriority = (a: DailyScheduleOrder, b: DailyScheduleOrder) => {
            const pa = priorityByOrder.get(a.id);
            const pb = priorityByOrder.get(b.id);
            if (pa != null && pb != null) return pa - pb;
            if (pa != null) return -1;
            if (pb != null) return 1;
            return byRequestedAt(a, b);
        };

        const columns: Record<string, DailyScheduleOrder[]> = {};
        teams.forEach(t => { columns[t.id] = []; });
        /** Coluna do item gravado (por equipe): a do líder da OS; senão, a 1ª da equipe. */
        const columnOf = (order: DailyScheduleOrder, teamId: string) =>
            ownScheduleColumnId({ teamId, teamLeaderId: order.teamLeaderId }, teams);

        if (readOnly) {
            // Dia passado: exatamente o que foi registrado (OSs podem já estar concluídas).
            const orderMap = new Map<string, DailyScheduleOrder>(raw.orders.map(o => [o.id, o]));
            // Histórico: equipe que recebeu OS no dia aparece mesmo sem líder hoje / desativada.
            const missingTeamIds = [...new Set<string>(savedItems.map(i => i.team_id.toString()))]
                .filter(id => !teams.some(t => t.teamId === id));
            if (missingTeamIds.length > 0) {
                const { data: oldTeams, error: oldTeamsError } = await supabase
                    .from('cfg_teams')
                    .select('id, code, description')
                    .in('id', missingTeamIds);
                if (oldTeamsError) throw oldTeamsError;
                for (const t of oldTeams || []) {
                    const teamId = t.id.toString();
                    const id = scheduleColumnId(teamId);
                    teams.push({ id, teamId, code: t.code, name: t.description, leaderId: '', leaderName: 'Sem líder atual' });
                    columns[id] = [];
                }
            }
            [...savedItems]
                .sort((a, b) => a.position - b.position)
                .forEach(item => {
                    const order = orderMap.get(item.order_id.toString());
                    const columnId = order && columnOf(order, item.team_id.toString());
                    if (!order || !columnId || !columns[columnId]) return;
                    columns[columnId].push(order);
                });
            const priorities = [...savedPriorities]
                .sort((a, b) => a.position - b.position)
                .map(p => orderMap.get(p.order_id.toString()))
                .filter((o): o is DailyScheduleOrder => !!o && o.statusId !== DAILY_SCHEDULE_STATUS.EVALUATION);
            return { supported, teams, priorities, openOrders: [], columns, updatedAt };
        }

        // OSs Em Avaliação ficam fora da programação (nem ABERTAS nem PRIORIDADE).
        const orders = raw.orders.filter(o => o.statusId !== DAILY_SCHEDULE_STATUS.EVALUATION);
        // OS em execução só aparece na coluna da equipe (fora de ABERTAS e de PRIORIDADE).
        const isExecution = (o: DailyScheduleOrder) => o.statusId === DAILY_SCHEDULE_STATUS.EXECUTION;
        const stripOrders = orders.filter(o => !isExecution(o));
        // Prioritárias = só as registradas (ou herdadas); o resto fica em ABERTAS.
        const priorities = stripOrders.filter(o => priorityByOrder.has(o.id)).sort(byPriority);
        const openOrders = stripOrders.filter(o => !priorityByOrder.has(o.id)).sort(byRequestedAt);

        // Colunas começam limpas no dia: só as OSs inseridas nelas (sequência salva do dia).
        // Fica de fora a OS que já não pode estar na coluna (equipe trocada, fora de 3/4/5/6):
        // a RPC de gravação recusaria a sequência inteira.
        const orderById = new Map<string, DailyScheduleOrder>(orders.map(o => [o.id, o]));
        const placeable = new Set<number>([
            DAILY_SCHEDULE_STATUS.AUTHORIZED,
            DAILY_SCHEDULE_STATUS.SCHEDULED,
            DAILY_SCHEDULE_STATUS.EXECUTION,
            DAILY_SCHEDULE_STATUS.SUSPENDED,
        ]);
        [...savedItems]
            .sort((a, b) => a.position - b.position)
            .forEach(item => {
                const order = orderById.get(item.order_id.toString());
                const teamKey = item.team_id.toString();
                if (!order || order.teamId !== teamKey || !placeable.has(order.statusId)) return;
                const columnId = columnOf(order, teamKey);
                if (!columnId || !columns[columnId]) return;
                columns[columnId].push(order);
            });

        // Em execução: sempre na coluna do próprio líder/equipe, mesmo sem ter sido inserida no dia
        // (exceção às colunas limpas). As que não estão na sequência salva entram no topo.
        const placed = new Set(Object.values(columns).flat().map(o => o.id));
        const missingByColumn = new Map<string, DailyScheduleOrder[]>();
        orders
            .filter(o => isExecution(o) && !placed.has(o.id))
            .sort(byRequestedAt)
            .forEach(o => {
                const columnId = ownScheduleColumnId(o, teams);
                if (columnId && columns[columnId]) missingByColumn.set(columnId, [...(missingByColumn.get(columnId) || []), o]);
            });
        for (const [columnId, missing] of missingByColumn) columns[columnId] = [...missing, ...columns[columnId]];

        return { supported, teams, priorities, openOrders, prioritiesInheritedFrom, columns, updatedAt };
    },

    /**
     * Meu Painel: OSs programadas no dia (padrão: hoje) para a equipe do usuário logado,
     * na sequência de execução. Sem a migration aplicada, devolve lista vazia.
     */
    async getMyDaySchedule(date?: string): Promise<MyDayScheduleItem[]> {
        const { data, error } = await supabase.rpc('fn_orders_daily_schedule_my_day', { p_date: date ?? null });
        if (error) {
            if (['42883', 'PGRST202'].includes((error as any).code) || isMissingRelation(error)) return [];
            throw error;
        }
        return ((data || []) as any[]).map(row => ({
            orderId: row.order_id.toString(),
            teamId: row.team_id.toString(),
            position: Number(row.position),
            scheduleDate: row.schedule_date,
        }));
    },

    /** Grava a programação completa do dia (RPC valida contrato, status, equipe e data). */
    async saveSchedule(contractId: string, date: string, items: DailyScheduleItemInput[]): Promise<void> {
        const { error } = await supabase.rpc('fn_orders_daily_schedule_save', {
            p_contract_id: Number(contractId),
            p_date: date,
            p_items: items.map(i => ({ order_id: Number(i.orderId), team_id: Number(i.teamId) })),
        });
        if (error) throw error;
    },

    /** Grava a prioridade do dia (ids na ordem, da mais para a menos prioritária). */
    async savePriorities(contractId: string, date: string, orderIds: string[]): Promise<void> {
        const { error } = await supabase.rpc('fn_orders_daily_priorities_save', {
            p_contract_id: Number(contractId),
            p_date: date,
            p_order_ids: orderIds.map(Number),
        });
        if (error) throw error;
    },

    /**
     * Registra uma movimentação (abertas → prioridade → equipes). Nunca lança: a
     * movimentação já aconteceu; sem a migration 20261126 o log só é pulado.
     */
    async logMove(log: DailyScheduleMoveLog): Promise<void> {
        const { error } = await supabase.rpc('fn_orders_daily_schedule_log', {
            p_contract_id: Number(log.contractId),
            p_date: log.date,
            p_order_id: Number(log.orderId),
            p_action: log.action,
            p_from_team_id: log.fromTeamId ? Number(log.fromTeamId) : null,
            p_to_team_id: log.toTeamId ? Number(log.toTeamId) : null,
            p_to_position: log.toPosition ?? null,
        });
        if (error && !isMissingRelation(error) && error.code !== 'PGRST202') {
            console.warn('[dailySchedule] log da movimentação falhou:', error);
        }
    },

    /** Avaliação → Autorizada para a equipe/líder da coluna. Falha se a OS já saiu de Avaliação. */
    async authorizeToTeam(orderId: string, team: DailyScheduleTeam, planId?: string): Promise<void> {
        await ordersService.authorizeOrder(orderId, team.teamId, planId, team.leaderId, DAILY_SCHEDULE_STATUS.EVALUATION);
    },

    /** Troca de equipe — só permitida enquanto a OS está Autorizada. */
    async moveAuthorizedToTeam(orderId: string, team: DailyScheduleTeam): Promise<void> {
        const { data, error } = await supabase
            .from('orders')
            .update({ team_id: Number(team.teamId), team_leader_id: Number(team.leaderId) })
            .eq('id', Number(orderId))
            .eq('status_id', DAILY_SCHEDULE_STATUS.AUTHORIZED)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error(ORDER_STATUS_CONFLICT);
    },
};
