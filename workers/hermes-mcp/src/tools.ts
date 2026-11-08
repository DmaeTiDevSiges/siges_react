import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MAX_ROWS, dayEnd, dayStart, defaultOnlyMine, formatBr, getSiges, todayInBrazil } from './siges.js';
import { isoDate, likeTerm, limitArg, safe, scopeLabel } from './toolkit.js';
import { registerUnitTools } from './units.js';

/**
 * Ferramentas SOMENTE LEITURA do SIGES para o Hermes.
 * Regra: nenhuma ferramenta aqui faz insert/update/delete. Escritas (abrir SS,
 * fechar visita, anexar foto) ficam para uma fase 2, com confirmação explícita.
 */

// Códigos de status usados no app (ver services/orders/visitsService.ts e ordersService.scheduleOrder)
const OV_STATUS = { em_andamento: 1, encerrada: 2 } as const;
const ORDER_STATUS_AGENDADA = 4;

const unidadeArg = z.string().min(2).optional()
    .describe('Filtra pelo nome da unidade (todas as palavras precisam aparecer)');

export function registerTools(server: McpServer): void {
    registerUnitTools(server);

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_quem_sou_eu',
        {
            title: 'Perfil SIGES vinculado',
            description: 'Mostra qual usuário do SIGES este assistente representa (nome, equipe, empresa, se é líder/admin). Use para saber o escopo das consultas.',
            inputSchema: {},
        },
        safe(async () => {
            const { db, me } = await getSiges();
            let team: string | null = null;
            if (me.teamId) {
                const { data } = await db.from('cfg_teams').select('code, description').eq('id', me.teamId).maybeSingle();
                team = data ? `${data.code ?? ''} ${data.description ?? ''}`.trim() : null;
            }
            return { ...me, team, hoje: todayInBrazil() };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_visitas',
        {
            title: 'Visitas técnicas',
            description: 'Lista visitas técnicas iniciadas no período (por data de início, horário de São Paulo). Por padrão só as visitas de que o usuário participa (como líder ou membro da equipe).',
            inputSchema: {
                data_inicio: isoDate.optional().describe('AAAA-MM-DD; padrão: hoje'),
                data_fim: isoDate.optional().describe('AAAA-MM-DD; padrão: igual a data_inicio'),
                status: z.enum(['em_andamento', 'encerrada', 'todas']).optional().describe('padrão: todas'),
                apenas_minhas: z.boolean().optional().describe('true = só as do usuário; false = todas visíveis. Se omitido: true para técnico/líder de campo, false para gestor/admin. Use false quando o usuário perguntar de forma geral ("visitas de hoje").'),
                unidade: unidadeArg,
                limite: limitArg,
            },
        },
        safe(async ({ data_inicio, data_fim, status = 'todas', apenas_minhas, unidade, limite = 20 }) => {
            const { db, me } = await getSiges();
            const onlyMine = apenas_minhas ?? defaultOnlyMine(me);
            const start = data_inicio ?? todayInBrazil();
            const end = data_fim ?? start;

            let query = db
                .from('v_orders_visits')
                .select('id, ov_mask, o_mask, o_unit_description, o_requested_services, o_type_description, o_plan_description, o_asset_tag_description, ov_status_id, ov_status_description, ov_processing_description, ov_started_at, ov_ended_at, ov_team_leader_id, ov_team_leader_name_short, ov_team_names_short, ov_o_progress, ov_comments', { count: 'exact' })
                .gte('ov_started_at', dayStart(start))
                .lte('ov_started_at', dayEnd(end))
                .eq('is_canceled', false)
                .order('ov_started_at', { ascending: false })
                .limit(onlyMine ? MAX_ROWS * 4 : limite);
            if (status !== 'todas') query = query.eq('ov_status_id', OV_STATUS[status]);
            for (const t of (unidade ?? '').split(/\s+/).map(likeTerm).filter(Boolean)) {
                query = query.ilike('o_unit_description', `%${t}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;
            let rows = data ?? [];

            if (onlyMine && rows.length) {
                const { data: teams, error: teamErr } = await db
                    .from('orders_visits_teams')
                    .select('ov_id')
                    .eq('user_id', me.id)
                    .in('ov_id', rows.map(r => r.id));
                if (teamErr) throw teamErr;
                const mine = new Set((teams ?? []).map(t => Number(t.ov_id)));
                rows = rows.filter(r => Number(r.ov_team_leader_id) === me.id || mine.has(Number(r.id)));
            }

            const total = onlyMine ? rows.length : (count ?? rows.length);
            return {
                periodo: { inicio: start, fim: end },
                escopo: scopeLabel(onlyMine),
                total_encontrado: total,
                exibindo: Math.min(rows.length, limite),
                aviso: total > limite ? `Há ${total} visitas; só ${limite} foram listadas. Informe o total ao usuário.` : undefined,
                visitas: rows.slice(0, limite).map(r => ({
                    visita: r.ov_mask,
                    ordem: r.o_mask,
                    unidade: r.o_unit_description,
                    servico_solicitado: r.o_requested_services,
                    tipo: r.o_type_description,
                    plano: r.o_plan_description,
                    ativo: r.o_asset_tag_description,
                    status: r.ov_status_description,
                    etapa: r.ov_processing_description,
                    inicio: formatBr(r.ov_started_at),
                    fim: formatBr(r.ov_ended_at),
                    lider: r.ov_team_leader_name_short,
                    equipe: r.ov_team_names_short,
                    progresso_ordem: r.ov_o_progress,
                    observacoes: r.ov_comments,
                })),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ordens_agendadas',
        {
            title: 'Ordens de serviço agendadas',
            description: 'Lista ordens de serviço com status "agendada" cuja data de agendamento cai no período. Por padrão só as da equipe do usuário ou em que ele é líder.',
            inputSchema: {
                data_inicio: isoDate.optional().describe('AAAA-MM-DD; padrão: hoje'),
                data_fim: isoDate.optional().describe('AAAA-MM-DD; padrão: hoje + 7 dias'),
                apenas_minhas: z.boolean().optional().describe('true = só da equipe/liderança do usuário; false = todas visíveis. Se omitido: true para técnico/líder de campo, false para gestor/admin.'),
                unidade: unidadeArg,
                limite: limitArg,
            },
        },
        safe(async ({ data_inicio, data_fim, apenas_minhas, unidade, limite = 20 }) => {
            const { db, me } = await getSiges();
            const onlyMine = apenas_minhas ?? defaultOnlyMine(me);
            const start = data_inicio ?? todayInBrazil();
            const end = data_fim ?? todayInBrazil(7);

            let query = db
                .from('v_orders')
                .select('id, order_mask, unit_description, unit_address, requested_services, type_description, priority_description, plan_description, asset_tag_description, status_at, team_code, team_leader_name_short, requester_name, requester_phone', { count: 'exact' })
                .eq('status_id', ORDER_STATUS_AGENDADA)
                .gte('status_at', dayStart(start))
                .lte('status_at', dayEnd(end))
                .order('status_at', { ascending: true })
                .limit(limite);

            if (onlyMine) {
                const ors = [`team_leader_id.eq.${me.id}`];
                if (me.teamId) ors.push(`team_id.eq.${me.teamId}`);
                query = query.or(ors.join(','));
            }
            for (const t of (unidade ?? '').split(/\s+/).map(likeTerm).filter(Boolean)) {
                query = query.ilike('unit_description', `%${t}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;
            const total = count ?? data?.length ?? 0;

            return {
                periodo: { inicio: start, fim: end },
                escopo: scopeLabel(onlyMine),
                total_encontrado: total,
                exibindo: data?.length ?? 0,
                aviso: total > limite ? `Há ${total} ordens; só ${limite} foram listadas. Informe o total ao usuário.` : undefined,
                ordens: (data ?? []).map(o => ({
                    ordem: o.order_mask,
                    agendada_para: formatBr(o.status_at),
                    unidade: o.unit_description,
                    endereco: o.unit_address,
                    servico_solicitado: o.requested_services,
                    tipo: o.type_description,
                    prioridade: o.priority_description,
                    plano: o.plan_description,
                    ativo: o.asset_tag_description,
                    equipe: o.team_code,
                    lider: o.team_leader_name_short,
                    solicitante: o.requester_name,
                    telefone_solicitante: o.requester_phone,
                })),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ordem',
        {
            title: 'Detalhe de uma ordem',
            description: 'Busca uma ordem/solicitação pelo número (máscara, ex.: "OS-2026-00123") e devolve dados principais e as visitas dela.',
            inputSchema: {
                numero: z.string().min(3).describe('Número/máscara da ordem exatamente como aparece no SIGES'),
            },
        },
        safe(async ({ numero }) => {
            const { db } = await getSiges();
            const { data: order, error } = await db
                .from('v_orders')
                .select('id, order_mask, status_description, status_at, requested_at, requested_services, requester_name, requester_phone, unit_description, unit_address, type_description, type_sub_description, priority_description, plan_description, asset_tag_description, team_code, team_leader_name_short, cause_reason_description, suspended_reason_description, cancel_reason_description, progress, total_value')
                .ilike('order_mask', numero.trim())
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            if (!order) return { encontrada: false, numero };

            const { data: visits, error: vErr } = await db
                .from('v_orders_visits')
                .select('ov_mask, ov_status_description, ov_processing_description, ov_started_at, ov_ended_at, ov_team_leader_name_short, ov_comments')
                .eq('o_id', order.id)
                .eq('is_canceled', false)
                .order('ov_started_at', { ascending: false })
                .limit(MAX_ROWS);
            if (vErr) throw vErr;

            return {
                encontrada: true,
                ordem: order.order_mask,
                status: order.status_description,
                data_status: formatBr(order.status_at),
                solicitada_em: formatBr(order.requested_at),
                servico_solicitado: order.requested_services,
                solicitante: order.requester_name,
                telefone_solicitante: order.requester_phone,
                unidade: order.unit_description,
                endereco: order.unit_address,
                tipo: [order.type_description, order.type_sub_description].filter(Boolean).join(' / '),
                prioridade: order.priority_description,
                plano: order.plan_description,
                ativo: order.asset_tag_description,
                equipe: order.team_code,
                lider: order.team_leader_name_short,
                causa: order.cause_reason_description,
                motivo_suspensao: order.suspended_reason_description,
                motivo_cancelamento: order.cancel_reason_description,
                progresso: order.progress,
                valor_total: order.total_value,
                visitas: (visits ?? []).map(v => ({
                    visita: v.ov_mask,
                    status: v.ov_status_description,
                    etapa: v.ov_processing_description,
                    inicio: formatBr(v.ov_started_at),
                    fim: formatBr(v.ov_ended_at),
                    lider: v.ov_team_leader_name_short,
                    observacoes: v.ov_comments,
                })),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_estoque',
        {
            title: 'Consultar estoque de material',
            description: 'Procura materiais por código ou descrição (todas as palavras precisam aparecer) e mostra o saldo em cada almoxarifado, com estoque mínimo.',
            inputSchema: {
                busca: z.string().min(2).describe('Ex.: "rolamento 6205", "cabo 2,5mm"'),
                limite: limitArg,
            },
        },
        safe(async ({ busca, limite = 10 }) => {
            const { db, me } = await getSiges();
            // Mesmo escopo de materialsService.getMaterials: materiais da empresa prestadora do usuário.
            let query = db
                .from('v_materials')
                .select('id, code, description, unit, balance')
                .eq('is_deleted', false)
                .order('description')
                .limit(limite);
            if (me.companyId) query = query.eq('provider_company_id', me.companyId);
            for (const term of busca.trim().split(/\s+/).map(likeTerm).filter(Boolean)) {
                query = query.ilike('searchable', `%${term}%`);
            }

            const { data: materials, error } = await query;
            if (error) throw error;
            if (!materials?.length) return { busca, encontrados: 0, materiais: [] };

            const { data: stock, error: sErr } = await db
                .from('warehouses_materials')
                .select('material_id, quantity, min_stock, warehouses(description, is_deleted, is_available)')
                .in('material_id', materials.map(m => m.id));
            if (sErr) throw sErr;

            return {
                busca,
                encontrados: materials.length,
                materiais: materials.map(m => ({
                    codigo: m.code,
                    descricao: m.description,
                    unidade: m.unit,
                    saldo_total: m.balance ?? 0,
                    almoxarifados: (stock ?? [])
                        .filter((s: any) => s.material_id === m.id && s.warehouses && !s.warehouses.is_deleted && s.warehouses.is_available !== false)
                        .map((s: any) => ({
                            almoxarifado: s.warehouses.description,
                            quantidade: s.quantity ?? 0,
                            estoque_minimo: s.min_stock ?? 0,
                            abaixo_do_minimo: (s.min_stock ?? 0) > 0 && (s.quantity ?? 0) <= s.min_stock,
                        })),
                })),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_estoque_abaixo_minimo',
        {
            title: 'Materiais abaixo do estoque mínimo',
            description: 'Lista materiais com quantidade menor ou igual ao estoque mínimo, ordenados pelo valor do déficit (mínimo − saldo × custo médio).',
            inputSchema: { limite: limitArg },
        },
        safe(async ({ limite = 20 }) => {
            const { db } = await getSiges();
            // Mesma regra de materialsService.getMaterialsBelowMinStock.
            const { data, error } = await db
                .from('warehouses_materials')
                .select('quantity, min_stock, cost_avg, materials(code, description, unit, is_deleted), warehouses(description, is_deleted)')
                .gt('min_stock', 0);
            if (error) throw error;

            const rows = (data ?? [])
                .filter((r: any) => !r.materials?.is_deleted && !r.warehouses?.is_deleted && (r.quantity ?? 0) <= r.min_stock)
                .map((r: any) => {
                    const deficit = r.min_stock - (r.quantity ?? 0);
                    return {
                        codigo: r.materials?.code,
                        descricao: r.materials?.description,
                        unidade: r.materials?.unit,
                        almoxarifado: r.warehouses?.description,
                        quantidade: r.quantity ?? 0,
                        estoque_minimo: r.min_stock,
                        deficit,
                        valor_deficit: Math.round(deficit * (r.cost_avg ?? 0) * 100) / 100,
                    };
                })
                .sort((a, b) => b.valor_deficit - a.valor_deficit);

            return {
                total_itens: rows.length,
                valor_total_deficit: Math.round(rows.reduce((s, r) => s + r.valor_deficit, 0) * 100) / 100,
                itens: rows.slice(0, limite),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_resumo_visitas',
        {
            title: 'Resumo gerencial de visitas',
            description: 'Totais de visitas do período (quantidade e valor), por etapa, por unidade e por plano, e a tendência diária. Mesmo cálculo do painel Gestão > Visitas. Respeita a visibilidade do usuário.',
            inputSchema: {
                data_inicio: isoDate.optional().describe('AAAA-MM-DD; padrão: 1º dia do mês atual'),
                data_fim: isoDate.optional().describe('AAAA-MM-DD; padrão: último dia do mês atual'),
                busca: z.string().optional().describe('Filtra por nº da visita/ordem, unidade, cliente ou líder'),
            },
        },
        safe(async ({ data_inicio, data_fim, busca }) => {
            const { db } = await getSiges();
            const { data, error } = await db.rpc('fn_orders_visits_dashboard_summary', {
                p_filters: {},
                p_start: data_inicio ?? null,
                p_end: data_fim ?? null,
                p_search: busca || null,
                p_selection: [],
                p_is_all: true,
            });
            if (error) throw error;
            const s = (data ?? {}) as any;

            // As etapas vêm indexadas pelo id de cfg_orders_visits_processing — traduz para o nome.
            const { data: stagesCfg } = await db.from('cfg_orders_visits_processing').select('id, description');
            const stageName = new Map((stagesCfg ?? []).map((r: any) => [String(r.id), r.description]));
            const money = (v: unknown) => Math.round(Number(v ?? 0) * 100) / 100;
            const top = (list: any, n = 10) => (Array.isArray(list) ? list : [])
                .slice()
                .sort((a: any, b: any) => Number(b.value ?? 0) - Number(a.value ?? 0))
                .slice(0, n)
                .map((r: any) => ({ nome: r.label, valor: money(r.value) }));

            return {
                periodo: {
                    inicio: data_inicio ?? 'primeiro dia do mês atual',
                    fim: data_fim ?? 'último dia do mês atual',
                    criterio: 'data de início da visita (ou data da solicitação, se a visita não iniciou)',
                },
                filtro_busca: busca,
                total_visitas: s.all?.count ?? 0,
                valor_total: money(s.all?.total),
                por_etapa: Object.entries(s.stages ?? {}).map(([id, v]: [string, any]) => ({
                    etapa: stageName.get(id) ?? `etapa ${id}`,
                    visitas: v?.count ?? 0,
                    valor: money(v?.total),
                })),
                custos_pendentes_aprovacao: { visitas: s.costsPending?.count ?? 0, valor: money(s.costsPending?.total) },
                custos_rejeitados: { visitas: s.costsRejected?.count ?? 0, valor: money(s.costsRejected?.total) },
                top_unidades_por_valor: top(s.units),
                top_planos_por_valor: top(s.composition),
                visitas_por_dia_recentes: (Array.isArray(s.trend) ? s.trend : []).map((t: any) => ({ dia: t.day, visitas: t.count })),
                observacao: 'Valores em R$. Na etapa de custos, o valor considera só custos aprovados (mesma regra do painel).',
            };
        }),
    );
}
