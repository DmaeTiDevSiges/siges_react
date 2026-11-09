import { dataService } from '../dataService';
import { getOfflineStore } from './offlineConfig';
import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { materialsCatalogKey, vehiclesCatalogKey } from './offlineFlowOps';
import { MATERIALS_CATALOG_LIMIT, VEHICLES_CATALOG_LIMIT } from './offlineCatalog';

/**
 * Download dos catálogos usados sem internet (busca local), com a data do
 * último download guardada à parte ("meta:<chave>"). maxAgeMs = 0 força baixar.
 *
 * Usado pelo "Preparar para campo" (força) e pelo download automático
 * (offlineAutoSync — respeita a idade, catálogo pesado no máximo 1x/dia).
 */

/** Ativos de uma unidade (getAssets('all', '', unitId)) — base para incluir ativo offline. */
export const unitAssetsCatalogKey = (unitId: unknown) => `assets:unit:${String(unitId ?? '')}`;

const metaKey = (key: string) => `meta:${key}`;

export const catalogSavedAt = async (key: string): Promise<number | null> => {
    try {
        const meta = await getOfflineStore().get<{ savedAt: number }>(OFFLINE_COLLECTIONS.catalog, metaKey(key));
        return typeof meta?.savedAt === 'number' ? meta.savedAt : null;
    } catch {
        return null;
    }
};

const isFresh = async (key: string, maxAgeMs: number) => {
    if (maxAgeMs <= 0) return false;
    const savedAt = await catalogSavedAt(key);
    return savedAt !== null && Date.now() - savedAt < maxAgeMs;
};

const saveCatalog = async (key: string, list: unknown[]) => {
    const store = getOfflineStore();
    await store.put(OFFLINE_COLLECTIONS.catalog, key, list);
    await store.put(OFFLINE_COLLECTIONS.catalog, metaKey(key), { savedAt: Date.now(), count: list.length });
};

export const removeCatalog = async (key: string) => {
    const store = getOfflineStore();
    await store.delete(OFFLINE_COLLECTIONS.catalog, key).catch(() => undefined);
    await store.delete(OFFLINE_COLLECTIONS.catalog, metaKey(key)).catch(() => undefined);
};

/** true = baixou; false = já estava em dia. */
export const downloadMaterialsCatalog = async (providerId: string, maxAgeMs = 0): Promise<boolean> => {
    const key = materialsCatalogKey(providerId);
    if (await isFresh(key, maxAgeMs)) return false;
    // Páginas de 1.000: o PostgREST corta respostas maiores (max_rows) sem avisar.
    const PAGE = 1000;
    const list: unknown[] = [];
    for (let page = 0; list.length < MATERIALS_CATALOG_LIMIT; page++) {
        const chunk = await dataService.getAvailableMaterials('', page, PAGE, providerId);
        list.push(...chunk);
        if (chunk.length < PAGE) break;
    }
    await saveCatalog(key, list);
    return true;
};

export const downloadVehiclesCatalog = async (companyId: string, maxAgeMs = 0): Promise<boolean> => {
    const key = vehiclesCatalogKey(companyId);
    if (await isFresh(key, maxAgeMs)) return false;
    const list = await dataService.searchVehicles('', companyId, VEHICLES_CATALOG_LIMIT);
    await saveCatalog(key, list || []);
    return true;
};

/** Devolve os ativos baixados (ou os já guardados, se ainda em dia). */
export const downloadUnitAssets = async (unitId: string, maxAgeMs = 0): Promise<any[]> => {
    const key = unitAssetsCatalogKey(unitId);
    if (await isFresh(key, maxAgeMs)) {
        return (await getOfflineStore().get<any[]>(OFFLINE_COLLECTIONS.catalog, key).catch(() => null)) || [];
    }
    const list = await dataService.getAssets('all', '', unitId);
    await saveCatalog(key, list || []);
    return list || [];
};
