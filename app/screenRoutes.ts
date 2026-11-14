import { generatePath, matchPath } from 'react-router';

/**
 * Rotas com parâmetros (etapa 1b do PLANO_MELHORIAS_FRONTEND.md).
 *
 * Cada tela migrada tem um padrão de caminho com os ids que ela precisa. A
 * seleção (visita, ativo, tipo de OS) passa a vir da URL ao voltar/avançar,
 * recarregar a página ou abrir um link — não mais só da memória do App.
 * Tela fora desta lista continua em `/<nome-da-tela>` (ponte da etapa 1a).
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
    /** Ativo aberto (asset-details). */
    assetId?: string | null;
};

type SelectionKey = keyof Selection;

interface RouteDef {
    screen: string;
    pattern: string;
    params: SelectionKey[];
}

// Ordem importa: padrões mais longos antes dos que são prefixo deles.
const ROUTES: RouteDef[] = [
    { screen: 'order-visit-asset-activities', pattern: '/visita-ativo/:ovaId/atividades/:orderTypeId', params: ['ovaId', 'orderTypeId'] },
    { screen: 'order-visit-asset-materials', pattern: '/visita-ativo/:ovaId/materiais', params: ['ovaId'] },
    { screen: 'order-visit-asset-report', pattern: '/visita-ativo/:ovaId', params: ['ovaId'] },
    { screen: 'order-visit-execute', pattern: '/visita/:visitId', params: ['visitId'] },
    { screen: 'order-detail', pattern: '/os/:orderId', params: ['orderId'] },
    { screen: 'service-request-detail', pattern: '/ss/:orderId', params: ['orderId'] },
    { screen: 'asset-details', pattern: '/ativo/:assetId', params: ['assetId'] },
];

/** Caminho da tela. Sem rota própria (ou sem os ids dela) cai em `/<tela>`. */
export const toPath = (screen: string, selection: Selection = {}): string => {
    const def = ROUTES.find(r => r.screen === screen);
    if (def && def.params.every(k => !!selection[k])) {
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
