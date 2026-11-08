import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MAX_ROWS, formatBr, getSiges } from './siges.js';
import { likeTerm, limitArg, safe } from './toolkit.js';

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
            const code = likeTerm(busca);

            // Código exato primeiro; senão, só segue se a busca achar um único ativo.
            let asset: any = null;
            if (code && !/\s/.test(code)) {
                const { data, error } = await db.from('v_assets').select('*').ilike('code', code).limit(2);
                if (error) throw error;
                if (data?.length === 1) asset = data[0];
            }
            if (!asset) {
                const { data, error } = await searchAssets(db, busca, unidade, 6, '*');
                if (error) throw error;
                if (!data?.length) return { encontrado: false, busca };
                if (data.length > 1) {
                    return {
                        encontrado: false,
                        ambiguo: true,
                        mensagem: 'Mais de um ativo corresponde à busca. Pergunte ao usuário qual deles (pelo código).',
                        opcoes: data.map(assetSummary),
                    };
                }
                asset = data[0];
            }

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
