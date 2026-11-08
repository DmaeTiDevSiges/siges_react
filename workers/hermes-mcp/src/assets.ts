import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MAX_ROWS, dayEnd, dayStart, formatBr, getSiges } from './siges.js';
import { isoDate, likeTerm, limitArg, safe } from './toolkit.js';

/**
 * Ferramentas de ATIVOS (somente leitura).
 * Fontes (security_invoker → RLS do usuário):
 *  - v_assets                  cadastro do ativo
 *  - v_orders_visits_assets    histórico de intervenções (etapa 5 = aprovadas, mesma regra de assetsService.getAssetHistory)
 *  - assets_alerts             alertas abertos (mesma consulta de assetsService.getAssetAlerts)
 *  - v_units_assets_tags       disponibilidade atual da posição (tag) do ativo na unidade
 */

const APPROVED_PROCESSING_ID = 5;

const ASSET_LIST_COLUMNS = 'id, code, description, type_description, tag_description, tag_sub_description, unit_code, unit_description, status_description, priority_description, brand, model, serial, power, power_unit';

/** Junta valor + unidade ("75 cv"), ignorando vazios. */
const withUnit = (v: unknown, u: unknown) => (v === null || v === undefined || v === '' ? undefined : `${v}${u ? ` ${u}` : ''}`);

function assetSummary(a: any) {
    return {
        codigo: a.code,
        ativo: a.description,
        tipo: a.type_description,
        posicao: [a.tag_description, a.tag_sub_description].filter(Boolean).join(' / '),
        unidade: [a.unit_code, a.unit_description].filter(Boolean).join(' - '),
        status: a.status_description,
        prioridade: a.priority_description,
        marca_modelo: [a.brand, a.model].filter(Boolean).join(' '),
        serie: a.serial,
        potencia: withUnit(a.power, a.power_unit),
    };
}

/** Busca por código exato OU todas as palavras no campo `searchable`; filtro opcional por unidade. */
function searchAssets(db: any, busca: string, unidade: string | undefined, limit: number, columns = ASSET_LIST_COLUMNS) {
    let query = db.from('v_assets').select(columns, { count: 'exact' });
    const terms = busca.trim().split(/\s+/).map(likeTerm).filter(Boolean);
    if (terms.length === 1) {
        query = query.or(`code.ilike.${terms[0]},searchable.ilike.%${terms[0]}%`);
    } else {
        for (const t of terms) query = query.ilike('searchable', `%${t}%`);
    }
    for (const t of (unidade ?? '').split(/\s+/).map(likeTerm).filter(Boolean)) {
        query = query.ilike('unit_description', `%${t}%`);
    }
    return query.order('description').limit(limit);
}

const unidadeArg = z.string().min(2).optional().describe('Filtra pelo nome da unidade onde o ativo está');

/**
 * Localiza UM ativo: código exato primeiro; senão, busca textual que precisa achar
 * um único resultado. Se achar vários, devolve `notFound` com as opções para o usuário escolher.
 */
async function resolveAsset(db: any, busca: string, unidade?: string): Promise<{ asset?: any; notFound?: unknown }> {
    const code = likeTerm(busca);
    if (code && !/\s/.test(code)) {
        const { data, error } = await db.from('v_assets').select('*').ilike('code', code).limit(2);
        if (error) throw error;
        if (data?.length === 1) return { asset: data[0] };
    }
    const { data, error } = await searchAssets(db, busca, unidade, 6, '*');
    if (error) throw error;
    if (!data?.length) return { notFound: { encontrado: false, busca } };
    if (data.length > 1) {
        return {
            notFound: {
                encontrado: false,
                ambiguo: true,
                mensagem: 'Mais de um ativo corresponde à busca. Pergunte ao usuário qual deles (pelo código).',
                opcoes: data.map(assetSummary),
            },
        };
    }
    return { asset: data[0] };
}

export function registerAssetTools(server: McpServer): void {
    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ativos',
        {
            title: 'Buscar ativos',
            description: 'Use para LISTAR/PROCURAR ativos (equipamentos: bombas, motores, painéis...) por código, descrição, marca, modelo ou série, opcionalmente numa unidade. Devolve posição, unidade, status e dados principais.',
            inputSchema: {
                busca: z.string().min(2).describe('Ex.: "bomba 75cv", "WEG", "MOT-0123"'),
                unidade: unidadeArg,
                limite: limitArg,
            },
        },
        safe(async ({ busca, unidade, limite = 10 }) => {
            const { db } = await getSiges();
            const { data, error, count } = await searchAssets(db, busca, unidade, limite);
            if (error) throw error;
            const total = count ?? data?.length ?? 0;
            return {
                busca,
                total_encontrado: total,
                aviso: total > limite ? `Há ${total} ativos; só ${limite} foram listados. Sugira refinar a busca.` : undefined,
                ativos: (data ?? []).map(assetSummary),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ativo',
        {
            title: 'Situação de um ativo',
            description: 'USE ESTA para qualquer pergunta sobre um ativo/equipamento específico (ex.: "como está a bomba MOT-0123", "histórico do motor X", "esse equipamento tem alerta?"). Traz ficha técnica, disponibilidade atual, alertas abertos e as últimas intervenções aprovadas. Se a busca achar vários ativos, devolve a lista para o usuário escolher.',
            inputSchema: {
                busca: z.string().min(2).describe('Código do ativo (preferível) ou descrição'),
                unidade: unidadeArg,
                historico: z.number().int().min(1).max(30).optional().describe('Quantas intervenções recentes trazer (padrão 10)'),
            },
        },
        safe(async ({ busca, unidade, historico = 10 }) => {
            const { db } = await getSiges();
            const resolved = await resolveAsset(db, busca, unidade);
            if (!resolved.asset) return resolved.notFound;
            const asset = resolved.asset;

            const [alerts, history, availability] = await Promise.all([
                db.from('assets_alerts')
                    .select('description, created_at, cfg_orders_types!assets_alerts_o_type_id_fkey ( description ), cfg_orders_priorities!assets_alerts_priority_id_fkey ( description ), orders!left ( order_mask )')
                    .eq('asset_id', asset.id)
                    .eq('is_deleted', false)
                    .eq('is_done', false)
                    .order('created_at', { ascending: false })
                    .limit(MAX_ROWS),
                db.from('v_orders_visits_assets')
                    // '*' de propósito: o banco vivo diverge das migrations (ex.: order_mask ausente);
                    // o mapeamento abaixo usa só as colunas que vierem.
                    .select('*', { count: 'exact' })
                    .eq('asset_id', asset.id)
                    .eq('processing_id', APPROVED_PROCESSING_ID)
                    .order('ov_ended_at', { ascending: false })
                    .limit(historico),
                asset.unit_asset_tag_id
                    ? db.from('v_units_assets_tags')
                        .select('last_is_available, last_status_description, last_asset_unavailable_reason_description, last_comments, last_created_at, last_reported_user_name_short, last_created_user_name_short')
                        .eq('id', asset.unit_asset_tag_id)
                        .maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
            ]);
            for (const r of [alerts, history, availability] as any[]) if (r.error) throw r.error;

            // Número da OS: buscado em v_orders pelo o_id (a view do histórico nem sempre tem order_mask).
            const histRows: any[] = history.data ?? [];
            const orderIds = [...new Set(histRows.map(h => h.o_id).filter(Boolean))];
            const orderMasks = new Map<string, any>();
            if (orderIds.length) {
                const { data: ords, error: oErr } = await db.from('v_orders').select('id, order_mask, type_description').in('id', orderIds);
                if (oErr) throw oErr;
                for (const o of ords ?? []) orderMasks.set(String(o.id), o);
            }

            const a = asset;
            const av: any = availability.data;
            return {
                encontrado: true,
                ...assetSummary(a),
                cliente: a.client_name,
                proprietario: a.company_owner_description,
                ficha_tecnica: {
                    tensao: withUnit(a.voltage, a.voltage_unit),
                    corrente: withUnit(a.amperage, a.amperage_unit),
                    polos: withUnit(a.poles, a.poles_unit),
                    rotacao: withUnit(a.rotation, a.rotation_unit),
                    fator_servico: a.service_factor,
                    vazao_operacao: withUnit(a.flow_rate_operation, a.flow_rate_unit),
                    vazao_min_max: a.flow_rate_min != null || a.flow_rate_max != null ? `${a.flow_rate_min ?? '?'} – ${a.flow_rate_max ?? '?'} ${a.flow_rate_unit ?? ''}`.trim() : undefined,
                    pressao_operacao: withUnit(a.pressure_operation, a.pressure_unit),
                    pressao_min_max: a.pressure_min != null || a.pressure_max != null ? `${a.pressure_min ?? '?'} – ${a.pressure_max ?? '?'} ${a.pressure_unit ?? ''}`.trim() : undefined,
                    diametro_rotor: withUnit(a.rotor_diameter, a.rotor_diameter_unit),
                    peso: withUnit(a.weight, a.weight_unit),
                    acoplamento: a.coupling_model_description,
                    material_vinculado: a.material_code ? `${a.material_code} ${a.material_description ?? ''}`.trim() : undefined,
                    aquisicao: formatBr(a.acquisition_at),
                    valor_aquisicao: a.acquisition_value,
                },
                observacoes: a.comments,
                status_desde: formatBr(a.status_at),
                disponibilidade_atual: av ? {
                    disponivel: av.last_is_available,
                    status: av.last_status_description,
                    motivo_indisponibilidade: av.last_asset_unavailable_reason_description,
                    observacao: av.last_comments,
                    ultimo_registro: formatBr(av.last_created_at),
                    registrado_por: av.last_reported_user_name_short || av.last_created_user_name_short,
                } : 'sem registro de disponibilidade para a posição deste ativo',
                alertas_abertos: (alerts.data ?? []).map((al: any) => ({
                    alerta: al.description,
                    tipo: al.cfg_orders_types?.description,
                    prioridade: al.cfg_orders_priorities?.description,
                    ordem_vinculada: al.orders?.order_mask,
                    criado_em: formatBr(al.created_at),
                })),
                intervencoes: {
                    total_aprovadas: history.count ?? history.data?.length ?? 0,
                    exibindo: history.data?.length ?? 0,
                    recentes: histRows.map((h: any) => ({
                        data: formatBr(h.ov_ended_at),
                        tipo: h.o_type_description ?? orderMasks.get(String(h.o_id))?.type_description ?? h.o_type_code,
                        ordem: h.order_mask ?? orderMasks.get(String(h.o_id))?.order_mask,
                        visita: h.ov_mask,
                        atividades: h.activities_description ?? h.moved_comments ?? h.description,
                        status_apos: h.after_status_description,
                        observacao: h.after_comments,
                        movido_para: h.is_moved ? h.after_unit_description : undefined,
                        lider: h.o_team_leader_name_short ?? h.ov_team_leader_name_short,
                        valor: h.total_value ?? h.ova_total_value,
                    })),
                },
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ativo_atividades',
        {
            title: 'Atividades realizadas em um ativo',
            description: 'USE ESTA para "quais atividades/serviços foram feitos no ativo X", "quando foi a última troca de rolamento da bomba Y", "quantas vezes limparam o motor Z". Lista as atividades registradas em visitas APROVADAS do ativo (mesma regra da tela do ativo), com resumo por atividade (quantas vezes, última data) e a lista cronológica. Filtros opcionais: período e texto da atividade.',
            inputSchema: {
                busca: z.string().min(2).describe('Código do ativo (preferível) ou descrição'),
                unidade: unidadeArg,
                atividade: z.string().min(2).optional().describe('Filtra pelo texto da atividade, ex.: "rolamento", "limpeza"'),
                data_inicio: isoDate.optional().describe('AAAA-MM-DD (data da visita)'),
                data_fim: isoDate.optional().describe('AAAA-MM-DD (data da visita)'),
                limite: limitArg,
            },
        },
        safe(async ({ busca, unidade, atividade, data_inicio, data_fim, limite = 30 }) => {
            const { db } = await getSiges();
            const resolved = await resolveAsset(db, busca, unidade);
            if (!resolved.asset) return resolved.notFound;
            const asset = resolved.asset;

            // 1. Passagens do ativo pelas visitas ('*': o banco vivo diverge das migrations).
            let ovaQuery = db.from('v_orders_visits_assets').select('*').eq('asset_id', asset.id).limit(1000);
            if (data_inicio) ovaQuery = ovaQuery.gte('ov_started_at', dayStart(data_inicio));
            if (data_fim) ovaQuery = ovaQuery.lte('ov_started_at', dayEnd(data_fim));
            const { data: ovaRows, error: ovaErr } = await ovaQuery;
            if (ovaErr) throw ovaErr;

            // 2. Só visitas aprovadas (orders_visits.ov_processing_id = 5, como em assetsService.getApprovedAssetActivities).
            const ovIds = [...new Set((ovaRows ?? []).map((r: any) => r.ov_id).filter(Boolean))];
            let approved = new Set<string>();
            if (ovIds.length) {
                const { data: visits, error: vErr } = await db.from('orders_visits').select('id').in('id', ovIds).eq('ov_processing_id', APPROVED_PROCESSING_ID);
                if (vErr) throw vErr;
                approved = new Set((visits ?? []).map((v: any) => String(v.id)));
            }
            const rows = (ovaRows ?? []).filter((r: any) => approved.has(String(r.ov_id)));
            const base = { codigo: asset.code, ativo: asset.description, unidade_atual: asset.unit_description };
            if (!rows.length) return { ...base, total_registros: 0, mensagem: 'Nenhuma atividade em visitas aprovadas para este ativo no período.' };

            // 3. Atividades registradas nessas passagens.
            const rowById = new Map(rows.map((r: any) => [String(r.id), r]));
            const ids = [...rowById.keys()];
            const acts: any[] = [];
            for (let i = 0; i < ids.length; i += 200) {
                const { data, error } = await db.from('v_orders_visits_assets_activities').select('*').in('ova_id', ids.slice(i, i + 200));
                if (error) throw error;
                acts.push(...(data ?? []));
            }

            // 4. Número da OS (v_orders pelo o_id).
            const orderIds = [...new Set(rows.map((r: any) => r.o_id).filter(Boolean))];
            const orders = new Map<string, any>();
            if (orderIds.length) {
                const { data, error } = await db.from('v_orders').select('id, order_mask, type_description').in('id', orderIds);
                if (error) throw error;
                for (const o of data ?? []) orders.set(String(o.id), o);
            }

            const terms = (atividade ?? '').toLowerCase().split(/\s+/).filter(Boolean);
            const entries = acts
                .map((a: any) => {
                    const r: any = rowById.get(String(a.ova_id));
                    const when = r?.ov_started_at || r?.ov_ended_at || null;
                    return {
                        when,
                        data: formatBr(when),
                        atividade: a.description || 'Atividade não identificada',
                        quantidade: a.amount,
                        ordem: r?.order_mask ?? orders.get(String(r?.o_id))?.order_mask,
                        tipo: orders.get(String(r?.o_id))?.type_description,
                        visita: r?.ov_mask,
                        unidade: r?.before_unit_description,
                        posicao: [r?.before_tag_description, r?.before_tag_sub_description].filter(Boolean).join(' / '),
                    };
                })
                .filter(e => terms.every(t => e.atividade.toLowerCase().includes(t)))
                .sort((x, y) => String(y.when ?? '').localeCompare(String(x.when ?? '')));

            // Resumo por atividade: quantas vezes e quando foi a última.
            const summary = new Map<string, { vezes: number; quantidade_total: number; ultima: string | null }>();
            for (const e of entries) {
                const s = summary.get(e.atividade) ?? { vezes: 0, quantidade_total: 0, ultima: null };
                s.vezes += 1;
                s.quantidade_total += Number(e.quantidade) || 0;
                if (!s.ultima) s.ultima = e.data; // entries já estão do mais recente para o mais antigo
                summary.set(e.atividade, s);
            }

            return {
                ...base,
                periodo: data_inicio || data_fim ? { inicio: data_inicio ?? 'início', fim: data_fim ?? 'hoje' } : 'todo o histórico',
                filtro_atividade: atividade,
                total_registros: entries.length,
                visitas_aprovadas: approved.size,
                resumo_por_atividade: [...summary.entries()]
                    .sort((a, b) => b[1].vezes - a[1].vezes)
                    .map(([nome, s]) => ({ atividade: nome, vezes: s.vezes, quantidade_total: s.quantidade_total || undefined, ultima_vez: s.ultima })),
                aviso: entries.length > limite ? `Há ${entries.length} registros; listados os ${limite} mais recentes (o resumo considera todos).` : undefined,
                registros_recentes: entries.slice(0, limite).map(({ when: _w, ...e }) => e),
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_ativos_indisponiveis',
        {
            title: 'Ativos indisponíveis',
            description: 'Lista as posições de ativos que estão INDISPONÍVEIS agora (último registro de disponibilidade), com motivo, desde quando e quem registrou. Filtro opcional por unidade. Use para "o que está parado?", "quais bombas estão fora?".',
            inputSchema: {
                unidade: unidadeArg,
                limite: limitArg,
            },
        },
        safe(async ({ unidade, limite = 20 }) => {
            const { db } = await getSiges();
            let query = db
                .from('v_units_assets_tags')
                .select('unit_code, unit_description, tag_description, tag_sub_description, asset_tag_tag_sub_description, last_status_description, last_asset_unavailable_reason_description, last_comments, last_created_at, last_reported_user_name_short, last_created_user_name_short', { count: 'exact' })
                .eq('is_deleted', false)
                .eq('last_is_available', false)
                .order('last_created_at', { ascending: true })
                .limit(limite);
            for (const t of (unidade ?? '').split(/\s+/).map(likeTerm).filter(Boolean)) {
                query = query.ilike('unit_description', `%${t}%`);
            }
            const { data, error, count } = await query;
            if (error) throw error;
            const total = count ?? data?.length ?? 0;
            return {
                filtro_unidade: unidade,
                total_indisponiveis: total,
                aviso: total > limite ? `Há ${total} posições indisponíveis; listadas as ${limite} mais antigas.` : undefined,
                ordem: 'mais antigas primeiro (paradas há mais tempo)',
                itens: (data ?? []).map((r: any) => ({
                    unidade: [r.unit_code, r.unit_description].filter(Boolean).join(' - '),
                    posicao: r.asset_tag_tag_sub_description || [r.tag_description, r.tag_sub_description].filter(Boolean).join(' '),
                    status: r.last_status_description,
                    motivo: r.last_asset_unavailable_reason_description,
                    observacao: r.last_comments,
                    desde: formatBr(r.last_created_at),
                    registrado_por: r.last_reported_user_name_short || r.last_created_user_name_short,
                })),
            };
        }),
    );
}
