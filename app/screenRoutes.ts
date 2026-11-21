import { generatePath, matchPath } from 'react-router';
import { Capacitor } from '@capacitor/core';

/**
 * Rotas com parâmetros (etapa 1b do PLANO_MELHORIAS_FRONTEND.md), em inglês.
 *
 * Cada tela migrada tem um padrão de caminho com os ids que ela precisa. A
 * seleção (visita, ativo, tipo de OS) vem da entrada do histórico ao
 * voltar/avançar ou recarregar — não só da memória do App.
 * Tela fora desta lista continua em `/<nome-da-tela>` (ponte da etapa 1a).
 *
 * Dois modos (`showIdsInUrl`):
 *   - localhost no navegador: ids na URL (`#/visit-asset/4363`), para conferência;
 *   - demais (produção, app nativo, Electron empacotado): a URL leva só o
 *     caminho oculto (`#/visit-asset`) e os ids vão no `history.state`, para o
 *     usuário não trocar o número na barra. Caminho com id digitado não abre nada.
 * `toPath` (sempre com ids) é a CHAVE da entrada; `toUrl` é o que aparece na barra.
 *
 * Para migrar outra tela: incluir aqui (mais específicas primeiro), incluir os
 * ids novos em `Selection` e ligá-los em `routeSelection`/`applyRouteSelection`
 * no App.tsx. Ids podem ter ":" (ex.: "tmp:abc", ativo criado offline): o
 * generatePath/matchPath codificam e decodificam.
 */
// `type` (e não interface): só assim é atribuível a Record<string, ...> no hook.
export type Selection = {
    visitId?: string | null;
    ovaId?: string | null;
    orderTypeId?: string | null;
    /** OS ou SS aberta (order-detail / service-request-detail). */
    orderId?: string | null;
    /** Visita na aprovação/avaliação (order-visit-approve / order-visit-evaluation). */
    approvalVisitId?: string | null;
    /** Ativo aberto (asset-details). */
    assetId?: string | null;
    /** Cadastros (telas de detalhe). */
    companyId?: string | null;
    contractId?: string | null;
    unitId?: string | null;
    materialId?: string | null;
    manualId?: string | null;
    clientId?: string | null;
    departmentId?: string | null;
    teamId?: string | null;
};

type SelectionKey = keyof Selection;

interface RouteDef {
    screen: string;
    pattern: string;
    /** Caminho sem ids (modo oculto). Único por tela. */
    hidden: string;
    params: SelectionKey[];
}

// Ordem importa: padrões mais longos antes dos que são prefixo deles.
const ROUTES: RouteDef[] = [
    { screen: 'order-visit-asset-activities', pattern: '/visit-asset/:ovaId/activities/:orderTypeId', hidden: '/visit-asset/activities', params: ['ovaId', 'orderTypeId'] },
    { screen: 'order-visit-asset-materials', pattern: '/visit-asset/:ovaId/materials', hidden: '/visit-asset/materials', params: ['ovaId'] },
    { screen: 'order-visit-asset-report', pattern: '/visit-asset/:ovaId', hidden: '/visit-asset', params: ['ovaId'] },
    { screen: 'order-visit-approve', pattern: '/visit/:approvalVisitId/approve', hidden: '/visit/approve', params: ['approvalVisitId'] },
    { screen: 'order-visit-evaluation', pattern: '/visit/:approvalVisitId/evaluate', hidden: '/visit/evaluate', params: ['approvalVisitId'] },
    { screen: 'order-visit-execute', pattern: '/visit/:visitId', hidden: '/visit', params: ['visitId'] },
    { screen: 'order-detail', pattern: '/order/:orderId', hidden: '/order', params: ['orderId'] },
    { screen: 'service-request-detail', pattern: '/service-request/:orderId', hidden: '/service-request', params: ['orderId'] },
    { screen: 'asset-details', pattern: '/asset/:assetId', hidden: '/asset', params: ['assetId'] },
    { screen: 'company-details', pattern: '/company/:companyId', hidden: '/company', params: ['companyId'] },
    { screen: 'contract-details', pattern: '/contract/:contractId', hidden: '/contract', params: ['contractId'] },
    { screen: 'unit-details', pattern: '/unit/:unitId', hidden: '/unit', params: ['unitId'] },
    { screen: 'material-details', pattern: '/material/:materialId', hidden: '/material', params: ['materialId'] },
    { screen: 'technical-manual-details', pattern: '/manual/:manualId', hidden: '/manual', params: ['manualId'] },
    { screen: 'client-details', pattern: '/client/:clientId', hidden: '/client', params: ['clientId'] },
    { screen: 'department-details', pattern: '/department/:departmentId', hidden: '/department', params: ['departmentId'] },
    { screen: 'team-details', pattern: '/team/:teamId', hidden: '/team', params: ['teamId'] },
];

/** Rota da tela, se ela tem uma e a seleção traz todos os ids dela. */
const routeWithIds = (screen: string, selection: Selection): RouteDef | null => {
    const def = ROUTES.find(r => r.screen === screen);
    return def && def.params.every(k => !!selection[k]) ? def : null;
};

/** Caminho da tela (com ids; é a chave da entrada). Sem rota própria (ou sem os ids dela) cai em `/<tela>`. */
export const toPath = (screen: string, selection: Selection = {}): string => {
    const def = routeWithIds(screen, selection);
    if (def) {
        const params = Object.fromEntries(def.params.map(k => [k, String(selection[k])]));
        return generatePath(def.pattern, params);
    }
    return `/${screen}`;
};

/** matchPath (v8) devolve os parâmetros como estão na URL; decodifica sem quebrar com "%" solto. */
const safeDecode = (value: string): string => {
    try { return decodeURIComponent(value); } catch { return value; }
};

/** Tela e seleção de um caminho com parâmetros; null se não for rota migrada. */
export const fromPath = (pathname: string): { screen: string; selection: Selection } | null => {
    for (const def of ROUTES) {
        const match = matchPath({ path: def.pattern, end: true }, pathname);
        if (match) {
            const selection: Selection = {};
            for (const k of def.params) selection[k] = match.params[k] != null ? safeDecode(match.params[k] as string) : null;
            return { screen: def.screen, selection };
        }
    }
    return null;
};

/** Estado gravado em cada entrada do histórico (`history.state`). */
export type EntryState = { screen?: string; selection?: Selection };

/** O que aparece na barra: com ids (localhost) ou só o caminho oculto. */
export const toUrl = (screen: string, selection: Selection | undefined, showIds: boolean): string => {
    if (showIds) return toPath(screen, selection);
    const def = routeWithIds(screen, selection ?? {});
    return def ? def.hidden : `/${screen}`;
};

/**
 * Tela e ids da entrada atual. Com ids visíveis, lê do caminho. No modo oculto,
 * lê do estado da entrada, e só se ele corresponder ao caminho: caminho com id
 * (digitado) ou sem estado (link colado) não abre nada.
 */
export const fromLocation = (
    pathname: string, state: unknown, showIds: boolean,
): { screen: string; selection: Selection } | null => {
    if (showIds) return fromPath(pathname);
    const entry = (state ?? null) as EntryState | null;
    if (!entry?.screen || !entry.selection) return null;
    const def = routeWithIds(entry.screen, entry.selection);
    if (!def || def.hidden !== pathname) return null;
    const selection: Selection = {};
    for (const k of def.params) selection[k] = String(entry.selection[k]);
    return { screen: def.screen, selection };
};

/** Ids na URL só no localhost do navegador (o app Android também roda em https://localhost). */
export const showIdsInUrl = (
    hostname: string = window.location.hostname,
    isNative: boolean = Capacitor.isNativePlatform(),
): boolean => !isNative && (hostname === 'localhost' || hostname === '127.0.0.1');
