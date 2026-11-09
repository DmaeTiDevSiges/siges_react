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
