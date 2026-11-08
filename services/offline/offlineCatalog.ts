import { splitMaterialSearchTerms } from '../materials/materialSearchTerms';
import type { OfflineStore } from './store/offlineStore';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { materialsCatalogKey } from './offlineFlowOps';

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
