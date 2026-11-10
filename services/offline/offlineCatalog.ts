import { splitMaterialSearchTerms } from '../materials/materialSearchTerms';
import type { OfflineStore } from './store/offlineStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { materialsCatalogKey, vehiclesCatalogKey } from './offlineFlowOps';

/**
 * Catálogo de materiais sem internet (F4).
 * O preparo baixa o catálogo do fornecedor da OS; offline, a busca filtra aqui
 * com as MESMAS regras da busca online (splitMaterialSearchTerms): cada termo
 * (ou uma das suas grafias) precisa aparecer no código + descrição.
 */
/** Teto do catálogo guardado por fornecedor (baixado em páginas de 1.000). */
export const MATERIALS_CATALOG_LIMIT = 10000;

const normalize = (v: unknown) => String(v ?? '').toLowerCase();

export const filterMaterials = <T extends { code?: string; description?: string }>(list: T[], search: string): T[] => {
    const terms = splitMaterialSearchTerms(search).map(variants => variants.map(normalize));
    if (!terms.length) return list;
    return list.filter(m => {
        const haystack = normalize(`${m.code ?? ''} ${m.description ?? ''}`);
        return terms.every(variants => variants.some(v => haystack.includes(v)));
    });
};

export const searchMaterialsOffline = async (
    store: OfflineStore,
    search: string = '',
    page: number = 0,
    pageSize: number = 20,
    providerCompanyId?: string,
): Promise<any[]> => {
    let catalog: any[] | null = null;
    try {
        if (providerCompanyId) {
            catalog = await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, materialsCatalogKey(providerCompanyId));
        } else {
            // Sem fornecedor informado: junta os catálogos baixados.
            const all: any[] = [];
            for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
                if (key.startsWith('materials:')) all.push(...((await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key)) || []));
            }
            catalog = all;
        }
    } catch {
        catalog = null;
    }
    if (!catalog) return [];
    const from = page * pageSize;
    return filterMaterials(catalog, search).slice(from, from + pageSize);
};

/** Teto do cadastro de veículos guardado por empresa (uma página do PostgREST). */
export const VEHICLES_CATALOG_LIMIT = 1000;

/** Mesmo filtro de usersService.searchVehicles: descrição ou placa contém o termo. */
export const filterVehicles = <T extends { description?: string; plates?: string }>(list: T[], search: string): T[] => {
    const term = normalize(search).trim();
    if (!term) return list;
    return list.filter(v => normalize(v.description).includes(term) || normalize(v.plates).includes(term));
};

/**
 * Busca de veículos sem internet: cadastro da empresa baixado no preparo
 * (searchVehicles(query, companyId, limit)). Sem empresa, junta os baixados.
 */
export const searchVehiclesOffline = async (
    store: OfflineStore,
    search: string = '',
    companyId?: string,
    limit: number = 50,
): Promise<any[]> => {
    let catalog: any[] = [];
    try {
        if (companyId) {
            catalog = (await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, vehiclesCatalogKey(companyId))) || [];
        } else {
            for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
                if (key.startsWith('vehicles:')) catalog.push(...((await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key)) || []));
            }
        }
    } catch {
        catalog = [];
    }
    return filterVehicles(catalog, search).slice(0, limit);
};

// ── Ativos e unidades (catálogo "assets:unit:<id>" do download automático) ──

const UNIT_ASSETS_PREFIX = 'assets:unit:';

/** Minúsculas e sem acento (a coluna searchable do banco compara sem caixa). */
const plain = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Mesmo filtro de assetsService.getAssets: cada termo aparece em código/descrição/unidade/setor. */
export const filterAssets = <T extends Record<string, any>>(list: T[], search: string): T[] => {
    const terms = plain(search).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return list;
    return list.filter(a => {
        const haystack = plain([a.code, a.description, a.unitDescriptionFull, a.tagName, a.tagSubName, a.brand, a.model, a.serial].join(' '));
        return terms.every(t => haystack.includes(t));
    });
};

const readUnitCatalogs = async (store: OfflineStore, unitId?: string): Promise<any[]> => {
    try {
        if (unitId) return (await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, `${UNIT_ASSETS_PREFIX}${unitId}`)) || [];
        const all: any[] = [];
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            if (key.startsWith(UNIT_ASSETS_PREFIX)) all.push(...((await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key)) || []));
        }
        return all;
    } catch {
        return [];
    }
};

/** getAssets(filter, search, unitId) sem internet: ativos das unidades baixadas. */
export const searchAssetsOffline = async (store: OfflineStore, search: string = '', unitId?: string): Promise<any[]> => {
    const list = await readUnitCatalogs(store, unitId);
    return filterAssets(list, search)
        .sort((a, b) => String(a.description || '').localeCompare(String(b.description || ''), 'pt-BR'))
        .slice(0, 5000);
};

/** Ativo do catálogo pelo id (para montar o ativo incluído offline). */
export const findCatalogAsset = async (store: OfflineStore, assetId: unknown): Promise<any | undefined> => {
    const id = String(assetId ?? '');
    if (!id) return undefined;
    const list = await readUnitCatalogs(store);
    return list.find(a => String(a?.id) === id);
};

/** searchUnits(search, limit) sem internet: unidades que têm catálogo baixado. */
export const searchUnitsOffline = async (store: OfflineStore, search: string = '', limit: number = 50): Promise<any[]> => {
    const units = new Map<string, any>();
    try {
        for (const key of await store.keys(OFFLINE_COLLECTIONS.catalog)) {
            if (!key.startsWith(UNIT_ASSETS_PREFIX)) continue;
            const unitId = key.slice(UNIT_ASSETS_PREFIX.length);
            const list = (await store.get<any[]>(OFFLINE_COLLECTIONS.catalog, key)) || [];
            const first = list[0];
            units.set(unitId, {
                id: unitId,
                description: first?.unitDescriptionFull || `Unidade ${unitId}`,
                descriptionFull: first?.unitDescriptionFull || `Unidade ${unitId}`,
                clientId: first?.clientId,
                clientsIds: first?.clientId ? [String(first.clientId)] : [],
            });
        }
    } catch {
        /* sem catálogo */
    }
    const terms = plain(search).trim().split(/\s+/).filter(Boolean);
    return Array.from(units.values())
        .filter(u => terms.every(t => plain(u.description).includes(t)))
        .sort((a, b) => String(a.description).localeCompare(String(b.description), 'pt-BR'))
        .slice(0, limit);
};
