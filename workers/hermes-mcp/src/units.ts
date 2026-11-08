import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MAX_ROWS, dayStart, formatBr, getSiges, todayInBrazil } from './siges.js';
import { likeTerm, limitArg, safe } from './toolkit.js';

/**
 * Ferramentas de UNIDADES (somente leitura).
 * Fontes: v_units, v_orders, v_orders_visits, v_units_assets_tags — todas
 * security_invoker, então o RLS do usuário vinculado decide o que aparece.
 */

// Mesmos status de "ordem aberta" de ordersService.getOpenOrdersByUnit.
const OPEN_ORDER_STATUSES = [2, 3, 4, 5];

const UNIT_COLUMNS = 'id, code, description, description_full, address_full, latitude, longitude, installation_code_power_supply, status_description, unit_type_parent_description, unit_type_child_description, system_parent_description, system_child_description, client_name';

const mapsLink = (lat?: number | null, lng?: number | null) =>
    lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : null;

function unitSummary(u: any) {
    return {
        codigo: u.code,
        unidade: u.description_full || u.description,
        endereco: u.address_full,
        tipo: [u.unit_type_parent_description, u.unit_type_child_description].filter(Boolean).join(' / '),
        sistema: [u.system_parent_description, u.system_child_description].filter(Boolean).join(' / '),
        cliente: u.client_name,
        status: u.status_description,
        instalacao_energia: u.installation_code_power_supply,
        mapa: mapsLink(u.latitude, u.longitude),
    };
}

/** Unidade cujo código é exatamente o texto buscado (sem diferenciar maiúsculas), ou null. */
async function findByExactCode(db: any, busca: string): Promise<any | null> {
    const code = likeTerm(busca);
    if (!code || /\s/.test(code)) return null;
    const { data, error } = await db.from('v_units').select(UNIT_COLUMNS)
        .eq('is_deleted', false).ilike('code', code).limit(2);
    if (error) throw error;
    return data?.length === 1 ? data[0] : null;
}

/** Aplica busca por código exato OU todas as palavras na descrição completa. */
function searchUnits(db: any, busca: string, limit: number) {
    const text = busca.trim();
    let query = db.from('v_units').select(UNIT_COLUMNS).eq('is_deleted', false);
    const terms = text.split(/\s+/).map(likeTerm).filter(Boolean);
    // Uma palavra só pode ser o código da unidade.
    if (terms.length === 1) {
        query = query.or(`code.ilike.${terms[0]},description_full.ilike.%${terms[0]}%`);
    } else {
        for (const t of terms) query = query.ilike('description_full', `%${t}%`);
    }
    return query.order('description_full').limit(limit);
}

export function registerUnitTools(server: McpServer): void {
    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_unidades',
        {
            title: 'Buscar unidades',
            description: 'Procura unidades (locais atendidos) pelo código ou por palavras do nome/endereço. Devolve endereço, tipo, sistema, cliente, status e link do mapa.',
            inputSchema: {
                busca: z.string().min(2).describe('Código ou palavras do nome, ex.: "ETA Moinhos", "EBAB 12"'),
                limite: limitArg,
            },
        },
        safe(async ({ busca, limite = 10 }) => {
            const { db } = await getSiges();
            // Código exato primeiro: "unidade 301" deve achar o código 301, não tudo que contém "301".
            const exact = await findByExactCode(db, busca);
            if (exact) return { busca, encontradas: 1, correspondencia: 'código exato', unidades: [unitSummary(exact)] };
            const { data, error } = await searchUnits(db, busca, limite);
            if (error) throw error;
            return { busca, encontradas: data?.length ?? 0, unidades: (data ?? []).map(unitSummary) };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_unidade',
        {
            title: 'Situação de uma unidade',
            description: 'Visão completa de UMA unidade: dados cadastrais, ordens de serviço abertas, visitas recentes e situação dos ativos (disponíveis/indisponíveis, último registro). Se a busca bater em várias unidades, devolve a lista para o usuário escolher.',
            inputSchema: {
                busca: z.string().min(2).describe('Código da unidade (preferível) ou nome'),
                dias_visitas: z.number().int().min(1).max(365).optional().describe('Janela de visitas recentes em dias (padrão 30)'),
            },
        },
        safe(async ({ busca, dias_visitas = 30 }) => {
            const { db } = await getSiges();
            // Código exato tem prioridade; senão, só segue se a busca achar uma única unidade.
            let unit: any = await findByExactCode(db, busca);
            let units: any[] = [];
            if (!unit) {
                const res = await searchUnits(db, busca, 6);
                if (res.error) throw res.error;
                units = res.data ?? [];
                if (!units.length) return { encontrada: false, busca };
                if (units.length === 1) unit = units[0];
            }
            if (!unit) {
                return {
                    encontrada: false,
                    ambigua: true,
                    mensagem: 'Mais de uma unidade corresponde à busca. Pergunte ao usuário qual delas (pelo código).',
                    opcoes: units.map(unitSummary),
                };
            }

            const since = dayStart(todayInBrazil(-dias_visitas));
            const [orders, visits, assets] = await Promise.all([
                db.from('v_orders')
                    .select('order_mask, status_description, status_at, requested_at, requested_services, type_description, priority_description, asset_tag_description, team_code, team_leader_name_short')
                    .eq('unit_id', unit.id)
                    .in('status_id', OPEN_ORDER_STATUSES)
                    .not('parent_id', 'is', null)
                    .order('requested_at', { ascending: false })
                    .limit(MAX_ROWS),
                db.from('v_orders_visits')
                    .select('ov_mask, o_mask, ov_status_description, ov_processing_description, ov_started_at, ov_ended_at, ov_team_leader_name_short, o_requested_services, ov_comments')
                    .eq('o_unit_id', unit.id)
                    .eq('is_canceled', false)
                    .gte('ov_started_at', since)
                    .order('ov_started_at', { ascending: false })
                    .limit(15),
                db.from('v_units_assets_tags')
                    .select('tag_description, tag_sub_description, asset_tag_tag_sub_description, last_is_available, last_status_description, last_asset_unavailable_reason_description, last_comments, last_created_at, last_reported_user_name_short, last_created_user_name_short')
                    .eq('unit_id', unit.id)
                    .eq('is_deleted', false)
                    .order('tag_description')
                    .limit(MAX_ROWS * 2),
            ]);
            for (const r of [orders, visits, assets]) if (r.error) throw r.error;

            const assetRows = (assets.data ?? []).map((a: any) => ({
                ativo: a.asset_tag_tag_sub_description || [a.tag_description, a.tag_sub_description].filter(Boolean).join(' '),
                disponivel: a.last_is_available,
                status: a.last_status_description,
                motivo_indisponibilidade: a.last_asset_unavailable_reason_description,
                observacao: a.last_comments,
                ultimo_registro: formatBr(a.last_created_at),
                registrado_por: a.last_reported_user_name_short || a.last_created_user_name_short,
            }));
            const unavailable = assetRows.filter(a => a.disponivel === false);

            return {
                encontrada: true,
                ...unitSummary(unit),
                ordens_abertas: {
                    total: orders.data?.length ?? 0,
                    itens: (orders.data ?? []).map((o: any) => ({
                        ordem: o.order_mask,
                        status: o.status_description,
                        data_status: formatBr(o.status_at),
                        solicitada_em: formatBr(o.requested_at),
                        servico_solicitado: o.requested_services,
                        tipo: o.type_description,
                        prioridade: o.priority_description,
                        ativo: o.asset_tag_description,
                        equipe: o.team_code,
                        lider: o.team_leader_name_short,
                    })),
                },
                visitas_recentes: {
                    janela_dias: dias_visitas,
                    total: visits.data?.length ?? 0,
                    itens: (visits.data ?? []).map((v: any) => ({
                        visita: v.ov_mask,
                        ordem: v.o_mask,
                        status: v.ov_status_description,
                        etapa: v.ov_processing_description,
                        inicio: formatBr(v.ov_started_at),
                        fim: formatBr(v.ov_ended_at),
                        lider: v.ov_team_leader_name_short,
                        servico: v.o_requested_services,
                        observacoes: v.ov_comments,
                    })),
                },
                ativos: {
                    total: assetRows.length,
                    indisponiveis: unavailable.length,
                    lista_indisponiveis: unavailable,
                    // Lista completa só quando é curta, para não poluir a conversa.
                    lista_completa: assetRows.length <= 20 ? assetRows : undefined,
                },
            };
        }),
    );

    // -----------------------------------------------------------------------
    server.registerTool(
        'siges_unidades_proximas',
        {
            title: 'Unidades próximas',
            description: 'Lista as unidades ativas mais próximas de uma coordenada (ex.: localização enviada pelo WhatsApp), com distância em km e link do mapa.',
            inputSchema: {
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180),
                raio_km: z.number().min(0.1).max(100).optional().describe('padrão 5 km'),
                limite: limitArg,
            },
        },
        safe(async ({ latitude, longitude, raio_km = 5, limite = 10 }) => {
            const { db } = await getSiges();
            // Mesmo cálculo de unitsService.getNearbyUnits: caixa delimitadora + haversine.
            const R = 6371;
            const dLatDeg = (raio_km / R) * (180 / Math.PI);
            const dLngDeg = dLatDeg / Math.cos((latitude * Math.PI) / 180);
            const { data, error } = await db
                .from('v_units')
                .select(UNIT_COLUMNS)
                .eq('is_deleted', false)
                .eq('status_id', 1)
                .gte('latitude', latitude - dLatDeg).lte('latitude', latitude + dLatDeg)
                .gte('longitude', longitude - dLngDeg).lte('longitude', longitude + dLngDeg)
                .limit(500);
            if (error) throw error;

            const toRad = (d: number) => (d * Math.PI) / 180;
            const rows = (data ?? [])
                .map((u: any) => {
                    const a = Math.sin(toRad(u.latitude - latitude) / 2) ** 2
                        + Math.cos(toRad(latitude)) * Math.cos(toRad(u.latitude)) * Math.sin(toRad(u.longitude - longitude) / 2) ** 2;
                    return { u, km: 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
                })
                .filter(r => r.km <= raio_km)
                .sort((a, b) => a.km - b.km)
                .slice(0, limite);

            return {
                raio_km,
                encontradas: rows.length,
                unidades: rows.map(r => ({ distancia_km: Math.round(r.km * 100) / 100, ...unitSummary(r.u) })),
            };
        }),
    );
}
